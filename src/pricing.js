// Qiymətləndirmə köməkçiləri: uşaq yaşına görə əmsallar və kartdakı ödəniş planı (DEMO).
const config = require('./config');

// Sorğu parametrləri səhvi (istifadəçiyə göstərilə bilən mesaj → HTTP 400)
class QueryError extends Error {}

// Bir uşaq yaşı üçün əmsal (null/undefined = yaş bilinmir → defaultChildAge)
function childBand(age) {
  const a = Number.isInteger(age) ? age : config.defaultChildAge;
  return config.childAgeBands.find((b) => a <= b.maxAge) || config.childAgeBands[config.childAgeBands.length - 1];
}

// Uşaqların cəmi əmsalı: { hotel, flight } — böyüklərin sayına əlavə olunur
function childFactors(ages) {
  return (ages || []).reduce((acc, age) => {
    const b = childBand(age);
    return { hotel: acc.hotel + b.hotel, flight: acc.flight + b.flight };
  }, { hotel: 0, flight: 0 });
}

// "3,7,12" → [3,7,12]. Yanlış dəyər → Error (400). Maks. 6 uşaq, yaş 0–17.
function parseChildAges(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const parts = String(raw).slice(0, 60).split(',').map((x) => x.trim()).filter((x) => x !== '');
  if (parts.length > 6) throw new QueryError('Uşaq sayı 6-dan çox ola bilməz');
  return parts.map((p) => {
    if (!/^\d{1,2}$/.test(p) || Number(p) > 17) throw new QueryError('Uşaq yaşı 0–17 arasında tam ədəd olmalıdır');
    return Number(p);
  });
}

// Kartda göstərilən hissə-hissə ödəniş və ilkin ödəniş (bank inteqrasiyası yoxdur — vitrin).
function paymentPlan(price) {
  const { months, interestPct, upfrontPct } = config.installment;
  const total = price * (1 + interestPct / 100);
  return {
    demo: true,
    interestPct,
    months: months.map((n) => ({ n, monthly: Math.ceil(total / n) })),
    upfrontPct,
    upfront: Math.ceil((price * upfrontPct) / 100),
  };
}

module.exports = { QueryError, childBand, childFactors, parseChildAges, paymentPlan };
