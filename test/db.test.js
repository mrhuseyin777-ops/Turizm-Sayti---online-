// PostgreSQL repository testləri (real Postgres ilə). TEST_DATABASE_URL yoxdursa — skip.
//   TEST_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/etour_test npm test
// Hər işə salınma TEST bazasında ayrıca müvəqqəti sxem (etour_t_<təsadüfi>) yaradır və sonda onu silir —
// mövcud cədvəllərə toxunmur. Yenə də TEST_DATABASE_URL-ə yalnız test bazasını verin.
const test = require('node:test');

if (!process.env.TEST_DATABASE_URL) {
  test('PostgreSQL repository testləri', { skip: 'TEST_DATABASE_URL təyin olunmayıb' }, () => {});
  return;
}

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const assert = require('node:assert');
const { Client } = require('pg');

const SCHEMA = `etour_t_${crypto.randomBytes(5).toString('hex')}`;
const SCHEMA2 = `${SCHEMA}_m`;
const withSchema = (schema) => {
  const u = new URL(process.env.TEST_DATABASE_URL);
  u.searchParams.set('options', `-c search_path=${schema}`);
  return u.toString();
};

// Server/storage yüklənməzdən ƏVVƏL: tətbiq bu sxemdəki Postgres-lə işləyir
process.env.DATABASE_URL = withSchema(SCHEMA);
process.env.ETOUR_TEST_DB = '1'; // env.js test rejimində DATABASE_URL-i yalnız bu bayraqla qəbul edir
process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-db-'));
process.env.TRUST_PROXY = 'loopback';

const { startServer, login, client, future } = require('./_helpers');
const { hashPassword } = require('../src/auth/password');

let admin; // sxem yaratmaq/silmək və birbaşa SQL yoxlamaları üçün
let app;
let storage;
let repos;
let S;
const PW = 'Db-Test-Parol-2026!';
let ipSeq = 0;
const ip = () => `10.77.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const sql = async (text, params) => (await admin.query(text, params)).rows;

test.before(async () => {
  admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${SCHEMA}`);
  await admin.query(`CREATE SCHEMA ${SCHEMA2}`);
  await admin.query(`SET search_path TO ${SCHEMA}`);
  app = require('../server');
  await app.locals.ready; // miqrasiyalar
  storage = require('../src/storage');
  repos = storage.get();
  S = await startServer(app);
});

