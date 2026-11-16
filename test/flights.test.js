const test = require('node:test');
const assert = require('node:assert');
const { searchFlights, parseQuery, timeBucket } = require('../src/flights/search');
const { searchAirports, utcOffsetMin, getAirport } = require('../src/flights/airports');
const { validateRequest, validFlightId } = require('../src/flights/requests');

const future = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const codes = (q) => searchAirports(q).map((a) => a.code);

test('hava limanları AZ/EN/RU adları və kodla tapılır', () => {
  assert.strictEqual(codes('Bakı')[0], 'GYD');
  assert.strictEqual(codes('baku')[0], 'GYD');
  assert.strictEqual(codes('Баку')[0], 'GYD');
  assert.strictEqual(codes('Naxçıvan')[0], 'NAJ');
  assert.strictEqual(codes('naxcivan')[0], 'NAJ');
  assert.ok(codes('Москва').includes('SVO') && codes('Москва').includes('VKO'));
  assert.strictEqual(codes('Москва')[0], 'SVO,VKO,DME'); // "bütün hava limanları" sətri
  assert.ok(codes('İstanbul').includes('IST') && codes('istanbul').includes('SAW'));
  assert.strictEqual(codes('TSE')[0], 'NQZ'); // köhnə Astana kodu
  assert.strictEqual(codes('KVD')[0], 'GNJ');
  assert.strictEqual(codes('Шарм')[0], 'SSH');
  assert.strictEqual(searchAirports('Dubai', 'ru')[0].city, 'Дубай');
  assert.ok(searchAirports('').length > 0);
  assert.deepStrictEqual(codes('xyzxyz'), []);
});

test('yay vaxtı (təxmini) nəzərə alınır', () => {
  assert.strictEqual(utcOffsetMin(getAirport('LHR'), '2026-07-01'), 60);
  assert.strictEqual(utcOffsetMin(getAirport('LHR'), '2026-12-01'), 0);
  assert.strictEqual(utcOffsetMin(getAirport('GYD'), '2026-07-01'), 240);
});

test('nəticələr default ən ucuzdan bahalıya; qrupda ən ucuz mənbə birinci', async () => {
  const r = await searchFlights({ from: 'GYD', to: 'IST', depart: future(30), adults: 2, calendar: '0' });
  assert.ok(r.groups.length > 3);
  for (let i = 1; i < r.groups.length; i++) assert.ok(r.groups[i - 1].best.price <= r.groups[i].best.price);
  for (const g of r.groups) {
    assert.strictEqual(g.best.price, g.providers[0].price);
    for (let j = 1; j < g.providers.length; j++) assert.ok(g.providers[j - 1].price <= g.providers[j].price);
    assert.strictEqual(new Set(g.providers.map((p) => p.sourceId)).size, g.providers.length);
  }
  assert.ok(r.groups.some((g) => g.providers.length > 1), 'eyni uçuş bir neçə mənbədə olmalıdır');
  assert.strictEqual(r.summary.price.id, r.groups[0].id);
});

test('deterministikdir: eyni sorğu eyni nəticə', async () => {
  const p = { from: 'GYD', to: 'DXB', depart: future(45), adults: 1, calendar: '0' };
  const a = await searchFlights(p); const b = await searchFlights(p);
  assert.deepStrictEqual(a.groups.map((g) => [g.id, g.best.price]), b.groups.map((g) => [g.id, g.best.price]));
});

test('"ən sürətli" və "ən yaxşı" sıralama', async () => {
  const base = { from: 'GYD', to: 'BKK', depart: future(40), adults: 1, calendar: '0' };
  const f = await searchFlights({ ...base, sort: 'fastest' });
  for (let i = 1; i < f.groups.length; i++) assert.ok(f.groups[i - 1].durationMin <= f.groups[i].durationMin);
  const b = await searchFlights({ ...base, sort: 'best' });
  for (let i = 1; i < b.groups.length; i++) assert.ok(b.groups[i - 1].score <= b.groups[i].score);
  assert.strictEqual(b.groups.length, f.groups.length);
  assert.strictEqual(f.summary.fastest.id, f.groups[0].id);
});

