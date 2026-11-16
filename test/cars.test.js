const test = require('node:test');
const assert = require('node:assert');
const { searchRentals, searchTransfers, pickClasses } = require('../src/cars/search');
const { validateRequest, createRequest } = require('../src/cars/requests');
const { resolvePoint, searchLocations } = require('../src/cars/locations');
const { destinations } = require('../src/data/catalog');

const future = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const base = { pickup: 'antalya', from: future(40), to: future(47) };
const allOffers = (r) => r.groups.flatMap((g) => g.offers);

test('lokasiyalar tur istiqamətləri ilə uyğundur', () => {
  const ids = ['antalya', 'alanya', 'kemer', 'side', 'bodrum', 'istanbul', 'dubai', 'sharm', 'batumi', 'tbilisi', 'qabala', 'shahdag', 'sheki', 'lankaran', 'baku', 'naftalan'];
  for (const id of ids) {
    assert.ok(destinations.some((d) => d.id === id), `${id} kataloqda var`);
    const p = resolvePoint(id);
    assert.ok(p, `${id} nöqtəyə çevrilir`);
    assert.ok(p.destinationId === id || (p.serves || []).includes(id));
  }
  assert.strictEqual(resolvePoint('antalya').id, 'ayt-apt');
  assert.strictEqual(resolvePoint('kemer').id, 'kemer-city');
  assert.strictEqual(resolvePoint('maldives'), null);
  assert.ok(searchLocations('анталья').some((p) => p.id === 'ayt-apt'));
  assert.ok(searchLocations('GYD').some((p) => p.id === 'gyd-apt'));
});

test('icarə: qruplar və şirkətlər ucuzdan bahalıya, ümumi = hissələrin cəmi', async () => {
  const r = await searchRentals(base);
  assert.strictEqual(r.query.days, 7);
  assert.ok(r.groups.length >= 5);
  for (let i = 1; i < r.groups.length; i++) assert.ok(r.groups[i - 1].best.price.total <= r.groups[i].best.price.total);
  assert.ok(r.groups.some((g) => g.offers.length >= 2), 'eyni model bir neçə şirkətdə müqayisə olunur');
  for (const g of r.groups) {
    for (let i = 1; i < g.offers.length; i++) assert.ok(g.offers[i - 1].price.total <= g.offers[i].price.total);
    assert.strictEqual(g.best.id, g.offers[0].id);
    assert.ok(g.example.endsWith('və ya oxşar'));
  }
  for (const o of allOffers(r)) {
    const p = o.price;
    assert.strictEqual(p.total, p.rental + p.oneWay + p.young + p.extras);
    assert.strictEqual(p.daily, Math.round(p.total / 7));
    assert.strictEqual(o.demo, true);
  }
});

test('icarə: qiymətlər deterministikdir və mövsümdən asılıdır', async () => {
  const a = await searchRentals(base);
  const b = await searchRentals(base);
  assert.deepStrictEqual(a.groups.map((g) => g.best.price.total), b.groups.map((g) => g.best.price.total));
  // Antalya: avqust (pik) yanvardan bahadır
  const year = new Date().getUTCFullYear() + 1;
  const summer = await searchRentals({ pickup: 'antalya', from: `${year}-08-10`, to: `${year}-08-17` });
  const winter = await searchRentals({ pickup: 'antalya', from: `${year}-01-10`, to: `${year}-01-17` });
  const s = summer.groups.find((g) => g.modelId === 'toyota-corolla').best.price.total;
  const w = winter.groups.find((g) => g.modelId === 'toyota-corolla').best.price.total;
  assert.ok(s > w * 1.5, `yay ${s} > qış ${w}`);
});

test('icarə: filtrlər tətbiq olunur', async () => {
  const fam = await searchRentals({ ...base, minSeats: 7 });
  assert.ok(fam.groups.length > 0 && allOffers(fam).every((o) => o.seats >= 7));
  const auto = await searchRentals({ ...base, transmission: 'manual' });
  assert.ok(allOffers(auto).length > 0 && allOffers(auto).every((o) => o.transmission === 'manual'));
  const cat = await searchRentals({ ...base, categories: 'suv,electric' });
  assert.ok(allOffers(cat).every((o) => ['suv', 'electric'].includes(o.category)));
  const full = await searchRentals({ ...base, fullInsurance: '1', freeCancel: '1' });
  assert.ok(allOffers(full).length > 0 && allOffers(full).every((o) => o.insurance === 'full' && o.freeCancel));
  const comp = await searchRentals({ ...base, companies: 'sahil' });
  assert.ok(allOffers(comp).every((o) => o.companyId === 'sahil'));
  const max = await searchRentals({ ...base, maxPrice: 300 });
  assert.ok(allOffers(max).length > 0 && allOffers(max).every((o) => o.price.total <= 300));
});

