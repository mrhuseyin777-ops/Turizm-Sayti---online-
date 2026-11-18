// Aviabilet P1: ay təqvimi, "Hara uça bilərəm?", baqaj qiyməti, aktarma riskləri, qiymət izləmə, Naxçıvan bloku
const fs = require('fs');
const os = require('os');
const path = require('path');
// İzləmələr repo data/ qovluğuna yazılmasın — server/alerts yüklənməzdən ƏVVƏL
process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-fp1-'));

const test = require('node:test');
const assert = require('node:assert');
const { searchFlights, monthCalendar, explore, parseQuery, clearCache } = require('../src/flights/search');
const { createAlertStore, MAX_PER_IP } = require('../src/flights/alerts');
const { regulatedRoute } = require('../src/flights/regulated');
const { shortLimit } = require('../src/flights/schedule');
const { getAirport } = require('../src/flights/airports');
const { startServer, future } = require('./_helpers');

const monthAhead = (days) => future(days).slice(0, 7);
let S;
test.before(async () => { S = await startServer(require('../server')); });
test.after(async () => { await S.close(); fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true }); });

// ---------------------------------------------------------------- Ay təqvimi
test('ay təqvimi: ayın hər günü, ən ucuz 3 gün, qiymət axtarışla eynidir', async () => {
  const month = monthAhead(45);
  const r = await monthCalendar({ from: 'GYD', to: 'IST,SAW', month });
  const [y, m] = month.split('-').map(Number);
  assert.strictEqual(r.days.length, new Date(Date.UTC(y, m, 0)).getUTCDate());
  assert.strictEqual(r.days[0].date, `${month}-01`);
  const priced = r.days.filter((d) => d.price != null);
  assert.ok(priced.length > 20);
  const cheap = r.days.filter((d) => d.cheap);
  assert.strictEqual(cheap.length, 3);
  const maxCheap = Math.max(...cheap.map((d) => d.price));
  assert.ok(priced.filter((d) => !d.cheap).every((d) => d.price >= maxCheap));
  assert.strictEqual(r.min, Math.min(...priced.map((d) => d.price)));
  // Günə klik = həmin tarixə axtarış: qiymət eyni olmalıdır
  const d = priced[5];
  const s = await searchFlights({ from: 'GYD', to: 'IST,SAW', depart: d.date, calendar: '0' });
  assert.strictEqual(s.stats.min, d.price);
  assert.ok(r.prevMonth && r.nextMonth);
});

test('ay təqvimi: gediş-dönüş (dönüş = gediş + gecə), keçmiş günlər bağlı, baqaj qiymətə daxil', async () => {
  const month = future(0).slice(0, 7);
  const r = await monthCalendar({ from: 'GYD', to: 'DXB', month, trip: 'round', nights: '5' });
  for (const d of r.days) {
    const exp = new Date(d.date + 'T00:00:00Z'); exp.setUTCDate(exp.getUTCDate() + 5);
    assert.strictEqual(d.return, exp.toISOString().slice(0, 10));
    if (d.date < future(0)) assert.ok(d.disabled && d.price === null);
  }
  assert.strictEqual(r.prevMonth, null); // cari aydan əvvələ keçid yoxdur
  const withBag = await monthCalendar({ from: 'GYD', to: 'DXB', month, trip: 'round', nights: '5', bagCount: '2' });
  const i = r.days.findIndex((d) => d.price != null);
  assert.ok(withBag.days[i].price >= r.days[i].price);
});

test('ay təqvimi: validasiya, limit və keş', async () => {
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'IST', month: '2026-13' }), /Ay/);
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'IST', month: 'abc' }), /Ay/);
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'IST', month: '2020-01' }), /360/);
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'IST', month: monthAhead(500) }), /360/);
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'IST', month: monthAhead(30), trip: 'round', nights: '45' }), /Gecə/);
  await assert.rejects(monthCalendar({ from: 'GYD', to: 'XXX', month: monthAhead(30) }), /to/);
  const p = { from: 'GYD', to: 'BKK', month: monthAhead(70), trip: 'round', nights: '7' };
  await monthCalendar({ from: 'GYD', to: 'TBS', month: monthAhead(70) }); // isinmə (JIT)
  clearCache();
  const cold = await monthCalendar(p);
  assert.strictEqual(cold.cached, false);
  assert.ok(cold.tookMs < 500, `keşsiz ay təqvimi ${cold.tookMs} ms`);
  const warm = await monthCalendar(p);
  assert.strictEqual(warm.cached, true);
  assert.deepStrictEqual(warm.days, cold.days);
});

