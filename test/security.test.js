// Təhlükəsizlik testləri: başlıqlar/CSP, rate limit, B2B autentifikasiya (brute-force, sessiya,
// IDOR), CSRF/Origin, XSS escape, body limiti, prototype pollution, honeypot, log maskalanması.
// App port açmadan (app.listen(0) + fetch) test olunur; heç bir xarici asılılıq yoxdur.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

// Server yüklənməzdən ƏVVƏL: müvəqqəti data qovluğu (repo data/-ya yazılmasın) və
// loopback proxy-yə etibar (hər test X-Forwarded-For ilə ayrıca "IP" istifadə edir).
process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-sec-'));
process.env.TRUST_PROXY = 'loopback';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const { startServer, createAccount, login, client, future } = require('./_helpers');
const { hashPassword, verifyPassword, checkPolicy } = require('../src/auth/password');
const sessions = require('../src/auth/sessions');
const { getStore } = require('../src/auth');
const { leads } = require('../src/leads');
const { parseQueryString, maskPhone, maskEmail, maskIp } = require('../src/security/http');

let S; // { base, close }
let ipSeq = 0;
const ip = () => `10.9.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`; // hər çağırış — yeni "klient IP"
const PW = 'Guclu-Parol-2026!';

test.before(async () => { S = await startServer(app); });
test.after(async () => { await S.close(); fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true }); });

// ---------------------------------------------------------------- Başlıqlar və CSP
test('təhlükəsizlik başlıqları: CSP, nosniff, frame-ancestors, Referrer/Permissions-Policy, COOP', async () => {
  for (const p of ['/', '/b2b', '/flights.html', '/api/config']) {
    const r = await fetch(S.base + p, { headers: { 'X-Forwarded-For': ip() } });
    assert.strictEqual(r.status, 200, p);
    const csp = r.headers.get('content-security-policy');
    assert.ok(csp, `${p}: CSP yoxdur`);
    const dir = Object.fromEntries(csp.split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
    assert.deepStrictEqual(dir['script-src'], ["'self'"], 'script-src yalnız self');
    assert.deepStrictEqual(dir['frame-ancestors'], ["'none'"]);
    assert.deepStrictEqual(dir['object-src'], ["'none'"]);
    assert.deepStrictEqual(dir['base-uri'], ["'none'"]);
    assert.ok(!dir['style-src'].includes("'unsafe-inline'"), 'style-src-də unsafe-inline yoxdur (yalnız style-src-attr)');
    assert.ok(!csp.includes('unsafe-eval'));
    assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(r.headers.get('x-frame-options'), 'DENY');
    assert.ok(r.headers.get('referrer-policy'));
    assert.match(r.headers.get('permissions-policy'), /camera=\(\)/);
    assert.strictEqual(r.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.strictEqual(r.headers.get('x-powered-by'), null, 'x-powered-by söndürülüb');
    assert.strictEqual(r.headers.get('strict-transport-security'), null, 'HSTS yalnız production + HTTPS');
  }
  const api = await fetch(S.base + '/api/config');
  assert.strictEqual(api.headers.get('cache-control'), 'no-store');
  assert.strictEqual((await fetch(S.base + '/b2b')).headers.get('referrer-policy'), 'no-referrer');
});

test('HTML/JS: inline <script>, inline hadisə atributları, eval yoxdur (CSP ilə uyğunluq)', () => {
  const pub = path.join(__dirname, '..', 'public');
  for (const f of fs.readdirSync(pub).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(pub, f), 'utf8');
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(m[1], /\bsrc="\/js\/[\w-]+\.js"/, `${f}: inline script`);
      assert.strictEqual(m[2].trim(), '', `${f}: inline script məzmunu`);
    }
    assert.ok(!/\son[a-z]+\s*=/i.test(html), `${f}: inline hadisə atributu (onclick= və s.)`);
    assert.ok(!/javascript:/i.test(html), `${f}: javascript: URL`);
    assert.ok(!/<style\b/i.test(html), `${f}: <style> bloku (CSP style-src 'self')`);
  }
  const jsDir = path.join(pub, 'js');
  for (const f of fs.readdirSync(jsDir)) {
    const js = fs.readFileSync(path.join(jsDir, f), 'utf8');
    assert.ok(!/\beval\s*\(|new Function\s*\(|setTimeout\(\s*['"`]/.test(js), `${f}: eval/new Function`);
    assert.ok(!/\son[a-z]+=\\?["'`]/i.test(js), `${f}: şablonda inline hadisə atributu`);
    assert.ok(!/target="_blank"(?![^>]*rel="noopener noreferrer")/.test(js), `${f}: target=_blank rel="noopener noreferrer" olmadan`);
    assert.ok(!/b2bSession['"],\s*\{|store\.get\('b2bSession'/.test(js), `${f}: localStorage b2bSession-a etibar`);
  }
});

// ---------------------------------------------------------------- Body, 404, xətalar
test('böyük body → 413, yanlış JSON → 400 (stack yox), text/plain → 415, 404 JSON', async () => {
  const big = JSON.stringify({ name: 'A', note: 'x'.repeat(100 * 1024) });
  const r1 = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: big });
  assert.strictEqual(r1.status, 413);
  assert.deepStrictEqual(Object.keys(await r1.json()), ['error']);

  const r2 = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: '{"name": "A",' });
  assert.strictEqual(r2.status, 400);
  const t2 = await r2.text();
  assert.ok(!/at .*\.js:\d+|node_modules|SyntaxError/.test(t2), 'stack/daxili detal sızmır: ' + t2);

  const r3 = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'text/plain', 'X-Forwarded-For': ip() }, body: 'name=A&phone=1' });
  assert.strictEqual(r3.status, 415);
  // HTML forması (CSRF klassik vektoru) da rədd edilir
  const r3b = await fetch(S.base + '/api/b2b/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Forwarded-For': ip() }, body: 'username=a&password=b' });
  assert.strictEqual(r3b.status, 415);

  const r4 = await fetch(S.base + '/api/yoxdur');
  assert.strictEqual(r4.status, 404);
  assert.match(r4.headers.get('content-type'), /application\/json/);
  assert.strictEqual((await fetch(S.base + '/../../etc/passwd')).status, 404);
  assert.strictEqual((await fetch(S.base + '/s/..%2F..%2Fserver.js')).status, 404);
  assert.strictEqual((await fetch(S.base + '/.env')).status, 404);
});

