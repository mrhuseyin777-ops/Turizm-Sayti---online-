// B2B agentlik paneli
(async function () {
  const $ = (s) => document.querySelector(s);
  const cfg = await api('/api/config');
  const state = { type: 'package', view: 'matrix', data: null, selected: new Set(), sortKey: 'price', sortDir: 1, facetFor: '' };
  const markup = () => Math.max(0, Number($('#markup').value) || 0);
  // Müştəri qiyməti. Təklif obyekti ötürülür: agentliyin komissiya qaydaları aktivdirsə serverin hesabladığı
  // clientPrice (src/markup.js applyMarkup, /api/b2b/search), yoxdursa tək % sahəsi (server düsturu ilə eyni).
  const pricingActive = () => !!(state.data && state.data.pricing && state.data.pricing.active);
  const withMarkup = (x) => {
    if (x && typeof x === 'object') return pricingActive() && Number.isFinite(x.clientPrice) ? x.clientPrice : Math.round(x.price * (1 + markup() / 100));
    return Math.round(x * (1 + markup() / 100));
  };
  const CH = window.B2BCheapest;

  // Giriş: server tərəfli sessiya (httpOnly cookie). JS yalnız /api/b2b/me cavabını görür —
  // parol və sessiya id-si brauzer yaddaşında (localStorage) saxlanılmır.
  let me = null;
  const sessionInfo = () => (me ? { agency: me.agency.name, manager: me.user.displayName } : {});
  // Köhnə demo versiyadan qalan localStorage girişini sil
  try { localStorage.removeItem('b2bSession'); } catch { /* */ }

  function showApp() {
    $('#loginView').hidden = !!me; $('#appView').hidden = !me; $('#logout').hidden = !me;
    $('#agencyName').textContent = me ? `${me.agency.name} · ${me.user.displayName}` : '';
    if (me) loadLeads();
    // Seçilmişlər / ən ucuz panel (public/js/b2b-shortlist.js) sessiya dəyişikliyini buradan bilir
    document.dispatchEvent(new CustomEvent('b2b:session', { detail: { me } }));
  }
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    $('#loginErr').textContent = '';
    $('#loginBtn').disabled = true;
    try {
      const r = await postJson('/api/b2b/login', { username: String(fd.get('username') || ''), password: String(fd.get('password') || '') });
      setCsrf(r.csrfToken);
      me = r;
      e.target.reset();
      showApp();
    } catch (err) {
      $('#loginErr').textContent = err.message;
      e.target.password.value = '';
    } finally { $('#loginBtn').disabled = false; }
  });
  $('#logout').addEventListener('click', async (e) => {
    e.preventDefault();
    try { await postJson('/api/b2b/logout', {}); } catch { /* sessiya artıq bitib */ }
    setCsrf(null); me = null; state.data = null;
    // Ortaq kompüterdə növbəti istifadəçi müştəri adlarını görməsin
    try { localStorage.removeItem('b2bHistory'); } catch { /* */ }
    renderHistory();
    B2BLeads.reset(); $('#tableWrap').innerHTML = '';
    showApp();
  });
  // Sessiya bitibsə (401) — giriş ekranına qayıt
  const onAuthError = (err) => {
    if (err && err.status === 401) { me = null; setCsrf(null); B2BLeads.reset(); showApp(); toast('Sessiyanın müddəti bitib. Yenidən daxil olun.'); return true; }
    return false;
  };

  // "Müraciətlər" (CRM: status, qeyd, tez əlaqə) və "Ayarlar" (bildirişlər): public/js/b2b-leads.js.
  // Server agentliyi sessiyadan götürür — yalnız öz agentliyinizin müraciətləri.
  async function loadLeads() {
    if (!me) return;
    await B2BLeads.load({ me, onAuthError });
  }
  $('#leadsReload').addEventListener('click', loadLeads);
  // Ayrı modullar üçün körpü (public/js/b2b-shortlist.js): yalnız lazım olan oxu/əmr funksiyaları
  window.B2BApp = {
    get data() { return state.data; },
    get lastParams() { return state.lastParams; },
    get summary() { return state.summary; },
    get me() { return me; },
    markup, withMarkup, onAuthError, sessionInfo, pricingActive,
    rerun: () => { if (state.data) run(); },
    refreshHistory: () => renderHistory(),
    client: () => $('#client').value,
    // Müştəri bazasından seçilmiş müştəri (public/js/b2b-clients.js) — yoxdursa ''
    clientId: () => $('#client').dataset.clientId || '',
    // Variantı "Müştəriyə təklif" / "Seçim linki" seçiminə əlavə et və istəyə görə həmin pəncərəni aç
    select(id, open) {
      if (!state.data || !state.data.offers.some((o) => o.id === id)) return false;
      state.selected.add(id);
      render();
      if (open === 'quote') $('#quoteBtn').click();
      else if (open === 'share') $('#shareBtn').click();
      return true;
    },
  };
  me = await b2bMe();
  showApp();

  // Uşaq yaşları
  const syncAges = () => renderChildAges($('#childAges'), $('#children').value, readChildAges($('#childAges')));
  $('#children').addEventListener('input', syncAges);
  document.addEventListener('langchange', syncAges);

  $('#checkIn').value = defaultDate(30);
  $('#checkInTo').value = defaultDate(36);
  $('#markup').value = store.get('b2bMarkup', 0);
  autocomplete($('#dest'));
  // Tarix aralığı (gediş -dan / -dək, maks. 14 gün) və gecə aralığı; qısa yollar (dəqiq, ±3, +7, +14)
  const range = bindRangeInputs({ from: $('#checkIn'), to: $('#checkInTo'), nFrom: $('#nights'), nTo: $('#nightsTo') }, cfg.searchLimits);
  $('#dateQuick').addEventListener('click', (e) => { const b = e.target.closest('[data-span]'); if (b) range.quick(b.dataset.span); });

  // Rayon və otel multi-select-ləri (axtarışlı siyahı) + otel atributları + yer/satış filtrləri
  const districtMs = msCreate($('#districtMs'), { title: 'f_district' });
  const hotelMs = msCreate($('#hotelMs'), { title: 'f_hotel', onlySelToggle: true });
  $('#attrFilter').innerHTML = HOTEL_ATTR_KEYS.map((a) => `<label><input type="checkbox" name="attrs" value="${a}"> <span data-i18n="attr_${a}">${esc(t('attr_' + a))}</span></label>`).join('');
  let msT;
  $('#advFilters').addEventListener('mschange', () => { clearTimeout(msT); msT = setTimeout(run, 250); });
  $('#advFilters').addEventListener('change', (e) => { if (e.target.matches('input[type="checkbox"]')) run(); });
  $('#rateLine').innerHTML = rateLineHtml(cfg.operatorRate);
  document.addEventListener('langchange', () => { msRender(districtMs); msRender(hotelMs); $('#rateLine').innerHTML = rateLineHtml((state.data && state.data.operatorRate) || cfg.operatorRate); if (state.data) render(); });

  $('#typeTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    document.querySelectorAll('#typeTabs .tab').forEach((x) => x.classList.toggle('active', x === b));
    state.type = b.dataset.type;
  });
  $('#viewSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]'); if (!b) return;
    document.querySelectorAll('#viewSeg button').forEach((x) => x.classList.toggle('active', x === b));
    state.view = b.dataset.view; render();
  });
  ['#stars', '#board', '#earlyOnly', '#lastMinute', '#prepayNone', '#freeCancel'].forEach((s) => $(s).addEventListener('change', run));
  $('#markup').addEventListener('input', () => { store.set('b2bMarkup', markup()); render(); });
  // Yeni axtarış: sıralama həmişə ucuzdan bahalıya
  $('#b2bForm').addEventListener('submit', (e) => { e.preventDefault(); state.sortKey = 'price'; state.sortDir = 1; run(); });

  async function run() {
    if (!$('#dest').value.trim()) return;
    range.fix();
    $('#tableWrap').innerHTML = '<div class="spinner"></div>';
    // İstiqamət/növ dəyişibsə köhnə rayon/otel seçimi aid deyil
    const facetKey = `${$('#dest').dataset.id || $('#dest').value.trim().toLowerCase()}|${state.type}`;
    if (state.facetFor && state.facetFor !== facetKey) { msSetSelected(districtMs, []); msSetSelected(hotelMs, []); msSetItems(districtMs, []); msSetItems(hotelMs, []); }
    state.facetFor = facetKey;
    const checkedAttrs = [...document.querySelectorAll('#attrFilter input:checked')].map((i) => i.value).join(',');
    const p = {
      q: $('#dest').value, destinationId: $('#dest').dataset.id || '', type: state.type, checkIn: $('#checkIn').value, checkInTo: $('#checkInTo').value,
      nights: $('#nights').value, nightsTo: $('#nightsTo').value, adults: $('#adults').value, children: $('#children').value,
      childAges: readChildAges($('#childAges')).join(','),
      maxPrice: $('#maxPrice').value, stars: $('#stars').value, boards: $('#board').value, earlyOnly: $('#earlyOnly').checked ? '1' : '', flat: '1',
      lastMinute: $('#lastMinute').checked ? '1' : '', prepay: $('#prepayNone').checked ? 'none' : '', freeCancel: $('#freeCancel').checked ? '1' : '',
      // Otel adı ilə seçilmiş otel + çoxseçimli otel filtri; "Siyahı" seçilibsə (public/js/b2b-lists.js) — yalnız həmin otellər
      districts: msValue(districtMs).join(','), hotels: (() => { const sel = [$('#dest').dataset.hotel, ...msValue(hotelMs)].filter(Boolean); return window.B2BLists ? window.B2BLists.hotelsParam(sel) : sel.join(','); })(), attrs: checkedAttrs,
      seatsOnly: $('#seatsOnly').checked ? '1' : '', noStopSale: $('#noStopSale').checked ? '1' : '', instantOnly: $('#instantOnly').checked ? '1' : '',
    };
    try {
      // B2B axtarışı: /api/search ilə eyni + komissiya qaydaları aktivdirsə hər təklifdə serverin clientPrice-ı
      state.data = await api('/api/b2b/search', p);
      state.lastParams = p;
      state.selected.clear();
      saveHistory(p);
      document.dispatchEvent(new CustomEvent('b2b:search', { detail: { params: p } }));
      const f = state.data.facets || { districts: [], hotels: [] };
      msSetItems(districtMs, f.districts.map((d) => ({ id: d.id, label: d.name, sub: d.destination || '', count: d.count })));
      msSetItems(hotelMs, f.hotels.map((h) => ({ id: h.id, label: `${h.name}${h.stars ? ' ' + h.stars + '*' : ''}`, sub: h.district || '', count: h.count })));
      $('#rateLine').innerHTML = rateLineHtml(state.data.operatorRate || cfg.operatorRate);
      render();
    } catch (err) { $('#tableWrap').innerHTML = `<div class="empty">${esc(err.message)}</div>`; }
  }

  function saveHistory(p) {
    const h = store.get('b2bHistory', []).filter((x) => !(x.q === p.q && x.checkIn === p.checkIn && x.type === p.type));
    h.unshift({ ...p, client: $('#client').value, clientId: $('#client').dataset.clientId || '', at: Date.now() });
    store.set('b2bHistory', h.slice(0, 15));
    renderHistory();
  }
  function renderHistory() {
    const h = store.get('b2bHistory', []);
    $('#history').innerHTML = h.length ? h.map((x, i) => `<div data-h="${i}"><b>${esc(x.client || x.q)}</b><br><small class="muted">${esc(x.q)} · ${esc(fmtDate(x.checkIn || ''))}${x.checkInTo && x.checkInTo !== x.checkIn ? '–' + esc(shortDate(x.checkInTo)) : ''} · ${esc(x.nights)}${x.nightsTo && x.nightsTo !== x.nights ? '–' + esc(x.nightsTo) : ''}g · ${esc(x.adults)}+${esc(x.children)}</small></div>`).join('') : '<p class="muted">Hələ yoxdur</p>';
  }
  $('#history').addEventListener('click', (e) => {
    const el = e.target.closest('[data-h]'); if (!el) return;
    const x = store.get('b2bHistory', [])[+el.dataset.h];
    $('#dest').value = x.q; if (x.destinationId) $('#dest').dataset.id = x.destinationId; else delete $('#dest').dataset.id;
    for (const k of ['checkIn', 'nights', 'adults', 'children', 'maxPrice']) $('#' + k).value = x[k] || '';
    // Köhnə tarixçə qeydlərində checkInTo/nightsTo yoxdur (±gün) → dəqiq tarix
    $('#checkInTo').value = x.checkInTo || x.checkIn || '';
    $('#nightsTo').value = x.nightsTo || x.nights || '';
    renderChildAges($('#childAges'), x.children, String(x.childAges || '').split(',').filter(Boolean).map(Number));
    $('#client').value = x.client || '';
    if (x.clientId) $('#client').dataset.clientId = x.clientId; else delete $('#client').dataset.clientId;
    $('#client').dispatchEvent(new Event('b2b:client-set'));
    if (['package', 'hotel', 'tour'].includes(x.type)) $(`#typeTabs [data-type="${x.type}"]`).click();
    run();
  });
  renderHistory();

  function renderKpis(offers) {
    if (!offers.length) { $('#kpis').hidden = true; return; }
    const avg = Math.round(offers.reduce((s, o) => s + o.price, 0) / offers.length);
    // hansı operator neçə oteldə ən ucuzdur
    const wins = {};
    for (const g of state.data.groups) wins[g.best.providerName] = (wins[g.best.providerName] || 0) + 1;
    const topOp = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
    $('#kpis').hidden = false;
    $('#kpis').innerHTML = `
      <div class="kpi"><small>Ən ucuz təklif</small><b>${money(offers[0].price, 'AZN')}</b><br><small>${esc(offers[0].providerName)} · ${esc(offers[0].name)}</small></div>
      <div class="kpi"><small>Orta qiymət</small><b>${money(avg, 'AZN')}</b><br><small>${offers.length} təklif, ${state.data.groups.length} otel/tur</small></div>
      <div class="kpi"><small>Ən çox ucuz olan operator</small><b>${esc(topOp[0])}</b><br><small>${topOp[1]} oteldə ən ucuz</small></div>
      <div class="kpi"><small>Erkən rezervasiya</small><b>${offers.filter((o) => o.earlyBooking).length}</b><br><small>endirimli təklif</small></div>`;
  }

  function render() {
    const d = state.data; if (!d) return;
    const offers = d.offers || [];
    // "Ən ucuz təklif" xülasəsi (public/js/b2b-cheapest.js) — panel b2b-shortlist.js-də çəkilir
    state.summary = CH.cheapestSummary({ offers, groups: d.groups });
    document.dispatchEvent(new CustomEvent('b2b:render', { detail: { summary: state.summary } }));
    renderKpis(offers);
    $('#selCount').textContent = state.selected.size;
    if (!offers.length) { $('#tableWrap').innerHTML = `<div class="empty">${emptyDiagnosisHtml(d, 'AZN')}</div>`; return; }
    if (state.view === 'matrix') renderMatrix(d); else renderList(offers);
  }

  function renderMatrix(d) {
    const ops = d.sources.filter((s) => s.count > 0);
    const sum = state.summary;
    // Default: otellər ən ucuz təklifinə görə ucuzdan bahalıya
    const rows = CH.sortGroupsByPrice(d.groups).map((g) => {
      const byOp = Object.fromEntries(g.providers.map((o) => [o.providerId, o]));
      // Eyni otel üçün operatorların sırası: ucuzdan bahalıya (1 = ən ucuz)
      const ranked = [...g.providers].sort((a, b) => a.price - b.price);
      const rankOf = Object.fromEntries(ranked.map((o, i) => [o.providerId, i + 1]));
            const order = ranked.map((o, i) => `<span class="rk-step${i === 0 ? ' first' : ''}"><b>${i + 1}.</b> ${esc(o.providerName)}${i ? ` <span class="muted">+${money(withMarkup(o) - withMarkup(ranked[0]), 'AZN')}</span>` : ''}</span>`).join('<span class="rk-arrow" aria-hidden="true">›</span>');
      return `<tr>
        <td><b>${esc(g.name)}</b> <span class="stars">${starStr(g.stars)}</span>${g.itemType === 'hotel' ? ` <button type="button" class="fav-btn hl-btn" data-hl="${esc(g.itemId)}" title="${esc(t('hl_add'))}" aria-label="${esc(t('hl_add'))}">☆</button>` : ''}<br><small class="muted">${esc(g.destination.name)}${g.district ? ' · ' + esc(g.district) : ''}${g.rating != null ? ' · ' + esc(ratingText(g)) : ''}</small><div class="badges tight">${attrBadges(g.attrs)}${locationBadge(g.location)}</div>
          ${ranked.length > 1 ? `<div class="rk-order" title="${esc(t('rk_order_t'))}">${order}</div>` : ''}</td>
        ${ops.map((s) => {
          const o = byOp[s.id];
          if (!o) return '<td class="num muted">—</td>';
          const best = o.id === g.best.id;
          const top = CH.isBestCell(sum, g.itemId, s.id);
          const sel = state.selected.has(o.id);
          const rk = rankOf[s.id];
          return `<td class="num${top ? ' top-cell' : ''}" style="${best ? 'background:var(--good-soft);font-weight:700' : ''}">
            ${top ? `<span class="best-badge">🏆 ${esc(t('ch_badge'))}</span><br>` : ''}<span class="rk-chip${rk === 1 ? ' first' : ''}" title="${esc(t('rk_chip_t', { n: rk }))}">${rk}</span> <label style="cursor:pointer"><input type="checkbox" data-sel="${esc(o.id)}" ${sel ? 'checked' : ''}> ${money(withMarkup(o), 'AZN')}</label>
            <button type="button" class="fav-btn" data-fav="${esc(o.id)}" title="${esc(t('sl_add'))}" aria-label="${esc(t('sl_add'))}">♡</button>
            <br><small class="muted" title="${esc([roomText(o), priceTypeText(o), flightText(o), o.stopSale ? t('stop_sale') : ''].filter(Boolean).join(' · '))}">${fmtDate(o.checkIn).slice(0, 5)} ${esc(o.board || '')}${o.earlyBooking ? ' · ER' : o.priceType === 'SPO' ? ' · SPO' : ''}${o.stopSale ? ' · ⛔' : ''}</small>
            <br><small class="muted mx-room">${esc(o.room || '')}</small></td>`;
        }).join('')}
        <td class="num"><b style="color:var(--good)">${g.savings ? money(g.savings, 'AZN') : '—'}</b></td>
      </tr>`;
    }).join('');
    $('#tableWrap').innerHTML = `<table class="grid"><thead><tr><th>Otel / tur</th>${ops.map((s) => `<th style="text-align:right"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(s.color)}"></span> ${esc(s.name)}<br><small class="op-wins" title="${esc(t('ch_wins_t'))}">🏆 ${esc(t('ch_wins', { n: (sum && sum.wins[s.id]) || 0 }))}</small></th>`).join('')}<th style="text-align:right">Fərq</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // "Bütün təkliflər" — operator saytındakı sütunlar + müqayisə (net / müştəri qiyməti, operator)
  const cols = () => [
    ['checkIn', t('col_date')], ['tourName', t('col_tour')], ['nights', t('col_nights')], ['name', t('col_hotel')], ['stars', '★'],
    ['hotelSeats', t('col_seats')], ['dist', t('col_location')], ['board', t('col_board')], ['room', t('col_room')], ['price', 'Net (AZN)'], ['opPrice', t('col_opprice')],
    ['client', 'Müştəri qiyməti'], ['priceType', t('col_ptype')], ['providerName', t('col_op')], ['availability', 'Status'], ['prepayment', t('b2b_terms')],
  ];
  const termsShort = (o) => [o.prepayment === 'none' ? t('prepay_none') : o.prepayment === '50' ? t('prepay_50') : o.prepayment === 'full' ? t('prepay_full') : '',
    o.freeCancelUntil ? t('free_cancel', { d: shortDate(o.freeCancelUntil) }) : ''].filter(Boolean).join(' · ');
  function renderList(offers) {
    const k = state.sortKey === 'client' ? 'price' : state.sortKey;
    // "dist" = əsas məsafə (dəniz / kanat / mərkəz); məsafəsi olmayanlar həmişə sonda
    const val = (o) => (k === 'dist' ? keyDist(o.location) ?? (state.sortDir > 0 ? Infinity : -Infinity) : o[k]);
    const list = [...offers].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * state.sortDir).slice(0, 400);
    const minPrice = Math.min(...offers.map((o) => o.price));
    const top = state.summary && state.summary.best;
    $('#tableWrap').innerHTML = `<table class="grid op-table"><thead><tr><th></th>${cols().map(([key, label]) => `<th data-sort="${key}">${esc(label)}${state.sortKey === key ? (state.sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>
      ${list.map((o) => `<tr class="${state.selected.has(o.id) ? 'sel' : ''} ${o.price === minPrice ? 'cheapest' : ''} ${o.stopSale ? 'stop' : ''} ${top && top.id === o.id ? 'top-row' : ''}">
        <td><input type="checkbox" data-sel="${esc(o.id)}" ${state.selected.has(o.id) ? 'checked' : ''}> <button type="button" class="fav-btn" data-fav="${esc(o.id)}" title="${esc(t('sl_add'))}" aria-label="${esc(t('sl_add'))}">♡</button>${top && top.id === o.id ? `<br><span class="best-badge">🏆 ${esc(t('ch_badge'))}</span>` : ''}</td>
        <td>${esc(fmtDate(o.checkIn))}${o.flight ? `<br><small class="muted">✈ ${esc(o.flight.out.time)} · ${esc(t('cls_' + o.flight.cls))}</small>` : ''}</td>
        <td class="wrap"><small>${esc(o.tourName || '')}</small></td>
        <td class="num">${esc(o.nights)}</td>
        <td class="wrap">${esc(o.name)}${o.itemType === 'hotel' ? ` <button type="button" class="fav-btn hl-btn" data-hl="${esc(o.itemId)}" title="${esc(t('hl_add'))}" aria-label="${esc(t('hl_add'))}">☆</button>` : ''}${o.district ? ` <small class="muted">(${esc(o.district)})</small>` : ''}${o.earlyBooking ? ' <span class="badge early">ER</span>' : ''}${o.lastMinute ? ' <span class="badge hot">LM</span>' : ''}<div class="badges tight">${attrBadges(o.attrs)}</div></td>
        <td>${esc(o.stars || '')}</td>
        <td>${seatsHtml(o)}</td>
        <td class="wrap"><small>${esc(locationText(o.location) || '—')}</small>${o.rating != null ? `<br><small class="muted">${esc(ratingText(o))}</small>` : ''}</td>
        <td>${esc(o.board || '—')}</td>
        <td class="wrap"><small>${esc(roomText(o))}</small></td>
        <td class="num">${money(o.price, 'AZN')}</td>
        <td class="num"><small>${o.opCurrency ? money(o.opPrice, o.opCurrency) : ''}</small></td>
        <td class="num"><b>${money(withMarkup(o), 'AZN')}</b></td>
        <td class="wrap"><small>${esc(priceTypeText(o))}</small></td>
        <td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}</td>
        <td>${o.stopSale ? `⛔ ${esc(t('stop_sale'))}` : o.availability === 'instant' ? '✅ Mövcud' : '⏳ Sorğu ilə'}</td><td><small>${esc(termsShort(o))}</small></td></tr>`).join('')}
      </tbody></table>${state.data.offersTruncated ? '<p class="muted" style="padding:0 10px;font-size:13px">Cavab 1000 təkliflə məhdudlaşdırılıb — filtrlərlə daraldın.</p>' : ''}`;
  }

  $('#tableWrap').addEventListener('click', (e) => {
    const th = e.target.closest('[data-sort]');
    if (th) { const key = th.dataset.sort; state.sortDir = state.sortKey === key ? -state.sortDir : 1; state.sortKey = key; render(); return; }
    // Boş nəticə: tur paketinə / otelə keç, ekskursiya istiqamətinə keç, filtri yumşalt
    const sw = e.target.closest('[data-switch-type]');
    if (sw) { $(`#typeTabs [data-type="${sw.dataset.switchType === 'hotel' ? 'hotel' : 'package'}"]`).click(); run(); return; }
    const gd = e.target.closest('[data-go-dest]');
    if (gd) { $('#dest').value = gd.dataset.goName; $('#dest').dataset.id = gd.dataset.goDest; run(); return; }
    const rx = e.target.closest('[data-relax]');
    if (rx) { relaxFilter(rx.dataset.relax, rx.dataset.value); }
  });
  function relaxFilter(key, value) {
    const map = { stars: '#stars', boards: '#board' };
    const boxes = { earlyOnly: '#earlyOnly', lastMinute: '#lastMinute', prepay: '#prepayNone', freeCancel: '#freeCancel', seatsOnly: '#seatsOnly', noStopSale: '#noStopSale', instantOnly: '#instantOnly' };
    if (key === 'maxPrice') $('#maxPrice').value = value || '';
    else if (map[key]) $(map[key]).value = '';
    else if (boxes[key]) $(boxes[key]).checked = false;
    else if (key === 'districts') msSetSelected(districtMs, []);
    else if (key === 'hotels') msSetSelected(hotelMs, []);
    else if (key === 'attrs') document.querySelectorAll('#attrFilter input').forEach((i) => { i.checked = false; });
    run();
  }
  $('#tableWrap').addEventListener('change', (e) => {
    const id = e.target.dataset.sel; if (!id) return;
    e.target.checked ? state.selected.add(id) : state.selected.delete(id);
    $('#selCount').textContent = state.selected.size;
    if (state.view === 'list') e.target.closest('tr').classList.toggle('sel', e.target.checked);
  });

  function selectedOffers() {
    const all = state.data ? state.data.offers : [];
    const sel = all.filter((o) => state.selected.has(o.id));
    return (sel.length ? sel : state.data.groups.slice(0, 3).map((g) => g.best)).sort((a, b) => a.price - b.price);
  }

  function quoteText(list) {
    const s = sessionInfo();
    const q = state.data.query;
    const client = $('#client').value;
    const lines = [
      `Salam${client ? ', ' + client : ''}! Sorğunuza uyğun ən sərfəli variantlar:`,
      `📍 ${list[0].destination.name} · ${q.adults} böyük${q.children ? ' + ' + q.children + ' uşaq' : ''} · ${q.nights} gecə`,
      '',
      ...list.map((o, i) => [
        `${i + 1}) ${o.name} ${starStr(o.stars)}`,
        `   📅 ${fmtDate(o.checkIn)} · ${o.nights} gecə${o.boardLabel ? ' · ' + o.boardLabel + ' (' + o.board + ')' : ''}${o.includesFlight ? ' · ✈ aviabilet daxil' : ''}${o.flight ? ' (uçuş ' + o.flight.out.time + ', ' + t('cls_' + o.flight.cls) + ')' : ''}`,
        o.room || o.district ? `   🛏 ${[o.room, o.district ? 'rayon: ' + o.district : ''].filter(Boolean).join(' · ')}` : '',
        `   💰 ${money(withMarkup(o), 'AZN')} (cəmi)${o.earlyBooking ? ' — erkən rezervasiya endirimi' : ''}`,
      ].filter(Boolean).join('\n')),
      '',
      'Qiymətlər yerlərin mövcudluğundan asılı olaraq dəyişə bilər.',
      // İmza: agentliyin brend profili (ad, telefon/WhatsApp, sayt, lisenziya) — public/js/b2b-brand.js
      window.B2BBrand ? window.B2BBrand.signature(s) : (s.manager ? `Hörmətlə, ${s.manager} — ${s.agency}` : ''),
    ];
    return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trim();
  }

  $('#quoteBtn').addEventListener('click', () => {
    if (!state.data || !state.data.offers.length) return toast('Əvvəlcə axtarış edin');
    const text = quoteText(selectedOffers());
    $('#modalBody').innerHTML = `<h3>Müştəriyə kommersiya təklifi</h3>
      <p class="muted" style="margin-top:-6px">Seçilməyibsə, avtomatik ən ucuz 3 variant götürülür. Operator adları müştəriyə göstərilmir.</p>
      <textarea class="quote" id="quoteText">${esc(text)}</textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">
        <button class="btn secondary sm" data-close>Bağla</button>
        <button class="btn secondary sm" id="copyQuote">Kopyala</button>
        <a class="btn sm primary" id="waQuote" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center">WhatsApp-da göndər</a>
      </div>`;
    $('#waQuote').href = 'https://wa.me/?text=' + encodeURIComponent(text);
    $('#copyQuote').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#quoteText').value); toast('Kopyalandı'); } catch { $('#quoteText').select(); } });
    $('#modal').classList.add('open');
  });
  // Brendli seçim linki: operator adı və net qiymət müştəriyə göstərilmir
  $('#shareBtn').addEventListener('click', () => {
    if (!state.data || !state.data.offers.length) return toast('Əvvəlcə axtarış edin');
    const list = selectedOffers().slice(0, 10);
    $('#modalBody').innerHTML = `<h3>${esc(t('b2b_share_title'))}</h3>
      <p class="muted" style="margin-top:-6px">${esc(t('b2b_share_note'))} ${esc(t('b2b_need_select'))}</p>
      <table>${list.map((o) => `<tr><td>${esc(o.name)}</td><td>${fmtDate(o.checkIn)}</td><td style="text-align:right"><b>${money(withMarkup(o), 'AZN')}</b></td></tr>`).join('')}</table>
      <textarea id="shareMsg" rows="2" maxlength="400" placeholder="${esc(t('b2b_msg'))}"></textarea>
      <div id="shareOut"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">
        <button class="btn secondary sm" data-close>✕</button><button class="btn sm primary" id="shareCreate">${esc(t('b2b_create'))}</button></div>`;
    $('#modal').classList.add('open');
    $('#shareCreate').addEventListener('click', async (ev) => {
      ev.target.disabled = true;
      try {
        // Server qiymətləri öz axtarışından yenidən götürür: yalnız axtarış parametrləri və təklif id-ləri göndərilir.
        // Agentlik/menecer adı sessiyadan gəlir.
        const r = await postJson('/api/selections', {
          client: $('#client').value, clientId: $('#client').dataset.clientId || undefined, message: $('#shareMsg').value, markup: markup(),
          query: state.lastParams, offerIds: list.map((o) => o.id),
        });
        if (!/^\/s\/[A-Za-z0-9_-]{12}$/.test(r.url || '')) throw new Error('Gözlənilməz cavab');
        const url = location.origin + r.url;
        $('#shareOut').innerHTML = `<div class="share-link"><input id="shareUrl" readonly value="${esc(url)}" aria-label="URL">
          <button class="btn secondary sm" id="shareCopy">${esc(t('b2b_copy'))}</button>
          <a class="btn secondary sm" style="display:inline-flex;align-items:center" target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">${esc(t('b2b_open'))}</a>
          <a class="btn sm primary" style="display:inline-flex;align-items:center" target="_blank" rel="noopener noreferrer" id="shareWa">WhatsApp</a></div>`;
        $('#shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(url);
        $('#shareCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(url); toast('Kopyalandı'); } catch { $('#shareUrl').select(); } });
        ev.target.hidden = true;
      } catch (err) { if (!onAuthError(err)) toast(err.message); ev.target.disabled = false; }
    });
  });

  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });

  // CSV/formula injection qorunması: =,+,-,@ ilə başlayan xanalar Excel-də formul kimi icra olunmasın
  const csvCell = (c) => { let v = String(c ?? ''); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return v.replace(/"/g, '""'); };
  $('#csvBtn').addEventListener('click', () => {
    if (!state.data || !state.data.offers.length) return toast('Əvvəlcə axtarış edin');
    const head = ['Otel/Tur', 'İstiqamət', 'Rayon', 'Tur', 'Operator', 'Tarix', 'Uçuş saatı', 'Sinif', 'Gecə', 'Qida', 'Otaq', 'Yerləşmə', 'Ulduz',
      'Net qiymət (AZN)', 'Operator qiyməti', 'Operator valyutası', 'Müştəri qiyməti (AZN)', 'Qiymət növü', 'Otel yer', 'Reys yer (gediş)', 'Reys yer (dönüş)', 'Stop-sale', 'Status', 'Reytinq (demo)', 'Rəy sayı (demo)', 'Çimərlik xətti', 'Əsas məsafə (m)'];
    const rows = state.data.offers.map((o) => [o.name, o.destination.name, o.district || '', o.tourName || '', o.providerName, o.checkIn,
      o.flight ? o.flight.out.time : '', o.flight ? o.flight.cls : '', o.nights, o.board || '', o.room || '', o.accommodation || '', o.stars,
      o.price, o.opPrice ?? '', o.opCurrency || '', withMarkup(o), o.priceTypeLabel || '', o.hotelSeats || '',
      o.flight ? o.flight.out.seats : '', o.flight ? o.flight.back.seats : '', o.stopSale ? 'bəli' : '', o.availability,
      o.rating ?? '', o.reviewCount ?? '', o.location && o.location.line ? o.location.line : '', keyDist(o.location) ?? '']);
    const csv = '﻿' + [head, ...rows].map((r) => r.map((c) => `"${csvCell(c)}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `odiola-${state.data.query.checkIn}.csv`;
    a.click();
  });

  // Mobil üçün sağ paneli aşağı keçir
  const mq = matchMedia('(max-width: 980px)');
  const fit = () => { $('#mainGrid').style.gridTemplateColumns = mq.matches ? '1fr' : '1fr 240px'; };
  mq.addEventListener('change', fit); fit();
})();
