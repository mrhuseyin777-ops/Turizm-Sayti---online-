// Genişləndirilmiş tur axtarışı: tarix/gecə aralığı + limitlər, rayonlar, otel multi-select, otel atributları,
// otaq/yerləşmə, qiymət növü, uçuş/yer statusu, stop-sale filtrləri, boş nəticə diaqnostikası, operator məzənnəsi.
const test = require('node:test');
const assert = require('node:assert');
const { search, parseQuery } = require('../src/search');
const { destinations, hotels, tours } = require('../src/data/catalog');
const { accommodation } = require('../src/pricing');
const { createSelection } = require('../src/leads');
const config = require('../src/config');
const app = require('../server');
const { startServer, future } = require('./_helpers');

test('parseQuery: tarix aralığı (checkIn…checkInTo) və gecə aralığı', () => {
  const q = parseQuery({ q: 'Antalya', checkIn: future(40), checkInTo: future(47), nights: 6, nightsTo: 8 });
  assert.strictEqual(q.dateFrom.toISOString().slice(0, 10), future(40));
  assert.strictEqual(q.dateTo.toISOString().slice(0, 10), future(47));
  assert.strictEqual(q.flex, 0);
  assert.deepStrictEqual([q.nightsFrom, q.nightsTo], [6, 8]);
  // köhnə ±gün qısa yolu işləyir
  const legacy = parseQuery({ q: 'Antalya', checkIn: future(40), flex: 2, nights: 7 });
  assert.strictEqual(legacy.dateFrom.toISOString().slice(0, 10), future(38));
  assert.strictEqual(legacy.dateTo.toISOString().slice(0, 10), future(42));
  assert.deepStrictEqual([legacy.nightsFrom, legacy.nightsTo], [7, 7]);
});

test('parseQuery: aralıq validasiyası və DoS limitləri (400)', () => {
  const L = config.searchLimits;
  const bad = [
    { checkIn: future(40), checkInTo: future(39) }, // -dək < -dan
    { checkIn: future(40), checkInTo: future(40 + L.maxDateRangeDays + 1) }, // > 14 gün
    { checkIn: future(40), checkInTo: '2027-02-30' }, // mövcud olmayan tarix
    { checkIn: future(40), nights: 8, nightsTo: 6 }, // gecə -dək < -dan
    { checkIn: future(40), nights: 3, nightsTo: 3 + L.maxNightsSpan + 1 }, // gecə aralığı çox geniş
    { checkIn: future(40), nights: 7, nightsTo: 'x' },
    { checkIn: future(40), checkInTo: future(54), nights: 5, nightsTo: 9 }, // 15 × 5 = 75 > 60 kombinasiya
    { checkIn: future(L.maxDaysAhead + 5) }, // çox uzaq tarix
  ];
  for (const b of bad) assert.throws(() => parseQuery({ q: 'Antalya', ...b }), (e) => e.name === 'Error' && e.message.length > 0, JSON.stringify(b));
  // limitin içində: 15 tarix × 4 gecə = 60
  assert.doesNotThrow(() => parseQuery({ q: 'Antalya', checkIn: future(40), checkInTo: future(54), nights: 5, nightsTo: 8 }));
});

test('aralıqlı axtarış: bütün təkliflər tarix/gecə aralığında, bir neçə tarix və gecə variantı var', async () => {
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(40), checkInTo: future(47), nights: 6, nightsTo: 8, adults: 2, flat: '1' });
  assert.ok(r.offers.length > 0);
  const dates = new Set(r.offers.map((o) => o.checkIn));
  const nights = new Set(r.offers.map((o) => o.nights));
  assert.ok(r.offers.every((o) => o.checkIn >= future(40) && o.checkIn <= future(47)));
  assert.ok([...nights].every((n) => n >= 6 && n <= 8));
  assert.ok(dates.size >= 5, 'bir neçə gediş tarixi');
  assert.deepStrictEqual([...nights].sort(), [6, 7, 8]);
  assert.strictEqual(r.query.checkInTo, future(47));
  assert.strictEqual(r.query.nightsTo, 8);
  for (let i = 1; i < r.offers.length; i++) assert.ok(r.offers[i - 1].price <= r.offers[i].price);
});

