// "memory/file" implementasiyası (DATABASE_URL olmayanda — dev/test, geriyə uyğunluq).
//  - accounts:      JSON fayl (src/auth/store.js, <TURTAP_DATA_DIR>/accounts.json)
//  - flightAlerts:  JSON fayl (<TURTAP_DATA_DIR>/flight-alerts.json)
//  - agencySettings: JSON fayl (<TURTAP_DATA_DIR>/agency-settings.json) — bildiriş ayarları
//  - agencyBrand:   JSON fayl (agency-brand.json) + loqo faylları (<TURTAP_DATA_DIR>/logos/<publicId>.img)
//  - agencyMarkup:  JSON fayl (agency-markup.json) — komissiya qaydaları
//  - sessions, leads, selections, shortlists, flightRequests, carRequests: yalnız proses yaddaşında
//    (yenidən başlamada itir, bir neçə server nüsxəsi arasında paylaşılmır).
// Interfeys: src/storage/index.js. Bütün metodlar async-dir (PostgreSQL ilə eyni).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../env');
const { store: defaultAccounts } = require('../auth/store');

const ms = (d) => (d instanceof Date ? d.getTime() : Number(d));

// ---------------------------------------------------------------- Sessiyalar
function createSessionRepo({ maxSessions = 20000 } = {}) {
  const map = new Map(); // sha256(id) -> { userId, agencyId, csrf, createdAt, lastSeen, expiresAt }
  return {
    map, // yalnız testlər/diaqnostika üçün
    async insert({ keyHash, userId, agencyId, csrf, createdAt, lastSeen, expiresAt }) {
      map.set(keyHash, { userId, agencyId, csrf, createdAt, lastSeen, expiresAt });
      while (map.size > maxSessions) map.delete(map.keys().next().value);
    },
    async get(keyHash) {
      const s = map.get(keyHash);
      return s ? { ...s } : null;
    },
    async touch(keyHash, lastSeen) {
      const s = map.get(keyHash);
      if (s) s.lastSeen = lastSeen;
    },
    async delete(keyHash) { map.delete(keyHash); },
    async deleteForUser(userId) {
      for (const [k, s] of map) if (s.userId === userId) map.delete(k);
    },
    // İstifadəçinin ən yeni `keep` sessiyası qalır, qalanları silinir
    async trimForUser(userId, keep) {
      // Map daxiletmə sırasını saxlayır: köhnədən yeniyə
      const mine = [...map.entries()].filter(([, s]) => s.userId === userId);
      for (const [k] of mine.slice(0, Math.max(0, mine.length - keep))) map.delete(k);
    },
    async purgeExpired({ now = Date.now(), idleMs }) {
      let n = 0;
      for (const [k, s] of map) {
        if (s.expiresAt <= now || now - s.lastSeen > idleMs) { map.delete(k); n++; }
      }
      return n;
    },
    async count() { return map.size; },
  };
}

// ---------------------------------------------------------------- Leadlər
function createLeadRepo({ max = 2000 } = {}) {
  const list = [];
  let seq = 0;
  return {
    list, // yalnız testlər üçün
    async insert(lead) {
      const createdAt = lead.createdAt || new Date().toISOString();
      const rec = {
        ...lead, id: ++seq, createdAt,
        status: 'new', managerNote: '', statusChangedAt: null, statusChangedBy: null, updatedAt: createdAt,
      };
      list.push(rec);
      while (list.length > max) list.shift();
      return { ...rec };
    },
    async listForAgency(agencyId, limit = 200, { status } = {}) {
      return list.filter((l) => l.type === 'selection' && l.agencyId === agencyId && (!status || l.status === status))
        .slice(-limit).reverse().map((l) => ({ ...l }));
    },
    async statusCountsForAgency(agencyId) {
      const out = {};
      for (const l of list) if (l.type === 'selection' && l.agencyId === agencyId) out[l.status] = (out[l.status] || 0) + 1;
      return out;
    },
    // IDOR: yalnız HƏMİN agentliyin seçim müraciəti yenilənir; tapılmasa null
    async updateForAgency(agencyId, id, { status, managerNote, by, now = new Date() }) {
      const l = list.find((x) => x.id === id && x.type === 'selection' && x.agencyId === agencyId);
      if (!l || typeof agencyId !== 'string' || !agencyId) return null;
      const at = new Date(now).toISOString();
      if (status !== undefined && status !== l.status) {
        l.status = status; l.statusChangedAt = at; l.statusChangedBy = by || null;
      }
      if (managerNote !== undefined) l.managerNote = managerNote;
      l.updatedAt = at;
      return { ...l };
    },
    async count() { return list.length; },
    async purgeBefore(date) {
      const cut = ms(date);
      const before = list.length;
      for (let i = list.length - 1; i >= 0; i--) if (Date.parse(list[i].createdAt) < cut) list.splice(i, 1);
      return before - list.length;
    },
  };
}

