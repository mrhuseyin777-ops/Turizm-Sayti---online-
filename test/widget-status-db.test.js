// Vidjet / marketplace / status linki — real PostgreSQL ilə (006 miqrasiyası). TEST_DATABASE_URL yoxdursa — skip.
// test/db.test.js kimi: ayrıca müvəqqəti sxem (odiola_w_<təsadüfi>) yaradılır və sonda silinir.
const test = require('node:test');

if (!process.env.TEST_DATABASE_URL) {
  test('PostgreSQL: vidjet/marketplace/status', { skip: 'TEST_DATABASE_URL təyin olunmayıb' }, () => {});
  return;
}

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const assert = require('node:assert');
const { Client } = require('pg');

const SCHEMA = `odiola_w_${crypto.randomBytes(5).toString('hex')}`;
const u = new URL(process.env.TEST_DATABASE_URL);
u.searchParams.set('options', `-c search_path=${SCHEMA}`);
process.env.DATABASE_URL = u.toString();
process.env.ETOUR_TEST_DB = '1';
process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-wdb-'));
process.env.TRUST_PROXY = 'loopback';

const { startServer, login, future } = require('./_helpers');
const { hashPassword } = require('../src/auth/password');

let admin;
let app;
let storage;
let repos;
let S;
const PW = 'Wdb-Test-Parol-2026!';
let ipSeq = 0;
const ip = () => `10.88.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const sql = async (text, params) => (await admin.query(text, params)).rows;
const http = (method, p, { cookie, csrf, body } = {}) => fetch(S.base + p, {
  method,
  headers: { 'X-Forwarded-For': ip(), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test.before(async () => {
  admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${SCHEMA}`);
  await admin.query(`SET search_path TO ${SCHEMA}`);
  app = require('../server');
  await app.locals.ready;
  storage = require('../src/storage');
  repos = storage.get();
  S = await startServer(app);
});
test.after(async () => {
  if (S) await S.close();
  if (storage) await storage.close();
  if (admin) { await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`); await admin.end(); }
  fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
});

async function account(name, username) {
  const agency = await repos.accounts.createAgency(name);
  await repos.accounts.createUser({ agencyId: agency.id, username, displayName: 'Menecer', role: 'admin', passwordHash: await hashPassword(PW) });
  const l = await login(S.base, username, PW, { 'X-Forwarded-For': ip() });
  return { agency, s: { cookie: l.cookie, csrf: l.csrf } };
}

test('pg: 006 miqrasiyası — cədvəl/sütunlar, CHECK-lər, idempotent təkrar', async () => {
  assert.strictEqual(storage.mode(), 'postgres');
  const cols = (await sql(`SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'leads'`, [SCHEMA])).map((r) => r.column_name);
  assert.ok(cols.includes('source') && cols.includes('status_token_hash'));
  assert.ok((await sql(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'agency_widget'`, [SCHEMA])).length);
  await admin.query(fs.readFileSync(path.join(__dirname, '..', 'migrations', '006_widget_marketplace_status.sql'), 'utf8'));
  const ag = await repos.accounts.createAgency('Check Agentlik');
  await assert.rejects(sql('INSERT INTO agency_widget (agency_id, public_id) VALUES ($1, $2)', [ag.id, 'short']));
  await assert.rejects(sql(`INSERT INTO leads (type, name, phone, status_token_hash) VALUES ('offer', 'Ad Soyad', '+994501112233', 'plain-token')`));
});

test('pg: vidjet repository + HTTP axını (vidjet müraciəti, marketplace, /r/<token>)', async () => {
  const a = await account('PG Vidjet', 'pg_wg_admin');
  let r = await http('GET', '/api/b2b/widget', a.s);
  const w = await r.json();
  assert.match(w.publicId, /^[A-Za-z0-9_-]{22}$/);
  r = await http('PUT', '/api/b2b/widget', { ...a.s, body: { domains: ['agentlik.az', 'http://localhost:3217'], markupPct: 5 } });
  assert.strictEqual(r.status, 200);
  const row = (await sql('SELECT * FROM agency_widget WHERE agency_id = $1', [a.agency.id]))[0];
  assert.deepStrictEqual(row.frame_domains, ['https://agentlik.az', 'http://localhost:3217']);
  assert.strictEqual(Number(row.markup_pct), 5);
  r = await http('GET', `/w/${w.publicId}`);
  assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/agentlik\.az http:\/\/localhost:3217;/);
  assert.strictEqual((await repos.widgets.getByPublicId(w.publicId)).agencyId, a.agency.id);

  const d = await (await http('GET', `/api/w/${w.publicId}/search?destinationId=antalya&checkIn=${future(40)}&nights=7&adults=2`)).json();
  r = await http('POST', `/api/w/${w.publicId}/leads`, { body: { name: 'PG Müştəri', phone: '+994501110000', ref: d.offers[0].ref, query: d.query } });
  assert.strictEqual(r.status, 201);
  const token = (await r.json()).statusUrl.slice(3);
  const lr = (await sql(`SELECT * FROM leads WHERE name = 'PG Müştəri'`))[0];
  assert.strictEqual(lr.source, 'widget');
  assert.strictEqual(lr.agency_id, a.agency.id);
  assert.strictEqual(lr.status_token_hash, crypto.createHash('sha256').update(token).digest('hex'));
  assert.strictEqual((await sql('SELECT count(*)::int AS n FROM leads WHERE status_token_hash = $1 OR note = $1', [token]))[0].n, 0, 'token açıq saxlanılmır');
  const leads = (await (await http('GET', '/api/b2b/leads', a.s)).json()).leads;
  assert.strictEqual(leads.find((l) => l.name === 'PG Müştəri').source, 'widget');

  const v = await (await http('GET', `/api/r/${token}`)).json();
  assert.strictEqual(v.customer.name, 'P*** M***');
  assert.strictEqual(v.item.price, d.offers[0].price);
  assert.strictEqual((await http('GET', `/api/r/${crypto.randomBytes(24).toString('base64url')}`)).status, 404);

  // Marketplace
  r = await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: 'PG Travel', city: 'Bakı', phone: '+994551112233' } });
  assert.strictEqual(r.status, 200);
  const { partners } = await (await http('GET', '/api/partners')).json();
  const p = partners.find((x) => x.name === 'PG Travel');
  assert.ok(p && !JSON.stringify(partners).includes('ag_'));
  const s = await (await http('GET', `/api/search?destinationId=antalya&checkIn=${future(40)}&nights=7&adults=2&type=package`)).json();
  r = await http('POST', '/api/leads', { body: { type: 'offer', name: 'PG Market', phone: '+994501110001', offerId: s.groups[0].best.id, partner: p.id, query: { type: 'package', adults: '2' } } });
  assert.strictEqual(r.status, 201);
  const mr = (await sql(`SELECT * FROM leads WHERE name = 'PG Market'`))[0];
  assert.strictEqual(mr.source, 'marketplace');
  assert.strictEqual(mr.type, 'selection');
  assert.strictEqual(mr.agency_id, a.agency.id);
  const mv = await (await http('GET', `/api/r/${(await r.json()).statusUrl.slice(3)}`)).json();
  assert.deepStrictEqual(mv.contact, { phone: '+994551112233', whatsapp: '994551112233' });
  // Agentlik silinəndə vidjet ayarları da silinir (CASCADE)
  await sql('DELETE FROM agencies WHERE id = $1', [a.agency.id]);
  assert.strictEqual(await repos.widgets.getByPublicId(w.publicId), null);
});
