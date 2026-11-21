// Server tərəfli sessiyalar. Sessiya id = 32 bayt crypto.randomBytes (256 bit), brauzerdə yalnız
// HttpOnly + SameSite=Strict (+ production-da Secure, __Host- prefiksi) cookie-də saxlanılır.
// Serverdə id-nin özü yox, SHA-256 hash-i açar kimi saxlanılır (DB/yaddaş dump-ı sızsa belə id-lər görünmür).
// Saxlama: src/storage (DATABASE_URL varsa PostgreSQL `sessions` cədvəli — yenidən başlamada və bir neçə
// nüsxə arasında qalır; yoxdursa proses yaddaşı). Müddəti bitənlər dövri təmizlənir (src/storage/cleanup.js).
const crypto = require('crypto');
const env = require('../env');
const storage = require('../storage');

const COOKIE = env.cookieSecure ? '__Host-etour_sid' : 'etour_sid';
const IDLE_MS = env.sessionIdleMinutes * 60 * 1000;
const MAX_MS = env.sessionMaxMinutes * 60 * 1000;
const MAX_PER_USER = 10;
// lastSeen hər sorğuda yox, ən çox dəqiqədə bir yazılır (DB yükü); hərəkətsizlik limiti dəqiqələrlədir
const TOUCH_MS = 60 * 1000;

const repo = () => storage.get().sessions;
const hashId = (id) => crypto.createHash('sha256').update(id).digest('base64url');
const SID_RE = /^[A-Za-z0-9_-]{43}$/;

function parseCookies(header) {
  const out = Object.create(null);
  if (typeof header !== 'string' || header.length > 8192) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const k = part.slice(0, i).trim();
    if (!k || k in out) continue;
    let v = part.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}

function cookieString(value, maxAgeSec) {
  const attrs = [`${COOKIE}=${value}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSec}`];
  if (env.cookieSecure) attrs.push('Secure');
  return attrs.join('; ');
}

async function create(user, res) {
  const id = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const s = { userId: user.id, agencyId: user.agencyId, csrf: crypto.randomBytes(32).toString('base64url'), createdAt: now, lastSeen: now };
  // Bir istifadəçinin həddən çox aktiv sessiyası varsa ən köhnəsi bağlanır
  await repo().trimForUser(user.id, MAX_PER_USER - 1);
  await repo().insert({ keyHash: hashId(id), ...s, expiresAt: now + MAX_MS });
  res.append('Set-Cookie', cookieString(id, Math.floor(MAX_MS / 1000)));
  return { id, session: s };
}

function expired(s, now = Date.now()) {
  return now - s.lastSeen > IDLE_MS || now - s.createdAt > MAX_MS;
}

// Cookie-dən sessiyanı tap (yoxdursa / vaxtı bitibsə null)
async function fromRequest(req) {
  const id = parseCookies(req.headers.cookie)[COOKIE];
  if (!id || !SID_RE.test(id)) return null;
  const key = hashId(id);
  const s = await repo().get(key);
  if (!s) return null;
  const now = Date.now();
  if (expired(s, now)) { await repo().delete(key); return null; }
  if (now - s.lastSeen >= TOUCH_MS) {
    s.lastSeen = now;
    await repo().touch(key, now);
  }
  return { key, session: s };
}

async function destroy(key, res) {
  if (key) await repo().delete(key);
  if (res) res.append('Set-Cookie', cookieString('', 0));
}

async function destroyForUser(userId) {
  await repo().deleteForUser(userId);
}

const api = { COOKIE, create, fromRequest, destroy, destroyForUser, parseCookies, hashId, IDLE_MS, MAX_MS, MAX_PER_USER };
// Yalnız memory rejimində (testlər/diaqnostika): sha256(id) -> sessiya xəritəsi
Object.defineProperty(api, 'sessions', { enumerable: false, get: () => repo().map });
module.exports = api;
