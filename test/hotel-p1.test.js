// Otel/tur P1: reytinq sözü + rəy sayı, məsafə/çimərlik xətti filtrləri və sıralama,
// otel detal endpoint-i (GET /api/hotels/:id/offers) validasiyası, "Necə işləyirik" səhifəsinin CSP uyğunluğu.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { search, ratingWord, hotelOffers, parseQuery } = require('../src/search');
const { hotels, keyDistance, hotelRules } = require('../src/data/catalog');
const app = require('../server');
const { startServer, future } = require('./_helpers');

const PUB = path.join(__dirname, '..', 'public');
const base = { q: 'Antalya', destinationId: 'antalya', type: 'hotel', checkIn: future(45), nights: '7', adults: '2' };

test('reytinq sözü: 9+ Möhtəşəm, 8.5+ Əla, 8+ Çox yaxşı, 7+ Yaxşı; həddən aşağı / reytinqsiz → null', () => {
  assert.strictEqual(ratingWord(9.7), 'superb');
  assert.strictEqual(ratingWord(9), 'superb');
  assert.strictEqual(ratingWord(8.9), 'excellent');
  assert.strictEqual(ratingWord(8.5), 'excellent');
  assert.strictEqual(ratingWord(8.4), 'very_good');
  assert.strictEqual(ratingWord(8), 'very_good');
  assert.strictEqual(ratingWord(7.9), 'good');
  assert.strictEqual(ratingWord(7), 'good');
  assert.strictEqual(ratingWord(6.9), null);
  assert.strictEqual(ratingWord(null), null);
  assert.strictEqual(ratingWord(undefined), null);
  // UI mətnləri 3 dildə mövcuddur
  const ctx = vm.createContext({ localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(PUB, 'js', 'common.js'), 'utf8') + ';this.I18N=I18N;this.ratingText=ratingText;this.locationText=locationText;', ctx);
  for (const l of ['az', 'en', 'ru']) for (const k of ['superb', 'excellent', 'very_good', 'good']) assert.ok(ctx.I18N[l]['rw_' + k], `${l}.rw_${k}`);
  assert.strictEqual(ctx.I18N.az.rw_superb, 'Möhtəşəm');
  assert.strictEqual(ctx.ratingText({ rating: 9.2, ratingWord: 'superb', reviewCount: 1240 }), 'Möhtəşəm 9.2 · 1 240 rəy');
  assert.strictEqual(ctx.locationText({ kind: 'beach', line: 1, seaM: 120 }), '1-ci xətt · dənizə 120 m');
  assert.strictEqual(ctx.locationText({ kind: 'city', centerM: 2400 }), 'mərkəzə 2.4 km');
});

test('kataloq: rəy sayı və məkan deterministikdir; dəniz → xətt + dənizə, dağ → kanat, şəhər → mərkəz', () => {
  const again = JSON.parse(JSON.stringify(require('../src/data/catalog').hotels));
  assert.deepStrictEqual(again.map((h) => [h.reviewCount, h.location]), hotels.map((h) => [h.reviewCount, h.location]));
  for (const h of hotels) {
    assert.ok(Number.isInteger(h.reviewCount) && h.reviewCount > 0);
    const loc = h.location;
    if (loc.kind === 'beach') {
      assert.ok([1, 2, 3].includes(loc.line) && loc.seaM > 0);
      if (loc.line === 1) assert.ok(loc.seaM < 200); else assert.ok(loc.seaM >= 200);
      if (h.tags.includes('Öz çimərliyi')) assert.strictEqual(loc.line, 1);
    } else if (loc.kind === 'mountain') assert.ok(loc.liftM > 0 && loc.line === null);
    else assert.ok(loc.centerM > 0 && loc.line === null);
    assert.strictEqual(keyDistance(loc), loc.kind === 'beach' ? loc.seaM : loc.kind === 'mountain' ? loc.liftM : loc.centerM);
  }
  assert.strictEqual(hotels.find((h) => h.destinationId === 'antalya').location.kind, 'beach');
  assert.strictEqual(hotels.find((h) => h.destinationId === 'shahdag').location.kind, 'mountain');
  assert.strictEqual(hotels.find((h) => h.destinationId === 'istanbul').location.kind, 'city');
  const r = hotelRules(hotels[0]);
  assert.ok(/^\d\d:\d\d$/.test(r.checkIn) && /^\d\d:\d\d$/.test(r.checkOut) && r.demo === true);
  const ao = hotels.find((h) => h.attrs.includes('adultsOnly'));
  assert.strictEqual(hotelRules(ao).children, 'adults_only');
});

test('axtarış cavabı: qrupda reytinq sözü, rəy sayı və məkan var', async () => {
  const r = await search(base);
  assert.ok(r.groups.length > 0);
  for (const g of r.groups) {
    assert.strictEqual(g.ratingWord, ratingWord(g.rating));
    assert.ok(g.reviewCount > 0);
    assert.strictEqual(g.location.kind, 'beach');
  }
});

