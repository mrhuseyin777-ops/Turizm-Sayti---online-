// B2B: "Müraciətlər" (CRM — status, menecer qeydi, tez əlaqə) və "Ayarlar" (Telegram/e-poçt bildirişləri).
// public/js/b2b.js yalnız B2BLeads.load()/reset() çağırır. Bütün dinamik mətn esc() ilə yazılır (CSP: inline JS yox).
Object.assign(I18N.az, {
  crm_settings: 'Ayarlar', crm_settings_title: 'Bildiriş ayarları', crm_close: 'Bağla', crm_save: 'Yadda saxla', crm_saved: 'Ayarlar yadda saxlanıldı',
  crm_settings_sub: 'Yeni müraciət gələndə agentliyinizin Telegram qrupuna və/və ya e-poçtuna bildiriş göndərilir.',
  crm_tg_chat: 'Telegram chat_id', crm_tg_test: 'Test mesajı göndər', crm_tg_test_ok: 'Test mesajı göndərildi — Telegram-ı yoxlayın',
  crm_tg_step1: 'Telegram-da @BotFather → /newbot ilə bot yaradın; tokeni hostinq administratoruna verin (TELEGRAM_BOT_TOKEN).',
  crm_tg_step2: 'Botu agentliyinizin qrupuna əlavə edin və qrupa istənilən mesaj yazın.',
  crm_tg_step3: 'chat_id-ni tapın: @userinfobot (və ya api.telegram.org/bot<token>/getUpdates). Qrup id-si adətən -100 ilə başlayır.',
  crm_tg_step4: 'chat_id-ni bura yazın, «Test mesajı göndər» düyməsini sınayın və yadda saxlayın.',
  crm_email: 'Bildiriş e-poçtu (istəyə görə)', crm_email_hint: 'E-poçt bildirişi yalnız serverdə SMTP qoşulubsa göndərilir.',
  crm_chan_tg: 'Telegram', crm_chan_email: 'E-poçt', crm_chan_on: 'serverdə qoşulub', crm_chan_off: 'serverdə qoşulmayıb',
  crm_updated_by: 'Son dəyişiklik: {at} · {by}', crm_new_count: 'Yeni müraciətlər',
  crm_all: 'Hamısı', crm_st_new: 'Yeni', crm_st_in_progress: 'İşdə', crm_st_sold: 'Satıldı', crm_st_cancelled: 'Ləğv',
  crm_status: 'Status', crm_note: 'Menecer qeydi', crm_note_ph: 'Daxili qeyd (müştəri görmür), maks. 1000 simvol', crm_call: 'Zəng', crm_wa: 'WhatsApp',
  crm_open: 'Ətraflı', crm_lead: 'Müraciət #{id}', crm_hotel: 'Otel', crm_date: 'Tarix', crm_price: 'Qiymət', crm_operator: 'Operator', crm_client: 'Müştəri/sorğu',
  crm_client_note: 'Müştərinin qeydi', crm_created: 'Daxil olub', crm_updated: 'Son yeniləmə', crm_changed: 'Statusu dəyişib', crm_no_match: 'Bu statusda müraciət yoxdur.',
  crm_lead_saved: 'Müraciət yeniləndi', crm_err_load: 'Müraciətlər yüklənmədi',
});
Object.assign(I18N.en, {
  crm_settings: 'Settings', crm_settings_title: 'Notification settings', crm_close: 'Close', crm_save: 'Save', crm_saved: 'Settings saved',
  crm_settings_sub: 'When a new request arrives, a notification is sent to your agency’s Telegram group and/or e-mail.',
  crm_tg_chat: 'Telegram chat_id', crm_tg_test: 'Send test message', crm_tg_test_ok: 'Test message sent — check Telegram',
  crm_tg_step1: 'In Telegram, create a bot with @BotFather → /newbot; give the token to your hosting admin (TELEGRAM_BOT_TOKEN).',
  crm_tg_step2: 'Add the bot to your agency group and post any message there.',
  crm_tg_step3: 'Find the chat_id: @userinfobot (or api.telegram.org/bot<token>/getUpdates). Group ids usually start with -100.',
  crm_tg_step4: 'Enter the chat_id here, press “Send test message” and save.',
  crm_email: 'Notification e-mail (optional)', crm_email_hint: 'E-mail notifications are sent only if SMTP is configured on the server.',
  crm_chan_tg: 'Telegram', crm_chan_email: 'E-mail', crm_chan_on: 'connected on server', crm_chan_off: 'not connected on server',
  crm_updated_by: 'Last change: {at} · {by}', crm_new_count: 'New requests',
  crm_all: 'All', crm_st_new: 'New', crm_st_in_progress: 'In progress', crm_st_sold: 'Sold', crm_st_cancelled: 'Cancelled',
  crm_status: 'Status', crm_note: 'Manager note', crm_note_ph: 'Internal note (not visible to the client), max 1000 chars', crm_call: 'Call', crm_wa: 'WhatsApp',
  crm_open: 'Details', crm_lead: 'Request #{id}', crm_hotel: 'Hotel', crm_date: 'Date', crm_price: 'Price', crm_operator: 'Operator', crm_client: 'Client/request',
  crm_client_note: 'Client’s note', crm_created: 'Received', crm_updated: 'Last update', crm_changed: 'Status changed', crm_no_match: 'No requests with this status.',
  crm_lead_saved: 'Request updated', crm_err_load: 'Could not load requests',
});
Object.assign(I18N.ru, {
  crm_settings: 'Настройки', crm_settings_title: 'Настройки уведомлений', crm_close: 'Закрыть', crm_save: 'Сохранить', crm_saved: 'Настройки сохранены',
  crm_settings_sub: 'При новой заявке уведомление отправляется в Telegram-группу и/или на e-mail агентства.',
  crm_tg_chat: 'Telegram chat_id', crm_tg_test: 'Отправить тест', crm_tg_test_ok: 'Тестовое сообщение отправлено — проверьте Telegram',
  crm_tg_step1: 'В Telegram создайте бота через @BotFather → /newbot; передайте токен администратору хостинга (TELEGRAM_BOT_TOKEN).',
  crm_tg_step2: 'Добавьте бота в группу агентства и напишите туда любое сообщение.',
  crm_tg_step3: 'Узнайте chat_id: @userinfobot (или api.telegram.org/bot<token>/getUpdates). Id группы обычно начинается с -100.',
  crm_tg_step4: 'Введите chat_id здесь, нажмите «Отправить тест» и сохраните.',
  crm_email: 'E-mail для уведомлений (необязательно)', crm_email_hint: 'E-mail уведомления отправляются, только если на сервере настроен SMTP.',
  crm_chan_tg: 'Telegram', crm_chan_email: 'E-mail', crm_chan_on: 'подключён на сервере', crm_chan_off: 'не подключён на сервере',
  crm_updated_by: 'Последнее изменение: {at} · {by}', crm_new_count: 'Новые заявки',
  crm_all: 'Все', crm_st_new: 'Новая', crm_st_in_progress: 'В работе', crm_st_sold: 'Продано', crm_st_cancelled: 'Отменена',
  crm_status: 'Статус', crm_note: 'Заметка менеджера', crm_note_ph: 'Внутренняя заметка (клиент не видит), макс. 1000 символов', crm_call: 'Звонок', crm_wa: 'WhatsApp',
  crm_open: 'Подробнее', crm_lead: 'Заявка #{id}', crm_hotel: 'Отель', crm_date: 'Дата', crm_price: 'Цена', crm_operator: 'Оператор', crm_client: 'Клиент/запрос',
  crm_client_note: 'Комментарий клиента', crm_created: 'Получена', crm_updated: 'Обновлена', crm_changed: 'Статус изменил', crm_no_match: 'Нет заявок с этим статусом.',
  crm_lead_saved: 'Заявка обновлена', crm_err_load: 'Не удалось загрузить заявки',
});

