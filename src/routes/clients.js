// B2B müştəri bazası və tövsiyə olunan otel siyahıları API. Hamısı: daxil olmuş agentlik istifadəçisi (requireAuth);
// vəziyyəti dəyişənlər əlavə olaraq X-CSRF-Token (requireCsrf) + Origin yoxlaması və JSON tələbi (server.js).
// Agentlik HƏMİŞƏ sessiyadan götürülür — başqa agentliyin müştərisi/siyahısı 404 (IDOR, mövcudluq sızmır).
//   GET    /api/b2b/clients[?q=]              → { clients, limits }
//   POST   /api/b2b/clients                   { name, phone?, email?, adults?, childAges?, budget?, destinations?, board?, note? } → 201
//   GET    /api/b2b/clients/:id               → { client, searches, shortlist, selections, leads } (kart + tarixçə)
//   PATCH  /api/b2b/clients/:id               { ...sahələr } → { client }
//   DELETE /api/b2b/clients/:id               → "Unut": kart silinir, əlaqəli şəxsi məlumat anonimləşdirilir
//   POST   /api/b2b/clients/:id/searches      { query } → { searches } (kartdakı son axtarışlar)
//   GET    /api/b2b/hotel-lists               → { lists, limits }
//   POST   /api/b2b/hotel-lists               { name, hotel? } → 201 { list }
//   PATCH  /api/b2b/hotel-lists/:id           { name? | addHotel? | removeHotel? } → { list, existed }
//   DELETE /api/b2b/hotel-lists/:id           → { ok }
const express = require('express');
const { requireAuth, requireCsrf } = require('../auth');
const { rateLimit } = require('../security/rateLimit');
const { InputError } = require('../leads');
const cl = require('../clients');
const hl = require('../hotelLists');

const router = express.Router();

const fail = (res, e, next) => (e instanceof InputError ? res.status(400).json({ error: e.message }) : next(e));
const NO_CLIENT = { error: 'Müştəri tapılmadı' };
const NO_LIST = { error: 'Siyahı tapılmadı' };
const by = (req) => req.auth.user.displayName || req.auth.user.username;
// Yazma əməliyyatları — istifadəçi üzrə limit (kütləvi yaratma / skript qarşısı)
const writeLimit = rateLimit({ name: 'crm-write', windowMs: 10 * 60 * 1000, max: 300, key: (req) => req.auth.user.id });

// ---------------------------------------------------------------- Müştərilər
router.get('/api/b2b/clients', requireAuth, async (req, res, next) => {
  try {
    res.json({ clients: await cl.listClients(req.auth.agency.id, { q: req.query.q }), limits: { perAgency: cl.LIMITS.perAgency, retentionDays: cl.LIMITS.retentionDays } });
  } catch (e) { next(e); }
});

router.post('/api/b2b/clients', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    res.status(201).json({ ok: true, client: await cl.createClient(req.auth.agency.id, req.body, { by: by(req) }) });
  } catch (e) { fail(res, e, next); }
});

router.get('/api/b2b/clients/:id', requireAuth, async (req, res, next) => {
  try {
    const h = await cl.clientHistory(req.auth.agency.id, req.params.id);
    if (!h) return res.status(404).json(NO_CLIENT);
    res.json(h);
  } catch (e) { next(e); }
});

router.patch('/api/b2b/clients/:id', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    const c = await cl.updateClient(req.auth.agency.id, req.params.id, req.body);
    if (!c) return res.status(404).json(NO_CLIENT);
    res.json({ ok: true, client: c });
  } catch (e) { fail(res, e, next); }
});

router.delete('/api/b2b/clients/:id', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    const r = await cl.forgetClient(req.auth.agency.id, req.params.id);
    if (!r) return res.status(404).json(NO_CLIENT);
    res.json({ ok: true, anonymized: { shortlist: r.shortlist, selections: r.selections, leads: r.leads } });
  } catch (e) { next(e); }
});

router.post('/api/b2b/clients/:id/searches', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    const b = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const s = await cl.logSearch(req.auth.agency.id, req.params.id, b.query);
    if (!s) return res.status(404).json(NO_CLIENT);
    res.json({ ok: true, searches: s });
  } catch (e) { fail(res, e, next); }
});

// ---------------------------------------------------------------- Otel siyahıları
router.get('/api/b2b/hotel-lists', requireAuth, async (req, res, next) => {
  try {
    res.json({ lists: await hl.listHotelLists(req.auth.agency.id), limits: { perAgency: hl.LIMITS.perAgency, hotelsPerList: hl.LIMITS.hotelsPerList } });
  } catch (e) { next(e); }
});

router.post('/api/b2b/hotel-lists', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    res.status(201).json({ ok: true, list: await hl.createHotelList(req.auth.agency.id, req.body, { by: by(req) }) });
  } catch (e) { fail(res, e, next); }
});

router.patch('/api/b2b/hotel-lists/:id', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    const r = await hl.updateHotelList(req.auth.agency.id, req.params.id, req.body);
    if (!r) return res.status(404).json(NO_LIST);
    res.json({ ok: true, ...r });
  } catch (e) { fail(res, e, next); }
});

router.delete('/api/b2b/hotel-lists/:id', requireAuth, requireCsrf, writeLimit, async (req, res, next) => {
  try {
    if (!(await hl.deleteHotelList(req.auth.agency.id, req.params.id))) return res.status(404).json(NO_LIST);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
