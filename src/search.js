const config = require('./config');
const { destinations, hotels, tours, boardLabels, HOTEL_ATTRS } = require('./data/catalog');
const { providers } = require('./providers');
const { parseChildAges, paymentPlan, QueryError } = require('./pricing');

const norm = (s) => String(s || '').toLocaleLowerCase('az').normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

function resolveDestinations(text) {
  const t = norm(text);
  if (!t) return [];
  return destinations
    .filter((d) => [d.name, d.country, d.id, ...d.aliases].some((a) => norm(a).includes(t) || t.includes(norm(a))))
    .map((d) => d.id);
}

function suggest(text) {
  const t = norm(typeof text === 'string' ? text.slice(0, 60) : '');
  return destinations
    .filter((d) => !t || [d.name, d.country, ...d.aliases].some((a) => norm(a).startsWith(t) || norm(a).includes(t)))
    .slice(0, 8)
    .map((d) => ({ id: d.id, name: d.name, country: d.country, region: d.region }));
}

const clampInt = (v, min, max, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86400000;
function parseDate(v, label) {
  if (!DATE_RE.test(v || '') || Number.isNaN(Date.parse(v + 'T00:00:00Z')) || new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) !== v) {
    throw new QueryError(`${label} düzgün deyil. Format: YYYY-MM-DD`);
  }
  return new Date(v + 'T00:00:00Z');
}
const addDaysUTC = (d, n) => new Date(d.getTime() + n * DAY);

// Kombinasiya limiti: (tarix sayı) × (gecə variantı sayı) ≤ maxCombos — ağır sorğulara (DoS) qarşı.
function checkCombos(q) {
  const L = config.searchLimits;
  const days = Math.round((q.dateTo - q.dateFrom) / DAY) + 1;
  const combos = days * (q.nightsTo - q.nightsFrom + 1);
  if (combos > L.maxCombos) throw new QueryError(`Tarix × gecə kombinasiyası çoxdur (${combos}); maksimum ${L.maxCombos}. Aralığı daraldın.`);
}

