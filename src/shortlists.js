// B2B "Seçilmişlər" (shortlist): menecer müştəri sorğusu üzrə variantları yadda saxlayır (axtarışlar arasında),
// sonra bir kliklə təklif mətni, seçim linki və çap/PDF kommersiya təklifi hazırlayır.
//
// Təhlükəsizlik:
//  - Hər əməliyyat SESSİYADAKI agentliyin id-si ilə (agencyId sorğudan gəlmir) — başqa agentliyin qeydi 404 (IDOR).
//  - Qiymət, otel, operator və s. klientdən QƏBUL EDİLMİR: təklif serverin öz axtarışından (axtarış parametrləri +
//    təklif id-si) yenidən tapılır — mövcud seçim linki modeli kimi (src/leads.js). "Qiyməti yenilə" də eynidir.
//  - Kommersiya təklifində (quote) operator adı və net qiymət GİZLİDİR — yalnız müştəri qiyməti.
const crypto = require('crypto');
const storage = require('./storage');
const { search } = require('./search');
const { InputError, SEL_QUERY_KEYS, createSelection, LIMITS: SEL_LIMITS } = require('./leads');

const LIMITS = {
  perAgency: 300, // agentlik üzrə maks. seçilmiş variant
  perClient: 20, // bir müştəri / sorğu üzrə maks. variant
  quoteItems: 20, // kommersiya təklifində maks. variant
  ttlDays: 90, // 90 gündən köhnə qeydlər avtomatik silinir (src/storage/cleanup.js)
};

const ID_RE = /^sl_[A-Za-z0-9_-]{12}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const newId = () => `sl_${crypto.randomBytes(9).toString('base64url')}`;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u001F\u007F]/g;
// Müştəri adı / sorğu № — qruplaşdırma açarı: boşluqlar sıxılır, idarəetmə simvolları atılır
const cleanClient = (v) => str(typeof v === 'string' ? v.replace(CTRL_RE, ' ') : '', 160).replace(/\s+/g, ' ').slice(0, 80);
const repoOf = (store) => store || storage.get().shortlists;

function cleanQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new InputError('Axtarış parametrləri (query) tələb olunur');
  const out = {};
  for (const k of SEL_QUERY_KEYS) {
    const v = query[k];
    if (typeof v === 'string' || typeof v === 'number') out[k] = String(v).slice(0, 100);
  }
  return out;
}

// Serverin öz axtarışı: təklifləri id ilə tapır (limitsiz — seçilmiş təklif 1000-lik siyahıdan kənarda ola bilər)
async function resolveBySearch(query, offerIds) {
  const r = await search({ ...query, currency: 'AZN', flat: '1' }, { offerLimit: Infinity });
  const byId = new Map((r.offers || []).map((o) => [o.id, o]));
  const childAges = Array.isArray(r.query.childAges) ? r.query.childAges.map((a) => (a == null ? 'x' : a)).join(',') : '';
  return { pax: { adults: r.query.adults, children: r.query.children, childAges }, offers: offerIds.map((id) => byId.get(id) || null) };
}

async function resolveOne(query, offerId, resolveOffers) {
  let r;
  try {
    r = await resolveOffers(query, [offerId]);
  } catch (e) {
    throw new InputError(e instanceof InputError ? e.message : 'Axtarış parametrləri düzgün deyil');
  }
  return { pax: r.pax || {}, offer: r.offers[0] || null };
}

const netOf = (o) => {
  const net = Math.round(Number(o.price));
  if (!Number.isFinite(net) || net <= 0 || net > 10_000_000) throw new InputError('Qiymət düzgün deyil');
  return net;
};

// Təklifdən saxlanılan görünüş — yalnız ağ siyahı sahələri (daxili: operator; müştəriyə: qalanları)
function snapshotOf(o, pax) {
  const url = o.operatorLink && typeof o.url === 'string' && /^https:\/\//.test(o.url) ? o.url.slice(0, 1000) : null;
  return {
    name: str(o.name, 120) || '—',
    itemId: str(o.itemId, 80),
    stars: Math.min(5, Math.max(0, parseInt(o.stars, 10) || 0)),
    destination: str(o.destination && o.destination.name, 80),
    district: str(o.district, 80),
    checkIn: DATE_RE.test(o.checkIn || '') ? o.checkIn : '',
    nights: Math.min(28, Math.max(0, parseInt(o.nights, 10) || 0)),
    board: str(o.board, 4),
    boardLabel: str(o.boardLabel, 40),
    room: str(o.room, 80),
    accommodation: str(o.accommodation, 20),
    includesFlight: !!o.includesFlight,
    flightTime: o.flight && o.flight.out ? str(o.flight.out.time, 5) : '',
    earlyBooking: !!o.earlyBooking,
    prepayment: ['none', '50', 'full'].includes(o.prepayment) ? o.prepayment : null,
    freeCancelUntil: DATE_RE.test(o.freeCancelUntil || '') ? o.freeCancelUntil : null,
    stopSale: !!o.stopSale,
    adults: Math.min(8, Math.max(1, parseInt(pax.adults, 10) || 1)),
    children: Math.min(6, Math.max(0, parseInt(pax.children, 10) || 0)),
    // Daxili (yalnız agentlik görür)
    providerId: str(o.providerId, 40),
    providerName: str(o.providerName, 60),
    providerColor: /^#[0-9a-fA-F]{3,8}$/.test(o.providerColor || '') ? o.providerColor : '',
    url,
  };
}

