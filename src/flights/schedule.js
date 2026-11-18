// DEMO uçuş cədvəli generatoru: daşıyıcı şəbəkəsindən (carriers.js) deterministik
// (hash əsaslı, hər dəfə eyni) uçuşlar və aktarmalı marşrutlar qurur.
// Real inteqrasiyada bu fayl istifadə olunmur — itinerarları provayder özü qaytarır.

const { airports, getAirport, distanceKm, utcOffsetMin } = require('./airports');
const { getCarrier, canConnect, edgesFrom } = require('./carriers');

// Eyni şəhərin digər hava limanları (IST↔SAW, SVO↔VKO↔DME) — "hava limanı dəyişir" aktarmaları üçün
const sameCity = new Map();
for (const a of airports) sameCity.set(a.code, airports.filter((b) => b.code !== a.code && b.city.en === a.city.en).map((b) => b.code));

// Minimum aktarma vaxtı (dəq): eyni/tərəfdaş bilet; ayrı biletlər (baqajı yenidən qeydiyyat); hava limanı dəyişir
const MCT = { same: 60, partner: 90, self: 150, airportChange: 240 };
// Böyük hub-larda "qısa aktarma" həddi daha yüksəkdir (uzun keçidlər, pasport nəzarəti)
const BIG_HUBS = new Set(['IST', 'SAW', 'DXB', 'DOH', 'AUH', 'FRA', 'MUC', 'SVO', 'LHR', 'CDG']);
const shortLimit = (code) => (BIG_HUBS.has(code) ? 90 : 60);

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
  // DEMO "ayrı biletlər" (self-transfer): tərəfdaş olmayan daşıyıcıların birləşməsi və ya
  // eyni şəhərdə hava limanı dəyişməsi (IST→SAW). Aktarma qorunmur — nəticədə risk nişanı ilə göstərilir.
  const self = [];
  for (const e1 of out) {
    if (e1.to === to) continue;
    for (const e2 of edgesFrom.get(e1.to) || []) {
      if (e2.to === to && !canConnect(e1.carrier, e2.carrier)) self.push([e1, e2]);
    }
    for (const alt of sameCity.get(e1.to) || []) {
      if (alt === from || alt === to) continue;
      for (const e2 of edgesFrom.get(alt) || []) if (e2.to === to) self.push([e1, e2]);
    }
  }
  const selfPaths = self
    .filter((p) => total(p) / direct <= (hasDirect ? 1.4 : 2.0))
    .sort((a, b) => total(a) - total(b) || (a[0].carrier + a[1].carrier).localeCompare(b[0].carrier + b[1].carrier))
    .slice(0, hasDirect ? 2 : 4);
  for (const p of selfPaths) p.self = true;
  const result = [...paths[0], ...one, ...two, ...selfPaths];
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
  let mct = prev.carrier === edge.carrier ? MCT.same : MCT.partner;
  if (edge.from !== prev.to) mct = MCT.airportChange;
  else if (!canConnect(prev.carrier, edge.carrier)) mct = MCT.self;
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
  let selfTransfer = false;
  for (let i = 1; i < legs.length; i++) {
    const prev = legs[i - 1]; const cur = legs[i];
    const minutes = cur.depUtc - prev.arrUtc;
    const airportChange = cur.from !== prev.to;
    const self = airportChange || !canConnect(prev.carrier, cur.carrier);
    if (self) selfTransfer = true;
    // Gecə aktarması: gözləmə yerli vaxtla 00:00–05:00 aralığına ən azı 90 dəq düşür
    const start = Number(prev.arr.slice(11, 13)) * 60 + Number(prev.arr.slice(14, 16));
    let night = 0;
    for (let d = 0; d <= 1440 * 2; d += 1440) night += Math.max(0, Math.min(start + minutes, d + 300) - Math.max(start, d));
    const risks = [];
    if (self) risks.push('selfTransfer');
    if (airportChange) risks.push('airportChange');
    if (minutes < shortLimit(prev.to)) risks.push('short');
    if (night >= 90) risks.push('night');
    if (minutes > 8 * 60) risks.push('long');
    layovers.push({ airport: prev.to, ...(airportChange ? { toAirport: cur.from } : {}), minutes, risks, ...(risks.includes('short') ? { shortLimit: shortLimit(prev.to) } : {}) });
  }
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
    selfTransfer,
    risks: [...new Set(layovers.flatMap((l) => l.risks))],
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

module.exports = { hash, buildItineraries, findPaths, dayIndex, isoFromDay, MCT, shortLimit };