// Tarix pəncərəsi: checkInTo verilibsə "gediş -dan / -dək" aralığı (əsas rejim), yoxdursa checkIn ± flex
// (köhnə linklər və qısa yol). Gecə: nights (-dan) … nightsTo (-dək).
function parseQuery(raw, { anywhere = false } = {}) {
  const L = config.searchLimits;
  const type = ['package', 'hotel', 'tour'].includes(raw.type) ? raw.type : 'package';
  const checkIn = parseDate(raw.checkIn, 'Tarix (checkIn)');
  if ((checkIn - todayUTC()) / DAY > L.maxDaysAhead) throw new QueryError(`Gediş tarixi ən çox ${L.maxDaysAhead} gün sonra ola bilər`);
  let checkInTo = null;
  if (raw.checkInTo !== undefined && raw.checkInTo !== '') {
    checkInTo = parseDate(raw.checkInTo, 'Son tarix (checkInTo)');
    if (checkInTo < checkIn) throw new QueryError('"Gediş -dək" tarixi "-dan" tarixindən əvvəl ola bilməz');
    if ((checkInTo - checkIn) / DAY > L.maxDateRangeDays) throw new QueryError(`Tarix aralığı maksimum ${L.maxDateRangeDays} gün ola bilər`);
  }
  const nights = clampInt(raw.nights, 1, 28, 7);
  let nightsTo = nights;
  if (raw.nightsTo !== undefined && raw.nightsTo !== '') {
    if (!/^\d{1,2}$/.test(String(raw.nightsTo))) throw new QueryError('Gecə sayı (nightsTo) düzgün deyil');
    nightsTo = Math.min(28, Number(raw.nightsTo));
    if (nightsTo < nights) throw new QueryError('"Gecə -dək" "-dan" dəyərindən az ola bilməz');
    if (nightsTo - nights > L.maxNightsSpan) throw new QueryError(`Gecə aralığı maksimum ${L.maxNightsSpan} ola bilər`);
  }
  const flex = checkInTo ? 0 : clampInt(raw.flex, 0, 7, config.flexibleDays);
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : '';
  const destinationIds = anywhere
    ? destinations.map((d) => d.id)
    : typeof raw.destinationId === 'string' && raw.destinationId
      ? [raw.destinationId].filter((id) => destinations.some((d) => d.id === id))
      : resolveDestinations(q);
  const list = (v, maxLen = 300, maxItems = 20) => (typeof v === 'string' && v ? v.slice(0, maxLen).split(',').filter(Boolean).slice(0, maxItems) : []);
  const num = (v) => {
    if (v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const flag = (v) => v === '1' || v === 'true';
  // Uşaqlar: childAges ("3,7") verilibsə o əsasdır; yoxdursa köhnə `children` sayı (yaş bilinmir →
  // config.defaultChildAge). Beləliklə köhnə linklər/inteqrasiyalar dəyişmədən işləyir.
  const childAges = parseChildAges(raw.childAges);
  const children = childAges ? childAges.length : clampInt(raw.children, 0, 6, 0);
  const out = {
    type,
    destinationIds,
    checkIn,
    checkInTo,
    dateFrom: checkInTo ? checkIn : addDaysUTC(checkIn, -flex),
    dateTo: checkInTo || addDaysUTC(checkIn, flex),
    nights,
    nightsFrom: nights,
    nightsTo,
    adults: clampInt(raw.adults, 1, 8, 2),
    children,
    childAges: childAges || Array(children).fill(null),
    flex,
    region: ['intl', 'domestic'].includes(raw.region) ? raw.region : null,
    minPrice: num(raw.minPrice),
    maxPrice: num(raw.maxPrice),
    stars: list(raw.stars).map(Number).filter((n) => n >= 0 && n <= 5),
    boards: list(raw.boards).filter((b) => boardLabels[b]),
    providers: list(raw.providers),
    // Kurort rayonları və otellər (multi-select). Format: "alanya.konakli,alanya.mahmutlar" / "antalya-h1,..."
    districts: list(raw.districts, 1200, 40).filter((x) => /^[a-z0-9-]{1,20}\.[a-z0-9-]{1,30}$/.test(x)),
    hotels: list(raw.hotels, 1200, 60).filter((x) => /^[a-z0-9-]{1,40}$/.test(x)),
    attrs: list(raw.attrs, 100, 4).filter((a) => HOTEL_ATTRS.includes(a)),
    earlyOnly: flag(raw.earlyOnly),
    // Ödəniş/ləğv filtrləri: prepay=none (ilkin ödənişsiz) | upto50 (ən çox 50% ilkin)
    prepay: ['none', 'upto50'].includes(raw.prepay) ? raw.prepay : null,
    freeCancel: flag(raw.freeCancel),
    lastMinute: flag(raw.lastMinute),
    // Yer/satış filtrləri: reyslərdə yer var, satış dayandırılmayıb, ani təsdiq
    seatsOnly: flag(raw.seatsOnly),
    noStopSale: flag(raw.noStopSale),
    instantOnly: flag(raw.instantOnly),
    refresh: flag(raw.refresh),
    limit: clampInt(raw.limit, 1, L.maxFlatOffers, L.maxFlatOffers),
    currency: config.rates[raw.currency] ? raw.currency : config.defaultCurrency,
    sort: ['price', 'price_desc', 'rating', 'stars', 'savings'].includes(raw.sort) ? raw.sort : 'price',
  };
  checkCombos(out);
  return out;
}

async function withTimeout(promise, ms) {
  let timer;
  const t = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms); });
  try { return await Promise.race([promise, t]); } finally { clearTimeout(timer); }
}

const todayUTC = () => new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
const daysUntil = (isoDate) => Math.round((Date.parse(isoDate + 'T00:00:00Z') - todayUTC()) / 86400000);

