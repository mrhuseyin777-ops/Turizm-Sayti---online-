// SAMO-Soft "SAMO-tour Online" sistemində işləyən Azərbaycan tur operatorlarının konfiqurasiyası.
//
// MƏNBƏ: operatorların ictimai axtarış səhifəsinin (/search_tour) HTML-i, 2026-11-16 tarixində
// əl ilə açılıb oxunub (<select> siyahıları, data-state-from atributları). Bax: docs/OPERATORS-SAMO.md.
// QAYDA: yalnız HTML-də görünən ID-lər yazılır. Bilinməyənlər null + TODO qalır — UYDURULMUR.
//
// Sahələr:
//   id              — Odiola provider id (src/providers/index.js-dəki mock id ilə eyni)
//   baseUrl         — ictimai axtarış səhifəsi (deeplink yalnız bu origin-lərə qurulur)
//   apiHosts        — RƏSMİ API host-ları (operatorun yazılı razılığı + sənədi ilə doldurulur).
//                     Boşdursa real adapter heç bir halda şəbəkəyə çıxmır.
//   stateFrom       — çıxış ölkəsinin (Azərbaycan) ID-si (<option data-state-from="...">)
//   townFrom        — çıxış şəhərləri (TOWNFROMINC)
//   defaultTownFrom — deeplink-də istifadə olunan çıxış şəhəri
//   currencies      — ISO kod → CURRENCY ID
//   defaultCurrency — Odiola valyutası operatorda yoxdursa istifadə olunur
//   states          — Odiola ölkə açarı → STATEINC ID (yalnız HTML-də görünənlər)
//   tours           — TOURINC siyahısı (məlumat üçün; deeplink-də göndərilmir, "hamısı" qalır)
//   limits          — formadakı seçim aralıqları (ADULT, CHILD, AGEn, NIGHTS_*) — deeplink bunlara sıxılır
//   extraParams     — operator formasında olan əlavə sabit sahələr (nümunə URL-dən / HTML-dən)

