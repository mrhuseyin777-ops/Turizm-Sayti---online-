// Hüquqi səhifələr (privacy/terms), razılıq mətni, footer linkləri, robots.txt / sitemap.xml
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const app = require('../server');
const { startServer } = require('./_helpers');

const PUB = path.join(__dirname, '..', 'public');
const read = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');
const LANGS = ['az', 'en', 'ru'];

function loadI18n(extra = []) {
  const ctx = vm.createContext({
    localStorage: { getItem: () => null, setItem() {} },
    document: { addEventListener() {}, querySelector: () => null },
  });
  vm.runInContext(read('js/common.js') + ';this.I18N=I18N;this.consentHtml=consentHtml;this.t=t;this.setLangRaw=(l)=>{LANG=l;};', ctx);
  // legal.js sonunda DOM-a toxunan init var — yalnız I18N hissəsini icra edirik
  for (const f of extra) vm.runInContext(read(f).split('\n(async function')[0], ctx);
  return ctx;
}

function assertCspSafe(f, html) {
  assert.ok(!/<style[\s>]/i.test(html), `${f}: <style> bloku`);
  assert.ok(!/\son[a-z]+\s*=/i.test(html), `${f}: inline hadisə atributu`);
  assert.ok(!/javascript:/i.test(html), `${f}: javascript: URL`);
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    assert.match(attrs, /src="\/js\/[a-z0-9-]+\.js"/, `${f}: script yalnız /js/*.js`);
    assert.strictEqual(body.trim(), '', `${f}: inline script`);
  }
  for (const [, href] of html.matchAll(/<link[^>]+href="([^"]+)"/gi)) assert.ok(href.startsWith('/'), `${f}: xarici resurs ${href}`);
}

test('privacy.html və terms.html: mövcuddur, CSP uyğun, i18n açarları 3 dildə, hüquqşünas qeydi, mündəricat', () => {
  const ctx = loadI18n(['js/legal.js']);
  for (const f of ['privacy.html', 'terms.html']) {
    const html = read(f);
    assertCspSafe(f, html);
    assert.ok(html.includes('<script src="/js/common.js"></script>') && html.includes('<script src="/js/legal.js"></script>'), f);
    const keys = [...html.matchAll(/data-i18n="([a-z0-9_]+)"/g)].map((m) => m[1]);
    assert.ok(keys.length > 30, `${f}: açar sayı ${keys.length}`);
    for (const k of keys) for (const l of LANGS) assert.ok(ctx.I18N[l][k], `${f}: ${l}.${k}`);
    // Mündəricat linkləri mövcud bölmələrə aparır
    const toc = html.split('legal-toc')[1].split('</nav>')[0];
    for (const [, id] of toc.matchAll(/href="#([a-z0-9-]+)"/g)) assert.ok(html.includes(`<section id="${id}"`), `${f}: #${id}`);
    assert.match(html, /<meta name="description" content="[^"]{30,}">/);
    assert.match(html, /property="og:title"/);
  }
  for (const l of LANGS) {
    assert.ok(ctx.I18N[l].pv_draft.includes('[') && ctx.I18N[l].tm_draft.includes('['), `${l}: placeholder izahı`);
  }
  const az = ctx.I18N.az;
  assert.match(az.pv_draft, /Fərdi məlumatlar haqqında/);
  assert.match(az.pv_draft, /hüquqşünas/);
  assert.match(az.tm_draft, /hüquqşünas/);
  // Konkret maddə nömrəsi uydurulmayıb
  for (const l of LANGS) for (const [k, v] of Object.entries(ctx.I18N[l])) {
    if (/^(pv|tm|lg)_/.test(k)) assert.ok(!/(maddə|madd[əe]si|article|статья|статьи)\s*\d/i.test(v), `${l}.${k}: maddə nömrəsi`);
  }
  // Koda uyğun məzmun: placeholder-lər, cookie, saxlama, IP
  assert.match(az.pv_controller_p1, /\[Şirkətin hüquqi adı\]/);
  assert.match(az.pv_controller_p1, /\[VÖEN\]/);
  assert.match(az.pv_cookies_p1, /etour_sid/);
  assert.match(az.pv_cookies_p2, /Reklam, analitika/);
  assert.match(az.pv_retention_li1, /180/);
  assert.match(az.pv_retention_li1, /konfiqurasiya/);
  assert.match(az.pv_data_li4, /maskalanmış/);
  assert.match(az.pv_transfer_p1, /\[Hostinq ölkəsi\]/);
  assert.match(az.tm_service_p1, /satmırıq/);
  assert.match(az.tm_obligations_li2, /scraping/);
  assert.match(az.tm_law_p1, /hüquqşünas/);
  assert.ok(read('terms.html').includes('<section id="b2b"'), 'B2B bölməsi (b2b.html linki #b2b)');
});

