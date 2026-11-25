// Müştərinin müraciət status səhifəsi (/r/<token>). Token yalnız URL-dədir (server yalnız SHA-256 hash saxlayır).
// Şəxsi məlumat serverdən artıq maskalı gəlir; bütün dinamik mətn esc() ilə yazılır.
Object.assign(I18N.az, {
  r_title: 'Müraciətinizin statusu', r_by: '{agency} · müraciət {date}', r_odiola: 'Odiola', r_updated: 'Son yenilənmə: {at}',
  r_st_new: 'Qəbul edildi', r_st_in_progress: 'Menecer işləyir', r_st_sold: 'Təsdiqləndi (satıldı)', r_st_cancelled: 'Ləğv edildi',
  r_d_new: 'Müraciətiniz qeydə alındı — menecer tezliklə baxacaq.', r_d_in_progress: 'Menecer variantları dəqiqləşdirir və sizinlə əlaqə saxlayacaq.',
  r_d_sold: 'Tur təsdiqləndi. Sənədlər və ödəniş barədə menecer məlumat verəcək.', r_d_cancelled: 'Müraciət ləğv edilib. Sualınız varsa, menecerlə əlaqə saxlayın.',
  r_manager: 'Menecer', r_call: 'Zəng et', r_wa: 'WhatsApp', r_choice: 'Seçilmiş variant', r_you: 'Əlaqə məlumatlarınız', r_price: 'Qiymət',
  r_private: 'Bu link şəxsidir — başqaları ilə paylaşmayın. Şəxsi məlumatlar qismən gizlədilib.', r_refresh: '↻ Yenilə', r_notfound: 'Müraciət tapılmadı və ya link yanlışdır.',
  r_nights: '{n} gecə',
});
Object.assign(I18N.en, {
  r_title: 'Your request status', r_by: '{agency} · request from {date}', r_odiola: 'Odiola', r_updated: 'Last update: {at}',
  r_st_new: 'Received', r_st_in_progress: 'Manager is working on it', r_st_sold: 'Confirmed (sold)', r_st_cancelled: 'Cancelled',
  r_d_new: 'Your request is registered — a manager will review it shortly.', r_d_in_progress: 'The manager is checking the options and will contact you.',
  r_d_sold: 'Your tour is confirmed. The manager will share documents and payment details.', r_d_cancelled: 'The request was cancelled. Contact the manager if you have questions.',
  r_manager: 'Manager', r_call: 'Call', r_wa: 'WhatsApp', r_choice: 'Selected option', r_you: 'Your contact details', r_price: 'Price',
  r_private: 'This link is personal — do not share it. Personal data is partially hidden.', r_refresh: '↻ Refresh', r_notfound: 'Request not found or the link is invalid.',
  r_nights: '{n} nights',
});
Object.assign(I18N.ru, {
  r_title: 'Статус вашей заявки', r_by: '{agency} · заявка от {date}', r_odiola: 'Odiola', r_updated: 'Последнее обновление: {at}',
  r_st_new: 'Принята', r_st_in_progress: 'Менеджер работает', r_st_sold: 'Подтверждена (продано)', r_st_cancelled: 'Отменена',
  r_d_new: 'Заявка зарегистрирована — менеджер скоро её рассмотрит.', r_d_in_progress: 'Менеджер уточняет варианты и свяжется с вами.',
  r_d_sold: 'Тур подтверждён. Менеджер сообщит о документах и оплате.', r_d_cancelled: 'Заявка отменена. Если есть вопросы, свяжитесь с менеджером.',
  r_manager: 'Менеджер', r_call: 'Позвонить', r_wa: 'WhatsApp', r_choice: 'Выбранный вариант', r_you: 'Ваши контакты', r_price: 'Цена',
  r_private: 'Ссылка личная — не передавайте её. Личные данные частично скрыты.', r_refresh: '↻ Обновить', r_notfound: 'Заявка не найдена или ссылка неверна.',
  r_nights: '{n} ночей',
});