test('icarə: fərqli yerdə qaytarma əlavə ödəniş əlavə edir', async () => {
  const same = await searchRentals(base);
  const far = await searchRentals({ ...base, dropoff: 'bjv-apt' }); // Antalya → Bodrum
  assert.strictEqual(far.query.oneWay, true);
  const byId = (r) => Object.fromEntries(allOffers(r).map((o) => [o.id, o]));
  const s = byId(same); const f = byId(far);
  const common = Object.keys(f).filter((id) => s[id]);
  assert.ok(common.length > 0);
  for (const id of common) {
    assert.ok(f[id].price.oneWay > 0);
    assert.strictEqual(f[id].price.total, s[id].price.total + f[id].price.oneWay);
  }
  await assert.rejects(() => searchRentals({ ...base, dropoff: 'tbilisi' }), /ölkədə/);
});

test('icarə: 25 yaşdan aşağı sürücü əlavəsi və yaş məhdudiyyəti', async () => {
  const adult = await searchRentals({ ...base, age: 30 });
  const young = await searchRentals({ ...base, age: 22 });
  assert.ok(allOffers(adult).every((o) => o.price.young === 0));
  assert.ok(allOffers(young).length > 0 && allOffers(young).every((o) => o.price.young > 0));
  assert.ok(allOffers(young).every((o) => o.category !== 'premium' && o.minAge <= 22));
  const a = Object.fromEntries(allOffers(adult).map((o) => [o.id, o]));
  for (const o of allOffers(young)) assert.strictEqual(o.price.total, a[o.id].price.total + o.price.young);
  await assert.rejects(() => searchRentals({ ...base, age: 17 }), /yaş/);
});

test('icarə: əlavələr ümumi qiymətə əlavə olunur', async () => {
  const plain = await searchRentals(base);
  const ex = await searchRentals({ ...base, childSeats: 2, gps: '1', extraDriver: '1' });
  const p = Object.fromEntries(allOffers(plain).map((o) => [o.id, o]));
  for (const o of allOffers(ex)) {
    assert.ok(o.price.extrasDetail.childSeat > 0 && o.price.extrasDetail.gps > 0);
    assert.strictEqual(o.price.total, p[o.id].price.total + o.price.extras);
  }
});

test('icarə: tarix və parametr yoxlaması', async () => {
  await assert.rejects(() => searchRentals({ ...base, from: 'abc' }));
  await assert.rejects(() => searchRentals({ ...base, from: future(-2), to: future(3) }), /keçmiş/);
  await assert.rejects(() => searchRentals({ ...base, to: base.from }), /sonra/);
  await assert.rejects(() => searchRentals({ ...base, pickup: 'atlantis' }), /tanınmadı/);
  await assert.rejects(() => searchRentals({ ...base, childSeats: 9 }));
  const r = await searchRentals({ ...base, to: future(41), toTime: '10:30' }); // 24.5 saat = 1 gün (güzəşt)
  assert.strictEqual(r.query.days, 1);
});

test('transfer: sinif nəfər və baqaja görə avtomatik seçilir', async () => {
  assert.strictEqual(pickClasses(2, 2).recommended.id, 'sedan');
  assert.strictEqual(pickClasses(3, 4).recommended.id, 'minivan');
  assert.strictEqual(pickClasses(5, 3).recommended.id, 'minivan');
  assert.strictEqual(pickClasses(9, 5).recommended.id, 'minibus');
  assert.ok(!pickClasses(9, 5).fitting.some((c) => c.id === 'vip' || c.id === 'sedan'));
  const r = await searchTransfers({ from: 'antalya', to: 'alanya', date: future(30), pax: 5, bags: 4 });
  assert.strictEqual(r.recommendedClass, 'minivan');
  assert.strictEqual(r.groups[0].classId, 'minivan');
  assert.ok(r.groups[0].recommended);
  assert.ok(r.km > 50 && r.durationMin > 0);
  assert.ok(!r.groups.some((g) => g.classId === 'sedan'));
  for (const g of r.groups) for (let i = 1; i < g.offers.length; i++) assert.ok(g.offers[i - 1].price <= g.offers[i].price);
});

