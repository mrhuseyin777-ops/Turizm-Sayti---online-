// Aviabilet modulu API-si (server.js tərəfindən avtomatik qoşulur).
//   GET  /api/flights/airports?q=&lang=   — avtomatik tamamlama
//   GET  /api/flights/search?...          — axtarış (bax: src/flights/search.js -> parseQuery)
//   POST /api/flights/requests            — "Bileti sifariş et" müraciəti
const express = require('express');
const { searchAirports } = require('../flights/airports');
const { searchFlights, ValidationError } = require('../flights/search');
const { createRequest, RequestValidationError } = require('../flights/requests');
const { flightProviders } = require('../flights/providers');

const router = express.Router();

router.get('/api/flights/airports', (req, res) => {
  const q = String(req.query.q || '').slice(0, 60);
  res.json(searchAirports(q, req.query.lang));
});

router.get('/api/flights/sources', (req, res) => {
  res.json(flightProviders.map(({ id, name, color, kind, demo }) => ({ id, name, color, kind, demo })));
});

router.get('/api/flights/search', async (req, res) => {
  try {
    res.json(await searchFlights(req.query));
  } catch (e) {
    if (e instanceof ValidationError) return res.status(400).json({ error: e.message });
    console.error('flights search', e);
    res.status(500).json({ error: 'Axtarış zamanı xəta baş verdi' });
  }
});

// Sadə sui-istifadə qoruması: hər IP üçün 10 dəqiqədə ən çox 10 müraciət
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 10000) hits.clear();
  return arr.length > 10;
}

router.post('/api/flights/requests', express.json({ limit: '10kb' }), (req, res) => {
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Çox sayda müraciət. Bir az sonra yenidən cəhd edin.' });
  try {
    const r = createRequest(req.body, { ip: req.ip });
    res.status(201).json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof RequestValidationError) return res.status(400).json({ error: e.message, fields: e.errors });
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

module.exports = router;
