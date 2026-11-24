// B2B agentlik hesabları: giriş, çıxış, cari istifadəçi, müraciətlər.
//   POST /api/b2b/login   { username, password }  → httpOnly sessiya cookie + csrfToken
//   POST /api/b2b/logout  (X-CSRF-Token)
//   GET  /api/b2b/me      → { authenticated, user, agency, csrfToken } (girişsiz: { authenticated:false })
//   GET  /api/b2b/leads[?status=] → yalnız SESSİYADAKI agentliyin leadləri + status sayları (agency parametri qəbul edilmir)
//   PATCH /api/b2b/leads/:id { status?, note? } (X-CSRF-Token) — yalnız öz agentliyinin müraciəti (IDOR → 404)
//   GET  /api/b2b/settings → bildiriş ayarları (Telegram chat_id, e-poçt) + serverdə kanalların vəziyyəti
//   PUT  /api/b2b/settings { telegramChatId, notifyEmail } (X-CSRF-Token, YALNIZ role=admin)
//   POST /api/b2b/settings/telegram-test { chatId? } (X-CSRF-Token, YALNIZ role=admin) — test mesajı
const express = require('express');
const { login, resolve, requireAuth, requireCsrf, publicMe, AuthError } = require('../auth');
const sessions = require('../auth/sessions');
const { InputError, leadsForAgency, leadCountsForAgency, updateLeadForAgency } = require('../leads');
const { rateLimit } = require('../security/rateLimit');
const storage = require('../storage');
const notify = require('../notify');
const { CHAT_ID_RE } = require('../notify/telegram');
const { EMAIL_RE } = require('../notify/email');

const router = express.Router();

// Ümumi giriş sorğusu limiti (uğurlu + uğursuz), brute-force sayğaclarından əlavə
const loginLimit = rateLimit({ name: 'login', windowMs: 60 * 1000, max: 10, message: 'Çox sayda giriş cəhdi. Bir dəqiqə sonra yenidən cəhd edin.' });

router.post('/api/b2b/login', loginLimit, async (req, res, next) => {
  try {
    res.json(await login(req.body, req, res));
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.retryAfter) res.set('Retry-After', String(e.retryAfter));
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
});