// ---------------------------------------------------------------- Prototype pollution / HPP
test('prototype pollution: body və query-də __proto__/constructor rədd edilir və ya atılır', async () => {
  const h = { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() };
  for (const body of [
    '{"__proto__":{"polluted":"yes"},"name":"Test","phone":"+994501112233"}',
    '{"name":"Test","phone":"+994501112233","x":{"constructor":{"prototype":{"polluted":"yes"}}}}',
    JSON.stringify({ a: { b: { c: { d: { e: { f: { g: { h: 1 } } } } } } } }), // həddən dərin
  ]) {
    const r = await fetch(S.base + '/api/leads', { method: 'POST', headers: h, body });
    assert.strictEqual(r.status, 400, body);
  }
  const q = await fetch(`${S.base}/api/search?__proto__[polluted]=yes&constructor[prototype][polluted]=yes&q=Antalya&checkIn=${future(30)}&type=hotel&type=tour`);
  assert.strictEqual(q.status, 200);
  assert.strictEqual(({}).polluted, undefined);
  assert.strictEqual(Object.prototype.polluted, undefined);
  assert.strictEqual((await q.json()).query.type, 'hotel', 'təkrarlanan parametrdə birincisi (HPP)');

  const parsed = parseQueryString('a=1&a=2&b[c]=3&__proto__=x&constructor=y&' + 'k=v&'.repeat(100));
  assert.strictEqual(parsed.a, '1');
  assert.strictEqual(parsed['b[c]'], '3', 'iç-içə obyekt yaradılmır');
  assert.strictEqual(Object.getPrototypeOf(parsed), Object.prototype);
  assert.ok(!Object.prototype.hasOwnProperty.call(parsed, '__proto__'));
  assert.ok(!Object.prototype.hasOwnProperty.call(parsed, 'constructor'));
  assert.ok(Object.keys(parsed).length <= 60);
});

