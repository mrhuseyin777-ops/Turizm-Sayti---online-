// Avtomobil modulu: icarə (özü sürür) və sürücülü maşın / transfer. Bütün təkliflər DEMO-dur.
const express = require('express');
const { searchLocations } = require('../cars/locations');
const { searchRentals, searchTransfers, InputError } = require('../cars/search');
const { createRequest } = require('../cars/requests');
const { rateLimit } = require('../security/rateLimit');
const { honeypot, maskPhone, maskName } = require('../security/http');

const router = express.Router();

const handle = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req));
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    next(e); // mərkəzləşdirilmiş xəta handler (daxili mesaj göstərilmir)
  }
};

router.get('/api/cars/locations', handle((req) => searchLocations(typeof req.query.q === 'string' ? req.query.q.slice(0, 60) : '')));
router.get('/api/cars/search', handle((req) => searchRentals(req.query)));
router.get('/api/cars/transfers', handle((req) => searchTransfers(req.query)));

// Müraciət limiti: bir IP-dən 10 dəqiqədə maks. 10 müraciət (vahid middleware, src/security/rateLimit.js).
// JSON body / Content-Type / Origin yoxlaması server.js-də qlobaldır; honeypot bot qorunmasıdır.
router.post('/api/cars/requests', rateLimit({ name: 'cars-req', windowMs: 10 * 60 * 1000, max: 10, message: 'Çox sayda müraciət. Bir az sonra yenidən cəhd edin.' }), honeypot, async (req, res, next) => {
  try {
    const rec = await createRequest(req.body);
    console.info('[cars] yeni müraciət', { id: rec.id, kind: rec.kind, name: maskName(rec.name), phone: maskPhone(rec.phone) });
    res.status(201).json({ ok: true, id: rec.id, total: rec.summary.total, currency: rec.summary.currency });
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

module.exports = router;
