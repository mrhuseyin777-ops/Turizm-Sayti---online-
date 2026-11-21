// HTTP müşahidə qatı: request id və sorğu logu.
//  - Hər sorğuya request id: gələn X-Request-Id yalnız təhlükəsiz formatdadırsa (8–64 simvol, [A-Za-z0-9._-])
//    qəbul olunur, əks halda yenisi (UUID) yaradılır. Cavabda X-Request-Id başlığı; loglara avtomatik düşür.
//  - /api/* sorğuları üçün log: metod, yol (query-siz; id/token seqmentləri maskalanır), status, müddət (ms).
//    IP, başlıqlar, body və query string loglanmır.
const crypto = require('crypto');
const { logger } = require('./logger');

const SAFE_ID_RE = /^[A-Za-z0-9._-]{8,64}$/;

function requestContext(req, res, next) {
  const incoming = req.get('x-request-id');
  const id = incoming && SAFE_ID_RE.test(incoming) ? incoming : crypto.randomUUID();
  req.id = id;
  res.set('X-Request-Id', id);
  logger.runWithContext({ requestId: id }, next);
}

// Yol şablonu: uyğun gələn marşrut varsa onun şablonu (/api/selections/:id), yoxdursa yol — rəqəm daşıyan
// və ya uzun seqmentlər ":x" ilə əvəzlənir (paylaşılan link id-ləri, tokenlər loglara düşməsin).
function routePath(req) {
  if (req.route && typeof req.route.path === 'string') return (req.baseUrl || '') + req.route.path;
  const p = String(req.originalUrl || req.url || '').split(/[?#]/)[0].slice(0, 200);
  return p.split('/').map((seg) => (seg.length > 24 || /\d/.test(seg) ? ':x' : seg)).join('/');
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  let done = false;
  const log = () => {
    if (done) return;
    done = true;
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.headersSent ? res.statusCode : 0; // 0 — cavab göndərilmədən bağlantı kəsildi
    logger.info('request', { method: req.method, path: routePath(req), status, durationMs: Math.round(ms * 10) / 10 });
  };
  res.once('finish', log);
  res.once('close', log);
  next();
}

module.exports = { requestContext, requestLogger, routePath, SAFE_ID_RE };
