// B2B agentlik hesabları: giriş, çıxış, cari istifadəçi, müraciətlər.
//   POST /api/b2b/login   { username, password }  → httpOnly sessiya cookie + csrfToken
//   POST /api/b2b/logout  (X-CSRF-Token)
//   GET  /api/b2b/me      → { authenticated, user, agency, csrfToken } (girişsiz: { authenticated:false })
//   GET  /api/b2b/leads   → yalnız SESSİYADAKI agentliyin leadləri (agency parametri qəbul edilmir)
const express = require('express');
const { login, resolve, requireAuth, requireCsrf, publicMe, AuthError } = require('../auth');
const sessions = require('../auth/sessions');
const { leadsForAgency } = require('../leads');
const { rateLimit } = require('../security/rateLimit');

const router = express.Router();

// Ümumi giriş sorğusu limiti (uğurlu + uğursuz), brute-force sayğaclarından əlavə
const loginLimit = rateLimit({ name: 'login', windowMs: 60 * 1000, max: 10, message: 'Çox sayda giriş cəhdi. Bir dəqiqə sonra yenidən cəhd edin.' });

router.post('/api/b2b/login', loginLimit, async (req, res, next) => {
  try {
    res.json(await login(req.body, req, res));
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.retryAfter) res.set('Retry-After', String(e.retryAfter));
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
});

router.post('/api/b2b/logout', requireAuth, requireCsrf, (req, res) => {
  sessions.destroy(req.auth.key, res);
  res.json({ ok: true });
});

router.get('/api/b2b/me', (req, res) => {
  const a = resolve(req);
  if (!a) return res.json({ authenticated: false });
  res.json(publicMe(a.user, a.agency, a.session));
});

router.get('/api/b2b/leads', requireAuth, (req, res) => {
  res.json({ leads: leadsForAgency(req.auth.agency.id) });
});

module.exports = router;
