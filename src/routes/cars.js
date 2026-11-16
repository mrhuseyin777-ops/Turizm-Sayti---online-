// Avtomobil modulu: icarə (özü sürür) və sürücülü maşın / transfer. Bütün təkliflər DEMO-dur.
const express = require('express');
const { searchLocations } = require('../cars/locations');
const { searchRentals, searchTransfers, InputError } = require('../cars/search');
const { createRequest } = require('../cars/requests');

const router = express.Router();

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    console.error('[cars]', e);
    res.status(500).json({ error: 'Daxili xəta' });
  }
};

router.get('/api/cars/locations', handle((req) => searchLocations(typeof req.query.q === 'string' ? req.query.q.slice(0, 60) : '')));
router.get('/api/cars/search', handle((req) => searchRentals(req.query)));
router.get('/api/cars/transfers', handle((req) => searchTransfers(req.query)));

// Sadə yaddaşdaxili limit: bir IP-dən 10 dəqiqədə maks. 10 müraciət
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((ts) => now - ts < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 10;
}

router.post('/api/cars/requests', express.json({ limit: '8kb' }), async (req, res) => {
  if (!req.is('application/json')) return res.status(415).json({ error: 'Content-Type application/json olmalıdır' });
  if (rateLimited(req.ip)) return res.status(429).json({ error: 'Çox sayda müraciət. Bir az sonra yenidən cəhd edin.' });
  try {
    const rec = await createRequest(req.body);
    res.status(201).json({ ok: true, id: rec.id, total: rec.summary.total, currency: rec.summary.currency });
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    console.error('[cars]', e);
    res.status(500).json({ error: 'Daxili xəta' });
  }
});

module.exports = router;