// --- Operator qiymətlərinin yaddaş keşi ---------------------------------------
// Hər provayder cavabı sorğu parametrlərinə görə keşlənir; checkedAt = qiymətin operatordan
// həqiqətən alındığı an (UI-da "X dəq əvvəl yoxlanılıb"). refresh=1 keşi keçib yenidən soruşur.
const CACHE_MAX = 150;
const cache = new Map();
function cacheKey(p, q) {
  return [
    p.id, q.type, [...q.destinationIds].sort().join('+'), q.dateFrom.toISOString().slice(0, 10), q.dateTo.toISOString().slice(0, 10),
    q.nightsFrom, q.nightsTo, q.adults, q.childAges.map((a) => (a == null ? 'x' : a)).join('.'),
  ].join('|');
}
async function queryProvider(p, q) {
  const key = cacheKey(p, q);
  const hit = cache.get(key);
  const ttl = config.priceCacheMinutes * 60000;
  if (hit && !q.refresh && Date.now() - hit.checkedAt < ttl) return { ...hit, cached: true };
  const offers = await withTimeout(p.search(q), 8000);
  const entry = { offers, checkedAt: Date.now() };
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return { ...entry, cached: false };
}

// Cavabda istiqamət obyektinin yığcam forması (rayon siyahısı/aliaslar hər təklifdə təkrarlanmasın)
const slimDest = Object.fromEntries(destinations.map((d) => [d.id, { id: d.id, name: d.name, country: d.country, region: d.region }]));

// Bütün aktiv operatorları paralel sorğula, valyutaya çevir, filtrlə (ucuzdan bahalıya)
async function collectOffers(q) {
  const active = providers.filter((p) => p.sells.includes(q.type) && (!q.providers.length || q.providers.includes(p.id)));
  // biri gecikərsə digərləri gözləmir
  const results = await Promise.allSettled(active.map((p) => queryProvider(p, q)));
  const sources = active.map((p, i) => {
    const r = results[i];
    const ok = r.status === 'fulfilled';
    return {
      id: p.id, name: p.name, color: p.color, kind: p.kind, demo: p.demo, ok,
      count: ok ? r.value.offers.length : 0,
      checkedAt: ok ? new Date(r.value.checkedAt).toISOString() : null,
      cached: ok ? r.value.cached : false,
    };
  });

  const rate = config.rates[q.currency];
  const byId = Object.fromEntries(providers.map((p) => [p.id, p]));
  const all = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value.offers)
    .map((o) => {
      const days = daysUntil(o.checkIn);
      return {
        ...o,
        price: Math.round(o.price * rate),
        oldPrice: o.oldPrice ? Math.round(o.oldPrice * rate) : null,
        currency: q.currency,
        boardLabel: o.board ? boardLabels[o.board] : null,
        destination: slimDest[o.destinationId],
        providerName: byId[o.providerId].name,
        providerColor: byId[o.providerId].color,
        lastMinute: days >= 0 && days <= config.lastMinuteDays,
      };
    });

  // Filtrlər adlı predikatlar kimi: boş nəticədə "hansı filtr sıfırladı" analizi üçün.
  // facet: true olanlar (rayon, otel, atribut) facet saylarına təsir etmir — siyahı daralmasın.
  const preds = activePredicates(q);
  const base = preds.filter((p) => !p.facet);
  const baseOffers = base.length ? all.filter((o) => base.every((p) => p.test(o))) : all;
  const facetPreds = preds.filter((p) => p.facet);
  const offers = facetPreds.length ? baseOffers.filter((o) => facetPreds.every((p) => p.test(o))) : baseOffers.slice();
  offers.sort((a, b) => a.price - b.price);
  return { offers, sources, all, baseOffers, preds };
}

