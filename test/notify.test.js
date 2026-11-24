// Bildirişlər (Telegram/e-poçt) və B2B müraciət CRM testləri. Real şəbəkə sorğusu YOXDUR:
// Telegram üçün fetch stub-u, e-poçt üçün nodemailer transport stub-u ötürülür.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

process.env.TURTAP_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'turtap-notify-'));
process.env.TRUST_PROXY = 'loopback';

const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const { startServer, createAccount, login, future } = require('./_helpers');
const notify = require('../src/notify');
const { createNotifier } = notify;
const { buildLeadMessage, escapeHtml, buildTestMessage } = require('../src/notify/format');
const { sendTelegram } = require('../src/notify/telegram');
const { createQueue } = require('../src/notify/queue');
const { createSelection } = require('../src/leads');
const storage = require('../src/storage');

const TOKEN = `123456789:${'A'.repeat(35)}`;
const PW = 'Notify-Parol-2026!';
let S;
let ipSeq = 0;
const ip = () => `10.55.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

test.before(async () => { await app.locals.ready; S = await startServer(app); });
test.after(async () => {
  notify.use(null);
  await S.close();
  fs.rmSync(process.env.TURTAP_DATA_DIR, { recursive: true, force: true });
});

// fetch stub: Telegram cavablarını ardıcıl qaytarır, çağırışları yazır
function tgStub(responses = [{ status: 200, body: { ok: true, result: { message_id: 1 } } }]) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, body: JSON.parse(opts.body), opts });
    const r = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (r instanceof Error) throw r;
    if (typeof r === 'function') return r();
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body };
  };
  fn.calls = calls;
  return fn;
}
const silentLog = () => { const out = []; const f = (level) => (msg, fields) => out.push({ level, msg, fields }); return { out, debug: f('debug'), info: f('info'), warn: f('warn'), error: f('error') }; };

// Sessiya: yalnız cookie + csrf (login cavabının body-si sorğuya qarışmasın)
async function signIn(username) {
  const l = await login(S.base, username, PW, { 'X-Forwarded-For': ip() });
  assert.strictEqual(l.res.status, 200, username);
  return { cookie: l.cookie, csrf: l.csrf };
}
const http = (method, p, { cookie, csrf, body, headers = {} } = {}) => fetch(S.base + p, {
  method,
  headers: { 'X-Forwarded-For': ip(), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const stubResolver = async (q, ids) => ({ pax: { adults: 2, children: 0 }, offers: ids.map((id) => ({ id, name: 'Otel <Test>', destination: { name: 'Antalya' }, stars: 5, checkIn: future(30), nights: 7, board: 'AI', providerName: 'Summer Tour', price: 1000, prepayment: 'none' })) });
async function agencyWithLead(agencyName, username, { role = 'admin', leadName = 'Müştəri Bir' } = {}) {
  const acc = await createAccount({ agency: agencyName, username, password: PW, role });
  const sel = await createSelection({ markup: 10, query: {}, offerIds: ['summer:x'], client: 'Sorğu 7' }, { account: { agencyId: acc.agency.id, agencyName: acc.agency.name, managerName: 'M' }, resolveOffers: stubResolver });
  const r = await http('POST', '/api/leads', { body: { type: 'selection', selectionId: sel.id, itemIndex: 0, name: leadName, phone: '+994 50 111 22 33', note: 'Axşam zəng edin' } });
  assert.strictEqual(r.status, 201);
  const { id } = await r.json();
  const s = await signIn(username);
  return { ...acc, leadId: id, selection: sel, session: s };
}

// ---------------------------------------------------------------- Mesaj formatı və escape
test('format: Telegram HTML mesajı AZ dilində, istifadəçi daxiletməsi escape olunur, B2B linki', () => {
  const rec = {
    id: 42, agencyId: 'ag_x', name: 'Ad <b>&</b>', phone: '+994501112233', note: '<script>alert(1)</script>', client: 'A&B',
    item: { name: 'Otel "<i>"', destination: 'Antalya', checkIn: '2026-12-20', nights: 7, board: 'AI', clientPrice: 1234, currency: 'AZN' },
  };
  const m = buildLeadMessage('selection', rec, { baseUrl: 'https://odiola.az' });
  assert.match(m.html, /^🆕 <b>Yeni müraciət: B2B seçim linki<\/b> #42/);
  assert.ok(m.html.includes('👤 Ad: Ad &lt;b&gt;&amp;&lt;/b&gt;'), m.html);
  assert.ok(m.html.includes('📝 Qeyd: &lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(m.html.includes('🏨 Otel: Otel &quot;&lt;i&gt;&quot;, Antalya'));
  assert.ok(m.html.includes('📅 Tarix: 20.12.2026 · 7 gecə · hər şey daxil'));
  assert.ok(m.html.includes('💰 Qiymət: 1 234 AZN'));
  assert.ok(m.html.includes('📞 Telefon: +994501112233'));
  assert.ok(m.html.includes('<a href="https://odiola.az/b2b#lead-42">B2B paneldə aç</a>'));
  // Yalnız bizim teqlərimiz qalır (b, a) — istifadəçidən gələn heç bir teq yoxdur
  const tags = [...m.html.matchAll(/<\/?([a-z]+)/g)].map((x) => x[1]);
  assert.ok(tags.every((tg) => tg === 'b' || tg === 'a'), tags.join(','));
  // E-poçt: sadə mətn (escape yox), mövzu
  assert.ok(m.text.includes('Ad: Ad <b>&</b>'));
  assert.match(m.subject, /^Odiola: Yeni müraciət/);
  // PUBLIC_BASE_URL yoxdursa link yoxdur
  assert.ok(!buildLeadMessage('selection', rec, { baseUrl: null }).html.includes('<a '));

  const cb = buildLeadMessage('callback', { id: 1, name: 'Anar', phone: '0501112233', preferredTime: 'evening', context: 'Antalya · 16.12 · 2+1' }, { baseUrl: 'https://odiola.az' });
  assert.ok(cb.html.includes('«Sizə zəng edək»') && cb.html.includes('⏰ Zəng vaxtı: axşam') && cb.html.includes('📍 İstiqamət: Antalya · 16.12 · 2+1'));
  assert.ok(!cb.html.includes('<a '), 'ümumi müraciətdə B2B linki yoxdur');
  const of = buildLeadMessage('offer', { id: 2, name: 'Anar', phone: '0501112233', offerId: 'funsun:antalya-h1|2026-12-17|7|BB|StandardRoom' });
  assert.ok(of.html.includes('🏨 Otel: Green Valley Palace, Antalya') && of.html.includes('17.12.2026 · 7 gecə · səhər yeməyi'), of.html);
  const fl = buildLeadMessage('flight', { id: 3, name: 'Anar', phone: '0501112233', email: 'a@b.az', flightId: 'J2123:GYDIST:202612200835~J2124:ISTGYD:202612270835' });
  assert.ok(fl.html.includes('✈️ İstiqamət: Bakı (GYD) → İstanbul (IST)') && fl.html.includes('20.12.2026 · qayıdış 27.12.2026'), fl.html);
  const car = buildLeadMessage('car', { id: 4, kind: 'rental', name: 'Anar', phone: '0501112233', summary: { pickup: 'Bakı hava limanı', dropoff: 'Bakı mərkəz', from: '2026-12-20 10:00', to: '2026-12-25 10:00', total: 250, currency: 'AZN', company: 'X Rent', model: 'Kia Rio və ya oxşar' } });
  assert.ok(car.html.includes('🚗 Növ: Avtomobil icarəsi') && car.html.includes('💰 Qiymət: 250 AZN'), car.html);
  assert.strictEqual(escapeHtml('<&>"'), '&lt;&amp;&gt;&quot;');
  assert.ok(buildTestMessage('<Agentlik>').html.includes('&lt;Agentlik&gt;'));
  // Uzun mətn Telegram limitini (4096) keçmir
  assert.ok(buildLeadMessage('callback', { id: 5, name: 'A'.repeat(80), phone: '0501112233', note: '<'.repeat(5000), context: '&'.repeat(5000) }).html.length <= 4096);
});

// ---------------------------------------------------------------- Telegram göndərmə (stub)
test('sendTelegram: Bot API URL, parse_mode HTML, chat_id; 400 təkrar olunmur, 5xx/429 təkrar olunur, token xətada yoxdur', async () => {
  const f = tgStub();
  await sendTelegram({ token: TOKEN, chatId: '-1001234567890', html: '<b>x</b>', fetchImpl: f });
  assert.strictEqual(f.calls[0].url, `https://api.telegram.org/bot${TOKEN}/sendMessage`);
  assert.deepStrictEqual(f.calls[0].body, { chat_id: '-1001234567890', text: '<b>x</b>', parse_mode: 'HTML', disable_web_page_preview: true });
  assert.strictEqual(f.calls[0].opts.method, 'POST');
  assert.ok(f.calls[0].opts.signal, 'timeout siqnalı');

  const bad = tgStub([{ status: 400, body: { ok: false, description: `Bad Request: chat not found ${TOKEN}` } }]);
  await assert.rejects(sendTelegram({ token: TOKEN, chatId: '-100', html: 'x', fetchImpl: bad }), (e) => e.retryable === false && e.status === 400 && !e.message.includes(TOKEN));
  const busy = tgStub([{ status: 429, body: { ok: false, description: 'Too Many Requests' } }]);
  await assert.rejects(sendTelegram({ token: TOKEN, chatId: '-100', html: 'x', fetchImpl: busy }), (e) => e.retryable === true);
  const down = tgStub([new TypeError(`fetch failed https://api.telegram.org/bot${TOKEN}/sendMessage`)]);
  await assert.rejects(sendTelegram({ token: TOKEN, chatId: '-100', html: 'x', fetchImpl: down }), (e) => e.retryable === true && !e.message.includes(TOKEN));
  // Yanlış token/chat formatı → şəbəkəyə çıxmır
  const none = tgStub();
  await assert.rejects(sendTelegram({ token: 'yanlis', chatId: '-100', html: 'x', fetchImpl: none }));
  await assert.rejects(sendTelegram({ token: TOKEN, chatId: 'drop table', html: 'x', fetchImpl: none }));
  assert.strictEqual(none.calls.length, 0);
});

