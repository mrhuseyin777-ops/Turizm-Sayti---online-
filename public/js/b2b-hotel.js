// B2B: "Otel üzrə müqayisə" — menecerin əsas ssenarisi.
// Müştəri "Rixos Park-ın qiymətini ver" deyir → menecer otelin adını, tarixi və nəfəri yazır →
// sistem həmin otelin BÜTÜN operatorlardakı qiymətlərini ucuzdan bahalıya göstərir (net, müştəri qiyməti,
// menecerin qazancı) və hər operator üçün "Operatorda aç" linki verir. Menecerin 20–30 dəqiqəlik əl işini əvəz edir.
(function () {
  const $ = (s) => document.querySelector(s);
  const box = $('#hotelCmp');
  const dest = $('#dest');
  if (!box || !dest) return;
  const app = () => window.B2BApp || {};
  // Müştəri qiyməti: komissiya qaydaları aktivdirsə serverin clientPrice-ı, yoxdursa formadakı %
  const mk = (o) => (Number.isFinite(o.clientPrice) ? o.clientPrice : typeof app().withMarkup === 'function' ? app().withMarkup(o.price) : o.price);
  let reqSeq = 0;

  // Otel seçimi silinəndə (başqa istiqamət yazılanda) panel gizlənir
  dest.addEventListener('input', () => { box.hidden = true; box.innerHTML = ''; });

  document.addEventListener('b2b:render', () => {
    const hotelId = dest.dataset.hotel;
    const p = app().lastParams;
    if (!hotelId || !p) { box.hidden = true; return; }
    load(hotelId, p);
  });

  async function load(hotelId, p) {
    const seq = ++reqSeq;
    box.hidden = false;
    box.innerHTML = '<div class="spinner"></div>';
    const q = { type: p.type === 'tour' ? 'hotel' : p.type, checkIn: p.checkIn, checkInTo: p.checkInTo, nights: p.nights, nightsTo: p.nightsTo,
      adults: p.adults, children: p.children, childAges: p.childAges, noStopSale: '1' };
    const t0 = performance.now();
    try {
      const d = await api(`/api/b2b/hotels/${encodeURIComponent(hotelId)}/offers`, q);
      if (seq !== reqSeq) return;
      render(d, Math.round(performance.now() - t0));
    } catch (err) {
      if (seq !== reqSeq) return;
      box.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
    }
  }

  const opLink = (o, label) => (o.operatorLink && /^https:\/\//.test(o.url || '')
    ? `<a class="btn sm secondary" href="${esc(safeUrl(o.url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : '');

  function render(d, ms) {
    const h = d.hotel;
    const rows = (d.rows || []).filter((o) => !o.stopSale).sort((a, b) => a.price - b.price);
    if (!rows.length) {
      box.innerHTML = `<div class="hc-head"><h2>🏨 ${esc(h.name)} <span class="stars">${starStr(h.stars)}</span></h2></div><div class="empty muted">${esc(t('hc_none'))}</div>`;
      return;
    }
    // Hər operator üçün ən ucuz variant → operatorlar ucuzdan bahalıya
    const byOp = new Map();
    for (const o of rows) if (!byOp.has(o.providerId)) byOp.set(o.providerId, o);
    const ops = [...byOp.values()];
    const best = ops[0];
    const worst = ops[ops.length - 1];
    const q = d.query || {};
    const pax = `${q.adults || ''}${q.children ? ' + ' + q.children : ''}`;
    const dates = q.dateFrom && q.dateTo && q.dateFrom !== q.dateTo ? `${fmtDate(q.dateFrom)} – ${fmtDate(q.dateTo)}` : (q.dateFrom ? fmtDate(q.dateFrom) : '');
    const profit = (o) => mk(o) - o.price;

    box.innerHTML = `
      <div class="hc-head">
        <div>
          <div class="hc-kicker">${esc(t('hc_kicker'))}</div>
          <h2>🏨 ${esc(h.name)} <span class="stars">${starStr(h.stars)}</span></h2>
          <div class="muted">${esc(h.destination ? h.destination.name : '')}${h.district ? ' · ' + esc(h.district) : ''} · ${esc(dates)} · ${esc(t('hc_pax', { p: pax }))}</div>
        </div>
        <div class="hc-stat">${esc(t('hc_checked', { n: ops.length, r: rows.length }))}<br><small class="muted">${esc(t('hc_time', { ms }))}</small></div>
      </div>
      <div class="hc-ops" role="list">
        ${ops.map((o, i) => `<div class="hc-op${i === 0 ? ' best' : ''}" role="listitem">
          <div class="hc-rank">${i + 1}</div>
          <div class="hc-opname"><b><span class="dot" style="background:${esc(o.providerColor)}"></span>${esc(o.providerName)}</b>
            <small class="muted">${esc(fmtDate(o.checkIn))} · ${esc(t('nights_n', { n: o.nights }))} · ${esc(o.board || '')} · ${esc(roomText(o))}</small></div>
          <div class="hc-nums">
            <div><small class="muted">${esc(t('hc_net'))}</small><b>${money(o.price, 'AZN')}</b></div>
            <div><small class="muted">${esc(t('hc_client'))}</small><b>${money(mk(o), 'AZN')}</b></div>
            <div><small class="muted">${esc(t('hc_profit'))}</small><b class="good">${money(profit(o), 'AZN')}</b></div>
            <div class="hc-diff">${i === 0 ? `<span class="best-badge">🏆 ${esc(t('ch_badge'))}</span>` : `<span class="muted">+${money(o.price - best.price, 'AZN')}</span>`}</div>
          </div>
          <div class="hc-act">${opLink(o, t('hc_open'))}</div>
        </div>`).join('')}
      </div>
      ${ops.length > 1 ? `<div class="hc-save">${esc(t('hc_save', { op: best.providerName, n: money(worst.price - best.price, 'AZN'), w: worst.providerName }))}</div>` : ''}
      <details class="hc-all">
        <summary>${esc(t('hc_all', { n: rows.length }))}</summary>
        <div class="table-wrap"><table class="grid">
          <thead><tr><th>#</th><th>${esc(t('col_op'))}</th><th>${esc(t('col_room'))}</th><th>${esc(t('col_board'))}</th><th>${esc(t('col_date'))}</th><th style="text-align:right">${esc(t('hc_net'))}</th><th style="text-align:right">${esc(t('hc_client'))}</th><th style="text-align:right">${esc(t('hc_profit'))}</th><th></th></tr></thead>
          <tbody>${rows.map((o, i) => `<tr class="${i === 0 ? 'top-row' : ''}">
            <td>${i + 1}</td>
            <td><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(o.providerColor)}"></span> ${esc(o.providerName)}</td>
            <td class="wrap"><small>${esc(roomText(o))}</small></td>
            <td>${esc(o.board || '—')}</td>
            <td>${esc(fmtDate(o.checkIn))} · ${esc(String(o.nights))}g</td>
            <td class="num">${money(o.price, 'AZN')}</td>
            <td class="num"><b>${money(mk(o), 'AZN')}</b></td>
            <td class="num good">${money(profit(o), 'AZN')}</td>
            <td>${opLink(o, t('hc_open_short'))}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </details>`;
  }
})();
