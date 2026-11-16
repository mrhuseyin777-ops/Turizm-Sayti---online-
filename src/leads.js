// Müraciətlər (leads) və B2B paylaşılan seçimlər — yaddaşda (DEMO).
// Real versiyada: PostgreSQL + e-poçt/WhatsApp/Telegram bildirişi.
const crypto = require('crypto');
const { maskPhone, maskName } = require('./security/http');
const { search } = require('./search');

class InputError extends Error {}

const LIMITS = {
  maxLeads: 2000, // yaddaşda saxlanan maks. müraciət (köhnələr silinir)
  maxSelections: 20000, // yaddaşda saxlanan maks. paylaşılan seçim (hamısı)
  selectionsPerAgency: 500, // bir agentliyin maks. aktiv linki — bir hesab başqalarının linklərini sıxışdırıb silə bilməsin
  selectionItems: 10, // bir seçimdə maks. variant
  selectionTtlMs: 30 * 24 * 3600 * 1000, // seçim linki 30 gün yaşayır
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const PHONE_RE = /^[+()\d\s-]{5,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------- Leads ----------------
const leads = [];
let leadSeq = 0;
const NAME_RE = /^\p{L}[\p{L}\p{M} .'’-]{1,79}$/u;
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const text = (v, max) => str(v, max * 2).replace(CTRL_RE, '').slice(0, max);
const validPhone = (p) => PHONE_RE.test(p) && (() => { const d = p.replace(/\D/g, '').length; return d >= 7 && d <= 15; })();

function createLead(body, { selections: selStore = selections } = {}) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const name = str(b.name, 80).replace(/\s+/g, ' ');
  const phone = str(b.phone, 30);
  if (!name || !phone) throw new InputError('Ad və telefon tələb olunur');
  if (!NAME_RE.test(name)) throw new InputError('Ad 2–80 hərf olmalıdır');
  if (!validPhone(phone)) throw new InputError('Telefon nömrəsi düzgün deyil');
  const type = ['offer', 'callback', 'selection'].includes(b.type) ? b.type : 'offer';
  const lead = {
    id: ++leadSeq,
    type,
    name,
    phone,
    note: text(b.note, 500),
    offerId: str(b.offerId, 200) || null,
    createdAt: new Date().toISOString(),
  };
  if (type === 'callback') {
    lead.preferredTime = ['now', 'morning', 'afternoon', 'evening'].includes(b.preferredTime) ? b.preferredTime : 'now';
    lead.context = text(b.context, 300) || null; // məs. "Antalya · 16.12 · 2+1"
  }
  if (type === 'selection') {
    // Paylaşılan seçim linkindən gələn müraciət → agentliyə/menecerə bağlanır.
    // Agentlik və qiymət SERVERDƏ saxlanılan seçimdən götürülür (klientdən yox).
    const sel = getSelectionRecord(str(b.selectionId, 40), selStore);
    if (!sel) throw new InputError('Seçim tapılmadı və ya müddəti bitib');
    const idx = Number.isInteger(b.itemIndex) ? b.itemIndex : parseInt(b.itemIndex, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= sel.items.length) throw new InputError('Variant düzgün deyil');
    const it = sel.items[idx];
    lead.selectionId = sel.id;
    lead.agencyId = sel.agencyId;
    lead.agency = sel.agency;
    lead.manager = sel.manager;
    lead.client = sel.client;
    lead.item = { name: it.name, destination: it.destination, checkIn: it.checkIn, nights: it.nights, board: it.board, clientPrice: it.clientPrice, currency: sel.currency, providerName: it.providerName, offerId: it.offerId };
  }
  leads.push(lead);
  while (leads.length > LIMITS.maxLeads) leads.shift();
  // Loga yalnız maskalanmış məlumat yazılır
  console.info('[lead] yeni müraciət', { id: lead.id, type, name: maskName(name), phone: maskPhone(phone), agencyId: lead.agencyId || null });
  return lead;
}

// B2B "Müraciətlər": YALNIZ sessiyadakı agentliyin (agencyId) seçim linklərindən gələn leadlər.
// agencyId sorğudan yox, autentifikasiya olunmuş sessiyadan gəlir (IDOR qorunması).
function leadsForAgency(agencyId) {
  if (typeof agencyId !== 'string' || !agencyId) return [];
  return leads.filter((l) => l.type === 'selection' && l.agencyId === agencyId).slice(-200).reverse();
}

// ---------------- Paylaşılan seçimlər (B2B brendli link) ----------------
const selections = new Map();

// 12 simvollu base64url id = 72 bit kriptoqrafik təsadüf → təxmin edilə bilməz
const newId = () => crypto.randomBytes(9).toString('base64url');
const ID_RE = /^[A-Za-z0-9_-]{12}$/;

// Seçim yaradılarkən təkliflər serverin öz axtarışından yenidən götürülür — klientin göndərdiyi
// qiymət, ad, operator və s. NƏZƏRƏ ALINMIR (qiymət manipulyasiyası qorunması).
// Yalnız təklif qiymətinə təsir edən axtarış parametrləri ötürülür (filtrlər qiyməti dəyişmir).
const SEL_QUERY_KEYS = ['type', 'q', 'destinationId', 'checkIn', 'flex', 'nights', 'adults', 'children', 'childAges', 'lastMinute'];
async function resolveOffersBySearch(query, offerIds) {
  const raw = {};
  for (const k of SEL_QUERY_KEYS) {
    const v = query[k];
    if (typeof v === 'string' || typeof v === 'number') raw[k] = String(v).slice(0, 100);
  }
  raw.currency = 'AZN';
  raw.flat = '1';
  const r = await search(raw);
  const byId = new Map((r.offers || []).map((o) => [o.id, o]));
  return { pax: { adults: r.query.adults, children: r.query.children }, offers: offerIds.map((id) => byId.get(id) || null) };
}

async function createSelection(body, { account, store = selections, resolveOffers = resolveOffersBySearch } = {}) {
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

  let resolved;
  try {
    resolved = await resolveOffers(b.query, offerIds);
  } catch (e) {
    throw new InputError(e instanceof InputError ? e.message : 'Axtarış parametrləri düzgün deyil');
  }
  if (resolved.offers.some((o) => !o)) throw new InputError('Seçilmiş təklif(lər) artıq mövcud deyil — axtarışı yeniləyin');

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
      clientPrice: Math.round(net * (1 + markup / 100)),
    };
  });
  const sel = {
    id: newId(),
    agencyId: account.agencyId,
    agency: str(account.agencyName, 80),
    manager: str(account.managerName, 80),
    client: text(b.client, 80),
    phone,
    message: text(b.message, 400),
    currency: 'AZN',
    markup,
    pax: {
      adults: Math.min(8, Math.max(1, parseInt(resolved.pax && resolved.pax.adults, 10) || 1)),
      children: Math.min(6, Math.max(0, parseInt(resolved.pax && resolved.pax.children, 10) || 0)),
    },
    items,
    createdAt: Date.now(),
  };
  // Agentlik limiti dolubsa YALNIZ həmin agentliyin ən köhnə linki silinir
  const own = [...store.values()].filter((x) => x.agencyId === sel.agencyId);
  for (let i = 0; i <= own.length - LIMITS.selectionsPerAgency; i++) store.delete(own[i].id);
  store.set(sel.id, sel);
  while (store.size > LIMITS.maxSelections) store.delete(store.keys().next().value);
  return sel;
}

function getSelectionRecord(id, store = selections) {
  if (!ID_RE.test(id || '')) return null;
  const sel = store.get(id);
  if (!sel) return null;
  if (Date.now() - sel.createdAt > LIMITS.selectionTtlMs) { store.delete(id); return null; }
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
    items: sel.items.map(({ providerName, netPrice, offerId, ...pub }) => pub),
    // agencyId, markup və net qiymətlər müştəriyə GÖNDƏRİLMİR
  };
}

module.exports = { InputError, LIMITS, SEL_QUERY_KEYS, resolveOffersBySearch, createLead, leadsForAgency, createSelection, getSelectionRecord, publicSelection, leads, selections };
