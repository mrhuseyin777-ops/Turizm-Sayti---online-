// Hava limanları kataloqu (aviabilet modulu).
// Koordinatlar uçuş müddətini təxmini hesablamaq üçündür (demo cədvəl).
// tz: standart UTC fərqi (saat); dst: yay vaxtı qaydası ('eu' | 'eg' | null) — təxminidir.
// Real inteqrasiyada bu məlumat provayderin (GDS/NDC/aggregator) lüğətindən gəlir.

const A = (code, lat, lon, tz, dst, region, city, country, name, extra = {}) => ({
  code, lat, lon, tz, dst, region, city, country, name, aliases: extra.aliases || [], altCodes: extra.altCodes || [],
});

const AZ = { az: 'Azərbaycan', en: 'Azerbaijan', ru: 'Азербайджан' };
const TR = { az: 'Türkiyə', en: 'Türkiye', ru: 'Турция' };
const AE = { az: 'BƏƏ', en: 'UAE', ru: 'ОАЭ' };
const RU = { az: 'Rusiya', en: 'Russia', ru: 'Россия' };
const KZ = { az: 'Qazaxıstan', en: 'Kazakhstan', ru: 'Казахстан' };
const GE = { az: 'Gürcüstan', en: 'Georgia', ru: 'Грузия' };
const EG = { az: 'Misir', en: 'Egypt', ru: 'Египет' };

