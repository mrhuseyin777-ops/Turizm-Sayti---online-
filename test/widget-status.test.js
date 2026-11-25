// Agentlik vidjeti (/w/<publicId>), marketplace (tərəfdaş agentlik), müraciət status səhifəsi (/r/<token>) və
// "Qiymətə nə daxildir" (includes/excludes) testləri. Şəbəkə sorğusu yoxdur (notifier stub-u).
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-widget-'));
process.env.TRUST_PROXY = 'loopback';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const { startServer, createAccount, login, future } = require('./_helpers');
const notify = require('../src/notify');
const storage = require('../src/storage');
const { normalizeFrameDomain, frameAncestors } = require('../src/widget');
const { inclusions } = require('../src/includes');
const { buildLeadMessage } = require('../src/notify/format');

const PW = 'Widget-Parol-2026!';
let S;
let ipSeq = 0;
const ip = () => `10.66.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const notified = [];

test.before(async () => {
  await app.locals.ready;
  notify.use({ leadCreated: (kind, rec) => { notified.push({ kind, rec }); return true; }, status: () => ({ telegram: false, email: false }), sendTestTelegram: async () => {} });
  S = await startServer(app);
});
test.after(async () => {
  notify.use(null);
  await S.close();
  fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
});

const http = (method, p, { cookie, csrf, body, headers = {} } = {}) => fetch(S.base + p, {
  method,
  headers: { 'X-Forwarded-For': ip(), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});
async function agency(name, username, role = 'admin') {
  const acc = await createAccount({ agency: name, username, password: PW, role });
  const l = await login(S.base, username, PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(l.res.status, 200);
  return { ...acc, s: { cookie: l.cookie, csrf: l.csrf } };
}
const cspDirs = (res) => Object.fromEntries(String(res.headers.get('content-security-policy')).split(';').map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
const Q = () => `destinationId=antalya&checkIn=${future(40)}&nights=7&adults=2`;

// ---------------------------------------------------------------- Domen validasiyası
test('domen validasiyası: normallaşdırma, rədd edilən dəyərlər, frame-ancestors dəyəri', () => {
  assert.strictEqual(normalizeFrameDomain('Agentlik.AZ'), 'https://agentlik.az');
  assert.strictEqual(normalizeFrameDomain('https://www.agentlik.az/'), 'https://www.agentlik.az');
  assert.strictEqual(normalizeFrameDomain('http://localhost:3217'), 'http://localhost:3217');
  assert.strictEqual(normalizeFrameDomain('*.agentlik.az'), 'https://*.agentlik.az');
  for (const bad of ['*', '*.az', 'az', 'https://a.az/path', 'a.az; script-src *', "'unsafe-inline'", 'javascript:alert(1)', 'a.az b.az', 'ftp://a.az', 'a.az:99999', '', 'а.az', 'data:', 'https://a.az?x=1']) {
    assert.strictEqual(normalizeFrameDomain(bad), null, bad);
  }
  assert.strictEqual(frameAncestors([]), "'self'");
  assert.strictEqual(frameAncestors(['https://a.az', 'bad value;', 'https://a.az']), "'self' https://a.az");
});

// ---------------------------------------------------------------- CSP: yalnız /w/ üçün istisna
test('CSP: /w/<id> frame-ancestors = self + icazəli domenlər, X-Frame-Options yox; digər səhifələrdə none', async () => {
  const a = await agency('Vidjet Agentlik A', 'wg_admin_a');
  let r = await http('GET', '/api/b2b/widget', a.s);
  assert.strictEqual(r.status, 200);
  const w = await r.json();
  assert.match(w.publicId, /^[A-Za-z0-9_-]{22}$/);
  assert.ok(!w.publicId.includes(a.agency.id) && !JSON.stringify(w).includes(a.agency.id), 'daxili id görünüşdə yoxdur');

  // Boş siyahı: yalnız 'self' (hər yerə icazə YOX)
  r = await http('GET', `/w/${w.publicId}`);
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual(cspDirs(r)['frame-ancestors'], ["'self'"]);
  assert.strictEqual(r.headers.get('x-frame-options'), null);
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
  assert.match(await r.text(), /\/js\/widget\.js/);

  r = await http('PUT', '/api/b2b/widget', { ...a.s, body: { domains: ['agentlik.az', 'http://localhost:3217'], markupPct: 10 } });
  assert.strictEqual(r.status, 200);
  assert.deepStrictEqual((await r.json()).widget.domains, ['https://agentlik.az', 'http://localhost:3217']);
  r = await http('GET', `/w/${w.publicId}`);
  assert.deepStrictEqual(cspDirs(r)['frame-ancestors'], ["'self'", 'https://agentlik.az', 'http://localhost:3217']);
  assert.deepStrictEqual(cspDirs(r)['script-src'], ["'self'"], 'qalan CSP dəyişmir');
  assert.strictEqual(r.headers.get('x-frame-options'), null);

  // Digər bütün səhifələr: frame-ancestors 'none' + X-Frame-Options DENY
  for (const p of ['/', '/b2b', '/index.html', '/widget.html', '/r.html', '/api/config', '/s/AAAAAAAAAAAA', `/w/${'x'.repeat(22)}`, '/w/bad', `/api/w/${w.publicId}/config`]) {
    const x = await http('GET', p);
    assert.deepStrictEqual(cspDirs(x)['frame-ancestors'], ["'none'"], p);
    assert.strictEqual(x.headers.get('x-frame-options'), 'DENY', p);
  }
  assert.strictEqual((await http('GET', `/w/${'x'.repeat(22)}`)).status, 404);

  // Yanlış domen → 400, sahə ağ siyahısı, yalnız admin, CSRF
  for (const body of [{ domains: ['a.az; script-src *'] }, { domains: ['*'] }, { domains: 'a.az' }, { domains: Array(11).fill(0).map((_, i) => `s${i}.az`) }, { markupPct: 101 }, { agencyId: 'x' }]) {
    assert.strictEqual((await http('PUT', '/api/b2b/widget', { ...a.s, body })).status, 400, JSON.stringify(body));
  }
  assert.strictEqual((await http('PUT', '/api/b2b/widget', { cookie: a.s.cookie, body: { domains: [] } })).status, 403, 'CSRF');
  assert.strictEqual((await http('GET', '/api/b2b/widget')).status, 401);
  const m = await agency('Vidjet Agentlik A', 'wg_manager_a', 'manager');
  assert.strictEqual((await http('PUT', '/api/b2b/widget', { ...m.s, body: { domains: [] } })).status, 403, 'menecer dəyişə bilməz');
  const mv = await (await http('GET', '/api/b2b/widget', m.s)).json();
  assert.strictEqual(mv.publicId, w.publicId);
  assert.strictEqual(mv.canEdit, false);

  // IDOR: başqa agentlik öz (fərqli) vidjetini görür
  const b = await agency('Vidjet Agentlik B', 'wg_admin_b');
  const wb = await (await http('GET', '/api/b2b/widget', b.s)).json();
  assert.notStrictEqual(wb.publicId, w.publicId);
  assert.deepStrictEqual(wb.domains, []);

  // Linki yenilə: köhnə id dərhal 404
  r = await http('PUT', '/api/b2b/widget', { ...b.s, body: { regenerate: true } });
  const nb = (await r.json()).widget;
  assert.notStrictEqual(nb.publicId, wb.publicId);
  assert.strictEqual((await http('GET', `/w/${wb.publicId}`)).status, 404);
  assert.strictEqual((await http('GET', `/api/w/${wb.publicId}/config`)).status, 404);
  assert.strictEqual((await http('GET', `/w/${nb.publicId}`)).status, 200);
});

// ---------------------------------------------------------------- Vidjet axtarışı və müraciət
test('vidjet: operator adı/net qiymət gizli, komissiya daxil, müraciət agentliyə düşür (source=widget) + bildiriş', async () => {
  const a = await agency('Vidjet Satış', 'wg_sales');
  const b = await agency('Vidjet Başqa', 'wg_other');
  const w = await (await http('GET', '/api/b2b/widget', a.s)).json();
  await http('PUT', '/api/b2b/widget', { ...a.s, body: { markupPct: 10 } });

  let r = await http('GET', `/api/w/${w.publicId}/config`);
  const cfg = await r.json();
  assert.strictEqual(cfg.agency.name, 'Vidjet Satış');
  assert.ok(!JSON.stringify(cfg).includes(a.agency.id));

  r = await http('GET', `/api/w/${w.publicId}/search?${Q()}&type=package`);
  assert.strictEqual(r.status, 200);
  const d = await r.json();
  assert.ok(d.offers.length > 0);
  const raw = JSON.stringify(d);
  for (const leak of ['providerName', 'providerId', 'Summer Tour', 'Funsun', 'Kompas', 'netPrice', a.agency.id, '"id"']) assert.ok(!raw.includes(leak), `sızma: ${leak}`);
  for (let i = 1; i < d.offers.length; i++) assert.ok(d.offers[i - 1].price <= d.offers[i].price, 'ucuzdan bahalıya');
  // Qiymət = net × 1.10 (B2C axtarışındakı ən ucuz qiymətlə müqayisə)
  const pub = await (await http('GET', `/api/search?${Q()}&type=package&flex=2&currency=AZN`)).json();
  const net = pub.groups.find((g) => g.name === d.offers[0].name).best.price;
  assert.strictEqual(d.offers[0].price, Math.round(net * 1.1));
  assert.ok(Array.isArray(d.offers[0].includes) && d.offers[0].includes.includes('flight'));
  // Büdcə filtri (komissiyalı qiymətə görə)
  const budget = d.offers[0].price;
  const db = await (await http('GET', `/api/w/${w.publicId}/search?${Q()}&type=package&budget=${budget}`)).json();
  assert.ok(db.offers.length >= 1 && db.offers.every((o) => o.price <= budget));
  assert.strictEqual((await http('GET', `/api/w/${w.publicId}/search?destinationId=nowhere&checkIn=${future(40)}`)).status, 400);
  assert.strictEqual((await http('GET', `/api/w/${'z'.repeat(22)}/search?${Q()}`)).status, 404);

  // Müraciət
  notified.length = 0;
  const lead = { name: 'Vidjet Müştəri', phone: '+994 50 333 44 55', note: 'Axşam', ref: d.offers[0].ref, query: d.query };
  r = await http('POST', `/api/w/${w.publicId}/leads`, { body: lead });
  assert.strictEqual(r.status, 201);
  const out = await r.json();
  assert.match(out.statusUrl, /^\/r\/[A-Za-z0-9_-]{32}$/);
  assert.ok(!('id' in out));
  const la = (await (await http('GET', '/api/b2b/leads', a.s)).json()).leads;
  const mine = la.find((l) => l.name === 'Vidjet Müştəri');
  assert.ok(mine, 'agentliyin Müraciətlər bölməsində');
  assert.strictEqual(mine.source, 'widget');
  assert.strictEqual(mine.item.clientPrice, d.offers[0].price);
  assert.ok(mine.item.providerName, 'agentlik operatoru görür');
  assert.ok(!('statusTokenHash' in mine), 'token hash B2B-yə çıxmır');
  const lb = (await (await http('GET', '/api/b2b/leads', b.s)).json()).leads;
  assert.ok(!lb.some((l) => l.name === 'Vidjet Müştəri'), 'başqa agentlik görmür (IDOR)');
  assert.strictEqual(notified.length, 1);
  assert.strictEqual(notified[0].rec.agencyId, a.agency.id);
  assert.strictEqual(notified[0].rec.source, 'widget');
  assert.match(buildLeadMessage('selection', notified[0].rec).html, /Sayt vidjeti/);

  // Yanlış ref / yanlış ad / honeypot
  assert.strictEqual((await http('POST', `/api/w/${w.publicId}/leads`, { body: { ...lead, ref: 'A'.repeat(22) } })).status, 400);
  assert.strictEqual((await http('POST', `/api/w/${w.publicId}/leads`, { body: { ...lead, name: '<b>x</b>' } })).status, 400);
  const before = (await storage.get().leads.count());
  r = await http('POST', `/api/w/${w.publicId}/leads`, { body: { ...lead, website: 'http://spam' } });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(await storage.get().leads.count(), before, 'honeypot: saxlanılmır');
  // Yad Origin (CSRF qatı) — vidjet iframe-də Odiola origin-indən işləyir
  assert.strictEqual((await http('POST', `/api/w/${w.publicId}/leads`, { body: lead, headers: { Origin: 'https://evil.example' } })).status, 403);
  // Cookie qoyulmur
  r = await http('GET', `/w/${w.publicId}`);
  assert.strictEqual(r.headers.get('set-cookie'), null);
});

test('vidjet: müraciət endpoint-i IP üzrə rate limit (10 / 10 dəq)', async () => {
  const a = await agency('Vidjet Limit', 'wg_limit');
  const w = await (await http('GET', '/api/b2b/widget', a.s)).json();
  const fixed = ip();
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await http('POST', `/api/w/${w.publicId}/leads`, { body: { name: 'X', phone: '1' }, headers: { 'X-Forwarded-For': fixed } })).status);
  assert.ok(codes.slice(0, 10).every((c) => c === 400));
  assert.strictEqual(codes[11], 429);
});

// ---------------------------------------------------------------- Marketplace
test('marketplace: yalnız seçən agentliklər, daxili id sızmır, müraciət seçilən agentliyə (source=marketplace)', async () => {
  const a = await agency('Market Agentlik', 'mk_admin');
  const off = await agency('Market Gizli', 'mk_hidden');
  let r = await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: 'Market Travel', city: 'Gəncə', phone: '+994 55 111 22 33' } });
  assert.strictEqual(r.status, 200);
  await http('PUT', '/api/b2b/marketplace', { ...off.s, body: { enabled: false, name: 'Gizli Travel', city: 'Bakı' } });
  assert.strictEqual((await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: '', city: '' } })).status, 400);
  assert.strictEqual((await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: 'X<script>', city: 'Bakı' } })).status, 400);
  assert.strictEqual((await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: 'Market Travel', city: 'Gəncə', phone: 'abc' } })).status, 400);

  r = await http('GET', '/api/partners');
  const { partners } = await r.json();
  const p = partners.find((x) => x.name === 'Market Travel');
  assert.ok(p);
  assert.deepStrictEqual(Object.keys(p).sort(), ['city', 'id', 'name']);
  assert.match(p.id, /^[A-Za-z0-9_-]{16}$/);
  assert.ok(!partners.some((x) => x.name === 'Gizli Travel'), 'seçməyən agentlik görünmür');
  assert.ok(!JSON.stringify(partners).includes('ag_'), 'daxili id sızmır');

  const s = await (await http('GET', `/api/search?${Q()}&type=package`)).json();
  const best = s.groups[0].best;
  notified.length = 0;
  r = await http('POST', '/api/leads', { body: { type: 'offer', name: 'Market Müştəri', phone: '+994501231231', offerId: best.id, partner: p.id, query: { type: 'package', adults: '2' } } });
  assert.strictEqual(r.status, 201);
  const out = await r.json();
  assert.match(out.statusUrl, /^\/r\//);
  const la = (await (await http('GET', '/api/b2b/leads', a.s)).json()).leads;
  const ml = la.find((l) => l.name === 'Market Müştəri');
  assert.ok(ml);
  assert.strictEqual(ml.source, 'marketplace');
  assert.strictEqual(ml.item.clientPrice, best.price, 'qiymət serverdə yenidən tapılır');
  assert.strictEqual(notified[0].rec.agencyId, a.agency.id);
  assert.match(buildLeadMessage('selection', notified[0].rec).html, /marketplace/);

  // Seçilməyibsə köhnə qayda (ümumi), yanlış / gizli agentlik → 400
  r = await http('POST', '/api/leads', { body: { type: 'offer', name: 'Ümumi Müştəri', phone: '+994501231232', offerId: best.id } });
  assert.strictEqual(r.status, 201);
  assert.ok(!notified[notified.length - 1].rec.agencyId);
  assert.strictEqual(notified[notified.length - 1].kind, 'offer');
  const hidden = await storage.get().widgets.get(off.agency.id);
  for (const partner of ['x', 'A'.repeat(16), hidden.marketId, off.agency.id, { $ne: 1 }]) {
    assert.strictEqual((await http('POST', '/api/leads', { body: { type: 'offer', name: 'Yanlış Müştəri', phone: '+994501231233', offerId: best.id, partner } })).status, 400, String(partner));
  }
});

// ---------------------------------------------------------------- Status səhifəsi
test('status: /r/<token> — səhv token 404, maskalı məlumat, DB-də yalnız SHA-256 hash, CRM statusu əks olunur', async () => {
  const a = await agency('Status Agentlik', 'st_admin');
  await http('PUT', '/api/b2b/marketplace', { ...a.s, body: { enabled: true, name: 'Status Travel', city: 'Bakı', phone: '+994551234567' } });
  const { partners } = await (await http('GET', '/api/partners')).json();
  const p = partners.find((x) => x.name === 'Status Travel');
  const s = await (await http('GET', `/api/search?${Q()}&type=hotel`)).json();
  const best = s.groups[0].best;
  let r = await http('POST', '/api/leads', { body: { type: 'offer', name: 'Gülnar Əliyeva', phone: '+994 50 987 65 43', note: 'gizli qeyd', offerId: best.id, partner: p.id, query: { type: 'hotel', adults: '2' } } });
  const { statusUrl } = await r.json();
  const token = statusUrl.slice(3);

  // Saxlanılan: yalnız hash; token özü heç yerdə
  const rec = storage.get().leads.list.find((l) => l.name === 'Gülnar Əliyeva');
  assert.strictEqual(rec.statusTokenHash, crypto.createHash('sha256').update(token).digest('hex'));
  assert.ok(!JSON.stringify(storage.get().leads.list).includes(token), 'token açıq saxlanılmır');
  assert.strictEqual(Buffer.from(token, 'base64url').length, 24, '24 bayt təsadüf');

  r = await http('GET', `/r/${token}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get('referrer-policy'), 'no-referrer');
  assert.match(r.headers.get('x-robots-tag'), /noindex/);
  assert.match(r.headers.get('cache-control'), /no-store/);
  assert.deepStrictEqual(cspDirs(r)['frame-ancestors'], ["'none'"]);
  assert.match(await r.text(), /noindex/);

  r = await http('GET', `/api/r/${token}`);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get('referrer-policy'), 'no-referrer');
  const v = await r.json();
  assert.strictEqual(v.status, 'new');
  assert.strictEqual(v.agency, 'Status Travel');
  assert.deepStrictEqual(v.contact, { phone: '+994551234567', whatsapp: '994551234567' });
  assert.strictEqual(v.customer.name, 'G*** Ə***');
  assert.match(v.customer.phone, /43$/);
  const raw = JSON.stringify(v);
  for (const leak of ['Gülnar', 'Əliyeva', '987', 'gizli qeyd', best.id, best.providerName, a.agency.id, 'statusTokenHash', 'managerNote']) assert.ok(!raw.includes(leak), `sızma: ${leak}`);
  assert.strictEqual(v.item.name, best.name);

  // CRM statusu müştəri səhifəsində
  const lead = (await (await http('GET', '/api/b2b/leads', a.s)).json()).leads.find((l) => l.name === 'Gülnar Əliyeva');
  assert.strictEqual((await http('PATCH', `/api/b2b/leads/${lead.id}`, { ...a.s, body: { status: 'in_progress', note: 'daxili' } })).status, 200);
  const v2 = await (await http('GET', `/api/r/${token}`)).json();
  assert.strictEqual(v2.status, 'in_progress');
  assert.ok(v2.statusChangedAt);
  assert.ok(!JSON.stringify(v2).includes('daxili'));

  // Səhv token: 404 (format düzgün, amma yoxdur), format yanlış: 404
  const wrong = crypto.randomBytes(24).toString('base64url');
  for (const t of [wrong, token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'), 'short', `${token}x`, '../../etc']) {
    assert.strictEqual((await http('GET', `/api/r/${encodeURIComponent(t)}`)).status, 404, t);
    assert.strictEqual((await http('GET', `/r/${encodeURIComponent(t)}`)).status, 404, t);
  }

  // Ümumi (agentliksiz) müraciət: agency null, operator adı yoxdur
  r = await http('POST', '/api/leads', { body: { type: 'offer', name: 'Ümumi Status', phone: '+994701112233', offerId: best.id } });
  const g = await (await http('GET', `/api/r/${(await r.json()).statusUrl.slice(3)}`)).json();
  assert.strictEqual(g.agency, null);
  assert.strictEqual(g.item.name, best.name);
  assert.ok(!JSON.stringify(g).includes(best.providerName));
});

