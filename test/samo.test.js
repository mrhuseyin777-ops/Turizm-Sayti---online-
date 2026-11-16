const test = require('node:test');
const assert = require('node:assert');
const fixture = require('./fixtures/samo-items.HYPOTHETICAL.json');
const {
  operators, buildOperatorSearchUrl, isAllowedOperatorUrl, createSamoProvider, normalizeSamoItems,
  safeFetch, mapBoard,
} = require('../src/providers/samo');
const { parseQuery } = require('../src/search');

const TODAY = new Date('2026-11-16T00:00:00Z');
const params = (url) => Object.fromEntries(new URL(url).searchParams);

// --- deeplink -------------------------------------------------------------------------------

test('deeplink: FS (funsun) üçün düzgün parametrlər və YYYYMMDD tarix formatı', () => {
  const url = buildOperatorSearchUrl('funsun', {
    destinationIds: ['antalya'], checkIn: '2027-06-15', flex: 2, nights: 7, adults: 2, childAges: [4, 9], currency: 'AZN',
  }, { today: TODAY });
  const u = new URL(url);
  assert.strictEqual(u.origin + u.pathname, 'https://b2b.fstravel.asia/search_tour');
  const p = params(url);
  assert.strictEqual(p.TOWNFROMINC, '433614');
  assert.strictEqual(p.STATEFROM, '433579');
  assert.strictEqual(p.STATEINC, '18803'); // Türkiyə
  assert.strictEqual(p.CHECKIN_BEG, '20270613');
  assert.strictEqual(p.CHECKIN_END, '20270617');
  assert.strictEqual(p.NIGHTS_FROM, '7');
  assert.strictEqual(p.NIGHTS_TILL, '7');
  assert.strictEqual(p.ADULT, '2');
  assert.strictEqual(p.CHILD, '2');
  assert.strictEqual(p.AGE1, '4');
  assert.strictEqual(p.AGE2, '9');
  assert.strictEqual(p.CURRENCY, '25'); // AZN
  assert.strictEqual(p.TOURGROUP, '0');
  assert.strictEqual(p.HOTELS_ANY, '1');
});

test('deeplink: Summer Tour və Kompas ID-ləri, valyuta fallback', () => {
  const s = params(buildOperatorSearchUrl('summer', { destinationIds: ['istanbul'], checkIn: '2027-03-01', nights: 5, adults: 1, currency: 'AZN' }, { today: TODAY }));
  assert.strictEqual(s.TOWNFROMINC, '1930');
  assert.strictEqual(s.STATEINC, '9');
  assert.strictEqual(s.CURRENCY, '2'); // Summer-də AZN yoxdur → USD
  assert.strictEqual(s.CHECKIN_BEG, '20270301');
  assert.strictEqual(s.CHECKIN_END, '20270301');
  assert.strictEqual(s.CHILD, '0');

  const k = params(buildOperatorSearchUrl('kompas', { destinationId: 'maldives', checkIn: '2027-01-10', nights: 10, adults: 2, currency: 'EUR', townFrom: 'ganja' }, { today: TODAY }));
  assert.strictEqual(k.TOWNFROMINC, '1512');
  assert.strictEqual(k.STATEINC, '40');
  assert.strictEqual(k.CURRENCY, '3');
});

test('deeplink: bilinməyən / daxili / qarışıq istiqamətdə ölkə parametri buraxılır', () => {
  const base = { checkIn: '2027-06-15', nights: 7, adults: 2 };
  for (const q of [{ destinationIds: ['qabala'] }, { destinationIds: ['nonexistent'] }, { destinationIds: ['antalya', 'dubai'] }, {}]) {
    const p = params(buildOperatorSearchUrl('funsun', { ...base, ...q }, { today: TODAY }));
    assert.ok(!('STATEINC' in p), JSON.stringify(q));
    assert.strictEqual(p.TOWNFROMINC, '433614');
  }
  // Summer-də BƏƏ ID-si məlum deyil (null) → buraxılır
  assert.ok(!('STATEINC' in params(buildOperatorSearchUrl('summer', { ...base, destinationIds: ['dubai'] }, { today: TODAY }))));
  // eyni ölkədən bir neçə istiqamət → ölkə göndərilir
  assert.strictEqual(params(buildOperatorSearchUrl('funsun', { ...base, destinationIds: ['batumi', 'tbilisi'] }, { today: TODAY })).STATEINC, '223991');
});