test('performans: Antalya 14 günlük aralıq × 3 gecə (keşsiz) < 500ms, nəticə sayı limitlidir', async () => {
  for (const type of ['package', 'hotel']) {
    const t0 = Date.now();
    const r = await search({ q: 'Antalya', type, checkIn: future(30), checkInTo: future(44), nights: 6, nightsTo: 8, adults: 2, childAges: '7', flat: '1', refresh: '1' });
    const ms = Date.now() - t0;
    assert.ok(ms < 500, `${type}: ${ms}ms`);
    assert.ok(r.offers.length <= config.searchLimits.maxFlatOffers);
    assert.ok(r.stats.count > r.offers.length || r.offers.length < config.searchLimits.maxFlatOffers);
  }
  const lim = await search({ q: 'Antalya', type: 'hotel', checkIn: future(30), checkInTo: future(36), nights: 7, flat: '1', limit: '50' });
  assert.strictEqual(lim.offers.length, 50);
  assert.strictEqual(lim.offersTruncated, true);
});

test('kataloq: kurort rayonları və hər otelin rayonu', () => {
  const alanya = destinations.find((d) => d.id === 'alanya');
  assert.deepStrictEqual(alanya.districts.map((x) => x.name), ['Avsallar', 'Konaklı', 'Mahmutlar', 'İncekum', 'Okurcalar', 'Kestel', 'Mərkəz']);
  const names = (id) => destinations.find((d) => d.id === id).districts.map((x) => x.name);
  assert.deepStrictEqual(names('antalya'), ['Lara', 'Kundu', 'Belek', 'Konyaaltı']);
  assert.ok(names('kemer').includes('Tekirova') && names('side').includes('Kumköy') && names('bodrum').includes('Gümbet'));
  assert.ok(names('dubai').includes('Palm') && names('sharm').includes('Naama Bay'));
  for (const d of destinations) assert.ok(d.districts.length >= 2, d.id);
  for (const h of hotels) {
    const d = destinations.find((x) => x.id === h.destinationId);
    assert.ok(d.districts.some((x) => x.id === h.districtId && x.name === h.district), h.id);
  }
  // Alanyanın bütün 7 rayonunda otel var (7 otel → 7 rayon)
  assert.strictEqual(new Set(hotels.filter((h) => h.destinationId === 'alanya').map((h) => h.districtId)).size, 7);
});

test('rayon və otel multi-select filtrləri + facet-lər', async () => {
  const base = { q: 'Alanya', type: 'hotel', checkIn: future(40), checkInTo: future(43), nights: 7, adults: 2, flat: '1' };
  const all = await search(base);
  assert.ok(all.facets.districts.length === 7);
  assert.ok(all.facets.hotels.length >= 3);
  const withOffers = all.facets.districts.filter((d) => d.count > 0).slice(0, 2).map((d) => d.id);
  const r = await search({ ...base, districts: withOffers.join(',') });
  assert.ok(r.offers.length > 0 && r.offers.every((o) => withOffers.includes(o.districtId)));
  // facet siyahısı rayon filtri ilə daralmır (istifadəçi başqa rayonu da seçə bilsin)
  assert.deepStrictEqual(r.facets.districts.map((d) => d.id), all.facets.districts.map((d) => d.id));
  const pick = all.facets.hotels.slice(0, 2).map((h) => h.id);
  const h = await search({ ...base, hotels: pick.join(',') });
  assert.ok(h.groups.length > 0 && h.groups.length <= 2 && h.groups.every((g) => pick.includes(g.itemId)));
  // zərərli/yanlış dəyərlər sadəcə atılır
  const junk = await search({ ...base, districts: '<script>,a.b.c', hotels: '../x' });
  assert.strictEqual(junk.query.districts.length, 0);
  assert.strictEqual(junk.query.hotels.length, 0);
});

test('otel atributları: adults only uşaqlı axtarışda gizlədilir, attrs filtri, CHD FREE qiyməti', async () => {
  const ao = hotels.find((x) => x.destinationId === 'antalya' && x.attrs.includes('adultsOnly'));
  assert.ok(ao);
  const base = { q: 'Antalya', type: 'hotel', checkIn: future(40), checkInTo: future(46), nights: 7, flat: '1' };
  const adults = await search({ ...base, adults: 2, attrs: 'adultsOnly' });
  assert.ok(adults.groups.length > 0 && adults.groups.every((g) => g.attrs.includes('adultsOnly')));
  const kids = await search({ ...base, adults: 2, childAges: '5' });
  assert.ok(kids.groups.length > 0 && kids.groups.every((g) => !g.attrs.includes('adultsOnly')));
  const fam = await search({ ...base, adults: 2, attrs: 'family,recommended' });
  assert.ok(fam.offers.every((o) => o.attrs.includes('family') && o.attrs.includes('recommended')));
  // CHD FREE: 2 böyük + 7 yaş = 2 böyük qiyməti (otel üçün uşaq pulsuz); adi oteldə baha
  const two = await search({ ...base, adults: 2, flat: '1' });
  const twoById = new Map(two.offers.map((o) => [o.id, o]));
  const withKid = await search({ ...base, adults: 2, childAges: '7', flat: '1' });
  let free = 0; let paid = 0;
  for (const o of withKid.offers) {
    const ref = twoById.get(o.id); if (!ref || o.earlyBooking !== ref.earlyBooking) continue;
    if (o.attrs.includes('chdFree')) { assert.strictEqual(o.price, ref.price, o.id); free++; } else { assert.ok(o.price > ref.price, o.id); paid++; }
  }
  assert.ok(free > 0 && paid > 0);
});