test.after(async () => {
  if (S) await S.close();
  if (storage) await storage.close();
  if (admin) {
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA2} CASCADE`);
    await admin.end();
  }
  fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
});

const account = async (agencyName, username) => {
  const a = repos.accounts;
  const agency = (await a.findAgencyByName(agencyName)) || (await a.createAgency(agencyName));
  const user = await a.createUser({ agencyId: agency.id, username, displayName: 'Menecer', role: 'admin', passwordHash: await hashPassword(PW) });
  return { agency, user };
};

// ---------------------------------------------------------------- Miqrasiyalar
test('miqrasiya: rejim postgres, cədvəllər yaradılıb, təkrar işə salma idempotentdir', async () => {
  assert.strictEqual(storage.mode(), 'postgres');
  assert.strictEqual(repos.kind, 'postgres');
  const tables = (await sql('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', [SCHEMA])).map((r) => r.table_name).sort();
  for (const t of ['agencies', 'users', 'sessions', 'selections', 'leads', 'flight_alerts', 'flight_requests', 'car_requests', 'schema_migrations']) assert.ok(tables.includes(t), t);
  const { migrate } = require('../src/db/migrate');
  const again = await migrate(repos.pool, { log: null });
  assert.deepStrictEqual(again.applied, []);
  assert.strictEqual((await sql('SELECT count(*)::int AS n FROM schema_migrations'))[0].n, again.total);
  // SQL faylının özü də idempotentdir (IF NOT EXISTS) — birbaşa təkrar icra xəta vermir
  const { listMigrations } = require('../src/db/migrate');
  for (const m of listMigrations()) await repos.pool.query(m.sql);
});

test('miqrasiya: bir neçə nüsxə eyni vaxtda — advisory lock, hər miqrasiya bir dəfə; dəyişdirilmiş fayl rədd edilir', async () => {
  const { createPool } = require('../src/db/pool');
  const { migrate, listMigrations } = require('../src/db/migrate');
  const pools = [1, 2, 3, 4].map(() => createPool(withSchema(SCHEMA2), { max: 2 }));
  try {
    const results = await Promise.all(pools.map((p) => migrate(p, { log: null })));
    const total = listMigrations().length;
    assert.strictEqual(results.reduce((n, r) => n + r.applied.length, 0), total, 'hər miqrasiya yalnız bir nüsxədə tətbiq olunur');
    assert.strictEqual((await pools[0].query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n, total);

    // Tətbiq olunmuş faylın məzmunu dəyişibsə — xəta (yeni nömrəli fayl lazımdır)
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-mig-'));
    try {
      for (const m of listMigrations()) fs.writeFileSync(path.join(dir, m.name), m.sql + '\n-- dəyişiklik\n');
      await assert.rejects(migrate(pools[0], { dir, log: null }), /dəyişdirilib/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  } finally {
    await Promise.all(pools.map((p) => p.end()));
  }
});

// ---------------------------------------------------------------- Hesablar
test('accounts: CRUD, unikallıq (böyük/kiçik hərf, az lokalı), xarici açar, məhdudiyyətlər', async () => {
  const a = repos.accounts;
  const ag = await a.createAgency('İstanbul Tur');
  assert.match(ag.id, /^ag_[A-Za-z0-9_-]{12}$/);
  assert.deepStrictEqual(await a.getAgency(ag.id), ag);
  assert.strictEqual((await a.findAgencyByName('istanbul tur')).id, ag.id, 'az lokalı: İ → i');
  await assert.rejects(a.createAgency('İSTANBUL TUR'), /artıq var/);
  await assert.rejects(a.createAgency('x'), /2 simvol/);

  const u = await a.createUser({ agencyId: ag.id, username: 'Db-User', displayName: 'Aysel', role: 'manager', passwordHash: await hashPassword(PW) });
  assert.strictEqual(u.username, 'db-user');
  assert.strictEqual(u.agencyId, ag.id);
  assert.strictEqual(u.disabled, false);
  assert.strictEqual((await a.findUserByUsername('DB-USER')).id, u.id);
  await assert.rejects(a.createUser({ agencyId: ag.id, username: 'db-user', role: 'manager', passwordHash: u.passwordHash }), /artıq mövcuddur/);
  await assert.rejects(a.createUser({ agencyId: 'ag_yoxdurYoxdur', username: 'other-user', role: 'manager', passwordHash: u.passwordHash }), /Agentlik tapılmadı/);
  await assert.rejects(a.createUser({ agencyId: ag.id, username: 'x y', role: 'manager', passwordHash: u.passwordHash }), /İstifadəçi adı/);
  await assert.rejects(a.createUser({ agencyId: ag.id, username: 'role-user', role: 'root', passwordHash: u.passwordHash }), /Rol/);

  const changed = new Date(Date.now() - 1000).toISOString();
  const upd = await a.updateUser(u.id, { disabled: true, displayName: 'Aysel M.', passwordChangedAt: changed, ignored: 'x', username: 'hacker' });
  assert.strictEqual(upd.disabled, true);
  assert.strictEqual(upd.displayName, 'Aysel M.');
  assert.strictEqual(upd.passwordChangedAt, changed);
  assert.strictEqual(upd.username, 'db-user', 'ağ siyahıda olmayan sahə dəyişmir');
  await assert.rejects(a.updateUser('usr_yoxdurYoxdur', { disabled: true }), /tapılmadı/);
  const list = await a.listAgencies();
  assert.strictEqual(list.find((x) => x.id === ag.id).users, 1);

  // DB səviyyəsində CHECK: hash formatı, rol
  await assert.rejects(sql(`INSERT INTO ${SCHEMA}.users (id, agency_id, username, display_name, role, password_hash) VALUES ($1, $2, 'raw-user', 'R', 'admin', 'plain')`, ['usr_AAAAAAAAAAAA', ag.id]));
  await assert.rejects(sql(`INSERT INTO ${SCHEMA}.users (id, agency_id, username, display_name, role, password_hash) VALUES ($1, $2, 'raw-user', 'R', 'owner', 'scrypt$x')`, ['usr_AAAAAAAAAAAA', ag.id]));
});

// ---------------------------------------------------------------- Sessiyalar
test('sessiya: DB-də yalnız SHA-256 hash, müddət bitməsi, istifadəçi limiti, təmizləmə', async () => {
  const sessions = require('../src/auth/sessions');
  const { user } = await account('Sess DB', 'sess-db');
  const res = { cookies: [], append(k, v) { this.cookies.push(v); } };
  const { id, session } = await sessions.create(user, res);
  assert.match(res.cookies[0], /HttpOnly; SameSite=Strict/);
  const rows = await sql(`SELECT * FROM ${SCHEMA}.sessions WHERE user_id = $1`, [user.id]);
  assert.strictEqual(rows.length, 1);
  assert.notStrictEqual(rows[0].id_hash, id, 'id açıq saxlanılmır');
  assert.strictEqual(rows[0].id_hash, crypto.createHash('sha256').update(id).digest('base64url'));
  assert.ok(!JSON.stringify(rows).includes(id));
  assert.strictEqual(rows[0].expires_at.getTime(), session.createdAt + sessions.MAX_MS);

  const req = { headers: { cookie: `${sessions.COOKIE}=${id}` } };
  const found = await sessions.fromRequest(req);
  assert.strictEqual(found.session.userId, user.id);
  assert.strictEqual(found.session.csrf, session.csrf);
  assert.strictEqual(await sessions.fromRequest({ headers: { cookie: `${sessions.COOKIE}=${'A'.repeat(43)}` } }), null);
  assert.strictEqual(await sessions.fromRequest({ headers: { cookie: `${sessions.COOKIE}=' OR '1'='1` } }), null);

  // Hərəkətsizlik müddəti bitib → null və sətir silinir
  await sql(`UPDATE ${SCHEMA}.sessions SET last_seen_at = now() - ($2 || ' milliseconds')::interval WHERE user_id = $1`, [user.id, String(sessions.IDLE_MS + 5000)]);
  assert.strictEqual(await sessions.fromRequest(req), null);
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.sessions WHERE user_id = $1`, [user.id]))[0].n, 0);

  // Bir istifadəçinin maks. MAX_PER_USER sessiyası
  for (let i = 0; i < sessions.MAX_PER_USER + 3; i++) await sessions.create(user, res);
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.sessions WHERE user_id = $1`, [user.id]))[0].n, sessions.MAX_PER_USER);

  // purgeExpired: mütləq müddəti bitmiş
  await sql(`UPDATE ${SCHEMA}.sessions SET created_at = now() - interval '2 days', expires_at = now() - interval '1 minute' WHERE user_id = $1`, [user.id]);
  const n = await repos.sessions.purgeExpired({ idleMs: sessions.IDLE_MS });
  assert.ok(n >= sessions.MAX_PER_USER);
  await sessions.destroyForUser(user.id);
  // İstifadəçi silinəndə sessiyalar da silinir (ON DELETE CASCADE)
  await sessions.create(user, res);
  await sql(`DELETE FROM ${SCHEMA}.users WHERE id = $1`, [user.id]);
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.sessions WHERE user_id = $1`, [user.id]))[0].n, 0);
});

