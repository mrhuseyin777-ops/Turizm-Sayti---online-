// "Bileti sifariş et" müraciətləri. Bilet hələ onlayn satılmır — müraciət menecerə gedir.
// Yalnız əlaqə məlumatı və seçilmiş uçuş saxlanılır. Pasport / sənəd məlumatı QƏBUL EDİLMİR:
// ağ siyahıda olmayan bütün sahələr atılır. Saxlama: src/storage (flightRequests — PostgreSQL və ya
// yaddaş), DATA_RETENTION_DAYS gündən sonra avtomatik silinir. Yeni müraciət → Telegram/e-poçt bildirişi (src/notify).

const { getAirport } = require('./airports');
const storage = require('../storage');
const notify = require('../notify');

class RequestValidationError extends Error {
  constructor(errors) { super(Object.values(errors)[0]); this.errors = errors; }
}

const NAME_RE = /^[\p{L}][\p{L}\p{M}\s'.-]{1,79}$/u;
const PHONE_RE = /^\+?[0-9\s\-()]{7,22}$/;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;
// Uçuş id: "J2123:GYDIST:202612200835_TK45:ISTBKK:202612201410~..." (en çox 2 aktarma × 2 istiqamət)
const LEG_RE = /^[A-Z0-9]{2}\d{1,4}:[A-Z]{3}[A-Z]{3}:\d{12}$/;
const OFFER_RE = /^[a-z0-9-]{2,32}\|[a-z]{2,16}\|/;

function validFlightId(id) {
  if (typeof id !== 'string' || id.length < 10 || id.length > 300) return false;
  const dirs = id.split('~');
  if (dirs.length > 2) return false;
  return dirs.every((d) => {
    const legs = d.split('_');
    return legs.length >= 1 && legs.length <= 3 && legs.every((l) => {
      if (!LEG_RE.test(l)) return false;
      const ap = l.split(':')[1];
      return getAirport(ap.slice(0, 3)) && getAirport(ap.slice(3));
    });
  });
}

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : null);

function validateRequest(body) {
  const b = body && typeof body === 'object' ? body : {};
  const errors = {};
  const name = str(b.name);
  const phone = str(b.phone);
  const email = str(b.email);
  const note = str(b.note);
  const flightId = str(b.flightId);
  const offerId = str(b.offerId);

  if (!name) errors.name = 'Ad tələb olunur';
  else if (name === null || !NAME_RE.test(name)) errors.name = 'Ad 2–80 hərf olmalıdır';

  const digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (!phone) errors.phone = 'Telefon tələb olunur';
  else if (!PHONE_RE.test(phone) || digits.length < 7 || digits.length > 15) errors.phone = 'Telefon nömrəsi düzgün deyil';

  if (email === null || (email && (email.length > 120 || !EMAIL_RE.test(email)))) errors.email = 'E-poçt ünvanı düzgün deyil';
  if (note === null || (note && note.length > 500)) errors.note = 'Qeyd ən çox 500 simvol ola bilər';
  if (!flightId || !validFlightId(flightId)) errors.flightId = 'Uçuş seçilməyib və ya id düzgün deyil';
  if (offerId === null || (offerId && (offerId.length > 340 || !OFFER_RE.test(offerId) || !offerId.endsWith('|' + flightId)))) errors.offerId = 'Təklif id düzgün deyil';

  if (Object.keys(errors).length) throw new RequestValidationError(errors);
  // Yalnız ağ siyahıdakı sahələr (pasport və s. heç vaxt saxlanılmır)
  return { name, phone, email: email || null, note: note || '', flightId, offerId: offerId || null };
}

async function createRequest(body, meta = {}) {
  const data = validateRequest(body);
  // ipHash: IP-nin yalnız hash-i (src/security/ipHash.js) — sui-istifadə araşdırması üçün, açıq IP saxlanılmır
  const saved = await storage.get().flightRequests.insert({ ...data, createdAt: new Date().toISOString(), ipHash: meta.ipHash || null });
  notify.leadCreated('flight', saved); // asinxron (admin chat-ına), cavabı gecikdirmir
  return saved;
}

module.exports = { validateRequest, createRequest, validFlightId, RequestValidationError, EMAIL_RE };