// ---------------------------------------------------------------- Rate limit
test('rate limit: lead endpoint-i IP üzrə 20/10 dəq, sonra 429 + Retry-After; başqa IP təsirlənmir', async () => {
  const me = ip();
  const send = (addr) => fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': addr }, body: JSON.stringify({ type: 'callback', name: 'Limit', phone: '+994501112233' }) });
  for (let i = 0; i < 20; i++) assert.strictEqual((await send(me)).status, 201, `sorğu ${i + 1}`);
  const blocked = await send(me);
  assert.strictEqual(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.strictEqual((await send(ip())).status, 201);
});

test('rate limit: axtarış endpoint-i dəqiqədə 60 sorğu', async () => {
  const me = ip();
  let last;
  for (let i = 0; i < 61; i++) last = await fetch(`${S.base}/api/suggest?q=a`, { headers: { 'X-Forwarded-For': me } }).then(() => fetch(`${S.base}/api/explore?checkIn=bad`, { headers: { 'X-Forwarded-For': me } }));
  assert.strictEqual(last.status, 429);
});

// ---------------------------------------------------------------- Parol hash-i
test('parol: scrypt + duz, timing-safe yoxlama, siyasət', async () => {
  const h1 = await hashPassword(PW);
  const h2 = await hashPassword(PW);
  assert.match(h1, /^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.notStrictEqual(h1, h2, 'hər hash-in öz duzu var');
  assert.ok(!h1.includes(PW));
  assert.strictEqual(await verifyPassword(PW, h1), true);
  assert.strictEqual(await verifyPassword(PW + 'x', h1), false);
  assert.strictEqual(await verifyPassword(PW, 'bcrypt$...'), false);
  assert.strictEqual(await verifyPassword('x'.repeat(10000), h1), false);
  assert.ok(checkPolicy('qisa'));
  assert.ok(checkPolicy('aaaaaaaaaaaaaaaa'));
  assert.ok(checkPolicy('ali-uzun-parol-2026', { username: 'ali' }));
  assert.strictEqual(checkPolicy(PW), null);
});

// ---------------------------------------------------------------- Autentifikasiya
test('auth: yanlış parol və mövcud olmayan istifadəçi eyni cavab (401); sessiya cookie atributları', async () => {
  await createAccount({ agency: 'Auth Agentlik', username: 'auth-user', password: PW });
  const wrong = await login(S.base, 'auth-user', 'Yanlis-Parol-2026', { 'X-Forwarded-For': ip() });
  const nouser = await login(S.base, 'yoxdur-user', 'Yanlis-Parol-2026', { 'X-Forwarded-For': ip() });
  assert.strictEqual(wrong.res.status, 401);
  assert.strictEqual(nouser.res.status, 401);
  assert.deepStrictEqual(wrong.body, nouser.body, 'istifadəçi adlarının sayılmasının qarşısı');
  assert.strictEqual(wrong.cookie, '');
  assert.strictEqual((await login(S.base, '', '', { 'X-Forwarded-For': ip() })).res.status, 400);
  assert.strictEqual((await login(S.base, { $ne: 1 }, { $ne: 1 }, { 'X-Forwarded-For': ip() })).res.status, 400);

  const ok = await login(S.base, 'AUTH-USER', PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(ok.res.status, 200);
  assert.strictEqual(ok.body.agency.name, 'Auth Agentlik');
  assert.ok(!JSON.stringify(ok.body).includes('scrypt'), 'hash cavabda yoxdur');
  const sc = ok.setCookie.find((c) => c.startsWith('etour_sid='));
  assert.match(sc, /HttpOnly/);
  assert.match(sc, /SameSite=Strict/);
  assert.match(sc, /Path=\//);
  assert.match(sc, /Max-Age=\d+/);
  assert.match(ok.cookie, /^etour_sid=[A-Za-z0-9_-]{43}$/, '256 bitlik təsadüfi id');
  assert.match(ok.csrf, /^[A-Za-z0-9_-]{43}$/);

  const me = await (await client(S.base, ok).get('/api/b2b/me')).json();
  assert.strictEqual(me.authenticated, true);
  assert.strictEqual(me.user.username, 'auth-user');
  // Sessiya id serverdə hash kimi saxlanılır
  assert.ok(![...sessions.sessions.keys()].includes(ok.cookie.split('=')[1]));
});

test('auth: sessiyasız / saxta sessiya ilə B2B API-ləri 401', async () => {
  assert.deepStrictEqual(await (await fetch(S.base + '/api/b2b/me')).json(), { authenticated: false });
  for (const cookie of [undefined, 'etour_sid=' + 'A'.repeat(43), 'etour_sid=../../x', 'etour_sid=']) {
    const c = client(S.base, { cookie });
    assert.strictEqual((await c.get('/api/b2b/leads')).status, 401);
    assert.strictEqual((await c.get('/api/b2b/leads?agency=Auth%20Agentlik')).status, 401);
    assert.strictEqual((await c.post('/api/selections', { query: {}, offerIds: ['x'] }, { 'X-Forwarded-For': ip() })).status, 401);
    assert.strictEqual((await c.post('/api/b2b/logout', {})).status, 401);
  }
});

test('brute-force: hesab üzrə 5 uğursuz cəhddən sonra (fərqli IP-lərdən belə) blok, düzgün parol da 429', async () => {
  await createAccount({ agency: 'BF Agentlik', username: 'bf-user', password: PW });
  for (let i = 0; i < 5; i++) assert.strictEqual((await login(S.base, 'bf-user', `Yanlis-${i}-parol!`, { 'X-Forwarded-For': ip() })).res.status, 401);
  const locked = await login(S.base, 'bf-user', PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(locked.res.status, 429);
  assert.strictEqual(locked.cookie, '');
  assert.ok(Number(locked.res.headers.get('retry-after')) > 0);
  // Başqa hesab təsirlənmir
  await createAccount({ agency: 'BF Agentlik', username: 'bf-other', password: PW });
  assert.strictEqual((await login(S.base, 'bf-other', PW, { 'X-Forwarded-For': ip() })).res.status, 200);
});

test('brute-force: bir IP-dən dəqiqədə 10-dan çox giriş cəhdi 429', async () => {
  const me = ip();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await login(S.base, `ip-spray-${i}`, 'Yanlis-Parol-2026', { 'X-Forwarded-For': me })).res.status);
  assert.deepStrictEqual(codes.slice(0, 10), Array(10).fill(401));
  assert.strictEqual(codes[11], 429);
});

test('sessiya: logout CSRF tələb edir, sonra cookie etibarsızdır; vaxtı bitmiş sessiya; parol dəyişəndə sessiya bitir', async () => {
  const acc = await createAccount({ agency: 'Sess Agentlik', username: 'sess-user', password: PW });
  const s1 = await login(S.base, 'sess-user', PW, { 'X-Forwarded-For': ip() });
  const c1 = client(S.base, { cookie: s1.cookie });
  assert.strictEqual((await c1.post('/api/b2b/logout', {})).status, 403, 'CSRF tokensiz logout');
  const out = await client(S.base, s1).post('/api/b2b/logout', {});
  assert.strictEqual(out.status, 200);
  assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
  assert.strictEqual((await c1.get('/api/b2b/leads')).status, 401, 'logout-dan sonra köhnə cookie işləmir');

  // Hərəkətsizlik müddəti bitib
  const s2 = await login(S.base, 'sess-user', PW, { 'X-Forwarded-For': ip() });
  for (const sess of sessions.sessions.values()) if (sess.userId === acc.user.id) sess.lastSeen -= sessions.IDLE_MS + 1000;
  assert.strictEqual((await client(S.base, s2).get('/api/b2b/leads')).status, 401);

  // Parol dəyişdi → əvvəlki sessiyalar etibarsız
  const s3 = await login(S.base, 'sess-user', PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual((await client(S.base, s3).get('/api/b2b/leads')).status, 200);
  getStore().updateUser(acc.user.id, { passwordChangedAt: new Date(Date.now() + 1000).toISOString() });
  assert.strictEqual((await client(S.base, s3).get('/api/b2b/leads')).status, 401);
  getStore().updateUser(acc.user.id, { passwordChangedAt: new Date(0).toISOString() });

  // Bloklanmış istifadəçi
  const s4 = await login(S.base, 'sess-user', PW, { 'X-Forwarded-For': ip() });
  getStore().updateUser(acc.user.id, { disabled: true });
  assert.strictEqual((await client(S.base, s4).get('/api/b2b/leads')).status, 401);
  assert.strictEqual((await login(S.base, 'sess-user', PW, { 'X-Forwarded-For': ip() })).res.status, 401);
  getStore().updateUser(acc.user.id, { disabled: false });
});

// ---------------------------------------------------------------- CSRF / Origin
test('CSRF: token yoxdursa/yanlışdırsa 403; yad Origin və cross-site Sec-Fetch-Site 403', async () => {
  await createAccount({ agency: 'CSRF Agentlik', username: 'csrf-user', password: PW });
  const s = await login(S.base, 'csrf-user', PW, { 'X-Forwarded-For': ip() });
  const body = { query: { q: 'Antalya', type: 'hotel', checkIn: future(30) }, offerIds: ['x'] };
  const noToken = client(S.base, { cookie: s.cookie });
  assert.strictEqual((await noToken.post('/api/selections', body, { 'X-Forwarded-For': ip() })).status, 403);
  assert.strictEqual((await client(S.base, { cookie: s.cookie, csrf: 'A'.repeat(43) }).post('/api/selections', body, { 'X-Forwarded-For': ip() })).status, 403);
  const c = client(S.base, s);
  assert.strictEqual((await c.post('/api/selections', body, { Origin: 'https://evil.example', 'X-Forwarded-For': ip() })).status, 403);
  assert.strictEqual((await c.post('/api/selections', body, { Origin: 'null', 'X-Forwarded-For': ip() })).status, 403);
  assert.strictEqual((await c.post('/api/selections', body, { 'Sec-Fetch-Site': 'cross-site', 'X-Forwarded-For': ip() })).status, 403);
  // Yad saytdan login (login CSRF) və lead spam da bloklanır
  assert.strictEqual((await login(S.base, 'csrf-user', PW, { Origin: 'https://evil.example', 'X-Forwarded-For': ip() })).res.status, 403);
  // Öz Origin-imiz: CSRF keçir, təklif tapılmadığı üçün 400 (qiymət serverdə yoxlanılır)
  const own = await c.post('/api/selections', body, { Origin: S.base, 'X-Forwarded-For': ip() });
  assert.strictEqual(own.status, 400);
  assert.match((await own.json()).error, /mövcud deyil/);
});

// ---------------------------------------------------------------- IDOR
test('IDOR: agentlik yalnız öz leadlərini görür; ?agency= parametri nəzərə alınmır', async () => {
  await createAccount({ agency: 'Agentlik A', username: 'idor-a', password: PW });
  await createAccount({ agency: 'Agentlik B', username: 'idor-b', password: PW });
  const a = await login(S.base, 'idor-a', PW, { 'X-Forwarded-For': ip() });
  const b = await login(S.base, 'idor-b', PW, { 'X-Forwarded-For': ip() });

  const query = { q: 'Antalya', type: 'hotel', checkIn: future(35), nights: '4', adults: '2', flat: '1' };
  const sr = await (await fetch(`${S.base}/api/search?${new URLSearchParams(query)}`, { headers: { 'X-Forwarded-For': ip() } })).json();
  const cr = await client(S.base, a).post('/api/selections', { query, offerIds: [sr.offers[0].id], markup: 10, agency: 'Agentlik B' }, { 'X-Forwarded-For': ip() });
  assert.strictEqual(cr.status, 201);
  const { id } = await cr.json();
  const pub = await (await fetch(`${S.base}/api/selections/${id}`)).json();
  assert.strictEqual(pub.agency, 'Agentlik A', 'agentlik adı body-dən yox, sessiyadan');
  assert.strictEqual(pub.items[0].clientPrice, Math.round(sr.offers[0].price * 1.1));

  const lr = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ type: 'selection', selectionId: id, itemIndex: 0, name: 'Gizli Müştəri', phone: '+994551112233' }) });
  assert.strictEqual(lr.status, 201);

  const la = await (await client(S.base, a).get('/api/b2b/leads')).json();
  assert.ok(la.leads.some((l) => l.name === 'Gizli Müştəri'));
  for (const p of ['/api/b2b/leads', '/api/b2b/leads?agency=Agentlik%20A', `/api/b2b/leads?agencyId=${getStore().findAgencyByName('Agentlik A').id}`]) {
    const lb = await (await client(S.base, b).get(p)).json();
    assert.ok(!lb.leads.some((l) => l.name === 'Gizli Müştəri'), `B agentliyi A-nın leadini görməməlidir (${p})`);
  }
});

