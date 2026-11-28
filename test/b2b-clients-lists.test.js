// B2B müştəri bazası (mini-CRM), tövsiyə olunan otel siyahıları və kanal postu generatoru:
// CRUD, validasiya, auth/CSRF/Origin, IDOR (yalnız öz agentliyi), tarixçə (yeni client_id + köhnə ad/telefon əlaqəsi),
// "Unut" (anonimləşdirmə), saxlama müddəti, siyahı filtri ilə axtarış, post mətnində operator adının olmaması.
// TEST_DATABASE_URL təyin olunubsa eyni testlər real PostgreSQL ilə (müvəqqəti sxemdə) işləyir, yoxdursa — yaddaşda.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PG = !!process.env.TEST_DATABASE_URL;
const SCHEMA = `odiola_cl_${crypto.randomBytes(5).toString('hex')}`;
let admin = null;
if (PG) {
  const u = new URL(process.env.TEST_DATABASE_URL);
  u.searchParams.set('options', `-c search_path=${SCHEMA}`);
  process.env.DATABASE_URL = u.toString();
  process.env.ETOUR_TEST_DB = '1';
  process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-cl-'));
}

const Post = require('../public/js/b2b-post.js');
const { startServer, createAccount, login, future } = require('./_helpers');

let app;
let storage;
let S;
const PW = 'Test-Parol-Uzun-2026';

test.before(async () => {
  if (PG) {
    const { Client } = require('pg');
    admin = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.connect();
    await admin.query(`CREATE SCHEMA ${SCHEMA}`);
  }
  app = require('../server');
  await app.locals.ready;
  storage = require('../src/storage');
  S = await startServer(app);
});

