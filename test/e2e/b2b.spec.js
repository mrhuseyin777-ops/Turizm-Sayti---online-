// E2E (B2B): demo hesabla giriş → axtarış → otel × operator matrisi; 390px-də xəta/CSP/üfüqi scroll yoxdur.
// Demo hesab yalnız bu test serveri üçün yaddaşda yaradılır (parol hər işə salınmada təsadüfi).
const test = require('node:test');
const assert = require('node:assert');
const { setup, openPage, assertClean } = require('./_setup');

let ctx;
test.before(async () => { ctx = await setup(); });
test.after(async () => { if (ctx && ctx.close) await ctx.close(); });

test('B2B: demo hesabla giriş → axtarış → nəticə cədvəli', async (t) => {
  if (ctx.skip) return t.skip(ctx.skip);
  const { page, context, problems } = await openPage(ctx);
  t.after(() => context.close());
  await page.goto(`${ctx.app.base}/b2b`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#loginForm', { state: 'visible' });
  // Yanlış parol: xəta mesajı, giriş yoxdur (401 cavabı brauzer konsolunda "Failed to load resource" kimi düşür)
  await page.fill('#loginForm [name="username"]', ctx.app.demo.user);
  await page.fill('#loginForm [name="password"]', 'yanlis-parol-123456');
  await page.click('#loginBtn');
  await page.waitForFunction(() => document.querySelector('#loginErr').textContent.trim().length > 0);
  assert.strictEqual(await page.isVisible('#appView'), false);
  problems.console.length = 0; // gözlənilən 401 resurs xətası

  await page.fill('#loginForm [name="password"]', ctx.app.demo.password);
  await page.click('#loginBtn');
  await page.waitForSelector('#appView', { state: 'visible', timeout: 10000 });
  await page.fill('#dest', 'Antalya');
  await page.click('#b2bForm button.btn.primary');
  await page.waitForSelector('#tableWrap table.grid', { timeout: 15000 });
  assert.ok(await page.locator('#tableWrap table.grid tbody tr').count() > 0, 'matris sətirləri var');
  await page.waitForLoadState('networkidle');
  await assertClean(assert, page, problems, 'B2B');
});
