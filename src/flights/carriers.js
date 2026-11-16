// DEMO daşıyıcılar və marşrut şəbəkəsi.
// Aviaşirkət adları yalnız nümunə kimi istifadə olunur: cədvəllər, uçuş nömrələri və qiymətlər
// UYDURMADIR və həmin şirkətlərin real təklifləri deyil. Real məlumat provayder API-dən gələcək.
//
// type: 'full' (tam xidmət), 'hybrid', 'lcc' (lowcost) — tarif ailəsini və baqajı müəyyən edir.
// network: { hub: [birbaşa uçulan hava limanları] } — hər iki istiqamətdə uçuş var sayılır.

const carriers = [
  {
    code: 'J2', name: 'AZAL', color: '#0b4ea2', type: 'full', business: true, hand: 8, checked: 23,
    network: {
      GYD: ['NAJ', 'GNJ', 'LLK', 'GBB', 'ZTU', 'FZL', 'IST', 'AYT', 'ESB', 'DXB', 'DOH', 'TBS', 'SVO', 'VKO', 'LED', 'NQZ', 'TAS', 'TLV', 'LHR', 'CDG', 'MXP', 'FCO', 'VIE', 'PRG', 'BCN'],
      NAJ: ['IST', 'VKO'],
    },
  },
  {
    code: 'TK', name: 'Turkish Airlines', color: '#c8102e', type: 'full', business: true, hand: 8, checked: 23,
    network: {
      IST: ['GYD', 'NAJ', 'GNJ', 'AYT', 'ESB', 'ADB', 'DXB', 'AUH', 'DOH', 'TBS', 'BUS', 'SVO', 'VKO', 'LED', 'NQZ', 'ALA', 'TAS', 'TLV', 'CAI', 'SSH', 'HRG',
        'LHR', 'CDG', 'FRA', 'MUC', 'MXP', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD', 'BKK', 'HKT', 'MLE', 'KUL', 'ICN'],
    },
  },
  {
    code: 'VF', name: 'AJet', color: '#1d3f8f', type: 'lcc', business: false, hand: 8, checked: 20,
    network: {
      SAW: ['GYD', 'NAJ', 'AYT', 'ESB', 'ADB', 'TBS', 'DXB', 'CAI', 'FRA', 'MUC', 'VIE', 'BCN', 'MXP'],
      ESB: ['GYD', 'ADB', 'AYT', 'FRA'],
    },
  },
  {
    code: 'PC', name: 'Pegasus', color: '#f6a800', type: 'lcc', business: false, hand: 8, checked: 20,
    network: {
      SAW: ['GYD', 'NAJ', 'AYT', 'ESB', 'ADB', 'TBS', 'BUS', 'DXB', 'SHJ', 'CAI', 'HRG', 'SSH', 'TLV', 'LED', 'ALA', 'TAS', 'NQZ', 'FRA', 'MUC', 'MXP', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD'],
    },
  },
  {
    code: 'FZ', name: 'flydubai', color: '#e2231a', type: 'hybrid', business: true, hand: 7, checked: 20,
    network: {
      DXB: ['GYD', 'GNJ', 'TBS', 'BUS', 'VKO', 'LED', 'ALA', 'NQZ', 'TAS', 'TLV', 'IST', 'SAW', 'AYT', 'MXP', 'PRG', 'BUD', 'BKK', 'MLE', 'SSH'],
    },
  },
  {
    code: 'G9', name: 'Air Arabia', color: '#c4161c', type: 'lcc', business: false, hand: 7, checked: 20,
    network: { SHJ: ['GYD', 'TBS', 'VKO', 'ALA', 'TAS', 'NQZ', 'IST', 'SAW', 'CAI', 'BKK', 'KUL', 'MLE', 'VIE', 'PRG', 'MXP'] },
  },
  {
    code: 'QR', name: 'Qatar Airways', color: '#5c0632', type: 'full', business: true, hand: 7, checked: 25,
    network: { DOH: ['GYD', 'TBS', 'IST', 'SAW', 'ALA', 'TAS', 'CAI', 'LHR', 'CDG', 'FRA', 'MUC', 'MXP', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD', 'BKK', 'HKT', 'MLE', 'KUL', 'ICN'] },
  },
  {
    code: 'EK', name: 'Emirates', color: '#d71921', type: 'full', business: true, hand: 7, checked: 25,
    network: { DXB: ['GYD', 'IST', 'SVO', 'DME', 'LED', 'ALA', 'TAS', 'CAI', 'TLV', 'LHR', 'CDG', 'FRA', 'MUC', 'MXP', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD', 'BKK', 'HKT', 'MLE', 'KUL', 'ICN'] },
  },
  {
    code: 'EY', name: 'Etihad Airways', color: '#bd8b13', type: 'full', business: true, hand: 7, checked: 23,
    network: { AUH: ['IST', 'ALA', 'TAS', 'CAI', 'LHR', 'CDG', 'FRA', 'MUC', 'MXP', 'FCO', 'BCN', 'VIE', 'BKK', 'HKT', 'MLE', 'KUL', 'ICN'] },
  },
  {
    code: 'W6', name: 'Wizz Air', color: '#c6007e', type: 'lcc', business: false, hand: 10, checked: 20,
    network: { BUD: ['GYD', 'BUS', 'TLV', 'FCO', 'BCN', 'MXP', 'CDG', 'LHR', 'DXB', 'AUH', 'HRG', 'SSH'] },
  },
  {
    code: 'LH', name: 'Lufthansa', color: '#05164d', type: 'full', business: true, hand: 8, checked: 23,
    network: {
      FRA: ['GYD', 'TBS', 'IST', 'ALA', 'NQZ', 'TLV', 'CAI', 'DXB', 'DOH', 'LHR', 'CDG', 'MXP', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD', 'BKK', 'ICN', 'MUC'],
      MUC: ['TBS', 'IST', 'AYT', 'TLV', 'LHR', 'CDG', 'FCO', 'BCN', 'VIE', 'PRG', 'BUD', 'DXB', 'BKK', 'ICN'],
    },
  },
  {
    code: 'SU', name: 'Aeroflot', color: '#02458d', type: 'full', business: true, hand: 10, checked: 23,
    network: {
      SVO: ['GYD', 'LED', 'AYT', 'IST', 'DXB', 'AUH', 'TAS', 'ALA', 'NQZ', 'SSH', 'HRG', 'BKK', 'HKT', 'MLE'],
      LED: ['GYD', 'AYT', 'IST', 'DXB', 'TAS'],
    },
  },
  {
    code: 'HY', name: 'Uzbekistan Airways', color: '#1f6fb5', type: 'full', business: true, hand: 8, checked: 23,
    network: { TAS: ['GYD', 'IST', 'DXB', 'SVO', 'DME', 'LED', 'ALA', 'NQZ', 'TLV', 'BKK', 'KUL', 'ICN', 'FRA', 'LHR', 'CDG', 'FCO'] },
  },
  {
    code: 'KC', name: 'Air Astana', color: '#a1824a', type: 'full', business: true, hand: 8, checked: 23,
    network: {
      ALA: ['GYD', 'TAS', 'NQZ', 'IST', 'AYT', 'DXB', 'DOH', 'TBS', 'FRA', 'LHR', 'BKK', 'HKT', 'KUL', 'ICN'],
      NQZ: ['IST', 'AYT', 'DXB', 'FRA', 'TBS'],
    },
  },
];

// Fərqli daşıyıcılar arasında aktarma (interline/codeshare) yalnız bu cütlər üçün demo olaraq icazəlidir.
const PARTNERS = [
  ['J2', 'TK'], ['J2', 'QR'], ['J2', 'FZ'], ['J2', 'EK'], ['J2', 'LH'], ['J2', 'SU'], ['J2', 'HY'], ['J2', 'KC'], ['J2', 'EY'],
  ['TK', 'LH'], ['QR', 'EY'],
];
const partnerSet = new Set(PARTNERS.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
const canConnect = (a, b) => a === b || partnerSet.has(`${a}|${b}`);

const carrierByCode = new Map(carriers.map((c) => [c.code, c]));
const getCarrier = (code) => carrierByCode.get(code) || null;

// İstiqamətli kənarlar siyahısı: from -> [{ carrier, to }]
const edgesFrom = new Map();
function addEdge(carrier, from, to) {
  if (!edgesFrom.has(from)) edgesFrom.set(from, []);
  const list = edgesFrom.get(from);
  if (!list.some((e) => e.carrier === carrier && e.to === to)) list.push({ carrier, from, to });
}
for (const c of carriers) {
  for (const [hub, dests] of Object.entries(c.network)) {
    for (const d of dests) { addEdge(c.code, hub, d); addEdge(c.code, d, hub); }
  }
}

module.exports = { carriers, getCarrier, canConnect, edgesFrom };
