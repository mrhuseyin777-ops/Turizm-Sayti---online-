// B2B müştəri bazası (mini-CRM): müştəri kartı, son axtarışlar, tarixçə (seçilmişlər, seçim linkləri, müraciətlər),
// "Unut" (kartı silmək + əlaqəli şəxsi məlumatı anonimləşdirmək).
//
// Təhlükəsizlik və məxfilik:
//  - Hər əməliyyat SESSİYADAKI agentliyin id-si ilə; başqa agentliyin müştərisi → null (route 404) — IDOR.
//  - Ağ siyahı sahələr, uzunluq/format limitləri, agentlik üzrə maks. müştəri sayı (LIMITS).
//  - Loglara yalnız id-lər yazılır (ad, telefon, e-poçt YOX).
//  - Saxlama müddəti: son fəaliyyətdən LIMITS.retentionDays gün sonra kart avtomatik silinir (src/storage/cleanup.js).
//    Əlaqəli məlumatların öz müddəti var: müraciətlər DATA_RETENTION_DAYS, seçim linkləri 30, seçilmişlər 90 gün.
//  - Köhnə qeydlər (client_id yox idi) ad və telefonla əlaqələndirilir. Ad yalnız agentlikdə həmin adda TƏK müştəri
//    olduqda istifadə olunur (eyni adlı iki müştərinin tarixçəsi qarışmasın və "Unut" başqasına toxunmasın).
const crypto = require('crypto');
const storage = require('./storage');
const { InputError, SEL_QUERY_KEYS } = require('./leads');
const { EMAIL_RE } = require('./notify/email');

