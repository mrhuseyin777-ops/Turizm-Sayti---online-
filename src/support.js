// Dəstək əlaqəsinin ictimai forması (/api/config → support). Yalnız düzgün beynəlxalq formatlı nömrələr
// (+ və 7–15 rəqəm) qaytarılır; null / yanlış dəyər → null (UI həmin seçimi gizlədir).
const PHONE_RE = /^\+?[0-9]{7,15}$/;
function cleanPhone(v) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\s()-]/g, '');
  return PHONE_RE.test(s) ? (s.startsWith('+') ? s : '+' + s) : null;
}
function publicSupport(support) {
  const s = support && typeof support === 'object' ? support : {};
  const phone = cleanPhone(s.phone);
  const wa = cleanPhone(s.whatsapp);
  return { phone, whatsapp: wa ? wa.slice(1) : null }; // wa.me linki "+" işarəsiz rəqəmlər tələb edir
}
module.exports = { publicSupport, cleanPhone };
