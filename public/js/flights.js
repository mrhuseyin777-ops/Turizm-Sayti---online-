// Aviabilet axtarışı və müqayisəsi (B2C + B2B agent rejimi)
// Ortaq köməkçilər common.js-dən: api, esc, money, fmtDate, store, toast, t, I18N, LANG

Object.assign(I18N.az, {
  fl_hero_title: 'Aviabiletlər — bütün mənbələr bir axtarışda',
  fl_hero_sub: 'Eyni uçuşun qiymətini bir neçə satış mənbəyində müqayisə et. Ən ucuzdan bahalıya.',
  fl_oneway: 'Birtərəfli', fl_round: 'Gediş-dönüş', fl_direct_only: 'Yalnız birbaşa', fl_bags_incl: 'Baqaj daxil',
  fl_from: 'Haradan', fl_to: 'Haraya', fl_from_ph: 'Şəhər və ya hava limanı', fl_to_ph: 'İstanbul, Dubay, Moskva...',
  fl_depart: 'Gediş', fl_return: 'Dönüş', fl_pax: 'Sərnişinlər', fl_cabin: 'Sinif', fl_economy: 'Ekonom', fl_business: 'Biznes',
  fl_adults_n: '{n} böyük', fl_children_n: '{n} uşaq', fl_infants_n: '{n} körpə',
  fl_feat1_t: 'Bir uçuş — bir neçə mənbə', fl_feat1_d: 'Eyni reysin qiymətini mənbələr üzrə yan-yana gör, ən ucuzu yaşıl.',
  fl_feat2_t: 'Qiymət təqvimi', fl_feat2_d: '±3 gün üçün ən ucuz qiymət — bir kliklə tarixi dəyiş.',
  fl_feat3_t: 'Baqaj və şərtlər aydın', fl_feat3_d: 'Əl yükü, baqaj kq və qaytarılma şərti hər kartda.',
  fl_feat4_t: 'Agentlər üçün', fl_feat4_d: 'Net qiymət, komissiya və müştəriyə hazır mətn (B2B girişi ilə).',
  fl_demo_note: 'DEMO: uçuşlar, cədvəllər və qiymətlər nümunədir; aviaşirkət adları yalnız illüstrasiya üçündür. Bilet onlayn satılmır — "Bileti sifariş et" müraciəti menecerə gedir.',
  fl_stops: 'Aktarma', fl_dep_time: 'Gediş saatı', fl_airlines: 'Aviaşirkət', fl_baggage: 'Baqaj', fl_bags_only: 'Yalnız baqajlı tariflər',
  fl_max_price: 'Maks. qiymət', fl_reset: 'Filtrləri sıfırla',
  fl_stop0: 'Birbaşa', fl_stop1: '1 aktarma', fl_stop2: '2+ aktarma',
  fl_t_morning: 'Səhər', fl_t_day: 'Gündüz', fl_t_evening: 'Axşam', fl_t_night: 'Gecə',
  fl_sort_price: 'Ən ucuz', fl_sort_fastest: 'Ən sürətli', fl_sort_best: 'Ən yaxşı',
  fl_dur: '{h}s {m}dəq', fl_dur_h: '{h}s', fl_direct: 'Birbaşa', fl_n_stops: '{n} aktarma', fl_wait: '{d} gözləmə',
  fl_outbound: 'Gediş', fl_inbound: 'Dönüş', fl_hand: 'Əl yükü {kg} kq', fl_checked: 'Baqaj {kg} kq', fl_checked_pcs: 'Baqaj {n}×{kg} kq', fl_no_checked: 'Baqaj yoxdur',
  fl_refund_no: 'Qaytarılmır', fl_refund_fee: 'Cərimə ilə qaytarılır', fl_refund_yes: 'Qaytarılır',
  fam_basic: 'Basic (baqajsız)', fam_standard: 'Standard (baqajlı)', fam_lite: 'Lite (baqajsız)', fam_value: 'Value (baqajlı)', fam_classic: 'Classic', fam_flex: 'Flex', fam_business: 'Business',
  fl_details: 'Ətraflı', fl_hide: 'Gizlət', fl_book: 'Bileti sifariş et', fl_book_short: 'Sifariş',
  fl_cheapest_at: 'Ən ucuz: {src}', fl_total_pax: 'cəmi, {n} sərnişin', fl_sources_n: '{n} mənbə',
  fl_results: '{n} uçuş · {o} təklif', fl_no_results: 'Bu parametrlərlə uçuş tapılmadı. Tarixi, filtrləri və ya "yalnız birbaşa" seçimini dəyişin.',
  fl_searching: 'Mənbələr sorğulanır...', fl_show_more: 'Daha çox göstər', fl_pick_airport: 'Siyahıdan hava limanı seçin',
  fl_source: 'Mənbə', fl_fare: 'Tarif', fl_conditions: 'Şərtlər', fl_price: 'Qiymət', fl_layover_at: 'Aktarma: {city} ({code})',
  fl_agent_mode: 'Agent rejimi', fl_commission: 'Komissiya %', fl_client_text: 'Müştəriyə mətn', fl_net: 'Net', fl_comm_amt: 'Komissiya', fl_client_price: 'Müştəriyə',
  fl_select: 'Seç', fl_quote_title: 'Müştəriyə hazır mətn', fl_quote_hint: 'Seçilməyibsə, ən yaxşı 3 variant götürülür. Mənbə adları və net qiymət müştəriyə göstərilmir.',
  fl_copy: 'Kopyala', fl_copied: 'Kopyalandı', fl_whatsapp: 'WhatsApp-da göndər', fl_close: 'Bağla',
  fl_req_title: 'Bileti sifariş et', fl_req_hint: 'Bilet hələ onlayn satılmır: müraciətinizi menecer qəbul edib qiyməti və yerləri təsdiqləyəcək. Pasport məlumatlarını bu formada GÖNDƏRMƏYİN.',
  fl_req_email: 'E-poçt (istəyə görə)', fl_req_ok: 'Müraciətiniz qəbul edildi! Menecer tezliklə əlaqə saxlayacaq.',
  fl_footer: 'Aviabilet qiymətlərinin müqayisəsi (DEMO)', fl_all_airports: 'bütün hava limanları',
  fl_q_hello: 'Salam{client}! Sorğunuza uyğun aviabilet variantları:', fl_q_note: 'Qiymətlər və yerlər bron anına qədər dəyişə bilər.', fl_q_regards: 'Hörmətlə',
  fl_q_total: '(cəmi)', fl_q_bag: 'Baqaj', fl_err_same: 'Uçuş yeri və istiqamət fərqli olmalıdır', fl_err_ret: 'Dönüş tarixini seçin',
});
Object.assign(I18N.en, {
  fl_hero_title: 'Flights — every source in one search',
  fl_hero_sub: 'Compare the same flight across several sales channels. Cheapest first.',
  fl_oneway: 'One way', fl_round: 'Round trip', fl_direct_only: 'Direct only', fl_bags_incl: 'Checked bag',
  fl_from: 'From', fl_to: 'To', fl_from_ph: 'City or airport', fl_to_ph: 'Istanbul, Dubai, Moscow...',
  fl_depart: 'Depart', fl_return: 'Return', fl_pax: 'Passengers', fl_cabin: 'Cabin', fl_economy: 'Economy', fl_business: 'Business',
  fl_adults_n: '{n} adult(s)', fl_children_n: '{n} child(ren)', fl_infants_n: '{n} infant(s)',
  fl_feat1_t: 'One flight — many sources', fl_feat1_d: 'See the same flight priced by each source; cheapest in green.',
  fl_feat2_t: 'Price calendar', fl_feat2_d: 'Cheapest fare for ±3 days — switch date in one click.',
  fl_feat3_t: 'Clear baggage & rules', fl_feat3_d: 'Cabin bag, checked kg and refund rule on every card.',
  fl_feat4_t: 'For agents', fl_feat4_d: 'Net price, commission and client-ready text (with B2B login).',
  fl_demo_note: 'DEMO: flights, schedules and prices are sample data; airline names are illustrative only. Tickets are not sold online — "Request ticket" goes to a manager.',
  fl_stops: 'Stops', fl_dep_time: 'Departure time', fl_airlines: 'Airline', fl_baggage: 'Baggage', fl_bags_only: 'Fares with checked bag',
  fl_max_price: 'Max price', fl_reset: 'Reset filters',
  fl_stop0: 'Direct', fl_stop1: '1 stop', fl_stop2: '2+ stops',
  fl_t_morning: 'Morning', fl_t_day: 'Afternoon', fl_t_evening: 'Evening', fl_t_night: 'Night',
  fl_sort_price: 'Cheapest', fl_sort_fastest: 'Fastest', fl_sort_best: 'Best',
  fl_dur: '{h}h {m}m', fl_dur_h: '{h}h', fl_direct: 'Direct', fl_n_stops: '{n} stop(s)', fl_wait: '{d} layover',
  fl_outbound: 'Outbound', fl_inbound: 'Return', fl_hand: 'Cabin bag {kg} kg', fl_checked: 'Checked {kg} kg', fl_checked_pcs: 'Checked {n}×{kg} kg', fl_no_checked: 'No checked bag',
  fl_refund_no: 'Non-refundable', fl_refund_fee: 'Refundable with fee', fl_refund_yes: 'Refundable',
  fam_basic: 'Basic (no bag)', fam_standard: 'Standard (bag)', fam_lite: 'Lite (no bag)', fam_value: 'Value (bag)', fam_classic: 'Classic', fam_flex: 'Flex', fam_business: 'Business',
  fl_details: 'Details', fl_hide: 'Hide', fl_book: 'Request ticket', fl_book_short: 'Request',
  fl_cheapest_at: 'Cheapest: {src}', fl_total_pax: 'total, {n} passenger(s)', fl_sources_n: '{n} sources',
  fl_results: '{n} flights · {o} offers', fl_no_results: 'No flights found. Try another date, filters or turn off "direct only".',
  fl_searching: 'Querying sources...', fl_show_more: 'Show more', fl_pick_airport: 'Pick an airport from the list',
  fl_source: 'Source', fl_fare: 'Fare', fl_conditions: 'Conditions', fl_price: 'Price', fl_layover_at: 'Layover: {city} ({code})',
  fl_agent_mode: 'Agent mode', fl_commission: 'Commission %', fl_client_text: 'Client text', fl_net: 'Net', fl_comm_amt: 'Commission', fl_client_price: 'Client',
  fl_select: 'Select', fl_quote_title: 'Client-ready text', fl_quote_hint: 'If nothing is selected, the 3 best options are used. Source names and net prices are hidden from the client.',
  fl_copy: 'Copy', fl_copied: 'Copied', fl_whatsapp: 'Send via WhatsApp', fl_close: 'Close',
  fl_req_title: 'Request ticket', fl_req_hint: 'Tickets are not sold online yet: a manager will confirm price and seats. Do NOT send passport details in this form.',
  fl_req_email: 'E-mail (optional)', fl_req_ok: 'Request received! A manager will contact you shortly.',
  fl_footer: 'Flight price comparison (DEMO)', fl_all_airports: 'all airports',
  fl_q_hello: 'Hello{client}! Flight options for your request:', fl_q_note: 'Prices and seats may change until booking.', fl_q_regards: 'Best regards',
  fl_q_total: '(total)', fl_q_bag: 'Baggage', fl_err_same: 'Origin and destination must differ', fl_err_ret: 'Pick a return date',
});
Object.assign(I18N.ru, {
  fl_hero_title: 'Авиабилеты — все источники в одном поиске',
  fl_hero_sub: 'Сравните цену одного и того же рейса у разных продавцов. Сначала дешёвые.',
  fl_oneway: 'В одну сторону', fl_round: 'Туда и обратно', fl_direct_only: 'Только прямые', fl_bags_incl: 'С багажом',
  fl_from: 'Откуда', fl_to: 'Куда', fl_from_ph: 'Город или аэропорт', fl_to_ph: 'Стамбул, Дубай, Москва...',
  fl_depart: 'Туда', fl_return: 'Обратно', fl_pax: 'Пассажиры', fl_cabin: 'Класс', fl_economy: 'Эконом', fl_business: 'Бизнес',
  fl_adults_n: '{n} взр.', fl_children_n: '{n} дет.', fl_infants_n: '{n} млад.',
  fl_feat1_t: 'Один рейс — много источников', fl_feat1_d: 'Цены одного рейса у разных продавцов рядом; дешевле — зелёным.',
  fl_feat2_t: 'Календарь цен', fl_feat2_d: 'Самая низкая цена на ±3 дня — смена даты в один клик.',
  fl_feat3_t: 'Багаж и условия', fl_feat3_d: 'Ручная кладь, багаж в кг и возврат — в каждой карточке.',
  fl_feat4_t: 'Для агентов', fl_feat4_d: 'Нетто, комиссия и готовый текст для клиента (вход B2B).',
  fl_demo_note: 'ДЕМО: рейсы, расписание и цены примерные; названия авиакомпаний только для иллюстрации. Билеты онлайн не продаются — заявка уходит менеджеру.',
  fl_stops: 'Пересадки', fl_dep_time: 'Время вылета', fl_airlines: 'Авиакомпания', fl_baggage: 'Багаж', fl_bags_only: 'Только тарифы с багажом',
  fl_max_price: 'Макс. цена', fl_reset: 'Сбросить фильтры',
  fl_stop0: 'Прямой', fl_stop1: '1 пересадка', fl_stop2: '2+ пересадки',
  fl_t_morning: 'Утро', fl_t_day: 'День', fl_t_evening: 'Вечер', fl_t_night: 'Ночь',
  fl_sort_price: 'Дешевле', fl_sort_fastest: 'Быстрее', fl_sort_best: 'Оптимально',
  fl_dur: '{h}ч {m}м', fl_dur_h: '{h}ч', fl_direct: 'Прямой', fl_n_stops: 'пересадок: {n}', fl_wait: 'ожидание {d}',
  fl_outbound: 'Туда', fl_inbound: 'Обратно', fl_hand: 'Ручная кладь {kg} кг', fl_checked: 'Багаж {kg} кг', fl_checked_pcs: 'Багаж {n}×{kg} кг', fl_no_checked: 'Без багажа',
  fl_refund_no: 'Невозвратный', fl_refund_fee: 'Возврат со штрафом', fl_refund_yes: 'Возвратный',
  fam_basic: 'Basic (без багажа)', fam_standard: 'Standard (с багажом)', fam_lite: 'Lite (без багажа)', fam_value: 'Value (с багажом)', fam_classic: 'Classic', fam_flex: 'Flex', fam_business: 'Business',
  fl_details: 'Подробнее', fl_hide: 'Скрыть', fl_book: 'Заказать билет', fl_book_short: 'Заказать',
  fl_cheapest_at: 'Дешевле всего: {src}', fl_total_pax: 'итого, {n} пасс.', fl_sources_n: 'источников: {n}',
  fl_results: 'рейсов: {n} · предложений: {o}', fl_no_results: 'Рейсы не найдены. Измените дату, фильтры или отключите «только прямые».',
  fl_searching: 'Опрашиваем источники...', fl_show_more: 'Показать ещё', fl_pick_airport: 'Выберите аэропорт из списка',
  fl_source: 'Источник', fl_fare: 'Тариф', fl_conditions: 'Условия', fl_price: 'Цена', fl_layover_at: 'Пересадка: {city} ({code})',
  fl_agent_mode: 'Режим агента', fl_commission: 'Комиссия %', fl_client_text: 'Текст клиенту', fl_net: 'Нетто', fl_comm_amt: 'Комиссия', fl_client_price: 'Клиенту',
  fl_select: 'Выбрать', fl_quote_title: 'Готовый текст для клиента', fl_quote_hint: 'Если ничего не выбрано, берутся 3 лучших варианта. Источники и нетто клиенту не показываются.',
  fl_copy: 'Копировать', fl_copied: 'Скопировано', fl_whatsapp: 'Отправить в WhatsApp', fl_close: 'Закрыть',
  fl_req_title: 'Заказать билет', fl_req_hint: 'Билеты пока не продаются онлайн: менеджер подтвердит цену и места. НЕ отправляйте паспортные данные в этой форме.',
  fl_req_email: 'E-mail (необязательно)', fl_req_ok: 'Заявка принята! Менеджер скоро свяжется с вами.',
  fl_footer: 'Сравнение цен на авиабилеты (ДЕМО)', fl_all_airports: 'все аэропорты',
  fl_q_hello: 'Здравствуйте{client}! Варианты авиабилетов по вашему запросу:', fl_q_note: 'Цены и наличие мест могут измениться до бронирования.', fl_q_regards: 'С уважением',
  fl_q_total: '(итого)', fl_q_bag: 'Багаж', fl_err_same: 'Пункты вылета и прилёта должны различаться', fl_err_ret: 'Выберите дату обратно',
});

