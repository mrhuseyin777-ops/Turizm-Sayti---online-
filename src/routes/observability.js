// Müşahidə marşrutları: brauzer xətalarının qəbulu və health check-lər. server.js bu faylı avtomatik qoşur.
//
// POST /api/client-errors — public/js/errors.js göndərir (sendBeacon / fetch keepalive). Yalnız bu sahələr
//   qəbul olunur və təmizlənir: message (≤300), file (yalnız öz /js/*.js yolumuz, query-siz), line, col,
//   page (yalnız yol, query/hash-siz). Body ≤ 4 KB, IP üzrə limit. Ümumi qorunmalar (Origin yoxlaması,
//   yalnız JSON, prototype pollution) server.js-də /api/* üçün artıq tətbiq olunur. Cavab: 204, body yoxdur.
// GET /healthz — proses canlıdır (liveness). GET /readyz — sorğu qəbul etməyə hazırdır (readiness):
//   başlanğıc (miqrasiyalar) bitib və DB rejimində `SELECT 1` 2 s ərzində uğurludur. Cavabda daxili detal yoxdur.
const express = require('express');
const storage = require('../storage');
const { rateLimit } = require('../security/rateLimit');
const { logger } = require('../observability/logger');

const router = express.Router();

const MAX_BODY = 4096;
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u001F\u007F]+/g;
const text = (v, max) => (typeof v === 'string' ? v.replace(CTRL_RE, ' ').trim().slice(0, max) : '');
const int = (v) => (Number.isInteger(v) && v >= 0 && v < 1e7 ? v : null);

// Yalnız yol: sxem/host/query/hash atılır; bizim statik JS fayllarımızdan başqası "external" olur
function pathOnly(v, { scriptsOnly = false } = {}) {
  const s = text(v, 500);
  if (!s) return '';
  let p;
  try { p = new URL(s, 'http://x.invalid').pathname; } catch { return ''; }
  if (scriptsOnly) return /^\/js\/[A-Za-z0-9._-]{1,64}\.js$/.test(p) ? p : 'external';
  // Capability URL-lər (seçim linki, status tokeni, vidjet id-si) loglara düşmür
  return /^\/[A-Za-z0-9._/-]{0,120}$/.test(p) ? p.replace(/\/s\/[^/]+/, '/s/:id').replace(/\/r\/[^/]+/, '/r/:token').replace(/\/w\/[^/]+/, '/w/:id') : '';
}

const clientErrorLimit = rateLimit({ name: 'client-errors', windowMs: 60 * 1000, max: 10 });

router.post('/api/client-errors', clientErrorLimit, (req, res) => {
  const len = Number(req.get('content-length')) || 0;
  if (len > MAX_BODY) return res.status(413).json({ error: 'Sorğu həddən böyükdür' });
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b)) return res.status(400).json({ error: 'Sorğu formatı düzgün deyil' });
  const message = text(b.message, 300);
  if (!message) return res.status(400).json({ error: 'Sorğu formatı düzgün deyil' });
  const kind = b.kind === 'unhandledrejection' ? 'unhandledrejection' : 'error';
  logger.warn('client error', {
    kind,
    message,
    file: pathOnly(b.file, { scriptsOnly: true }),
    line: int(b.line),
    col: int(b.col),
    page: pathOnly(b.page),
  });
  res.status(204).end();
});

router.get('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

// DB yoxlaması: eyni anda gələn sorğular bir yoxlamanı paylaşır (DB-yə yük düşməsin)
const DB_TIMEOUT_MS = 2000;
let inflight = null;
function checkDb() {
  if (storage.mode() !== 'postgres') return Promise.resolve(true);
  if (inflight) return inflight;
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(false), DB_TIMEOUT_MS); });
  const query = Promise.resolve()
    .then(() => storage.get().pool.query('SELECT 1'))
    .then(() => true, (e) => { logger.warn('[readyz] DB yoxlaması alınmadı', { err: e.message }); return false; });
  inflight = Promise.race([query, timeout]).finally(() => { clearTimeout(timer); inflight = null; });
  return inflight;
}

router.get('/readyz', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const state = req.app.locals.readyState;
  const ok = (state === undefined || state === 'ok') && (await checkDb());
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'unavailable' });
});

module.exports = router;