test('reytinq filtri (8+ / 9+) və "reytinq" sıralaması (bal → rəy sayı → qiymət)', async () => {
  const all = await search(base);
  const r8 = await search({ ...base, minRating: '8' });
  const r9 = await search({ ...base, minRating: '9' });
  assert.ok(r8.groups.every((g) => g.rating >= 8));
  assert.ok(r9.groups.every((g) => g.rating >= 9));
  assert.strictEqual(r8.groups.length, all.groups.filter((g) => g.rating >= 8).length);
  assert.ok(r9.groups.length <= r8.groups.length);
  // yanlış dəyər nəzərə alınmır
  assert.strictEqual(parseQuery({ ...base, minRating: 'abc' }).minRating, null);
  assert.strictEqual(parseQuery({ ...base, minRating: '11' }).minRating, null);
  assert.strictEqual(parseQuery({ ...base, minRating: '8.5' }).minRating, 8.5);
  const byRating = await search({ ...base, sort: 'rating' });
  for (let i = 1; i < byRating.groups.length; i++) {
    const a = byRating.groups[i - 1]; const b = byRating.groups[i];
    assert.ok(a.rating > b.rating || (a.rating === b.rating && a.reviewCount >= b.reviewCount));
  }
});

test('çimərlik xətti və maks. məsafə filtrləri, "ən yaxın" sıralaması', async () => {
  const all = await search(base);
  const l1 = await search({ ...base, beachLines: '1' });
  assert.ok(l1.groups.length > 0 && l1.groups.every((g) => g.location.line === 1));
  const l23 = await search({ ...base, beachLines: '2,3' });
  assert.ok(l23.groups.every((g) => g.location.line >= 2));
  assert.strictEqual(l1.groups.length + l23.groups.length, all.groups.length);
  const near = await search({ ...base, maxDist: '200' });
  assert.ok(near.groups.every((g) => g.location.seaM <= 200));
  // şəhər istiqamətində xətt filtri bütün otelləri gizlədir (xətt yalnız dəniz otellərinə aiddir) və boş nəticə səbəbi göstərilir
  const city = await search({ q: 'İstanbul', destinationId: 'istanbul', type: 'hotel', checkIn: future(45), nights: '3', adults: '2', beachLines: '1' });
  assert.strictEqual(city.groups.length, 0);
  assert.strictEqual(city.empty.reason, 'filters');
  assert.ok(city.empty.relax.some((x) => x.key === 'beachLines'));
  // şəhərdə maks. məsafə = mərkəzə
  const cityNear = await search({ q: 'İstanbul', destinationId: 'istanbul', type: 'hotel', checkIn: future(45), nights: '3', adults: '2', maxDist: '3000' });
  assert.ok(cityNear.groups.every((g) => g.location.centerM <= 3000));
  // sıralama: dənizə ən yaxın əvvəl
  const sorted = await search({ ...base, sort: 'distance' });
  for (let i = 1; i < sorted.groups.length; i++) assert.ok(keyDistance(sorted.groups[i - 1].location) <= keyDistance(sorted.groups[i].location));
  // validasiya: yanlış dəyərlər atılır
  const pq = parseQuery({ ...base, beachLines: '1,9,x,2,2', maxDist: '-5', sort: 'evil' });
  assert.deepStrictEqual(pq.beachLines, [1, 2]);
  assert.strictEqual(pq.maxDist, null);
  assert.strictEqual(pq.sort, 'price');
  assert.strictEqual(parseQuery({ ...base, maxDist: '1e9' }).maxDist, null);
});

test('hotelOffers: otaq × qidalanma × operator, ucuzdan bahalıya, unikal; filtrlər tətbiq edilmir', async () => {
  const id = 'antalya-h4';
  const r = await hotelOffers(id, { type: 'package', checkIn: future(45), nights: '7', adults: '2', maxPrice: '1', stars: '3' });
  assert.strictEqual(r.hotel.id, id);
  assert.strictEqual(r.hotel.priceFactor, undefined);
  assert.ok(r.hotel.rules && r.hotel.location && r.hotel.reviewCount > 0);
  assert.ok(r.rows.length > 1);
  const keys = r.rows.map((o) => `${o.room}|${o.board}|${o.providerId}`);
  assert.strictEqual(new Set(keys).size, keys.length);
  for (let i = 1; i < r.rows.length; i++) assert.ok(r.rows[i - 1].price <= r.rows[i].price);
  assert.ok(r.rows.every((o) => o.itemId === id && o.includesFlight));
  assert.strictEqual(r.stats.min, r.rows[0].price);
  // ən ucuz sətir = axtarış kartındakı ən ucuz qiymət
  const s = await search({ q: 'Antalya', destinationId: 'antalya', type: 'package', checkIn: future(45), nights: '7', adults: '2', hotels: id });
  assert.strictEqual(s.groups[0].best.price, r.rows[0].price);
  // daxili istiqamətdə paket → avtomatik "yalnız otel"
  const dom = await hotelOffers('qabala-h1', { type: 'package', checkIn: future(45), nights: '2', adults: '2' });
  assert.strictEqual(dom.query.type, 'hotel');
  assert.ok(dom.rows.length > 0);
  // yoxdur → null, yanlış format / tur → QueryError
  assert.strictEqual(await hotelOffers('antalya-h99', { checkIn: future(45) }), null);
  await assert.rejects(() => hotelOffers('../etc', { checkIn: future(45) }), /id/);
  await assert.rejects(() => hotelOffers('antalya-h1', { type: 'tour', checkIn: future(45) }));
});

