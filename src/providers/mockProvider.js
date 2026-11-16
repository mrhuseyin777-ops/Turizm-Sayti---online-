// DEMO provayder: real operator API-si qoşulana qədər deterministik (hər dəfə eyni)
// qiymətlər generasiya edir. Real adapter də eyni interfeysi qaytarmalıdır:
//   search(query) -> Promise<Offer[]>
// Offer formatı: aşağıdakı offers.push({...}) obyektinə baxın.

const { destinations, hotels, tours, hash } = require('../data/catalog');

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

  async function search(q) {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const offers = [];
    const pax = q.adults + q.children * 0.5;
    const dests = destinations.filter((d) => q.destinationIds.includes(d.id) && regions.includes(d.region));

    for (let off = -q.flex; off <= q.flex; off++) {
      const checkIn = addDays(q.checkIn, off);
      if (checkIn < today) continue;
      const month = checkIn.getUTCMonth();

      // Otel / paket təklifləri
      if (q.type === 'package' || q.type === 'hotel') {
        if (!sells.includes(q.type)) continue;
        for (const d of dests) {
          if (q.type === 'package' && d.region === 'domestic') continue; // daxildə aviabilet yoxdur
          const season = d.region === 'domestic' ? DOMESTIC_SEASON[month] : SEASON[month];
          for (const h of hotels.filter((x) => x.destinationId === d.id)) {
            if (!covers(h.id)) continue;
            for (const board of h.boards) {
              const key = `${h.id}|${iso(checkIn)}|${q.nights}|${board}`;
              const perNight = (d.base * h.priceFactor + BOARD_ADD[board]) * season * jitter(key) * bias;
              let price = perNight * q.nights * pax;
              if (q.type === 'package') price += d.flight * (q.adults + q.children * 0.75) * jitter('f' + iso(checkIn));
              const disc = earlyDiscount(checkIn, today);
              const oldPrice = disc ? Math.round(price) : null;
              price = Math.round(price * (1 - disc));
              offers.push({
                id: `${id}:${key}`,
                providerId: id,
                itemType: 'hotel',
                itemId: h.id,
                name: h.name,
                destinationId: d.id,
                stars: h.stars,
                rating: h.rating,
                tags: h.tags,
                board,
                room: h.stars >= 5 ? 'Standart otaq (dəniz mənzərəsi)' : 'Standart otaq',
                checkIn: iso(checkIn),
                nights: q.nights,
                adults: q.adults,
                children: q.children,
                includesFlight: q.type === 'package',
                price,
                oldPrice,
                currency: 'AZN',
                earlyBooking: !!disc,
                availability: hash(key + id) % 9 === 0 ? 'request' : 'instant',
                url: `#demo-${id}-${h.id}`,
              });
            }
          }
        }
      }

      // Ekskursiya turları — yalnız çıxış günlərində
      if (q.type === 'tour' && sells.includes('tour')) {
        for (const t of tours) {
          if (!q.destinationIds.includes(t.destinationId) || !regions.includes(t.region)) continue;
          if (!t.weekdays.includes(checkIn.getUTCDay())) continue;
          if (!covers(t.id)) continue;
          const season = t.region === 'domestic' ? DOMESTIC_SEASON[month] : SEASON[month];
          const key = `${t.id}|${iso(checkIn)}`;
          let price = t.base * (0.85 + season * 0.15) * jitter(key) * bias * pax;
          const disc = earlyDiscount(checkIn, today);
          const oldPrice = disc ? Math.round(price) : null;
          price = Math.round(price * (1 - disc));
          offers.push({
            id: `${id}:${key}`,
            providerId: id,
            itemType: 'tour',
            itemId: t.id,
            name: t.name,
            destinationId: t.destinationId,
            stars: t.stars,
            rating: null,
            tags: t.includes,
            board: null,
            room: null,
            checkIn: iso(checkIn),
            nights: t.nights,
            adults: q.adults,
            children: q.children,
            includesFlight: t.includes.includes('Aviabilet'),
            price,
            oldPrice,
            currency: 'AZN',
            earlyBooking: !!disc,
            availability: 'instant',
            url: `#demo-${id}-${t.id}`,
          });
        }
      }
    }
    return offers;
  }

  return { id, name, color, kind, demo: true, sells, search };
}

module.exports = { createMockProvider };
