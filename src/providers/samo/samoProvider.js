// SAMO-tour Online operatorları üçün REAL adapter skeleti.
//
// ⚠️ VACİB: operatorların icazəsi və rəsmi API sənədi hələ YOXDUR.
//   - Default rejimdə (env ilə aktivləşdirilməyib) bu adapter HEÇ BİR şəbəkə sorğusu etmir və boş
//     massiv qaytarır; status() səbəbi bildirir.
//   - Operatorun ictimai saytı / gizli endpoint-ləri scrape edilmir. Aktiv rejim yalnız operatorun
//     verdiyi RƏSMİ API/XML-gateway ünvanı (env) + operators.js-də kod review ilə əlavə olunmuş
//     apiHosts whitelist-i ilə işləyir.
//   - Sorğunun qurulması (buildRequest) və cavabın oxunması (parseResponse) operatorun rəsmi
//     sənədindən sonra yazılacaq. Hazırda onlar default olaraq "not_implemented" verir — uydurma
//     endpoint və ya uydurma cavab formatı YOXDUR.
//
// Axın (aktiv rejimdə):
//   query ─buildRequest→ {url, method, headers, body} ─safeFetch (timeout, ölçü limiti, whitelist,
//   retry/backoff, redirect yoxdur)→ payload ─parseResponse→ SamoItem[] (aşağıdakı aralıq format)
//   ─normalizeSamoItem (sxem yoxlaması)→ Offer[] (mockProvider.js ilə eyni format)
//
// Env (bax .env.example), <OP> = SUMMER | KOMPAS | FUNSUN:
//   SAMO_<OP>_ENABLED=1         — aktivləşdirmə bayrağı (başqa dəyər = söndürülüb)
//   SAMO_<OP>_API_URL           — operatorun verdiyi rəsmi API ünvanı (https, host apiHosts-da olmalıdır)
//   SAMO_<OP>_API_TOKEN         — və ya SAMO_<OP>_API_LOGIN + SAMO_<OP>_API_PASSWORD
//   SAMO_<OP>_TIMEOUT_MS        — bir cəhd üçün timeout (default 5000, maks 7000; search.js 8000 ms gözləyir)

const config = require('../../config');
const { destinations } = require('../../data/catalog');
const { getOperator, currencyCodeById } = require('./operators');
const { buildOperatorSearchUrl } = require('./deeplink');

const DEST_IDS = new Set(destinations.map((d) => d.id));
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ITEMS = 2000;

class SamoError extends Error {
  constructor(code, message) { super(message || code); this.code = code; }
}

// ---------------------------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------------------------
function readSamoEnv(op, env = process.env) {
  const P = `SAMO_${op.id.toUpperCase()}_`;
  const get = (k) => (typeof env[P + k] === 'string' ? env[P + k].trim() : '');
  const out = {
    prefix: P,
    enabled: get('ENABLED') === '1',
    apiUrl: get('API_URL'),
    token: get('API_TOKEN'),
    login: get('API_LOGIN'),
    password: get('API_PASSWORD'),
    timeoutMs: Math.min(7000, Math.max(500, Number.parseInt(get('TIMEOUT_MS'), 10) || 5000)),
  };
  return out;
}

function hostAllowed(op, href) {
  let u;
  try { u = new URL(href); } catch { return false; }
  return u.protocol === 'https:' && !u.username && !u.password && op.apiHosts.includes(u.hostname);
}

// Aktiv rejim üçün bütün şərtlər yerinə yetirilibmi? Şəbəkəyə çıxmadan yoxlanılır.
function resolveStatus(op, cfg, hasImpl) {
  if (!cfg.enabled) return { enabled: false, reason: 'disabled' };
  if (!cfg.apiUrl || !(cfg.token || (cfg.login && cfg.password))) return { enabled: false, reason: 'missing_credentials' };
  if (!hostAllowed(op, cfg.apiUrl)) return { enabled: false, reason: 'host_not_allowed' };
  if (!hasImpl) return { enabled: false, reason: 'not_implemented' };
  return { enabled: true, reason: 'enabled' };
}

// ---------------------------------------------------------------------------------------------
// Təhlükəsiz HTTP
// ---------------------------------------------------------------------------------------------
const sleepDefault = (ms) => new Promise((r) => setTimeout(r, ms));