test('növbə: retry/backoff 3 dəfə, sonra son xəta loglanır; retryable=false dərhal dayanır', async () => {
  const errors = [];
  const q = createQueue({ retries: 3, baseDelayMs: 1, onError: (e, meta) => errors.push(meta) });
  let n = 0;
  q.push('always-fails', async () => { n++; throw new Error('x'); });
  await q.idle();
  assert.strictEqual(n, 4, '1 cəhd + 3 təkrar');
  assert.deepStrictEqual(errors.map((e) => e.final), [false, false, false, true]);

  let m = 0;
  q.push('perm', async () => { m++; const e = new Error('perm'); e.retryable = false; throw e; });
  await q.idle();
  assert.strictEqual(m, 1);

  let k = 0;
  q.push('recovers', async () => { if (++k < 3) throw new Error('temp'); });
  await q.idle();
  assert.strictEqual(k, 3);
  // Dolu növbə: yeni iş atılır (yaddaş tükənmir)
  const dropped = [];
  const small = createQueue({ maxSize: 1, onDrop: (d) => dropped.push(d) });
  assert.strictEqual(small.push('a', async () => {}), true);
  assert.strictEqual(small.push('b', async () => {}), false);
  assert.strictEqual(dropped.length, 1);
  await small.idle();
});