// API cavabı (agentlik üçün): daxili sahələr (agencyId, userId, query-nin özü) çıxarılır
function publicItem(it) {
  return {
    id: it.id,
    client: it.client,
    offerId: it.offerId,
    query: it.query, // axtarışı təkrarlamaq üçün (öz agentliyinin məlumatı)
    ...it.snapshot,
    netPrice: it.netPrice,
    prevNetPrice: it.prevNetPrice ?? null,
    available: it.available !== false,
    checkedAt: it.checkedAt,
    createdAt: it.createdAt,
  };
}

async function listShortlist(agencyId, { store } = {}) {
  if (typeof agencyId !== 'string' || !agencyId) return [];
  return (await repoOf(store).listForAgency(agencyId, LIMITS.perAgency)).map(publicItem);
}

async function addToShortlist(body, { account, store, resolveOffers = resolveBySearch } = {}) {
  if (!account || !account.agencyId) throw new InputError('Agentlik hesabı tələb olunur');
  const repo = repoOf(store);
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const offerId = typeof b.offerId === 'string' ? b.offerId : '';
  if (!offerId || offerId.length > 200) throw new InputError('Təklif id-si düzgün deyil');
  const client = cleanClient(b.client);
  const query = cleanQuery(b.query);

  const all = await repo.listForAgency(account.agencyId, LIMITS.perAgency + 1);
  if (all.length >= LIMITS.perAgency) throw new InputError(`Seçilmişlər siyahısı doludur (maks. ${LIMITS.perAgency}) — köhnələri silin`);
  if (all.filter((x) => x.client === client).length >= LIMITS.perClient) throw new InputError(`Bir müştəri üçün maksimum ${LIMITS.perClient} variant`);

  const { pax, offer } = await resolveOne(query, offerId, resolveOffers);
  if (!offer) throw new InputError('Təklif artıq mövcud deyil — axtarışı yeniləyin');
  const now = new Date().toISOString();
  const saved = await repo.insert({
    id: newId(),
    agencyId: account.agencyId,
    userId: account.userId || null,
    client,
    offerId: offer.id,
    paxKey: `${parseInt(pax.adults, 10) || 0}|${String(pax.childAges ?? pax.children ?? '').slice(0, 30)}`,
    query,
    snapshot: snapshotOf(offer, pax),
    netPrice: netOf(offer),
    prevNetPrice: null,
    available: true,
    checkedAt: now,
    createdAt: now,
  });
  return { item: publicItem(saved), existed: !!saved.existed };
}

const checkId = (id) => typeof id === 'string' && ID_RE.test(id);

async function getOwn(agencyId, id, store) {
  if (!checkId(id) || typeof agencyId !== 'string' || !agencyId) return null;
  return repoOf(store).get(agencyId, id);
}

// Yalnız müştəri adı (qrup) dəyişdirilə bilər — qiymət/otel klientdən dəyişmir
async function updateShortlistItem(agencyId, id, body, { store } = {}) {
  const it = await getOwn(agencyId, id, store);
  if (!it) return null;
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (!('client' in b)) throw new InputError('Dəyişiklik yoxdur');
  try {
    return publicItem(await repoOf(store).update(agencyId, id, { client: cleanClient(b.client) }));
  } catch (e) {
    if (e.code === 'DUPLICATE') throw new InputError('Bu müştəridə həmin variant artıq var');
    throw e;
  }
}

async function removeShortlistItem(agencyId, id, { store } = {}) {
  if (!checkId(id) || typeof agencyId !== 'string' || !agencyId) return false;
  return repoOf(store).delete(agencyId, id);
}

// "Qiyməti yenilə": serverdə təkrar axtarış. Qiymət dəyişibsə prevNetPrice = köhnə qiymət (↑/↓).
// Təklif tapılmırsa available=false (qiymət köhnə qalır, menecer görür ki, variant artıq yoxdur).
async function refreshItem(it, { store, resolveOffers = resolveBySearch } = {}) {
  let res;
  try {
    res = await resolveOne(it.query, it.offerId, resolveOffers);
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
    res = { offer: null, pax: {} }; // məs. tarix keçib → artıq mövcud deyil
  }
  const now = new Date().toISOString();
  const patch = { checkedAt: now };
  if (!res.offer) patch.available = false;
  else {
    const net = netOf(res.offer);
    patch.available = true;
    if (net !== it.netPrice) { patch.prevNetPrice = it.netPrice; patch.netPrice = net; }
    patch.snapshot = snapshotOf(res.offer, { adults: it.snapshot.adults, children: it.snapshot.children, ...res.pax });
  }
  const saved = await repoOf(store).update(it.agencyId, it.id, patch);
  return { item: publicItem(saved), changed: 'netPrice' in patch, previous: it.netPrice };
}