async function readLimited(res, maxBytes) {
  const len = Number(res.headers && res.headers.get && res.headers.get('content-length'));
  if (Number.isFinite(len) && len > maxBytes) throw new SamoError('response_too_large');
  if (!res.body || typeof res.body.getReader !== 'function') {
    const text = await res.text();
    if (Buffer.byteLength(text) > maxBytes) throw new SamoError('response_too_large');
    return text;
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) { try { await reader.cancel(); } catch { /* ignore */ } throw new SamoError('response_too_large'); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * @param {object} op       operator konfiqurasiyası (apiHosts whitelist)
 * @param {object} req      { url, method='GET', headers, body }
 * @param {object} o        { fetchImpl, timeoutMs, maxBytes, retries=2, backoffMs=250, deadlineMs=7000, sleep }
 * @returns {Promise<string>} cavab mətni
 */
async function safeFetch(op, req, o = {}) {
  const {
    fetchImpl = globalThis.fetch, timeoutMs = 5000, maxBytes = DEFAULT_MAX_BYTES,
    retries = 2, backoffMs = 250, deadlineMs = 7000, sleep = sleepDefault,
  } = o;
  if (!req || !hostAllowed(op, req.url)) throw new SamoError('host_not_allowed');
  const method = req.method === 'POST' ? 'POST' : 'GET';
  const started = Date.now();
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const left = deadlineMs - (Date.now() - started);
    if (left <= 0) break;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), Math.min(timeoutMs, left));
    try {
      const res = await fetchImpl(req.url, {
        method, headers: req.headers || {}, body: method === 'POST' ? req.body : undefined,
        signal: ac.signal, redirect: 'manual', // yönləndirmə whitelist-dən kənara apara bilər
      });
      if (res.status >= 300 && res.status < 400) throw new SamoError('redirect_refused');
      if (res.status === 429 || res.status >= 500) throw Object.assign(new SamoError('http_' + res.status), { retryable: true });
      if (!res.ok) throw new SamoError('http_' + res.status);
      return await readLimited(res, maxBytes);
    } catch (e) {
      lastErr = e;
      const retryable = e.retryable || e.name === 'TypeError' || e.name === 'AbortError';
      if (!retryable || attempt === retries) break;
      const wait = backoffMs * 2 ** attempt + Math.floor(Math.random() * backoffMs);
      if (Date.now() - started + wait >= deadlineMs) break;
      await sleep(wait);
    } finally {
      clearTimeout(timer);
    }
  }
  if (lastErr instanceof SamoError) throw lastErr;
  throw new SamoError(lastErr && lastErr.name === 'AbortError' ? 'timeout' : 'network_error');
}

// ---------------------------------------------------------------------------------------------
// Normalizasiya
// ---------------------------------------------------------------------------------------------
// SamoItem — TurTap-ın DAXİLİ aralıq formatı (operatorun real cavab formatı DEYİL!).
// SAMO-tour-un ümumi məlumat modelinə (tur, otel, rayon/şəhər, otaq tipi, yerləşmə, qida, qiymət,
// valyuta, otel yer statusu, stop-sale, uçuş) əsaslanır. Operatorun rəsmi sənədi alınanda
// parseResponse() real cavabı bu formata gətirəcək; sahə adları/kodlar o zaman dəqiqləşdiriləcək.
//
// {
//   tour:          { id, name }                       — tur (TOURINC)
//   hotel:         { id, name, stars }                — otel
//   town:          { id, name } | null                — kurort/şəhər (və ya rayon/district)
//   destinationId: 'antalya' | ...                    — (ixtiyari) TurTap istiqaməti, xəritə məlumdursa
//   room:          string                             — otaq tipi
//   accommodation: string                             — yerləşmə (məs. "DBL", "DBL+CHD")
//   meal:          string                             — qida kodu/adı (BB, HB, FB, AI, UAI, ...)
//   checkIn:       'YYYY-MM-DD'
//   nights:        integer
//   adults, children: integer
//   price:         { amount, currency, oldAmount? }   — currency: ISO kod və ya operatorun CURRENCY ID-si
//   hotelAvailability: 'available' | 'request' | 'none'
//   stopSale:      boolean
//   flight:        { included: boolean, availability: 'available' | 'request' | 'none' } | null
// }

