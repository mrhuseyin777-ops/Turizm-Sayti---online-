// PostgreSQL bağlantı hovuzu (pg). Yalnız DATABASE_URL təyin olunanda yaradılır.
// Bütün sorğular parametrləşdirilmişdir ($1, $2 ...) — SQL mətninə istifadəçi dəyəri birləşdirilmir.
const env = require('../env');
const { logger } = require('../observability/logger');

let pool = null;

function sslOption(mode) {
  if (mode === 'require') return { rejectUnauthorized: true };
  // no-verify: trafik şifrələnir, amma server sertifikatı yoxlanmır (MITM riski) — yalnız provayder
  // yoxlanıla bilən sertifikat vermirsə istifadə edin.
  if (mode === 'no-verify') return { rejectUnauthorized: false };
  return false;
}

function createPool(url = env.databaseUrl, { ssl = env.databaseSsl, max = env.databasePoolMax } = {}) {
  if (!url) throw new Error('DATABASE_URL təyin olunmayıb');
  const { Pool } = require('pg');
  const p = new Pool({
    connectionString: url,
    ssl: sslOption(ssl),
    max,
    idleTimeoutMillis: 30 * 1000,
    connectionTimeoutMillis: 10 * 1000,
    statement_timeout: 15 * 1000,
    application_name: 'odiola',
  });
  // Boşda qalan bağlantının xətası prosesi yıxmasın (məs. DB yenidən başladı)
  p.on('error', (e) => logger.error('[db] hovuz xətası', { err: e.message, code: e.code }));
  return p;
}

function getPool() {
  if (!pool) pool = createPool();
  return pool;
}

async function closePool() {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end();
}

// Tranzaksiya köməkçisi: fn(client) xəta atarsa ROLLBACK
async function withTransaction(p, fn) {
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* bağlantı artıq qırılıb */ }
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { createPool, getPool, closePool, withTransaction, sslOption };
