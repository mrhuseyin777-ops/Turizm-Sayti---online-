// DEMO avtomobil provayderləri: real icarə/transfer API-si qoşulana qədər
// deterministik (hər dəfə eyni) qiymətlər generasiya edir.
// Real adapter də eyni interfeysi qaytarmalıdır:
//   rental.search(q)   -> Promise<RentalOffer[]>   (qiymətlər AZN)
//   transfer.quote(q)  -> Promise<TransferOffer[]> (qiymətlər AZN)

const { hash } = require('../data/catalog');
const { MODELS, COMPANIES, COUNTRY_FACTOR, SEASON, SEASON_OF, TRANSFER_CLASSES, TRANSFER_COMPANIES } = require('./fleet');
const { roadKm } = require('./locations');

const CAP_DAYS = 10; // gündəlik əlavələr (uşaq oturacağı, GPS və s.) maks. 10 günə hesablanır

function seasonFactor(destId, month) {
  return SEASON[SEASON_OF[destId] || 'city'][month];
}

function durationFactor(days) {
  if (days >= 14) return 0.8;
  if (days >= 7) return 0.86;
  if (days >= 3) return 0.94;
  return 1;
}

// Eyni şəhərin nöqtələri (məs. Antalya hava limanı ↔ Antalya mərkəzi)
function sameArea(a, b) {
  if (a.id === b.id) return true;
  const destsA = a.serves || [a.destinationId];
  const destsB = b.serves || [b.destinationId];
  return destsA.some((d) => destsB.includes(d));
}

// Hər nöqtədə ən azı 2 şirkət olsun ki, müqayisə mənalı olsun (deterministik seçim)
const guaranteed = new Map();
function guaranteedFor(point) {
  if (!guaranteed.has(point.id)) {
    const ids = COMPANIES.filter((c) => c.countries.includes(point.country))
      .sort((a, b) => hash(`g:${a.id}:${point.id}`) - hash(`g:${b.id}:${point.id}`))
      .slice(0, 2).map((c) => c.id);
    guaranteed.set(point.id, ids);
  }
  return guaranteed.get(point.id);
}

function createRentalProvider(c) {
  const covers = (point) => c.countries.includes(point.country) &&
    ((hash(`${c.id}:${point.id}`) % 100) < c.coverage * 100 || guaranteedFor(point).includes(c.id));
  const hasModel = (m, point) => c.fleet.includes(m.category) && (hash(`${c.id}:${m.id}:${point.destinationId}`) % 100) < 85;
  const jitter = (key) => 0.92 + (hash(c.id + '|' + key) % 160) / 1000; // ±8%

  async function search(q) {
    const { pickup, dropoff, days, age } = q;
    if (!covers(pickup)) return [];
    if (pickup.id !== dropoff.id && !covers(dropoff)) return [];
    if (age < c.minAge) return [];
    const month = Number(q.from.slice(5, 7)) - 1;
    const country = COUNTRY_FACTOR[pickup.country] || 1;
    const season = seasonFactor(pickup.destinationId, month);
    const capped = Math.min(days, CAP_DAYS);

    let oneWay = 0;
    if (pickup.id !== dropoff.id) {
      oneWay = sameArea(pickup, dropoff) ? c.sameCityFee : Math.max(c.oneWayMin, roadKm(pickup, dropoff) * c.oneWayPerKm);
    }

    const offers = [];
    for (const m of MODELS) {
      if (!hasModel(m, pickup)) continue;
      if (m.category === 'premium' && age < 25) continue; // premium sinif 25+ yaş
      const daily = m.base * country * season * durationFactor(days) * jitter(`${m.id}|${pickup.id}|${q.from}`) * c.bias * (c.insurance === 'full' ? 1.12 : 1);
      const rental = daily * days;
      const young = age < 25 ? c.young * capped : 0;
      const extras = {
        childSeat: q.extras.childSeats * c.extras.childSeat * capped,
        gps: q.extras.gps ? c.extras.gps * capped : 0,
        extraDriver: q.extras.extraDriver ? c.extras.extraDriver * capped : 0,
      };
      offers.push({
        id: `${c.id}|${m.id}`,
        companyId: c.id,
        modelId: m.id,
        category: m.category,
        insurance: c.insurance,
        kmLimit: c.km,
        freeCancel: c.freeCancel,
        deposit: Math.round((m.deposit * c.depositFactor) / 10) * 10,
        minAge: c.minAge,
        parts: { rental, oneWay, young, extras }, // AZN, yuvarlaqlaşdırılmamış
      });
    }
    return offers;
  }

  return { id: c.id, name: c.name, color: c.color, demo: true, kind: 'rental', info: c, search };
}

function createTransferProvider(tc) {
  const jitter = (key) => 0.94 + (hash(tc.id + '|' + key) % 120) / 1000; // ±6%

  // q: { mode, from, to, km, date, hour, days, classes: [class] }
  async function quote(q) {
    if (!tc.countries.includes(q.country)) return [];
    const month = Number(q.date.slice(5, 7)) - 1;
    const season = 0.9 + 0.1 * seasonFactor(q.destinationId, month);
    const country = COUNTRY_FACTOR[q.country] || 1;
    const night = q.mode === 'transfer' && (q.hour < 6 || q.hour >= 22) ? 1.2 : 1;
    const route = q.mode === 'transfer' ? `${q.from.id}>${q.to.id}` : `day:${q.from.id}`;
    return q.classes.map((cl) => {
      const raw = q.mode === 'transfer'
        ? Math.max(cl.base, cl.base * 0.6 + q.km * cl.perKm)
        : cl.perDay * q.days;
      return {
        id: `${tc.id}|${cl.id}`,
        companyId: tc.id,
        classId: cl.id,
        freeCancelHours: tc.freeCancelHours,
        meetGreet: tc.meetGreet,
        priceAzn: raw * country * season * night * jitter(`${route}|${cl.id}`) * tc.bias,
      };
    });
  }

  return { id: tc.id, name: tc.name, color: tc.color, demo: true, kind: 'transfer', info: tc, quote };
}

const rentalProviders = COMPANIES.map(createRentalProvider);
const transferProviders = TRANSFER_COMPANIES.map(createTransferProvider);

module.exports = { rentalProviders, transferProviders, sameArea, TRANSFER_CLASSES };
