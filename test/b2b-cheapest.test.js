// B2B "Ən ucuz təklif" məntiqi (public/js/b2b-cheapest.js) və "Seçilmişlər" (shortlist) API:
// CRUD, IDOR (yalnız öz agentliyi), CSRF/Origin, qiymətin serverdə yenidən yoxlanılması, çap təklifi, seçim linki.
// TEST_DATABASE_URL təyin olunubsa eyni testlər real PostgreSQL ilə (müvəqqəti sxemdə) işləyir, yoxdursa — yaddaşda.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PG = !!process.env.TEST_DATABASE_URL;
const SCHEMA = `odiola_sl_${crypto.randomBytes(5).toString('hex')}`;
let admin = null;
if (PG) {
  const u = new URL(process.env.TEST_DATABASE_URL);
  u.searchParams.set('options', `-c search_path=${SCHEMA}`);
  process.env.DATABASE_URL = u.toString();
  process.env.ETOUR_TEST_DB = '1';
  process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-sl-'));
}

const CH = require('../public/js/b2b-cheapest.js');
const { startServer, createAccount, login, client, future } = require('./_helpers');

let app;
let storage;
let S;

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

// ---------------------------------------------------------------- Ən ucuz panel məntiqi (təmiz funksiyalar)
const off = (id, price, over = {}) => ({ id, price, itemId: id.split(':')[1].split('|')[0], providerId: id.split(':')[0], providerName: id.split(':')[0].toUpperCase(), stars: 4, name: 'Otel ' + id, ...over });

test('cheapestSummary: ən ucuz, ikinci (başqa otel/operator), stop-sale istisna, ulduz və operator üzrə, qələbələr', () => {
  const offers = [
    off('a:h1|r1', 900, { stopSale: true, stars: 5 }), // ən ucuz, amma stop-sale → seçilmir
    off('a:h1|r2', 1000, { stars: 5 }),
    off('a:h1|r3', 1010, { stars: 5 }), // eyni otel + operator → "ikinci" sayılmır
    off('b:h1|r1', 1050, { stars: 5 }),
    off('b:h2|r1', 1200, { stars: 3 }),
    off('c:h3|r1', 1500, { stars: 4 }),
  ].sort((x, y) => x.price - y.price);
  const groups = [
    { itemId: 'h1', name: 'H1', best: offers[0], providers: [offers[0], offers.find((o) => o.id === 'b:h1|r1')] },
    { itemId: 'h2', name: 'H2', best: offers.find((o) => o.id === 'b:h2|r1'), providers: [offers.find((o) => o.id === 'b:h2|r1')] },
    { itemId: 'h3', name: 'H3', best: offers.find((o) => o.id === 'c:h3|r1'), providers: [offers.find((o) => o.id === 'c:h3|r1')] },
  ];
  const s = CH.cheapestSummary({ offers, groups });
  assert.strictEqual(s.best.id, 'a:h1|r2');
  assert.strictEqual(s.second.id, 'b:h1|r1', 'eyni otelin eyni operatordakı otağı yox — başqa operator');
  assert.strictEqual(s.diff, 50);
  assert.strictEqual(s.excludedStopSale, 1);
  assert.strictEqual(s.byStars[5].id, 'a:h1|r2');
  assert.strictEqual(s.byStars[4].id, 'c:h3|r1');
  assert.strictEqual(s.byStars[3].id, 'b:h2|r1');
  assert.deepStrictEqual(s.byOperator.map((o) => o.id), ['a:h1|r2', 'b:h1|r1', 'c:h3|r1']);
  assert.deepStrictEqual(s.wins, { a: 1, b: 1, c: 1 }, 'matrisdəki yaşıl xana (group.best) ilə eyni');
  assert.ok(CH.isBestCell(s, 'h1', 'a') && !CH.isBestCell(s, 'h1', 'b'));

  // Hamısı stop-sale → yenə də ən ucuz göstərilir; boş nəticə → null
  assert.strictEqual(CH.cheapestSummary({ offers: [off('a:h1|x', 5, { stopSale: true })] }).best.id, 'a:h1|x');
  const empty = CH.cheapestSummary({ offers: [], groups: [] });
  assert.strictEqual(empty.best, null);
  assert.strictEqual(empty.diff, null);
  // Bərabər qiymət: deterministik (id), diff 0; yeganə variant: second null
  const tie = CH.cheapestSummary({ offers: [off('b:h2|r', 700), off('a:h1|r', 700)] });
  assert.strictEqual(tie.best.id, 'a:h1|r');
  assert.strictEqual(tie.diff, 0);
  assert.strictEqual(CH.cheapestSummary({ offers: [off('a:h1|r', 700)] }).second, null);
  // Düz siyahı kəsilib (limit) — qrupdakı təkliflər də namizəddir; yanlış qiymətli təklif atılır
  const fromGroups = CH.cheapestSummary({ offers: [off('a:h1|r', 800)], groups: [{ best: off('z:h9|r', 600), providers: [] }] });
  assert.strictEqual(fromGroups.best.id, 'z:h9|r');
  assert.strictEqual(CH.cheapestSummary({ offers: [off('a:h1|r', 'x'), off('a:h2|r', -1)] }).best, null);
});