async function refreshShortlistItem(agencyId, id, opts = {}) {
  const it = await getOwn(agencyId, id, opts.store);
  if (!it) return null;
  return refreshItem(it, opts);
}

// Qrup (müştəri) və ya id siyahısı üzrə öz qeydlərini seç
async function pickItems(agencyId, b, store) {
  const all = await repoOf(store).listForAgency(agencyId, LIMITS.perAgency);
  let items;
  if (Array.isArray(b.ids)) {
    if (!b.ids.length || b.ids.length > LIMITS.quoteItems || !b.ids.every(checkId)) throw new InputError('Variantlar düzgün deyil');
    const want = new Set(b.ids);
    items = all.filter((x) => want.has(x.id));
    if (items.length !== want.size) return null; // başqa agentliyin / mövcud olmayan id → 404
  } else {
    if (typeof b.client !== 'string') throw new InputError('Müştəri və ya variantlar göstərilməlidir');
    const client = cleanClient(b.client);
    items = all.filter((x) => x.client === client);
    if (!items.length) return null;
  }
  return items.sort((a, b2) => a.netPrice - b2.netPrice).slice(0, LIMITS.quoteItems);
}

const parseMarkup = (v) => {
  const m = Number(v ?? 0);
  if (!Number.isFinite(m) || m < 0 || m > 100) throw new InputError('Komissiya 0–100% olmalıdır');
  return m;
};

// Çap/PDF kommersiya təklifi. Qiymətlər serverdə yenidən yoxlanılır (refresh), operator adı və net GİZLİ.
async function buildQuote(body, { account, store, resolveOffers = resolveBySearch } = {}) {
  if (!account || !account.agencyId) throw new InputError('Agentlik hesabı tələb olunur');
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const markup = parseMarkup(b.markup);
  const picked = await pickItems(account.agencyId, b, store);
  if (!picked) return null;
  const fresh = [];
  for (const it of picked) fresh.push(await refreshItem(it, { store, resolveOffers }));
  const items = fresh.map(({ item, changed, previous }) => ({
    name: item.name, stars: item.stars, destination: item.destination, district: item.district,
    checkIn: item.checkIn, nights: item.nights, board: item.board, boardLabel: item.boardLabel,
    room: item.room, accommodation: item.accommodation, includesFlight: item.includesFlight, flightTime: item.flightTime,
    prepayment: item.prepayment, freeCancelUntil: item.freeCancelUntil, adults: item.adults, children: item.children,
    available: item.available,
    clientPrice: Math.round(item.netPrice * (1 + markup / 100)),
    priceChange: changed ? Math.round(item.netPrice * (1 + markup / 100)) - Math.round(previous * (1 + markup / 100)) : 0,
  })).sort((a, c) => Number(c.available) - Number(a.available) || a.clientPrice - c.clientPrice);
  return {
    agency: str(account.agencyName, 80),
    manager: str(account.managerName, 80),
    client: picked[0].client,
    currency: 'AZN',
    createdAt: new Date().toISOString(),
    items,
    // operator adı, net qiymət, komissiya və agencyId müştəri sənədinə GÖNDƏRİLMİR
  };
}

// Seçilmişlərdən paylaşılan seçim linki (src/leads.js createSelection). Variantlar fərqli axtarışlardan ola
// bilər — hər biri öz axtarış parametrləri ilə serverdə yenidən tapılır. Sərnişin tərkibi eyni olmalıdır.
async function selectionFromShortlist(body, { account, store, selectionStore, resolveOffers = resolveBySearch } = {}) {
  if (!account || !account.agencyId) throw new InputError('Agentlik hesabı tələb olunur');
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const markup = parseMarkup(b.markup);
  const picked = await pickItems(account.agencyId, b, store);
  if (!picked) return null;
  const items = picked.slice(0, SEL_LIMITS.selectionItems);
  const paxKeys = new Set(items.map((x) => x.paxKey));
  if (paxKeys.size > 1) throw new InputError('Fərqli sərnişin tərkibli variantlar bir linkdə birləşdirilə bilməz');
  const byOffer = new Map(items.map((x) => [x.offerId, x]));
  const perItemResolver = async (_query, offerIds) => {
    let pax = null;
    const offers = [];
    for (const id of offerIds) {
      const it = byOffer.get(id);
      const r = await resolveOne(it.query, id, resolveOffers);
      pax = pax || r.pax;
      offers.push(r.offer);
    }
    return { pax: pax || {}, offers };
  };
  return createSelection({
    client: picked[0].client, message: b.message, markup, query: {}, offerIds: [...byOffer.keys()],
  }, { account, store: selectionStore, resolveOffers: perItemResolver });
}

module.exports = {
  LIMITS, cleanClient, cleanQuery, resolveBySearch, snapshotOf, publicItem,
  listShortlist, addToShortlist, updateShortlistItem, removeShortlistItem, refreshShortlistItem, buildQuote, selectionFromShortlist,
};