// ---------------------------------------------------------------- Seçim linkləri
function createSelectionRepo({ max = 20000 } = {}) {
  const map = new Map();
  return {
    map, // yalnız testlər üçün
    async insert(sel) {
      map.set(sel.id, sel);
      while (map.size > max) map.delete(map.keys().next().value);
      return sel;
    },
    async get(id) { return map.get(id) || null; },
    async delete(id) { map.delete(id); },
    async countForAgency(agencyId) {
      let n = 0;
      for (const s of map.values()) if (s.agencyId === agencyId) n++;
      return n;
    },
    // Agentliyin ən yeni `keep` linki qalır (yalnız HƏMİN agentliyin köhnələri silinir)
    async trimForAgency(agencyId, keep) {
      const own = [...map.values()].filter((s) => s.agencyId === agencyId); // köhnədən yeniyə
      for (const s of own.slice(0, Math.max(0, own.length - keep))) map.delete(s.id);
    },
    async purgeBefore(date) {
      const cut = ms(date);
      let n = 0;
      for (const [k, s] of map) if (s.createdAt < cut) { map.delete(k); n++; }
      return n;
    },
  };
}

// ---------------------------------------------------------------- B2B seçilmişlər (shortlist)
// Hər metod agencyId tələb edir — başqa agentliyin qeydi heç bir yolla qaytarılmır/dəyişdirilmir (IDOR).
const SHORTLIST_PATCH = ['client', 'netPrice', 'prevNetPrice', 'available', 'checkedAt', 'snapshot'];
function createShortlistRepo({ max = 50000 } = {}) {
  const map = new Map();
  const copy = (it) => (it ? structuredClone(it) : null);
  const dupKey = (it) => `${it.agencyId}\u0000${it.client}\u0000${it.offerId}\u0000${it.paxKey}`;
  const findDup = (it, exceptId) => [...map.values()].find((x) => x.id !== exceptId && dupKey(x) === dupKey(it)) || null;
  return {
    map, // yalnız testlər üçün
    // Eyni agentlik + müştəri + təklif + sərnişin tərkibi artıq varsa — mövcud qeyd { existed: true } ilə qaytarılır
    async insert(item) {
      const dup = findDup(item);
      if (dup) return { ...copy(dup), existed: true };
      map.set(item.id, copy(item));
      while (map.size > max) map.delete(map.keys().next().value);
      return copy(item);
    },
    async listForAgency(agencyId, limit = 500) {
      if (typeof agencyId !== 'string' || !agencyId) return [];
      return [...map.values()].filter((x) => x.agencyId === agencyId).slice(-limit).reverse().map(copy);
    },
    async get(agencyId, id) {
      const it = map.get(id);
      return it && it.agencyId === agencyId ? copy(it) : null;
    },
    async update(agencyId, id, patch) {
      const it = map.get(id);
      if (!it || it.agencyId !== agencyId) return null;
      const next = { ...it };
      for (const k of SHORTLIST_PATCH) if (k in patch) next[k] = patch[k];
      if (findDup(next, id)) { const e = new Error('duplicate'); e.code = 'DUPLICATE'; throw e; }
      map.set(id, next);
      return copy(next);
    },
    async delete(agencyId, id) {
      const it = map.get(id);
      if (!it || it.agencyId !== agencyId) return false;
      return map.delete(id);
    },
    async countForAgency(agencyId) {
      let n = 0;
      for (const x of map.values()) if (x.agencyId === agencyId) n++;
      return n;
    },
    async purgeBefore(date) {
      const cut = ms(date);
      let n = 0;
      for (const [k, x] of map) if (Date.parse(x.createdAt) < cut) { map.delete(k); n++; }
      return n;
    },
  };
}

// ---------------------------------------------------------------- Sadə müraciət siyahısı (avia/avto)
function createRequestRepo({ max = 5000 } = {}) {
  const list = [];
  let seq = 0;
  return {
    list, // yalnız testlər üçün
    async insert(rec) {
      const r = { ...rec, id: ++seq, createdAt: rec.createdAt || new Date().toISOString() };
      list.push(r);
      while (list.length > max) list.shift();
      return r;
    },
    async count() { return list.length; },
    async purgeBefore(date) {
      const cut = ms(date);
      const before = list.length;
      for (let i = list.length - 1; i >= 0; i--) if (Date.parse(list[i].createdAt) < cut) list.splice(i, 1);
      return before - list.length;
    },
  };
}