test.after(async () => {
  if (S) await S.close();
  if (PG) {
    await storage.close();
    await admin.query(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await admin.end();
    fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
  }
});

// who = { cookie, csrf }
const call = (who, method, p, body, extra = {}) => fetch(S.base + p, {
  method,
  headers: { ...(who && who.cookie ? { Cookie: who.cookie } : {}), 'Content-Type': 'application/json', ...(who && who.csrf ? { 'X-CSRF-Token': who.csrf } : {}), ...extra },
  body: method === 'GET' ? undefined : JSON.stringify(body || {}),
});
const json = async (res) => ({ status: res.status, body: await res.json() });

let A; let B; let accA; let accB;
async function sessions() {
  if (A) return;
  accA = await createAccount({ agency: 'CRM Agentlik A', username: 'crm-a', displayName: 'Aysel', password: PW });
  accB = await createAccount({ agency: 'CRM Agentlik B', username: 'crm-b', displayName: 'Bəhruz', password: PW });
  A = await login(S.base, 'crm-a', PW);
  B = await login(S.base, 'crm-b', PW);
  assert.strictEqual(A.res.status, 200);
  assert.strictEqual(B.res.status, 200);
}

// ---------------------------------------------------------------- Müştəri CRUD + validasiya + auth
test('müştərilər: auth/CSRF/Origin, yaratma, validasiya, siyahı/axtarış, yeniləmə', async () => {
  await sessions();
  // Girişsiz → 401; CSRF/Origin → 403
  assert.strictEqual((await fetch(`${S.base}/api/b2b/clients`)).status, 401);
  assert.strictEqual((await call(null, 'POST', '/api/b2b/clients', { name: 'Elvin' })).status, 401);
  assert.strictEqual((await call({ cookie: A.cookie }, 'POST', '/api/b2b/clients', { name: 'Elvin' })).status, 403, 'CSRF tokensiz');
  assert.strictEqual((await call(A, 'POST', '/api/b2b/clients', { name: 'Elvin' }, { Origin: 'https://evil.example' })).status, 403);
  assert.strictEqual((await call(A, 'POST', '/api/b2b/clients', 'x', { 'Content-Type': 'text/plain' })).status, 415);

  // Validasiya
  const bad = [
    [{ name: 'E' }, /2–80/],
    [{ name: 'Elvin', phone: 'abc' }, /Telefon/],
    [{ name: 'Elvin', email: 'yox@' }, /E-poçt/],
    [{ name: 'Elvin', childAges: [4, 18] }, /0–17/],
    [{ name: 'Elvin', childAges: [1, 2, 3, 4, 5, 6, 7] }, /6/],
    [{ name: 'Elvin', adults: 9 }, /1–8/],
    [{ name: 'Elvin', budget: -5 }, /Büdcə/],
    [{ name: 'Elvin', board: 'XX' }, /Qida/],
    [{ name: 'Elvin', note: 'x'.repeat(1001) }, /1000/],
    [{ name: 'Elvin', agencyId: 'ag_xxxxxxxxxxxx' }, /İcazə verilməyən/],
    [{ name: { $ne: 1 } }, /ad/i],
  ];
  for (const [body, re] of bad) {
    const r = await json(await call(A, 'POST', '/api/b2b/clients', body));
    assert.strictEqual(r.status, 400, JSON.stringify(body));
    assert.match(r.body.error, re);
  }

  const c = await json(await call(A, 'POST', '/api/b2b/clients', {
    name: '  Elvin   Məmmədov\u0007 ', phone: '+994 50 123 45 67', email: 'elvin@example.az', adults: 2, childAges: [4, 9],
    budget: 4000, destinations: ['Antalya', ' Antalya ', 'Dubay'], board: 'AI', note: 'Dənizə yaxın otel istəyir',
  }));
  assert.strictEqual(c.status, 201);
  const cl = c.body.client;
  assert.match(cl.id, /^cl_[A-Za-z0-9_-]{12}$/);
  assert.strictEqual(cl.name, 'Elvin Məmmədov');
  assert.deepStrictEqual(cl.childAges, [4, 9]);
  assert.deepStrictEqual(cl.destinations, ['Antalya', 'Dubay']);
  assert.strictEqual(cl.budget, 4000);
  assert.strictEqual(cl.createdBy, 'Aysel');
  assert.ok(!('agencyId' in cl), 'daxili sahə cavabda yoxdur');

  await call(A, 'POST', '/api/b2b/clients', { name: 'Nigar Əliyeva', phone: '055 222 33 44' });
  const all = await json(await call(A, 'GET', '/api/b2b/clients'));
  assert.strictEqual(all.body.clients.length, 2);
  assert.strictEqual(all.body.limits.retentionDays, 365);
  assert.deepStrictEqual((await json(await call(A, 'GET', '/api/b2b/clients?q=elvin'))).body.clients.map((x) => x.id), [cl.id]);
  assert.strictEqual((await json(await call(A, 'GET', '/api/b2b/clients?q=2223'))).body.clients[0].name, 'Nigar Əliyeva', 'telefon rəqəmləri ilə axtarış');

  // PATCH: yalnız ağ siyahı sahələri
  const up = await json(await call(A, 'PATCH', `/api/b2b/clients/${cl.id}`, { budget: 4500, childAges: [5, 10] }));
  assert.strictEqual(up.status, 200);
  assert.strictEqual(up.body.client.budget, 4500);
  assert.strictEqual(up.body.client.name, 'Elvin Məmmədov');
  assert.strictEqual((await call(A, 'PATCH', `/api/b2b/clients/${cl.id}`, {})).status, 400);
  assert.strictEqual((await call(A, 'PATCH', `/api/b2b/clients/${cl.id}`, { createdBy: 'x' })).status, 400);
  assert.strictEqual((await call(A, 'PATCH', '/api/b2b/clients/cl_AAAAAAAAAAAA', { note: 'x' })).status, 404);
  assert.strictEqual((await call(A, 'GET', '/api/b2b/clients/..%2Fadmin')).status, 404);
});

// ---------------------------------------------------------------- IDOR
test('IDOR: başqa agentliyin müştərisi görünmür, dəyişmir, silinmir, əlaqələndirilə bilmir', async () => {
  await sessions();
  const c = (await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Gizli Müştəri', phone: '+994701112233' }))).body.client;
  assert.ok(!(await json(await call(B, 'GET', '/api/b2b/clients'))).body.clients.some((x) => x.id === c.id));
  assert.strictEqual((await call(B, 'GET', `/api/b2b/clients/${c.id}`)).status, 404);
  assert.strictEqual((await call(B, 'PATCH', `/api/b2b/clients/${c.id}`, { note: 'x' })).status, 404);
  assert.strictEqual((await call(B, 'POST', `/api/b2b/clients/${c.id}/searches`, { query: { q: 'Antalya' } })).status, 404);
  assert.strictEqual((await call(B, 'DELETE', `/api/b2b/clients/${c.id}`)).status, 404);
  // ?agency= parametri nəzərə alınmır
  assert.ok(!(await json(await call(B, 'GET', `/api/b2b/clients?agency=${accA.agency.id}`))).body.clients.some((x) => x.id === c.id));

  // Başqa agentliyin clientId-si ilə seçilmiş / seçim linki → 400 (əlaqə yaranmır)
  const query = { q: 'Antalya', type: 'package', checkIn: future(31), nights: '7', adults: '2', flat: '1' };
  const sr = await (await fetch(`${S.base}/api/search?${new URLSearchParams(query)}`)).json();
  const off = sr.offers.find((o) => !o.stopSale);
  assert.strictEqual((await call(B, 'POST', '/api/b2b/shortlist', { client: 'X', clientId: c.id, query, offerId: off.id })).status, 400);
  assert.strictEqual((await call(B, 'POST', '/api/selections', { client: 'X', clientId: c.id, query, offerIds: [off.id] })).status, 400);
  assert.strictEqual((await call(B, 'POST', '/api/selections', { client: 'X', clientId: 'yanlış', query, offerIds: [off.id] })).status, 400);
  // Öz kartı hələ də yerindədir
  assert.strictEqual((await call(A, 'GET', `/api/b2b/clients/${c.id}`)).status, 200);
});

// ---------------------------------------------------------------- Tarixçə + Unut
test('tarixçə və "Unut": axtarışlar, seçilmişlər, linklər, müraciətlər (client_id + köhnə ad/telefon), anonimləşdirmə', async () => {
  await sessions();
  const repos = storage.get();
  const c = (await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Leyla Həsənova', phone: '+994 55 765 43 21', adults: 2, childAges: [6] }))).body.client;

  // Axtarış tarixçəsi (yalnız ağ siyahı parametrləri, təkrar axtarış yuxarı qalxır)
  const query = { q: 'Antalya', type: 'package', checkIn: future(33), nights: '7', adults: '2', children: '1', childAges: '6', flat: '1', evil: '<script>' };
  let r = await json(await call(A, 'POST', `/api/b2b/clients/${c.id}/searches`, { query }));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.searches.length, 1);
  assert.ok(!('evil' in r.body.searches[0]) && !('flat' in r.body.searches[0]));
  await call(A, 'POST', `/api/b2b/clients/${c.id}/searches`, { query: { ...query, q: 'Kemer' } });
  r = await json(await call(A, 'POST', `/api/b2b/clients/${c.id}/searches`, { query }));
  assert.deepStrictEqual(r.body.searches.map((x) => x.q), ['Antalya', 'Kemer']);
  assert.strictEqual((await call(A, 'POST', `/api/b2b/clients/${c.id}/searches`, { query: { type: 'package' } })).status, 400);

  // Yeni əlaqə: shortlist + seçim linki clientId ilə (qrup adı kartdakı ad olur)
  const { q: _q, evil: _e, ...rest } = query;
  const sq = { q: 'Antalya', ...rest };
  const sr = await (await fetch(`${S.base}/api/search?${new URLSearchParams(sq)}`)).json();
  const offers = sr.offers.filter((o) => !o.stopSale);
  const sl = await json(await call(A, 'POST', '/api/b2b/shortlist', { client: 'nəsə başqa', clientId: c.id, query: sq, offerId: offers[0].id }));
  assert.strictEqual(sl.status, 201);
  assert.strictEqual(sl.body.item.client, 'Leyla Həsənova');
  assert.strictEqual(sl.body.item.clientId, c.id);
  const sel = await json(await call(A, 'POST', '/api/selections', { clientId: c.id, client: 'x', message: 'Leyla xanım üçün', query: sq, offerIds: [offers[1].id] }));
  assert.strictEqual(sel.status, 201);
  // Müştəri linkdən müraciət edir
  const lead = await json(await call(null, 'POST', '/api/leads', { type: 'selection', selectionId: sel.body.id, itemIndex: 0, name: 'Leyla Həsənova', phone: '+994557654321' }));
  assert.strictEqual(lead.status, 201);
  // Müştəri görünüşündə clientId sızmır
  const pub = await (await fetch(`${S.base}/api/selections/${sel.body.id}`)).json();
  assert.ok(!('clientId' in pub) && !('agencyId' in pub));

  // Köhnə qeydlər (client_id yoxdur): ad ilə shortlist, telefonla seçim linki/müraciət
  const legacy = await json(await call(A, 'POST', '/api/b2b/shortlist', { client: 'leyla həsənova', query: sq, offerId: offers[2].id }));
  assert.strictEqual(legacy.status, 201);
  assert.strictEqual(legacy.body.item.clientId, null);
  const legacySel = await json(await call(A, 'POST', '/api/selections', { client: 'Sorğu №77', phone: '055-765-43-21', query: sq, offerIds: [offers[3].id] }));
  // Başqa agentliyin eyni adlı qeydi — toxunulmamalıdır
  const otherSl = await json(await call(B, 'POST', '/api/b2b/shortlist', { client: 'Leyla Həsənova', query: sq, offerId: offers[0].id }));
  assert.strictEqual(otherSl.status, 201);
  // Eyni agentlikdə başqa müştərinin qeydi — toxunulmamalıdır
  const unrelated = await json(await call(A, 'POST', '/api/b2b/shortlist', { client: 'Kamran', query: sq, offerId: offers[0].id }));

  const h = await json(await call(A, 'GET', `/api/b2b/clients/${c.id}`));
  assert.strictEqual(h.status, 200);
  assert.strictEqual(h.body.client.id, c.id);
  assert.strictEqual(h.body.searches.length, 2);
  const slIds = h.body.shortlist.flatMap((g) => g.items.map((x) => x.id)).sort();
  assert.deepStrictEqual(slIds, [sl.body.item.id, legacy.body.item.id].sort(), 'client_id + ad (böyük/kiçik hərf) ilə');
  assert.deepStrictEqual(h.body.selections.map((s) => s.id).sort(), [sel.body.id, legacySel.body.id].sort(), 'client_id + telefon rəqəmləri ilə');
  assert.match(h.body.selections[0].url, /^\/s\/[A-Za-z0-9_-]{12}$/);
  assert.strictEqual(h.body.leads.length, 1);
  assert.strictEqual(h.body.leads[0].name, 'Leyla Həsənova');
  assert.ok(!JSON.stringify(h.body).includes(accA.agency.id), 'agencyId cavabda yoxdur');

  // Eyni adlı ikinci müştəri → ad ilə əlaqə dayanır (tarixçələr qarışmır), client_id/telefon qalır
  const twin = (await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Leyla Həsənova' }))).body.client;
  const h2 = await json(await call(A, 'GET', `/api/b2b/clients/${c.id}`));
  assert.deepStrictEqual(h2.body.shortlist.flatMap((g) => g.items.map((x) => x.id)), [sl.body.item.id]);
  assert.strictEqual((await json(await call(A, 'GET', `/api/b2b/clients/${twin.id}`))).body.shortlist.length, 0);
  await call(A, 'DELETE', `/api/b2b/clients/${twin.id}`);

  // "Unut"
  const f = await json(await call(A, 'DELETE', `/api/b2b/clients/${c.id}`));
  assert.strictEqual(f.status, 200);
  assert.deepStrictEqual(f.body.anonymized, { shortlist: 2, selections: 2, leads: 1 });
  assert.strictEqual((await call(A, 'GET', `/api/b2b/clients/${c.id}`)).status, 404);
  assert.strictEqual((await call(A, 'DELETE', `/api/b2b/clients/${c.id}`)).status, 404);

  const aid = accA.agency.id;
  const slAll = await repos.shortlists.listForAgency(aid, 500);
  const mine = slAll.filter((x) => [sl.body.item.id, legacy.body.item.id].includes(x.id));
  assert.ok(mine.length >= 1 && mine.every((x) => /^Anonim-[0-9a-f]{6}$/.test(x.client) && !x.clientId), 'seçilmişlər anonim qrupda');
  assert.ok(!slAll.some((x) => /leyla/i.test(x.client)));
  assert.strictEqual(slAll.find((x) => x.id === unrelated.body.item.id).client, 'Kamran', 'başqa müştəriyə toxunulmayıb');
  assert.strictEqual((await repos.shortlists.get(accB.agency.id, otherSl.body.item.id)).client, 'Leyla Həsənova', 'başqa agentliyə toxunulmayıb');
  for (const id of [sel.body.id, legacySel.body.id]) {
    const s = await repos.selections.get(id);
    assert.strictEqual(s.client, '');
    assert.strictEqual(s.phone, '');
    assert.strictEqual(s.message, '');
    assert.ok(!s.clientId);
  }
  const leads = await repos.leads.listForAgency(aid, 200);
  const l = leads.find((x) => x.selectionId === sel.body.id);
  assert.strictEqual(l.name, 'Anonim');
  assert.strictEqual(l.phone, '+000000');
  assert.ok(!JSON.stringify(leads).includes('765'), 'telefon qalmayıb');
  // Seçim linki işləməyə davam edir (agentlik üçün), amma müştəri adı yoxdur
  const pub2 = await (await fetch(`${S.base}/api/selections/${sel.body.id}`)).json();
  assert.strictEqual(pub2.client, '');
});

test('müştərilər: limit, saxlama müddəti (son fəaliyyətdən 365 gün) — avtomatik silinmə', async () => {
  await sessions();
  const repos = storage.get();
  const cl = require('../src/clients');
  const { runCleanup } = require('../src/storage/cleanup');
  const old = (await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Köhnə Müştəri' }))).body.client;
  const fresh = (await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Təzə Müştəri' }))).body.client;
  await repos.clients.update(accA.agency.id, old.id, { lastActivityAt: new Date(Date.now() - 400 * 864e5).toISOString() });
  const out = await runCleanup({ repos });
  assert.ok(out.clients >= 1);
  assert.strictEqual(await repos.clients.get(accA.agency.id, old.id), null);
  assert.ok(await repos.clients.get(accA.agency.id, fresh.id));

  // Agentlik limiti
  const saved = cl.LIMITS.perAgency;
  cl.LIMITS.perAgency = await repos.clients.count(accA.agency.id);
  try {
    const r = await json(await call(A, 'POST', '/api/b2b/clients', { name: 'Artıq Müştəri' }));
    assert.strictEqual(r.status, 400);
    assert.match(r.body.error, /doludur/);
  } finally { cl.LIMITS.perAgency = saved; }
});

// ---------------------------------------------------------------- Otel siyahıları
test('otel siyahıları: CRUD, kataloq adları, limitlər, IDOR, siyahı filtri axtarışda', async () => {
  await sessions();
  const { hotels } = require('../src/data/catalog');
  const hl = require('../src/hotelLists');
  const antalya = hotels.filter((h) => h.destinationId === 'antalya');
  const [h1, h2, h3] = antalya;

  assert.strictEqual((await fetch(`${S.base}/api/b2b/hotel-lists`)).status, 401);
  assert.strictEqual((await call({ cookie: A.cookie }, 'POST', '/api/b2b/hotel-lists', { name: 'X' })).status, 403);

  // Yaratma (ilk otel ilə); klientin göndərdiyi ad kataloq oteli üçün nəzərə alınmır
  const cr = await json(await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'Ailələr üçün', hotel: { id: h1.id, name: '<img src=x onerror=1>' } }));
  assert.strictEqual(cr.status, 201);
  const list = cr.body.list;
  assert.match(list.id, /^hl_[A-Za-z0-9_-]{12}$/);
  assert.deepStrictEqual(list.hotels, [{ id: h1.id, name: h1.name, destination: 'Antalya', stars: h1.stars }]);
  assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'ailələr ÜÇÜN' })).status, 400, 'ad dublikatı (böyük/kiçik hərf)');
  assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: '' })).status, 400);
  assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'x'.repeat(61) })).status, 400);
  assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'Y', hotel: { id: '../etc' } })).status, 400);
  assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'Y', extra: 1 })).status, 400);
  // Başqa agentlik eyni adı istifadə edə bilər
  assert.strictEqual((await call(B, 'POST', '/api/b2b/hotel-lists', { name: 'Ailələr üçün' })).status, 201);

  // Əlavə / təkrar / çıxar / ad dəyiş
  let r = await json(await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { addHotel: { id: h2.id } }));
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(r.body.list.hotels.map((x) => x.id), [h1.id, h2.id]);
  r = await json(await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { addHotel: { id: h2.id } }));
  assert.strictEqual(r.body.existed, true);
  await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { addHotel: { id: h3.id } });
  r = await json(await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { removeHotel: h3.id, name: 'Kiçik uşaqlı ailələr' }));
  assert.strictEqual(r.body.list.name, 'Kiçik uşaqlı ailələr');
  assert.deepStrictEqual(r.body.list.hotels.map((x) => x.id), [h1.id, h2.id]);
  // Kataloqda olmayan (məs. operator) oteli: təmizlənmiş ad
  r = await json(await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { addHotel: { id: 'samo-hotel-77', name: ' Sea\u0000 View ', destination: 'Side', stars: 9 } }));
  assert.deepStrictEqual(r.body.list.hotels[2], { id: 'samo-hotel-77', name: 'Sea View', destination: 'Side', stars: 5 });
  await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { removeHotel: 'samo-hotel-77' });

  // IDOR
  assert.ok(!(await json(await call(B, 'GET', '/api/b2b/hotel-lists'))).body.lists.some((x) => x.id === list.id));
  assert.strictEqual((await call(B, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { name: 'oğurlandı' })).status, 404);
  assert.strictEqual((await call(B, 'DELETE', `/api/b2b/hotel-lists/${list.id}`)).status, 404);

  // Siyahı filtri axtarışda: mövcud hotels parametri ilə yalnız siyahıdakı otellər
  const mine = (await json(await call(A, 'GET', '/api/b2b/hotel-lists'))).body.lists.find((x) => x.id === list.id);
  const ids = mine.hotels.map((x) => x.id);
  const q = { q: 'Antalya', type: 'package', checkIn: future(30), checkInTo: future(36), nights: '7', adults: '2', flat: '1' };
  const allRes = await (await fetch(`${S.base}/api/search?${new URLSearchParams(q)}`)).json();
  const onlyRes = await (await fetch(`${S.base}/api/search?${new URLSearchParams({ ...q, hotels: hl.hotelsParam(mine) })}`)).json();
  assert.ok(new Set(allRes.offers.map((o) => o.itemId)).size > ids.length);
  assert.ok(onlyRes.offers.length > 0);
  assert.ok(onlyRes.offers.every((o) => ids.includes(o.itemId)), 'yalnız siyahıdakı otellər');
  assert.ok(onlyRes.groups.every((g) => ids.includes(g.itemId)));

  // Limitlər
  const savedH = hl.LIMITS.hotelsPerList;
  hl.LIMITS.hotelsPerList = 2;
  try {
    const x = await json(await call(A, 'PATCH', `/api/b2b/hotel-lists/${list.id}`, { addHotel: { id: h3.id } }));
    assert.strictEqual(x.status, 400);
    assert.match(x.body.error, /maksimum 2/);
  } finally { hl.LIMITS.hotelsPerList = savedH; }
  const savedL = hl.LIMITS.perAgency;
  hl.LIMITS.perAgency = 1;
  try {
    assert.strictEqual((await call(A, 'POST', '/api/b2b/hotel-lists', { name: 'Romantik' })).status, 400);
  } finally { hl.LIMITS.perAgency = savedL; }

  // Sil
  assert.strictEqual((await call(A, 'DELETE', `/api/b2b/hotel-lists/${list.id}`)).status, 200);
  assert.strictEqual((await call(A, 'DELETE', `/api/b2b/hotel-lists/${list.id}`)).status, 404);
});

