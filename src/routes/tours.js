// Tur/otel modulunun əlavə API-ləri: istiqamətsiz axtarış, müraciətlər (lead / geri zəng),
// B2B paylaşılan seçim linkləri. server.js bu faylı avtomatik qoşur.
const express = require('express');
const path = require('path');
const { explore } = require('../search');
const { InputError, createLead, leadsForAgency, createSelection, getSelectionRecord, publicSelection } = require('../leads');

const router = express.Router();

// Sadə yaddaşdaxili limit: bir IP-dən pəncərədə maks. N yazma sorğusu
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const arr = (hits.get(req.ip) || []).filter((ts) => now - ts < windowMs);
    arr.push(now);
    hits.set(req.ip, arr);
    if (hits.size > 5000) hits.clear();
    if (arr.length > max) return res.status(429).json({ error: 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.' });
    next();
  };
}
const json = express.json({ limit: '32kb' });
const requireJson = (req, res, next) => (req.is('application/json') ? next() : res.status(415).json({ error: 'Content-Type application/json olmalıdır' }));
const fail = (res, e) => {
  if (e instanceof InputError) return res.status(400).json({ error: e.message });
  console.error('[tours]', e);
  return res.status(500).json({ error: 'Daxili xəta' });
};

// "Hara gedə bilərəm?" — istiqamət göstərilmədən büdcə/tarixə görə istiqamətlər (ucuzdan bahalıya).
// /api/search?anywhere=1 də eyni nəticəni qaytarır.
router.get('/api/explore', async (req, res) => {
  try {
    res.json(await explore(req.query));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Müraciət: type = 'offer' (kartdan) | 'callback' ("Sizə zəng edək") | 'selection' (paylaşılan linkdən)
router.post('/api/leads', limiter(20, 10 * 60 * 1000), json, requireJson, (req, res) => {
  try {
    const lead = createLead(req.body);
    res.status(201).json({ ok: true, id: lead.id });
  } catch (e) { fail(res, e); }
});

// B2B: seçilmiş təkliflərdən paylaşılan link yarat
router.post('/api/selections', limiter(30, 10 * 60 * 1000), json, requireJson, (req, res) => {
  try {
    const sel = createSelection(req.body);
    res.status(201).json({ ok: true, id: sel.id, url: `/s/${sel.id}` });
  } catch (e) { fail(res, e); }
});

// Müştəri görünüşü (operator adları və net qiymət gizli)
router.get('/api/selections/:id', (req, res) => {
  const sel = getSelectionRecord(req.params.id);
  if (!sel) return res.status(404).json({ error: 'Seçim tapılmadı və ya müddəti bitib' });
  res.set('Cache-Control', 'no-store');
  res.json(publicSelection(sel));
});

// B2B "Müraciətlər" bölməsi.
// DEMO: agentlik adına görə filtr, autentifikasiya YOXDUR. Real versiyada agentlik hesabı
// ilə giriş (sessiya/JWT) tələb olunmalı və agency sorğudan yox, sessiyadan götürülməlidir.
router.get('/api/b2b/leads', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ leads: leadsForAgency(typeof req.query.agency === 'string' ? req.query.agency : '') });
});

// Qısa paylaşma linki: /s/<id> → public/s.html (id səhifədə oxunur)
router.get('/s/:id', (req, res) => res.sendFile(path.join(__dirname, '..', '..', 'public', 's.html')));

module.exports = router;
