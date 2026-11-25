// Agentlik saytı üçün axtarış vidjeti (/w/<publicId>, RESEARCH-3 B5) və B2C marketplace profili (C2).
//
// İdentifikatorlar:
//   publicId — 16 bayt (128 bit) təsadüf, 22 simvol base64url: vidjet linki. B2B → Ayarlar → Vidjet-də yaradılır/yenilənir
//              (yenilənəndə köhnə yerləşdirmə kodu dərhal işləməz olur).
//   marketId — 12 bayt (96 bit), 16 simvol: marketplace siyahısındakı ictimai id. Agentliyin daxili id-si (ag_...)
//              heç bir ictimai cavaba çıxmır.
// Framing: yalnız /w/* üçün CSP frame-ancestors = 'self' + agentliyin icazəli domenləri (boşdursa yalnız 'self');
//          digər bütün səhifələr frame-ancestors 'none' + X-Frame-Options DENY (src/security/http.js).
// Qiymət: net × (1 + markupPct/100), operator adı və net qiymət vidjetə GÖNDƏRİLMİR. Təklif klientə opaq `ref`
//          (HMAC) kimi verilir; müraciətdə təklif serverdə yenidən axtarılıb ref ilə tapılır (qiymət klientdən yox).
const crypto = require('crypto');
const env = require('./env');
const storage = require('./storage');
const { search, QueryError } = require('./search');
const { destinations } = require('./data/catalog');
const { InputError, validateContact, saveLead } = require('./leads');
const { cleanPhone } = require('./support');

const PUBLIC_ID_RE = /^[A-Za-z0-9_-]{22}$/;
const MARKET_ID_RE = /^[A-Za-z0-9_-]{16}$/;
const newPublicId = () => crypto.randomBytes(16).toString('base64url');
const newMarketId = () => crypto.randomBytes(12).toString('base64url');
const LIMITS = { domains: 10, results: 30 };

// ---------------------------------------------------------------- Domen validasiyası (CSP source expression)
// Qəbul olunur: "agentlik.az", "www.agentlik.az", "https://agentlik.az", "http://localhost:8080", "*.agentlik.az".
// Sxemsiz → https://. Yol, sorğu, boşluq, dırnaq, ";" , "*" tək başına, IP-siz/TLD-siz ad (localhost istisna) — rədd.
const LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const DOMAIN_RE = new RegExp(`^(https?://)?(\\*\\.)?(${LABEL}(?:\\.${LABEL})*)(?::(\\d{1,5}))?$`);
function normalizeFrameDomain(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase().replace(/\/+$/, '');
  if (!s || s.length > 200) return null;
  const m = DOMAIN_RE.exec(s);
  if (!m) return null;
  const [, scheme, wild, host, port] = m;
  if (host.length > 253) return null;
  const labels = host.split('.');
  if (host !== 'localhost' && labels.length < 2) return null;
  if (wild && labels.length < 2) return null; // "*.az" kimi geniş maska qadağandır
  if (port && (Number(port) < 1 || Number(port) > 65535)) return null;
  return `${scheme || 'https://'}${wild || ''}${host}${port ? `:${Number(port)}` : ''}`;
}

