// Loglarda şəxsi məlumatın maskalanması (telefon, e-poçt, ad, IP). Asılılıqsızdır — həm HTTP qatı
// (src/security/http.js), həm logger (src/observability/logger.js) istifadə edir.
const maskPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length <= 4 ? '***' : `${'*'.repeat(Math.max(3, d.length - 4))}${d.slice(-2)}`;
};
const maskEmail = (e) => {
  const s = String(e || '');
  const i = s.indexOf('@');
  return i < 1 ? '***' : `${s[0]}***@${s.slice(i + 1)}`;
};
const maskName = (n) => { const s = String(n || ''); return s ? `${s[0]}***` : ''; };
const maskIp = (ip) => {
  const s = String(ip || '');
  if (s.includes('.')) return s.replace(/\.\d+$/, '.x');
  if (s.includes(':')) return s.split(':').slice(0, 3).join(':') + ':…';
  return s;
};

module.exports = { maskPhone, maskEmail, maskName, maskIp };
