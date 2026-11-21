// Miqrasiyalar: migrations/NNN_ad.sql faylları nömrə sırası ilə, hər biri öz tranzaksiyasında tətbiq
// olunur və schema_migrations cədvəlində qeyd edilir (versiya + SHA-256 checksum).
//
// Bir neçə server nüsxəsi eyni vaxtda açılsa: pg_advisory_lock ilə yalnız biri miqrasiya edir,
// digərləri gözləyir, sonra artıq tətbiq olunmuş versiyaları ötürür. SQL faylları özləri də
// idempotentdir (CREATE ... IF NOT EXISTS), təkrar işə salma təhlükəsizdir.
//
// Tətbiq olunmuş miqrasiya faylı sonradan dəyişdirilibsə (checksum fərqli) — xəta: yeni dəyişiklik
// yeni nömrəli faylda olmalıdır.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');
// Sabit advisory lock açarı (Odiola miqrasiyaları üçün; ixtiyari 64-bit ədəd)
const LOCK_KEY = '727274001';
const FILE_RE = /^(\d{3,})_[a-z0-9_-]+\.sql$/;

function listMigrations(dir = MIGRATIONS_DIR) {
  return fs.readdirSync(dir)
    .filter((f) => FILE_RE.test(f))
    .sort()
    .map((f) => {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      return { version: f.match(FILE_RE)[1], name: f, sql, checksum: crypto.createHash('sha256').update(sql).digest('hex') };
    });
}

async function migrate(pool, { dir = MIGRATIONS_DIR, log = console } = {}) {
  const files = listMigrations(dir);
  const seen = new Set();
  for (const m of files) {
    if (seen.has(m.version)) throw new Error(`Təkrarlanan miqrasiya nömrəsi: ${m.version}`);
    seen.add(m.version);
  }
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query('SELECT pg_advisory_lock($1::bigint)', [LOCK_KEY]);
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        name text NOT NULL,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      const { rows } = await client.query('SELECT version, checksum FROM schema_migrations');
      const done = new Map(rows.map((r) => [r.version, r.checksum]));
      for (const m of files) {
        if (done.has(m.version)) {
          if (done.get(m.version) !== m.checksum) throw new Error(`Miqrasiya ${m.name} tətbiq olunduqdan sonra dəyişdirilib — yeni nömrəli fayl yaradın`);
          continue;
        }
        await client.query('BEGIN');
        try {
          await client.query(m.sql);
          await client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)', [m.version, m.name, m.checksum]);
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw new Error(`Miqrasiya ${m.name} alınmadı: ${e.message}`, { cause: e });
        }
        applied.push(m.name);
        if (log) log.info(`[db] miqrasiya tətbiq olundu: ${m.name}`);
      }
    } finally {
      await client.query('SELECT pg_advisory_unlock($1::bigint)', [LOCK_KEY]).catch(() => {});
    }
  } finally {
    client.release();
  }
  return { applied, total: files.length };
}

module.exports = { migrate, listMigrations, MIGRATIONS_DIR, LOCK_KEY };
