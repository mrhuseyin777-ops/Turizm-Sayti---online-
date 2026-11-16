#!/usr/bin/env node
// B2B agentlik hesabı / istifadəçisi yaratmaq (və ya parolu dəyişmək).
//
//   npm run create-agency -- --agency "Demo Travel" --user aysel --name "Aysel Məmmədova" [--role admin|manager]
//   npm run create-agency -- --user aysel --reset-password        (mövcud istifadəçinin parolunu dəyiş)
//   npm run create-agency -- --list
//
// Parol: TURTAP_PASSWORD mühit dəyişənindən və ya interaktiv (ekranda görünmür) soruşulur.
// Parol HEÇ VAXT komanda sətri arqumenti kimi verilmir (shell tarixçəsində / ps-də görünərdi).
// Hesablar <TURTAP_DATA_DIR>/accounts.json faylında saxlanılır (default: data/, git-ə düşmür).
const readline = require('readline');
const { store } = require('../src/auth/store');
const { hashPassword, checkPolicy } = require('../src/auth/password');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[k] = true;
    else { out[k] = next; i++; }
  }
  return out;
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) return reject(new Error('Interaktiv terminal yoxdur — parolu TURTAP_PASSWORD mühit dəyişəni ilə verin'));
    process.stdout.write(question);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Daxil edilən simvollar ekrana ümumiyyətlə yazılmır (backspace/redraw zamanı da)
    rl._writeToOutput = () => {};
    rl.question('', (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

async function getPassword(username) {
  let pw = process.env.TURTAP_PASSWORD;
  if (!pw) {
    pw = await askHidden('Parol (min. 12 simvol): ');
    const again = await askHidden('Parolu təkrarlayın: ');
    if (pw !== again) throw new Error('Parollar eyni deyil');
  }
  const err = checkPolicy(pw, { username });
  if (err) throw new Error(err);
  return pw;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log('İstifadə: npm run create-agency -- --agency "Ad" --user login --name "Menecer adı" [--role admin|manager]\n' +
      '          npm run create-agency -- --user login --reset-password\n          npm run create-agency -- --list');
    return;
  }
  if (args.list) {
    const list = store.listAgencies();
    if (!list.length) console.log('Hələ agentlik yoxdur.');
    for (const a of list) console.log(`${a.id}  ${a.name}  (${a.users} istifadəçi)`);
    return;
  }

  const username = typeof args.user === 'string' ? store.normUsername(args.user) : '';
  if (!username) throw new Error('--user tələb olunur');

  if (args['reset-password']) {
    const u = store.findUserByUsername(username);
    if (!u) throw new Error('İstifadəçi tapılmadı');
    const pw = await getPassword(username);
    // passwordChangedAt yenilənir → bu istifadəçinin bütün köhnə sessiyaları etibarsız olur
    store.updateUser(u.id, { passwordHash: await hashPassword(pw), passwordChangedAt: new Date().toISOString(), disabled: false });
    console.log(`Parol yeniləndi: ${u.username}`);
    return;
  }

  const agencyName = typeof args.agency === 'string' ? args.agency : '';
  if (!agencyName) throw new Error('--agency tələb olunur');
  if (!store.USERNAME_RE.test(username)) throw new Error('İstifadəçi adı 3–64 simvol: kiçik hərf, rəqəm, . _ @ -');
  if (store.findUserByUsername(username)) throw new Error('Bu istifadəçi adı artıq mövcuddur');
  // Default: yeni agentliyin ilk istifadəçisi admin, mövcud agentliyə əlavə olunan — manager
  const role = args.role === undefined ? (store.findAgencyByName(agencyName) ? 'manager' : 'admin') : args.role;
  if (!store.ROLES.includes(role)) throw new Error('--role admin və ya manager olmalıdır');

  const pw = await getPassword(username);
  let agency = store.findAgencyByName(agencyName);
  const created = !agency;
  if (!agency) agency = store.createAgency(agencyName);
  const user = store.createUser({ agencyId: agency.id, username, displayName: typeof args.name === 'string' ? args.name : username, role, passwordHash: await hashPassword(pw) });
  console.log(`${created ? 'Agentlik yaradıldı' : 'Mövcud agentliyə əlavə olundu'}: ${agency.name}`);
  console.log(`İstifadəçi: ${user.username} (${user.role}) → ${store.file}`);
}

main().catch((e) => { console.error('Xəta:', e.message); process.exit(1); });