test('köməkçilər: komissiya, sıralama, seçilmişlərin qruplaşması, qiymət trendi', () => {
  assert.strictEqual(CH.clientPrice(1000, 10), 1100);
  assert.strictEqual(CH.clientPrice(999, 7.5), Math.round(999 * 1.075));
  assert.strictEqual(CH.clientPrice(1000, 500), 2000, 'komissiya 100%-lə məhdudlaşır');
  assert.strictEqual(CH.clientPrice(1000, -5), 1000);
  const g = CH.sortGroupsByPrice([{ name: 'B', best: { price: 300 } }, { name: 'A', best: { price: 100 } }, { name: 'C', best: { price: 100 } }]);
  assert.deepStrictEqual(g.map((x) => x.name), ['A', 'C', 'B']);
  assert.deepStrictEqual(CH.sortOffersByPrice([off('a:h|2', 5), off('a:h|1', 5), off('a:h|0', 1)]).map((o) => o.id), ['a:h|0', 'a:h|1', 'a:h|2']);
  const groups = CH.groupShortlist([
    { id: 'sl_1', client: 'Elvin', netPrice: 900, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'sl_2', client: '', netPrice: 500, createdAt: '2026-01-03T00:00:00Z' },
    { id: 'sl_3', client: 'Elvin', netPrice: 700, createdAt: '2026-01-02T00:00:00Z' },
  ]);
  assert.deepStrictEqual(groups.map((x) => x.client), ['', 'Elvin'], 'ən yeni qrup yuxarıda');
  assert.deepStrictEqual(groups[1].items.map((x) => x.id), ['sl_3', 'sl_1'], 'qrup daxilində ucuzdan bahalıya');
  assert.strictEqual(CH.priceTrend({ netPrice: 1100, prevNetPrice: 1000 }), 'up');
  assert.strictEqual(CH.priceTrend({ netPrice: 900, prevNetPrice: 1000 }), 'down');
  assert.strictEqual(CH.priceTrend({ netPrice: 900, prevNetPrice: null }), null);
});

test('real axtarış: ən ucuz panel serverin nəticəsi ilə uyğun, default sıralama ucuzdan bahalıya', async () => {
  const { search } = require('../src/search');
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(30), nights: 7, adults: 2, flat: '1' });
  const s = CH.cheapestSummary({ offers: r.offers, groups: r.groups });
  const sellable = r.offers.filter((o) => !o.stopSale);
  assert.ok(sellable.length > 0);
  assert.strictEqual(s.best.price, Math.min(...sellable.map((o) => o.price)));
  assert.ok(!s.best.stopSale);
  assert.ok(s.second.price >= s.best.price && s.diff >= 0);
  for (const st of [3, 4, 5]) if (s.byStars[st]) assert.strictEqual(s.byStars[st].price, Math.min(...sellable.filter((o) => o.stars === st).map((o) => o.price)));
  const ops = new Set(sellable.map((o) => o.providerId));
  assert.strictEqual(s.byOperator.length, ops.size);
  assert.strictEqual(Object.values(s.wins).reduce((a, b) => a + b, 0), r.groups.length);
  for (let i = 1; i < r.groups.length; i++) assert.ok(r.groups[i - 1].best.price <= r.groups[i].best.price, 'otellər ucuzdan bahalıya');
  for (let i = 1; i < r.offers.length; i++) assert.ok(r.offers[i - 1].price <= r.offers[i].price, 'təkliflər ucuzdan bahalıya');
});

