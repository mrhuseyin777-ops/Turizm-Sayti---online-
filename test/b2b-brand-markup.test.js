// Agentlik brend profili (loqo yükləmə validasiyası, public loqo URL-i, IDOR, yalnız admin), çevik komissiya
// qaydaları (prioritet, yuvarlaqlaşdırma, eyni qiymətin bütün yerlərdə olması) və "niyə bu otel" izahı.
// TEST_DATABASE_URL təyin olunubsa eyni testlər real PostgreSQL ilə (müvəqqəti sxemdə) işləyir, yoxdursa — yaddaş/fayl.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const PG = !!process.env.TEST_DATABASE_URL;
const SCHEMA = `odiola_br_${crypto.randomBytes(5).toString('hex')}`;
let admin = null;
if (PG) {
  const u = new URL(process.env.TEST_DATABASE_URL);
  u.searchParams.set('options', `-c search_path=${SCHEMA}`);
  process.env.DATABASE_URL = u.toString();
  process.env.ETOUR_TEST_DB = '1';
}
process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-brand-'));
process.env.TRUST_PROXY = 'loopback';

const { startServer, createAccount, login, future } = require('./_helpers');
const markup = require('../src/markup');
const { applyMarkup, markupDetail, validateConfig, MarkupError } = markup;
const { reasonsFor, explainItems, similarHotels, audienceOf } = require('../src/whyhotel');
const brand = require('../src/brand');
const { providers } = require('../src/providers');

