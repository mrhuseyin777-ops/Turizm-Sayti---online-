// B2B autentifikasiya: giriş (brute-force qorunması ilə), sessiya yoxlaması, CSRF token.
const crypto = require('crypto');
const env = require('../env');
const storage = require('../storage');
const sessions = require('./sessions');
const { verifyPassword, dummyVerify, needsRehash, hashPassword, checkPolicy, POLICY } = require('./password');
const { createCounter } = require('../security/rateLimit');
const { maskIp } = require('../security/http');

// Brute-force qorunması (yalnız UĞURSUZ cəhdlər sayılır):
//  - IP üzrə: 15 dəqiqədə 20 uğursuz cəhd → həmin IP-dən giriş 15 dəqiqəlik bloklanır
//  - hesab üzrə: 15 dəqiqədə 5 uğursuz cəhd → həmin istifadəçi adı 15 dəqiqəlik bloklanır
//    (paylanmış hücumda — çox IP-dən bir hesaba — da işləyir). Uğurlu giriş hesab sayğacını sıfırlayır.
const LOCK = { windowMs: 15 * 60 * 1000, perIp: 20, perAccount: 5 };
const ipFails = createCounter({ windowMs: LOCK.windowMs });
const acctFails = createCounter({ windowMs: LOCK.windowMs });

class AuthError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; Object.assign(this, extra); }
}

const GENERIC = 'İstifadəçi adı və ya parol yanlışdır';

// Hesab repository-si: src/storage (DATABASE_URL varsa PostgreSQL, yoxdursa JSON fayl). useStore — testlər üçün.
let storeOverride = null;
const useStore = (s) => { storeOverride = s; };
const getStore = () => storeOverride || storage.get().accounts;

async function login(body, req, res) {
  const b = body && typeof body === 'object' ? body : {};
  const storeRef = getStore();
  const username = typeof b.username === 'string' ? storeRef.normUsername(b.username) : '';
  const password = typeof b.password === 'string' ? b.password : '';
  if (!username || username.length > 64 || !password || password.length > POLICY.max) throw new AuthError(400, 'İstifadəçi adı və parol tələb olunur');

  const ip = req.ip || 'unknown';
  const ipE = ipFails.peek(ip);
  const acE = acctFails.peek(username);
  const retry = (e) => Math.ceil((e.resetAt - Date.now()) / 1000);
  if (ipE && ipE.count >= LOCK.perIp) throw new AuthError(429, 'Çox sayda uğursuz giriş cəhdi. Bir az sonra yenidən cəhd edin.', { retryAfter: retry(ipE) });
  if (acE && acE.count >= LOCK.perAccount) throw new AuthError(429, 'Bu hesab üçün çox sayda uğursuz cəhd olub. 15 dəqiqə sonra yenidən cəhd edin.', { retryAfter: retry(acE) });

  const user = await storeRef.findUserByUsername(username);
  const agency = user ? await storeRef.getAgency(user.agencyId) : null;
  const ok = user && agency && !user.disabled ? await verifyPassword(password, user.passwordHash) : await dummyVerify(password);
  if (!ok) {
    ipFails.hit(ip);
    acctFails.hit(username);
    console.warn('[auth] uğursuz giriş', { user: username.slice(0, 2) + '***', ip: maskIp(ip) });
    throw new AuthError(401, GENERIC);
  }
  acctFails.reset(username);

  // Köhnə sessiya (varsa) bağlanır, yenisi yaradılır (session fixation qorunması)
  const prev = await sessions.fromRequest(req);
  if (prev) await sessions.destroy(prev.key);
  const { session } = await sessions.create(user, res);
  try {
    const patch = { lastLoginAt: new Date().toISOString() };
    if (needsRehash(user.passwordHash)) patch.passwordHash = await hashPassword(password);
    await storeRef.updateUser(user.id, patch);
  } catch (e) { console.error('[auth] lastLogin yazılmadı', e.message); }
  console.info('[auth] giriş', { user: user.id, agency: agency.id });
  return publicMe(user, agency, session);
}

function publicMe(user, agency, session) {
  return {
    authenticated: true,
    user: { username: user.username, displayName: user.displayName, role: user.role },
    agency: { name: agency.name },
    csrfToken: session.csrf,
    expiresInSec: Math.floor(Math.min(sessions.IDLE_MS, sessions.MAX_MS - (Date.now() - session.createdAt)) / 1000),
  };
}

