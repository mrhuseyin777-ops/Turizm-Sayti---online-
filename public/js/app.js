// B2C axtarış səhifəsi
(async function () {
  const $ = (s) => document.querySelector(s);
  const cfg = await api('/api/config');
  const state = { type: 'package', region: '', currency: store.get('currency', 'AZN'), last: null };
  $('#year').textContent = new Date().getFullYear();

  // Valyuta
  $('#currency').innerHTML = cfg.currencies.map((c) => `<option>${c}</option>`).join('');
  $('#currency').value = state.currency;
  $('#currency').addEventListener('change', (e) => { state.currency = e.target.value; store.set('currency', state.currency); if (state.last) run(); });

  $('#checkIn').value = defaultDate(30);
  $('#checkIn').min = defaultDate(0);
  autocomplete($('#dest'));

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

  // Filtrlər
  $('#starFilter').innerHTML = [5, 4, 3].map((s) => `<label class="chk"><input type="checkbox" name="stars" value="${s}"> <span class="stars">${starStr(s)}</span></label>`).join('');
  $('#boardFilter').innerHTML = Object.entries(cfg.boards).map(([k, v]) => `<label class="chk"><input type="checkbox" name="boards" value="${k}"> ${esc(v)} <small class="muted">${k}</small></label>`).join('');
  function renderOpFilter() {
    $('#opFilter').innerHTML = cfg.providers.filter((p) => p.sells.includes(state.type))
      .map((p) => `<label class="chk"><input type="checkbox" name="providers" value="${p.id}"> <span class="dot" style="background:${p.color}"></span> ${esc(p.name)}</label>`).join('');
  }
  renderOpFilter();
  $('#filters').addEventListener('change', () => run());
  let pt; $('#filters').addEventListener('input', (e) => { if (e.target.type === 'number') { clearTimeout(pt); pt = setTimeout(run, 400); } });
  $('#sort').addEventListener('change', () => run());
  $('#toggleFilters').addEventListener('click', () => $('#filters').classList.toggle('open'));
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  document.addEventListener('langchange', () => { if (state.last) render(state.last); });

  const checked = (name) => [...document.querySelectorAll(`#filters input[name="${name}"]:checked`)].map((i) => i.value).join(',');

  function params() {
    const budget = $('#budget').value;
    const maxF = $('#maxPrice').value;
    return {
      q: $('#dest').value, destinationId: $('#dest').dataset.id || '', type: state.type, region: state.region,
      checkIn: $('#checkIn').value, nights: $('#nights').value, adults: $('#adults').value, children: $('#children').value,
      maxPrice: maxF || budget, minPrice: $('#minPrice').value, stars: checked('stars'), boards: checked('boards'),
      providers: checked('providers'), earlyOnly: $('#earlyOnly').checked ? '1' : '', sort: $('#sort').value, currency: state.currency,
    };
  }

  async function run() {
    if (!$('#dest').value.trim()) { $('#dest').focus(); return; }
    $('#intro').hidden = true; $('#resultsLayout').hidden = false;
    $('#results').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${t('searching')}</p>`;
    const p = params();
    history.replaceState(null, '', '?' + new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString());
    try {
      state.last = await api('/api/search', p);
      render(state.last);
      if (matchMedia('(max-width: 980px)').matches) $('#resultsLayout').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      $('#results').innerHTML = `<div class="panel empty">${esc(err.message)}</div>`;
    }
  }

  function render(data) {
    const cur = data.query.currency;
    const pax = data.query.adults + data.query.children;
    const destNames = [...new Set(data.groups.map((g) => g.destination.name))].join(', ') || $('#dest').value;
    $('#resTitle').textContent = `${destNames} · ${fmtDate(data.query.checkIn)} ±${data.query.flex} · ${t('nights_n', { n: data.query.nights })}`;
    $('#resSub').textContent = data.stats ? t('results', { n: data.stats.hotels, o: data.stats.count }) + ` · ${money(data.stats.min, cur)} – ${money(data.stats.max, cur)}` : '';
    $('#sources').innerHTML = data.sources.map((s) => `<span class="src"><span class="dot" style="width:8px;height:8px;border-radius:50%;background:${s.color}"></span>${esc(s.name)} <b>${s.count}</b></span>`).join('');

    if (!data.groups.length) { $('#results').innerHTML = `<div class="panel empty">${esc(data.message || t('no_results'))}</div>`; return; }

    $('#results').innerHTML = data.groups.slice(0, 60).map((g, i) => {
      const b = g.best;
      return `<article class="card">
        <div class="img" style="background:${gradFor(g.itemId)}"><span class="rank">#${i + 1}</span>${esc(g.destination.name)}, ${esc(g.destination.country)}</div>
        <div class="body">
          <h3>${esc(g.name)} <span class="stars">${starStr(g.stars)}</span></h3>
          <div class="muted" style="font-size:14px">${fmtDate(b.checkIn)} · ${t('nights_n', { n: b.nights })}${b.boardLabel ? ' · ' + esc(b.boardLabel) : ''}${g.includesFlight ? ' · ✈ ' + t('flight_incl') : ''}</div>
          <div class="badges">
            ${g.rating ? `<span class="badge rating">${g.rating}</span>` : ''}
            ${g.earlyBooking ? `<span class="badge early">${t('early')}</span>` : ''}
            ${g.tags.slice(0, 4).map((x) => `<span class="badge">${esc(x)}</span>`).join('')}
          </div>
          <div class="compare">
            ${g.providers.map((o, j) => `<span class="op ${j === 0 ? 'best' : ''}" title="${esc(o.boardLabel || '')} ${fmtDate(o.checkIn)}"><span class="dot" style="background:${o.providerColor}"></span>${esc(o.providerName)} · ${money(o.price, cur)}</span>`).join('')}
          </div>
        </div>
        <div class="price">
          <div>
            <div class="from">${t('cheapest_at', { op: esc(b.providerName) })}</div>
            ${b.oldPrice ? `<div class="old">${money(b.oldPrice, cur)}</div>` : ''}
            <div class="amount">${money(b.price, cur)}</div>
            <div class="from">${t('per_total', { pax })}</div>
            ${g.savings > 0 ? `<div class="save">${t('save', { n: money(g.savings, cur) })}</div>` : ''}
          </div>
          <button class="btn sm" data-book="${i}">${t('book')}</button>
          <a style="font-size:13px" href="/cars.html?loc=${encodeURIComponent(g.destination.id)}&amp;from=${esc(b.checkIn)}&amp;to=${new Date(Date.parse(b.checkIn) + Math.max(1, b.nights) * 864e5).toISOString().slice(0, 10)}">🚗 Maşın əlavə et</a>
        </div>
      </article>`;
    }).join('');
  }

  // Müraciət modalı
  $('#results').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]'); if (!btn) return;
    const g = state.last.groups[+btn.dataset.book];
    const cur = state.last.query.currency;
    $('#modalBody').innerHTML = `
      <h3>${t('lead_title')}: ${esc(g.name)}</h3>
      <table>${g.providers.map((o) => `<tr><td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${o.providerColor}"></span> ${esc(o.providerName)}</td><td>${fmtDate(o.checkIn)}</td><td>${esc(o.board || '')}</td><td style="text-align:right"><b>${money(o.price, cur)}</b></td></tr>`).join('')}</table>
      <form id="leadForm">
        <input name="name" required placeholder="${t('lead_name')}">
        <input name="phone" required placeholder="${t('lead_phone')}" inputmode="tel">
        <textarea name="note" rows="2" placeholder="${t('lead_note')}"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>✕</button><button class="btn sm">${t('lead_send')}</button></div>
      </form>`;
    $('#modal').classList.add('open');
    $('#leadForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(ev.target));
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fd, offerId: g.best.id }) });
      if (r.ok) { $('#modal').classList.remove('open'); toast(t('lead_ok')); }
    });
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });

  // URL-dən axtarışı bərpa et (paylaşılan link)
  const u = new URLSearchParams(location.search);
  if (u.get('q')) {
    $('#dest').value = u.get('q'); if (u.get('destinationId')) $('#dest').dataset.id = u.get('destinationId');
    for (const k of ['checkIn', 'nights', 'adults', 'children']) if (u.get(k)) $('#' + k).value = u.get(k);
    if (u.get('type')) $(`#typeTabs [data-type="${u.get('type')}"]`)?.click();
    run();
  }
})();
