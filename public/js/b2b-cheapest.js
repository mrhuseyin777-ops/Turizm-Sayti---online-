// B2B "Ən ucuz təklif" məntiqi — DOM-suz, təmiz funksiyalar. Brauzerdə window.B2BCheapest kimi,
// Node testlərində require() ilə yüklənir (test/b2b-cheapest.test.js).
//
// Qaydalar:
//  - Namizədlər: düz siyahı (offers) + hər otelin hər operator üzrə ən ucuz təklifi (groups[].providers).
//    Düz siyahı 1000-lik limitlə kəsilə bilər — qruplar isə bütün otelləri əhatə edir.
//  - Stop-sale təkliflər satıla bilmədiyi üçün "ən ucuz" seçilmir (hamısı stop-sale olanda — istisna).
//  - Bərabər qiymətdə sıra deterministikdir (id üzrə), nəticə hər dəfə eynidir.
//  - "İkinci ən ucuz" = başqa otel VƏ YA başqa operator (eyni otelin eyni operatordakı başqa otağı yox),
//    çünki menecer üçün mənalı müqayisə alternativ variantla olur.
//  - Operatorun "neçə oteldə ən ucuz" sayı matrisdəki yaşıl xana ilə eynidir (group.best).
/* global module */
(function (root) {
  'use strict';

  const STAR_CLASSES = [3, 4, 5];

  const byPrice = (a, b) => a.price - b.price || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const validOffer = (o) => o && typeof o.id === 'string' && Number.isFinite(Number(o.price)) && Number(o.price) > 0;

  // Komissiya ilə müştəri qiyməti (server src/leads.js ilə eyni düstur)
  function clientPrice(net, markup) {
    const m = Math.min(100, Math.max(0, Number(markup) || 0));
    return Math.round(Number(net) * (1 + m / 100));
  }

  function candidates(offers, groups) {
    const seen = new Map();
    const add = (o) => { if (validOffer(o) && !seen.has(o.id)) seen.set(o.id, o); };
    (Array.isArray(offers) ? offers : []).forEach(add);
    for (const g of Array.isArray(groups) ? groups : []) {
      (Array.isArray(g.providers) ? g.providers : []).forEach(add);
      add(g.best);
    }
    return [...seen.values()];
  }

  // Bütün nəticə üzrə xülasə: ən ucuz, ikinci ən ucuz, ulduz və operator üzrə ən ucuzlar, operator "qələbələri"
  function cheapestSummary({ offers, groups } = {}) {
    const all = candidates(offers, groups).sort(byPrice);
    const sellable = all.filter((o) => !o.stopSale);
    const pool = sellable.length ? sellable : all;
    const best = pool[0] || null;
    const second = best ? pool.find((o) => o.itemId !== best.itemId || o.providerId !== best.providerId) || null : null;

    const byStars = {};
    for (const s of STAR_CLASSES) byStars[s] = pool.find((o) => Number(o.stars) === s) || null;

    const byOperator = [];
    const opSeen = new Set();
    for (const o of pool) {
      if (opSeen.has(o.providerId)) continue;
      opSeen.add(o.providerId);
      byOperator.push(o);
    }

    return {
      best,
      second,
      diff: best && second ? second.price - best.price : null,
      byStars,
      byOperator,
      wins: operatorWins(groups),
      excludedStopSale: all.length - sellable.length,
      total: all.length,
    };
  }

  // Hər operator neçə oteldə ən ucuzdur (group.best — matrisdə yaşıl xana)
  function operatorWins(groups) {
    const wins = {};
    for (const g of Array.isArray(groups) ? groups : []) {
      const b = g && g.best;
      if (!b || !b.providerId) continue;
      wins[b.providerId] = (wins[b.providerId] || 0) + 1;
    }
    return wins;
  }

  // Default sıralama: otellər ən ucuz təklifinə görə (bərabərdə ada görə), təkliflər qiymətə görə
  function sortGroupsByPrice(groups) {
    return [...(Array.isArray(groups) ? groups : [])].sort((a, b) => a.best.price - b.best.price || String(a.name).localeCompare(String(b.name)));
  }
  function sortOffersByPrice(offers) {
    return [...(Array.isArray(offers) ? offers : [])].sort(byPrice);
  }

  // Matrisdə 🏆 xanası: ən ucuz təklifin oteli + operatoru
  const isBestCell = (summary, itemId, providerId) => !!(summary && summary.best && summary.best.itemId === itemId && summary.best.providerId === providerId);

  // Seçilmişlər siyahısını müştəri adı / sorğu № üzrə qruplaşdır (ən yeni qrup yuxarıda, qrup daxilində ucuzdan bahaya)
  function groupShortlist(items) {
    const map = new Map();
    for (const it of Array.isArray(items) ? items : []) {
      const key = it.client || '';
      if (!map.has(key)) map.set(key, { client: key, items: [], lastAt: 0 });
      const g = map.get(key);
      g.items.push(it);
      g.lastAt = Math.max(g.lastAt, Date.parse(it.createdAt) || 0);
    }
    const out = [...map.values()];
    for (const g of out) g.items.sort((a, b) => a.netPrice - b.netPrice || (a.id < b.id ? -1 : 1));
    return out.sort((a, b) => b.lastAt - a.lastAt || a.client.localeCompare(b.client));
  }

  // Qiymət dəyişikliyi: 'up' | 'down' | null
  function priceTrend(item) {
    if (!item || item.prevNetPrice == null || item.prevNetPrice === item.netPrice) return null;
    return item.netPrice > item.prevNetPrice ? 'up' : 'down';
  }

  const api = { clientPrice, cheapestSummary, operatorWins, sortGroupsByPrice, sortOffersByPrice, isBestCell, groupShortlist, priceTrend, STAR_CLASSES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.B2BCheapest = api;
})(typeof window !== 'undefined' ? window : globalThis);