const airports = [
  // Azərbaycan
  A('GYD', 40.467, 50.047, 4, null, 'domestic', { az: 'Bakı', en: 'Baku', ru: 'Баку' }, AZ, 'Heydər Əliyev', { aliases: ['baki', 'baku'] }),
  A('NAJ', 39.189, 45.458, 4, null, 'domestic', { az: 'Naxçıvan', en: 'Nakhchivan', ru: 'Нахичевань' }, AZ, 'Naxçıvan', { aliases: ['naxcivan', 'nakhchivan', 'nakhichevan'] }),
  A('GNJ', 40.738, 46.317, 4, null, 'domestic', { az: 'Gəncə', en: 'Ganja', ru: 'Гянджа' }, AZ, 'Gəncə', { aliases: ['gence', 'ganja', 'kirovabad'], altCodes: ['KVD'] }),
  A('LLK', 38.746, 48.818, 4, null, 'domestic', { az: 'Lənkəran', en: 'Lankaran', ru: 'Ленкорань' }, AZ, 'Lənkəran', { aliases: ['lenkeran', 'lankaran'] }),
  A('GBB', 40.827, 47.712, 4, null, 'domestic', { az: 'Qəbələ', en: 'Gabala', ru: 'Габала' }, AZ, 'Qəbələ', { aliases: ['qebele', 'gabala', 'qabala'] }),
  A('ZTU', 41.562, 46.667, 4, null, 'domestic', { az: 'Zaqatala', en: 'Zagatala', ru: 'Закатала' }, AZ, 'Zaqatala', { aliases: ['zaqatala', 'zagatala'] }),
  A('FZL', 39.594, 47.196, 4, null, 'domestic', { az: 'Füzuli', en: 'Fuzuli', ru: 'Физули' }, AZ, 'Füzuli', { aliases: ['fuzuli'] }),
  // Türkiyə
  A('IST', 41.262, 28.742, 3, null, 'tr', { az: 'İstanbul', en: 'Istanbul', ru: 'Стамбул' }, TR, 'İstanbul Hava Limanı', { aliases: ['istanbul', 'stambul'] }),
  A('SAW', 40.899, 29.309, 3, null, 'tr', { az: 'İstanbul', en: 'Istanbul', ru: 'Стамбул' }, TR, 'Sabiha Gökçen', { aliases: ['istanbul', 'sabiha'] }),
  A('AYT', 36.899, 30.800, 3, null, 'tr', { az: 'Antalya', en: 'Antalya', ru: 'Анталья' }, TR, 'Antalya', { aliases: ['antaliya'] }),
  A('ESB', 40.128, 32.995, 3, null, 'tr', { az: 'Ankara', en: 'Ankara', ru: 'Анкара' }, TR, 'Esenboğa'),
  A('ADB', 38.292, 27.157, 3, null, 'tr', { az: 'İzmir', en: 'Izmir', ru: 'Измир' }, TR, 'Adnan Menderes', { aliases: ['izmir'] }),
  // Körfəz
  A('DXB', 25.253, 55.364, 4, null, 'gulf', { az: 'Dubay', en: 'Dubai', ru: 'Дубай' }, AE, 'Dubai International', { aliases: ['dubai', 'dubay'] }),
  A('SHJ', 25.329, 55.517, 4, null, 'gulf', { az: 'Şarqa', en: 'Sharjah', ru: 'Шарджа' }, AE, 'Sharjah', { aliases: ['sarqa', 'sharjah', 'sharja'] }),
  A('AUH', 24.433, 54.651, 4, null, 'gulf', { az: 'Əbu-Dabi', en: 'Abu Dhabi', ru: 'Абу-Даби' }, AE, 'Zayed International', { aliases: ['abu dabi', 'abu dhabi', 'ebu dabi'] }),
  A('DOH', 25.273, 51.608, 3, null, 'gulf', { az: 'Doha', en: 'Doha', ru: 'Доха' }, { az: 'Qətər', en: 'Qatar', ru: 'Катар' }, 'Hamad International'),
  // Gürcüstan, MDB, Mərkəzi Asiya
  A('TBS', 41.669, 44.955, 4, null, 'cis', { az: 'Tbilisi', en: 'Tbilisi', ru: 'Тбилиси' }, GE, 'Tbilisi'),
  A('BUS', 41.610, 41.599, 4, null, 'cis', { az: 'Batumi', en: 'Batumi', ru: 'Батуми' }, GE, 'Batumi'),
  A('SVO', 55.973, 37.415, 3, null, 'cis', { az: 'Moskva', en: 'Moscow', ru: 'Москва' }, RU, 'Şeremetyevo', { aliases: ['moskva', 'moscow', 'sheremetyevo', 'шереметьево'] }),
  A('VKO', 55.596, 37.268, 3, null, 'cis', { az: 'Moskva', en: 'Moscow', ru: 'Москва' }, RU, 'Vnukovo', { aliases: ['moskva', 'moscow', 'vnukovo', 'внуково'] }),
  A('DME', 55.409, 37.906, 3, null, 'cis', { az: 'Moskva', en: 'Moscow', ru: 'Москва' }, RU, 'Domodedovo', { aliases: ['moskva', 'moscow', 'domodedovo', 'домодедово'] }),
  A('LED', 59.800, 30.262, 3, null, 'cis', { az: 'Sankt-Peterburq', en: 'Saint Petersburg', ru: 'Санкт-Петербург' }, RU, 'Pulkovo', { aliases: ['peterburq', 'petersburg', 'spb', 'питер', 'pulkovo'] }),
  A('NQZ', 51.022, 71.467, 5, null, 'cis', { az: 'Astana', en: 'Astana', ru: 'Астана' }, KZ, 'Nursultan Nazarbayev', { altCodes: ['TSE'] }),
  A('ALA', 43.352, 77.040, 5, null, 'cis', { az: 'Almatı', en: 'Almaty', ru: 'Алматы' }, KZ, 'Almaty', { aliases: ['almati', 'almaty', 'alma-ata', 'алма-ата'] }),
  A('TAS', 41.258, 69.281, 5, null, 'cis', { az: 'Daşkənd', en: 'Tashkent', ru: 'Ташкент' }, { az: 'Özbəkistan', en: 'Uzbekistan', ru: 'Узбекистан' }, 'Islam Karimov', { aliases: ['daskend', 'tashkent'] }),
  // Yaxın Şərq
  A('TLV', 32.011, 34.887, 2, 'eu', 'me', { az: 'Təl-Əviv', en: 'Tel Aviv', ru: 'Тель-Авив' }, { az: 'İsrail', en: 'Israel', ru: 'Израиль' }, 'Ben Gurion', { aliases: ['tel aviv', 'tel-aviv', 'tel eviv'] }),
  A('CAI', 30.122, 31.406, 2, 'eg', 'me', { az: 'Qahirə', en: 'Cairo', ru: 'Каир' }, EG, 'Cairo International', { aliases: ['qahire', 'cairo', 'kair'] }),
  A('SSH', 27.977, 34.395, 2, 'eg', 'me', { az: 'Şarm-əl-Şeyx', en: 'Sharm El Sheikh', ru: 'Шарм-эль-Шейх' }, EG, 'Sharm El Sheikh', { aliases: ['sarm', 'sharm', 'шарм'] }),
  A('HRG', 27.178, 33.799, 2, 'eg', 'me', { az: 'Hurqada', en: 'Hurghada', ru: 'Хургада' }, EG, 'Hurghada', { aliases: ['hurqada', 'hurghada'] }),
  // Avropa
  A('LHR', 51.470, -0.454, 0, 'eu', 'eu', { az: 'London', en: 'London', ru: 'Лондон' }, { az: 'Böyük Britaniya', en: 'United Kingdom', ru: 'Великобритания' }, 'Heathrow'),
  A('CDG', 49.010, 2.548, 1, 'eu', 'eu', { az: 'Paris', en: 'Paris', ru: 'Париж' }, { az: 'Fransa', en: 'France', ru: 'Франция' }, 'Charles de Gaulle'),
  A('FRA', 50.038, 8.562, 1, 'eu', 'eu', { az: 'Frankfurt', en: 'Frankfurt', ru: 'Франкфурт' }, { az: 'Almaniya', en: 'Germany', ru: 'Германия' }, 'Frankfurt'),
  A('MUC', 48.354, 11.786, 1, 'eu', 'eu', { az: 'Münhen', en: 'Munich', ru: 'Мюнхен' }, { az: 'Almaniya', en: 'Germany', ru: 'Германия' }, 'Franz Josef Strauss', { aliases: ['munhen', 'munich', 'munchen'] }),
  A('MXP', 45.630, 8.723, 1, 'eu', 'eu', { az: 'Milan', en: 'Milan', ru: 'Милан' }, { az: 'İtaliya', en: 'Italy', ru: 'Италия' }, 'Malpensa', { aliases: ['milano'] }),
  A('FCO', 41.800, 12.250, 1, 'eu', 'eu', { az: 'Roma', en: 'Rome', ru: 'Рим' }, { az: 'İtaliya', en: 'Italy', ru: 'Италия' }, 'Fiumicino', { aliases: ['roma', 'rome'] }),
  A('BCN', 41.297, 2.078, 1, 'eu', 'eu', { az: 'Barselona', en: 'Barcelona', ru: 'Барселона' }, { az: 'İspaniya', en: 'Spain', ru: 'Испания' }, 'El Prat', { aliases: ['barselona', 'barcelona'] }),
  A('VIE', 48.110, 16.570, 1, 'eu', 'eu', { az: 'Vyana', en: 'Vienna', ru: 'Вена' }, { az: 'Avstriya', en: 'Austria', ru: 'Австрия' }, 'Schwechat', { aliases: ['vyana', 'vienna', 'wien'] }),
  A('PRG', 50.101, 14.260, 1, 'eu', 'eu', { az: 'Praqa', en: 'Prague', ru: 'Прага' }, { az: 'Çexiya', en: 'Czechia', ru: 'Чехия' }, 'Václav Havel', { aliases: ['praqa', 'prague', 'praha'] }),
  A('BUD', 47.437, 19.256, 1, 'eu', 'eu', { az: 'Budapeşt', en: 'Budapest', ru: 'Будапешт' }, { az: 'Macarıstan', en: 'Hungary', ru: 'Венгрия' }, 'Liszt Ferenc', { aliases: ['budapest'] }),
  // Asiya
  A('BKK', 13.690, 100.750, 7, null, 'asia', { az: 'Banqkok', en: 'Bangkok', ru: 'Бангкок' }, { az: 'Tailand', en: 'Thailand', ru: 'Таиланд' }, 'Suvarnabhumi', { aliases: ['banqkok', 'bangkok'] }),
  A('HKT', 8.113, 98.317, 7, null, 'asia', { az: 'Puket', en: 'Phuket', ru: 'Пхукет' }, { az: 'Tailand', en: 'Thailand', ru: 'Таиланд' }, 'Phuket', { aliases: ['puket', 'phuket'] }),
  A('MLE', 4.192, 73.529, 5, null, 'asia', { az: 'Male (Maldiv)', en: 'Male (Maldives)', ru: 'Мале (Мальдивы)' }, { az: 'Maldiv', en: 'Maldives', ru: 'Мальдивы' }, 'Velana', { aliases: ['maldiv', 'maldives', 'мальдивы', 'male'] }),
  A('KUL', 2.746, 101.710, 8, null, 'asia', { az: 'Kuala-Lumpur', en: 'Kuala Lumpur', ru: 'Куала-Лумпур' }, { az: 'Malayziya', en: 'Malaysia', ru: 'Малайзия' }, 'KLIA', { aliases: ['kuala lumpur', 'kuala-lumpur'] }),
  A('ICN', 37.460, 126.440, 9, null, 'asia', { az: 'Seul', en: 'Seoul', ru: 'Сеул' }, { az: 'Cənubi Koreya', en: 'South Korea', ru: 'Южная Корея' }, 'Incheon', { aliases: ['seul', 'seoul'] }),
];