test('status: /api/r rate limit (30/dəq)', async () => {
  const fixed = ip();
  let last;
  for (let i = 0; i < 31; i++) last = (await http('GET', `/api/r/${'A'.repeat(32)}`, { headers: { 'X-Forwarded-For': fixed } })).status;
  assert.strictEqual(last, 429);
});

// ---------------------------------------------------------------- Qiymətə nə daxildir
test('includes/excludes: paket, yalnız otel, daxili, ekskursiya — deterministik, serverdə hər təklifdə', async () => {
  const pk = inclusions({ itemType: 'hotel', providerId: 'summer', board: 'AI', flight: { cls: 'econom' } }, 'intl');
  assert.deepStrictEqual(pk.includes, ['hotel', 'meal:AI', 'flight', 'baggage:20', 'transfer', 'insurance']);
  assert.deepStrictEqual(pk.excludes, ['visa', 'tourist_tax', 'personal']);
  const kp = inclusions({ itemType: 'hotel', providerId: 'kompas', board: 'BB', flight: { cls: 'business' } }, 'intl');
  assert.ok(kp.includes.includes('baggage:30') && !kp.includes.includes('insurance') && kp.excludes.includes('insurance'));
  const ho = inclusions({ itemType: 'hotel', providerId: 'hotels-direct', board: 'BB', flight: null }, 'intl');
  assert.deepStrictEqual(ho.includes, ['hotel', 'meal:BB']);
  assert.ok(['flight', 'transfer', 'visa', 'tourist_tax', 'personal'].every((k) => ho.excludes.includes(k)));
  const dom = inclusions({ itemType: 'hotel', providerId: 'local-az', board: 'HB', flight: null }, 'domestic');
  assert.ok(!dom.excludes.includes('visa') && !dom.excludes.includes('flight'));
  const tour = inclusions({ itemType: 'tour', providerId: 'summer', tags: ['Aviabilet', 'Otel', 'Transfer', 'Ekskursiyalar'] }, 'intl');
  assert.deepStrictEqual(tour.includes, ['flight', 'hotel', 'transfer', 'excursions', 'insurance']);
  const bus = inclusions({ itemType: 'tour', providerId: 'local-az', tags: ['Avtobus', 'Otel', 'Səhər yeməyi', 'Bələdçi'] }, 'intl');
  assert.ok(bus.includes.includes('transport') && bus.includes.includes('guide') && bus.excludes.includes('flight'));

  const q = `${Q()}&flat=1`;
  const a1 = await (await http('GET', `/api/search?${q}&type=package`)).json();
  const a2 = await (await http('GET', `/api/search?${q}&type=package`)).json();
  assert.ok(a1.offers.every((o) => Array.isArray(o.includes) && Array.isArray(o.excludes) && o.includes.includes('flight') && o.excludes.includes('visa')));
  assert.deepStrictEqual(a1.offers.map((o) => [o.includes, o.excludes]), a2.offers.map((o) => [o.includes, o.excludes]), 'deterministik');
  const h = await (await http('GET', `/api/search?${q}&type=hotel`)).json();
  assert.ok(h.offers.every((o) => !o.includes.includes('flight') && o.excludes.includes('flight')));
  const ho2 = await (await http('GET', `/api/hotels/${h.offers[0].itemId}/offers?type=hotel&checkIn=${future(40)}&nights=7&adults=2`)).json();
  assert.ok(ho2.rows[0].includes.includes('hotel'), 'otel detal pəncərəsində də');
  // Frontend: blok və kart sətri, DEMO işarəsi, viza üçün konkret qayda YOX
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'includes.js'), 'utf8');
  assert.match(js, /rəsmi mənbədən yoxlayın/);
  assert.match(js, /DEMO/);
  const appjs = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'app.js'), 'utf8');
  assert.match(appjs, /Inclusions\.line\(/);
  assert.match(appjs, /Inclusions\.block\(/);
  assert.match(appjs, /lead_track/);
});

test('frontend: vidjet səhifəsi yüngül (common.js yox), cookie/localStorage istifadə etmir, B2B kartları', () => {
  const pub = path.join(__dirname, '..', 'public');
  const html = fs.readFileSync(path.join(pub, 'widget.html'), 'utf8');
  assert.ok(!html.includes('common.js') && !html.includes('style.css'));
  const js = fs.readFileSync(path.join(pub, 'js', 'widget.js'), 'utf8');
  assert.ok(!/document\.cookie|localStorage|sessionStorage/.test(js));
  assert.ok(js.includes("credentials: 'omit'"));
  const b2b = fs.readFileSync(path.join(pub, 'b2b.html'), 'utf8');
  assert.ok(b2b.includes('/js/b2b-widget.js') && b2b.includes('id="b2bWidgetCards"'));
  const leadsJs = fs.readFileSync(path.join(pub, 'js', 'b2b-leads.js'), 'utf8');
  assert.ok(leadsJs.includes('crm_src_widget') && leadsJs.includes('crm_src_marketplace'));
});
