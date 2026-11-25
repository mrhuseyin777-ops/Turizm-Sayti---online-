// Çevik komissiya qaydaları (B2B → Ayarlar → Komissiya). Müştəri qiyməti HƏR YERDƏ (B2B axtarış, ən ucuz panel,
// matris, seçilmişlər, seçim linki, çap təklifi) yalnız bu fayldakı applyMarkup(offer, rules) ilə hesablanır.
//
// Konfiqurasiya (agentlik üzrə, storage.agencyMarkup):
//   { enabled, defaultPct, fixed, minMargin, rounding, rules: [{ providerId?, destinationId?, priceType?, productType?, pct, fixed? }] }
//   - defaultPct  — heç bir qayda uyğun gəlməyəndə % (0–100)
//   - fixed       — hər təklifə sabit ₼ əlavə (qaydanın öz `fixed`-i varsa, o üstündür)
//   - minMargin   — minimum marja ₼: (% + sabit) bundan azdırsa, marja = minMargin
//   - rounding    — 0 (yox: adi yuvarlaqlaşdırma), 1 / 5 / 10 ₼-a YUXARI
//
// Qayda prioriteti — "ən spesifik qalib gəlir":
//   1) Təklifə uyğun gələn qaydalar arasında ən çox kriteriyası (operator, istiqamət, qiymət növü, məhsul tipi)
//      göstərilmiş qayda seçilir (4 kriteriyalı > 3 > 2 > 1).
//   2) Bərabər spesifiklikdə çəki: operator (8) > istiqamət (4) > qiymət növü (2) > məhsul tipi (1) — məs.
//      "operator=X" qaydası "istiqamət=Y" qaydasından üstündür.
//   3) Yenə bərabərdirsə — siyahıda YUXARIDA olan qayda.
//   Heç biri uyğun gəlmirsə — defaultPct.
//
// Hesab: marja = net × % / 100 + sabit; marja < minMargin → marja = minMargin; qiymət = net + marja;
//        rounding=0 → Math.round, əks halda step-ə yuxarı (ceil). Qaydasız (yalnız %) nəticə köhnə düsturla
//        (Math.round(net × (1 + %/100))) eynidir — klientdəki tək % sahəsi ilə uyğunluq.
const { providers } = require('./providers');
const { destinations } = require('./data/catalog');

class MarkupError extends Error {}

const PRICE_TYPES = ['EB', 'SPO', 'STD'];
const PRODUCT_TYPES = ['package', 'hotel', 'tour'];
const ROUNDING = [0, 1, 5, 10];
const LIMITS = { rules: 50, pct: 100, fixed: 10000, minMargin: 10000 };
const CRITERIA = [['providerId', 8], ['destinationId', 4], ['priceType', 2], ['productType', 1]];

const PROVIDER_IDS = new Set(providers.map((p) => p.id));
const DEST_IDS = new Set(destinations.map((d) => d.id));

const DEFAULTS = Object.freeze({ enabled: false, defaultPct: 0, fixed: 0, minMargin: 0, rounding: 0, rules: [] });

// Təklifin qayda atributları (axtarış təklifi, seçilmişlər qeydi və ya snapshot — hamısı dəstəklənir)
function offerAttrs(o) {
  const x = o || {};
  const net = Number(x.price ?? x.netPrice);
  const destinationId = typeof x.destinationId === 'string' ? x.destinationId : (x.destination && typeof x.destination.id === 'string' ? x.destination.id : '');
  const priceType = PRICE_TYPES.includes(x.priceType) ? x.priceType : (x.earlyBooking ? 'EB' : 'STD');
  const productType = PRODUCT_TYPES.includes(x.productType) ? x.productType
    : x.itemType === 'tour' ? 'tour' : x.includesFlight ? 'package' : 'hotel';
  return { net, providerId: typeof x.providerId === 'string' ? x.providerId : '', destinationId, priceType, productType };
}