// ---------------------------------------------------------------- Kanal postu
test('kanal postu: mətn AZ/EN/RU, komissiyalı qiymət, agentlik adı/telefon; operator adı və net qiymət YOXDUR', async () => {
  const { explore } = require('../src/search');
  const r = await explore({ lastMinute: '1', checkIn: future(1), nights: '7', adults: '2', noStopSale: '1', currency: 'AZN' });
  const raw = r.destinations.slice(0, 4).map((d) => ({ ...d.best, destination: d.destination }));
  assert.ok(raw.length >= 3, 'son dəqiqə təklifləri var');
  const operators = new Set(raw.map((o) => o.providerName));
  const { providers } = require('../src/providers');
  for (const p of providers) operators.add(p.name);
  operators.delete(undefined);

  const items = raw.map(Post.normalizeItem);
  for (const it of items) {
    assert.ok(!Object.keys(it).some((k) => /provider|operator|url|opPrice/i.test(k)), 'ağ siyahıda operator sahəsi yoxdur');
  }
  for (const lang of Post.LANGS) {
    const text = Post.postText(raw, { lang, markup: 10, agency: 'Səyahət MMC', phone: '+994 50 111 22 33', kind: 'lastMinute' });
    for (const op of operators) assert.ok(!text.toLowerCase().includes(String(op).toLowerCase()), `${lang}: operator adı postda: ${op}`);
    assert.ok(!/https?:\/\//.test(text), 'operator linki yoxdur');
    assert.ok(text.includes('Səyahət MMC') && text.includes('+994 50 111 22 33'));
    assert.ok(text.includes(Post.TX[lang].head_lm));
    // Qiymət komissiya ilə; net qiymət mətndə yoxdur
    for (const o of raw) {
      assert.ok(text.includes(`${Post.fmtMoney(Math.round(o.price * 1.1))} ₼`), `${lang}: müştəri qiyməti`);
      assert.ok(!text.includes(`${Post.fmtMoney(o.price)} ₼`), `${lang}: net qiymət görünməməlidir`);
    }
    assert.ok(text.includes(raw[0].name));
  }
  // Maks. 5 variant, telefon yoxdursa "bizə yazın", seçilmişlərdən başlıq, idarəetmə simvolları təmizlənir
  const many = [...raw, ...raw, ...raw];
  const t2 = Post.postText(many, { lang: 'ru', agency: 'Ag\u0000ency\nX', kind: 'shortlist' });
  assert.ok(t2.includes('5️⃣') && !t2.includes('6️⃣'));
  assert.ok(t2.includes(Post.TX.ru.dm) && t2.includes(Post.TX.ru.head_sl));
  assert.ok(t2.includes('Ag ency X'));
  // Shortlist qeydi (netPrice, providerName, url) → eyni qayda
  const slItem = { name: 'Otel A', stars: 5, destination: 'Antalya', checkIn: future(20), nights: 7, board: 'AI', netPrice: 1000, providerName: 'Summer Tour', providerId: 'summer', url: 'https://summertour.az/x', adults: 2, children: 1 };
  const t3 = Post.postText([slItem], { lang: 'az', markup: 5, agency: 'A' });
  assert.ok(t3.includes('1 050 ₼') && !/summer/i.test(t3) && t3.includes('2 böyük + 1 uşaq') && t3.includes('Hər şey daxil'));
  assert.strictEqual(Post.normalizeItem({ name: 'x', price: -1 }), null);
  assert.strictEqual(Post.clientPrice(1000, 500), 2000, 'komissiya 100%-lə məhdud');
});

test('miqrasiya 005: sütunlar/cədvəllər (PostgreSQL)', { skip: !PG && 'TEST_DATABASE_URL təyin olunmayıb' }, async () => {
  const cols = async (t) => (await admin.query('SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2', [SCHEMA, t])).rows.map((x) => x.column_name);
  for (const t of ['shortlist_items', 'selections', 'leads']) assert.ok((await cols(t)).includes('client_id'), t);
  assert.ok((await cols('clients')).includes('last_activity_at'));
  assert.ok((await cols('hotel_lists')).includes('hotels'));
  // DB səviyyəli CHECK: yanlış board / uzun ad rədd edilir
  await assert.rejects(admin.query(`INSERT INTO ${SCHEMA}.clients (id, agency_id, name, board) VALUES ('cl_AAAAAAAAAAAA', $1, 'Test', 'XX')`, [accA.agency.id]));
  await assert.rejects(admin.query(`INSERT INTO ${SCHEMA}.hotel_lists (id, agency_id, name) VALUES ('hl_AAAAAAAAAAAA', $1, $2)`, [accA.agency.id, 'x'.repeat(61)]));
  // Təkrar icra idempotentdir
  await admin.query(`SET search_path TO ${SCHEMA}`);
  await admin.query(fs.readFileSync(path.join(__dirname, '..', 'migrations', '005_clients_hotel_lists.sql'), 'utf8'));
  await admin.query('SET search_path TO public');
});