// ---------------------------------------------------------------- XSS
test('XSS: payload-lar JSON kimi data qayıdır, frontend esc() onları zərərsizləşdirir', async () => {
  await createAccount({ agency: 'XSS <img src=x onerror=alert(1)>', username: 'xss-user', password: PW });
  const s = await login(S.base, 'xss-user', PW, { 'X-Forwarded-For': ip() });
  const query = { q: 'Dubay', type: 'hotel', checkIn: future(28), flat: '1' };
  const sr = await (await fetch(`${S.base}/api/search?${new URLSearchParams(query)}`, { headers: { 'X-Forwarded-For': ip() } })).json();
  const payloads = ['<script>alert(1)</script>', '"><svg onload=alert(1)>', "' onmouseover='alert(1)", 'javascript:alert(1)'];
  const cr = await client(S.base, s).post('/api/selections', { query, offerIds: [sr.offers[0].id], client: payloads[1], message: payloads[0] + payloads[2] }, { 'X-Forwarded-For': ip() });
  assert.strictEqual(cr.status, 201);
  const r = await fetch(`${S.base}/api/selections/${(await cr.json()).id}`);
  assert.match(r.headers.get('content-type'), /^application\/json/);
  assert.strictEqual(r.headers.get('x-content-type-options'), 'nosniff');
  const sel = await r.json();

  // public/js/common.js-dəki esc() funksiyasını real kodla yoxla
  const ctx = { localStorage: { getItem: () => null, setItem() {} }, document: { addEventListener() {}, querySelectorAll: () => [] }, location: { origin: 'https://etour.az' }, URL };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'common.js'), 'utf8') + ';this.esc=esc;this.safeUrl=safeUrl;', ctx);
  for (const v of [...payloads, sel.agency, sel.client, sel.message]) {
    const out = ctx.esc(v);
    assert.ok(!/[<>"']/.test(out), `escape olunmayıb: ${out}`);
  }
  assert.strictEqual(ctx.esc('<a href="x">'), '&lt;a href=&quot;x&quot;&gt;');
  assert.strictEqual(ctx.safeUrl('javascript:alert(1)'), '#');
  assert.strictEqual(ctx.safeUrl('data:text/html,<script>'), '#');
  assert.strictEqual(ctx.safeUrl('https://wa.me/?text=a'), 'https://wa.me/?text=a');

  // s.js agentlik/müştəri adlarını yalnız textContent ilə yazır
  const sjs = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 's.js'), 'utf8');
  assert.match(sjs, /\$\('#agency'\)\.textContent = sel\.agency/);
  assert.ok(!/innerHTML[^;]*sel\.(agency|client|manager|phone)/.test(sjs));
  assert.match(sjs, /esc\(sel\.message\)/);

  // Lead adında HTML qəbul edilmir
  const bad = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ name: '<script>alert(1)</script>', phone: '+994501112233' }) });
  assert.strictEqual(bad.status, 400);
});