// ---------------------------------------------------------------- Agentlik ayarları (JSON fayl)
// Bildiriş ayarları (Telegram chat_id, bildiriş e-poçtu). Yazma atomikdir, fayl 0600.
function createFileSettingsRepo(dir = env.dataDir) {
  const file = path.join(dir, 'agency-settings.json');
  let db = null;
  const load = () => {
    if (db) return db;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      db = parsed && typeof parsed.agencies === 'object' && !Array.isArray(parsed.agencies) ? parsed : { version: 1, agencies: {} };
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error(`Ayarlar faylı oxunmadı (${file}): ${e.message}`, { cause: e });
      db = { version: 1, agencies: {} };
    }
    return db;
  };
  const save = () => {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(load(), null, 2));
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  };
  return {
    kind: 'file',
    file,
    async get(agencyId) {
      if (typeof agencyId !== 'string' || !Object.prototype.hasOwnProperty.call(load().agencies, agencyId)) return null;
      return { ...load().agencies[agencyId] };
    },
    async set(agencyId, { telegramChatId = null, notifyEmail = null, updatedBy = null }) {
      const rec = { telegramChatId, notifyEmail, updatedAt: new Date().toISOString(), updatedBy };
      Object.defineProperty(load().agencies, agencyId, { value: rec, enumerable: true, writable: true, configurable: true });
      save();
      return { ...rec };
    },
    _reset() { db = null; },
  };
}

