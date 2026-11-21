// IP ünvanı heç vaxt açıq saxlanılmır — yalnız məqsədə görə prefiksli hash (limitlər / sui-istifadə
// araşdırması üçün). IP_HASH_SECRET təyin olunubsa HMAC-SHA256 (IPv4 məkanı kiçik olduğu üçün açarsız
// hash brute-force ilə geri açıla bilər — production-da IP_HASH_SECRET tövsiyə olunur, bax SECURITY.md).
const crypto = require('crypto');
const env = require('../env');

function hashIp(ip, scope) {
  if (!ip) return null;
  const input = `${scope}:${ip}`;
  const h = env.ipHashSecret
    ? crypto.createHmac('sha256', env.ipHashSecret).update(input).digest('hex')
    : crypto.createHash('sha256').update(input).digest('hex');
  return h.slice(0, 24);
}

module.exports = { hashIp };
