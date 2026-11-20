// Server tərəfli sessiyalar. Sessiya id = 32 bayt crypto.randomBytes (256 bit), brauzerdə yalnız
// HttpOnly + SameSite=Strict (+ production-da Secure, __Host- prefiksi) cookie-də saxlanılır.
// Serverdə id-nin özü yox, SHA-256 hash-i açar kimi saxlanılır (yaddaş dump-ı sızsa belə id-lər görünmür).
// Yaddaşdadır: server yenidən başlayanda bütün istifadəçilər yenidən daxil olur (təhlükəsiz default).
// Bir neçə server nüsxəsi üçün Redis/DB sessiya store lazımdır — bax SECURITY.md.
const crypto = require('crypto');
const env = require('../env');

const COOKIE = env.cookieSecure ? '__Host-etour_sid' : 'etour_sid';
const IDLE_MS = env.sessionIdleMinutes * 60 * 1000;
const MAX_MS = env.sessionMaxMinutes * 60 * 1000;
const MAX_SESSIONS = 20000;
const MAX_PER_USER = 10;

const sessions = new Map(); // sha256(id) -> session
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

function create(user, res) {
  const id = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  const s = { userId: user.id, agencyId: user.agencyId, csrf: crypto.randomBytes(32).toString('base64url'), createdAt: now, lastSeen: now };
  // Bir istifadəçinin həddən çox aktiv sessiyası varsa ən köhnəsi bağlanır
  const mine = [...sessions.entries()].filter(([, x]) => x.userId === user.id).sort((a, b) => a[1].createdAt - b[1].createdAt);
  while (mine.length >= MAX_PER_USER) sessions.delete(mine.shift()[0]);
  sessions.set(hashId(id), s);
  while (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
  res.append('Set-Cookie', cookieString(id, Math.floor(MAX_MS / 1000)));
  return { id, session: s };
}

function expired(s, now = Date.now()) {
  return now - s.lastSeen > IDLE_MS || now - s.createdAt > MAX_MS;
}

// Cookie-dən sessiyanı tap (yoxdursa / vaxtı bitibsə null)
function fromRequest(req) {
  const id = parseCookies(req.headers.cookie)[COOKIE];
  if (!id || !SID_RE.test(id)) return null;
  const key = hashId(id);
  const s = sessions.get(key);
  if (!s) return null;
  if (expired(s)) { sessions.delete(key); return null; }
  s.lastSeen = Date.now();
  return { key, session: s };
}

function destroy(key, res) {
  if (key) sessions.delete(key);
  if (res) res.append('Set-Cookie', cookieString('', 0));
}

function destroyForUser(userId) {
  for (const [k, s] of sessions) if (s.userId === userId) sessions.delete(k);
}

const timer = setInterval(() => {
  const now = Date.now();
  for (const [k, s] of sessions) if (expired(s, now)) sessions.delete(k);
}, 60 * 1000);
timer.unref();

module.exports = { COOKIE, create, fromRequest, destroy, destroyForUser, parseCookies, sessions, IDLE_MS, MAX_MS };
