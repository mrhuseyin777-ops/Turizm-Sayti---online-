// E2E (B2C): ana səhifə axtarışı, aviabilet, avtomobil, statik səhifələr — 390px mobil görünüşdə.
// Hər səhifədə: JS/konsol xətası yox, CSP pozuntusu yox, /api/client-errors bildirişi yox, üfüqi scroll yox.
const test = require('node:test');
const assert = require('node:assert');
const { setup, openPage, assertClean } = require('./_setup');

let ctx;
test.before(async () => { ctx = await setup(); });
test.after(async () => { if (ctx && ctx.close) await ctx.close(); });

const skipIf = (t) => { if (ctx.skip) { t.skip(ctx.skip); return true; } return false; };

test('ana səhifə: populyar istiqamət → axtarış nəticələri (kartlar)', async (t) => {
  if (skipIf(t)) return;
  const { page, context, problems } = await openPage(ctx);
  t.after(() => context.close());
  await page.goto(`${ctx.app.base}/`, { waitUntil: 'networkidle' });
  await assertClean(assert, page, problems, 'ana səhifə (ilk açılış)');
  await page.click('.popular [data-q="antalya"]');
  await page.waitForSelector('#results article.card', { timeout: 15000 });
  assert.ok(await page.locator('#results article.card').count() > 0, 'nəticə kartları var');
  assert.strictEqual(await page.isVisible('#resultsLayout'), true);
  await page.waitForLoadState('networkidle');
  await assertClean(assert, page, problems, 'ana səhifə (nəticələr)');
});

test('aviabilet: populyar marşrut → nəticələr', async (t) => {
  if (skipIf(t)) return;
  const { page, context, problems } = await openPage(ctx);
  t.after(() => context.close());
  await page.goto(`${ctx.app.base}/flights.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.fl-popular [data-from]', { timeout: 10000 });
  await page.click('.fl-popular [data-from]');
  await page.waitForSelector('#results article.fl-card', { timeout: 15000 });
  assert.ok(await page.locator('#results article.fl-card').count() > 0, 'uçuş kartları var');
  await page.waitForLoadState('networkidle');
  await assertClean(assert, page, problems, 'aviabilet');
});

test('avtomobil: götürmə yeri (URL parametri) → icarə nəticələri', async (t) => {
  if (skipIf(t)) return;
  const { page, context, problems } = await openPage(ctx);
  t.after(() => context.close());
  await page.goto(`${ctx.app.base}/cars.html`, { waitUntil: 'networkidle' });
  await assertClean(assert, page, problems, 'avtomobil (ilk açılış)');
  await page.goto(`${ctx.app.base}/cars.html?loc=antalya`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#results article.car-card', { timeout: 15000 });
  assert.ok(await page.locator('#results article.car-card').count() > 0, 'avtomobil kartları var');
  await assertClean(assert, page, problems, 'avtomobil (nəticələr)');
});

test('statik səhifələr: how / privacy / terms', async (t) => {
  if (skipIf(t)) return;
  for (const p of ['/how.html', '/privacy.html', '/terms.html']) {
    const { page, context, problems } = await openPage(ctx);
    try {
      const res = await page.goto(ctx.app.base + p, { waitUntil: 'networkidle' });
      assert.strictEqual(res.status(), 200, p);
      assert.ok((await page.locator('h1, h2').count()) > 0, `${p}: başlıq var`);
      assert.ok((await page.textContent('body')).trim().length > 200, `${p}: mətn render olunub`);
      await assertClean(assert, page, problems, p);
    } finally {
      await context.close();
    }
  }
});