test('filtrlər: birbaşa, aktarma, aviaşirkət, saat, baqaj, maks. qiymət', async () => {
  const base = { from: 'GYD', to: 'IST,SAW', depart: future(35), adults: 1, calendar: '0' };
  const all = await searchFlights(base);
  assert.ok(all.facets.stops.length >= 2);

  const direct = await searchFlights({ ...base, direct: '1' });
  assert.ok(direct.groups.length > 0 && direct.groups.every((g) => g.stops === 0));

  const one = await searchFlights({ ...base, stops: '1' });
  assert.ok(one.groups.length > 0 && one.groups.every((g) => g.stops === 1));

  const airline = all.facets.airlines[0].code;
  const al = await searchFlights({ ...base, airlines: airline });
  assert.ok(al.groups.length > 0 && al.groups.every((g) => g.validating === airline));

  const bucket = all.facets.times.find((x) => x.count > 0).id;
  const tm = await searchFlights({ ...base, times: bucket });
  assert.ok(tm.groups.length > 0 && tm.groups.every((g) => timeBucket(g.outbound.dep) === bucket));

  const bags = await searchFlights({ ...base, bags: '1' });
  assert.ok(bags.groups.length > 0 && bags.groups.every((g) => g.best.fare.checked > 0 && g.offers.every((o) => o.fare.checked > 0)));
  assert.ok(all.groups.some((g) => g.best.fare.checked === 0), 'lowcost baqajsız tarif mövcud olmalıdır');

  const limit = all.groups[Math.floor(all.groups.length / 2)].best.price;
  const mp = await searchFlights({ ...base, maxPrice: limit });
  assert.ok(mp.groups.length > 0 && mp.groups.every((g) => g.best.price <= limit));
  assert.ok(mp.groups.length < all.groups.length);
});

test('gediş-dönüş: dönüş istiqaməti, vaxt ardıcıllığı, qiymət', async () => {
  const r = await searchFlights({ from: 'GYD', to: 'AYT', trip: 'round', depart: future(40), return: future(47), adults: 2, children: 1, infants: 1, calendar: '0' });
  assert.ok(r.groups.length > 0);
  for (const g of r.groups) {
    assert.ok(g.inbound);
    assert.strictEqual(g.outbound.from, 'GYD');
    assert.strictEqual(g.inbound.to, 'GYD');
    assert.strictEqual(g.inbound.from, g.outbound.to);
    assert.ok(g.inbound.dep.slice(0, 10) === future(47));
    assert.ok(g.id.includes('~'));
    assert.strictEqual(g.durationMin, g.outbound.durationMin + g.inbound.durationMin);
  }
  const ow = await searchFlights({ from: 'GYD', to: 'AYT', depart: future(40), adults: 2, children: 1, infants: 1, calendar: '0' });
  assert.ok(ow.groups.every((g) => g.inbound === null));
  assert.ok(r.stats.min > ow.stats.min, 'gediş-dönüş birtərəflidən baha olmalıdır');
});

test('biznes sinif və sərnişin sayı qiymətə təsir edir', async () => {
  const p = { from: 'GYD', to: 'DXB', depart: future(50), calendar: '0' };
  const eco1 = await searchFlights({ ...p, adults: 1 });
  const eco2 = await searchFlights({ ...p, adults: 2 });
  const biz = await searchFlights({ ...p, adults: 1, cabin: 'business' });
  assert.ok(eco2.stats.min > eco1.stats.min * 1.6);
  assert.ok(biz.stats.min > eco1.stats.min * 2);
  assert.ok(biz.groups.every((g) => g.best.fare.cabin === 'business'));
});

test('qiymət təqvimi ±3 gün, seçilmiş gün = ən ucuz nəticə', async () => {
  const r = await searchFlights({ from: 'GYD', to: 'TBS', depart: future(20), adults: 1 });
  assert.strictEqual(r.calendar.length, 7);
  assert.strictEqual(r.calendar[3].depart, future(20));
  assert.ok(r.calendar[3].selected);
  assert.strictEqual(r.calendar[3].price, r.stats.min);
  const near = await searchFlights({ from: 'GYD', to: 'TBS', depart: future(1), adults: 1 });
  assert.ok(near.calendar[0].disabled && near.calendar[0].price === null); // keçmiş tarix
});

test('valyuta çevrilir', async () => {
  const p = { from: 'GYD', to: 'IST', depart: future(30), calendar: '0' };
  const azn = await searchFlights(p);
  const usd = await searchFlights({ ...p, currency: 'USD' });
  assert.strictEqual(usd.query.currency, 'USD');
  assert.ok(usd.stats.min < azn.stats.min);
});

