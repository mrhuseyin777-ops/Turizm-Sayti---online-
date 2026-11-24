// B2C axtarış səhifəsi
(async function () {
  const $ = (s) => document.querySelector(s);
  const cfg = await api('/api/config');
  const provById = Object.fromEntries(cfg.providers.map((p) => [p.id, p]));
  // mode: 'search' (istiqamət üzrə) | 'explore' ("Hara gedə bilərəm?")
  // view: 'cards' | 'table'; group: cədvəldə otel üzrə ən ucuz (true) və ya bütün təkliflər
  const state = { type: 'package', region: '', currency: store.get('currency', 'AZN'), last: null, mode: 'search', view: store.get('view', 'cards'), group: true, facetFor: '' };
  const TABLE_LIMIT = 300;
  $('#year').textContent = new Date().getFullYear();

  // Valyuta
  $('#currency').innerHTML = cfg.currencies.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#currency').value = state.currency;
  $('#currency').addEventListener('change', (e) => { state.currency = e.target.value; store.set('currency', state.currency); if (state.last) run(); loadLastMinute(); });

  // Tarix aralığı (gediş -dan / -dək) və gecə aralığı
  $('#checkIn').value = defaultDate(30);
  $('#checkInTo').value = defaultDate(36);
  $('#checkIn').min = defaultDate(0);
  const range = bindRangeInputs({ from: $('#checkIn'), to: $('#checkInTo'), nFrom: $('#nights'), nTo: $('#nightsTo') }, cfg.searchLimits);
  $('#dateQuick').addEventListener('click', (e) => { const b = e.target.closest('[data-span]'); if (b) range.quick(b.dataset.span); });
  autocomplete($('#dest'));

  // Uşaq yaşları
  const syncChildAges = () => renderChildAges($('#childAges'), $('#children').value, readChildAges($('#childAges')));
  $('#children').addEventListener('change', syncChildAges);

  // Rayon və otel multi-select-ləri (siyahı axtarış nəticəsindən dolur)
  const districtMs = msCreate($('#districtMs'), { title: 'f_district' });
  const hotelMs = msCreate($('#hotelMs'), { title: 'f_hotel', onlySelToggle: true });
  let msT;
  $('#filters').addEventListener('mschange', () => { clearTimeout(msT); msT = setTimeout(run, 250); });
  $('#attrFilter').innerHTML = HOTEL_ATTR_KEYS.map((a) => `<label class="chk"><input type="checkbox" name="attrs" value="${a}"> <span data-i18n="attr_${a}">${esc(t('attr_' + a))}</span></label>`).join('');

  // Statik bloklar (dil dəyişəndə yenidən çəkilir)
  function renderStatic() {
    $('#payStrip').innerHTML = paymentStripHtml();
    $('#lastMinLabel').textContent = t('f_lastmin', { n: cfg.lastMinuteDays });
    $('#lastMinSub').textContent = t('lastmin_sub', { n: cfg.lastMinuteDays });
    $('#dest').title = t('explore_hint');
    $('#homeCallbackForm').innerHTML = callbackFormHtml('homeCbForm');
    bindCallbackForm($('#homeCbForm'), () => 'Ana səhifə');
    msRender(districtMs); msRender(hotelMs);
    syncChildAges();
  }
  renderStatic();

  // ♥ Seçilmişlər, müqayisə, son baxılanlar, əlaqə paneli (public/js/extras.js)
  const X = window.Odx;
  X.mountUi(cfg, { openHotel: (id, opener) => openHotel(id, opener) });
  $('#shareBtn').addEventListener('click', () => X.share({ title: t('share_title_res'), url: location.href }));

  // Görünüş: Kartlar / Cədvəl + Qruplaşdır
  function syncView() {
    document.querySelectorAll('#viewSeg [data-view]').forEach((x) => x.classList.toggle('active', x.dataset.view === state.view));
    $('#groupWrap').hidden = state.view !== 'table';
  }
  syncView();
  $('#viewSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-view]'); if (!b || b.dataset.view === state.view) return;
    state.view = b.dataset.view; store.set('view', state.view); syncView();
    if (state.last) run();
  });
  $('#groupBy').addEventListener('change', () => { state.group = $('#groupBy').checked; if (state.last) render(state.last); });

  // Tablar və region
  // Hər tabın öz görünüşü: izah, tarix etiketi, gecə sahəsi, region, populyar istiqamətlər, ana səhifə bölməsi
  const POPULAR = {
    package: [['antalya', 'Antalya'], ['dubai', 'Dubay'], ['sharm', 'Şarm-əl-Şeyx'], ['bodrum', 'Bodrum'], ['istanbul', 'İstanbul'], ['batumi', 'Batumi']],
    hotel: [['antalya', 'Antalya'], ['istanbul', 'İstanbul'], ['dubai', 'Dubay'], ['qabala', 'Qəbələ'], ['shahdag', 'Şahdağ'], ['baku', 'Bakı']],
    tour: [['tbilisi', 'Tbilisi'], ['istanbul', 'İstanbul'], ['dubai', 'Dubay'], ['sheki', 'Şəki'], ['shahdag', 'Şahdağ'], ['lankaran', 'Lənkəran']],
  };
  function applyTypeUi() {
    const type = state.type;
    $('#tabHint').textContent = t('hint_' + type);
    $('#dateLabel').textContent = t('date_' + type);
    $('#nightsField').hidden = type === 'tour'; // ekskursiya turlarının müddəti sabitdir
    const dom = $('#regionSeg [data-region="domestic"]');
    dom.hidden = type === 'package'; // daxili istiqamətlərdə aviabiletli paket yoxdur
    if (type === 'package' && state.region === 'domestic') $('#regionSeg [data-region=""]').click();
    $('#popularList').innerHTML = POPULAR[type].map(([id, name]) => `<button type="button" data-q="${esc(id)}">${esc(name)}</button>`).join('');
    $('#lastMinBtn').hidden = type === 'tour';
  }
  function setType(type) {
    const changed = state.type !== type;
    document.querySelectorAll('#typeTabs .tab').forEach((x) => x.classList.toggle('active', x.dataset.type === type));
    state.type = type;
    renderOpFilter();
    applyTypeUi();
    if (changed) loadLastMinute();
  }
  $('#typeTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    setType(b.dataset.type);
    if (state.last) run();
  });
  $('#regionSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]'); if (!b) return;
    document.querySelectorAll('#regionSeg button').forEach((x) => x.classList.toggle('active', x === b));
    state.region = b.dataset.region;
  });
  $('#popularList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    $('#dest').value = b.textContent; $('#dest').dataset.id = b.dataset.q;
    run();
  });
  // "Hara gedə bilərəm?" — istiqaməti təmizlə və büdcə/tarixə görə bütün istiqamətlər
  $('#exploreBtn').addEventListener('click', () => { $('#dest').value = ''; delete $('#dest').dataset.id; run(); });
  // "Son dəqiqə" — yaxın 14 gün, istiqamətsiz
  const goLastMinute = () => { $('#dest').value = ''; delete $('#dest').dataset.id; $('#lastMinuteOnly').checked = true; run(); };
  $('#lastMinBtn').addEventListener('click', goLastMinute);
  $('#lastMinAll').addEventListener('click', goLastMinute);

  // Filtrlər
  $('#starFilter').innerHTML = [5, 4, 3].map((s) => `<label class="chk"><input type="checkbox" name="stars" value="${s}"> <span class="stars">${starStr(s)}</span></label>`).join('');
  $('#boardFilter').innerHTML = Object.entries(cfg.boards).map(([k, v]) => `<label class="chk"><input type="checkbox" name="boards" value="${esc(k)}"> ${esc(v)} <small class="muted">${esc(k)}</small></label>`).join('');
  function renderOpFilter() {
    $('#opFilter').innerHTML = cfg.providers.filter((p) => p.sells.includes(state.type))
      .map((p) => `<label class="chk"><input type="checkbox" name="providers" value="${esc(p.id)}"> <span class="dot" style="background:${esc(p.color)}"></span> ${esc(p.name)}</label>`).join('');
  }
  renderOpFilter();
  // rəqəm sahələri yalnız debounce ilə (blur zamanı "change" ikinci axtarış yaratmasın)
  $('#filters').addEventListener('change', (e) => { if (e.target.type !== 'number') run(); });
  let pt; $('#filters').addEventListener('input', (e) => { if (e.target.type === 'number') { clearTimeout(pt); pt = setTimeout(run, 400); } });
  $('#sort').addEventListener('change', () => run());
  $('#toggleFilters').addEventListener('click', () => $('#filters').classList.toggle('open'));
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  document.addEventListener('langchange', () => { renderStatic(); applyTypeUi(); if (state.last) render(state.last); if (lastMinData) renderLastMinute(lastMinData); });

  const checked = (name) => [...document.querySelectorAll(`#filters input[name="${name}"]:checked`)].map((i) => i.value).filter(Boolean).join(',');

  function params() {
    const budget = $('#budget').value;
    const maxF = $('#maxPrice').value;
    const ages = readChildAges($('#childAges'));
    // İstiqamət və ya axtarış növü dəyişibsə, əvvəlki rayon/otel seçimi artıq aid deyil
    const facetKey = `${$('#dest').dataset.id || $('#dest').value.trim().toLowerCase()}|${state.type}`;
    if (state.facetFor && state.facetFor !== facetKey) { msSetSelected(districtMs, []); msSetSelected(hotelMs, []); msSetItems(districtMs, []); msSetItems(hotelMs, []); }
    state.facetFor = facetKey;
    return {
      q: $('#dest').value.trim(), destinationId: $('#dest').dataset.id || '', type: state.type, region: state.region,
      checkIn: $('#checkIn').value, checkInTo: $('#checkInTo').value, nights: $('#nights').value, nightsTo: $('#nightsTo').value,
      adults: $('#adults').value, children: String(ages.length), childAges: ages.join(','),
      maxPrice: maxF || budget, minPrice: $('#minPrice').value, stars: checked('stars'), boards: checked('boards'),
      providers: checked('providers'), earlyOnly: $('#earlyOnly').checked ? '1' : '', sort: $('#sort').value, currency: state.currency,
      prepay: checked('prepay'), freeCancel: $('#freeCancel').checked ? '1' : '', lastMinute: $('#lastMinuteOnly').checked ? '1' : '',
      districts: msValue(districtMs).join(','), hotels: msValue(hotelMs).join(','), attrs: checked('attrs'),
      minRating: checked('minRating'), beachLines: checked('beachLines'), maxDist: $('#maxDist').value,
      seatsOnly: $('#seatsOnly').checked ? '1' : '', noStopSale: $('#noStopSale').checked ? '1' : '0', instantOnly: $('#instantOnly').checked ? '1' : '',
      view: state.view === 'table' ? 'table' : '',
    };
  }

  async function run(opts = {}) {
    range.fix();
    const p = params();
    state.mode = p.q ? 'search' : 'explore';
    if (state.mode === 'explore') { delete p.q; delete p.destinationId; p.anywhere = '1'; }
    $('#intro').hidden = true; $('#resultsLayout').hidden = false;
    $('#sort').hidden = state.mode === 'explore';
    $('#viewSeg').hidden = state.mode === 'explore';
    $('#groupWrap').hidden = state.mode === 'explore' || state.view !== 'table';
    $('#results').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${esc(t('searching'))}</p>`;
    history.replaceState(null, '', '?' + new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString());
    const req = { ...p };
    delete req.view;
    if (state.mode === 'search' && state.view === 'table') { req.flat = '1'; req.limit = String(TABLE_LIMIT); }
    if (opts.refresh) req.refresh = '1';
    try {
      const data = await api(state.mode === 'explore' ? '/api/explore' : '/api/search', req);
      state.last = data;
      render(data);
      if (!opts.refresh && !opts.noScroll && matchMedia('(max-width: 980px)').matches) $('#resultsLayout').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      $('#results').innerHTML = `<div class="panel empty">${esc(err.message)}</div>`;
    }
  }

  // Mənbələr: hər operator üçün "X dəq əvvəl yoxlanılıb" + Yenilə
  function renderSources(data) {
    $('#sources').innerHTML = data.sources.map((s) => `<span class="src" title="${esc(s.checkedAt ? new Date(s.checkedAt).toLocaleString() : '')}"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${esc(s.color)}"></span>${esc(s.name)} <b>${s.count}</b> <span class="ago">· ${esc(s.ok ? checkedAgo(s.checkedAt, data.serverTime) : '—')}</span></span>`).join('')
      + (data.sources.length ? `<button type="button" class="src-refresh" id="refreshBtn">${esc(t('refresh'))}</button>` : '');
    const rb = $('#refreshBtn'); if (rb) rb.addEventListener('click', () => run({ refresh: true }));
    $('#rateLine').innerHTML = rateLineHtml(data.operatorRate || cfg.operatorRate);
  }

  // Boş nəticə: səbəb + alternativlər (tur paketi / otel / filtri yumşalt) + geri zəng forması
  function emptyState(data, cur) {
    return `<div class="panel empty">${emptyDiagnosisHtml(data, cur)}
      <div style="max-width:720px;margin:20px auto 0;text-align:left"><b>${esc(t('cb_title'))}</b><p class="muted" style="margin:4px 0 0">${esc(t('cb_sub'))}</p>${callbackFormHtml('emptyCbForm')}</div></div>`;
  }
  const queryContext = () => {
    const q = state.last && state.last.query;
    if (!q) return '';
    return `${$('#dest').value.trim() || 'Hara gedə bilərəm?'} · ${q.type} · ${q.dateFrom || q.checkIn}–${q.dateTo || ''} · ${q.nightsFrom || q.nights}-${q.nightsTo || q.nights}g · ${q.adults}+${(q.childAges || []).join('/') || 0} · ${$('#budget').value || '-'}`.slice(0, 300);
  };
  function bindEmpty() { const f = $('#emptyCbForm'); if (f) bindCallbackForm(f, queryContext); }

  function updateFacets(data) {
    const f = data.facets || { districts: [], hotels: [] };
    msSetItems(districtMs, f.districts.map((d) => ({ id: d.id, label: d.name, sub: d.destination || '', count: d.count })));
    msSetItems(hotelMs, f.hotels.map((h) => ({ id: h.id, label: `${h.name}${h.stars ? ' ' + h.stars + '*' : ''}`, sub: h.district || '', count: h.count })));
    $('#districtMs').closest('.group').hidden = !f.districts.length;
  }

  function render(data) {
    if (data.destinations) return renderExplore(data);
    const cur = data.query.currency;
    const q = data.query;
    const destNames = [...new Set(data.groups.map((g) => g.destination.name))].join(', ') || $('#dest').value;
    const dates = q.dateFrom === q.dateTo ? fmtDate(q.dateFrom) : `${fmtDate(q.dateFrom)} – ${fmtDate(q.dateTo)}`;
    const nights = q.nightsFrom === q.nightsTo ? t('nights_n', { n: q.nightsFrom }) : t('nights_n', { n: `${q.nightsFrom}–${q.nightsTo}` });
    $('#resTitle').textContent = `${destNames} · ${dates} · ${nights}`;
    $('#resSub').textContent = data.stats ? t('results', { n: data.stats.hotels, o: data.stats.count }) + ` · ${money(data.stats.min, cur)} – ${money(data.stats.max, cur)}` : '';
    renderSources(data);
    updateFacets(data);
    loadCalendar(q);

    if (!data.groups.length) { $('#results').innerHTML = emptyState(data, cur); bindEmpty(); return; }
    if (state.view === 'table') return renderTable(data);

    const pax = q.adults + q.children;
    const favIds = new Set(X.favs.list().map((x) => x.id));
    $('#results').innerHTML = data.groups.slice(0, 60).map((g, i) => {
      const b = g.best;
      return `<article class="card">
        <div class="img" data-gslot="${i}" style="background:${gradFor(g.itemId)}"><span class="rank">#${i + 1}</span>${g.itemType === 'hotel' ? X.heartHtml(g.itemId, favIds.has(g.itemId), 'fav-card') : ''}<span class="img-cap">${esc(g.destination.name)}${g.district ? ' · ' + esc(g.district) : ''}, ${esc(g.destination.country)}</span></div>
        <div class="body">
          <h3>${g.itemType === 'hotel' ? `<button type="button" class="hd-link" data-hotel="${i}" title="${esc(t('hd_open'))}">${esc(g.name)}</button>` : esc(g.name)} <span class="stars">${starStr(g.stars)}</span></h3>
          <div class="muted" style="font-size:14px">${fmtDate(b.checkIn)} · ${esc(t('nights_n', { n: b.nights }))}${b.boardLabel ? ' · ' + esc(b.boardLabel) : ''}${g.includesFlight ? ' · ✈ ' + esc(t('flight_incl')) : ''}</div>
          <div class="offer-meta">${b.room || b.accommodation ? `<span>🛏 ${esc(roomText(b))}</span>` : ''}${b.flight ? `<span>${esc(flightText(b))}</span>` : ''}${b.tourName ? `<span class="muted">${esc(b.tourName)}</span>` : ''}</div>
          <div class="badges">
            ${ratingHtml(g)}
            ${locationBadge(g.location)}
            ${attrBadges(g.attrs)}
            ${b.priceType && b.priceType !== 'STD' ? `<span class="badge ${b.priceType === 'EB' ? 'early' : 'spo'}">${esc(priceTypeText(b))}</span>` : ''}
            ${b.lastMinute ? `<span class="badge hot">${esc(t('lastmin_badge'))}</span>` : ''}
            ${termBadges(b)}
            ${g.tags.slice(0, 3).map((x) => `<span class="badge">${esc(x)}</span>`).join('')}
          </div>
          ${seatsHtml(b)}
          <ol class="compare rank-list" aria-label="${esc(t('rank_title'))}">
            ${g.providers.map((o, j) => `<li class="rank-row ${j === 0 ? 'best' : ''}">
              <span class="rk">${j + 1}</span>
              <span class="rk-op"><button type="button" class="op" data-trust="${esc(o.providerId)}" data-card="${i}" aria-expanded="false" title="${esc(t('trust_hint'))}"><span class="dot" style="background:${esc(o.providerColor)}"></span>${esc(o.providerName)}</button>
                <small class="muted">${fmtDate(o.checkIn)}${o.board ? ' · ' + esc(o.board) : ''}${roomText(o) ? ' · ' + esc(roomText(o)) : ''}</small></span>
              <span class="rk-price"><b>${money(o.price, cur)}</b><small class="${j === 0 ? 'good' : 'muted'}">${j === 0 ? esc(t('rank_cheapest')) : '+' + money(o.price - g.best.price, cur)}</small>${j > 0 ? opLinkHtml(o, true) : ''}</span>
            </li>`).join('')}
          </ol>
          <div class="trust-slot" data-slot="${i}"></div>
        </div>
        <div class="price">
          <div>
            <div class="from">${esc(t('cheapest_at', { op: b.providerName }))}</div>
            ${b.oldPrice ? `<div class="old">${money(b.oldPrice, cur)}</div>` : ''}
            <div class="amount">${money(b.price, cur)}</div>
            <div class="from">${esc(t('per_total', { pax }))}</div>
            ${g.savings > 0 ? `<div class="save">${esc(t('save', { n: money(g.savings, cur) }))}</div>` : ''}
            ${planHtml(b.plan, cur)}
          </div>
          <button class="btn sm" data-book="${i}">${esc(t('book'))}</button>
          ${g.itemType === 'hotel' ? `<button type="button" class="btn secondary sm" data-hotel="${i}">${esc(t('hd_more'))}</button>
          <label class="chk cmp-chk"><input type="checkbox" data-cmp-id="${esc(g.itemId)}" data-cmp="${i}" ${X.compare.has(g.itemId) ? 'checked' : ''}> <span>${esc(t('cmp_add'))}</span></label>` : ''}
          ${opLinkHtml(b)}
          <a style="font-size:13px" href="/cars.html?loc=${encodeURIComponent(g.destination.id)}&amp;from=${esc(b.checkIn)}&amp;to=${new Date(Date.parse(b.checkIn) + Math.max(1, b.nights) * 864e5).toISOString().slice(0, 10)}">🚗 Maşın əlavə et</a>
        </div>
      </article>`;
    }).join('');
    mountGalleries(data.groups.slice(0, 60));
  }

  // Otel qalereyası (illüstrasiya; real foto feed-dən gələndə g.images ilə avtomatik əvəzlənir)
  function mountGalleries(shown) {
    if (!window.mountGallery) return;
    document.querySelectorAll('#results [data-gslot]').forEach((el) => {
      const g = shown[+el.dataset.gslot];
      if (g) window.mountGallery(el, { id: g.itemId, destinationId: g.destination.id, region: g.destination.region, stars: g.stars, tags: g.tags, name: g.name, images: g.images });
    });
  }

  // "Operatorun saytında yoxla" — yalnız operatorun ictimai axtarış səhifəsinə link (qiymət fərqli ola bilər)
  function opLinkHtml(o, short) {
    if (!o || !o.operatorLink || !/^https:\/\//.test(o.url || '')) return '';
    const label = short ? t('op_link_short') : t('op_link', { op: o.providerName });
    return `<a class="op-link" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer" title="${esc(t('op_link', { op: o.providerName }))} — ${esc(t('op_link_hint'))}">${esc(label)} ↗</a>`;
  }

  // Cədvəl görünüşü (operator saytlarındakı kimi): tarix+uçuş, tur, gecə, otel (rayon), yer, qida,
  // otaq/yerləşmə, qiymət, qiymət növü, operator. Qruplaşdır = hər otel üçün ən ucuz təklif.
  function renderTable(data) {
    const cur = data.query.currency;
    const rows = state.group || !data.offers ? data.groups.map((g) => g.best) : data.offers;
    const shown = rows.slice(0, TABLE_LIMIT);
    state.tableRows = shown;
    const head = ['col_date', 'col_tour', 'col_nights', 'col_hotel', 'col_seats', 'col_board', 'col_room', 'col_price', 'col_ptype', 'col_op', ''];
    $('#results').innerHTML = `<div class="table-wrap"><table class="grid op-table"><thead><tr>${head.map((k) => `<th>${k ? esc(t(k)) : ''}</th>`).join('')}</tr></thead><tbody>
      ${shown.map((o, i) => `<tr class="${o.stopSale ? 'stop' : ''}">
        <td>${esc(fmtDate(o.checkIn))}${o.flight ? `<br><small class="muted">✈ ${esc(o.flight.out.time)} · ${esc(t('cls_' + o.flight.cls))}</small>` : ''}</td>
        <td class="wrap"><small>${esc(o.tourName || '')}</small></td>
        <td class="num">${esc(o.nights)}</td>
        <td class="wrap"><b>${esc(o.name)}</b> <span class="stars">${starStr(o.stars)}</span>${o.district ? `<br><small class="muted">(${esc(o.district)})</small>` : ''}<div class="badges tight">${attrBadges(o.attrs)}${locationBadge(o.location)}</div>${o.rating != null ? `<small class="muted">${esc(ratingText(o))}</small>` : ''}</td>
        <td>${seatsHtml(o)}</td>
        <td>${esc(o.board || '—')}</td>
        <td class="wrap"><small>${esc(roomText(o))}</small></td>
        <td class="num"><b>${money(o.price, cur)}</b>${o.oldPrice ? `<br><small class="old">${money(o.oldPrice, cur)}</small>` : ''}${o.opCurrency && o.opCurrency !== cur ? `<br><small class="muted">${money(o.opPrice, o.opCurrency)}</small>` : ''}</td>
        <td class="wrap"><small>${esc(priceTypeText(o))}</small></td>
        <td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}${o.operatorLink ? '<br>' + opLinkHtml(o) : ''}</td>
        <td><button type="button" class="btn sm" data-book-row="${i}">${esc(t('book'))}</button></td>
      </tr>`).join('')}</tbody></table></div>
      ${rows.length > TABLE_LIMIT || data.offersTruncated ? `<p class="muted" style="font-size:13px">${esc(t('table_more', { n: TABLE_LIMIT }))}</p>` : ''}`;
  }

  // İstiqamət kartları (ucuzdan bahalıya)
  function destCardsHtml(list, cur, max = 60) {
    return list.slice(0, max).map((d, i) => {
      const b = d.best;
      return `<button type="button" class="dest-card" data-dest="${esc(d.destination.id)}" data-checkin="${esc(b.checkIn)}" data-name="${esc(d.destination.name)}">
        <div class="img" style="background:${gradFor(d.destination.id)}"><span class="rank">#${i + 1}</span><b>${esc(d.destination.name)}</b><small>${esc(d.destination.country)}</small></div>
        <div class="b">
          <span class="muted" style="font-size:12px">${esc(t('from_price'))}</span>
          <span class="amount">${money(d.minPrice, cur)}</span>
          <span style="font-size:13px">${esc(b.name)} <span class="stars">${starStr(b.stars)}</span></span>
          <span class="muted" style="font-size:12px">${fmtDate(b.checkIn)} · ${esc(t('nights_n', { n: b.nights }))}${b.board ? ' · ' + esc(b.board) : ''} · ${esc(t('dest_meta', { h: d.items, p: d.providers }))}</span>
          <span class="badges">${b.lastMinute ? `<span class="badge hot">${esc(t('lastmin_badge'))}</span>` : ''}${d.earlyBooking ? `<span class="badge early">${esc(t('early'))}</span>` : ''}${termBadges(b)}</span>
          ${planHtml(b.plan, cur)}
        </div></button>`;
    }).join('');
  }

  function renderExplore(data) {
    const q = data.query;
    const cur = q.currency;
    $('#resTitle').textContent = t('explore_title', { date: q.dateFrom === q.dateTo ? fmtDate(q.dateFrom) : `${fmtDate(q.dateFrom)} – ${fmtDate(q.dateTo)}`, flex: q.flex, n: q.nightsFrom === q.nightsTo ? q.nightsFrom : `${q.nightsFrom}–${q.nightsTo}` });
    $('#resSub').textContent = t('explore_sub', { n: data.destinations.length, budget: q.maxPrice != null ? t('budget_upto', { b: money(q.maxPrice, cur) }) : t('budget_none') });
    renderSources(data);
    $('#calWrap').hidden = true;
    if (!data.destinations.length) { $('#results').innerHTML = emptyState(data, cur); bindEmpty(); return; }
    $('#results').innerHTML = `<p class="muted" style="margin-top:0">${esc(t('explore_hint'))}</p><div class="dest-grid">${destCardsHtml(data.destinations, cur)}</div>`;
  }

  // İstiqamət kartına klik → həmin istiqamətə axtarış (ən ucuz təklifin tarixi ilə)
  function openDest(card) {
    $('#dest').value = card.dataset.name; $('#dest').dataset.id = card.dataset.dest;
    if (card.dataset.checkin) { $('#checkIn').value = card.dataset.checkin; $('#checkInTo').value = card.dataset.checkin; }
    run();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Ana səhifədə "Son dəqiqə" bölməsi
  let lastMinData = null;
  function renderLastMinute(data) {
    const type = data.query.type || 'package';
    $('#lastMinTitle').textContent = t('lm_title_' + type);
    $('#lastMinSection').hidden = !data.destinations.length;
    $('#lastMinGrid').innerHTML = destCardsHtml(data.destinations, data.query.currency, 6);
  }
  async function loadLastMinute() {
    try {
      const type = state.type;
      const data = await api('/api/explore', { type, lastMinute: '1', nights: type === 'hotel' ? 3 : 7, adults: 2, currency: state.currency, checkIn: defaultDate(7) });
      if (type !== state.type) return; // tab bu arada dəyişib
      lastMinData = data;
      renderLastMinute(lastMinData);
    } catch { /* bölmə gizli qalır */ }
  }
  $('#lastMinGrid').addEventListener('click', (e) => {
    const c = e.target.closest('[data-dest]'); if (!c) return;
    $('#lastMinuteOnly').checked = true;
    openDest(c);
  });

  // Boş nəticə tövsiyəsi: filtri yumşalt
  function relaxFilter(key, value) {
    const uncheck = (name) => document.querySelectorAll(`#filters input[name="${name}"]`).forEach((i) => { i.checked = false; });
    switch (key) {
      case 'maxPrice': $('#maxPrice').value = ''; $('#budget').value = value || ''; break;
      case 'minPrice': $('#minPrice').value = ''; break;
      case 'stars': case 'boards': case 'providers': case 'attrs': uncheck(key); break;
      case 'prepay': $('#filters input[name="prepay"][value=""]').checked = true; break;
      case 'earlyOnly': $('#earlyOnly').checked = false; break;
      case 'freeCancel': $('#freeCancel').checked = false; break;
      case 'lastMinute': $('#lastMinuteOnly').checked = false; break;
      case 'seatsOnly': case 'noStopSale': case 'instantOnly': $('#' + key).checked = false; break;
      case 'minRating': $('#ratingFilter input[value=""]').checked = true; break;
      case 'beachLines': uncheck('beachLines'); break;
      case 'maxDist': $('#maxDist').value = ''; break;
      case 'districts': msSetSelected(districtMs, []); break;
      case 'hotels': msSetSelected(hotelMs, []); break;
      default: break;
    }
    run({ noScroll: true });
  }

  function openLead(g, offer) {
    const cur = offer.currency || state.last.query.currency;
    $('#modalBody').innerHTML = `
      <h3>${esc(t('lead_title'))}: ${esc(g.name)}</h3>
      <table>${g.providers.map((o) => `<tr><td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}</td><td>${fmtDate(o.checkIn)}</td><td>${esc(o.board || '')}</td><td style="text-align:right"><b>${money(o.price, cur)}</b></td></tr>`).join('')}</table>
      ${offer.room || offer.accommodation ? `<p class="muted" style="margin:0 0 6px;font-size:13px">🛏 ${esc(roomText(offer))}${offer.flight ? ' · ' + esc(flightText(offer)) : ''} · ${esc(priceTypeText(offer))}</p>` : ''}
      <div class="badges">${termBadges(offer)}</div>
      <form id="leadForm">
        <input name="name" required maxlength="80" placeholder="${esc(t('lead_name'))}">
        <input name="phone" required maxlength="30" placeholder="${esc(t('lead_phone'))}" inputmode="tel">
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('lead_note'))}"></textarea>${HONEYPOT_HTML}
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>✕</button><button class="btn sm">${esc(t('lead_send'))}</button></div>
        ${consentHtml()}
      </form>`;
    $('#modal').classList.add('open');
    $('#leadForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(ev.target));
      try {
        await postJson('/api/leads', { ...fd, type: 'offer', offerId: offer.id });
        $('#modal').classList.remove('open'); toast(t('lead_ok'));
      } catch (err) { toast(err.message); }
    });
  }

  $('#results').addEventListener('click', (e) => {
    const fv = e.target.closest('[data-fav-id]');
    if (fv && state.last && state.last.groups) {
      e.stopPropagation();
      const g = state.last.groups.find((x) => x.itemId === fv.dataset.favId);
      if (g) toast(t(X.favs.toggle(favMeta(g.itemId, g.name, g.stars, g.destination, g.district, g.best.price)) ? 'fav_added' : 'fav_removed'));
      return;
    }
    const dc = e.target.closest('.dest-card');
    if (dc) { openDest(dc); return; }
    // Boş nəticə düymələri
    const sw = e.target.closest('[data-switch-type]');
    if (sw) { setType(sw.dataset.switchType); run({ noScroll: true }); return; }
    const gd = e.target.closest('[data-go-dest]');
    if (gd) { $('#dest').value = gd.dataset.goName; $('#dest').dataset.id = gd.dataset.goDest; run({ noScroll: true }); return; }
    const rx = e.target.closest('[data-relax]');
    if (rx) { relaxFilter(rx.dataset.relax, rx.dataset.value); return; }
    // Operator adına klik → etibar paneli
    const op = e.target.closest('[data-trust]');
    if (op) {
      const slot = $(`[data-slot="${op.dataset.card}"]`);
      const open = op.getAttribute('aria-expanded') === 'true';
      op.closest('.compare').querySelectorAll('[data-trust]').forEach((x) => x.setAttribute('aria-expanded', 'false'));
      const p = provById[op.dataset.trust];
      slot.innerHTML = !open && p ? trustPanelHtml(p) : '';
      if (!open) op.setAttribute('aria-expanded', 'true');
      return;
    }
    const hb = e.target.closest('[data-hotel]');
    if (hb) { const g = state.last.groups[+hb.dataset.hotel]; if (g) openHotel(g.itemId, hb); return; }
    const row = e.target.closest('[data-book-row]');
    if (row) {
      const o = state.tableRows[+row.dataset.bookRow];
      const g = state.last.groups.find((x) => x.itemId === o.itemId);
      if (o && g) openLead(g, o);
      return;
    }
    const btn = e.target.closest('[data-book]'); if (!btn) return;
    const g = state.last.groups[+btn.dataset.book];
    openLead(g, g.best);
  });
  // "Müqayisə et" checkbox → müqayisə siyahısı (maks. 3; artıq doludursa checkbox geri açılır)
  $('#results').addEventListener('change', (e) => {
    const c = e.target.closest('[data-cmp-id]'); if (!c || !state.last || !state.last.groups) return;
    const g = state.last.groups[+c.dataset.cmp];
    if (!g || g.itemId !== c.dataset.cmpId) return;
    const has = X.compare.has(g.itemId);
    if (c.checked !== has) X.compare.toggle(X.snapFromGroup(g, state.last.query.currency));
    c.checked = X.compare.has(g.itemId);
  });
  // Seçilmişlər üçün qısa meta: otel id + ad + istiqamət + son qiymət + axtarış parametrləri (şəxsi məlumat yox)
  function favMeta(id, name, stars, destination, district, price) {
    const hq = hotelQuery();
    return X.metaFrom({ id, name, stars, destination, district, price, cur: hq.currency, params: { type: hq.type, checkIn: hq.checkIn, checkInTo: hq.checkInTo, nights: hq.nights, nightsTo: hq.nightsTo, adults: hq.adults, childAges: hq.childAges } });
  }

  // ---- Qiymət təqvimi: seçilmiş istiqamət + gecə + nəfər üçün ±7 gün / ay üzrə hər gün ən ucuz qiymət (GET /api/tours/calendar)
  const cal = { key: '', seq: 0, mode: store.get('calMode', 'span') === 'month' ? 'month' : 'span', data: null, sel: null };
  function calTarget(q) {
    if (state.mode !== 'search' || !q || q.type === 'tour') return '';
    return $('#dest').dataset.id || (q.destinationIds && q.destinationIds.length === 1 ? q.destinationIds[0] : '');
  }
  function paintCalendar() {
    const wrap = $('#calWrap');
    wrap.innerHTML = X.calendarHtml(cal.data, cal.sel);
    wrap.hidden = false;
    const strip = wrap.querySelector('.cal-strip');
    const sel = strip && (strip.querySelector('.sel') || strip.querySelector('.cheapest'));
    if (sel) strip.scrollLeft = Math.max(0, sel.offsetLeft - strip.offsetLeft - (strip.clientWidth - sel.offsetWidth) / 2);
  }
  async function loadCalendar(q) {
    const wrap = $('#calWrap');
    const destId = calTarget(q);
    if (!destId) { wrap.hidden = true; cal.key = ''; return; }
    const req = {
      type: q.type, destinationId: destId, checkIn: q.dateFrom, nights: String(q.nightsFrom), adults: String(q.adults), children: String(q.children || 0),
      childAges: (q.childAges || []).filter((a) => a != null).join(','), currency: q.currency, noStopSale: q.noStopSale ? '1' : '0', mode: cal.mode,
    };
    cal.sel = { from: q.dateFrom, to: q.dateTo };
    const key = JSON.stringify(req);
    if (key === cal.key && cal.data) { paintCalendar(); return; }
    const seq = ++cal.seq;
    if (wrap.hidden || !cal.data) { wrap.innerHTML = `<p class="muted cal-loading">${esc(t('cal_loading'))}</p>`; wrap.hidden = false; }
    try {
      const data = await api('/api/tours/calendar', req);
      if (seq !== cal.seq) return;
      cal.key = key; cal.data = data;
      paintCalendar();
    } catch {
      if (seq === cal.seq) { wrap.hidden = true; cal.key = ''; }
    }
  }
  $('#calWrap').addEventListener('click', (e) => {
    const m = e.target.closest('[data-cal-mode]');
    if (m) {
      if (m.dataset.calMode === cal.mode) return;
      cal.mode = m.dataset.calMode; store.set('calMode', cal.mode);
      if (state.last && state.last.query) loadCalendar(state.last.query);
      return;
    }
    const d = e.target.closest('[data-cal-date]');
    if (!d || d.disabled || !cal.data) return;
    $('#checkIn').value = d.dataset.calDate; $('#checkInTo').value = d.dataset.calDate;
    $('#nights').value = String(cal.data.query.nights); $('#nightsTo').value = String(cal.data.query.nights);
    run({ noScroll: true });
  });

  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });

  // ---- Otel detal pəncərəsi: qalereya, təsvir (şablon, DEMO), olanaqlar, məsafələr, reytinq, qaydalar və
  // otaq tipi × qidalanma × operator qiymət cədvəli (GET /api/hotels/:id/offers — eyni axtarış parametrləri ilə).
  // A11y: role=dialog + aria-modal, Esc ilə bağlanır, Tab fokusu pəncərə daxilində saxlayır, bağlananda fokus geri qayıdır.
  const hd = { open: false, id: null, data: null, seq: 0, opener: null };
  const hdModal = $('#hotelModal');
  const hdBody = $('#hotelModalBody');
  // Sorğu: son axtarışın parametrləri (server cavabındakı normallaşdırılmış dəyərlər), yoxdursa formadan
  function hotelQuery() {
    const q = state.last && state.last.query && !state.last.destinations ? state.last.query : null;
    if (q) {
      return {
        type: q.type === 'tour' ? 'hotel' : q.type, checkIn: q.dateFrom, checkInTo: q.dateTo, nights: q.nightsFrom, nightsTo: q.nightsTo, adults: q.adults,
        childAges: (q.childAges || []).filter((a) => a != null).join(','), children: String(q.children || 0), currency: q.currency, providers: (q.providers || []).join(','), noStopSale: q.noStopSale ? '1' : '',
      };
    }
    const p = params();
    return { type: p.type === 'tour' ? 'hotel' : p.type, checkIn: p.checkIn, checkInTo: p.checkInTo, nights: p.nights, nightsTo: p.nightsTo, adults: p.adults, children: p.children, childAges: p.childAges, currency: p.currency, noStopSale: p.noStopSale };
  }
  function setHotelUrl(id) {
    try {
      const url = new URL(location.href);
      if (id) url.searchParams.set('hotel', id); else url.searchParams.delete('hotel');
      history.replaceState(null, '', url.pathname + url.search);
    } catch { /* köhnə brauzer */ }
  }
  const hdFocusables = () => [...hdBody.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
  const hdHead = (title) => `<div class="hd-head"><h3 id="hdTitle">${esc(title)}</h3><button type="button" class="hd-x" data-hd-close aria-label="${esc(t('hd_close'))}">✕</button></div>`;
  async function openHotel(id, opener) {
    if (!/^[a-z0-9-]{1,40}$/.test(id || '')) return;
    if (!hd.open) hd.opener = opener || document.activeElement;
    hd.open = true; hd.id = id; hd.data = null;
    const seq = ++hd.seq;
    setHotelUrl(id);
    hdBody.innerHTML = `${hdHead(t('hd_loading'))}<div class="spinner"></div>`;
    hdModal.classList.add('open');
    document.body.classList.add('no-scroll');
    hdBody.querySelector('[data-hd-close]').focus();
    try {
      const data = await api(`/api/hotels/${encodeURIComponent(id)}/offers`, hotelQuery());
      if (seq !== hd.seq || !hd.open) return;
      hd.data = data;
      renderHotel(data);
      hdBody.querySelector('[data-hd-close]').focus();
    } catch (err) {
      if (seq !== hd.seq || !hd.open) return;
      hdBody.innerHTML = hdHead(err.message);
      hdBody.querySelector('[data-hd-close]').focus();
    }
  }
  function closeHotel() {
    if (!hd.open) return;
    hd.open = false; hd.data = null; hd.seq++;
    hdModal.classList.remove('open');
    document.body.classList.remove('no-scroll');
    hdBody.innerHTML = '';
    setHotelUrl(null);
    const back = hd.opener; hd.opener = null;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus();
  }
  // Təsvir: şablon əsasında (real otel iddiası yoxdur) — "DEMO" qeydi ilə
  function hotelDescription(h, rows) {
    const loc = h.location || {};
    const vars = {
      name: h.name, dest: h.destination.name, district: h.district || h.destination.name, stars: h.stars, line: loc.line ? t('line_' + Math.min(3, loc.line)) : '',
      sea: distText(loc.seaM), center: distText(loc.centerM), lift: distText(loc.liftM),
    };
    const parts = [t(loc.kind === 'beach' ? 'desc_beach' : loc.kind === 'mountain' ? 'desc_mountain' : 'desc_city', vars)];
    const boards = [...new Set((rows.length ? rows.map((r) => r.board) : h.boards || []).filter(Boolean))];
    if (boards.length) parts.push(t('desc_boards', { b: boards.map((b) => `${cfg.boards[b] || b} (${b})`).join(', ') }));
    if (h.tags && h.tags.length) parts.push(t('desc_tags', { t: h.tags.join(', ') }));
    return parts.join(' ');
  }
  function renderHotel(data) {
    const h = data.hotel;
    const rows = data.rows || [];
    const cur = data.query.currency;
    const loc = h.location || {};
    const r = h.rules || {};
    const dl = (pairs) => `<dl class="hd-dl">${pairs.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
    const dists = [
      ['🏖', loc.seaM != null ? t('loc_sea', { d: distText(loc.seaM) }) + (loc.line ? ` (${t('line_' + Math.min(3, loc.line))})` : '') : ''],
      ['🚡', loc.liftM != null ? t('loc_lift', { d: distText(loc.liftM) }) : ''],
      ['📍', loc.centerM != null ? t('loc_center', { d: distText(loc.centerM) }) : ''],
      ['✈', loc.airportKm != null ? t('loc_airport', { d: `${loc.airportKm} km` }) : ''],
    ].filter(([, v]) => v);
    const childText = r.children === 'adults_only' ? t('ch_adults_only', { n: r.minAge || 18 }) : t('ch_' + (r.children || 'welcome'));
    const min = rows.length ? rows[0].price : 0;
    hdBody.innerHTML = `
      <div class="hd-head">
        <div><h3 id="hdTitle">${esc(h.name)} <span class="stars">${starStr(h.stars)}</span></h3>
          <div class="muted hd-sub">${esc(h.destination.name)}${h.district ? ' · ' + esc(h.district) : ''}, ${esc(h.destination.country)}</div></div>
        <div class="hd-head-acts">${X.heartHtml(h.id, X.favs.has(h.id), 'fav-hd')}<button type="button" class="btn secondary sm" data-hd-share>↗ ${esc(t('share'))}</button>
        <button type="button" class="hd-x" data-hd-close aria-label="${esc(t('hd_close'))}">✕</button></div>
      </div>
      <div class="hd-top">
        <div class="hd-gallery" style="background:${gradFor(h.id)}"></div>
        <div class="hd-info">
          <div class="badges">${ratingHtml(h)}${locationBadge(loc)}${attrBadges(h.attrs)}</div>
          <p class="hd-desc">${esc(hotelDescription(h, rows))}</p>
          <small class="muted">${esc(t('hd_desc_note'))} ${esc(t('hd_illus'))}</small>
          ${h.tags && h.tags.length ? `<h4>${esc(t('hd_amen'))}</h4><div class="badges">${h.tags.map((x) => `<span class="badge">${esc(x)}</span>`).join('')}</div>` : ''}
          ${X.reviewSummaryHtml(h)}
          ${dists.length ? `<h4>${esc(t('hd_dist'))} <span class="demo-tag" title="${esc(t('loc_demo_t'))}">demo</span></h4><ul class="hd-dists">${dists.map(([i, v]) => `<li><span aria-hidden="true">${i}</span> ${esc(v)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>
      <h4 class="hd-rooms-title">${esc(t('hd_rooms'))}</h4>
      ${data.stats ? `<p class="muted hd-count">${esc(t('hd_rows', { r: data.stats.rows, o: data.stats.offers }))}</p>` : ''}
      ${rows.length ? `<div class="hd-table-wrap"><table class="hd-table"><thead><tr>
          <th>${esc(t('hd_room'))}</th><th>${esc(t('hd_board'))}</th><th>${esc(t('hd_op'))}</th><th>${esc(t('hd_dates'))}</th><th>${esc(t('hd_terms'))}</th><th class="num">${esc(t('hd_price'))}</th><th></th></tr></thead><tbody>
        ${rows.map((o, j) => `<tr class="${j === 0 ? 'best' : ''}">
          <td data-label="${esc(t('hd_room'))}"><div class="hd-v">${esc(roomText(o))}</div></td>
          <td data-label="${esc(t('hd_board'))}"><div class="hd-v"><b>${esc(o.board || '—')}</b>${o.boardLabel ? ` <small class="muted">${esc(o.boardLabel)}</small>` : ''}</div></td>
          <td data-label="${esc(t('hd_op'))}"><div class="hd-v"><span class="dot" style="background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}</div></td>
          <td data-label="${esc(t('hd_dates'))}"><div class="hd-v">${esc(fmtDate(o.checkIn))} · ${esc(t('nights_n', { n: o.nights }))}${o.flight ? `<br><small class="muted">${esc(flightText(o))}</small>` : ''}</div></td>
          <td data-label="${esc(t('hd_terms'))}"><div class="hd-v"><div class="badges tight">${termBadges(o) || '—'}</div>${seatsHtml(o)}</div></td>
          <td data-label="${esc(t('hd_price'))}" class="num"><div class="hd-v"><b>${money(o.price, cur)}</b><br><small class="${j === 0 ? 'good' : 'muted'}">${j === 0 ? esc(t('hd_cheapest')) : '+' + money(o.price - min, cur)}</small></div></td>
          <td class="hd-act"><div class="hd-act-in"><button type="button" class="btn sm" data-hd-book="${j}">${esc(t('book'))}</button>${opLinkHtml(o)}</div></td>
        </tr>`).join('')}</tbody></table></div>` : `<div class="panel empty">${esc(t('hd_empty'))}</div>`}
      <h4>${esc(t('hd_rules'))}</h4>
      ${dl([[t('hd_checkin'), r.checkIn ? t('hd_checkin_v', { t: r.checkIn }) : ''], [t('hd_checkout'), r.checkOut ? t('hd_checkout_v', { t: r.checkOut }) : ''],
        [t('hd_children'), childText], [t('hd_pets'), r.pets ? t('pets_' + r.pets) : '']])}
      <p class="demo-note">${esc(t('hd_rules_note'))}</p>
      <div class="hd-foot"><button type="button" class="btn secondary sm" data-hd-copy>${esc(t('hd_copy'))}</button><button type="button" class="btn secondary sm" data-hd-close>${esc(t('hd_close'))}</button></div>`;
    // Son baxılanlar + seçilmişdə son görülən qiymət
    const meta = favMeta(h.id, h.name, h.stars, h.destination, h.district, min || null);
    X.recent.add(meta);
    X.favs.touch(meta);
    const gEl = hdBody.querySelector('.hd-gallery');
    if (window.mountGallery) window.mountGallery(gEl, { id: h.id, destinationId: h.destinationId, region: h.destination.region, stars: h.stars, tags: h.tags, name: h.name, images: h.images }, { eager: true });
  }
  hdModal.addEventListener('click', async (e) => {
    if (e.target === hdModal || e.target.closest('[data-hd-close]')) { closeHotel(); return; }
    const fv = e.target.closest('[data-fav-id]');
    if (fv && hd.data) {
      const h = hd.data.hotel;
      toast(t(X.favs.toggle(favMeta(h.id, h.name, h.stars, h.destination, h.district, hd.data.rows.length ? hd.data.rows[0].price : null)) ? 'fav_added' : 'fav_removed'));
      return;
    }
    if (e.target.closest('[data-hd-share]') && hd.data) { X.share({ title: t('share_title_hotel', { h: hd.data.hotel.name }), url: location.href }); return; }
    if (e.target.closest('[data-hd-copy]')) {
      try { await navigator.clipboard.writeText(location.href); toast(t('hd_copied')); } catch { toast(location.href); }
      return;
    }
    const bk = e.target.closest('[data-hd-book]');
    if (bk && hd.data) {
      const o = hd.data.rows[+bk.dataset.hdBook];
      if (!o) return;
      const same = hd.data.rows.filter((x) => x.room === o.room && x.board === o.board);
      const g = { name: hd.data.hotel.name, providers: same };
      closeHotel();
      openLead(g, o);
    }
  });
  hdModal.addEventListener('keydown', (e) => {
    if (!hd.open) return;
    if (e.key === 'Escape') { e.preventDefault(); closeHotel(); return; }
    if (e.key !== 'Tab') return;
    const f = hdFocusables();
    if (!f.length) { e.preventDefault(); return; }
    const first = f[0]; const last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !hdBody.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !hdBody.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('langchange', () => { if (hd.open && hd.data) renderHotel(hd.data); });

  // URL-dən axtarışı bərpa et (paylaşılan link)
  const u = new URLSearchParams(location.search);
  if (u.get('q') || u.get('anywhere')) {
    if (u.get('q')) { $('#dest').value = u.get('q'); if (u.get('destinationId')) $('#dest').dataset.id = u.get('destinationId'); }
    for (const k of ['checkIn', 'checkInTo', 'nights', 'nightsTo', 'adults', 'children']) if (u.get(k)) $('#' + k).value = u.get(k);
    if (u.get('checkIn') && !u.get('checkInTo')) $('#checkInTo').value = u.get('checkIn');
    if (u.get('nights') && !u.get('nightsTo')) $('#nightsTo').value = u.get('nights');
    if (u.get('maxPrice')) $('#budget').value = u.get('maxPrice');
    const ages = (u.get('childAges') || '').split(',').filter((x) => /^\d{1,2}$/.test(x)).map(Number);
    if (ages.length) $('#children').value = String(Math.min(4, ages.length));
    renderChildAges($('#childAges'), $('#children').value, ages);
    if (u.get('lastMinute') === '1') $('#lastMinuteOnly').checked = true;
    if (u.get('freeCancel') === '1') $('#freeCancel').checked = true;
    for (const k of ['seatsOnly', 'instantOnly']) if (u.get(k) === '1') $('#' + k).checked = true;
    if (u.get('noStopSale') === '0') $('#noStopSale').checked = false;
    for (const a of (u.get('attrs') || '').split(',')) { const el = $(`#attrFilter input[value="${HOTEL_ATTR_KEYS.includes(a) ? a : '-'}"]`); if (el) el.checked = true; }
    if (['none', 'upto50'].includes(u.get('prepay'))) $(`#filters input[name="prepay"][value="${u.get('prepay')}"]`).checked = true;
    if (['package', 'hotel', 'tour'].includes(u.get('type'))) setType(u.get('type'));
    if (u.get('view') === 'table') { state.view = 'table'; syncView(); }
    if (/^(7|8|8\.5|9)$/.test(u.get('minRating') || '')) $(`#ratingFilter input[value="${u.get('minRating')}"]`).checked = true;
    for (const l of (u.get('beachLines') || '').split(',')) { const el = $(`#filters input[name="beachLines"][value="${['1', '2', '3'].includes(l) ? l : '-'}"]`); if (el) el.checked = true; }
    if ([...$('#maxDist').options].some((o) => o.value && o.value === u.get('maxDist'))) $('#maxDist').value = u.get('maxDist');
    if ([...$('#sort').options].some((o) => o.value === u.get('sort'))) $('#sort').value = u.get('sort');
    const idList = (k, re) => (u.get(k) || '').split(',').filter((x) => re.test(x)).slice(0, 60);
    state.facetFor = `${$('#dest').dataset.id || $('#dest').value.trim().toLowerCase()}|${state.type}`;
    msSetSelected(districtMs, idList('districts', /^[a-z0-9-]+\.[a-z0-9-]+$/));
    msSetSelected(hotelMs, idList('hotels', /^[a-z0-9-]+$/));
    range.fix();
    // ?hotel=<id> — paylaşılan otel linki: axtarışdan sonra detal pəncərəsini aç
    const hid = u.get('hotel');
    run({ noScroll: !!hid }).then(() => { if (hid && /^[a-z0-9-]{1,40}$/.test(hid)) openHotel(hid, null); });
  } else {
    loadLastMinute();
  }
  applyTypeUi();
})();
