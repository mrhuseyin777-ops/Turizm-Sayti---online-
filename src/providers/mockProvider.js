// DEMO provayder: real operator API-si qoşulana qədər deterministik (hər dəfə eyni)
// qiymətlər generasiya edir. Real adapter də eyni interfeysi qaytarmalıdır:
//   search(query) -> Promise<Offer[]>
// Offer formatı: aşağıdakı offers.push({...}) obyektinə baxın.

const config = require('../config');
const { destinations, hotels, tours, hash, ROOM_TYPES } = require('../data/catalog');
const { childFactors, childBand, accommodation } = require('../pricing');

const SEASON = [0.7, 0.7, 0.75, 0.85, 1.0, 1.25, 1.45, 1.5, 1.2, 0.95, 0.75, 0.85]; // Yan–Dek
const DOMESTIC_SEASON = [1.1, 1.15, 0.8, 0.85, 0.95, 1.15, 1.3, 1.3, 1.0, 0.9, 0.85, 1.2];
const BOARD_ADD = { BB: 0, HB: 12, FB: 22, AI: 30, UAI: 45 };

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}
const iso = (d) => d.toISOString().slice(0, 10);

function createMockProvider(opts) {
  const {
    id, name, color, kind = 'operator', bias = 1, coverage = 0.75,
    early = null, // { minDaysAhead, discount }
    trust = null, // operator etibar məlumatı (bax: providers/index.js)
    sells = ['package', 'hotel', 'tour'],
    regions = ['intl', 'domestic'],
  } = opts;

  function covers(itemId) {
    return (hash(id + ':' + itemId) % 100) / 100 < coverage;
  }

  function jitter(key) {
    // ±7% operatora və tarixə görə dəyişkənlik
    return 0.93 + (hash(id + key) % 140) / 1000;
  }

  function earlyDiscount(checkIn, today) {
    if (!early) return 0;
    const days = (checkIn - today) / 86400000;
    return days >= early.minDaysAhead ? early.discount : 0;
  }

  // DEMO ödəniş/ləğv şərtləri: təklif açarına görə deterministik.
  // Real adapterdə bu sahələr operatorun cavabından gəlməlidir.
  function terms(key, checkIn, today, domestic) {
    const h = hash(id + '|terms|' + key);
    const prepayment = domestic ? ['none', 'none', '50', 'full'][h % 4] : ['none', '50', '50', 'full'][h % 4];
    let freeCancelUntil = null;
    if ((h >>> 3) % 3 !== 0) {
      const d = addDays(checkIn, -(3 + ((h >>> 6) % 19))); // gedişdən 3–21 gün əvvələdək
      if (d >= today) freeCancelUntil = iso(d);
    }
    return { prepayment, freeCancelUntil };
  }

  // Reys (blok yerlər): operator + istiqamət + tarix üzrə sabit uçuş saatı və yer statusu
  const FLIGHT_TIMES = ['02:40', '05:15', '07:55', '09:30', '13:20', '18:45', '22:10'];
  const SEATS = ['many', 'many', 'many', 'few', 'few', 'request', 'none', 'many', 'few', 'many', 'many', 'many'];
  function flightInfo(destId, dateIso, backIso) {
    const ho = hash(`${id}|fl|${destId}|${dateIso}`);
    const hb = hash(`${id}|fl|${destId}|${backIso}|back`);
    return {
      out: { date: dateIso, time: FLIGHT_TIMES[ho % FLIGHT_TIMES.length], seats: SEATS[(ho >>> 5) % SEATS.length] },
      back: { date: backIso, time: FLIGHT_TIMES[hb % FLIGHT_TIMES.length], seats: SEATS[(hb >>> 5) % SEATS.length] },
    };
  }

  // Otel yer statusu + stop-sale (DEMO). Real adapterdə SAMO "Места" sütunundan gəlir.
  function hotelStatus(key) {
    const h = hash(id + '|hs|' + key);
    if (h % 25 === 0) return { hotelSeats: 'none', stopSale: true, availability: 'request' };
    if (hash(key + id) % 9 === 0) return { hotelSeats: 'request', stopSale: false, availability: 'request' };
    return { hotelSeats: (h >>> 4) % 4 === 0 ? 'few' : 'many', stopSale: false, availability: 'instant' };
  }

  // Qiymət növü: erkən rezervasiya (il ilə) > SPO (xüsusi təklif, -6%) > standart
  function priceType(key, disc, checkIn) {
    if (disc) return { priceType: 'EB', priceTypeLabel: `Erkən rezervasiya ${checkIn.getUTCFullYear()}` };
    if (hash(id + '|spo|' + key) % 6 === 0) return { priceType: 'SPO', priceTypeLabel: 'SPO' };
    return { priceType: 'STD', priceTypeLabel: 'Standart' };
  }

  async function search(q) {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const offers = [];
    const ages = q.childAges || Array(q.children).fill(null);
    const cf = childFactors(ages);
    const pax = q.adults + cf.hotel;
    const flightPax = q.adults + cf.flight;
    // CHD FREE otellərdə ilk 2–11 yaşlı uşaq otelə pulsuz yerləşir
    const firstChd = ages.map((a) => (Number.isInteger(a) ? a : config.defaultChildAge)).find((a) => a >= 2 && a < 12);
    const chdFreeDiscount = firstChd === undefined ? 0 : childBand(firstChd).hotel;
    const acc = accommodation(q.adults, ages);
    const hasChildren = ages.length > 0;
    const dests = destinations.filter((d) => q.destinationIds.includes(d.id) && regions.includes(d.region));
    const dateFrom = q.dateFrom || addDays(q.checkIn, -q.flex);
    const dateTo = q.dateTo || addDays(q.checkIn, q.flex);
    const nightsList = [];
    for (let n = q.nightsFrom || q.nights; n <= (q.nightsTo || q.nights); n++) nightsList.push(n);
    const opRate = config.operatorRate.value;

    for (let checkIn = new Date(dateFrom); checkIn <= dateTo; checkIn = addDays(checkIn, 1)) {
      if (checkIn < today) continue;
      const month = checkIn.getUTCMonth();
      const year = checkIn.getUTCFullYear();
      const dIso = iso(checkIn);

      // Otel / paket təklifləri
      if ((q.type === 'package' || q.type === 'hotel') && sells.includes(q.type)) {
        for (const d of dests) {
          if (q.type === 'package' && d.region === 'domestic') continue; // daxildə aviabilet yoxdur
          const season = d.region === 'domestic' ? DOMESTIC_SEASON[month] : SEASON[month];
          const tourName = `${d.name.split(' ')[0]} ${year}`;
          for (const h of hotels.filter((x) => x.destinationId === d.id)) {
            if (!covers(h.id)) continue;
            if (hasChildren && h.attrs.includes('adultsOnly')) continue; // "yalnız böyüklər" — uşaqlı axtarışda yox
            const hotelPax = h.attrs.includes('chdFree') ? pax - chdFreeDiscount : pax;
            const rooms = h.rooms.filter((r) => !!ROOM_TYPES[r].family === acc.family);
            for (const nights of nightsList) {
              const backIso = iso(addDays(checkIn, nights));
              const fl = q.type === 'package' ? flightInfo(d.id, dIso, backIso) : null;
              for (const board of h.boards) {
                for (const room of rooms) {
                  const key = `${h.id}|${dIso}|${nights}|${board}|${room.replace(/\s+/g, '')}`;
                  const perNight = (d.base * h.priceFactor * ROOM_TYPES[room].factor + BOARD_ADD[board]) * season * jitter(key) * bias;
                  let price = perNight * nights * hotelPax;
                  let cls = null;
                  if (fl) {
                    cls = hash(id + '|cls|' + key) % 10 === 0 ? 'business' : 'econom';
                    price += d.flight * flightPax * jitter('f' + dIso) * (cls === 'business' ? 2.2 : 1);
                  }
                  const disc = earlyDiscount(checkIn, today);
                  const pt = priceType(key, disc, checkIn);
                  if (pt.priceType === 'SPO') price *= 0.94;
                  const oldPrice = disc ? Math.round(price) : null;
                  price = Math.round(price * (1 - disc));
                  const st = hotelStatus(key);
                  offers.push({
                    id: `${id}:${key}`,
                    providerId: id,
                    itemType: 'hotel',
                    itemId: h.id,
                    name: h.name,
                    destinationId: d.id,
                    districtId: h.districtId,
                    district: h.district,
                    stars: h.stars,
                    rating: h.rating,
                    tags: h.tags,
                    attrs: h.attrs,
                    board,
                    room,
                    accommodation: acc.code,
                    tourName,
                    checkIn: dIso,
                    nights,
                    adults: q.adults,
                    children: q.children,
                    includesFlight: !!fl,
                    flight: fl ? { ...fl, cls } : null,
                    price,
                    oldPrice,
                    currency: 'AZN',
                    // Operatorun öz valyutasında qiymət (xarici: USD, daxili: AZN)
                    opCurrency: d.region === 'intl' ? 'USD' : 'AZN',
                    opPrice: d.region === 'intl' ? Math.round(price / opRate) : price,
                    earlyBooking: !!disc,
                    ...pt,
                    ...st,
                    ...terms(key, checkIn, today, d.region === 'domestic'),
                    url: `#demo-${id}-${h.id}`,
                  });
                }
              }
            }
          }
        }
      }

      // Ekskursiya turları — yalnız çıxış günlərində (gecə sayı turun özünə bağlıdır)
      if (q.type === 'tour' && sells.includes('tour')) {
        for (const t of tours) {
          if (!q.destinationIds.includes(t.destinationId) || !regions.includes(t.region)) continue;
          if (!t.weekdays.includes(checkIn.getUTCDay())) continue;
          if (!covers(t.id)) continue;
          const season = t.region === 'domestic' ? DOMESTIC_SEASON[month] : SEASON[month];
          const key = `${t.id}|${dIso}`;
          let price = t.base * (0.85 + season * 0.15) * jitter(key) * bias * pax;
          const disc = earlyDiscount(checkIn, today);
          const pt = priceType(key, disc, checkIn);
          if (pt.priceType === 'SPO') price *= 0.94;
          const oldPrice = disc ? Math.round(price) : null;
          price = Math.round(price * (1 - disc));
          const st = hotelStatus(key);
          offers.push({
            id: `${id}:${key}`,
            providerId: id,
            itemType: 'tour',
            itemId: t.id,
            name: t.name,
            destinationId: t.destinationId,
            districtId: null,
            district: null,
            stars: t.stars,
            rating: null,
            tags: t.includes,
            attrs: [],
            board: null,
            room: null,
            accommodation: acc.code,
            tourName: t.name,
            checkIn: dIso,
            nights: t.nights,
            adults: q.adults,
            children: q.children,
            includesFlight: t.includes.includes('Aviabilet'),
            flight: null,
            price,
            oldPrice,
            currency: 'AZN',
            opCurrency: t.region === 'intl' ? 'USD' : 'AZN',
            opPrice: t.region === 'intl' ? Math.round(price / opRate) : price,
            earlyBooking: !!disc,
            ...pt,
            ...st,
            stopSale: false,
            hotelSeats: st.stopSale ? 'few' : st.hotelSeats,
            availability: 'instant',
            ...terms(key, checkIn, today, t.region === 'domestic'),
            url: `#demo-${id}-${t.id}`,
          });
        }
      }
    }
    return offers;
  }

  return { id, name, color, kind, demo: true, sells, trust, search };
}

module.exports = { createMockProvider };
