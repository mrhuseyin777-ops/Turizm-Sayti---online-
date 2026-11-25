/* global BrandView, B2BApp */
// B2B → Ayarlar: "Brend" (agentlik görünən adı, loqo, rəng, əlaqə, lisenziya, ünvan, sayt) və "Komissiya"
// (default %, operator / istiqamət / qiymət növü / məhsul tipi üzrə qaydalar, sabit ₼, minimum marja, yuvarlaqlaşdırma).
// Dəyişiklik yalnız role=admin (server də yoxlayır). Qüvvədə olan qaydalar serverdə tətbiq olunur (src/markup.js) —
// burada yalnız forma. b2b.js ilə körpü: window.B2BApp (rerun, me) və 'b2b:session' hadisəsi.
// window.B2BBrand.signature() — WhatsApp/mətn təklifinin imzası. Bütün dinamik mətn esc() ilə (CSP: inline JS yox).
Object.assign(I18N.az, {
  br_card: 'Brend', br_card_sub: 'Seçim linkində (/s/…), çap/PDF təklifdə və WhatsApp təklif mətninin imzasında avtomatik göstərilir.',
  br_name: 'Agentliyin görünən adı', br_color: 'Əsas rəng', br_phone: 'Telefon', br_wa: 'WhatsApp', br_lic: 'Lisenziya №', br_addr: 'Ünvan', br_web: 'Sayt',
  br_logo: 'Loqo', br_logo_hint: 'PNG, JPEG və ya WebP, maks. 200 KB (SVG qəbul edilmir).', br_logo_del: 'Loqonu sil', br_logo_ok: 'Loqo yükləndi', br_logo_deleted: 'Loqo silindi',
  br_logo_big: 'Fayl 200 KB-dan böyükdür', br_logo_type: 'Yalnız PNG, JPEG və ya WebP', br_saved: 'Brend profili yadda saxlanıldı', br_preview: 'Önizləmə',
  mk_card: 'Komissiya', mk_card_sub: 'Müştəri qiyməti bütün yerlərdə (axtarış, ən ucuz panel, matris, seçilmişlər, seçim linki, çap təklif) serverdə bu qaydalarla hesablanır.',
  mk_enabled: 'Qaydaları tətbiq et', mk_default: 'Default %', mk_fixed: 'Sabit əlavə ₼', mk_min: 'Minimum marja ₼', mk_round: 'Yuvarlaqlaşdırma',
  mk_round_0: 'Yox', mk_round_1: '1 ₼ yuxarı', mk_round_5: '5 ₼ yuxarı', mk_round_10: '10 ₼ yuxarı',
  mk_rules: 'Qaydalar', mk_add: '+ Qayda əlavə et', mk_op: 'Operator', mk_dest: 'İstiqamət', mk_ptype: 'Qiymət növü', mk_prod: 'Məhsul tipi', mk_pct: '%', mk_rfixed: 'Sabit ₼',
  mk_any: 'Hamısı', mk_prod_package: 'Tur paketi', mk_prod_hotel: 'Yalnız otel', mk_prod_tour: 'Ekskursiya turu', mk_ptype_EB: 'EB (erkən)', mk_ptype_SPO: 'SPO', mk_ptype_STD: 'STD (standart)',
  mk_spec: '{n} kriteriya', mk_del: 'Sil', mk_fixed_ph: 'ümumi', mk_saved: 'Komissiya qaydaları yadda saxlanıldı', mk_none: 'Qayda yoxdur — hamısına default % tətbiq olunur.',
  mk_help: 'Prioritet: ən spesifik qayda qalib gəlir (daha çox kriteriya). Bərabər olanda: operator > istiqamət > qiymət növü > məhsul tipi, sonra siyahıda yuxarıdakı. Marja = net × % + sabit; minimumdan az olarsa minimum; sonra yuvarlaqlaşdırma.',
  mk_rules_on: 'komissiya qaydaları', mk_lock: 'Qaydalar aktivdir', mk_lock_t: 'Müştəri qiyməti Ayarlar → Komissiya qaydaları ilə serverdə hesablanır',
});
Object.assign(I18N.en, {
  br_card: 'Brand', br_card_sub: 'Shown automatically on the selection link (/s/…), the print/PDF quote and the WhatsApp quote signature.',
  br_name: 'Agency display name', br_color: 'Main colour', br_phone: 'Phone', br_wa: 'WhatsApp', br_lic: 'Licence No.', br_addr: 'Address', br_web: 'Website',
  br_logo: 'Logo', br_logo_hint: 'PNG, JPEG or WebP, max 200 KB (SVG is not accepted).', br_logo_del: 'Remove logo', br_logo_ok: 'Logo uploaded', br_logo_deleted: 'Logo removed',
  br_logo_big: 'File is larger than 200 KB', br_logo_type: 'PNG, JPEG or WebP only', br_saved: 'Brand profile saved', br_preview: 'Preview',
  mk_card: 'Commission', mk_card_sub: 'The client price everywhere (search, cheapest panel, matrix, shortlist, selection link, print quote) is calculated on the server with these rules.',
  mk_enabled: 'Apply rules', mk_default: 'Default %', mk_fixed: 'Fixed add-on ₼', mk_min: 'Minimum margin ₼', mk_round: 'Rounding',
  mk_round_0: 'None', mk_round_1: 'Up to 1 ₼', mk_round_5: 'Up to 5 ₼', mk_round_10: 'Up to 10 ₼',
  mk_rules: 'Rules', mk_add: '+ Add rule', mk_op: 'Operator', mk_dest: 'Destination', mk_ptype: 'Price type', mk_prod: 'Product', mk_pct: '%', mk_rfixed: 'Fixed ₼',
  mk_any: 'Any', mk_prod_package: 'Package', mk_prod_hotel: 'Hotel only', mk_prod_tour: 'Excursion tour', mk_ptype_EB: 'EB (early)', mk_ptype_SPO: 'SPO', mk_ptype_STD: 'STD (standard)',
  mk_spec: '{n} criteria', mk_del: 'Delete', mk_fixed_ph: 'global', mk_saved: 'Commission rules saved', mk_none: 'No rules — the default % applies to everything.',
  mk_help: 'Priority: the most specific rule wins (more criteria). On a tie: operator > destination > price type > product, then the higher rule in the list. Margin = net × % + fixed; if below the minimum, the minimum; then rounding.',
  mk_rules_on: 'commission rules', mk_lock: 'Rules active', mk_lock_t: 'The client price is calculated on the server by Settings → Commission rules',
});
Object.assign(I18N.ru, {
  br_card: 'Бренд', br_card_sub: 'Автоматически показывается на ссылке подборки (/s/…), в печатном/PDF предложении и в подписи WhatsApp-предложения.',
  br_name: 'Отображаемое название', br_color: 'Основной цвет', br_phone: 'Телефон', br_wa: 'WhatsApp', br_lic: 'Лицензия №', br_addr: 'Адрес', br_web: 'Сайт',
  br_logo: 'Логотип', br_logo_hint: 'PNG, JPEG или WebP, макс. 200 КБ (SVG не принимается).', br_logo_del: 'Удалить логотип', br_logo_ok: 'Логотип загружен', br_logo_deleted: 'Логотип удалён',
  br_logo_big: 'Файл больше 200 КБ', br_logo_type: 'Только PNG, JPEG или WebP', br_saved: 'Профиль бренда сохранён', br_preview: 'Предпросмотр',
  mk_card: 'Комиссия', mk_card_sub: 'Цена для клиента везде (поиск, самое дешёвое, матрица, избранное, ссылка подборки, печатное предложение) считается на сервере по этим правилам.',
  mk_enabled: 'Применять правила', mk_default: 'Процент по умолчанию', mk_fixed: 'Фикс. надбавка ₼', mk_min: 'Мин. маржа ₼', mk_round: 'Округление',
  mk_round_0: 'Нет', mk_round_1: 'Вверх до 1 ₼', mk_round_5: 'Вверх до 5 ₼', mk_round_10: 'Вверх до 10 ₼',
  mk_rules: 'Правила', mk_add: '+ Добавить правило', mk_op: 'Оператор', mk_dest: 'Направление', mk_ptype: 'Тип цены', mk_prod: 'Продукт', mk_pct: '%', mk_rfixed: 'Фикс. ₼',
  mk_any: 'Любой', mk_prod_package: 'Тур-пакет', mk_prod_hotel: 'Только отель', mk_prod_tour: 'Экскурсионный тур', mk_ptype_EB: 'EB (ранее)', mk_ptype_SPO: 'SPO', mk_ptype_STD: 'STD (стандарт)',
  mk_spec: 'критериев: {n}', mk_del: 'Удалить', mk_fixed_ph: 'общая', mk_saved: 'Правила комиссии сохранены', mk_none: 'Правил нет — ко всем применяется процент по умолчанию.',
  mk_help: 'Приоритет: побеждает самое конкретное правило (больше критериев). При равенстве: оператор > направление > тип цены > продукт, затем правило выше в списке. Маржа = нетто × % + фикс.; если меньше минимума — минимум; затем округление.',
  mk_rules_on: 'правила комиссии', mk_lock: 'Правила активны', mk_lock_t: 'Цена для клиента считается на сервере по правилам Настройки → Комиссия',
});