test('GET /api/hotels/:id/offers — validasiya, 404, 400 və uğurlu cavab', async () => {
  const s = await startServer(app);
  try {
    const qs = `checkIn=${future(45)}&nights=7&adults=2&type=hotel&currency=USD`;
    const ok = await fetch(`${s.base}/api/hotels/antalya-h2/offers?${qs}`);
    assert.strictEqual(ok.status, 200);
    assert.match(ok.headers.get('cache-control') || '', /no-store/);
    assert.ok(ok.headers.get('ratelimit-limit'));
    const body = await ok.json();
    assert.strictEqual(body.hotel.id, 'antalya-h2');
    assert.ok(body.rows.length > 0 && body.rows.every((o) => o.currency === 'USD'));
    // mövcud olmayan otel
    const nf = await fetch(`${s.base}/api/hotels/antalya-h99/offers?${qs}`);
    assert.strictEqual(nf.status, 404);
    // yanlış id formatı (böyük hərf, simvollar, çox uzun)
    for (const bad of ['ANTALYA-H1', 'a%3Cscript%3E', 'x'.repeat(41), 'a.b']) {
      const r = await fetch(`${s.base}/api/hotels/${bad}/offers?${qs}`);
      assert.strictEqual(r.status, 400, bad);
      const j = await r.json();
      assert.ok(j.error && !/stack|at /.test(j.error));
    }
    // yanlış tarix, tur növü, həddən böyük aralıq
    assert.strictEqual((await fetch(`${s.base}/api/hotels/antalya-h2/offers?checkIn=2026-13-40`)).status, 400);
    assert.strictEqual((await fetch(`${s.base}/api/hotels/antalya-h2/offers?type=tour&checkIn=${future(45)}`)).status, 400);
    assert.strictEqual((await fetch(`${s.base}/api/hotels/antalya-h2/offers?checkIn=${future(10)}&checkInTo=${future(40)}`)).status, 400);
    // prototype pollution / massiv parametrləri sadə string kimi qəbul olunur, server çökmür
    const pp = await fetch(`${s.base}/api/hotels/antalya-h2/offers?${qs}&__proto__[x]=1&adults[]=3`);
    assert.strictEqual(pp.status, 200);
    // yalnız GET
    const post = await fetch(`${s.base}/api/hotels/antalya-h2/offers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.strictEqual(post.status, 404);
  } finally { await s.close(); }
});

test('how.html: CSP uyğun (inline script/handler/style bloku yox), i18n açarları 3 dildə, header və footer linki', async () => {
  const html = fs.readFileSync(path.join(PUB, 'how.html'), 'utf8');
  assert.ok(!/<style[\s>]/i.test(html), '<style> bloku olmamalıdır');
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'inline hadisə atributu olmamalıdır');
  assert.ok(!/javascript:/i.test(html));
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length >= 2);
  for (const [, attrs, body] of scripts) {
    assert.match(attrs, /src="\/js\/[a-z-]+\.js"/);
    assert.strictEqual(body.trim(), '', 'inline script olmamalıdır');
  }
  for (const [, href] of html.matchAll(/<link[^>]+href="([^"]+)"/gi)) assert.ok(href.startsWith('/'), href);
  assert.ok(fs.existsSync(path.join(PUB, 'js', 'how.js')));
  // bütün data-i18n açarları AZ/EN/RU-da var
  const ctx = vm.createContext({ localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {} } });
  vm.runInContext(fs.readFileSync(path.join(PUB, 'js', 'common.js'), 'utf8') + ';this.I18N=I18N;', ctx);
  const keys = [...html.matchAll(/data-i18n="([a-z0-9_]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 20);
  for (const k of keys) for (const l of ['az', 'en', 'ru']) assert.ok(ctx.I18N[l][k], `${l}.${k}`);
  // məzmun: biz satmırıq, saxta qıtlıq yox, reklam nişanı, demo, məxfilik (ödəniş məlumatı toplamırıq)
  const az = ctx.I18N.az;
  assert.match(az.how_s1_d, /satmırıq/);
  assert.match(az.how_s6_d, /Son 1 otaq/);
  assert.match(az.how_s5_d, /Reklam/);
  assert.match(az.how_s8_d, /kart məlumatı toplamırıq/);
  // header digər səhifələrlə eyni əsas linklər; index.html footer-də "Necə işləyirik" linki
  for (const href of ['/', '/flights.html', '/cars.html', '/b2b']) assert.ok(html.includes(`href="${href}"`), href);
  const index = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  assert.match(index.split('<footer')[1], /href="\/how\.html"/);
  // server CSP başlığı ilə verilir
  const s = await startServer(app);
  try {
    const r = await fetch(`${s.base}/how.html`);
    assert.strictEqual(r.status, 200);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  } finally { await s.close(); }
});