test('deeplink: limitlərə sıxma, yaşı bilinməyən uşaq, keçmiş tarix', () => {
  // FS: maks 3 uşaq, yaş 0..15, maks 8 böyük, gecə 2..28
  const p = params(buildOperatorSearchUrl('funsun', { checkIn: '2027-06-15', nights: 40, adults: 99, childAges: [17, null, 2, 5, 6] }, { today: TODAY }));
  assert.strictEqual(p.ADULT, '8');
  assert.strictEqual(p.NIGHTS_FROM, '28');
  assert.strictEqual(p.CHILD, '3');
  assert.deepStrictEqual([p.AGE1, p.AGE2, p.AGE3], ['15', '7', '2']);
  assert.ok(!('AGE4' in p));
  // köhnə `children` sayı ilə
  const c = params(buildOperatorSearchUrl('kompas', { checkIn: '2027-06-15', nights: 7, adults: 2, children: 2 }, { today: TODAY }));
  assert.strictEqual(c.CHILD, '2');
  assert.strictEqual(c.AGE2, '7');
  // ±flex keçmişə düşəndə başlanğıc bu günə çəkilir
  const t = params(buildOperatorSearchUrl('funsun', { checkIn: '2026-11-17', flex: 3, nights: 7, adults: 2 }, { today: TODAY }));
  assert.strictEqual(t.CHECKIN_BEG, '20261116');
  assert.strictEqual(t.CHECKIN_END, '20261120');
});

test('deeplink: search.js parseQuery nəticəsi ilə işləyir', () => {
  const q = parseQuery({ q: 'Dubay', checkIn: '2027-02-10', nights: '6', adults: '3', childAges: '3,10', currency: 'USD', flex: '0' });
  const p = params(buildOperatorSearchUrl('funsun', q, { today: TODAY }));
  assert.strictEqual(p.STATEINC, '20613');
  assert.strictEqual(p.CHECKIN_BEG, '20270210');
  assert.strictEqual(p.ADULT, '3');
  assert.strictEqual(p.CURRENCY, '2');
  assert.deepStrictEqual([p.CHILD, p.AGE1, p.AGE2], ['2', '3', '10']);
});

test('deeplink: host whitelist və xüsusi simvollar (inyeksiya yoxdur)', () => {
  assert.strictEqual(buildOperatorSearchUrl('evil', { checkIn: '2027-06-15' }), null);
  assert.strictEqual(buildOperatorSearchUrl('__proto__', { checkIn: '2027-06-15' }), null);
  assert.strictEqual(buildOperatorSearchUrl('constructor', { checkIn: '2027-06-15' }), null);
  assert.strictEqual(buildOperatorSearchUrl('funsun', { checkIn: '15.06.2027' }), null);
  assert.strictEqual(buildOperatorSearchUrl('funsun', { checkIn: '2027-02-30' }), null);

  const nasty = '1&STATEINC=666#@evil.com/?x=<script>';
  const url = buildOperatorSearchUrl('funsun', {
    checkIn: '2027-06-15', nights: nasty, adults: nasty, childAges: [nasty, '3"><img>'], currency: nasty,
    townFrom: 'https://evil.com', destinationIds: [nasty, 'antalya'], destinationId: nasty, flex: nasty,
  }, { today: TODAY });
  const u = new URL(url);
  assert.strictEqual(u.host, 'b2b.fstravel.asia');
  assert.strictEqual(u.hash, '');
  assert.ok(!url.includes('evil') && !url.includes('<') && !url.includes('666'));
  assert.strictEqual(u.searchParams.getAll('STATEINC').length, 0); // qarışıq istiqamət → buraxılır
  for (const [k, v] of u.searchParams) assert.match(v, /^\d+$/, k);
  assert.ok(isAllowedOperatorUrl(url));

  assert.ok(!isAllowedOperatorUrl('https://evil.com/search_tour'));
  assert.ok(!isAllowedOperatorUrl('http://b2b.fstravel.asia/search_tour'));
  assert.ok(!isAllowedOperatorUrl('https://b2b.fstravel.asia.evil.com/search_tour'));
  assert.ok(!isAllowedOperatorUrl('https://user:pw@b2b.fstravel.asia/search_tour'));
  assert.ok(!isAllowedOperatorUrl('https://b2b.fstravel.asia/other'));
  assert.ok(!isAllowedOperatorUrl('javascript:alert(1)'));
  for (const op of Object.values(operators)) assert.ok(op.baseUrl.startsWith('https://'));
});