test('notifier: Telegram 5xx → təkrar cəhd və uğur; log-da müştəri adı/telefonu yoxdur', async () => {
  const f = tgStub([{ status: 502, body: { ok: false, description: 'Bad Gateway' } }, new TypeError('fetch failed'), { status: 200, body: { ok: true, result: {} } }]);
  const log = silentLog();
  const n = createNotifier({ telegramToken: TOKEN, adminChatId: '-1009998887776', fetchImpl: f, log, queue: { baseDelayMs: 1 }, getSettings: async () => null, baseUrl: null });
  assert.strictEqual(n.leadCreated('callback', { id: 7, name: 'Rəşad Əliyev', phone: '+994501234567', preferredTime: 'now' }) !== false, true);
  await n.idle();
  assert.strictEqual(f.calls.length, 3);
  assert.strictEqual(f.calls[2].body.chat_id, '-1009998887776');
  assert.ok(log.out.some((l) => l.level === 'warn'));
  const dump = JSON.stringify(log.out);
  assert.ok(!dump.includes('Rəşad') && !dump.includes('501234567') && !dump.includes('9998887776') && !dump.includes(TOKEN), dump);

  // Daimi uğursuzluq: 1 + 3 təkrar, sonra error logu (müraciətin özünə təsir etmir)
  const f2 = tgStub([new TypeError('fetch failed')]);
  const log2 = silentLog();
  const n2 = createNotifier({ telegramToken: TOKEN, adminChatId: '-100123456', fetchImpl: f2, log: log2, queue: { baseDelayMs: 1 }, getSettings: async () => null });
  n2.leadCreated('offer', { id: 8, name: 'Test', phone: '+994501234567' });
  await n2.idle();
  assert.strictEqual(f2.calls.length, 4);
  assert.ok(log2.out.some((l) => l.level === 'error' && l.fields.final === true));
});

