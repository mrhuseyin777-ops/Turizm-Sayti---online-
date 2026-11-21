// İstəyə görə xəta monitorinqi (Sentry). SENTRY_DSN təyin olunmayıbsa @sentry/node HEÇ YÜKLƏNMİR və heç bir
// şəbəkə sorğusu getmir; bütün funksiyalar no-op-dur.
//
// Şəxsi məlumat göndərilmir: sendDefaultPii=false (IP, cookie, istifadəçi yoxdur), performans izləmə (tracing)
// söndürülüb, beforeSend hadisədən cookie/authorization başlıqlarını, body-ni, query string-i və user-i silir,
// mətnlərdə e-poçt/telefonu maskalayır; konsol breadcrumb-ları göndərilmir.
const env = require('../env');
const { scrubText } = require('./logger');

let Sentry = null;

const DROP_HEADERS = /^(cookie|authorization|proxy-authorization|x-csrf-token|x-forwarded-for|x-real-ip|forwarded|set-cookie)$/i;

function stripQuery(u) {
  if (typeof u !== 'string') return u;
  const i = u.search(/[?#]/);
  return i === -1 ? u : u.slice(0, i);
}

// Sentry-yə göndərilməzdən əvvəl hadisəni təmizlə (testlərdə birbaşa yoxlanılır)
function scrubEvent(event) {
  if (!event || typeof event !== 'object') return event;
  delete event.user;
  if (event.request) {
    const r = event.request;
    delete r.cookies;
    delete r.data;
    delete r.query_string;
    delete r.env;
    if (r.url) r.url = stripQuery(r.url);
    if (r.headers && typeof r.headers === 'object') {
      for (const k of Object.keys(r.headers)) if (DROP_HEADERS.test(k)) delete r.headers[k];
    }
  }
  if (typeof event.message === 'string') event.message = scrubText(event.message);
  const values = event.exception && Array.isArray(event.exception.values) ? event.exception.values : [];
  for (const ex of values) {
    if (typeof ex.value === 'string') ex.value = scrubText(ex.value);
    // Lokal dəyişənlər (vars) şəxsi məlumat daşıya bilər
    const frames = ex.stacktrace && Array.isArray(ex.stacktrace.frames) ? ex.stacktrace.frames : [];
    for (const f of frames) delete f.vars;
  }
  if (Array.isArray(event.breadcrumbs)) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter(Boolean);
  return event;
}

function scrubBreadcrumb(b) {
  if (!b || b.category === 'console') return null;
  if (b.data && typeof b.data === 'object') {
    if (b.data.url) b.data.url = stripQuery(b.data.url);
    delete b.data['http.query'];
    delete b.data['http.fragment'];
  }
  if (typeof b.message === 'string') b.message = scrubText(b.message);
  return b;
}

function init() {
  if (Sentry || !env.sentryDsn) return false;
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
    sendDefaultPii: false,
    includeLocalVariables: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 30,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
  return true;
}

// Server xətası (5xx). Yalnız metod, yol şablonu (query-siz, id-lər maskalanmış) və request id əlavə olunur.
function captureException(err, { requestId, method, path } = {}) {
  if (!Sentry) return;
  Sentry.withScope((scope) => {
    if (requestId) scope.setTag('request_id', requestId);
    if (method || path) scope.setContext('request', { method, path: stripQuery(path) });
    Sentry.captureException(err);
  });
}

const flush = (ms = 2000) => (Sentry ? Sentry.flush(ms) : Promise.resolve(true));
const enabled = () => !!Sentry;

module.exports = { init, captureException, flush, enabled, scrubEvent, scrubBreadcrumb };
