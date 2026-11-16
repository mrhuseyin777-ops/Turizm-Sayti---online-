// B2C axtarış səhifəsi
(async function () {
  const $ = (s) => document.querySelector(s);
  const cfg = await api('/api/config');
  const provById = Object.fromEntries(cfg.providers.map((p) => [p.id, p]));
  // mode: 'search' (istiqamət üzrə) | 'explore' ("Hara gedə bilərəm?")
  const state = { type: 'package', region: '', currency: store.get('currency', 'AZN'), last: null, mode: 'search' };
  $('#year').textContent = new Date().getFullYear();

  // Valyuta
  $('#currency').innerHTML = cfg.currencies.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#currency').value = state.currency;
  $('#currency').addEventListener('change', (e) => { state.currency = e.target.value; store.set('currency', state.currency); if (state.last) run(); loadLastMinute(); });

  $('#checkIn').value = defaultDate(30);
  $('#checkIn').min = defaultDate(0);
  autocomplete($('#dest'));

  // Uşaq yaşları
  const syncChildAges = () => renderChildAges($('#childAges'), $('#children').value, readChildAges($('#childAges')));
  $('#children').addEventListener('change', syncChildAges);

  // Statik bloklar (dil dəyişəndə yenidən çəkilir)
  function renderStatic() {
    $('#payStrip').innerHTML = paymentStripHtml();
    $('#lastMinLabel').textContent = t('f_lastmin', { n: cfg.lastMinuteDays });
    $('#lastMinSub').textContent = t('lastmin_sub', { n: cfg.lastMinuteDays });
    $('#dest').title = t('explore_hint');
    $('#homeCallbackForm').innerHTML = callbackFormHtml('homeCbForm');
    bindCallbackForm($('#homeCbForm'), () => 'Ana səhifə');
    syncChildAges();
  }
  renderStatic();

  // Tablar və region
  $('#typeTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]'); if (!b) return;
    document.querySelectorAll('#typeTabs .tab').forEach((x) => x.classList.toggle('active', x === b));
    state.type = b.dataset.type;
    renderOpFilter();
    if (state.last) run();
  });
  $('#regionSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-region]'); if (!b) return;
    document.querySelectorAll('#regionSeg button').forEach((x) => x.classList.toggle('active', x === b));
    state.region = b.dataset.region;
  });
  document.querySelectorAll('.popular [data-q]').forEach((b) => b.addEventListener('click', () => {
    $('#dest').value = b.textContent; $('#dest').dataset.id = b.dataset.q;
    if (['qabala', 'shahdag'].includes(b.dataset.q) && state.type === 'package') $('#typeTabs [data-type="hotel"]').click();
    run();
  }));
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
  document.addEventListener('langchange', () => { renderStatic(); if (state.last) render(state.last); if (lastMinData) renderLastMinute(lastMinData); });

  const checked = (name) => [...document.querySelectorAll(`#filters input[name="${name}"]:checked`)].map((i) => i.value).filter(Boolean).join(',');

  function params() {
    const budget = $('#budget').value;
    const maxF = $('#maxPrice').value;
    const ages = readChildAges($('#childAges'));
    return {
      q: $('#dest').value.trim(), destinationId: $('#dest').dataset.id || '', type: state.type, region: state.region,
      checkIn: $('#checkIn').value, nights: $('#nights').value, adults: $('#adults').value, children: String(ages.length),
      childAges: ages.join(','),
      maxPrice: maxF || budget, minPrice: $('#minPrice').value, stars: checked('stars'), boards: checked('boards'),
      providers: checked('providers'), earlyOnly: $('#earlyOnly').checked ? '1' : '', sort: $('#sort').value, currency: state.currency,
      prepay: checked('prepay'), freeCancel: $('#freeCancel').checked ? '1' : '', lastMinute: $('#lastMinuteOnly').checked ? '1' : '',
    };
  }

  async function run(opts = {}) {
    const p = params();
    state.mode = p.q ? 'search' : 'explore';
    if (state.mode === 'explore') { delete p.q; delete p.destinationId; p.anywhere = '1'; }
    $('#intro').hidden = true; $('#resultsLayout').hidden = false;
    $('#sort').hidden = state.mode === 'explore';
    $('#results').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${esc(t('searching'))}</p>`;
    history.replaceState(null, '', '?' + new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString());
    try {
      const data = await api(state.mode === 'explore' ? '/api/explore' : '/api/search', opts.refresh ? { ...p, refresh: '1' } : p);
      state.last = data;
      render(data);
      if (!opts.refresh && matchMedia('(max-width: 980px)').matches) $('#resultsLayout').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      $('#results').innerHTML = `<div class="panel empty">${esc(err.message)}</div>`;
    }
  }

  // Mənbələr: hər operator üçün "X dəq əvvəl yoxlanılıb" + Yenilə
  function renderSources(data) {
    $('#sources').innerHTML = data.sources.map((s) => `<span class="src" title="${esc(s.checkedAt ? new Date(s.checkedAt).toLocaleString() : '')}"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${esc(s.color)}"></span>${esc(s.name)} <b>${s.count}</b> <span class="ago">· ${esc(s.ok ? checkedAgo(s.checkedAt, data.serverTime) : '—')}</span></span>`).join('')
      + (data.sources.length ? `<button type="button" class="src-refresh" id="refreshBtn">${esc(t('refresh'))}</button>` : '');
    const rb = $('#refreshBtn'); if (rb) rb.addEventListener('click', () => run({ refresh: true }));
  }

  function emptyState(msg) {
    return `<div class="panel empty"><p>${esc(msg || t('no_results'))}</p>
      <div style="max-width:720px;margin:16px auto 0;text-align:left"><b>${esc(t('cb_title'))}</b><p class="muted" style="margin:4px 0 0">${esc(t('cb_sub'))}</p>${callbackFormHtml('emptyCbForm')}</div></div>`;
  }
  const queryContext = () => {
    const q = state.last && state.last.query;
    if (!q) return '';
    return `${$('#dest').value.trim() || 'Hara gedə bilərəm?'} · ${q.type} · ${q.checkIn} · ${q.nights}g · ${q.adults}+${(q.childAges || []).join('/') || 0} · ${$('#budget').value || '-'}`.slice(0, 300);
  };
  function bindEmpty() { const f = $('#emptyCbForm'); if (f) bindCallbackForm(f, queryContext); }

  function render(data) {
    if (data.destinations) return renderExplore(data);
    const cur = data.query.currency;
    const pax = data.query.adults + data.query.children;
    const destNames = [...new Set(data.groups.map((g) => g.destination.name))].join(', ') || $('#dest').value;
    $('#resTitle').textContent = `${destNames} · ${fmtDate(data.query.checkIn)} ±${data.query.flex} · ${t('nights_n', { n: data.query.nights })}`;
    $('#resSub').textContent = data.stats ? t('results', { n: data.stats.hotels, o: data.stats.count }) + ` · ${money(data.stats.min, cur)} – ${money(data.stats.max, cur)}` : '';
    renderSources(data);

    if (!data.groups.length) { $('#results').innerHTML = emptyState(data.message); bindEmpty(); return; }

    $('#results').innerHTML = data.groups.slice(0, 60).map((g, i) => {
      const b = g.best;
      return `<article class="card">
        <div class="img" style="background:${gradFor(g.itemId)}"><span class="rank">#${i + 1}</span>${esc(g.destination.name)}, ${esc(g.destination.country)}</div>
        <div class="body">
          <h3>${esc(g.name)} <span class="stars">${starStr(g.stars)}</span></h3>
          <div class="muted" style="font-size:14px">${fmtDate(b.checkIn)} · ${esc(t('nights_n', { n: b.nights }))}${b.boardLabel ? ' · ' + esc(b.boardLabel) : ''}${g.includesFlight ? ' · ✈ ' + esc(t('flight_incl')) : ''}</div>
          <div class="badges">
            ${g.rating ? `<span class="badge rating">${esc(g.rating)}</span>` : ''}
            ${b.lastMinute ? `<span class="badge hot">${esc(t('lastmin_badge'))}</span>` : ''}
            ${g.earlyBooking ? `<span class="badge early">${esc(t('early'))}</span>` : ''}
            ${termBadges(b)}
            ${g.tags.slice(0, 3).map((x) => `<span class="badge">${esc(x)}</span>`).join('')}
          </div>
          <div class="compare">
            ${g.providers.map((o, j) => `<button type="button" class="op ${j === 0 ? 'best' : ''}" data-trust="${esc(o.providerId)}" data-card="${i}" aria-expanded="false" title="${esc(t('trust_hint'))} · ${esc(o.boardLabel || '')} ${fmtDate(o.checkIn)}"><span class="dot" style="background:${esc(o.providerColor)}"></span>${esc(o.providerName)} · ${money(o.price, cur)}</button>`).join('')}
          </div>
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
          <a style="font-size:13px" href="/cars.html?loc=${encodeURIComponent(g.destination.id)}&amp;from=${esc(b.checkIn)}&amp;to=${new Date(Date.parse(b.checkIn) + Math.max(1, b.nights) * 864e5).toISOString().slice(0, 10)}">🚗 Maşın əlavə et</a>
        </div>
      </article>`;
    }).join('');
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
    $('#resTitle').textContent = t('explore_title', { date: fmtDate(q.checkIn), flex: q.flex, n: q.nights });
    $('#resSub').textContent = t('explore_sub', { n: data.destinations.length, budget: q.maxPrice != null ? t('budget_upto', { b: money(q.maxPrice, cur) }) : t('budget_none') });
    renderSources(data);
    if (!data.destinations.length) { $('#results').innerHTML = emptyState(data.message); bindEmpty(); return; }
    $('#results').innerHTML = `<p class="muted" style="margin-top:0">${esc(t('explore_hint'))}</p><div class="dest-grid">${destCardsHtml(data.destinations, cur)}</div>`;
  }

  // İstiqamət kartına klik → həmin istiqamətə axtarış (ən ucuz təklifin tarixi ilə)
  function openDest(card) {
    $('#dest').value = card.dataset.name; $('#dest').dataset.id = card.dataset.dest;
    if (card.dataset.checkin) $('#checkIn').value = card.dataset.checkin;
    run();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Ana səhifədə "Son dəqiqə" bölməsi
  let lastMinData = null;
  function renderLastMinute(data) {
    $('#lastMinSection').hidden = !data.destinations.length;
    $('#lastMinGrid').innerHTML = destCardsHtml(data.destinations, data.query.currency, 6);
  }
  async function loadLastMinute() {
    try {
      lastMinData = await api('/api/explore', { type: 'package', lastMinute: '1', nights: 7, adults: 2, currency: state.currency, checkIn: defaultDate(7) });
      renderLastMinute(lastMinData);
    } catch { /* bölmə gizli qalır */ }
  }
  $('#lastMinGrid').addEventListener('click', (e) => {
    const c = e.target.closest('[data-dest]'); if (!c) return;
    if (state.type !== 'package') $('#typeTabs [data-type="package"]').click();
    $('#lastMinuteOnly').checked = true;
    openDest(c);
  });

  $('#results').addEventListener('click', (e) => {
    const dc = e.target.closest('.dest-card');
    if (dc) { openDest(dc); return; }
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
    const btn = e.target.closest('[data-book]'); if (!btn) return;
    // Müraciət modalı
    const g = state.last.groups[+btn.dataset.book];
    const cur = state.last.query.currency;
    $('#modalBody').innerHTML = `
      <h3>${esc(t('lead_title'))}: ${esc(g.name)}</h3>
      <table>${g.providers.map((o) => `<tr><td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}</td><td>${fmtDate(o.checkIn)}</td><td>${esc(o.board || '')}</td><td style="text-align:right"><b>${money(o.price, cur)}</b></td></tr>`).join('')}</table>
      <div class="badges">${termBadges(g.best)}</div>
      <form id="leadForm">
        <input name="name" required maxlength="80" placeholder="${esc(t('lead_name'))}">
        <input name="phone" required maxlength="30" placeholder="${esc(t('lead_phone'))}" inputmode="tel">
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('lead_note'))}"></textarea>${HONEYPOT_HTML}
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>✕</button><button class="btn sm">${esc(t('lead_send'))}</button></div>
      </form>`;
    $('#modal').classList.add('open');
    $('#leadForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(ev.target));
      try {
        await postJson('/api/leads', { ...fd, type: 'offer', offerId: g.best.id });
        $('#modal').classList.remove('open'); toast(t('lead_ok'));
      } catch (err) { toast(err.message); }
    });
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });

  // URL-dən axtarışı bərpa et (paylaşılan link)
  const u = new URLSearchParams(location.search);
  if (u.get('q') || u.get('anywhere')) {
    if (u.get('q')) { $('#dest').value = u.get('q'); if (u.get('destinationId')) $('#dest').dataset.id = u.get('destinationId'); }
    for (const k of ['checkIn', 'nights', 'adults', 'children']) if (u.get(k)) $('#' + k).value = u.get(k);
    if (u.get('maxPrice')) $('#budget').value = u.get('maxPrice');
    const ages = (u.get('childAges') || '').split(',').filter((x) => /^\d{1,2}$/.test(x)).map(Number);
    if (ages.length) $('#children').value = String(Math.min(4, ages.length));
    renderChildAges($('#childAges'), $('#children').value, ages);
    if (u.get('lastMinute') === '1') $('#lastMinuteOnly').checked = true;
    if (u.get('freeCancel') === '1') $('#freeCancel').checked = true;
    if (['none', 'upto50'].includes(u.get('prepay'))) $(`#filters input[name="prepay"][value="${u.get('prepay')}"]`).checked = true;
    if (['package', 'hotel', 'tour'].includes(u.get('type'))) $(`#typeTabs [data-type="${u.get('type')}"]`).click();
    run();
  } else {
    loadLastMinute();
  }
})();
