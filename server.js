const express = require('express');
const path = require('path');
const fs = require('fs');
const env = require('./src/env');
const config = require('./src/config');
const { search, suggest, QueryError } = require('./src/search');
const { providers } = require('./src/providers');
const { boardLabels } = require('./src/data/catalog');
const { securityHeaders, parseQueryString, sanitizeBody, requireJson, checkOrigin, notFound, errorHandler } = require('./src/security/http');
const { rateLimit } = require('./src/security/rateLimit');
const { seedDemoAccount } = require('./src/auth');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.trustProxy);
// Sorğu parametrləri: yalnız sadə string-lər (iç-içə obyekt/massiv yox) — bax src/security/http.js
app.set('query parser', parseQueryString);
app.set('json spaces', 0);

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

// Dev/test: env ilə demo B2B hesabı (production-da işləmir)
const ready = seedDemoAccount().catch((e) => console.error('[auth] demo hesab yaradılmadı:', e.message));
app.locals.ready = ready;

if (require.main === module) {
  if (env.isProd && !env.trustProxy) console.warn('[config] TRUST_PROXY təyin olunmayıb: proxy arxasındasınızsa rate limit bütün istifadəçiləri bir IP kimi görəcək.');
  const server = app.listen(env.port, env.host, () => console.log(`${config.brand.name} işləyir: http://localhost:${env.port} (${env.nodeEnv})`));
  // Yavaş klient (slowloris) və asılı qalan bağlantılara qarşı vaxt limitləri
  server.headersTimeout = 20 * 1000;
  server.requestTimeout = 30 * 1000;
  server.keepAliveTimeout = 5 * 1000;
  server.maxRequestsPerSocket = 1000;
}

module.exports = app;
