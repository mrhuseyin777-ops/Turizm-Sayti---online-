// B2B "Tövsiyə olunan otel siyahıları": agentliyin daimi, adlı otel siyahıları ("Ailələr üçün", "Romantik", "Büdcə" ...).
// Shortlist-dən fərqi: otel səviyyəsində, tarixsiz, daimi (müddətlə silinmir). Axtarışda "Siyahı" seçiləndə
// otel id-ləri mövcud `hotels` filtri ilə göndərilir (src/search.js: maks. 60 id) — buna görə siyahıda maks. 60 otel.
// Təhlükəsizlik: hər əməliyyat sessiyadakı agentliklə (IDOR → 404), ağ siyahı sahələr, ad/otel sayı limitləri.
// Otel adı/istiqaməti kataloqda varsa ordan götürülür; yoxdursa (məs. SAMO operator oteli) təmizlənmiş mətn kimi.
const crypto = require('crypto');
const storage = require('./storage');
const { InputError } = require('./leads');
const { hotelById, destinations } = require('./data/catalog');

const LIMITS = { perAgency: 30, hotelsPerList: 60, nameMax: 60 };
const ID_RE = /^hl_[A-Za-z0-9_-]{12}$/;
const HOTEL_ID_RE = /^[a-z0-9-]{1,40}$/;
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u001F\u007F]/g;
const line = (v, max) => (typeof v === 'string' ? v.replace(CTRL_RE, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
const newId = () => `hl_${crypto.randomBytes(9).toString('base64url')}`;
const repo = (store) => store || storage.get().hotelLists;
const okAgency = (a) => typeof a === 'string' && a.length > 0;
const checkId = (id) => typeof id === 'string' && ID_RE.test(id);
const destName = Object.fromEntries(destinations.map((d) => [d.id, d.name]));

const publicList = (l) => (l ? { id: l.id, name: l.name, hotels: l.hotels, createdAt: l.createdAt, updatedAt: l.updatedAt } : null);

function cleanName(v) {
  const name = line(v, 200);
  if (name.length < 1 || name.length > LIMITS.nameMax) throw new InputError(`Siyahı adı 1–${LIMITS.nameMax} simvol olmalıdır`);
  return name;
}

// Otel girişi: { id, name?, destination?, stars? } → kataloqdan zənginləşdirilmiş, təmizlənmiş qeyd
function cleanHotel(h) {
  const b = h && typeof h === 'object' && !Array.isArray(h) ? h : null;
  if (!b || typeof b.id !== 'string' || !HOTEL_ID_RE.test(b.id)) throw new InputError('Otel id-si düzgün deyil');
  const cat = hotelById.get(b.id);
  if (cat) return { id: cat.id, name: cat.name, destination: destName[cat.destinationId] || '', stars: cat.stars };
  const name = line(b.name, 120);
  if (!name) throw new InputError('Otel adı tələb olunur');
  return { id: b.id, name, destination: line(b.destination, 80), stars: Math.min(5, Math.max(0, parseInt(b.stars, 10) || 0)) };
}

const dup = (e) => { if (e && e.code === 'DUPLICATE') throw new InputError('Bu adda siyahı artıq var'); throw e; };

async function listHotelLists(agencyId, { store } = {}) {
  if (!okAgency(agencyId)) return [];
  return (await repo(store).list(agencyId)).map(publicList);
}

async function getHotelList(agencyId, id, { store } = {}) {
  if (!okAgency(agencyId) || !checkId(id)) return null;
  return publicList(await repo(store).get(agencyId, id));
}

async function createHotelList(agencyId, body, { by, store } = {}) {
  if (!okAgency(agencyId)) throw new InputError('Agentlik hesabı tələb olunur');
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  if (Object.keys(b).some((k) => k !== 'name' && k !== 'hotel')) throw new InputError('İcazə verilməyən sahə(lər)');
  const name = cleanName(b.name);
  const hotels = b.hotel != null ? [cleanHotel(b.hotel)] : [];
  const r = repo(store);
  if ((await r.count(agencyId)) >= LIMITS.perAgency) throw new InputError(`Maksimum ${LIMITS.perAgency} siyahı`);
  const now = new Date().toISOString();
  try {
    return publicList(await r.insert({ id: newId(), agencyId, name, hotels, createdBy: line(by || '', 80) || null, createdAt: now, updatedAt: now }));
  } catch (e) { return dup(e); }
}

// PATCH: { name? } adı dəyiş, { addHotel } əlavə et, { removeHotel: id } çıxar
async function updateHotelList(agencyId, id, body, { store } = {}) {
  const l = okAgency(agencyId) && checkId(id) ? await repo(store).get(agencyId, id) : null;
  if (!l) return null;
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const keys = Object.keys(b);
  if (!keys.length) throw new InputError('Dəyişiklik yoxdur');
  if (keys.some((k) => !['name', 'addHotel', 'removeHotel'].includes(k))) throw new InputError('İcazə verilməyən sahə(lər)');
  const patch = {};
  if ('name' in b) patch.name = cleanName(b.name);
  let hotels = l.hotels;
  let existed = false;
  if ('addHotel' in b) {
    const h = cleanHotel(b.addHotel);
    if (hotels.some((x) => x.id === h.id)) existed = true;
    else {
      if (hotels.length >= LIMITS.hotelsPerList) throw new InputError(`Bir siyahıda maksimum ${LIMITS.hotelsPerList} otel`);
      hotels = [...hotels, h];
    }
  }
  if ('removeHotel' in b) {
    if (typeof b.removeHotel !== 'string' || !HOTEL_ID_RE.test(b.removeHotel)) throw new InputError('Otel id-si düzgün deyil');
    hotels = hotels.filter((x) => x.id !== b.removeHotel);
  }
  if (hotels !== l.hotels) patch.hotels = hotels;
  if (!Object.keys(patch).length) return { list: publicList(l), existed };
  try {
    return { list: publicList(await repo(store).update(agencyId, id, patch)), existed };
  } catch (e) { return dup(e); }
}

async function deleteHotelList(agencyId, id, { store } = {}) {
  if (!okAgency(agencyId) || !checkId(id)) return false;
  return repo(store).delete(agencyId, id);
}

// Axtarış üçün: siyahının otel id-ləri (search.js `hotels` parametri)
const hotelsParam = (list) => (list ? list.hotels.map((h) => h.id).join(',') : '');

module.exports = { LIMITS, cleanHotel, listHotelLists, getHotelList, createHotelList, updateHotelList, deleteHotelList, hotelsParam };
