// DEMO kataloq. Otel adları uydurmadır — real inteqrasiyadan sonra operatorların
// API/feed məlumatı ilə əvəz olunacaq.

const destinations = [
  // Xarici
  { id: 'antalya', name: 'Antalya', country: 'Türkiyə', region: 'intl', flight: 420, base: 55, aliases: ['antalya', 'анталья', 'lara', 'kundu'] },
  { id: 'alanya', name: 'Alanya', country: 'Türkiyə', region: 'intl', flight: 440, base: 48, aliases: ['alanya', 'аланья'] },
  { id: 'kemer', name: 'Kemer', country: 'Türkiyə', region: 'intl', flight: 430, base: 52, aliases: ['kemer', 'кемер'] },
  { id: 'side', name: 'Side', country: 'Türkiyə', region: 'intl', flight: 430, base: 54, aliases: ['side', 'сиде', 'manavgat'] },
  { id: 'bodrum', name: 'Bodrum', country: 'Türkiyə', region: 'intl', flight: 480, base: 65, aliases: ['bodrum', 'бодрум'] },
  { id: 'istanbul', name: 'İstanbul', country: 'Türkiyə', region: 'intl', flight: 360, base: 45, aliases: ['istanbul', 'i̇stanbul', 'стамбул'] },
  { id: 'dubai', name: 'Dubay', country: 'BƏƏ', region: 'intl', flight: 520, base: 70, aliases: ['dubai', 'dubay', 'дубай', 'bəə', 'uae'] },
  { id: 'sharm', name: 'Şarm-əl-Şeyx', country: 'Misir', region: 'intl', flight: 640, base: 40, aliases: ['sharm', 'şarm', 'misir', 'egypt', 'шарм'] },
  { id: 'batumi', name: 'Batumi', country: 'Gürcüstan', region: 'intl', flight: 260, base: 38, aliases: ['batumi', 'батуми', 'gürcüstan', 'georgia'] },
  { id: 'tbilisi', name: 'Tbilisi', country: 'Gürcüstan', region: 'intl', flight: 240, base: 40, aliases: ['tbilisi', 'tiflis', 'тбилиси', 'gürcüstan', 'georgia'] },
  { id: 'maldives', name: 'Maldiv adaları', country: 'Maldiv', region: 'intl', flight: 1250, base: 160, aliases: ['maldiv', 'maldives', 'мальдивы'] },
  // Daxili (Azərbaycan)
  { id: 'qabala', name: 'Qəbələ', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 45, aliases: ['qəbələ', 'qabala', 'gabala', 'габала'] },
  { id: 'shahdag', name: 'Qusar / Şahdağ', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 60, aliases: ['şahdağ', 'shahdag', 'qusar', 'quba', 'шахдаг'] },
  { id: 'sheki', name: 'Şəki', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 35, aliases: ['şəki', 'sheki', 'шеки'] },
  { id: 'lankaran', name: 'Lənkəran', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 32, aliases: ['lənkəran', 'lankaran', 'ленкорань'] },
  { id: 'baku', name: 'Bakı', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 50, aliases: ['bakı', 'baku', 'баку'] },
  { id: 'naftalan', name: 'Naftalan', country: 'Azərbaycan', region: 'domestic', flight: 0, base: 55, aliases: ['naftalan', 'нафталан'] },
];

