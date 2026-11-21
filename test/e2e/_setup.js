// E2E köməkçiləri (spec faylı deyil). Playwright-ın öz test runner-i istifadə olunmur: node:test + require('playwright').
// Playwright layihənin asılılığı DEYİL:
//   - mühitdə varsa (NODE_PATH və ya CI-də `npm install --no-save playwright@<versiya>`) testlər işləyir;
//   - modul tapılmırsa testlər SKIP olunur; brauzer açılmırsa skip (CI=true olanda isə xəta).
// Server ayrıca prosesdə, təsadüfi boş portda, yaddaş rejimində və müvəqqəti demo B2B hesabı ilə açılır.
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    return null;
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function startApp() {
  const port = await freePort();
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etour-e2e-'));
  const demo = { user: 'e2e-demo', password: `E2e-${crypto.randomBytes(12).toString('hex')}` };
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(port),
    HOST: '127.0.0.1',
    TURTAP_DATA_DIR: dataDir,
    DATABASE_URL: '',
    DATA_CLEANUP: '0',
    LOG_LEVEL: process.env.E2E_LOG_LEVEL || 'warn',
    SENTRY_DSN: '',
    B2B_DEMO_USER: demo.user,
    B2B_DEMO_PASSWORD: demo.password,
  };
  delete env.NODE_TEST_CONTEXT;
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15000;
  for (;;) {
    if (child.exitCode !== null) throw new Error(`server dayandı:\n${output}`);
    try {
      const r = await fetch(`${base}/readyz`);
      if (r.ok) break;
    } catch { /* hələ açılmayıb */ }
    if (Date.now() > deadline) { child.kill('SIGTERM'); throw new Error(`server açılmadı:\n${output}`); }
    await new Promise((r) => setTimeout(r, 100));
  }
  const stop = () => new Promise((resolve) => {
    const done = () => { fs.rmSync(dataDir, { recursive: true, force: true }); resolve(); };
    if (child.exitCode !== null) return done();
    child.once('exit', done);
    child.kill('SIGTERM');
    setTimeout(() => { if (child.exitCode === null) child.kill('SIGKILL'); }, 5000).unref();
  });
  return { base, demo, stop, output: () => output };
}

// Hər test faylı üçün: server + brauzer. Playwright yoxdursa { skip: '<səbəb>' }.
async function setup() {
  const pw = loadPlaywright();
  if (!pw) return { skip: 'playwright modulu tapılmadı (NODE_PATH və ya `npm install --no-save playwright`)' };
  let browser;
  try {
    browser = await pw.chromium.launch({ headless: true });
  } catch (e) {
    if (process.env.CI) throw e;
    return { skip: `Chromium açılmadı: ${String(e.message).split('\n')[0]}` };
  }
  let app;
  try {
    app = await startApp();
  } catch (e) {
    await browser.close();
    throw e;
  }
  return {
    browser,
    app,
    async close() {
      await browser.close().catch(() => {});
      await app.stop();
    },
  };
}

// Mobil (390px) səhifə: konsol xətaları, səhifə xətaları, CSP pozuntuları və /api/client-errors bildirişləri toplanır
async function openPage(ctx, { width = 390, height = 844 } = {}) {
  const context = await ctx.browser.newContext({ viewport: { width, height }, locale: 'az-AZ' });
  const page = await context.newPage();
  const problems = { console: [], pageErrors: [], csp: [], clientErrors: [] };
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI || ''}`.trim());
    });
  });
  page.on('console', (m) => { if (m.type() === 'error') problems.console.push(m.text()); });
  page.on('pageerror', (e) => problems.pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('request', (r) => {
    if (!r.url().endsWith('/api/client-errors')) return;
    const buf = r.postDataBuffer();
    problems.clientErrors.push(buf ? buf.toString('utf8') : '');
  });
  return { page, context, problems };
}

// Səhifədə problem olmadığını və 390px-də üfüqi scroll olmadığını yoxla
async function assertClean(assert, page, problems, label) {
  const csp = await page.evaluate(() => window.__cspViolations || []);
  assert.deepStrictEqual(problems.pageErrors, [], `${label}: JS xətası`);
  assert.deepStrictEqual(problems.console, [], `${label}: konsol xətası`);
  assert.deepStrictEqual(csp, [], `${label}: CSP pozuntusu`);
  assert.deepStrictEqual(problems.clientErrors, [], `${label}: brauzer xətası bildirildi`);
  const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert.ok(sw <= cw + 1, `${label}: üfüqi scroll var (scrollWidth ${sw} > ${cw})`);
}

module.exports = { setup, openPage, assertClean, loadPlaywright, startApp };
