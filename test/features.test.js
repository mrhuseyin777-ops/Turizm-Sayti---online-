// P1 funksiyaları: istiqamətsiz axtarış, taksit, şərtlər, son dəqiqə, qiymət təzəliyi,
// etibar bloku, uşaq yaşları, geri zəng, B2B seçim linki.
const test = require('node:test');
const assert = require('node:assert');
const { search, explore, parseQuery } = require('../src/search');
const { childFactors, parseChildAges, paymentPlan } = require('../src/pricing');
const { providers } = require('../src/providers');
const { createSelection, publicSelection, createLead, leadsForAgency, getSelectionRecord, LIMITS } = require('../src/leads');
const config = require('../src/config');
const app = require('../server');
const { startServer, createAccount, login, client } = require('./_helpers');

const future = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const daysTo = (iso) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(future(0) + 'T00:00:00Z')) / 864e5);

test('explore: istiqamətsiz axtarış — hər istiqamət bir dəfə, ucuzdan bahalıya, büdcəyə sığır', async () => {
  const r = await explore({ type: 'hotel', checkIn: future(40), nights: 5, adults: 2, maxPrice: 2500 });
  assert.ok(r.destinations.length >= 5);
  const ids = r.destinations.map((d) => d.destination.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (let i = 1; i < r.destinations.length; i++) assert.ok(r.destinations[i - 1].minPrice <= r.destinations[i].minPrice);
  for (const d of r.destinations) {
    assert.ok(d.minPrice <= 2500);
    assert.strictEqual(d.minPrice, d.best.price);
    assert.ok(d.items >= 1 && d.providers >= 1);
  }
  // ən ucuz təklif həqiqətən o istiqamətin minimumudur
  const d0 = r.destinations[0];
  const s = await search({ destinationId: d0.destination.id, type: 'hotel', checkIn: future(40), nights: 5, adults: 2, maxPrice: 2500 });
  assert.strictEqual(s.groups[0].best.price, d0.minPrice);
  // /api/search?anywhere=1 eyni nəticə
  const viaSearch = await search({ anywhere: '1', type: 'hotel', checkIn: future(40), nights: 5, adults: 2, maxPrice: 2500 });
  assert.deepStrictEqual(viaSearch.destinations.map((d) => d.destination.id), ids);
  // region filtri
  const dom = await explore({ type: 'hotel', region: 'domestic', checkIn: future(40), nights: 2, adults: 2 });
  assert.ok(dom.destinations.length > 0 && dom.destinations.every((d) => d.destination.region === 'domestic'));
});

test('explore performansı: keşlənmiş təkrar sorğu sürətlidir', async () => {
  const p = { type: 'package', checkIn: future(55), nights: 7, adults: 2 };
  const t0 = Date.now(); await explore(p); const first = Date.now() - t0;
  const t1 = Date.now(); const again = await explore(p); const second = Date.now() - t1;
  assert.ok(first < 2000, `ilk explore ${first}ms`);
  assert.ok(second <= Math.max(first, 50));
  assert.ok(again.sources.every((s) => s.cached));
});

test('taksit/ilkin ödəniş planı config-dən hesablanır (faiz 0)', async () => {
  assert.deepStrictEqual(config.installment.months, [6, 12]);
  const plan = paymentPlan(1200);
  assert.strictEqual(plan.interestPct, 0);
  assert.deepStrictEqual(plan.months, [{ n: 6, monthly: 200 }, { n: 12, monthly: 100 }]);
  assert.strictEqual(plan.upfront, 240);
  assert.strictEqual(plan.demo, true);
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(40), nights: 7, adults: 2 });
  const b = r.groups[0].best;
  assert.strictEqual(b.plan.months[0].monthly, Math.ceil(b.price / 6));
});

