// Parol hash-i: crypto.scrypt (yaddaş-intensiv KDF, Node-un daxili modulu — əlavə asılılıq yoxdur).
// Format: scrypt$<N>$<r>$<p>$<duz base64>$<hash base64>  — parametrlər hash-lə birlikdə saxlanılır,
// gələcəkdə gücləndirmək mümkündür (needsRehash).
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const PARAMS = { N: 2 ** 15, r: 8, p: 1, keylen: 64, saltlen: 16 };
const maxmem = (N, r) => 128 * N * r * 2;

const POLICY = { min: 12, max: 256 };
// Ən çox yayılmış zəif parolların kiçik siyahısı (tam siyahı üçün HIBP k-anonymity API tövsiyə olunur)
const COMMON = new Set(['123456789012', 'password1234', 'qwertyuiop12', '111111111111', 'odiola123456', 'administrator', 'passwordpassword', 'qwerty123456', '1234567890123']);

function checkPolicy(pw, { username = '' } = {}) {
  if (typeof pw !== 'string') return 'Parol mətn olmalıdır';
  if (pw.length < POLICY.min) return `Parol ən azı ${POLICY.min} simvol olmalıdır`;
  if (pw.length > POLICY.max) return `Parol ən çox ${POLICY.max} simvol ola bilər`;
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return 'Bu parol çox geniş yayılıb, başqasını seçin';
  if (username && lower.includes(String(username).toLowerCase())) return 'Parolda istifadəçi adı olmamalıdır';
  if (new Set(pw).size < 5) return 'Parol çox sadədir (fərqli simvollar az)';
  return null;
}

async function hashPassword(pw) {
  const { N, r, p, keylen, saltlen } = PARAMS;
  const salt = crypto.randomBytes(saltlen);
  const dk = await scrypt(pw.normalize('NFKC'), salt, keylen, { N, r, p, maxmem: maxmem(N, r) });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${dk.toString('base64')}`;
}

async function verifyPassword(pw, stored) {
  if (typeof pw !== 'string' || typeof stored !== 'string' || pw.length > POLICY.max) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every(Number.isInteger) || N > 2 ** 20 || r > 32 || p > 16) return false;
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (!salt.length || !expected.length) return false;
  const dk = await scrypt(pw.normalize('NFKC'), salt, expected.length, { N, r, p, maxmem: maxmem(N, r) });
  return crypto.timingSafeEqual(dk, expected);
}

const needsRehash = (stored) => !String(stored).startsWith(`scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$`);

// İstifadəçi tapılmayanda da eyni vaxt sərf olunsun (istifadəçi adlarının sayılmasının qarşısı)
let dummyHash = null;
async function dummyVerify(pw) {
  if (!dummyHash) dummyHash = await hashPassword(crypto.randomBytes(16).toString('hex'));
  await verifyPassword(typeof pw === 'string' ? pw.slice(0, POLICY.max) : '', dummyHash);
  return false;
}

module.exports = { hashPassword, verifyPassword, needsRehash, checkPolicy, dummyVerify, POLICY };
