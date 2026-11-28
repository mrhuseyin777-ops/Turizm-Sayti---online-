// Müraciətlər (leads) və B2B paylaşılan seçimlər.
// Saxlama: src/storage (DATABASE_URL varsa PostgreSQL, yoxdursa yaddaş). Leadlər DATA_RETENTION_DAYS,
// seçim linkləri 30 gün sonra avtomatik silinir (src/storage/cleanup.js). Yeni müraciət → Telegram/e-poçt
// bildirişi (src/notify, asinxron). B2B CRM: status, menecer qeydi (updateLeadForAgency).
// Status səhifəsi (/r/<token>): hər müraciətə təsadüfi token (24 bayt), DB-də YALNIZ SHA-256 hash.
// Marketplace (B2C "Agentlik vasitəsilə al"): body.partner = agentliyin ictimai marketplace id-si → müraciət
// həmin agentliyin "Müraciətlər" bölməsinə (type='selection', source='marketplace').
const crypto = require('crypto');
const { maskPhone, maskName } = require('./security/http');
const { search } = require('./search');
const storage = require('./storage');
const notify = require('./notify');
const { applyMarkup, pricingFor } = require('./markup');
const { explainItems, similarHotels } = require('./whyhotel');
const config = require('./config');
const { publicSupport, cleanPhone } = require('./support');
const { hotelById, tours, destinations, boardLabels } = require('./data/catalog');
const { providers } = require('./providers');

class InputError extends Error {}