let app;
let storage;
let S;
let ipSeq = 0;
const ip = () => `10.66.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

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
  }
  fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------- Köməkçilər
const PW = 'Brand-Test-Parol-2026!';
async function account(agency, username, role = 'admin') {
  if (PG) {
    const { hashPassword } = require('../src/auth/password');
    const a = storage.get().accounts;
    const ag = (await a.findAgencyByName(agency)) || (await a.createAgency(agency));
    const user = await a.createUser({ agencyId: ag.id, username, displayName: 'Menecer ' + username, role, passwordHash: await hashPassword(PW) });
    return { agency: ag, user };
  }
  return createAccount({ agency, username, password: PW, role, displayName: 'Menecer ' + username });
}
async function signIn(username) {
  const l = await login(S.base, username, PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(l.res.status, 200, username);
  return { cookie: l.cookie, csrf: l.csrf };
}
const http = (method, p, { cookie, csrf, body, headers = {} } = {}) => fetch(S.base + p, {
  method,
  headers: { 'X-Forwarded-For': ip(), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
  body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
});
const json = async (res) => ({ status: res.status, body: await res.json().catch(() => ({})) });

// Real (kiçik) PNG: 2×2 RGB
function png() {
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(2, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.from([0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 255, 255, 255, 0]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), Buffer.from('JFIF\0'), Buffer.alloc(40, 1), Buffer.from([0xff, 0xd9])]);
const WEBP = (() => { const b = Buffer.alloc(40); b.write('RIFF', 0, 'latin1'); b.writeUInt32LE(32, 4); b.write('WEBP', 8, 'latin1'); b.write('VP8 ', 12, 'latin1'); return b; })();
const b64 = (buf) => buf.toString('base64');

const Q = () => ({ type: 'package', q: 'Antalya', destinationId: 'antalya', checkIn: future(40), checkInTo: future(40), nights: '7', nightsTo: '7', adults: '2', children: '0' });
const qs = (o) => new URLSearchParams({ ...o, flat: '1' }).toString();

// ---------------------------------------------------------------- Komissiya qaydaları: təmiz funksiya
const P = providers.map((p) => p.id);
const offer = (over = {}) => ({ price: 1000, providerId: P[0], destination: { id: 'antalya' }, priceType: 'STD', itemType: 'hotel', includesFlight: true, ...over });

test('applyMarkup: ən spesifik qayda qalib gəlir; bərabərdə operator > istiqamət > qiymət növü > məhsul tipi', () => {
  const R = validateConfig({
    enabled: true, defaultPct: 3, rules: [
      { productType: 'package', pct: 7 },
      { priceType: 'EB', pct: 5 },
      { destinationId: 'antalya', pct: 10 },
      { providerId: P[0], pct: 12 },
      { providerId: P[0], destinationId: 'antalya', pct: 15 },
      { providerId: P[1], destinationId: 'antalya', priceType: 'SPO', productType: 'hotel', pct: 20 },
    ],
  });
  // operator + istiqamət (2 kriteriya) > tək kriteriyalılar
  assert.strictEqual(applyMarkup(offer({ priceType: 'EB' }), R), 1150);
  assert.strictEqual(markupDetail(offer(), R).ruleIndex, 4);
  // başqa operator: istiqamət (4) > EB (2) > package (1)
  assert.strictEqual(applyMarkup(offer({ providerId: P[2], priceType: 'EB' }), R), 1100);
  // istiqamət yoxdur: EB > package
  assert.strictEqual(applyMarkup(offer({ providerId: P[2], destination: { id: 'kemer' }, priceType: 'EB' }), R), 1050);
  // yalnız operator uyğun
  assert.strictEqual(applyMarkup(offer({ destination: { id: 'kemer' }, includesFlight: false }), R), 1120);
  // 4 kriteriyalı qayda
  assert.strictEqual(applyMarkup(offer({ providerId: P[1], priceType: 'SPO', includesFlight: false }), R), 1200);
  assert.strictEqual(markupDetail(offer({ providerId: P[1], priceType: 'SPO', includesFlight: false }), R).specificity, 4);
  // heç biri: default 3%
  assert.strictEqual(applyMarkup(offer({ providerId: P[2], destination: { id: 'kemer' }, includesFlight: false, itemType: 'hotel' }), R), 1030);
  // earlyBooking → EB, itemType tour → tour (atribut çıxarılması)
  assert.deepStrictEqual(markup.offerAttrs({ price: 1, earlyBooking: true, itemType: 'tour' }), { net: 1, providerId: '', destinationId: '', priceType: 'EB', productType: 'tour' });
});

test('applyMarkup: sabit ₼, qaydanın öz sabiti, minimum marja, yuvarlaqlaşdırma (yox / 1 / 5 / 10 yuxarı)', () => {
  const base = { enabled: true, defaultPct: 10, fixed: 20, minMargin: 0 };
  assert.strictEqual(applyMarkup({ price: 1003 }, { ...base, rounding: 0 }), 1123); // 1003*1.1+20 = 1123.3 → 1123
  assert.strictEqual(applyMarkup({ price: 1003 }, { ...base, rounding: 1 }), 1124); // ceil
  assert.strictEqual(applyMarkup({ price: 1003 }, { ...base, rounding: 5 }), 1125);
  assert.strictEqual(applyMarkup({ price: 1003 }, { ...base, rounding: 10 }), 1130);
  assert.strictEqual(applyMarkup({ price: 1000 }, { ...base, fixed: 0, rounding: 10 }), 1100, 'artıq tam olan qiymət dəyişmir');
  // minimum marja: 2% × 500 = 10 < 60 → 60
  assert.strictEqual(applyMarkup({ price: 500 }, { enabled: true, defaultPct: 2, minMargin: 60, rounding: 0 }), 560);
  // qaydanın sabiti ümumi sabiti əvəz edir (0 da olsa)
  const R = validateConfig({ defaultPct: 10, fixed: 50, rules: [{ destinationId: 'antalya', pct: 5, fixed: 0 }] });
  assert.strictEqual(applyMarkup(offer(), R), 1050);
  assert.strictEqual(applyMarkup(offer({ destination: { id: 'kemer' } }), R), 1150);
  // köhnə tək % ilə tam uyğunluq (klient düsturu)
  for (const p of [999, 1234, 1777, 2501, 3333]) for (const m of [0, 7, 12.5, 15]) assert.strictEqual(applyMarkup({ price: p }, m), Math.round(p * (1 + m / 100)));
});

test('validateConfig: ağ siyahı, naməlum operator/istiqamət, kriteriyasız/dublikat qayda, limitlər', () => {
  const bad = [
    { defaultPct: 101 }, { defaultPct: -1 }, { fixed: 'abc' }, { rounding: 3 }, { extra: 1 },
    { rules: [{ pct: 5 }] }, { rules: [{ providerId: 'yoxdur', pct: 5 }] }, { rules: [{ destinationId: 'mars', pct: 5 }] },
    { rules: [{ priceType: 'XX', pct: 5 }] }, { rules: [{ productType: 'cruise', pct: 5 }] }, { rules: [{ destinationId: 'antalya', pct: 500 }] },
    { rules: [{ destinationId: 'antalya', pct: 5 }, { destinationId: 'antalya', pct: 6 }] }, { rules: 'x' },
    { rules: Array.from({ length: 51 }, (_, i) => ({ destinationId: 'antalya', pct: i % 100, fixed: i })) },
    { rules: [{ destinationId: 'antalya', pct: 5, __proto__x: 1 }] },
  ];
  for (const b of bad) assert.throws(() => validateConfig(b), MarkupError, JSON.stringify(b).slice(0, 80));
  const ok = validateConfig({ defaultPct: '12.5', rounding: 5, rules: [{ providerId: P[0], priceType: 'EB', pct: 8, fixed: '' }] });
  assert.deepStrictEqual(ok, { enabled: true, defaultPct: 12.5, fixed: 0, minMargin: 0, rounding: 5, rules: [{ providerId: P[0], priceType: 'EB', pct: 8 }] });
});

// ---------------------------------------------------------------- "Niyə bu otel"
const famHotel = { itemId: 'h-fam', name: 'Fam', stars: 5, price: 2000, attrs: ['chdFree', 'family'], tags: ['Uşaq klubu', 'Aquapark', 'SPA', 'Öz çimərliyi'], rating: 9.4, ratingWord: 'superb', reviewCount: 900, location: { kind: 'beach', line: 1, seaM: 30 }, freeCancelUntil: '2026-12-25', board: 'AI', includesFlight: true };
const coupleHotel = { itemId: 'h-cpl', name: 'Cpl', stars: 5, price: 2100, attrs: ['adultsOnly'], tags: ['SPA'], rating: 8.7, location: { kind: 'beach', line: 2, seaM: 250 }, board: 'BB' };

test('niyə bu otel: auditoriyaya görə — uşaqlı sorğuda ailə səbəbləri önə, 2 böyükdə adults-only/SPA önə; 2–4 səbəb', () => {
  assert.strictEqual(audienceOf({ adults: 2, children: 1 }), 'family');
  assert.strictEqual(audienceOf({ adults: 2, children: 0 }), 'couple');
  assert.strictEqual(audienceOf({ adults: 1 }), 'solo');
  assert.strictEqual(audienceOf({ adults: 4 }), 'group');

  const fam = reasonsFor(famHotel, { audience: 'family' });
  assert.strictEqual(fam[0].k, 'family');
  assert.deepStrictEqual(fam[0].items, ['chdFree', 'kidsClub', 'aquapark']);
  assert.ok(fam.length >= 2 && fam.length <= 4);
  const famForCouple = reasonsFor(famHotel, { audience: 'couple' });
  assert.notStrictEqual(famForCouple[0].k, 'family', 'cütlük üçün ailə səbəbi önə çıxmır');
  assert.ok(famForCouple.some((r) => r.k === 'spa'), 'cütlük üçün SPA');

  const cpl = reasonsFor(coupleHotel, { audience: 'couple' });
  assert.deepStrictEqual(cpl.slice(0, 2).map((r) => r.k), ['adultsOnly', 'spa']);
  assert.ok(!reasonsFor(coupleHotel, { audience: 'family' }).some((r) => r.k === 'adultsOnly'), 'uşaqlı sorğuda adults-only səbəb deyil');

  // 1-ci xətt + məsafə, reytinq, pulsuz ləğv
  const all = reasonsFor({ ...famHotel, attrs: [], tags: ['Öz çimərliyi'] }, { audience: 'couple' });
  assert.deepStrictEqual(all.find((r) => r.k === 'beach'), { k: 'beach', line: 1, m: 30, own: true });
  assert.deepStrictEqual(all.find((r) => r.k === 'rating'), { k: 'rating', r: 9.4, word: 'superb', n: 900 });
  assert.ok(all.some((r) => r.k === 'cancel' && r.d === '2026-12-25'));

  // seçilmişlər arasında ən ucuz / ən ucuzdan fərq
  const ex = explainItems([{ offer: famHotel, clientPrice: 2200 }, { offer: coupleHotel, clientPrice: 2300 }], { adults: 2, children: 0 });
  assert.ok(ex[0].some((r) => r.k === 'cheapest'));
  assert.ok(!ex[1].some((r) => r.k === 'cheapest'));
  // zəif məlumat → ən azı 2 neytral səbəb
  const weak = reasonsFor({ stars: 3, board: 'BB', includesFlight: true }, { audience: 'group' });
  assert.deepStrictEqual(weak.map((r) => r.k), ['board', 'flight']);
});

test('oxşar otellər: eyni istiqamət, ±1 ulduz, ±20% qiymət, seçilmişlər istisna, maks. 3, qiymət applyMarkup ilə', () => {
  const mk = (id, stars, price, over = {}) => ({ id: `summer:${id}|x`, itemId: id, itemType: 'hotel', name: id, stars, price, destination: { id: 'antalya', name: 'Antalya' }, providerId: P[0], ...over });
  const picked = mk('p', 4, 1000);
  const all = [picked, mk('a', 4, 1050), mk('a', 4, 1020), mk('b', 5, 1150), mk('c', 3, 900), mk('d', 4, 1300), mk('e', 2, 1000), mk('f', 4, 990, { destination: { id: 'kemer', name: 'Kemer' } }), mk('g', 4, 980), mk('h', 4, 1010, { stopSale: true })];
  const rules = { enabled: true, defaultPct: 10, rounding: 5 };
  const sim = similarHotels(all, [picked], rules, { pax: { adults: 2 } });
  assert.ok(sim.length <= 3);
  assert.deepStrictEqual(sim.map((s) => s.name), ['a', 'g', 'c']); // a: 1020 (2%), g: 980 (2%), c: 900 (10%+ulduz) ; b 15%
  assert.strictEqual(sim[0].clientPrice, applyMarkup({ price: 1020, providerId: P[0], destination: { id: 'antalya' } }, rules));
  for (const s of sim) { assert.ok(!('providerName' in s) && !('id' in s) && !('price' in s), 'operator/net/id sızmır'); }
});

// ---------------------------------------------------------------- Brend: validasiya (təmiz funksiya)
test('brend: sahə validasiyası (rəng yalnız #rrggbb, sayt http/https, telefon, ağ siyahı), magic byte', () => {
  assert.throws(() => brand.validateBrand({ color: 'red' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ color: '#12345g' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ color: '#fff;background:url(x)' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ website: 'javascript:alert(1)' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ website: 'https://user:pw@evil.az' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ phone: 'abc' }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ isAdmin: true }), brand.BrandError);
  assert.throws(() => brand.validateBrand({ displayName: { a: 1 } }), brand.BrandError);
  const v = brand.validateBrand({ displayName: '  Günəş   Tur ', color: '#0E7490', website: 'gunes.az', phone: '+994 12 555 11 22' });
  assert.deepStrictEqual([v.displayName, v.color, v.website], ['Günəş Tur', '#0e7490', 'https://gunes.az/']);
  assert.strictEqual(brand.sniffImage(png()), 'image/png');
  assert.strictEqual(brand.sniffImage(JPEG), 'image/jpeg');
  assert.strictEqual(brand.sniffImage(WEBP), 'image/webp');
  assert.strictEqual(brand.sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.strictEqual(brand.sniffImage(Buffer.from('GIF89a\x01\x00\x01\x00\x00\x00\x00')), null);
  assert.strictEqual(brand.onColor('#ffff00'), '#111827');
  assert.strictEqual(brand.onColor('#0e7490'), '#ffffff');
});

// ---------------------------------------------------------------- HTTP: loqo yükləmə
test('loqo: yalnız admin + CSRF + Origin; SVG/HTML/GIF/ölçü rədd; PNG/JPEG/WebP qəbul; public URL, Content-Type, nosniff, cache; IDOR', async () => {
  const A = await account('Brend A', 'brand-a');
  await account('Brend A', 'brand-a-mgr', 'manager');
  const B = await account('Brend B', 'brand-b');
  const sa = await signIn('brand-a');
  const sm = await signIn('brand-a-mgr');
  const sb = await signIn('brand-b');
  const pngData = b64(png());

  assert.strictEqual((await http('POST', '/api/b2b/brand/logo', { body: { data: pngData } })).status, 401);
  assert.strictEqual((await http('POST', '/api/b2b/brand/logo', { cookie: sa.cookie, body: { data: pngData } })).status, 403, 'CSRF yoxdur');
  assert.strictEqual((await http('POST', '/api/b2b/brand/logo', { ...sa, body: { data: pngData }, headers: { Origin: 'https://evil.example' } })).status, 403, 'Origin');
  assert.strictEqual((await http('POST', '/api/b2b/brand/logo', { ...sm, body: { data: pngData } })).status, 403, 'admin olmayan');
  assert.strictEqual((await http('PUT', '/api/b2b/brand', { ...sm, body: { displayName: 'Hack' } })).status, 403, 'admin olmayan brend dəyişə bilməz');
  assert.strictEqual((await http('PUT', '/api/b2b/markup', { ...sm, body: { defaultPct: 50 } })).status, 403, 'admin olmayan komissiya dəyişə bilməz');
  assert.strictEqual((await http('DELETE', '/api/b2b/brand/logo', { ...sm, body: {} })).status, 403);

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>';
  const rejects = [
    { data: Buffer.from(svg).toString('base64') },
    { data: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') },
    { data: Buffer.from('<!doctype html><html><script>alert(1)</script></html>').toString('base64') },
    { data: 'data:image/png;base64,' + Buffer.from('<html><body>x</body></html>').toString('base64') }, // tip etiketi yalan
    { data: Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00').toString('base64') },
    { data: '%%%not-base64%%%' },
    { data: '' },
    { data: Buffer.concat([png(), Buffer.alloc(200 * 1024)]).toString('base64') }, // PNG başlığı, amma > 200 KB
    { data: pngData, mime: 'image/png' }, // icazəsiz sahə
  ];
  for (const body of rejects) {
    const r = await json(await http('POST', '/api/b2b/brand/logo', { ...sa, body }));
    assert.strictEqual(r.status, 400, JSON.stringify(body).slice(0, 60));
    assert.ok(r.body.error);
  }
  // body limiti (280 KB) → 413
  const huge = await http('POST', '/api/b2b/brand/logo', { ...sa, body: JSON.stringify({ data: 'A'.repeat(300 * 1024) }) });
  assert.strictEqual(huge.status, 413);
  // digər API-lərdə 16 KB limit qalır
  assert.strictEqual((await http('PUT', '/api/b2b/brand', { ...sa, body: JSON.stringify({ address: 'x'.repeat(20 * 1024) }) })).status, 413);

  // PNG — data:image/svg+xml etiketi ilə göndərilsə də Content-Type magic byte ilə (image/png)
  const up = await json(await http('POST', '/api/b2b/brand/logo', { ...sa, body: { data: 'data:image/svg+xml;base64,' + pngData } }));
  assert.strictEqual(up.status, 201, JSON.stringify(up.body));
  const url = up.body.brand.logoUrl;
  assert.match(url, /^\/a\/pb_[A-Za-z0-9_-]{16}\/logo\?v=[0-9a-f]{8}$/);
  assert.ok(!url.includes(A.agency.id) && !JSON.stringify(up.body).includes(A.agency.id), 'daxili agentlik id-si sızmır');
  assert.strictEqual(up.body.brand.logo.mime, 'image/png');

  const g = await http('GET', url);
  assert.strictEqual(g.status, 200);
  assert.strictEqual(g.headers.get('content-type'), 'image/png');
  assert.strictEqual(g.headers.get('x-content-type-options'), 'nosniff');
  assert.match(g.headers.get('cache-control'), /public, max-age=31536000, immutable/);
  assert.match(g.headers.get('content-security-policy'), /sandbox/);
  assert.ok(Buffer.from(await g.arrayBuffer()).equals(png()));
  const etag = g.headers.get('etag');
  assert.strictEqual((await http('GET', url, { headers: { 'If-None-Match': etag } })).status, 304);
  assert.match((await http('GET', url.split('?')[0])).headers.get('cache-control'), /max-age=300/);
  assert.strictEqual((await http('GET', '/a/pb_AAAAAAAAAAAAAAAA/logo')).status, 404);
  assert.strictEqual((await http('GET', `/a/${A.agency.id}/logo`)).status, 404, 'daxili id ilə tapılmır');
  assert.strictEqual((await http('GET', '/a/..%2F..%2Fetc/logo')).status, 404);

  // JPEG və WebP
  for (const [buf, mime] of [[JPEG, 'image/jpeg'], [WEBP, 'image/webp']]) {
    const r = await json(await http('POST', '/api/b2b/brand/logo', { ...sa, body: { data: b64(buf) } }));
    assert.strictEqual(r.status, 201);
    assert.strictEqual((await http('GET', r.body.brand.logoUrl)).headers.get('content-type'), mime);
  }
  const aBrand = (await json(await http('GET', '/api/b2b/brand', sa))).body;

  // IDOR: B öz loqosunu yükləyir — A-nınkı dəyişmir, publicId fərqlidir; B A-nın brendini görmür
  const bUp = await json(await http('POST', '/api/b2b/brand/logo', { ...sb, body: { data: pngData } }));
  assert.strictEqual(bUp.status, 201);
  assert.notStrictEqual(bUp.body.brand.logoUrl.split('/')[2], aBrand.logoUrl.split('/')[2]);
  assert.strictEqual((await http('GET', aBrand.logoUrl)).headers.get('content-type'), 'image/webp', 'A-nın loqosu toxunulmaz');
  await http('PUT', '/api/b2b/brand', { ...sa, body: { displayName: 'A Görünən Ad' } });
  const bView = (await json(await http('GET', '/api/b2b/brand', sb))).body;
  assert.strictEqual(bView.name, 'Brend B');
  assert.ok(!JSON.stringify(bView).includes('A Görünən Ad'));
  // menecer (admin olmayan) brendi oxuya bilər (imza üçün), amma canEdit=false
  const mView = (await json(await http('GET', '/api/b2b/brand', sm))).body;
  assert.strictEqual(mView.name, 'A Görünən Ad');
  assert.strictEqual(mView.canEdit, false);

  // silmə
  const del = await json(await http('DELETE', '/api/b2b/brand/logo', { ...sb, body: {} }));
  assert.strictEqual(del.body.brand.logoUrl, null);
  assert.strictEqual((await http('GET', bUp.body.brand.logoUrl)).status, 404);
  assert.strictEqual((await http('GET', aBrand.logoUrl)).status, 200, 'B-nin silməsi A-ya təsir etmir');
  void B;
});

test('brend profili: HTTP validasiya, seçim linkində brend (daxili id yoxdur), rəng yalnız hex', async () => {
  const A = await account('Brend Sel', 'brand-sel');
  const sa = await signIn('brand-sel');
  for (const body of [{ color: 'red' }, { color: 'url(javascript:alert(1))' }, { website: 'javascript:alert(1)' }, { licenseNo: '<script>' }, { foo: 1 }]) {
    assert.strictEqual((await http('PUT', '/api/b2b/brand', { ...sa, body })).status, 400, JSON.stringify(body));
  }
  const ok = await json(await http('PUT', '/api/b2b/brand', { ...sa, body: { displayName: 'Günəş <b>Tur</b>', color: '#0E7490', phone: '+994 12 555 11 22', whatsapp: '+994 50 555 11 22', licenseNo: 'TA-2026/015', address: 'Bakı, Nizami küç. 10', website: 'https://gunes.az' } }));
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.body.brand.color, '#0e7490');
  await http('POST', '/api/b2b/brand/logo', { ...sa, body: { data: b64(png()) } });

  const search = (await json(await http('GET', '/api/b2b/search?' + qs(Q()), sa))).body;
  const o = search.offers[0];
  const sel = await json(await http('POST', '/api/selections', { ...sa, body: { markup: 0, query: Q(), offerIds: [o.id] } }));
  assert.strictEqual(sel.status, 201);
  const pub = (await json(await http('GET', '/api/selections/' + sel.body.id))).body;
  assert.strictEqual(pub.brand.name, 'Günəş <b>Tur</b>', 'mətn data kimi qayıdır (klient esc() edir)');
  assert.strictEqual(pub.brand.color, '#0e7490');
  assert.strictEqual(pub.brand.onColor, '#ffffff');
  assert.match(pub.brand.logoUrl, /^\/a\/pb_[A-Za-z0-9_-]{16}\/logo\?v=[0-9a-f]{8}$/);
  assert.strictEqual(pub.brand.licenseNo, 'TA-2026/015');
  const raw = JSON.stringify(pub);
  assert.ok(!raw.includes(A.agency.id) && !raw.includes('agencyId') && !raw.includes('providerName') && !raw.includes('netPrice'));
  assert.ok(pub.items[0].why.length >= 2 && pub.items[0].why.length <= 4, 'niyə bu otel: 2–4 səbəb');
  assert.ok(Array.isArray(pub.similar) && pub.similar.length <= 3);
  for (const s of pub.similar) assert.ok(Number.isFinite(s.clientPrice) && !('providerName' in s));
});

// ---------------------------------------------------------------- HTTP: eyni qiymət bütün yerlərdə
test('komissiya qaydaları: axtarış, seçilmişlər, seçim linki, seçilmişlərdən link, çap təklif, müraciət — eyni qiymət; klientin %-i nəzərə alınmır', async () => {
  await account('Qayda A', 'rules-a');
  await account('Qayda B', 'rules-b');
  const sa = await signIn('rules-a');
  const sb = await signIn('rules-b');
  const cfg = { enabled: true, defaultPct: 10, fixed: 20, minMargin: 50, rounding: 5, rules: [{ destinationId: 'antalya', pct: 12 }, { providerId: P[0], destinationId: 'antalya', pct: 15, fixed: 0 }] };
  assert.strictEqual((await http('PUT', '/api/b2b/markup', { cookie: sa.cookie, body: cfg })).status, 403, 'CSRF');
  const put = await json(await http('PUT', '/api/b2b/markup', { ...sa, body: cfg }));
  assert.strictEqual(put.status, 200, JSON.stringify(put.body));
  assert.strictEqual(put.body.active, true);
  assert.strictEqual((await http('PUT', '/api/b2b/markup', { ...sa, body: { ...cfg, rules: [{ providerId: 'evil', pct: 1 }] } })).status, 400);
  const rules = validateConfig(cfg);

  const r = await json(await http('GET', '/api/b2b/search?' + qs(Q()), sa));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.pricing.active, true);
  assert.ok(r.body.offers.length > 3);
  for (const o of r.body.offers.slice(0, 50)) assert.strictEqual(o.clientPrice, applyMarkup(o, rules));
  for (const g of r.body.groups.slice(0, 20)) {
    assert.strictEqual(g.best.clientPrice, applyMarkup(g.best, rules));
    for (const o of g.providers) assert.strictEqual(o.clientPrice, applyMarkup(o, rules));
    assert.strictEqual(g.best.clientPrice % 5, 0, 'yuvarlaqlaşdırma 5 ₼');
  }
  // P[0] təklifi 15% + 0, digərləri 12% + 20 (min. marja 50)
  const op0 = r.body.offers.find((o) => o.providerId === P[0]);
  assert.strictEqual(op0.clientPrice, Math.ceil(Math.round(Math.max(op0.price * 1.15, op0.price + 50) * 100) / 100 / 5) * 5);

  // Başqa agentlik: qaydaları yoxdur, keş çirklənmir
  const rb = await json(await http('GET', '/api/b2b/search?' + qs(Q()), sb));
  assert.strictEqual(rb.body.pricing.active, false);
  assert.ok(rb.body.offers.every((o) => o.clientPrice === undefined));
  assert.ok((await json(await http('GET', '/api/search?' + qs(Q())))).body.offers.every((o) => o.clientPrice === undefined), 'public axtarış toxunulmaz');
  assert.strictEqual((await http('GET', '/api/b2b/search?' + qs(Q()))).status, 401);

  const picks = [r.body.offers[0], r.body.offers.find((o) => o.providerId !== r.body.offers[0].providerId) || r.body.offers[1]];
  const expected = new Map(picks.map((o) => [o.id, o.clientPrice]));

  // seçim linki (klient markup: 99 göndərir — nəzərə alınmır)
  const sel = await json(await http('POST', '/api/selections', { ...sa, body: { markup: 99, query: Q(), offerIds: picks.map((o) => o.id), client: 'Qayda müştəri' } }));
  assert.strictEqual(sel.status, 201);
  const pub = (await json(await http('GET', '/api/selections/' + sel.body.id))).body;
  assert.deepStrictEqual(pub.items.map((it) => it.clientPrice), picks.map((o) => expected.get(o.id)));

  // seçilmişlər
  for (const o of picks) {
    const add = await json(await http('POST', '/api/b2b/shortlist', { ...sa, body: { client: 'Qayda SL', query: Q(), offerId: o.id } }));
    assert.strictEqual(add.status, 201);
    assert.strictEqual(add.body.item.clientPrice, expected.get(o.id));
  }
  const list = (await json(await http('GET', '/api/b2b/shortlist', sa))).body.items.filter((x) => x.client === 'Qayda SL');
  for (const it of list) assert.strictEqual(it.clientPrice, expected.get(it.offerId));
  const ref = await json(await http('POST', `/api/b2b/shortlist/${list[0].id}/refresh`, { ...sa, body: {} }));
  assert.strictEqual(ref.body.item.clientPrice, expected.get(list[0].offerId));

  // seçilmişlərdən link və çap təklif
  const sl = await json(await http('POST', '/api/b2b/shortlist/selection', { ...sa, body: { client: 'Qayda SL', markup: 50 } }));
  assert.strictEqual(sl.status, 201);
  const slPub = (await json(await http('GET', '/api/selections/' + sl.body.id))).body;
  assert.deepStrictEqual(slPub.items.map((x) => x.clientPrice).sort((a, b) => a - b), [...expected.values()].sort((a, b) => a - b));
  const quote = await json(await http('POST', '/api/b2b/shortlist/quote', { ...sa, body: { client: 'Qayda SL', markup: 50 } }));
  assert.strictEqual(quote.status, 200);
  assert.deepStrictEqual(quote.body.items.map((x) => x.clientPrice).sort((a, b) => a - b), [...expected.values()].sort((a, b) => a - b));
  assert.ok(quote.body.brand && quote.body.brand.name === 'Qayda A');
  for (const it of quote.body.items) assert.ok(it.why.length >= 2 && it.why.length <= 4);
  assert.ok(Array.isArray(quote.body.similar) && quote.body.similar.length <= 3);
  for (const s of quote.body.similar) assert.strictEqual(s.clientPrice % 5, 0, 'oxşar otellər də eyni qaydalarla');
  const qraw = JSON.stringify(quote.body);
  assert.ok(!qraw.includes('providerName') && !qraw.includes('netPrice'));

  // müraciət (seçim linkindən) — eyni qiymət
  const lead = await http('POST', '/api/leads', { body: { type: 'selection', selectionId: sel.body.id, itemIndex: 0, name: 'Qayda Müştəri', phone: '+994501112244' } });
  assert.strictEqual(lead.status, 201);
  const leads = (await json(await http('GET', '/api/b2b/leads', sa))).body.leads;
  assert.strictEqual(leads.find((l) => l.selectionId === sel.body.id).item.clientPrice, expected.get(picks[0].id));

  // qaydalar söndürüləndə klientin tək %-i (köhnə düstur) qüvvəyə minir
  await http('PUT', '/api/b2b/markup', { ...sa, body: { ...cfg, enabled: false } });
  const sel2 = await json(await http('POST', '/api/selections', { ...sa, body: { markup: 10, query: Q(), offerIds: [picks[0].id] } }));
  const pub2 = (await json(await http('GET', '/api/selections/' + sel2.body.id))).body;
  assert.strictEqual(pub2.items[0].clientPrice, Math.round(picks[0].price * 1.1));
  const r2 = await json(await http('GET', '/api/b2b/search?' + qs(Q()), sa));
  assert.strictEqual(r2.body.pricing.active, false);
});

test('komissiya: GET görünüşü (seçimlər, canEdit), menecer oxuya bilir amma dəyişə bilmir', async () => {
  await account('Qayda C', 'rules-c');
  await account('Qayda C', 'rules-c-mgr', 'manager');
  const sm = await signIn('rules-c-mgr');
  const v = (await json(await http('GET', '/api/b2b/markup', sm))).body;
  assert.strictEqual(v.canEdit, false);
  assert.strictEqual(v.active, false);
  assert.deepStrictEqual(v.config.rules, []);
  assert.ok(v.options.providers.length >= 3 && v.options.destinations.some((d) => d.id === 'antalya'));
  assert.deepStrictEqual(v.options.rounding, [0, 1, 5, 10]);
});