// ---------------------------------------------------------------- Shortlist domeni (stub axtarış — qiymət "serverdən")
const sl = require('../src/shortlists');
const stub = (catalog, pax = { adults: 2, children: 0, childAges: '' }) => async (_q, ids) => ({ pax, offers: ids.map((id) => (catalog[id] ? { ...catalog[id] } : null)) });
const offer = (over = {}) => ({
  id: 'summer:h1|d|7|AI|DBL', itemId: 'h1', providerId: 'summer', providerName: 'Summer Tour', providerColor: '#f59e0b', name: 'Otel A', stars: 5,
  destination: { name: 'Antalya' }, district: 'Belek', checkIn: future(30), nights: 7, board: 'AI', boardLabel: 'Hər şey daxil', room: 'Standard', accommodation: 'DBL',
  includesFlight: true, price: 1000, prepayment: 'none', operatorLink: true, url: 'https://summertour.az/x', ...over,
});

test('shortlist domeni: əlavə (qiymət serverdən), dublikat, yeniləmə ↑/↓, mövcud deyil, çap təklifi, seçim linki, limitlər', async () => {
  const A = await createAccount({ agency: 'SL Domen A', username: 'sl-dom-a' });
  const acc = { agencyId: A.agency.id, agencyName: 'SL Domen A', managerName: 'Aysel', userId: A.user.id };
  const catalog = { 'summer:h1|d|7|AI|DBL': offer(), 'funsun:h2|d|7|BB|DBL': offer({ id: 'funsun:h2|d|7|BB|DBL', itemId: 'h2', providerId: 'funsun', providerName: 'Funsun Travel', name: 'Otel B', price: 1400, url: 'javascript:alert(1)' }) };
  const opts = { account: acc, resolveOffers: stub(catalog) };
  const q = { q: 'Antalya', type: 'package', checkIn: future(30), nights: '7', adults: '2', evil: 'x', __proto__: { a: 1 } };

  // Klientin qiyməti/adı/operatoru/agentliyi nəzərə alınmır
  const { item, existed } = await sl.addToShortlist({ client: '  Elvin   №12 ', query: q, offerId: 'summer:h1|d|7|AI|DBL', price: 1, name: 'Saxta', agencyId: 'ag_x' }, opts);
  assert.strictEqual(existed, false);
  assert.match(item.id, /^sl_[A-Za-z0-9_-]{12}$/);
  assert.strictEqual(item.client, 'Elvin №12');
  assert.strictEqual(item.netPrice, 1000);
  assert.strictEqual(item.name, 'Otel A');
  assert.strictEqual(item.providerName, 'Summer Tour');
  assert.ok(!('evil' in item.query) && !('agencyId' in item));
  const dup = await sl.addToShortlist({ client: 'Elvin №12', query: q, offerId: 'summer:h1|d|7|AI|DBL' }, opts);
  assert.strictEqual(dup.existed, true);
  assert.strictEqual(dup.item.id, item.id);
  const b = (await sl.addToShortlist({ client: 'Elvin №12', query: q, offerId: 'funsun:h2|d|7|BB|DBL' }, opts)).item;
  assert.strictEqual(b.url, null, 'yalnız https operator linki saxlanılır');

  await assert.rejects(sl.addToShortlist({ client: 'X', query: q, offerId: 'yoxdur' }, opts), /mövcud deyil/);
  await assert.rejects(sl.addToShortlist({ client: 'X', offerId: 'summer:h1|d|7|AI|DBL' }, opts), /query/);
  await assert.rejects(sl.addToShortlist({ client: 'X', query: q, offerId: { $gt: '' } }, opts), /id/);
  await assert.rejects(sl.addToShortlist({ client: 'X', query: q, offerId: 'summer:h1|d|7|AI|DBL' }, { ...opts, account: null }));

  // Qiyməti yenilə: dəyişib → prevNetPrice; dəyişməyib → changed=false; təklif yoxdur → available=false
  catalog['summer:h1|d|7|AI|DBL'].price = 1080;
  const r1 = await sl.refreshShortlistItem(acc.agencyId, item.id, opts);
  assert.strictEqual(r1.changed, true);
  assert.strictEqual(r1.item.netPrice, 1080);
  assert.strictEqual(r1.item.prevNetPrice, 1000);
  assert.strictEqual(CH.priceTrend(r1.item), 'up');
  const r2 = await sl.refreshShortlistItem(acc.agencyId, item.id, opts);
  assert.strictEqual(r2.changed, false);
  assert.strictEqual(r2.item.prevNetPrice, 1000, 'əvvəlki dəyişiklik görünməyə davam edir');
  catalog['summer:h1|d|7|AI|DBL'].price = 950;
  assert.strictEqual(CH.priceTrend((await sl.refreshShortlistItem(acc.agencyId, item.id, opts)).item), 'down');
  delete catalog['funsun:h2|d|7|BB|DBL'];
  const gone = await sl.refreshShortlistItem(acc.agencyId, b.id, opts);
  assert.strictEqual(gone.item.available, false);
  assert.strictEqual(gone.item.netPrice, 1400);
  assert.strictEqual(await sl.refreshShortlistItem('ag_basqa', item.id, opts), null, 'başqa agentlik — tapılmır');

  // Çap təklifi: operator, net, komissiya gizli; müştəri qiyməti serverdə hesablanır
  catalog['funsun:h2|d|7|BB|DBL'] = offer({ id: 'funsun:h2|d|7|BB|DBL', itemId: 'h2', providerId: 'funsun', providerName: 'Funsun Travel', name: 'Otel B', price: 1400 });
  const quote = await sl.buildQuote({ client: 'Elvin №12', markup: 10 }, opts);
  assert.strictEqual(quote.agency, 'SL Domen A');
  assert.strictEqual(quote.manager, 'Aysel');
  assert.deepStrictEqual(quote.items.map((x) => x.clientPrice), [1045, 1540]);
  const qj = JSON.stringify(quote);
  for (const secret of ['Summer Tour', 'Funsun', 'providerName', 'netPrice', 'markup', acc.agencyId, 'summertour.az', 'offerId']) assert.ok(!qj.includes(secret), `${secret} gizli olmalıdır`);
  assert.strictEqual(await sl.buildQuote({ client: 'Yoxdur', markup: 0 }, opts), null);
  await assert.rejects(sl.buildQuote({ client: 'Elvin №12', markup: 500 }, opts), /Komissiya/);
  await assert.rejects(sl.buildQuote({ ids: ['../../x'] }, opts), /Variant/);

  // Seçim linki (fərqli axtarışlardan): qiymət serverdən, agentlik sessiyadan
  const { createSelectionRepo } = require('../src/storage/memory');
  const selectionStore = PG ? undefined : createSelectionRepo();
  const sel = await sl.selectionFromShortlist({ client: 'Elvin №12', markup: 5, message: 'Salam' }, { ...opts, selectionStore });
  assert.strictEqual(sel.agencyId, acc.agencyId);
  assert.strictEqual(sel.client, 'Elvin №12');
  assert.deepStrictEqual(sel.items.map((x) => x.clientPrice).sort((x, y) => x - y), [998, 1470]);
  // Fərqli sərnişin tərkibi bir linkdə birləşdirilmir
  await sl.addToShortlist({ client: 'Elvin №12', query: { ...q, adults: '3' }, offerId: 'summer:h1|d|7|AI|DBL' }, { ...opts, resolveOffers: stub(catalog, { adults: 3, children: 0, childAges: '' }) });
  await assert.rejects(sl.selectionFromShortlist({ client: 'Elvin №12' }, { ...opts, selectionStore }), /sərnişin/);

  // Yeniləmə (yalnız müştəri adı) və silmə — yalnız öz agentliyi
  assert.strictEqual(await sl.updateShortlistItem('ag_basqa', b.id, { client: 'X' }), null);
  assert.strictEqual((await sl.updateShortlistItem(acc.agencyId, b.id, { client: 'Nigar' })).client, 'Nigar');
  await assert.rejects(sl.updateShortlistItem(acc.agencyId, b.id, { netPrice: 1 }), /Dəyişiklik/);
  assert.strictEqual(await sl.removeShortlistItem('ag_basqa', b.id), false);
  assert.strictEqual(await sl.removeShortlistItem(acc.agencyId, b.id), true);
  assert.strictEqual(await sl.removeShortlistItem(acc.agencyId, b.id), false);

  // Müştəri üzrə limit
  const prev = sl.LIMITS.perClient;
  sl.LIMITS.perClient = 2;
  try {
    await assert.rejects(sl.addToShortlist({ client: 'Elvin №12', query: q, offerId: 'funsun:h2|d|7|BB|DBL' }, opts), /maksimum/);
  } finally { sl.LIMITS.perClient = prev; }
});