// Telefon → tel: və wa.me üçün normallaşdırma (AZ yerli formatları: 050…, 50…; 00… beynəlxalq prefiks)
function crmNormPhone(p) {
  const raw = String(p || '').trim();
  const plus = raw.startsWith('+');
  let d = raw.replace(/\D/g, '');
  if (!plus && d.startsWith('00')) d = d.slice(2);
  else if (!plus && d.length === 10 && d.startsWith('0')) d = `994${d.slice(1)}`;
  else if (!plus && d.length === 9) d = `994${d}`;
  if (d.length < 7 || d.length > 15) return null;
  return { tel: `+${d}`, wa: d };
}

const B2BLeads = (() => {
  const $ = (s) => document.querySelector(s);
  const STATUSES = ['new', 'in_progress', 'sold', 'cancelled'];
  let me = null;
  let onAuthError = () => false;
  let leads = [];
  let counts = {};
  let filter = store.get('b2bLeadFilter', '');
  if (!STATUSES.includes(filter)) filter = '';
  let openId = null;
  let settings = null;

  const when = (iso) => (iso ? new Date(iso).toLocaleString(LANG === 'en' ? 'en-GB' : LANG === 'ru' ? 'ru-RU' : 'az-AZ') : '');
  const stChip = (st) => `<span class="st st-${esc(STATUSES.includes(st) ? st : 'new')}">${esc(t('crm_st_' + (STATUSES.includes(st) ? st : 'new')))}</span>`;
  const contacts = (phone) => {
    const n = crmNormPhone(phone);
    if (!n) return `<span>${esc(phone)}</span>`;
    return `<span class="crm-contacts"><a href="tel:${esc(n.tel)}" data-stop>📞 ${esc(phone)}</a>`
      + `<a href="https://wa.me/${esc(n.wa)}" target="_blank" rel="noopener noreferrer" data-stop>💬 ${esc(t('crm_wa'))}</a></span>`;
  };

  async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }

  // ---------------------------------------------------------------- Siyahı
  function renderFilter() {
    const total = STATUSES.reduce((a, s) => a + (counts[s] || 0), 0);
    $('#leadFilter').innerHTML = `<option value="">${esc(t('crm_all'))} (${total})</option>`
      + STATUSES.map((s) => `<option value="${s}"${s === filter ? ' selected' : ''}>${esc(t('crm_st_' + s))} (${counts[s] || 0})</option>`).join('');
    const n = counts.new || 0;
    const badge = $('#leadCount');
    badge.textContent = n;
    badge.classList.toggle('zero', !n);
  }

  function render() {
    renderFilter();
    $('#leads').innerHTML = leads.length ? leads.map((l) => {
      const it = l.item || {};
      return `<div class="lead crm-lead" tabindex="0" role="button" data-lead="${esc(l.id)}" aria-label="${esc(t('crm_lead', { id: l.id }))}">
        <div class="crm-row"><b>${esc(l.name)}</b>${stChip(l.status)}</div>
        ${contacts(l.phone)}<br>
        <small>${esc(it.name || '')}${it.checkIn ? ' · ' + esc(fmtDate(it.checkIn)) : ''}${it.clientPrice != null ? ' · ' + esc(money(it.clientPrice, it.currency || 'AZN')) : ''}</small><br>
        <small class="muted">${l.client ? esc(l.client) + ' · ' : ''}${esc(t('crm_updated'))}: ${esc(when(l.updatedAt || l.createdAt))}</small>
        ${l.managerNote ? `<br><small>📝 ${esc(l.managerNote.length > 80 ? l.managerNote.slice(0, 80) + '…' : l.managerNote)}</small>` : ''}</div>`;
    }).join('') : `<p class="muted">${esc(t(filter ? 'crm_no_match' : 'b2b_leads_empty'))}</p>`;
  }

  async function load(opts = {}) {
    if (opts.me !== undefined) me = opts.me;
    if (opts.onAuthError) onAuthError = opts.onAuthError;
    if (!me) return;
    $('#settingsLink').hidden = !(me.user && me.user.role === 'admin');
    try {
      const data = await req('GET', '/api/b2b/leads' + (filter ? `?status=${encodeURIComponent(filter)}` : ''));
      leads = Array.isArray(data.leads) ? data.leads : [];
      counts = data.counts || {};
      render();
      const m = /^#lead-(\d{1,15})$/.exec(location.hash);
      if (m && openId == null) openLead(Number(m[1]));
    } catch (err) {
      if (onAuthError(err)) return;
      $('#leads').innerHTML = `<p class="muted">${esc(t('crm_err_load'))}: ${esc(err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------- Müraciət pəncərəsi
  function openLead(id) {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    openId = id;
    const it = l.item || {};
    const row = (k, v) => (v ? `<dt>${esc(t(k))}</dt><dd>${v}</dd>` : '');
    $('#leadModalBody').innerHTML = `<div class="crm-head"><h3 id="leadModalTitle">${esc(t('crm_lead', { id: l.id }))}</h3>${stChip(l.status)}</div>
      <p><b>${esc(l.name)}</b><br>${contacts(l.phone)}</p>
      <dl>
        ${row('crm_hotel', esc([it.name, it.destination].filter(Boolean).join(', ')))}
        ${row('crm_date', esc([it.checkIn ? fmtDate(it.checkIn) : '', it.nights ? t('nights_n', { n: it.nights }) : '', it.board || ''].filter(Boolean).join(' · ')))}
        ${row('crm_price', it.clientPrice != null ? esc(money(it.clientPrice, it.currency || 'AZN')) : '')}
        ${row('crm_operator', esc(it.providerName || ''))}
        ${row('crm_client', esc(l.client || ''))}
        ${row('crm_client_note', esc(l.note || ''))}
        ${row('crm_created', esc(when(l.createdAt)))}
        ${row('crm_updated', esc(when(l.updatedAt)))}
        ${row('crm_changed', l.statusChangedAt ? esc(`${when(l.statusChangedAt)}${l.statusChangedBy ? ' · ' + l.statusChangedBy : ''}`) : '')}
      </dl>
      <form id="leadForm">
        <label for="leadStatus">${esc(t('crm_status'))}</label>
        <select id="leadStatus">${STATUSES.map((s) => `<option value="${s}"${s === l.status ? ' selected' : ''}>${esc(t('crm_st_' + s))}</option>`).join('')}</select>
        <label for="leadNote">${esc(t('crm_note'))} <small class="muted" id="leadNoteCount"></small></label>
        <textarea id="leadNote" maxlength="1000" placeholder="${esc(t('crm_note_ph'))}">${esc(l.managerNote || '')}</textarea>
        <div class="crm-err" id="leadErr" role="alert"></div>
        <div class="crm-actions"><button type="button" class="btn secondary" data-close>${esc(t('crm_close'))}</button><button class="btn primary" id="leadSave">${esc(t('crm_save'))}</button></div>
      </form>`;
    const note = $('#leadNote');
    const cnt = () => { $('#leadNoteCount').textContent = `${note.value.length}/1000`; };
    note.addEventListener('input', cnt); cnt();
    $('#leadForm').addEventListener('submit', saveLead);
    $('#leadModal').classList.add('open');
    $('#leadStatus').focus();
  }

  function closeLead() {
    $('#leadModal').classList.remove('open');
    openId = null;
    if (/^#lead-/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  }

  async function saveLead(e) {
    e.preventDefault();
    if (openId == null) return;
    const btn = $('#leadSave');
    btn.disabled = true;
    $('#leadErr').textContent = '';
    try {
      const r = await req('PATCH', `/api/b2b/leads/${encodeURIComponent(openId)}`, { status: $('#leadStatus').value, note: $('#leadNote').value });
      toast(t('crm_lead_saved'));
      closeLead();
      if (r && r.lead) { const i = leads.findIndex((x) => x.id === r.lead.id); if (i >= 0) leads[i] = r.lead; }
      await load();
    } catch (err) {
      if (onAuthError(err)) { closeLead(); return; }
      $('#leadErr').textContent = err.message;
    } finally { btn.disabled = false; }
  }

  // ---------------------------------------------------------------- Ayarlar
  function renderSettings() {
    const ch = (settings && settings.channels) || {};
    const chip = (on, k) => `<span class="crm-chan${on ? ' on' : ''}">${esc(t(k))}: ${esc(t(on ? 'crm_chan_on' : 'crm_chan_off'))}</span>`;
    $('#settingsChannels').innerHTML = chip(ch.telegram, 'crm_chan_tg') + chip(ch.email, 'crm_chan_email');
    $('#settingsMeta').textContent = settings && settings.updatedAt ? t('crm_updated_by', { at: when(settings.updatedAt), by: settings.updatedBy || '' }) : '';
  }

  async function openSettings() {
    $('#settingsPanel').hidden = false;
    $('#settingsErr').textContent = '';
    try {
      settings = await req('GET', '/api/b2b/settings');
      $('#setTgChat').value = settings.telegramChatId || '';
      $('#setEmail').value = settings.notifyEmail || '';
      renderSettings();
    } catch (err) {
      if (onAuthError(err)) return;
      $('#settingsErr').textContent = err.message;
    }
    $('#settingsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bind() {
    $('#leadFilter').addEventListener('change', (e) => {
      filter = STATUSES.includes(e.target.value) ? e.target.value : '';
      store.set('b2bLeadFilter', filter);
      load();
    });
    $('#leads').addEventListener('click', (e) => {
      if (e.target.closest('[data-stop]')) return; // tel:/WhatsApp linki — pəncərə açılmasın
      const el = e.target.closest('[data-lead]');
      if (el) openLead(Number(el.dataset.lead));
    });
    $('#leads').addEventListener('keydown', (e) => {
      const el = e.target.closest('[data-lead]');
      if (el && (e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); openLead(Number(el.dataset.lead)); }
    });
    $('#leadModal').addEventListener('click', (e) => { if (e.target.id === 'leadModal' || e.target.closest('[data-close]')) closeLead(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#leadModal').classList.contains('open')) closeLead(); });
    window.addEventListener('hashchange', () => {
      const m = /^#lead-(\d{1,15})$/.exec(location.hash);
      if (m) openLead(Number(m[1]));
    });
    $('#settingsLink').addEventListener('click', (e) => { e.preventDefault(); openSettings(); });
    $('#settingsClose').addEventListener('click', () => { $('#settingsPanel').hidden = true; });
    $('#settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#settingsSave');
      btn.disabled = true;
      $('#settingsErr').textContent = '';
      try {
        const r = await req('PUT', '/api/b2b/settings', { telegramChatId: $('#setTgChat').value.trim(), notifyEmail: $('#setEmail').value.trim() });
        settings = r.settings;
        renderSettings();
        toast(t('crm_saved'));
      } catch (err) {
        if (onAuthError(err)) return;
        $('#settingsErr').textContent = err.message;
      } finally { btn.disabled = false; }
    });
    $('#setTgTest').addEventListener('click', async () => {
      const btn = $('#setTgTest');
      btn.disabled = true;
      $('#settingsErr').textContent = '';
      try {
        await req('POST', '/api/b2b/settings/telegram-test', { chatId: $('#setTgChat').value.trim() });
        toast(t('crm_tg_test_ok'));
      } catch (err) {
        if (onAuthError(err)) return;
        $('#settingsErr').textContent = err.message;
      } finally { btn.disabled = false; }
    });
    document.addEventListener('langchange', () => { if (me) { render(); if (settings) renderSettings(); } });
  }

  function reset() {
    me = null; leads = []; counts = {}; settings = null;
    $('#settingsLink').hidden = true;
    $('#settingsPanel').hidden = true;
    $('#setTgChat').value = ''; $('#setEmail').value = '';
    $('#leads').innerHTML = '';
    closeLead();
  }

  bind();
  return { load, reset, normPhone: crmNormPhone };
})();
// applyI18n DOMContentLoaded-da işləyir; yeni data-i18n elementləri də ora daxildir
if (document.readyState !== 'loading') applyI18n();