test('ödəniş/ləğv şərtləri deterministikdir və filtrlər işləyir', async () => {
  const p = { q: 'Antalya', type: 'hotel', checkIn: future(60), nights: 7, adults: 2, flat: '1' };
  const a = await search(p);
  const b = await search(p);
  assert.deepStrictEqual(a.offers.map((o) => [o.id, o.prepayment, o.freeCancelUntil]), b.offers.map((o) => [o.id, o.prepayment, o.freeCancelUntil]));
  const kinds = new Set(a.offers.map((o) => o.prepayment));
  for (const k of ['none', '50', 'full']) assert.ok(kinds.has(k), `${k} var`);
  for (const o of a.offers) {
    if (o.freeCancelUntil) {
      assert.match(o.freeCancelUntil, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(o.freeCancelUntil < o.checkIn && o.freeCancelUntil >= future(0));
    } else assert.strictEqual(o.freeCancelUntil, null);
  }
  assert.ok(a.offers.some((o) => o.freeCancelUntil) && a.offers.some((o) => !o.freeCancelUntil));
  const none = await search({ ...p, prepay: 'none' });
  assert.ok(none.offers.length > 0 && none.offers.every((o) => o.prepayment === 'none'));
  const upto = await search({ ...p, prepay: 'upto50' });
  assert.ok(upto.offers.every((o) => o.prepayment !== 'full'));
  const fc = await search({ ...p, freeCancel: '1' });
  assert.ok(fc.offers.length > 0 && fc.offers.every((o) => o.freeCancelUntil));
});

test('son dəqiqə: 14 gün ərzində çıxış, nişan və filtr', async () => {
  const lm = await search({ q: 'Antalya', type: 'package', checkIn: future(60), nights: 7, adults: 2, lastMinute: '1', flat: '1' });
  assert.ok(lm.offers.length > 0);
  for (const o of lm.offers) { assert.ok(o.lastMinute); const d = daysTo(o.checkIn); assert.ok(d >= 0 && d <= config.lastMinuteDays); }
  const far = await search({ q: 'Antalya', type: 'package', checkIn: future(60), nights: 7, adults: 2, flat: '1' });
  assert.ok(far.offers.every((o) => !o.lastMinute));
  const ex = await explore({ type: 'package', lastMinute: '1', checkIn: future(40) });
  assert.ok(ex.destinations.length > 0 && ex.destinations.every((d) => d.best.lastMinute));
});

test('qiymət təzəliyi: checkedAt, keş və refresh=1', async () => {
  const p = { q: 'Bodrum', type: 'package', checkIn: future(33), nights: 7, adults: 2 };
  const a = await search(p);
  assert.ok(a.serverTime);
  for (const s of a.sources) { assert.ok(s.ok); assert.ok(!Number.isNaN(Date.parse(s.checkedAt))); }
  const b = await search(p);
  assert.ok(b.sources.every((s) => s.cached));
  assert.deepStrictEqual(b.sources.map((s) => s.checkedAt), a.sources.map((s) => s.checkedAt));
  await new Promise((r) => setTimeout(r, 5));
  const c = await search({ ...p, refresh: '1' });
  assert.ok(c.sources.every((s) => !s.cached && s.checkedAt > a.sources[0].checkedAt));
  assert.strictEqual(c.query.refresh, undefined);
});

test('operator etibar bloku: uydurma məlumat yoxdur', () => {
  for (const p of providers) {
    assert.ok(p.trust, `${p.id} trust`);
    assert.strictEqual(p.trust.licenseNo, null);
    assert.strictEqual(p.trust.since, null);
    assert.strictEqual(p.trust.verified, false);
    if (p.id !== 'summer') assert.deepStrictEqual(p.trust.memberships, []);
  }
  const summer = providers.find((p) => p.id === 'summer');
  assert.deepStrictEqual(summer.trust.memberships.map((m) => m.name), ['IATA', 'ATAA']);
  assert.ok(summer.trust.memberships.every((m) => m.claim === 'operator'));
});

test('uşaq yaşları: əmsallar, validasiya və geriyə uyğunluq', async () => {
  assert.deepStrictEqual(parseChildAges('0, 5,12'), [0, 5, 12]);
  assert.strictEqual(parseChildAges(''), null);
  assert.throws(() => parseChildAges('18'));
  assert.throws(() => parseChildAges('abc'));
  assert.throws(() => parseChildAges('1,2,3,4,5,6,7'));
  assert.deepStrictEqual(childFactors([1]), { hotel: 0, flight: 0.1 });
  assert.strictEqual(childFactors([4]).hotel, 0.3);
  assert.strictEqual(childFactors([9]).hotel, 0.5);
  assert.strictEqual(childFactors([14]).hotel, 1);
  // yaş bilinmirsə köhnə əmsallar (0.5 otel, 0.75 aviabilet)
  assert.deepStrictEqual(childFactors([null]), { hotel: 0.5, flight: 0.75 });

  const q = parseQuery({ checkIn: future(30), childAges: '3,10' });
  assert.strictEqual(q.children, 2);
  assert.deepStrictEqual(q.childAges, [3, 10]);
  const legacy = parseQuery({ checkIn: future(30), children: '2' });
  assert.strictEqual(legacy.children, 2);
  assert.deepStrictEqual(legacy.childAges, [null, null]);

  const base = { destinationId: 'antalya', type: 'package', checkIn: future(45), nights: 7, adults: 2, flat: '1' };
  const price = async (extra) => {
    const r = await search({ ...base, ...extra });
    return Object.fromEntries(r.offers.map((o) => [o.id, o.price]));
  };
  const [none, infant, small, teen, old, age7] = await Promise.all([price({}), price({ childAges: '1' }), price({ childAges: '4' }), price({ childAges: '13' }), price({ children: '1' }), price({ childAges: '7' })]);
  const id = Object.keys(none)[0];
  assert.ok(infant[id] > none[id], 'körpə: yalnız aviabilet körpə tarifi');
  assert.ok(small[id] > infant[id]);
  assert.ok(teen[id] > small[id]);
  assert.strictEqual(old[id], age7[id], 'children=1 köhnə davranış = 7 yaş');
  await assert.rejects(() => search({ ...base, childAges: '25' }));
});

// Seçim testləri üçün stub: serverin "öz axtarışı" əvəzinə sabit təkliflər (qiymət SERVERDƏN gəlir)
const stubOffer = (over = {}) => ({ id: 'summer:x', name: 'Otel A', destination: { name: 'Antalya' }, stars: 5, checkIn: future(30), nights: 7, board: 'AI', boardLabel: 'Hər şey daxil', providerName: 'Summer Tour', price: 1000, prepayment: 'none', ...over });
const stubResolver = (catalog) => async (query, ids) => ({ pax: { adults: 2, children: 0 }, offers: ids.map((id) => catalog[id] || null) });
const account = (name = 'Test Agentlik', agencyId = 'ag_test') => ({ agencyId, agencyName: name, managerName: 'Aysel' });

test('B2B seçim: id təsadüfi, operator/net gizli, qiymət serverdən, limitlər', async () => {
  const store = new Map();
  const catalog = { 'summer:x': stubOffer(), 'summer:y': stubOffer({ id: 'summer:y', price: 2000 }) };
  const opts = { account: account(), store, resolveOffers: stubResolver(catalog) };
  // Klientin göndərdiyi qiymət/ad/agentlik NƏZƏRƏ ALINMIR
  const sel = await createSelection({ agency: 'Saxta', markup: 10, query: {}, offerIds: ['summer:x', 'summer:y'], items: [{ price: 1 }] }, opts);
  assert.match(sel.id, /^[A-Za-z0-9_-]{12}$/);
  assert.strictEqual(sel.agency, 'Test Agentlik');
  assert.strictEqual(sel.items[0].netPrice, 1000);
  const ids = new Set(await Promise.all(Array.from({ length: 200 }, async () => (await createSelection({ query: {}, offerIds: ['summer:x'] }, opts)).id)));
  assert.strictEqual(ids.size, 200);
  const pub = publicSelection(sel);
  assert.strictEqual(pub.items[0].clientPrice, 1100);
  const json = JSON.stringify(pub);
  for (const secret of ['Summer Tour', 'providerName', 'netPrice', 'summer:x', 'markup', 'agencyId', 'ag_test']) assert.ok(!json.includes(secret), `${secret} gizli olmalıdır`);
  await assert.rejects(() => createSelection({ query: {}, offerIds: ['summer:x'] }, { ...opts, account: null }));
  await assert.rejects(() => createSelection({ query: {}, offerIds: [] }, opts));
  await assert.rejects(() => createSelection({ query: {}, offerIds: Array.from({ length: LIMITS.selectionItems + 1 }, (_, i) => 'id' + i) }, opts));
  await assert.rejects(() => createSelection({ query: {}, markup: 500, offerIds: ['summer:x'] }, opts));
  await assert.rejects(() => createSelection({ query: {}, offerIds: ['yoxdur'] }, opts), /mövcud deyil/);
  await assert.rejects(() => createSelection({ offerIds: ['summer:x'] }, opts), /query/);
  await assert.rejects(() => createSelection({ query: {}, offerIds: [{ $gt: '' }] }, opts));
  assert.strictEqual(getSelectionRecord('../../etc', store), null);
  assert.strictEqual(getSelectionRecord('AAAAAAAAAAAA', store), null);
});

test('leads: callback və seçim leadi agentliyə (agencyId) bağlanır', async () => {
  const store = new Map();
  const sel = await createSelection({ client: 'Elvin', query: {}, offerIds: ['f:b'] }, {
    account: account('Lead Agentlik', 'ag_lead'), store,
    resolveOffers: stubResolver({ 'f:b': stubOffer({ id: 'f:b', name: 'Otel B', checkIn: future(20), nights: 3, providerName: 'Funsun Travel', price: 500 }) }),
  });
  const lead = createLead({ type: 'selection', selectionId: sel.id, itemIndex: 0, name: 'Nigar', phone: '+994 50 111 22 33' }, { selections: store });
  assert.strictEqual(lead.agency, 'Lead Agentlik');
  assert.strictEqual(lead.agencyId, 'ag_lead');
  assert.strictEqual(lead.item.clientPrice, 500);
  assert.throws(() => createLead({ type: 'selection', selectionId: sel.id, itemIndex: 5, name: 'Nigar', phone: '+994501112233' }, { selections: store }));
  assert.throws(() => createLead({ type: 'selection', selectionId: 'nope', itemIndex: 0, name: 'Nigar', phone: '+994501112233' }, { selections: store }));
  assert.ok(leadsForAgency('ag_lead').some((l) => l.id === lead.id));
  assert.deepStrictEqual(leadsForAgency('Lead Agentlik'), [], 'ad ilə yox, yalnız agencyId ilə');
  assert.deepStrictEqual(leadsForAgency('ag_basqa'), []);
  const cb = createLead({ type: 'callback', name: 'Kamran', phone: '0501234567', preferredTime: 'evening', context: 'Antalya' });
  assert.strictEqual(cb.type, 'callback');
  assert.strictEqual(cb.preferredTime, 'evening');
  assert.throws(() => createLead({ name: 'Xan', phone: '<script>' }));
  assert.throws(() => createLead({ name: '', phone: '0501234567' }));
  assert.throws(() => createLead({ name: '<img src=x>', phone: '0501234567' }), /Ad/);
  assert.throws(() => createLead({ name: 'Kamran', phone: '12345' }), /Telefon/);
});

test('HTTP: explore, config.trust, leads, selections axını (B2B giriş ilə)', async () => {
  const { base, close } = await startServer(app);
  const url = base;
  const post = (p, body) => fetch(url + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    const cfg = await (await fetch(`${url}/api/config`)).json();
    assert.ok(cfg.providers.every((p) => p.trust));
    assert.deepStrictEqual(cfg.installment.months, [6, 12]);

    const ex = await fetch(`${url}/api/explore?type=hotel&checkIn=${future(30)}&nights=3&maxPrice=1500&currency=USD`);
    assert.strictEqual(ex.status, 200);
    const exj = await ex.json();
    assert.ok(exj.destinations.length > 0 && exj.destinations.every((d) => d.minPrice <= 1500 && d.best.currency === 'USD'));
    assert.strictEqual((await fetch(`${url}/api/explore?checkIn=bad`)).status, 400);
    assert.strictEqual((await fetch(`${url}/api/search?q=Antalya&checkIn=${future(30)}&childAges=99`)).status, 400);

    assert.strictEqual((await post('/api/leads', { type: 'callback', name: 'Test', phone: '+994501112233', preferredTime: 'now' })).status, 201);
    assert.strictEqual((await post('/api/leads', { name: 'Test' })).status, 400);
    // köhnə format (type olmadan) hələ də işləyir
    assert.strictEqual((await post('/api/leads', { name: 'Test', phone: '+994501112233', offerId: 'x' })).status, 201);

    // Girişsiz seçim yaratmaq mümkün deyil
    assert.strictEqual((await post('/api/selections', { query: {}, offerIds: ['x'] })).status, 401);

    await createAccount({ agency: 'HTTP Agentlik', username: 'http-agent', displayName: 'M' });
    const s = await login(url, 'http-agent', 'Test-Parol-Uzun-2026');
    assert.strictEqual(s.res.status, 200);
    const api = client(url, s);

    // Real axtarış → təklif id-ləri; qiymət serverdə yenidən hesablanır
    const query = { q: 'Dubay', type: 'package', checkIn: future(25), nights: '5', adults: '2', children: '0', flat: '1' };
    const sr = await (await fetch(`${url}/api/search?${new URLSearchParams(query)}`)).json();
    const offer = sr.offers[0];
    const cr = await api.post('/api/selections', { markup: 5, query, offerIds: [offer.id], items: [{ id: offer.id, price: 1 }] });
    assert.strictEqual(cr.status, 201);
    const { id, url: link } = await cr.json();
    assert.strictEqual(link, `/s/${id}`);
    const g = await (await fetch(`${url}/api/selections/${id}`)).json();
    assert.strictEqual(g.agency, 'HTTP Agentlik');
    assert.strictEqual(g.items[0].clientPrice, Math.round(offer.price * 1.05), 'klientin qiyməti (1) yox, serverin qiyməti');
    assert.ok(!JSON.stringify(g).includes(offer.providerName));
    assert.strictEqual((await fetch(`${url}/api/selections/xxxxxxxxxxxx`)).status, 404);
    const page = await fetch(`${url}/s/${id}`);
    assert.strictEqual(page.status, 200);
    assert.match(await page.text(), /s\.js/);

    assert.strictEqual((await post('/api/leads', { type: 'selection', selectionId: id, itemIndex: 0, name: 'Müştəri', phone: '+994551234567' })).status, 201);
    const leads = await (await api.get('/api/b2b/leads')).json();
    assert.strictEqual(leads.leads.length, 1);
    assert.strictEqual(leads.leads[0].item.providerName, offer.providerName); // agentlik öz operatorunu görür
    // Girişsiz: 401 (agency parametri heç nə vermir)
    assert.strictEqual((await fetch(`${url}/api/b2b/leads?agency=${encodeURIComponent('HTTP Agentlik')}`)).status, 401);
  } finally {
    await close();
  }
});