test('cookie bəyanatı kodla uyğundur: sessiya cookie adı src/auth/sessions.js ilə eyni', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'auth', 'sessions.js'), 'utf8');
  assert.match(src, /'__Host-etour_sid' : 'etour_sid'/);
  assert.match(src, /HttpOnly/);
  assert.match(src, /SameSite=Strict/);
});

test('razılıq mətni: bütün müraciət formalarında, linki yeni tabda, 3 dildə, esc ilə', () => {
  const ctx = loadI18n();
  for (const l of LANGS) for (const k of ['consent_pre', 'consent_link', 'consent_post', 'ft_privacy', 'ft_terms', 'how_link', 'b2b_terms_pre', 'b2b_terms_link', 'b2b_terms_post']) {
    assert.ok(typeof ctx.I18N[l][k] === 'string' && ctx.I18N[l][k].length, `${l}.${k}`);
  }
  const html = ctx.consentHtml();
  assert.match(html, /^<p class="consent">Göndərməklə <a href="\/privacy\.html" target="_blank" rel="noopener noreferrer">Məxfilik siyasəti<\/a> ilə tanış olduğunuzu təsdiqləyirsiniz\.<\/p>$/);
  assert.ok(!/type="checkbox"/.test(html), 'checkbox deyil — informasiya mətni');
  ctx.setLangRaw('en');
  assert.match(ctx.consentHtml(), /Privacy policy/);
  ctx.setLangRaw('ru');
  assert.match(ctx.consentHtml(), /Политикой конфиденциальности/);

  // Hər forma şablonunda (form açılışı ilə </form> arasında) consentHtml() çağırılır
  const forms = [
    ['js/common.js', 'class="callback"'], // "Sizə zəng edək" (ana səhifə + boş nəticə)
    ['js/app.js', 'id="leadForm"'], // tur/otel müraciəti (otel detal pəncərəsi də openLead istifadə edir)
    ['js/flights.js', 'id="reqForm"'],
    ['js/flights.js', 'id="watchForm"'], // "Qiyməti izlə"
    ['js/cars.js', 'id="leadForm"'],
    ['js/s.js', 'id="wantForm"'], // "Bu variantı istəyirəm"
  ];
  for (const [f, marker] of forms) {
    const src = read(f);
    const i = src.indexOf(marker);
    assert.ok(i > 0, `${f}: ${marker}`);
    const chunk = src.slice(i, src.indexOf('</form>', i));
    assert.ok(chunk.includes('${consentHtml()}'), `${f} ${marker}: razılıq mətni yoxdur`);
  }
  // Otel detal pəncərəsindəki "müraciət" düyməsi eyni openLead-i çağırır
  assert.ok((read('js/app.js').match(/openLead\(/g) || []).length >= 3);
  // Bütün /api/leads, /api/flights/requests, /api/flights/alerts, /api/cars/requests göndərən JS faylları yoxlanılıb
  for (const f of fs.readdirSync(path.join(PUB, 'js'))) {
    const src = read('js/' + f);
    if (/\/api\/(leads|flights\/requests|flights\/alerts|cars\/requests)'/.test(src) && f !== 'b2b.js') {
      assert.ok(src.includes('consentHtml()'), `${f}: müraciət göndərir, amma razılıq mətni yoxdur`);
    }
  }
});

test('footer: bütün public səhifələrdə Məxfilik · Şərtlər · Necə işləyirik linkləri; B2B girişində şərtlər linki; meta teqlər', () => {
  const ctx = loadI18n(['js/legal.js']);
  const pages = ['index.html', 'flights.html', 'cars.html', 'b2b.html', 'how.html', 's.html', 'gallery-demo.html', 'privacy.html', 'terms.html'];
  for (const f of pages) {
    const html = read(f);
    assertCspSafe(f, html);
    const foot = (html.split('<footer')[1] || '').split('</footer>')[0];
    assert.ok(foot, `${f}: footer yoxdur`);
    for (const [href, key] of [['/privacy.html', 'ft_privacy'], ['/terms.html', 'ft_terms'], ['/how.html', 'how_link']]) {
      assert.ok(foot.includes(`href="${href}" data-i18n="${key}"`), `${f}: footer ${href}`);
    }
    for (const k of [...html.matchAll(/data-i18n="([a-z0-9_]+)"/g)].map((m) => m[1]).filter((k) => /^(ft_|b2b_terms|lg_|pv_|tm_|consent)/.test(k))) {
      for (const l of LANGS) assert.ok(ctx.I18N[l][k], `${f}: ${l}.${k}`);
    }
    assert.match(html, /<meta name="description" content="[^"]+">/, `${f}: description`);
    for (const p of ['og:title', 'og:description', 'og:type']) assert.match(html, new RegExp(`<meta property="${p}" content="[^"]+">`), `${f}: ${p}`);
  }
  const b2b = read('b2b.html');
  const login = b2b.split('id="loginForm"')[1].split('</form>')[0];
  assert.match(login, /href="\/terms\.html#b2b" target="_blank" rel="noopener noreferrer"/);
});

test('robots.txt və sitemap.xml: PUBLIC_BASE_URL olmadan sitemap 404, robots-da /api/ disallow; Host başlığına etibar yoxdur', async (t) => {
  const prev = process.env.PUBLIC_BASE_URL;
  const s = await startServer(app);
  t.after(async () => { if (prev === undefined) delete process.env.PUBLIC_BASE_URL; else process.env.PUBLIC_BASE_URL = prev; await s.close(); });

  delete process.env.PUBLIC_BASE_URL;
  let r = await fetch(`${s.base}/robots.txt`, { headers: { Host: 'evil.example' } });
  assert.strictEqual(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/plain/);
  let body = await r.text();
  for (const p of ['/api/', '/b2b', '/s/']) assert.ok(body.split('\n').includes(`Disallow: ${p}`), p);
  assert.ok(body.includes('Allow: /'));
  assert.ok(!/Sitemap:/i.test(body), 'PUBLIC_BASE_URL olmadan Sitemap sətiri olmamalıdır');
  assert.ok(!body.includes('evil.example'));
  assert.ok(r.headers.get('content-security-policy'), 'təhlükəsizlik başlıqları');

  r = await fetch(`${s.base}/sitemap.xml`, { headers: { Host: 'evil.example' } });
  assert.strictEqual(r.status, 404);

  // Yanlış dəyər → təyin olunmamış kimi
  process.env.PUBLIC_BASE_URL = 'javascript:alert(1)';
  assert.strictEqual((await fetch(`${s.base}/sitemap.xml`)).status, 404);

  process.env.PUBLIC_BASE_URL = 'https://etour.example/';
  r = await fetch(`${s.base}/robots.txt`, { headers: { Host: 'evil.example' } });
  body = await r.text();
  assert.ok(body.includes('Sitemap: https://etour.example/sitemap.xml'));
  assert.ok(!body.includes('evil.example'));
  r = await fetch(`${s.base}/sitemap.xml`, { headers: { Host: 'evil.example' } });
  assert.strictEqual(r.status, 200);
  assert.match(r.headers.get('content-type'), /xml/);
  body = await r.text();
  assert.match(body, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  for (const p of ['/', '/flights.html', '/cars.html', '/how.html', '/privacy.html', '/terms.html']) assert.ok(body.includes(`<loc>https://etour.example${p}</loc>`), p);
  assert.ok(!body.includes('/b2b') && !body.includes('/s/') && !body.includes('evil.example'));

  // Statik robots.txt faylı yoxdur (marşrut onu kölgələməsin deyə)
  assert.ok(!fs.existsSync(path.join(PUB, 'robots.txt')));
  assert.ok(!fs.existsSync(path.join(PUB, 'sitemap.xml')));
});

test('privacy.html və terms.html serverdən CSP başlığı ilə verilir', async (t) => {
  const s = await startServer(app);
  t.after(() => s.close());
  for (const p of ['/privacy.html', '/terms.html', '/js/legal.js']) {
    const r = await fetch(s.base + p);
    assert.strictEqual(r.status, 200, p);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'/);
  }
});
