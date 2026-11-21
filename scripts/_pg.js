// backup/restore skriptləri üçün ortaq köməkçilər (test faylı deyil).
// DATABASE_URL libpq mühit dəyişənlərinə (PGHOST, PGUSER, PGPASSWORD ...) çevrilir ki, parol
// komanda sətrində (ps / shell tarixçəsində) görünməsin.
const { spawn } = require('child_process');
const env = require('../src/env');

function pgEnv(url = env.databaseUrl) {
  if (!url) throw new Error('DATABASE_URL təyin olunmayıb (bax .env.example, docs/OPERATIONS.md)');
  let u;
  try { u = new URL(url); } catch { throw new Error('DATABASE_URL formatı yanlışdır (postgres://istifadəçi:parol@host:port/baza)'); }
  if (!['postgres:', 'postgresql:'].includes(u.protocol)) throw new Error('DATABASE_URL postgres:// ilə başlamalıdır');
  const out = { ...process.env };
  const database = decodeURIComponent(u.pathname.replace(/^\//, ''));
  if (!database) throw new Error('DATABASE_URL-də baza adı yoxdur');
  if (u.hostname) out.PGHOST = decodeURIComponent(u.hostname);
  if (u.searchParams.get('host')) out.PGHOST = u.searchParams.get('host');
  if (u.port) out.PGPORT = u.port;
  if (u.username) out.PGUSER = decodeURIComponent(u.username);
  if (u.password) out.PGPASSWORD = decodeURIComponent(u.password);
  out.PGDATABASE = database;
  // SSL: URL-dəki sslmode > mövcud PGSSLMODE > DATABASE_SSL
  const sslmode = u.searchParams.get('sslmode');
  if (sslmode) out.PGSSLMODE = sslmode;
  else if (!process.env.PGSSLMODE && env.databaseSsl !== 'disable') out.PGSSLMODE = 'require';
  return { env: out, database, host: out.PGHOST || 'localhost', port: out.PGPORT || '5432' };
}

// Komandanı işə sal; proqram tapılmasa aydın xəta
function run(cmd, args, { env: e, stdio = ['ignore', 'inherit', 'inherit'] } = {}) {
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn(cmd, args, { env: e, stdio }); } catch (err) { return reject(err); }
    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`"${cmd}" tapılmadı. PostgreSQL klient alətlərini quraşdırın (məs. Debian/Ubuntu: apt-get install postgresql-client; ` +
          'macOS: brew install libpq) — versiya serverin versiyasından köhnə olmamalıdır.'));
      } else reject(err);
    });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} xəta kodu ilə bitdi: ${code}`))));
  });
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[k] = true;
    else { out[k] = next; i++; }
  }
  return out;
}

module.exports = { pgEnv, run, parseArgs };