// ---------------------------------------------------------------- Explore
test('"Hara uça bilərəm?": ucuzdan bahalıya, büdcə, birbaşa, qiymət axtarışla eynidir', async () => {
  const r = await explore({ from: 'GYD', depart: future(40) });
  assert.ok(r.estimate && r.demo);
  assert.ok(r.items.length > 20);
  for (let i = 1; i < r.items.length; i++) assert.ok(r.items[i - 1].price <= r.items[i].price);
  assert.ok(!r.items.some((x) => x.to.split(',').includes('GYD')));
  const ist = r.items.find((x) => x.to === 'IST,SAW');
  assert.ok(ist && ist.city && ist.country && ist.carrierName && ist.date === future(40));
  // Karta klik = həmin marşrutla axtarış
  const s = await searchFlights({ from: 'GYD', to: ist.to, depart: ist.date, calendar: '0' });
  assert.strictEqual(s.stats.min, ist.price);

  const budget = r.items[Math.floor(r.items.length / 2)].price;
  const b = await explore({ from: 'GYD', depart: future(40), budget: String(budget) });
  assert.ok(b.items.length > 0 && b.items.length < r.items.length && b.items.every((x) => x.price <= budget));
  const d = await explore({ from: 'GYD', depart: future(40), direct: '1' });
  assert.ok(d.items.length > 0 && d.items.every((x) => x.direct && x.stops === 0));
  await assert.rejects(explore({ from: 'GYD', budget: '-5' }), /Büdcə/);
  await assert.rejects(explore({ from: 'QQQ' }), /from/);
  await assert.rejects(explore({ from: 'GYD', depart: '2020-01-01' }), /keçmiş/);
});

test('"Hara uça bilərəm?" ay rejimi: tarix ayın içindədir, keşsiz < 500 ms', async () => {
  await explore({ from: 'IST,SAW', depart: future(20) }); // isinmə
  clearCache();
  const month = monthAhead(80);
  const r = await explore({ from: 'GYD', month });
  assert.strictEqual(r.mode, 'month');
  assert.ok(r.tookMs < 500, `keşsiz explore ${r.tookMs} ms`);
  assert.ok(r.items.length > 20 && r.items.every((x) => x.date.startsWith(month)));
  const again = await explore({ from: 'GYD', month });
  assert.strictEqual(again.cached, true);
});

// ---------------------------------------------------------------- Baqaj
test('baqaj: seçilmiş çanta sayı ümumi qiymətə əlavə olunur, bölgü düzgündür', async () => {
  const base = { from: 'GYD', to: 'SAW', depart: future(33), calendar: '0', adults: '2', children: '1' };
  const r0 = await searchFlights(base);
  const r1 = await searchFlights({ ...base, bagCount: '1' });
  const r2 = await searchFlights({ ...base, bagCount: '2' });
  assert.strictEqual(r1.query.bagCount, 1);
  const g0 = r0.groups.find((g) => g.offers.some((o) => o.fare.family === 'light'));
  const g1 = r1.groups.find((g) => g.id === g0.id);
  const g2 = r2.groups.find((g) => g.id === g0.id);
  const light = (g) => g.offers.find((o) => o.fare.family === 'light' && o.sourceId === g0.offers.find((x) => x.fare.family === 'light').sourceId);
  assert.strictEqual(light(g0).bagFee, 0);
  assert.strictEqual(light(g0).price, light(g0).ticket);
  assert.ok(light(g1).bagFee > 0);
  assert.strictEqual(light(g1).price, light(g1).ticket + light(g1).bagFee);
  assert.strictEqual(light(g1).ticket, light(g0).ticket);
  assert.ok(light(g2).bagFee > light(g1).bagFee * 2); // 2-ci çanta baha
  for (const r of [r0, r1, r2]) {
    for (const g of r.groups) {
      for (const o of g.offers) {
        const b = o.breakdown;
        assert.strictEqual(b.fare + b.tax + b.bags, o.price);
        if (o.fare.pieces >= r.query.bagCount) assert.strictEqual(o.bagFee, 0);
      }
      for (let i = 1; i < g.offers.length; i++) assert.ok(g.offers[i - 1].price <= g.offers[i].price);
    }
    for (let i = 1; i < r.groups.length; i++) assert.ok(r.groups[i - 1].best.price <= r.groups[i].best.price);
  }
  // Baqajlı tarif (1 çanta daxil) bagCount=1-də əlavə ödəmir
  const std = g1.offers.find((o) => o.fare.pieces === 1);
  assert.ok(std && std.bagFee === 0);
  assert.throws(() => parseQuery({ from: 'GYD', to: 'IST', depart: future(10), bagCount: '3' }), /Baqaj/);
});

