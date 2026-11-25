// "Niyə bu otel" — qaydaya əsaslanan (AI-siz) qısa izahlar və "Oxşar otellər" bloku.
// Seçim linki (/s/<id>) və çap/PDF təklifdə hər variant üçün 2–4 səbəb. Səbəblər dil-neytral kod + parametr
// kimi qaytarılır ({ k, ... }) və klientdə AZ/EN/RU-ya çevrilir (public/js/why-i18n.js) — mətn HTML deyil, esc() ilə.
//
// Auditoriya sorğunun sərnişin tərkibindən: uşaq var → 'family' (ailə səbəbləri önə: CHD FREE, uşaq klubu,
// aquapark); 2 böyük → 'couple' (adults-only, SPA önə); 1 böyük → 'solo'; qalanı → 'group'.
// Hər səbəbin auditoriyaya görə balı var; ən yüksək ballı 4-ü (ən azı 2) göstərilir. Sıra deterministikdir.
const { applyMarkup } = require('./markup');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function audienceOf(pax) {
  const adults = parseInt(pax && pax.adults, 10) || 0;
  const children = parseInt(pax && pax.children, 10) || 0;
  if (children > 0) return 'family';
  if (adults === 2) return 'couple';
  if (adults === 1) return 'solo';
  return 'group';
}

const W = { // bal: [family, couple, solo, group]
  family: [100, 15, 10, 35], adultsOnly: [0, 95, 60, 45], spa: [25, 80, 45, 35], beach: [60, 75, 65, 65],
  lift: [55, 60, 60, 65], center: [45, 60, 70, 60], rating: [70, 72, 72, 72], cheapest: [88, 88, 88, 88],
  cancel: [62, 62, 62, 62], noPrepay: [40, 40, 40, 40], allInc: [58, 40, 35, 50], early: [32, 32, 32, 32], recommended: [30, 30, 30, 30],
  vsCheapest: [20, 20, 20, 20],
};
const AUD = { family: 0, couple: 1, solo: 2, group: 3 };
const ORDER = Object.keys(W);

// ctx: { audience, clientPrice, minClientPrice, count }
function reasonsFor(offer, ctx = {}) {
  const o = offer || {};
  const aud = AUD[ctx.audience] ?? AUD.group;
  const tags = Array.isArray(o.tags) ? o.tags : [];
  const attrs = Array.isArray(o.attrs) ? o.attrs : [];
  const loc = o.location && typeof o.location === 'object' ? o.location : {};
  const out = [];
  const add = (k, extra = {}, bonus = 0) => out.push({ k, ...extra, _s: W[k][aud] + bonus });

  const fam = [];
  if (attrs.includes('chdFree')) fam.push('chdFree');
  if (tags.includes('Uşaq klubu')) fam.push('kidsClub');
  if (tags.includes('Aquapark')) fam.push('aquapark');
  if (!fam.length && attrs.includes('family')) fam.push('familyHotel');
  if (fam.length && !attrs.includes('adultsOnly')) add('family', { items: fam.slice(0, 3) }, fam.length * 2);
  if (attrs.includes('adultsOnly') && ctx.audience !== 'family') add('adultsOnly');
  if (tags.includes('SPA')) add('spa');

  if (loc.kind === 'beach' && Number.isFinite(loc.line) && loc.line <= 2) {
    add('beach', { line: loc.line, m: Number.isFinite(loc.seaM) ? loc.seaM : null, own: tags.includes('Öz çimərliyi') }, loc.line === 1 ? 15 : -25);
  } else if (loc.kind === 'mountain' && Number.isFinite(loc.liftM) && loc.liftM <= 500) add('lift', { m: loc.liftM });
  else if (loc.kind === 'city' && Number.isFinite(loc.centerM) && loc.centerM <= 1500) add('center', { m: loc.centerM });

  const rating = Number(o.rating);
  if (o.rating != null && Number.isFinite(rating) && rating >= 8.5) {
    add('rating', { r: Math.round(rating * 10) / 10, word: typeof o.ratingWord === 'string' ? o.ratingWord : null, n: Number.isFinite(o.reviewCount) ? o.reviewCount : null }, (rating - 8.5) * 15);
  }

  const count = ctx.count || 0;
  if (count > 1 && Number.isFinite(ctx.clientPrice) && Number.isFinite(ctx.minClientPrice)) {
    if (ctx.clientPrice <= ctx.minClientPrice) add('cheapest');
    else add('vsCheapest', { d: ctx.clientPrice - ctx.minClientPrice });
  }
  if (DATE_RE.test(o.freeCancelUntil || '')) add('cancel', { d: o.freeCancelUntil });
  if (o.prepayment === 'none') add('noPrepay');
  if (['AI', 'UAI'].includes(o.board)) add('allInc', { board: o.board, flight: !!o.includesFlight });
  if (o.earlyBooking) add('early');
  if (attrs.includes('recommended')) add('recommended');

  const top = out.sort((a, b) => b._s - a._s || ORDER.indexOf(a.k) - ORDER.indexOf(b.k)).slice(0, 4).map(({ _s, ...r }) => r);
  // Ən azı 2 səbəb: güclü səbəb azdırsa — neytral faktlar (qida, aviabilet, ulduz)
  const fill = [
    o.board && !top.some((r) => r.k === 'allInc') ? { k: 'board', board: String(o.board).slice(0, 4) } : null,
    o.includesFlight && !top.some((r) => r.k === 'allInc' && r.flight) ? { k: 'flight' } : null,
    o.stars ? { k: 'stars', n: Math.min(5, Math.max(1, parseInt(o.stars, 10) || 1)) } : null,
  ].filter(Boolean);
  while (top.length < 2 && fill.length) top.push(fill.shift());
  return top;
}

