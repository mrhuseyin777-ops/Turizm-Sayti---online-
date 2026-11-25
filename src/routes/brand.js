// B2B: agentlik brend profili, çevik komissiya qaydaları və qaydalarla hesablanmış B2B axtarışı.
//   GET    /api/b2b/brand          → brend profili (daxil olmuş istənilən istifadəçi — WhatsApp imzası üçün)
//   PUT    /api/b2b/brand          { displayName, color, phone, whatsapp, licenseNo, address, website } — YALNIZ admin
//   POST   /api/b2b/brand/logo     { data: base64 } — YALNIZ admin; PNG/JPEG/WebP (magic byte), maks. 200 KB
//   DELETE /api/b2b/brand/logo     — YALNIZ admin
//   GET    /api/b2b/markup         → { config, active, options, canEdit }
//   PUT    /api/b2b/markup         { enabled, defaultPct, fixed, minMargin, rounding, rules[] } — YALNIZ admin
//   GET    /api/b2b/search?…       → /api/search ilə eyni + qaydalar aktivdirsə hər təklifdə clientPrice (serverdə)
//   GET    /a/:publicId/logo       → loqo (public; publicId təsadüfidir, agentlik id-si deyil)
// Hamısında agentlik SESSİYADAN götürülür (IDOR yoxdur); dəyişənlərdə CSRF token + Origin (server.js).
const express = require('express');
const { requireAuth, requireCsrf } = require('../auth');
const { rateLimit } = require('../security/rateLimit');
const { sanitizeBody } = require('../security/http');
const { search, hotelOffers, QueryError } = require('../search');
const brand = require('../brand');
const markup = require('../markup');
const storage = require('../storage');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.user.role !== 'admin') return res.status(403).json({ error: 'Bu əməliyyat yalnız agentlik administratoru üçündür' });
  next();
}
const by = (req) => String(req.auth.user.displayName || req.auth.user.username).slice(0, 80);
const fail = (res, e, next) => {
  if (e instanceof brand.BrandError || e instanceof markup.MarkupError) return res.status(400).json({ error: e.message });
  return next(e);
};
const view = async (req) => brand.adminView(await brand.getBrand(req.auth.agency.id), req.auth.agency.name, req.auth.user);

// ---------------------------------------------------------------- Brend
router.get('/api/b2b/brand', requireAuth, async (req, res, next) => {
  try { res.json(await view(req)); } catch (e) { next(e); }
});

const brandLimit = rateLimit({ name: 'brand', windowMs: 10 * 60 * 1000, max: 60, key: (req) => req.auth.user.id, message: 'Çox sayda dəyişiklik. Bir az sonra yenidən cəhd edin.' });
router.put('/api/b2b/brand', requireAuth, requireCsrf, requireAdmin, brandLimit, async (req, res, next) => {
  try {
    await brand.saveBrand(req.auth.agency.id, req.body, { by: by(req) });
    console.info('[b2b] brend profili yeniləndi', { agency: req.auth.agency.id, user: req.auth.user.id });
    res.json({ ok: true, brand: await view(req) });
  } catch (e) { fail(res, e, next); }
});

// Body YALNIZ autentifikasiya + CSRF + admin yoxlamasından sonra parse olunur (server.js qlobal 16 KB parser-i bu yolu ötürür)
const logoBody = express.json({ limit: '280kb', strict: true, type: 'application/json' });
const logoLimit = rateLimit({ name: 'brand-logo', windowMs: 10 * 60 * 1000, max: 20, key: (req) => req.auth.user.id, message: 'Çox sayda yükləmə. Bir az sonra yenidən cəhd edin.' });
router.post('/api/b2b/brand/logo', requireAuth, requireCsrf, requireAdmin, logoLimit, logoBody, sanitizeBody, async (req, res, next) => {
  try {
    const rec = await brand.saveLogo(req.auth.agency.id, req.body, { by: by(req) });
    console.info('[b2b] loqo yükləndi', { agency: req.auth.agency.id, user: req.auth.user.id, mime: rec.logo.mime, size: rec.logo.size });
    res.status(201).json({ ok: true, brand: await view(req) });
  } catch (e) { fail(res, e, next); }
});