router.post('/api/b2b/logout', requireAuth, requireCsrf, async (req, res, next) => {
  try {
    await sessions.destroy(req.auth.key, res);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/api/b2b/me', async (req, res, next) => {
  try {
    const a = await resolve(req);
    if (!a) return res.json({ authenticated: false });
    res.json(publicMe(a.user, a.agency, a.session));
  } catch (e) { next(e); }
});

router.get('/api/b2b/leads', requireAuth, async (req, res, next) => {
  try {
    const agencyId = req.auth.agency.id;
    const [leads, counts] = await Promise.all([leadsForAgency(agencyId, { status: req.query.status }), leadCountsForAgency(agencyId)]);
    res.json({ leads, counts });
  } catch (e) { next(e); }
});

const leadPatchLimit = rateLimit({ name: 'lead-patch', windowMs: 60 * 1000, max: 60, key: (req) => req.auth.user.id });
router.patch('/api/b2b/leads/:id', requireAuth, requireCsrf, leadPatchLimit, async (req, res, next) => {
  try {
    const { user, agency } = req.auth;
    const lead = await updateLeadForAgency(agency.id, req.params.id, req.body, { by: user.displayName || user.username });
    if (!lead) return res.status(404).json({ error: 'Müraciət tapılmadı' });
    res.json({ ok: true, lead });
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

// ---------------------------------------------------------------- Agentlik ayarları (bildirişlər)
function requireAdmin(req, res, next) {
  if (!req.auth || req.auth.user.role !== 'admin') return res.status(403).json({ error: 'Bu əməliyyat yalnız agentlik administratoru üçündür' });
  next();
}

function validateSettings(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new InputError('Sorğu formatı düzgün deyil');
  if (Object.keys(b).some((k) => k !== 'telegramChatId' && k !== 'notifyEmail')) throw new InputError('İcazə verilməyən sahə(lər)');
  const chat = typeof b.telegramChatId === 'string' ? b.telegramChatId.trim() : (b.telegramChatId == null ? '' : null);
  const email = typeof b.notifyEmail === 'string' ? b.notifyEmail.trim() : (b.notifyEmail == null ? '' : null);
  if (chat === null || (chat && !CHAT_ID_RE.test(chat))) throw new InputError('Telegram chat_id rəqəm (məs. -1001234567890) və ya @kanal_adi olmalıdır');
  if (email === null || (email && (email.length > 120 || !EMAIL_RE.test(email)))) throw new InputError('Bildiriş e-poçtu düzgün deyil');
  return { telegramChatId: chat || null, notifyEmail: email || null };
}

async function settingsView(agencyId, user) {
  const s = (await storage.get().agencySettings.get(agencyId)) || {};
  const st = notify.get().status();
  return {
    telegramChatId: s.telegramChatId || '',
    notifyEmail: s.notifyEmail || '',
    updatedAt: s.updatedAt || null,
    updatedBy: s.updatedBy || null,
    channels: { telegram: st.telegram, email: st.email },
    canEdit: user.role === 'admin',
  };
}

router.get('/api/b2b/settings', requireAuth, async (req, res, next) => {
  try { res.json(await settingsView(req.auth.agency.id, req.auth.user)); } catch (e) { next(e); }
});

router.put('/api/b2b/settings', requireAuth, requireCsrf, requireAdmin, async (req, res, next) => {
  try {
    const { user, agency } = req.auth;
    const v = validateSettings(req.body);
    await storage.get().agencySettings.set(agency.id, { ...v, updatedBy: String(user.displayName || user.username).slice(0, 80) });
    console.info('[b2b] bildiriş ayarları yeniləndi', { agency: agency.id, user: user.id, telegram: !!v.telegramChatId, email: !!v.notifyEmail });
    res.json({ ok: true, settings: await settingsView(agency.id, user) });
  } catch (e) {
    if (e instanceof InputError) return res.status(400).json({ error: e.message });
    next(e);
  }
});

const tgTestLimit = rateLimit({ name: 'tg-test', windowMs: 60 * 1000, max: 5, key: (req) => req.auth.user.id, message: 'Çox sayda test mesajı. Bir dəqiqə sonra yenidən cəhd edin.' });
router.post('/api/b2b/settings/telegram-test', requireAuth, requireCsrf, requireAdmin, tgTestLimit, async (req, res, next) => {
  try {
    const b = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    let chatId = typeof b.chatId === 'string' ? b.chatId.trim() : '';
    if (!chatId) chatId = ((await storage.get().agencySettings.get(req.auth.agency.id)) || {}).telegramChatId || '';
    if (!chatId) return res.status(400).json({ error: 'Əvvəlcə Telegram chat_id daxil edin' });
    if (!CHAT_ID_RE.test(chatId)) return res.status(400).json({ error: 'Telegram chat_id rəqəm (məs. -1001234567890) və ya @kanal_adi olmalıdır' });
    await notify.get().sendTestTelegram(chatId, req.auth.agency.name);
    res.json({ ok: true });
  } catch (e) {
    if (e && e.name === 'NotifyError') {
      if (e.status === 503) return res.status(503).json({ error: e.message });
      if (e.status === 401 || e.status === 404) return res.status(502).json({ error: 'Serverdəki TELEGRAM_BOT_TOKEN qəbul edilmədi — hostinq ayarlarını yoxlayın' });
      // 400/403: chat tapılmadı və ya bot qrupda deyil — istifadəçiyə aydın izah
      if (e.status && e.status < 500 && e.status !== 429) return res.status(400).json({ error: 'Telegram mesajı qəbul etmədi: chat_id-ni yoxlayın və botun həmin qrupa/söhbətə əlavə olunduğuna əmin olun' });
      return res.status(502).json({ error: 'Telegram-a qoşulmaq alınmadı. Bir az sonra yenidən cəhd edin.' });
    }
    next(e);
  }
});

module.exports = router;
