// Şəxsi məlumatların saxlanma müddəti (data retention) və dövri təmizləmə.
//  - leadlər, avia/avto müraciətləri: DATA_RETENTION_DAYS gündən köhnə (default 180) → silinir
//  - B2B seçim linkləri: 30 gündən köhnə (LIMITS.selectionTtlMs) → silinir
//  - qiymət izləmələri: gediş tarixi keçmiş → silinir
//  - sessiyalar: mütləq və ya hərəkətsizlik müddəti bitmiş → silinir
// İş setInterval ilə işləyir (unref — prosesin bağlanmasını gecikdirmir). Test rejimində default
// söndürülüb (DATA_CLEANUP=1 ilə açılır). Bir neçə nüsxədə hamısı işləyə bilər: DELETE idempotentdir.
const env = require('../env');
const storage = require('./index');
const { logger } = require('../observability/logger');

const DAY_MS = 24 * 3600 * 1000;

async function runCleanup({ repos = storage.get(), now = Date.now(), retentionDays = env.dataRetentionDays } = {}) {
  const { LIMITS } = require('../leads');
  const { IDLE_MS } = require('../auth/sessions');
  const cutoff = new Date(now - retentionDays * DAY_MS);
  const out = {};
  const step = async (name, fn) => {
    try { out[name] = await fn(); } catch (e) { out[name] = null; logger.error(`[cleanup] ${name} alınmadı`, { err: e.message }); }
  };
  await step('leads', () => repos.leads.purgeBefore(cutoff));
  await step('flightRequests', () => repos.flightRequests.purgeBefore(cutoff));
  await step('carRequests', () => repos.carRequests.purgeBefore(cutoff));
  await step('selections', () => repos.selections.purgeBefore(new Date(now - LIMITS.selectionTtlMs)));
  await step('flightAlerts', () => repos.flightAlerts.purgeDepartedBefore(new Date(now).toISOString().slice(0, 10)));
  await step('sessions', () => repos.sessions.purgeExpired({ now, idleMs: IDLE_MS }));
  const total = Object.values(out).reduce((a, b) => a + (b || 0), 0);
  if (total) logger.info('[cleanup] silindi', { deleted: out });
  return out;
}

let timer = null;
function startCleanup({ intervalMs = env.cleanupIntervalMinutes * 60 * 1000, runNow = true } = {}) {
  if (timer) return timer;
  const tick = () => runCleanup().catch((e) => logger.error('[cleanup] xəta', { err: e.message }));
  if (runNow) tick();
  timer = setInterval(tick, intervalMs);
  timer.unref();
  return timer;
}

function stopCleanup() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { runCleanup, startCleanup, stopCleanup };