// Hər filtr: { key, facet, test(o) }. Yalnız aktiv olanlar qaytarılır.
function activePredicates(q) {
  const P = [];
  const add = (key, on, test, facet = false) => { if (on) P.push({ key, test, facet }); };
  add('minPrice', q.minPrice != null, (o) => o.price >= q.minPrice);
  add('maxPrice', q.maxPrice != null, (o) => o.price <= q.maxPrice);
  add('stars', q.stars.length, (o) => q.stars.includes(o.stars));
  add('boards', q.boards.length, (o) => q.boards.includes(o.board));
  add('earlyOnly', q.earlyOnly, (o) => o.earlyBooking);
  add('prepay', q.prepay, (o) => (q.prepay === 'none' ? o.prepayment === 'none' : o.prepayment !== 'full'));
  add('freeCancel', q.freeCancel, (o) => !!o.freeCancelUntil);
  add('lastMinute', q.lastMinute, (o) => o.lastMinute);
  // Reyslərdə yer: yalnız aviabiletli paketlərə aiddir (gediş və dönüş "yoxdur" olmamalı)
  add('seatsOnly', q.seatsOnly, (o) => !o.flight || (o.flight.out.seats !== 'none' && o.flight.back.seats !== 'none'));
  add('noStopSale', q.noStopSale, (o) => !o.stopSale);
  add('instantOnly', q.instantOnly, (o) => o.availability === 'instant');
  add('districts', q.districts.length, (o) => q.districts.includes(o.districtId), true);
  add('hotels', q.hotels.length, (o) => q.hotels.includes(o.itemId), true);
  add('attrs', q.attrs.length, (o) => q.attrs.every((a) => (o.attrs || []).includes(a)), true);
  return P;
}

