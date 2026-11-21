// "Qiyməti izlə" — marşrut üzrə qiymət izləmələri (aviabilet modulu).
//
// Saxlama: src/storage → flightAlerts repository-si. DATABASE_URL varsa PostgreSQL (flight_alerts cədvəli),
// yoxdursa <TURTAP_DATA_DIR>/flight-alerts.json (default data/, .gitignore-dadır; atomik yazma, fayl 0600 —
// src/storage/memory.js).
//
// Giriş modeli (hesab yoxdur): yaradılanda klientə {id, token} qaytarılır. Token yalnız bir dəfə
// göstərilir, serverdə yalnız SHA-256 hash-i saxlanılır. Oxumaq/silmək üçün id + token lazımdır —
// başqasının id-sini bilmək kifayət deyil (IDOR qoruması). Yanlış token və olmayan id eyni 404 cavabını alır.
//
// Şəxsi məlumat: e-poçt istəyə görədir (bildiriş üçün); IP yalnız hash (izləmə limiti üçün) kimi saxlanılır.
// Uçuş tarixi keçən izləmələr avtomatik silinir.
//
// E-POÇT GÖNDƏRMƏ XİDMƏTİ HƏLƏ YOXDUR: `notifier` interfeysdir (TODO). runCheck() qiymət dəyişməsini
// hesablayır və bildiriş lazım olanda notifier.send()-i çağırır; indiki stub heç nə göndərmir.
const crypto = require('crypto');
const env = require('../env');
const storage = require('../storage');
const { createFileAlertRepo } = require('../storage/memory');
const { hashIp } = require('../security/ipHash');
const { cheapestPrice, ValidationError, placeInfo } = require('./search');
const { EMAIL_RE } = require('./requests');
const { dayIndex } = require('./schedule');

const MODES = ['daily', 'drop10'];
const MAX_PER_IP = 20;
const MAX_TOTAL = 5000;
const ID_RE = /^fa_[A-Za-z0-9_-]{16}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const ROUTE_FIELDS = ['from', 'to', 'trip', 'depart', 'return', 'adults', 'children', 'infants', 'cabin', 'bagCount', 'currency'];

class AlertValidationError extends Error {
  constructor(errors) { super(Object.values(errors)[0]); this.errors = errors; }
}

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const todayIso = () => new Date().toISOString().slice(0, 10);

// Bildiriş göndərmə interfeysi. TODO: e-poçt xidməti (SMTP / tranzaksion e-poçt API) qoşulanda
// send() real göndərməlidir; hər məktubda "izləməni dayandır" linki (id + token) olmalıdır.
const notifier = {
  configured: false,
  // eslint-disable-next-line no-unused-vars
  async send(alert, info) { return { sent: false, reason: 'not-configured' }; },
};

