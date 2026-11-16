// B2B agentlik paneli
(async function () {
  const $ = (s) => document.querySelector(s);
  const cfg = await api('/api/config');
  const state = { type: 'package', view: 'matrix', data: null, selected: new Set(), sortKey: 'price', sortDir: 1 };
  const markup = () => Math.max(0, Number($('#markup').value) || 0);
  const withMarkup = (p) => Math.round(p * (1 + markup() / 100));

  // Giriş (demo)
  function showApp() {
    const s = store.get('b2bSession', null);
    $('#loginView').hidden = !!s; $('#appView').hidden = !s; $('#logout').hidden = !s;
    if (s) { $('#agencyName').textContent = `${s.agency} · ${s.manager}`; loadLeads(); }
  }
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    store.set('b2bSession', { agency: fd.agency, manager: fd.manager });
    showApp();
  });
  $('#logout').addEventListener('click', (e) => { e.preventDefault(); store.set('b2bSession', null); showApp(); });

  // "Müraciətlər": paylaşılan seçim linklərindən gələn leadlər.
  // DEMO: server agentlik adına görə filtrləyir, autentifikasiya yoxdur — real versiyada
  // agentlik hesabı ilə giriş (sessiya/JWT) olacaq və agency sessiyadan götürüləcək.
  async function loadLeads() {
    const s = store.get('b2bSession', null);
    if (!s) return;
    try {
      const { leads } = await api('/api/b2b/leads', { agency: s.agency });
      $('#leadCount').textContent = leads.length;
      $('#leads').innerHTML = leads.length ? leads.map((l) => `<div class="lead">
        <b>${esc(l.name)}</b> · <a href="tel:${esc(l.phone.replace(/[^+\d]/g, ''))}">${esc(l.phone)}</a><br>
        <small>${esc(l.item.name)} · ${fmtDate(l.item.checkIn)} · ${money(l.item.clientPrice, l.item.currency)}</small><br>
        <small class="muted">${esc(l.item.providerName || '')}${l.client ? ' · ' + esc(l.client) : ''} · ${esc(new Date(l.createdAt).toLocaleString())}</small>
        ${l.note ? `<br><small>${esc(l.note)}</small>` : ''}</div>`).join('') : `<p class="muted">${esc(t('b2b_leads_empty'))}</p>`;
    } catch (err) { $('#leads').innerHTML = `<p class="muted">${esc(err.message)}</p>`; }
  }
  $('#leadsReload').addEventListener('click', loadLeads);
  showApp();

  // Uşaq yaşları
  const syncAges = () => renderChildAges($('#childAges'), $('#children').value, readChildAges($('#childAges')));
  $('#children').addEventListener('input', syncAges);
  document.addEventListener('langchange', syncAges);

  $('#checkIn').value = defaultDate(30);
  $('#markup').value = store.get('b2bMarkup', 0);
  autocomplete($('#dest'));

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
  $('#b2bForm').addEventListener('submit', (e) => { e.preventDefault(); run(); });

  async function run() {
    if (!$('#dest').value.trim()) return;
    $('#tableWrap').innerHTML = '<div class="spinner"></div>';
    const p = {
      q: $('#dest').value, destinationId: $('#dest').dataset.id || '', type: state.type, checkIn: $('#checkIn').value,
      flex: $('#flex').value, nights: $('#nights').value, adults: $('#adults').value, children: $('#children').value,
      childAges: readChildAges($('#childAges')).join(','),
      maxPrice: $('#maxPrice').value, stars: $('#stars').value, boards: $('#board').value, earlyOnly: $('#earlyOnly').checked ? '1' : '', flat: '1',
      lastMinute: $('#lastMinute').checked ? '1' : '', prepay: $('#prepayNone').checked ? 'none' : '', freeCancel: $('#freeCancel').checked ? '1' : '',
    };
    try {
      state.data = await api('/api/search', p);
      state.selected.clear();
      saveHistory(p);
      render();
    } catch (err) { $('#tableWrap').innerHTML = `<div class="empty">${esc(err.message)}</div>`; }
  }

  function saveHistory(p) {
    const h = store.get('b2bHistory', []).filter((x) => !(x.q === p.q && x.checkIn === p.checkIn && x.type === p.type));
    h.unshift({ ...p, client: $('#client').value, at: Date.now() });
    store.set('b2bHistory', h.slice(0, 15));
    renderHistory();
  }
  function renderHistory() {
    const h = store.get('b2bHistory', []);
    $('#history').innerHTML = h.length ? h.map((x, i) => `<div data-h="${i}"><b>${esc(x.client || x.q)}</b><br><small class="muted">${esc(x.q)} · ${fmtDate(x.checkIn)} · ${x.nights}g · ${x.adults}+${x.children}</small></div>`).join('') : '<p class="muted">Hələ yoxdur</p>';
  }
  $('#history').addEventListener('click', (e) => {
    const el = e.target.closest('[data-h]'); if (!el) return;
    const x = store.get('b2bHistory', [])[+el.dataset.h];
    $('#dest').value = x.q; if (x.destinationId) $('#dest').dataset.id = x.destinationId; else delete $('#dest').dataset.id;
    for (const k of ['checkIn', 'flex', 'nights', 'adults', 'children', 'maxPrice']) $('#' + k).value = x[k] || '';
    renderChildAges($('#childAges'), x.children, String(x.childAges || '').split(',').filter(Boolean).map(Number));
    $('#client').value = x.client || '';
    $(`#typeTabs [data-type="${x.type}"]`).click();
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
    renderKpis(offers);
    $('#selCount').textContent = state.selected.size;
    if (!offers.length) { $('#tableWrap').innerHTML = `<div class="empty muted">${esc(d.message || 'Təklif tapılmadı')}</div>`; return; }
    if (state.view === 'matrix') renderMatrix(d); else renderList(offers);
  }

  function renderMatrix(d) {
    const ops = d.sources.filter((s) => s.count > 0);
    const rows = d.groups.map((g) => {
      const byOp = Object.fromEntries(g.providers.map((o) => [o.providerId, o]));
      return `<tr>
        <td><b>${esc(g.name)}</b> <span class="stars">${starStr(g.stars)}</span><br><small class="muted">${esc(g.destination.name)}${g.rating ? ' · ' + g.rating : ''}</small></td>
        ${ops.map((s) => {
          const o = byOp[s.id];
          if (!o) return '<td class="num muted">—</td>';
          const best = o.id === g.best.id;
          const sel = state.selected.has(o.id);
          return `<td class="num" style="${best ? 'background:var(--good-soft);font-weight:700' : ''}">
            <label style="cursor:pointer"><input type="checkbox" data-sel="${esc(o.id)}" ${sel ? 'checked' : ''}> ${money(withMarkup(o.price), 'AZN')}</label>
            <br><small class="muted">${fmtDate(o.checkIn).slice(0, 5)} ${esc(o.board || '')}${o.earlyBooking ? ' · ER' : ''}</small></td>`;
        }).join('')}
        <td class="num"><b style="color:var(--good)">${g.savings ? money(g.savings, 'AZN') : '—'}</b></td>
      </tr>`;
    }).join('');
    $('#tableWrap').innerHTML = `<table class="grid"><thead><tr><th>Otel / tur</th>${ops.map((s) => `<th style="text-align:right"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color}"></span> ${esc(s.name)}</th>`).join('')}<th style="text-align:right">Fərq</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  const cols = [
    ['name', 'Otel / tur'], ['providerName', 'Operator'], ['checkIn', 'Tarix'], ['nights', 'Gecə'], ['board', 'Qida'],
    ['stars', '★'], ['price', 'Net qiymət'], ['client', 'Müştəri qiyməti'], ['availability', 'Status'], ['prepayment', t('b2b_terms')],
  ];
  const termsShort = (o) => [o.prepayment === 'none' ? t('prepay_none') : o.prepayment === '50' ? t('prepay_50') : o.prepayment === 'full' ? t('prepay_full') : '',
    o.freeCancelUntil ? t('free_cancel', { d: shortDate(o.freeCancelUntil) }) : ''].filter(Boolean).join(' · ');
  function renderList(offers) {
    const k = state.sortKey === 'client' ? 'price' : state.sortKey;
    const list = [...offers].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * state.sortDir).slice(0, 400);
    const minPrice = Math.min(...offers.map((o) => o.price));
    $('#tableWrap').innerHTML = `<table class="grid"><thead><tr><th></th>${cols.map(([key, label]) => `<th data-sort="${key}">${label}${state.sortKey === key ? (state.sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>
      ${list.map((o) => `<tr class="${state.selected.has(o.id) ? 'sel' : ''} ${o.price === minPrice ? 'cheapest' : ''}">
        <td><input type="checkbox" data-sel="${esc(o.id)}" ${state.selected.has(o.id) ? 'checked' : ''}></td>
        <td>${esc(o.name)}${o.earlyBooking ? ' <span class="badge early">ER</span>' : ''}${o.lastMinute ? ' <span class="badge hot">LM</span>' : ''}</td>
        <td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${o.providerColor}"></span> ${esc(o.providerName)}</td>
        <td>${fmtDate(o.checkIn)}</td><td>${o.nights}</td><td>${esc(o.board || '—')}</td><td>${o.stars || ''}</td>
        <td class="num">${money(o.price, 'AZN')}</td><td class="num"><b>${money(withMarkup(o.price), 'AZN')}</b></td>
        <td>${o.availability === 'instant' ? '✅ Mövcud' : '⏳ Sorğu ilə'}</td><td><small>${esc(termsShort(o))}</small></td></tr>`).join('')}
      </tbody></table>`;
  }

  $('#tableWrap').addEventListener('click', (e) => {
    const th = e.target.closest('[data-sort]');
    if (th) { const key = th.dataset.sort; state.sortDir = state.sortKey === key ? -state.sortDir : 1; state.sortKey = key; render(); return; }
  });
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
    const s = store.get('b2bSession', {});
    const q = state.data.query;
    const client = $('#client').value;
    const lines = [
      `Salam${client ? ', ' + client : ''}! Sorğunuza uyğun ən sərfəli variantlar:`,
      `📍 ${list[0].destination.name} · ${q.adults} böyük${q.children ? ' + ' + q.children + ' uşaq' : ''} · ${q.nights} gecə`,
      '',
      ...list.map((o, i) => [
        `${i + 1}) ${o.name} ${starStr(o.stars)}`,
        `   📅 ${fmtDate(o.checkIn)} · ${o.nights} gecə${o.boardLabel ? ' · ' + o.boardLabel + ' (' + o.board + ')' : ''}${o.includesFlight ? ' · ✈ aviabilet daxil' : ''}`,
        `   💰 ${money(withMarkup(o.price), 'AZN')} (cəmi)${o.earlyBooking ? ' — erkən rezervasiya endirimi' : ''}`,
      ].join('\n')),
      '',
      'Qiymətlər yerlərin mövcudluğundan asılı olaraq dəyişə bilər.',
      s.manager ? `Hörmətlə, ${s.manager} — ${s.agency}` : '',
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
        <a class="btn sm primary" id="waQuote" target="_blank" rel="noopener" style="display:inline-flex;align-items:center">WhatsApp-da göndər</a>
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
      <table>${list.map((o) => `<tr><td>${esc(o.name)}</td><td>${fmtDate(o.checkIn)}</td><td style="text-align:right"><b>${money(withMarkup(o.price), 'AZN')}</b></td></tr>`).join('')}</table>
      <textarea id="shareMsg" rows="2" maxlength="400" placeholder="${esc(t('b2b_msg'))}"></textarea>
      <div id="shareOut"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">
        <button class="btn secondary sm" data-close>✕</button><button class="btn sm primary" id="shareCreate">${esc(t('b2b_create'))}</button></div>`;
    $('#modal').classList.add('open');
    $('#shareCreate').addEventListener('click', async (ev) => {
      ev.target.disabled = true;
      const s = store.get('b2bSession', {});
      const q = state.data.query;
      try {
        const r = await postJson('/api/selections', {
          agency: s.agency, manager: s.manager, client: $('#client').value, message: $('#shareMsg').value, markup: markup(), currency: 'AZN',
          adults: q.adults, children: q.children,
          items: list.map((o) => ({ id: o.id, name: o.name, destination: o.destination.name, stars: o.stars, checkIn: o.checkIn, nights: o.nights, board: o.board, boardLabel: o.boardLabel, includesFlight: o.includesFlight, prepayment: o.prepayment, freeCancelUntil: o.freeCancelUntil, providerName: o.providerName, price: o.price })),
        });
        const url = location.origin + r.url;
        $('#shareOut').innerHTML = `<div class="share-link"><input id="shareUrl" readonly value="${esc(url)}" aria-label="URL">
          <button class="btn secondary sm" id="shareCopy">${esc(t('b2b_copy'))}</button>
          <a class="btn secondary sm" style="display:inline-flex;align-items:center" target="_blank" rel="noopener" href="${esc(r.url)}">${esc(t('b2b_open'))}</a>
          <a class="btn sm primary" style="display:inline-flex;align-items:center" target="_blank" rel="noopener" id="shareWa">WhatsApp</a></div>`;
        $('#shareWa').href = 'https://wa.me/?text=' + encodeURIComponent(url);
        $('#shareCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(url); toast('Kopyalandı'); } catch { $('#shareUrl').select(); } });
        ev.target.hidden = true;
      } catch (err) { toast(err.message); ev.target.disabled = false; }
    });
  });

  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });

  $('#csvBtn').addEventListener('click', () => {
    if (!state.data || !state.data.offers.length) return toast('Əvvəlcə axtarış edin');
    const head = ['Otel/Tur', 'İstiqamət', 'Operator', 'Tarix', 'Gecə', 'Qida', 'Ulduz', 'Net qiymət (AZN)', 'Müştəri qiyməti (AZN)', 'Erkən rez.', 'Status'];
    const rows = state.data.offers.map((o) => [o.name, o.destination.name, o.providerName, o.checkIn, o.nights, o.board || '', o.stars, o.price, withMarkup(o.price), o.earlyBooking ? 'bəli' : '', o.availability]);
    const csv = '﻿' + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `turtap-${state.data.query.checkIn}.csv`;
    a.click();
  });

  // Mobil üçün sağ paneli aşağı keçir
  const mq = matchMedia('(max-width: 980px)');
  const fit = () => { $('#mainGrid').style.gridTemplateColumns = mq.matches ? '1fr' : '1fr 240px'; };
  mq.addEventListener('change', fit); fit();
})();
