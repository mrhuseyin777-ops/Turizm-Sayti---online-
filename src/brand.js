// Agentlik brend profili (B2B → Ayarlar → Brend): görünən ad, loqo, əsas rəng, telefon/WhatsApp, lisenziya №,
// ünvan, sayt. Seçim linki (/s/<id>), çap/PDF təklif və WhatsApp təklif mətninin imzasında avtomatik istifadə olunur.
//
// Təhlükəsizlik:
//  - Dəyişiklik yalnız role=admin (route), agentlik HƏMİŞƏ sessiyadan (IDOR yoxdur).
//  - Loqo: yalnız PNG / JPEG / WebP, maks. 200 KB, format MAGIC BYTE ilə yoxlanılır (klientin dediyi tipə
//    etibar edilmir). SVG/HTML/GIF və s. rədd (SVG-də skript ola bilər → XSS). Cavab: düzgün Content-Type,
//    nosniff, sandbox CSP.
//  - Public URL /a/<publicId>/logo — publicId təsadüfi 96 bit (pb_...), agentliyin daxili id-si (ag_...) sızmır.
//  - Rəng yalnız #rrggbb (style atributuna yalnız validasiya olunmuş hex düşür).
const crypto = require('crypto');
const storage = require('./storage');

class BrandError extends Error {}

const LOGO_MAX = 200 * 1024;
const PUBLIC_ID_RE = /^pb_[A-Za-z0-9_-]{16}$/;
const COLOR_RE = /^#[0-9a-f]{6}$/;
const PHONE_RE = /^[+()\d\s-]{5,30}$/;
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const CTRL_RE = /[\u0000-\u001F\u007F]/g;
const newPublicId = () => `pb_${crypto.randomBytes(12).toString('base64url')}`;
const text = (v, max) => (typeof v === 'string' ? v.replace(CTRL_RE, ' ').replace(/\s+/g, ' ').trim() : '').slice(0, max);
const validPhone = (p) => PHONE_RE.test(p) && (() => { const d = p.replace(/\D/g, '').length; return d >= 7 && d <= 15; })();
const repoOf = (store) => store || storage.get().agencyBrand;

const FIELDS = ['displayName', 'color', 'phone', 'whatsapp', 'licenseNo', 'address', 'website'];

function validateBrand(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b) throw new BrandError('Sorğu formatı düzgün deyil');
  if (Object.keys(b).some((k) => !FIELDS.includes(k))) throw new BrandError('İcazə verilməyən sahə(lər)');
  for (const k of FIELDS) if (b[k] != null && typeof b[k] !== 'string') throw new BrandError('Sahələr mətn olmalıdır');
  const displayName = text(b.displayName, 200);
  if (displayName && (displayName.length < 2 || displayName.length > 80)) throw new BrandError('Görünən ad 2–80 simvol olmalıdır');
  const color = text(b.color, 20).toLowerCase();
  if (color && !COLOR_RE.test(color)) throw new BrandError('Rəng #RRGGBB formatında olmalıdır (məs. #0e7490)');
  const phone = text(b.phone, 40);
  if (phone && !validPhone(phone)) throw new BrandError('Telefon nömrəsi düzgün deyil');
  const whatsapp = text(b.whatsapp, 40);
  if (whatsapp && !validPhone(whatsapp)) throw new BrandError('WhatsApp nömrəsi düzgün deyil');
  const licenseNo = text(b.licenseNo, 80);
  if (licenseNo && !/^[\p{L}\p{N} .,/#№_-]{1,40}$/u.test(licenseNo)) throw new BrandError('Lisenziya № 1–40 simvol (hərf, rəqəm, - / . №) olmalıdır');
  const address = text(b.address, 400);
  if (address.length > 160) throw new BrandError('Ünvan ən çox 160 simvol ola bilər');
  let website = text(b.website, 400);
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    let u;
    try { u = new URL(website); } catch { throw new BrandError('Sayt ünvanı düzgün deyil'); }
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) throw new BrandError('Sayt ünvanı düzgün deyil (http/https)');
    website = u.href;
    if (website.length > 200) throw new BrandError('Sayt ünvanı ən çox 200 simvol ola bilər');
  }
  return { displayName, color: color || null, phone, whatsapp, licenseNo, address, website };
}

// Magic byte → MIME (yalnız ağ siyahı). Uyğun gəlmirsə null.
function sniffImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