test('yerləşmə kodu və otaq tipi pax-a uyğun avtomatik seçilir', async () => {
  assert.deepStrictEqual(accommodation(2, []), { code: 'DBL', family: false });
  assert.deepStrictEqual(accommodation(2, [8]), { code: 'DBL+1CHD(2-11.99)', family: false });
  assert.deepStrictEqual(accommodation(1, []), { code: 'SGL', family: false });
  assert.strictEqual(accommodation(3, []).code, 'TRPL');
  assert.strictEqual(accommodation(2, [14]).code, 'TRPL'); // 12+ böyük sayılır
  assert.deepStrictEqual(accommodation(2, [1]), { code: 'DBL+1INF(0-1.99)', family: false });
  assert.deepStrictEqual(accommodation(2, [4, 9]), { code: 'DBL+2CHD(2-11.99)', family: true });
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(40), nights: 7, adults: 2, childAges: '8', flat: '1' });
  assert.ok(r.offers.every((o) => o.accommodation === 'DBL+1CHD(2-11.99)' && o.room && o.room !== 'Family Room'));
  assert.ok(new Set(r.offers.map((o) => o.room)).size >= 2);
  const fam = await search({ q: 'Antalya', type: 'package', checkIn: future(40), nights: 7, adults: 2, childAges: '4,9', flat: '1' });
  assert.ok(fam.offers.length > 0 && fam.offers.every((o) => o.room === 'Family Room'));
});

test('qiymət növü, tur adı, uçuş saatı/sinfi, yer statusu', async () => {
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(200), nights: 7, adults: 2, flat: '1' });
  const year = future(200).slice(0, 4);
  for (const o of r.offers) {
    if (o.earlyBooking) assert.strictEqual(o.priceTypeLabel, `Erkən rezervasiya ${o.checkIn.slice(0, 4)}`);
    assert.ok(['EB', 'SPO', 'STD'].includes(o.priceType));
    assert.ok(o.tourName.startsWith('Antalya '));
    assert.match(o.flight.out.time, /^\d{2}:\d{2}$/);
    assert.ok(['econom', 'business'].includes(o.flight.cls));
    assert.ok(['many', 'few', 'none', 'request'].includes(o.flight.out.seats));
    assert.ok(['many', 'few', 'none', 'request'].includes(o.hotelSeats));
    assert.strictEqual(o.opCurrency, 'USD');
    assert.ok(Math.abs(o.opPrice * config.operatorRate.value - o.price) <= config.operatorRate.value);
  }
  assert.ok(r.offers.some((o) => o.priceTypeLabel === `Erkən rezervasiya ${year}`) || r.offers.some((o) => o.earlyBooking));
  const near = await search({ q: 'Antalya', type: 'package', checkIn: future(20), checkInTo: future(30), nights: 7, adults: 2, flat: '1' });
  assert.ok(near.offers.some((o) => o.priceType === 'SPO') && near.offers.some((o) => o.priceType === 'STD'));
  assert.ok(near.offers.some((o) => o.flight.cls === 'business'));
  const hotel = await search({ q: 'Antalya', type: 'hotel', checkIn: future(40), nights: 7, adults: 2, flat: '1' });
  assert.ok(hotel.offers.every((o) => o.flight === null && o.includesFlight === false));
});

test('filtrlər: reyslərdə yer var, satış dayandırılmayıb, ani təsdiq', async () => {
  const base = { q: 'Antalya', type: 'package', checkIn: future(30), checkInTo: future(44), nights: 7, adults: 2, flat: '1' };
  const all = await search(base);
  assert.ok(all.offers.some((o) => o.stopSale), 'demo məlumatda stop-sale var');
  assert.ok(all.offers.some((o) => o.flight.out.seats === 'none' || o.flight.back.seats === 'none'));
  const f = await search({ ...base, seatsOnly: '1', noStopSale: '1', instantOnly: '1' });
  assert.ok(f.offers.length > 0);
  assert.ok(f.offers.every((o) => o.flight.out.seats !== 'none' && o.flight.back.seats !== 'none' && !o.stopSale && o.availability === 'instant'));
  assert.ok(f.stats.count < all.stats.count);
});

