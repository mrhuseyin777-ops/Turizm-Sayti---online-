// Saxlama qatı (repository abstraksiyası). Rejim mühitdən seçilir:
//   DATABASE_URL təyin olunub → PostgreSQL (src/storage/postgres.js) — daimi, bir neçə nüsxə ilə işləyir
//   təyin olunmayıb          → memory/file (src/storage/memory.js) — dev/test, geriyə uyğunluq
//
// Hər domenin vahid async interfeysi var (hər iki implementasiya eyni metodları verir):
//   accounts       getAgency(id), findAgencyByName(name), listAgencies(), createAgency(name, {persist}),
//                  getUser(id), findUserByUsername(username), createUser({...}, {persist}), updateUser(id, patch),
//                  normUsername, USERNAME_RE, ROLES, describe()
//   sessions       insert({keyHash,userId,agencyId,csrf,createdAt,lastSeen,expiresAt}), get(keyHash),
//                  touch(keyHash, lastSeen), delete(keyHash), deleteForUser(userId), trimForUser(userId, keep),
//                  purgeExpired({now, idleMs}), count()
//   leads          insert(lead) → {id,...}, listForAgency(agencyId, limit, {status}), statusCountsForAgency(agencyId),
//                  updateForAgency(agencyId, id, {status, managerNote, by, now}) → lead | null (IDOR: agency_id şərti),
//                  count(), purgeBefore(date), getByStatusTokenHash(sha256hex) — müştəri status səhifəsi (/r/<token>)
//   agencySettings get(agencyId) → {telegramChatId, notifyEmail, updatedAt, updatedBy} | null,
//                  set(agencyId, {telegramChatId, notifyEmail, updatedBy})
//   agencyBrand    get(agencyId) → {publicId, displayName, color, phone, whatsapp, licenseNo, address, website, logo:{mime,size,sha256,updatedAt}|null}
//                  | null, set(agencyId, fields, {newPublicId}), setLogo(agencyId, {bytes,mime,sha256,updatedBy}, {newPublicId}),
//                  deleteLogo(agencyId), getLogo(publicId) → {bytes, mime, sha256, updatedAt} | null (public URL yalnız publicId ilə)
//   agencyMarkup   get(agencyId) → {config, updatedAt, updatedBy} | null, set(agencyId, {config, updatedBy}) — src/markup.js
//   widgets        get(agencyId), getByPublicId(id), getByMarketId(id), upsert(agencyId, patch), listMarketplace()
//                  — vidjet (/w/<publicId>, frameDomains, markupPct) və marketplace profili (006)
//   selections     insert(sel), get(id), delete(id), countForAgency(agencyId), trimForAgency(agencyId, keep),
//                  purgeBefore(date)
//   shortlists     insert(item) → item | {...mövcud, existed:true}, listForAgency(agencyId, limit), get(agencyId, id),
//                  update(agencyId, id, patch) → item|null (dublikatda code 'DUPLICATE'), delete(agencyId, id) → bool,
//                  countForAgency(agencyId), purgeBefore(date) — hamısı agencyId ilə (IDOR qorunması)
//   flightAlerts   insert(alert), get(id), delete(id), list(), updateMany([{id, patch}]), countByIpKey(ipKey),
//                  count(), purgeDepartedBefore(todayIso)
//   flightRequests insert(rec) → {id,...}, count(), purgeBefore(date)
//   carRequests    insert(rec) → {id,...}, count(), purgeBefore(date)
//
// Rate limit və brute-force sayğacları qəsdən yaddaşda qalır (src/security/rateLimit.js): bir neçə
// nüsxədə limit hər nüsxə üçün ayrıca sayılır — bax SECURITY.md.
const env = require('../env');
const { logger } = require('../observability/logger');

let repos = null;
let initPromise = null;

const mode = () => (env.databaseUrl ? 'postgres' : 'memory');

function get() {
  if (!repos) {
    if (mode() === 'postgres') {
      const { getPool } = require('../db/pool');
      repos = require('./postgres').createRepos(getPool());
    } else {
      repos = require('./memory').createRepos();
    }
  }
  return repos;
}

// Testlər üçün: başqa repository dəsti qoş
function use(r) { repos = r; initPromise = null; }

// Açılışda bir dəfə: PostgreSQL rejimində miqrasiyalar (advisory lock ilə). Memory rejimində heç nə.
function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (mode() !== 'postgres') {
      if (env.isProd) {
        logger.warn('[storage] XƏBƏRDARLIQ: DATABASE_URL təyin olunmayıb — hesablar, sessiyalar, müraciətlər və seçim linkləri ' +
          'yaddaşda/müvəqqəti diskdə saxlanılır və yenidən başlamada İTİR. Bax docs/OPERATIONS.md.');
      }
      return { mode: 'memory' };
    }
    const r = get();
    const { migrate } = require('../db/migrate');
    const res = await migrate(r.pool);
    logger.info('[storage] PostgreSQL hazırdır', { migrations: res.total, applied: res.applied.length });
    return { mode: 'postgres', ...res };
  })();
  return initPromise;
}

async function close() {
  if (mode() === 'postgres') await require('../db/pool').closePool();
  repos = null;
  initPromise = null;
}

module.exports = { get, use, init, close, mode };