test('tarif ailələri: ümumi adlar (light/standard/flex), seçilə bilən təkliflər', async () => {
  const r = await searchFlights({ from: 'GYD', to: 'IST', depart: future(36), calendar: '0', bagCount: '1' });
  const allowed = ['light', 'standard', 'flex', 'business'];
  for (const g of r.groups) {
    assert.ok(g.families.length >= 1);
    for (const f of g.families) {
      assert.ok(allowed.includes(f.family));
      assert.ok(['fee', 'free'].includes(f.fare.seat));
      assert.ok(['no', 'fee', 'yes'].includes(f.fare.refund) && ['no', 'fee', 'yes'].includes(f.fare.change));
      const o = g.offers.find((x) => x.id === f.offerId);
      assert.ok(o && o.price === f.price && o.fare.family === f.family);
    }
    assert.ok(g.offers.every((o) => allowed.includes(o.fare.family)));
  }
  assert.ok(r.groups.some((g) => g.families.length === 3));
});

// ---------------------------------------------------------------- Aktarma riskləri
test('aktarma riski nişanları: ayrı biletlər, hava limanı dəyişir, qısa, gecə, uzun', async () => {
  const seen = new Set();
  for (const to of ['FRA', 'LHR', 'VIE', 'BKK', 'MLE']) {
    const r = await searchFlights({ from: 'GYD', to, depart: future(45), calendar: '0' });
    for (const g of r.groups) {
      for (const it of [g.outbound, g.inbound].filter(Boolean)) {
        it.layovers.forEach((l, k) => {
          for (const x of l.risks) seen.add(x);
          const next = it.segments[k + 1]; const prev = it.segments[k];
          if (l.risks.includes('airportChange')) {
            assert.ok(l.toAirport && l.toAirport !== l.airport && next.from === l.toAirport);
            assert.strictEqual(getAirport(l.airport).city.en, getAirport(l.toAirport).city.en);
            assert.ok(l.risks.includes('selfTransfer'));
          } else assert.strictEqual(prev.to, next.from);
          if (l.risks.includes('short')) assert.ok(l.minutes < shortLimit(l.airport));
          if (l.risks.includes('long')) assert.ok(l.minutes > 480);
          if (!l.risks.includes('long')) assert.ok(l.minutes <= 480);
        });
      }
      assert.strictEqual(g.selfTransfer, g.risks.includes('selfTransfer'));
    }
  }
  for (const k of ['selfTransfer', 'airportChange', 'short', 'night', 'long']) assert.ok(seen.has(k), `risk nişanı yoxdur: ${k}`);
});

test('filtr: yalnız qorunan aktarmalar', async () => {
  const base = { from: 'GYD', to: 'FRA', depart: future(45), calendar: '0' };
  const all = await searchFlights(base);
  const prot = await searchFlights({ ...base, protected: '1' });
  assert.ok(all.groups.some((g) => g.selfTransfer));
  assert.ok(prot.groups.length > 0 && prot.groups.every((g) => !g.selfTransfer));
  assert.strictEqual(prot.groups.length, all.facets.protected.count);
  assert.strictEqual(all.facets.protected.count + all.facets.protected.selfTransfer, all.groups.length);
});