// Facet-lər: axtarılan istiqamətlərin rayonları və otelləri (saylar = əsas filtrlərdən keçən unikal otel/tur)
function buildFacets(q, baseOffers) {
  const itemsByDistrict = new Map();
  const offersByItem = new Map();
  for (const o of baseOffers) {
    offersByItem.set(o.itemId, (offersByItem.get(o.itemId) || 0) + 1);
    if (o.districtId) {
      if (!itemsByDistrict.has(o.districtId)) itemsByDistrict.set(o.districtId, new Set());
      itemsByDistrict.get(o.districtId).add(o.itemId);
    }
  }
  const dests = destinations.filter((d) => q.destinationIds.includes(d.id));
  const multi = dests.length > 1;
  const districts = q.type === 'tour' ? [] : dests.flatMap((d) => d.districts.map((x) => ({
    id: x.id, name: x.name, destination: multi ? d.name : undefined, count: itemsByDistrict.has(x.id) ? itemsByDistrict.get(x.id).size : 0,
  })));
  const catalogItems = q.type === 'tour'
    ? tours.filter((t) => q.destinationIds.includes(t.destinationId)).map((t) => ({ id: t.id, name: t.name, stars: t.stars, district: null, attrs: [] }))
    : hotels.filter((h) => q.destinationIds.includes(h.destinationId)).map((h) => ({ id: h.id, name: h.name, stars: h.stars, district: h.district, districtId: h.districtId, attrs: h.attrs }));
  const items = catalogItems
    .map((x) => ({ ...x, count: offersByItem.get(x.id) || 0 }))
    .filter((x) => x.count > 0 || q.hotels.includes(x.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { districts, hotels: items };
}

// Boş nəticə diaqnostikası: səbəb + hansı filtri yumşaltsanız neçə təklif olar
const TOUR_DESTINATIONS = [...new Set(tours.map((t) => t.destinationId))]
  .map((id) => destinations.find((d) => d.id === id))
  .map((d) => ({ id: d.id, name: d.name, country: d.country, region: d.region }));
function diagnoseEmpty(q, all, preds) {
  const destObjs = destinations.filter((d) => q.destinationIds.includes(d.id));
  if (q.type === 'tour' && !tours.some((t) => q.destinationIds.includes(t.destinationId))) {
    return { reason: 'no_tours', total: 0, relax: [], tourDestinations: TOUR_DESTINATIONS };
  }
  if (q.type === 'package' && destObjs.length && destObjs.every((d) => d.region === 'domestic')) {
    return { reason: 'no_package_domestic', total: 0, relax: [] };
  }
  if (!all.length) {
    return q.type === 'tour'
      ? { reason: 'no_departures', total: 0, relax: [], tourDestinations: TOUR_DESTINATIONS }
      : { reason: 'no_offers', total: 0, relax: [] };
  }
  const relax = [];
  for (const p of preds) {
    const others = preds.filter((x) => x !== p);
    const pass = all.filter((o) => others.every((x) => x.test(o)));
    if (!pass.length) continue;
    if (p.key === 'maxPrice') {
      // Büdcə: ən ucuz ~5 uyğun təklifi əhatə edən yuvarlaq məbləğ (100-ə) və həmin büdcədə təklif sayı
      const prices = pass.map((o) => o.price).sort((x, y) => x - y);
      const value = Math.ceil(prices[Math.min(4, prices.length - 1)] / 100) * 100;
      relax.push({ key: p.key, value, count: pass.filter((o) => o.price <= value).length });
    } else {
      relax.push({ key: p.key, count: pass.length });
    }
  }
  relax.sort((a, b) => (a.key === 'maxPrice' ? -1 : b.key === 'maxPrice' ? 1 : b.count - a.count));
  return { reason: 'filters', total: all.length, relax: relax.slice(0, 4) };
}

function applyRegion(q) {
  if (q.region) q.destinationIds = q.destinationIds.filter((id) => destinations.find((d) => d.id === id).region === q.region);
}

// "Son dəqiqə" rejimi (istiqamətsiz axtarışda): bu gündən lastMinuteDays-ə qədər bütün çıxışlar
function applyLastMinuteWindow(q) {
  const half = Math.min(7, Math.ceil(config.lastMinuteDays / 2));
  const d = todayUTC();
  d.setUTCDate(d.getUTCDate() + half);
  q.checkIn = d;
  q.flex = half;
  q.checkInTo = null;
  q.dateFrom = addDaysUTC(d, -half);
  q.dateTo = addDaysUTC(d, half);
  // Pəncərə dəyişdi: kombinasiya limitinə sığması üçün gecə aralığını daralt
  const days = Math.round((q.dateTo - q.dateFrom) / DAY) + 1;
  q.nightsTo = Math.max(q.nightsFrom, Math.min(q.nightsTo, q.nightsFrom + Math.floor(config.searchLimits.maxCombos / days) - 1));
}

// opts.offerLimit: daxili istifadə (seçim linki serverdə təklifi tapmalıdır); HTTP cavabında limit = q.limit
async function search(raw, opts = {}) {
  if (raw.anywhere === '1') return explore(raw);
  const q = parseQuery(raw);
  const started = Date.now();
  if (q.lastMinute) applyLastMinuteWindow(q); // "son dəqiqə" = bu gündən 14 gün ərzində
  applyRegion(q);
  if (!q.destinationIds.length) {
    return {
      query: publicQuery(q), groups: [], offers: [], sources: [], tookMs: 0, serverTime: new Date().toISOString(), message: 'İstiqamət tapılmadı',
      empty: { reason: 'no_destination', total: 0, relax: [] }, facets: { districts: [], hotels: [] }, operatorRate: config.operatorRate,
    };
  }

  const { offers, sources, all, baseOffers, preds } = await collectOffers(q);

  // Eyni otel/tur üzrə qruplaşdırma: hər qrupda bütün operatorların ən yaxşı qiyməti
  const map = new Map();
  for (const o of offers) {
    if (!map.has(o.itemId)) {
      map.set(o.itemId, {
        itemId: o.itemId, itemType: o.itemType, name: o.name, stars: o.stars, rating: o.rating,
        tags: o.tags, attrs: o.attrs, district: o.district, districtId: o.districtId, destination: o.destination, includesFlight: o.includesFlight, nights: o.nights,
        best: o, byProvider: {}, offerCount: 0, earlyBooking: false, lastMinute: false,
      });
    }
    const g = map.get(o.itemId);
    g.offerCount++;
    g.earlyBooking = g.earlyBooking || o.earlyBooking;
    g.lastMinute = g.lastMinute || o.lastMinute;
    // hər operator üçün ən ucuz təklifi saxla (offers artıq ucuzdan sıralanıb)
    if (!g.byProvider[o.providerId]) g.byProvider[o.providerId] = o;
  }
  const groups = [...map.values()].map((g) => {
    const perProvider = Object.values(g.byProvider).sort((a, b) => a.price - b.price);
    const max = perProvider[perProvider.length - 1].price;
    const { byProvider, ...rest } = g;
    return { ...rest, best: { ...g.best, plan: paymentPlan(g.best.price) }, providers: perProvider, savings: max - g.best.price };
  });

  const sorters = {
    price: (a, b) => a.best.price - b.best.price,
    price_desc: (a, b) => b.best.price - a.best.price,
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || a.best.price - b.best.price,
    stars: (a, b) => b.stars - a.stars || a.best.price - b.best.price,
    savings: (a, b) => b.savings - a.savings,
  };
  groups.sort(sorters[q.sort]);

  const prices = offers.map((o) => o.price);
  return {
    query: publicQuery(q),
    stats: prices.length ? { min: prices[0], max: prices[prices.length - 1], count: prices.length, hotels: groups.length } : null,
    groups,
    offers: raw.flat === '1' ? offers.slice(0, opts.offerLimit || q.limit) : undefined,
    offersTruncated: raw.flat === '1' && offers.length > (opts.offerLimit || q.limit) ? true : undefined,
    facets: buildFacets(q, baseOffers),
    empty: groups.length ? undefined : diagnoseEmpty(q, all, preds),
    operatorRate: config.operatorRate,
    sources,
    serverTime: new Date().toISOString(),
    tookMs: Date.now() - started,
  };
}

// "Hara gedə bilərəm?" — istiqamətsiz axtarış: hər istiqamət üzrə ən ucuz təklif, ucuzdan bahalıya.
// Performans: bütün istiqamətlər provayder başına BİR sorğuda (paralel) yoxlanılır və keşlənir;
// cavabda yalnız istiqamət xülasəsi qaytarılır (minlərlə təklifin özü yox).
async function explore(raw) {
  const q = parseQuery(raw, { anywhere: true });
  const started = Date.now();
  if (q.lastMinute) applyLastMinuteWindow(q);
  applyRegion(q);
  const { offers, sources } = await collectOffers(q);

  const map = new Map();
  for (const o of offers) { // ucuzdan sıralanıb → istiqamət üçün ilk rast gəlinən ən ucuzdur
    let d = map.get(o.destinationId);
    if (!d) {
      d = { destination: o.destination, best: { ...o, plan: paymentPlan(o.price) }, items: new Set(), providers: new Set(), offerCount: 0, lastMinute: false, earlyBooking: false };
      map.set(o.destinationId, d);
    }
    d.items.add(o.itemId);
    d.providers.add(o.providerId);
    d.offerCount++;
    d.lastMinute = d.lastMinute || o.lastMinute;
    d.earlyBooking = d.earlyBooking || o.earlyBooking;
  }
  const list = [...map.values()]
    .map((d) => ({ ...d, items: d.items.size, providers: d.providers.size, minPrice: d.best.price }))
    .sort((a, b) => a.minPrice - b.minPrice);

  return {
    query: { ...publicQuery(q), anywhere: true },
    destinations: list,
    sources,
    serverTime: new Date().toISOString(),
    tookMs: Date.now() - started,
    message: list.length ? undefined : 'Bu büdcə və tarixlərə uyğun istiqamət tapılmadı',
  };
}

function publicQuery(q) {
  const { refresh, ...rest } = q;
  const d = (x) => (x ? x.toISOString().slice(0, 10) : null);
  return { ...rest, checkIn: d(q.checkIn), checkInTo: d(q.checkInTo), dateFrom: d(q.dateFrom), dateTo: d(q.dateTo) };
}

module.exports = { QueryError, search, explore, suggest, resolveDestinations, parseQuery, activePredicates, _cache: cache };
