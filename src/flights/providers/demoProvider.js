// DEMO aviabilet satış mənbəyi (provayder adapteri).
// Real adapter (GDS / NDC / aggregator API) eyni interfeysi qaytarmalıdır:
//
//   search(query) -> Promise<FlightOffer[]>
//
//   query: { fromCodes: string[], toCodes: string[], depart, return|null, adults, children, infants, cabin: 'economy'|'business', today }
//   FlightOffer: {
//     id, sourceId,
//     outbound: Itinerary, inbound: Itinerary|null,   // Itinerary formatı: schedule.js -> makeItinerary
//     fare: { family, cabin, hand, checked, pieces, refund, change, seat },
//     price,       // bütün sərnişinlər üçün yekun qiymət (vergi + mənbə xidmət haqqı daxil)
//     currency: 'AZN',
//   }
//
// Aqreqator eyni uçuşu (eyni seqmentlər) müxtəlif mənbələrdən qruplaşdırıb müqayisə edir.

const { buildItineraries } = require('../schedule');
const { baseFare, fareFamilies, familyPrice, supportsCabin } = require('../pricing');
const { hash } = require('../schedule');

const RT_DISCOUNT = 0.96; // gediş-dönüş birlikdə alınanda kiçik endirim (demo)

// İki istiqamət üçün baza tarifləri olan itinerarlar (bütün demo mənbələr üçün ortaq)
function candidates(q) {
  const notBeforeUtc = q.depart === q.today ? Math.floor(Date.now() / 60000) + 120 : 0;
  const all = (fromCodes, toCodes, date, opts) => fromCodes.flatMap((f) => toCodes.flatMap((t) => buildItineraries(f, t, date, opts)));
  const outs = all(q.fromCodes, q.toCodes, q.depart, { notBeforeUtc })
    .filter((it) => supportsCabin(it, q.cabin))
    .map((it) => ({ it, base: baseFare(it, q.today) }));
  if (!q.return) return outs.map((o) => ({ outbound: o.it, inbound: null, base: o.base }));

  const ins = all(q.toCodes, q.fromCodes, q.return)
    .filter((it) => supportsCabin(it, q.cabin))
    .map((it) => ({ it, base: baseFare(it, q.today) }));
  const pairs = [];
  for (const o of outs) {
    // Eyni əsas daşıyıcı ilə dönüş; gedişin enişindən ən azı 3 saat sonra
    const list = ins
      .filter((i) => i.it.validating === o.it.validating && i.it._depUtc - (o.it._depUtc + o.it.durationMin) >= 180)
      .sort((a, b) => a.base - b.base)
      .slice(0, 2);
    for (const i of list) pairs.push({ outbound: o.it, inbound: i.it, base: (o.base + i.base) * RT_DISCOUNT });
  }
  return pairs;
}

function createDemoFlightProvider(opts) {
  const {
    id, name, color, kind = 'ota',
    bias = 1, fee = 0, coverage = 1, spread = 0.07,
    excludeCarriers = [], onlyCheapestFamily = false, latencyMs = 0,
  } = opts;

  async function search(q) {
    if (latencyMs) await new Promise((r) => setTimeout(r, latencyMs));
    const pax = { adults: q.adults, children: q.children, infants: q.infants };
    const seats = q.adults + q.children;
    const offers = [];
    for (const c of candidates(q)) {
      const carriers = new Set([...c.outbound.carriers, ...(c.inbound ? c.inbound.carriers : [])]);
      if ([...carriers].some((x) => excludeCarriers.includes(x))) continue;
      const flightId = c.outbound.id + (c.inbound ? '~' + c.inbound.id : '');
      if ((hash(id + ':' + flightId) % 100) / 100 >= coverage) continue;
      let fams = fareFamilies(c.outbound, q.cabin);
      if (c.inbound) {
        // Dönüş də eyni ailəni dəstəkləməlidir (baqaj = iki istiqamətin minimumu)
        const inFams = fareFamilies(c.inbound, q.cabin);
        fams = fams.filter((f) => inFams.some((g) => g.id === f.id)).map((f) => {
          const g = inFams.find((x) => x.id === f.id);
          return { ...f, checked: Math.min(f.checked, g.checked), hand: Math.min(f.hand, g.hand), add: f.add + g.add };
        });
      }
      if (onlyCheapestFamily) fams = fams.slice(0, 1);
      for (const fam of fams) {
        const jitter = 1 - spread / 2 + (hash(`${id}|${flightId}|${fam.id}`) % 1000) / 1000 * spread;
        const price = Math.round(familyPrice(c.base, fam, pax) * bias * jitter + fee * seats);
        offers.push({
          id: `${id}|${fam.id}|${flightId}`,
          sourceId: id,
          flightId,
          outbound: c.outbound,
          inbound: c.inbound,
          fare: { family: fam.id, cabin: fam.cabin, hand: fam.hand, checked: fam.checked, pieces: fam.pieces, refund: fam.refund, change: fam.change, seat: fam.seat },
          price,
          currency: 'AZN',
        });
      }
    }
    return offers;
  }

  return { id, name, color, kind, demo: true, search };
}

module.exports = { createDemoFlightProvider };
