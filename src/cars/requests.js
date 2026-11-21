// "Sifariş müraciəti" (real satış yoxdur). Server müştərinin göndərdiyi qiymətə etibar etmir:
// axtarışı eyni parametrlərlə yenidən icra edir və təklifi id ilə tapır.
// Şəxsiyyət sənədləri (sürücülük vəsiqəsi, pasport və s.) TOPLANMIR — icazəli sahələrdən
// kənar istənilən sahə rədd edilir.

// Saxlama: src/storage (carRequests — PostgreSQL və ya yaddaş), DATA_RETENTION_DAYS gündən sonra silinir.

const { searchRentals, searchTransfers, InputError } = require('./search');
const storage = require('../storage');

const ALLOWED_KEYS = new Set(['name', 'phone', 'note', 'kind', 'query', 'offerId']);
const QUERY_KEYS = {
  rental: ['pickup', 'dropoff', 'from', 'to', 'fromTime', 'toTime', 'age', 'currency', 'childSeats', 'gps', 'extraDriver'],
  transfer: ['mode', 'from', 'to', 'loc', 'date', 'time', 'pax', 'bags', 'days', 'currency'],
};
const NAME_RE = /^\p{L}[\p{L}\p{M} .'’-]{1,79}$/u;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,22}$/;
const OFFER_RE = /^[a-z0-9-]{1,40}\|[a-z0-9-]{1,40}$/;
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function validateRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: ['Sorğu formatı düzgün deyil'] };
  const extra = Object.keys(body).filter((k) => !ALLOWED_KEYS.has(k));
  if (extra.length) errors.push(`İcazə verilməyən sahə(lər): ${extra.slice(0, 5).join(', ')}. Sənəd məlumatı (vəsiqə, pasport) tələb olunmur.`);

  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  if (!NAME_RE.test(name)) errors.push('Ad 2–80 hərf olmalıdır');

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const digits = phone.replace(/\D/g, '');
  if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15) errors.push('Telefon nömrəsi düzgün deyil');

  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') errors.push('Qeyd mətn olmalıdır');
  const note = typeof body.note === 'string' ? body.note.replace(CTRL_RE, '').trim() : '';
  if (note.length > 500) errors.push('Qeyd 500 simvoldan uzun ola bilməz');

  const kind = body.kind;
  if (kind !== 'rental' && kind !== 'transfer') errors.push('Müraciət növü (kind) rental və ya transfer olmalıdır');

  if (typeof body.offerId !== 'string' || !OFFER_RE.test(body.offerId)) errors.push('Seçilmiş təklif (offerId) düzgün deyil');

  const query = {};
  if (!body.query || typeof body.query !== 'object' || Array.isArray(body.query)) {
    errors.push('Axtarış parametrləri (query) tələb olunur');
  } else if (QUERY_KEYS[kind]) {
    for (const [k, v] of Object.entries(body.query)) {
      if (!QUERY_KEYS[kind].includes(k)) { errors.push(`query.${k} icazəli deyil`); continue; }
      if (!['string', 'number', 'boolean'].includes(typeof v) || String(v).length > 40) { errors.push(`query.${k} düzgün deyil`); continue; }
      query[k] = String(v);
    }
  }
  return { errors, value: { name, phone, note, kind, offerId: body.offerId, query } };
}

async function createRequest(body) {
  const { errors, value } = validateRequest(body);
  if (errors.length) throw new InputError(errors.join('; '));

  let summary;
  if (value.kind === 'rental') {
    const r = await searchRentals(value.query);
    const offer = r.groups.flatMap((g) => g.offers).find((o) => o.id === value.offerId);
    if (!offer) throw new InputError('Seçilmiş təklif artıq mövcud deyil — axtarışı yeniləyin');
    summary = {
      company: offer.companyName, model: `${offer.modelName} və ya oxşar`, category: offer.categoryLabel,
      pickup: r.query.pickup.name, dropoff: r.query.dropoff.name,
      from: `${r.query.from} ${r.query.fromTime}`, to: `${r.query.to} ${r.query.toTime}`, days: r.query.days,
      age: r.query.age, extras: r.query.extras, insurance: offer.insurance, total: offer.price.total, currency: offer.currency,
    };
  } else {
    const r = await searchTransfers(value.query);
    const offer = r.groups.flatMap((g) => g.offers).find((o) => o.id === value.offerId);
    if (!offer) throw new InputError('Seçilmiş təklif artıq mövcud deyil — axtarışı yeniləyin');
    summary = {
      company: offer.companyName, vehicleClass: offer.classId, mode: r.query.mode,
      from: r.query.from.name, to: r.query.to ? r.query.to.name : null, date: `${r.query.date} ${r.query.time}`,
      days: r.query.days, pax: r.query.pax, bags: r.query.bags, total: offer.price, currency: offer.currency,
    };
  }

  return storage.get().carRequests.insert({
    kind: value.kind, name: value.name, phone: value.phone, note: value.note,
    offerId: value.offerId, summary, status: 'new', createdAt: new Date().toISOString(),
  });
}

module.exports = { validateRequest, createRequest };
