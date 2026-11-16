// Avtomobil modulu üçün götürmə/qaytarma və transfer nöqtələri.
// Şəhər id-ləri src/data/catalog.js-dəki tur istiqamətləri ilə eynidir ki,
// tur nəticəsindən gələn ?loc=antalya kimi parametr birbaşa işləsin.
// Koordinatlar təxminidir (məsafə və transfer qiyməti hesablamaq üçün).

const { destinations } = require('../data/catalog');

// Hava limanları: serves — hansı istiqamətlərə xidmət edir (ilk element "əsas" şəhər)
const AIRPORTS = [
  { id: 'ayt', code: 'AYT', name: 'Antalya hava limanı', serves: ['antalya', 'kemer', 'side', 'alanya'], lat: 36.899, lon: 30.800 },
  { id: 'gzp', code: 'GZP', name: 'Qazipaşa–Alanya hava limanı', serves: ['alanya'], lat: 36.299, lon: 32.300 },
  { id: 'bjv', code: 'BJV', name: 'Bodrum–Milas hava limanı', serves: ['bodrum'], lat: 37.250, lon: 27.664 },
  { id: 'ist', code: 'IST', name: 'İstanbul hava limanı', serves: ['istanbul'], lat: 41.262, lon: 28.742 },
  { id: 'saw', code: 'SAW', name: 'Sabiha Gökçen hava limanı', serves: ['istanbul'], lat: 40.898, lon: 29.309 },
  { id: 'dxb', code: 'DXB', name: 'Dubay beynəlxalq hava limanı', serves: ['dubai'], lat: 25.253, lon: 55.365 },
  { id: 'ssh', code: 'SSH', name: 'Şarm-əl-Şeyx hava limanı', serves: ['sharm'], lat: 27.977, lon: 34.395 },
  { id: 'bus', code: 'BUS', name: 'Batumi hava limanı', serves: ['batumi'], lat: 41.610, lon: 41.600 },
  { id: 'tbs', code: 'TBS', name: 'Tbilisi hava limanı', serves: ['tbilisi'], lat: 41.669, lon: 44.955 },
  { id: 'gyd', code: 'GYD', name: 'Heydər Əliyev hava limanı (Bakı)', serves: ['baku', 'shahdag'], lat: 40.467, lon: 50.047 },
  { id: 'gbb', code: 'GBB', name: 'Qəbələ hava limanı', serves: ['qabala', 'sheki'], lat: 40.827, lon: 47.713 },
  { id: 'llk', code: 'LLK', name: 'Lənkəran hava limanı', serves: ['lankaran'], lat: 38.746, lon: 48.818 },
  { id: 'gnj', code: 'GNJ', name: 'Gəncə hava limanı', serves: ['naftalan'], lat: 40.738, lon: 46.317 },
];

// Şəhər mərkəzləri (id = istiqamət id-si)
const CITY = {
  antalya: { lat: 36.887, lon: 30.708 },
  alanya: { lat: 36.544, lon: 31.995 },
  kemer: { lat: 36.598, lon: 30.560 },
  side: { lat: 36.767, lon: 31.389 },
  bodrum: { lat: 37.035, lon: 27.430 },
  istanbul: { lat: 41.037, lon: 28.985 },
  dubai: { lat: 25.197, lon: 55.274 },
  sharm: { lat: 27.915, lon: 34.330 },
  batumi: { lat: 41.645, lon: 41.640 },
  tbilisi: { lat: 41.694, lon: 44.801 },
  qabala: { lat: 40.981, lon: 47.846 },
  shahdag: { lat: 41.420, lon: 48.290 },
  sheki: { lat: 41.199, lon: 47.171 },
  lankaran: { lat: 38.754, lon: 48.851 },
  baku: { lat: 40.409, lon: 49.867 },
  naftalan: { lat: 40.507, lon: 46.825 },
};

const destById = Object.fromEntries(destinations.map((d) => [d.id, d]));

const points = [];
for (const [destId, c] of Object.entries(CITY)) {
  const d = destById[destId];
  if (!d) continue;
  points.push({
    id: `${destId}-city`, type: 'city', code: null, name: `${d.name} — şəhər mərkəzi`,
    destinationId: destId, destName: d.name, country: d.country, region: d.region, lat: c.lat, lon: c.lon,
  });
}
for (const a of AIRPORTS) {
  const d = destById[a.serves[0]];
  points.push({
    id: `${a.id}-apt`, type: 'airport', code: a.code, name: a.name,
    destinationId: a.serves[0], serves: a.serves, destName: d.name, country: d.country, region: d.region, lat: a.lat, lon: a.lon,
  });
}

const pointById = Object.fromEntries(points.map((p) => [p.id, p]));
const cityIds = Object.keys(CITY);

const norm = (s) => String(s || '').toLocaleLowerCase('az').normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

// Bir istiqamətə aid nöqtələr: əvvəl hava limanı(ları), sonra şəhər mərkəzi
function pointsForDestination(destId) {
  return points
    .filter((p) => (p.type === 'airport' ? p.serves.includes(destId) : p.destinationId === destId))
    .sort((a, b) => (a.type === b.type ? 0 : a.type === 'airport' ? -1 : 1));
}

// Nöqtə id-si və ya istiqamət id-si qəbul edir. İstiqamət verilərsə — şəhərin öz hava limanı,
// yoxdursa (məs. Kemer, Şəki) şəhər mərkəzi qaytarılır. Tanınmırsa null.
function resolvePoint(id) {
  if (!id) return null;
  const key = String(id).trim().toLowerCase();
  if (pointById[key]) return pointById[key];
  if (cityIds.includes(key)) {
    return points.find((p) => p.type === 'airport' && p.serves[0] === key) || pointById[`${key}-city`] || null;
  }
  return null;
}

function searchLocations(q) {
  const t = norm(q);
  const scored = [];
  for (const p of points) {
    const d = destById[p.destinationId];
    const servesNames = (p.serves || []).map((s) => destById[s].name);
    const hay = [p.name, p.code, p.destName, p.country, ...(d ? d.aliases : []), ...servesNames].filter(Boolean).map(norm);
    if (!t) { scored.push([p, p.type === 'airport' ? 0 : 1]); continue; }
    if (hay.some((h) => h.startsWith(t))) scored.push([p, 0]);
    else if (hay.some((h) => h.includes(t))) scored.push([p, 1]);
  }
  return scored
    .sort((a, b) => a[1] - b[1] || cityIds.indexOf(a[0].destinationId) - cityIds.indexOf(b[0].destinationId))
    .slice(0, 12)
    .map(([p]) => publicPoint(p));
}

function publicPoint(p) {
  return { id: p.id, type: p.type, code: p.code, name: p.name, destinationId: p.destinationId, destName: p.destName, country: p.country };
}

// Yol məsafəsi (km): haversine × 1.3 (yol əyriliyi üçün əmsal)
function roadKm(a, b) {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h));
  return Math.max(3, Math.round(km * 1.3));
}

module.exports = { points, pointById, resolvePoint, searchLocations, publicPoint, pointsForDestination, roadKm, cityIds };
