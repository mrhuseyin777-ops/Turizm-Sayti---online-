// Avtomobil icarəsi və transfer axtarışı: parametrlərin yoxlanması, provayderlərin
// paralel sorğulanması, valyuta çevirmə, filtrlər, qruplaşdırma və sıralama.

const config = require('../config');
const { MODELS, CATEGORIES, TRANSFER_CLASSES } = require('./fleet');
const { resolvePoint, pointById, publicPoint, roadKm } = require('./locations');
const { rentalProviders, transferProviders } = require('./providers');

class InputError extends Error {}
const fail = (msg) => { throw new InputError(msg); };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const todayIso = () => new Date().toISOString().slice(0, 10);
const validDate = (s) => DATE_RE.test(s || '') && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const list = (v) => (v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : []);
const flag = (v) => v === '1' || v === 'true' || v === true || v === 1;
const int = (v, def) => {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
const modelById = Object.fromEntries(MODELS.map((m) => [m.id, m]));
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const classById = Object.fromEntries(TRANSFER_CLASSES.map((c) => [c.id, c]));

function currencyOf(raw) {
  return config.rates[raw] ? raw : config.defaultCurrency;
}

async function settle(tasks) {
  const results = await Promise.allSettled(tasks);
  return results;
}

// ---------------------------------------------------------------- İcarə

function parseRentalQuery(raw = {}) {
  const pickup = resolvePoint(raw.pickup || raw.loc);
  if (!pickup) fail('Götürmə yeri tanınmadı');
  const dropoff = raw.dropoff ? resolvePoint(raw.dropoff) : pickup;
  if (!dropoff) fail('Qaytarma yeri tanınmadı');
  if (dropoff.country !== pickup.country) fail('Başqa ölkədə qaytarma (sərhədkeçən icarə) dəstəklənmir');

  const from = raw.from;
  const to = raw.to;
  if (!validDate(from)) fail('Götürmə tarixi (from) düzgün deyil. Format: YYYY-MM-DD');
  if (!validDate(to)) fail('Qaytarma tarixi (to) düzgün deyil. Format: YYYY-MM-DD');
  const fromTime = raw.fromTime || '10:00';
  const toTime = raw.toTime || '10:00';
  if (!TIME_RE.test(fromTime) || !TIME_RE.test(toTime)) fail('Saat formatı düzgün deyil (HH:MM)');
  if (from < todayIso()) fail('Götürmə tarixi keçmişdə ola bilməz');
  const minutes = (Date.parse(`${to}T${toTime}:00Z`) - Date.parse(`${from}T${fromTime}:00Z`)) / 60000;
  if (minutes < 60) fail('Qaytarma vaxtı götürmə vaxtından sonra olmalıdır');
  // 59 dəqiqəlik güzəşt: 24 saat 30 dəqiqə = 1 gün
  const days = Math.max(1, Math.ceil((minutes - 59) / 1440));
  if (days > 60) fail('Maksimum icarə müddəti 60 gündür');

  const age = int(raw.age, 30);
  if (!Number.isInteger(age) || age < 18 || age > 99) fail('Sürücü yaşı 18–99 arasında olmalıdır');

  const childSeats = int(raw.childSeats, 0);
  if (!Number.isInteger(childSeats) || childSeats < 0 || childSeats > 3) fail('Uşaq oturacağı sayı 0–3 olmalıdır');

  const minSeats = int(raw.minSeats, 0);
  const maxPrice = raw.maxPrice === undefined || raw.maxPrice === '' ? null : Number(raw.maxPrice);
  if (maxPrice !== null && !(maxPrice >= 0)) fail('Maksimum qiymət düzgün deyil');

  return {
    pickup, dropoff, from, to, fromTime, toTime, days, age,
    currency: currencyOf(raw.currency),
    extras: { childSeats, gps: flag(raw.gps), extraDriver: flag(raw.extraDriver) },
    categories: list(raw.categories).filter((c) => catById[c]),
    transmission: ['automatic', 'manual'].includes(raw.transmission) ? raw.transmission : null,
    minSeats: Number.isInteger(minSeats) ? Math.max(0, Math.min(9, minSeats)) : 0,
    fullInsurance: flag(raw.fullInsurance),
    freeCancel: flag(raw.freeCancel),
    companies: list(raw.companies),
    maxPrice,
    sort: ['price', 'price_desc', 'daily'].includes(raw.sort) ? raw.sort : 'price',
  };
}

function publicRentalQuery(q) {
  return {
    pickup: publicPoint(q.pickup), dropoff: publicPoint(q.dropoff), from: q.from, to: q.to, fromTime: q.fromTime, toTime: q.toTime,
    days: q.days, age: q.age, currency: q.currency, extras: q.extras, categories: q.categories, transmission: q.transmission,
    minSeats: q.minSeats, fullInsurance: q.fullInsurance, freeCancel: q.freeCancel, companies: q.companies, maxPrice: q.maxPrice, sort: q.sort,
    oneWay: q.pickup.id !== q.dropoff.id,
  };
}

async function searchRentals(raw) {
  const q = parseRentalQuery(raw);
  const started = Date.now();
  const rate = config.rates[q.currency];
  // Yalnız həmin ölkədə işləyən şirkətlər sorğulanır
  const active = rentalProviders.filter((p) => p.info.countries.includes(q.pickup.country) && (!q.companies.length || q.companies.includes(p.id)));
  const results = await settle(active.map((p) => p.search(q)));

  const sources = active.map((p, i) => ({
    id: p.id, name: p.name, color: p.color, demo: p.demo,
    ok: results[i].status === 'fulfilled',
    count: results[i].status === 'fulfilled' ? results[i].value.length : 0,
  }));

  const conv = (azn) => Math.round(azn * rate);
  let offers = results.flatMap((r, i) => (r.status === 'fulfilled' ? r.value.map((o) => ({ o, p: active[i] })) : []))
    .map(({ o, p }) => {
      const m = modelById[o.modelId];
      const ex = { childSeat: conv(o.parts.extras.childSeat), gps: conv(o.parts.extras.gps), extraDriver: conv(o.parts.extras.extraDriver) };
      const price = { rental: conv(o.parts.rental), oneWay: conv(o.parts.oneWay), young: conv(o.parts.young), extras: ex.childSeat + ex.gps + ex.extraDriver, extrasDetail: ex };
      price.total = price.rental + price.oneWay + price.young + price.extras;
      price.daily = Math.round(price.total / q.days);
      return {
        id: o.id, companyId: p.id, companyName: p.name, companyColor: p.color, demo: true,
        modelId: m.id, modelName: m.name, category: m.category, categoryLabel: catById[m.category].label,
        seats: m.seats, doors: m.doors, bags: m.bags, smallBags: m.smallBags, transmission: m.transmission, fuel: m.fuel, ac: true,
        insurance: o.insurance, kmLimit: o.kmLimit, unlimitedKm: o.kmLimit === null, freeCancel: o.freeCancel,
        deposit: conv(o.deposit), minAge: o.minAge, days: q.days, price, currency: q.currency,
      };
    });

  offers = offers.filter((o) =>
    (!q.categories.length || q.categories.includes(o.category)) &&
    (!q.transmission || o.transmission === q.transmission) &&
    o.seats >= q.minSeats &&
    (!q.fullInsurance || o.insurance === 'full') &&
    (!q.freeCancel || o.freeCancel) &&
    (q.maxPrice === null || o.price.total <= q.maxPrice));

  offers.sort((a, b) => a.price.total - b.price.total || a.companyName.localeCompare(b.companyName));

  // Eyni model (avtomobil sinfi) üzrə qruplaşdırma — hər qrupda şirkətlər ucuzdan bahalıya
  const map = new Map();
  for (const o of offers) {
    if (!map.has(o.modelId)) {
      const m = modelById[o.modelId];
      map.set(o.modelId, { modelId: m.id, name: m.name, example: `${m.name} və ya oxşar`, category: m.category, categoryLabel: catById[m.category].label, icon: catById[m.category].icon, seats: m.seats, doors: m.doors, bags: m.bags, smallBags: m.smallBags, transmission: m.transmission, fuel: m.fuel, ac: true, offers: [] });
    }
    map.get(o.modelId).offers.push(o);
  }
  const groups = [...map.values()].map((g) => ({
    ...g, best: g.offers[0], savings: g.offers[g.offers.length - 1].price.total - g.offers[0].price.total,
  }));
  const sorters = {
    price: (a, b) => a.best.price.total - b.best.price.total,
    daily: (a, b) => a.best.price.daily - b.best.price.daily,
    price_desc: (a, b) => b.best.price.total - a.best.price.total,
  };
  groups.sort(sorters[q.sort]);

  const totals = offers.map((o) => o.price.total);
  return {
    query: publicRentalQuery(q),
    stats: offers.length ? { min: totals[0], max: totals[totals.length - 1], count: offers.length, models: groups.length } : null,
    groups,
    sources,
    categories: CATEGORIES,
    demo: true,
    tookMs: Date.now() - started,
  };
}

// ---------------------------------------------------------------- Transfer

// Transfer üçün nöqtə: istiqamət id-si verilərsə, "haradan" üçün hava limanı, "haraya" üçün şəhər mərkəzi
function transferPoint(id, preferCity) {
  if (!id) return null;
  const key = String(id).trim().toLowerCase();
  if (preferCity && pointById[`${key}-city`]) return pointById[`${key}-city`];
  return resolvePoint(key);
}

// Nəfər və baqaja görə uyğun siniflər; tövsiyə — ən kiçik uyğun standart (VIP olmayan) sinif
function pickClasses(pax, bags) {
  const fitting = TRANSFER_CLASSES.filter((c) => pax <= c.capacity && bags <= c.bags);
  const recommended = fitting.find((c) => !c.vip) || fitting[0] || null;
  return { fitting, recommended };
}

function parseTransferQuery(raw = {}) {
  const mode = raw.mode === 'daily' ? 'daily' : 'transfer';
  const from = transferPoint(raw.from || raw.loc, false);
  if (!from) fail('"Haradan" nöqtəsi tanınmadı');
  let to = null;
  if (mode === 'transfer') {
    to = transferPoint(raw.to, true);
    if (!to) fail('"Haraya" nöqtəsi tanınmadı');
    if (to.id === from.id) fail('"Haradan" və "Haraya" eyni ola bilməz');
    if (to.country !== from.country) fail('Ölkələrarası transfer dəstəklənmir');
  }
  const date = raw.date;
  if (!validDate(date)) fail('Tarix düzgün deyil. Format: YYYY-MM-DD');
  if (date < todayIso()) fail('Tarix keçmişdə ola bilməz');
  const time = raw.time || '12:00';
  if (!TIME_RE.test(time)) fail('Saat formatı düzgün deyil (HH:MM)');
  const pax = int(raw.pax, 2);
  if (!Number.isInteger(pax) || pax < 1 || pax > 16) fail('Nəfər sayı 1–16 olmalıdır');
  const bags = int(raw.bags, pax);
  if (!Number.isInteger(bags) || bags < 0 || bags > 16) fail('Baqaj sayı 0–16 olmalıdır');
  const days = mode === 'daily' ? int(raw.days, 1) : 0;
  if (mode === 'daily' && (!Number.isInteger(days) || days < 1 || days > 14)) fail('Gün sayı 1–14 olmalıdır');
  const km = mode === 'transfer' ? roadKm(from, to) : 0;
  if (km > 900) fail('Məsafə çox uzundur (maks. 900 km)');
  return { mode, from, to, date, time, hour: Number(time.slice(0, 2)), pax, bags, days, km, currency: currencyOf(raw.currency), cls: classById[raw.cls] ? raw.cls : null };
}

async function searchTransfers(raw) {
  const q = parseTransferQuery(raw);
  const started = Date.now();
  const { fitting, recommended } = pickClasses(q.pax, q.bags);
  const classes = q.cls ? fitting.filter((c) => c.id === q.cls) : fitting;
  const rate = config.rates[q.currency];
  const pq = { ...q, classes, country: q.from.country, destinationId: q.from.destinationId };
  const results = await settle(transferProviders.map((p) => p.quote(pq)));
  const all = results.flatMap((r, i) => (r.status === 'fulfilled' ? r.value.map((o) => ({ o, p: transferProviders[i] })) : []))
    .map(({ o, p }) => ({
      id: o.id, companyId: p.id, companyName: p.name, companyColor: p.color, demo: true, classId: o.classId,
      freeCancelHours: o.freeCancelHours, meetGreet: o.meetGreet, fixedPrice: true,
      price: Math.max(1, Math.round(o.priceAzn * rate)), currency: q.currency,
    }));

  const groups = classes.map((c) => {
    const offers = all.filter((o) => o.classId === c.id).sort((a, b) => a.price - b.price);
    return {
      classId: c.id, label: c.label, example: c.example, capacity: c.capacity, bags: c.bags, vip: c.vip,
      recommended: !!recommended && c.id === recommended.id, offers, best: offers[0] || null,
    };
  }).filter((g) => g.offers.length);
  groups.sort((a, b) => (b.recommended - a.recommended) || a.best.price - b.best.price);

  const speed = q.km > 100 ? 75 : 45;
  return {
    query: {
      mode: q.mode, from: publicPoint(q.from), to: q.to ? publicPoint(q.to) : null, date: q.date, time: q.time,
      pax: q.pax, bags: q.bags, days: q.days, currency: q.currency, cls: q.cls,
    },
    km: q.km,
    durationMin: q.mode === 'transfer' ? Math.round((q.km / speed) * 60) + 10 : null,
    recommendedClass: recommended ? recommended.id : null,
    groups,
    message: groups.length ? undefined : (fitting.length ? 'Bu marşrut üçün təklif tapılmadı' : 'Bu qədər nəfər/baqaj üçün uyğun maşın yoxdur'),
    demo: true,
    tookMs: Date.now() - started,
  };
}

module.exports = { searchRentals, searchTransfers, parseRentalQuery, parseTransferQuery, pickClasses, InputError };
