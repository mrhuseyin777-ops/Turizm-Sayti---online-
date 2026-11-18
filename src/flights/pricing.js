// DEMO tarif hesablaması (AZN). Deterministikdir: eyni uçuş + eyni gün = eyni qiymət.
// Təsir edən amillər: məsafə, daşıyıcı tipi, mövsüm (istiqamət regionu üzrə), həftə günü,
// uçuşa qalan gün sayı, gediş saatı, sinif. Real qiymətlər provayderdən gələcək.

const { getAirport, distanceKm } = require('./airports');
const { getCarrier } = require('./carriers');
const { hash, dayIndex } = require('./schedule');

const SEASON = {
  tr: [0.8, 0.8, 0.85, 0.95, 1.05, 1.25, 1.4, 1.4, 1.15, 1.0, 0.85, 0.95],
  me: [1.2, 1.15, 1.1, 0.95, 0.85, 0.85, 0.9, 0.9, 0.85, 0.95, 1.1, 1.3],
  asia: [1.25, 1.2, 1.1, 0.95, 0.85, 0.85, 0.9, 0.9, 0.85, 0.95, 1.1, 1.3],
  gulf: [1.15, 1.1, 1.05, 0.95, 0.85, 0.8, 0.85, 0.85, 0.9, 1.0, 1.1, 1.25],
  eu: [0.85, 0.8, 0.9, 1.0, 1.05, 1.15, 1.25, 1.25, 1.05, 0.95, 0.85, 1.15],
  cis: [0.95, 0.9, 0.9, 0.95, 1.0, 1.1, 1.2, 1.2, 1.0, 0.95, 0.9, 1.15],
  domestic: [0.95, 0.9, 0.9, 0.95, 1.0, 1.1, 1.2, 1.2, 1.0, 0.95, 0.9, 1.15],
};
const WEEKDAY = [1.08, 0.98, 0.92, 0.93, 1.0, 1.1, 1.02]; // Bazar..Şənbə
const TYPE_FACTOR = { full: 1, hybrid: 0.88, lcc: 0.72 };
const TYPE_RANK = { full: 0, hybrid: 1, lcc: 2 };

function bookingCurve(daysAhead) {
  if (daysAhead <= 2) return 1.5;
  if (daysAhead <= 6) return 1.3;
  if (daysAhead <= 13) return 1.15;
  if (daysAhead <= 27) return 1.05;
  if (daysAhead <= 90) return 1;
  return 1.04;
}

// İtinerarın ən "aşağı" daşıyıcı tipi (lcc > hybrid > full) tarif ailələrini müəyyən edir
function itineraryType(it) {
  return it.carriers.map((c) => getCarrier(c).type).sort((a, b) => TYPE_RANK[b] - TYPE_RANK[a])[0];
}

// Bir böyük sərnişin üçün baza ekonom tarif (AZN)
function baseFare(it, todayIso) {
  const dest = getAirport(it.to); const orig = getAirport(it.from);
  const region = dest.region === 'domestic' ? orig.region : dest.region;
  const month = Number(it.dep.slice(5, 7)) - 1;
  const weekday = new Date(it.dep.slice(0, 10) + 'T00:00:00Z').getUTCDay();
  const daysAhead = dayIndex(it.dep) - dayIndex(todayIso);
  const hour = Number(it.dep.slice(11, 13));
  let legs = 0;
  for (const s of it.segments) {
    const c = getCarrier(s.carrier);
    legs += (30 + segmentKm(s) * 0.07) * TYPE_FACTOR[c.type] * (0.93 + (hash(c.code + 'bias') % 15) / 100);
  }
  let fare = legs * (it.stops ? 0.85 : 1); // aktarmalı uçuş adətən ucuz satılır
  if (it.selfTransfer) fare *= 0.9; // ayrı biletlərin birləşməsi adətən daha ucuzdur (amma aktarma qorunmur)
  fare *= (SEASON[region] || SEASON.cis)[month];
  fare *= WEEKDAY[weekday];
  fare *= bookingCurve(daysAhead);
  if (hour < 6) fare *= 0.92; else if (hour >= 6 && hour < 10) fare *= 1.05;
  fare *= 0.9 + (hash(it.id) % 200) / 1000; // ±10%
  return fare;
}

const kmCache = new Map();
function segmentKm(s) {
  const k = s.from + s.to;
  if (!kmCache.has(k)) kmCache.set(k, distanceKm(getAirport(s.from), getAirport(s.to)));
  return kmCache.get(k);
}

// Bir qeydiyyat baqajı (1 çanta, bir istiqamət, bir sərnişin) üçün DEMO əlavə qiyməti (AZN)
function bagPieceFee(it) {
  return it.segments.reduce((s, seg) => s + 18 + segmentKm(seg) * 0.006, 0);
}

// Tarif ailələri — ÜMUMİ adlar (light / standard / flex / business); konkret aviaşirkətin real
// tarif adları və şərtləri DEYİL (DEMO). checked: qeydiyyatlı baqaj (kq, 0 = yoxdur), pieces: daxil olan çanta sayı,
// hand: əl yükü (kq); refund / change: 'no' | 'fee' | 'yes'; seat: oturacaq seçimi 'fee' | 'free'
function fareFamilies(it, cabin) {
  const type = itineraryType(it);
  const c = getCarrier(it.validating);
  const hand = Math.min(...it.carriers.map((x) => getCarrier(x).hand));
  const checked = Math.min(...it.carriers.map((x) => getCarrier(x).checked));
  if (cabin === 'business') {
    return [{ id: 'business', cabin, hand: hand * 2, checked: 32, pieces: 2, refund: 'yes', change: 'yes', seat: 'free', add: 0, mult: 3.1 }];
  }
  if (type === 'full') {
    return [
      { id: 'light', cabin, hand, checked: 0, pieces: 0, refund: 'no', change: 'fee', seat: 'fee', add: 0, mult: 0.9 },
      { id: 'standard', cabin, hand, checked, pieces: 1, refund: 'fee', change: 'fee', seat: 'fee', add: 0, mult: 1 },
      { id: 'flex', cabin, hand, checked, pieces: 1, refund: 'yes', change: 'yes', seat: 'free', add: 0, mult: 1.3 },
    ];
  }
  const bagFee = bagPieceFee(it);
  return [
    { id: 'light', cabin, hand: c.hand, checked: 0, pieces: 0, refund: 'no', change: 'fee', seat: 'fee', add: 0, mult: 1 },
    { id: 'standard', cabin, hand: c.hand, checked, pieces: 1, refund: 'no', change: 'fee', seat: 'fee', add: bagFee, mult: 1 },
    { id: 'flex', cabin, hand: c.hand, checked, pieces: 1, refund: 'fee', change: 'yes', seat: 'free', add: bagFee, mult: 1.25 },
  ];
}

// Ümumi qiymət (bütün sərnişinlər, AZN) — provayder əmsalından əvvəl
function familyPrice(base, fam, pax) {
  const factor = pax.adults + pax.children * 0.75 + pax.infants * 0.1;
  return base * fam.mult * factor + fam.add * (pax.adults + pax.children);
}

function supportsCabin(it, cabin) {
  return cabin !== 'business' || it.carriers.every((c) => getCarrier(c).business);
}

module.exports = { baseFare, fareFamilies, familyPrice, supportsCabin, itineraryType, bookingCurve, bagPieceFee };