const num = (v, max, label) => {
  const n = v === '' || v == null ? 0 : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > max) throw new MarkupError(`${label}: 0–${max} aralığında rəqəm olmalıdır`);
  return Math.round(n * 100) / 100;
};

// Klientdən gələn konfiqurasiyanın ciddi validasiyası (ağ siyahı sahələr, məlum operator/istiqamət id-ləri)
function validateConfig(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new MarkupError('Sorğu formatı düzgün deyil');
  const allowed = ['enabled', 'defaultPct', 'fixed', 'minMargin', 'rounding', 'rules'];
  if (Object.keys(b).some((k) => !allowed.includes(k))) throw new MarkupError('İcazə verilməyən sahə(lər)');
  const rounding = Number(b.rounding ?? 0);
  if (!ROUNDING.includes(rounding)) throw new MarkupError('Yuvarlaqlaşdırma: 0, 1, 5 və ya 10 olmalıdır');
  const rulesIn = b.rules == null ? [] : b.rules;
  if (!Array.isArray(rulesIn)) throw new MarkupError('Qaydalar siyahı olmalıdır');
  if (rulesIn.length > LIMITS.rules) throw new MarkupError(`Maksimum ${LIMITS.rules} qayda`);
  const seen = new Set();
  const rules = rulesIn.map((r, i) => {
    const n = i + 1;
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new MarkupError(`Qayda ${n}: format düzgün deyil`);
    if (Object.keys(r).some((k) => !['providerId', 'destinationId', 'priceType', 'productType', 'pct', 'fixed'].includes(k))) throw new MarkupError(`Qayda ${n}: icazə verilməyən sahə`);
    const out = {};
    const pick = (k, ok, msg) => {
      const v = r[k];
      if (v === undefined || v === null || v === '') return;
      if (typeof v !== 'string' || !ok(v)) throw new MarkupError(`Qayda ${n}: ${msg}`);
      out[k] = v;
    };
    pick('providerId', (v) => PROVIDER_IDS.has(v), 'operator tapılmadı');
    pick('destinationId', (v) => DEST_IDS.has(v), 'istiqamət tapılmadı');
    pick('priceType', (v) => PRICE_TYPES.includes(v), 'qiymət növü EB, SPO və ya STD olmalıdır');
    pick('productType', (v) => PRODUCT_TYPES.includes(v), 'məhsul tipi package, hotel və ya tour olmalıdır');
    if (!CRITERIA.some(([k]) => k in out)) throw new MarkupError(`Qayda ${n}: ən azı bir kriteriya seçin (operator, istiqamət, qiymət növü, məhsul tipi)`);
    out.pct = num(r.pct, LIMITS.pct, `Qayda ${n}: %`);
    if (r.fixed !== undefined && r.fixed !== null && r.fixed !== '') out.fixed = num(r.fixed, LIMITS.fixed, `Qayda ${n}: sabit ₼`);
    const key = CRITERIA.map(([k]) => out[k] || '*').join('|');
    if (seen.has(key)) throw new MarkupError(`Qayda ${n}: eyni kriteriyalı qayda artıq var`);
    seen.add(key);
    return out;
  });
  return {
    enabled: b.enabled === undefined ? true : b.enabled === true,
    defaultPct: num(b.defaultPct, LIMITS.pct, 'Default %'),
    fixed: num(b.fixed, LIMITS.fixed, 'Sabit əlavə ₼'),
    minMargin: num(b.minMargin, LIMITS.minMargin, 'Minimum marja ₼'),
    rounding,
    rules,
  };
}

// Rəqəm (köhnə tək % sahəsi) və ya konfiqurasiya → normal qaydalar obyekti
function normalizeRules(rules) {
  if (typeof rules === 'number' || typeof rules === 'string' || rules == null) {
    const m = Number(rules ?? 0);
    return { ...DEFAULTS, defaultPct: Number.isFinite(m) ? Math.min(100, Math.max(0, m)) : 0, rules: [] };
  }
  return {
    enabled: !!rules.enabled,
    defaultPct: Number(rules.defaultPct) || 0,
    fixed: Number(rules.fixed) || 0,
    minMargin: Number(rules.minMargin) || 0,
    rounding: ROUNDING.includes(Number(rules.rounding)) ? Number(rules.rounding) : 0,
    rules: Array.isArray(rules.rules) ? rules.rules : [],
  };
}

