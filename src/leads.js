// Müraciətlər (leads) və B2B paylaşılan seçimlər — yaddaşda (DEMO).
// Real versiyada: PostgreSQL + e-poçt/WhatsApp/Telegram bildirişi.
const crypto = require('crypto');

class InputError extends Error {}

const LIMITS = {
  maxLeads: 2000, // yaddaşda saxlanan maks. müraciət (köhnələr silinir)
  maxSelections: 1000, // yaddaşda saxlanan maks. paylaşılan seçim
  selectionItems: 10, // bir seçimdə maks. variant
  selectionTtlMs: 30 * 24 * 3600 * 1000, // seçim linki 30 gün yaşayır
};

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const PHONE_RE = /^[+()\d\s-]{5,30}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------- Leads ----------------
const leads = [];
let leadSeq = 0;

function createLead(body, { selections: selStore = selections } = {}) {
  const b = body && typeof body === 'object' ? body : {};
  const name = str(b.name, 80);
  const phone = str(b.phone, 30);
  if (!name || !phone) throw new InputError('Ad və telefon tələb olunur');
  if (!PHONE_RE.test(phone)) throw new InputError('Telefon nömrəsi düzgün deyil');
  const type = ['offer', 'callback', 'selection'].includes(b.type) ? b.type : 'offer';
  const lead = {
    id: ++leadSeq,
    type,
    name,
    phone,
    note: str(b.note, 500),
    offerId: str(b.offerId, 200) || null,
    createdAt: new Date().toISOString(),
  };
  if (type === 'callback') {
    lead.preferredTime = ['now', 'morning', 'afternoon', 'evening'].includes(b.preferredTime) ? b.preferredTime : 'now';
    lead.context = str(b.context, 300) || null; // məs. "Antalya · 16.12 · 2+1"
  }
  if (type === 'selection') {
    // Paylaşılan seçim linkindən gələn müraciət → agentliyə/menecerə bağlanır
    const sel = getSelectionRecord(str(b.selectionId, 40), selStore);
    if (!sel) throw new InputError('Seçim tapılmadı və ya müddəti bitib');
    const idx = Number.isInteger(b.itemIndex) ? b.itemIndex : parseInt(b.itemIndex, 10);
    if (!Number.isInteger(idx) || idx < 0 || idx >= sel.items.length) throw new InputError('Variant düzgün deyil');
    const it = sel.items[idx];
    Object.assign(lead, {
      selectionId: sel.id,
      agency: sel.agency,
      manager: sel.manager,
      client: sel.client,
      item: { name: it.name, destination: it.destination, checkIn: it.checkIn, nights: it.nights, board: it.board, clientPrice: it.clientPrice, currency: sel.currency, providerName: it.providerName, offerId: it.offerId },
    });
  }
  leads.push(lead);
  while (leads.length > LIMITS.maxLeads) leads.shift();
  return lead;
}

// B2B "Müraciətlər": agentliyin seçim linklərindən gələn leadlər.
// DEMO: agentlik adına görə filtr. Real versiyada agentlik hesabı ilə autentifikasiya
// (sessiya/JWT) və yalnız öz agentliyinin leadləri — indi adı bilən hər kəs görə bilər!
function leadsForAgency(agency) {
  const a = str(agency, 80).toLocaleLowerCase('az');
  if (!a) return [];
  return leads.filter((l) => l.type === 'selection' && l.agency.toLocaleLowerCase('az') === a).slice(-200).reverse();
}

// ---------------- Paylaşılan seçimlər (B2B brendli link) ----------------
const selections = new Map();

// 12 simvollu base64url id = 72 bit kriptoqrafik təsadüf → təxmin edilə bilməz
const newId = () => crypto.randomBytes(9).toString('base64url');
const ID_RE = /^[A-Za-z0-9_-]{12}$/;

function createSelection(body, store = selections) {
  const b = body && typeof body === 'object' ? body : {};
  const agency = str(b.agency, 80);
  if (!agency) throw new InputError('Agentlik adı tələb olunur');
  const markup = Number(b.markup ?? 0);
  if (!Number.isFinite(markup) || markup < 0 || markup > 100) throw new InputError('Komissiya 0–100% olmalıdır');
  if (!Array.isArray(b.items) || !b.items.length) throw new InputError('Ən azı bir variant seçin');
  if (b.items.length > LIMITS.selectionItems) throw new InputError(`Maksimum ${LIMITS.selectionItems} variant`);
  const currency = ['AZN', 'USD', 'EUR', 'TRY', 'RUB'].includes(b.currency) ? b.currency : 'AZN';
  const items = b.items.map((raw) => {
    const it = raw && typeof raw === 'object' ? raw : {};
    const net = Number(it.price);
    if (!Number.isFinite(net) || net <= 0 || net > 10_000_000) throw new InputError('Qiymət düzgün deyil');
    const checkIn = str(it.checkIn, 10);
    if (!DATE_RE.test(checkIn)) throw new InputError('Tarix düzgün deyil');
    const nights = parseInt(it.nights, 10);
    return {
      offerId: str(it.id, 200),
      name: str(it.name, 120) || '—',
      destination: str(it.destination, 80),
      stars: Math.min(5, Math.max(0, parseInt(it.stars, 10) || 0)),
      checkIn,
      nights: Number.isFinite(nights) ? Math.min(28, Math.max(0, nights)) : 0,
      board: str(it.board, 4),
      boardLabel: str(it.boardLabel, 40),
      includesFlight: !!it.includesFlight,
      prepayment: ['none', '50', 'full'].includes(it.prepayment) ? it.prepayment : null,
      freeCancelUntil: DATE_RE.test(str(it.freeCancelUntil, 10)) ? it.freeCancelUntil : null,
      // Daxili (yalnız agentlik görür): operator və net qiymət
      providerName: str(it.providerName, 60),
      netPrice: Math.round(net),
      clientPrice: Math.round(net * (1 + markup / 100)),
    };
  });
  // Qeyd: net qiymət menecerin brauzerindən gəlir (demo). Real versiyada offerId ilə
  // operatordan qiymət yenidən yoxlanmalıdır.
  const sel = {
    id: newId(),
    agency,
    manager: str(b.manager, 80),
    client: str(b.client, 80),
    phone: str(b.phone, 30),
    message: str(b.message, 400),
    currency,
    markup,
    pax: { adults: Math.min(8, Math.max(1, parseInt(b.adults, 10) || 1)), children: Math.min(6, Math.max(0, parseInt(b.children, 10) || 0)) },
    items,
    createdAt: Date.now(),
  };
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
  };
}

module.exports = { InputError, LIMITS, createLead, leadsForAgency, createSelection, getSelectionRecord, publicSelection, leads, selections };