test('storage: shortlists repository — IDOR, dublikat, retention', async () => {
  const repo = storage.get().shortlists;
  const X = await createAccount({ agency: 'SL Repo X', username: 'sl-repo-x' });
  const Y = await createAccount({ agency: 'SL Repo Y', username: 'sl-repo-y' });
  const now = new Date().toISOString();
  const base = { userId: X.user.id, client: 'K', offerId: 'o1', paxKey: '2|', query: { q: 'A' }, snapshot: { name: 'N' }, netPrice: 100, prevNetPrice: null, available: true, checkedAt: now, createdAt: now };
  const a = await repo.insert({ ...base, id: 'sl_AAAAAAAAAAAA', agencyId: X.agency.id });
  assert.strictEqual(a.netPrice, 100);
  const d = await repo.insert({ ...base, id: 'sl_BBBBBBBBBBBB', agencyId: X.agency.id });
  assert.strictEqual(d.existed, true);
  assert.strictEqual(d.id, 'sl_AAAAAAAAAAAA');
  // Başqa agentlik eyni təklifi ayrıca saxlaya bilər
  const y = await repo.insert({ ...base, id: 'sl_CCCCCCCCCCCC', agencyId: Y.agency.id, userId: Y.user.id });
  assert.ok(!y.existed);
  assert.deepStrictEqual((await repo.listForAgency(X.agency.id)).map((x) => x.id), ['sl_AAAAAAAAAAAA']);
  assert.strictEqual(await repo.get(Y.agency.id, 'sl_AAAAAAAAAAAA'), null);
  assert.strictEqual(await repo.update(Y.agency.id, 'sl_AAAAAAAAAAAA', { netPrice: 1 }), null);
  assert.strictEqual(await repo.delete(Y.agency.id, 'sl_AAAAAAAAAAAA'), false);
  assert.strictEqual((await repo.get(X.agency.id, 'sl_AAAAAAAAAAAA')).netPrice, 100);
  const u = await repo.update(X.agency.id, 'sl_AAAAAAAAAAAA', { netPrice: 120, prevNetPrice: 100, snapshot: { name: 'M' }, checkedAt: now });
  assert.deepStrictEqual([u.netPrice, u.prevNetPrice, u.snapshot.name], [120, 100, 'M']);
  await repo.insert({ ...base, id: 'sl_DDDDDDDDDDDD', agencyId: X.agency.id, client: 'L' });
  await assert.rejects(repo.update(X.agency.id, 'sl_DDDDDDDDDDDD', { client: 'K' }), (e) => e.code === 'DUPLICATE');
  assert.strictEqual(await repo.countForAgency(X.agency.id), 2);
  // Retention: köhnə qeydlər silinir (cleanup)
  const old = new Date(Date.now() - 100 * 864e5).toISOString();
  await repo.insert({ ...base, id: 'sl_EEEEEEEEEEEE', agencyId: X.agency.id, client: 'Köhnə', createdAt: old });
  const { runCleanup } = require('../src/storage/cleanup');
  const out = await runCleanup();
  assert.ok(out.shortlists >= 1, JSON.stringify(out));
  assert.strictEqual(await repo.get(X.agency.id, 'sl_EEEEEEEEEEEE'), null);
  assert.ok(await repo.get(X.agency.id, 'sl_AAAAAAAAAAAA'));
  if (PG) {
    const tables = (await admin.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', [SCHEMA])).rows.map((r) => r.table_name);
    assert.ok(tables.includes('shortlist_items'));
    // Miqrasiya idempotentdir
    const { listMigrations } = require('../src/db/migrate');
    for (const m of listMigrations()) await storage.get().pool.query(m.sql);
  }
});

// ---------------------------------------------------------------- HTTP API
test('HTTP: shortlist API — auth, CSRF, Origin, CRUD, IDOR, server qiymət yoxlaması, çap, seçim linki', async () => {
  const base = S.base;
  await createAccount({ agency: 'SL HTTP A', username: 'sl-http-a', displayName: 'Aysel' });
  await createAccount({ agency: 'SL HTTP B', username: 'sl-http-b', displayName: 'Bəhruz' });
  const sa = await login(base, 'sl-http-a', 'Test-Parol-Uzun-2026');
  const sb = await login(base, 'sl-http-b', 'Test-Parol-Uzun-2026');
  assert.strictEqual(sa.res.status, 200);
  const A = client(base, sa);
  const B = client(base, sb);
  const call = (who, method, p, body, extra = {}) => fetch(base + p, {
    method,
    headers: { Cookie: who.cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': who.csrf, ...extra },
    body: JSON.stringify(body || {}),
  });

  // Girişsiz → 401
  assert.strictEqual((await fetch(`${base}/api/b2b/shortlist`)).status, 401);
  assert.strictEqual((await fetch(`${base}/api/b2b/shortlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);

  const query = { q: 'Antalya', type: 'package', checkIn: future(28), nights: '7', adults: '2', children: '0', flat: '1' };
  const sr = await (await fetch(`${base}/api/search?${new URLSearchParams(query)}`)).json();
  const sum = CH.cheapestSummary({ offers: sr.offers, groups: sr.groups });
  const best = sum.best;
  const second = sum.second;

  // CSRF token yoxdur / yanlışdır → 403; xarici Origin → 403
  assert.strictEqual((await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: best.id }, { 'X-CSRF-Token': '' })).status, 403);
  assert.strictEqual((await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: best.id }, { 'X-CSRF-Token': 'x'.repeat(43) })).status, 403);
  assert.strictEqual((await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: best.id }, { Origin: 'https://evil.example' })).status, 403);
  assert.strictEqual((await call(sa, 'DELETE', '/api/b2b/shortlist/sl_AAAAAAAAAAAA', {}, { 'X-CSRF-Token': '' })).status, 403);

  // Əlavə: klientin qiyməti (1) nəzərə alınmır
  const c1 = await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: best.id, price: 1, netPrice: 1 });
  assert.strictEqual(c1.status, 201);
  const it1 = (await c1.json()).item;
  assert.strictEqual(it1.netPrice, best.price, 'qiymət serverin axtarışından');
  assert.strictEqual(it1.providerName, best.providerName);
  assert.strictEqual((await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: best.id })).status, 200, 'dublikat → mövcud qeyd');
  const it2 = (await (await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: second.id })).json()).item;
  assert.strictEqual((await A.post('/api/b2b/shortlist', { client: 'Elvin', query, offerId: 'summer:saxta|id' })).status, 400);

  // Siyahı: yalnız öz agentliyi
  const la = await (await A.get('/api/b2b/shortlist')).json();
  assert.deepStrictEqual(la.items.map((x) => x.id).sort(), [it1.id, it2.id].sort());
  assert.ok(!JSON.stringify(la).includes('agencyId'));
  assert.deepStrictEqual((await (await B.get('/api/b2b/shortlist')).json()).items, []);

  // IDOR: B agentliyi A-nın qeydinə toxuna bilmir (404, dəyişiklik yoxdur)
  assert.strictEqual((await call(sb, 'PATCH', `/api/b2b/shortlist/${it1.id}`, { client: 'Oğurluq' })).status, 404);
  assert.strictEqual((await call(sb, 'DELETE', `/api/b2b/shortlist/${it1.id}`)).status, 404);
  assert.strictEqual((await B.post(`/api/b2b/shortlist/${it1.id}/refresh`, {})).status, 404);
  assert.strictEqual((await B.post('/api/b2b/shortlist/quote', { ids: [it1.id], markup: 0 })).status, 404);
  assert.strictEqual((await B.post('/api/b2b/shortlist/quote', { client: 'Elvin', markup: 0 })).status, 404);
  assert.strictEqual((await B.post('/api/b2b/shortlist/selection', { ids: [it1.id] })).status, 404);
  assert.strictEqual((await (await A.get('/api/b2b/shortlist')).json()).items.length, 2, 'A-nın qeydləri yerindədir');

  // Qiyməti yenilə (server yenidən yoxlayır)
  const rf = await A.post(`/api/b2b/shortlist/${it1.id}/refresh`, {});
  assert.strictEqual(rf.status, 200);
  const rfj = await rf.json();
  assert.strictEqual(rfj.item.netPrice, best.price);
  assert.strictEqual(rfj.changed, false);

  // Çap/PDF təklifi: operator və net gizli
  const qr = await A.post('/api/b2b/shortlist/quote', { client: 'Elvin', markup: 10 });
  assert.strictEqual(qr.status, 200);
  const qj = await qr.json();
  assert.strictEqual(qj.agency, 'SL HTTP A');
  assert.strictEqual(qj.manager, 'Aysel');
  assert.strictEqual(qj.items[0].clientPrice, Math.round(best.price * 1.1));
  const qs = JSON.stringify(qj);
  for (const secret of [best.providerName, second.providerName, 'netPrice', 'providerName', 'markup']) assert.ok(!qs.includes(secret), `${secret} gizli`);

  // Seçim linki
  const sl1 = await A.post('/api/b2b/shortlist/selection', { client: 'Elvin', markup: 5 });
  assert.strictEqual(sl1.status, 201);
  const { url } = await sl1.json();
  assert.match(url, /^\/s\/[A-Za-z0-9_-]{12}$/);
  const pub = await (await fetch(`${base}/api/selections/${url.slice(3)}`)).json();
  assert.strictEqual(pub.agency, 'SL HTTP A');
  assert.strictEqual(pub.client, 'Elvin');
  assert.deepStrictEqual(pub.items.map((x) => x.clientPrice).sort((x, y) => x - y), [Math.round(best.price * 1.05), Math.round(second.price * 1.05)].sort((x, y) => x - y));
  assert.ok(!JSON.stringify(pub).includes(best.providerName));

  // PATCH (müştəri adı) və DELETE
  const pr = await call(sa, 'PATCH', `/api/b2b/shortlist/${it2.id}`, { client: 'Nigar' });
  assert.strictEqual(pr.status, 200);
  assert.strictEqual((await pr.json()).item.client, 'Nigar');
  assert.strictEqual((await call(sa, 'DELETE', `/api/b2b/shortlist/${it2.id}`)).status, 200);
  assert.strictEqual((await call(sa, 'DELETE', `/api/b2b/shortlist/${it2.id}`)).status, 404);
  assert.strictEqual((await call(sa, 'DELETE', '/api/b2b/shortlist/..%2F..%2Fetc')).status, 404);
  assert.deepStrictEqual((await (await A.get('/api/b2b/shortlist')).json()).items.map((x) => x.id), [it1.id]);

  // Statik səhifələr: quote.html və yeni skriptlər CSP-yə uyğun (inline skript yoxdur)
  const qp = await fetch(`${base}/quote.html`);
  assert.strictEqual(qp.status, 200);
  const html = await qp.text();
  assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/i.test(html), 'inline <script> yoxdur');
  assert.match(qp.headers.get('content-security-policy'), /script-src 'self'/);
});
