// Brend və əsas parametrlər — ad dəyişəndə yalnız burada dəyişmək kifayətdir.
module.exports = {
  brand: {
    name: 'TurTap',
    slogan: 'Bütün tur operatorları bir axtarışda — ən ucuzdan bahalıya.',
    domain: 'turtap.az', // hələ alınmayıb, nümunədir
  },
  // Valyuta məzənnələri (AZN bazası). Real versiyada CBAR-dan gündəlik çəkilməlidir.
  rates: { AZN: 1, USD: 0.588, EUR: 0.54, TRY: 20.1, RUB: 52 },
  defaultCurrency: 'AZN',
  departureCity: 'Bakı',
  // Axtarışda tarix çevikliyi (± gün)
  flexibleDays: 3,
  // "Son dəqiqə": gediş tarixi bu qədər gün ərzindədirsə təklif son dəqiqə sayılır
  lastMinuteDays: 14,
  // Kartda göstərilən hissə-hissə ödəniş (DEMO vitrin; bank inteqrasiyası hələ yoxdur)
  installment: {
    months: [6, 12], // taksit ayları
    interestPct: 0, // faiz (0 = faizsiz)
    upfrontPct: 20, // "indi 20% ödə" ilkin ödəniş variantı
  },
  // Qiymətin yaşa görə əmsalı (böyük = 1). Uşaq yaşı bilinmirsə defaultChildAge götürülür
  // (köhnə `children` parametri ilə geriyə uyğunluq: 7 yaş = əvvəlki 0.5 / 0.75 əmsalları).
  childAgeBands: [
    { maxAge: 1, hotel: 0, flight: 0.1 }, // 0–1 yaş: otel pulsuz, aviabilet körpə tarifi
    { maxAge: 6, hotel: 0.3, flight: 0.75 }, // 2–6
    { maxAge: 11, hotel: 0.5, flight: 0.75 }, // 7–11
    { maxAge: 17, hotel: 1, flight: 1 }, // 12+: böyük kimi
  ],
  defaultChildAge: 7,
  // Operator qiymətlərinin yaddaş keşi (dəq). "Yenilə" düyməsi keşi keçir.
  priceCacheMinutes: 30,
};