const str = (v, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const posInt = (v, max) => (Number.isInteger(v) && v >= 0 && v <= max ? v : null);

function mapBoard(meal) {
  const m = String(meal || '').toUpperCase();
  if (/\bUAI\b|ULTRA/.test(m)) return 'UAI';
  if (/\bAI\b|ALL\s*INC/.test(m)) return 'AI';
  if (/\bFB\b|FULL\s*BOARD/.test(m)) return 'FB';
  if (/\bHB\b|HALF\s*BOARD/.test(m)) return 'HB';
  if (/\bBB\b|BED\s*(AND|&)\s*BREAKFAST/.test(m)) return 'BB';
  return null; // RO/OB və naməlum kodlar — board null (filtrdə "hamısı" ilə görünür)
}

/**
 * Bir SamoItem-i yoxlayıb Offer-ə çevirir. Səhv/natamam element → null (atılır).
 * @param {object} raw  SamoItem
 * @param {object} ctx  { op, query, rates = config.rates }
 */
function normalizeSamoItem(raw, ctx) {
  if (!raw || typeof raw !== 'object') return null;
  const { op, query = {} } = ctx;
  const rates = ctx.rates || config.rates;

  // Satışa bağlı / yer yoxdur → göstərmirik
  if (raw.stopSale === true) return null;
  const hotelAv = raw.hotelAvailability;
  if (!['available', 'request', 'none'].includes(hotelAv) || hotelAv === 'none') return null;
  const flight = raw.flight && typeof raw.flight === 'object' ? raw.flight : null;
  if (flight && flight.included && !['available', 'request'].includes(flight.availability)) return null;

  const hotel = raw.hotel && typeof raw.hotel === 'object' ? raw.hotel : null;
  const hotelId = hotel && (posInt(hotel.id, 1e12) ?? str(hotel.id, 40));
  const hotelName = hotel && str(hotel.name, 160);
  if (hotelId == null || !hotelName) return null;
  const stars = posInt(hotel.stars, 5) ?? 0;

  const checkIn = typeof raw.checkIn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.checkIn)
    && !Number.isNaN(Date.parse(raw.checkIn + 'T00:00:00Z')) ? raw.checkIn : null;
  const nights = posInt(raw.nights, 60);
  if (!checkIn || !nights) return null;

  const price = raw.price && typeof raw.price === 'object' ? raw.price : null;
  const amount = price && typeof price.amount === 'number' && Number.isFinite(price.amount) && price.amount > 0 && price.amount < 1e7 ? price.amount : null;
  if (amount == null) return null;
  let cur = typeof price.currency === 'string' && /^[A-Z]{3}$/.test(price.currency) ? price.currency : null;
  if (!cur && price.currency != null) cur = currencyCodeById(op, price.currency);
  if (!cur || !rates[cur]) return null; // valyuta məlum deyil → yanlış qiymət göstərməkdənsə atırıq
  const toAzn = (x) => Math.round(x / rates[cur]);
  const old = typeof price.oldAmount === 'number' && Number.isFinite(price.oldAmount) && price.oldAmount > amount ? toAzn(price.oldAmount) : null;

  // İstiqamət: element özü bildirirsə (və sorğudadırsa) o; sorğuda tək istiqamət varsa o.
  const qDest = Array.isArray(query.destinationIds) ? query.destinationIds.filter((d) => DEST_IDS.has(d)) : [];
  let destinationId = typeof raw.destinationId === 'string' && DEST_IDS.has(raw.destinationId)
    && (!qDest.length || qDest.includes(raw.destinationId)) ? raw.destinationId : null;
  if (!destinationId && qDest.length === 1) destinationId = qDest[0];
  if (!destinationId) return null; // TODO: SAMO town/district ID → TurTap istiqamət xəritəsi

  const board = mapBoard(raw.meal);
  const includesFlight = !!(flight && flight.included);
  const onRequest = hotelAv === 'request' || (includesFlight && flight.availability === 'request');
  const adults = posInt(raw.adults, 20) ?? query.adults ?? null;
  const children = posInt(raw.children, 20) ?? query.children ?? 0;
  const tourId = raw.tour && (posInt(raw.tour.id, 1e12) ?? str(raw.tour.id, 40));
  const key = [hotelId, checkIn, nights, str(raw.room, 80) || '', str(raw.accommodation, 40) || '', str(raw.meal, 40) || '', tourId ?? ''].join('|');

  return {
    id: `${op.id}:${key}`,
    providerId: op.id,
    itemType: 'hotel',
    // TODO: operatorlar arası eyni otelin qruplaşması üçün otel ID xəritəsi (giata və s.) lazımdır
    itemId: `${op.id}-hotel-${hotelId}`,
    name: hotelName,
    destinationId,
    stars,
    rating: null,
    tags: [],
    board,
    room: str(raw.room, 120),
    checkIn,
    nights,
    adults,
    children,
    includesFlight,
    price: toAzn(amount), // search.js qiyməti AZN bazasında gözləyir
    oldPrice: old,
    currency: 'AZN',
    originalPrice: { amount, currency: cur },
    earlyBooking: false, // TODO: rəsmi cavabda erkən rezervasiya əlaməti varsa
    availability: onRequest ? 'request' : 'instant',
    prepayment: null, // TODO: rəsmi sənəddən
    freeCancelUntil: null,
    url: buildOperatorSearchUrl(op.id, { ...query, checkIn: query.checkIn || checkIn, nights }) || null,
  };
}