const byCode = new Map();
for (const a of airports) {
  byCode.set(a.code, a);
  for (const c of a.altCodes) byCode.set(c, a);
}

// Azərbaycan hərfləri NFKD ilə ayrılmır (ə, ı), ona görə əl ilə xəritələnir.
const AZ_MAP = { ə: 'e', ı: 'i', ş: 's', ç: 'c', ğ: 'g', ö: 'o', ü: 'u', ё: 'е' };
function norm(s) {
  return String(s || '')
    .toLocaleLowerCase('tr')
    .replace(/[əışçğöüё]/g, (c) => AZ_MAP[c])
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Hər hava limanı üçün axtarış açarları (bir dəfə hesablanır)
const keys = new Map(airports.map((a) => [a.code, [
  ...Object.values(a.city), ...Object.values(a.country), a.name, ...a.aliases,
].map(norm)]));

function getAirport(code) {
  return byCode.get(String(code || '').toUpperCase()) || null;
}

const pick = (obj, lang) => obj[lang] || obj.az;

function publicAirport(a, lang = 'az') {
  return { code: a.code, city: pick(a.city, lang), country: pick(a.country, lang), name: a.name, region: a.region };
}

// Avtomatik tamamlama: kod dəqiq uyğunluğu > ad başlanğıcı > ad daxilində
// Bir neçə hava limanı olan şəhərlər (İstanbul, Moskva): "bütün hava limanları" seçimi
const ALL_AIRPORTS = { az: 'Bütün hava limanları', en: 'All airports', ru: 'Все аэропорты' };
const cities = new Map();
for (const a of airports) {
  const k = a.city.en;
  if (!cities.has(k)) cities.set(k, []);
  cities.get(k).push(a);
}
function cityEntry(a, lang) {
  const group = cities.get(a.city.en);
  if (group.length < 2) return null;
  return { code: group.map((x) => x.code).join(','), city: pick(a.city, lang), country: pick(a.country, lang), name: pick(ALL_AIRPORTS, lang), region: a.region, isCity: true };
}

// Siyahı halında kod(lar)ı yoxla: "IST,SAW" -> [IST, SAW]. Yanlış kod varsa null.
function resolveCodes(value, max = 3) {
  const codes = String(value || '').toUpperCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (!codes.length || codes.length > max) return null;
  const out = [];
  for (const c of codes) {
    const a = getAirport(c);
    if (!a) return null;
    if (!out.includes(a.code)) out.push(a.code);
  }
  return out;
}

// Avtomatik tamamlama: kod dəqiq uyğunluğu > ad başlanğıcı > ad daxilində
function searchAirports(q, lang = 'az', limit = 8) {
  const t = norm(q);
  if (!t) {
    const popular = ['GYD', 'IST', 'DXB', 'AYT', 'TBS', 'SVO', 'NAJ', 'DOH'];
    return popular.map((c) => publicAirport(byCode.get(c), lang));
  }
  const upper = String(q).trim().toUpperCase();
  const scored = [];
  for (const a of airports) {
    let score = 0;
    if (a.code === upper || a.altCodes.includes(upper)) score = 100;
    else {
      for (const k of keys.get(a.code)) {
        if (k === t) score = Math.max(score, 80);
        else if (k.startsWith(t)) score = Math.max(score, 60);
        else if (k.split(' ').some((w) => w.startsWith(t))) score = Math.max(score, 50);
        else if (t.length >= 3 && k.includes(t)) score = Math.max(score, 30);
      }
    }
    if (score) scored.push({ a, score: score + (a.region === 'domestic' ? 1 : 0) });
  }
  scored.sort((x, y) => y.score - x.score || x.a.code.localeCompare(y.a.code));
  const out = [];
  const seenCity = new Set();
  for (const { a, score } of scored) {
    // Şəhər adı ilə axtarılanda (kodla yox) əvvəlcə "bütün hava limanları" sətri
    if (score < 100 && !seenCity.has(a.city.en)) {
      seenCity.add(a.city.en);
      const c = cityEntry(a, lang);
      if (c && norm(Object.values(a.city).join(' ') + ' ' + a.aliases.join(' ')).includes(t)) out.push(c);
    }
    out.push(publicAirport(a, lang));
  }
  return out.slice(0, limit);
}

// Böyük dairə məsafəsi (km)
function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// Ayın son verilmiş həftə günü (UTC tarix)
function lastWeekday(year, month, weekday) {
  const d = new Date(Date.UTC(year, month + 1, 0));
  while (d.getUTCDay() !== weekday) d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

// Verilən yerli tarixdə UTC fərqi (dəqiqə). DST qaydaları sadələşdirilib.
function utcOffsetMin(a, dateIso) {
  let h = a.tz;
  if (a.dst) {
    const d = new Date(dateIso.slice(0, 10) + 'T12:00:00Z');
    const y = d.getUTCFullYear();
    const [start, end] = a.dst === 'eg'
      ? [lastWeekday(y, 3, 5), lastWeekday(y, 9, 4)] // aprelin son cüməsi — oktyabrın son cüməaxşamı
      : [lastWeekday(y, 2, 0), lastWeekday(y, 9, 0)]; // martın son bazarı — oktyabrın son bazarı
    if (d >= start && d < end) h += 1;
  }
  return h * 60;
}

module.exports = { airports, getAirport, resolveCodes, searchAirports, publicAirport, distanceKm, utcOffsetMin, norm };