// ---------------------------------------------------------------- Ümumi: atomik JSON fayl (0600)
function jsonFile(dir, name, empty) {
  const file = path.join(dir, name);
  let db = null;
  const load = () => {
    if (db) return db;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      db = parsed && typeof parsed.agencies === 'object' && parsed.agencies && !Array.isArray(parsed.agencies) ? parsed : empty();
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error(`Fayl oxunmadı (${file}): ${e.message}`, { cause: e });
      db = empty();
    }
    return db;
  };
  const writeAtomic = (target, data, mode = 0o600) => {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const tmp = `${target}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const fd = fs.openSync(tmp, 'wx', mode);
    try { fs.writeSync(fd, data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, target);
  };
  const save = () => writeAtomic(file, JSON.stringify(load(), null, 2));
  const own = (agencyId) => typeof agencyId === 'string' && Object.prototype.hasOwnProperty.call(load().agencies, agencyId);
  const put = (agencyId, rec) => Object.defineProperty(load().agencies, agencyId, { value: rec, enumerable: true, writable: true, configurable: true });
  return { file, load, save, own, put, writeAtomic, reset: () => { db = null; } };
}

// ---------------------------------------------------------------- Agentlik brend profili (JSON + loqo faylı)
// Metadata: <dataDir>/agency-brand.json; loqo baytları: <dataDir>/logos/<publicId>.img (0600).
const BRAND_FIELDS = ['displayName', 'color', 'phone', 'whatsapp', 'licenseNo', 'address', 'website'];
function createFileBrandRepo(dir = env.dataDir) {
  const j = jsonFile(dir, 'agency-brand.json', () => ({ version: 1, agencies: {} }));
  const logoFile = (publicId) => path.join(dir, 'logos', `${publicId}.img`);
  const copy = (r) => (r ? structuredClone(r) : null);
  const ensure = (agencyId, newPublicId) => {
    if (j.own(agencyId)) return j.load().agencies[agencyId];
    const rec = { publicId: newPublicId(), displayName: '', color: null, phone: '', whatsapp: '', licenseNo: '', address: '', website: '', logo: null, updatedAt: null, updatedBy: null };
    j.put(agencyId, rec);
    return rec;
  };
  return {
    kind: 'file',
    file: j.file,
    async get(agencyId) { return j.own(agencyId) ? copy(j.load().agencies[agencyId]) : null; },
    async set(agencyId, fields, { newPublicId }) {
      const rec = ensure(agencyId, newPublicId);
      for (const k of BRAND_FIELDS) if (k in fields) rec[k] = fields[k];
      rec.updatedAt = new Date().toISOString();
      rec.updatedBy = fields.updatedBy || null;
      j.save();
      return copy(rec);
    },
    async setLogo(agencyId, { bytes, mime, sha256, updatedBy }, { newPublicId }) {
      const rec = ensure(agencyId, newPublicId);
      j.writeAtomic(logoFile(rec.publicId), bytes);
      const now = new Date().toISOString();
      rec.logo = { mime, size: bytes.length, sha256, updatedAt: now };
      rec.updatedAt = now;
      rec.updatedBy = updatedBy || null;
      j.save();
      return copy(rec);
    },
    async deleteLogo(agencyId, { updatedBy } = {}) {
      if (!j.own(agencyId)) return null;
      const rec = j.load().agencies[agencyId];
      try { fs.unlinkSync(logoFile(rec.publicId)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
      rec.logo = null;
      rec.updatedAt = new Date().toISOString();
      rec.updatedBy = updatedBy || null;
      j.save();
      return copy(rec);
    },
    async getLogo(publicId) {
      if (typeof publicId !== 'string' || !/^pb_[A-Za-z0-9_-]{16}$/.test(publicId)) return null;
      const rec = Object.values(j.load().agencies).find((r) => r && r.publicId === publicId);
      if (!rec || !rec.logo) return null;
      try {
        return { mime: rec.logo.mime, sha256: rec.logo.sha256, updatedAt: rec.logo.updatedAt, bytes: fs.readFileSync(logoFile(publicId)) };
      } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
    },
    _reset() { j.reset(); },
  };
}

// ---------------------------------------------------------------- Komissiya qaydaları (JSON fayl)
function createFileMarkupRepo(dir = env.dataDir) {
  const j = jsonFile(dir, 'agency-markup.json', () => ({ version: 1, agencies: {} }));
  return {
    kind: 'file',
    file: j.file,
    async get(agencyId) { return j.own(agencyId) ? structuredClone(j.load().agencies[agencyId]) : null; },
    async set(agencyId, { config, updatedBy = null }) {
      const rec = { config: structuredClone(config), updatedAt: new Date().toISOString(), updatedBy };
      j.put(agencyId, rec);
      j.save();
      return structuredClone(rec);
    },
    _reset() { j.reset(); },
  };
}

// ---------------------------------------------------------------- Qiymət izləmələri (JSON fayl)
// Yazma atomikdir (müvəqqəti fayl → fsync → rename), fayl 0600, qovluq 0700.
function createFileAlertRepo(dir = env.dataDir) {
  const file = path.join(dir, 'flight-alerts.json');
  let db = null;

  function load() {
    if (db) return db;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      db = { version: 1, alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [] };
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error(`İzləmə faylı oxunmadı (${file}): ${e.message}`, { cause: e });
      db = { version: 1, alerts: [] };
    }
    return db;
  }

  function save() {
    const d = load();
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify({ version: 1, alerts: d.alerts }, null, 2));
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  }

  const PATCH = ['lastPrice', 'lastCheckedAt', 'lastNotifiedAt'];
  return {
    kind: 'file',
    file,
    async insert(alert) { load().alerts.push(alert); save(); return alert; },
    async get(id) { return load().alerts.find((a) => a.id === id) || null; },
    async delete(id) {
      const d = load();
      const before = d.alerts.length;
      d.alerts = d.alerts.filter((a) => a.id !== id);
      if (d.alerts.length !== before) save();
      return before !== d.alerts.length;
    },
    async list() { return load().alerts.map((a) => ({ ...a, route: { ...a.route } })); },
    // [{ id, patch }] — bir yazma ilə
    async updateMany(items) {
      const d = load();
      let changed = false;
      for (const { id, patch } of items) {
        const a = d.alerts.find((x) => x.id === id);
        if (!a) continue;
        for (const k of PATCH) if (k in patch) a[k] = patch[k];
        changed = true;
      }
      if (changed) save();
    },
    async countByIpKey(ipKey) { return load().alerts.filter((a) => a.ipKey === ipKey).length; },
    async count() { return load().alerts.length; },
    // Gediş tarixi `today`-dən əvvəl olanları sil (ISO tarix müqayisəsi YYYY-MM-DD)
    async purgeDepartedBefore(today) {
      const d = load();
      const before = d.alerts.length;
      d.alerts = d.alerts.filter((a) => String(a.route.depart) >= today);
      if (d.alerts.length !== before) save();
      return before - d.alerts.length;
    },
    _reset() { db = null; },
  };
}

function createRepos({ accounts = defaultAccounts, dataDir = env.dataDir } = {}) {
  return {
    kind: 'memory',
    accounts,
    sessions: createSessionRepo(),
    leads: createLeadRepo(),
    selections: createSelectionRepo(),
    shortlists: createShortlistRepo(),
    flightAlerts: createFileAlertRepo(dataDir),
    agencySettings: createFileSettingsRepo(dataDir),
    agencyBrand: createFileBrandRepo(dataDir),
    agencyMarkup: createFileMarkupRepo(dataDir),
    flightRequests: createRequestRepo({ max: 5000 }),
    carRequests: createRequestRepo({ max: 1000 }),
  };
}

module.exports = { createRepos, createSessionRepo, createLeadRepo, createSelectionRepo, createShortlistRepo, createRequestRepo, createFileAlertRepo, createFileSettingsRepo, createFileBrandRepo, createFileMarkupRepo };