router.delete('/api/b2b/brand/logo', requireAuth, requireCsrf, requireAdmin, brandLimit, async (req, res, next) => {
  try {
    await brand.removeLogo(req.auth.agency.id, { by: by(req) });
    res.json({ ok: true, brand: await view(req) });
  } catch (e) { next(e); }
});

// Public loqo. Content-Type serverdə magic byte ilə təyin olunub (klientdən yox), nosniff (qlobal),
// sandbox CSP — fayl birbaşa açılsa belə heç nə icra olunmur. ?v=<hash> uyğundursa uzunmüddətli keş.
router.get('/a/:publicId/logo', async (req, res, next) => {
  try {
    if (!brand.PUBLIC_ID_RE.test(req.params.publicId)) return res.status(404).json({ error: 'Tapılmadı' });
    const logo = await storage.get().agencyBrand.getLogo(req.params.publicId);
    if (!logo) return res.status(404).json({ error: 'Tapılmadı' });
    const etag = `"${logo.sha256.slice(0, 32)}"`;
    const versioned = typeof req.query.v === 'string' && req.query.v === logo.sha256.slice(0, 8);
    res.set({
      'Content-Type': logo.mime,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'Content-Disposition': `inline; filename="logo.${logo.mime.split('/')[1]}"`,
      'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
      ETag: etag,
      'X-Robots-Tag': 'noindex',
    });
    if (req.get('if-none-match') === etag) return res.status(304).end();
    res.send(Buffer.from(logo.bytes));
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------- Komissiya qaydaları
async function markupView(req) {
  const rec = await storage.get().agencyMarkup.get(req.auth.agency.id);
  const config = rec ? { ...markup.DEFAULTS, ...rec.config } : { ...markup.DEFAULTS, rules: [] };
  return {
    config,
    active: !!(rec && rec.config && rec.config.enabled),
    updatedAt: rec ? rec.updatedAt : null,
    updatedBy: rec ? rec.updatedBy : null,
    canEdit: req.auth.user.role === 'admin',
    options: markup.options(),
  };
}

router.get('/api/b2b/markup', requireAuth, async (req, res, next) => {
  try { res.json(await markupView(req)); } catch (e) { next(e); }
});

router.put('/api/b2b/markup', requireAuth, requireCsrf, requireAdmin, brandLimit, async (req, res, next) => {
  try {
    const config = markup.validateConfig(req.body);
    await storage.get().agencyMarkup.set(req.auth.agency.id, { config, updatedBy: by(req) });
    console.info('[b2b] komissiya qaydaları yeniləndi', { agency: req.auth.agency.id, user: req.auth.user.id, rules: config.rules.length, enabled: config.enabled });
    res.json({ ok: true, ...(await markupView(req)) });
  } catch (e) { fail(res, e, next); }
});

// ---------------------------------------------------------------- B2B axtarış (qaydalarla müştəri qiyməti)
const searchLimit = rateLimit({ name: 'b2b-search', windowMs: 60 * 1000, max: 60, key: (req) => req.auth.user.id });
router.get('/api/b2b/search', requireAuth, searchLimit, async (req, res, next) => {
  try {
    const r = await search(req.query);
    const pr = await markup.pricingFor(req.auth.agency.id);
    if (!pr.active) return res.json({ ...r, pricing: { active: false } });
    res.json({ ...markup.annotateSearch(r, pr.rules), pricing: { active: true } });
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// B2B "Otel üzrə müqayisə": bir otelin bütün operatorlardakı təklifləri + agentliyin komissiya qaydaları ilə
// müştəri qiyməti (clientPrice) serverdə. Qaydalar aktiv deyilsə klientdəki % istifadə olunur.
router.get('/api/b2b/hotels/:id/offers', requireAuth, searchLimit, async (req, res, next) => {
  try {
    const r = await hotelOffers(req.params.id, req.query);
    if (!r) return res.status(404).json({ error: 'Otel tapılmadı' });
    const pr = await markup.pricingFor(req.auth.agency.id);
    if (!pr.active) return res.json({ ...r, pricing: { active: false } });
    const out = structuredClone(r);
    for (const o of out.rows) o.clientPrice = markup.applyMarkup(o, pr.rules);
    res.json({ ...out, pricing: { active: true } });
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

module.exports = router;