// ---------------------------------------------------------------- Seçimlər və leadlər, IDOR
const stubResolver = async (q, ids) => ({ pax: { adults: 2, children: 0 }, offers: ids.map((id) => ({ id, name: 'Otel DB', destination: { name: 'Antalya' }, stars: 5, checkIn: future(30), nights: 7, board: 'AI', providerName: 'Summer Tour', price: 1000, prepayment: 'none' })) });

test('IDOR: agentlik A agentlik B-nin leadlərini görmür (repository + HTTP)', async () => {
  const { createSelection, createLead, leadsForAgency, getSelectionRecord, publicSelection } = require('../src/leads');
  const A = await account('IDOR A DB', 'idor-a-db');
  const B = await account('IDOR B DB', 'idor-b-db');
  const sel = await createSelection({ markup: 10, query: {}, offerIds: ['summer:x'], client: 'Elvin' }, { account: { agencyId: A.agency.id, agencyName: A.agency.name, managerName: 'M' }, resolveOffers: stubResolver });
  const stored = await getSelectionRecord(sel.id);
  assert.strictEqual(stored.agencyId, A.agency.id);
  assert.strictEqual(stored.items[0].clientPrice, 1100);
  assert.strictEqual(stored.markup, 10);
  assert.ok(!JSON.stringify(publicSelection(stored)).includes('Summer Tour'));

  const lead = await createLead({ type: 'selection', selectionId: sel.id, itemIndex: 0, name: 'Gizli Müştəri', phone: '+994551112233' });
  assert.ok(Number.isInteger(lead.id) && lead.id > 0);
  assert.strictEqual(lead.agencyId, A.agency.id);
  assert.ok((await leadsForAgency(A.agency.id)).some((l) => l.id === lead.id && l.item.providerName === 'Summer Tour'));
  assert.deepStrictEqual(await leadsForAgency(B.agency.id), []);
  assert.deepStrictEqual(await leadsForAgency(A.agency.name), [], 'ad ilə yox, yalnız id ilə');

  // HTTP: B daxil olub ?agency= / ?agencyId= ilə A-nın leadini görə bilmir
  const b = await login(S.base, 'idor-b-db', PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(b.res.status, 200);
  for (const p of ['/api/b2b/leads', `/api/b2b/leads?agencyId=${A.agency.id}`, '/api/b2b/leads?agency=IDOR%20A%20DB']) {
    const lb = await (await client(S.base, b).get(p)).json();
    assert.ok(!lb.leads.some((l) => l.name === 'Gizli Müştəri'), p);
  }
  const a = await login(S.base, 'idor-a-db', PW, { 'X-Forwarded-For': ip() });
  const la = await (await client(S.base, a).get('/api/b2b/leads')).json();
  assert.ok(la.leads.some((l) => l.name === 'Gizli Müştəri'));
});

test('seçim limiti: agentlik limitə çatanda yalnız ÖZ köhnə linkləri silinir (DB)', async () => {
  const { createSelection, getSelectionRecord, LIMITS } = require('../src/leads');
  const X = await account('Limit X DB', 'limit-x-db');
  const Y = await account('Limit Y DB', 'limit-y-db');
  const prev = LIMITS.selectionsPerAgency;
  LIMITS.selectionsPerAgency = 3;
  try {
    const other = await createSelection({ query: {}, offerIds: ['a'] }, { account: { agencyId: Y.agency.id, agencyName: 'Y' }, resolveOffers: stubResolver });
    const mine = [];
    for (let i = 0; i < 6; i++) {
      mine.push(await createSelection({ query: {}, offerIds: ['a'] }, { account: { agencyId: X.agency.id, agencyName: 'X' }, resolveOffers: stubResolver }));
      await new Promise((r) => setTimeout(r, 3)); // created_at fərqli olsun
    }
    assert.ok(await getSelectionRecord(other.id));
    assert.strictEqual(await repos.selections.countForAgency(X.agency.id), 3);
    assert.ok((await getSelectionRecord(mine[5].id)) && !(await getSelectionRecord(mine[0].id)));
  } finally { LIMITS.selectionsPerAgency = prev; }
});

// ---------------------------------------------------------------- SQL injection
test('SQL injection: payload-lar data kimi işlənir, cədvəllər toxunulmaz qalır', async () => {
  const { createLead, leadsForAgency, getSelectionRecord } = require('../src/leads');
  const a = repos.accounts;
  const payloads = ["' OR '1'='1", "'; DROP TABLE users; --", "x' UNION SELECT * FROM users --", '$1; DELETE FROM leads', "\\'; TRUNCATE sessions; --"];
  const usersBefore = (await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.users`))[0].n;
  for (const p of payloads) {
    assert.strictEqual(await a.findUserByUsername(p), null, p);
    assert.strictEqual(await a.findAgencyByName(p), null, p);
    assert.strictEqual(await a.getUser(p), null, p);
    assert.strictEqual(await a.getAgency(p), null, p);
    assert.deepStrictEqual(await leadsForAgency(p), [], p);
    assert.strictEqual(await getSelectionRecord(p), null, p);
    assert.strictEqual(await repos.sessions.get(p), null, p);
    assert.strictEqual(await repos.flightAlerts.get(p), null, p);
  }
  // Payload agentlik adı / qeyd kimi olduğu kimi saxlanılır (icra olunmur)
  const evil = await a.createAgency("Evil'); DROP TABLE agencies; --");
  assert.strictEqual((await a.getAgency(evil.id)).name, "Evil'); DROP TABLE agencies; --");
  const lead = await createLead({ type: 'callback', name: "O'Brien", phone: '+994501112233', note: "'); DROP TABLE leads; --", context: "1' OR '1'='1" });
  const row = (await sql(`SELECT name, note, context FROM ${SCHEMA}.leads WHERE id = $1`, [lead.id]))[0];
  assert.deepStrictEqual(row, { name: "O'Brien", note: "'); DROP TABLE leads; --", context: "1' OR '1'='1" });
  // HTTP login: injection payload-u ilə giriş alınmır
  const r = await login(S.base, "admin' --", "' OR '1'='1", { 'X-Forwarded-For': ip() });
  assert.ok([400, 401].includes(r.res.status));
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.users`))[0].n, usersBefore);
  for (const t of ['users', 'agencies', 'leads', 'sessions']) assert.ok((await sql('SELECT to_regclass($1) AS t', [`${SCHEMA}.${t}`]))[0].t, `${t} cədvəli yerindədir`);
});

