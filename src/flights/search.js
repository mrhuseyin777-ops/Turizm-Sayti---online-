// Aviabilet axtarışı və aqreqasiya: bütün mənbələr paralel sorğulanır, eyni uçuş
// (eyni seqmentlər) qruplaşdırılır, filtr və sıralama tətbiq olunur, qiymət təqvimi qurulur.

const config = require('../config');
const env = require('../env');
const { getAirport, publicAirport, resolveCodes } = require('./airports');
const { getCarrier } = require('./carriers');
const { flightProviders } = require('./providers');
const { dayIndex, isoFromDay } = require('./schedule');

const MAX_DAYS_AHEAD = 360;
const TIME_BUCKETS = { morning: [5, 12], day: [12, 17], evening: [17, 22], night: [22, 29] }; // 29 = 05:00 növbəti gün
const SORTS = ['price', 'fastest', 'best'];

class ValidationError extends Error {}

const todayIso = () => new Date().toISOString().slice(0, 10);
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
  const today = !env.isProd && raw.today && isDate(raw.today) ? raw.today : todayIso();
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
    layovers: it.layovers.map((l) => ({ ...l, city: ap(l.airport).city })),
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

// Filtr + sıralama (calendar üçün də istifadə olunur)
function refine(q, rawGroups) {
  const out = [];
  for (const g of rawGroups) {
    let offers = g.offers;
    if (q.bags) offers = offers.filter((o) => o.fare.checked > 0);
    if (!offers.length) continue;
    offers = [...offers].sort((a, b) => a.price - b.price || b.fare.checked - a.fare.checked);
    // hər mənbə üzrə ən ucuz təklif
    const bySource = new Map();
    for (const o of offers) if (!bySource.has(o.sourceId)) bySource.set(o.sourceId, o);
    const providers = [...bySource.values()];
    const best = providers[0];
    out.push({
      ...g,
      offers,
      providers,
      best,
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
  for (const g of out) {
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

async function searchFlights(raw) {
  const q = parseQuery(raw);
  const started = Date.now();
  const { sources, groups: rawGroups } = await collect(q);
  const { groups, summary, facets } = refine(q, rawGroups);
  const prices = groups.map((g) => g.best.price);
  const lang = q.lang;
  return {
    demo: true,
    query: { ...q, fromAirport: placeInfo(q.fromCodes, lang), toAirport: placeInfo(q.toCodes, lang) },
    stats: groups.length ? { count: groups.length, min: Math.min(...prices), max: Math.max(...prices), offers: groups.reduce((s, g) => s + g.offers.length, 0) } : null,
    summary,
    facets,
    groups: groups.slice(0, 150).map((g) => ({ ...g, outbound: withAirportInfo(g.outbound, lang), inbound: withAirportInfo(g.inbound, lang) })),
    sources,
    calendar: raw.calendar === '0' ? undefined : await calendar(q),
    tookMs: Date.now() - started,
  };
}

module.exports = { searchFlights, parseQuery, ValidationError, timeBucket, TIME_BUCKETS };