// dirOrOpts: qovluq (fayl repository — köhnə davranış) və ya { repo } (src/storage repository-si)
function createAlertStore(dirOrOpts = env.dataDir) {
  const repo = dirOrOpts && typeof dirOrOpts === 'object' && dirOrOpts.repo ? dirOrOpts.repo : createFileAlertRepo(typeof dirOrOpts === 'string' ? dirOrOpts : env.dataDir);

  // Uçuş (gediş) tarixi keçmiş izləmələri sil
  const purge = (today = todayIso()) => repo.purgeDepartedBefore(today);

  // id + token ilə tap. Sabit vaxtlı müqayisə; tapılmasa / token yanlışdırsa / tarixi keçibsə null.
  async function find(id, token) {
    if (typeof id !== 'string' || typeof token !== 'string' || !ID_RE.test(id) || !TOKEN_RE.test(token)) return null;
    const a = await repo.get(id);
    if (!a) return null;
    if (dayIndex(a.route.depart) < dayIndex(todayIso())) { await repo.delete(a.id); return null; }
    const got = Buffer.from(sha256(token), 'hex');
    const want = Buffer.from(a.tokenHash, 'hex');
    return got.length === want.length && crypto.timingSafeEqual(got, want) ? a : null;
  }

  async function create(body, { ip } = {}) {
    const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
    const errors = {};
    const email = typeof b.email === 'string' ? b.email.trim() : b.email == null ? '' : null;
    if (email === null || (email && (email.length > 120 || !EMAIL_RE.test(email)))) errors.email = 'E-poçt ünvanı düzgün deyil';
    const mode = MODES.includes(b.mode) ? b.mode : null;
    if (!mode) errors.mode = 'Rejim düzgün deyil (daily və ya drop10)';

    // Marşrut: yalnız ağ siyahıdakı sahələr, hamısı string olmalıdır; axtarışla eyni validasiya
    const raw = {};
    for (const k of ROUTE_FIELDS) {
      const v = b[k];
      if (v === undefined || v === null || v === '') continue;
      if (typeof v !== 'string' && typeof v !== 'number') { errors.route = 'Marşrut sahələri düzgün deyil'; break; }
      raw[k] = String(v).slice(0, 40);
    }
    if (!raw.trip) raw.trip = raw.return ? 'round' : 'oneway';
    let current = null;
    if (!errors.route) {
      try {
        current = await cheapestPrice({ ...raw, today: b.today });
        if (dayIndex(current.q.depart) <= dayIndex(current.q.today)) errors.depart = 'İzləmə üçün gediş tarixi gələcəkdə olmalıdır';
        else if (current.regulated) errors.route = 'Bu marşrutda tariflər tənzimlənir — qiymət izlənmir, menecerə müraciət edin';
      } catch (e) {
        if (e instanceof ValidationError) errors.route = e.message; else throw e;
      }
    }
    if (Object.keys(errors).length) throw new AlertValidationError(errors);

    await purge();
    const ipKey = hashIp(ip, 'flight-alert-ip');
    if (ipKey && (await repo.countByIpKey(ipKey)) >= MAX_PER_IP) {
      throw new AlertValidationError({ limit: `Bir ünvandan ən çox ${MAX_PER_IP} izləmə yaratmaq olar. Köhnələrini silin.` });
    }
    if ((await repo.count()) >= MAX_TOTAL) throw new AlertValidationError({ limit: 'İzləmə siyahısı doludur, bir az sonra yenidən cəhd edin' });

    const q = current.q;
    const route = { from: q.from, to: q.to, trip: q.trip, depart: q.depart, return: q.return, adults: q.adults, children: q.children, infants: q.infants, cabin: q.cabin, bagCount: q.bagCount, currency: q.currency };
    const token = crypto.randomBytes(32).toString('base64url');
    const now = new Date().toISOString();
    const alert = {
      id: 'fa_' + crypto.randomBytes(12).toString('base64url'),
      tokenHash: sha256(token),
      route,
      mode,
      email: email || null,
      initialPrice: current.price,
      lastPrice: current.price,
      lastCheckedAt: now,
      lastNotifiedAt: null,
      createdAt: now,
      ipKey,
    };
    await repo.insert(alert);
    return { alert, token };
  }

  async function remove(id, token) {
    const a = await find(id, token);
    if (!a) return false;
    await repo.delete(a.id);
    return true;
  }

  // Bütün izləmələrin cari qiymətini yoxla; bildiriş lazımdırsa notifier.send() (indi stub).
  // TODO: e-poçt xidməti qoşulanda gündəlik planlaşdırıcı ilə çağırılmalıdır.
  async function runCheck() {
    await purge();
    const alerts = await repo.list();
    const results = [];
    const patches = [];
    for (const a of alerts) {
      let price = null;
      try { price = (await cheapestPrice({ ...a.route })).price; } catch { continue; }
      const change = a.lastPrice && price != null ? (price - a.lastPrice) / a.lastPrice : 0;
      const due = a.email && (a.mode === 'daily' || Math.abs(change) >= 0.1);
      let sent = { sent: false, reason: 'not-due' };
      if (due) sent = await notifier.send(a, { price, previous: a.lastPrice, change });
      const patch = { lastCheckedAt: new Date().toISOString() };
      if (sent.sent) { patch.lastPrice = price; patch.lastNotifiedAt = patch.lastCheckedAt; }
      patches.push({ id: a.id, patch });
      results.push({ id: a.id, price, change, ...sent });
    }
    if (patches.length) await repo.updateMany(patches);
    return results;
  }

  return { file: repo.file, repo, create, find, remove, purge, runCheck, count: () => repo.count(), _reset() { if (repo._reset) repo._reset(); } };
}

// Klientə qaytarılan görünüş: tokenHash, e-poçt və ipKey GÖSTƏRİLMİR
async function publicView(a, lang = 'az') {
  let current = null;
  try { current = (await cheapestPrice({ ...a.route, lang })).price; } catch { current = null; }
  const changePct = a.initialPrice && current != null ? Math.round(((current - a.initialPrice) / a.initialPrice) * 1000) / 10 : null;
  return {
    id: a.id,
    route: { ...a.route, fromAirport: placeInfo(a.route.from.split(','), lang), toAirport: placeInfo(a.route.to.split(','), lang) },
    mode: a.mode,
    hasEmail: !!a.email,
    initialPrice: a.initialPrice,
    currentPrice: current,
    changePct,
    currency: a.route.currency,
    createdAt: a.createdAt,
    expiresOn: a.route.depart,
    notifications: notifier.configured ? 'active' : 'pending',
  };
}

// Default store: src/storage-dakı flightAlerts repository-si (PostgreSQL və ya JSON fayl).
// Keçmiş tarixli izləmələrin dövri silinməsi: src/storage/cleanup.js.
let defaultStore = null;
const getAlertStore = () => {
  const repo = storage.get().flightAlerts;
  if (!defaultStore || defaultStore.repo !== repo) defaultStore = createAlertStore({ repo });
  return defaultStore;
};

module.exports = { createAlertStore, getAlertStore, publicView, notifier, AlertValidationError, ID_RE, TOKEN_RE, MODES, MAX_PER_IP };
