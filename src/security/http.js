// HTTP təhlükəsizlik qatı: başlıqlar (CSP və s.), sorğu parametrlərinin təhlükəsiz parse-ı,
// JSON body yoxlaması (prototype pollution), Origin (CSRF) yoxlaması, xəta və 404 handler-ləri.
const env = require('../env');

// ---------------------------------------------------------------- Başlıqlar
// CSP:
//  - script-src 'self': inline <script>, inline hadisə atributları (onclick=...) və eval QADAĞANDIR.
//    Bütün JS /js/*.js fayllarındadır.
//  - style-src 'self' + style-src-attr 'unsafe-inline': <style> blokları və xarici CSS qadağandır,
//    yalnız HTML/JS şablonlarındakı style="..." atributlarına icazə var (interfeysdə çox istifadə olunur).
//    Risk: CSS atributu ilə JS icra etmək mümkün deyil; qalan risk yalnız vizual dəyişiklikdir və
//    bütün dinamik dəyərlər esc() ilə escape olunur. Gələcəkdə style atributlarını CSS siniflərinə
//    köçürüb 'unsafe-inline'-ı tam çıxarmaq tövsiyə olunur.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "worker-src 'none'",
];
const cspValue = (env.isProd ? [...CSP, 'upgrade-insecure-requests'] : CSP).join('; ');

const PERMISSIONS = [
  'accelerometer=()', 'autoplay=()', 'camera=()', 'display-capture=()', 'geolocation=()', 'gyroscope=()',
  'magnetometer=()', 'microphone=()', 'midi=()', 'payment=()', 'usb=()', 'serial=()',
  'browsing-topics=()', 'interest-cohort=()',
].join(', ');

function securityHeaders(req, res, next) {
  res.set({
    'Content-Security-Policy': cspValue,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY', // köhnə brauzerlər üçün (frame-ancestors əsasdır)
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': PERMISSIONS,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
    'X-DNS-Prefetch-Control': 'off',
    'X-Permitted-Cross-Domain-Policies': 'none',
  });
  // HSTS yalnız production-da və HTTPS üzərindən (dev-də localhost-u "bağlamamaq" üçün)
  if (env.isProd && req.secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Paylaşılan seçim linki (/s/<id>) və B2B paneli: URL heç bir xarici sayta Referer ilə getməsin
  if (req.path.startsWith('/s/') || req.path === '/s.html' || req.path.startsWith('/b2b')) res.set('Referrer-Policy', 'no-referrer');
  // API cavabları keşlənmir (sessiya/şəxsi məlumat proxy və brauzer keşinə düşməsin)
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  next();
}

// ---------------------------------------------------------------- Query parser
// Express-in default "extended" (qs) parser-i ?a[b][c]=1 kimi iç-içə obyektlər və massivlər yaradır.
// Bizim API-lər yalnız sadə mətn parametrləri gözləyir → hər parametr TƏK STRING olur
// (təkrarlananlarda birincisi; HTTP Parameter Pollution qoruması), sayı və uzunluğu məhduddur,
// __proto__/constructor/prototype açarları atılır.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const QUERY_LIMITS = { params: 60, keyLen: 64, valueLen: 1000, total: 8192 };

function parseQueryString(str) {
  const out = {};
  if (!str) return out;
  let params;
  try { params = new URLSearchParams(String(str).slice(0, QUERY_LIMITS.total)); } catch { return out; }
  let n = 0;
  for (const [k, v] of params) {
    if (++n > QUERY_LIMITS.params) break;
    if (!k || k.length > QUERY_LIMITS.keyLen || FORBIDDEN_KEYS.has(k)) continue;
    if (Object.prototype.hasOwnProperty.call(out, k)) continue;
    Object.defineProperty(out, k, { value: v.slice(0, QUERY_LIMITS.valueLen), enumerable: true, writable: true, configurable: true });
  }
  return out;
}

// ---------------------------------------------------------------- JSON body
// JSON.parse "__proto__" açarını adi xüsusiyyət kimi yaradır, amma sonra Object.assign / merge ilə
// prototipə keçə bilər. Belə açarlar, həddən dərin və ya həddən çox açarlı body-lər rədd edilir.
const BODY_LIMITS = { depth: 6, keys: 300 };

function checkBody(value) {
  let keys = 0;
  const walk = (v, depth) => {
    if (v === null || typeof v !== 'object') return true;
    if (depth > BODY_LIMITS.depth) return false;
    for (const k of Object.keys(v)) {
      if (++keys > BODY_LIMITS.keys || FORBIDDEN_KEYS.has(k)) return false;
      if (!walk(v[k], depth + 1)) return false;
    }
    return true;
  };
  return walk(value, 0);
}

function sanitizeBody(req, res, next) {
  if (req.body !== undefined && typeof req.body === 'object' && req.body !== null && !checkBody(req.body)) {
    return res.status(400).json({ error: 'Sorğu formatı düzgün deyil' });
  }
  next();
}

// POST/PUT/PATCH/DELETE yalnız JSON qəbul edir (form-urlencoded CSRF formalarını da kəsir)
function requireJson(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.is('application/json')) return res.status(415).json({ error: 'Content-Type application/json olmalıdır' });
  next();
}