test('token yoxdursa / şəbəkə söndürülübsə (test rejimi) heç bir sorğu getmir; default notifier test rejimində söndürülüb', async () => {
  const f = tgStub();
  const noToken = createNotifier({ telegramToken: '', adminChatId: '-100123456', fetchImpl: f, getSettings: async () => null });
  assert.strictEqual(noToken.leadCreated('callback', { id: 1, name: 'A', phone: '1' }), false);
  const offline = createNotifier({ telegramToken: TOKEN, adminChatId: '-100123456', fetchImpl: f, network: false, getSettings: async () => null });
  assert.strictEqual(offline.leadCreated('callback', { id: 1, name: 'A', phone: '1' }), false);
  await assert.rejects(offline.sendTestTelegram('-100123456', 'X'), (e) => e.status === 503);
  await noToken.idle(); await offline.idle();
  assert.strictEqual(f.calls.length, 0);

  // Default (env) notifier: node --test altında şəbəkə yoxdur
  notify.use(null);
  assert.deepStrictEqual(notify.get().status(), { telegram: false, email: false, adminChat: false });
  // HTTP ilə müraciət: qlobal fetch Telegram-a çağırılmır
  const real = globalThis.fetch;
  const seen = [];
  globalThis.fetch = (u, o) => { seen.push(String(u)); return real(u, o); };
  try {
    const r = await http('POST', '/api/leads', { body: { type: 'callback', name: 'Şəbəkəsiz Test', phone: '+994501112233' } });
    assert.strictEqual(r.status, 201);
    await notify.get().idle();
  } finally { globalThis.fetch = real; }
  assert.ok(!seen.some((u) => u.includes('telegram')), seen.join(','));
});

test('e-poçt: SMTP transport stub ilə agentliyin bildiriş e-poçtuna; SMTP_URL yoxdursa göndərilmir', async () => {
  const sent = [];
  const transport = { sendMail: async (m) => { sent.push(m); return {}; } };
  const n = createNotifier({ smtpUrl: 'smtp://u:p@smtp.example.test:587', emailFrom: 'Odiola <noreply@odiola.az>', mailTransport: transport, getSettings: async (id) => (id === 'ag_e' ? { notifyEmail: 'sales@agentlik.az' } : null) });
  assert.strictEqual(n.status().email, true);
  n.leadCreated('selection', { id: 9, agencyId: 'ag_e', name: 'Anar', phone: '0501112233', item: { name: 'Otel', clientPrice: 900, currency: 'AZN' } });
  await n.idle();
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].to, 'sales@agentlik.az');
  assert.strictEqual(sent[0].from, 'Odiola <noreply@odiola.az>');
  assert.match(sent[0].subject, /Yeni müraciət/);
  assert.ok(sent[0].text.includes('Telefon: 0501112233'));
  const none = createNotifier({ smtpUrl: '', emailFrom: 'x@y.az', mailTransport: transport, getSettings: async () => ({ notifyEmail: 'a@b.az' }) });
  assert.strictEqual(none.leadCreated('selection', { id: 10, agencyId: 'ag_e', name: 'A', phone: '1' }), false);
});

