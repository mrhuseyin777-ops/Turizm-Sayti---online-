// Agentliyin müştəriyə paylaşdığı seçim səhifəsi (/s/<id> və ya /s.html?id=<id>).
// Operator adları və net qiymət serverdən heç gəlmir — yalnız müştəri qiyməti.
(async function () {
  const $ = (s) => document.querySelector(s);
  const id = (location.pathname.match(/^\/s\/([A-Za-z0-9_-]{12})$/) || [])[1] || new URLSearchParams(location.search).get('id') || '';
  let sel = null;

  function render() {
    $('#made').textContent = t('s_made');
    $('#payStrip').innerHTML = paymentStripHtml();
    if (!sel) return;
    document.title = `${sel.agency} — ${t('s_title')}`;
    $('#agency').textContent = sel.agency;
    $('#by').textContent = `${t('s_title')}${sel.client ? ' · ' + sel.client : ''}${sel.manager ? ' · ' + sel.manager : ''}${sel.phone ? ' · ' + t('s_contact') + ': ' + sel.phone : ''}`;
    $('#intro').innerHTML = sel.message ? `<div class="panel">${esc(sel.message)}</div>` : '';
    const cur = sel.currency;
    $('#items').innerHTML = sel.items.map((it, i) => `<article class="sel-item">
      <div>
        <h3>${i + 1}) ${esc(it.name)} <span class="stars">${starStr(it.stars)}</span></h3>
        <div class="muted" style="font-size:14px">${esc(it.destination)} · ${fmtDate(it.checkIn)} · ${esc(t('nights_n', { n: it.nights }))}${it.boardLabel ? ' · ' + esc(it.boardLabel) : ''}${it.includesFlight ? ' · ✈ ' + esc(t('flight_incl')) : ''}</div>
        <div class="badges">${termBadges(it)}</div>
      </div>
      <div><div class="amount">${money(it.clientPrice, cur)}</div>
        <button class="btn sm" data-want="${i}" style="margin-top:6px">${esc(t('s_want'))}</button></div>
    </article>`).join('');
    $('#priceNote').textContent = t('s_price_note', { pax: sel.pax.adults + sel.pax.children });
  }

  document.addEventListener('langchange', render);
  try {
    sel = await api('/api/selections/' + encodeURIComponent(id));
  } catch (e) {
    $('#agency').textContent = '—';
    $('#items').innerHTML = `<div class="panel empty">${esc(t('s_notfound'))}</div>`;
  }
  render();

  $('#items').addEventListener('click', (e) => {
    const b = e.target.closest('[data-want]'); if (!b) return;
    const it = sel.items[+b.dataset.want];
    $('#modalBody').innerHTML = `<h3>${esc(t('s_want'))}</h3>
      <p class="muted" style="margin-top:-6px">${esc(it.name)} · ${fmtDate(it.checkIn)} · ${money(it.clientPrice, sel.currency)}</p>
      <form id="wantForm">
        <input name="name" required maxlength="80" placeholder="${esc(t('lead_name'))}">
        <input name="phone" required maxlength="30" inputmode="tel" placeholder="${esc(t('lead_phone'))}">
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('lead_note'))}"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>✕</button><button class="btn sm">${esc(t('lead_send'))}</button></div>
      </form>`;
    $('#modal').classList.add('open');
    $('#wantForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = Object.fromEntries(new FormData(ev.target));
      try {
        await postJson('/api/leads', { ...fd, type: 'selection', selectionId: sel.id, itemIndex: +b.dataset.want });
        $('#modal').classList.remove('open');
        toast(t('s_ok', { agency: sel.agency }));
      } catch (err) { toast(err.message); }
    });
  });
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });
})();