// Seçim/təklif variantları üçün səbəblər (clientPrice serverdə hesablanıb)
function explainItems(entries, pax) {
  const audience = audienceOf(pax);
  const avail = entries.filter((e) => e.offer && Number.isFinite(e.clientPrice));
  const min = avail.length ? Math.min(...avail.map((e) => e.clientPrice)) : NaN;
  return entries.map((e) => (e.offer ? reasonsFor(e.offer, { audience, clientPrice: e.clientPrice, minClientPrice: min, count: avail.length }) : []));
}

// "Oxşar otellər": eyni istiqamət, ±1 ulduz, net qiyməti ±20% (ən yaxın seçilmiş variantla), seçilmişlərdən
// fərqli otel; hər otel üçün ən ucuz satışda olan təklif. Maks. `limit`. Qiymət — applyMarkup (eyni qaydalar).
function similarHotels(allOffers, pickedOffers, rules, { limit = 3, pax } = {}) {
  const picked = (pickedOffers || []).filter(Boolean);
  if (!picked.length || !Array.isArray(allOffers) || !allOffers.length) return [];
  const destOf = (o) => (o.destination && o.destination.id) || o.destinationId || '';
  const pickedIds = new Set(picked.map((o) => o.itemId));
  const bestByItem = new Map();
  for (const o of allOffers) {
    if (!o || o.itemType === 'tour' || o.stopSale || pickedIds.has(o.itemId) || !(Number(o.price) > 0)) continue;
    const cur = bestByItem.get(o.itemId);
    if (!cur || o.price < cur.price || (o.price === cur.price && o.id < cur.id)) bestByItem.set(o.itemId, o);
  }
  const scored = [];
  for (const o of bestByItem.values()) {
    let best = null;
    for (const p of picked) {
      if (destOf(p) !== destOf(o) || Math.abs((o.stars || 0) - (p.stars || 0)) > 1) continue;
      const rel = Math.abs(o.price - p.price) / p.price;
      if (rel > 0.2) continue;
      const score = rel + Math.abs((o.stars || 0) - (p.stars || 0)) * 0.05 - (Number(o.rating) || 0) * 0.002;
      if (!best || score < best) best = score;
    }
    if (best != null) scored.push({ o, score: best });
  }
  scored.sort((a, b) => a.score - b.score || (a.o.id < b.o.id ? -1 : 1));
  const audience = audienceOf(pax);
  return scored.slice(0, limit).map(({ o }) => ({
    name: String(o.name || '').slice(0, 120),
    stars: Math.min(5, Math.max(0, parseInt(o.stars, 10) || 0)),
    destination: String((o.destination && o.destination.name) || '').slice(0, 80),
    district: String(o.district || '').slice(0, 80),
    rating: Number.isFinite(Number(o.rating)) && o.rating != null ? Math.round(Number(o.rating) * 10) / 10 : null,
    checkIn: DATE_RE.test(o.checkIn || '') ? o.checkIn : '',
    nights: Math.min(28, Math.max(0, parseInt(o.nights, 10) || 0)),
    board: String(o.board || '').slice(0, 4),
    boardLabel: String(o.boardLabel || '').slice(0, 40),
    includesFlight: !!o.includesFlight,
    clientPrice: applyMarkup(o, rules),
    why: reasonsFor(o, { audience }).filter((r) => r.k !== 'vsCheapest' && r.k !== 'cheapest').slice(0, 2),
    // operator adı, net qiymət, təklif id-si müştəriyə GÖNDƏRİLMİR
  }));
}

module.exports = { audienceOf, reasonsFor, explainItems, similarHotels };
