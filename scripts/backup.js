#!/usr/bin/env node
// PostgreSQL backup: pg_dump ilə sıxılmış "custom" formatlı dump (pg_restore ilə bərpa olunur).
//   DATABASE_URL=postgres://... npm run backup
//   BACKUP_DIR=/secure/backups npm run backup          (default: ./backups, git-ə düşmür)
//   BACKUP_KEEP=14 npm run backup                      (istəyə görə: ən yeni 14 faylı saxla, köhnələri sil)
// Fayl adı: etour-<baza>-<YYYYMMDDTHHMMSSZ>.dump, icazələr 0600, qovluq 0700.
// Dump-da şəxsi məlumat (ad, telefon, e-poçt) və parol hash-ləri var — şifrələnmiş yerdə saxlayın.
// Bax: docs/OPERATIONS.md
const fs = require('fs');
const path = require('path');
const { pgEnv, run, parseArgs } = require('./_pg');

const stamp = (d = new Date()) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('İstifadə: npm run backup [-- --dir <qovluq>]   (env: DATABASE_URL, BACKUP_DIR, BACKUP_KEEP)');
    return;
  }
  const pg = pgEnv();
  const dir = path.resolve(typeof args.dir === 'string' ? args.dir : process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'));
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const safeDb = pg.database.replace(/[^A-Za-z0-9_-]/g, '_');
  const file = path.join(dir, `etour-${safeDb}-${stamp()}.dump`);
  const tmp = `${file}.partial`;
  // Fayl əvvəlcədən 0600 icazə ilə yaradılır, pg_dump onun üzərinə yazır
  fs.closeSync(fs.openSync(tmp, 'w', 0o600));
  console.log(`Backup: ${pg.host}:${pg.port}/${pg.database} → ${file}`);
  try {
    await run('pg_dump', ['--format=custom', '--compress=6', '--no-owner', '--no-privileges', `--file=${tmp}`], { env: pg.env });
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw e;
  }
  const size = fs.statSync(file).size;
  console.log(`Hazırdır: ${path.basename(file)} (${(size / 1024).toFixed(1)} KB)`);

  const keep = parseInt(process.env.BACKUP_KEEP, 10);
  if (Number.isInteger(keep) && keep > 0) {
    const prefix = `etour-${safeDb}-`;
    const old = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && /-\d{8}T\d{6}Z\.dump$/.test(f)).sort().reverse().slice(keep);
    for (const f of old) { fs.rmSync(path.join(dir, f)); console.log(`Köhnə backup silindi: ${f}`); }
  }
}

main().catch((e) => { console.error('Xəta:', e.message); process.exitCode = 1; });