// ---------------------------------------------------------------- Qiymət izləmələri
test('qiymət izləmə (DB): token hash, IP hash, tapma/silmə, keçmiş tarixlilər silinir', async () => {
  const { createAlertStore } = require('../src/flights/alerts');
  const store = createAlertStore({ repo: repos.flightAlerts });
  const route = { from: 'GYD', to: 'IST,SAW', trip: 'oneway', adults: '1' };
  const A = await store.create({ ...route, depart: future(40), mode: 'drop10', email: 'db@example.az' }, { ip: '10.1.2.3' });
  const B = await store.create({ ...route, depart: future(12), mode: 'daily' }, { ip: '10.1.2.3' });
  const row = (await sql(`SELECT * FROM ${SCHEMA}.flight_alerts WHERE id = $1`, [A.alert.id]))[0];
  assert.strictEqual(row.token_hash, crypto.createHash('sha256').update(A.token).digest('hex'));
  assert.ok(!JSON.stringify(row).includes(A.token) && !JSON.stringify(row).includes('10.1.2.3'));
  assert.strictEqual(row.route.depart, future(40));
  assert.strictEqual(await repos.flightAlerts.countByIpKey(row.ip_key), 2);

  assert.strictEqual((await store.find(A.alert.id, A.token)).email, 'db@example.az');
  assert.strictEqual(await store.find(A.alert.id, B.token), null);
  assert.strictEqual(await store.remove(A.alert.id, B.token), false);
  const checks = await store.runCheck();
  assert.ok(checks.length >= 2 && checks.every((c) => c.sent === false));
  assert.ok((await store.find(B.alert.id, B.token)).lastCheckedAt);
  assert.strictEqual(await store.purge(future(20)), 1, 'gediş tarixi keçmiş B silinir');
  assert.strictEqual(await store.find(B.alert.id, B.token), null);
  assert.strictEqual(await store.remove(A.alert.id, A.token), true);
  assert.strictEqual(await store.find(A.alert.id, A.token), null);
});