const LIMITS = {
  perAgency: 2000, // agentlik üzrə maks. müştəri
  searches: 20, // kartda saxlanılan son axtarışlar
  destinations: 10,
  historyItems: 50,
  retentionDays: 365, // son fəaliyyətdən sonra avtomatik silinmə
  listMax: 500,
};
const BOARDS = ['', 'RO', 'BB', 'HB', 'FB', 'AI', 'UAI'];
const FIELDS = ['name', 'phone', 'email', 'adults', 'childAges', 'budget', 'destinations', 'board', 'note'];
const ID_RE = /^cl_[A-Za-z0-9_-]{12}$/;
const PHONE_RE = /^[+()\d\s-]{5,30}$/;
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
// eslint-disable-next-line no-control-regex -- tək sətirli sahələrdə sətir sonu da atılır
const CTRL_LINE_RE = /[\u0000-\u001F\u007F]/g;
const newId = () => `cl_${crypto.randomBytes(9).toString('base64url')}`;
const digits = (s) => String(s || '').replace(/\D/g, '');
const line = (v, max) => (typeof v === 'string' ? v.replace(CTRL_LINE_RE, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
const repo = (store) => store || storage.get().clients;
const checkId = (id) => typeof id === 'string' && ID_RE.test(id);
const okAgency = (a) => typeof a === 'string' && a.length > 0;

function validPhone(p) {
  if (!PHONE_RE.test(p)) return false;
  const d = digits(p).length;
  return d >= 7 && d <= 15;
}

// Ağ siyahı + format yoxlaması. partial=true → yalnız göndərilən sahələr (PATCH)
function validateClient(body, { partial = false } = {}) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new InputError('Sorğu formatı düzgün deyil');
  const extra = Object.keys(b).filter((k) => !FIELDS.includes(k));
  if (extra.length) throw new InputError('İcazə verilməyən sahə(lər)');
  const out = {};
  const has = (k) => !partial || k in b;
  if (has('name')) {
    if (typeof b.name !== 'string') throw new InputError('Müştəri adı tələb olunur');
    const name = line(b.name, 200);
    if (name.length < 2 || name.length > 80) throw new InputError('Müştəri adı 2–80 simvol olmalıdır');
    out.name = name;
  }
  if (has('phone')) {
    if (b.phone != null && typeof b.phone !== 'string') throw new InputError('Telefon nömrəsi düzgün deyil');
    const phone = line(b.phone || '', 40);
    if (phone && !validPhone(phone)) throw new InputError('Telefon nömrəsi düzgün deyil');
    out.phone = phone;
  }
  if (has('email')) {
    if (b.email != null && typeof b.email !== 'string') throw new InputError('E-poçt düzgün deyil');
    const email = line(b.email || '', 200);
    if (email && (email.length > 120 || !EMAIL_RE.test(email))) throw new InputError('E-poçt düzgün deyil');
    out.email = email;
  }
  if (has('adults')) {
    const a = b.adults == null || b.adults === '' ? 2 : Number(b.adults);
    if (!Number.isInteger(a) || a < 1 || a > 8) throw new InputError('Böyüklərin sayı 1–8 olmalıdır');
    out.adults = a;
  }
  if (has('childAges')) {
    const ages = b.childAges == null ? [] : b.childAges;
    if (!Array.isArray(ages) || ages.length > 6) throw new InputError('Uşaq yaşları: maks. 6 uşaq');
    if (!ages.every((x) => Number.isInteger(x) && x >= 0 && x <= 17)) throw new InputError('Uşaq yaşı 0–17 olmalıdır');
    out.childAges = ages;
  }
  if (has('budget')) {
    if (b.budget == null || b.budget === '') out.budget = null;
    else {
      const v = Number(b.budget);
      if (!Number.isInteger(v) || v < 0 || v > 10_000_000) throw new InputError('Büdcə 0–10 000 000 ₼ tam ədəd olmalıdır');
      out.budget = v;
    }
  }
  if (has('destinations')) {
    const d = b.destinations == null ? [] : b.destinations;
    if (!Array.isArray(d) || d.length > LIMITS.destinations) throw new InputError(`İstiqamətlər: maks. ${LIMITS.destinations}`);
    if (!d.every((x) => typeof x === 'string')) throw new InputError('İstiqamət mətn olmalıdır');
    out.destinations = [...new Set(d.map((x) => line(x, 40)).filter(Boolean))];
  }
  if (has('board')) {
    const v = b.board == null ? '' : b.board;
    if (!BOARDS.includes(v)) throw new InputError('Qida tərcihi yanlışdır');
    out.board = v;
  }
  if (has('note')) {
    if (b.note != null && typeof b.note !== 'string') throw new InputError('Qeyd mətn olmalıdır');
    const note = String(b.note || '').replace(CTRL_RE, '').trim();
    if (note.length > 1000) throw new InputError('Qeyd ən çox 1000 simvol ola bilər');
    out.note = note;
  }
  if (partial && !Object.keys(out).length) throw new InputError('Dəyişiklik yoxdur');
  return out;
}

// API cavabı: daxili sahələr (agencyId) çıxarılır
function publicClient(c) {
  if (!c) return null;
  const { agencyId, ...pub } = c;
  return pub;
}

async function listClients(agencyId, { q, store } = {}) {
  if (!okAgency(agencyId)) return [];
  const needle = typeof q === 'string' ? line(q, 80) : '';
  return (await repo(store).list(agencyId, { q: needle, limit: LIMITS.listMax })).map(publicClient);
}

async function createClient(agencyId, body, { by, store } = {}) {
  if (!okAgency(agencyId)) throw new InputError('Agentlik hesabı tələb olunur');
  const v = validateClient(body);
  const r = repo(store);
  if ((await r.count(agencyId)) >= LIMITS.perAgency) throw new InputError(`Müştəri bazası doludur (maks. ${LIMITS.perAgency})`);
  const now = new Date().toISOString();
  const rec = await r.insert({
    id: newId(), agencyId, ...v, searches: [], createdBy: line(by || '', 80) || null, createdAt: now, updatedAt: now, lastActivityAt: now,
  });
  console.info('[clients] yaradıldı', { agency: agencyId, client: rec.id });
  return publicClient(rec);
}

async function getClient(agencyId, id, { store } = {}) {
  if (!okAgency(agencyId) || !checkId(id)) return null;
  return repo(store).get(agencyId, id);
}

async function updateClient(agencyId, id, body, { store } = {}) {
  const c = await getClient(agencyId, id, { store });
  if (!c) return null;
  const v = validateClient(body, { partial: true });
  const now = new Date().toISOString();
  return publicClient(await repo(store).update(agencyId, id, { ...v, updatedAt: now, lastActivityAt: now }));
}

// Kartdakı "son axtarışlar": yalnız axtarışı təkrarlamaq üçün lazım olan parametrlər (ağ siyahı)
const SEARCH_KEYS = [...SEL_QUERY_KEYS, 'maxPrice', 'hotels'];
async function logSearch(agencyId, id, query, { store } = {}) {
  const c = await getClient(agencyId, id, { store });
  if (!c) return null;
  if (!query || typeof query !== 'object' || Array.isArray(query)) throw new InputError('Axtarış parametrləri tələb olunur');
  const q = {};
  for (const k of SEARCH_KEYS) {
    const v = query[k];
    if (typeof v === 'string' || typeof v === 'number') q[k] = line(String(v), k === 'hotels' ? 1200 : 100);
  }
  if (!q.q && !q.destinationId) throw new InputError('İstiqamət tələb olunur');
  const now = new Date().toISOString();
  const key = (x) => `${x.q}|${x.checkIn}|${x.nights}|${x.type}|${x.adults}|${x.childAges}`;
  const searches = [{ ...q, at: now }, ...(c.searches || []).filter((x) => key(x) !== key(q))].slice(0, LIMITS.searches);
  const saved = await repo(store).update(agencyId, id, { searches, lastActivityAt: now });
  return saved ? saved.searches : null;
}

// Köhnə qeydlərlə əlaqə: client_id + (agentlikdə tək olan) ad + telefon rəqəmləri
async function refOf(agencyId, c, store) {
  const unique = (await repo(store).sameNameCount(agencyId, c.name)) <= 1;
  const ph = digits(c.phone);
  return { clientId: c.id, name: unique ? c.name : null, phoneDigits: ph.length >= 7 ? ph : null };
}

const slView = (x) => ({
  id: x.id, client: x.client, name: x.snapshot && x.snapshot.name, destination: x.snapshot && x.snapshot.destination,
  checkIn: x.snapshot && x.snapshot.checkIn, nights: x.snapshot && x.snapshot.nights, netPrice: x.netPrice, available: x.available !== false,
  linked: x.clientId === undefined ? false : !!x.clientId, createdAt: x.createdAt,
});
const selView = (s) => ({
  id: s.id, url: `/s/${s.id}`, client: s.client, items: (s.items || []).length,
  hotels: (s.items || []).slice(0, 3).map((i) => i.name), createdAt: new Date(s.createdAt).toISOString(),
});
const leadView = (l) => ({
  id: l.id, name: l.name, status: l.status || 'new', selectionId: l.selectionId || null,
  item: l.item ? { name: l.item.name, checkIn: l.item.checkIn, clientPrice: l.item.clientPrice } : null, createdAt: l.createdAt,
});

async function clientHistory(agencyId, id, { store } = {}) {
  const c = await getClient(agencyId, id, { store });
  if (!c) return null;
  const h = await repo(store).history(agencyId, await refOf(agencyId, c, store), LIMITS.historyItems);
  // Seçilmişlər müştəri qrupu (client mətni) üzrə qruplaşdırılır
  const groups = new Map();
  for (const x of h.shortlist.map(slView)) {
    const g = groups.get(x.client) || { client: x.client, items: [] };
    g.items.push(x);
    groups.set(x.client, g);
  }
  return {
    client: publicClient(c),
    searches: c.searches || [],
    shortlist: [...groups.values()],
    selections: h.selections.map(selView),
    leads: h.leads.map(leadView),
  };
}

// "Unut": kart silinir, seçilmişlər anonim qrupa köçür, seçim linklərində müştəri adı/telefonu/mesajı,
// müraciətlərdə ad/telefon/qeyd silinir. Geri qaytarılmır.
async function forgetClient(agencyId, id, { store } = {}) {
  const c = await getClient(agencyId, id, { store });
  if (!c) return null;
  const anon = `Anonim-${crypto.randomBytes(3).toString('hex')}`;
  const res = await repo(store).forget(agencyId, await refOf(agencyId, c, store), anon);
  console.info('[clients] unudulub (anonimləşdirildi)', { agency: agencyId, client: id, shortlist: res.shortlist, selections: res.selections, leads: res.leads });
  return res;
}

// Başqa modullar üçün (shortlist, seçim linki): clientId bu agentliyə aiddirsə müştəri, yoxsa null.
// Səhv formatlı/başqa agentliyin id-si səssizcə nəzərə alınmır — yeni əlaqə sadəcə yaranmır.
async function resolveClientRef(agencyId, clientId, { store } = {}) {
  if (clientId == null || clientId === '') return null;
  if (!checkId(clientId)) throw new InputError('Müştəri id-si düzgün deyil');
  const c = await getClient(agencyId, clientId, { store });
  if (!c) throw new InputError('Müştəri tapılmadı');
  return c;
}

// Müştəri ilə iş (link, seçilmiş) → son fəaliyyət yenilənir (saxlama müddəti ondan hesablanır)
async function touchClient(agencyId, id, { store } = {}) {
  if (!okAgency(agencyId) || !checkId(id)) return;
  await repo(store).update(agencyId, id, { lastActivityAt: new Date().toISOString() });
}

module.exports = {
  LIMITS, BOARDS, validateClient, publicClient, listClients, createClient, getClient, updateClient, logSearch,
  clientHistory, forgetClient, resolveClientRef, touchClient,
};