function validateDomains(list) {
  if (!Array.isArray(list)) throw new InputError('Domenlər siyahı olmalıdır');
  if (list.length > LIMITS.domains) throw new InputError(`Ən çox ${LIMITS.domains} domen`);
  const out = [];
  for (const d of list) {
    const n = normalizeFrameDomain(d);
    if (!n) throw new InputError(`Domen düzgün deyil: ${String(d).slice(0, 60)} (nümunə: agentlik.az və ya https://www.agentlik.az)`);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

// /w/* üçün frame-ancestors dəyəri: 'self' + yoxlanılmış domenlər (saxlanmış dəyər yenidən normallaşdırılır)
function frameAncestors(domains) {
  const ok = (Array.isArray(domains) ? domains : []).map(normalizeFrameDomain).filter(Boolean).slice(0, LIMITS.domains);
  return ["'self'", ...new Set(ok)].join(' ');
}

// ---------------------------------------------------------------- Opaq təklif referansı
// HMAC açarı: WIDGET_REF_SECRET / IP_HASH_SECRET (bir neçə nüsxədə eyni olsun deyə) və ya proses üçün təsadüfi.
const REF_KEY = crypto.createHash('sha256').update(`odiola-widget-ref:${process.env.WIDGET_REF_SECRET || env.ipHashSecret || crypto.randomBytes(32).toString('hex')}`).digest();
const offerRef = (offerId) => crypto.createHmac('sha256', REF_KEY).update(String(offerId)).digest('base64url').slice(0, 22);
const REF_RE = /^[A-Za-z0-9_-]{22}$/;

// ---------------------------------------------------------------- Agentlik ayarları
async function getOrCreateWidget(agencyId, by) {
  const repo = storage.get().widgets;
  let w = await repo.get(agencyId);
  if (!w || !w.publicId) w = await repo.upsert(agencyId, { publicId: newPublicId(), updatedBy: by || null });
  return w;
}

async function resolveWidget(publicId) {
  if (typeof publicId !== 'string' || !PUBLIC_ID_RE.test(publicId)) return null;
  const w = await storage.get().widgets.getByPublicId(publicId);
  if (!w) return null;
  const agency = await storage.get().accounts.getAgency(w.agencyId);
  if (!agency) return null;
  return { widget: w, agency };
}

const pct = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new InputError('Komissiya 0–100% olmalıdır');
  return Math.round(n * 100) / 100;
};

// PUT /api/b2b/widget { domains, markupPct, regenerate? }
function validateWidgetPatch(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new InputError('Sorğu formatı düzgün deyil');
  if (Object.keys(b).some((k) => !['domains', 'markupPct', 'regenerate'].includes(k))) throw new InputError('İcazə verilməyən sahə(lər)');
  const patch = {};
  if (b.domains !== undefined) patch.frameDomains = validateDomains(b.domains);
  if (b.markupPct !== undefined) patch.markupPct = pct(b.markupPct);
  if (b.regenerate === true) patch.publicId = newPublicId();
  return patch;
}

// PUT /api/b2b/marketplace { enabled, name, city, phone }
const PLAIN_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,'’&()«»"-]{1,79}$/u;
function validateMarketPatch(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new InputError('Sorğu formatı düzgün deyil');
  if (Object.keys(b).some((k) => !['enabled', 'name', 'city', 'phone'].includes(k))) throw new InputError('İcazə verilməyən sahə(lər)');
  const s = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
  const name = s(b.name);
  const city = s(b.city);
  const phone = s(b.phone);
  const enabled = b.enabled === true;
  if (name && (name.length > 80 || !PLAIN_RE.test(name))) throw new InputError('Görünən ad 2–80 simvol olmalıdır');
  if (city && (city.length > 60 || !PLAIN_RE.test(city))) throw new InputError('Şəhər düzgün deyil');
  if (phone && !cleanPhone(phone)) throw new InputError('Telefon beynəlxalq formatda olmalıdır (məs. +994501234567)');
  if (enabled && (!name || !city)) throw new InputError('Marketplace-də görünmək üçün görünən ad və şəhər tələb olunur');
  return { marketEnabled: enabled, marketName: name, marketCity: city, marketPhone: phone ? cleanPhone(phone) : '' };
}

async function saveMarket(agencyId, body, by) {
  const patch = validateMarketPatch(body);
  const repo = storage.get().widgets;
  const prev = await repo.get(agencyId);
  if (!prev || !prev.marketId) patch.marketId = newMarketId();
  return repo.upsert(agencyId, { ...patch, updatedBy: by || null });
}

// B2C: marketplace siyahısı — yalnız ictimai sahələr
async function listPartners() {
  const list = await storage.get().widgets.listMarketplace();
  return list.map((w) => ({ id: w.marketId, name: w.marketName, city: w.marketCity }))
    .sort((a, b) => a.city.localeCompare(b.city, 'az') || a.name.localeCompare(b.name, 'az'));
}

// ---------------------------------------------------------------- Vidjet axtarışı
const DEST_LIST = destinations.map((d) => ({ id: d.id, name: d.name, country: d.country, region: d.region }));
const DEST_IDS = new Set(DEST_LIST.map((d) => d.id));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Vidjet yalnız bu parametrləri qəbul edir (qalanı atılır)
function widgetQuery(src) {
  const r = src && typeof src === 'object' ? src : {};
  const g = (k) => (typeof r[k] === 'string' ? r[k] : (typeof r[k] === 'number' ? String(r[k]) : ''));
  const type = g('type') === 'hotel' ? 'hotel' : 'package';
  const dest = g('destinationId');
  if (!DEST_IDS.has(dest)) throw new InputError('İstiqamət seçin');
  const checkIn = g('checkIn');
  if (!DATE_RE.test(checkIn)) throw new InputError('Tarix düzgün deyil');
  const raw = { type, destinationId: dest, checkIn, flex: /^[0-3]$/.test(g('flex')) ? g('flex') : '2', nights: /^\d{1,2}$/.test(g('nights')) ? g('nights') : '7', adults: /^[1-6]$/.test(g('adults')) ? g('adults') : '2', currency: 'AZN' };
  const ages = g('childAges');
  if (ages && /^\d{1,2}(,\d{1,2}){0,3}$/.test(ages)) raw.childAges = ages;
  // Daxili istiqamətdə aviabiletli paket yoxdur → otel
  if (DEST_LIST.find((d) => d.id === dest).region === 'domestic') raw.type = 'hotel';
  return raw;
}

const clientPrice = (net, markup) => Math.round(Number(net) * (1 + markup / 100));

async function widgetSearch(ctx, rawQuery) {
  const raw = widgetQuery(rawQuery);
  const markup = Number(ctx.widget.markupPct) || 0;
  const budget = parseInt(rawQuery && rawQuery.budget, 10);
  let r;
  try {
    r = await search(raw);
  } catch (e) {
    if (e instanceof QueryError) throw new InputError(e.message);
    throw e;
  }
  const offers = [];
  for (const g of r.groups || []) {
    const o = g.best;
    const price = clientPrice(o.price, markup);
    if (Number.isFinite(budget) && budget > 0 && price > budget) continue;
    offers.push({
      ref: offerRef(o.id),
      name: o.name, stars: o.stars, destination: o.destination ? o.destination.name : '', country: o.destination ? o.destination.country : '',
      district: o.district || '', checkIn: o.checkIn, nights: o.nights, board: o.board || '', boardLabel: o.boardLabel || '', room: o.room || '',
      includesFlight: !!o.includesFlight, price, currency: 'AZN', includes: o.includes || [], excludes: o.excludes || [],
      // providerName / providerId / net qiymət / offer id QƏSDƏN yoxdur
    });
  }
  offers.sort((a, b) => a.price - b.price);
  return {
    agency: { name: ctx.agency.name },
    query: { ...raw, budget: Number.isFinite(budget) && budget > 0 ? budget : null },
    total: offers.length,
    offers: offers.slice(0, LIMITS.results),
  };
}

// ---------------------------------------------------------------- Vidjet müraciəti
async function widgetLead(ctx, body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const contact = validateContact(b);
  if (typeof b.ref !== 'string' || !REF_RE.test(b.ref)) throw new InputError('Variant seçin');
  const raw = widgetQuery(b.query);
  const r = await search({ ...raw, flat: '1' }, { offerLimit: Infinity });
  const o = (r.offers || []).find((x) => offerRef(x.id) === b.ref);
  if (!o) throw new InputError('Variant artıq mövcud deyil — axtarışı yeniləyin');
  const markup = Number(ctx.widget.markupPct) || 0;
  const lead = {
    type: 'selection',
    source: 'widget',
    ...contact,
    offerId: String(o.id).slice(0, 200),
    agencyId: ctx.agency.id,
    agency: String(ctx.agency.name).slice(0, 80),
    manager: '',
    client: null,
    item: {
      name: o.name, destination: o.destination ? o.destination.name : '', checkIn: o.checkIn, nights: o.nights, board: o.board || '',
      clientPrice: clientPrice(o.price, markup), currency: 'AZN', providerName: o.providerName, offerId: o.id,
    },
    createdAt: new Date().toISOString(),
  };
  return saveLead(lead);
}

// B2B görünüşü (yalnız öz agentliyi)
function widgetView(w, user) {
  return {
    publicId: w.publicId,
    path: `/w/${w.publicId}`,
    domains: w.frameDomains || [],
    markupPct: Number(w.markupPct) || 0,
    market: { enabled: !!w.marketEnabled, name: w.marketName || '', city: w.marketCity || '', phone: w.marketPhone || '' },
    updatedAt: w.updatedAt || null,
    updatedBy: w.updatedBy || null,
    canEdit: user.role === 'admin',
    limits: { domains: LIMITS.domains },
  };
}

module.exports = {
  PUBLIC_ID_RE, MARKET_ID_RE, LIMITS, DEST_LIST, normalizeFrameDomain, validateDomains, frameAncestors, offerRef,
  getOrCreateWidget, resolveWidget, validateWidgetPatch, saveMarket, listPartners, widgetSearch, widgetLead, widgetView, widgetQuery,
};
