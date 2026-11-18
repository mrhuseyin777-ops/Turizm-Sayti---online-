// Dövlət tərəfindən tənzimlənən daxili marşrutlar (Bakı/Gəncə ↔ Naxçıvan).
// Bu marşrutlarda tarif və güzəştli kateqoriyalar rəsmi qərarlarla müəyyən olunur və satış xüsusi
// qaydalarla aparıla bilər. Qüvvədə olan tarif TƏSDİQLƏNMƏYİB (bax docs/RESEARCH-2.md, A1) — ona görə
// DEMO qiymət göstərilmir, istifadəçi menecerə müraciətə yönləndirilir. Burada konkret məbləğ və ya
// qərar tarixi YAZILMIR.

const REGULATED = [['GYD', 'NAJ'], ['GNJ', 'NAJ']];
const pairs = new Set(REGULATED.flatMap(([a, b]) => [`${a}-${b}`, `${b}-${a}`]));

// fromCodes / toCodes: hava limanı kodları massivi. Uyğun gələn ilk cüt ("GYD-NAJ") və ya null.
function regulatedRoute(fromCodes, toCodes) {
  for (const f of fromCodes || []) for (const t of toCodes || []) if (pairs.has(`${f}-${t}`)) return `${f}-${t}`;
  return null;
}

module.exports = { regulatedRoute, REGULATED };