// ---------------------------------------------------------------- Naxçıvan
test('Naxçıvan marşrutları: qiymət göstərilmir, cədvəl və müraciət üçün id qalır', async () => {
  assert.strictEqual(regulatedRoute(['GYD'], ['NAJ']), 'GYD-NAJ');
  assert.strictEqual(regulatedRoute(['NAJ'], ['GNJ']), 'NAJ-GNJ');
  assert.strictEqual(regulatedRoute(['NAJ'], ['IST', 'SAW']), null);
  assert.strictEqual(regulatedRoute(['GYD'], ['GNJ']), null);
  for (const [from, to] of [['GYD', 'NAJ'], ['NAJ', 'GYD'], ['GNJ', 'NAJ'], ['NAJ', 'GNJ']]) {
    const r = await searchFlights({ from, to, depart: future(12), bagCount: '1' });
    assert.ok(r.regulated && r.regulated.priceHidden, `${from}-${to}`);
    assert.strictEqual(r.calendar, undefined);
    assert.ok(!r.stats || r.stats.min === null);
    const json = JSON.stringify(r);
    assert.ok(!/"(price|ticket|bagFee|minPrice)":\d/.test(json), `${from}-${to}: qiymət sızdı`);
    for (const g of r.groups) assert.ok(g.id && g.best.id && g.best.price === null);
  }
  const rt = await searchFlights({ from: 'GYD', to: 'NAJ', trip: 'round', depart: future(12), return: future(15) });
  assert.ok(rt.regulated);
  const cal = await monthCalendar({ from: 'GYD', to: 'NAJ', month: monthAhead(30) });
  assert.ok(cal.regulated && cal.days.every((d) => d.price === null));
  const ex = await explore({ from: 'GYD', depart: future(30) });
  assert.ok(!ex.items.some((x) => x.to === 'NAJ'));
  assert.ok(ex.regulated.some((x) => x.to === 'NAJ' && !('price' in x)));
  const other = await searchFlights({ from: 'NAJ', to: 'IST', depart: future(12), calendar: '0' });
  assert.strictEqual(other.regulated, null);
});

// ---------------------------------------------------------------- Qiymət izləmə (HTTP)
const route = { from: 'GYD', to: 'IST,SAW', trip: 'oneway', depart: future(40), adults: '1' };
const post = (body, headers = {}) => fetch(`${S.base}/api/flights/alerts`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
const get = (id, token) => fetch(`${S.base}/api/flights/alerts/${encodeURIComponent(id)}`, { headers: token ? { 'X-Alert-Token': token } : {} });
const del = (id, token) => fetch(`${S.base}/api/flights/alerts/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });

test('qiymət izləmə: yaratma, validasiya, honeypot, oxuma, silmə və IDOR qoruması', async () => {
  const a = await post({ ...route, email: 'test@example.az', mode: 'drop10', website: '' });
  assert.strictEqual(a.status, 201);
  const A = await a.json();
  assert.match(A.id, /^fa_[A-Za-z0-9_-]{16}$/);
  assert.match(A.token, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(A.alert.initialPrice > 0 && A.alert.hasEmail && !('email' in A.alert) && !('tokenHash' in A.alert));
  const b = await post({ ...route, to: 'DXB', mode: 'daily' });
  assert.strictEqual(b.status, 201);
  const B = await b.json();
  assert.strictEqual(B.alert.hasEmail, false);

  // Validasiya
  const bad = async (body, field) => {
    const r = await post(body);
    assert.strictEqual(r.status, 400, JSON.stringify(body));
    const j = await r.json();
    assert.ok(j.fields[field], `${field}: ${JSON.stringify(j)}`);
  };
  await bad({ ...route, email: 'yanlış@', mode: 'daily' }, 'email');
  await bad({ ...route, depart: '2020-01-01', mode: 'daily' }, 'route');
  await bad({ ...route, to: 'NAJ', mode: 'daily' }, 'route');
  await bad({ ...route, mode: 'hourly' }, 'mode');
  await bad({ ...route, from: { $ne: 1 }, mode: 'daily' }, 'route');

  // Honeypot: bot uğurlu cavab alır, amma heç nə saxlanılmır
  const hp = await post({ ...route, mode: 'daily', website: 'http://spam.example' });
  assert.strictEqual(hp.status, 201);
  assert.ok(!(await hp.json()).id);

  // Oxuma: yalnız öz tokeni ilə; e-poçt geri qaytarılmır
  const ok = await get(A.id, A.token);
  assert.strictEqual(ok.status, 200);
  const view = await ok.json();
  assert.strictEqual(view.initialPrice, A.alert.initialPrice);
  assert.strictEqual(view.changePct, 0); // deterministik demo qiymət
  assert.ok(!JSON.stringify(view).includes('test@example.az'));
  assert.strictEqual((await get(A.id)).status, 404);
  assert.strictEqual((await get(A.id, B.token)).status, 404);
  assert.strictEqual((await get('fa_xxxxxxxxxxxxxxxx', A.token)).status, 404);

  // IDOR: B-nin tokeni ilə A silinmir
  assert.strictEqual((await del(A.id, B.token)).status, 404);
  assert.strictEqual((await del(A.id, 'x'.repeat(43))).status, 404);
  assert.strictEqual((await get(A.id, A.token)).status, 200);
  // DELETE JSON tələb edir (CSRF formalarına qarşı)
  const form = await fetch(`${S.base}/api/flights/alerts/${A.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'token=' + A.token });
  assert.strictEqual(form.status, 415);
  // Öz tokeni ilə silinir
  assert.strictEqual((await del(A.id, A.token)).status, 200);
  assert.strictEqual((await get(A.id, A.token)).status, 404);
  assert.strictEqual((await del(A.id, A.token)).status, 404);
  assert.strictEqual((await get(B.id, B.token)).status, 200);

  // Fayl: token açıq saxlanılmır
  const file = fs.readFileSync(path.join(process.env.TURTAP_DATA_DIR, 'flight-alerts.json'), 'utf8');
  assert.ok(!file.includes(B.token) && file.includes(B.id));
});

