// Bütün mənbələrin (tur operatorları və otel mənbələri) qeydiyyatı.
// Real inteqrasiya hazır olanda müvafiq createMockProvider(...) sətrini
// həmin operatorun real adapteri ilə əvəz edin (məs. require('./summerTour')).

const { createMockProvider } = require('./mockProvider');
const { buildOperatorSearchUrl, getOperator, createSamoProvider } = require('./samo');

// SAMO operatorları (Summer Tour, Kompas, Funsun): hər təklifin `url`-i operatorun öz ictimai
// axtarış səhifəsinə (eyni tarix/gecə/nəfərlə) keçid olur. Bu sadəcə linkdir — qiymət çəkilmir.
function withDeeplink(p) {
  if (!getOperator(p.id)) return p;
  return {
    ...p,
    async search(q) {
      const offers = await p.search(q);
      return offers.map((o) => {
        const url = buildOperatorSearchUrl(p.id, { ...q, checkIn: new Date(o.checkIn + 'T00:00:00Z'), nights: o.nights, nightsFrom: o.nights, nightsTo: o.nights, flex: 0, checkInTo: null });
        return url ? { ...o, url, operatorLink: true } : o;
      });
    },
  };
}

// Rəsmi API girişi env ilə aktivləşdirilibsə real SAMO adapteri, əks halda demo + deeplink.
function samoOrMock(mock) {
  if (!getOperator(mock.id)) return mock;
  const real = createSamoProvider(mock.id, { color: mock.color, trust: mock.trust });
  return real.status().enabled ? real : withDeeplink(mock);
}

// Operator etibar bloku (trust). QAYDA: real şirkətlər haqqında məlumat UYDURULMUR.
// Təsdiqlənməmiş sahə null qalır və UI-da "təsdiqlənməyib" kimi göstərilir.
//   licenseNo   — lisenziya/qeydiyyat nömrəsi (rəsmi mənbədən yoxlanıldıqdan sonra)
//   memberships — [{ name, claim: 'operator' | 'verified', source }]
//                 claim:'operator' = "operatorun öz məlumatına görə", müstəqil yoxlanılmayıb
//   since       — fəaliyyətə başlama ili
//   verified    — eTour tərəfindən sənədlə yoxlanılıbmı
const unverified = () => ({ licenseNo: null, memberships: [], since: null, verified: false });

const providers = [
  createMockProvider({ id: 'summer', name: 'Summer Tour', color: '#f59e0b', bias: 1.0, coverage: 0.8, early: { minDaysAhead: 60, discount: 0.2 },
    trust: {
      ...unverified(),
      // Mənbə: Summer Tour Azerbaijan profil PDF-i (docs/RESEARCH.md, mənbə [1]) — operatorun öz iddiası
      memberships: [
        { name: 'IATA', claim: 'operator', source: 'profile.summertour.az (şirkət profili)' },
        { name: 'ATAA', claim: 'operator', source: 'profile.summertour.az (şirkət profili)' },
      ],
    } }),
  createMockProvider({ id: 'funsun', name: 'Funsun Travel', color: '#ef4444', bias: 0.98, coverage: 0.75, early: { minDaysAhead: 75, discount: 0.18 }, trust: unverified() }),
  createMockProvider({ id: 'kompas', name: 'Kompas Travel', color: '#3b82f6', bias: 1.03, coverage: 0.7, early: { minDaysAhead: 45, discount: 0.15 }, trust: unverified() }),
  // Yalnız otel satan mənbələr (Booking tipli / birbaşa otel müqavilələri)
  createMockProvider({ id: 'hotels-direct', name: 'Otel (birbaşa)', color: '#8b5cf6', kind: 'hotel', bias: 1.06, coverage: 0.9, sells: ['hotel'], trust: unverified() }),
  createMockProvider({ id: 'local-az', name: 'Yerli otellər AZ', color: '#14b8a6', kind: 'hotel', bias: 0.95, coverage: 1, sells: ['hotel', 'tour'], regions: ['domestic'], trust: unverified() }),
].map(samoOrMock);

module.exports = { providers };