test('axtarış validasiyası', () => {
  const ok = { from: 'GYD', to: 'IST', depart: future(10) };
  assert.doesNotThrow(() => parseQuery(ok));
  assert.throws(() => parseQuery({ ...ok, from: 'XXX' }), /from/);
  assert.throws(() => parseQuery({ ...ok, to: 'GYD' }), /eyni/);
  assert.throws(() => parseQuery({ ...ok, depart: '2020-01-01' }), /keçmiş/);
  assert.throws(() => parseQuery({ ...ok, depart: '2026-02-30' }), /tarixi/);
  assert.throws(() => parseQuery({ ...ok, trip: 'round', return: future(5) }), /əvvəl/);
  assert.throws(() => parseQuery({ ...ok, trip: 'round' }), /Dönüş/);
  assert.throws(() => parseQuery({ ...ok, adults: 1, infants: 2 }), /Körpə/);
  assert.throws(() => parseQuery({ ...ok, adults: 6, children: 4 }), /9 yer/);
  assert.throws(() => parseQuery({ ...ok, adults: 0 }), /Böyük/);
  assert.throws(() => parseQuery({ ...ok, depart: future(400) }), /gün irəli/);
  assert.strictEqual(parseQuery({ ...ok, sort: 'evil' }).sort, 'price');
  assert.strictEqual(parseQuery({ ...ok, currency: 'XYZ' }).currency, 'AZN');
});

test('müraciət validasiyası (pasport məlumatı saxlanılmır)', async () => {
  const r = await searchFlights({ from: 'GYD', to: 'NAJ', depart: future(15), calendar: '0' });
  const g = r.groups[0];
  assert.ok(validFlightId(g.id));
  const good = { name: 'Əli Məmmədov', phone: '+994 50 123 45 67', email: 'ali@example.az', flightId: g.id, offerId: g.best.id, passport: 'AA1234567', passportNo: 'X' };
  const saved = validateRequest(good);
  assert.deepStrictEqual(Object.keys(saved).sort(), ['email', 'flightId', 'name', 'note', 'offerId', 'phone']);
  assert.ok(!JSON.stringify(saved).includes('AA1234567'));

  assert.throws(() => validateRequest({ ...good, name: '' }), /Ad/);
  assert.throws(() => validateRequest({ ...good, name: 'A'.repeat(81) }), /Ad/);
  assert.throws(() => validateRequest({ ...good, name: '<script>' }), /Ad/);
  assert.throws(() => validateRequest({ ...good, phone: '12' }), /Telefon/);
  assert.throws(() => validateRequest({ ...good, phone: 'abc-defg-hij' }), /Telefon/);
  assert.throws(() => validateRequest({ ...good, email: 'not-an-email' }), /E-poçt/);
  assert.throws(() => validateRequest({ ...good, note: 'x'.repeat(501) }), /Qeyd/);
  assert.throws(() => validateRequest({ ...good, flightId: 'DROP TABLE' }), /Uçuş/);
  assert.throws(() => validateRequest({ ...good, offerId: 'demo-gds|classic|OTHER' }), /Təklif/);
  assert.throws(() => validateRequest({ ...good, name: { $gt: '' } }), /Ad/);
  assert.doesNotThrow(() => validateRequest({ ...good, email: '' }));
});

test('HTTP API: airports, search, requests', async () => {
  const app = require('../server');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const ap = await (await fetch(`${base}/api/flights/airports?q=Antalya`)).json();
    assert.strictEqual(ap[0].code, 'AYT');

    const bad = await fetch(`${base}/api/flights/search?from=GYD&to=GYD&depart=${future(5)}`);
    assert.strictEqual(bad.status, 400);
    const res = await fetch(`${base}/api/flights/search?from=GYD&to=IST&depart=${future(25)}&calendar=0`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.demo && data.groups.length > 0);

    const post = (body) => fetch(`${base}/api/flights/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const ok = await post({ name: 'Test İstifadəçi', phone: '+994501234567', flightId: data.groups[0].id });
    assert.strictEqual(ok.status, 201);
    assert.ok((await ok.json()).id > 0);
    const nope = await post({ name: 'T', phone: 'x' });
    assert.strictEqual(nope.status, 400);
    const err = await nope.json();
    assert.ok(err.fields.name && err.fields.phone && err.fields.flightId);
  } finally {
    server.close();
  }
});
