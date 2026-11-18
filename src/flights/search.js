// Aviabilet axtarışı və aqreqasiya: bütün mənbələr paralel sorğulanır, eyni uçuş
// (eyni seqmentlər) qruplaşdırılır, filtr və sıralama tətbiq olunur, qiymət təqvimi qurulur.

const config = require('../config');
const env = require('../env');
const { airports, getAirport, publicAirport, resolveCodes } = require('./airports');
const { getCarrier } = require('./carriers');
const { flightProviders } = require('./providers');
const { dayIndex, isoFromDay } = require('./schedule');
const { bagPieceFee } = require('./pricing');
const { regulatedRoute } = require('./regulated');

const MAX_DAYS_AHEAD = 360;
const TIME_BUCKETS = { morning: [5, 12], day: [12, 17], evening: [17, 22], night: [22, 29] }; // 29 = 05:00 növbəti gün
const SORTS = ['price', 'fastest', 'best'];

class ValidationError extends Error {}

const todayIso = () => new Date().toISOString().slice(0, 10);
// `today` parametri yalnız dev/test üçündür (deterministik testlər); production-da server tarixi
const todayFor = (raw) => (!env.isProd && raw && raw.today && isDate(raw.today) ? raw.today : todayIso());
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const list = (v) => (v == null || v === '' ? [] : String(v).split(',').map((x) => x.trim()).filter(Boolean));
const bool = (v) => v === '1' || v === 'true' || v === true;
function int(v, min, max, def, label) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${label}: ${min}–${max} arası tam ədəd olmalıdır`);
  return n;
}

function parseQuery(raw = {}) {
  // from/to: IATA kodu və ya eyni şəhərin bir neçə kodu ("IST,SAW")
  const fromCodes = resolveCodes(raw.from);
  const toCodes = resolveCodes(raw.to);
  if (!fromCodes) throw new ValidationError('Uçuş yeri (from) tapılmadı — IATA kodu göndərin, məs. GYD');
  if (!toCodes) throw new ValidationError('İstiqamət (to) tapılmadı — IATA kodu göndərin, məs. IST');
  if (fromCodes.some((c) => toCodes.includes(c))) throw new ValidationError('Uçuş yeri və istiqamət eyni ola bilməz');

  // `today` parametri yalnız dev/test üçündür (deterministik testlər); production-da server tarixi
  const today = todayFor(raw);
  if (!isDate(raw.depart)) throw new ValidationError('Gediş tarixi (depart) düzgün deyil. Format: YYYY-MM-DD');
  const ahead = dayIndex(raw.depart) - dayIndex(today);
  if (ahead < 0) throw new ValidationError('Gediş tarixi keçmişdə ola bilməz');
  if (ahead > MAX_DAYS_AHEAD) throw new ValidationError(`Gediş tarixi ən çox ${MAX_DAYS_AHEAD} gün irəli ola bilər`);

  const trip = raw.trip === 'round' || (raw.trip !== 'oneway' && raw.return) ? 'round' : 'oneway';
  let ret = null;
  if (trip === 'round') {
    if (!isDate(raw.return)) throw new ValidationError('Dönüş tarixi (return) düzgün deyil. Format: YYYY-MM-DD');
    if (raw.return < raw.depart) throw new ValidationError('Dönüş tarixi gediş tarixindən əvvəl ola bilməz');
    if (dayIndex(raw.return) - dayIndex(today) > MAX_DAYS_AHEAD) throw new ValidationError('Dönüş tarixi çox uzaqdır');
    ret = raw.return;
  }

  const adults = int(raw.adults, 1, 9, 1, 'Böyük');
  const children = int(raw.children, 0, 8, 0, 'Uşaq (2–11)');
  const infants = int(raw.infants, 0, 4, 0, 'Körpə (0–2)');
  if (adults + children > 9) throw new ValidationError('Bir sifarişdə ən çox 9 yer (böyük + uşaq) ola bilər');
  if (infants > adults) throw new ValidationError('Körpələrin sayı böyüklərin sayından çox ola bilməz');

  const stops = list(raw.stops).map(Number).filter((n) => [0, 1, 2].includes(n));
  const maxPrice = raw.maxPrice === undefined || raw.maxPrice === '' ? null : Number(raw.maxPrice);
  if (maxPrice !== null && (!Number.isFinite(maxPrice) || maxPrice < 0)) throw new ValidationError('Maks. qiymət düzgün deyil');

  return {
    from: fromCodes.join(','),
    to: toCodes.join(','),
    fromCodes,
    toCodes,
    trip,
    depart: raw.depart,
    return: ret,
    adults, children, infants,
    cabin: raw.cabin === 'business' ? 'business' : 'economy',
    direct: bool(raw.direct),
    bags: bool(raw.bags),
    // Seçilmiş qeydiyyat baqajı sayı (hər sərnişinə, 0–2): tarifdə daxil deyilsə əlavə qiyməti ümumi qiymətə qatılır
    bagCount: int(raw.bagCount, 0, 2, 0, 'Baqaj sayı'),
    // Yalnız qorunan aktarmalar (ayrı biletlər / hava limanı dəyişməsi olmadan)
    protected: bool(raw.protected),
    stops,
    airlines: list(raw.airlines).map((s) => s.toUpperCase()).filter((c) => getCarrier(c)),
    times: list(raw.times).filter((x) => TIME_BUCKETS[x]),
    maxPrice,
    currency: config.rates[raw.currency] ? raw.currency : config.defaultCurrency,
    sort: SORTS.includes(raw.sort) ? raw.sort : 'price',
    lang: ['az', 'en', 'ru'].includes(raw.lang) ? raw.lang : 'az',
    today,
  };
}

async function withTimeout(promise, ms) {
  let timer;
  const t = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms); });
  try { return await Promise.race([promise, t]); } finally { clearTimeout(timer); }
}

const hourOf = (local) => Number(local.slice(11, 13));
function timeBucket(local) {
  const h = hourOf(local);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'day';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

function withAirportInfo(it, lang) {
  if (!it) return null;
  const ap = (code) => publicAirport(getAirport(code), lang);
  return {
    ...it,
    _depUtc: undefined,
    fromAirport: ap(it.from),
    toAirport: ap(it.to),
    layovers: it.layovers.map((l) => ({ ...l, city: ap(l.airport).city, ...(l.toAirport ? { toCity: ap(l.toAirport).city } : {}) })),
  };
}

// Mənbələri sorğula, valyutaya çevir, uçuşlara görə qruplaşdır (filtrsiz)
async function collect(q) {
  const results = await Promise.allSettled(flightProviders.map((p) => withTimeout(p.search(q), 8000)));
  const sources = flightProviders.map((p, i) => ({
    id: p.id, name: p.name, color: p.color, kind: p.kind, demo: p.demo,
    ok: results[i].status === 'fulfilled',
    count: results[i].status === 'fulfilled' ? results[i].value.length : 0,
  }));
  const rate = config.rates[q.currency];
  const groups = new Map();
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const p = flightProviders[i];
    for (const o of r.value) {
      const offer = {
        id: o.id, sourceId: p.id, sourceName: p.name, sourceColor: p.color,
        fare: o.fare, price: Math.round(o.price * rate), currency: q.currency,
      };
      if (!groups.has(o.flightId)) {
        groups.set(o.flightId, {
          id: o.flightId,
          outbound: o.outbound,
          inbound: o.inbound,
          offers: [],
        });
      }
      groups.get(o.flightId).offers.push(offer);
    }
  });
  return { sources, groups: [...groups.values()] };
}

const groupStops = (g) => Math.max(g.outbound.stops, g.inbound ? g.inbound.stops : 0);
const groupDuration = (g) => g.outbound.durationMin + (g.inbound ? g.inbound.durationMin : 0);

// DEMO qiymət bölgüsü: vergi/yığımlar biletin ~18%-i (real versiyada provayderin verdiyi taxes/fees)
const TAX_SHARE = 0.18;
const FAMILY_ORDER = ['light', 'standard', 'flex', 'business'];

// Seçilmiş baqaj sayı üçün əlavə qiymət (bütün sərnişinlər, hər iki istiqamət, sorğu valyutasında).
// Tarifdə daxil olan çantalar (fare.pieces) çıxılır; 2-ci çanta 1.5× qiymətləndirilir (DEMO).
function bagExtra(g, pieces, q, rate) {
  if (!q.bagCount || q.bagCount <= pieces) return 0;
  let units = 0;
  for (let k = pieces + 1; k <= q.bagCount; k++) units += k === 1 ? 1 : 1.5;
  const perPiece = bagPieceFee(g.outbound) + (g.inbound ? bagPieceFee(g.inbound) : 0);
  return Math.round(perPiece * units * (q.adults + q.children) * rate);
}

function withBags(o, g, q, rate) {
  const bagFee = bagExtra(g, o.fare.pieces || 0, q, rate);
  const tax = Math.round(o.price * TAX_SHARE);
  return { ...o, ticket: o.price, bagFee, price: o.price + bagFee, breakdown: { fare: o.price - tax, tax, bags: bagFee } };
}

// Filtr + sıralama (calendar üçün də istifadə olunur)
function refine(q, rawGroups) {
  const out = [];
  const rate = config.rates[q.currency] || 1;
  for (const g of rawGroups) {
    let offers = g.offers.map((o) => withBags(o, g, q, rate));
    if (q.bags) offers = offers.filter((o) => o.fare.checked > 0);
    if (!offers.length) continue;
    offers = [...offers].sort((a, b) => a.price - b.price || b.fare.checked - a.fare.checked);
    // hər mənbə üzrə ən ucuz təklif
    const bySource = new Map();
    for (const o of offers) if (!bySource.has(o.sourceId)) bySource.set(o.sourceId, o);
    const providers = [...bySource.values()];
    const best = providers[0];
    // Tarif ailələri cədvəli: hər ailənin ən ucuz təklifi (seçilmiş baqajla)
    const byFam = new Map();
    for (const o of offers) if (!byFam.has(o.fare.family)) byFam.set(o.fare.family, o);
    const families = FAMILY_ORDER.filter((f) => byFam.has(f)).map((f) => {
      const o = byFam.get(f);
      return { family: f, offerId: o.id, sourceId: o.sourceId, sourceName: o.sourceName, fare: o.fare, price: o.price, ticket: o.ticket, bagFee: o.bagFee };
    });
    const selfTransfer = !!(g.outbound.selfTransfer || (g.inbound && g.inbound.selfTransfer));
    out.push({
      ...g,
      offers,
      providers,
      best,
      families,
      selfTransfer,
      risks: [...new Set([...(g.outbound.risks || []), ...(g.inbound ? g.inbound.risks || [] : [])])],
      savings: providers[providers.length - 1].price - best.price,
      stops: groupStops(g),
      durationMin: groupDuration(g),
      validating: g.outbound.validating,
      carriers: [...new Set([...g.outbound.carriers, ...(g.inbound ? g.inbound.carriers : [])])],
      depBucket: timeBucket(g.outbound.dep),
    });
  }

  // Facet-lər: istifadəçi filtrlərindən əvvəl (seçimlər yox olmasın deyə)
  const facets = { airlines: {}, stops: {}, times: {} };
  const prot = { count: 0, selfTransfer: 0, minPrice: null };
  for (const g of out) {
    if (g.selfTransfer) prot.selfTransfer++;
    else { prot.count++; prot.minPrice = prot.minPrice == null ? g.best.price : Math.min(prot.minPrice, g.best.price); }
    const add = (obj, k, extra) => {
      if (!obj[k]) obj[k] = { ...extra, count: 0, minPrice: Infinity };
      obj[k].count++; obj[k].minPrice = Math.min(obj[k].minPrice, g.best.price);
    };
    add(facets.airlines, g.validating, { code: g.validating, name: getCarrier(g.validating).name, color: getCarrier(g.validating).color });
    add(facets.stops, Math.min(g.stops, 2), { stops: Math.min(g.stops, 2) });
    add(facets.times, g.depBucket, { id: g.depBucket });
  }

  const filtered = out.filter((g) =>
    (!q.direct || g.stops === 0) &&
    (!q.protected || !g.selfTransfer) &&
    (!q.stops.length || q.stops.includes(Math.min(g.stops, 2))) &&
    (!q.airlines.length || q.airlines.includes(g.validating)) &&
    (!q.times.length || q.times.includes(g.depBucket)) &&
    (q.maxPrice == null || g.best.price <= q.maxPrice));

  // "Ən yaxşı" balı: qiymət və müddətin normallaşdırılmış cəmi (+ aktarma cəriməsi)
  const minP = Math.min(...filtered.map((g) => g.best.price));
  const minD = Math.min(...filtered.map((g) => g.durationMin));
  for (const g of filtered) g.score = Math.round((g.best.price / minP + 0.7 * (g.durationMin / minD) + 0.1 * g.stops) * 1000) / 1000;

  const sorters = {
    price: (a, b) => a.best.price - b.best.price || a.durationMin - b.durationMin || a.id.localeCompare(b.id),
    fastest: (a, b) => a.durationMin - b.durationMin || a.best.price - b.best.price || a.id.localeCompare(b.id),
    best: (a, b) => a.score - b.score || a.best.price - b.best.price || a.id.localeCompare(b.id),
  };
  const pickTop = (k) => {
    const g = [...filtered].sort(sorters[k])[0];
    return g ? { id: g.id, price: g.best.price, durationMin: g.durationMin } : null;
  };
  const summary = { price: pickTop('price'), fastest: pickTop('fastest'), best: pickTop('best') };
  filtered.sort(sorters[q.sort]);

  const norm = (o) => Object.values(o).sort((a, b) => a.minPrice - b.minPrice);
  return {
    groups: filtered,
    summary,
    facets: {
      airlines: norm(facets.airlines),
      stops: Object.values(facets.stops).sort((a, b) => a.stops - b.stops),
      times: ['morning', 'day', 'evening', 'night'].map((k) => facets.times[k] || { id: k, count: 0, minPrice: null }),
      protected: prot,
    },
  };
}

function shift(iso, n) { return isoFromDay(dayIndex(iso) + n); }

async function calendar(q) {
  const days = [];
  for (let off = -3; off <= 3; off++) {
    const depart = shift(q.depart, off);
    const ret = q.return ? shift(q.return, off) : null;
    const ahead = dayIndex(depart) - dayIndex(q.today);
    if (ahead < 0 || ahead > MAX_DAYS_AHEAD) { days.push({ depart, return: ret, price: null, disabled: true }); continue; }
    const qq = { ...q, depart, return: ret };
    const { groups } = refine(qq, (await collect(qq)).groups);
    days.push({ depart, return: ret, price: groups.length ? Math.min(...groups.map((g) => g.best.price)) : null, selected: off === 0 });
  }
  return days;
}

function placeInfo(codes, lang) {
  const a = publicAirport(getAirport(codes[0]), lang);
  return codes.length > 1 ? { ...a, code: codes.join(','), name: null, isCity: true } : a;
}

// Tənzimlənən marşrut (Bakı/Gəncə ↔ Naxçıvan): cədvəl qalır (müraciət üçün uçuş id lazımdır),
// amma heç bir DEMO qiymət qaytarılmır.
function hidePrices(res, route) {
  const noPrice = (o) => (o ? { ...o, price: null } : o);
  res.regulated = { route, priceHidden: true };
  res.groups = res.groups.map((g) => ({
    ...g,
    offers: [],
    providers: [],
    best: { id: g.best.id, fare: g.best.fare, price: null },
    families: [],
    savings: 0,
    score: undefined,
  }));
  res.stats = res.stats ? { count: res.stats.count, offers: 0, min: null, max: null } : null;
  res.summary = { price: noPrice(res.summary.price), fastest: noPrice(res.summary.fastest), best: noPrice(res.summary.best) };
  const f = res.facets;
  const strip = (arr) => arr.map((x) => ({ ...x, minPrice: null }));
  res.facets = { airlines: strip(f.airlines), stops: strip(f.stops), times: strip(f.times), protected: { ...f.protected, minPrice: null } };
  res.calendar = undefined;
  return res;
}

async function searchFlights(raw) {
  const q = parseQuery(raw);
  const started = Date.now();
  const { sources, groups: rawGroups } = await collect(q);
  const { groups, summary, facets } = refine(q, rawGroups);
  const prices = groups.map((g) => g.best.price);
  const lang = q.lang;
  const regulated = regulatedRoute(q.fromCodes, q.toCodes);
  const res = {
    demo: true,
    query: { ...q, fromAirport: placeInfo(q.fromCodes, lang), toAirport: placeInfo(q.toCodes, lang) },
    stats: groups.length ? { count: groups.length, min: Math.min(...prices), max: Math.max(...prices), offers: groups.reduce((s, g) => s + g.offers.length, 0) } : null,
    summary,
    facets,
    groups: groups.slice(0, 150).map((g) => ({ ...g, outbound: withAirportInfo(g.outbound, lang), inbound: withAirportInfo(g.inbound, lang) })),
    sources,
    regulated: null,
    calendar: raw.calendar === '0' || regulated ? undefined : await calendar(q),
    tookMs: 0,
  };
  if (regulated) hidePrices(res, regulated);
  res.tookMs = Date.now() - started;
  return res;
}

// ---------------------------------------------------------------- Keş (ay təqvimi, explore)
// Deterministik demo qiymət: eyni sorğu + eyni "bu gün" = eyni nəticə. TTL 10 dəq, ən çox 300 açar.
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 300;
const cache = new Map();
async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return { ...hit.value, cached: true };
  const value = await fn();
  cache.set(key, { value, exp: Date.now() + CACHE_TTL });
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return { ...value, cached: false };
}
const clearCache = () => cache.clear();

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const monthOf = (iso) => iso.slice(0, 7);
function addMonth(month, n) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}
function monthDays(month) {
  const [y, m] = month.split('-').map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

// Bir istiqamət + tarix üçün filtrlərdən sonra ən ucuz qrup (və ya null)
async function cheapestGroup(q) {
  const { groups } = refine({ ...q, sort: 'price' }, (await collect(q)).groups);
  return groups.length ? groups[0] : null;
}

// ---------------------------------------------------------------- Ay təqvimi
// GET /api/flights/calendar?from=&to=&month=YYYY-MM&trip=&nights=&adults=&...
// Ayın hər günü üçün ən ucuz qiymət (gediş-dönüşdə: gediş günü, dönüş = gediş + nights).
async function monthCalendar(raw) {
  if (!MONTH_RE.test(raw.month || '')) throw new ValidationError('Ay (month) düzgün deyil. Format: YYYY-MM');
  const today = todayFor(raw);
  const round = raw.trip === 'round';
  const nights = round ? int(raw.nights, 0, 30, 7, 'Gecə sayı') : 0;
  const t0 = dayIndex(today);
  const all = monthDays(raw.month);
  const okDay = (iso) => dayIndex(iso) >= t0 && dayIndex(iso) + nights - t0 <= MAX_DAYS_AHEAD;
  const valid = all.filter(okDay);
  if (!valid.length) throw new ValidationError(`Bu ay üçün tarix seçmək olmur (bu gündən ${MAX_DAYS_AHEAD} gün ərzində olmalıdır)`);
  const base = parseQuery({ ...raw, maxPrice: '', trip: round ? 'round' : 'oneway', depart: valid[0], return: round ? shift(valid[0], nights) : '' });
  const regulated = regulatedRoute(base.fromCodes, base.toCodes);
  const key = JSON.stringify(['cal', raw.month, nights, today, base.from, base.to, base.adults, base.children, base.infants, base.cabin,
    base.direct, base.bags, base.bagCount, base.protected, base.stops, base.airlines, base.times, base.currency]);
  const started = Date.now();
  const out = await cached(key, async () => {
    const days = [];
    for (const date of all) {
      const ret = round ? shift(date, nights) : null;
      if (!okDay(date)) { days.push({ date, return: ret, price: null, disabled: true }); continue; }
      if (regulated) { days.push({ date, return: ret, price: null }); continue; }
      const g = await cheapestGroup({ ...base, depart: date, return: ret });
      days.push({ date, return: ret, price: g ? g.best.price : null, direct: g ? g.stops === 0 : null });
    }
    const priced = days.filter((d) => d.price != null).sort((a, b) => a.price - b.price || a.date.localeCompare(b.date));
    for (const d of priced.slice(0, 3)) d.cheap = true;
    const minMonth = monthOf(today);
    const maxMonth = monthOf(shift(today, MAX_DAYS_AHEAD - nights));
    return {
      demo: true,
      month: raw.month,
      trip: base.trip,
      nights: round ? nights : null,
      from: base.from,
      to: base.to,
      currency: base.currency,
      days,
      min: priced.length ? priced[0].price : null,
      max: priced.length ? priced[priced.length - 1].price : null,
      prevMonth: raw.month > minMonth ? addMonth(raw.month, -1) : null,
      nextMonth: raw.month < maxMonth ? addMonth(raw.month, 1) : null,
      regulated: regulated ? { route: regulated, priceHidden: true } : null,
    };
  });
  return { ...out, tookMs: Date.now() - started };
}

// ---------------------------------------------------------------- "Hara uça bilərəm?"
// GET /api/flights/explore?from=GYD&depart=YYYY-MM-DD | month=YYYY-MM &budget=&direct=1&currency=&lang=
// Bütün istiqamətlər üzrə ən ucuz birtərəfli qiymət (1 böyük, ekonom; baqaj daxil olmaya bilər) — TƏXMİNİ (DEMO).
// Ay rejimində performans üçün ayın hər EXPLORE_STRIDE-cı günü yoxlanılır (keşsiz < 500 ms).
const EXPLORE_STRIDE = 3;
const EXPLORE_LIMIT = 60;
const cityGroups = (() => {
  const m = new Map();
  for (const a of airports) {
    if (!m.has(a.city.en)) m.set(a.city.en, []);
    m.get(a.city.en).push(a);
  }
  return [...m.values()].map((list) => ({ codes: list.map((a) => a.code), airport: list[0] }));
})();

async function explore(raw) {
  const fromCodes = resolveCodes(raw.from || 'GYD');
  if (!fromCodes) throw new ValidationError('Uçuş yeri (from) tapılmadı — IATA kodu göndərin, məs. GYD');
  const today = todayFor(raw);
  const t0 = dayIndex(today);
  let days; let mode;
  if (raw.month) {
    if (!MONTH_RE.test(raw.month)) throw new ValidationError('Ay (month) düzgün deyil. Format: YYYY-MM');
    const valid = monthDays(raw.month).filter((d) => dayIndex(d) >= t0 && dayIndex(d) - t0 <= MAX_DAYS_AHEAD);
    if (!valid.length) throw new ValidationError(`Bu ay üçün tarix seçmək olmur (bu gündən ${MAX_DAYS_AHEAD} gün ərzində olmalıdır)`);
    days = valid.filter((_, i) => i % EXPLORE_STRIDE === 0);
    mode = 'month';
  } else {
    days = [raw.depart || shift(today, 30)];
    mode = 'date';
  }
  const budget = raw.budget === undefined || raw.budget === '' ? null : Number(raw.budget);
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) throw new ValidationError('Büdcə düzgün deyil');
  const dests = cityGroups.filter((c) => !c.codes.some((x) => fromCodes.includes(x)));
  // Validasiya (tarix, valyuta, dil) parseQuery ilə — istiqamət sonradan dəyişdirilir
  const base = parseQuery({ from: fromCodes.join(','), to: dests[0].codes.join(','), depart: days[0], adults: 1, currency: raw.currency, lang: raw.lang, direct: raw.direct, today: raw.today });
  const lang = base.lang;
  const key = JSON.stringify(['exp', mode, days[0], raw.month || '', today, base.from, base.direct, base.currency, lang]);
  const started = Date.now();
  const out = await cached(key, async () => {
    const items = []; const regulated = [];
    for (const d of dests) {
      const city = publicAirport(d.airport, lang);
      const place = { to: d.codes.join(','), city: city.city, country: city.country, region: city.region };
      const route = regulatedRoute(fromCodes, d.codes);
      if (route) { regulated.push({ ...place, route }); continue; }
      let best = null;
      for (const day of days) {
        const g = await cheapestGroup({ ...base, to: d.codes.join(','), toCodes: d.codes, depart: day });
        if (g && (!best || g.best.price < best.g.best.price)) best = { g, day };
      }
      if (!best) continue;
      const g = best.g;
      items.push({
        ...place,
        price: g.best.price,
        date: best.day,
        stops: g.stops,
        direct: g.stops === 0,
        carrier: g.validating,
        carrierName: getCarrier(g.validating).name,
        durationMin: g.durationMin,
        selfTransfer: g.selfTransfer,
      });
    }
    items.sort((a, b) => a.price - b.price || a.city.localeCompare(b.city));
    return { items, regulated };
  });
  const items = out.items.filter((x) => budget == null || x.price <= budget);
  return {
    demo: true,
    estimate: true,
    mode,
    from: base.from,
    fromAirport: placeInfo(fromCodes, lang),
    depart: mode === 'date' ? days[0] : null,
    month: mode === 'month' ? raw.month : null,
    sampledDays: days.length,
    currency: base.currency,
    budget,
    total: items.length,
    items: items.slice(0, EXPLORE_LIMIT),
    regulated: out.regulated,
    cached: out.cached,
    tookMs: Date.now() - started,
  };
}

// Qiymət izləmə üçün: marşrut + tarix üzrə cari ən ucuz qiymət (tənzimlənən marşrutda null)
async function cheapestPrice(raw) {
  const q = parseQuery(raw);
  if (regulatedRoute(q.fromCodes, q.toCodes)) return { q, price: null, regulated: true };
  const g = await cheapestGroup(q);
  return { q, price: g ? g.best.price : null, regulated: false };
}

module.exports = { searchFlights, monthCalendar, explore, cheapestPrice, parseQuery, ValidationError, timeBucket, TIME_BUCKETS, clearCache, placeInfo };
