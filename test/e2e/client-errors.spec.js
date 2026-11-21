// E2E: brauzerdə tutulmamış xəta → public/js/errors.js → POST /api/client-errors (204).
// 1) sendBeacon yolu: cavab 204, server logunda mesaj və query-siz səhifə yolu var.
// 2) fetch(keepalive) ehtiyat yolu (sendBeacon yoxdur): göndərilən body yalnız icazəli sahələrdir, query yoxdur.
const test = require('node:test');
const assert = require('node:assert');
const { setup, openPage } = require('./_setup');

let ctx;
test.before(async () => { ctx = await setup(); });
test.after(async () => { if (ctx && ctx.close) await ctx.close(); });

const URL_PATH = '/how.html?secret=e2e-gizli#frag';

async function triggerBoth(page, tag) {
  const first = page.waitForResponse((r) => r.url().endsWith('/api/client-errors'));
  await page.evaluate((m) => { setTimeout(() => { throw new Error(m); }, 0); }, `e2e-xeta-${tag}`);
  assert.strictEqual((await first).status(), 204);
  const second = page.waitForResponse((r) => r.url().endsWith('/api/client-errors'));
  await page.evaluate((m) => { Promise.reject(new Error(m)); }, `e2e-reject-${tag}`);
  assert.strictEqual((await second).status(), 204);
}

test('errors.js (sendBeacon): xəta və unhandledrejection serverə çatır, logda query yoxdur', async (t) => {
  if (ctx.skip) return t.skip(ctx.skip);
  const { page, context } = await openPage(ctx);
  t.after(() => context.close());
  await page.goto(ctx.app.base + URL_PATH, { waitUntil: 'networkidle' });
  await triggerBoth(page, 'beacon');
  await new Promise((r) => setTimeout(r, 100));
  const log = ctx.app.output();
  assert.match(log, /client error/);
  assert.match(log, /e2e-xeta-beacon/);
  assert.match(log, /e2e-reject-beacon/);
  assert.match(log, /\/how\.html/);
  assert.doesNotMatch(log, /e2e-gizli|#frag/);
  assert.deepStrictEqual(await page.evaluate(() => window.__cspViolations), [], 'CSP pozuntusu yoxdur');
});

test('errors.js (fetch keepalive ehtiyat yolu): body yalnız icazəli sahələrdən ibarətdir', async (t) => {
  if (ctx.skip) return t.skip(ctx.skip);
  const { page, context, problems } = await openPage(ctx);
  t.after(() => context.close());
  await page.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'sendBeacon', { value: undefined, configurable: true }); });
  await page.goto(ctx.app.base + URL_PATH, { waitUntil: 'networkidle' });
  await triggerBoth(page, 'fetch');
  const bodies = problems.clientErrors.map((b) => JSON.parse(b));
  assert.strictEqual(bodies.length, 2);
  assert.strictEqual(bodies[0].kind, 'error');
  assert.match(bodies[0].message, /e2e-xeta-fetch/);
  assert.strictEqual(bodies[0].page, '/how.html');
  assert.strictEqual(bodies[1].kind, 'unhandledrejection');
  for (const b of bodies) {
    assert.deepStrictEqual(Object.keys(b).sort(), ['col', 'file', 'kind', 'line', 'message', 'page']);
    assert.ok(!JSON.stringify(b).includes('e2e-gizli'), 'query string göndərilmir');
    assert.ok(Buffer.byteLength(JSON.stringify(b)) <= 4096);
  }
  assert.deepStrictEqual(await page.evaluate(() => window.__cspViolations), [], 'CSP pozuntusu yoxdur');
});
