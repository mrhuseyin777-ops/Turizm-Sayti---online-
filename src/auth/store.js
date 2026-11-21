// Agentlik və istifadəçi hesablarının "fayl" implementasiyası (DATABASE_URL olmayanda: dev/test) —
// JSON fayl (<TURTAP_DATA_DIR>/accounts.json, default: data/accounts.json; qovluq .gitignore-dadır).
// PostgreSQL implementasiyası: src/storage/postgres.js (eyni async interfeys, bax src/storage/index.js).
// Yazma atomikdir: müvəqqəti fayl → fsync → rename (yarımçıq yazılmış fayl qalmır).
// Fayl icazələri: qovluq 0700, fayl 0600. Parollar yalnız scrypt hash kimi saxlanılır.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../env');

const USERNAME_RE = /^[a-z0-9][a-z0-9._@-]{2,63}$/;
const ROLES = ['admin', 'manager'];
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
const normUsername = (u) => String(u ?? '').trim().toLowerCase();
const agencyNameKey = (name) => clean(name, 80).toLocaleLowerCase('az');
const USER_PATCH_FIELDS = ['passwordHash', 'disabled', 'displayName', 'role', 'lastLoginAt', 'passwordChangedAt'];

// Yeni istifadəçi sahələrinin yoxlanması (fayl və PostgreSQL implementasiyaları üçün ortaq)
function validateNewUser({ username, role, passwordHash }) {
  const u = normUsername(username);
  if (!USERNAME_RE.test(u)) throw new Error('İstifadəçi adı 3–64 simvol: kiçik hərf, rəqəm, . _ @ -');
  if (!ROLES.includes(role)) throw new Error('Rol admin və ya manager olmalıdır');
  if (typeof passwordHash !== 'string' || !passwordHash.startsWith('scrypt$')) throw new Error('Parol hash-i yoxdur');
  return u;
}

function createStore(dir = env.dataDir) {
  const file = path.join(dir, 'accounts.json');
  let db = null;
  const seeded = new Set(); // yalnız yaddaşda olan (fayla yazılmayan) dev/demo hesabları

  function load() {
    if (db) return db;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      db = { version: 1, agencies: Array.isArray(parsed.agencies) ? parsed.agencies : [], users: Array.isArray(parsed.users) ? parsed.users : [] };
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error(`Hesab faylı oxunmadı (${file}): ${e.message}`);
      db = { version: 1, agencies: [], users: [] };
    }
    return db;
  }

  function save() {
    const d = load();
    const out = {
      version: 1,
      agencies: d.agencies.filter((a) => !seeded.has(a.id)),
      users: d.users.filter((u) => !seeded.has(u.id)),
    };
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    const fd = fs.openSync(tmp, 'wx', 0o600);
    try {
      fs.writeSync(fd, JSON.stringify(out, null, 2));
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, file);
  }

  const newId = (prefix) => `${prefix}_${crypto.randomBytes(9).toString('base64url')}`;

  const api = {
    file,
    USERNAME_RE,
    ROLES,
    normUsername,
    kind: 'file',
    describe: () => file,
    // Bütün metodlar async-dir (PostgreSQL implementasiyası ilə eyni interfeys)
    getAgency: async (id) => load().agencies.find((a) => a.id === id) || null,
    findAgencyByName: async (name) => {
      const n = agencyNameKey(name);
      return load().agencies.find((a) => a.name.toLocaleLowerCase('az') === n) || null;
    },
    getUser: async (id) => load().users.find((u) => u.id === id) || null,
    findUserByUsername: async (username) => {
      const u = normUsername(username);
      return load().users.find((x) => x.username === u) || null;
    },
    listAgencies: async () => load().agencies.map((a) => ({ ...a, users: load().users.filter((u) => u.agencyId === a.id).length })),

    async createAgency(name, { persist = true } = {}) {
      const n = clean(name, 80);
      if (n.length < 2) throw new Error('Agentlik adı ən azı 2 simvol olmalıdır');
      if (await api.findAgencyByName(n)) throw new Error('Bu adda agentlik artıq var');
      const a = { id: newId('ag'), name: n, createdAt: new Date().toISOString() };
      load().agencies.push(a);
      if (persist) save(); else seeded.add(a.id);
      return a;
    },

    async createUser({ agencyId, username, displayName, role = 'manager', passwordHash }, { persist = true } = {}) {
      const u = validateNewUser({ username, role, passwordHash });
      if (await api.findUserByUsername(u)) throw new Error('Bu istifadəçi adı artıq mövcuddur');
      if (!(await api.getAgency(agencyId))) throw new Error('Agentlik tapılmadı');
      const user = {
        id: newId('usr'), agencyId, username: u, displayName: clean(displayName, 80) || u, role,
        passwordHash, disabled: false, createdAt: new Date().toISOString(), passwordChangedAt: new Date().toISOString(),
      };
      load().users.push(user);
      if (persist) save(); else seeded.add(user.id);
      return user;
    },

    async updateUser(id, patch) {
      const u = await api.getUser(id);
      if (!u) throw new Error('İstifadəçi tapılmadı');
      for (const k of USER_PATCH_FIELDS) if (k in patch) u[k] = patch[k];
      if (!seeded.has(u.id)) save();
      return u;
    },

    // Testlər üçün: yaddaşı sıfırla (fayla toxunmur)
    _reset() { db = null; seeded.clear(); },
  };
  return api;
}

module.exports = { createStore, store: createStore(), USERNAME_RE, ROLES, USER_PATCH_FIELDS, clean, normUsername, agencyNameKey, validateNewUser };
