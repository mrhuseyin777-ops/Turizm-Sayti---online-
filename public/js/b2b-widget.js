// B2B → Ayarlar: "Vidjet" (agentlik saytı üçün axtarış: icazəli domenlər, komissiya, <iframe> kodu, ön baxış)
// və "Marketplace" (Odiola B2C müraciət formasında tərəfdaş agentlik kimi görünmək) kartları.
// Ayarlar paneli açılanda (#settingsLink) yüklənir. Bütün dinamik mətn esc() ilə (CSP: inline JS yox).
Object.assign(I18N.az, {
  wg_title: 'Vidjet — saytınız üçün axtarış', wg_sub: 'Saytınıza yerləşdirin: müştəri tur axtarır, qiymət komissiyanız daxil göstərilir (operator adı gizli), müraciət bu paneldəki «Müraciətlər»ə düşür.',
  wg_link: 'Vidjet linki', wg_markup: 'Vidjetdə komissiya %', wg_domains: 'İcazəli saytlar (domenlər)', wg_domain_ph: 'agentlik.az və ya https://www.agentlik.az',
  wg_add: 'Əlavə et', wg_remove: 'Sil', wg_domains_empty: 'Domen yoxdur — vidjet hələ heç bir başqa saytda açılmayacaq (yalnız Odiola ön baxışı).',
  wg_domains_hint: 'Yalnız bu saytlar vidjeti iframe-də göstərə bilər. Ən çox {n} domen. Sxemsiz yazılsa https:// götürülür.',
  wg_code: 'Yerləşdirmə kodu', wg_copy: 'Kopyala', wg_copied: 'Kod kopyalandı', wg_preview: 'Ön baxış', wg_preview_hide: 'Ön baxışı gizlət', wg_save: 'Yadda saxla', wg_saved: 'Vidjet ayarları yadda saxlanıldı',
  wg_regen: 'Linki yenilə', wg_regen_confirm: 'Yeni link yaradılsın? Köhnə kod dərhal işləməz olacaq və saytınızdakı kodu dəyişməli olacaqsınız.', wg_regen_ok: 'Yeni vidjet linki yaradıldı',
  wg_readonly: 'Yalnız agentlik administratoru dəyişə bilər.', wg_iframe_title: 'Tur axtarışı',
  mk_title: 'Marketplace', mk_sub: 'Odiola-da müştəri müraciət edərkən «Kim sizinlə əlaqə saxlasın?» siyahısında agentliyinizi görə bilər; seçsə, müraciət birbaşa sizə düşür.',
  mk_enabled: 'Marketplace-də görün', mk_name: 'Görünən ad', mk_city: 'Şəhər', mk_phone: 'Müştəri üçün telefon / WhatsApp (istəyə görə)', mk_phone_hint: 'Müştərinin status səhifəsində «Zəng et / WhatsApp» düyməsi üçün. Format: +994501234567',
  mk_save: 'Yadda saxla', mk_saved: 'Marketplace profili yadda saxlanıldı',
});
Object.assign(I18N.en, {
  wg_title: 'Widget — search for your website', wg_sub: 'Embed it on your site: clients search tours, prices include your commission (operator hidden), requests land in «Requests» here.',
  wg_link: 'Widget link', wg_markup: 'Widget commission %', wg_domains: 'Allowed websites (domains)', wg_domain_ph: 'agency.az or https://www.agency.az',
  wg_add: 'Add', wg_remove: 'Remove', wg_domains_empty: 'No domains — the widget will not open on any other site yet (Odiola preview only).',
  wg_domains_hint: 'Only these sites can show the widget in an iframe. Up to {n} domains. https:// is assumed if no scheme.',
  wg_code: 'Embed code', wg_copy: 'Copy', wg_copied: 'Code copied', wg_preview: 'Preview', wg_preview_hide: 'Hide preview', wg_save: 'Save', wg_saved: 'Widget settings saved',
  wg_regen: 'Regenerate link', wg_regen_confirm: 'Create a new link? The old code will stop working immediately and you will need to update your site.', wg_regen_ok: 'New widget link created',
  wg_readonly: 'Only the agency administrator can change this.', wg_iframe_title: 'Tour search',
  mk_title: 'Marketplace', mk_sub: 'On Odiola, clients can pick your agency under «Who should contact you?»; their request then goes directly to you.',
  mk_enabled: 'Show on marketplace', mk_name: 'Display name', mk_city: 'City', mk_phone: 'Client phone / WhatsApp (optional)', mk_phone_hint: 'Used for the «Call / WhatsApp» button on the client status page. Format: +994501234567',
  mk_save: 'Save', mk_saved: 'Marketplace profile saved',
});
Object.assign(I18N.ru, {
  wg_title: 'Виджет — поиск для вашего сайта', wg_sub: 'Разместите на сайте: клиент ищет туры, цена с вашей комиссией (оператор скрыт), заявки приходят в «Заявки».',
  wg_link: 'Ссылка виджета', wg_markup: 'Комиссия в виджете %', wg_domains: 'Разрешённые сайты (домены)', wg_domain_ph: 'agency.az или https://www.agency.az',
  wg_add: 'Добавить', wg_remove: 'Удалить', wg_domains_empty: 'Доменов нет — виджет пока не откроется ни на одном другом сайте (только предпросмотр Odiola).',
  wg_domains_hint: 'Только эти сайты могут показывать виджет в iframe. До {n} доменов. Без схемы подставляется https://.',
  wg_code: 'Код для вставки', wg_copy: 'Копировать', wg_copied: 'Код скопирован', wg_preview: 'Предпросмотр', wg_preview_hide: 'Скрыть предпросмотр', wg_save: 'Сохранить', wg_saved: 'Настройки виджета сохранены',
  wg_regen: 'Обновить ссылку', wg_regen_confirm: 'Создать новую ссылку? Старый код сразу перестанет работать, код на сайте нужно будет заменить.', wg_regen_ok: 'Новая ссылка виджета создана',
  wg_readonly: 'Изменять может только администратор агентства.', wg_iframe_title: 'Поиск туров',
  mk_title: 'Маркетплейс', mk_sub: 'На Odiola клиент может выбрать ваше агентство в списке «Кто с вами свяжется?» — заявка придёт напрямую вам.',
  mk_enabled: 'Показывать на маркетплейсе', mk_name: 'Отображаемое название', mk_city: 'Город', mk_phone: 'Телефон / WhatsApp для клиента (необязательно)', mk_phone_hint: 'Для кнопки «Позвонить / WhatsApp» на странице статуса. Формат: +994501234567',
  mk_save: 'Сохранить', mk_saved: 'Профиль маркетплейса сохранён',
});

