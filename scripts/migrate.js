#!/usr/bin/env node
// PostgreSQL miqrasiyalarını tətbiq et (migrations/*.sql). Server açılanda da avtomatik işləyir;
// bu skript əl ilə / deploy addımı kimi istifadə üçündür. Təkrar işə salmaq təhlükəsizdir.
//   DATABASE_URL=postgres://... npm run migrate
//   npm run migrate -- --status      (tətbiq olunmuş və gözləyən miqrasiyalar)
const env = require('../src/env');
const { createPool } = require('../src/db/pool');
const { migrate, listMigrations } = require('../src/db/migrate');

async function main() {
  if (!env.databaseUrl) throw new Error('DATABASE_URL təyin olunmayıb (bax .env.example, docs/OPERATIONS.md)');
  const pool = createPool(env.databaseUrl, { max: 1 });
  try {
    if (process.argv.includes('--status')) {
      const files = listMigrations();
      let done = new Set();
      try {
        done = new Set((await pool.query('SELECT version FROM schema_migrations')).rows.map((r) => r.version));
      } catch (e) {
        if (e.code !== '42P01') throw e; // cədvəl hələ yoxdur
      }
      for (const m of files) console.log(`${done.has(m.version) ? '[tətbiq olunub]' : '[gözləyir]     '} ${m.name}`);
      return;
    }
    const res = await migrate(pool);
    console.log(res.applied.length ? `Tətbiq olundu: ${res.applied.join(', ')}` : `Sxem aktualdır (${res.total} miqrasiya).`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error('Xəta:', e.message); process.exitCode = 1; });
