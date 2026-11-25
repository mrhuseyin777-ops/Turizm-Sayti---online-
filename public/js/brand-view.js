// Agentlik brendi + "Niyə bu otel" + "Oxşar otellər" — ortaq görünüş köməkçiləri (seçim linki /s/<id>,
// çap/PDF təklif, B2B WhatsApp imzası). common.js-dən sonra yüklənir. Bütün dinamik mətn esc() ilə;
// rəng yalnız #rrggbb yoxlamasından keçəndə style atributuna (CSS custom property) yazılır; loqo URL-i yalnız
// /a/pb_<id>/logo formatında olanda göstərilir. Səbəblər serverdən kod kimi gəlir (src/whyhotel.js), mətn burada.
Object.assign(I18N.az, {
  why_title: 'Niyə bu otel', sim_title: 'Oxşar otellər', sim_sub: 'Eyni istiqamət, oxşar ulduz və qiymət — maraqlansanız, menecerə yazın.',
  why_family: 'Ailələr üçün: {list}', why_chdFree: 'CHD FREE', why_kidsClub: 'uşaq klubu', why_aquapark: 'aquapark', why_familyHotel: 'ailəvi otel',
  why_adultsOnly: 'Yalnız böyüklər üçün — sakit istirahət', why_spa: 'SPA mərkəzi — cütlüklər üçün ideal',
  why_beach1: 'Dənizə {m}, 1-ci xətt', why_beach2: 'Dənizə {m}, 2-ci xətt', why_ownBeach: ', öz çimərliyi',
  why_lift: 'Kanat yoluna {m}', why_center: 'Mərkəzə {m}', why_rating: 'Reytinq {r}{word}',
  why_cheapest: 'Seçilmişlər arasında ən ucuz', why_vsCheapest: 'Ən ucuz variantdan cəmi +{d}',
  why_cancel: 'Pulsuz ləğv {d}-dək', why_noPrepay: 'Ön ödənişsiz rezervasiya', why_allInc: 'Hər şey daxil ({board})', why_allIncFlight: 'Hər şey daxil ({board}) + aviabilet',
  why_early: 'Erkən rezervasiya endirimi', why_recommended: 'Tövsiyə olunan otel', why_board: 'Qidalanma: {board}', why_flight: 'Aviabilet daxil', why_stars: '{n}★ otel',
  br_license: 'Lisenziya №', br_call: 'Zəng', br_site: 'Sayt', br_whatsapp: 'WhatsApp', br_address: 'Ünvan', br_regards: 'Hörmətlə, {m} — {a}',
});
Object.assign(I18N.en, {
  why_title: 'Why this hotel', sim_title: 'Similar hotels', sim_sub: 'Same destination, similar stars and price — ask your manager if interested.',
  why_family: 'For families: {list}', why_chdFree: 'CHD FREE', why_kidsClub: 'kids club', why_aquapark: 'aquapark', why_familyHotel: 'family hotel',
  why_adultsOnly: 'Adults only — a quiet stay', why_spa: 'SPA centre — ideal for couples',
  why_beach1: '{m} to the sea, 1st line', why_beach2: '{m} to the sea, 2nd line', why_ownBeach: ', private beach',
  why_lift: '{m} to the ski lift', why_center: '{m} to the centre', why_rating: 'Rating {r}{word}',
  why_cheapest: 'Cheapest of the selection', why_vsCheapest: 'Only +{d} vs the cheapest option',
  why_cancel: 'Free cancellation until {d}', why_noPrepay: 'Book with no prepayment', why_allInc: 'All inclusive ({board})', why_allIncFlight: 'All inclusive ({board}) + flight',
  why_early: 'Early booking discount', why_recommended: 'Recommended hotel', why_board: 'Board: {board}', why_flight: 'Flight included', why_stars: '{n}★ hotel',
  br_license: 'Licence No.', br_call: 'Call', br_site: 'Website', br_whatsapp: 'WhatsApp', br_address: 'Address', br_regards: 'Kind regards, {m} — {a}',
});
Object.assign(I18N.ru, {
  why_title: 'Почему этот отель', sim_title: 'Похожие отели', sim_sub: 'То же направление, похожие звёзды и цена — напишите менеджеру, если интересно.',
  why_family: 'Для семей: {list}', why_chdFree: 'CHD FREE', why_kidsClub: 'детский клуб', why_aquapark: 'аквапарк', why_familyHotel: 'семейный отель',
  why_adultsOnly: 'Только для взрослых — спокойный отдых', why_spa: 'SPA-центр — идеально для пар',
  why_beach1: '{m} до моря, 1-я линия', why_beach2: '{m} до моря, 2-я линия', why_ownBeach: ', свой пляж',
  why_lift: '{m} до подъёмника', why_center: '{m} до центра', why_rating: 'Рейтинг {r}{word}',
  why_cheapest: 'Самый дешёвый из подборки', why_vsCheapest: 'Всего +{d} к самому дешёвому',
  why_cancel: 'Бесплатная отмена до {d}', why_noPrepay: 'Бронирование без предоплаты', why_allInc: 'Всё включено ({board})', why_allIncFlight: 'Всё включено ({board}) + перелёт',
  why_early: 'Скидка раннего бронирования', why_recommended: 'Рекомендуемый отель', why_board: 'Питание: {board}', why_flight: 'Перелёт включён', why_stars: 'Отель {n}★',
  br_license: 'Лицензия №', br_call: 'Позвонить', br_site: 'Сайт', br_whatsapp: 'WhatsApp', br_address: 'Адрес', br_regards: 'С уважением, {m} — {a}',
});

