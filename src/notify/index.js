// Müraciət bildirişləri: Telegram (Bot API) və ixtiyari e-poçt (SMTP).
//
// Alıcılar:
//   - agentliyə bağlı müraciət (B2B seçim linki) → həmin agentliyin ayarlarındakı Telegram chat_id və
//     bildiriş e-poçtu (B2B → Ayarlar, storage.agencySettings)
//   - ümumi müraciət ("Sizə zəng edək", tur/otel, avia, avto) → env TELEGRAM_ADMIN_CHAT_ID / NOTIFY_ADMIN_EMAIL
//
// Göndərmə asinxrondur (src/notify/queue.js): leadCreated() dərhal qayıdır, müraciət cavabı gecikmir.
// Uğursuzluq loglanır (chat_id/e-poçt maskalanır, müştəri məlumatı loga yazılmır) — müraciət artıq saxlanılıb.
// Şəbəkə: TELEGRAM_BOT_TOKEN yoxdursa Telegram-a, SMTP_URL yoxdursa SMTP-yə sorğu getmir; test rejimində
// (env.isTest) default notifier heç bir şəbəkə sorğusu göndərmir (testlər öz stub-larını ötürür).
const env = require('../env');
const { logger } = require('../observability/logger');
const { maskEmail } = require('../security/mask');
const { createQueue } = require('./queue');
const { sendTelegram, TOKEN_RE, CHAT_ID_RE, NotifyError } = require('./telegram');
const { sendEmail, validSmtpUrl, EMAIL_RE } = require('./email');
const { buildLeadMessage, buildTestMessage, publicBaseUrl } = require('./format');

const maskChat = (id) => { const s = String(id || ''); return s.length <= 4 ? '***' : `***${s.slice(-3)}`; };
const validFrom = (s) => /@/.test(s) && !/[\r\n]/.test(s) && s.length <= 200;

function createNotifier({
  telegramToken = '', adminChatId = '', smtpUrl = '', emailFrom = '', adminEmail = '',
  baseUrl = publicBaseUrl(), network = true, fetchImpl, mailTransport, getSettings, queue: queueOpts = {}, log = logger,
} = {}) {
  const telegramOn = network && TOKEN_RE.test(telegramToken);
  const emailOn = network && validSmtpUrl(smtpUrl) && validFrom(emailFrom);
  if (network && telegramToken && !telegramOn) log.warn('[notify] TELEGRAM_BOT_TOKEN formatı yanlışdır — Telegram bildirişləri söndürülüb');
  if (network && adminChatId && !CHAT_ID_RE.test(adminChatId)) log.warn('[notify] TELEGRAM_ADMIN_CHAT_ID formatı yanlışdır');
  const settingsOf = getSettings || ((agencyId) => require('../storage').get().agencySettings.get(agencyId));

  const queue = createQueue({
    retries: 3,
    baseDelayMs: 1000,
    ...queueOpts,
    onError: (err, { name, attempt, final }) => {
      const fields = { job: name, attempt, final, err: err && err.message ? err.message : String(err) };
      if (final) log.error('[notify] bildiriş göndərilmədi', fields);
      else log.warn('[notify] bildiriş alınmadı, yenidən cəhd ediləcək', fields);
    },
    onDrop: ({ name }) => log.error('[notify] növbə dolub, bildiriş atıldı', { job: name }),
  });

  const telegram = (chatId, html) => sendTelegram({ token: telegramToken, chatId, html, fetchImpl: fetchImpl || globalThis.fetch });
  const email = (to, msg) => sendEmail({ smtpUrl, from: emailFrom, to, subject: msg.subject, text: msg.text, transport: mailTransport });

  // kind: selection | callback | offer | flight | car; rec — saxlanılmış qeyd. Heç vaxt xəta atmır.
  function leadCreated(kind, rec) {
    if ((!telegramOn && !emailOn) || !rec) return false;
    return queue.push(`resolve:${kind}#${rec.id}`, async () => {
      let chatId = adminChatId;
      let to = adminEmail;
      if (rec.agencyId) {
        const s = (await settingsOf(rec.agencyId)) || {};
        chatId = s.telegramChatId || '';
        to = s.notifyEmail || '';
      }
      const msg = buildLeadMessage(kind, rec, { baseUrl });
      if (telegramOn && chatId && CHAT_ID_RE.test(chatId)) queue.push(`telegram:${maskChat(chatId)}`, () => telegram(chatId, msg.html));
      if (emailOn && to && EMAIL_RE.test(to)) queue.push(`email:${maskEmail(to)}`, () => email(to, msg));
    });
  }

  // B2B → Ayarlar → "Test mesajı göndər": birbaşa (növbəsiz) göndərilir, nəticə istifadəçiyə qayıdır
  async function sendTestTelegram(chatId, agencyName) {
    if (!telegramOn) throw new NotifyError('Telegram qoşulmayıb: serverdə TELEGRAM_BOT_TOKEN təyin olunmayıb', { retryable: false, status: 503 });
    const r = await telegram(chatId, buildTestMessage(agencyName).html);
    log.info('[notify] test mesajı göndərildi', { chat: maskChat(chatId) });
    return r;
  }

  return {
    leadCreated,
    sendTestTelegram,
    status: () => ({ telegram: telegramOn, email: emailOn, adminChat: telegramOn && CHAT_ID_RE.test(adminChatId) }),
    idle: () => queue.idle(),
    queue,
  };
}

let current = null;
function get() {
  if (!current) {
    const n = env.notify;
    current = createNotifier({
      telegramToken: n.telegramToken, adminChatId: n.telegramAdminChatId, smtpUrl: n.smtpUrl, emailFrom: n.emailFrom, adminEmail: n.adminEmail,
      network: !env.isTest,
    });
  }
  return current;
}
// Testlər üçün: başqa notifier qoş (null → default)
function use(n) { current = n; }

// Müraciət modullarından çağırılır: heç vaxt xəta atmır, gözlənilmir
function leadCreated(kind, rec) {
  try { return get().leadCreated(kind, rec); } catch (e) {
    logger.error('[notify] növbəyə əlavə olunmadı', { err: e.message });
    return false;
  }
}

module.exports = { createNotifier, get, use, leadCreated };
