// Tur/otel modulunun əlavə API-ləri: istiqamətsiz axtarış, müraciətlər (lead / geri zəng),
// B2B paylaşılan seçim linkləri. server.js bu faylı avtomatik qoşur.
const express = require('express');
const path = require('path');
const { explore, hotelOffers, calendar, QueryError } = require('../search');
const { InputError, createLead, createSelection, getSelectionRecord, publicSelection } = require('../leads');
const { requireAuth, requireCsrf } = require('../auth');
const { rateLimit } = require('../security/rateLimit');
const { honeypot } = require('../security/http');
const { publicBrand, getBrand } = require('../brand');

const router = express.Router();

const fail = (res, e, next) => {
  if (e instanceof InputError) return res.status(400).json({ error: e.message });
  return next(e); // daxili xəta → mərkəzləşdirilmiş handler (mesaj göstərilmir)
};

// "Hara gedə bilərəm?" — istiqamət göstərilmədən büdcə/tarixə görə istiqamətlər (ucuzdan bahalıya).
// /api/search?anywhere=1 də eyni nəticəni qaytarır.
router.get('/api/explore', async (req, res, next) => {
  try {
    res.json(await explore(req.query));
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Otel detal pəncərəsi: bir otelin bütün təklifləri (otaq × qidalanma × operator), ucuzdan bahalıya.
// Parametrlər /api/search ilə eynidir (checkIn, checkInTo, nights, nightsTo, adults, childAges, currency…);
// id ağ siyahı formatı + kataloqda mövcudluq yoxlanılır. Provayderlərə sorğu getdiyi üçün ayrıca limit.
router.get('/api/hotels/:id/offers', rateLimit({ name: 'hotel-offers', windowMs: 60 * 1000, max: 60 }), async (req, res, next) => {
  try {
    const r = await hotelOffers(req.params.id, req.query);
    if (!r) return res.status(404).json({ error: 'Otel tapılmadı' });
    res.json(r);
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Qiymət təqvimi: istiqamət + gecə + nəfər üçün ±N gün (span ≤ 7) və ya ay (mode=month) üzrə hər gün ən ucuz qiymət.
// Validasiya src/search.js → calendar(); nəticə yaddaşda keşlənir (priceCacheMinutes). Ayrıca IP limiti.
router.get('/api/tours/calendar', rateLimit({ name: 'tour-calendar', windowMs: 60 * 1000, max: 60 }), async (req, res, next) => {
  try {
    res.json(await calendar(req.query));
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// Müraciət: type = 'offer' (kartdan) | 'callback' ("Sizə zəng edək") | 'selection' (paylaşılan linkdən)
// partner = marketplace agentliyinin ictimai id-si (ixtiyari, src/leads.js) → müraciət həmin agentliyə
// Qorunma: IP limiti, honeypot sahəsi, ağ siyahı + uzunluq + telefon formatı (src/leads.js)
router.post('/api/leads', rateLimit({ name: 'leads', windowMs: 10 * 60 * 1000, max: 20 }), honeypot, async (req, res, next) => {
  try {
    const lead = await createLead(req.body);
    // statusUrl: müştərinin status səhifəsi (/r/<token>; token yalnız bu cavabda, DB-də yalnız hash)
    res.status(201).json({ ok: true, id: lead.id, statusUrl: `/r/${lead.statusToken}` });
  } catch (e) { fail(res, e, next); }
});

// B2B: seçilmiş təkliflərdən paylaşılan link yarat.
// Tələb: daxil olmuş agentlik istifadəçisi + CSRF token. Agentlik/menecer adı sessiyadan,
// qiymətlər serverin öz axtarışından götürülür (klientin qiymətinə etibar edilmir).
router.post('/api/selections',
  requireAuth,
  requireCsrf,
  rateLimit({ name: 'selections', windowMs: 10 * 60 * 1000, max: 30, key: (req) => req.auth.user.id }),
  async (req, res, next) => {
    try {
      const { user, agency } = req.auth;
      const sel = await createSelection(req.body, { account: { agencyId: agency.id, agencyName: agency.name, managerName: user.displayName } });
      res.status(201).json({ ok: true, id: sel.id, url: `/s/${sel.id}` });
    } catch (e) { fail(res, e, next); }
  });

// Müştəri görünüşü (operator adları və net qiymət gizli). Link = 72 bitlik təsadüfi id (capability URL).
router.get('/api/selections/:id', async (req, res, next) => {
  try {
    const sel = await getSelectionRecord(req.params.id);
    if (!sel) return res.status(404).json({ error: 'Seçim tapılmadı və ya müddəti bitib' });
    // Agentliyin brend profili (canlı: loqo/rəng dəyişəndə köhnə linklər də yenilənir); daxili id-lər yoxdur
    res.json({ ...publicSelection(sel), brand: publicBrand(await getBrand(sel.agencyId), sel.agency) });
  } catch (e) { next(e); }
});

// B2B "Müraciətlər": src/routes/b2b.js (GET /api/b2b/leads — autentifikasiya ilə)

// Qısa paylaşma linki: /s/<id> → public/s.html (id səhifədə oxunur)
router.get('/s/:id', (req, res) => {
  if (!/^[A-Za-z0-9_-]{12}$/.test(req.params.id)) return res.status(404).json({ error: 'Tapılmadı' });
  res.sendFile(path.join(__dirname, '..', '..', 'public', 's.html'), { headers: { 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' } });
});

module.exports = router;