// ---------------------------------------------------------------- HTTP inteqrasiya: alıcılar, asinxronluq
test('HTTP: agentlik müraciəti → agentliyin chat_id-si; ümumi müraciət → admin chat; cavab bildirişi gözləmir', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const f = tgStub([() => gate.then(() => ({ ok: true, status: 200, json: async () => ({ ok: true, result: {} }) }))]);
  const n = createNotifier({ telegramToken: TOKEN, adminChatId: '-1000000000001', fetchImpl: f, queue: { baseDelayMs: 1 }, baseUrl: 'https://odiola.az' });
  notify.use(n);
  try {
    const acc = await createAccount({ agency: 'Telegram Agentlik', username: 'tg-admin', password: PW });
    const s = await signIn('tg-admin');
    const put = await http('PUT', '/api/b2b/settings', { ...s, body: { telegramChatId: '-1002223334445', notifyEmail: 'sales@agentlik.az' } });
    assert.strictEqual(put.status, 200);
    const sel = await createSelection({ markup: 0, query: {}, offerIds: ['summer:y'] }, { account: { agencyId: acc.agency.id, agencyName: acc.agency.name, managerName: 'M' }, resolveOffers: stubResolver });

    const t0 = Date.now();
    const r = await http('POST', '/api/leads', { body: { type: 'selection', selectionId: sel.id, itemIndex: 0, name: 'Asinxron Müştəri', phone: '+994501112233' } });
    assert.strictEqual(r.status, 201, 'Telegram cavabı gözlənilmədən 201');
    assert.ok(Date.now() - t0 < 2000);
    const { id } = await r.json();
    const r2 = await http('POST', '/api/leads', { body: { type: 'callback', name: 'Ümumi Müştəri', phone: '+994501112244', preferredTime: 'morning' } });
    assert.strictEqual(r2.status, 201);
    release();
    await n.idle();
    const byChat = Object.fromEntries(f.calls.map((c) => [c.body.chat_id, c.body.text]));
    assert.ok(byChat['-1002223334445'].includes('Asinxron Müştəri') && byChat['-1002223334445'].includes(`/b2b#lead-${id}`));
    assert.ok(byChat['-1000000000001'].includes('Ümumi Müştəri') && byChat['-1000000000001'].includes('səhər'));
    assert.ok(!byChat['-1000000000001'].includes('Asinxron'), 'agentlik müraciəti admin chat-ına getmir');
  } finally { notify.use(null); }
});

test('HTTP: Telegram uğursuz olsa da müraciət saxlanılır', async () => {
  const f = tgStub([new TypeError('fetch failed')]);
  const n = createNotifier({ telegramToken: TOKEN, adminChatId: '-1000000000001', fetchImpl: f, queue: { baseDelayMs: 1 }, log: silentLog() });
  notify.use(n);
  try {
    const before = await storage.get().leads.count();
    const r = await http('POST', '/api/leads', { body: { type: 'callback', name: 'Uğursuz Bildiriş', phone: '+994501112255' } });
    assert.strictEqual(r.status, 201);
    await n.idle();
    assert.strictEqual(await storage.get().leads.count(), before + 1);
    assert.strictEqual(f.calls.length, 4);
  } finally { notify.use(null); }
});

