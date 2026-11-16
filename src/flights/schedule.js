// DEMO uçuş cədvəli generatoru: daşıyıcı şəbəkəsindən (carriers.js) deterministik
// (hash əsaslı, hər dəfə eyni) uçuşlar və aktarmalı marşrutlar qurur.
// Real inteqrasiyada bu fayl istifadə olunmur — itinerarları provayder özü qaytarır.

const { getAirport, distanceKm, utcOffsetMin } = require('./airports');
const { getCarrier, canConnect, edgesFrom } = require('./carriers');

// FNV-1a 32-bit
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const DAY = 1440;
const dayIndex = (iso) => Math.floor(Date.parse(iso.slice(0, 10) + 'T00:00:00Z') / 60000 / DAY);
const isoFromDay = (d) => new Date(d * DAY * 60000).toISOString().slice(0, 10);
const localStr = (min) => new Date(min * 60000).toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM" (yerli vaxt)
const round5 = (n) => Math.round(n / 5) * 5;

// ---- Marşrutlar (0–2 aktarma) ----
const pathCache = new Map();
function findPaths(from, to) {
  const key = from + '>' + to;
  if (pathCache.has(key)) return pathCache.get(key);
  const A = getAirport(from); const B = getAirport(to);
  const direct = distanceKm(A, B);
  const dist = (e) => distanceKm(getAirport(e.from), getAirport(e.to));
  const out = edgesFrom.get(from) || [];
  const paths = { 0: [], 1: [], 2: [] };

  for (const e1 of out) {
    if (e1.to === to) { paths[0].push([e1]); continue; }
    for (const e2 of edgesFrom.get(e1.to) || []) {
      if (e2.to === from || !canConnect(e1.carrier, e2.carrier)) continue;
      if (e2.to === to) { paths[1].push([e1, e2]); continue; }
      for (const e3 of edgesFrom.get(e2.to) || []) {
        if (e3.to !== to || e2.to === from || !canConnect(e2.carrier, e3.carrier)) continue;
        paths[2].push([e1, e2, e3]);
      }
    }
  }
  const total = (p) => p.reduce((s, e) => s + dist(e), 0);
  const hasDirect = paths[0].length > 0;
  let one = paths[1].filter((p) => total(p) / direct <= (hasDirect ? 1.6 : 2.6));
  if (!hasDirect && !one.length) one = paths[1].filter((p) => total(p) / direct <= 6); // kiçik daxili hava limanları
  let two = [];
  if (paths[0].length + one.length < 3) {
    two = paths[2].filter((p) => total(p) / direct <= 2.4).sort((a, b) => total(a) - total(b)).slice(0, 6);
  }
  const result = [...paths[0], ...one, ...two];
  pathCache.set(key, result);
  return result;
}

// ---- Bir istiqamət (kənar) üzrə gündəlik uçuşlar ----
function legsOn(edge, dayIdx) {
  const seed = hash(`${edge.carrier}|${edge.from}|${edge.to}`);
  const A = getAirport(edge.from); const B = getAirport(edge.to);
  const km = distanceKm(A, B);
  const smallAirport = A.region === 'domestic' && edge.from !== 'GYD' || B.region === 'domestic' && edge.to !== 'GYD';
  const perDay = smallAirport ? 1 : 1 + (seed % 3);
  const weekday = new Date(dayIdx * DAY * 60000).getUTCDay();
  // Bəzi xətlər hər gün deyil
  if (seed % 4 === 0 && hash(`${seed}|wd${weekday}`) % 3 === 0) return [];
  const duration = round5((km / 790) * 60 + 30) + (seed % 3) * 5;
  const iso = isoFromDay(dayIdx);
  const offFrom = utcOffsetMin(A, iso);
  const offTo = utcOffsetMin(B, iso);
  const base = (hash(`${seed}|t`) % 288) * 5;
  const legs = [];
  for (let k = 0; k < perDay; k++) {
    const depMin = (base + Math.floor((k * DAY) / perDay) + (hash(`${seed}|k${k}`) % 12) * 5) % DAY;
    const depLocal = dayIdx * DAY + depMin;
    const depUtc = depLocal - offFrom;
    const arrUtc = depUtc + duration;
    legs.push({
      carrier: edge.carrier,
      flightNo: `${edge.carrier}${100 + (hash(`${seed}|n${k}`) % 1800)}`,
      from: edge.from,
      to: edge.to,
      depUtc,
      arrUtc,
      dep: localStr(depLocal),
      arr: localStr(arrUtc + offTo),
      durationMin: duration,
      km,
    });
  }
  return legs;
}

// Hub-da sonrakı uçuşu tap (minimum aktarma vaxtı ilə)
function nextConnection(prev, edge) {
  const mct = prev.carrier === edge.carrier ? 60 : 90;
  const arrDay = Math.floor((prev.arrUtc + utcOffsetMin(getAirport(edge.from), prev.arr)) / DAY);
  const cands = [...legsOn(edge, arrDay), ...legsOn(edge, arrDay + 1)]
    .filter((l) => l.depUtc - prev.arrUtc >= mct && l.depUtc - prev.arrUtc <= 20 * 60)
    .sort((a, b) => a.depUtc - b.depUtc);
  return cands[0] || null;
}

function makeItinerary(legs) {
  const segments = legs.map((l) => {
    const c = getCarrier(l.carrier);
    return { carrier: l.carrier, carrierName: c.name, flightNo: l.flightNo, from: l.from, to: l.to, dep: l.dep, arr: l.arr, durationMin: l.durationMin };
  });
  const layovers = [];
  for (let i = 1; i < legs.length; i++) layovers.push({ airport: legs[i].from, minutes: legs[i].depUtc - legs[i - 1].arrUtc });
  const first = legs[0]; const last = legs[legs.length - 1];
  return {
    id: legs.map((l) => `${l.flightNo}:${l.from}${l.to}:${l.dep.replace(/[-:T]/g, '')}`).join('_'),
    from: first.from,
    to: last.to,
    dep: first.dep,
    arr: last.arr,
    durationMin: last.arrUtc - first.depUtc,
    stops: legs.length - 1,
    km: legs.reduce((s, l) => s + l.km, 0),
    validating: first.carrier,
    carriers: [...new Set(legs.map((l) => l.carrier))],
    segments,
    layovers,
    _depUtc: first.depUtc,
  };
}

// Verilən tarixdə (yerli gediş tarixi) A→B bütün itinerarlar
const itinCache = new Map();
function buildItineraries(from, to, dateIso, opts = {}) {
  const notBeforeUtc = opts.notBeforeUtc || 0;
  const key = `${from}>${to}@${dateIso}#${notBeforeUtc}`;
  if (itinCache.has(key)) return itinCache.get(key);
  const d = dayIndex(dateIso);
  const result = [];
  const seen = new Set();
  for (const path of findPaths(from, to)) {
    for (const first of legsOn(path[0], d)) {
      if (first.depUtc < notBeforeUtc) continue;
      const legs = [first];
      for (let i = 1; i < path.length && legs.length === i; i++) {
        const n = nextConnection(legs[i - 1], path[i]);
        if (n) legs.push(n);
      }
      if (legs.length !== path.length) continue;
      const it = makeItinerary(legs);
      if (it.stops === 2 && it.durationMin > 36 * 60) continue;
      if (!seen.has(it.id)) { seen.add(it.id); result.push(it); }
    }
  }
  if (itinCache.size > 2000) itinCache.clear();
  itinCache.set(key, result);
  return result;
}

module.exports = { hash, buildItineraries, findPaths, dayIndex, isoFromDay };
