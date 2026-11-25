// Agentlik saytı üçün axtarış vidjeti (/w/<publicId>). Yüngül: common.js yüklənmir; cookie, brauzer yaddaşı
// sessiya İSTİFADƏ OLUNMUR (fetch credentials:'omit'). Operator adı və net qiymət server tərəfindən heç göndərilmir.
// Bütün dinamik mətn esc() ilə yazılır (CSP: inline JS yox).
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = {
    az: {
      sub: '— tur axtarışı', dest: 'İstiqamət', type: 'Növ', type_package: 'Tur paketi (aviabilet + otel)', type_hotel: 'Yalnız otel', date: 'Gediş tarixi', nights: 'Gecə',
      adults: 'Böyük', children: 'Uşaq', budget: 'Büdcə maks. (₼)', search: 'Axtar', child_age: '{n}-ci uşağın yaşı', intl: 'Xarici', domestic: 'Azərbaycan',
      loading: 'Operatorlar yoxlanılır…', none: 'Bu parametrlərə uyğun variant tapılmadı. Tarixi və ya büdcəni dəyişin.', found: '{n} variant · ucuzdan bahalıya',
      nights_n: '{n} gecə', pax: '{n} nəfər üçün cəmi', apply: 'Müraciət et', flight: 'aviabilet daxil', lead_title: 'Müraciət', name: 'Adınız', phone: 'Telefon (WhatsApp)',
      note: 'Qeyd (istəyə görə)', send: 'Göndər', cancel: 'Bağla', ok_title: 'Müraciətiniz qəbul edildi', ok_text: '{agency} menecerləri tezliklə sizinlə əlaqə saxlayacaq.',
      track: 'Statusu izləyin', consent: 'Göndərməklə Məxfilik siyasəti ilə tanış olduğunuzu təsdiq edirsiniz.', err: 'Xəta baş verdi. Bir az sonra yenidən cəhd edin.',
      notfound: 'Vidjet tapılmadı və ya deaktiv edilib.', demo: 'DEMO qiymətlər', privacy: 'Məxfilik', powered: 'Odiola ilə', price_note: 'Qiymət yerlərin mövcudluğundan asılı olaraq dəyişə bilər.',
    },
    en: {
      sub: '— tour search', dest: 'Destination', type: 'Type', type_package: 'Package (flight + hotel)', type_hotel: 'Hotel only', date: 'Departure date', nights: 'Nights',
      adults: 'Adults', children: 'Children', budget: 'Max budget (₼)', search: 'Search', child_age: 'Child {n} age', intl: 'International', domestic: 'Azerbaijan',
      loading: 'Checking operators…', none: 'No options match these parameters. Try another date or budget.', found: '{n} options · cheapest first',
      nights_n: '{n} nights', pax: 'total for {n} guests', apply: 'Request', flight: 'flight included', lead_title: 'Request', name: 'Your name', phone: 'Phone (WhatsApp)',
      note: 'Note (optional)', send: 'Send', cancel: 'Close', ok_title: 'Request received', ok_text: '{agency} will contact you shortly.',
      track: 'Track the status', consent: 'By sending you confirm you have read the Privacy policy.', err: 'Something went wrong. Please try again later.',
      notfound: 'Widget not found or disabled.', demo: 'DEMO prices', privacy: 'Privacy', powered: 'Powered by Odiola', price_note: 'Prices may change depending on availability.',
    },
    ru: {
      sub: '— поиск туров', dest: 'Направление', type: 'Тип', type_package: 'Тур (перелёт + отель)', type_hotel: 'Только отель', date: 'Дата вылета', nights: 'Ночей',
      adults: 'Взрослые', children: 'Дети', budget: 'Бюджет макс. (₼)', search: 'Найти', child_age: 'Возраст ребёнка {n}', intl: 'Зарубежные', domestic: 'Азербайджан',
      loading: 'Проверяем операторов…', none: 'Нет вариантов под эти параметры. Измените дату или бюджет.', found: '{n} вариантов · от дешёвых',
      nights_n: '{n} ночей', pax: 'итого за {n} чел.', apply: 'Оставить заявку', flight: 'перелёт включён', lead_title: 'Заявка', name: 'Ваше имя', phone: 'Телефон (WhatsApp)',
      note: 'Комментарий', send: 'Отправить', cancel: 'Закрыть', ok_title: 'Заявка принята', ok_text: '{agency} скоро свяжется с вами.',
      track: 'Следить за статусом', consent: 'Отправляя, вы подтверждаете, что ознакомились с Политикой конфиденциальности.', err: 'Произошла ошибка. Попробуйте позже.',
      notfound: 'Виджет не найден или отключён.', demo: 'ДЕМО-цены', privacy: 'Конфиденциальность', powered: 'Работает на Odiola', price_note: 'Цена может измениться в зависимости от наличия мест.',
    },
  };
  const qsLang = new URLSearchParams(location.search).get('lang');
  const navLang = (navigator.language || 'az').slice(0, 2);
  let LANG = ['az', 'en', 'ru'].includes(qsLang) ? qsLang : (['en', 'ru'].includes(navLang) ? navLang : 'az');
  const t = (k, v = {}) => ((T[LANG] && T[LANG][k]) || T.az[k] || k).replace(/\{(\w+)\}/g, (_, x) => (v[x] ?? ''));
  const money = (n) => `${Number(n).toLocaleString('en-US').replace(/,/g, ' ')} ₼`;
  const fmtDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('.') : '');
  const stars = (n) => (n ? '★'.repeat(Math.min(5, n)) : '');

  const m = /^\/w\/([A-Za-z0-9_-]{22})\/?$/.exec(location.pathname);
  const PID = m ? m[1] : null;
  const state = { cfg: null, last: null, offers: [] };

  async function get(path, params) {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString() : '';
    const r = await fetch(path + qs, { credentials: 'omit', cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(d.error || t('err')); e.status = r.status; throw e; }
    return d;
  }
  async function post(path, body) {
    const r = await fetch(path, { method: 'POST', credentials: 'omit', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || t('err'));
    return d;
  }

  function applyText() {
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
    $('#wgSub').textContent = t('sub');
    $('#wgLang').value = LANG;
    renderAges();
  }

  function fillSelect(sel, from, to, def) {
    sel.innerHTML = '';
    for (let i = from; i <= to; i++) sel.insertAdjacentHTML('beforeend', `<option${i === def ? ' selected' : ''}>${i}</option>`);
  }
  function renderDest() {
    const list = (state.cfg && state.cfg.destinations) || [];
    const prev = $('#wgDest').value;
    const group = (reg) => list.filter((d) => d.region === reg).map((d) => `<option value="${esc(d.id)}">${esc(d.name)}${d.region === 'intl' ? ', ' + esc(d.country) : ''}</option>`).join('');
    $('#wgDest').innerHTML = `<optgroup label="${esc(t('intl'))}">${group('intl')}</optgroup><optgroup label="${esc(t('domestic'))}">${group('domestic')}</optgroup>`;
    if (prev) $('#wgDest').value = prev;
  }
  function renderAges() {
    const n = Number($('#wgChildren').value) || 0;
    const box = $('#wgAges');
    const prev = [...box.querySelectorAll('select')].map((s) => s.value);
    box.hidden = !n;
    box.innerHTML = Array.from({ length: n }, (_, i) => `<label class="wg-f"><span>${esc(t('child_age', { n: i + 1 }))}</span><select data-age>${Array.from({ length: 18 }, (_, a) => `<option${String(a) === (prev[i] || '7') ? ' selected' : ''}>${a}</option>`).join('')}</select></label>`).join('');
  }
  const ages = () => [...document.querySelectorAll('#wgAges [data-age]')].map((s) => s.value).join(',');

  function query() {
    return {
      type: $('#wgType').value, destinationId: $('#wgDest').value, checkIn: $('#wgDate').value, nights: $('#wgNights').value,
      adults: $('#wgAdults').value, childAges: ages(), budget: $('#wgBudget').value,
    };
  }

  function renderResults(d) {
    state.last = d;
    state.offers = d.offers || [];
    const pax = Number(d.query.adults) + (d.query.childAges ? d.query.childAges.split(',').length : 0);
    $('#wgMsg').textContent = state.offers.length ? t('found', { n: d.total }) : t('none');
    $('#wgResults').innerHTML = state.offers.map((o, i) => `<article class="wg-card">
        <div class="wg-main">
          <h3>${esc(o.name)} <span class="wg-stars">${stars(o.stars)}</span></h3>
          <div class="wg-meta">${esc(o.destination)}${o.district ? ' · ' + esc(o.district) : ''}</div>
          <div class="wg-meta">${esc(fmtDate(o.checkIn))} · ${esc(t('nights_n', { n: o.nights }))}${o.boardLabel ? ' · ' + esc(o.boardLabel) : ''}${o.includesFlight ? ' · ✈ ' + esc(t('flight')) : ''}</div>
          ${window.Inclusions ? window.Inclusions.line(o.includes, o.excludes, LANG) : ''}
        </div>
        <div class="wg-price"><b>${esc(money(o.price))}</b><small>${esc(t('pax', { n: pax }))}</small>
          <button type="button" class="wg-btn" data-apply="${i}">${esc(t('apply'))}</button></div>
      </article>`).join('');
  }

  async function doSearch(e) {
    if (e) e.preventDefault();
    if (!PID) return;
    const btn = $('#wgGo');
    btn.disabled = true;
    $('#wgMsg').textContent = t('loading');
    $('#wgResults').innerHTML = '';
    try {
      renderResults(await get(`/api/w/${PID}/search`, query()));
    } catch (err) {
      $('#wgMsg').textContent = err.message;
    } finally { btn.disabled = false; }
  }

  // ---------------------------------------------------------------- Müraciət
  let lastFocus = null;
  function openLead(i) {
    const o = state.offers[i];
    if (!o) return;
    lastFocus = document.activeElement;
    $('#wgDialog').innerHTML = `<h3 id="wgDlgTitle">${esc(t('lead_title'))}: ${esc(o.name)}</h3>
      <p class="wg-meta">${esc(fmtDate(o.checkIn))} · ${esc(t('nights_n', { n: o.nights }))}${o.boardLabel ? ' · ' + esc(o.boardLabel) : ''} · <b>${esc(money(o.price))}</b></p>
      ${window.Inclusions ? window.Inclusions.block(o.includes, o.excludes, LANG) : ''}
      <form id="wgLead" novalidate>
        <input name="name" required maxlength="80" autocomplete="name" placeholder="${esc(t('name'))}" aria-label="${esc(t('name'))}">
        <input name="phone" required maxlength="30" inputmode="tel" autocomplete="tel" placeholder="${esc(t('phone'))}" aria-label="${esc(t('phone'))}">
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('note'))}" aria-label="${esc(t('note'))}"></textarea>
        <input type="text" name="website" class="wg-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="wg-err" id="wgErr" role="alert"></div>
        <div class="wg-actions"><button type="button" class="wg-btn ghost" data-close>${esc(t('cancel'))}</button><button class="wg-btn" id="wgSend">${esc(t('send'))}</button></div>
        <p class="wg-consent">${esc(t('consent'))} <small>${esc(t('price_note'))}</small></p>
      </form>`;
    $('#wgModal').hidden = false;
    $('#wgLead').addEventListener('submit', (ev) => sendLead(ev, o));
    $('#wgLead [name=name]').focus();
  }
  function closeLead() {
    $('#wgModal').hidden = true;
    $('#wgDialog').innerHTML = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  async function sendLead(ev, o) {
    ev.preventDefault();
    const fd = Object.fromEntries(new FormData(ev.target));
    const btn = $('#wgSend');
    btn.disabled = true;
    $('#wgErr').textContent = '';
    const q = state.last.query;
    try {
      const r = await post(`/api/w/${PID}/leads`, {
        name: fd.name, phone: fd.phone, note: fd.note, website: fd.website, ref: o.ref,
        query: { type: q.type, destinationId: q.destinationId, checkIn: q.checkIn, flex: q.flex, nights: q.nights, adults: q.adults, childAges: q.childAges || '' },
      });
      const url = /^\/r\/[A-Za-z0-9_-]{32}$/.test(r.statusUrl || '') ? location.origin + r.statusUrl : '';
      $('#wgDialog').innerHTML = `<div class="wg-ok" role="status"><div class="wg-big" aria-hidden="true">✅</div>
        <h3 id="wgDlgTitle">${esc(t('ok_title'))}</h3><p>${esc(t('ok_text', { agency: (state.cfg && state.cfg.agency.name) || '' }))}</p>
        ${url ? `<a class="wg-btn" id="wgTrack" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(t('track'))} →</a>` : ''}
        <p><button type="button" class="wg-btn ghost" data-close>${esc(t('cancel'))}</button></p></div>`;
      const a = $('#wgTrack');
      if (a) a.focus();
    } catch (err) {
      $('#wgErr').textContent = err.message;
      btn.disabled = false;
    }
  }

  // ---------------------------------------------------------------- Başlanğıc
  async function init() {
    fillSelect($('#wgNights'), 3, 14, 7);
    fillSelect($('#wgAdults'), 1, 6, 2);
    fillSelect($('#wgChildren'), 0, 3, 0);
    const d = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    $('#wgDate').value = d;
    $('#wgDate').min = new Date().toISOString().slice(0, 10);
    applyText();
    if (!PID) { $('#wgAgency').textContent = '—'; $('#wgMsg').textContent = t('notfound'); $('#wgForm').hidden = true; return; }
    try {
      state.cfg = await get(`/api/w/${PID}/config`);
    } catch (err) {
      $('#wgAgency').textContent = '—';
      $('#wgMsg').textContent = err.status === 404 ? t('notfound') : err.message;
      $('#wgForm').hidden = true;
      return;
    }
    $('#wgAgency').textContent = state.cfg.agency.name;
    document.title = `${state.cfg.agency.name} — ${t('search')}`;
    renderDest();
  }

  $('#wgForm').addEventListener('submit', doSearch);
  $('#wgChildren').addEventListener('change', renderAges);
  $('#wgLang').addEventListener('change', (e) => {
    LANG = e.target.value;
    applyText();
    renderDest();
    if (state.last) renderResults(state.last);
  });
  $('#wgResults').addEventListener('click', (e) => { const b = e.target.closest('[data-apply]'); if (b) openLead(Number(b.dataset.apply)); });
  $('#wgModal').addEventListener('click', (e) => { if (e.target.id === 'wgModal' || e.target.closest('[data-close]')) closeLead(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#wgModal').hidden) closeLead(); });
  init();
})();
