// B2B "👤 Müştərilər" (mini-CRM): müştəri kartı (ad, telefon, e-poçt, uşaq yaşları, büdcə, istiqamətlər, qida, qeyd),
// tarixçə (axtarışlar, seçilmişlər, seçim linkləri, müraciətlər) və "Unut" (anonimləşdirmə).
// Axtarış formasındakı "Müştəri" sahəsi seçicidir: yazdıqca bazada axtarır, "➕ Yeni müştəri" yaradır; seçiləndə
// forma avtomatik dolur (böyük/uşaq sayı, yaşlar, büdcə, qida, sevdiyi istiqamət).
// b2b.js ilə əlaqə: window.B2BApp körpüsü, #client input-un data-client-id atributu və b2b:* hadisələri.
// Şəxsi məlumat yalnız serverdə (agentlik daxilində); brauzerdə yalnız yaddaşda saxlanılır. Bütün mətn esc() ilə.
(function () {
  const $ = (s) => document.querySelector(s);
  const App = () => window.B2BApp;
  const cs = { list: [], loaded: false, loading: null, view: 'list', card: null, q: '', idx: -1, confirmForget: false, prefill: null };
  const BOARDS = ['', 'RO', 'BB', 'HB', 'FB', 'AI', 'UAI'];
  const input = $('#client');

  async function send(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', headers, body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }
  async function getJson(path) {
    const r = await fetch(path, { credentials: 'same-origin', cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }
  const fail = (err) => { const a = App(); if (!(a && a.onAuthError(err))) toast(err.message); };
  const paxText = (c) => (c.childAges && c.childAges.length ? t('cl_pax_c', { a: c.adults, c: c.childAges.length, ages: c.childAges.join(', ') }) : t('cl_pax', { a: c.adults }));
  const findLocal = (id) => cs.list.find((c) => c.id === id) || null;

  function load() {
    const a = App();
    if (!a || !a.me) return Promise.resolve();
    if (cs.loading) return cs.loading;
    cs.loading = getJson('/api/b2b/clients').then((d) => {
      cs.list = d.clients || [];
      cs.loaded = true;
      cs.retentionDays = d.limits && d.limits.retentionDays;
      markLinked();
    }).catch(fail).finally(() => { cs.loading = null; });
    return cs.loading;
  }
  const upsert = (c) => {
    const i = cs.list.findIndex((x) => x.id === c.id);
    if (i >= 0) cs.list[i] = c; else cs.list.unshift(c);
  };

  // ------------------------------------------------------------ Axtarış formasındakı seçici
  const drop = document.createElement('div');
  drop.id = 'clientDrop'; drop.className = 'cl-drop'; drop.hidden = true; drop.setAttribute('role', 'listbox');
  const cardBtn = document.createElement('button');
  cardBtn.type = 'button'; cardBtn.className = 'cl-card-btn'; cardBtn.hidden = true; cardBtn.textContent = '👤';
  $('#clientPick').append(cardBtn, drop);

  function markLinked() {
    const id = input.dataset.clientId;
    const c = id ? findLocal(id) : null;
    input.classList.toggle('cl-linked', !!id);
    cardBtn.hidden = !id;
    cardBtn.title = t('cl_open_card');
    cardBtn.setAttribute('aria-label', cardBtn.title);
    if (c && input.value !== c.name) input.value = c.name;
  }
  function setLinked(c) {
    if (c) { input.value = c.name; input.dataset.clientId = c.id; } else delete input.dataset.clientId;
    markLinked();
  }

  function fillForm(c) {
    const set = (sel, v) => { const el = $(sel); if (el) el.value = v; };
    set('#adults', c.adults || 2);
    const ages = Array.isArray(c.childAges) ? c.childAges.slice(0, 6) : [];
    set('#children', ages.length);
    renderChildAges($('#childAges'), ages.length, ages);
    set('#maxPrice', c.budget == null ? '' : c.budget);
    if (c.board && [...$('#board').options].some((o) => o.value === c.board)) set('#board', c.board);
    if (!$('#dest').value.trim() && c.destinations && c.destinations[0]) { set('#dest', c.destinations[0]); delete $('#dest').dataset.id; }
  }

  function pick(c) {
    setLinked(c);
    fillForm(c);
    hideDrop();
    toast(t('cl_filled', { n: c.name, pax: paxText(c) }));
  }

  function options() {
    const q = input.value.trim().toLowerCase();
    const qd = q.replace(/\D/g, '');
    const matches = cs.list.filter((c) => !q || c.name.toLowerCase().includes(q) || (qd.length >= 3 && String(c.phone || '').replace(/\D/g, '').includes(qd))).slice(0, 8);
    const opts = matches.map((c) => ({ kind: 'client', c }));
    if (q.length >= 2 && !cs.list.some((c) => c.name.toLowerCase() === q)) opts.push({ kind: 'new', name: input.value.trim() });
    opts.push({ kind: 'all' });
    return opts;
  }
  function renderDrop() {
    const a = App();
    if (!a || !a.me) return hideDrop();
    const opts = options();
    cs.opts = opts;
    if (cs.idx >= opts.length) cs.idx = opts.length - 1;
    drop.innerHTML = opts.map((o, i) => {
      const act = i === cs.idx ? ' active' : '';
      if (o.kind === 'client') {
        return `<div class="cl-opt${act}" role="option" data-cl-opt="${i}" aria-selected="${i === cs.idx}"><b>${esc(o.c.name)}</b>
          <small class="muted">${esc([o.c.phone, paxText(o.c), o.c.budget != null ? money(o.c.budget, 'AZN') : ''].filter(Boolean).join(' · '))}</small></div>`;
      }
      if (o.kind === 'new') return `<div class="cl-opt cl-opt-new${act}" role="option" data-cl-opt="${i}">➕ ${esc(t('cl_new_named', { n: o.name }))}</div>`;
      return `<div class="cl-opt cl-opt-all${act}" role="option" data-cl-opt="${i}">👤 ${esc(t('cl_all'))}</div>`;
    }).join('') + (cs.loaded ? '' : `<div class="cl-opt muted">${esc(t('q_loading'))}</div>`);
    drop.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }
  function hideDrop() { drop.hidden = true; cs.idx = -1; input.setAttribute('aria-expanded', 'false'); }
  function choose(i) {
    const o = cs.opts && cs.opts[i];
    if (!o) return;
    hideDrop();
    if (o.kind === 'client') pick(o.c);
    else if (o.kind === 'new') openModal({ view: 'card', card: null, prefill: { name: o.name, ...formPax() } });
    else openModal({ view: 'list' });
  }
  // Yeni müştəri: formadakı cari sərnişin/büdcə dəyərləri ilə
  function formPax() {
    const ages = readChildAges($('#childAges'));
    const budget = $('#maxPrice').value;
    return { adults: Number($('#adults').value) || 2, childAges: ages, budget: budget === '' ? null : Number(budget), board: $('#board').value || '', destinations: $('#dest').value.trim() ? [$('#dest').value.trim()] : [] };
  }

  input.addEventListener('focus', () => { load().then(() => { if (document.activeElement === input) renderDrop(); }); renderDrop(); });
  input.addEventListener('input', () => {
    if (input.dataset.clientId) setLinked(null); // əl ilə dəyişdirildi → müştəri kartı ilə əlaqə kəsilir
    cs.idx = -1;
    renderDrop();
  });
  input.addEventListener('keydown', (e) => {
    if (drop.hidden && e.key === 'ArrowDown') { renderDrop(); return; }
    if (drop.hidden) return;
    const n = (cs.opts || []).length;
    if (e.key === 'ArrowDown') { e.preventDefault(); cs.idx = (cs.idx + 1) % n; renderDrop(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cs.idx = (cs.idx - 1 + n) % n; renderDrop(); }
    else if (e.key === 'Enter' && cs.idx >= 0) { e.preventDefault(); choose(cs.idx); }
    else if (e.key === 'Escape') hideDrop();
  });
  input.addEventListener('blur', () => setTimeout(hideDrop, 150));
  drop.addEventListener('mousedown', (e) => {
    const o = e.target.closest('[data-cl-opt]');
    if (!o) return;
    e.preventDefault();
    choose(Number(o.dataset.clOpt));
  });
  cardBtn.addEventListener('click', () => { if (input.dataset.clientId) openModal({ view: 'card', card: input.dataset.clientId }); });
  input.addEventListener('b2b:client-set', () => { markLinked(); if (input.dataset.clientId && !cs.loaded) load(); });

  // Seçilmiş müştəri üçün edilən axtarış → kartdakı "son axtarışlar" (serverdə, agentlik daxilində)
  document.addEventListener('b2b:search', async (e) => {
    const id = input.dataset.clientId;
    if (!id || !e.detail || !e.detail.params) return;
    try {
      await send('POST', `/api/b2b/clients/${encodeURIComponent(id)}/searches`, { query: e.detail.params });
    } catch (err) {
      if (err.status === 404) { setLinked(null); cs.list = cs.list.filter((c) => c.id !== id); } else fail(err);
    }
  });

  // ------------------------------------------------------------ "👤 Müştərilər" pəncərəsi
  function listHtml() {
    const q = cs.q.toLowerCase();
    const rows = cs.list.filter((c) => !q || c.name.toLowerCase().includes(q) || String(c.phone || '').includes(q));
    return `
      <div class="sl-top"><h3 id="clTitle">${esc(t('cl_title'))}</h3><button type="button" class="btn secondary sm" data-cl-close>${esc(t('sl_close'))}</button></div>
      <p class="muted sl-sub">${esc(t('cl_sub', { d: cs.retentionDays || 365 }))}</p>
      <div class="cl-toolbar"><input id="clSearch" type="search" maxlength="80" value="${esc(cs.q)}" placeholder="${esc(t('cl_search_ph'))}" aria-label="${esc(t('cl_search_ph'))}">
        <button type="button" class="btn sm primary" data-cl-new>➕ ${esc(t('cl_new'))}</button></div>
      ${rows.length ? `<ul class="cl-list">${rows.map((c) => `<li><button type="button" class="cl-row" data-cl-open="${esc(c.id)}">
          <span><b>${esc(c.name)}</b>${c.phone ? ` <small class="muted">${esc(c.phone)}</small>` : ''}<br>
          <small class="muted">${esc([paxText(c), c.budget != null ? t('cl_budget_v', { v: money(c.budget, 'AZN') }) : '', (c.destinations || []).join(', ')].filter(Boolean).join(' · '))}</small></span>
          <small class="muted">${esc(fmtDate(String(c.lastActivityAt || c.updatedAt || '').slice(0, 10) || '2000-01-01'))}</small></button></li>`).join('')}</ul>`
        : `<p class="muted sl-empty">${esc(cs.loaded ? t('cl_empty') : t('q_loading'))}</p>`}`;
  }

  function formHtml(c) {
    const v = c || cs.prefill || {};
    const ages = (v.childAges || []).join(', ');
    return `<form class="cl-form" id="clForm" autocomplete="off" novalidate>
      <div class="cl-grid">
        <div class="cl-wide"><label for="clName">${esc(t('cl_name'))} *</label><input id="clName" name="name" required maxlength="80" value="${esc(v.name || '')}"></div>
        <div><label for="clPhone">${esc(t('cl_phone'))}</label><input id="clPhone" name="phone" maxlength="30" inputmode="tel" value="${esc(v.phone || '')}" placeholder="+994 50 000 00 00"></div>
        <div><label for="clEmail">${esc(t('cl_email'))}</label><input id="clEmail" name="email" type="email" maxlength="120" value="${esc(v.email || '')}"></div>
        <div><label for="clAdults">${esc(t('cl_adults'))}</label><input id="clAdults" name="adults" type="number" min="1" max="8" value="${esc(v.adults || 2)}"></div>
        <div><label for="clAges">${esc(t('cl_ages'))}</label><input id="clAges" name="childAges" maxlength="30" value="${esc(ages)}" placeholder="4, 9"></div>
        <div><label for="clBudget">${esc(t('cl_budget'))}</label><input id="clBudget" name="budget" type="number" min="0" max="10000000" step="50" value="${esc(v.budget ?? '')}"></div>
        <div><label for="clBoard">${esc(t('cl_board'))}</label><select id="clBoard" name="board">${BOARDS.map((b) => `<option value="${b}" ${b === (v.board || '') ? 'selected' : ''}>${b ? esc(b) : '—'}</option>`).join('')}</select></div>
        <div class="cl-wide"><label for="clDest">${esc(t('cl_dests'))}</label><input id="clDest" name="destinations" maxlength="300" value="${esc((v.destinations || []).join(', '))}" placeholder="Antalya, Dubay"></div>
        <div class="cl-wide"><label for="clNote">${esc(t('cl_note'))}</label><textarea id="clNote" name="note" maxlength="1000" rows="3">${esc(v.note || '')}</textarea></div>
      </div>
      <div class="crm-err" id="clErr" role="alert"></div>
      <div class="crm-actions">
        ${c ? `<button type="button" class="btn secondary sm${cs.confirmForget ? ' danger' : ''}" data-cl-forget>${esc(cs.confirmForget ? t('cl_forget_confirm') : '🗑 ' + t('cl_forget'))}</button><span style="flex:1"></span>` : ''}
        ${c ? `<button type="button" class="btn secondary sm" data-cl-pick>${esc(t('cl_use'))}</button>` : ''}
        <button class="btn sm primary" id="clSave">${esc(c ? t('crm_save') : t('cl_create'))}</button>
      </div>
      ${c ? `<small class="muted">${esc(t('cl_forget_hint'))}</small>` : ''}
    </form>`;
  }

  function searchLabel(x) {
    const pax = `${x.adults || 2}+${x.children || 0}`;
    return [x.q || x.destinationId, x.checkIn ? fmtDate(x.checkIn) : '', x.nights ? `${x.nights}${x.nightsTo && x.nightsTo !== x.nights ? '–' + x.nightsTo : ''} ${t('cl_n')}` : '', pax].filter(Boolean).join(' · ');
  }

  function historyHtml(h) {
    const a = App();
    const price = (n) => money(a ? a.withMarkup(n) : n, 'AZN');
    const sec = (title, body, n) => `<details class="cl-hist" ${n ? 'open' : ''}><summary><b>${esc(title)}</b> <span class="badge">${n}</span></summary>${body}</details>`;
    const searches = h.searches.length ? `<ul class="cl-hlist">${h.searches.map((x, i) => `<li><button type="button" class="linklike" data-cl-search="${i}">🔎 ${esc(searchLabel(x))}</button>
      <small class="muted">${esc(fmtDate(String(x.at || '').slice(0, 10) || '2000-01-01'))}</small></li>`).join('')}</ul>` : `<p class="muted">${esc(t('cl_none'))}</p>`;
    const sl = h.shortlist.length ? h.shortlist.map((g) => `<div class="cl-slg"><b>♥ ${esc(g.client || t('sl_noclient'))}</b> <small class="muted">${esc(t('sl_count', { n: g.items.length }))}</small>
      <ul class="cl-hlist">${g.items.map((x) => `<li><span>${esc(x.name || '—')} <small class="muted">${esc([x.destination, x.checkIn ? fmtDate(x.checkIn) : '', x.nights ? t('ch_nights', { n: x.nights }) : ''].filter(Boolean).join(' · '))}</small></span>
        <b>${x.available ? price(x.netPrice) : esc(t('sl_unavailable'))}</b></li>`).join('')}</ul></div>`).join('') : `<p class="muted">${esc(t('cl_none'))}</p>`;
    const sel = h.selections.length ? `<ul class="cl-hlist">${h.selections.map((s) => `<li><span><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(location.origin + s.url)}</a><br>
      <small class="muted">${esc(t('sl_count', { n: s.items }))}${s.hotels.length ? ' · ' + esc(s.hotels.join(', ')) : ''}</small></span><small class="muted">${esc(fmtDate(s.createdAt.slice(0, 10)))}</small></li>`).join('')}</ul>` : `<p class="muted">${esc(t('cl_none'))}</p>`;
    const leads = h.leads.length ? `<ul class="cl-hlist">${h.leads.map((l) => `<li><span><b>${esc(l.name)}</b> <span class="st st-${esc(l.status)}">${esc(t('crm_st_' + l.status))}</span>${l.item ? `<br><small class="muted">${esc(l.item.name || '')}${l.item.checkIn ? ' · ' + esc(fmtDate(l.item.checkIn)) : ''}${l.item.clientPrice ? ' · ' + esc(money(l.item.clientPrice, 'AZN')) : ''}</small>` : ''}</span>
      <small class="muted">${esc(fmtDate(String(l.createdAt).slice(0, 10)))}</small></li>`).join('')}</ul>` : `<p class="muted">${esc(t('cl_none'))}</p>`;
    return `<h4>${esc(t('cl_history'))}</h4>
      ${sec(t('cl_h_searches'), searches, h.searches.length)}
      ${sec(t('cl_h_shortlist'), sl, h.shortlist.reduce((n, g) => n + g.items.length, 0))}
      ${sec(t('cl_h_links'), sel, h.selections.length)}
      ${sec(t('cl_h_leads'), leads, h.leads.length)}`;
  }

  function renderModal() {
    const body = $('#clBody');
    if (cs.view === 'list') { body.innerHTML = listHtml(); return; }
    const h = cs.cardData;
    const c = h ? h.client : null;
    body.innerHTML = `
      <div class="sl-top"><h3 id="clTitle">${esc(c ? c.name : t('cl_new'))}</h3>
        <div class="sl-group-act"><button type="button" class="btn secondary sm" data-cl-back>← ${esc(t('cl_all'))}</button><button type="button" class="btn secondary sm" data-cl-close>${esc(t('sl_close'))}</button></div></div>
      ${c ? `<p class="muted sl-sub">${esc(t('cl_meta', { by: c.createdBy || '—', d: fmtDate(String(c.createdAt).slice(0, 10)) }))}</p>` : `<p class="muted sl-sub">${esc(t('cl_private'))}</p>`}
      ${cs.view === 'card' && cs.card && !h ? `<div class="spinner"></div>` : formHtml(c)}
      ${h ? historyHtml(h) : ''}`;
  }

  async function openCard(id) {
    cs.view = 'card'; cs.card = id; cs.cardData = null; cs.confirmForget = false;
    renderModal();
    if (!id) return;
    try {
      cs.cardData = await getJson(`/api/b2b/clients/${encodeURIComponent(id)}`);
      upsert(cs.cardData.client);
      renderModal();
    } catch (err) {
      if (err.status === 404) { cs.list = cs.list.filter((c) => c.id !== id); toast(t('cl_not_found')); cs.view = 'list'; renderModal(); } else fail(err);
    }
  }

  function openModal({ view = 'list', card = null, prefill = null } = {}) {
    const a = App();
    if (!a || !a.me) return;
    cs.prefill = prefill;
    $('#clModal').classList.add('open');
    if (view === 'card') openCard(card);
    else { cs.view = 'list'; renderModal(); load().then(() => { if (cs.view === 'list' && $('#clModal').classList.contains('open')) renderModal(); }); }
  }
  const closeModal = () => $('#clModal').classList.remove('open');

  function readForm(f) {
    const ages = f.childAges.value.trim() ? f.childAges.value.split(/[,;\s]+/).filter(Boolean).map((x) => Number(x)) : [];
    if (ages.some((x) => !Number.isInteger(x) || x < 0 || x > 17)) throw new Error(t('cl_ages_err'));
    return {
      name: f.name.value, phone: f.phone.value, email: f.email.value, adults: Number(f.adults.value) || 2, childAges: ages,
      budget: f.budget.value === '' ? null : Number(f.budget.value), board: f.board.value,
      destinations: f.destinations.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 10), note: f.note.value,
    };
  }

  // Kartdakı köhnə axtarışı təkrarla: forma doldurulur və axtarış göndərilir
  function rerun(x, c) {
    const set = (sel, v) => { $(sel).value = v ?? ''; };
    set('#dest', x.q || '');
    if (x.destinationId) $('#dest').dataset.id = x.destinationId; else delete $('#dest').dataset.id;
    set('#checkIn', x.checkIn); set('#checkInTo', x.checkInTo || x.checkIn);
    set('#nights', x.nights); set('#nightsTo', x.nightsTo || x.nights);
    set('#adults', x.adults || 2); set('#children', x.children || 0); set('#maxPrice', x.maxPrice || '');
    renderChildAges($('#childAges'), x.children || 0, String(x.childAges || '').split(',').filter(Boolean).map(Number));
    if (['package', 'hotel', 'tour'].includes(x.type)) $(`#typeTabs [data-type="${x.type}"]`).click();
    if (c) setLinked(c);
    closeModal();
    $('#b2bForm').requestSubmit();
  }

  // Ortaq kompüterdə: unudulmuş müştərinin adı "Son sorğular"da (localStorage) qalmasın
  function purgeLocalHistory(c) {
    const h = store.get('b2bHistory', []);
    const name = c.name.toLowerCase();
    const next = h.filter((x) => x.clientId !== c.id && String(x.client || '').toLowerCase() !== name);
    if (next.length !== h.length) { store.set('b2bHistory', next); const a = App(); if (a && a.refreshHistory) a.refreshHistory(); }
  }

  $('#clBtn').addEventListener('click', () => openModal({ view: 'list' }));
  $('#clModal').addEventListener('click', async (e) => {
    if (e.target.id === 'clModal' || e.target.closest('[data-cl-close]')) { closeModal(); return; }
    if (e.target.closest('[data-cl-back]')) { cs.view = 'list'; renderModal(); return; }
    if (e.target.closest('[data-cl-new]')) { cs.prefill = { name: cs.q, ...formPax(), stay: true }; openCard(null); return; }
    const op = e.target.closest('[data-cl-open]');
    if (op) { openCard(op.dataset.clOpen); return; }
    const c = cs.cardData && cs.cardData.client;
    if (e.target.closest('[data-cl-pick]') && c) { pick(c); closeModal(); return; }
    const sr = e.target.closest('[data-cl-search]');
    if (sr && cs.cardData) { rerun(cs.cardData.searches[Number(sr.dataset.clSearch)] || {}, c); return; }
    const fg = e.target.closest('[data-cl-forget]');
    if (fg && c) {
      if (!cs.confirmForget) { cs.confirmForget = true; renderModal(); setTimeout(() => { if (cs.confirmForget) { cs.confirmForget = false; if (cs.view === 'card') renderModal(); } }, 6000); return; }
      fg.disabled = true;
      try {
        const r = await send('DELETE', `/api/b2b/clients/${encodeURIComponent(c.id)}`);
        cs.list = cs.list.filter((x) => x.id !== c.id);
        if (input.dataset.clientId === c.id) { input.value = ''; setLinked(null); }
        purgeLocalHistory(c);
        cs.confirmForget = false; cs.cardData = null; cs.view = 'list';
        renderModal();
        toast(t('cl_forgotten', { s: r.anonymized.shortlist, l: r.anonymized.selections, m: r.anonymized.leads }));
        document.dispatchEvent(new CustomEvent('b2b:clients-changed'));
      } catch (err) { fail(err); fg.disabled = false; }
    }
  });
  $('#clModal').addEventListener('input', (e) => { if (e.target.id === 'clSearch') { cs.q = e.target.value; const pos = e.target.selectionStart; renderModal(); const s = $('#clSearch'); s.focus(); s.setSelectionRange(pos, pos); } });
  $('#clModal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id !== 'clForm') return;
    const err = $('#clErr');
    err.textContent = '';
    let body;
    try { body = readForm(f); } catch (x) { err.textContent = x.message; return; }
    $('#clSave').disabled = true;
    try {
      const existing = cs.cardData && cs.cardData.client;
      const r = existing ? await send('PATCH', `/api/b2b/clients/${encodeURIComponent(existing.id)}`, body) : await send('POST', '/api/b2b/clients', body);
      upsert(r.client);
      toast(t('cl_saved'));
      if (!existing && cs.prefill && !cs.prefill.stay) {
        // Seçicidən yaradılıb → dərhal seçilir və forma dolur
        cs.prefill = null;
        pick(r.client);
        closeModal();
        return;
      }
      await openCard(r.client.id);
    } catch (x) {
      if (!(App() && App().onAuthError(x))) err.textContent = x.message;
      const b = $('#clSave'); if (b) b.disabled = false;
    }
  });

  // ------------------------------------------------------------ b2b.js hadisələri
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#clModal').classList.contains('open')) closeModal(); });
  document.addEventListener('langchange', () => { markLinked(); if ($('#clModal').classList.contains('open')) renderModal(); });
  document.addEventListener('b2b:session', (e) => {
    if (e.detail && e.detail.me) load();
    else { cs.list = []; cs.loaded = false; cs.cardData = null; closeModal(); hideDrop(); input.value = ''; setLinked(null); }
  });
  if (App() && App().me) load();
})();
