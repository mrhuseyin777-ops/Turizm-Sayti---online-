// E-poçt bildirişi (ixtiyari): SMTP_URL (smtp:// və ya smtps://user:pass@host:port) + NOTIFY_EMAIL_FROM.
// nodemailer yalnız SMTP_URL təyin olunanda yüklənir. Vaxt limitləri 5 s. Yalnız text/plain göndərilir.
const { NotifyError } = require('./telegram');

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;

function validSmtpUrl(raw) {
  try {
    const u = new URL(String(raw || ''));
    return ['smtp:', 'smtps:'].includes(u.protocol) && !!u.hostname;
  } catch { return false; }
}

let cached = null; // { url, transport }
function getTransport(smtpUrl) {
  if (cached && cached.url === smtpUrl) return cached.transport;
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport(smtpUrl, { connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 5000 });
  cached = { url: smtpUrl, transport };
  return transport;
}

async function sendEmail({ smtpUrl, from, to, subject, text, transport }) {
  if (!EMAIL_RE.test(String(to || ''))) throw new NotifyError('Bildiriş e-poçtu formatı yanlışdır', { retryable: false });
  const t = transport || getTransport(smtpUrl);
  try {
    await t.sendMail({ from, to, subject: String(subject).replace(/[\r\n]+/g, ' ').slice(0, 200), text });
    return { ok: true };
  } catch (e) {
    const code = e && (e.responseCode || e.code);
    // 5xx SMTP cavabı (məs. ünvan rədd edildi, auth xətası) — təkrar etmə; şəbəkə/4xx — təkrar
    const retryable = !(typeof code === 'number' && code >= 500) && code !== 'EAUTH' && code !== 'EENVELOPE';
    throw new NotifyError(`SMTP: ${code || 'xəta'}`, { retryable });
  }
}

module.exports = { sendEmail, validSmtpUrl, EMAIL_RE };