// ---------------------------------------------------------------- Data retention
test('retention: köhnə leadlər/müraciətlər, 30 günlük seçimlər, bitmiş sessiya və izləmələr silinir', async () => {
  const { runCleanup } = require('../src/storage/cleanup');
  const { createSelection, createLead } = require('../src/leads');
  const R = await account('Retention DB', 'retention-db');
  const sel = await createSelection({ query: {}, offerIds: ['r'] }, { account: { agencyId: R.agency.id, agencyName: R.agency.name }, resolveOffers: stubResolver });
  const oldLead = await createLead({ type: 'selection', selectionId: sel.id, itemIndex: 0, name: 'Köhnə Müştəri', phone: '+994501112233' });
  const newLead = await createLead({ type: 'callback', name: 'Yeni Müştəri', phone: '+994501112244' });
  const fr = await repos.flightRequests.insert({ name: 'Uçan', phone: '+994501112233', email: null, note: '', flightId: 'J2123:GYDIST:202612200835', offerId: null, ipHash: 'abc' });
  const cr = await repos.carRequests.insert({ kind: 'rental', name: 'Sürücü', phone: '+994501112233', note: '', offerId: 'a|b', summary: { total: 1 } });
  await sql(`UPDATE ${SCHEMA}.leads SET created_at = now() - interval '181 days' WHERE id = $1`, [oldLead.id]);
  await sql(`UPDATE ${SCHEMA}.flight_requests SET created_at = now() - interval '200 days' WHERE id = $1`, [fr.id]);
  await sql(`UPDATE ${SCHEMA}.selections SET created_at = now() - interval '31 days' WHERE id = $1`, [sel.id]);
  const fresh = await repos.carRequests.insert({ kind: 'transfer', name: 'Təzə', phone: '+994501112233', note: '', offerId: 'c|d', summary: { total: 2 } });
  await sql(`UPDATE ${SCHEMA}.car_requests SET created_at = now() - interval '400 days' WHERE id = $1`, [cr.id]);
  await repos.flightAlerts.insert({ id: 'fa_' + 'r'.repeat(16), tokenHash: 'a'.repeat(64), route: { from: 'GYD', to: 'IST', depart: '2020-01-01' }, mode: 'daily', email: null, initialPrice: 1, lastPrice: 1, lastCheckedAt: null, lastNotifiedAt: null, createdAt: new Date().toISOString(), ipKey: null });

  const out = await runCleanup({ retentionDays: 180 });
  assert.ok(out.leads >= 1 && out.flightRequests >= 1 && out.carRequests >= 1 && out.selections >= 1 && out.flightAlerts >= 1, JSON.stringify(out));
  const ids = async (t) => (await sql(`SELECT id FROM ${SCHEMA}.${t}`)).map((r) => String(r.id));
  assert.ok(!(await ids('leads')).includes(String(oldLead.id)));
  assert.ok((await ids('leads')).includes(String(newLead.id)));
  assert.ok(!(await ids('flight_requests')).includes(String(fr.id)));
  assert.ok(!(await ids('car_requests')).includes(String(cr.id)));
  assert.ok((await ids('car_requests')).includes(String(fresh.id)));
  assert.ok(!(await ids('selections')).includes(sel.id));
  assert.ok(!(await ids('flight_alerts')).includes('fa_' + 'r'.repeat(16)));
  // Seçim silinəndə ona bağlı (hələ retention müddətində olan) lead qalır, selection_id NULL olur
  const sel2 = await createSelection({ query: {}, offerIds: ['r'] }, { account: { agencyId: R.agency.id, agencyName: R.agency.name }, resolveOffers: stubResolver });
  const l2 = await createLead({ type: 'selection', selectionId: sel2.id, itemIndex: 0, name: 'Qalan Müştəri', phone: '+994501112233' });
  await sql(`UPDATE ${SCHEMA}.selections SET created_at = now() - interval '31 days' WHERE id = $1`, [sel2.id]);
  await runCleanup();
  const kept = (await sql(`SELECT selection_id, agency_id FROM ${SCHEMA}.leads WHERE id = $1`, [l2.id]))[0];
  assert.deepStrictEqual(kept, { selection_id: null, agency_id: R.agency.id });
});