// Sessiyanı yoxla və req.auth-a yaz (yoxdursa null)
async function resolve(req) {
  const found = await sessions.fromRequest(req);
  if (!found) return null;
  const storeRef = getStore();
  const user = await storeRef.getUser(found.session.userId);
  const agency = user ? await storeRef.getAgency(user.agencyId) : null;
  const pwChanged = user && user.passwordChangedAt ? Date.parse(user.passwordChangedAt) : 0;
  // İstifadəçi silinib/bloklanıb, agentliyi dəyişib və ya parol sessiyadan sonra dəyişibsə → etibarsız
  if (!user || !agency || user.disabled || user.agencyId !== found.session.agencyId || pwChanged > found.session.createdAt) {
    await sessions.destroy(found.key);
    return null;
  }
  return { user, agency, session: found.session, key: found.key };
}

function requireAuth(req, res, next) {
  resolve(req).then((a) => {
    if (!a) return res.status(401).json({ error: 'Daxil olmaq tələb olunur' });
    req.auth = a;
    next();
  }, next);
}

// CSRF qatı 2: vəziyyəti dəyişən B2B sorğularında X-CSRF-Token başlığı sessiyadakı tokenlə eyni olmalıdır.
// (Qat 1 — SameSite=Strict cookie və Origin yoxlaması, bax src/security/http.js)
function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = req.get('x-csrf-token');
  const expected = req.auth && req.auth.session.csrf;
  const ok = typeof sent === 'string' && expected && sent.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
  if (!ok) return res.status(403).json({ error: 'CSRF token yanlışdır və ya yoxdur. Səhifəni yeniləyin.' });
  next();
}

// Yalnız dev/test: env ilə demo hesab (fayl rejimində yaddaşda, fayla yazılmır; DB rejimində DB-yə yazılır).
// Production-da env.demoAccount = null.
async function seedDemoAccount(acc = env.demoAccount) {
  if (!acc || env.isProd) return null;
  const storeRef = getStore();
  if (await storeRef.findUserByUsername(acc.username)) return null;
  const agency = (await storeRef.findAgencyByName(acc.agency)) || (await storeRef.createAgency(acc.agency, { persist: false }));
  const user = await storeRef.createUser({ agencyId: agency.id, username: acc.username, displayName: acc.displayName, role: 'admin', passwordHash: await hashPassword(acc.password) }, { persist: false });
  console.info(`[auth] DEV demo hesabı yaradıldı: ${user.username} (${agency.name}) — yalnız NODE_ENV!=production`);
  return user;
}

// Hostinq üçün ilk admin (B2B_ADMIN_USER / B2B_ADMIN_PASSWORD env). Production-da da işləyir, amma
// parol siyasətinə uyğun olmayan parolla hesab YARADILMIR. Fayl rejimində hesab fayla yazılmır (yaddaşda),
// çünki pulsuz hostinqlərdə disk müvəqqətidir; hər açılışda env-dən yenidən yaradılır. DB rejimində hesab
// DB-də saxlanılır; env-dəki parol DB-dəkindən fərqlidirsə, parol env-ə görə yenilənir (köhnə sessiyalar
// etibarsız olur) — terminalsız hostinqdə parolu dəyişməyin yolu budur.
async function seedBootstrapAdmin(acc = env.bootstrapAdmin) {
  if (!acc) return null;
  if (!/^[a-z0-9._-]{3,32}$/i.test(acc.username)) { console.error('[auth] B2B_ADMIN_USER formatı yanlışdır (3–32: hərf, rəqəm, . _ -)'); return null; }
  const bad = checkPolicy(acc.password, { username: acc.username });
  if (bad) { console.error(`[auth] B2B_ADMIN_PASSWORD qəbul edilmədi: ${bad}`); return null; }
  const storeRef = getStore();
  const existing = await storeRef.findUserByUsername(acc.username);
  if (existing) {
    if (!(await verifyPassword(acc.password, existing.passwordHash))) {
      await storeRef.updateUser(existing.id, { passwordHash: await hashPassword(acc.password), passwordChangedAt: new Date().toISOString() });
      console.info(`[auth] Admin parolu env-ə görə yeniləndi: ${existing.username}`);
    }
    return null;
  }
  const agency = (await storeRef.findAgencyByName(acc.agency)) || (await storeRef.createAgency(acc.agency, { persist: false }));
  const user = await storeRef.createUser({ agencyId: agency.id, username: acc.username, displayName: acc.displayName, role: 'admin', passwordHash: await hashPassword(acc.password) }, { persist: false });
  console.info(`[auth] Admin hesabı env-dən hazırlandı: ${user.username} (${agency.name})`);
  return user;
}

module.exports = { login, resolve, requireAuth, requireCsrf, publicMe, seedDemoAccount, seedBootstrapAdmin, AuthError, useStore, getStore, LOCK, _ipFails: ipFails, _acctFails: acctFails };