test('transfer: sabit qiymət, gecə əlavəsi, günlük sürücülü və xətalar', async () => {
  const q = { from: 'ayt-apt', to: 'antalya-city', date: future(30), pax: 2, bags: 2 };
  const day = await searchTransfers({ ...q, time: '14:00' });
  const night = await searchTransfers({ ...q, time: '23:30' });
  assert.ok(night.groups[0].best.price > day.groups[0].best.price);
  const daily = await searchTransfers({ mode: 'daily', from: 'baku', date: future(30), days: 3, pax: 4 });
  assert.strictEqual(daily.query.mode, 'daily');
  assert.strictEqual(daily.recommendedClass, 'minivan');
  assert.ok(daily.groups.length > 0);
  await assert.rejects(() => searchTransfers({ ...q, to: 'ayt-apt' }), /eyni/);
  await assert.rejects(() => searchTransfers({ ...q, to: 'dubai' }), /Ölkələrarası/);
  await assert.rejects(() => searchTransfers({ ...q, pax: 40 }), /Nəfər/);
});

test('müraciət: ciddi validasiya, sənəd sahələri rədd edilir', async () => {
  const r = await searchRentals(base);
  const offer = r.groups[0].best;
  const ok = { name: 'Aysel Məmmədova', phone: '+994 50 123 45 67', note: 'Uşaq oturacağı lazımdır', kind: 'rental', query: base, offerId: offer.id };
  assert.deepStrictEqual(validateRequest(ok).errors, []);
  assert.ok(validateRequest({ ...ok, name: 'A' }).errors.length);
  assert.ok(validateRequest({ ...ok, name: '<script>' }).errors.length);
  assert.ok(validateRequest({ ...ok, phone: '12' }).errors.length);
  assert.ok(validateRequest({ ...ok, phone: 'abc-def-ghij' }).errors.length);
  assert.ok(validateRequest({ ...ok, note: 'x'.repeat(501) }).errors.length);
  assert.ok(validateRequest({ ...ok, kind: 'flight' }).errors.length);
  assert.ok(validateRequest({ ...ok, offerId: '../../etc' }).errors.length);
  assert.ok(validateRequest({ ...ok, passport: 'AA1234567' }).errors.length);
  assert.ok(validateRequest({ ...ok, licenseNumber: 'X1' }).errors.length);
  assert.ok(validateRequest({ ...ok, query: { ...base, evil: '1' } }).errors.length);
  assert.ok(validateRequest(null).errors.length);

  const rec = await createRequest(ok);
  assert.strictEqual(rec.summary.total, offer.price.total); // qiymət serverdə yenidən hesablanır
  assert.ok(!('passport' in rec) && !('license' in rec));
  await assert.rejects(() => createRequest({ ...ok, offerId: 'nope|nope' }), /mövcud deyil/);

  const t = await searchTransfers({ from: 'gyd-apt', to: 'baku', date: future(10), pax: 2 });
  const trec = await createRequest({ name: 'Elvin', phone: '0501234567', kind: 'transfer', query: { from: 'gyd-apt', to: 'baku', date: future(10), pax: '2' }, offerId: t.groups[0].best.id });
  assert.strictEqual(trec.summary.total, t.groups[0].best.price);
});

test('API marşrutları', async () => {
  const app = require('../server');
  const srv = app.listen(0);
  const url = `http://127.0.0.1:${srv.address().port}`;
  try {
    const loc = await (await fetch(`${url}/api/cars/locations?q=bak`)).json();
    assert.ok(loc.some((p) => p.id === 'gyd-apt'));
    const s = await fetch(`${url}/api/cars/search?pickup=antalya&from=${future(20)}&to=${future(25)}&currency=USD`);
    assert.strictEqual(s.status, 200);
    const sj = await s.json();
    assert.strictEqual(sj.query.currency, 'USD');
    const bad = await fetch(`${url}/api/cars/search?pickup=antalya&from=bad&to=bad`);
    assert.strictEqual(bad.status, 400);
    const tr = await fetch(`${url}/api/cars/transfers?from=dubai&to=dubai&date=${future(20)}&pax=3`);
    assert.strictEqual(tr.status, 200);
    const post = await fetch(`${url}/api/cars/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', phone: '+994501112233', kind: 'rental', query: { pickup: 'antalya', from: future(20), to: future(25), currency: 'USD' }, offerId: sj.groups[0].best.id }) });
    assert.strictEqual(post.status, 201);
    const pj = await post.json();
    assert.strictEqual(pj.total, sj.groups[0].best.price.total);
    const rej = await fetch(`${url}/api/cars/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', phone: '+994501112233', kind: 'rental', passport: 'X', query: {}, offerId: 'a|b' }) });
    assert.strictEqual(rej.status, 400);
  } finally {
    srv.close();
  }
});