(function () {
  const $ = (s) => document.querySelector(s);
  const m = /^\/r\/([A-Za-z0-9_-]{32})\/?$/.exec(location.pathname);
  const token = m ? m[1] : null;
  const STEPS = ['new', 'in_progress', 'sold'];
  let data = null;
  let failed = false;
  // Brauzer lokalından asılı olmayan format: dd.mm.yyyy hh:mm (yerli vaxt)
  const p2 = (n) => String(n).padStart(2, '0');
  const day = (iso) => { if (!iso) return ''; const d = new Date(iso); return `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`; };
  const when = (iso) => { if (!iso) return ''; const d = new Date(iso); return `${day(iso)} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };

  function stepsHtml(st) {
    const list = st === 'cancelled' ? ['new', 'cancelled'] : STEPS;
    const cur = list.indexOf(st);
    return `<ol class="r-steps">${list.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'cur' : ''}${s === 'cancelled' ? ' cancel' : ''}"${i === cur ? ' aria-current="step"' : ''}>
      <span class="r-dot" aria-hidden="true">${i < cur ? '✓' : s === 'cancelled' ? '✕' : i + 1}</span><span>${esc(t('r_st_' + s))}</span></li>`).join('')}</ol>`;
  }

  function render() {
    if (failed || !data) {
      $('#rBy').textContent = '';
      $('#rBody').innerHTML = failed ? `<div class="panel empty">${esc(t('r_notfound'))}</div>` : '<div class="spinner"></div>';
      return;
    }
    const d = data;
    const agency = d.agency || t('r_odiola');
    $('#rBy').textContent = t('r_by', { agency, date: day(d.createdAt) });
    const it = d.item;
    const c = d.contact || {};
    const wa = c.whatsapp && /^\d{7,15}$/.test(c.whatsapp) ? c.whatsapp : '';
    const tel = c.phone && /^\+\d{7,15}$/.test(c.phone) ? c.phone : '';
    $('#rBody').innerHTML = `
      <section class="panel r-card">
        <div class="r-status"><span class="st st-${esc(d.status)}">${esc(t('r_st_' + d.status))}</span>
          <small class="muted">${esc(t('r_updated', { at: when(d.statusChangedAt || d.updatedAt) }))}</small></div>
        ${stepsHtml(d.status)}
        <p class="r-desc">${esc(t('r_d_' + d.status))}</p>
        <div class="r-who"><div><b>${esc(agency)}</b>${d.manager ? `<br><small class="muted">${esc(t('r_manager'))}: ${esc(d.manager)}</small>` : ''}</div>
          <div class="r-acts">${tel ? `<a class="btn secondary sm" href="tel:${esc(tel)}">📞 ${esc(t('r_call'))}</a>` : ''}${wa ? `<a class="btn sm" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer">💬 ${esc(t('r_wa'))}</a>` : ''}</div></div>
      </section>
      ${it ? `<section class="panel r-card"><h3>${esc(t('r_choice'))}</h3>
        <p class="r-item"><b>${esc(it.name)}</b>${it.destination ? ` · ${esc(it.destination)}` : ''}<br>
        <span class="muted">${it.checkIn ? esc(fmtDate(it.checkIn)) : ''}${it.nights ? ' · ' + esc(t('r_nights', { n: it.nights })) : ''}${it.boardLabel ? ' · ' + esc(it.boardLabel) : (it.board ? ' · ' + esc(it.board) : '')}</span>
        ${it.price != null ? `<br>${esc(t('r_price'))}: <b>${esc(money(it.price, it.currency || 'AZN'))}</b>` : ''}</p></section>` : ''}
      <section class="panel r-card"><h3>${esc(t('r_you'))}</h3><p class="r-item">${esc(d.customer.name)}<br><span class="muted">${esc(d.customer.phone)}</span></p></section>
      <p class="muted r-private">🔒 ${esc(t('r_private'))}</p>
      <p><button type="button" class="btn secondary sm" id="rRefresh">${esc(t('r_refresh'))}</button></p>`;
  }

  async function load() {
    if (!token) { failed = true; render(); return; }
    try {
      const r = await fetch('/api/r/' + encodeURIComponent(token), { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error(String(r.status));
      data = await r.json();
      failed = false;
    } catch { failed = true; }
    render();
  }

  document.addEventListener('langchange', render);
  document.addEventListener('click', (e) => { if (e.target.closest('#rRefresh')) load(); });
  load();
})();