const B2BBrand = (() => {
  const $ = (s) => document.querySelector(s);
  const LOGO_MAX = 200 * 1024;
  const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
  const CRIT = ['providerId', 'destinationId', 'priceType', 'productType'];
  let brand = null;
  let mk = null; // { config, active, options, canEdit }
  let rules = [];
  let bound = false;

  async function req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
    const r = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
    return data;
  }
  const authFail = (err) => !!(window.B2BApp && B2BApp.onAuthError(err));

  // ---------------------------------------------------------------- Komissiya sahəsinin vəziyyəti (b2b.html #markup)
  function syncMarkupField() {
    const input = $('#markup');
    if (!input) return;
    const on = !!(mk && mk.active);
    input.disabled = on;
    input.title = on ? t('mk_lock_t') : '';
    let lock = $('#markupLock');
    if (on && !lock) {
      lock = document.createElement('span');
      lock.id = 'markupLock';
      lock.className = 'markup-lock';
      input.closest('label').after(lock);
    }
    if (lock) { lock.hidden = !on; lock.textContent = t('mk_lock'); lock.title = t('mk_lock_t'); }
  }

  async function load() {
    try {
      const [b, m] = await Promise.all([req('GET', '/api/b2b/brand'), req('GET', '/api/b2b/markup')]);
      brand = b;
      mk = m;
      rules = (m.config.rules || []).map((r) => ({ ...r }));
      syncMarkupField();
      if (!$('#settingsPanel').hidden) render();
    } catch (err) { if (!authFail(err)) console.warn('[brand]', err.message); }
  }

  // ---------------------------------------------------------------- Brend kartı
  function brandCardHtml() {
    const b = brand || {};
    const ro = b.canEdit ? '' : ' disabled';
    const f = (id, key, label, val, attrs = '') => `<div><label for="${id}">${esc(t(label))}</label><input id="${id}" name="${key}" value="${esc(val || '')}"${attrs}${ro}></div>`;
    return `<section class="set-card" id="brandCard" aria-labelledby="brandCardTitle">
      <h3 id="brandCardTitle">${esc(t('br_card'))}</h3>
      <p class="muted">${esc(t('br_card_sub'))}</p>
      <div class="brand-preview" id="brandPreview"></div>
      <label for="brandLogoFile">${esc(t('br_logo'))}</label>
      <div class="logo-row">
        <input type="file" id="brandLogoFile" accept="image/png,image/jpeg,image/webp"${ro}>
        <button type="button" class="btn secondary sm" id="brandLogoDel"${b.logoUrl && b.canEdit ? '' : ' hidden'}>${esc(t('br_logo_del'))}</button>
        <small class="muted">${esc(t('br_logo_hint'))}</small>
      </div>
      <form id="brandForm" autocomplete="off" novalidate>
        <div class="crm-grid">
          ${f('brName', 'displayName', 'br_name', b.displayName, ` maxlength="80" placeholder="${esc(b.agencyName || '')}"`)}
          <div><label for="brColorText">${esc(t('br_color'))}</label><div class="crm-inline">
            <input type="color" id="brColor" value="${esc(b.color || '#ea580c')}" aria-label="${esc(t('br_color'))}"${ro}>
            <input id="brColorText" name="color" maxlength="7" spellcheck="false" placeholder="#ea580c" value="${esc(b.color || '')}"${ro}></div></div>
          ${f('brPhone', 'phone', 'br_phone', b.phone, ' maxlength="30" inputmode="tel" placeholder="+994 12 000 00 00"')}
          ${f('brWa', 'whatsapp', 'br_wa', b.whatsapp, ' maxlength="30" inputmode="tel" placeholder="+994 50 000 00 00"')}
          ${f('brLic', 'licenseNo', 'br_lic', b.licenseNo, ' maxlength="40"')}
          ${f('brWeb', 'website', 'br_web', b.website, ' maxlength="200" inputmode="url" placeholder="https://agentlik.az"')}
        </div>
        ${f('brAddr', 'address', 'br_addr', b.address, ' maxlength="160"')}
        <div class="crm-err" id="brandErr" role="alert"></div>
        ${b.canEdit ? `<div class="crm-actions"><button class="btn primary" id="brandSave">${esc(t('crm_save'))}</button></div>` : ''}
      </form>
    </section>`;
  }

  // Önizləmə: yalnız validasiya olunmuş hex CSS dəyişəninə yazılır
  function renderPreview() {
    const el = $('#brandPreview');
    if (!el) return;
    const color = String($('#brColorText').value || '').trim().toLowerCase();
    const ok = /^#[0-9a-f]{6}$/.test(color);
    el.style.removeProperty('--brand');
    el.style.removeProperty('--brand-on');
    if (ok) {
      const lin = (c) => { const v = parseInt(c, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = 0.2126 * lin(color.slice(1, 3)) + 0.7152 * lin(color.slice(3, 5)) + 0.0722 * lin(color.slice(5, 7));
      el.style.setProperty('--brand', color);
      el.style.setProperty('--brand-on', L > 0.4 ? '#111827' : '#ffffff');
    }
    const name = $('#brName').value.trim() || (brand && brand.agencyName) || '';
    el.innerHTML = `${BrandView.logoHtml(brand || {})}<div><small>${esc(t('br_preview'))}</small><br><b>${esc(name)}</b></div>`;
  }

  // ---------------------------------------------------------------- Komissiya kartı
  function optionList(kind, sel) {
    const o = (mk && mk.options) || {};
    const any = `<option value="">${esc(t('mk_any'))}</option>`;
    if (kind === 'providerId') return any + (o.providers || []).map((p) => `<option value="${esc(p.id)}"${p.id === sel ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
    if (kind === 'destinationId') return any + (o.destinations || []).map((d) => `<option value="${esc(d.id)}"${d.id === sel ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
    if (kind === 'priceType') return any + (o.priceTypes || []).map((p) => `<option value="${esc(p)}"${p === sel ? ' selected' : ''}>${esc(t('mk_ptype_' + p))}</option>`).join('');
    return any + (o.productTypes || []).map((p) => `<option value="${esc(p)}"${p === sel ? ' selected' : ''}>${esc(t('mk_prod_' + p))}</option>`).join('');
  }
  function rulesRows() {
    const ro = mk && mk.canEdit ? '' : ' disabled';
    if (!rules.length) return `<tr><td colspan="8" class="muted">${esc(t('mk_none'))}</td></tr>`;
    return rules.map((r, i) => `<tr data-rule="${i}">
      ${CRIT.map((k) => `<td><select data-k="${k}" aria-label="${esc(t({ providerId: 'mk_op', destinationId: 'mk_dest', priceType: 'mk_ptype', productType: 'mk_prod' }[k]))}"${ro}>${optionList(k, r[k] || '')}</select></td>`).join('')}
      <td class="num"><input data-k="pct" type="number" min="0" max="100" step="0.5" value="${esc(r.pct ?? 0)}" aria-label="%"${ro}></td>
      <td class="num"><input data-k="fixed" type="number" min="0" max="10000" step="1" value="${esc(r.fixed ?? '')}" placeholder="${esc(t('mk_fixed_ph'))}" aria-label="${esc(t('mk_rfixed'))}"${ro}></td>
      <td class="mk-spec">${esc(t('mk_spec', { n: CRIT.filter((k) => r[k]).length }))}</td>
      <td>${mk && mk.canEdit ? `<button type="button" class="btn secondary sm" data-del="${i}" aria-label="${esc(t('mk_del'))}">✕</button>` : ''}</td>
    </tr>`).join('');
  }
  function markupCardHtml() {
    const c = (mk && mk.config) || {};
    const ro = mk && mk.canEdit ? '' : ' disabled';
    const n = (id, key, label, val, max, step) => `<div><label for="${id}">${esc(t(label))}</label><input id="${id}" data-top="${key}" type="number" min="0" max="${max}" step="${step}" value="${esc(val ?? 0)}"${ro}></div>`;
    return `<section class="set-card" id="markupCard" aria-labelledby="markupCardTitle">
      <h3 id="markupCardTitle">${esc(t('mk_card'))}</h3>
      <p class="muted">${esc(t('mk_card_sub'))}</p>
      <form id="markupForm" autocomplete="off" novalidate>
        <label class="mk-enabled"><input type="checkbox" id="mkEnabled"${c.enabled ? ' checked' : ''}${ro}> ${esc(t('mk_enabled'))}</label>
        <div class="mk-top">
          ${n('mkDefault', 'defaultPct', 'mk_default', c.defaultPct, 100, 0.5)}
          ${n('mkFixed', 'fixed', 'mk_fixed', c.fixed, 10000, 1)}
          ${n('mkMin', 'minMargin', 'mk_min', c.minMargin, 10000, 1)}
          <div><label for="mkRound">${esc(t('mk_round'))}</label><select id="mkRound"${ro}>${[0, 1, 5, 10].map((v) => `<option value="${v}"${Number(c.rounding) === v ? ' selected' : ''}>${esc(t('mk_round_' + v))}</option>`).join('')}</select></div>
        </div>
        <b>${esc(t('mk_rules'))}</b>
        <div class="mk-rules-wrap"><table class="mk-rules"><thead><tr><th>${esc(t('mk_op'))}</th><th>${esc(t('mk_dest'))}</th><th>${esc(t('mk_ptype'))}</th><th>${esc(t('mk_prod'))}</th><th>${esc(t('mk_pct'))}</th><th>${esc(t('mk_rfixed'))}</th><th></th><th></th></tr></thead>
          <tbody id="mkRules">${rulesRows()}</tbody></table></div>
        ${mk && mk.canEdit ? `<button type="button" class="btn secondary sm" id="mkAdd">${esc(t('mk_add'))}</button>` : ''}
        <p class="mk-help">${esc(t('mk_help'))}</p>
        <div class="crm-err" id="markupErr" role="alert"></div>
        ${mk && mk.canEdit ? `<div class="crm-actions"><button class="btn primary" id="markupSave">${esc(t('crm_save'))}</button></div>` : ''}
      </form>
    </section>`;
  }

  // Cədvəldəki dəyərləri rules massivinə oxu
  function readRules() {
    document.querySelectorAll('#mkRules [data-rule]').forEach((tr) => {
      const r = rules[+tr.dataset.rule];
      if (!r) return;
      tr.querySelectorAll('[data-k]').forEach((el) => {
        const k = el.dataset.k;
        if (k === 'pct') r.pct = el.value === '' ? 0 : Number(el.value);
        else if (k === 'fixed') {
          if (el.value === '') delete r.fixed;
          else r.fixed = Number(el.value);
        } else if (el.value) r[k] = el.value;
        else delete r[k];
      });
    });
  }

  function render() {
    const host = $('#brandSettings');
    if (!host || !brand || !mk) return;
    host.innerHTML = brandCardHtml() + markupCardHtml();
    renderPreview();
  }

  // ---------------------------------------------------------------- Hadisələr
  function bind() {
    if (bound) return;
    bound = true;
    const host = $('#brandSettings');
    $('#settingsLink').addEventListener('click', () => { load(); });
    host.addEventListener('input', (e) => {
      if (e.target.id === 'brColor') { $('#brColorText').value = e.target.value; renderPreview(); }
      else if (e.target.id === 'brColorText') {
        if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) $('#brColor').value = e.target.value.toLowerCase();
        renderPreview();
      } else if (e.target.id === 'brName') renderPreview();
      else if (e.target.closest('#mkRules')) onRuleEdit(e.target);
    });
    host.addEventListener('change', (e) => {
      if (e.target.closest('#mkRules')) onRuleEdit(e.target);
      if (e.target.id === 'brandLogoFile') uploadLogo(e.target);
    });
    host.addEventListener('click', async (e) => {
      if (e.target.id === 'mkAdd') { readRules(); rules.push({ providerId: '', pct: Number($('#mkDefault').value) || 0 }); $('#mkRules').innerHTML = rulesRows(); return; }
      const del = e.target.closest('[data-del]');
      if (del) { readRules(); rules.splice(+del.dataset.del, 1); $('#mkRules').innerHTML = rulesRows(); return; }
      if (e.target.id === 'brandLogoDel') {
        try {
          const r = await req('DELETE', '/api/b2b/brand/logo', {});
          brand = r.brand; render(); toast(t('br_logo_deleted'));
        } catch (err) { if (!authFail(err)) $('#brandErr').textContent = err.message; }
      }
    });
    host.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.target.id === 'brandForm') saveBrand();
      else if (e.target.id === 'markupForm') saveMarkup();
    });
    document.addEventListener('langchange', () => { if (!$('#settingsPanel').hidden) { readRulesSafe(); render(); } syncMarkupField(); });
  }
  const readRulesSafe = () => { if ($('#mkRules')) readRules(); };
  // Qayda sətri dəyişdi: massivi yenilə, spesifiklik sayını göstər
  function onRuleEdit(target) {
    readRules();
    const tr = target.closest('[data-rule]');
    const r = tr && rules[+tr.dataset.rule];
    if (r) tr.querySelector('.mk-spec').textContent = t('mk_spec', { n: CRIT.filter((k) => r[k]).length });
  }

  async function saveBrand() {
    const form = $('#brandForm');
    const btn = $('#brandSave');
    $('#brandErr').textContent = '';
    if (btn) btn.disabled = true;
    try {
      const body = {};
      for (const k of ['displayName', 'color', 'phone', 'whatsapp', 'licenseNo', 'address', 'website']) body[k] = String(form.elements[k].value || '').trim();
      const r = await req('PUT', '/api/b2b/brand', body);
      brand = r.brand;
      render();
      toast(t('br_saved'));
    } catch (err) {
      if (!authFail(err)) $('#brandErr').textContent = err.message;
    } finally { if (btn) btn.disabled = false; }
  }

  function uploadLogo(input) {
    const file = input.files && input.files[0];
    $('#brandErr').textContent = '';
    if (!file) return;
    // Klient yoxlaması yalnız rahatlıq üçündür — server magic byte ilə yoxlayır
    if (!TYPES.includes(file.type)) { $('#brandErr').textContent = t('br_logo_type'); input.value = ''; return; }
    if (file.size > LOGO_MAX) { $('#brandErr').textContent = t('br_logo_big'); input.value = ''; return; }
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const r = await req('POST', '/api/b2b/brand/logo', { data: String(fr.result || '') });
        brand = r.brand;
        render();
        toast(t('br_logo_ok'));
      } catch (err) {
        if (!authFail(err)) $('#brandErr').textContent = err.message;
      }
    };
    fr.readAsDataURL(file);
  }

  async function saveMarkup() {
    readRules();
    const btn = $('#markupSave');
    $('#markupErr').textContent = '';
    if (btn) btn.disabled = true;
    try {
      const body = {
        enabled: $('#mkEnabled').checked,
        defaultPct: Number($('#mkDefault').value) || 0,
        fixed: Number($('#mkFixed').value) || 0,
        minMargin: Number($('#mkMin').value) || 0,
        rounding: Number($('#mkRound').value) || 0,
        rules: rules.map((r) => {
          const o = { pct: Number(r.pct) || 0 };
          for (const k of CRIT) if (r[k]) o[k] = r[k];
          if (r.fixed !== undefined && r.fixed !== '' && r.fixed !== null) o.fixed = Number(r.fixed);
          return o;
        }),
      };
      const r = await req('PUT', '/api/b2b/markup', body);
      mk = r;
      rules = (r.config.rules || []).map((x) => ({ ...x }));
      render();
      syncMarkupField();
      toast(t('mk_saved'));
      // Cari axtarışı yeni qaydalarla yenilə (qiymətlər serverdə hesablanır)
      if (window.B2BApp && B2BApp.rerun) B2BApp.rerun();
    } catch (err) {
      if (!authFail(err)) $('#markupErr').textContent = err.message;
    } finally { if (btn) btn.disabled = false; }
  }

  // WhatsApp/mətn təklifinin imzası: brend profili (ad, telefon/WhatsApp, sayt, ünvan, lisenziya)
  function signature(s = {}) {
    return BrandView.signature(brand ? { ...brand, name: brand.name } : null, { manager: s.manager, agency: s.agency });
  }

  function reset() {
    brand = null; mk = null; rules = [];
    const host = $('#brandSettings');
    if (host) host.innerHTML = '';
    syncMarkupField();
  }

  bind();
  document.addEventListener('b2b:session', (e) => { if (e.detail && e.detail.me) load(); else reset(); });
  if (window.B2BApp && B2BApp.me) load();
  return { load, reset, signature, get brand() { return brand; }, get pricingActive() { return !!(mk && mk.active); } };
})();
window.B2BBrand = B2BBrand;