// ---------------------------------------------------------------- Origin (CSRF qatı 1)
// Vəziyyəti dəyişən sorğularda brauzerin göndərdiyi Origin öz host-umuzla (və ya ALLOWED_ORIGINS)
// üst-üstə düşməlidir. Origin yoxdursa, Sec-Fetch-Site yoxlanılır. Brauzer olmayan klientlər
// (curl, server-server) bu başlıqları göndərmir — onlar cookie-siz olduğundan CSRF riski yoxdur;
// B2B əməliyyatları üçün əlavə olaraq CSRF token tələb olunur (bax src/auth/middleware.js).
function originAllowed(req) {
  const origin = req.get('origin');
  if (origin) {
    if (origin === 'null') return false;
    const o = origin.replace(/\/$/, '');
    if (env.allowedOrigins.includes(o)) return true;
    try { return new URL(o).host === req.get('host'); } catch { return false; }
  }
  const sfs = req.get('sec-fetch-site');
  return !sfs || sfs === 'same-origin' || sfs === 'none';
}

function checkOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (!originAllowed(req)) return res.status(403).json({ error: 'Sorğunun mənbəyi (Origin) icazəli deyil' });
  next();
}

// ---------------------------------------------------------------- Honeypot (bot qoruması)
// Formalarda gizli "website" sahəsi var — insan onu görmür və doldurmur. Doldurulubsa bot sayılır:
// müraciət SAXLANMIR, amma bot fərqi bilməsin deyə uğurlu cavab qaytarılır.
const HONEYPOT_FIELD = 'website';
function honeypot(req, res, next) {
  const b = req.body;
  if (b && typeof b === 'object' && !Array.isArray(b) && HONEYPOT_FIELD in b) {
    const v = b[HONEYPOT_FIELD];
    delete b[HONEYPOT_FIELD];
    if (v !== '' && v !== null && v !== undefined) {
      console.warn('[honeypot] bot müraciəti atıldı', { path: req.path, ip: maskIp(req.ip) });
      return res.status(201).json({ ok: true });
    }
  }
  next();
}

// ---------------------------------------------------------------- Loglarda şəxsi məlumatın maskalanması
const maskPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length <= 4 ? '***' : `${'*'.repeat(Math.max(3, d.length - 4))}${d.slice(-2)}`;
};
const maskEmail = (e) => {
  const s = String(e || '');
  const i = s.indexOf('@');
  return i < 1 ? '***' : `${s[0]}***@${s.slice(i + 1)}`;
};
const maskName = (n) => { const s = String(n || ''); return s ? `${s[0]}***` : ''; };
const maskIp = (ip) => {
  const s = String(ip || '');
  if (s.includes('.')) return s.replace(/\.\d+$/, '.x');
  if (s.includes(':')) return s.split(':').slice(0, 3).join(':') + ':…';
  return s;
};

// ---------------------------------------------------------------- 404 və xəta handler-ləri
function notFound(req, res) {
  res.status(404).json({ error: 'Tapılmadı' });
}

// Mərkəzləşdirilmiş xəta handler: istifadəçiyə stack/daxili məlumat GÖSTƏRİLMİR.
// body-parser xətaları (yanlış JSON, böyük body) düzgün 4xx koduna çevrilir.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return req.socket.destroy();
  const status = Number(err.status || err.statusCode) || 500;
  if (status === 413 || err.type === 'entity.too.large') return res.status(413).json({ error: 'Sorğu həddən böyükdür' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON formatı düzgün deyil' });
  if (status >= 400 && status < 500) return res.status(status).json({ error: err.expose && err.message ? err.message : 'Sorğu düzgün deyil' });
  console.error('[error]', req.method, req.path, err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Daxili xəta' });
}

module.exports = {
  securityHeaders, parseQueryString, sanitizeBody, requireJson, checkOrigin, originAllowed, honeypot,
  notFound, errorHandler, maskPhone, maskEmail, maskName, maskIp, checkBody, CSP: cspValue, HONEYPOT_FIELD,
};
