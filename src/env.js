// Mühit konfiqurasiyası — yalnız mühit dəyişənlərindən (env) oxunur, repoda sirr saxlanılmır.
// Bax: .env.example və SECURITY.md
const path = require('path');

const raw = process.env;
const nodeEnv = raw.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// TRUST_PROXY: Express "trust proxy" dəyəri. Boş = proxy-yə etibar yoxdur (req.ip = socket ünvanı).
//   "1" / "2"     — qarşıda neçə proxy var (məs. Cloudflare → nginx = 2)
//   "loopback"    — yalnız 127.0.0.1/::1 proxy-sinə etibar (eyni serverdə nginx)
//   "10.0.0.0/8"  — vergüllə ayrılmış IP/subnet siyahısı
// "true" TÖVSİYƏ OLUNMUR: hər kəs X-Forwarded-For ilə IP saxtalaşdırıb rate limit-i keçə bilər.
function parseTrustProxy(v) {
  if (v === undefined || v === '' || v === 'false' || v === '0') return false;
  if (v === 'true') return true;
  if (/^\d+$/.test(v)) return Number(v);
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

const int = (v, def, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

module.exports = {
  nodeEnv,
  isProd,
  isTest: nodeEnv === 'test' || !!raw.NODE_TEST_CONTEXT,
  port: int(raw.PORT, 3000, 1, 65535),
  host: raw.HOST || undefined,
  trustProxy: parseTrustProxy(raw.TRUST_PROXY),
  // Əlavə icazəli Origin-lər (vergüllə), məs. "https://odiola.az,https://www.odiola.az".
  // Öz host-umuz həmişə icazəlidir.
  allowedOrigins: (raw.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  // Hesabların saxlandığı qovluq (git-ə düşmür, bax .gitignore)
  dataDir: path.resolve(raw.TURTAP_DATA_DIR || path.join(__dirname, '..', 'data')),
  // Sessiya: hərəkətsizlik və mütləq müddət (dəqiqə)
  sessionIdleMinutes: int(raw.SESSION_IDLE_MINUTES, 120, 5, 24 * 60),
  sessionMaxMinutes: int(raw.SESSION_MAX_MINUTES, 12 * 60, 15, 7 * 24 * 60),
  // Cookie Secure bayrağı: production-da həmişə; dev-də COOKIE_SECURE=1 ilə
  cookieSecure: isProd || raw.COOKIE_SECURE === '1',
  // Ümumi API limiti (IP üzrə, 5 dəqiqədə)
  apiRateLimit: int(raw.API_RATE_LIMIT, 600, 10, 100000),
  // Yalnız dev/test: env ilə demo B2B hesabı (production-da HEÇ VAXT işləmir)
  demoAccount: !isProd && raw.B2B_DEMO_USER && raw.B2B_DEMO_PASSWORD
    ? { agency: raw.B2B_DEMO_AGENCY || 'Demo Agentlik', username: raw.B2B_DEMO_USER, password: raw.B2B_DEMO_PASSWORD, displayName: raw.B2B_DEMO_NAME || 'Demo Menecer' }
    : null,
  // PostgreSQL (bax docs/OPERATIONS.md). Boşdursa: fayl/yaddaş rejimi (dev/test; production-da xəbərdarlıq).
  // `node --test` altında DATABASE_URL nəzərə alınmır (shell-də qalmış real baza URL-i testlərlə
  // çirklənməsin); yalnız test/db.test.js öz müvəqqəti sxemi üçün ETOUR_TEST_DB=1 ilə açır.
  databaseUrl: (raw.NODE_TEST_CONTEXT && raw.ETOUR_TEST_DB !== '1') ? '' : (raw.DATABASE_URL || ''),
  // require — TLS + sertifikat yoxlaması; no-verify — TLS, sertifikat yoxlanmır (zəif, yalnız məcburi hallarda);
  // disable / boş — TLS yox (məs. Render daxili şəbəkəsi). URL-də ?sslmode= varsa, o üstündür.
  databaseSsl: ['require', 'no-verify', 'disable'].includes(raw.DATABASE_SSL) ? raw.DATABASE_SSL : 'disable',
  databasePoolMax: int(raw.DATABASE_POOL_MAX, 5, 1, 50),
  // Şəxsi məlumatların saxlanma müddəti (gün): müraciətlər/leadlər, avia/avto müraciətləri
  dataRetentionDays: int(raw.DATA_RETENTION_DAYS, 180, 1, 3650),
  // Dövri təmizləmə işi (retention, bitmiş sessiya/izləmə/seçim linkləri). Testlərdə default söndürülüb;
  // DATA_CLEANUP=0 — söndür, DATA_CLEANUP=1 — test rejimində də işə sal.
  cleanupEnabled: raw.DATA_CLEANUP === '1' || (raw.DATA_CLEANUP !== '0' && !(nodeEnv === 'test' || !!raw.NODE_TEST_CONTEXT)),
  cleanupIntervalMinutes: int(raw.DATA_CLEANUP_INTERVAL_MINUTES, 60, 1, 24 * 60),
  // İstəyə görə: IP hash-i üçün gizli açar (HMAC). Təyin olunmasa sadə SHA-256 (prefiksli) istifadə olunur.
  ipHashSecret: raw.IP_HASH_SECRET || '',
  // Loglama: debug | info | warn | error | silent. Default: test rejimində warn (sorğu logları testləri
  // doldurmasın), qalanında info. Production-da JSON (sətir başına bir obyekt), dev-də oxunaqlı format.
  logLevel: ['debug', 'info', 'warn', 'error', 'silent'].includes(raw.LOG_LEVEL) ? raw.LOG_LEVEL
    : (nodeEnv === 'test' || !!raw.NODE_TEST_CONTEXT ? 'warn' : 'info'),
  logFormat: raw.LOG_FORMAT === 'json' || raw.LOG_FORMAT === 'pretty' ? raw.LOG_FORMAT : (isProd ? 'json' : 'pretty'),
  // İstəyə görə: Sentry (server xətaları). Boşdursa @sentry/node yüklənmir və heç bir şəbəkə sorğusu getmir.
  sentryDsn: (raw.SENTRY_DSN || '').trim(),
  sentryEnvironment: raw.SENTRY_ENVIRONMENT || nodeEnv,
  // Hostinq üçün ilk admin hesabı (production-da da işləyir). Parol YALNIZ hostinqin gizli env
  // dəyişənində saxlanılır (repoda yox). Terminalı olmayan hostinqlərdə (məs. Render pulsuz) B2B-yə
  // ilk girişi təmin edir; hesab yaddaşda yaradılır və hər açılışda yenidən yoxlanılır.
  bootstrapAdmin: raw.B2B_ADMIN_USER && raw.B2B_ADMIN_PASSWORD
    ? { agency: raw.B2B_ADMIN_AGENCY || 'Odiola', username: raw.B2B_ADMIN_USER, password: raw.B2B_ADMIN_PASSWORD, displayName: raw.B2B_ADMIN_NAME || 'Admin' }
    : null,
};
