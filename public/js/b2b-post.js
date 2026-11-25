/* global module */
// B2B "📣 Post hazırla": son dəqiqə təkliflərindən (/api/explore lastMinute) və ya seçilmişlərdən 3–5 variantla
// (1) Telegram/Instagram üçün hazır mətn (AZ/EN/RU, emoji, komissiyalı qiymət, agentlik adı/telefonu) və
// (2) 1080×1080 PNG kart (<canvas>, Odiola narıncı palitrası, hotel-art.js illüstrasiyası fon kimi).
// MƏXFİLİK: operator adı, net qiymət, operator linki postda HEÇ VAXT olmur — normalizeItem() yalnız ağ siyahı sahələrini
// götürür, postText()/drawCard() yalnız onlarla işləyir (test/b2b-clients-lists.test.js yoxlayır).
// UMD: Node-da təmiz funksiyalar (testlər), brauzerdə window.B2BPost + UI (b2b.js körpüsü: window.B2BApp).
// Canvas-a mətn fillText ilə yazılır (HTML deyil); modal HTML-də bütün dinamik mətn esc() ilə.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.B2BPost = api; if (typeof document !== 'undefined') api.initUI(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const LANGS = ['az', 'en', 'ru'];
  const MAX_ITEMS = 5;
  const TX = {
    az: {
      head_lm: '🔥 SON DƏQİQƏ TƏKLİFLƏRİ 🔥', head_sl: '🌴 SİZİN ÜÇÜN SEÇDİKLƏRİMİZ 🌴', presents: '{a} təqdim edir:',
      nights: '{n} gecə', pax: '{a} nəfər', pax_c: '{a} böyük + {c} uşaq', from: '{p} — {pax} üçün', flight: '✈️ aviabilet daxil',
      contact: '📞 Əlaqə və rezervasiya: {p}', dm: '📩 Ətraflı məlumat üçün bizə yazın!', note: 'Yerlər məhduddur, qiymətlər dəyişə bilər.',
      badge: 'SON DƏQİQƏ', badge_sl: 'SEÇİLMİŞ TƏKLİFLƏR', card_title: 'Son dəqiqə turları', card_title_sl: 'Seçilmiş turlar', tags: '#tur #istirahət #sondəqiqə',
      board: { RO: 'Yeməksiz', BB: 'Səhər yeməyi', HB: 'Yarım pansion', FB: 'Tam pansion', AI: 'Hər şey daxil', UAI: 'Ultra hər şey daxil' },
    },
    en: {
      head_lm: '🔥 LAST-MINUTE DEALS 🔥', head_sl: '🌴 HAND-PICKED FOR YOU 🌴', presents: '{a} presents:',
      nights: '{n} nights', pax: '{a} guests', pax_c: '{a} adults + {c} children', from: '{p} — for {pax}', flight: '✈️ flights included',
      contact: '📞 Info & booking: {p}', dm: '📩 Message us for details!', note: 'Limited availability, prices may change.',
      badge: 'LAST MINUTE', badge_sl: 'HAND-PICKED', card_title: 'Last-minute tours', card_title_sl: 'Selected tours', tags: '#travel #holiday #lastminute',
      board: { RO: 'Room only', BB: 'Breakfast', HB: 'Half board', FB: 'Full board', AI: 'All inclusive', UAI: 'Ultra all inclusive' },
    },
    ru: {
      head_lm: '🔥 ГОРЯЩИЕ ТУРЫ 🔥', head_sl: '🌴 ПОДОБРАЛИ ДЛЯ ВАС 🌴', presents: '{a} предлагает:',
      nights: '{n} ночей', pax: '{a} чел.', pax_c: '{a} взр. + {c} дет.', from: '{p} — за {pax}', flight: '✈️ перелёт включён',
      contact: '📞 Подробности и бронирование: {p}', dm: '📩 Пишите нам за подробностями!', note: 'Количество мест ограничено, цены могут меняться.',
      badge: 'ГОРЯЩИЙ ТУР', badge_sl: 'ПОДБОРКА', card_title: 'Горящие туры', card_title_sl: 'Подборка туров', tags: '#туры #отдых #горящиетуры',
      board: { RO: 'Без питания', BB: 'Завтраки', HB: 'Полупансион', FB: 'Полный пансион', AI: 'Всё включено', UAI: 'Ультра всё включено' },
    },
  };
  const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  // eslint-disable-next-line no-control-regex -- qəsdən: idarəetmə simvollarını təmizləmək üçün
  const CTRL_RE = /[\u0000-\u001F\u007F]/g;
  const line = (v, max) => (typeof v === 'string' ? v.replace(CTRL_RE, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const int = (v, min, max, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  const fmtMoney = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const fmtDay = (iso) => (DATE_RE.test(iso || '') ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}` : '');
  const clientPrice = (net, markup) => Math.round(Number(net) * (1 + Math.min(100, Math.max(0, Number(markup) || 0)) / 100));

  // Ağ siyahı: postda yalnız bu sahələr ola bilər (operator, net/operator qiyməti, url — YOX)
  function normalizeItem(o) {
    if (!o || typeof o !== 'object') return null;
    const price = Number(o.price ?? o.netPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    const dest = o.destination && typeof o.destination === 'object' ? o.destination.name : o.destination;
    const itemId = /^[a-z0-9-]{1,40}$/.test(o.itemId || '') ? o.itemId : '';
    return {
      name: line(o.name, 120) || '—',
      stars: int(o.stars, 0, 5, 0),
      destination: line(dest, 60),
      checkIn: DATE_RE.test(o.checkIn || '') ? o.checkIn : '',
      nights: int(o.nights, 0, 28, 0),
      board: ['RO', 'BB', 'HB', 'FB', 'AI', 'UAI'].includes(o.board) ? o.board : '',
      adults: int(o.adults, 1, 8, 2),
      children: int(o.children, 0, 6, 0),
      includesFlight: !!o.includesFlight,
      net: Math.round(price),
      // illüstrasiya üçün (hotel-art.js yalnız hash/ağ siyahı kimi istifadə edir)
      itemId,
      destinationId: /^[a-z]{2,20}$/.test(o.destinationId || '') ? o.destinationId : (itemId.match(/^([a-z]+)-h\d+$/) || [])[1] || '',
      tags: Array.isArray(o.tags) ? o.tags.filter((x) => typeof x === 'string').slice(0, 8) : [],
    };
  }

  const tagOf = (s) => '#' + String(s || '').toLocaleLowerCase('az').replace(/[^\p{L}\p{N}]+/gu, '');

  // Telegram/Instagram üçün mətn. opts: { lang, markup, agency, phone, kind: 'lastMinute'|'shortlist' }
  function postText(rawItems, opts = {}) {
    const L = TX[LANGS.includes(opts.lang) ? opts.lang : 'az'];
    const items = (rawItems || []).map((x) => (x && 'net' in x && 'destinationId' in x ? x : normalizeItem(x))).filter(Boolean).slice(0, MAX_ITEMS);
    const agency = line(opts.agency, 80);
    const phone = line(opts.phone, 30);
    const out = [opts.kind === 'shortlist' ? L.head_sl : L.head_lm];
    if (agency) out.push(fill(L.presents, { a: agency }));
    out.push('');
    items.forEach((it, i) => {
      const pax = it.children ? fill(L.pax_c, { a: it.adults, c: it.children }) : fill(L.pax, { a: it.adults });
      const facts = [it.destination ? `📍 ${it.destination}` : '', it.checkIn ? `📅 ${fmtDay(it.checkIn)}` : '',
        it.nights ? `🌙 ${fill(L.nights, { n: it.nights })}` : '', it.board ? `🍽 ${L.board[it.board]}` : ''].filter(Boolean).join(' · ');
      out.push(`${NUM[i]} 🏨 ${it.name}${it.stars ? ' ' + '⭐'.repeat(it.stars) : ''}`);
      if (facts) out.push(facts);
      if (it.includesFlight) out.push(L.flight);
      out.push(`💰 ${fill(L.from, { p: `${fmtMoney(clientPrice(it.net, opts.markup))} ₼`, pax })}`);
      out.push('');
    });
    out.push(phone ? fill(L.contact, { p: phone }) : L.dm);
    out.push(`ℹ️ ${L.note}`);
    if (agency) out.push(`— ${agency}`);
    const dests = [...new Set(items.map((x) => x.destination).filter(Boolean))].slice(0, 3).map(tagOf);
    out.push('', [L.tags, ...dests].join(' '));
    return out.join('\n');
  }

  // ------------------------------------------------------------ PNG kart (canvas)
  const PAL = { from: '#c2410c', mid: '#ea580c', to: '#f59e0b', dark: '#431407', ink: '#7c2d12', cream: '#fff7ed' };
  const FONT = '"Segoe UI", Inter, Roboto, "Noto Sans", "DejaVu Sans", Arial, sans-serif';
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fit(ctx, text, max) {
    if (ctx.measureText(text).width <= max) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > max) s = s.slice(0, -1);
    return s.trimEnd() + '…';
  }
  // canvas: 1080×1080; art: yüklənmiş <img> (ixtiyari). Mətn yalnız fillText ilə (HTML yox).
  function drawCard(canvas, rawItems, opts = {}, art = null) {
    const L = TX[LANGS.includes(opts.lang) ? opts.lang : 'az'];
    const items = (rawItems || []).map((x) => (x && 'net' in x && 'destinationId' in x ? x : normalizeItem(x))).filter(Boolean).slice(0, MAX_ITEMS);
    const S = 1080;
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, PAL.from); g.addColorStop(0.5, PAL.mid); g.addColorStop(1, PAL.to);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // dekorativ dairələr
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath(); ctx.arc(980, 120, 220, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, 1000, 180, 0, Math.PI * 2); ctx.fill();

    // İllüstrasiya (ilk variantın oteli) — yuvarlaq künclü çərçivədə, "cover"
    const ax = 56, ay = 56, aw = S - 112, ah = 340;
    ctx.save();
    roundRect(ctx, ax, ay, aw, ah, 36); ctx.clip();
    if (art && art.naturalWidth) {
      const sr = art.naturalWidth / art.naturalHeight;
      const dr = aw / ah;
      let sw = art.naturalWidth, sh = art.naturalHeight, sx = 0, sy = 0;
      if (sr < dr) { sh = sw / dr; sy = (art.naturalHeight - sh) * 0.7; /* otel/dəniz aşağıdadır */ } else { sw = sh * dr; sx = (art.naturalWidth - sw) / 2; }
      ctx.drawImage(art, sx, sy, sw, sh, ax, ay, aw, ah);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(ax, ay, aw, ah);
    }
    const shade = ctx.createLinearGradient(0, ay + ah * 0.45, 0, ay + ah);
    shade.addColorStop(0, 'rgba(67,20,7,0)'); shade.addColorStop(1, 'rgba(67,20,7,.55)');
    ctx.fillStyle = shade; ctx.fillRect(ax, ay, aw, ah);
    ctx.restore();

    // "Son dəqiqə" nişanı
    const badge = opts.kind === 'shortlist' ? L.badge_sl : L.badge;
    ctx.font = `800 34px ${FONT}`;
    const bw = ctx.measureText(badge).width + 56;
    ctx.fillStyle = '#fff'; roundRect(ctx, ax + 28, ay + 28, bw, 64, 32); ctx.fill();
    ctx.fillStyle = PAL.mid; ctx.textBaseline = 'middle'; ctx.fillText(badge, ax + 56, ay + 61);
    // Başlıq illüstrasiyanın üstündə
    ctx.fillStyle = '#fff'; ctx.font = `800 58px ${FONT}`; ctx.textBaseline = 'alphabetic';
    ctx.fillText(fit(ctx, opts.kind === 'shortlist' ? L.card_title_sl : L.card_title, aw - 56), ax + 28, ay + ah - 30);

    // Variantlar
    const top = ay + ah + 28;
    const footH = 120;
    const n = Math.max(1, items.length);
    const gap = 14;
    const rowH = Math.min(118, Math.floor((S - footH - 36 - top - gap * (n - 1)) / n));
    items.forEach((it, i) => {
      const y = top + i * (rowH + gap);
      ctx.fillStyle = 'rgba(255,255,255,.94)'; roundRect(ctx, 56, y, S - 112, rowH, 22); ctx.fill();
      const price = `${fmtMoney(clientPrice(it.net, opts.markup))} AZN`;
      ctx.font = `800 ${Math.round(rowH * 0.36)}px ${FONT}`;
      const pw = ctx.measureText(price).width;
      ctx.fillStyle = PAL.from; ctx.textBaseline = 'middle';
      ctx.fillText(price, S - 84 - pw, y + rowH / 2);
      const textMax = S - 112 - 56 - pw - 40;
      ctx.fillStyle = PAL.dark; ctx.font = `700 ${Math.round(rowH * 0.28)}px ${FONT}`;
      ctx.fillText(fit(ctx, `${it.name}${it.stars ? '  ' + '★'.repeat(it.stars) : ''}`, textMax), 84, y + rowH * 0.34);
      ctx.fillStyle = PAL.ink; ctx.font = `500 ${Math.round(rowH * 0.22)}px ${FONT}`;
      const sub = [it.destination, fmtDay(it.checkIn), it.nights ? fill(L.nights, { n: it.nights }) : '', it.board].filter(Boolean).join(' · ');
      ctx.fillText(fit(ctx, sub, textMax), 84, y + rowH * 0.7);
    });

    // Alt zolaq: agentlik adı + telefon (operator adı YOX)
    ctx.fillStyle = PAL.dark; ctx.fillRect(0, S - footH, S, footH);
    ctx.textBaseline = 'middle';
    const agency = line(opts.agency, 80);
    const phone = line(opts.phone, 30);
    ctx.font = `600 30px ${FONT}`;
    const phW = phone ? ctx.measureText(phone).width : 0;
    if (phone) { ctx.fillStyle = '#fed7aa'; ctx.fillText(phone, S - 56 - phW, S - footH / 2); }
    ctx.fillStyle = '#fff'; ctx.font = `800 40px ${FONT}`;
    ctx.fillText(fit(ctx, agency || 'Odiola', S - 112 - phW - 40), 56, S - footH / 2);
    return canvas;
  }

  // ------------------------------------------------------------ Brauzer UI
  function initUI() {
    const $ = (s) => document.querySelector(s);
    if (!$('#postBtn') || !$('#postModal')) return;
    const App = () => window.B2BApp;
    const st = { kind: 'lastMinute', candidates: [], picked: new Set(), lang: null, artFor: '', art: null, busy: false };
    const phoneKey = 'b2bPostPhone';
    const tomorrow = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

    async function loadCandidates() {
      const a = App();
      st.candidates = [];
      st.picked.clear();
      render();
      try {
        if (st.kind === 'shortlist') {
          const r = await fetch('/api/b2b/shortlist', { credentials: 'same-origin', cache: 'no-store' });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) { const e = new Error(d.error || 'Xəta'); e.status = r.status; throw e; }
          st.candidates = (d.items || []).filter((x) => x.available !== false).sort((x, y) => x.netPrice - y.netPrice).map(normalizeItem).filter(Boolean);
        } else {
          const r = await api('/api/explore', {
            lastMinute: '1', checkIn: tomorrow(), nights: ($('#nights') && $('#nights').value) || '7',
            adults: ($('#adults') && $('#adults').value) || '2', noStopSale: '1', currency: 'AZN',
          });
          st.candidates = (r.destinations || []).map((d) => normalizeItem({ ...d.best, destination: d.destination })).filter(Boolean);
        }
        st.candidates.slice(0, 4).forEach((_, i) => st.picked.add(i));
      } catch (err) {
        if (!(a && a.onAuthError(err))) toast(err.message);
      }
      st.loaded = true;
      render();
    }

    const opts = () => {
      const a = App();
      return { lang: st.lang, markup: a ? a.markup() : 0, agency: a && a.me ? a.me.agency.name : '', phone: line(($('#poPhone') && $('#poPhone').value) || '', 30), kind: st.kind };
    };
    const chosen = () => st.candidates.filter((_, i) => st.picked.has(i)).slice(0, MAX_ITEMS);

    async function artFor(it) {
      if (!it || !window.HotelArt) return null;
      const key = `${it.itemId}|${it.destinationId}`;
      if (st.artFor === key) return st.art;
      const img = new Image();
      // SVG-də yalnız viewBox var — canvas üçün təbii ölçü (480×320) əlavə olunur, yoxsa brauzer 300×150 götürür
      const svg = window.HotelArt.hotelArt({ id: it.itemId || it.name, destinationId: it.destinationId, tags: it.tags }, 0)
        .replace('<svg ', '<svg width="960" height="640" ');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      try { await img.decode(); } catch { return null; }
      st.artFor = key; st.art = img;
      return img;
    }

    async function redraw() {
      const items = chosen();
      const txt = $('#poText');
      if (txt) txt.value = items.length ? postText(items, opts()) : '';
      const cv = $('#poCanvas');
      if (!cv) return;
      const art = await artFor(items[0]);
      drawCard(cv, items, opts(), art);
    }

    function render() {
      const a = App();
      const m = a ? a.markup() : 0;
      const list = st.candidates.map((it, i) => `<label class="po-item${st.picked.has(i) ? ' on' : ''}">
          <input type="checkbox" data-po-pick="${i}" ${st.picked.has(i) ? 'checked' : ''}>
          <span class="po-item-main"><b>${esc(it.name)}</b> ${esc('★'.repeat(it.stars))}<br><small class="muted">${esc([it.destination, fmtDay(it.checkIn), it.nights ? t('ch_nights', { n: it.nights }) : '', it.board].filter(Boolean).join(' · '))}</small></span>
          <b class="po-price">${esc(money(clientPrice(it.net, m), 'AZN'))}</b></label>`).join('');
      $('#postBody').innerHTML = `
        <div class="sl-top"><h3 id="poTitle">${esc(t('po_title'))}</h3><button type="button" class="btn secondary sm" data-po-close>${esc(t('sl_close'))}</button></div>
        <p class="muted sl-sub">${esc(t('po_sub'))}</p>
        <div class="po-controls">
          <div class="seg" role="tablist"><button type="button" data-po-kind="lastMinute" class="${st.kind === 'lastMinute' ? 'active' : ''}">${esc(t('po_src_lm'))}</button><button type="button" data-po-kind="shortlist" class="${st.kind === 'shortlist' ? 'active' : ''}">${esc(t('po_src_sl'))}</button></div>
          <label class="muted">${esc(t('po_lang'))} <select id="poLang">${LANGS.map((l) => `<option value="${l}" ${l === st.lang ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')}</select></label>
          <label class="muted">${esc(t('po_phone'))} <input id="poPhone" maxlength="30" inputmode="tel" autocomplete="off" placeholder="+994 50 000 00 00"></label>
        </div>
        <div class="po-grid">
          <div>
            <h4>${esc(t('po_pick', { n: MAX_ITEMS }))}</h4>
            <div class="po-list">${list || `<p class="muted">${esc(st.loaded ? t('po_empty') : t('q_loading'))}</p>`}</div>
            <h4>${esc(t('po_text'))}</h4>
            <textarea id="poText" class="quote" rows="12" readonly></textarea>
            <div class="crm-actions"><button type="button" class="btn sm primary" id="poCopy">${esc(t('b2b_copy'))}</button></div>
          </div>
          <div>
            <h4>${esc(t('po_card'))}</h4>
            <canvas id="poCanvas" width="1080" height="1080" class="po-canvas" aria-label="${esc(t('po_card'))}"></canvas>
            <div class="crm-actions"><button type="button" class="btn sm primary" id="poDownload">${esc(t('po_download'))}</button></div>
            <small class="muted">${esc(t('po_private'))}</small>
          </div>
        </div>`;
      $('#poPhone').value = store.get(phoneKey, '');
      redraw();
    }

    function open() {
      const a = App();
      if (!a || !a.me) return;
      if (!st.lang) st.lang = LANGS.includes(LANG) ? LANG : 'az';
      $('#postModal').classList.add('open');
      st.loaded = false;
      loadCandidates();
    }

    $('#postBtn').addEventListener('click', open);
    $('#postModal').addEventListener('click', (e) => {
      if (e.target.id === 'postModal' || e.target.closest('[data-po-close]')) { $('#postModal').classList.remove('open'); return; }
      const k = e.target.closest('[data-po-kind]');
      if (k && k.dataset.poKind !== st.kind) { st.kind = k.dataset.poKind === 'shortlist' ? 'shortlist' : 'lastMinute'; st.loaded = false; loadCandidates(); return; }
      if (e.target.closest('#poCopy')) {
        const v = $('#poText').value;
        navigator.clipboard.writeText(v).then(() => toast(t('po_copied')), () => { $('#poText').select(); });
        return;
      }
      if (e.target.closest('#poDownload')) {
        const cv = $('#poCanvas');
        try {
          cv.toBlob((blob) => {
            if (!blob) return toast('PNG alınmadı');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `odiola-post-${new Date().toISOString().slice(0, 10)}.png`;
            document.body.appendChild(link); link.click(); link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
          }, 'image/png');
        } catch { toast('PNG alınmadı'); }
      }
    });
    $('#postModal').addEventListener('change', (e) => {
      const p = e.target.closest('[data-po-pick]');
      if (p) {
        const i = Number(p.dataset.poPick);
        if (p.checked) {
          if (st.picked.size >= MAX_ITEMS) { p.checked = false; toast(t('po_max', { n: MAX_ITEMS })); return; }
          st.picked.add(i);
        } else st.picked.delete(i);
        p.closest('.po-item').classList.toggle('on', p.checked);
        redraw();
        return;
      }
      if (e.target.id === 'poLang') { st.lang = LANGS.includes(e.target.value) ? e.target.value : 'az'; redraw(); }
    });
    $('#postModal').addEventListener('input', (e) => {
      if (e.target.id === 'poPhone') { store.set(phoneKey, line(e.target.value, 30)); redraw(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#postModal').classList.remove('open'); });
    document.addEventListener('b2b:session', (e) => { if (!(e.detail && e.detail.me)) $('#postModal').classList.remove('open'); });
    document.addEventListener('langchange', () => { if ($('#postModal').classList.contains('open')) render(); });
  }

  return { LANGS, MAX_ITEMS, TX, normalizeItem, postText, drawCard, clientPrice, fmtMoney, fmtDay, initUI };
});
