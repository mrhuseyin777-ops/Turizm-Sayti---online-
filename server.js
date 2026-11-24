const express = require('express');
const path = require('path');
const fs = require('fs');
const env = require('./src/env');
// Xəta monitorinqi (Sentry) — yalnız SENTRY_DSN varsa yüklənir; yoxdursa no-op, şəbəkə sorğusu yoxdur
const sentry = require('./src/observability/sentry');
sentry.init();
const { logger } = require('./src/observability/logger');
const { requestContext, requestLogger } = require('./src/observability/http');
const config = require('./src/config');
const { search, suggest, QueryError } = require('./src/search');
const { providers } = require('./src/providers');
const { boardLabels } = require('./src/data/catalog');
const { publicSupport } = require('./src/support');
const { securityHeaders, parseQueryString, sanitizeBody, requireJson, checkOrigin, notFound, errorHandler } = require('./src/security/http');
const { rateLimit } = require('./src/security/rateLimit');
const { seedDemoAccount, seedBootstrapAdmin } = require('./src/auth');
const storage = require('./src/storage');
const { startCleanup } = require('./src/storage/cleanup');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
// Sorğu parametrləri: yalnız sadə string-lər (iç-içə obyekt/massiv yox) — bax src/security/http.js
app.set('query parser', parseQueryString);
app.set('json spaces', 0);

// 0) Request id (X-Request-Id) və /api/* sorğu logu (metod, yol — query-siz, status, müddət)
app.use(requestContext);
app.use('/api/', requestLogger);

// 1) Təhlükəsizlik başlıqları (CSP, nosniff, frame-ancestors, HSTS və s.) — hər cavaba
app.use(securityHeaders);

// 2) Ümumi API limiti (IP üzrə). Endpoint-spesifik limitlər marşrutlarda əlavə olunur.
app.use('/api/', rateLimit({ name: 'api', windowMs: 5 * 60 * 1000, max: env.apiRateLimit }));
// Ağır axtarış endpoint-ləri üçün ayrıca limit (provayderlərə sorğu göndərir)
const searchLimit = rateLimit({ name: 'search', windowMs: 60 * 1000, max: 60 });
app.use(['/api/search', '/api/explore', '/api/flights/search', '/api/cars/search', '/api/cars/transfers'], searchLimit);

// 3) Vəziyyəti dəyişən sorğular: Origin yoxlaması (CSRF), yalnız JSON, ölçü limiti 16 KB,
//    prototype pollution / dərinlik yoxlaması
app.use('/api/', checkOrigin);
app.use('/api/', requireJson);
app.use(express.json({ limit: '16kb', strict: true, type: 'application/json' }));
app.use(sanitizeBody);

// 4) Statik fayllar (gizli fayllar verilmir; HTML keşlənmir ki, CSP/JS yeniləmələri dərhal tətbiq olunsun)
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'ignore',
  index: 'index.html',
  setHeaders(res, file) {
    if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  },
}));

app.get('/api/config', (req, res) => {
  res.json({
    brand: config.brand,
    currencies: Object.keys(config.rates),
    boards: boardLabels,
    providers: providers.map(({ id, name, color, kind, demo, sells, trust }) => ({ id, name, color, kind, demo, sells, trust })),
    installment: config.installment,
    lastMinuteDays: config.lastMinuteDays,
    // Operator məzənnəsi (USD/AZN, tarix) — DEMO; tarix/gecə aralığı limitləri (UI validasiyası üçün)
    operatorRate: config.operatorRate,
    // Dəstək əlaqəsi (telefon / WhatsApp): yalnız düzgün formatlı nömrələr, əks halda null → UI-da gizli
    support: publicSupport(config.support),
    searchLimits: { maxDateRangeDays: config.searchLimits.maxDateRangeDays, maxNightsSpan: config.searchLimits.maxNightsSpan, maxCombos: config.searchLimits.maxCombos },
  });
});

app.get('/api/suggest', (req, res) => res.json(suggest(req.query.q)));

app.get('/api/search', async (req, res, next) => {
  try {
    res.json(await search(req.query));
  } catch (e) {
    if (e instanceof QueryError) return res.status(400).json({ error: e.message });
    next(e); // daxili xəta — mesaj istifadəçiyə göstərilmir
  }
});

