// "Qiymətə nə daxildir" (B2C, RESEARCH-3 C1): hər təklifə deterministik `includes` / `excludes` siyahısı.
// DEMO: real operator API-si bu sahələri verənə qədər qaydalar təklifin öz məlumatından (növ, uçuş, qida,
// operator) çıxarılır. UI-da "DEMO — operatordan dəqiqləşdirilir" işarəsi ilə göstərilir.
//
// Format — yığcam açarlar (JSON cavabını şişirtməmək üçün), mətn UI-da i18n ilə (inc_<açar>):
//   includes: 'hotel' | 'flight' | 'baggage:<kq>' | 'transfer' | 'insurance' | 'meal:<BB|HB|FB|AI|UAI|RO>' |
//             'transport' | 'guide' | 'excursions' | 'skipass'
//   excludes: 'visa' (yalnız xarici istiqamət — KONKRET viza qaydası verilmir, "rəsmi mənbədən yoxlayın") |
//             'tourist_tax' (bəzi ölkələrdə yerində ödənilir — ümumi qeyd) | 'personal' | 'flight' | 'transfer' | 'insurance'

// Tibbi sığorta paketə daxildirmi — operatora görə (DEMO, təsdiqlənməyib)
const INSURANCE_BY_PROVIDER = { summer: true, funsun: true, kompas: false };
// Baqaj: uçuş sinfinə görə (DEMO; real dəyər operatorun reys məlumatından gəlməlidir)
const BAGGAGE_KG = { econom: 20, business: 30 };

// Ekskursiya turunun kataloqdakı "daxildir" teqləri → açarlar
const TOUR_TAGS = [
  [/^aviabilet/i, 'flight'],
  [/^otel \(ai\)/i, 'meal:AI'],
  [/^otel/i, 'hotel'],
  [/^transfer/i, 'transfer'],
  [/^(avtobus|nəqliyyat)/i, 'transport'],
  [/^bələdçi/i, 'guide'],
  [/^səhər yeməyi/i, 'meal:BB'],
  [/^ski-pass/i, 'skipass'],
  [/(ekskursiya|safari|turu$)/i, 'excursions'],
];

const uniq = (a) => [...new Set(a)];

// o: təklif (collectOffers formatı); region: 'intl' | 'domestic'
function inclusions(o, region) {
  const intl = region === 'intl';
  const inc = [];
  const exc = [];
  if (o.itemType === 'tour') {
    for (const tag of o.tags || []) {
      const hit = TOUR_TAGS.find(([re]) => re.test(String(tag)));
      if (hit) inc.push(hit[1]);
    }
    if (inc.includes('meal:AI') && !inc.includes('hotel')) inc.unshift('hotel');
    if (intl && inc.includes('flight') && INSURANCE_BY_PROVIDER[o.providerId]) inc.push('insurance');
    if (intl && !inc.includes('flight')) exc.push('flight');
  } else {
    inc.push('hotel');
    if (o.board) inc.push(`meal:${o.board}`);
    if (o.flight) {
      inc.push('flight');
      inc.push(`baggage:${BAGGAGE_KG[o.flight.cls] || BAGGAGE_KG.econom}`);
      inc.push('transfer');
      if (INSURANCE_BY_PROVIDER[o.providerId]) inc.push('insurance');
      else exc.push('insurance');
    } else if (intl) {
      exc.push('flight', 'transfer', 'insurance');
    }
  }
  if (intl) exc.push('visa');
  exc.push('tourist_tax', 'personal');
  return { includes: uniq(inc), excludes: uniq(exc).filter((k) => !inc.includes(k)) };
}

module.exports = { inclusions, INSURANCE_BY_PROVIDER, BAGGAGE_KG };
