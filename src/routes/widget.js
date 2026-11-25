// Agentlik vidjeti, B2C marketplace (tərəfdaş agentliklər) və müştərinin müraciət status səhifəsi.
//   GET  /w/:publicId                 → public/widget.html (iframe-ə yerləşdirilə bilər: frame-ancestors = 'self' + icazəli domenlər)
//   GET  /api/w/:publicId/config      → { agency: { name }, destinations }
//   GET  /api/w/:publicId/search      → ucuzdan bahalıya nəticələr (operator adı/net qiymət GİZLİ, agentlik komissiyası daxil)
//   POST /api/w/:publicId/leads       { name, phone, note, ref, query } → 201 { ok, statusUrl } (agentliyin "Müraciətlər"inə, source=widget)
//   GET  /api/partners                → marketplace-də görünən agentliklər: [{ id, name, city }] (ictimai id)
//   GET  /r/:token, GET /api/r/:token → müraciət statusu (maskalı şəxsi məlumat, noindex, Referrer-Policy: no-referrer)
//   GET  /api/b2b/widget              → vidjet + marketplace ayarları (yoxdursa publicId yaradılır)
//   PUT  /api/b2b/widget              { domains, markupPct, regenerate? } (X-CSRF-Token, YALNIZ admin)
//   PUT  /api/b2b/marketplace         { enabled, name, city, phone } (X-CSRF-Token, YALNIZ admin)
// Vidjet cookie/sessiya istifadə etmir (səhifə cookie oxumur, JS fetch credentials:'omit'); agentlik publicId-dən tapılır.
const express = require('express');
const path = require('path');
const { requireAuth, requireCsrf } = require('../auth');
const { rateLimit } = require('../security/rateLimit');
const { honeypot, cspForFrame } = require('../security/http');
const { InputError, leadStatusByToken, STATUS_TOKEN_RE } = require('../leads');
const W = require('../widget');
const storage = require('../storage');

const router = express.Router();
const PUBLIC = path.join(__dirname, '..', '..', 'public');
const NOT_FOUND = { error: 'Tapılmadı' };

const fail = (res, e, next) => {
  if (e instanceof InputError) return res.status(400).json({ error: e.message });
  return next(e);
};

// ---------------------------------------------------------------- Vidjet səhifəsi
const pageLimit = rateLimit({ name: 'widget-page', windowMs: 60 * 1000, max: 120 });
router.get('/w/:pid', pageLimit, async (req, res, next) => {
  try {
    const ctx = await W.resolveWidget(req.params.pid);
    if (!ctx) return res.status(404).json(NOT_FOUND); // frame-ancestors 'none' qalır
    // YALNIZ burada: framing istisnası. X-Frame-Options çıxarılır (ALLOW-FROM standart deyil, CSP əsasdır).
    res.removeHeader('X-Frame-Options');
    res.set({
      'Content-Security-Policy': cspForFrame(W.frameAncestors(ctx.widget.frameDomains)),
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer',
    });
    res.sendFile(path.join(PUBLIC, 'widget.html'));
  } catch (e) { next(e); }
});
// Statik fayl kimi birbaşa açılsa da framing-ə icazə yoxdur (default başlıqlar)

const ctxOr404 = async (req, res) => {
  const ctx = await W.resolveWidget(req.params.pid);
  if (!ctx) res.status(404).json(NOT_FOUND);
  return ctx;
};

router.get('/api/w/:pid/config', pageLimit, async (req, res, next) => {
  try {
    const ctx = await ctxOr404(req, res);
    if (!ctx) return;
    res.json({ agency: { name: ctx.agency.name }, destinations: W.DEST_LIST });
  } catch (e) { next(e); }
});

const searchLimit = rateLimit({ name: 'widget-search', windowMs: 60 * 1000, max: 30 });
router.get('/api/w/:pid/search', searchLimit, async (req, res, next) => {
  try {
    const ctx = await ctxOr404(req, res);
    if (!ctx) return;
    res.json(await W.widgetSearch(ctx, req.query));
  } catch (e) { fail(res, e, next); }
});

const leadLimit = rateLimit({ name: 'widget-leads', windowMs: 10 * 60 * 1000, max: 10 });
router.post('/api/w/:pid/leads', leadLimit, honeypot, async (req, res, next) => {
  try {
    const ctx = await ctxOr404(req, res);
    if (!ctx) return;
    const lead = await W.widgetLead(ctx, req.body);
    res.status(201).json({ ok: true, statusUrl: `/r/${lead.statusToken}` });
  } catch (e) { fail(res, e, next); }
});

// ---------------------------------------------------------------- Marketplace (B2C)
router.get('/api/partners', rateLimit({ name: 'partners', windowMs: 60 * 1000, max: 60 }), async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json({ partners: await W.listPartners() });
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------- Müraciət statusu
const statusLimit = rateLimit({ name: 'lead-status', windowMs: 60 * 1000, max: 30 });
const statusHeaders = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };
router.get('/r/:token', statusLimit, async (req, res, next) => {
  try {
    res.set(statusHeaders);
    if (!STATUS_TOKEN_RE.test(req.params.token) || !(await leadStatusByToken(req.params.token))) return res.status(404).json(NOT_FOUND);
    res.sendFile(path.join(PUBLIC, 'r.html'), { headers: statusHeaders });
  } catch (e) { next(e); }
});
router.get('/api/r/:token', statusLimit, async (req, res, next) => {
  try {
    res.set(statusHeaders);
    const v = await leadStatusByToken(req.params.token);
    if (!v) return res.status(404).json({ error: 'Müraciət tapılmadı' });
    res.json(v);
  } catch (e) { next(e); }
});

// ---------------------------------------------------------------- B2B ayarları (Vidjet, Marketplace)
function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.user.role !== 'admin') return res.status(403).json({ error: 'Bu əməliyyat yalnız agentlik administratoru üçündür' });
  next();
}
const by = (user) => String(user.displayName || user.username).slice(0, 80);
const editLimit = rateLimit({ name: 'widget-edit', windowMs: 60 * 1000, max: 30, key: (req) => req.auth.user.id });

router.get('/api/b2b/widget', requireAuth, async (req, res, next) => {
  try {
    const { agency, user } = req.auth;
    res.json(W.widgetView(await W.getOrCreateWidget(agency.id, by(user)), user));
  } catch (e) { next(e); }
});

router.put('/api/b2b/widget', requireAuth, requireCsrf, requireAdmin, editLimit, async (req, res, next) => {
  try {
    const { agency, user } = req.auth;
    const patch = W.validateWidgetPatch(req.body);
    await W.getOrCreateWidget(agency.id, by(user));
    const w = await storage.get().widgets.upsert(agency.id, { ...patch, updatedBy: by(user) });
    console.info('[b2b] vidjet ayarları yeniləndi', { agency: agency.id, user: user.id, domains: w.frameDomains.length, regenerated: !!patch.publicId });
    res.json({ ok: true, widget: W.widgetView(w, user) });
  } catch (e) { fail(res, e, next); }
});

router.put('/api/b2b/marketplace', requireAuth, requireCsrf, requireAdmin, editLimit, async (req, res, next) => {
  try {
    const { agency, user } = req.auth;
    await W.getOrCreateWidget(agency.id, by(user));
    const w = await W.saveMarket(agency.id, req.body, by(user));
    console.info('[b2b] marketplace profili yeniləndi', { agency: agency.id, user: user.id, enabled: w.marketEnabled });
    res.json({ ok: true, widget: W.widgetView(w, user) });
  } catch (e) { fail(res, e, next); }
});

module.exports = router;
