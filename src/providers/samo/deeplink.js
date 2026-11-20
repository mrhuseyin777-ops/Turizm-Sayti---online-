// "Operatorun saytında yoxla" linki: eTour axtarış parametrlərini SAMO-tour Online
// /search_tour səhifəsinin URL parametrlərinə çevirir. Bu sadəcə linkdir — eTour serveri
// operatorun saytına heç bir sorğu göndərmir (icazə tələb etmir).
//
// Parametr adları operatorların ictimai axtarış formasının sahə adlarıdır (TOWNFROMINC, STATEINC,
// CHECKIN_BEG, ...). Sahibin göndərdiyi nümunə URL formanın GET serializasiyasıdır — deməli
// səhifə bu adları URL-dən qəbul edir. Uşaq yaşları formada AGE1..AGE3 adlanır; URL-dən
// avtomatik doldurulub-doldurulmadığı YOXLANILMADI (səhifə default yaşı göstərə bilər).
//
// Təhlükəsizlik:
//   - yalnız operators.js-dəki baseUrl-lərə link qurulur (host whitelist, https məcburi);
//   - istifadəçi mətni URL-ə düşmür: bütün dəyərlər rəqəmə çevrilir və aralığa sıxılır;
//   - URL URLSearchParams ilə qurulur (kodlaşdırma avtomatik) → açıq yönləndirmə/inyeksiya yoxdur.

const { operators, destinationCountry, getOperator } = require('./operators');

const ALLOWED = new Set(Object.values(operators).map((op) => {
  const u = new URL(op.baseUrl);
  if (u.protocol !== 'https:') throw new Error(`SAMO operator baseUrl https olmalıdır: ${op.id}`);
  return u.origin + u.pathname;
}));

const DAY = 86400000;

function toUtcDate(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : new Date(Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate()));
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const d = new Date(v + 'T00:00:00Z');
    return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
  }
  return null;
}

// Date → "YYYYMMDD" (SAMO URL formatı; formada dd.mm.yyyy göstərilir)
function samoDate(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function intIn(v, min, max, def) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
}

// Bir neçə istiqamət eyni ölkədədirsə həmin ölkə; fərqli ölkələr və ya bilinməyən → null
function resolveState(op, q) {
  const ids = Array.isArray(q.destinationIds) ? q.destinationIds
    : typeof q.destinationId === 'string' ? [q.destinationId] : [];
  const countries = new Set(ids.map((id) => (Object.prototype.hasOwnProperty.call(destinationCountry, id) ? destinationCountry[id] : null)));
  if (countries.size !== 1) return null;
  const [country] = countries;
  if (!country) return null;
  const v = op.states[country];
  return Number.isInteger(v) ? v : null;
}

function resolveChildAges(op, q) {
  let ages = Array.isArray(q.childAges) ? q.childAges : null;
  if (!ages) ages = Array(intIn(q.children, 0, 20, 0)).fill(null);
  const max = op.limits.childAgeMax;
  return ages.slice(0, op.limits.childrenMax).map((a) => {
    const n = Number(a);
    // yaşı bilinməyən uşaq → 7 (eTour config.defaultChildAge ilə eyni), operator limitinə sıxılır
    return Math.min(max, Math.max(0, Number.isInteger(n) && a !== null && a !== '' ? n : 7));
  });
}

/**
 * @param {string} operatorId  'summer' | 'kompas' | 'funsun'
 * @param {object} query       search.js parseQuery() nəticəsi və ya oxşar obyekt:
 *   { destinationIds | destinationId, checkIn (Date | 'YYYY-MM-DD'), flex, nights, nightsFrom, nightsTill,
 *     adults, childAges | children, currency, townFrom ('baku' | 'ganja') }
 * @param {object} [opts]      { today: Date } — test üçün
 * @returns {string|null}      tam URL və ya null (operator bilinmir / tarix səhvdir)
 */
function buildOperatorSearchUrl(operatorId, query = {}, opts = {}) {
  const op = getOperator(operatorId);
  if (!op || !query || typeof query !== 'object') return null;
  const checkIn = toUtcDate(query.checkIn);
  if (!checkIn) return null;

  const lim = op.limits;
  const flex = intIn(query.flex, 0, 14, 0);
  const today = toUtcDate(opts.today || new Date());
  let beg = new Date(checkIn.getTime() - flex * DAY);
  const end = new Date(checkIn.getTime() + flex * DAY);
  if (beg < today && end >= today) beg = today; // keçmiş tarixi göndərmə

  const nights = intIn(query.nights, lim.nightsMin, lim.nightsMax, Math.min(lim.nightsMax, Math.max(lim.nightsMin, 7)));
  let nightsFrom = intIn(query.nightsFrom, lim.nightsMin, lim.nightsMax, nights);
  let nightsTill = intIn(query.nightsTill, lim.nightsMin, lim.nightsMax, nights);
  if (nightsFrom > nightsTill) [nightsFrom, nightsTill] = [nightsTill, nightsFrom];

  const adults = intIn(query.adults, 1, lim.adultsMax, Math.min(2, lim.adultsMax));
  const ages = resolveChildAges(op, query);
  const currencyCode = typeof query.currency === 'string' && Object.prototype.hasOwnProperty.call(op.currencies, query.currency)
    ? query.currency : op.defaultCurrency;
  const townFrom = typeof query.townFrom === 'string' && Object.prototype.hasOwnProperty.call(op.townFrom, query.townFrom)
    ? op.townFrom[query.townFrom] : op.defaultTownFrom;
  const state = resolveState(op, query);

  const p = new URLSearchParams();
  p.set('TOWNFROMINC', String(townFrom));
  if (op.stateFrom) p.set('STATEFROM', String(op.stateFrom));
  if (state != null) p.set('STATEINC', String(state)); // bilinməyən istiqamət → ölkə parametri buraxılır
  for (const [k, v] of Object.entries(op.extraParams)) p.set(k, String(v));
  p.set('CHECKIN_BEG', samoDate(beg));
  p.set('NIGHTS_FROM', String(nightsFrom));
  p.set('CHECKIN_END', samoDate(end));
  p.set('NIGHTS_TILL', String(nightsTill));
  p.set('ADULT', String(adults));
  p.set('CURRENCY', String(op.currencies[currencyCode]));
  p.set('CHILD', String(ages.length));
  ages.forEach((a, i) => p.set(`AGE${i + 1}`, String(a)));
  for (const k of ['TOWNS_ANY', 'STARS_ANY', 'HOTELS_ANY', 'MEALS_ANY', 'ROOMS_ANY']) p.set(k, '1');
  p.set('FILTER', '1');
  p.set('MOMENT_CONFIRM', '0');

  const url = new URL(op.baseUrl);
  url.search = p.toString();
  url.hash = '';
  // Son yoxlama: nəticə whitelist-dəki origin + path-dan kənara çıxa bilməz
  if (url.protocol !== 'https:' || !ALLOWED.has(url.origin + url.pathname) || url.username || url.password) return null;
  return url.toString();
}

function isAllowedOperatorUrl(href) {
  try {
    const u = new URL(href);
    return u.protocol === 'https:' && !u.username && !u.password && ALLOWED.has(u.origin + u.pathname);
  } catch { return false; }
}

module.exports = { buildOperatorSearchUrl, isAllowedOperatorUrl, samoDate };
