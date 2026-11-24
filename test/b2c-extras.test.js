// B2C əlavələri: qiymət təqvimi (GET /api/tours/calendar) validasiyası/nəticəsi/keşi/performansı,
// dəstək əlaqəsi (config.support null → gizli), extras.js (seçilmişlər, son baxılanlar, rəy xülasəsi, i18n),
// index.html-də yeni elementlər və CSP uyğunluğu.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('../src/config');
const { calendar, _calCache } = require('../src/search');
const { publicSupport } = require('../src/support');
const app = require('../server');
const { startServer, future } = require('./_helpers');

const PUB = path.join(__dirname, '..', 'public');

function loadExtras(storeData = {}) {
  const mem = { ...storeData };
  const events = [];
  const ctx = vm.createContext({
    localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } },
    document: { addEventListener() {}, dispatchEvent: (e) => events.push(e.type) },
    Event: class { constructor(type) { this.type = type; } },
    location: { origin: 'http://localhost', href: 'http://localhost/' },
    URL, URLSearchParams,
  });
  const src = fs.readFileSync(path.join(PUB, 'js', 'common.js'), 'utf8') + '\n' + fs.readFileSync(path.join(PUB, 'js', 'extras.js'), 'utf8')
    + ';this.I18N=I18N;this.setLang=(l)=>{LANG=l;};';
  vm.runInContext(src, ctx);
  return { ctx, mem, events };
}

test('təqvim: ±7 gün, hər gün ən ucuz qiymət, ən ucuz günlər işarələnir, deterministik və < 500ms', async () => {
  _calCache.clear();
  const center = future(40);
  const t0 = Date.now();
  const r = await calendar({ destinationId: 'antalya', checkIn: center, nights: '7', adults: '2' });
  assert.ok(Date.now() - t0 < 500, `təqvim ${Date.now() - t0}ms`);
  assert.strictEqual(r.days.length, 15);
  assert.strictEqual(r.query.from, future(33));
  assert.strictEqual(r.query.to, future(47));
  assert.strictEqual(r.query.type, 'package');
  assert.strictEqual(r.query.nights, 7);
  const priced = r.days.filter((d) => d.price != null);
  assert.ok(priced.length >= 10);
  assert.strictEqual(r.min, Math.min(...priced.map((d) => d.price)));
  const cheap = r.days.filter((d) => d.cheapest);
  assert.ok(cheap.length >= 1 && cheap.length <= 3);
  assert.ok(cheap.some((d) => d.price === r.min));
  for (const d of cheap) assert.ok(d.price <= r.min * 1.05);
  for (const d of priced) assert.ok(['low', 'mid', 'high'].includes(d.level) && d.providerName && d.offers > 0);
  // Gün qiyməti = həmin gün üçün adi axtarışın ən ucuz qiyməti (eyni məntiq)
  const { search } = require('../src/search');
  const one = await search({ destinationId: 'antalya', q: 'Antalya', type: 'package', checkIn: priced[0].date, checkInTo: priced[0].date, nights: '7', adults: '2', noStopSale: '1' });
  assert.strictEqual(one.stats.min, priced[0].price);
  // keş: ikinci sorğu keşdən, eyni nəticə
  const again = await calendar({ destinationId: 'antalya', checkIn: center, nights: '7', adults: '2' });
  assert.strictEqual(again.cached, true);
  assert.deepStrictEqual(again.days, r.days);
});

test('təqvim: ay rejimi, keçmiş günlər atılır, daxili istiqamətdə paket → otel, valyuta', async () => {
  const center = future(60);
  const m = await calendar({ destinationId: 'dubai', checkIn: center, nights: '5', mode: 'month', currency: 'USD' });
  const c = new Date(center + 'T00:00:00Z');
  const days = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 0)).getUTCDate();
  assert.strictEqual(m.days.length, days);
  assert.strictEqual(m.days[0].date.slice(8), '01');
  assert.strictEqual(m.query.currency, 'USD');
  // Bu gündən 2 gün sonra ±7 → keçmiş günlər yoxdur
  const near = await calendar({ destinationId: 'antalya', checkIn: future(2), nights: '7' });
  assert.strictEqual(near.days[0].date, future(0));
  const dom = await calendar({ destinationId: 'qabala', checkIn: future(20), nights: '3', type: 'package' });
  assert.strictEqual(dom.query.type, 'hotel');
  assert.ok(dom.days.some((d) => d.price != null));
  // q mətni ilə istiqamət
  const byQ = await calendar({ q: 'Antalya', checkIn: future(30), nights: '7' });
  assert.strictEqual(byQ.query.destinationId, 'antalya');
});

