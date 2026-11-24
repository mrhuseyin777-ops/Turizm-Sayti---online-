// Bildiriş mesajının mətni (AZ). Telegram üçün parse_mode=HTML: istifadəçi daxiletməsi escapeHtml() ilə
// (&, <, >, " → entity) zərərsizləşdirilir — Telegram yalnız bir neçə teqi tanıyır, qalanı xəta verir.
// E-poçt üçün eyni sahələrdən sadə mətn (text/plain) qurulur.
const { hotelById, destinations } = require('../data/catalog');
const { getAirport } = require('../flights/airports');

const TG_MAX = 4096; // Telegram sendMessage mətn limiti
const FIELD_MAX = 300;

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
const clean = (s, max = FIELD_MAX) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const fmtDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso || '')) ? String(iso).slice(0, 10).split('-').reverse().join('.') : '');
const money = (n, cur) => (Number.isFinite(Number(n)) ? `${Math.round(Number(n)).toLocaleString('en-US').replace(/,/g, ' ')} ${cur || 'AZN'}` : '');

const KIND_TITLE = {
  selection: 'B2B seçim linki',
  callback: '«Sizə zəng edək»',
  offer: 'Tur/otel müraciəti',
  flight: 'Aviabilet müraciəti',
  car: 'Avtomobil müraciəti',
  test: 'Test mesajı',
};
const TIME_LABEL = { now: 'indi', morning: 'səhər', afternoon: 'günorta', evening: 'axşam' };
const BOARD = { RO: 'yalnız otaq', BB: 'səhər yeməyi', HB: 'yarım pansion', FB: 'tam pansion', AI: 'hər şey daxil', UAI: 'ultra hər şey daxil' };

function publicBaseUrl(raw = process.env.PUBLIC_BASE_URL) {
  const v = String(raw || '').trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.search || u.hash) return null;
    return (u.origin + u.pathname).replace(/\/+$/, '');
  } catch { return null; }
}

// "funsun:antalya-h1|2026-12-17|7|BB|StandardRoom" → otel, istiqamət, tarix, gecə, qida
function describeOfferId(offerId) {
  const m = /^([a-z0-9-]+):([a-z0-9-]+)\|(\d{4}-\d{2}-\d{2})\|(\d{1,2})\|([A-Z]{2,3})?/.exec(String(offerId || ''));
  if (!m) return {};
  const h = hotelById.get(m[2]);
  const dest = h ? destinations.find((d) => d.id === h.destinationId) : null;
  return { hotel: h ? h.name : '', destination: dest ? dest.name : '', date: m[3], nights: Number(m[4]), board: m[5] || '' };
}

const cityOf = (code) => { const a = getAirport(code); return a ? `${a.city.az} (${code})` : code; };
// "J2123:GYDIST:202612200835_TK45:ISTBKK:..." → "Bakı (GYD) → Banqkok (BKK)", gediş tarixi
function describeFlightId(flightId) {
  const dirs = String(flightId || '').split('~');
  const legs = dirs[0].split('_').map((l) => l.split(':'));
  if (!legs[0] || !legs[0][1] || legs[0][1].length !== 6) return {};
  const from = legs[0][1].slice(0, 3);
  const to = legs[legs.length - 1][1].slice(3, 6);
  const d = (legs[0][2] || '').slice(0, 8);
  const back = dirs[1] ? (dirs[1].split('_')[0].split(':')[2] || '').slice(0, 8) : '';
  const iso = (x) => (x.length === 8 ? `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}` : '');
  return { route: `${cityOf(from)} → ${cityOf(to)}`, date: iso(d), back: iso(back) };
}

