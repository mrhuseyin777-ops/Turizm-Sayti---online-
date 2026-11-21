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

// ---- P1: ay təqvimi, "Hara uça bilərəm?", baqaj, aktarma riskləri, qiymət izləmə, Naxçıvan ----
Object.assign(I18N.az, {
  fl_feat2_d: '±3 gün və bütün ay üçün ən ucuz qiymət — bir kliklə tarixi dəyiş.',
  fam_light: 'Light (baqajsız)', fam_standard: 'Standard (baqajlı)', fam_flex: 'Flex (çevik)', fam_business: 'Business',
  fl_bag_count: 'Çanta (hər sərnişinə)', fl_bag_n0: 'Çantasız', fl_bag_n1: '1 çanta', fl_bag_n2: '2 çanta',
  fl_explore_btn: 'Hara uça bilərəm?', fl_explore_title: 'Hara uça bilərəm?', fl_ex_when: 'Nə vaxt', fl_ex_mode_month: 'Ay ərzində', fl_ex_mode_date: 'Konkret tarix',
  fl_ex_month: 'Ay', fl_ex_budget: 'Büdcə (istəyə görə)', fl_ex_budget_ph: 'məs. 300', fl_ex_go: 'Göstər',
  fl_ex_note: 'Təxmini qiymət (demo): 1 böyük, birtərəfli, ekonom; baqaj daxil olmaya bilər. Ay rejimində ayın hər 3-cü günü yoxlanılır. Dəqiq qiymət üçün karta klik edin.',
  fl_ex_empty: 'Bu parametrlərlə istiqamət tapılmadı. Büdcəni artırın və ya başqa ay seçin.', fl_ex_count: '{n} istiqamət · ucuzdan bahalıya', fl_ex_approx: 'təxminən',
  fl_ex_regulated: 'Qiymət menecerdən:', fl_ex_self: 'ayrı biletlər', fl_ex_loading: 'İstiqamətlər hesablanır...',
  fl_watch_list: 'İzlədiklərim', fl_watch: 'Qiyməti izlə', fl_watch_title: 'Qiyməti izlə', fl_watch_now: 'Cari ən ucuz qiymət (demo)',
  fl_watch_email: 'E-poçt (istəyə görə)', fl_watch_mode: 'Nə vaxt xəbər verək?', fl_watch_daily: 'Gündəlik xülasə', fl_watch_drop10: 'Yalnız qiymət ≥10% dəyişəndə',
  fl_watch_honest: 'Bildirişlər tezliklə: e-poçt göndərmə hələ qoşulmayıb. Hazırda bu, izləmə siyahısıdır — "İzlədiklərim" bölməsində cari demo qiyməti ilkin qiymətlə müqayisə edə bilərsiniz. İzləmə uçuş tarixi keçəndə avtomatik silinir.',
  fl_watch_save: 'İzləməyə başla', fl_watch_ok: 'Marşrut izləmə siyahısına əlavə olundu', fl_watch_empty: 'Hələ izlədiyiniz marşrut yoxdur. Axtarış nəticələrində "Qiyməti izlə" düyməsini basın.',
  fl_watch_local: 'Siyahı yalnız bu brauzerdə saxlanılır (izləmə id-si, açar və marşrut; şəxsi məlumat yoxdur).', fl_watch_initial: 'İlkin', fl_watch_current: 'İndi',
  fl_watch_same: 'dəyişməyib', fl_watch_gone: 'İzləmə tapılmadı (müddəti bitib və ya silinib) — siyahıdan çıxarıldı', fl_watch_delete: 'Sil', fl_watch_search: 'Axtar',
  fl_watch_deleted: 'İzləmə silindi', fl_watch_max: 'Ən çox 20 marşrut izləmək olar', fl_watch_pending: 'Bildiriş: tezliklə', fl_watch_err: 'Yüklənmədi',
  fl_month_btn: 'Bütün ay', fl_month_hide: 'Ayı gizlət', fl_month_note: 'Ən ucuz qiymət ({cur}, cəmi). Qiymətlər təxminidir və axtarışda yenidən yoxlanılır.',
  fl_month_rt: 'Gediş günü · dönüş {n} gecə sonra', fl_month_cheap: 'ən ucuz 3 gün', fl_month_none: 'qiymət yoxdur', fl_month_prev: 'Əvvəlki ay', fl_month_next: 'Növbəti ay', fl_month_load: 'Ay təqvimi yüklənir...',
  fl_conn_safety: 'Aktarma təhlükəsizliyi', fl_protected_only: 'Yalnız qorunan aktarmalar', fl_what_is: 'Bu nədir?',
  fl_protected_tip: 'Qorunan aktarma: bütün reyslər bir biletdə və ya tərəfdaş aviaşirkətlərdədir — gecikmə olarsa, aviaşirkət sizi növbəti reysə keçirir, baqaj son məntəqəyə qədər gedir. "Ayrı biletlər" marşrutlarında bu zəmanət yoxdur.',
  risk_selfTransfer: 'Ayrı biletlər — aktarma qorunmur', risk_airportChange: 'Hava limanı dəyişir', risk_short: 'Qısa aktarma', risk_night: 'Gecə aktarması', risk_long: 'Uzun gözləmə',
  risk_selfTransfer_d: 'Reyslər tərəfdaş olmayan aviaşirkətlərin ayrı biletləridir (DEMO nişanı). Birinci reys gecikərsə, növbəti reysə çatmamaq riski sizdədir; baqajı götürüb yenidən qeydiyyatdan keçirmək lazım ola bilər.',
  risk_airportChange_d: 'Aktarmada başqa hava limanına keçmək lazımdır ({a} → {b}). Yol vaxtını və tranzit/viza tələblərini nəzərə alın.',
  risk_short_d: 'Aktarma vaxtı bu hava limanı üçün qısadır (< {n} dəq). Gecikmə olarsa, reysə çatmamaq riski var.',
  risk_night_d: 'Gözləmə gecə saatlarına (00:00–05:00) düşür — tranzit zonada qalmaq və ya otel lazım ola bilər.',
  risk_long_d: 'Aktarmada 8 saatdan çox gözləmə var.',
  fl_break_fare: 'Bilet', fl_break_tax: 'Vergi/yığım (demo)', fl_break_bags: 'Baqaj', fl_bags_included: 'baqaj tarifə daxildir', fl_bag_sel: '{n} çanta seçilib',
  fl_fam_title: 'Tarif ailələri', fl_fam_note: 'Ümumi tarif adları (DEMO) — konkret aviaşirkətin real tarif şərtləri deyil. Qiymət seçilmiş baqajla.',
  fl_col_hand: 'Əl yükü', fl_col_bag: 'Çanta', fl_col_change: 'Dəyişmə', fl_col_refund: 'Qaytarma', fl_col_seat: 'Oturacaq',
  fl_change_no: 'Olmur', fl_change_fee: 'Ödənişli', fl_change_yes: 'Pulsuz', fl_ref_no: 'Yox', fl_ref_fee: 'Cərimə ilə', fl_ref_yes: 'Bəli',
  fl_seat_fee: 'Ödənişli', fl_seat_free: 'Pulsuz', fl_choose: 'Seç', fl_all_offers: 'Bütün mənbələr və tariflər',
  fl_reg_title: 'Bakı/Gəncə – Naxçıvan: tənzimlənən tariflər',
  fl_reg_text: 'Bu marşrutlarda tariflər dövlət tərəfindən tənzimlənir və bəzi sərnişin kateqoriyaları üçün güzəştlər var. Bilet satışı xüsusi qaydalarla aparıla bilər, ona görə burada nümunə qiymət göstərmirik. Cari qiyməti və güzəşt hüququnu AZAL-da yoxlayın və ya menecerə müraciət edin — sizin üçün dəqiqləşdirəcək.',
  fl_reg_early: 'Bayram günlərindən əvvəl biletləri erkən almaq tövsiyə olunur.', fl_reg_btn: 'Menecerə müraciət', fl_reg_price: 'Qiymət AZAL-da / menecerdə yoxlanılmalıdır',
  fl_reg_sched: 'Bu tarixdə reyslər (cədvəl nümunədir):', fl_reg_no_flights: 'Bu tarixdə reys tapılmadı — başqa tarix seçin.', fl_reg_note: 'Naxçıvan marşrutu: qiymət və güzəşt sorğusu',
});
Object.assign(I18N.en, {
  fl_feat2_d: 'Cheapest fare for ±3 days and the whole month — switch date in one click.',
  fam_light: 'Light (no bag)', fam_standard: 'Standard (bag)', fam_flex: 'Flex', fam_business: 'Business',
  fl_bag_count: 'Bags (per passenger)', fl_bag_n0: 'No checked bag', fl_bag_n1: '1 bag', fl_bag_n2: '2 bags',
  fl_explore_btn: 'Where can I fly?', fl_explore_title: 'Where can I fly?', fl_ex_when: 'When', fl_ex_mode_month: 'Any day in month', fl_ex_mode_date: 'Exact date',
  fl_ex_month: 'Month', fl_ex_budget: 'Budget (optional)', fl_ex_budget_ph: 'e.g. 300', fl_ex_go: 'Show',
  fl_ex_note: 'Estimated price (demo): 1 adult, one way, economy; baggage may not be included. In month mode every 3rd day is checked. Click a card for the exact price.',
  fl_ex_empty: 'No destinations found. Raise the budget or pick another month.', fl_ex_count: '{n} destinations · cheapest first', fl_ex_approx: 'from approx.',
  fl_ex_regulated: 'Price via manager:', fl_ex_self: 'separate tickets', fl_ex_loading: 'Calculating destinations...',
  fl_watch_list: 'My watchlist', fl_watch: 'Watch price', fl_watch_title: 'Watch price', fl_watch_now: 'Current lowest price (demo)',
  fl_watch_email: 'E-mail (optional)', fl_watch_mode: 'When should we notify you?', fl_watch_daily: 'Daily summary', fl_watch_drop10: 'Only when price changes ≥10%',
  fl_watch_honest: 'Notifications coming soon: e-mail sending is not connected yet. For now this is a watchlist — in "My watchlist" you can compare the current demo price with the initial one. The watch is deleted automatically after the flight date.',
  fl_watch_save: 'Start watching', fl_watch_ok: 'Route added to your watchlist', fl_watch_empty: 'You are not watching any route yet. Press "Watch price" on the search results.',
  fl_watch_local: 'The list is stored only in this browser (watch id, key and route; no personal data).', fl_watch_initial: 'Initial', fl_watch_current: 'Now',
  fl_watch_same: 'unchanged', fl_watch_gone: 'Watch not found (expired or deleted) — removed from the list', fl_watch_delete: 'Delete', fl_watch_search: 'Search',
  fl_watch_deleted: 'Watch deleted', fl_watch_max: 'You can watch up to 20 routes', fl_watch_pending: 'Notifications: coming soon', fl_watch_err: 'Failed to load',
  fl_month_btn: 'Whole month', fl_month_hide: 'Hide month', fl_month_note: 'Lowest price ({cur}, total). Prices are estimates and re-checked on search.',
  fl_month_rt: 'Departure day · return {n} nights later', fl_month_cheap: 'cheapest 3 days', fl_month_none: 'no price', fl_month_prev: 'Previous month', fl_month_next: 'Next month', fl_month_load: 'Loading month...',
  fl_conn_safety: 'Connection safety', fl_protected_only: 'Protected connections only', fl_what_is: 'What is this?',
  fl_protected_tip: 'Protected connection: all flights are on one ticket or partner airlines — if you miss a connection due to a delay, the airline rebooks you and checks bags through. "Separate tickets" routes have no such guarantee.',
  risk_selfTransfer: 'Separate tickets — connection not protected', risk_airportChange: 'Airport change', risk_short: 'Short connection', risk_night: 'Overnight connection', risk_long: 'Long layover',
  risk_selfTransfer_d: 'Flights are separate tickets of non-partner airlines (DEMO flag). If the first flight is late, missing the next one is your risk; you may need to collect and re-check your bags.',
  risk_airportChange_d: 'You must move to another airport during the connection ({a} → {b}). Allow for travel time and transit/visa rules.',
  risk_short_d: 'The connection time is short for this airport (< {n} min). A delay may cause a missed flight.',
  risk_night_d: 'The layover falls at night (00:00–05:00) — you may need to stay airside or book a hotel.',
  risk_long_d: 'The layover is longer than 8 hours.',
  fl_break_fare: 'Ticket', fl_break_tax: 'Taxes/fees (demo)', fl_break_bags: 'Baggage', fl_bags_included: 'baggage included in fare', fl_bag_sel: '{n} bag(s) selected',
  fl_fam_title: 'Fare families', fl_fam_note: 'Generic fare names (DEMO) — not any airline\'s actual fare rules. Price includes the selected baggage.',
  fl_col_hand: 'Cabin bag', fl_col_bag: 'Checked', fl_col_change: 'Change', fl_col_refund: 'Refund', fl_col_seat: 'Seat',
  fl_change_no: 'Not allowed', fl_change_fee: 'For a fee', fl_change_yes: 'Free', fl_ref_no: 'No', fl_ref_fee: 'With fee', fl_ref_yes: 'Yes',
  fl_seat_fee: 'Paid', fl_seat_free: 'Free', fl_choose: 'Select', fl_all_offers: 'All sources and fares',
  fl_reg_title: 'Baku/Ganja – Nakhchivan: regulated fares',
  fl_reg_text: 'Fares on these routes are regulated by the state and some passenger categories are entitled to discounts. Tickets may be sold under special rules, so we do not show sample prices here. Check the current fare and your eligibility with AZAL or ask our manager — they will confirm it for you.',
  fl_reg_early: 'Booking early before public holidays is recommended.', fl_reg_btn: 'Ask a manager', fl_reg_price: 'Price to be checked with AZAL / manager',
  fl_reg_sched: 'Flights on this date (sample schedule):', fl_reg_no_flights: 'No flights found on this date — pick another date.', fl_reg_note: 'Nakhchivan route: price and discount request',
});
Object.assign(I18N.ru, {
  fl_feat2_d: 'Самая низкая цена на ±3 дня и на весь месяц — смена даты в один клик.',
  fam_light: 'Light (без багажа)', fam_standard: 'Standard (с багажом)', fam_flex: 'Flex', fam_business: 'Business',
  fl_bag_count: 'Багаж (на пассажира)', fl_bag_n0: 'Без багажа', fl_bag_n1: '1 место', fl_bag_n2: '2 места',
  fl_explore_btn: 'Куда можно полететь?', fl_explore_title: 'Куда можно полететь?', fl_ex_when: 'Когда', fl_ex_mode_month: 'В течение месяца', fl_ex_mode_date: 'Точная дата',
  fl_ex_month: 'Месяц', fl_ex_budget: 'Бюджет (необязательно)', fl_ex_budget_ph: 'напр. 300', fl_ex_go: 'Показать',
  fl_ex_note: 'Ориентировочная цена (демо): 1 взрослый, в одну сторону, эконом; багаж может быть не включён. В режиме месяца проверяется каждый 3-й день. Точная цена — по клику на карточку.',
  fl_ex_empty: 'Направления не найдены. Увеличьте бюджет или выберите другой месяц.', fl_ex_count: 'направлений: {n} · сначала дешёвые', fl_ex_approx: 'около',
  fl_ex_regulated: 'Цена через менеджера:', fl_ex_self: 'отдельные билеты', fl_ex_loading: 'Считаем направления...',
  fl_watch_list: 'Отслеживаемые', fl_watch: 'Следить за ценой', fl_watch_title: 'Следить за ценой', fl_watch_now: 'Текущая минимальная цена (демо)',
  fl_watch_email: 'E-mail (необязательно)', fl_watch_mode: 'Когда сообщать?', fl_watch_daily: 'Ежедневная сводка', fl_watch_drop10: 'Только при изменении цены ≥10%',
  fl_watch_honest: 'Уведомления скоро: отправка e-mail ещё не подключена. Сейчас это список отслеживания — в разделе «Отслеживаемые» можно сравнить текущую демо-цену с исходной. Отслеживание удаляется автоматически после даты вылета.',
  fl_watch_save: 'Начать отслеживание', fl_watch_ok: 'Маршрут добавлен в список отслеживания', fl_watch_empty: 'Вы пока ничего не отслеживаете. Нажмите «Следить за ценой» в результатах поиска.',
  fl_watch_local: 'Список хранится только в этом браузере (id, ключ и маршрут; без личных данных).', fl_watch_initial: 'Было', fl_watch_current: 'Сейчас',
  fl_watch_same: 'без изменений', fl_watch_gone: 'Отслеживание не найдено (истекло или удалено) — убрано из списка', fl_watch_delete: 'Удалить', fl_watch_search: 'Искать',
  fl_watch_deleted: 'Отслеживание удалено', fl_watch_max: 'Можно отслеживать до 20 маршрутов', fl_watch_pending: 'Уведомления: скоро', fl_watch_err: 'Не загрузилось',
  fl_month_btn: 'Весь месяц', fl_month_hide: 'Скрыть месяц', fl_month_note: 'Минимальная цена ({cur}, итого). Цены ориентировочные и перепроверяются при поиске.',
  fl_month_rt: 'День вылета · обратно через {n} ноч.', fl_month_cheap: '3 самых дешёвых дня', fl_month_none: 'нет цены', fl_month_prev: 'Предыдущий месяц', fl_month_next: 'Следующий месяц', fl_month_load: 'Загружаем месяц...',
  fl_conn_safety: 'Надёжность пересадки', fl_protected_only: 'Только защищённые пересадки', fl_what_is: 'Что это?',
  fl_protected_tip: 'Защищённая пересадка: все рейсы в одном билете или у авиакомпаний-партнёров — при опоздании авиакомпания пересадит вас на следующий рейс, багаж идёт до конечного пункта. У маршрутов «отдельные билеты» такой гарантии нет.',
  risk_selfTransfer: 'Отдельные билеты — пересадка не защищена', risk_airportChange: 'Смена аэропорта', risk_short: 'Короткая пересадка', risk_night: 'Ночная пересадка', risk_long: 'Долгое ожидание',
  risk_selfTransfer_d: 'Рейсы — отдельные билеты авиакомпаний, не являющихся партнёрами (ДЕМО-метка). Если первый рейс задержится, риск опоздать на следующий — ваш; может понадобиться получить и заново сдать багаж.',
  risk_airportChange_d: 'Во время пересадки нужно переехать в другой аэропорт ({a} → {b}). Учтите время в пути и правила транзита/визы.',
  risk_short_d: 'Время пересадки для этого аэропорта короткое (< {n} мин). При задержке можно опоздать на рейс.',
  risk_night_d: 'Ожидание приходится на ночь (00:00–05:00) — возможно, придётся остаться в транзитной зоне или в отеле.',
  risk_long_d: 'Ожидание при пересадке больше 8 часов.',
  fl_break_fare: 'Билет', fl_break_tax: 'Сборы (демо)', fl_break_bags: 'Багаж', fl_bags_included: 'багаж включён в тариф', fl_bag_sel: 'выбрано мест: {n}',
  fl_fam_title: 'Семейства тарифов', fl_fam_note: 'Общие названия тарифов (ДЕМО) — не реальные условия конкретной авиакомпании. Цена с выбранным багажом.',
  fl_col_hand: 'Ручная кладь', fl_col_bag: 'Багаж', fl_col_change: 'Обмен', fl_col_refund: 'Возврат', fl_col_seat: 'Место',
  fl_change_no: 'Нельзя', fl_change_fee: 'Платно', fl_change_yes: 'Бесплатно', fl_ref_no: 'Нет', fl_ref_fee: 'Со штрафом', fl_ref_yes: 'Да',
  fl_seat_fee: 'Платно', fl_seat_free: 'Бесплатно', fl_choose: 'Выбрать', fl_all_offers: 'Все источники и тарифы',
  fl_reg_title: 'Баку/Гянджа – Нахчыван: регулируемые тарифы',
  fl_reg_text: 'Тарифы на этих маршрутах регулируются государством, для некоторых категорий пассажиров есть льготы. Продажа билетов может вестись по особым правилам, поэтому примерные цены здесь не показываются. Уточните текущий тариф и право на льготу в AZAL или обратитесь к менеджеру — он уточнит для вас.',
  fl_reg_early: 'Перед праздниками рекомендуется покупать билеты заранее.', fl_reg_btn: 'Обратиться к менеджеру', fl_reg_price: 'Цену нужно уточнить в AZAL / у менеджера',
  fl_reg_sched: 'Рейсы на эту дату (пример расписания):', fl_reg_no_flights: 'На эту дату рейсов нет — выберите другую дату.', fl_reg_note: 'Маршрут Нахчыван: запрос цены и льгот',
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
    month: { open: false, month: null, data: null, key: '' }, // ay təqvimi
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
  function fillBags() { $$('#bagCount option').forEach((o) => { o.textContent = t('fl_bag_n' + o.value); }); }
  fillBags();
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
  $('#bagCount').addEventListener('change', () => { if (state.data) run(); });
  $('#protectedInfo').addEventListener('click', () => {
    const tip = $('#protectedTip'); tip.hidden = !tip.hidden; $('#protectedInfo').setAttribute('aria-expanded', String(!tip.hidden));
  });
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
    $('#protectedF').checked = !!d.query.protected;
    const pf = d.facets.protected;
    $('#protectedCount').textContent = pf ? `(${pf.count})${pf.minPrice != null ? ' · ' + money(pf.minPrice, cur) : ''}` : '';
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
      bagCount: $('#bagCount').value !== '0' ? $('#bagCount').value : '', protected: $('#protectedF').checked ? '1' : '',
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
    renderRegulated(d);
    renderCalendar(d);
    $('#calTools').hidden = !!d.regulated;
    $('#watchBtn').hidden = !!d.regulated || !d.groups.length;
    $('#monthBtn').setAttribute('aria-expanded', String(state.month.open));
    if (d.regulated) { $('#monthCal').hidden = true; } else if (state.month.open) loadMonth(state.month.month || q.depart.slice(0, 7));
    $('#sorts').hidden = !!d.regulated; $('#sources').hidden = !!d.regulated;
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
    const reg = !!state.data.regulated;
    const risks = riskList(g);
    const riskHtml = risks.length ? `<div class="fl-risks">${risks.map((r) => `<button type="button" class="fl-risk ${RISK_BAD.includes(r.k) ? 'bad' : ''}" data-risk="${i}" data-rk="${esc(r.k)}" title="${esc(r.desc)}" aria-controls="rtip-${i}">⚠ ${esc(t('risk_' + r.k))}</button>`).join('')}</div>
      <div class="fl-risk-tip" id="rtip-${i}" role="note" hidden></div>` : '';
    if (reg) {
      return `<article class="fl-card fl-card-reg" data-g="${i}">
      <div class="fl-body">
        <div class="fl-carrier">${cs.map(([c, n]) => `<span class="fl-logo" style="background:${carrierColor(c)}">${esc(c)}</span><span>${esc(n)}</span>`).join('')}<span class="badge demo">DEMO</span></div>
        ${legRow(g.outbound, g.inbound ? t('fl_outbound') : '')}
        ${g.inbound ? legRow(g.inbound, t('fl_inbound')) : ''}
        ${riskHtml}
        <button type="button" class="fl-toggle" data-toggle="${i}" aria-expanded="false">${esc(t('fl_details'))} ▾</button>
        <div class="fl-details" id="det-${i}" hidden></div>
      </div>
      <div class="fl-price"><div><div class="from">${esc(t('fl_reg_price'))}</div></div><button class="btn sm" type="button" data-book="${i}">${esc(t('fl_reg_btn'))}</button></div>
    </article>`;
    }
    const priceBlock = agent
      ? `<div class="from">${esc(t('fl_cheapest_at', { src: b.sourceName }))}</div>
         <div class="fl-net"><span>${esc(t('fl_net'))}</span><b>${money(b.price, cur)}</b><span>${esc(t('fl_comm_amt'))} ${esc(state.commission)}%</span><b>${money(clientPrice(b.price) - b.price, cur)}</b></div>
         <div class="amount">${money(clientPrice(b.price), cur)}</div><div class="from">${esc(t('fl_client_price'))} · ${esc(t('fl_total_pax', { n: paxCount(q) }))}</div>
         <label class="fl-pick"><input type="checkbox" data-pick="${esc(g.id)}" ${picked ? 'checked' : ''}> ${esc(t('fl_select'))}</label>`
      : `<div class="from">${esc(t('fl_cheapest_at', { src: b.sourceName }))}</div>
         <div class="amount">${money(b.price, cur)}</div><div class="from">${esc(t('fl_total_pax', { n: paxCount(q) }))}</div>
         ${g.savings > 0 ? `<div class="save">${esc(t('save', { n: money(g.savings, cur) }))}</div>` : ''}`;
    const bk = b.breakdown || { fare: b.price, tax: 0, bags: 0 };
    const breakHtml = `<div class="fl-break" title="${esc(t('fl_break_tax'))}">
      <span>${esc(t('fl_break_fare'))} ${money(bk.fare, cur)}</span><span>+ ${esc(t('fl_break_tax'))} ${money(bk.tax, cur)}</span>
      ${q.bagCount ? `<span>+ ${esc(t('fl_break_bags'))} ${bk.bags ? money(bk.bags, cur) : esc(t('fl_bags_included'))}</span>` : ''}</div>`;
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
          ${q.bagCount ? `<span class="badge good">🧳 ${esc(t('fl_bag_sel', { n: q.bagCount }))}</span>` : ''}
        </div>
        ${riskHtml}
        <div class="compare">${g.providers.map((o, j) => `<span class="op ${j === 0 ? 'best' : ''}" title="${esc(famLabel(o.fare))} · ${esc(baggageText(o.fare))}"><span class="dot" style="background:${color(o.sourceColor)}"></span>${esc(o.sourceName)} · ${money(o.price, cur)}</span>`).join('')}</div>
        <button type="button" class="fl-toggle" data-toggle="${i}" aria-expanded="false">${esc(t('fl_details'))} ▾</button>
        <div class="fl-details" id="det-${i}" hidden></div>
      </div>
      <div class="fl-price"><div>${priceBlock}${breakHtml}</div><button class="btn sm" type="button" data-book="${i}">${esc(t('fl_book'))}</button></div>
    </article>`;
  }

  function segmentsHtml(it, label) {
    const rows = [];
    it.segments.forEach((s, k) => {
      if (k > 0) {
        const l = it.layovers[k - 1];
        rows.push(`<div class="fl-lay ${l.risks && l.risks.some((k) => RISK_BAD.includes(k)) ? 'bad' : ''}">⏱ ${esc(t('fl_layover_at', { city: l.city, code: l.toAirport ? l.airport + ' → ' + l.toAirport : l.airport }))} · ${esc(t('fl_wait', { d: dur(l.minutes) }))}${(l.risks || []).map((k) => ` · ⚠ ${esc(t('risk_' + k))}`).join('')}</div>`);
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
    const segs = `${segmentsHtml(g.outbound, t('fl_outbound'))}${g.inbound ? segmentsHtml(g.inbound, t('fl_inbound')) : ''}`;
    if (state.data.regulated) return segs;
    return `${segs}${familiesHtml(g, i)}
      <div class="fl-leg-label fl-sub">${esc(t('fl_all_offers'))}</div>
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
    const rk = e.target.closest('[data-risk]');
    if (rk) {
      const i = +rk.dataset.risk; const tip = $('#rtip-' + i);
      const r = riskList(state.data.groups[i]).find((x) => x.k === rk.dataset.rk);
      const same = !tip.hidden && tip.dataset.k === rk.dataset.rk;
      tip.textContent = r ? r.desc : ''; tip.dataset.k = rk.dataset.rk; tip.hidden = same;
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
      ✈ ${leg(g.outbound)}${g.inbound ? `<br>✈ ${leg(g.inbound)}` : ''}<br><b>${price != null ? money(price, cur) : esc(t('fl_reg_price'))}</b></div>`;
  }

  function openRequest(g, offerId) {
    const cur = state.data.query.currency;
    const offer = g.offers.find((o) => o.id === offerId) || g.best;
    $('#modalBody').innerHTML = `<h3>${esc(t('fl_req_title'))}</h3>
      ${flightSummary(g, cur, offer.price == null ? null : state.agent ? clientPrice(offer.price) : offer.price)}
      <p class="hint">${esc(t('fl_req_hint'))}</p>
      <form id="reqForm" novalidate>
        <input name="name" required maxlength="80" autocomplete="name" placeholder="${esc(t('lead_name'))}"><div class="err" data-err="name" hidden></div>
        <input name="phone" required maxlength="22" inputmode="tel" autocomplete="tel" placeholder="${esc(t('lead_phone'))}"><div class="err" data-err="phone" hidden></div>
        <input name="email" type="email" maxlength="120" autocomplete="email" placeholder="${esc(t('fl_req_email'))}"><div class="err" data-err="email" hidden></div>
        <textarea name="note" rows="2" maxlength="500" placeholder="${esc(t('lead_note'))}">${state.data.regulated ? esc(t('fl_reg_note')) : ''}</textarea><div class="err" data-err="note" hidden></div>${HONEYPOT_HTML}
        <div class="err" data-err="flightId" hidden></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>${esc(t('fl_close'))}</button><button class="btn sm">${esc(t('lead_send'))}</button></div>
        ${consentHtml()}
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

  // ---- Aktarma riskləri ----
  const RISK_ORDER = ['selfTransfer', 'airportChange', 'short', 'night', 'long'];
  const RISK_BAD = ['selfTransfer', 'airportChange'];
  function riskList(g) {
    const lays = [g.outbound, g.inbound].filter(Boolean).flatMap((it) => it.layovers || []);
    return RISK_ORDER.filter((k) => (g.risks || []).includes(k)).map((k) => {
      const l = lays.find((x) => (x.risks || []).includes(k)) || {};
      return { k, desc: t('risk_' + k + '_d', { a: l.airport || '', b: l.toAirport || '', n: l.shortLimit || 60 }) };
    });
  }

  // ---- Tarif ailələri cədvəli (detal paneli) ----
  const kgText = (f) => (f.checked ? (f.pieces > 1 ? `${f.pieces}×${f.checked} kq` : `${f.checked} kq`) : '—');
  function familiesHtml(g, i) {
    if (!g.families || !g.families.length) return '';
    const cur = state.data.query.currency; const agent = state.agent;
    const rows = g.families.map((f) => {
      const x = f.fare;
      const price = agent ? clientPrice(f.price) : f.price;
      return `<tr class="${f.offerId === g.best.id ? 'best' : ''}">
        <td data-l="${esc(t('fl_fare'))}"><b>${esc(t('fam_' + f.family))}</b><br><small class="muted">${esc(f.sourceName)}</small></td>
        <td data-l="${esc(t('fl_col_hand'))}">${esc(x.hand)} kq</td>
        <td data-l="${esc(t('fl_col_bag'))}">${esc(kgText(x))}${f.bagFee ? `<br><small class="muted">+${money(f.bagFee, cur)}</small>` : ''}</td>
        <td data-l="${esc(t('fl_col_change'))}">${esc(t('fl_change_' + x.change))}</td>
        <td data-l="${esc(t('fl_col_refund'))}">${esc(t('fl_ref_' + x.refund))}</td>
        <td data-l="${esc(t('fl_col_seat'))}">${esc(t('fl_seat_' + (x.seat || 'fee')))}</td>
        <td data-l="${esc(t('fl_price'))}" class="num"><b>${money(price, cur)}</b></td>
        <td class="num"><button type="button" class="btn sm" data-book="${i}" data-offer="${esc(f.offerId)}">${esc(t('fl_choose'))}</button></td></tr>`;
    }).join('');
    return `<div class="fl-leg-label fl-sub">${esc(t('fl_fam_title'))}</div>
      <table class="fl-offers fl-fams"><thead><tr><th>${esc(t('fl_fare'))}</th><th>${esc(t('fl_col_hand'))}</th><th>${esc(t('fl_col_bag'))}</th><th>${esc(t('fl_col_change'))}</th>
        <th>${esc(t('fl_col_refund'))}</th><th>${esc(t('fl_col_seat'))}</th><th class="num">${esc(agent ? t('fl_client_price') : t('fl_price'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <p class="fl-note">${esc(t('fl_fam_note'))}</p>`;
  }

  // ---- Naxçıvan (tənzimlənən tariflər) ----
  function renderRegulated(d) {
    const box = $('#regulated');
    box.hidden = !d.regulated;
    if (!d.regulated) { box.innerHTML = ''; return; }
    box.innerHTML = `<h3>ℹ ${esc(t('fl_reg_title'))}</h3>
      <p>${esc(t('fl_reg_text'))}</p>
      <p class="muted">${esc(t('fl_reg_early'))}</p>
      <button type="button" class="btn" id="regBook">${esc(t('fl_reg_btn'))}</button>
      <p class="fl-note">${esc(d.groups.length ? t('fl_reg_sched') : t('fl_reg_no_flights'))}</p>`;
  }
  $('#regulated').addEventListener('click', (e) => {
    if (!e.target.closest('#regBook') || !state.data) return;
    if (!state.data.groups.length) return toast(t('fl_reg_no_flights'));
    openRequest(state.data.groups[0]);
  });

  // ---- Ay təqvimi ----
  const MONTHS = {
    az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  };
  const monthName = (ym) => `${(MONTHS[LANG] || MONTHS.az)[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
  const compact = (n) => (n >= 10000 ? Math.round(n / 1000) + 'k' : Number(n).toLocaleString('az-AZ').replace(/,/g, ' '));

  function monthParams(month) {
    const p = params();
    const q = { ...p, month, depart: undefined, return: undefined, sort: undefined, maxPrice: undefined, trip: state.trip };
    if (state.trip === 'round') q.nights = String(Math.min(30, Math.max(0, dayDiff(p.depart, p.return || p.depart))));
    return q;
  }
  let monthSeq = 0;
  async function loadMonth(month) {
    const q = monthParams(month);
    const key = JSON.stringify(q);
    state.month.open = true; state.month.month = month;
    $('#monthCal').hidden = false;
    $('#monthBtn').setAttribute('aria-expanded', 'true');
    $('#monthBtn').querySelector('span').textContent = t('fl_month_hide');
    if (state.month.data && state.month.key === key) return renderMonth();
    $('#monthCal').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${esc(t('fl_month_load'))}</p>`;
    const my = ++monthSeq;
    try {
      const data = await api('/api/flights/calendar', q);
      if (my !== monthSeq) return;
      state.month.data = data; state.month.key = key;
      renderMonth();
    } catch (err) {
      if (my !== monthSeq) return;
      $('#monthCal').innerHTML = `<p class="muted" style="text-align:center">${esc(err.message)}</p>`;
    }
  }
  function closeMonth() {
    state.month.open = false; $('#monthCal').hidden = true;
    $('#monthBtn').setAttribute('aria-expanded', 'false');
    $('#monthBtn').querySelector('span').textContent = t('fl_month_btn');
  }
  function renderMonth() {
    const d = state.month.data; if (!d) return;
    const cur = d.currency; const sel = $('#depart').value;
    const offset = (new Date(d.month + '-01T00:00:00Z').getUTCDay() + 6) % 7; // bazar ertəsi ilk gün
    const wd = WD[LANG] || WD.az;
    const head = [1, 2, 3, 4, 5, 6, 0].map((k) => `<span class="fl-wd">${esc(wd[k])}</span>`).join('');
    const blanks = Array.from({ length: offset }, () => '<span class="fl-mblank"></span>').join('');
    const cells = d.days.map((x) => {
      const cls = x.disabled ? 'off' : x.price == null ? 'none' : x.cheap ? 'cheap' : '';
      const label = `${fmtDate(x.date)} · ${x.price != null ? money(x.price, cur) : t('fl_month_none')}`;
      return `<button type="button" class="fl-mday ${cls} ${x.date === sel ? 'sel' : ''}" data-mdate="${esc(x.date)}" ${x.disabled ? 'disabled' : ''} title="${esc(label)}" aria-label="${esc(label)}">
        <span class="d">${Number(x.date.slice(8))}</span><span class="p">${x.price != null ? esc(compact(x.price)) : '—'}</span></button>`;
    }).join('');
    $('#monthCal').innerHTML = `<div class="fl-month-head">
        <button type="button" class="fl-mnav" data-mnav="${esc(d.prevMonth || '')}" ${d.prevMonth ? '' : 'disabled'} aria-label="${esc(t('fl_month_prev'))}">‹</button>
        <b>${esc(monthName(d.month))}</b>
        <button type="button" class="fl-mnav" data-mnav="${esc(d.nextMonth || '')}" ${d.nextMonth ? '' : 'disabled'} aria-label="${esc(t('fl_month_next'))}">›</button></div>
      <div class="fl-mgrid">${head}${blanks}${cells}</div>
      <div class="fl-mlegend"><span><i class="lg cheap"></i>${esc(t('fl_month_cheap'))}</span><span><i class="lg none"></i>${esc(t('fl_month_none'))}</span>
        ${d.nights != null ? `<span>${esc(t('fl_month_rt', { n: d.nights }))}</span>` : ''}</div>
      <p class="fl-note">${esc(t('fl_month_note', { cur }))}</p>`;
  }
  $('#monthBtn').addEventListener('click', () => {
    if (state.month.open) return closeMonth();
    loadMonth(($('#depart').value || localDate(21)).slice(0, 7));
  });
  $('#monthCal').addEventListener('click', (e) => {
    const nav = e.target.closest('[data-mnav]');
    if (nav && nav.dataset.mnav) return loadMonth(nav.dataset.mnav);
    const b = e.target.closest('[data-mdate]'); if (!b || !state.month.data) return;
    const day = state.month.data.days.find((x) => x.date === b.dataset.mdate);
    if (!day || day.disabled) return;
    $('#depart').value = day.date;
    if (day.return) $('#ret').value = day.return;
    run();
  });

  // ---- "Hara uça bilərəm?" ----
  const exState = { data: null, seq: 0 };
  function fillExMonths() {
    const el = $('#exMonth'); const v = el.value;
    const now = new Date();
    el.innerHTML = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() + i, 1));
      const ym = d.toISOString().slice(0, 7);
      return `<option value="${ym}">${esc(monthName(ym))}</option>`;
    }).join('');
    el.value = v || el.options[1].value;
  }
  fillExMonths();
  airportAC($('#exFrom'));
  $('#exMode').addEventListener('change', () => {
    const m = $('#exMode').value === 'month';
    $('#exMonthF').hidden = !m; $('#exDateF').hidden = m;
  });
  $('#exDate').min = localDate(0);
  async function openExplore() {
    $('#explore').hidden = false; $('#exploreBtn').setAttribute('aria-expanded', 'true');
    if (!$('#exFrom').value) {
      $('#exFrom').value = $('#from').value; $('#exFrom').dataset.code = $('#from').dataset.code || 'GYD';
      if (!$('#exFrom').value) { $('#exFrom').dataset.code = 'GYD'; $('#exFrom').value = 'GYD'; }
    }
    if (!$('#exDate').value) $('#exDate').value = $('#depart').value || localDate(21);
    $('#explore').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!exState.data) runExplore();
  }
  const closeExplore = () => { $('#explore').hidden = true; $('#exploreBtn').setAttribute('aria-expanded', 'false'); };
  $('#exploreBtn').addEventListener('click', () => ($('#explore').hidden ? openExplore() : closeExplore()));
  $('#exClose').addEventListener('click', closeExplore);
  $('#exForm').addEventListener('submit', (e) => { e.preventDefault(); runExplore(); });

  async function runExplore() {
    const from = (await ensureCode($('#exFrom'))) || 'GYD';
    const month = $('#exMode').value === 'month';
    const p = { from, month: month ? $('#exMonth').value : '', depart: month ? '' : $('#exDate').value, budget: $('#exBudget').value, direct: $('#exDirect').checked ? '1' : '', currency: state.currency, lang: LANG };
    $('#exResults').innerHTML = `<div class="spinner"></div><p class="muted" style="text-align:center">${esc(t('fl_ex_loading'))}</p>`;
    const my = ++exState.seq;
    try {
      const data = await api('/api/flights/explore', p);
      if (my !== exState.seq) return;
      exState.data = data; renderExplore();
    } catch (err) {
      if (my !== exState.seq) return;
      exState.data = null;
      $('#exResults').innerHTML = `<div class="panel empty">${esc(err.message)}</div>`;
    }
  }
  function renderExplore() {
    const d = exState.data; if (!d) return;
    const cur = d.currency;
    const cards = d.items.map((x, i) => `<button type="button" class="fl-ex-card" data-ex="${i}">
        <span class="fl-ex-top"><span><b class="fl-ex-city">${esc(x.city)}</b><small class="muted">${esc(x.country)} · ${esc(x.to.replace(/,/g, '/'))}</small></span>
          <span class="fl-ex-price"><small>${esc(t('fl_ex_approx'))}</small>${money(x.price, cur)}</span></span>
        <span class="fl-ex-meta">📅 ${esc(fmtDate(x.date))} ${esc(weekday(x.date))} · <span class="${x.direct ? 'direct' : 'stop'}">${esc(x.direct ? t('fl_direct') : t('fl_n_stops', { n: x.stops }))}</span> · ${esc(dur(x.durationMin))}</span>
        <span class="fl-ex-meta">✈ ${esc(x.carrierName)}${x.selfTransfer ? ` · <span class="fl-ex-warn">⚠ ${esc(t('fl_ex_self'))}</span>` : ''}</span>
      </button>`).join('');
    const reg = d.regulated.length ? `<div class="fl-ex-reg">ℹ ${esc(t('fl_ex_regulated'))} ${d.regulated.map((x, i) => `<button type="button" class="fl-link" data-exreg="${i}">${esc(x.city)}</button>`).join(' ')}</div>` : '';
    $('#exResults').innerHTML = `<div class="muted fl-ex-count">${esc(t('fl_ex_count', { n: d.total }))}</div>
      ${d.items.length ? `<div class="fl-ex-grid">${cards}</div>` : `<div class="panel empty">${esc(t('fl_ex_empty'))}</div>`}${reg}`;
  }
  function searchRoute(fromAirport, fromCode, toItem, date) {
    $('#from').dataset.code = fromCode; $('#from').value = placeLabel({ ...fromAirport, code: fromCode, isCity: fromCode.includes(',') });
    $('#to').dataset.code = toItem.to; $('#to').value = placeLabel({ city: toItem.city, code: toItem.to, isCity: toItem.to.includes(',') });
    if (date) $('#depart').value = date;
    setTrip('oneway');
    closeExplore();
    run();
    $('#resultsLayout').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#exResults').addEventListener('click', (e) => {
    const d = exState.data; if (!d) return;
    const c = e.target.closest('[data-ex]');
    if (c) return searchRoute(d.fromAirport, d.from, d.items[+c.dataset.ex], d.items[+c.dataset.ex].date);
    const r = e.target.closest('[data-exreg]');
    if (r) searchRoute(d.fromAirport, d.from, d.regulated[+r.dataset.exreg], d.depart || null);
  });

  // ---- Qiyməti izlə ----
  // localStorage-də YALNIZ izləmə id-si, açar (token) və marşrut saxlanılır — e-poçt və ya digər şəxsi məlumat yox.
  const WATCH_KEY = 'flightAlerts';
  const WATCH_MAX = 20;
  const ROUTE_KEYS = ['from', 'to', 'trip', 'depart', 'return', 'adults', 'children', 'infants', 'cabin', 'bagCount', 'currency'];
  const watchList = () => {
    const v = store.get(WATCH_KEY, []);
    return Array.isArray(v) ? v.filter((x) => x && /^fa_[A-Za-z0-9_-]{16}$/.test(x.id) && /^[A-Za-z0-9_-]{43}$/.test(x.token) && x.route) : [];
  };
  const saveWatch = (list) => { store.set(WATCH_KEY, list.slice(0, WATCH_MAX)); updateWatchCount(); };
  function updateWatchCount() {
    const n = watchList().length;
    $('#watchCount').hidden = !n; $('#watchCount').textContent = n;
  }
  updateWatchCount();
  const paxText = (r) => `${t('fl_adults_n', { n: r.adults })}${r.children ? ', ' + t('fl_children_n', { n: r.children }) : ''}${r.infants ? ', ' + t('fl_infants_n', { n: r.infants }) : ''}`;
  const routeDates = (r) => fmtDate(r.depart) + (r.return ? ' – ' + fmtDate(r.return) : '');

  function openWatch() {
    const d = state.data; if (!d || d.regulated) return;
    if (watchList().length >= WATCH_MAX) return toast(t('fl_watch_max'));
    const q = d.query;
    $('#modalBody').innerHTML = `<h3>🔔 ${esc(t('fl_watch_title'))}</h3>
      <div class="fl-sum"><b>${esc(placeLabel(q.fromAirport))} → ${esc(placeLabel(q.toAirport))}</b><br>
        ${esc(routeDates(q))} · ${esc(paxText(q))}${q.bagCount ? ' · 🧳 ' + esc(t('fl_bag_sel', { n: q.bagCount })) : ''}<br>
        ${esc(t('fl_watch_now'))}: <b>${d.stats ? money(d.stats.min, q.currency) : '—'}</b></div>
      <form id="watchForm" novalidate>
        <input name="email" type="email" maxlength="120" autocomplete="email" placeholder="${esc(t('fl_watch_email'))}"><div class="err" data-err="email" hidden></div>
        <fieldset class="fl-radio"><legend>${esc(t('fl_watch_mode'))}</legend>
          <label><input type="radio" name="mode" value="drop10" checked> ${esc(t('fl_watch_drop10'))}</label>
          <label><input type="radio" name="mode" value="daily"> ${esc(t('fl_watch_daily'))}</label>
        </fieldset>${HONEYPOT_HTML}
        <p class="fl-note">${esc(t('fl_watch_honest'))}</p>
        <p class="hint">${esc(t('fl_watch_local'))}</p>
        <div class="err" data-err="general" hidden></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>${esc(t('fl_close'))}</button><button class="btn sm">${esc(t('fl_watch_save'))}</button></div>
        ${consentHtml()}
      </form>`;
    $('#modal').classList.add('open');
    $('#watchForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = ev.target; const btn = form.querySelector('button:not([type])');
      const fd = Object.fromEntries(new FormData(form));
      $$('[data-err]', form).forEach((el) => { el.hidden = true; });
      const route = {}; for (const k of ROUTE_KEYS) route[k] = q[k] == null ? '' : q[k];
      btn.disabled = true;
      try {
        const r = await fetch('/api/flights/alerts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...route, email: fd.email || '', mode: fd.mode, website: fd.website || '' }),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok) {
          if (data.id && data.token) saveWatch([{ id: data.id, token: data.token, route }, ...watchList()]);
          $('#modal').classList.remove('open'); toast(t('fl_watch_ok')); return;
        }
        const fields = data.fields || { general: data.error || t('fl_watch_err') };
        for (const [k, msg] of Object.entries(fields)) {
          const el = $(`[data-err="${k === 'email' ? 'email' : 'general'}"]`, form);
          if (el) { el.textContent = msg; el.hidden = false; }
        }
      } catch { toast(t('fl_watch_err')); } finally { btn.disabled = false; }
    });
  }
  $('#watchBtn').addEventListener('click', openWatch);

  const watchViews = new Map();
  async function fetchWatch(item) {
    const r = await fetch(`/api/flights/alerts/${encodeURIComponent(item.id)}?lang=${encodeURIComponent(LANG)}`, { headers: { 'X-Alert-Token': item.token }, cache: 'no-store' });
    if (r.status === 404) return { gone: true };
    if (!r.ok) throw new Error('err');
    return r.json();
  }
  function watchRow(item, v) {
    if (!v) return `<div class="fl-w-item" data-w="${esc(item.id)}"><div class="muted">${esc(item.route.from)} → ${esc(item.route.to)} · ${esc(routeDates(item.route))}</div><div class="spinner sm"></div></div>`;
    if (v.error) return `<div class="fl-w-item" data-w="${esc(item.id)}"><div class="muted">${esc(item.route.from)} → ${esc(item.route.to)} · ${esc(t('fl_watch_err'))}</div></div>`;
    const cur = v.currency;
    const pct = v.changePct;
    const cls = pct == null || pct === 0 ? 'same' : pct > 0 ? 'up' : 'down';
    const chg = pct == null ? '' : pct === 0 ? `= ${esc(t('fl_watch_same'))}` : `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct)}%`;
    return `<div class="fl-w-item" data-w="${esc(item.id)}">
      <div class="fl-w-main"><b>${esc(placeLabel(v.route.fromAirport))} → ${esc(placeLabel(v.route.toAirport))}</b>
        <div class="muted">${esc(routeDates(v.route))} · ${esc(paxText(v.route))}${v.route.bagCount ? ' · 🧳 ' + esc(v.route.bagCount) : ''}</div>
        <div class="fl-w-prices">${esc(t('fl_watch_initial'))}: ${v.initialPrice != null ? money(v.initialPrice, cur) : '—'} · ${esc(t('fl_watch_current'))}: <b>${v.currentPrice != null ? money(v.currentPrice, cur) : '—'}</b> <span class="fl-chg ${cls}">${chg}</span></div>
        <small class="muted">${esc(t(v.mode === 'daily' ? 'fl_watch_daily' : 'fl_watch_drop10'))} · ${esc(t('fl_watch_pending'))}</small></div>
      <div class="fl-w-btns"><button type="button" class="btn secondary sm" data-wsearch="${esc(item.id)}">${esc(t('fl_watch_search'))}</button><button type="button" class="btn secondary sm" data-wdel="${esc(item.id)}">${esc(t('fl_watch_delete'))}</button></div>
    </div>`;
  }
  function renderWatchList(notes = []) {
    const list = watchList();
    const box = $('#watchItems'); if (!box) return;
    box.innerHTML = notes.map((n) => `<p class="fl-note">${esc(n)}</p>`).join('')
      + (list.length ? list.map((x) => watchRow(x, watchViews.get(x.id))).join('') : `<p class="muted">${esc(t('fl_watch_empty'))}</p>`);
  }
  async function openWatchList() {
    watchViews.clear();
    $('#modalBody').innerHTML = `<h3>🔔 ${esc(t('fl_watch_list'))}</h3>
      <p class="fl-note">${esc(t('fl_watch_honest'))}</p><div id="watchItems"></div><p class="hint">${esc(t('fl_watch_local'))}</p>
      <div style="display:flex;justify-content:flex-end"><button type="button" class="btn secondary sm" data-close>${esc(t('fl_close'))}</button></div>`;
    $('#modal').classList.add('open');
    renderWatchList();
    const notes = [];
    await Promise.all(watchList().map(async (item) => {
      try {
        const v = await fetchWatch(item);
        if (v.gone) { saveWatch(watchList().filter((x) => x.id !== item.id)); notes.push(t('fl_watch_gone')); } else watchViews.set(item.id, v);
      } catch { watchViews.set(item.id, { error: true }); }
    }));
    renderWatchList([...new Set(notes)]);
  }
  $('#watchListBtn').addEventListener('click', openWatchList);
  $('#modalBody').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-wdel]');
    if (del) {
      const item = watchList().find((x) => x.id === del.dataset.wdel); if (!item) return;
      del.disabled = true;
      try {
        const r = await fetch(`/api/flights/alerts/${encodeURIComponent(item.id)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: item.token }) });
        if (r.ok || r.status === 404) { saveWatch(watchList().filter((x) => x.id !== item.id)); watchViews.delete(item.id); toast(t('fl_watch_deleted')); renderWatchList(); } else toast(t('fl_watch_err'));
      } catch { toast(t('fl_watch_err')); } finally { del.disabled = false; }
      return;
    }
    const sr = e.target.closest('[data-wsearch]');
    if (sr) {
      const item = watchList().find((x) => x.id === sr.dataset.wsearch); const v = watchViews.get(sr.dataset.wsearch);
      if (!item || !v || !v.route) return;
      const r = v.route;
      $('#from').dataset.code = r.from; $('#from').value = placeLabel(r.fromAirport);
      $('#to').dataset.code = r.to; $('#to').value = placeLabel(r.toAirport);
      $('#depart').value = r.depart; if (r.return) $('#ret').value = r.return;
      for (const k of ['adults', 'children', 'infants', 'cabin']) $('#' + k).value = String(r[k]);
      $('#bagCount').value = String(r.bagCount || 0);
      setTrip(r.trip === 'round' ? 'round' : 'oneway');
      $('#modal').classList.remove('open');
      run();
    }
  });

  // ---- Dil dəyişəndə ----
  document.addEventListener('langchange', () => {
    fillPax(); fillBags(); renderPopular(); fillExMonths(); updateWatchCount();
    if (state.data) run();
    if (!$('#explore').hidden && exState.data) renderExplore();
  });

  // ---- URL-dən bərpa (paylaşılan link) ----
  const u = new URLSearchParams(location.search);
  if (u.get('from') && u.get('to')) {
    for (const [id, key] of [['depart', 'depart'], ['ret', 'return'], ['adults', 'adults'], ['children', 'children'], ['infants', 'infants'], ['cabin', 'cabin']]) if (u.get(key)) $('#' + id).value = u.get(key);
    $('#direct').checked = u.get('direct') === '1'; $('#bags').checked = u.get('bags') === '1';
    if (['1', '2'].includes(u.get('bagCount'))) $('#bagCount').value = u.get('bagCount');
    $('#protectedF').checked = u.get('protected') === '1';
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
