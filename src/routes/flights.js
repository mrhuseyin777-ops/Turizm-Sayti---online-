// Aviabilet modulu API-si (server.js tərəfindən avtomatik qoşulur).
//   GET    /api/flights/airports?q=&lang=   — avtomatik tamamlama
//   GET    /api/flights/search?...          — axtarış (bax: src/flights/search.js -> parseQuery)
//   GET    /api/flights/calendar?...&month= — ay təqvimi (hər gün üçün ən ucuz qiymət)
//   GET    /api/flights/explore?from=&...   — "Hara uça bilərəm?" (bütün istiqamətlər, təxmini)
//   POST   /api/flights/requests            — "Bileti sifariş et" müraciəti
//   POST   /api/flights/alerts              — "Qiyməti izlə" (cavabda id + token, token yalnız bir dəfə)
//   GET    /api/flights/alerts/:id          — izləmənin vəziyyəti (X-Alert-Token başlığı)
//   DELETE /api/flights/alerts/:id          — izləməni sil ({ token } JSON body və ya X-Alert-Token)
const express = require('express');
const { searchAirports } = require('../flights/airports');
const { searchFlights, monthCalendar, explore, ValidationError } = require('../flights/search');
const { createRequest, RequestValidationError } = require('../flights/requests');
const { getAlertStore, publicView, AlertValidationError } = require('../flights/alerts');
const { flightProviders } = require('../flights/providers');
const { rateLimit } = require('../security/rateLimit');
const { honeypot, maskPhone, maskEmail, maskName } = require('../security/http');
const { hashIp } = require('../security/ipHash');

const router = express.Router();

router.get('/api/flights/airports', (req, res) => {
  const q = String(req.query.q || '').slice(0, 60);
  res.json(searchAirports(q, req.query.lang));
});

router.get('/api/flights/sources', (req, res) => {
  res.json(flightProviders.map(({ id, name, color, kind, demo }) => ({ id, name, color, kind, demo })));
});

const handle = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req.query));
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
    next(e);
  }
};

router.get('/api/flights/search', handle(searchFlights));

// Ay təqvimi və explore çox gün/istiqamət hesablayır — ayrıca limit (nəticələr həm də keşlənir)
const heavyLimit = rateLimit({ name: 'flights-heavy', windowMs: 60 * 1000, max: 30, message: 'Çox sayda sorğu. Bir dəqiqə sonra yenidən cəhd edin.' });
router.get('/api/flights/calendar', heavyLimit, handle(monthCalendar));
router.get('/api/flights/explore', heavyLimit, handle(explore));

// Sui-istifadə qoruması: hər IP üçün 10 dəqiqədə ən çox 10 müraciət + honeypot
router.post('/api/flights/requests', rateLimit({ name: 'flights-req', windowMs: 10 * 60 * 1000, max: 10, message: 'Çox sayda müraciət. Bir az sonra yenidən cəhd edin.' }), honeypot, async (req, res, next) => {
  try {
    const r = await createRequest(req.body, { ipHash: hashIp(req.ip, 'flight-request-ip') });
    console.info('[flights] yeni müraciət', { id: r.id, name: maskName(r.name), phone: maskPhone(r.phone), email: r.email ? maskEmail(r.email) : null });
    res.status(201).json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof RequestValidationError) return res.status(400).json({ error: e.message, fields: e.errors });
    next(e);
  }
});

// ---- Qiymət izləmə ----
const alertCreateLimit = rateLimit({ name: 'flights-alert-new', windowMs: 10 * 60 * 1000, max: 10, message: 'Çox sayda izləmə sorğusu. Bir az sonra yenidən cəhd edin.' });
const alertReadLimit = rateLimit({ name: 'flights-alert-rw', windowMs: 60 * 1000, max: 60 });
const lang = (req) => (['az', 'en', 'ru'].includes(req.query.lang) ? req.query.lang : 'az');
const tokenOf = (req) => {
  const h = req.get('x-alert-token');
  if (h) return h;
  return req.body && typeof req.body.token === 'string' ? req.body.token : '';
};

router.post('/api/flights/alerts', alertCreateLimit, honeypot, async (req, res, next) => {
  try {
    const { alert, token } = await getAlertStore().create(req.body, { ip: req.ip });
    console.info('[flights] yeni qiymət izləməsi', { id: alert.id, route: `${alert.route.from}-${alert.route.to}`, email: alert.email ? maskEmail(alert.email) : null });
    res.status(201).json({ ok: true, id: alert.id, token, alert: await publicView(alert, lang(req)) });
  } catch (e) {
    if (e instanceof AlertValidationError) return res.status(400).json({ error: e.message, fields: e.errors });
    next(e);
  }
});

router.get('/api/flights/alerts/:id', alertReadLimit, async (req, res, next) => {
  try {
    const a = await getAlertStore().find(req.params.id, tokenOf(req));
    if (!a) return res.status(404).json({ error: 'İzləmə tapılmadı və ya müddəti bitib' });
    res.json(await publicView(a, lang(req)));
  } catch (e) { next(e); }
});

router.delete('/api/flights/alerts/:id', alertReadLimit, async (req, res, next) => {
  try {
    if (!(await getAlertStore().remove(req.params.id, tokenOf(req)))) return res.status(404).json({ error: 'İzləmə tapılmadı və ya müddəti bitib' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
