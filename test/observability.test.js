// Müşahidə qatı: request id, health check-lər, brauzer xətalarının qəbulu, strukturlaşdırılmış logger
// (şəxsi məlumatın maskalanması) və ixtiyari Sentry (DSN yoxdursa yüklənmir; varsa PII göndərilmir).
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-obs-'));
process.env.TRUST_PROXY = 'loopback';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const { startServer } = require('./_helpers');
const { logger, sanitize, scrubText } = require('../src/observability/logger');
const { routePath } = require('../src/observability/http');
const sentry = require('../src/observability/sentry');

let S;
let ipSeq = 0;
const ip = () => `10.33.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

test.before(async () => { S = await startServer(app); await app.locals.ready; });
test.after(async () => { await S.close(); fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true }); });

// stderr/stdout yazılarını tut (logger warn/error → stderr)
function captureStd(t) {
  const lines = [];
  for (const stream of [process.stderr, process.stdout]) {
    const orig = stream.write.bind(stream);
    t.mock.method(stream, 'write', (chunk, ...rest) => {
      const s = String(chunk);
      if (/client error|unhandled error|request/.test(s)) { lines.push(s); return true; }
      return orig(chunk, ...rest);
    });
  }
  return lines;
}

const postErr = (body, headers = {}) => fetch(`${S.base}/api/client-errors`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip(), ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

// ---------------------------------------------------------------- Request id
test('X-Request-Id: hər cavabda; təhlükəsiz gələn id qəbul olunur, təhlükəli olan əvəzlənir', async () => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  for (const p of ['/', '/api/config', '/healthz', '/api/yoxdur']) {
    const r = await fetch(S.base + p);
    assert.match(r.headers.get('x-request-id') || '', UUID, p);
  }
  const good = 'trace-ABC_123.xyz';
  assert.strictEqual((await fetch(`${S.base}/api/config`, { headers: { 'X-Request-Id': good } })).headers.get('x-request-id'), good);
  for (const bad of ['short', 'a'.repeat(65), 'abc def ghi', '<script>alert(1)</script>', 'idç-12345678']) {
    const r = await fetch(`${S.base}/api/config`, { headers: { 'X-Request-Id': encodeURI(bad) === bad ? bad : encodeURI(bad) } });
    const got = r.headers.get('x-request-id');
    assert.notStrictEqual(got, bad);
    assert.match(got, UUID);
  }
});

test('sorğu logu: metod, yol şablonu (query-siz), status, müddət; id/token seqmentləri maskalanır', async (t) => {
  const prev = require('../src/env').logLevel;
  require('../src/env').logLevel = 'info';
  t.after(() => { require('../src/env').logLevel = prev; });
  const lines = captureStd(t);
  await fetch(`${S.base}/api/config?email=gizli@example.com&q=Antalya`, { headers: { 'X-Request-Id': 'req-log-test-1' } });
  await fetch(`${S.base}/api/selections/AbCdEf123456`, { headers: { 'X-Forwarded-For': ip() } });
  await new Promise((r) => setTimeout(r, 20));
  const all = lines.join('');
  assert.match(all, /request/);
  assert.match(all, /\/api\/config/);
  assert.match(all, /req-log-/);
  assert.doesNotMatch(all, /gizli|Antalya|email=/, 'query string loglanmır');
  assert.doesNotMatch(all, /AbCdEf123456/, 'paylaşılan link id-si loglanmır');
  assert.match(all, /\/api\/selections\/:id/);
  assert.match(all, /"status":\s*200|200/);
});

test('routePath: marşrut şablonu, yoxdursa rəqəmli/uzun seqmentlər maskalanır', () => {
  assert.strictEqual(routePath({ route: { path: '/api/flights/alerts/:id' }, baseUrl: '' }), '/api/flights/alerts/:id');
  assert.strictEqual(routePath({ originalUrl: '/api/x/abc123/def?token=1' }), '/api/x/:x/def');
  assert.strictEqual(routePath({ originalUrl: `/api/${'a'.repeat(30)}` }), '/api/:x');
});

// ---------------------------------------------------------------- Health
test('/healthz və /readyz: 200, daxili detal yoxdur; başlanğıc bitməyibsə /readyz 503', async () => {
  for (const p of ['/healthz', '/readyz']) {
    const r = await fetch(S.base + p);
    assert.strictEqual(r.status, 200, p);
    assert.deepStrictEqual(await r.json(), { status: 'ok' });
    assert.strictEqual(r.headers.get('cache-control'), 'no-store');
  }
  const prev = app.locals.readyState;
  try {
    app.locals.readyState = 'pending';
    const r = await fetch(`${S.base}/readyz`);
    assert.strictEqual(r.status, 503);
    assert.deepStrictEqual(await r.json(), { status: 'unavailable' });
    assert.strictEqual((await fetch(`${S.base}/healthz`)).status, 200, 'liveness başlanğıcdan asılı deyil');
  } finally {
    app.locals.readyState = prev;
  }
});

// ---------------------------------------------------------------- Brauzer xətaları
test('POST /api/client-errors: yalnız icazəli sahələr loglanır, query/host atılır, PII maskalanır', async (t) => {
  const lines = captureStd(t);
  const r = await postErr({
    kind: 'error',
    message: 'TypeError: x is undefined (user test@example.com +994 50 123 45 67)',
    file: 'http://127.0.0.1/js/app.js?v=1#x',
    line: 12, col: 5,
    page: '/s/AbCdEf123456?ref=secret',
    extra: 'bu sahə atılmalıdır',
    formValue: 'parol123',
  });
  assert.strictEqual(r.status, 204);
  assert.strictEqual(await r.text(), '');
  const all = lines.join('');
  assert.match(all, /client error/);
  assert.match(all, /\/js\/app\.js/);
  assert.match(all, /\/s\/:id/);
  assert.doesNotMatch(all, /v=1|ref=secret|AbCdEf123456|bu sahə|parol123|test@example\.com|123 45 67/);
  assert.match(all, /t\*\*\*@example\.com/);

  const ext = captureStd(t);
  assert.strictEqual((await postErr({ message: 'boom', file: 'https://evil.example/x.js', page: 'https://evil.example/p?q=1' })).status, 204);
  assert.match(ext.join(''), /external/);
  assert.doesNotMatch(ext.join(''), /evil\.example/);
});

test('POST /api/client-errors: ölçü limiti 4 KB, format, Origin, Content-Type, rate limit', async () => {
  assert.strictEqual((await postErr({ message: 'x'.repeat(5000) })).status, 413);
  assert.strictEqual((await postErr({})).status, 400);
  assert.strictEqual((await postErr([1, 2])).status, 400);
  assert.strictEqual((await postErr({ message: 'x' }, { Origin: 'https://evil.example' })).status, 403);
  assert.strictEqual((await fetch(`${S.base}/api/client-errors`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' })).status, 415);
  const fixedIp = ip();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await postErr({ message: `e${i}` }, { 'X-Forwarded-For': fixedIp })).status);
  assert.deepStrictEqual(codes.slice(0, 10), Array(10).fill(204));
  assert.strictEqual(codes[11], 429);
});

test('errors.js bütün HTML səhifələrdə common.js-dən əvvəl qoşulub', () => {
  const pub = path.join(__dirname, '..', 'public');
  for (const f of fs.readdirSync(pub).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(pub, f), 'utf8');
    const e = html.indexOf('<script src="/js/errors.js"></script>');
    const c = html.indexOf('<script src="/js/common.js"></script>');
    assert.ok(e > -1, `${f}: errors.js yoxdur`);
    assert.ok(c === -1 || e < c, `${f}: errors.js common.js-dən sonradır`);
  }
});

// ---------------------------------------------------------------- Logger
test('logger: həssas açarlar gizlədilir, e-poçt/telefon/ad/IP maskalanır', () => {
  const out = sanitize({
    password: 'p', token: 't', cookie: 'c', authorization: 'Bearer x', csrfToken: 'y',
    email: 'aysel@example.com', phone: '+994501234567', name: 'Aysel', ip: '10.1.2.3',
    note: 'zəng: +994 50 123 45 67, e-poçt: murad@example.org',
    nested: { userEmail: 'a@b.co', list: ['x@y.com'] },
    err: new Error('Key (email)=(aysel@example.com) already exists'),
  });
  for (const k of ['password', 'token', 'cookie', 'authorization', 'csrfToken']) assert.strictEqual(out[k], '[gizli]', k);
  assert.strictEqual(out.email, 'a***@example.com');
  assert.match(out.phone, /^\*+67$/);
  assert.strictEqual(out.name, 'A***');
  assert.strictEqual(out.ip, '10.1.2.x');
  assert.doesNotMatch(out.note, /123 45 67|murad@/);
  assert.strictEqual(out.nested.userEmail, 'a***@b.co');
  assert.strictEqual(out.nested.list[0], 'x***@y.com');
  assert.doesNotMatch(out.err.message, /aysel@/);
  assert.strictEqual(scrubText('tarix 2026-11-21, müddət 1234 ms'), 'tarix 2026-11-21, müddət 1234 ms');
});

test('logger: JSON formatında level/time/msg/requestId sahələri (production formatı)', (t) => {
  const env = require('../src/env');
  const prev = { f: env.logFormat, l: env.logLevel };
  env.logFormat = 'json';
  env.logLevel = 'info';
  t.after(() => { env.logFormat = prev.f; env.logLevel = prev.l; });
  const chunks = [];
  t.mock.method(process.stdout, 'write', (c) => { chunks.push(String(c)); return true; });
  logger.runWithContext({ requestId: 'rid-json-0001' }, () => logger.info('request', { method: 'GET', email: 'z@q.io' }));
  logger.debug('görünməməlidir');
  t.mock.restoreAll();
  assert.strictEqual(chunks.length, 1);
  const e = JSON.parse(chunks[0]);
  assert.strictEqual(e.level, 'info');
  assert.strictEqual(e.msg, 'request');
  assert.strictEqual(e.requestId, 'rid-json-0001');
  assert.strictEqual(e.email, 'z***@q.io');
  assert.ok(!Number.isNaN(Date.parse(e.time)));
});

// ---------------------------------------------------------------- Sentry
test('Sentry: SENTRY_DSN yoxdursa @sentry/node yüklənmir, capture no-op-dur', async () => {
  assert.strictEqual(sentry.enabled(), false);
  assert.ok(!Object.keys(require.cache).some((k) => k.includes(`${path.sep}@sentry${path.sep}`)), '@sentry/* modulu yüklənməyib');
  sentry.captureException(new Error('x'));
  assert.strictEqual(await sentry.flush(10), true);
});

test('Sentry scrubEvent: cookie/authorization/body/query/user silinir, mətnlər maskalanır', () => {
  const ev = sentry.scrubEvent({
    user: { ip_address: '1.2.3.4', email: 'u@x.com' },
    message: 'fail for u@x.com',
    request: {
      url: 'https://etour.az/api/b2b/login?token=abc', query_string: 'token=abc', data: { password: 'p' }, cookies: { etour_sid: 's' },
      headers: { Cookie: 'etour_sid=s', Authorization: 'Bearer x', 'X-CSRF-Token': 't', 'X-Forwarded-For': '1.2.3.4', 'User-Agent': 'ua' },
    },
    exception: { values: [{ value: 'Key (email)=(u@x.com)', stacktrace: { frames: [{ vars: { password: 'p' } }] } }] },
    breadcrumbs: [{ category: 'console', message: 'u@x.com' }, { category: 'http', data: { url: 'http://h/p?q=1' } }],
  });
  assert.strictEqual(ev.user, undefined);
  assert.strictEqual(ev.request.url, 'https://etour.az/api/b2b/login');
  assert.strictEqual(ev.request.query_string, undefined);
  assert.strictEqual(ev.request.data, undefined);
  assert.strictEqual(ev.request.cookies, undefined);
  assert.deepStrictEqual(Object.keys(ev.request.headers), ['User-Agent']);
  assert.doesNotMatch(JSON.stringify(ev), /u@x\.com|"p"|etour_sid|Bearer/);
  assert.strictEqual(ev.breadcrumbs.length, 1);
  assert.strictEqual(ev.breadcrumbs[0].data.url, 'http://h/p');
});

test('Sentry (DSN ilə, lokal saxta qəbuledici): xəta göndərilir, PII yoxdur', async () => {
  const bodies = [];
  const ingest = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { bodies.push({ url: req.url, body: Buffer.concat(chunks).toString('utf8') }); res.writeHead(200).end('{}'); });
  });
  await new Promise((r) => ingest.listen(0, '127.0.0.1', r));
  const dsn = `http://publickey@127.0.0.1:${ingest.address().port}/1`;
  const script = `
    const sentry = require('./src/observability/sentry');
    if (!sentry.init()) process.exit(2);
    sentry.captureException(new Error('DB xətası: Key (email)=(gizli@example.com)'), { requestId: 'rid-sentry-001', method: 'POST', path: '/api/leads?phone=0501234567' });
    sentry.flush(5000).then((ok) => process.exit(ok ? 0 : 3));
  `;
  const code = await new Promise((resolve) => {
    const env = { ...process.env, SENTRY_DSN: dsn, NODE_ENV: 'test' };
    delete env.NODE_TEST_CONTEXT;
    const child = spawn(process.execPath, ['-e', script], { cwd: path.join(__dirname, '..'), env, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.on('exit', (c) => { if (c !== 0) console.error(err); resolve(c); });
  });
  await new Promise((r) => ingest.close(r));
  assert.strictEqual(code, 0);
  const envelope = bodies.map((b) => b.body).join('\n');
  assert.ok(bodies.some((b) => /\/api\/1\/envelope\//.test(b.url)), 'envelope endpoint-ə göndərildi');
  assert.match(envelope, /DB xətası/);
  assert.match(envelope, /rid-sentry-001/);
  assert.doesNotMatch(envelope, /gizli@example\.com|0501234567/);
});
