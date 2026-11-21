// Strukturlaşdırılmış loglar: { time, level, msg, requestId, ...sahələr }.
//  - production (LOG_FORMAT=json, default): sətir başına bir JSON obyekt — log xidmətləri (Render, Loki,
//    CloudWatch və s.) birbaşa parse edir;
//  - dev (pretty): "12:00:01 INFO  [rid] mesaj {sahələr}".
// Səviyyə LOG_LEVEL ilə (debug | info | warn | error | silent). warn/error → stderr, qalanı → stdout.
//
// Şəxsi məlumat: həssas açarlar (parol, token, cookie, authorization ...) tam gizlədilir; e-poçt/telefon/ad/IP
// açarları src/security/mask.js köməkçiləri ilə maskalanır; mətnlərdə (mesaj, xəta mətni, stack) e-poçt və
// uzun rəqəm ardıcıllıqları (telefon) maskalanır. request id AsyncLocalStorage ilə avtomatik əlavə olunur.
const { AsyncLocalStorage } = require('node:async_hooks');
const env = require('../env');
const { maskPhone, maskEmail, maskName, maskIp } = require('../security/mask');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };
const context = new AsyncLocalStorage();

const SECRET_KEY_RE = /pass(word)?|secret|token|cookie|authorization|api[-_]?key|session|csrf|dsn/i;
const MASKERS = [
  [/e-?mail/i, maskEmail],
  [/phone|tel$/i, maskPhone],
  [/^(name|fullName|firstName|lastName|displayName)$/i, maskName],
  [/^ip$|ipAddress|remoteAddress/i, maskIp],
];
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_RE = /\+?\d[\d ()-]{7,}\d/g;

// Sərbəst mətndə e-poçt və telefon kimi görünən hissələri maskala
function scrubText(s) {
  return String(s)
    .replace(EMAIL_RE, (m) => maskEmail(m))
    .replace(PHONE_RE, (m) => (m.replace(/\D/g, '').length >= 9 ? maskPhone(m) : m));
}

function serializeError(e) {
  if (!(e instanceof Error)) return scrubText(e);
  const out = { name: e.name, message: scrubText(e.message) };
  if (e.code) out.code = String(e.code);
  if (e.stack) out.stack = scrubText(e.stack);
  return out;
}

// Sahələri təhlükəsiz forma sal (dərinlik və ölçü məhduddur)
function sanitize(value, key = '', depth = 0) {
  if (value === null || value === undefined) return value;
  if (key && SECRET_KEY_RE.test(key)) return '[gizli]';
  if (value instanceof Error) return serializeError(value);
  if (typeof value === 'string') {
    for (const [re, mask] of MASKERS) if (key && re.test(key)) return mask(value);
    return scrubText(value.length > 2000 ? `${value.slice(0, 2000)}…` : value);
  }
  if (typeof value !== 'object') return value;
  if (depth >= 4) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, '', depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value).slice(0, 50)) out[k] = sanitize(v, k, depth + 1);
  return out;
}

const threshold = () => LEVELS[env.logLevel] ?? LEVELS.info;

function write(level, msg, fields) {
  if (LEVELS[level] < threshold()) return;
  const store = context.getStore();
  const entry = { time: new Date().toISOString(), level, msg: scrubText(msg) };
  if (store && store.requestId) entry.requestId = store.requestId;
  if (fields !== undefined) {
    const f = fields instanceof Error ? { err: serializeError(fields) } : sanitize(fields);
    if (f && typeof f === 'object' && !Array.isArray(f)) Object.assign(entry, f, { time: entry.time, level, msg: entry.msg });
    else entry.data = f;
  }
  const stream = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;
  if (env.logFormat === 'json') {
    stream.write(`${JSON.stringify(entry)}\n`);
    return;
  }
  const { time, level: _l, msg: m, requestId, ...rest } = entry;
  const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  stream.write(`${time.slice(11, 19)} ${level.toUpperCase().padEnd(5)} ${requestId ? `[${requestId.slice(0, 8)}] ` : ''}${m}${extra}\n`);
}

const logger = {
  debug: (msg, fields) => write('debug', msg, fields),
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
  // fn-i verilən kontekstlə (məs. { requestId }) icra et — içindəki bütün loglara əlavə olunur
  runWithContext: (store, fn) => context.run(store, fn),
  getContext: () => context.getStore(),
};

module.exports = { logger, sanitize, scrubText, serializeError, LEVELS };
