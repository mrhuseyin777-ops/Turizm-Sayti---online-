// Brend və əsas parametrlər — ad dəyişəndə yalnız burada dəyişmək kifayətdir.
module.exports = {
  brand: {
    name: 'Odiola',
    slogan: 'Bütün tur operatorları bir axtarışda — ən ucuzdan bahalıya.',
    domain: 'odiola.com', // hələ qeydiyyatdan keçməyib (21.11.2026 boş idi) — tez alınmalıdır; alternativ odiola.az
  },
  // Operator məzənnəsi: Azərbaycan operatorları (SAMO-tour) xarici turları adətən USD ilə qiymətləndirir
  // və "Gündəlik məzənnə DD.MM.YYYY USD/AZN X" göstərir. DEMO dəyər.
  // TODO: CBAR (cbar.az/currencies/DD.MM.YYYY.xml) və ya operatorun öz gündəlik məzənnəsi ilə avtomatik yenilə.
  operatorRate: { pair: 'USD/AZN', value: 1.7055, date: '2026-11-13', source: 'demo' },
  // Valyuta məzənnələri (AZN bazası). USD operator məzənnəsindən hesablanır ki, ikisi uyğun gəlsin.
  rates: { AZN: 1, USD: Math.round((1 / 1.7055) * 10000) / 10000, EUR: 0.54, TRY: 20.1, RUB: 52 },
  defaultCurrency: 'AZN',
  departureCity: 'Bakı',
  // Axtarışda tarix çevikliyi (± gün) — checkInTo verilmədikdə qısa yol kimi işləyir
  flexibleDays: 3,
  // Tarix və gecə aralığı limitləri (DoS qorunması: hər tarix × gecə kombinasiyası ayrıca hesablanır)
  searchLimits: {
    maxDateRangeDays: 14, // "gediş -dan / -dək" arası maks. gün
    maxNightsSpan: 7, // "gecə -dan / -dək" arası maks. fərq
    maxCombos: 60, // tarix sayı × gecə variantı sayı
    maxDaysAhead: 730, // ən uzaq gediş tarixi (gün)
    maxFlatOffers: 1000, // flat=1 cavabında maks. təklif sayı
  },
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
  // Reytinq sözləri (öz şkalamız, 1–10): ən yüksək həddən aşağıya yoxlanılır. Mətnlər UI-da i18n (rw_<key>).
  // Reytinq və rəy sayı hələ DEMO-dur (real rəy mənbəyi qoşulmayıb) — UI-da "DEMO" işarəsi ilə göstərilir.
  ratingWords: [
    { min: 9, key: 'superb' }, // Möhtəşəm
    { min: 8.5, key: 'excellent' }, // Əla
    { min: 8, key: 'very_good' }, // Çox yaxşı
    { min: 7, key: 'good' }, // Yaxşı
  ],
  // Operator qiymətlərinin yaddaş keşi (dəq). "Yenilə" düyməsi keşi keçir.
  priceCacheMinutes: 30,
};