function normalizeSamoItems(items, ctx) {
  if (!Array.isArray(items)) return { offers: [], dropped: 0 };
  const offers = [];
  let dropped = 0;
  for (const it of items.slice(0, MAX_ITEMS)) {
    const o = normalizeSamoItem(it, ctx);
    if (o) offers.push(o); else dropped++;
  }
  return { offers, dropped: dropped + Math.max(0, items.length - MAX_ITEMS) };
}

// ---------------------------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------------------------
// Log: şəxsi məlumat (sorğu parametrləri, ad, telefon, token) YAZILMIR — yalnız operator, status, say, kod.
function defaultLogger(entry) {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_TEST_CONTEXT) return;
  console.warn('[samo]', JSON.stringify(entry));
}

/**
 * @param {object|string} operatorConfig  operators.js obyekti və ya id
 * @param {object} [deps]
 *   env, fetchImpl, logger, sleep        — test/inyeksiya üçün
 *   buildRequest(query, {op, cfg})       — rəsmi sənəddən sonra yazılacaq → { url, method, headers, body }
 *   parseResponse(text, {op})            — rəsmi sənəddən sonra yazılacaq → SamoItem[]
 *   color, trust                         — UI metadata
 */
function createSamoProvider(operatorConfig, deps = {}) {
  const op = typeof operatorConfig === 'string' ? getOperator(operatorConfig) : operatorConfig;
  if (!op || !op.id || !op.baseUrl) throw new Error('createSamoProvider: naməlum operator');
  const {
    env = process.env, fetchImpl, logger = defaultLogger, sleep,
    buildRequest = null, parseResponse = null, color = '#64748b', trust = null,
  } = deps;
  const cfg = readSamoEnv(op, env);
  const st = resolveStatus(op, cfg, typeof buildRequest === 'function' && typeof parseResponse === 'function');

  async function search(query) {
    if (!st.enabled) return []; // şəbəkəyə çıxış YOXDUR
    const started = Date.now();
    try {
      const req = buildRequest(query, { op, cfg });
      const text = await safeFetch(op, req, { fetchImpl: fetchImpl || globalThis.fetch, timeoutMs: cfg.timeoutMs, sleep });
      const items = parseResponse(text, { op });
      const { offers, dropped } = normalizeSamoItems(items, { op, query });
      logger({ operator: op.id, status: 'ok', count: offers.length, dropped, ms: Date.now() - started });
      return offers;
    } catch (e) {
      logger({ operator: op.id, status: 'error', code: (e && e.code) || 'unexpected', ms: Date.now() - started });
      return [];
    }
  }

  return {
    id: op.id,
    name: op.name,
    color,
    kind: 'operator',
    demo: false,
    sells: ['package'],
    trust,
    system: op.system,
    status: () => ({ ...st }),
    deeplink: (query) => buildOperatorSearchUrl(op.id, query),
    search,
  };
}

module.exports = {
  createSamoProvider, normalizeSamoItem, normalizeSamoItems, safeFetch, readSamoEnv, resolveStatus, mapBoard, SamoError,
};