// Müraciətlər (/api/leads), B2B seçim linkləri və /api/explore: src/routes/tours.js
// B2B giriş/çıxış/me/leads: src/routes/b2b.js

// Modullar (aviabilet, avtomobil və s.): src/routes/*.js faylları avtomatik qoşulur.
// Hər fayl express.Router() export edir və öz yollarını (/api/<modul>/...) özü təyin edir.
const routesDir = path.join(__dirname, 'src', 'routes');
if (fs.existsSync(routesDir)) {
  for (const f of fs.readdirSync(routesDir).filter((x) => x.endsWith('.js')).sort()) {
    app.use(require(path.join(routesDir, f)));
  }
}

app.get('/b2b', (req, res) => res.sendFile(path.join(__dirname, 'public', 'b2b.html'), { headers: { 'Cache-Control': 'no-cache' } }));

// 5) 404 (JSON) və mərkəzləşdirilmiş xəta handler (stack göstərilmir)
app.use(notFound);
app.use(errorHandler);

// Saxlama qatı: PostgreSQL rejimində miqrasiyalar (advisory lock ilə), sonra hesabların seed-i.
// Dev/test: env ilə demo B2B hesabı (production-da işləmir); hostinq: env-dən ilk admin.
const ready = storage.init().then(() => Promise.all([
  seedDemoAccount().catch((e) => logger.error('[auth] demo hesab yaradılmadı', { err: e.message })),
  seedBootstrapAdmin().catch((e) => logger.error('[auth] admin hesabı yaradılmadı', { err: e.message })),
]));
// /readyz: başlanğıc bitməyibsə və ya alınmayıbsa 503
app.locals.readyState = 'pending';
ready.then(() => { app.locals.readyState = 'ok'; }, () => { app.locals.readyState = 'failed'; });
ready.catch(() => {}); // xəta aşağıda (main) və ya ready-ni gözləyən testdə işlənir
app.locals.ready = ready;

if (require.main === module) {
  // Tutulmamış xəta prosesi dayandırmazdan əvvəl loga düşsün (davranışı dəyişmir — yalnız müşahidə)
  process.on('uncaughtExceptionMonitor', (err, origin) => logger.error('[process] tutulmamış xəta', { origin, err }));
  if (env.isProd && !env.trustProxy) logger.warn('[config] TRUST_PROXY təyin olunmayıb: proxy arxasındasınızsa rate limit bütün istifadəçiləri bir IP kimi görəcək.');
  ready.then(() => {
    const server = app.listen(env.port, env.host, () => logger.info(`${config.brand.name} işləyir: http://localhost:${env.port}`, { env: env.nodeEnv, storage: storage.mode(), sentry: sentry.enabled() }));
    // Yavaş klient (slowloris) və asılı qalan bağlantılara qarşı vaxt limitləri
    server.headersTimeout = 20 * 1000;
    server.requestTimeout = 30 * 1000;
    server.keepAliveTimeout = 5 * 1000;
    server.maxRequestsPerSocket = 1000;
    // Data retention: köhnə müraciətlər, bitmiş sessiya/izləmə/seçim linkləri (src/storage/cleanup.js)
    if (env.cleanupEnabled) startCleanup();
    // Hostinq dayandırma siqnalı: yeni bağlantıları qəbul etmə, DB hovuzunu bağla
    const shutdown = (sig) => {
      logger.info(`[server] ${sig}: dayandırılır`);
      server.close(() => Promise.all([storage.close().catch(() => {}), sentry.flush(2000).catch(() => {})]).finally(() => process.exit(0)));
      server.closeIdleConnections();
      setTimeout(() => process.exit(0), 10 * 1000).unref();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  }, (e) => {
    // DB-yə qoşulmaq / miqrasiya alınmadı — server açılmır (hostinq prosesi yenidən başladacaq)
    logger.error('[storage] başlanğıc alınmadı', { err: e.message });
    sentry.captureException(e);
    sentry.flush(2000).finally(() => process.exit(1));
  });
}

module.exports = app;
