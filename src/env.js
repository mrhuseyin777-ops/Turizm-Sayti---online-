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
  // Əlavə icazəli Origin-lər (vergüllə), məs. "https://etour.az,https://www.etour.az".
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
  // Hostinq üçün ilk admin hesabı (production-da da işləyir). Parol YALNIZ hostinqin gizli env
  // dəyişənində saxlanılır (repoda yox). Terminalı olmayan hostinqlərdə (məs. Render pulsuz) B2B-yə
  // ilk girişi təmin edir; hesab yaddaşda yaradılır və hər açılışda yenidən yoxlanılır.
  bootstrapAdmin: raw.B2B_ADMIN_USER && raw.B2B_ADMIN_PASSWORD
    ? { agency: raw.B2B_ADMIN_AGENCY || 'eTour', username: raw.B2B_ADMIN_USER, password: raw.B2B_ADMIN_PASSWORD, displayName: raw.B2B_ADMIN_NAME || 'Admin' }
    : null,
};