test('qiymət izləmə: IP limiti, tarix keçəndə avtomatik silinir, bildiriş stub-dur', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-fp1-store-'));
  try {
    const store = createAlertStore(dir);
    const made = [];
    for (let i = 0; i < MAX_PER_IP; i++) made.push(await store.create({ ...route, depart: future(10 + i), mode: 'daily' }, { ip: '10.0.0.1' }));
    await assert.rejects(store.create({ ...route, mode: 'daily' }, { ip: '10.0.0.1' }), /ən çox/);
    await store.create({ ...route, mode: 'daily' }, { ip: '10.0.0.2' }); // başqa IP
    assert.strictEqual(store.count(), MAX_PER_IP + 1);
    // Faylda IP açıq saxlanılmır
    assert.ok(!fs.readFileSync(store.file, 'utf8').includes('10.0.0.1'));
    // 15 gün sonra: gediş tarixi keçmiş izləmələr silinir
    const removed = store.purge(future(15));
    assert.strictEqual(removed, 5);
    assert.strictEqual(store.find(made[0].alert.id, made[0].token), null);
    // Yenidən yükləmə (fayldan) — atomik yazılmış vəziyyət
    store._reset();
    assert.strictEqual(store.count(), MAX_PER_IP + 1 - 5);
    const res = await store.runCheck();
    assert.ok(res.every((x) => x.sent === false));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ---------------------------------------------------------------- HTTP: təqvim və explore
test('HTTP: /api/flights/calendar və /api/flights/explore', async () => {
  const c = await fetch(`${S.base}/api/flights/calendar?from=GYD&to=TBS&month=${monthAhead(30)}&currency=USD`);
  assert.strictEqual(c.status, 200);
  const cj = await c.json();
  assert.strictEqual(cj.currency, 'USD');
  assert.ok(cj.days.length >= 28);
  assert.strictEqual((await fetch(`${S.base}/api/flights/calendar?from=GYD&to=TBS&month=xx`)).status, 400);
  const e = await fetch(`${S.base}/api/flights/explore?from=GYD&month=${monthAhead(30)}&budget=300&lang=en`);
  assert.strictEqual(e.status, 200);
  const ej = await e.json();
  assert.ok(ej.items.every((x) => x.price <= 300));
  assert.strictEqual(ej.fromAirport.city, 'Baku');
  assert.strictEqual((await fetch(`${S.base}/api/flights/explore?from=ZZZ`)).status, 400);
});