(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const color = (c) => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#64748b');
  const PAGE = 20;
  // Agent rejimi yalnız serverdə təsdiqlənmiş B2B sessiyası olanda (httpOnly cookie → /api/b2b/me).
  // localStorage-dəki köhnə "b2bSession" artıq heç nəyə icazə vermir.
  const me = await b2bMe();
  const session = me ? { agency: me.agency.name, manager: me.user.displayName } : null;
  const state = {
    trip: 'round', currency: store.get('currency', 'AZN'), sort: 'price', data: null, shown: PAGE,
    agent: !!session && store.get('flightsAgentMode', true),
    commission: Number(store.get('flightsCommission', store.get('b2bMarkup', 5))) || 0,
    picked: new Map(), // B2B: seçilmiş uçuşlar (id -> group snapshot)
  };
  $('#year').textContent = new Date().getFullYear();

  let cfg = { currencies: ['AZN', 'USD', 'EUR', 'TRY', 'RUB'] };
  try { cfg = await api('/api/config'); } catch { /* default */ }
  $('#currency').innerHTML = cfg.currencies.map((c) => `<option>${esc(c)}</option>`).join('');
  $('#currency').value = state.currency;
  $('#currency').addEventListener('change', (e) => { state.currency = e.target.value; store.set('currency', state.currency); if (state.data) run(); });

  // ---- Formatlama ----
  const localDate = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dur = (min) => { const h = Math.floor(min / 60); const m = min % 60; return m ? t('fl_dur', { h, m }) : t('fl_dur_h', { h }); };
  const hm = (local) => local.slice(11, 16);
  const dayDiff = (a, b) => Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86400000);
  const WD = { az: ['B.', 'B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] };
  const weekday = (iso) => (WD[LANG] || WD.az)[new Date(iso + 'T00:00:00Z').getUTCDay()];
  const paxCount = (q) => q.adults + q.children + q.infants;
  const clientPrice = (p) => Math.round(p * (1 + state.commission / 100));
  const baggageText = (f) => (f.checked ? (f.pieces > 1 ? t('fl_checked_pcs', { n: f.pieces, kg: f.checked }) : t('fl_checked', { kg: f.checked })) : t('fl_no_checked'));
  const famLabel = (f) => t('fam_' + f.family);
  const placeLabel = (a) => (a.isCity ? `${a.city} (${t('fl_all_airports')})` : `${a.city} (${a.code})`);

  // ---- Forma ----
  function fillPax() {
    const opts = (id, from, to, key) => {
      const el = $('#' + id); const v = el.value;
      el.innerHTML = Array.from({ length: to - from + 1 }, (_, i) => `<option value="${from + i}">${esc(t(key, { n: from + i }))}</option>`).join('');
      if (v) el.value = v;
    };
    opts('adults', 1, 9, 'fl_adults_n'); opts('children', 0, 8, 'fl_children_n'); opts('infants', 0, 4, 'fl_infants_n');
  }
  fillPax();
  $('#depart').value = localDate(21); $('#depart').min = localDate(0);
  $('#ret').value = localDate(28); $('#ret').min = localDate(0);

  function setTrip(trip) {
    state.trip = trip;
    $$('#tripSeg button').forEach((b) => b.classList.toggle('active', b.dataset.trip === trip));
    $('#retField').classList.toggle('off', trip === 'oneway');
  }
  setTrip('round');
  $('#tripSeg').addEventListener('click', (e) => { const b = e.target.closest('[data-trip]'); if (b) setTrip(b.dataset.trip); });
  $('#ret').addEventListener('focus', () => setTrip('round'));
  $('#depart').addEventListener('change', () => {
    $('#ret').min = $('#depart').value;
    if ($('#ret').value && $('#ret').value < $('#depart').value) $('#ret').value = addDays($('#depart').value, 7);
  });
  $('#swap').addEventListener('click', () => {
    const a = $('#from'); const b = $('#to');
    [a.value, b.value] = [b.value, a.value];
    [a.dataset.code, b.dataset.code] = [b.dataset.code || '', a.dataset.code || ''];
  });

  // Hava limanı autocomplete (common.js-dəki .ac / .ac-list üslubu ilə)
  function airportAC(input) {
    const wrap = input.parentElement; wrap.classList.add('ac');
    const listEl = document.createElement('div'); listEl.className = 'ac-list'; listEl.hidden = true; listEl.setAttribute('role', 'listbox'); wrap.appendChild(listEl);
    let items = []; let hl = -1; let timer; let seq = 0;
    const render = () => {
      listEl.innerHTML = items.map((a, i) => `<div data-i="${i}" role="option" class="fl-ac-item ${a.isCity ? 'city-row' : ''} ${i === hl ? 'hl' : ''}">
        <span class="code">${esc(a.isCity ? '✈✈' : a.code)}</span><span class="city">${esc(a.city)}${a.isCity ? ' — ' + esc(t('fl_all_airports')) : ''}</span>
        <small>${esc(a.isCity ? a.code.replace(/,/g, ', ') : a.name)} · ${esc(a.country)}</small></div>`).join('');
      listEl.hidden = !items.length;
    };
    const load = async () => {
      const my = ++seq;
      try {
        const res = await api('/api/flights/airports', { q: input.dataset.code ? '' : input.value, lang: LANG });
        if (my === seq) { items = res; hl = items.length ? 0 : -1; if (document.activeElement === input) render(); }
      } catch { /* sakit */ }
    };
    const pick = (a) => { input.value = placeLabel(a); input.dataset.code = a.code; listEl.hidden = true; };
    input.addEventListener('input', () => { input.dataset.code = ''; clearTimeout(timer); timer = setTimeout(load, 120); });
    input.addEventListener('focus', () => { input.select(); load(); });
    input.addEventListener('keydown', (e) => {
      if (listEl.hidden) return;
      if (e.key === 'ArrowDown') { hl = Math.min(items.length - 1, hl + 1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { hl = Math.max(0, hl - 1); render(); e.preventDefault(); }
      if (e.key === 'Enter' && hl >= 0) { pick(items[hl]); e.preventDefault(); }
      if (e.key === 'Escape') listEl.hidden = true;
    });
    listEl.addEventListener('mousedown', (e) => { const el = e.target.closest('[data-i]'); if (el) { e.preventDefault(); pick(items[+el.dataset.i]); } });
    input.addEventListener('blur', () => setTimeout(() => { listEl.hidden = true; }, 150));
  }
  airportAC($('#from')); airportAC($('#to'));

  async function ensureCode(input) {
    if (input.dataset.code) return input.dataset.code;
    const v = input.value.trim(); if (!v) return '';
    try {
      const res = await api('/api/flights/airports', { q: v.replace(/\(.*\)/, ''), lang: LANG });
      if (res[0]) { input.value = placeLabel(res[0]); input.dataset.code = res[0].code; return res[0].code; }
    } catch { /* yox */ }
    return '';
  }

  // Populyar marşrutlar (dilə görə ad)
  const ROUTES = [['GYD', 'IST,SAW'], ['GYD', 'DXB'], ['GYD', 'AYT'], ['GYD', 'NAJ'], ['GYD', 'SVO,VKO,DME'], ['GYD', 'TBS']];
  const cityCache = {};
  async function renderPopular() {
    const key = LANG;
    if (!cityCache[key]) {
      const codes = [...new Set(ROUTES.flat())];
      cityCache[key] = {};
      await Promise.all(codes.map(async (c) => {
        try { const r = await api('/api/flights/airports', { q: c.split(',')[0], lang: LANG }); const a = r.find((x) => x.code === c) || r[0]; cityCache[key][c] = a; } catch { /* */ }
      }));
    }
    const C = cityCache[key];
    const box = $('.fl-popular');
    box.innerHTML = `<span class="muted">${esc(t('popular'))}</span>` + ROUTES.filter(([f, to]) => C[f] && C[to])
      .map(([f, to]) => `<button type="button" data-from="${esc(f)}" data-to="${esc(to)}">${esc(C[f].city)} → ${esc(C[to].city)}</button>`).join('');
  }
  $('.fl-popular').addEventListener('click', (e) => {
    const b = e.target.closest('[data-from]'); if (!b) return;
    const C = cityCache[LANG] || {};
    const set = (input, code) => {
      const a = C[code];
      input.dataset.code = code;
      input.value = a ? placeLabel(code.includes(',') ? { ...a, isCity: true, code } : a) : code;
    };
    set($('#from'), b.dataset.from); set($('#to'), b.dataset.to);
    run();
  });
  renderPopular();

  // ---- Filtrlər ----
  const checkedVals = (box) => $$(`#${box} input:checked`).map((i) => i.value).join(',');
  $('#filters').addEventListener('change', (e) => {
    if (e.target.id === 'bagsF') $('#bags').checked = e.target.checked;
    if (e.target.id !== 'maxPrice') run();
  });
  let mt; $('#maxPrice').addEventListener('input', () => { clearTimeout(mt); mt = setTimeout(run, 450); });
  $('#bags').addEventListener('change', () => { $('#bagsF').checked = $('#bags').checked; });
  $('#resetFilters').addEventListener('click', () => {
    $$('#filters input[type=checkbox]').forEach((i) => { i.checked = false; });
    $('#maxPrice').value = ''; $('#bags').checked = false; $('#direct').checked = false; run();
  });
  $('#toggleFilters').addEventListener('click', () => $('#filters').classList.toggle('open'));

  function renderFilters(d) {
    const keep = (box) => new Set(checkedVals(box).split(',').filter(Boolean));
    const cur = d.query.currency;
    const priceTag = (p) => (p == null || p === Infinity ? '' : `<small class="muted" style="margin-left:auto">${money(p, cur)}</small>`);
    let k = keep('stopFilter');
    $('#stopFilter').innerHTML = [0, 1, 2].map((s) => {
      const f = d.facets.stops.find((x) => x.stops === s);
      if (!f && !k.has(String(s))) return '';
      return `<label class="chk"><input type="checkbox" value="${s}" ${k.has(String(s)) ? 'checked' : ''}> ${esc(t('fl_stop' + s))} ${priceTag(f && f.minPrice)}</label>`;
    }).join('') || '<small class="muted">—</small>';
    k = keep('timeFilter');
    const RANGES = { morning: '05–12', day: '12–17', evening: '17–22', night: '22–05' };
    $('#timeFilter').innerHTML = d.facets.times.map((f) => `<label class="chk"><input type="checkbox" value="${esc(f.id)}" ${k.has(f.id) ? 'checked' : ''} ${f.count || k.has(f.id) ? '' : 'disabled'}> ${esc(t('fl_t_' + f.id))} <small class="muted">${RANGES[f.id]}</small> ${priceTag(f.minPrice)}</label>`).join('');
    k = keep('airlineFilter');
    $('#airlineFilter').innerHTML = d.facets.airlines.map((f) => `<label class="chk"><input type="checkbox" value="${esc(f.code)}" ${k.has(f.code) ? 'checked' : ''}> <span class="dot" style="background:${color(f.color)}"></span> ${esc(f.name)} ${priceTag(f.minPrice)}</label>`).join('') || '<small class="muted">—</small>';
    $('#bagsF').checked = d.query.bags;
  }

  // ---- Axtarış ----
  function params() {
    return {
      from: $('#from').dataset.code, to: $('#to').dataset.code, trip: state.trip,
      depart: $('#depart').value, return: state.trip === 'round' ? $('#ret').value : '',
      adults: $('#adults').value, children: $('#children').value, infants: $('#infants').value, cabin: $('#cabin').value,
      direct: $('#direct').checked ? '1' : '', bags: $('#bags').checked ? '1' : '',
      stops: checkedVals('stopFilter'), times: checkedVals('timeFilter'), airlines: checkedVals('airlineFilter'),
      maxPrice: $('#maxPrice').value, sort: state.sort, currency: state.currency, lang: LANG,
    };
  }

  let runSeq = 0;
  async function run() {
    const from = await ensureCode($('#from'));
    const to = await ensureCode($('#to'));
    if (!from) { $('#from').focus(); return toast(t('fl_pick_airport')); }
    if (!to) { $('#to').focus(); return toast(t('fl_pick_airport')); }
    if (from === to) return toast(t('fl_err_same'));
    if (state.trip === 'round' && !$('#ret').value) { $('#ret').focus(); return toast(t('fl_err_ret')); }
    $('#intro').hidden = true; $('#resultsLayout').hidden = false;
    $('#results').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${esc(t('fl_searching'))}</p>`;
    const p = params();
    history.replaceState(null, '', '?' + new URLSearchParams(Object.entries({ ...p, lang: undefined }).filter(([, v]) => v)).toString());
    const my = ++runSeq;
    try {
      const data = await api('/api/flights/search', p);
      if (my !== runSeq) return;
      state.data = data; state.shown = PAGE;
      render();
    } catch (err) {
      if (my !== runSeq) return;
      state.data = null;
      $('#results').innerHTML = `<div class="panel empty">${esc(err.message)}</div>`;
      $('#calendar').innerHTML = ''; $('#sorts').innerHTML = ''; $('#sources').innerHTML = ''; $('#moreBtn').hidden = true;
    }
  }
  $('#flightForm').addEventListener('submit', (e) => { e.preventDefault(); run(); });

  // ---- Render ----
  function render() {
    const d = state.data; if (!d) return;
    const q = d.query; const cur = q.currency;
    const dates = fmtDate(q.depart) + (q.return ? ' – ' + fmtDate(q.return) : '');
    $('#resTitle').textContent = `${placeLabel(q.fromAirport)} → ${placeLabel(q.toAirport)}`;
    $('#resSub').textContent = `${dates} · ${t('fl_adults_n', { n: q.adults })}${q.children ? ', ' + t('fl_children_n', { n: q.children }) : ''}${q.infants ? ', ' + t('fl_infants_n', { n: q.infants }) : ''} · ${t(q.cabin === 'business' ? 'fl_business' : 'fl_economy')}`
      + (d.stats ? ' · ' + t('fl_results', { n: d.stats.count, o: d.stats.offers }) : '');
    renderFilters(d);
    renderCalendar(d);
    $('#sorts').innerHTML = ['price', 'fastest', 'best'].map((k) => {
      const s = d.summary[k];
      return `<button type="button" role="tab" data-sort="${k}" class="${state.sort === k ? 'active' : ''}" aria-selected="${state.sort === k}"><b>${esc(t('fl_sort_' + k))}</b><span>${s ? money(s.price, cur) + ' · ' + esc(dur(s.durationMin)) : '—'}</span></button>`;
    }).join('');
    $('#sources').innerHTML = d.sources.map((s) => `<span class="src"><span class="dot" style="background:${color(s.color)}"></span>${esc(s.name)} <b>${s.ok ? s.count : '✕'}</b></span>`).join('');
    renderAgentBar();
    if (!d.groups.length) {
      $('#results').innerHTML = `<div class="panel empty">${esc(t('fl_no_results'))}</div>`;
      $('#moreBtn').hidden = true; return;
    }
    $('#results').innerHTML = d.groups.slice(0, state.shown).map((g, i) => card(g, i, q)).join('');
    $('#moreBtn').hidden = d.groups.length <= state.shown;
  }

  function renderCalendar(d) {
    const prices = d.calendar ? d.calendar.map((c) => c.price).filter((p) => p != null) : [];
    const min = prices.length ? Math.min(...prices) : null;
    $('#calendar').innerHTML = (d.calendar || []).map((c, i) => `<button type="button" data-cal="${i}" class="${c.selected ? 'sel' : ''} ${c.price != null && c.price === min ? 'cheap' : ''}" ${c.disabled ? 'disabled' : ''}>
      <small>${esc(weekday(c.depart))}</small><span>${esc(fmtDate(c.depart).slice(0, 5))}${c.return ? '–' + esc(fmtDate(c.return).slice(0, 5)) : ''}</span><b>${c.price != null ? money(c.price, d.query.currency) : '—'}</b></button>`).join('');
  }
  $('#calendar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cal]'); if (!b || !state.data) return;
    const c = state.data.calendar[+b.dataset.cal];
    $('#depart').value = c.depart; if (c.return) $('#ret').value = c.return;
    run();
  });
  $('#sorts').addEventListener('click', (e) => { const b = e.target.closest('[data-sort]'); if (b) { state.sort = b.dataset.sort; run(); } });
  $('#moreBtn').addEventListener('click', () => { state.shown += PAGE; render(); });

  function legRow(it, label) {
    const plus = dayDiff(it.dep, it.arr);
    const stopsTxt = it.stops === 0
      ? `<small class="direct">${esc(t('fl_direct'))}</small>`
      : `<small class="stop">${esc(t('fl_n_stops', { n: it.stops }))}: ${it.layovers.map((l) => `${esc(l.airport)} ${esc(dur(l.minutes))}`).join(', ')}</small>`;
    const dots = it.layovers.map((_, i) => `<i style="left:${((i + 1) / (it.layovers.length + 1)) * 100}%"></i>`).join('');
    return `<div class="fl-leg-wrap">${label ? `<div class="fl-leg-label">${esc(label)} · ${esc(fmtDate(it.dep.slice(0, 10)))}</div>` : ''}
      <div class="fl-leg">
        <div class="fl-t"><b>${esc(hm(it.dep))}</b><small>${esc(it.from)}</small></div>
        <div class="fl-line"><small>${esc(dur(it.durationMin))}</small><span class="fl-bar">${dots}</span>${stopsTxt}</div>
        <div class="fl-t r"><b>${esc(hm(it.arr))}${plus > 0 ? `<sup>+${plus}</sup>` : ''}</b><small>${esc(it.to)}</small></div>
      </div></div>`;
  }

  function carrierNames(g) {
    const segs = [...g.outbound.segments, ...(g.inbound ? g.inbound.segments : [])];
    const seen = new Map(); for (const s of segs) seen.set(s.carrier, s.carrierName);
    return [...seen.entries()];
  }
  const carrierColor = (code) => { const f = state.data.facets.airlines.find((a) => a.code === code); return color(f && f.color); };

  function card(g, i, q) {
    const cur = q.currency; const b = g.best;
    const agent = state.agent;
    const cs = carrierNames(g);
    const picked = state.picked.has(g.id);
    const priceBlock = agent
      ? `<div class="from">${esc(t('fl_cheapest_at', { src: b.sourceName }))}</div>
         <div class="fl-net"><span>${esc(t('fl_net'))}</span><b>${money(b.price, cur)}</b><span>${esc(t('fl_comm_amt'))} ${esc(state.commission)}%</span><b>${money(clientPrice(b.price) - b.price, cur)}</b></div>
         <div class="amount">${money(clientPrice(b.price), cur)}</div><div class="from">${esc(t('fl_client_price'))} · ${esc(t('fl_total_pax', { n: paxCount(q) }))}</div>
         <label class="fl-pick"><input type="checkbox" data-pick="${esc(g.id)}" ${picked ? 'checked' : ''}> ${esc(t('fl_select'))}</label>`
      : `<div class="from">${esc(t('fl_cheapest_at', { src: b.sourceName }))}</div>
         <div class="amount">${money(b.price, cur)}</div><div class="from">${esc(t('fl_total_pax', { n: paxCount(q) }))}</div>
         ${g.savings > 0 ? `<div class="save">${esc(t('save', { n: money(g.savings, cur) }))}</div>` : ''}`;
    return `<article class="fl-card ${picked ? 'picked' : ''}" data-g="${i}">
      <div class="fl-body">
        <div class="fl-carrier">${cs.map(([c, n]) => `<span class="fl-logo" style="background:${carrierColor(c)}">${esc(c)}</span><span>${esc(n)}</span>`).join('')}<span class="badge demo">DEMO</span></div>
        ${legRow(g.outbound, g.inbound ? t('fl_outbound') : '')}
        ${g.inbound ? legRow(g.inbound, t('fl_inbound')) : ''}
        <div class="fl-badges">
          <span class="badge">🎒 ${esc(t('fl_hand', { kg: b.fare.hand }))}</span>
          <span class="badge ${b.fare.checked ? 'good' : ''}">🧳 ${esc(baggageText(b.fare))}</span>
          <span class="badge">${esc(t('fl_refund_' + b.fare.refund))}</span>
          <span class="badge">${esc(famLabel(b.fare))}</span>
        </div>
        <div class="compare">${g.providers.map((o, j) => `<span class="op ${j === 0 ? 'best' : ''}" title="${esc(famLabel(o.fare))} · ${esc(baggageText(o.fare))}"><span class="dot" style="background:${color(o.sourceColor)}"></span>${esc(o.sourceName)} · ${money(o.price, cur)}</span>`).join('')}</div>
        <button type="button" class="fl-toggle" data-toggle="${i}" aria-expanded="false">${esc(t('fl_details'))} ▾</button>
        <div class="fl-details" id="det-${i}" hidden></div>
      </div>
      <div class="fl-price"><div>${priceBlock}</div><button class="btn sm" type="button" data-book="${i}">${esc(t('fl_book'))}</button></div>
    </article>`;
  }

  function segmentsHtml(it, label) {
    const rows = [];
    it.segments.forEach((s, k) => {
      if (k > 0) {
        const l = it.layovers[k - 1];
        rows.push(`<div class="fl-lay">⏱ ${esc(t('fl_layover_at', { city: l.city, code: l.airport }))} · ${esc(t('fl_wait', { d: dur(l.minutes) }))}</div>`);
      }
      rows.push(`<div class="fl-seg"><span class="fl-logo" style="background:${carrierColor(s.carrier)}">${esc(s.carrier)}</span>
        <div><b>${esc(hm(s.dep))} ${esc(s.from)} → ${esc(hm(s.arr))} ${esc(s.to)}</b> <span class="muted">· ${esc(dur(s.durationMin))}</span>
        <div class="muted">${esc(s.flightNo)} · ${esc(s.carrierName)} · ${esc(fmtDate(s.dep.slice(0, 10)))}</div></div></div>`);
    });
    return `<div class="fl-leg-label">${esc(label)}</div>${rows.join('')}`;
  }

  function detailsHtml(g, i) {
    const cur = state.data.query.currency; const agent = state.agent;
    const offers = g.offers;
    return `${segmentsHtml(g.outbound, t('fl_outbound'))}${g.inbound ? segmentsHtml(g.inbound, t('fl_inbound')) : ''}
      <div class="fl-offers-wrap"><table class="fl-offers"><thead><tr><th>${esc(t('fl_source'))}</th><th>${esc(t('fl_fare'))}</th><th>${esc(t('fl_conditions'))}</th>
        <th class="num">${esc(agent ? t('fl_net') : t('fl_price'))}</th>${agent ? `<th class="num">${esc(t('fl_client_price'))}</th>` : ''}<th></th></tr></thead><tbody>
      ${offers.map((o) => `<tr class="${o.id === g.best.id ? 'best' : ''}">
        <td><span class="dot" style="background:${color(o.sourceColor)}"></span> ${esc(o.sourceName)}</td>
        <td>${esc(famLabel(o.fare))}</td>
        <td><small>${esc(baggageText(o.fare))} · ${esc(t('fl_refund_' + o.fare.refund))}</small></td>
        <td class="num"><b>${money(o.price, cur)}</b></td>${agent ? `<td class="num">${money(clientPrice(o.price), cur)}</td>` : ''}
        <td class="num"><button type="button" class="btn secondary sm" data-book="${i}" data-offer="${esc(o.id)}">${esc(t('fl_book_short'))}</button></td></tr>`).join('')}
      </tbody></table></div>`;
  }

  $('#results').addEventListener('click', (e) => {
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const i = +tg.dataset.toggle; const box = $('#det-' + i);
      const open = box.hidden;
      if (open) box.innerHTML = detailsHtml(state.data.groups[i], i);
      box.hidden = !open; tg.setAttribute('aria-expanded', String(open));
      tg.textContent = (open ? t('fl_hide') + ' ▴' : t('fl_details') + ' ▾');
      return;
    }
    const bk = e.target.closest('[data-book]');
    if (bk) openRequest(state.data.groups[+bk.dataset.book], bk.dataset.offer);
  });
  $('#results').addEventListener('change', (e) => {
    const id = e.target.dataset.pick; if (!id) return;
    const g = state.data.groups.find((x) => x.id === id);
    if (e.target.checked) state.picked.set(id, { ...g, query: state.data.query }); else state.picked.delete(id);
    e.target.closest('.fl-card').classList.toggle('picked', e.target.checked);
    $('#selCount').textContent = state.picked.size;
  });

  // ---- Müraciət (Bileti sifariş et) ----
  function flightSummary(g, cur, price) {
    const leg = (it) => `${esc(fmtDate(it.dep.slice(0, 10)))} ${esc(hm(it.dep))} ${esc(it.from)} → ${esc(hm(it.arr))} ${esc(it.to)} · ${esc(it.stops ? t('fl_n_stops', { n: it.stops }) : t('fl_direct'))}`;
    return `<div class="fl-sum"><b>${carrierNames(g).map(([, n]) => esc(n)).join(' + ')}</b> <span class="badge demo">DEMO</span><br>
      ✈ ${leg(g.outbound)}${g.inbound ? `<br>✈ ${leg(g.inbound)}` : ''}<br><b>${money(price, cur)}</b></div>`;
  }

  function openRequest(g, offerId) {
    const cur = state.data.query.currency;
    const offer = g.offers.find((o) => o.id === offerId) || g.best;
    $('#modalBody').innerHTML = `<h3>${esc(t('fl_req_title'))}</h3>
      ${flightSummary(g, cur, state.agent ? clientPrice(offer.price) : offer.price)}
      <p class="hint">${esc(t('fl_req_hint'))}</p>
      <form id="reqForm" novalidate>
        <input name="name" required maxlength="80" autocomplete="name" placeholder="${esc(t('lead_name'))}"><div class="err" data-err="name" hidden></div>
        <input name="phone" required maxlength="22" inputmode="tel" autocomplete="tel" placeholder="${esc(t('lead_phone'))}"><div class="err" data-err="phone" hidden></div>
        <input name="email" type="email" maxlength="120" autocomplete="email" placeholder="${esc(t('fl_req_email'))}"><div class="err" data-err="email" hidden></div>
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('lead_note'))}"></textarea><div class="err" data-err="note" hidden></div>${HONEYPOT_HTML}
        <div class="err" data-err="flightId" hidden></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>${esc(t('fl_close'))}</button><button class="btn sm">${esc(t('lead_send'))}</button></div>
      </form>`;
    $('#modal').classList.add('open');
    $('#reqForm input[name=name]').focus();
    $('#reqForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = ev.target; const btn = form.querySelector('button:not([type])');
      const fd = Object.fromEntries(new FormData(form));
      $$('[data-err]', form).forEach((el) => { el.hidden = true; });
      $$('input', form).forEach((el) => el.removeAttribute('aria-invalid'));
      btn.disabled = true;
      try {
        const r = await fetch('/api/flights/requests', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fd.name, phone: fd.phone, email: fd.email, note: fd.note, website: fd.website || '', flightId: g.id, offerId: offer.id }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok) { $('#modal').classList.remove('open'); toast(t('fl_req_ok')); return; }
        const fields = data.fields || { name: data.error || 'Xəta' };
        for (const [k, msg] of Object.entries(fields)) {
          const el = $(`[data-err="${k}"]`, form); if (el) { el.textContent = msg; el.hidden = false; }
          const inp = $(`[name="${k}"]`, form); if (inp) inp.setAttribute('aria-invalid', 'true');
        }
      } catch { toast('Xəta'); } finally { btn.disabled = false; }
    });
  }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) $('#modal').classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').classList.remove('open'); });

  // ---- B2B agent rejimi ----
  function renderAgentBar() {
    $('#agentBar').hidden = !session;
    if (!session) return;
    $('#agentName').textContent = `${session.agency || ''}${session.manager ? ' · ' + session.manager : ''}`;
    $('#agentMode').checked = state.agent;
    $('#commission').value = state.commission;
    $('#commission').disabled = !state.agent; $('#quoteBtn').disabled = !state.agent;
    $('#selCount').textContent = state.picked.size;
  }
  if (session) {
    $('#agentMode').addEventListener('change', (e) => { state.agent = e.target.checked; store.set('flightsAgentMode', state.agent); render(); });
    let ct; $('#commission').addEventListener('input', () => {
      const v = Math.min(100, Math.max(0, Number($('#commission').value) || 0));
      state.commission = v; store.set('flightsCommission', v);
      clearTimeout(ct); ct = setTimeout(render, 250);
    });
    $('#quoteBtn').addEventListener('click', openQuote);
  }

  function quoteText(list) {
    const lines = [];
    const client = '';
    lines.push(t('fl_q_hello', { client }));
    const q = list[0].query;
    lines.push(`✈ ${placeLabel(q.fromAirport)} → ${placeLabel(q.toAirport)} · ${fmtDate(q.depart)}${q.return ? ' – ' + fmtDate(q.return) : ''} · ${t('fl_adults_n', { n: q.adults })}${q.children ? ', ' + t('fl_children_n', { n: q.children }) : ''}${q.infants ? ', ' + t('fl_infants_n', { n: q.infants }) : ''} · ${t(q.cabin === 'business' ? 'fl_business' : 'fl_economy')}`);
    lines.push('');
    const leg = (label, it) => `   ${label}: ${fmtDate(it.dep.slice(0, 10))} ${hm(it.dep)} ${it.from} → ${hm(it.arr)} ${it.to} (${dur(it.durationMin)}, ${it.stops ? t('fl_n_stops', { n: it.stops }) + ' — ' + it.layovers.map((l) => `${l.city} ${dur(l.minutes)}`).join(', ') : t('fl_direct').toLowerCase()})`;
    list.forEach((g, i) => {
      const b = g.best; const cur = g.query.currency;
      lines.push(`${i + 1}) ${carrierNames(g).map(([, n]) => n).join(' + ')} · ${g.outbound.segments.map((s) => s.flightNo).join('/')}`);
      lines.push(leg(t('fl_outbound'), g.outbound));
      if (g.inbound) lines.push(leg(t('fl_inbound'), g.inbound));
      lines.push(`   🧳 ${t('fl_hand', { kg: b.fare.hand })}, ${baggageText(b.fare)} · ${t('fl_refund_' + b.fare.refund)}`);
      lines.push(`   💰 ${money(clientPrice(b.price), cur)} ${t('fl_q_total')}`);
      lines.push('');
    });
    lines.push(t('fl_q_note'));
    if (session && session.manager) lines.push(`${t('fl_q_regards')}, ${session.manager}${session.agency ? ' — ' + session.agency : ''}`);
    return lines.join('\n').trim();
  }

  function openQuote() {
    if (!state.data || !state.data.groups.length) return toast(t('fl_no_results'));
    const list = state.picked.size ? [...state.picked.values()] : state.data.groups.slice(0, 3).map((g) => ({ ...g, query: state.data.query }));
    const text = quoteText(list);
    $('#modalBody').innerHTML = `<h3>${esc(t('fl_quote_title'))}</h3>
      <p class="muted" style="margin-top:-6px">${esc(t('fl_quote_hint'))}</p>
      <textarea class="quote" id="quoteText">${esc(text)}</textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">
        <button type="button" class="btn secondary sm" data-close>${esc(t('fl_close'))}</button>
        <button type="button" class="btn secondary sm" id="copyQuote">${esc(t('fl_copy'))}</button>
        <a class="btn sm primary" id="waQuote" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center">${esc(t('fl_whatsapp'))}</a>
      </div>`;
    const sync = () => { $('#waQuote').href = 'https://wa.me/?text=' + encodeURIComponent($('#quoteText').value); };
    sync(); $('#quoteText').addEventListener('input', sync);
    $('#copyQuote').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#quoteText').value); toast(t('fl_copied')); } catch { $('#quoteText').select(); document.execCommand && document.execCommand('copy'); }
    });
    $('#modal').classList.add('open');
  }

  // ---- Dil dəyişəndə ----
  document.addEventListener('langchange', () => {
    fillPax(); renderPopular();
    if (state.data) run();
  });

  // ---- URL-dən bərpa (paylaşılan link) ----
  const u = new URLSearchParams(location.search);
  if (u.get('from') && u.get('to')) {
    for (const [id, key] of [['depart', 'depart'], ['ret', 'return'], ['adults', 'adults'], ['children', 'children'], ['infants', 'infants'], ['cabin', 'cabin']]) if (u.get(key)) $('#' + id).value = u.get(key);
    $('#direct').checked = u.get('direct') === '1'; $('#bags').checked = u.get('bags') === '1';
    if (u.get('maxPrice')) $('#maxPrice').value = u.get('maxPrice');
    if (['price', 'fastest', 'best'].includes(u.get('sort'))) state.sort = u.get('sort');
    setTrip(u.get('trip') === 'oneway' || !u.get('return') ? 'oneway' : 'round');
    const restore = async (input, code) => {
      input.dataset.code = code;
      try {
        const r = await api('/api/flights/airports', { q: code.split(',')[0], lang: LANG });
        const a = r.find((x) => x.code === code) || r.find((x) => x.code === code.split(',')[0]);
        input.value = a ? placeLabel(code.includes(',') ? { ...a, isCity: true, code } : a) : code;
      } catch { input.value = code; }
    };
    await Promise.all([restore($('#from'), u.get('from')), restore($('#to'), u.get('to'))]);
    // filtr seçimləri ilk render-dən sonra checkbox kimi bərpa olunsun deyə müvəqqəti saxlanır
    const pre = { stopFilter: u.get('stops'), timeFilter: u.get('times'), airlineFilter: u.get('airlines') };
    for (const [box, v] of Object.entries(pre)) {
      if (v) $('#' + box).innerHTML = v.split(',').map((x) => `<input type="checkbox" value="${esc(x)}" checked hidden>`).join('');
    }
    run();
  } else {
    $('#from').value = ''; // istifadəçi seçsin; default Bakı
    $('#from').dataset.code = 'GYD';
    try { const r = await api('/api/flights/airports', { q: 'GYD', lang: LANG }); if (r[0]) $('#from').value = placeLabel(r[0]); } catch { /* */ }
  }
})();