// ---------------------------------------------------------------- Ayarlar: icazələr, CSRF, validasiya, test mesajı
test('ayarlar: yalnız admin dəyişə bilər (manager 403), CSRF tələb olunur, validasiya, test mesajı', async () => {
  const f = tgStub();
  notify.use(createNotifier({ telegramToken: TOKEN, fetchImpl: f, log: silentLog() }));
  try {
    const adm = await createAccount({ agency: 'Ayar Agentlik', username: 'set-admin', password: PW, role: 'admin' });
    await createAccount({ agency: 'Ayar Agentlik', username: 'set-mgr', password: PW, role: 'manager' });
    const a = await signIn('set-admin');
    const m = await signIn('set-mgr');
    const body = { telegramChatId: '-1001112223334', notifyEmail: 'ofis@ayar.az' };

    assert.strictEqual((await http('PUT', '/api/b2b/settings', { body })).status, 401, 'girişsiz');
    assert.strictEqual((await http('PUT', '/api/b2b/settings', { ...m, body })).status, 403, 'manager');
    assert.strictEqual((await http('POST', '/api/b2b/settings/telegram-test', { ...m, body: {} })).status, 403, 'manager test');
    assert.strictEqual((await http('PUT', '/api/b2b/settings', { cookie: a.cookie, body })).status, 403, 'CSRF tokensiz');
    assert.strictEqual((await http('PUT', '/api/b2b/settings', { ...a, body, headers: { Origin: 'https://evil.example' } })).status, 403, 'yad Origin');
    assert.strictEqual((await http('POST', '/api/b2b/settings/telegram-test', { cookie: a.cookie, body: {} })).status, 403, 'test CSRF tokensiz');
    for (const bad of [{ telegramChatId: 'abc def' }, { telegramChatId: '<script>' }, { notifyEmail: 'yox' }, { telegramChatId: 123 }, { ...body, agencyId: 'ag_x' }]) {
      assert.strictEqual((await http('PUT', '/api/b2b/settings', { ...a, body: bad })).status, 400, JSON.stringify(bad));
    }
    const ok = await http('PUT', '/api/b2b/settings', { ...a, body });
    assert.strictEqual(ok.status, 200);
    const view = (await ok.json()).settings;
    assert.strictEqual(view.telegramChatId, '-1001112223334');
    assert.strictEqual(view.updatedBy, 'Menecer');
    assert.strictEqual(view.channels.telegram, true);
    // Manager oxuya bilər, dəyişə bilməz
    const mv = await (await http('GET', '/api/b2b/settings', { ...m })).json();
    assert.strictEqual(mv.telegramChatId, '-1001112223334');
    assert.strictEqual(mv.canEdit, false);
    assert.deepStrictEqual(await storage.get().agencySettings.get(adm.agency.id), { telegramChatId: '-1001112223334', notifyEmail: 'ofis@ayar.az', updatedAt: view.updatedAt, updatedBy: 'Menecer' });
    // @kanal formatı və təmizləmə (boş → null)
    assert.strictEqual((await http('PUT', '/api/b2b/settings', { ...a, body: { telegramChatId: '@odiola_sales', notifyEmail: '' } })).status, 200);
    assert.strictEqual((await storage.get().agencySettings.get(adm.agency.id)).notifyEmail, null);

    // Test mesajı: formdakı (hələ saxlanmamış) chat_id-yə göndərilir
    const tr = await http('POST', '/api/b2b/settings/telegram-test', { ...a, body: { chatId: '-1005556667778' } });
    assert.strictEqual(tr.status, 200);
    assert.strictEqual(f.calls.at(-1).body.chat_id, '-1005556667778');
    assert.match(f.calls.at(-1).body.text, /Odiola test mesajı/);
    // Saxlanmış chat_id-yə (body boş)
    assert.strictEqual((await http('POST', '/api/b2b/settings/telegram-test', { ...a, body: {} })).status, 200);
    assert.strictEqual(f.calls.at(-1).body.chat_id, '@odiola_sales');
    assert.strictEqual((await http('POST', '/api/b2b/settings/telegram-test', { ...a, body: { chatId: 'x y' } })).status, 400);
  } finally { notify.use(null); }

  // Telegram chat-ı rədd edir → 400 (aydın izah); token yoxdursa → 503
  notify.use(createNotifier({ telegramToken: TOKEN, fetchImpl: tgStub([{ status: 400, body: { ok: false, description: 'Bad Request: chat not found' } }]), log: silentLog() }));
  try {
    const a = await signIn('set-admin');
    const r = await http('POST', '/api/b2b/settings/telegram-test', { ...a, body: { chatId: '-100999' } });
    assert.strictEqual(r.status, 400);
    assert.match((await r.json()).error, /botun/);
    notify.use(createNotifier({ telegramToken: '' }));
    assert.strictEqual((await http('POST', '/api/b2b/settings/telegram-test', { ...a, body: { chatId: '-100999' } })).status, 503);
  } finally { notify.use(null); }
});