// JSON-dakı base64 (istəyə görə data:image/...;base64, prefiksi ilə — prefiksdəki tip NƏZƏRƏ ALINMIR)
function decodeLogo(body) {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  if (!b || typeof b.data !== 'string') throw new BrandError('Loqo faylı (data) tələb olunur');
  if (Object.keys(b).some((k) => k !== 'data' && k !== 'name')) throw new BrandError('İcazə verilməyən sahə(lər)');
  let s = b.data.trim();
  const m = /^data:[a-z0-9.+/-]{1,60};base64,/i.exec(s);
  if (m) s = s.slice(m[0].length);
  s = s.replace(/\s+/g, '');
  if (!s || s.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(s)) throw new BrandError('Fayl məzmunu düzgün deyil (base64)');
  if (s.length > Math.ceil(LOGO_MAX / 3) * 4) throw new BrandError('Loqo ən çox 200 KB ola bilər');
  const buf = Buffer.from(s, 'base64');
  if (!buf.length) throw new BrandError('Fayl boşdur');
  if (buf.length > LOGO_MAX) throw new BrandError('Loqo ən çox 200 KB ola bilər');
  const mime = sniffImage(buf);
  if (!mime) throw new BrandError('Yalnız PNG, JPEG və ya WebP şəkil qəbul edilir (SVG qəbul edilmir)');
  return { bytes: buf, mime, sha256: crypto.createHash('sha256').update(buf).digest('hex') };
}

const logoUrl = (rec) => (rec && rec.publicId && rec.logo ? `/a/${rec.publicId}/logo?v=${rec.logo.sha256.slice(0, 8)}` : null);

// Rəngin üstündəki mətn: açıq fonda tünd, tünd fonda ağ (WCAG nisbi parlaqlıq)
function onColor(hex) {
  if (!COLOR_RE.test(hex || '')) return null;
  const lin = (c) => { const v = parseInt(c, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(hex.slice(1, 3)) + 0.7152 * lin(hex.slice(3, 5)) + 0.0722 * lin(hex.slice(5, 7));
  return L > 0.4 ? '#111827' : '#ffffff';
}

// Müştəriyə görünən brend (seçim linki, çap təklifi): agencyId, publicId-dən başqa daxili id YOXDUR
function publicBrand(rec, agencyName) {
  const r = rec || {};
  return {
    name: r.displayName || String(agencyName || '').slice(0, 80),
    color: COLOR_RE.test(r.color || '') ? r.color : null,
    onColor: onColor(r.color),
    phone: r.phone || '',
    whatsapp: r.whatsapp || '',
    licenseNo: r.licenseNo || '',
    address: r.address || '',
    website: r.website || '',
    logoUrl: logoUrl(r),
  };
}

// B2B Ayarlar görünüşü (agentliyin özünə)
function adminView(rec, agencyName, user) {
  const r = rec || {};
  return {
    ...publicBrand(r, agencyName),
    displayName: r.displayName || '',
    agencyName: String(agencyName || ''),
    logo: r.logo ? { mime: r.logo.mime, size: r.logo.size, updatedAt: r.logo.updatedAt } : null,
    updatedAt: r.updatedAt || null,
    updatedBy: r.updatedBy || null,
    canEdit: !!user && user.role === 'admin',
    limits: { logoMaxBytes: LOGO_MAX, logoTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  };
}

async function getBrand(agencyId, { store } = {}) {
  if (typeof agencyId !== 'string' || !agencyId) return null;
  return repoOf(store).get(agencyId);
}

async function saveBrand(agencyId, body, { by, store } = {}) {
  const v = validateBrand(body);
  return repoOf(store).set(agencyId, { ...v, updatedBy: text(by, 80) || null }, { newPublicId });
}

async function saveLogo(agencyId, body, { by, store } = {}) {
  const logo = decodeLogo(body);
  return repoOf(store).setLogo(agencyId, { ...logo, updatedBy: text(by, 80) || null }, { newPublicId });
}

async function removeLogo(agencyId, { by, store } = {}) {
  return repoOf(store).deleteLogo(agencyId, { updatedBy: text(by, 80) || null });
}

module.exports = {
  BrandError, LOGO_MAX, PUBLIC_ID_RE, COLOR_RE, FIELDS,
  validateBrand, sniffImage, decodeLogo, publicBrand, adminView, onColor, logoUrl, getBrand, saveBrand, saveLogo, removeLogo, newPublicId,
};