const BrandView = (() => {
  const COLOR_RE = /^#[0-9a-f]{6}$/;
  const LOGO_RE = /^\/a\/pb_[A-Za-z0-9_-]{16}\/logo(\?v=[0-9a-f]{8})?$/;
  const RW = ['superb', 'excellent', 'very_good', 'good'];
  const BOARDS = ['RO', 'BB', 'HB', 'FB', 'AI', 'UAI'];
  const FAM = ['chdFree', 'kidsClub', 'aquapark', 'familyHotel'];
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const dist = (m) => (num(m) == null ? '' : distText(num(m)));
  const board = (b) => (BOARDS.includes(b) ? b : '');

  // Bir səbəb → mətn (HTML deyil; çağıran esc() edir)
  function reasonText(r) {
    if (!r || typeof r !== 'object') return '';
    switch (r.k) {
      case 'family': {
        const list = (Array.isArray(r.items) ? r.items : []).filter((x) => FAM.includes(x)).map((x) => t('why_' + x));
        return list.length ? t('why_family', { list: list.join(', ') }) : '';
      }
      case 'adultsOnly': case 'spa': case 'cheapest': case 'noPrepay': case 'early': case 'recommended': case 'flight':
        return t('why_' + r.k);
      case 'beach':
        if (![1, 2].includes(r.line)) return '';
        return (r.m != null ? t(r.line === 1 ? 'why_beach1' : 'why_beach2', { m: dist(r.m) }) : t('line_' + r.line)) + (r.own ? t('why_ownBeach') : '');
      case 'lift': case 'center': return num(r.m) == null ? '' : t('why_' + r.k, { m: dist(r.m) });
      case 'rating': {
        const v = num(r.r);
        if (v == null) return '';
        return t('why_rating', { r: v.toFixed(1), word: RW.includes(r.word) ? ' — ' + t('rw_' + r.word) : '' });
      }
      case 'vsCheapest': return num(r.d) == null ? '' : t('why_vsCheapest', { d: money(num(r.d), 'AZN') });
      case 'cancel': return /^\d{4}-\d{2}-\d{2}$/.test(r.d || '') ? t('why_cancel', { d: fmtDate(r.d).slice(0, 5) }) : '';
      case 'allInc': return board(r.board) ? t(r.flight ? 'why_allIncFlight' : 'why_allInc', { board: board(r.board) }) : '';
      case 'board': return board(r.board) ? t('why_board', { board: board(r.board) }) : '';
      case 'stars': return num(r.n) ? t('why_stars', { n: Math.min(5, Math.max(1, num(r.n))) }) : '';
      default: return '';
    }
  }

  function whyHtml(reasons, { title = true } = {}) {
    const items = (Array.isArray(reasons) ? reasons : []).map(reasonText).filter(Boolean).slice(0, 4);
    if (!items.length) return '';
    return `<div class="why">${title ? `<b class="why-t">${esc(t('why_title'))}</b>` : ''}<ul class="why-list">${items.map((x) => `<li>✓ ${esc(x)}</li>`).join('')}</ul></div>`;
  }

  function similarHtml(list, cur = 'AZN') {
    const arr = Array.isArray(list) ? list.slice(0, 3) : [];
    if (!arr.length) return '';
    return `<section class="similar" aria-labelledby="simTitle"><h2 id="simTitle">${esc(t('sim_title'))}</h2><p class="muted">${esc(t('sim_sub'))}</p>
      <div class="sim-grid">${arr.map((h) => `<article class="sim-card">
        <h3>${esc(h.name)} <span class="stars">${starStr(h.stars)}</span></h3>
        <div class="muted">${esc([h.destination, h.district].filter(Boolean).join(' · '))}</div>
        <div class="muted">${h.checkIn ? esc(fmtDate(h.checkIn)) + ' · ' : ''}${esc(t('nights_n', { n: h.nights }))}${h.board ? ' · ' + esc(h.board) : ''}${h.includesFlight ? ' · ✈' : ''}</div>
        ${whyHtml(h.why, { title: false })}
        <div class="sim-price">${money(h.clientPrice, cur)}</div>
      </article>`).join('')}</div></section>`;
  }

  // style="--brand:…;--brand-on:…" — yalnız validasiya olunmuş hex
  function styleAttr(brand) {
    const c = brand && COLOR_RE.test(brand.color || '') ? brand.color : null;
    if (!c) return '';
    const on = brand.onColor === '#111827' ? '#111827' : '#ffffff';
    return `--brand:${c};--brand-on:${on}`;
  }
  function applyColor(el, brand) {
    if (!el) return;
    const c = brand && COLOR_RE.test(brand.color || '') ? brand.color : null;
    if (c) { el.style.setProperty('--brand', c); el.style.setProperty('--brand-on', brand.onColor === '#111827' ? '#111827' : '#ffffff'); el.classList.add('branded'); }
  }
  const logoSrc = (brand) => (brand && LOGO_RE.test(brand.logoUrl || '') ? brand.logoUrl : '');
  function logoHtml(brand, cls = 'brand-logo') {
    const src = logoSrc(brand);
    return src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(brand.name || '')}" decoding="async">` : '';
  }
  // Telefon → tel:/wa.me (yalnız rəqəmlər)
  function phoneLinks(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (d.length < 7 || d.length > 15) return null;
    const full = d.length === 10 && d.startsWith('0') ? `994${d.slice(1)}` : d.length === 9 ? `994${d}` : d;
    return { tel: `+${full}`, wa: full };
  }
  function contactsHtml(brand, { links = true } = {}) {
    if (!brand) return '';
    const out = [];
    const p = phoneLinks(brand.phone);
    const w = phoneLinks(brand.whatsapp);
    if (brand.phone) out.push(p && links ? `<a href="tel:${esc(p.tel)}">📞 ${esc(brand.phone)}</a>` : `<span>📞 ${esc(brand.phone)}</span>`);
    if (brand.whatsapp) out.push(w && links ? `<a href="https://wa.me/${esc(w.wa)}" target="_blank" rel="noopener noreferrer">💬 ${esc(t('br_whatsapp'))}: ${esc(brand.whatsapp)}</a>` : `<span>💬 ${esc(brand.whatsapp)}</span>`);
    if (brand.website) {
      const href = safeUrl(brand.website, '');
      let host = '';
      try { host = new URL(href).host; } catch { /* */ }
      if (href && host) out.push(links ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">🌐 ${esc(host)}</a>` : `<span>🌐 ${esc(host)}</span>`);
    }
    if (brand.address) out.push(`<span>📍 ${esc(brand.address)}</span>`);
    if (brand.licenseNo) out.push(`<span>${esc(t('br_license'))} ${esc(brand.licenseNo)}</span>`);
    return out.length ? `<div class="brand-contacts">${out.join('')}</div>` : '';
  }
  // WhatsApp / mətn təklifinin imzası (düz mətn)
  function signature(brand, { manager, agency } = {}) {
    const name = (brand && brand.name) || agency || '';
    const lines = [];
    if (manager || name) lines.push(manager ? t('br_regards', { m: manager, a: name }) : name);
    if (brand) {
      const contacts = [brand.phone ? `📞 ${brand.phone}` : '', brand.whatsapp && brand.whatsapp !== brand.phone ? `💬 WhatsApp ${brand.whatsapp}` : ''].filter(Boolean).join(' · ');
      if (contacts) lines.push(contacts);
      if (brand.website) lines.push(`🌐 ${brand.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
      if (brand.address) lines.push(`📍 ${brand.address}`);
      if (brand.licenseNo) lines.push(`${t('br_license')} ${brand.licenseNo}`);
    }
    return lines.join('\n');
  }
  return { reasonText, whyHtml, similarHtml, styleAttr, applyColor, logoHtml, logoSrc, contactsHtml, signature, phoneLinks, COLOR_RE };
})();
if (typeof window !== 'undefined') window.BrandView = BrandView;
