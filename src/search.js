const config = require('./config');
const { destinations, hotels, tours, boardLabels, HOTEL_ATTRS, hotelById, keyDistance, hotelRules } = require('./data/catalog');
const { providers } = require('./providers');
const { parseChildAges, paymentPlan, QueryError } = require('./pricing');
const { inclusions } = require('./includes');

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

// Reytinq sözü açarı (config.ratingWords): 9.2 → 'superb'. 7-dən aşağı və ya reytinqsiz → null.
function ratingWord(rating) {
  const r = Number(rating);
  if (rating == null || !Number.isFinite(r)) return null;
  const w = config.ratingWords.find((x) => r >= x.min);
  return w ? w.key : null;
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
    // Reytinq həddi (məs. 8 → "8+"), çimərlik xətti (1,2,3 = "3-cü xətt+") və əsas məsafəyə maks. hədd (m):
    // dəniz → dənizə, dağ → kanata, şəhər → mərkəzə. Yanlış dəyər nəzərə alınmır (digər filtrlər kimi).
    minRating: /^(10|[1-9](\.\d)?)$/.test(String(raw.minRating ?? '')) ? Number(raw.minRating) : null,
    beachLines: [...new Set(list(raw.beachLines, 20, 10).filter((x) => ['1', '2', '3'].includes(x)).map(Number))],
    maxDist: /^\d{1,6}$/.test(String(raw.maxDist ?? '')) && Number(raw.maxDist) > 0 ? Number(raw.maxDist) : null,
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
    sort: ['price', 'price_desc', 'rating', 'stars', 'savings', 'distance'].includes(raw.sort) ? raw.sort : 'price',
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
      // Kataloqdan reytinq/rəy sayı/məkan (real adapter bu sahələri verməsə də nişan və filtrlər işləsin)
      const h = o.itemType === 'hotel' ? hotelById.get(o.itemId) : null;
      const dest = slimDest[o.destinationId];
      return {
        ...o,
        // "Qiymətə nə daxildir" (DEMO, deterministik): src/includes.js
        ...inclusions(o, dest && dest.region),
        reviewCount: o.reviewCount ?? (h ? h.reviewCount : null),
        location: o.location || (h ? h.location : null),
        ratingWord: ratingWord(o.rating),
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
  add('minRating', q.minRating != null, (o) => o.rating != null && o.rating >= q.minRating);
  // Çimərlik xətti yalnız dəniz otellərinə aiddir: filtr aktivdirsə, xətti olmayan (şəhər/dağ) otellər çıxır
  add('beachLines', q.beachLines.length, (o) => !!(o.location && o.location.line) && q.beachLines.includes(Math.min(3, o.location.line)));
  add('maxDist', q.maxDist != null, (o) => { const d = keyDistance(o.location); return d != null && d <= q.maxDist; });
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
        itemId: o.itemId, itemType: o.itemType, name: o.name, stars: o.stars, rating: o.rating, ratingWord: o.ratingWord, reviewCount: o.reviewCount, location: o.location,
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
    // Reytinq: bal → rəy sayı → qiymət (reytinqsiz turlar sonda)
    rating: (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0) || a.best.price - b.best.price,
    // Ən yaxın: dənizə (dəniz kurortu) / kanata (dağ) / mərkəzə (şəhər); məsafəsi bilinməyənlər sonda
    distance: (a, b) => (keyDistance(a.location) ?? Infinity) - (keyDistance(b.location) ?? Infinity) || a.best.price - b.best.price,
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

// Otel detal pəncərəsi: bir otelin bütün təklifləri (otaq × qidalanma × operator), ucuzdan bahalıya.
// Yalnız qiymətə təsir edən axtarış parametrləri qəbul olunur; filtrlər (ulduz, büdcə və s.) tətbiq edilmir —
// pəncərə otelin tam qiymət cədvəlini göstərir (istisna: noStopSale=1 — satışı dayandırılmış təklif "ən ucuz" kimi
// göstərilməsin). Hər (otaq, qidalanma, operator) üçün ən ucuz tarix/gecə.
const HOTEL_QUERY_KEYS = ['type', 'checkIn', 'checkInTo', 'flex', 'nights', 'nightsTo', 'adults', 'children', 'childAges', 'currency', 'providers', 'noStopSale', 'refresh'];
const HOTEL_ID_RE = /^[a-z0-9-]{1,40}$/;
const HOTEL_ROWS_MAX = 200;
async function hotelOffers(id, rawIn) {
  if (typeof id !== 'string' || !HOTEL_ID_RE.test(id)) throw new QueryError('Otel id-si düzgün deyil');
  const h = hotelById.get(id);
  if (!h) return null;
  const src = rawIn && typeof rawIn === 'object' ? rawIn : {};
  const raw = {};
  for (const k of HOTEL_QUERY_KEYS) if (typeof src[k] === 'string') raw[k] = src[k];
  if (raw.type === 'tour') throw new QueryError('Ekskursiya turu üçün otel cədvəli yoxdur');
  const dest = destinations.find((d) => d.id === h.destinationId);
  // Daxili istiqamətlərdə aviabiletli paket yoxdur → yalnız otel
  raw.type = raw.type === 'package' && dest.region !== 'domestic' ? 'package' : 'hotel';
  raw.destinationId = h.destinationId;
  raw.hotels = h.id;
  const q = parseQuery(raw);
  const { offers, sources } = await collectOffers(q);
  const seen = new Set();
  const rows = [];
  for (const o of offers) { // ucuzdan sıralanıb → hər açar üçün ilk rast gəlinən ən ucuzdur
    const key = `${o.room}|${o.board}|${o.providerId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(o);
    if (rows.length >= HOTEL_ROWS_MAX) break;
  }
  const { priceFactor, ...pub } = h;
  return {
    hotel: { ...pub, ratingWord: ratingWord(h.rating), destination: slimDest[h.destinationId], rules: hotelRules(h) },
    rows,
    stats: offers.length ? { offers: offers.length, rows: rows.length, min: offers[0].price, max: offers[offers.length - 1].price } : null,
    query: publicQuery(q),
    sources,
    serverTime: new Date().toISOString(),
  };
}

// ---- Qiymət təqvimi (tur paketi / otel): seçilmiş istiqamət + gecə + nəfər üçün hər gediş günü ən ucuz qiymət.
// Rejimlər: span (mərkəz tarix ± N gün, N ≤ 7) və ya mode=month (mərkəz tarixin ayı). Keçmiş günlər atılır.
// Performans: pəncərə ≤ 15 günlük hissələrə bölünür (parseQuery limitləri), hər hissə provayder başına BİR sorğu
// (queryProvider keşi) + təqvimin öz yaddaş keşi. Cavabda yalnız gün xülasəsi qaytarılır.
const CAL_KEYS = ['type', 'destinationId', 'q', 'checkIn', 'span', 'mode', 'nights', 'adults', 'children', 'childAges', 'currency', 'noStopSale'];
const CAL_CACHE_MAX = 100;
const calCache = new Map();
async function calendar(rawIn) {
  const src = rawIn && typeof rawIn === 'object' ? rawIn : {};
  const raw = {};
  for (const k of CAL_KEYS) if (typeof src[k] === 'string') raw[k] = src[k];
  const type = raw.type === undefined || raw.type === '' ? 'package' : raw.type;
  if (!['package', 'hotel'].includes(type)) throw new QueryError('Təqvim yalnız tur paketi (package) və otel (hotel) üçündür');
  if (raw.nights !== undefined && !/^\d{1,2}$/.test(raw.nights)) throw new QueryError('Gecə sayı (nights) düzgün deyil');
  if (raw.span !== undefined && raw.span !== '' && !/^[1-7]$/.test(raw.span)) throw new QueryError('span 1–7 arası olmalıdır');
  if (raw.mode !== undefined && raw.mode !== '' && !['span', 'month'].includes(raw.mode)) throw new QueryError('mode: span | month');
  // İstiqamət: destinationId (ağ siyahı) və ya q mətni — dəqiq BİR istiqamət olmalıdır
  let destId = null;
  if (raw.destinationId) {
    if (!/^[a-z0-9-]{1,30}$/.test(raw.destinationId) || !destinations.some((d) => d.id === raw.destinationId)) throw new QueryError('İstiqamət (destinationId) tapılmadı');
    destId = raw.destinationId;
  } else {
    const ids = resolveDestinations(typeof raw.q === 'string' ? raw.q.slice(0, 80) : '');
    if (ids.length !== 1) throw new QueryError('Təqvim üçün bir istiqamət seçin');
    destId = ids[0];
  }
  const dest = destinations.find((d) => d.id === destId);
  const effType = type === 'package' && dest.region === 'domestic' ? 'hotel' : type;
  const center = parseDate(raw.checkIn, 'Tarix (checkIn)');
  const today = todayUTC();
  if ((center - today) / DAY > config.searchLimits.maxDaysAhead) throw new QueryError(`Gediş tarixi ən çox ${config.searchLimits.maxDaysAhead} gün sonra ola bilər`);
  const mode = raw.mode === 'month' ? 'month' : 'span';
  const span = raw.span ? Number(raw.span) : 7;
  let from;
  let to;
  if (mode === 'month') {
    from = new Date(Date.UTC(center.getUTCFullYear(), center.getUTCMonth(), 1));
    to = new Date(Date.UTC(center.getUTCFullYear(), center.getUTCMonth() + 1, 0));
  } else {
    from = addDaysUTC(center, -span);
    to = addDaysUTC(center, span);
  }
  if (from < today) from = today;
  if (to < from) throw new QueryError('Təqvim pəncərəsi keçmişdədir');
  const base = {
    type: effType, destinationId: destId, nights: String(clampInt(raw.nights, 1, 21, 7)), adults: raw.adults, children: raw.children,
    childAges: raw.childAges, currency: raw.currency, noStopSale: raw.noStopSale === '0' ? '' : '1',
  };
  const started = Date.now();
  const probe = parseQuery({ ...base, checkIn: from.toISOString().slice(0, 10) });
  const key = [effType, destId, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10), probe.nights, probe.adults,
    probe.childAges.map((a) => (a == null ? 'x' : a)).join('.'), probe.currency, base.noStopSale].join('|');
  const hit = calCache.get(key);
  const ttl = config.priceCacheMinutes * 60000;
  let days;
  if (hit && Date.now() - hit.at < ttl) {
    days = hit.days;
  } else {
    const byDate = new Map();
    const CHUNK = config.searchLimits.maxDateRangeDays; // ≤ 15 gün bir sorğuda
    const chunks = [];
    for (let s = from; s <= to; s = addDaysUTC(s, CHUNK + 1)) {
      const e = addDaysUTC(s, CHUNK) > to ? to : addDaysUTC(s, CHUNK);
      chunks.push(parseQuery({ ...base, checkIn: s.toISOString().slice(0, 10), checkInTo: e.toISOString().slice(0, 10), nightsTo: base.nights }));
    }
    const results = await Promise.all(chunks.map((q) => collectOffers(q)));
    for (const { offers } of results) {
      for (const o of offers) { // ucuzdan sıralanıb → gün üçün ilk rast gəlinən ən ucuzdur
        const d = byDate.get(o.checkIn);
        if (!d) byDate.set(o.checkIn, { price: o.price, providerName: o.providerName, hotel: o.name, offers: 1 });
        else d.offers++;
      }
    }
    days = [];
    for (let d = from; d <= to; d = addDaysUTC(d, 1)) {
      const iso = d.toISOString().slice(0, 10);
      const x = byDate.get(iso);
      days.push(x ? { date: iso, price: x.price, providerName: x.providerName, hotel: x.hotel, offers: x.offers } : { date: iso, price: null, offers: 0 });
    }
    // "Ən ucuz" günlər: ən aşağı qiymətdən ≤ 5% baha olanlar (ən azı 1, ən çox 3 gün)
    const priced = days.filter((x) => x.price != null).sort((a, b) => a.price - b.price);
    if (priced.length) {
      const lim = priced[0].price * 1.05;
      priced.filter((x, i) => i < 3 && x.price <= lim).forEach((x) => { x.cheapest = true; });
      const max = priced[priced.length - 1].price;
      const step = (max - priced[0].price) / 3;
      for (const x of priced) x.level = step <= 0 ? 'low' : x.price <= priced[0].price + step ? 'low' : x.price <= priced[0].price + 2 * step ? 'mid' : 'high';
    }
    calCache.delete(key);
    calCache.set(key, { at: Date.now(), days });
    while (calCache.size > CAL_CACHE_MAX) calCache.delete(calCache.keys().next().value);
  }
  const prices = days.filter((x) => x.price != null).map((x) => x.price);
  return {
    query: {
      type: effType, destinationId: destId, destination: slimDest[destId], mode, span: mode === 'span' ? span : null, center: center.toISOString().slice(0, 10),
      from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), nights: probe.nights, adults: probe.adults, childAges: probe.childAges, currency: probe.currency,
    },
    days,
    min: prices.length ? Math.min(...prices) : null,
    max: prices.length ? Math.max(...prices) : null,
    cached: !!hit && Date.now() - hit.at < ttl,
    tookMs: Date.now() - started,
    note: 'DEMO',
  };
}

function publicQuery(q) {
  const { refresh, ...rest } = q;
  const d = (x) => (x ? x.toISOString().slice(0, 10) : null);
  return { ...rest, checkIn: d(q.checkIn), checkInTo: d(q.checkInTo), dateFrom: d(q.dateFrom), dateTo: d(q.dateTo) };
}

module.exports = { QueryError, search, explore, suggest, resolveDestinations, parseQuery, activePredicates, ratingWord, hotelOffers, calendar, _cache: cache, _calCache: calCache };