const LIMITS = {
  maxLeads: 2000, // yalnız memory rejimi: yaddaşda saxlanan maks. müraciət (src/storage/memory.js)
  maxSelections: 20000, // yalnız memory rejimi: maks. paylaşılan seçim (hamısı)
  selectionsPerAgency: 500, // bir agentliyin maks. aktiv linki — bir hesab başqalarının linklərini sıxışdırıb silə bilməsin
  selectionItems: 10, // bir seçimdə maks. variant
  selectionTtlMs: 30 * 24 * 3600 * 1000, // seçim linki 30 gün yaşayır
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const PHONE_RE = /^[+()\d\s-]{5,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------- Leads ----------------
const NAME_RE = /^\p{L}[\p{L}\p{M} .'’-]{1,79}$/u;
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const text = (v, max) => str(v, max * 2).replace(CTRL_RE, '').slice(0, max);
const validPhone = (p) => PHONE_RE.test(p) && (() => { const d = p.replace(/\D/g, '').length; return d >= 7 && d <= 15; })();

// Ad + telefon + qeyd (bütün müraciət formaları üçün ortaq yoxlama)
function validateContact(b) {
  const name = str(b.name, 80).replace(/\s+/g, ' ');
  const phone = str(b.phone, 30);
  if (!name || !phone) throw new InputError('Ad və telefon tələb olunur');
  if (!NAME_RE.test(name)) throw new InputError('Ad 2–80 hərf olmalıdır');
  if (!validPhone(phone)) throw new InputError('Telefon nömrəsi düzgün deyil');
  return { name, phone, note: text(b.note, 500) };
}

// ---------------- Status linki (/r/<token>) ----------------
// 24 bayt (192 bit) kriptoqrafik təsadüf → 32 simvol base64url; saxlanılan yalnız SHA-256 (hex)
const STATUS_TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
function newStatusToken() {
  const token = crypto.randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

// Saxla + logla (maskalı) + bildiriş. Qaytarır: saxlanılmış qeyd + statusToken (yalnız cavab üçün, DB-də yoxdur)
async function saveLead(lead, leadStore) {
  const { token, hash } = newStatusToken();
  const saved = await (leadStore || storage.get().leads).insert({ ...lead, statusTokenHash: hash });
  // Loga yalnız maskalanmış məlumat yazılır
  console.info('[lead] yeni müraciət', { id: saved.id, type: lead.type, source: lead.source || null, name: maskName(lead.name), phone: maskPhone(lead.phone), agencyId: saved.agencyId || null });
  notify.leadCreated(lead.type, saved); // asinxron: cavabı gecikdirmir, uğursuzluq müraciətə təsir etmir
  return { ...saved, statusToken: token };
}

// Təklif id-sindən qısa məlumat: "funsun:antalya-h1|2026-12-17|7|BB|..." / "summer:t-georgia|2026-12-17"
const OFFER_ID_RE = /^([a-z0-9-]{1,30}):([a-z0-9-]{1,40})\|(\d{4}-\d{2}-\d{2})(?:\|(\d{1,2})\|([A-Z]{2,3})?)?/;
function offerSummary(offerId) {
  const m = OFFER_ID_RE.exec(String(offerId || ''));
  if (!m) return null;
  const h = hotelById.get(m[2]);
  const t = h ? null : tours.find((x) => x.id === m[2]);
  if (!h && !t) return null;
  const dest = destinations.find((d) => d.id === (h || t).destinationId);
  return {
    kind: h ? 'hotel' : 'tour', providerId: m[1], itemId: m[2], name: (h || t).name, destinationId: dest ? dest.id : null,
    destination: dest ? dest.name : '', checkIn: m[3], nights: h ? Number(m[4]) || null : t.nights, board: h ? m[5] || '' : '',
  };
}

// Marketplace müraciəti: təklif SERVERDƏ yenidən axtarılır (qiymət klientdən götürülmür).
// q: { type, adults, childAges } — klientin axtarış parametrləri (qalanı təklif id-sindən)
async function resolveOfferItem(offerId, q, resolveOffers = resolveOffersBySearch) {
  const sum = offerSummary(offerId);
  if (!sum) return null;
  const prov = providers.find((p) => p.id === sum.providerId);
  const item = {
    name: sum.name, destination: sum.destination, checkIn: sum.checkIn, nights: sum.nights, board: sum.board,
    clientPrice: null, currency: 'AZN', providerName: prov ? prov.name : '', offerId,
  };
  const src = q && typeof q === 'object' && !Array.isArray(q) ? q : {};
  const type = sum.kind === 'tour' ? 'tour' : (['package', 'hotel'].includes(src.type) ? src.type : 'package');
  const raw = { type, destinationId: sum.destinationId, checkIn: sum.checkIn, adults: /^[1-8]$/.test(String(src.adults)) ? String(src.adults) : '2' };
  if (sum.nights) raw.nights = String(sum.nights);
  if (typeof src.childAges === 'string' && /^[\d,]{0,20}$/.test(src.childAges)) raw.childAges = src.childAges;
  try {
    const r = await resolveOffers(raw, [offerId]);
    const o = r.offers[0];
    if (o && Number.isFinite(Number(o.price)) && Number(o.price) > 0) item.clientPrice = Math.round(Number(o.price));
  } catch { /* qiymət tapılmadı — müraciət qiymətsiz saxlanılır, menecer dəqiqləşdirir */ }
  return item;
}

// selections / leads — repository (default: src/storage); testlərdə ayrıca nüsxə ötürülə bilər
async function createLead(body, { selections: selStore, leads: leadStore, widgets: widgetStore, resolveOffers } = {}) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const { name, phone, note } = validateContact(b);
  const type = ['offer', 'callback', 'selection'].includes(b.type) ? b.type : 'offer';
  const lead = {
    type,
    name,
    phone,
    note,
    offerId: str(b.offerId, 200) || null,
    createdAt: new Date().toISOString(),
  };
  // "Agentlik vasitəsilə al": seçilmiş tərəfdaş agentlik (yalnız marketplace-də görünən). İctimai id → agentlik
  // serverdə tapılır; agentliyin daxili id-si klientə göstərilmir və klientdən qəbul edilmir.
  if (type === 'offer' && b.partner !== undefined && b.partner !== null && b.partner !== '') {
    const pid = typeof b.partner === 'string' && /^[A-Za-z0-9_-]{16}$/.test(b.partner) ? b.partner : null;
    const w = pid ? await (widgetStore || storage.get().widgets).getByMarketId(pid) : null;
    if (!w || !w.marketEnabled || !w.marketName) throw new InputError('Seçilmiş agentlik tapılmadı');
    lead.type = 'selection';
    lead.source = 'marketplace';
    lead.agencyId = w.agencyId;
    lead.agency = str(w.marketName, 80);
    lead.manager = '';
    lead.client = null;
    lead.item = lead.offerId ? await resolveOfferItem(lead.offerId, b.query, resolveOffers) : null;
  }
  if (type === 'callback') {
    lead.preferredTime = ['now', 'morning', 'afternoon', 'evening'].includes(b.preferredTime) ? b.preferredTime : 'now';
    lead.context = text(b.context, 300) || null; // məs. "Antalya · 16.12 · 2+1"
  }
  if (type === 'selection') {
    // Paylaşılan seçim linkindən gələn müraciət → agentliyə/menecerə bağlanır.
    // Agentlik və qiymət SERVERDƏ saxlanılan seçimdən götürülür (klientdən yox).
    const sel = await getSelectionRecord(str(b.selectionId, 40), selStore);
    if (!sel) throw new InputError('Seçim tapılmadı və ya müddəti bitib');
    const idx = Number.isInteger(b.itemIndex) ? b.itemIndex : parseInt(b.itemIndex, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= sel.items.length) throw new InputError('Variant düzgün deyil');
    const it = sel.items[idx];
    lead.selectionId = sel.id;
    lead.source = 'selection';
    lead.agencyId = sel.agencyId;
    lead.agency = sel.agency;
    lead.manager = sel.manager;
    lead.client = sel.client;
    lead.clientId = sel.clientId || null;
    lead.item = { name: it.name, destination: it.destination, checkIn: it.checkIn, nights: it.nights, board: it.board, clientPrice: it.clientPrice, currency: sel.currency, providerName: it.providerName, offerId: it.offerId };
  }
  return saveLead(lead, leadStore);
}

// ---------------- Müştərinin status səhifəsi ----------------
// Şəxsi məlumat maskalanır: ad — hər sözün ilk hərfi, telefon — yalnız son 2 rəqəm.
const maskPersonName = (n) => String(n || '').split(/\s+/).filter(Boolean).map((w) => `${[...w][0]}***`).join(' ');
const maskPersonPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length < 4 ? '***' : `${String(p).trim().startsWith('+') ? '+' : ''}${'•'.repeat(Math.max(3, d.length - 2))}${d.slice(-2)}`;
};
const contactOf = (phone) => {
  const c = cleanPhone(phone);
  return c ? { phone: c, whatsapp: c.slice(1) } : null;
};

// token → ictimai görünüş və ya null (tapılmadı / format yanlış — eyni nəticə, mövcudluq sızmır)
async function leadStatusByToken(token, { leads: leadStore, selections: selStore, widgets: widgetStore } = {}) {
  if (typeof token !== 'string' || !STATUS_TOKEN_RE.test(token)) return null;
  const repos = storage.get();
  const l = await (leadStore || repos.leads).getByStatusTokenHash(hashToken(token));
  if (!l) return null;
  // Əlaqə: seçim linkində menecerin telefonu, vidjet/marketplace-də agentliyin marketplace telefonu,
  // ümumi müraciətdə Odiola dəstəyi (config.support; yoxdursa düymə gizlənir)
  let contact = null;
  if (l.type === 'selection' && l.agencyId) {
    if (l.selectionId) {
      const sel = await (selStore || repos.selections).get(l.selectionId).catch(() => null);
      if (sel && sel.agencyId === l.agencyId) contact = contactOf(sel.phone);
    }
    if (!contact) {
      const w = await (widgetStore || repos.widgets).get(l.agencyId).catch(() => null);
      if (w) contact = contactOf(w.marketPhone);
    }
  } else {
    const s = publicSupport(config.support);
    if (s.phone || s.whatsapp) contact = { phone: s.phone, whatsapp: s.whatsapp };
  }
  let item = null;
  if (l.item && typeof l.item === 'object') {
    const it = l.item;
    const price = it.clientPrice == null ? null : Number(it.clientPrice);
    item = {
      name: str(it.name, 120), destination: str(it.destination, 80), checkIn: DATE_RE.test(it.checkIn || '') ? it.checkIn : null,
      nights: Number.isInteger(it.nights) ? it.nights : null, board: str(it.board, 4), price: Number.isFinite(price) ? Math.round(price) : null, currency: str(it.currency, 3) || 'AZN',
    };
  } else if (l.offerId) {
    const sum = offerSummary(l.offerId);
    if (sum) item = { name: sum.name, destination: sum.destination, checkIn: sum.checkIn, nights: sum.nights, board: sum.board, price: null, currency: 'AZN' };
  }
  if (item) item.boardLabel = item.board ? boardLabels[item.board] || '' : '';
  return {
    status: LEAD_STATUSES.includes(l.status) ? l.status : 'new',
    createdAt: l.createdAt,
    updatedAt: l.updatedAt || l.createdAt,
    statusChangedAt: l.statusChangedAt || null,
    agency: l.type === 'selection' && l.agency ? l.agency : null, // null → "Odiola"
    manager: l.type === 'selection' && l.manager ? l.manager : null,
    contact,
    customer: { name: maskPersonName(l.name), phone: maskPersonPhone(l.phone) },
    item,
    // agencyId, operator adı, offerId, qeydlər, menecer qeydi, tam ad/telefon QAYTARILMIR
  };
}

// ---------------- B2B CRM: status və menecer qeydi ----------------
const LEAD_STATUSES = ['new', 'in_progress', 'sold', 'cancelled'];
const MANAGER_NOTE_MAX = 1000;

// B2B "Müraciətlər": YALNIZ sessiyadakı agentliyin (agencyId) seçim linklərindən gələn leadlər.
// agencyId sorğudan yox, autentifikasiya olunmuş sessiyadan gəlir (IDOR qorunması).
async function leadsForAgency(agencyId, { leads: leadStore, status } = {}) {
  if (typeof agencyId !== 'string' || !agencyId) return [];
  return (leadStore || storage.get().leads).listForAgency(agencyId, 200, { status: LEAD_STATUSES.includes(status) ? status : undefined });
}

async function leadCountsForAgency(agencyId, { leads: leadStore } = {}) {
  if (typeof agencyId !== 'string' || !agencyId) return {};
  const raw = await (leadStore || storage.get().leads).statusCountsForAgency(agencyId);
  return Object.fromEntries(LEAD_STATUSES.map((st) => [st, raw[st] || 0]));
}

// PATCH /api/b2b/leads/:id — { status?, note? }. Yalnız ağ siyahıdakı sahələr; agentlik sessiyadan.
// Başqa agentliyin (və ya mövcud olmayan) müraciəti → null (route 404 qaytarır, mövcudluq sızmır).
async function updateLeadForAgency(agencyId, rawId, body, { by, leads: leadStore } = {}) {
  const id = typeof rawId === 'string' && /^\d{1,15}$/.test(rawId) ? Number(rawId) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw new InputError('Müraciət id-si düzgün deyil');
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const extra = Object.keys(b).filter((k) => k !== 'status' && k !== 'note');
  if (extra.length) throw new InputError('İcazə verilməyən sahə(lər)');
  const patch = {};
  if (b.status !== undefined) {
    if (!LEAD_STATUSES.includes(b.status)) throw new InputError('Status yanlışdır (new, in_progress, sold, cancelled)');
    patch.status = b.status;
  }
  if (b.note !== undefined) {
    if (typeof b.note !== 'string') throw new InputError('Qeyd mətn olmalıdır');
    const note = b.note.replace(CTRL_RE, '').trim();
    if (note.length > MANAGER_NOTE_MAX) throw new InputError(`Qeyd ən çox ${MANAGER_NOTE_MAX} simvol ola bilər`);
    patch.managerNote = note;
  }
  if (!Object.keys(patch).length) throw new InputError('Dəyişiklik yoxdur (status və ya note)');
  if (typeof agencyId !== 'string' || !agencyId) return null;
  return (leadStore || storage.get().leads).updateForAgency(agencyId, id, { ...patch, by: str(by, 80) || null, now: new Date() });
}

// ---------------- Paylaşılan seçimlər (B2B brendli link) ----------------

// 12 simvollu base64url id = 72 bit kriptoqrafik təsadüf → təxmin edilə bilməz
const newId = () => crypto.randomBytes(9).toString('base64url');
const ID_RE = /^[A-Za-z0-9_-]{12}$/;

// Seçim yaradılarkən təkliflər serverin öz axtarışından yenidən götürülür — klientin göndərdiyi
// qiymət, ad, operator və s. NƏZƏRƏ ALINMIR (qiymət manipulyasiyası qorunması).
// Yalnız təklif qiymətinə təsir edən axtarış parametrləri ötürülür (filtrlər qiyməti dəyişmir).
const SEL_QUERY_KEYS = ['type', 'q', 'destinationId', 'checkIn', 'checkInTo', 'flex', 'nights', 'nightsTo', 'adults', 'children', 'childAges', 'lastMinute'];
async function resolveOffersBySearch(query, offerIds) {
  const raw = {};
  for (const k of SEL_QUERY_KEYS) {
    const v = query[k];
    if (typeof v === 'string' || typeof v === 'number') raw[k] = String(v).slice(0, 100);
  }
  raw.currency = 'AZN';
  raw.flat = '1';
  const r = await search(raw, { offerLimit: Infinity }); // seçilmiş təklif 1000-lik limitdən kənarda qala bilər
  const byId = new Map((r.offers || []).map((o) => [o.id, o]));
  // all: "Oxşar otellər" üçün eyni axtarışın bütün təklifləri (yalnız serverdə istifadə olunur)
  return { pax: { adults: r.query.adults, children: r.query.children }, offers: offerIds.map((id) => byId.get(id) || null), all: r.offers || [] };
}

// Müştəri qiyməti: agentliyin aktiv komissiya qaydaları (src/markup.js) — yoxdursa klientin tək % sahəsi.
// pricing ötürülməyibsə serverdə agentlik üzrə oxunur (klientə etibar edilmir).
async function createSelection(body, { account, store, resolveOffers = resolveOffersBySearch, pricing } = {}) {
  const repo = store || storage.get().selections;
  if (!account || !account.agencyId || !account.agencyName) throw new InputError('Agentlik hesabı tələb olunur');
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const markup = Number(b.markup ?? 0);
  if (!Number.isFinite(markup) || markup < 0 || markup > 100) throw new InputError('Komissiya 0–100% olmalıdır');
  if (!Array.isArray(b.offerIds) || !b.offerIds.length) throw new InputError('Ən azı bir variant seçin');
  if (b.offerIds.length > LIMITS.selectionItems) throw new InputError(`Maksimum ${LIMITS.selectionItems} variant`);
  if (!b.offerIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 200)) throw new InputError('Təklif id-si düzgün deyil');
  const offerIds = [...new Set(b.offerIds)];
  if (!b.query || typeof b.query !== 'object' || Array.isArray(b.query)) throw new InputError('Axtarış parametrləri (query) tələb olunur');
  const phone = str(b.phone, 30);
  if (phone && !validPhone(phone)) throw new InputError('Telefon nömrəsi düzgün deyil');
  // Müştəri bazası ilə əlaqə (src/clients.js): yalnız öz agentliyinin müştərisi
  const cRec = await require('./clients').resolveClientRef(account.agencyId, b.clientId);

  let resolved;
  try {
    resolved = await resolveOffers(b.query, offerIds);
  } catch (e) {
    throw new InputError(e instanceof InputError ? e.message : 'Axtarış parametrləri düzgün deyil');
  }
  if (resolved.offers.some((o) => !o)) throw new InputError('Seçilmiş təklif(lər) artıq mövcud deyil — axtarışı yeniləyin');
  const pr = pricing || await pricingFor(account.agencyId, markup);

  const items = resolved.offers.map((o) => {
    const net = Number(o.price);
    if (!Number.isFinite(net) || net <= 0 || net > 10_000_000) throw new InputError('Qiymət düzgün deyil');
    return {
      offerId: o.id,
      name: str(o.name, 120) || '—',
      destination: str(o.destination && o.destination.name, 80),
      stars: Math.min(5, Math.max(0, parseInt(o.stars, 10) || 0)),
      checkIn: DATE_RE.test(o.checkIn || '') ? o.checkIn : '',
      nights: Math.min(28, Math.max(0, parseInt(o.nights, 10) || 0)),
      board: str(o.board, 4),
      boardLabel: str(o.boardLabel, 40),
      includesFlight: !!o.includesFlight,
      prepayment: ['none', '50', 'full'].includes(o.prepayment) ? o.prepayment : null,
      freeCancelUntil: DATE_RE.test(o.freeCancelUntil || '') ? o.freeCancelUntil : null,
      // Daxili (yalnız agentlik görür): operator və net qiymət
      providerName: str(o.providerName, 60),
      netPrice: Math.round(net),
      clientPrice: applyMarkup(o, pr.rules),
    };
  });
  const paxIn = resolved.pax || {};
  // "Niyə bu otel" (qayda əsaslı) və "Oxşar otellər" — yaradılarkən serverdə hesablanır
  const whys = explainItems(resolved.offers.map((o, i) => ({ offer: o, clientPrice: items[i].clientPrice })), paxIn);
  items.forEach((it, i) => { it.why = whys[i]; });
  const similar = similarHotels(resolved.all, resolved.offers, pr.rules, { pax: paxIn, limit: 3 });
  const sel = {
    id: newId(),
    agencyId: account.agencyId,
    agency: str(account.agencyName, 80),
    manager: str(account.managerName, 80),
    client: cRec ? text(cRec.name, 80) : text(b.client, 80),
    clientId: cRec ? cRec.id : null,
    phone,
    message: text(b.message, 400),
    currency: 'AZN',
    markup: pr.active ? Math.min(100, Math.max(0, Number(pr.rules.defaultPct) || 0)) : markup,
    pax: {
      adults: Math.min(8, Math.max(1, parseInt(resolved.pax && resolved.pax.adults, 10) || 1)),
      children: Math.min(6, Math.max(0, parseInt(resolved.pax && resolved.pax.children, 10) || 0)),
    },
    items,
    similar,
    createdAt: Date.now(),
  };
  // Agentlik limiti dolubsa YALNIZ həmin agentliyin ən köhnə linki silinir
  await repo.trimForAgency(sel.agencyId, LIMITS.selectionsPerAgency - 1);
  await repo.insert(sel);
  if (cRec) await require('./clients').touchClient(account.agencyId, cRec.id);
  return sel;
}

async function getSelectionRecord(id, store) {
  if (typeof id !== 'string' || !ID_RE.test(id)) return null;
  const repo = store || storage.get().selections;
  const sel = await repo.get(id);
  if (!sel) return null;
  if (Date.now() - sel.createdAt > LIMITS.selectionTtlMs) { await repo.delete(id); return null; }
  return sel;
}

// Müştəriyə göstərilən görünüş: operator adı, net qiymət və komissiya GİZLİ
function publicSelection(sel) {
  return {
    id: sel.id,
    agency: sel.agency,
    manager: sel.manager,
    client: sel.client,
    phone: sel.phone,
    message: sel.message,
    currency: sel.currency,
    pax: sel.pax,
    createdAt: new Date(sel.createdAt).toISOString(),
    items: sel.items.map(({ providerName, netPrice, offerId, ...pub }) => ({ ...pub, why: Array.isArray(pub.why) ? pub.why : [] })),
    similar: Array.isArray(sel.similar) ? sel.similar : [],
    // agencyId, markup və net qiymətlər müştəriyə GÖNDƏRİLMİR; brend route-da (src/routes/tours.js) əlavə olunur
  };
}

module.exports = {
  InputError, LIMITS, SEL_QUERY_KEYS, LEAD_STATUSES, MANAGER_NOTE_MAX, resolveOffersBySearch, createLead, leadsForAgency, leadCountsForAgency,
  updateLeadForAgency, createSelection, getSelectionRecord, publicSelection,
  validateContact, saveLead, newStatusToken, hashToken, STATUS_TOKEN_RE, leadStatusByToken, offerSummary, resolveOfferItem, maskPersonName, maskPersonPhone,
};