// ---------------------------------------------------------------- Honeypot və loglar
test('honeypot: bot sahəsi doldurulubsa 201, amma müraciət saxlanılmır', async () => {
  const before = leads.length;
  const r = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ type: 'callback', name: 'Bot', phone: '+994501112233', website: 'http://spam.example' }) });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(leads.length, before);
  const human = await fetch(S.base + '/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ type: 'callback', name: 'İnsan', phone: '+994501112233', website: '' }) });
  assert.strictEqual(human.status, 201);
  assert.strictEqual(leads.length, before + 1);
  const cars = await fetch(S.base + '/api/cars/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip() }, body: JSON.stringify({ name: 'Bot', phone: '+994501112233', website: 'x', kind: 'rental', query: {}, offerId: 'a|b' }) });
  assert.strictEqual(cars.status, 201);
});

test('loglarda şəxsi məlumat maskalanır', () => {
  assert.ok(!maskPhone('+994 50 111 22 33').includes('501112'));
  assert.match(maskPhone('+994501112233'), /33$/);
  assert.strictEqual(maskEmail('aysel@example.com'), 'a***@example.com');
  assert.strictEqual(maskIp('192.168.1.77'), '192.168.1.x');
});

test('DoS: bir agentlik limitə çatanda yalnız ÖZ köhnə linkləri silinir', async () => {
  const { createSelection, LIMITS } = require('../src/leads');
  const store = new Map();
  const resolveOffers = async (q, ids) => ({ pax: { adults: 1, children: 0 }, offers: ids.map((id) => ({ id, name: 'O', price: 100, checkIn: future(10), nights: 3 })) });
  const prev = LIMITS.selectionsPerAgency;
  LIMITS.selectionsPerAgency = 3;
  try {
    const other = await createSelection({ query: {}, offerIds: ['a'] }, { account: { agencyId: 'ag_other', agencyName: 'Digər' }, store, resolveOffers });
    const mine = [];
    for (let i = 0; i < 6; i++) mine.push(await createSelection({ query: {}, offerIds: ['a'] }, { account: { agencyId: 'ag_spam', agencyName: 'Spam' }, store, resolveOffers }));
    assert.ok(store.has(other.id), 'başqa agentliyin linki qalır');
    assert.strictEqual([...store.values()].filter((s) => s.agencyId === 'ag_spam').length, 3);
    assert.ok(store.has(mine[5].id) && !store.has(mine[0].id));
  } finally { LIMITS.selectionsPerAgency = prev; }
});
