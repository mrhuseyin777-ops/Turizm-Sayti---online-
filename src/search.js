const config = require('./config');
const { destinations, boardLabels } = require('./data/catalog');
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

function parseQuery(raw, { anywhere = false } = {}) {
  const type = ['package', 'hotel', 'tour'].includes(raw.type) ? raw.type : 'package';
  const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(raw.checkIn || '') ? raw.checkIn : null;
  if (!checkIn || Number.isNaN(Date.parse(checkIn + 'T00:00:00Z'))) throw new QueryError('Tarix (checkIn) düzgün deyil. Format: YYYY-MM-DD');
  const q = typeof raw.q === 'string' ? raw.q.slice(0, 80) : '';
  const destinationIds = anywhere
    ? destinations.map((d) => d.id)
    : typeof raw.destinationId === 'string' && raw.destinationId
      ? [raw.destinationId].filter((id) => destinations.some((d) => d.id === id))
      : resolveDestinations(q);
  const list = (v) => (typeof v === 'string' && v ? v.slice(0, 300).split(',').filter(Boolean).slice(0, 20) : []);
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
  return {
    type,
    destinationIds,
    checkIn: new Date(checkIn + 'T00:00:00Z'),
    nights: clampInt(raw.nights, 1, 28, 7),
    adults: clampInt(raw.adults, 1, 8, 2),
    children,
    childAges: childAges || Array(children).fill(null),
    flex: clampInt(raw.flex, 0, 7, config.flexibleDays),
    region: ['intl', 'domestic'].includes(raw.region) ? raw.region : null,
    minPrice: num(raw.minPrice),
    maxPrice: num(raw.maxPrice),
    stars: list(raw.stars).map(Number).filter((n) => n >= 0 && n <= 5),
    boards: list(raw.boards).filter((b) => boardLabels[b]),
    providers: list(raw.providers),
    earlyOnly: flag(raw.earlyOnly),
    // Ödəniş/ləğv filtrləri: prepay=none (ilkin ödənişsiz) | upto50 (ən çox 50% ilkin)
    prepay: ['none', 'upto50'].includes(raw.prepay) ? raw.prepay : null,
    freeCancel: flag(raw.freeCancel),
    lastMinute: flag(raw.lastMinute),
    refresh: flag(raw.refresh),
    currency: config.rates[raw.currency] ? raw.currency : config.defaultCurrency,
    sort: ['price', 'price_desc', 'rating', 'stars', 'savings'].includes(raw.sort) ? raw.sort : 'price',
  };
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
    p.id, q.type, [...q.destinationIds].sort().join('+'), q.checkIn.toISOString().slice(0, 10),
    q.nights, q.flex, q.adults, q.childAges.map((a) => (a == null ? 'x' : a)).join('.'),
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
  const destById = Object.fromEntries(destinations.map((d) => [d.id, d]));
  let offers = results
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
        destination: destById[o.destinationId],
        providerName: byId[o.providerId].name,
        providerColor: byId[o.providerId].color,
        lastMinute: days >= 0 && days <= config.lastMinuteDays,
      };
    });

  // Büdcə və filtrlər
  offers = offers.filter((o) =>
    (q.minPrice == null || o.price >= q.minPrice) &&
    (q.maxPrice == null || o.price <= q.maxPrice) &&
    (!q.stars.length || q.stars.includes(o.stars)) &&
    (!q.boards.length || q.boards.includes(o.board)) &&
    (!q.earlyOnly || o.earlyBooking) &&
    (!q.prepay || (q.prepay === 'none' ? o.prepayment === 'none' : o.prepayment !== 'full')) &&
    (!q.freeCancel || !!o.freeCancelUntil) &&
    (!q.lastMinute || o.lastMinute));

  offers.sort((a, b) => a.price - b.price);
  return { offers, sources };
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
}

async function search(raw) {
  if (raw.anywhere === '1') return explore(raw);
  const q = parseQuery(raw);
  const started = Date.now();
  if (q.lastMinute) applyLastMinuteWindow(q); // "son dəqiqə" = bu gündən 14 gün ərzində
  applyRegion(q);
  if (!q.destinationIds.length) {
    return { query: publicQuery(q), groups: [], offers: [], sources: [], tookMs: 0, serverTime: new Date().toISOString(), message: 'İstiqamət tapılmadı' };
  }

  const { offers, sources } = await collectOffers(q);

  // Eyni otel/tur üzrə qruplaşdırma: hər qrupda bütün operatorların ən yaxşı qiyməti
  const map = new Map();
  for (const o of offers) {
    if (!map.has(o.itemId)) {
      map.set(o.itemId, {
        itemId: o.itemId, itemType: o.itemType, name: o.name, stars: o.stars, rating: o.rating,
        tags: o.tags, destination: o.destination, includesFlight: o.includesFlight, nights: o.nights,
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
    offers: raw.flat === '1' ? offers.slice(0, 1000) : undefined,
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
  return { ...rest, checkIn: q.checkIn.toISOString().slice(0, 10) };
}

module.exports = { QueryError, search, explore, suggest, resolveDestinations, parseQuery, _cache: cache };
