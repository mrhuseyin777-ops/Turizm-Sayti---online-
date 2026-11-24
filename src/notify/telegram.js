// Telegram Bot API: sendMessage (https://api.telegram.org/bot<token>/sendMessage), parse_mode=HTML.
// Token heç vaxt loga/xəta mətninə yazılmır. Vaxt limiti: 5 s (AbortSignal.timeout).
const API_HOST = 'https://api.telegram.org';
const TOKEN_RE = /^\d{5,15}:[A-Za-z0-9_-]{30,64}$/;
const CHAT_ID_RE = /^(-?\d{1,20}|@[A-Za-z][A-Za-z0-9_]{4,31})$/;

class NotifyError extends Error {
  constructor(message, { retryable = true, status = null } = {}) { super(message); this.name = 'NotifyError'; this.retryable = retryable; this.status = status; }
}

async function sendTelegram({ token, chatId, html, fetchImpl = globalThis.fetch, timeoutMs = 5000 }) {
  if (!TOKEN_RE.test(String(token || ''))) throw new NotifyError('Telegram token formatı yanlışdır', { retryable: false });
  if (!CHAT_ID_RE.test(String(chatId || ''))) throw new NotifyError('Telegram chat_id formatı yanlışdır', { retryable: false });
  let res;
  try {
    res = await fetchImpl(`${API_HOST}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error',
    });
  } catch (e) {
    // Şəbəkə xətası / vaxt limiti — yenidən cəhd edilir. Mətn tokensiz (URL xəta mətninə düşə bilər).
    const reason = e && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'vaxt limiti (5 s)' : 'şəbəkə xətası';
    throw new NotifyError(`Telegram: ${reason}`, { retryable: true });
  }
  let body = null;
  try { body = await res.json(); } catch { /* JSON deyil */ }
  if (res.ok && body && body.ok) return { ok: true, messageId: body.result && body.result.message_id };
  const desc = body && typeof body.description === 'string' ? body.description.replace(String(token), '***').slice(0, 200) : `HTTP ${res.status}`;
  // 429 (limit) və 5xx — müvəqqəti; 400/401/403/404 — konfiqurasiya xətası (chat_id/token), təkrar etmə
  const retryable = res.status === 429 || res.status >= 500;
  throw new NotifyError(`Telegram ${res.status}: ${desc}`, { retryable, status: res.status });
}

module.exports = { sendTelegram, NotifyError, TOKEN_RE, CHAT_ID_RE, API_HOST };