// ---------------------------------------------------------------- HTTP inteqrasiya
test('HTTP (DB): login → sessiya DB-də, logout sətri silir; avia/avto müraciətləri DB-yə yazılır (IP yalnız hash)', async () => {
  await account('HTTP DB', 'http-db');
  const s = await login(S.base, 'http-db', PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(s.res.status, 200);
  const me = await (await client(S.base, s).get('/api/b2b/me')).json();
  assert.strictEqual(me.authenticated, true);
  assert.strictEqual(me.agency.name, 'HTTP DB');
  const uid = (await repos.accounts.findUserByUsername('http-db')).id;
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.sessions WHERE user_id = $1`, [uid]))[0].n, 1);
  assert.ok((await repos.accounts.getUser(uid)).lastLoginAt);
  assert.strictEqual((await client(S.base, s).post('/api/b2b/logout', {})).status, 200);
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.sessions WHERE user_id = $1`, [uid]))[0].n, 0);
  assert.strictEqual((await client(S.base, s).get('/api/b2b/leads')).status, 401);

  const fs1 = await (await fetch(`${S.base}/api/flights/search?from=GYD&to=IST&depart=${future(25)}&calendar=0`, { headers: { 'X-Forwarded-For': ip() } })).json();
  const clientIp = ip();
  const fr = await fetch(`${S.base}/api/flights/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': clientIp }, body: JSON.stringify({ name: 'Test İstifadəçi', phone: '+994501234567', flightId: fs1.groups[0].id }) });
  assert.strictEqual(fr.status, 201);
  const frId = (await fr.json()).id;
  const frRow = (await sql(`SELECT * FROM ${SCHEMA}.flight_requests WHERE id = $1`, [frId]))[0];
  assert.strictEqual(frRow.name, 'Test İstifadəçi');
  assert.match(frRow.ip_hash, /^[0-9a-f]{24}$/);
  assert.ok(!JSON.stringify(frRow).includes(clientIp));

  const cs = await (await fetch(`${S.base}/api/cars/search?pickup=antalya&from=${future(20)}&to=${future(25)}&currency=USD`, { headers: { 'X-Forwarded-For': ip() } })).json();
  const cr = await fetch(`${S.base}/api/cars/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ name: 'Test', phone: '+994501112233', kind: 'rental', query: { pickup: 'antalya', from: future(20), to: future(25), currency: 'USD' }, offerId: cs.groups[0].best.id }) });
  assert.strictEqual(cr.status, 201);
  const crRow = (await sql(`SELECT * FROM ${SCHEMA}.car_requests WHERE id = $1`, [(await cr.json()).id]))[0];
  assert.strictEqual(crRow.kind, 'rental');
  assert.strictEqual(crRow.summary.currency, 'USD');

  // Qiymət izləmə API-si DB üzərində
  const al = await fetch(`${S.base}/api/flights/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ from: 'GYD', to: 'DXB', depart: future(45), mode: 'daily' }) });
  assert.strictEqual(al.status, 201);
  const A = await al.json();
  assert.strictEqual((await fetch(`${S.base}/api/flights/alerts/${A.id}`, { headers: { 'X-Alert-Token': A.token } })).status, 200);
  assert.strictEqual((await sql(`SELECT count(*)::int AS n FROM ${SCHEMA}.flight_alerts WHERE id = $1`, [A.id]))[0].n, 1);
});

test('bootstrap admin (DB): hesab DB-də yaradılır, env-dəki parol dəyişəndə yenilənir', async () => {
  const { seedBootstrapAdmin } = require('../src/auth');
  const acc = { agency: 'Boot DB', username: 'boot-db', password: 'Gx7!kq2#Lm9vTz-1', displayName: 'Admin' };
  const u = await seedBootstrapAdmin(acc);
  assert.ok(u && u.role === 'admin');
  assert.strictEqual(await seedBootstrapAdmin(acc), null);
  const before = await repos.accounts.findUserByUsername('boot-db');
  assert.strictEqual(await seedBootstrapAdmin({ ...acc, password: 'Gx7!kq2#Lm9vTz-2' }), null);
  const after = await repos.accounts.findUserByUsername('boot-db');
  assert.notStrictEqual(after.passwordHash, before.passwordHash);
  assert.ok(Date.parse(after.passwordChangedAt) >= Date.parse(before.passwordChangedAt));
  assert.strictEqual((await login(S.base, 'boot-db', 'Gx7!kq2#Lm9vTz-2', { 'X-Forwarded-For': ip() })).res.status, 200);
});

// ---------------------------------------------------------------- Health check (DB rejimi)
test('/readyz: PostgreSQL rejimində SELECT 1 ilə 200; /healthz 200; cavabda daxili detal yoxdur', async () => {
  for (const p of ['/readyz', '/healthz']) {
    const r = await fetch(S.base + p);
    assert.strictEqual(r.status, 200, p);
    assert.deepStrictEqual(await r.json(), { status: 'ok' });
  }
});