// Uyğun gələn ən spesifik qayda (yuxarıdakı prioritet), yoxdursa null
function matchRule(attrs, rules) {
  let best = null;
  rules.forEach((r, index) => {
    let count = 0;
    let weight = 0;
    for (const [k, w] of CRITERIA) {
      if (!r[k]) continue;
      if (r[k] !== attrs[k]) return;
      count++;
      weight += w;
    }
    if (!count) return;
    if (!best || count > best.count || (count === best.count && weight > best.weight)) best = { rule: r, index, count, weight };
  });
  return best;
}

// Ətraflı hesab: { net, clientPrice, margin, pct, fixed, ruleIndex (null = default), specificity }
function markupDetail(offer, rulesIn) {
  const R = normalizeRules(rulesIn);
  const a = offerAttrs(offer);
  if (!Number.isFinite(a.net) || a.net <= 0) return { net: a.net, clientPrice: NaN, margin: NaN, pct: 0, fixed: 0, ruleIndex: null, specificity: 0 };
  const m = matchRule(a, R.rules);
  const pct = m ? Number(m.rule.pct) || 0 : R.defaultPct;
  const fixed = m && m.rule.fixed != null ? Number(m.rule.fixed) || 0 : R.fixed;
  let raw = a.net * (1 + pct / 100) + fixed;
  if (raw - a.net < R.minMargin) raw = a.net + R.minMargin;
  const clientPrice = R.rounding ? Math.ceil(Math.round(raw * 100) / 100 / R.rounding) * R.rounding : Math.round(raw);
  return { net: a.net, clientPrice, margin: clientPrice - a.net, pct, fixed, ruleIndex: m ? m.index : null, specificity: m ? m.count : 0 };
}

// Tək mənbə: müştəri qiyməti (AZN, tam ədəd)
const applyMarkup = (offer, rules) => markupDetail(offer, rules).clientPrice;

// Agentliyin qüvvədə olan qaydaları: aktiv konfiqurasiya varsa o, yoxdursa klientin tək % sahəsi (fallback)
async function pricingFor(agencyId, fallbackPct = 0, { store } = {}) {
  let cfg = null;
  if (typeof agencyId === 'string' && agencyId) {
    const repo = store || require('./storage').get().agencyMarkup;
    cfg = repo ? await repo.get(agencyId) : null;
  }
  if (cfg && cfg.config && cfg.config.enabled) return { active: true, rules: normalizeRules(cfg.config) };
  return { active: false, rules: normalizeRules(fallbackPct) };
}

// Axtarış nəticəsinə (klon üzərində) clientPrice yaz: offers, groups[].best, groups[].providers
function annotateSearch(result, rules) {
  const r = structuredClone(result); // provayder keşindəki obyektlər dəyişməsin (agentliklər arasında sızma yox)
  const put = (o) => { if (o && typeof o === 'object') o.clientPrice = applyMarkup(o, rules); };
  (r.offers || []).forEach(put);
  for (const g of r.groups || []) { put(g.best); (g.providers || []).forEach(put); }
  return r;
}

// Ayarlar UI üçün seçimlər
const options = () => ({
  providers: providers.map((p) => ({ id: p.id, name: p.name })),
  destinations: destinations.map((d) => ({ id: d.id, name: d.name, country: d.country })),
  priceTypes: PRICE_TYPES, productTypes: PRODUCT_TYPES, rounding: ROUNDING, limits: LIMITS,
});

module.exports = {
  MarkupError, PRICE_TYPES, PRODUCT_TYPES, ROUNDING, LIMITS, DEFAULTS,
  applyMarkup, markupDetail, normalizeRules, validateConfig, matchRule, offerAttrs, pricingFor, annotateSearch, options,
};