test('HTTP /api/tours/calendar: validasiya (400) və nəticə (200)', async () => {
  const s = await startServer(app);
  try {
    const get = (qs) => fetch(`${s.base}/api/tours/calendar?${new URLSearchParams(qs)}`);
    const ok = await get({ destinationId: 'antalya', checkIn: future(30), nights: '7', adults: '2' });
    assert.strictEqual(ok.status, 200);
    const body = await ok.json();
    assert.strictEqual(body.days.length, 15);
    assert.strictEqual(body.note, 'DEMO');
    assert.ok(ok.headers.get('content-security-policy'));
    const bad = [
      { destinationId: 'antalya' }, // checkIn yoxdur
      { destinationId: 'antalya', checkIn: '2026-13-40' },
      { destinationId: 'antalya', checkIn: 'abc' },
      { destinationId: 'antalya', checkIn: future(30), type: 'tour' },
      { destinationId: 'antalya', checkIn: future(30), span: '9' },
      { destinationId: 'antalya', checkIn: future(30), span: '0' },
      { destinationId: 'antalya', checkIn: future(30), mode: 'year' },
      { destinationId: 'antalya', checkIn: future(30), nights: 'x' },
      { destinationId: 'atlantis', checkIn: future(30) },
      { destinationId: '../etc', checkIn: future(30) },
      { q: 'zzzz-yoxdur', checkIn: future(30) },
      { checkIn: future(30) }, // istiqamət yoxdur
      { destinationId: 'antalya', checkIn: future(800) },
      { destinationId: 'antalya', checkIn: '2020-01-01', span: '3' }, // pəncərə keçmişdə
    ];
    for (const qs of bad) {
      const r = await get(qs);
      assert.strictEqual(r.status, 400, JSON.stringify(qs));
      assert.ok((await r.json()).error);
    }
    // massiv/iç-içə parametrlər sadə string kimi oxunur, server çökmür
    const weird = await fetch(`${s.base}/api/tours/calendar?destinationId[a]=1&checkIn=${future(30)}`);
    assert.strictEqual(weird.status, 400);
  } finally { await s.close(); }
});

test('dəstək: config.support default null → /api/config-də null; yalnız düzgün nömrə qəbul olunur', async () => {
  assert.deepStrictEqual(config.support, { phone: null, whatsapp: null });
  assert.deepStrictEqual(publicSupport(config.support), { phone: null, whatsapp: null });
  assert.deepStrictEqual(publicSupport(undefined), { phone: null, whatsapp: null });
  assert.deepStrictEqual(publicSupport({ phone: '+994 50 123 45 67', whatsapp: '994501234567' }), { phone: '+994501234567', whatsapp: '994501234567' });
  assert.deepStrictEqual(publicSupport({ phone: 'javascript:alert(1)', whatsapp: '12' }), { phone: null, whatsapp: null });
  assert.deepStrictEqual(publicSupport({ phone: 123, whatsapp: { x: 1 } }), { phone: null, whatsapp: null });
  const s = await startServer(app);
  try {
    const cfg = await (await fetch(`${s.base}/api/config`)).json();
    assert.deepStrictEqual(cfg.support, { phone: null, whatsapp: null });
  } finally { await s.close(); }
  // UI: nömrə null olanda WhatsApp/telefon linki render olunmur (şərt kodda), zəng forması həmişə var
  const src = fs.readFileSync(path.join(PUB, 'js', 'extras.js'), 'utf8');
  assert.ok(/wa \|\| tel \?/.test(src) && src.includes("callbackFormHtml('helpCbForm')"));
  assert.ok(src.includes('https://wa.me/'));
});