// --- provider: disabled rejim -----------------------------------------------------------------

test('samoProvider: env ilə aktivləşdirilməyibsə şəbəkəyə çıxmır və boş qaytarır', async (t) => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (...a) => { calls.push(a); throw new Error('şəbəkə çağırılmamalıdır'); };
  t.after(() => { globalThis.fetch = original; });

  const q = parseQuery({ q: 'Antalya', checkIn: '2027-06-15' });
  const impl = { buildRequest: () => ({ url: 'https://api.example.test/x' }), parseResponse: () => [] };
  const cases = [
    [{}, 'disabled', {}],
    [{ SAMO_FUNSUN_ENABLED: 'true' }, 'disabled', impl],
    [{ SAMO_FUNSUN_ENABLED: '1' }, 'missing_credentials', impl],
    [{ SAMO_FUNSUN_ENABLED: '1', SAMO_FUNSUN_API_URL: 'https://api.example.test/x' }, 'missing_credentials', impl],
    // apiHosts boşdur → hətta etimadnamə ilə də şəbəkəyə çıxmır
    [{ SAMO_FUNSUN_ENABLED: '1', SAMO_FUNSUN_API_URL: 'https://api.example.test/x', SAMO_FUNSUN_API_TOKEN: 'dummy' }, 'host_not_allowed', impl],
  ];
  for (const [env, reason, deps] of cases) {
    const p = createSamoProvider('funsun', { env, ...deps, logger: () => {} });
    assert.strictEqual(p.status().enabled, false);
    assert.strictEqual(p.status().reason, reason, JSON.stringify(env));
    assert.deepStrictEqual(await p.search(q), []);
  }
  // whitelist-də host var, amma rəsmi sənədə əsaslanan buildRequest/parseResponse yoxdur
  const op = { ...operators.funsun, apiHosts: ['api.example.test'] };
  const p = createSamoProvider(op, { env: { SAMO_FUNSUN_ENABLED: '1', SAMO_FUNSUN_API_URL: 'https://api.example.test/x', SAMO_FUNSUN_API_TOKEN: 'dummy' }, logger: () => {} });
  assert.strictEqual(p.status().reason, 'not_implemented');
  assert.deepStrictEqual(await p.search(q), []);

  assert.strictEqual(calls.length, 0);
  // interfeys mock provayderlə uyğundur
  for (const k of ['id', 'name', 'color', 'kind', 'sells', 'search']) assert.ok(k in p, k);
  assert.strictEqual(p.demo, false);
  assert.ok(isAllowedOperatorUrl(p.deeplink(q)));
});

// --- normalize (hipotetik fixture) --------------------------------------------------------------

test('normalize: hipotetik SamoItem fixture → Offer formatı', () => {
  const query = parseQuery({ q: 'Antalya', checkIn: '2027-06-15', nights: '7', adults: '2' });
  const { offers, dropped } = normalizeSamoItems(fixture.items, { op: operators.funsun, query });
  assert.strictEqual(offers.length, 2);
  assert.strictEqual(dropped, 5); // stop-sale, yer yox, uçuşda yer yox, naməlum valyuta, səhv məlumat
  const [a, b] = offers;
  assert.strictEqual(a.providerId, 'funsun');
  assert.strictEqual(a.destinationId, 'antalya');
  assert.strictEqual(a.itemType, 'hotel');
  assert.strictEqual(a.board, 'AI');
  const usd = require('../src/config').rates.USD; // operator məzənnəsindən hesablanır
  assert.strictEqual(a.price, Math.round(1176 / usd)); // USD → AZN
  assert.strictEqual(a.oldPrice, Math.round(1300 / usd));
  assert.strictEqual(a.currency, 'AZN');
  assert.deepStrictEqual(a.originalPrice, { amount: 1176, currency: 'USD' });
  assert.strictEqual(a.availability, 'instant');
  assert.strictEqual(a.includesFlight, true);
  assert.strictEqual(a.stars, 5);
  assert.ok(isAllowedOperatorUrl(a.url));
  assert.strictEqual(b.board, 'UAI');
  assert.strictEqual(b.price, Math.round(1000 / usd)); // CURRENCY ID 2 → USD
  assert.strictEqual(b.availability, 'request');
  // Offer sahələri mockProvider ilə eynidir
  for (const k of ['id', 'providerId', 'itemType', 'itemId', 'name', 'destinationId', 'stars', 'rating', 'tags', 'board', 'room', 'checkIn', 'nights', 'adults', 'children', 'includesFlight', 'price', 'oldPrice', 'currency', 'earlyBooking', 'availability', 'prepayment', 'freeCancelUntil', 'url']) {
    assert.ok(k in a, k);
  }
  // istiqamət müəyyən edilə bilmirsə (sorğuda bir neçə istiqamət) təklif atılır
  const multi = parseQuery({ q: 'Gürcüstan', checkIn: '2027-06-15' });
  assert.ok(multi.destinationIds.length > 1);
  assert.strictEqual(normalizeSamoItems(fixture.items, { op: operators.funsun, query: multi }).offers.length, 0);
  assert.deepStrictEqual(normalizeSamoItems('not-array', { op: operators.funsun, query }), { offers: [], dropped: 0 });
  assert.strictEqual(mapBoard('RO'), null);
  assert.strictEqual(mapBoard('Half Board'), 'HB');
});

