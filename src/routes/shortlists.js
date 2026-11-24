// B2B "Seçilmişlər" (shortlist) API. Hamısı: daxil olmuş agentlik istifadəçisi (requireAuth);
// vəziyyəti dəyişənlər əlavə olaraq X-CSRF-Token (requireCsrf) + Origin yoxlaması (server.js).
// Agentlik HƏMİŞƏ sessiyadan götürülür — başqa agentliyin qeydinə müraciət 404 qaytarır (IDOR).
//   GET    /api/b2b/shortlist                 → { items, limits }
//   POST   /api/b2b/shortlist                 { client, query, offerId } → 201 { item } (artıq varsa 200)
//   PATCH  /api/b2b/shortlist/:id             { client } → { item }
//   DELETE /api/b2b/shortlist/:id             → { ok }
//   POST   /api/b2b/shortlist/:id/refresh     → { item, changed, previous } — qiymət serverdə yenidən yoxlanılır
//   POST   /api/b2b/shortlist/quote           { client | ids, markup } → çap/PDF üçün (operator və net GİZLİ)
//   POST   /api/b2b/shortlist/selection       { client | ids, markup, message } → 201 { url: /s/<id> }
const express = require('express');
const { requireAuth, requireCsrf } = require('../auth');
const { rateLimit } = require('../security/rateLimit');
const { InputError } = require('../leads');
const sl = require('../shortlists');

const router = express.Router();

const fail = (res, e, next) => {
  if (e instanceof InputError) return res.status(400).json({ error: e.message });
  return next(e);
};
const NOT_FOUND = { error: 'Variant tapılmadı' };
const account = (req) => ({ agencyId: req.auth.agency.id, agencyName: req.auth.agency.name, managerName: req.auth.user.displayName, userId: req.auth.user.id });
// Provayderlərə sorğu gedən əməliyyatlar (əlavə, yenilə, təklif, link) — istifadəçi üzrə limit
const heavy = rateLimit({ name: 'shortlist', windowMs: 10 * 60 * 1000, max: 200, key: (req) => req.auth.user.id });

router.get('/api/b2b/shortlist', requireAuth, async (req, res, next) => {
  try {
    res.json({ items: await sl.listShortlist(req.auth.agency.id), limits: { perAgency: sl.LIMITS.perAgency, perClient: sl.LIMITS.perClient } });
  } catch (e) { next(e); }
});

router.post('/api/b2b/shortlist', requireAuth, requireCsrf, heavy, async (req, res, next) => {
  try {
    const { item, existed } = await sl.addToShortlist(req.body, { account: account(req) });
    res.status(existed ? 200 : 201).json({ ok: true, item, existed });
  } catch (e) { fail(res, e, next); }
});

// Statik yollar (:id-dən əvvəl)
router.post('/api/b2b/shortlist/quote', requireAuth, requireCsrf, heavy, async (req, res, next) => {
  try {
    const q = await sl.buildQuote(req.body, { account: account(req) });
    if (!q) return res.status(404).json(NOT_FOUND);
    res.json(q);
  } catch (e) { fail(res, e, next); }
});

router.post('/api/b2b/shortlist/selection', requireAuth, requireCsrf, heavy, async (req, res, next) => {
  try {
    const sel = await sl.selectionFromShortlist(req.body, { account: account(req) });
    if (!sel) return res.status(404).json(NOT_FOUND);
    res.status(201).json({ ok: true, id: sel.id, url: `/s/${sel.id}` });
  } catch (e) { fail(res, e, next); }
});

router.patch('/api/b2b/shortlist/:id', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    const item = await sl.updateShortlistItem(req.auth.agency.id, req.params.id, req.body);
    if (!item) return res.status(404).json(NOT_FOUND);
    res.json({ ok: true, item });
  } catch (e) { fail(res, e, next); }
});

router.delete('/api/b2b/shortlist/:id', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    if (!(await sl.removeShortlistItem(req.auth.agency.id, req.params.id))) return res.status(404).json(NOT_FOUND);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/api/b2b/shortlist/:id/refresh', requireAuth, requireCsrf, heavy, async (req, res, next) => {
  try {
    const r = await sl.refreshShortlistItem(req.auth.agency.id, req.params.id);
    if (!r) return res.status(404).json(NOT_FOUND);
    res.json({ ok: true, ...r });
  } catch (e) { fail(res, e, next); }
});

module.exports = router;