const suffixes = ['Resort & Spa', 'Beach Hotel', 'Palace', 'Garden Resort', 'Premium', 'Club Hotel', 'Boutique', 'Family Resort'];
const prefixes = ['Blue Wave', 'Golden Sand', 'Royal', 'Sunrise', 'Palm Bay', 'Crystal', 'Grand Aurora', 'Silver Coast', 'Mountain View', 'Green Valley'];
const domesticSuffixes = ['Resort & Spa', 'Mountain Resort', 'Hotel', 'Palace', 'Garden Hotel', 'Boutique', 'Family Resort', 'Lodge'];
const domesticPrefixes = ['Dağ Ətəyi', 'Meşə', 'Qafqaz Mənzərə', 'Çinar', 'Göy Göl', 'Karvan', 'Bulaq', 'Yaşıl Vadi'];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Hər istiqamət üçün 7 otel generasiya edirik (deterministik)
const hotels = [];
for (const d of destinations) {
  for (let i = 0; i < 7; i++) {
    const h = hash(d.id + i);
    const stars = [3, 4, 4, 5, 5, 5, 4][i];
    const pre = d.region === 'domestic' ? domesticPrefixes[h % domesticPrefixes.length] : prefixes[h % prefixes.length];
    const sufList = d.region === 'domestic' ? domesticSuffixes : suffixes;
    const suf = sufList[(h >>> 4) % sufList.length];
    const boards = d.region === 'domestic'
      ? ['BB', 'HB', 'FB']
      : stars === 5 && ['antalya', 'alanya', 'kemer', 'side', 'bodrum', 'sharm'].includes(d.id)
        ? ['AI', 'UAI']
        : ['BB', 'HB', 'AI'];
    hotels.push({
      id: `${d.id}-h${i + 1}`,
      name: `${pre} ${suf}${i > 3 ? ' ' + d.name.split(' ')[0] : ''}`,
      destinationId: d.id,
      stars,
      rating: Math.round((7.4 + ((h >>> 8) % 24) / 10) * 10) / 10, // 7.4 – 9.7
      boards,
      tags: [
        (h & 1) ? 'Aquapark' : null,
        (h & 2) ? 'Uşaq klubu' : null,
        (h & 4) ? 'Öz çimərliyi' : null,
        (h & 8) ? 'SPA' : null,
        d.region === 'domestic' && (h & 16) ? 'Hovuz' : null,
      ].filter(Boolean),
      priceFactor: (0.75 + stars * 0.18) * (0.9 + ((h >>> 12) % 30) / 100),
    });
  }
}

// Ekskursiya/qrup turları (çoxgünlük, sabit çıxış günləri)
const tours = [
  { id: 't-georgia', name: 'Tbilisi – Mtsxeta – Qudauri avtobus turu', destinationId: 'tbilisi', countryLabel: 'Gürcüstan', region: 'intl', nights: 3, weekdays: [4], base: 290, stars: 3, includes: ['Avtobus', 'Otel', 'Səhər yeməyi', 'Bələdçi'] },
  { id: 't-istanbul-kapadokya', name: 'İstanbul + Kapadokya', destinationId: 'istanbul', countryLabel: 'Türkiyə', region: 'intl', nights: 6, weekdays: [1, 5], base: 1150, stars: 4, includes: ['Aviabilet', 'Otel', 'Transfer', 'Ekskursiyalar'] },
  { id: 't-dubai-abu', name: 'Dubay + Abu-Dabi tur paketi', destinationId: 'dubai', countryLabel: 'BƏƏ', region: 'intl', nights: 5, weekdays: [2, 6], base: 1490, stars: 4, includes: ['Aviabilet', 'Otel', 'Səhra safarisi', 'Transfer'] },
  { id: 't-egypt-kahira', name: 'Şarm + Qahirə ehramları', destinationId: 'sharm', countryLabel: 'Misir', region: 'intl', nights: 7, weekdays: [3], base: 1390, stars: 5, includes: ['Aviabilet', 'Otel (AI)', 'Qahirə turu'] },
  { id: 't-sheki-qabala', name: 'Qəbələ – Şəki 2 günlük tur', destinationId: 'sheki', countryLabel: 'Azərbaycan', region: 'domestic', nights: 1, weekdays: [6], base: 149, stars: 4, includes: ['Nəqliyyat', 'Otel', 'Səhər yeməyi', 'Bələdçi'] },
  { id: 't-shahdag', name: 'Şahdağ xizək həftəsonu', destinationId: 'shahdag', countryLabel: 'Azərbaycan', region: 'domestic', nights: 2, weekdays: [5], base: 259, stars: 4, includes: ['Transfer', 'Otel', 'Ski-pass'] },
  { id: 't-lankaran', name: 'Lənkəran – Astara təbiət turu', destinationId: 'lankaran', countryLabel: 'Azərbaycan', region: 'domestic', nights: 1, weekdays: [6, 0], base: 119, stars: 3, includes: ['Nəqliyyat', 'Otel', 'Yemək', 'Çay plantasiyası'] },
  { id: 't-baku-city', name: 'Bakı + Qobustan + Atəşgah günlük tur', destinationId: 'baku', countryLabel: 'Azərbaycan', region: 'domestic', nights: 0, weekdays: [0, 1, 2, 3, 4, 5, 6], base: 59, stars: 0, includes: ['Nəqliyyat', 'Bələdçi', 'Giriş biletləri'] },
];

const boardLabels = {
  BB: 'Səhər yeməyi',
  HB: 'Yarım pansion',
  FB: 'Tam pansion',
  AI: 'Hər şey daxil',
  UAI: 'Ultra hər şey daxil',
};

module.exports = { destinations, hotels, tours, boardLabels, hash };