test('boş nəticə: ekskursiya turu olmayan istiqamət → səbəb + tur olan istiqamətlər', async () => {
  const r = await search({ q: 'Alanya', type: 'tour', checkIn: future(40), checkInTo: future(47), nights: 7, adults: 2 });
  assert.strictEqual(r.groups.length, 0);
  assert.strictEqual(r.empty.reason, 'no_tours');
  const ids = r.empty.tourDestinations.map((d) => d.id);
  assert.deepStrictEqual(ids.sort(), [...new Set(tours.map((t) => t.destinationId))].sort());
  // eyni istiqamətdə paket və otel var
  const pkg = await search({ q: 'Alanya', type: 'package', checkIn: future(40), checkInTo: future(47), nights: 7, adults: 2 });
  assert.ok(pkg.groups.length > 0 && !pkg.empty);
  const dom = await search({ q: 'Qəbələ', type: 'package', checkIn: future(40), nights: 2, adults: 2 });
  assert.strictEqual(dom.empty.reason, 'no_package_domestic');
});

test('boş nəticə: hansı filtr sıfırladı + büdcə tövsiyəsi düzgündür', async () => {
  const base = { q: 'Antalya', type: 'package', checkIn: future(40), checkInTo: future(44), nights: 7, adults: 2 };
  const r = await search({ ...base, maxPrice: 300, stars: '5' });
  assert.strictEqual(r.groups.length, 0);
  assert.strictEqual(r.empty.reason, 'filters');
  assert.ok(r.empty.total > 0);
  const budget = r.empty.relax.find((x) => x.key === 'maxPrice');
  assert.ok(budget && budget.value > 300 && budget.value % 100 === 0 && budget.count > 0);
  assert.strictEqual(r.empty.relax[0].key, 'maxPrice');
  // tövsiyəni tətbiq etsək, deyilən qədər təklif tapılır
  const applied = await search({ ...base, maxPrice: budget.value, stars: '5', flat: '1' });
  assert.strictEqual(applied.offers.length, budget.count);
});

test('HTTP: aralıq xətası 400, config-də operator məzənnəsi, seçim linki aralıqlı axtarışla işləyir', async (t) => {
  const { base, close } = await startServer(app);
  t.after(close);
  const bad = await fetch(`${base}/api/search?q=Antalya&checkIn=${future(40)}&checkInTo=${future(60)}`);
  assert.strictEqual(bad.status, 400);
  assert.match((await bad.json()).error, /14/);
  const combo = await fetch(`${base}/api/search?q=Antalya&checkIn=${future(40)}&checkInTo=${future(54)}&nights=3&nightsTo=10`);
  assert.strictEqual(combo.status, 400);
  const cfg = await (await fetch(`${base}/api/config`)).json();
  assert.strictEqual(cfg.operatorRate.pair, 'USD/AZN');
  assert.ok(cfg.operatorRate.value > 1 && /^\d{4}-\d{2}-\d{2}$/.test(cfg.operatorRate.date));
  assert.strictEqual(cfg.searchLimits.maxDateRangeDays, 14);
  // USD məzənnəsi operator məzənnəsinə uyğundur
  assert.ok(Math.abs(config.rates.USD - 1 / config.operatorRate.value) < 0.0001);
  const ok = await (await fetch(`${base}/api/search?q=Antalya&type=hotel&checkIn=${future(40)}&checkInTo=${future(42)}&nights=7&flat=1`)).json();
  assert.strictEqual(ok.operatorRate.value, config.operatorRate.value);

  // Seçim linki: ən bahalı (1000-lik limitdən kənar ola bilən) təklif də serverdə tapılır
  const query = { q: 'Antalya', type: 'package', checkIn: future(40), checkInTo: future(54), nights: '6', nightsTo: '8', adults: '2' };
  const full = await search({ ...query, flat: '1' }, { offerLimit: Infinity });
  const last = full.offers[full.offers.length - 1];
  const sel = await createSelection({ query, offerIds: [last.id] }, { account: { agencyId: 'ag-test', agencyName: 'Test', managerName: 'M' } });
  assert.strictEqual(sel.items[0].offerId, last.id);
});