// Hadisədən (növ + qeyd) mesaj sahələri: [[etiket, dəyər], ...] — boş dəyərlər atılır
function leadFields(kind, r) {
  const f = [['👤 Ad', r.name], ['📞 Telefon', r.phone]];
  if (kind === 'selection') {
    const it = r.item || {};
    f.push(['🏨 Otel', [it.name, it.destination].filter(Boolean).join(', ')]);
    f.push(['📅 Tarix', [fmtDate(it.checkIn), it.nights ? `${it.nights} gecə` : '', BOARD[it.board] || it.board].filter(Boolean).join(' · ')]);
    f.push(['💰 Qiymət', money(it.clientPrice, it.currency)]);
    if (r.client) f.push(['🗂 Müştəri/sorğu', r.client]);
    if (r.manager) f.push(['🧑‍💼 Menecer', r.manager]);
  } else if (kind === 'callback') {
    f.push(['⏰ Zəng vaxtı', TIME_LABEL[r.preferredTime] || '']);
    f.push(['📍 İstiqamət', r.context]);
  } else if (kind === 'offer') {
    const o = describeOfferId(r.offerId);
    f.push(['🏨 Otel', [o.hotel, o.destination].filter(Boolean).join(', ')]);
    f.push(['📅 Tarix', [fmtDate(o.date), o.nights ? `${o.nights} gecə` : '', BOARD[o.board] || o.board].filter(Boolean).join(' · ')]);
    if (!o.hotel && r.offerId) f.push(['🔖 Təklif', r.offerId]);
  } else if (kind === 'flight') {
    const fl = describeFlightId(r.flightId);
    f.push(['✈️ İstiqamət', fl.route]);
    f.push(['📅 Tarix', [fmtDate(fl.date), fl.back ? `qayıdış ${fmtDate(fl.back)}` : ''].filter(Boolean).join(' · ')]);
    if (r.email) f.push(['✉️ E-poçt', r.email]);
  } else if (kind === 'car') {
    const s = r.summary || {};
    f.push(['🚗 Növ', r.kind === 'transfer' ? 'Transfer' : 'Avtomobil icarəsi']);
    f.push(['📍 İstiqamət', [s.pickup || s.from, s.dropoff || s.to].filter(Boolean).join(' → ')]);
    f.push(['📅 Tarix', r.kind === 'transfer' ? s.date : [s.from, s.to].filter(Boolean).join(' — ')]);
    f.push(['🏢 Şirkət', [s.company, s.model || s.vehicleClass].filter(Boolean).join(' · ')]);
    f.push(['💰 Qiymət', money(s.total, s.currency)]);
  }
  if (r.note) f.push(['📝 Qeyd', r.note]);
  return f.map(([k, v]) => [k, clean(v)]).filter(([, v]) => v);
}

// { html, text, subject } — html: Telegram (parse_mode=HTML), text: e-poçt
function buildLeadMessage(kind, rec, { baseUrl = publicBaseUrl() } = {}) {
  const title = `Yeni müraciət: ${KIND_TITLE[kind] || 'müraciət'}`;
  const fields = leadFields(kind, rec || {});
  const link = baseUrl && kind === 'selection' && rec && rec.id != null ? `${baseUrl}/b2b#lead-${encodeURIComponent(String(rec.id))}` : '';
  const id = rec && rec.id != null ? ` #${clean(rec.id, 20)}` : '';
  const htmlLines = [`🆕 <b>${escapeHtml(title)}</b>${escapeHtml(id)}`, ...fields.map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)];
  if (link) htmlLines.push(`🔗 <a href="${escapeHtml(link)}">B2B paneldə aç</a>`);
  let html = htmlLines.join('\n');
  if (html.length > TG_MAX) html = `${htmlLines.slice(0, 3).join('\n')}\n…`; // limit: yalnız əsas sahələr (teqlər qırılmasın)
  const textLines = [`${title}${id}`, ...fields.map(([k, v]) => `${k.replace(/^\S+\s/, '')}: ${v}`)];
  if (link) textLines.push(`B2B paneldə aç: ${link}`);
  textLines.push('', '— Odiola bildirişi');
  return { html, text: textLines.join('\n'), subject: `Odiola: ${title}` };
}

function buildTestMessage(agencyName) {
  const name = clean(agencyName, 80);
  return {
    html: `✅ <b>Odiola test mesajı</b>\nTelegram bildirişləri qoşuldu${name ? ` — ${escapeHtml(name)}` : ''}. Yeni müraciətlər bu söhbətə gələcək.`,
    text: `Odiola test mesajı: bildirişlər qoşuldu${name ? ` — ${name}` : ''}.`,
    subject: 'Odiola: test bildirişi',
  };
}

module.exports = { escapeHtml, buildLeadMessage, buildTestMessage, leadFields, describeOfferId, describeFlightId, publicBaseUrl, KIND_TITLE, TG_MAX };