(() => {
  const $ = (s) => document.querySelector(s);
  let view = null;
  let domains = [];
  let previewOn = false;

  async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }

  const widgetUrl = () => (view ? location.origin + view.path : '');
  const embedCode = () => `<iframe src="${widgetUrl()}" title="${t('wg_iframe_title')}" width="100%" height="680" style="border:0;max-width:980px" loading="lazy" referrerpolicy="no-referrer"></iframe>`;

  function render() {
    const root = $('#b2bWidgetCards');
    if (!root || !view) return;
    const ro = !view.canEdit;
    const dis = ro ? ' disabled' : '';
    const mk = view.market || {};
    root.innerHTML = `
      <section class="wgc" id="widgetCard" aria-labelledby="wgcTitle">
        <h3 id="wgcTitle">🧩 ${esc(t('wg_title'))}</h3>
        <p class="muted">${esc(t('wg_sub'))}</p>
        ${ro ? `<p class="muted">${esc(t('wg_readonly'))}</p>` : ''}
        <label>${esc(t('wg_link'))}</label>
        <div class="crm-inline"><input id="wgUrl" readonly value="${esc(widgetUrl())}"><button type="button" class="btn secondary sm" id="wgRegen"${dis}>${esc(t('wg_regen'))}</button></div>
        <label for="wgMarkup">${esc(t('wg_markup'))}</label>
        <input id="wgMarkup" type="number" min="0" max="100" step="0.5" value="${esc(view.markupPct)}"${dis}>
        <label for="wgDomain">${esc(t('wg_domains'))}</label>
        <div class="crm-inline"><input id="wgDomain" maxlength="200" spellcheck="false" autocapitalize="none" placeholder="${esc(t('wg_domain_ph'))}"${dis}>
          <button type="button" class="btn secondary sm" id="wgAdd"${dis}>${esc(t('wg_add'))}</button></div>
        <div class="wgc-domains" id="wgDomains">${domains.length ? domains.map((d, i) => `<span class="wgc-chip">${esc(d)}${ro ? '' : ` <button type="button" data-rm="${i}" aria-label="${esc(t('wg_remove'))} ${esc(d)}">✕</button>`}</span>`).join('') : `<span class="muted">${esc(t('wg_domains_empty'))}</span>`}</div>
        <p class="muted wgc-hint">${esc(t('wg_domains_hint', { n: (view.limits && view.limits.domains) || 10 }))}</p>
        <div class="crm-err" id="wgErr" role="alert"></div>
        <div class="crm-actions"><button type="button" class="btn primary" id="wgSave"${dis}>${esc(t('wg_save'))}</button></div>
        <label for="wgCode">${esc(t('wg_code'))}</label>
        <textarea id="wgCode" class="wgc-code" readonly rows="3" spellcheck="false">${esc(embedCode())}</textarea>
        <div class="crm-actions"><button type="button" class="btn secondary sm" id="wgPreviewBtn">${esc(t(previewOn ? 'wg_preview_hide' : 'wg_preview'))}</button><button type="button" class="btn sm" id="wgCopy">${esc(t('wg_copy'))}</button></div>
        <div class="wgc-preview" id="wgPreview"${previewOn ? '' : ' hidden'}>${previewOn ? `<iframe src="${esc(view.path)}" title="${esc(t('wg_iframe_title'))}" loading="lazy" referrerpolicy="no-referrer"></iframe>` : ''}</div>
      </section>
      <section class="wgc" id="marketCard" aria-labelledby="mkcTitle">
        <h3 id="mkcTitle">🛒 ${esc(t('mk_title'))}</h3>
        <p class="muted">${esc(t('mk_sub'))}</p>
        <label class="wgc-check"><input type="checkbox" id="mkEnabled"${mk.enabled ? ' checked' : ''}${dis}> ${esc(t('mk_enabled'))}</label>
        <label for="mkName">${esc(t('mk_name'))}</label><input id="mkName" maxlength="80" value="${esc(mk.name)}"${dis}>
        <label for="mkCity">${esc(t('mk_city'))}</label><input id="mkCity" maxlength="60" value="${esc(mk.city)}" placeholder="Bakı"${dis}>
        <label for="mkPhone">${esc(t('mk_phone'))}</label><input id="mkPhone" maxlength="30" inputmode="tel" value="${esc(mk.phone)}" placeholder="+994501234567"${dis}>
        <p class="muted wgc-hint">${esc(t('mk_phone_hint'))}</p>
        <div class="crm-err" id="mkErr" role="alert"></div>
        <div class="crm-actions"><button type="button" class="btn primary" id="mkSave"${dis}>${esc(t('mk_save'))}</button></div>
      </section>`;
  }

  async function load() {
    const root = $('#b2bWidgetCards');
    if (!root) return;
    try {
      view = await req('GET', '/api/b2b/widget');
      domains = [...(view.domains || [])];
      render();
    } catch (err) {
      root.innerHTML = `<p class="crm-err">${esc(err.message)}</p>`;
    }
  }

  function addDomain() {
    const inp = $('#wgDomain');
    const v = inp.value.trim();
    if (!v) return;
    if (domains.length >= ((view.limits && view.limits.domains) || 10)) { $('#wgErr').textContent = t('wg_domains_hint', { n: view.limits.domains }); return; }
    if (!domains.includes(v)) domains.push(v);
    render();
    $('#wgDomain').focus();
  }

  async function save(extra = {}) {
    $('#wgErr').textContent = '';
    const pending = $('#wgDomain').value.trim(); // yazılıb, amma «Əlavə et» basılmayıb
    const added = pending && !domains.includes(pending);
    if (added) domains.push(pending);
    const btn = $('#wgSave');
    btn.disabled = true;
    try {
      const r = await req('PUT', '/api/b2b/widget', { domains, markupPct: Number($('#wgMarkup').value || 0), ...extra });
      view = r.widget;
      domains = [...view.domains];
      render();
      toast(t(extra.regenerate ? 'wg_regen_ok' : 'wg_saved'));
    } catch (err) {
      if (added) domains.pop();
      $('#wgErr').textContent = err.message;
      btn.disabled = false;
    }
  }

  async function copyCode() {
    const ta = $('#wgCode');
    try { await navigator.clipboard.writeText(ta.value); } catch { ta.select(); document.execCommand('copy'); }
    toast(t('wg_copied'));
  }

  async function saveMarket() {
    $('#mkErr').textContent = '';
    const btn = $('#mkSave');
    btn.disabled = true;
    try {
      const r = await req('PUT', '/api/b2b/marketplace', { enabled: $('#mkEnabled').checked, name: $('#mkName').value, city: $('#mkCity').value, phone: $('#mkPhone').value });
      view = r.widget;
      render();
      toast(t('mk_saved'));
    } catch (err) {
      $('#mkErr').textContent = err.message;
      btn.disabled = false;
    }
  }

  function bind() {
    const link = $('#settingsLink');
    if (link) link.addEventListener('click', () => { load(); });
    const root = $('#b2bWidgetCards');
    if (!root) return;
    root.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { domains.splice(Number(rm.dataset.rm), 1); render(); return; }
      const id = e.target.closest('button') && e.target.closest('button').id;
      if (id === 'wgAdd') addDomain();
      else if (id === 'wgSave') save();
      else if (id === 'wgRegen') { if (window.confirm(t('wg_regen_confirm'))) save({ regenerate: true }); }
      else if (id === 'wgCopy') copyCode();
      else if (id === 'wgPreviewBtn') { previewOn = !previewOn; render(); }
      else if (id === 'mkSave') saveMarket();
    });
    root.addEventListener('keydown', (e) => { if (e.target.id === 'wgDomain' && e.key === 'Enter') { e.preventDefault(); addDomain(); } });
    document.addEventListener('langchange', () => { if (view) render(); });
  }

  bind();

})();
