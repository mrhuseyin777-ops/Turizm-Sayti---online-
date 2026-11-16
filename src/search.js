const config = require('./config');
const { destinations, boardLabels } = require('./data/catalog');
const { providers } = require('./providers');

const norm = (s) => String(s || '').toLocaleLowerCase('az').normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

function resolveDestinations(text) {
  const t = norm(text);
  if (!t) return [];
  return destinations
    .filter((d) => [d.name, d.country, d.id, ...d.aliases].some((a) => norm(a).includes(t) || t.includes(norm(a))))
    .map((d) => d.id);
}

function suggest(text) {
  const t = norm(text);
  return destinations
    .filter((d) => !t || [d.name, d.country, ...d.aliases].some((a) => norm(a).startsWith(t) || norm(a).includes(t)))
    .slice(0, 8)
    .map((d) => ({ id: d.id, name: d.name, country: d.country, region: d.region }));
}

const clampInt = (v, min, max, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

function parseQuery(raw) {
  const type = ['package', 'hotel', 'tour'].includes(raw.type) ? raw.type : 'package';
  const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(raw.checkIn || '') ? raw.checkIn : null;
  if (!checkIn) throw new Error('Tarix (checkIn) düzgün deyil. Format: YYYY-MM-DD');
  const destinationIds = raw.destinationId
    ? [raw.destinationId].filter((id) => destinations.some((d) => d.id === id))
    : resolveDestinations(raw.q);
  const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);
  const num = (v) => (v === undefined || v === '' ? null : Number(v));
  return {
    type,
    destinationIds,
    checkIn: new Date(checkIn + 'T00:00:00Z'),
    nights: clampInt(raw.nights, 1, 28, 7),
    adults: clampInt(raw.adults, 1, 8, 2),
    children: clampInt(raw.children, 0, 6, 0),
    flex: clampInt(raw.flex, 0, 7, config.flexibleDays),
    region: ['intl', 'domestic'].includes(raw.region) ? raw.region : null,
    minPrice: num(raw.minPrice),
    maxPrice: num(raw.maxPrice),
    stars: list(raw.stars).map(Number),
    boards: list(raw.boards),
    providers: list(raw.providers),
    earlyOnly: raw.earlyOnly === '1' || raw.earlyOnly === 'true',
    currency: config.rates[raw.currency] ? raw.currency : config.defaultCurrency,
    sort: ['price', 'price_desc', 'rating', 'stars', 'savings'].includes(raw.sort) ? raw.sort : 'price',
  };
}

async function withTimeout(promise, ms) {
  let timer;
  const t = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timeout')), ms); });
  try { return await Promise.race([promise, t]); } finally { clearTimeout(timer); }
}

async function search(raw) {
  const q = parseQuery(raw);
  const started = Date.now();
  if (q.region) q.destinationIds = q.destinationIds.filter((id) => destinations.find((d) => d.id === id).region === q.region);
  if (!q.destinationIds.length) {
    return { query: publicQuery(q), groups: [], offers: [], sources: [], tookMs: 0, message: 'İstiqamət tapılmadı' };
  }

  const active = providers.filter((p) => p.sells.includes(q.type) && (!q.providers.length || q.providers.includes(p.id)));
  // Bütün operatorlar paralel sorğulanır; biri gecikərsə digərləri gözləmir
  const results = await Promise.allSettled(active.map((p) => withTimeout(p.search(q), 8000)));
  const sources = active.map((p, i) => ({
    id: p.id, name: p.name, color: p.color, kind: p.kind, demo: p.demo,
    ok: results[i].status === 'fulfilled',
    count: results[i].status === 'fulfilled' ? results[i].value.length : 0,
  }));

  const rate = config.rates[q.currency];
  let offers = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .map((o) => ({
      ...o,
      price: Math.round(o.price * rate),
      oldPrice: o.oldPrice ? Math.round(o.oldPrice * rate) : null,
      currency: q.currency,
      boardLabel: o.board ? boardLabels[o.board] : null,
      destination: destinations.find((d) => d.id === o.destinationId),
      providerName: providers.find((p) => p.id === o.providerId).name,
      providerColor: providers.find((p) => p.id === o.providerId).color,
    }));

  // Büdcə və filtrlər
  offers = offers.filter((o) =>
    (q.minPrice == null || o.price >= q.minPrice) &&
    (q.maxPrice == null || o.price <= q.maxPrice) &&
    (!q.stars.length || q.stars.includes(o.stars)) &&
    (!q.boards.length || q.boards.includes(o.board)) &&
    (!q.earlyOnly || o.earlyBooking));

  offers.sort((a, b) => a.price - b.price);

  // Eyni otel/tur üzrə qruplaşdırma: hər qrupda bütün operatorların ən yaxşı qiyməti
  const map = new Map();
  for (const o of offers) {
    if (!map.has(o.itemId)) {
      map.set(o.itemId, {
        itemId: o.itemId, itemType: o.itemType, name: o.name, stars: o.stars, rating: o.rating,
        tags: o.tags, destination: o.destination, includesFlight: o.includesFlight, nights: o.nights,
        best: o, byProvider: {}, offerCount: 0, earlyBooking: false,
      });
    }
    const g = map.get(o.itemId);
    g.offerCount++;
    g.earlyBooking = g.earlyBooking || o.earlyBooking;
    // hər operator üçün ən ucuz təklifi saxla (offers artıq ucuzdan sıralanıb)
    if (!g.byProvider[o.providerId]) g.byProvider[o.providerId] = o;
  }
  let groups = [...map.values()].map((g) => {
    const perProvider = Object.values(g.byProvider).sort((a, b) => a.price - b.price);
    const max = perProvider[perProvider.length - 1].price;
    const { byProvider, ...rest } = g;
    return { ...rest, providers: perProvider, savings: max - g.best.price };
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
    tookMs: Date.now() - started,
  };
}

function publicQuery(q) {
  return { ...q, checkIn: q.checkIn.toISOString().slice(0, 10) };
}

module.exports = { search, suggest, resolveDestinations, parseQuery };
