// Aviabilet modulu API-si (server.js tərəfindən avtomatik qoşulur).
//   GET  /api/flights/airports?q=&lang=   — avtomatik tamamlama
//   GET  /api/flights/search?...          — axtarış (bax: src/flights/search.js -> parseQuery)
//   POST /api/flights/requests            — "Bileti sifariş et" müraciəti
const express = require('express');
const { searchAirports } = require('../flights/airports');
const { searchFlights, ValidationError } = require('../flights/search');
const { createRequest, RequestValidationError } = require('../flights/requests');
const { flightProviders } = require('../flights/providers');
const { rateLimit } = require('../security/rateLimit');
const { honeypot, maskPhone, maskEmail, maskName, maskIp } = require('../security/http');

const router = express.Router();

router.get('/api/flights/airports', (req, res) => {
  const q = String(req.query.q || '').slice(0, 60);
  res.json(searchAirports(q, req.query.lang));
});

router.get('/api/flights/sources', (req, res) => {
  res.json(flightProviders.map(({ id, name, color, kind, demo }) => ({ id, name, color, kind, demo })));
});

router.get('/api/flights/search', async (req, res, next) => {
  try {
    res.json(await searchFlights(req.query));
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Sui-istifadə qoruması: hər IP üçün 10 dəqiqədə ən çox 10 müraciət + honeypot
router.post('/api/flights/requests', rateLimit({ name: 'flights-req', windowMs: 10 * 60 * 1000, max: 10, message: 'Çox sayda müraciət. Bir az sonra yenidən cəhd edin.' }), honeypot, (req, res, next) => {
  try {
    const r = createRequest(req.body, { ip: maskIp(req.ip) });
    console.info('[flights] yeni müraciət', { id: r.id, name: maskName(r.name), phone: maskPhone(r.phone), email: r.email ? maskEmail(r.email) : null });
    res.status(201).json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof RequestValidationError) return res.status(400).json({ error: e.message, fields: e.errors });
    next(e);
  }
});

module.exports = router;