test('extras.js: seçilmişlər/son baxılanlar yalnız id + qısa meta, təmizlənir, limitlər; i18n 3 dildə', () => {
  const { ctx, mem, events } = loadExtras({ odiola_favs: JSON.stringify([{ id: 'BAD ID<script>', name: 'x' }, { id: 'antalya-h1', name: 'A', stars: 9, p: { type: 'tour', checkIn: 'x', adults: 99 }, phone: '+99450' }]) });
  const X = ctx.Odx;
  assert.ok(X && X.favs && X.compare && X.recent);
  const list = X.favs.list();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].id, 'antalya-h1');
  assert.strictEqual(list[0].stars, 5);
  assert.strictEqual(list[0].p.type, 'hotel');
  assert.strictEqual(list[0].p.checkIn, '');
  assert.strictEqual(list[0].p.adults, 8);
  assert.ok(!('phone' in list[0]));
  // toggle
  const meta = { id: 'dubai-h2', name: 'Dubai Hotel', stars: 4, destId: 'dubai', destName: 'Dubay', price: 1500, cur: 'AZN', p: { type: 'package', checkIn: future(20), nights: 7, nightsTo: 7, adults: 2, childAges: '5' } };
  assert.strictEqual(X.favs.toggle(meta), true);
  assert.ok(X.favs.has('dubai-h2'));
  assert.ok(events.includes('favchange'));
  assert.strictEqual(X.favs.toggle(meta), false);
  assert.ok(!X.favs.has('dubai-h2'));
  // son baxılanlar: maks. 8, ən sonuncu birinci, təkrarsız
  for (let i = 0; i < 12; i++) X.recent.add({ ...meta, id: `h-${i}` });
  X.recent.add({ ...meta, id: 'h-3' });
  const rec = X.recent.list();
  assert.strictEqual(rec.length, 8);
  assert.strictEqual(rec[0].id, 'h-3');
  assert.strictEqual(new Set(rec.map((x) => x.id)).size, 8);
  assert.ok(!/phone|name"\s*:\s*"[^"]*@/.test(mem.odiola_recent));
  // yenidən açma linki: gələcək tarix saxlanılır, keçmiş tarix atılır
  const l1 = X.hotelLink(X.cleanItem(meta));
  assert.ok(l1.href.startsWith('/?') && l1.href.includes('hotel=dubai-h2') && l1.href.includes('checkIn=' + future(20)) && l1.href.includes('childAges=5'));
  assert.strictEqual(l1.past, false);
  const l2 = X.hotelLink(X.cleanItem({ ...meta, p: { ...meta.p, checkIn: '2020-01-01' } }));
  assert.strictEqual(l2.past, true);
  assert.ok(!l2.href.includes('checkIn='));
  // müqayisə: maks. 3
  ctx.toast = () => {};
  for (const id of ['a', 'b', 'c', 'd']) X.compare.toggle({ id });
  assert.strictEqual(X.compare.list().length, X.CMP_MAX);
  // i18n: yeni açarlar 3 dildə
  const keys = Object.keys(ctx.I18N.az).filter((k) => /^(fav_|cmp_|recent_|cal_|rv_|help_|share)/.test(k));
  assert.ok(keys.length > 40);
  for (const l of ['en', 'ru']) for (const k of keys) assert.ok(ctx.I18N[l][k], `${l}.${k}`);
});

test('rəy xülasəsi: 5 kateqoriya, deterministik, 5–10 arası, DEMO, rəy mətni yoxdur', () => {
  const { ctx } = loadExtras();
  const X = ctx.Odx;
  const { hotels } = require('../src/data/catalog');
  for (const h of hotels.slice(0, 40)) {
    const a = X.reviewSummary(h);
    const b = X.reviewSummary(JSON.parse(JSON.stringify(h)));
    assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
    assert.strictEqual(a.cats.map((c) => c.key).join(','), 'clean,food,service,location,value');
    for (const c of a.cats) assert.ok(c.score >= 5 && c.score <= 10 && Math.abs(c.score - h.rating) <= 1.01);
    assert.ok(a.likes.every((k) => a.cats.find((c) => c.key === k).score >= 8.5));
    assert.strictEqual(a.demo, true);
  }
  assert.strictEqual(X.reviewSummary({ id: 'x' }), null);
  const html = X.reviewSummaryHtml(hotels[0]);
  assert.ok(html.includes('demo-tag') && html.includes('role="meter"'));
  assert.ok(!/<script|on\w+=/i.test(html));
});

test('index.html: yeni elementlər, extras.js app.js-dən əvvəl, inline script/handler yoxdur', () => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  for (const id of ['favLink', 'recentSection', 'recentGrid', 'calWrap', 'shareBtn', 'xModal', 'cmpBar', 'helpFab', 'helpPanel']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.indexOf('/js/extras.js') > html.indexOf('/js/common.js'));
  assert.ok(html.indexOf('/js/extras.js') < html.indexOf('/js/app.js'));
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), 'inline <script> yoxdur');
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'inline handler yoxdur');
  assert.ok(!/<style/i.test(html), '<style> bloku yoxdur');
  const js = fs.readFileSync(path.join(PUB, 'js', 'extras.js'), 'utf8');
  assert.ok(!/\son[a-z]+=["']/i.test(js) && !/eval\(|new Function/.test(js));
  assert.ok(js.includes('safeUrl(') && js.includes('esc('));
});