// ---------------------------------------------------------------- CRM: status, qeyd, IDOR, CSRF
test('CRM: PATCH status/qeyd, kim və nə vaxt dəyişib; filtr və saylar; validasiya', async () => {
  const A = await agencyWithLead('CRM Agentlik', 'crm-a');
  const s = A.session;
  const list0 = await (await http('GET', '/api/b2b/leads', { ...s })).json();
  const l0 = list0.leads.find((l) => l.id === A.leadId);
  assert.strictEqual(l0.status, 'new');
  assert.strictEqual(l0.managerNote, '');
  assert.ok(l0.updatedAt);
  assert.strictEqual(list0.counts.new, 1);

  const r = await http('PATCH', `/api/b2b/leads/${A.leadId}`, { ...s, body: { status: 'in_progress', note: '  Zəng edildi, sabah təklif  ' } });
  assert.strictEqual(r.status, 200);
  const { lead } = await r.json();
  assert.strictEqual(lead.status, 'in_progress');
  assert.strictEqual(lead.managerNote, 'Zəng edildi, sabah təklif');
  assert.strictEqual(lead.statusChangedBy, 'Menecer');
  assert.ok(Date.parse(lead.statusChangedAt) > 0 && Date.parse(lead.updatedAt) >= Date.parse(l0.updatedAt));
  // Yalnız qeyd: status dəyişmir, statusChangedAt eyni qalır
  const r2 = await (await http('PATCH', `/api/b2b/leads/${A.leadId}`, { ...s, body: { note: 'Yeni qeyd' } })).json();
  assert.strictEqual(r2.lead.status, 'in_progress');
  assert.strictEqual(r2.lead.statusChangedAt, lead.statusChangedAt);

  const filtered = await (await http('GET', '/api/b2b/leads?status=in_progress', { ...s })).json();
  assert.deepStrictEqual(filtered.leads.map((l) => l.id), [A.leadId]);
  assert.deepStrictEqual(filtered.counts, { new: 0, in_progress: 1, sold: 0, cancelled: 0 });
  assert.strictEqual((await (await http('GET', '/api/b2b/leads?status=new', { ...s })).json()).leads.length, 0);

  for (const [body, why] of [
    [{ status: 'done' }, 'yanlış status'], [{ note: 'x'.repeat(1001) }, 'qeyd > 1000'], [{ note: 5 }, 'qeyd rəqəm'],
    [{}, 'boş'], [{ status: 'sold', agencyId: 'ag_x' }, 'əlavə sahə'], [{ status: ['sold'] }, 'massiv'],
  ]) assert.strictEqual((await http('PATCH', `/api/b2b/leads/${A.leadId}`, { ...s, body })).status, 400, why);
  assert.strictEqual((await http('PATCH', `/api/b2b/leads/${'x'.repeat(5)}`, { ...s, body: { status: 'sold' } })).status, 400);
  assert.strictEqual((await http('PATCH', '/api/b2b/leads/99999999', { ...s, body: { status: 'sold' } })).status, 404);
  assert.strictEqual((await http('PATCH', `/api/b2b/leads/${A.leadId}`, { ...s, body: { note: 'x'.repeat(1000) } })).status, 200, '1000 simvol olar');
});

