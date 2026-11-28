// B2B "Tövsiyə olunan otel siyahıları": agentliyin daimi otel siyahıları ("Ailələr üçün", "Romantik", "Büdcə" ...).
//  - matrisdə / "Bütün təkliflər"də / "Ən ucuz təklif" panelində ☆ → siyahıya əlavə et / çıxar (menyu)
//  - axtarış formasında "Siyahı" → nəticədə yalnız həmin otellər (b2b.js run() → B2BLists.hotelsParam())
//  - "☆ Siyahılar" pəncərəsi: ad dəyiş, otel çıxar, siyahını sil, axtarışda istifadə et
// Server: /api/b2b/hotel-lists (agentlik sessiyadan, CSRF). Bütün dinamik mətn esc() ilə; inline hadisə yoxdur (CSP).
(function () {
  const $ = (s) => document.querySelector(s);
  const App = () => window.B2BApp;
  const hs = { lists: [], loaded: false, menuFor: null, confirmDel: null };
  const SEL_KEY = 'b2bHotelList';

  async function send(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', headers, body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }
  const fail = (err) => { const a = App(); if (!(a && a.onAuthError(err))) toast(err.message); };
  const byId = (id) => hs.lists.find((l) => l.id === id) || null;
  const inAny = (hotelId) => hs.lists.some((l) => l.hotels.some((h) => h.id === hotelId));

  async function load() {
    const a = App();
    if (!a || !a.me) return;
    try {
      const r = await fetch('/api/b2b/hotel-lists', { credentials: 'same-origin', cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(d.error || 'Xəta'); e.status = r.status; throw e; }
      hs.lists = d.lists || [];
      hs.loaded = true;
      sync();
    } catch (err) { fail(err); }
  }

  function upsert(list) {
    const i = hs.lists.findIndex((l) => l.id === list.id);
    if (i >= 0) hs.lists[i] = list; else hs.lists.push(list);
    hs.lists.sort((x, y) => x.name.localeCompare(y.name, 'az'));
    sync();
  }

  // Forma seçimi + ☆/★ işarələri + açıq pəncərə
  function sync() {
    const sel = $('#hotelList');
    const cur = sel.value || store.get(SEL_KEY, '');
    sel.innerHTML = `<option value="">${esc(t('hl_none'))}</option>` + hs.lists.map((l) => `<option value="${esc(l.id)}">${esc(l.name)} (${l.hotels.length})</option>`).join('');
    sel.value = byId(cur) ? cur : '';
    sel.classList.toggle('hl-active', !!sel.value);
    document.querySelectorAll('[data-hl]').forEach((b) => {
      const on = inAny(b.dataset.hl);
      b.classList.toggle('on', on);
      if (b.classList.contains('fav-btn')) b.textContent = on ? '★' : '☆';
      else b.textContent = `${on ? '★' : '☆'} ${t('hl_add')}`;
    });
    if (hs.menuFor) renderMenu();
    if ($('#hlModal').classList.contains('open')) renderModal();
  }

  // b2b.js run() üçün: seçilmiş siyahının otel id-ləri (otel multi-select-i ilə kəsişmə)
  function hotelsParam(msSel = []) {
    const l = byId($('#hotelList').value);
    if (!l) return msSel.join(',');
    const ids = l.hotels.map((h) => h.id);
    if (!ids.length) return 'empty-list'; // boş siyahı → heç bir otel (bütün otellər deyil)
    const inter = msSel.length ? ids.filter((x) => msSel.includes(x)) : [];
    return (inter.length ? inter : ids).join(',');
  }
  window.B2BLists = { hotelsParam, get lists() { return hs.lists; } };

  $('#hotelList').addEventListener('change', (e) => {
    store.set(SEL_KEY, e.target.value);
    e.target.classList.toggle('hl-active', !!e.target.value);
    const l = byId(e.target.value);
    if (l && !l.hotels.length) toast(t('hl_empty_warn'));
    if ($('#dest').value.trim() && App() && App().data) $('#b2bForm').requestSubmit();
  });

  // ------------------------------------------------------------ ☆ menyusu
  function hotelInfo(itemId) {
    const a = App();
    const d = a && a.data;
    const g = d && d.groups && d.groups.find((x) => x.itemId === itemId);
    const o = g ? g.best : d && d.offers && d.offers.find((x) => x.itemId === itemId);
    if (!o) return null;
    return { id: itemId, name: (g || o).name, destination: ((g || o).destination && (g || o).destination.name) || '', stars: (g || o).stars || 0 };
  }

  function placeMenu(btn) {
    const m = $('#hlMenu');
    const r = btn.getBoundingClientRect();
    const w = Math.min(300, innerWidth - 32);
    m.style.width = `${w}px`;
    const left = Math.min(Math.max(16, r.left), innerWidth - w - 16);
    m.style.left = `${left}px`;
    const below = r.bottom + 6;
    m.style.top = `${Math.max(16, Math.min(below, innerHeight - m.offsetHeight - 16))}px`;
  }

  function renderMenu() {
    const h = hs.menuFor && hs.menuFor.hotel;
    if (!h) return;
    const presets = ['hl_p_family', 'hl_p_romantic', 'hl_p_budget'].map((k) => t(k)).filter((n) => !hs.lists.some((l) => l.name.toLowerCase() === n.toLowerCase()));
    $('#hlMenu').innerHTML = `
      <div class="hl-menu-h"><b>☆ ${esc(t('hl_menu_title'))}</b><button type="button" class="fav-btn" data-hl-close aria-label="${esc(t('sl_close'))}">✕</button></div>
      <div class="muted hl-menu-hotel">${esc(h.name)}${h.stars ? ' ' + esc('★'.repeat(h.stars)) : ''}${h.destination ? ' · ' + esc(h.destination) : ''}</div>
      <div class="hl-menu-lists">${hs.lists.map((l) => {
        const on = l.hotels.some((x) => x.id === h.id);
        return `<button type="button" role="menuitemcheckbox" aria-checked="${on}" class="hl-menu-item${on ? ' on' : ''}" data-hl-toggle="${esc(l.id)}"><span>${on ? '★' : '☆'}</span> ${esc(l.name)} <small class="muted">${l.hotels.length}</small></button>`;
      }).join('') || `<p class="muted">${esc(t('hl_no_lists'))}</p>`}</div>
      ${presets.length ? `<div class="hl-presets">${presets.map((n) => `<button type="button" class="chip" data-hl-preset="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>` : ''}
      <form class="hl-new" data-hl-new><input name="name" maxlength="60" required placeholder="${esc(t('hl_new_ph'))}" aria-label="${esc(t('hl_new_ph'))}"><button class="btn sm primary">${esc(t('hl_create'))}</button></form>`;
  }

  function openMenu(btn, itemId) {
    const a = App();
    if (!a || !a.me) return;
    const hotel = hotelInfo(itemId);
    if (!hotel) return;
    hs.menuFor = { hotel, btn };
    const m = $('#hlMenu');
    renderMenu();
    m.hidden = false;
    placeMenu(btn);
    if (!hs.loaded) load();
  }
  const closeMenu = () => { hs.menuFor = null; $('#hlMenu').hidden = true; };

  async function toggle(listId) {
    const h = hs.menuFor && hs.menuFor.hotel;
    const l = byId(listId);
    if (!h || !l) return;
    const on = l.hotels.some((x) => x.id === h.id);
    try {
      const r = await send('PATCH', `/api/b2b/hotel-lists/${encodeURIComponent(l.id)}`, on ? { removeHotel: h.id } : { addHotel: h });
      upsert(r.list);
      toast(t(on ? 'hl_removed' : 'hl_added', { l: r.list.name }));
    } catch (err) { fail(err); }
  }

  async function createList(name, hotel) {
    try {
      const r = await send('POST', '/api/b2b/hotel-lists', hotel ? { name, hotel } : { name });
      upsert(r.list);
      toast(hotel ? t('hl_added', { l: r.list.name }) : t('hl_created', { l: r.list.name }));
      return r.list;
    } catch (err) { fail(err); return null; }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('#tableWrap [data-hl], #cheapestPanel [data-hl]');
    if (b) { e.preventDefault(); e.stopPropagation(); if (hs.menuFor && hs.menuFor.btn === b) closeMenu(); else openMenu(b, b.dataset.hl); return; }
    if (!hs.menuFor) return;
    if (!e.target.closest('#hlMenu')) { closeMenu(); return; }
    if (e.target.closest('[data-hl-close]')) { closeMenu(); return; }
    const tg = e.target.closest('[data-hl-toggle]');
    if (tg) { toggle(tg.dataset.hlToggle); return; }
    const pr = e.target.closest('[data-hl-preset]');
    if (pr) createList(pr.dataset.hlPreset, hs.menuFor.hotel);
  });
  $('#hlMenu').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    if (name && hs.menuFor) createList(name, hs.menuFor.hotel);
  });
  addEventListener('resize', () => { if (hs.menuFor) placeMenu(hs.menuFor.btn); });

  // ------------------------------------------------------------ "☆ Siyahılar" pəncərəsi
  function renderModal() {
    $('#hlBody').innerHTML = `
      <div class="sl-top"><h3 id="hlTitle">${esc(t('hl_title'))}</h3><button type="button" class="btn secondary sm" data-hl-mclose>${esc(t('sl_close'))}</button></div>
      <p class="muted sl-sub">${esc(t('hl_sub'))}</p>
      <form class="hl-new" data-hl-mnew><input name="name" maxlength="60" required placeholder="${esc(t('hl_new_ph'))}" aria-label="${esc(t('hl_new_ph'))}"><button class="btn sm primary">${esc(t('hl_create'))}</button></form>
      ${hs.lists.length ? hs.lists.map((l) => `<section class="sl-group hl-group" data-list="${esc(l.id)}">
        <div class="sl-group-head">
          <form class="hl-rename" data-hl-rename="${esc(l.id)}"><input name="name" maxlength="60" required value="${esc(l.name)}" aria-label="${esc(t('hl_name'))}"><button class="btn secondary sm">${esc(t('hl_rename'))}</button></form>
          <div class="sl-group-act">
            <button type="button" class="btn sm primary" data-hl-use="${esc(l.id)}">${esc(t('hl_use'))}</button>
            <button type="button" class="btn secondary sm${hs.confirmDel === l.id ? ' danger' : ''}" data-hl-del="${esc(l.id)}">${esc(hs.confirmDel === l.id ? t('hl_del_confirm') : t('hl_delete'))}</button>
          </div>
        </div>
        ${l.hotels.length ? `<ul class="hl-hotels">${l.hotels.map((h) => `<li><span>${esc(h.name)}${h.stars ? ' <span class="stars">' + esc('★'.repeat(h.stars)) + '</span>' : ''}${h.destination ? ` <small class="muted">· ${esc(h.destination)}</small>` : ''}</span>
          <button type="button" class="fav-btn" data-hl-rm="${esc(h.id)}" data-hl-from="${esc(l.id)}" title="${esc(t('hl_remove'))}" aria-label="${esc(t('hl_remove'))}: ${esc(h.name)}">✕</button></li>`).join('')}</ul>`
          : `<p class="muted">${esc(t('hl_list_empty'))}</p>`}
      </section>`).join('') : `<p class="muted sl-empty">${esc(t('hl_no_lists'))}</p>`}`;
  }

  async function openModal() {
    const a = App();
    if (!a || !a.me) return;
    hs.confirmDel = null;
    renderModal();
    $('#hlModal').classList.add('open');
    await load();
  }
  $('#hlBtn').addEventListener('click', openModal);
  $('#hlModal').addEventListener('click', async (e) => {
    if (e.target.id === 'hlModal' || e.target.closest('[data-hl-mclose]')) { $('#hlModal').classList.remove('open'); return; }
    const use = e.target.closest('[data-hl-use]');
    if (use) {
      $('#hotelList').value = use.dataset.hlUse;
      $('#hlModal').classList.remove('open');
      $('#hotelList').dispatchEvent(new Event('change'));
      if (!$('#dest').value.trim()) { toast(t('hl_need_dest')); $('#dest').focus(); }
      return;
    }
    const del = e.target.closest('[data-hl-del]');
    if (del) {
      const id = del.dataset.hlDel;
      if (hs.confirmDel !== id) { hs.confirmDel = id; renderModal(); return; }
      try {
        await send('DELETE', `/api/b2b/hotel-lists/${encodeURIComponent(id)}`);
        hs.lists = hs.lists.filter((l) => l.id !== id);
        hs.confirmDel = null;
        toast(t('sl_removed'));
        sync();
        if (!$('#hotelList').value) store.set(SEL_KEY, '');
      } catch (err) { fail(err); }
      return;
    }
    const rm = e.target.closest('[data-hl-rm]');
    if (rm) {
      try {
        const r = await send('PATCH', `/api/b2b/hotel-lists/${encodeURIComponent(rm.dataset.hlFrom)}`, { removeHotel: rm.dataset.hlRm });
        upsert(r.list);
      } catch (err) { fail(err); }
    }
  });
  $('#hlModal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim();
    if (!name) return;
    if (f.matches('[data-hl-mnew]')) { if (await createList(name)) f.reset(); return; }
    if (f.matches('[data-hl-rename]')) {
      try {
        const r = await send('PATCH', `/api/b2b/hotel-lists/${encodeURIComponent(f.dataset.hlRename)}`, { name });
        upsert(r.list);
        toast(t('hl_renamed'));
      } catch (err) { fail(err); }
    }
  });

  // ------------------------------------------------------------ b2b.js hadisələri
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); $('#hlModal').classList.remove('open'); } });
  document.addEventListener('b2b:render', () => { closeMenu(); sync(); });
  document.addEventListener('langchange', sync);
  document.addEventListener('b2b:session', (e) => {
    if (e.detail && e.detail.me) load();
    else { hs.lists = []; hs.loaded = false; closeMenu(); $('#hlModal').classList.remove('open'); sync(); }
  });
  if (App() && App().me) load();
})();
