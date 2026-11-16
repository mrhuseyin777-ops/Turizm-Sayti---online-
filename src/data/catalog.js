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

// Kurort daxilində rayonlar (operator saytlarındakı "şəhər/rayon" filtri kimi). Hər otel bir rayona bağlıdır.
const DISTRICTS = {
  alanya: ['Avsallar', 'Konaklı', 'Mahmutlar', 'İncekum', 'Okurcalar', 'Kestel', 'Mərkəz'],
  antalya: ['Lara', 'Kundu', 'Belek', 'Konyaaltı'],
  kemer: ['Beldibi', 'Göynük', 'Kiriş', 'Çamyuva', 'Tekirova'],
  side: ['Kumköy', 'Çolaklı', 'Titreyengöl', 'Evrenseki'],
  bodrum: ['Turgutreis', 'Gümbet', 'Yalıkavak', 'Bitez'],
  istanbul: ['Sultanahmet', 'Taksim', 'Şişli', 'Kadıköy'],
  dubai: ['Marina', 'Jumeirah', 'Deira', 'Palm'],
  sharm: ['Naama Bay', 'Nabq', 'Ras Nasrani'],
  batumi: ['Mərkəz', 'Köhnə Batumi', 'Qonio', 'Mahincauri'],
  tbilisi: ['Köhnə Tbilisi', 'Rustaveli', 'Vake', 'Saburtalo'],
  maldives: ['Male atollu', 'Ari atollu', 'Baa atollu'],
  qabala: ['Mərkəz', 'Vəndam', 'Nohurqışlaq'],
  shahdag: ['Şahdağ kurortu', 'Qusar', 'Laza'],
  sheki: ['Mərkəz', 'Kiş', 'Marxal'],
  lankaran: ['Mərkəz', 'Hirkan', 'Astara yolu'],
  baku: ['Mərkəz', 'Dənizkənarı bulvar', 'Şıxov', 'Mərdəkan'],
  naftalan: ['Mərkəz', 'Sanatoriya zonası'],
};
// "Konaklı" → "konakli" (URL/filtr üçün ASCII id)
const slug = (s) => s.toLocaleLowerCase('tr').replace(/ə/g, 'e').replace(/ı/g, 'i').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const d of destinations) {
  d.districts = (DISTRICTS[d.id] || ['Mərkəz']).map((name) => ({ id: `${d.id}.${slug(name)}`, name }));
}

const suffixes = ['Resort & Spa', 'Beach Hotel', 'Palace', 'Garden Resort', 'Premium', 'Club Hotel', 'Boutique', 'Family Resort'];
const prefixes = ['Blue Wave', 'Golden Sand', 'Royal', 'Sunrise', 'Palm Bay', 'Crystal', 'Grand Aurora', 'Silver Coast', 'Mountain View', 'Green Valley'];
const domesticSuffixes = ['Resort & Spa', 'Mountain Resort', 'Hotel', 'Palace', 'Garden Hotel', 'Boutique', 'Family Resort', 'Lodge'];
const domesticPrefixes = ['Dağ Ətəyi', 'Meşə', 'Qafqaz Mənzərə', 'Çinar', 'Göy Göl', 'Karvan', 'Bulaq', 'Yaşıl Vadi'];

// Dəniz kurortları (AI/UAI, "yalnız böyüklər" otelləri, dəniz mənzərəli otaqlar)
const BEACH = ['antalya', 'alanya', 'kemer', 'side', 'bodrum', 'sharm', 'dubai', 'maldives', 'batumi'];
const CITY = ['istanbul', 'tbilisi', 'baku'];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Otaq tipləri (operator saytlarındakı kimi ingiliscə adlar) və qiymət əmsalı.
// family: true → 4+ nəfərlik (və ya 3 böyük + uşaq) yerləşmə üçün
const ROOM_TYPES = {
  'Standard Room': { factor: 1 },
  'Standard Land View': { factor: 1 },
  'Standard Sea View': { factor: 1.12 },
  'Standard City View': { factor: 1 },
  'Superior Room': { factor: 1.15 },
  'Deluxe Room': { factor: 1.18 },
  'Family Room': { factor: 1.25, family: true },
};
function roomsFor(d, stars) {
  if (d.region === 'domestic' && !CITY.includes(d.id)) return ['Standard Room', 'Deluxe Room', 'Family Room'];
  if (CITY.includes(d.id)) return ['Standard City View', 'Superior Room', 'Family Room'];
  return stars >= 4 ? ['Standard Land View', 'Standard Sea View', 'Family Room'] : ['Standard Room', 'Family Room'];
}

// Hər istiqamət üçün 7 otel generasiya edirik (deterministik)
const hotels = [];
for (const d of destinations) {
  const dOff = hash(d.id) % d.districts.length;
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
    const rating = Math.round((7.4 + ((h >>> 8) % 24) / 10) * 10) / 10; // 7.4 – 9.7
    // Atributlar (DEMO, deterministik). Real inteqrasiyada operatorun otel kataloqundan gəlir.
    const adultsOnly = BEACH.includes(d.id) && i === 5; // hər dəniz kurortunda bir "adults only" 5* otel
    let tags = [
      (h & 1) ? 'Aquapark' : null,
      (h & 2) ? 'Uşaq klubu' : null,
      (h & 4) ? 'Öz çimərliyi' : null,
      (h & 8) ? 'SPA' : null,
      d.region === 'domestic' && (h & 16) ? 'Hovuz' : null,
    ].filter(Boolean);
    if (adultsOnly) tags = tags.filter((x) => x !== 'Aquapark' && x !== 'Uşaq klubu');
    const family = !adultsOnly && ((tags.includes('Uşaq klubu') && tags.includes('Aquapark')) || suf === 'Family Resort');
    const chdFree = !adultsOnly && d.region === 'intl' && ((h >>> 20) % 3 === 0 || (family && stars === 5));
    const recommended = rating >= 9.3 || (h >>> 24) % 7 === 0;
    const district = d.districts[(dOff + i) % d.districts.length];
    hotels.push({
      id: `${d.id}-h${i + 1}`,
      name: `${pre} ${suf}${i > 3 ? ' ' + d.name.split(' ')[0] : ''}`,
      destinationId: d.id,
      districtId: district.id,
      district: district.name,
      stars,
      rating,
      boards,
      tags,
      attrs: [chdFree && 'chdFree', adultsOnly && 'adultsOnly', recommended && 'recommended', family && 'family'].filter(Boolean),
      rooms: roomsFor(d, stars),
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

// Otel atributları (filtr/nişan açarları)
const HOTEL_ATTRS = ['chdFree', 'adultsOnly', 'recommended', 'family'];

module.exports = { destinations, hotels, tours, boardLabels, hash, ROOM_TYPES, HOTEL_ATTRS };