test('IDOR: başqa agentliyin müraciətinin statusunu/qeydini dəyişmək olmaz (404, dəyişməz qalır)', async () => {
  const A = await agencyWithLead('IDOR CRM A', 'idor-crm-a', { leadName: 'Gizli Bir' });
  const B = await agencyWithLead('IDOR CRM B', 'idor-crm-b', { leadName: 'Gizli İki' });
  const r = await http('PATCH', `/api/b2b/leads/${A.leadId}`, { ...B.session, body: { status: 'cancelled', note: 'B yazdı' } });
  assert.strictEqual(r.status, 404);
  const la = (await (await http('GET', '/api/b2b/leads', { ...A.session })).json()).leads.find((l) => l.id === A.leadId);
  assert.strictEqual(la.status, 'new');
  assert.strictEqual(la.managerNote, '');
  // B öz siyahısında A-nın müraciətini görmür
  const lb = (await (await http('GET', '/api/b2b/leads?status=new', { ...B.session })).json()).leads;
  assert.ok(!lb.some((l) => l.id === A.leadId));
  // Ümumi (agentliyə bağlı olmayan) müraciət heç bir agentlik tərəfindən dəyişdirilə bilməz
  const cb = await http('POST', '/api/leads', { body: { type: 'callback', name: 'Ümumi Zəng', phone: '+994501112266' } });
  const { id: cbId } = await cb.json();
  assert.strictEqual((await http('PATCH', `/api/b2b/leads/${cbId}`, { ...A.session, body: { status: 'sold' } })).status, 404);
  // Repository səviyyəsində də
  assert.strictEqual(await storage.get().leads.updateForAgency(B.agency.id, A.leadId, { status: 'sold', by: 'X' }), null);
});

test('CRM: CSRF — tokensiz, yanlış token, yad Origin → 403; girişsiz → 401', async () => {
  const A = await agencyWithLead('CSRF CRM', 'csrf-crm');
  const p = `/api/b2b/leads/${A.leadId}`;
  assert.strictEqual((await http('PATCH', p, { body: { status: 'sold' } })).status, 401);
  assert.strictEqual((await http('PATCH', p, { cookie: A.session.cookie, body: { status: 'sold' } })).status, 403);
  assert.strictEqual((await http('PATCH', p, { cookie: A.session.cookie, csrf: 'B'.repeat(43), body: { status: 'sold' } })).status, 403);
  assert.strictEqual((await http('PATCH', p, { ...A.session, body: { status: 'sold' }, headers: { Origin: 'https://evil.example' } })).status, 403);
  assert.strictEqual((await http('PATCH', p, { ...A.session, body: { status: 'sold' }, headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
  // form-urlencoded (klassik CSRF forması) → 415
  const form = await fetch(S.base + p, { method: 'PATCH', headers: { Cookie: A.session.cookie, 'X-CSRF-Token': A.session.csrf, 'Content-Type': 'application/x-www-form-urlencoded', 'X-Forwarded-For': ip() }, body: 'status=sold' });
  assert.strictEqual(form.status, 415);
  const lead = (await (await http('GET', '/api/b2b/leads', { ...A.session })).json()).leads.find((l) => l.id === A.leadId);
  assert.strictEqual(lead.status, 'new');
});

// ---------------------------------------------------------------- Frontend köməkçisi
test('frontend: telefon normallaşdırma (tel: / wa.me) və b2b-leads.js-də esc() istifadəsi', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'b2b-leads.js'), 'utf8');
  const fn = src.match(/function crmNormPhone[\s\S]*?\n}\n/)[0];
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${fn};this.f=crmNormPhone;`, ctx);
  const f = ctx.f;
  assert.deepStrictEqual({ ...f('+994 50 111 22 33') }, { tel: '+994501112233', wa: '994501112233' });
  assert.deepStrictEqual({ ...f('050-111-22-33') }, { tel: '+994501112233', wa: '994501112233' });
  assert.deepStrictEqual({ ...f('(50) 111 22 33') }, { tel: '+994501112233', wa: '994501112233' });
  assert.deepStrictEqual({ ...f('00994501112233') }, { tel: '+994501112233', wa: '994501112233' });
  assert.deepStrictEqual({ ...f('+7 912 345 67 89') }, { tel: '+79123456789', wa: '79123456789' });
  assert.strictEqual(f('12'), null);
  assert.strictEqual(f('javascript:alert(1)'), null);
  // Dinamik dəyərlər esc() ilə; inline handler yoxdur; WhatsApp linki noopener
  assert.ok(!/\son[a-z]+=/i.test(src));
  assert.match(src, /wa\.me\/\$\{esc\(n\.wa\)\}" target="_blank" rel="noopener noreferrer"/);
  for (const k of ['l.name', 'l.client', 'l.managerNote', 'l.note']) assert.ok(src.includes(`esc(${k}`), k);
});
