// B2B: "Ən ucuz təklif" paneli + "♥ Seçilmişlər" (shortlist) + çap/PDF kommersiya təklifinə keçid.
// b2b.js ilə əlaqə yalnız window.B2BApp körpüsü və 'b2b:session' / 'b2b:render' hadisələri ilə (ayrı fayl —
// merge asan olsun). Bütün dinamik mətn esc() ilə; inline skript/hadisə atributu yoxdur (CSP).
(function () {
  const $ = (s) => document.querySelector(s);
  const CH = window.B2BCheapest;
  const App = () => window.B2BApp;
  const sl = { items: [], loaded: false, busy: new Set() };

  // ------------------------------------------------------------ Ümumi köməkçilər
  async function send(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', headers, body: JSON.stringify(body || {}) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }
  const authFail = (err) => { const a = App(); return a && a.onAuthError(err); };
  const fail = (err) => { if (!authFail(err)) toast(err.message); };
  const opDot = (color) => `<span class="dot" style="background:${esc(/^#[0-9a-fA-F]{3,8}$/.test(color || '') ? color : '#94a3b8')}"></span>`;
  const opLink = (o, label, cls = 'btn secondary sm') => (o && (o.operatorLink !== false) && /^https:\/\//.test(o.url || '')
    ? `<a class="${cls}" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : '');
  const roomOf = (o) => [o.room, o.accommodation].filter(Boolean).join(' / ');
  // Seçilmişin müştəri qiyməti: server komissiya qaydaları ilə hesablayıbsa (clientPrice) o, yoxdursa tək %
  const cpOf = (it, m) => (Number.isFinite(it.clientPrice) ? it.clientPrice : CH.clientPrice(it.netPrice, m));
  const prevCpOf = (it, m) => (Number.isFinite(it.prevClientPrice) ? it.prevClientPrice : CH.clientPrice(it.prevNetPrice, m));
  const markupLabel = (a, m) => (a && a.pricingActive && a.pricingActive() ? t('mk_rules_on') : m ? t('ch_markup', { m }) : '');

  // ------------------------------------------------------------ "Ən ucuz təklif" paneli
  function renderPanel() {
    const a = App();
    const el = $('#cheapestPanel');
    const sum = a && a.summary;
    if (!a || !a.data || !sum || !sum.best) { el.hidden = true; el.innerHTML = ''; return; }
    const b = sum.best;
    const m = a.markup();
    const s2 = sum.second;
    const diff = s2 ? a.withMarkup(s2) - a.withMarkup(b) : null;
    const diffHtml = !s2 ? `<div class="cheap-diff-sub">${esc(t('ch_only'))}</div>`
      : diff > 0 ? `<div class="cheap-diff">${esc(t('ch_cheaper', { v: money(diff, 'AZN') }))}</div>
        <div class="cheap-diff-sub">${esc(t('ch_cheaper_vs', { name: s2.name, op: s2.providerName, price: money(a.withMarkup(s2), 'AZN') }))}</div>`
        : `<div class="cheap-diff-sub">${esc(t('ch_same', { name: s2.name, op: s2.providerName }))}</div>`;
    const facts = [
      `${opDot(b.providerColor)}<b>${esc(b.providerName)}</b>`,
      `📅 ${esc(fmtDate(b.checkIn))}`,
      `🌙 ${esc(t('ch_nights', { n: b.nights }))}`,
      b.board ? `🍽 ${esc(b.boardLabel ? `${b.boardLabel} (${b.board})` : b.board)}` : '',
      roomOf(b) ? `🛏 ${esc(roomOf(b))}` : '',
      b.includesFlight ? `✈ ${esc(t('ch_flight'))}${b.flight ? ' · ' + esc(b.flight.out.time) : ''}` : '',
    ].filter(Boolean).map((x) => `<span class="cheap-fact">${x}</span>`).join('');
    const inSl = sl.items.some((x) => x.offerId === b.id);
    const mini = (o, label) => (o
      ? `<span class="cheap-chip"><span class="cheap-chip-l">${label}</span> <b>${money(a.withMarkup(o), 'AZN')}</b> <span class="cheap-chip-n">${esc(o.name)}${o.providerName ? ' · ' + esc(o.providerName) : ''}</span><button type="button" class="fav-btn${sl.items.some((x) => x.offerId === o.id) ? ' on' : ''}" data-fav="${esc(o.id)}" title="${esc(t('sl_add'))}" aria-label="${esc(t('sl_add'))}">${sl.items.some((x) => x.offerId === o.id) ? '♥' : '♡'}</button></span>`
      : `<span class="cheap-chip muted"><span class="cheap-chip-l">${label}</span> ${esc(t('ch_none'))}</span>`);
    el.innerHTML = `
      <div class="cheap-main">
        <div class="cheap-head"><span class="cheap-trophy" aria-hidden="true">🏆</span>
          <div><h2>${esc(t('ch_title'))}</h2><small>${esc(t('ch_sub'))}</small></div></div>
        <div class="cheap-body">
          <div class="cheap-info">
            <div class="cheap-hotel">${esc(b.name)} <span class="stars">${starStr(b.stars)}</span></div>
            <div class="muted">${esc(b.destination ? b.destination.name : '')}${b.district ? ' · ' + esc(b.district) : ''}</div>
            <div class="cheap-facts">${facts}</div>
            <div class="badges tight">${termBadges(b)}</div>
          </div>
          <div class="cheap-price">
            <div class="cheap-net"><small>${esc(t('ch_net'))}</small> ${money(b.price, 'AZN')}</div>
            <small class="muted">${esc(t('ch_client'))}${markupLabel(a, m) ? ' · ' + esc(markupLabel(a, m)) : ''}</small>
            <div class="cheap-big">${money(a.withMarkup(b), 'AZN')}</div>
            ${diffHtml}
          </div>
        </div>
        <div class="cheap-actions">
          <button type="button" class="btn sm primary" data-ch-act="quote">${esc(t('ch_add_quote'))}</button>
          <button type="button" class="btn secondary sm" data-ch-act="share">${esc(t('ch_add_share'))}</button>
          <button type="button" class="btn secondary sm${inSl ? ' on' : ''}" data-fav="${esc(b.id)}">${inSl ? '♥' : '♡'} ${esc(t('sl_add'))}</button>
          ${b.itemType === 'hotel' ? `<button type="button" class="btn secondary sm hl-btn" data-hl="${esc(b.itemId)}">☆ ${esc(t('hl_add'))}</button>` : ''}
          ${opLink(b, t('ch_check_op'))}
        </div>
        ${sum.excludedStopSale ? `<small class="muted">${esc(t('ch_stop_note', { n: sum.excludedStopSale }))}</small>` : ''}
      </div>
      <div class="cheap-mini">
        <div class="cheap-row"><span class="cheap-row-t">${esc(t('ch_by_stars'))}</span>
          <div class="cheap-chips">${CH.STAR_CLASSES.map((s) => mini(sum.byStars[s], `${s}★`)).join('')}</div></div>
        <div class="cheap-row"><span class="cheap-row-t">${esc(t('ch_by_op'))}</span>
          <div class="cheap-chips">${sum.byOperator.map((o) => mini({ ...o, providerName: '' }, `${opDot(o.providerColor)}${esc(o.providerName)}`)).join('')}</div></div>
      </div>`;
    el.hidden = false;
    el.dataset.best = b.id;
    // Telefonda forma uzundur: yeni axtarış nəticəsində ən ucuz təklif dərhal görünsün
    if (sl.shownFor !== a.data) {
      sl.shownFor = a.data;
      if (matchMedia('(max-width: 760px)').matches && el.getBoundingClientRect().top > innerHeight * 0.6) el.scrollIntoView({ block: 'start' });
    }
  }

  $('#cheapestPanel').addEventListener('click', (e) => {
    const act = e.target.closest('[data-ch-act]');
    if (!act) return;
    const a = App();
    const id = $('#cheapestPanel').dataset.best;
    if (a && id) a.select(id, act.dataset.chAct === 'quote' ? 'quote' : 'share');
  });

  // ------------------------------------------------------------ Seçilmişlər: yükləmə və əlavə
  async function loadShortlist() {
    const a = App();
    if (!a || !a.me) return;
    try {
      const r = await fetch('/api/b2b/shortlist', { credentials: 'same-origin', cache: 'no-store' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { const er = new Error(data.error || 'Xəta'); er.status = r.status; throw er; }
      sl.items = data.items || [];
      sl.loaded = true;
      syncMarks();
      if ($('#slModal').classList.contains('open')) renderShortlist();
    } catch (err) { if (!authFail(err)) console.warn('[shortlist]', err.message); }
  }

  // ♡/♥ işarələri və sayğac (nəticələrdə və paneldə)
  function syncMarks() {
    $('#slCount').textContent = sl.items.length;
    const ids = new Set(sl.items.map((x) => x.offerId));
    document.querySelectorAll('#tableWrap [data-fav], #cheapestPanel [data-fav]').forEach((b) => {
      const on = ids.has(b.dataset.fav);
      b.classList.toggle('on', on);
      if (b.classList.contains('fav-btn')) b.textContent = on ? '♥' : '♡';
      else b.textContent = `${on ? '♥' : '♡'} ${t('sl_add')}`;
    });
  }

  async function addToShortlist(offerId, btn) {
    const a = App();
    if (!a || !a.data || !a.lastParams) return toast('Əvvəlcə axtarış edin');
    if (btn) btn.disabled = true;
    try {
      const r = await postJson('/api/b2b/shortlist', { client: a.client(), clientId: (a.clientId && a.clientId()) || undefined, query: a.lastParams, offerId });
      if (r.existed) toast(t('sl_exists'));
      else {
        sl.items.unshift(r.item);
        toast(t('sl_added', { c: r.item.client || t('sl_noclient') }));
      }
      syncMarks();
    } catch (err) { fail(err); } finally { if (btn) btn.disabled = false; }
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('#tableWrap [data-fav], #cheapestPanel [data-fav]');
    if (b) { e.preventDefault(); addToShortlist(b.dataset.fav, b); }
  });

  // ------------------------------------------------------------ Seçilmişlər pəncərəsi
  const groupItems = (client) => sl.items.filter((x) => x.client === client);
  const trendHtml = (it, m) => {
    const tr = CH.priceTrend(it);
    if (!tr) return '';
    const d = Math.abs(cpOf(it, m) - prevCpOf(it, m));
    const prev = money(prevCpOf(it, m), 'AZN');
    return tr === 'up'
      ? `<span class="trend up" title="${esc(t('sl_up_t', { p: prev }))}">${esc(t('sl_up', { v: money(d, 'AZN') }))}</span>`
      : `<span class="trend down" title="${esc(t('sl_down_t', { p: prev }))}">${esc(t('sl_down', { v: money(d, 'AZN') }))}</span>`;
  };

  function itemHtml(it, m) {
    const busy = sl.busy.has(it.id);
    return `<li class="sl-item${it.available ? '' : ' gone'}" data-sl-id="${esc(it.id)}">
      <div class="sl-item-main">
        <b>${esc(it.name)}</b> <span class="stars">${starStr(it.stars)}</span>
        <div class="muted sl-meta">${esc(it.destination)}${it.district ? ' · ' + esc(it.district) : ''} · ${esc(it.checkIn ? fmtDate(it.checkIn) : '')} · ${esc(t('ch_nights', { n: it.nights }))}${it.board ? ' · ' + esc(it.board) : ''}${roomOf(it) ? ' · ' + esc(roomOf(it)) : ''}</div>
        <div class="sl-meta">${opDot(it.providerColor)}${esc(it.providerName)} · <small class="muted">${esc(checkedAgo(it.checkedAt))}</small>
          ${it.available ? '' : `<span class="badge stop">${esc(t('sl_unavailable'))}</span>`}</div>
      </div>
      <div class="sl-item-price">
        <small class="muted">${esc(t('ch_net'))} ${money(it.netPrice, 'AZN')}</small>
        <b>${money(cpOf(it, m), 'AZN')}</b>
        ${trendHtml(it, m)}
      </div>
      <div class="sl-item-act">
        <button type="button" class="btn secondary sm" data-sl-act="refresh" ${busy ? 'disabled' : ''}>${esc(t('sl_refresh'))}</button>
        ${opLink(it, t('sl_open_op').replace(' ↗', ''))}
        <button type="button" class="btn secondary sm sl-del" data-sl-act="remove" aria-label="${esc(t('sl_remove'))}">✕</button>
      </div>
    </li>`;
  }

  function renderShortlist() {
    const a = App();
    const m = a ? a.markup() : 0;
    const groups = CH.groupShortlist(sl.items);
    $('#slBody').innerHTML = `
      <div class="sl-top"><h3 id="slTitle">${esc(t('sl_title'))} <span class="badge">${sl.items.length}</span></h3>
        <button type="button" class="btn secondary sm" data-sl-close>${esc(t('sl_close'))}</button></div>
      <p class="muted sl-sub">${esc(t('sl_sub'))}${markupLabel(a, m) ? ' · ' + esc(markupLabel(a, m)) : ''}</p>
      ${a && !a.client() ? `<p class="sl-hint">${esc(t('sl_client_hint'))}</p>` : ''}
      ${groups.length ? groups.map((g, gi) => `<section class="sl-group" data-sl-group="${gi}">
        <div class="sl-group-head">
          <div><b>${esc(g.client || t('sl_noclient'))}</b> <small class="muted">${esc(t('sl_count', { n: g.items.length }))}</small></div>
          <div class="sl-group-act">
            <button type="button" class="btn secondary sm" data-sl-gact="text">${esc(t('sl_text'))}</button>
            <button type="button" class="btn secondary sm" data-sl-gact="link">${esc(t('sl_link'))}</button>
            <a class="btn sm primary" target="_blank" rel="noopener noreferrer" href="/quote.html#${esc(new URLSearchParams({ c: g.client, m: String(m) }).toString())}">${esc(t('sl_print'))}</a>
            <button type="button" class="btn secondary sm" data-sl-gact="refresh">${esc(t('sl_refresh_all'))}</button>
          </div>
        </div>
        <ul class="sl-list">${g.items.map((it) => itemHtml(it, m)).join('')}</ul>
        <div class="sl-out" data-sl-out></div>
      </section>`).join('') : `<p class="muted sl-empty">${esc(t('sl_empty'))}</p>`}`;
    sl.groups = groups;
  }

  function openShortlist() {
    renderShortlist();
    $('#slModal').classList.add('open');
    loadShortlist();
  }
  $('#slBtn').addEventListener('click', openShortlist);
  $('#slModal').addEventListener('click', (e) => {
    if (e.target.id === 'slModal' || e.target.closest('[data-sl-close]')) { $('#slModal').classList.remove('open'); return; }
    const act = e.target.closest('[data-sl-act]');
    if (act) {
      const id = act.closest('[data-sl-id]').dataset.slId;
      if (act.dataset.slAct === 'refresh') refreshItems([id]);
      else if (act.dataset.slAct === 'remove') removeItem(id);
      return;
    }
    const g = e.target.closest('[data-sl-gact]');
    if (g) {
      const sec = g.closest('[data-sl-group]');
      const grp = sl.groups[+sec.dataset.slGroup];
      if (!grp) return;
      const kind = g.dataset.slGact;
      if (kind === 'refresh') refreshItems(groupItems(grp.client).map((x) => x.id));
      else if (kind === 'text') showText(grp.client, sec.querySelector('[data-sl-out]'));
      else if (kind === 'link') createLink(grp.client, sec.querySelector('[data-sl-out]'), g);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#slModal').classList.remove('open'); });

  async function refreshItems(ids) {
    let changed = 0;
    for (const id of ids) {
      sl.busy.add(id);
      renderShortlist();
      try {
        const r = await postJson(`/api/b2b/shortlist/${encodeURIComponent(id)}/refresh`, {});
        const i = sl.items.findIndex((x) => x.id === id);
        if (i >= 0) sl.items[i] = r.item;
        if (r.changed) changed++;
      } catch (err) { fail(err); if (err.status === 401) break; } finally { sl.busy.delete(id); }
    }
    renderShortlist();
    toast(changed ? `${t('sl_refreshed')}: ${changed}` : t('sl_same'));
  }

  async function removeItem(id) {
    try {
      await send('DELETE', `/api/b2b/shortlist/${encodeURIComponent(id)}`);
      sl.items = sl.items.filter((x) => x.id !== id);
      renderShortlist();
      syncMarks();
      toast(t('sl_removed'));
    } catch (err) { fail(err); }
  }

  // Müştəriyə təklif mətni (operator adı yoxdur, yalnız müştəri qiyməti)
  function quoteText(client) {
    const a = App();
    const m = a.markup();
    const s = a.sessionInfo();
    const list = groupItems(client).filter((x) => x.available).sort((x, y) => cpOf(x, m) - cpOf(y, m));
    const lines = [
      t('sl_hello', { c: client ? ', ' + client : '' }),
      '',
      ...list.map((o, i) => [
        `${i + 1}) ${o.name} ${starStr(o.stars)}${o.destination ? ' — ' + o.destination : ''}`,
        `   📅 ${o.checkIn ? fmtDate(o.checkIn) : ''} · ${t('ch_nights', { n: o.nights })}${o.boardLabel ? ' · ' + o.boardLabel + ' (' + o.board + ')' : ''}${o.includesFlight ? ' · ✈ ' + t('ch_flight') : ''}`,
        roomOf(o) || o.district ? `   🛏 ${[roomOf(o), o.district].filter(Boolean).join(' · ')}` : '',
        `   💰 ${money(cpOf(o, m), 'AZN')} ${t('sl_total')}`,
      ].filter(Boolean).join('\n')),
      '',
      t('sl_price_note'),
      window.B2BBrand ? window.B2BBrand.signature(s) : (s.manager ? t('sl_regards', { m: s.manager, a: s.agency }) : ''),
    ];
    return lines.filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\n').trim();
  }

  function showText(client, out) {
    const text = quoteText(client);
    out.innerHTML = `<b>${esc(t('sl_text_title'))}</b><textarea class="quote" readonly>${esc(text)}</textarea>
      <div class="sl-out-act"><button type="button" class="btn secondary sm" data-copy>${esc(t('b2b_copy'))}</button>
      <a class="btn sm primary" target="_blank" rel="noopener noreferrer" href="${esc('https://wa.me/?text=' + encodeURIComponent(text))}">WhatsApp</a></div>`;
    out.querySelector('[data-copy]').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text); toast('Kopyalandı'); } catch { out.querySelector('textarea').select(); }
    });
  }

  async function createLink(client, out, btn) {
    btn.disabled = true;
    try {
      // Server hər variantı öz axtarış parametrləri ilə yenidən tapır, qiyməti özü hesablayır
      const r = await postJson('/api/b2b/shortlist/selection', { client, markup: App().markup() });
      if (!/^\/s\/[A-Za-z0-9_-]{12}$/.test(r.url || '')) throw new Error('Gözlənilməz cavab');
      const url = location.origin + r.url;
      out.innerHTML = `<b>${esc(t('sl_link_title'))}</b><div class="share-link"><input readonly value="${esc(url)}" aria-label="URL">
        <button type="button" class="btn secondary sm" data-copy>${esc(t('b2b_copy'))}</button>
        <a class="btn secondary sm" target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">${esc(t('b2b_open'))}</a>
        <a class="btn sm primary" target="_blank" rel="noopener noreferrer" href="${esc('https://wa.me/?text=' + encodeURIComponent(url))}">WhatsApp</a></div>`;
      out.querySelector('[data-copy]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(url); toast('Kopyalandı'); } catch { out.querySelector('input').select(); }
      });
    } catch (err) { fail(err); } finally { btn.disabled = false; }
  }

  // ------------------------------------------------------------ b2b.js hadisələri
  document.addEventListener('b2b:session', (e) => {
    if (e.detail && e.detail.me) loadShortlist();
    else { sl.items = []; sl.loaded = false; syncMarks(); $('#slModal').classList.remove('open'); renderPanel(); }
  });
  document.addEventListener('b2b:render', () => { renderPanel(); syncMarks(); });
  document.addEventListener('langchange', () => { if ($('#slModal').classList.contains('open')) renderShortlist(); });
  $('#markup').addEventListener('input', () => { if ($('#slModal').classList.contains('open')) renderShortlist(); });
  // b2b.js b2b:session hadisəsini bu fayl yüklənməzdən əvvəl göndərmiş ola bilər
  if (App() && App().me) loadShortlist();
})();
