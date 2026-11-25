/* global BrandView */
// Çap/PDF kommersiya təklifi (public/quote.html). Parametrlər URL hash-ındadır (#c=<müştəri>&m=<komissiya %>)
// — serverə və Referer-ə getmir. Qiymətlər serverdə yenidən yoxlanılır; cavabda operator adı və net qiymət YOXDUR.
(async function () {
  const $ = (s) => document.querySelector(s);
  const doc = $('#quoteDoc');
  const h = new URLSearchParams(location.hash.slice(1));
  const client = (h.get('c') || '').slice(0, 80);
  const markup = Math.min(100, Math.max(0, Number(h.get('m')) || 0));
  applyI18n();

  const me = await b2bMe();
  if (!me) {
    doc.innerHTML = `<p>${esc(t('q_login'))}</p><p><a class="btn sm primary" href="/b2b">${esc(t('q_back'))}</a></p>`;
    return;
  }
  let q;
  try {
    q = await postJson('/api/b2b/shortlist/quote', { client, markup });
  } catch (err) {
    doc.innerHTML = `<p>${esc(err.status === 404 ? t('q_notfound') : err.message)}</p>`;
    return;
  }

  const today = fmtDate(q.createdAt.slice(0, 10));
  const paxText = (it) => (it.children ? t('q_pax_c', { a: it.adults, c: it.children }) : t('q_pax', { a: it.adults }));
  const terms = (it) => [it.prepayment === 'none' ? t('prepay_none') : it.prepayment === '50' ? t('prepay_50') : it.prepayment === 'full' ? t('prepay_full') : '',
    it.freeCancelUntil ? t('free_cancel', { d: fmtDate(it.freeCancelUntil) }) : ''].filter(Boolean).join(' · ');
  const change = (it) => (!it.priceChange ? '' : `<small class="trend ${it.priceChange > 0 ? 'up' : 'down'}">${esc(t(it.priceChange > 0 ? 'q_changed_up' : 'q_changed_down', { v: money(Math.abs(it.priceChange), q.currency) }))}</small>`);
  // Agentlik brendi (serverdən: ad, loqo, rəng, əlaqə, lisenziya) — bax public/js/brand-view.js
  const br = q.brand || { name: q.agency };
  const agencyName = br.name || q.agency;
  document.title = `${t('q_title')} — ${agencyName}`;
  BrandView.applyColor(doc, br);
  doc.innerHTML = `
    <header class="quote-head">
      <div class="quote-brand">${BrandView.logoHtml(br)}<div><div class="quote-agency">${esc(agencyName)}</div><h1>${esc(t('q_title'))}</h1>${BrandView.contactsHtml(br, { links: true })}</div></div>
      <dl class="quote-meta">
        <div><dt>${esc(t('q_client'))}</dt><dd>${esc(q.client || '—')}</dd></div>
        <div><dt>${esc(t('q_manager'))}</dt><dd>${esc(q.manager || '—')}</dd></div>
        <div><dt>${esc(t('q_date'))}</dt><dd>${esc(today)}</dd></div>
      </dl>
    </header>
    <ol class="quote-items">
      ${q.items.map((it) => `<li class="quote-item${it.available ? '' : ' gone'}">
        <div class="quote-item-main">
          <h2>${esc(it.name)} <span class="stars">${starStr(it.stars)}</span></h2>
          <div class="muted">${esc(it.destination)}${it.district ? ' · ' + esc(it.district) : ''}</div>
          <ul class="quote-facts">
            <li>📅 ${esc(it.checkIn ? fmtDate(it.checkIn) : '')} · ${esc(t('ch_nights', { n: it.nights }))}</li>
            ${it.board ? `<li>🍽 ${esc(it.boardLabel ? `${it.boardLabel} (${it.board})` : it.board)}</li>` : ''}
            ${it.room || it.accommodation ? `<li>🛏 ${esc([it.room, it.accommodation].filter(Boolean).join(' / '))}</li>` : ''}
            ${it.includesFlight ? `<li>✈ ${esc(t('ch_flight'))}${it.flightTime ? ' · ' + esc(it.flightTime) : ''}</li>` : ''}
            ${terms(it) ? `<li>📝 ${esc(terms(it))}</li>` : ''}
          </ul>
          ${it.available ? BrandView.whyHtml(it.why) : ''}
        </div>
        <div class="quote-item-price">
          ${it.available ? `<b>${money(it.clientPrice, q.currency)}</b><small class="muted">${esc(t('q_total', { pax: paxText(it) }))}</small>${change(it)}`
            : `<b class="muted">${esc(t('q_unavailable'))}</b>`}
        </div>
      </li>`).join('')}
    </ol>
    ${BrandView.similarHtml(q.similar, q.currency)}
    <section class="quote-terms"><h3>${esc(t('q_terms_title'))}</h3><p>${esc(t('q_terms', { date: today }))}</p></section>
    <footer class="quote-foot">${esc(agencyName)}${q.manager ? ' · ' + esc(q.manager) : ''}${br.licenseNo ? ' · ' + esc(t('br_license')) + ' ' + esc(br.licenseNo) : ''}${br.address ? ' · ' + esc(br.address) : ''}</footer>`;
  $('#printBtn').disabled = false;
  $('#printBtn').addEventListener('click', () => window.print());
})();
