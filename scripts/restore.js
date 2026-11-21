#!/usr/bin/env node
// PostgreSQL bərpası (pg_restore) — TƏHLÜKƏLİ ƏMƏLİYYAT: hədəf bazadakı cədvəllər dump-dakı
// vəziyyətlə ƏVƏZ OLUNUR (--clean). Dump-dan sonra yaranmış məlumat (yeni leadlər, hesablar) itir.
//   DATABASE_URL=postgres://... npm run restore -- backups/etour-etour-20261121T101500Z.dump
// Təsdiq: interaktiv terminalda baza adını yazmaq tələb olunur; avtomatlaşdırmada
//   npm run restore -- <fayl> --confirm <baza_adı>
// Əvvəlcə cari vəziyyətin backup-ını götürün (npm run backup). Bax: docs/OPERATIONS.md
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { pgEnv, run, parseArgs } = require('./_pg');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (a) => { rl.close(); resolve(a); });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file || args.help) {
    console.log('İstifadə: npm run restore -- <dump faylı> [--confirm <baza_adı>]');
    if (!file && !args.help) process.exitCode = 1;
    return;
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error(`Fayl tapılmadı: ${abs}`);
  const pg = pgEnv();

  console.warn('================================================================');
  console.warn(' DİQQƏT: TƏHLÜKƏLİ ƏMƏLİYYAT — bazadakı məlumat dump ilə əvəz olunacaq');
  console.warn(`   Hədəf: ${pg.host}:${pg.port}/${pg.database}`);
  console.warn(`   Fayl:  ${abs}`);
  if (process.env.NODE_ENV === 'production') console.warn('   NODE_ENV=production — bu, CANLI baza ola bilər!');
  console.warn(' Davam etməzdən əvvəl cari vəziyyətin backup-ını götürün (npm run backup)');
  console.warn(' və mümkünsə tətbiqi dayandırın (yazılar bərpa ilə toqquşmasın).');
  console.warn('================================================================');

  let confirmed = args.confirm;
  if (confirmed === undefined || confirmed === true) {
    if (!process.stdin.isTTY) throw new Error('Təsdiq yoxdur: interaktiv terminal yoxdursa --confirm <baza_adı> verin');
    confirmed = (await ask(`Təsdiq üçün baza adını yazın (${pg.database}): `)).trim();
  }
  if (confirmed !== pg.database) throw new Error('Təsdiq uyğun gəlmədi — bərpa LƏĞV edildi, heç nə dəyişmədi');

  await run('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--single-transaction', '--exit-on-error', `--dbname=${pg.database}`, abs], { env: pg.env });
  console.log('Bərpa tamamlandı. Tətbiqi yenidən başladın; açılışda miqrasiyalar yoxlanılacaq.');
}

main().catch((e) => { console.error('Xəta:', e.message); process.exitCode = 1; });