const operators = Object.freeze({
  summer: Object.freeze({
    id: 'summer',
    name: 'Summer Tour',
    system: 'SAMO-tour Online',
    baseUrl: 'https://summertour.az/search_tour',
    apiHosts: Object.freeze([]), // TODO: operatordan rəsmi API/XML-gateway ünvanı alınanda
    stateFrom: 36, // Bakı option-unun data-state-from dəyəri
    townFrom: Object.freeze({ baku: 1930 }),
    defaultTownFrom: 1930,
    currencies: Object.freeze({ USD: 2 }), // HTML-də yalnız USD var
    defaultCurrency: 'USD',
    states: Object.freeze({
      turkey: 9,
      // TODO: digər ölkələr Summer Tour səhifəsində Bakı çıxışı üçün göstərilmir (yalnız Türkiyə)
      uae: null, egypt: null, georgia: null, maldives: null,
    }),
    tours: Object.freeze([
      { id: 257, name: 'Antalya 2027', state: 'turkey' },
      { id: 259, name: 'Antalya 2027 +1', state: 'turkey' },
      { id: 256, name: 'Antalya winter 2026-2027 GDS', state: 'turkey' },
      { id: 255, name: 'Istanbul 2026-2027 (Ajet) +1', state: 'turkey' },
      { id: 238, name: 'Istanbul 2026-2027 GDS', state: 'turkey' },
    ]),
    limits: Object.freeze({ adultsMax: 12, childrenMax: 6, childAgeMax: 12, nightsMin: 2, nightsMax: 15 }),
    extraParams: Object.freeze({}),
  }),

  kompas: Object.freeze({
    id: 'kompas',
    name: 'Kompas Travel',
    system: 'SAMO-tour Online',
    baseUrl: 'https://online.az.kompastour.com/search_tour',
    apiHosts: Object.freeze([]), // TODO
    stateFrom: 61, // Bakı/Gəncə option-larının data-state-from dəyəri
    townFrom: Object.freeze({ baku: 1411, ganja: 1512 }),
    defaultTownFrom: 1411,
    currencies: Object.freeze({ USD: 2, EUR: 3, AZN: 13 }),
    defaultCurrency: 'USD',
    states: Object.freeze({
      // Kompas səhifəsi default olaraq Vena çıxışı ilə açılır; STATEINC siyahısı çıxış şəhərindən asılıdır.
      // Aşağıdakılar Vena üçün göstərilən siyahıdandır — Bakı çıxışı üçün mövcudluğu YOXLANILMADI.
      maldives: 40,
      mauritius: 86,
      seychelles: 77,
      // TODO: Bakı çıxışı üçün ölkə siyahısı (Türkiyə, BƏƏ, Misir, Gürcüstan) təsdiqlənməyib
      turkey: null, uae: null, egypt: null, georgia: null,
    }),
    tours: Object.freeze([]),
    limits: Object.freeze({ adultsMax: 6, childrenMax: 8, childAgeMax: 17, nightsMin: 1, nightsMax: 21 }),
    extraParams: Object.freeze({}),
  }),

  funsun: Object.freeze({
    id: 'funsun',
    name: 'Funsun Travel', // B2B portal FS Travel adı ilə: b2b.fstravel.asia
    system: 'SAMO-tour Online',
    baseUrl: 'https://b2b.fstravel.asia/search_tour',
    apiHosts: Object.freeze([]), // TODO
    stateFrom: 433579, // Bakı/Gəncə option-larının data-state-from dəyəri (367404 = Qazaxıstan, Almatı)
    townFrom: Object.freeze({ baku: 433614, ganja: 433686 }),
    defaultTownFrom: 433614,
    currencies: Object.freeze({ USD: 2, KZT: 11, AZN: 25 }),
    defaultCurrency: 'USD',
    states: Object.freeze({
      // Bakı çıxışı ilə açılan səhifənin STATEINC siyahısından (33 ölkə; burada Odiola-a lazım olanlar + bəzi əlavələr)
      turkey: 18803,
      uae: 20613,
      egypt: 18498,
      georgia: 223991,
      maldives: 275410,
      qatar: 759622,
      thailand: 20625,
      vietnam: 293645,
      sri_lanka: 20629,
      indonesia: 250722,
      malaysia: 435746,
      seychelles: 284350,
      mauritius: 293483,
      uzbekistan: 708675,
      saudi_arabia: 841186,
      jordan: 230174,
      spain: 18747,
      italy: 18770,
      france: 18808,
      czechia: 18813,
      china: 230826,
      japan: 337852,
      south_korea: 277390,
      india: 18028,
      morocco: 745206,
      tanzania: 439254,
    }),
    tours: Object.freeze([
      { id: 18888, name: 'Базовый тур Mongo AYT', state: 'turkey' },
      { id: 19210, name: 'Базовый тур Mongo AYT GDS', state: 'turkey' },
      { id: 32723, name: 'Базовый тур Mongo IST GDS', state: 'turkey' },
      { id: 19125, name: 'Базовый тур Mongo Premium AYT', state: 'turkey' },
      { id: 19360, name: 'Базовый тур Mongo Premium AYT GDS', state: 'turkey' },
      { id: 27489, name: 'Базовый тур Mongo Premium IST GDS part 1', state: 'turkey' },
    ]),
    limits: Object.freeze({ adultsMax: 8, childrenMax: 3, childAgeMax: 15, nightsMin: 2, nightsMax: 28 }),
    // Sahibin göndərdiyi nümunə URL-dəki sahələr (FS formasına xas)
    extraParams: Object.freeze({ TOURGROUP: '0', PROGRAMINC: '0', DISTRICTS: '0', CHILD_IN_BED: '0' }),
  }),
});

// Odiola istiqaməti (src/data/catalog.js id) → ölkə açarı. Daxili istiqamətlər üçün açar yoxdur.
const destinationCountry = Object.freeze({
  antalya: 'turkey', alanya: 'turkey', kemer: 'turkey', side: 'turkey', bodrum: 'turkey', istanbul: 'turkey',
  dubai: 'uae',
  sharm: 'egypt',
  batumi: 'georgia', tbilisi: 'georgia',
  maldives: 'maldives',
});

function getOperator(id) {
  return Object.prototype.hasOwnProperty.call(operators, id) ? operators[id] : null;
}

// CURRENCY ID → ISO kod (cavabların normalizasiyası üçün)
function currencyCodeById(op, currencyId) {
  const n = Number(currencyId);
  for (const [code, id] of Object.entries(op.currencies)) if (id === n) return code;
  return null;
}

module.exports = { operators, destinationCountry, getOperator, currencyCodeById };