// --- aktiv rejim (stub fetch, hipotetik API) ------------------------------------------------------

test('samoProvider aktiv rejim: stub fetch, whitelist, retry, ölçü limiti, redirect', async () => {
  const op = { ...operators.funsun, apiHosts: ['api.example.test'] };
  const env = { SAMO_FUNSUN_ENABLED: '1', SAMO_FUNSUN_API_URL: 'https://api.example.test/hypothetical', SAMO_FUNSUN_API_TOKEN: 'dummy' };
  const query = parseQuery({ q: 'Antalya', checkIn: '2027-06-15' });
  const logs = [];
  let n = 0;
  const fetchImpl = async (url, init) => {
    n++;
    assert.strictEqual(init.redirect, 'manual');
    if (n === 1) return new Response('busy', { status: 503 });
    return new Response(JSON.stringify(fixture), { status: 200 });
  };
  const p = createSamoProvider(op, {
    env, fetchImpl, sleep: async () => {}, logger: (e) => logs.push(e),
    buildRequest: (q, { cfg }) => ({ url: cfg.apiUrl, method: 'GET' }),
    parseResponse: (text) => JSON.parse(text).items,
  });
  assert.strictEqual(p.status().enabled, true);
  const offers = await p.search(query);
  assert.strictEqual(n, 2); // 503-dən sonra bir retry
  assert.strictEqual(offers.length, 2);
  assert.strictEqual(logs.at(-1).status, 'ok');
  // log-da sorğu parametrləri / token yoxdur
  assert.ok(!JSON.stringify(logs).includes('dummy') && !JSON.stringify(logs).includes('antalya'));

  // buildRequest whitelist-dən kənar URL qaytarsa → sorğu atılmır, boş nəticə
  let called = false;
  const evil = createSamoProvider(op, {
    env, fetchImpl: async () => { called = true; return new Response('[]'); }, logger: (e) => logs.push(e),
    buildRequest: () => ({ url: 'https://evil.example/steal' }), parseResponse: () => [],
  });
  assert.deepStrictEqual(await evil.search(query), []);
  assert.strictEqual(called, false);
  assert.strictEqual(logs.at(-1).code, 'host_not_allowed');

  // ölçü limiti
  await assert.rejects(
    safeFetch(op, { url: 'https://api.example.test/x' }, { fetchImpl: async () => new Response('x'.repeat(5000)), maxBytes: 1000 }),
    (e) => e.code === 'response_too_large');
  // redirect qəbul edilmir
  await assert.rejects(
    safeFetch(op, { url: 'https://api.example.test/x' }, { fetchImpl: async () => new Response('', { status: 302, headers: { location: 'https://evil.example' } }) }),
    (e) => e.code === 'redirect_refused');
  // 4xx retry olunmur
  let c4 = 0;
  await assert.rejects(
    safeFetch(op, { url: 'https://api.example.test/x' }, { fetchImpl: async () => { c4++; return new Response('', { status: 401 }); }, sleep: async () => {} }),
    (e) => e.code === 'http_401');
  assert.strictEqual(c4, 1);
  // timeout
  await assert.rejects(
    safeFetch(op, { url: 'https://api.example.test/x' }, {
      timeoutMs: 20, retries: 0,
      fetchImpl: (u, init) => new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })))),
    }),
    (e) => e.code === 'timeout');
  // http (https olmayan) qəbul edilmir
  await assert.rejects(safeFetch(op, { url: 'http://api.example.test/x' }, { fetchImpl: async () => new Response('') }), (e) => e.code === 'host_not_allowed');
});
