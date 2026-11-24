// B2C əlavələri (tur/otel modulu): ♥ Seçilmişlər, Müqayisə (2–3 otel), Son baxılanlar, qiymət təqvimi zolağı,
// rəylərin kateqoriya xülasəsi (DEMO), "💬 Kömək lazımdır?" əlaqə paneli, Paylaş.
// Saxlama yalnız brauzerdə (localStorage, try/catch — common.js `store`): otel id + qısa meta, şəxsi məlumat YOXDUR.
// app.js bu modulu window.Odx vasitəsilə istifadə edir (common.js-dən sonra, app.js-dən əvvəl yüklənir).
(function (root) {
  Object.assign(I18N.az, {
    fav_nav: 'Seçilmişlər', fav_add: 'Seçilmişlərə əlavə et', fav_remove: 'Seçilmişlərdən çıxar', fav_added: 'Seçilmişlərə əlavə olundu', fav_removed: 'Seçilmişlərdən çıxarıldı',
    fav_title: '♥ Seçilmişlər', fav_empty: 'Hələ seçilmiş otel yoxdur. Kartda və ya otel pəncərəsində ♡ düyməsinə basın.', fav_open: 'Aç',
    fav_clear: 'Hamısını sil', fav_seen: 'son görülən qiymət', fav_note: 'Siyahı yalnız bu brauzerdə saxlanılır (şəxsi məlumat yoxdur). Qiymət dəyişə bilər — açanda yenidən yoxlanılır.',
    fav_params: '{d} · {n} gecə · {p} nəfər', fav_past: 'tarix keçib — yeni tarixlə açılacaq',
    cmp_add: 'Müqayisə et', cmp_bar: 'Müqayisə et ({n})', cmp_clear: 'Təmizlə', cmp_max: 'Ən çox {n} otel müqayisə etmək olar', cmp_min: 'Müqayisə üçün ən azı 2 otel seçin',
    cmp_title: 'Otellərin müqayisəsi', cmp_remove: 'Çıxar', cmp_stars: 'Ulduz', cmp_rating: 'Reytinq və rəylər', cmp_district: 'Rayon', cmp_loc: 'Dənizə məsafə / xətt',
    cmp_board: 'Qidalanma', cmp_room: 'Otaq', cmp_price: 'Ən ucuz qiymət', cmp_ops: 'Operator', cmp_amen: 'Olanaqlar', cmp_terms: 'Ödəniş / ləğv', cmp_dates: 'Tarix',
    cmp_more: 'Ətraflı', cmp_best: 'ən ucuz', cmp_note: 'Qiymət, reytinq və məsafələr DEMO məlumatdır; seçim anındakı qiymət göstərilir.', cmp_hint: '2–3 otel seçin',
    recent_title: 'Son baxdığınız otellər', recent_clear: 'Siyahını təmizlə',
    cal_title: 'Qiymət təqvimi', cal_sub: '{n} gecə · {p} nəfər · hər gün üçün ən ucuz paket', cal_sub_hotel: '{n} gecə · {p} nəfər · hər gün üçün ən ucuz otel qiyməti',
    cal_span: '±7 gün', cal_month: 'Bütün ay', cal_none: 'yoxdur', cal_cheap: 'Ən ucuz günlər yaşıl.', cal_note: 'Qiymətlər təxminidir (DEMO) və axtarışda yenidən yoxlanılır.',
    cal_pick: '{d} tarixinə axtar', cal_loading: 'Təqvim yüklənir...', cal_prev: 'Əvvəlki günlər', cal_next: 'Sonrakı günlər',
    rv_title: 'Qonaq rəylərinin xülasəsi', rv_clean: 'Təmizlik', rv_food: 'Yemək', rv_service: 'Xidmət', rv_location: 'Yerləşmə', rv_value: 'Qiymət / keyfiyyət',
    rv_likes: 'Qonaqlar bəyənir:', rv_demo_t: 'DEMO: kateqoriya balları nümunədir (real rəy mənbəyi qoşulmayıb). Rəy mətnləri göstərilmir.', rv_based: '{n} rəy əsasında (DEMO)',
    help_btn: 'Kömək lazımdır?', help_title: 'Kömək lazımdır?', help_sub: 'Menecerimiz tur və otel seçimində pulsuz kömək edər.', help_wa: 'WhatsApp ilə yazın', help_call: 'Zəng edin',
    help_cb: 'Sizə zəng edək', help_close: 'Bağla',
    share: 'Paylaş', share_copied: 'Link kopyalandı', share_title_res: 'Odiola — axtarış nəticələri', share_title_hotel: 'Odiola — {h}',
  });
  Object.assign(I18N.en, {
    fav_nav: 'Favourites', fav_add: 'Add to favourites', fav_remove: 'Remove from favourites', fav_added: 'Added to favourites', fav_removed: 'Removed from favourites',
    fav_title: '♥ Favourites', fav_empty: 'No favourite hotels yet. Tap ♡ on a card or in the hotel window.', fav_open: 'Open',
    fav_clear: 'Remove all', fav_seen: 'last seen price', fav_note: 'Stored only in this browser (no personal data). Prices may change — rechecked when opened.',
    fav_params: '{d} · {n} nights · {p} guests', fav_past: 'date has passed — opens with new dates',
    cmp_add: 'Compare', cmp_bar: 'Compare ({n})', cmp_clear: 'Clear', cmp_max: 'You can compare up to {n} hotels', cmp_min: 'Select at least 2 hotels to compare',
    cmp_title: 'Hotel comparison', cmp_remove: 'Remove', cmp_stars: 'Stars', cmp_rating: 'Rating & reviews', cmp_district: 'District', cmp_loc: 'Distance to sea / line',
    cmp_board: 'Board', cmp_room: 'Room', cmp_price: 'Cheapest price', cmp_ops: 'Operator', cmp_amen: 'Amenities', cmp_terms: 'Payment / cancellation', cmp_dates: 'Date',
    cmp_more: 'Details', cmp_best: 'cheapest', cmp_note: 'Prices, ratings and distances are DEMO data; price at the moment of selection is shown.', cmp_hint: 'Select 2–3 hotels',
    recent_title: 'Recently viewed hotels', recent_clear: 'Clear list',
    cal_title: 'Price calendar', cal_sub: '{n} nights · {p} guests · cheapest package per day', cal_sub_hotel: '{n} nights · {p} guests · cheapest hotel price per day',
    cal_span: '±7 days', cal_month: 'Whole month', cal_none: 'none', cal_cheap: 'Cheapest days are green.', cal_note: 'Prices are indicative (DEMO) and rechecked on search.',
    cal_pick: 'Search {d}', cal_loading: 'Loading calendar...', cal_prev: 'Earlier days', cal_next: 'Later days',
    rv_title: 'Guest review summary', rv_clean: 'Cleanliness', rv_food: 'Food', rv_service: 'Service', rv_location: 'Location', rv_value: 'Value for money',
    rv_likes: 'Guests like:', rv_demo_t: 'DEMO: category scores are sample data (no real review source connected). No review texts are shown.', rv_based: 'Based on {n} reviews (DEMO)',
    help_btn: 'Need help?', help_title: 'Need help?', help_sub: 'Our manager will help you choose a tour or hotel for free.', help_wa: 'Write on WhatsApp', help_call: 'Call us',
    help_cb: 'Request a call back', help_close: 'Close',
    share: 'Share', share_copied: 'Link copied', share_title_res: 'Odiola — search results', share_title_hotel: 'Odiola — {h}',
  });
  Object.assign(I18N.ru, {
    fav_nav: 'Избранное', fav_add: 'В избранное', fav_remove: 'Убрать из избранного', fav_added: 'Добавлено в избранное', fav_removed: 'Убрано из избранного',
    fav_title: '♥ Избранное', fav_empty: 'В избранном пока пусто. Нажмите ♡ на карточке или в окне отеля.', fav_open: 'Открыть',
    fav_clear: 'Удалить все', fav_seen: 'последняя цена', fav_note: 'Хранится только в этом браузере (без личных данных). Цена может измениться — проверяется при открытии.',
    fav_params: '{d} · {n} ночей · {p} чел.', fav_past: 'дата прошла — откроется с новыми датами',
    cmp_add: 'Сравнить', cmp_bar: 'Сравнить ({n})', cmp_clear: 'Очистить', cmp_max: 'Можно сравнить не более {n} отелей', cmp_min: 'Выберите минимум 2 отеля',
    cmp_title: 'Сравнение отелей', cmp_remove: 'Убрать', cmp_stars: 'Звёзды', cmp_rating: 'Рейтинг и отзывы', cmp_district: 'Район', cmp_loc: 'До моря / линия',
    cmp_board: 'Питание', cmp_room: 'Номер', cmp_price: 'Самая низкая цена', cmp_ops: 'Оператор', cmp_amen: 'Удобства', cmp_terms: 'Оплата / отмена', cmp_dates: 'Дата',
    cmp_more: 'Подробнее', cmp_best: 'дешевле всех', cmp_note: 'Цены, рейтинг и расстояния — DEMO-данные; показана цена на момент выбора.', cmp_hint: 'Выберите 2–3 отеля',
    recent_title: 'Вы недавно смотрели', recent_clear: 'Очистить список',
    cal_title: 'Календарь цен', cal_sub: '{n} ночей · {p} чел. · самый дешёвый тур на каждый день', cal_sub_hotel: '{n} ночей · {p} чел. · самая низкая цена отеля на каждый день',
    cal_span: '±7 дней', cal_month: 'Весь месяц', cal_none: 'нет', cal_cheap: 'Самые дешёвые дни — зелёные.', cal_note: 'Цены ориентировочные (DEMO) и перепроверяются при поиске.',
    cal_pick: 'Искать на {d}', cal_loading: 'Загрузка календаря...', cal_prev: 'Ранние дни', cal_next: 'Поздние дни',
    rv_title: 'Сводка отзывов гостей', rv_clean: 'Чистота', rv_food: 'Питание', rv_service: 'Сервис', rv_location: 'Расположение', rv_value: 'Цена / качество',
    rv_likes: 'Гостям нравится:', rv_demo_t: 'DEMO: оценки по категориям — пример (реальный источник отзывов не подключён). Тексты отзывов не показываются.', rv_based: 'На основе {n} отзывов (DEMO)',
    help_btn: 'Нужна помощь?', help_title: 'Нужна помощь?', help_sub: 'Менеджер бесплатно поможет выбрать тур или отель.', help_wa: 'Написать в WhatsApp', help_call: 'Позвонить',
    help_cb: 'Перезвоните мне', help_close: 'Закрыть',
    share: 'Поделиться', share_copied: 'Ссылка скопирована', share_title_res: 'Odiola — результаты поиска', share_title_hotel: 'Odiola — {h}',
  });

  const ID_RE = /^[a-z0-9-]{1,40}$/;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const FAV_KEY = 'odiola_favs';
  const RECENT_KEY = 'odiola_recent';
  const FAV_MAX = 30;
  const RECENT_MAX = 8;
  const CMP_MAX = 3;
  const emit = (name) => document.dispatchEvent(new Event(name));
  const str = (v, n = 80) => (typeof v === 'string' ? v.slice(0, n) : '');
  const int = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : null; };

  // Saxlanılan qeydin ciddi təmizlənməsi (localStorage istifadəçi tərəfindən dəyişdirilə bilər)
  function cleanParams(p) {
    const s = p && typeof p === 'object' ? p : {};
    return {
      type: ['package', 'hotel'].includes(s.type) ? s.type : 'hotel',
      checkIn: DATE_RE.test(s.checkIn || '') ? s.checkIn : '',
      checkInTo: DATE_RE.test(s.checkInTo || '') ? s.checkInTo : '',
      nights: int(s.nights, 1, 28) || 7,
      nightsTo: int(s.nightsTo, 1, 28) || int(s.nights, 1, 28) || 7,
      adults: int(s.adults, 1, 8) || 2,
      childAges: (typeof s.childAges === 'string' ? s.childAges : '').split(',').filter((x) => /^\d{1,2}$/.test(x) && Number(x) <= 17).slice(0, 6).join(','),
    };
  }
  function cleanItem(x) {
    if (!x || typeof x !== 'object' || !ID_RE.test(x.id || '')) return null;
    return {
      id: x.id, name: str(x.name, 100), stars: int(x.stars, 0, 5) || 0, destId: ID_RE.test(x.destId || '') ? x.destId : '',
      destName: str(x.destName, 60), country: str(x.country, 60), district: str(x.district, 60),
      price: Number.isFinite(Number(x.price)) && Number(x.price) > 0 ? Math.round(Number(x.price)) : null,
      cur: /^[A-Z]{3}$/.test(x.cur || '') ? x.cur : 'AZN', ts: Number.isFinite(Number(x.ts)) ? Number(x.ts) : 0, p: cleanParams(x.p),
    };
  }
  const readList = (key, max) => { const v = store.get(key, []); return (Array.isArray(v) ? v : []).map(cleanItem).filter(Boolean).slice(0, max); };
  const writeList = (key, list) => store.set(key, list);

  const favs = {
    list: () => readList(FAV_KEY, FAV_MAX),
    has: (id) => favs.list().some((x) => x.id === id),
    toggle(item) {
      const it = cleanItem({ ...item, ts: Date.now() });
      if (!it) return false;
      const list = favs.list();
      const on = !list.some((x) => x.id === it.id);
      writeList(FAV_KEY, on ? [it, ...list].slice(0, FAV_MAX) : list.filter((x) => x.id !== it.id));
      emit('favchange');
      return on;
    },
    // Son görülən qiyməti yenilə (yalnız artıq seçilmiş oteldə)
    touch(item) {
      const it = cleanItem(item);
      if (!it) return;
      const list = favs.list();
      const i = list.findIndex((x) => x.id === it.id);
      if (i < 0) return;
      list[i] = { ...list[i], price: it.price || list[i].price, cur: it.cur, p: it.p };
      writeList(FAV_KEY, list);
    },
    remove(id) { writeList(FAV_KEY, favs.list().filter((x) => x.id !== id)); emit('favchange'); },
    clear() { writeList(FAV_KEY, []); emit('favchange'); },
  };
  const recent = {
    list: () => readList(RECENT_KEY, RECENT_MAX),
    add(item) {
      const it = cleanItem({ ...item, ts: Date.now() });
      if (!it) return;
      writeList(RECENT_KEY, [it, ...recent.list().filter((x) => x.id !== it.id)].slice(0, RECENT_MAX));
      emit('recentchange');
    },
    clear() { writeList(RECENT_KEY, []); emit('recentchange'); },
  };

  // Müqayisə: yalnız səhifə yaddaşında (seçim anındakı qrup xülasəsi), maks. 3 otel
  const cmpItems = [];
  const compare = {
    list: () => cmpItems.slice(),
    has: (id) => cmpItems.some((x) => x.id === id),
    toggle(snap) {
      const i = cmpItems.findIndex((x) => x.id === snap.id);
      if (i >= 0) { cmpItems.splice(i, 1); emit('cmpchange'); return false; }
      if (cmpItems.length >= CMP_MAX) { toast(t('cmp_max', { n: CMP_MAX })); return false; }
      cmpItems.push(snap); emit('cmpchange');
      return true;
    },
    remove(id) { const i = cmpItems.findIndex((x) => x.id === id); if (i >= 0) { cmpItems.splice(i, 1); emit('cmpchange'); } },
    clear() { cmpItems.length = 0; emit('cmpchange'); },
  };

  // Qrupdan (axtarış nəticəsi) müqayisə xülasəsi
  function snapFromGroup(g, cur) {
    const b = g.best || {};
    return {
      id: g.itemId, name: g.name, stars: g.stars, rating: g.rating, ratingWord: g.ratingWord, reviewCount: g.reviewCount, district: g.district,
      destName: g.destination && g.destination.name, country: g.destination && g.destination.country, location: g.location,
      board: b.board, boardLabel: b.boardLabel, boards: [...new Set((g.providers || []).map((o) => o.board).filter(Boolean))],
      room: roomText(b), price: b.price, cur: cur || b.currency, providerName: b.providerName, providerColor: b.providerColor,
      providers: (g.providers || []).length, attrs: g.attrs || [], tags: g.tags || [], prepayment: b.prepayment, freeCancelUntil: b.freeCancelUntil,
      checkIn: b.checkIn, nights: b.nights, includesFlight: g.includesFlight,
    };
  }
  // Seçilmişlər / son baxılanlar üçün qısa meta (otel id + ad + istiqamət + son qiymət + axtarış parametrləri)
  function metaFrom({ id, name, stars, destination, district, price, cur, params }) {
    return { id, name, stars, destId: destination && destination.id, destName: destination && destination.name, country: destination && destination.country, district, price, cur, p: params };
  }
  // Yenidən açmaq üçün link: mövcud ?q=…&hotel=<id> bərpa axını (app.js). Keçmiş tarix → tarixsiz (formanın defoltu).
  function hotelLink(it) {
    const p = it.p || cleanParams({});
    const today = new Date().toISOString().slice(0, 10);
    const past = !p.checkIn || p.checkIn < today;
    const qs = new URLSearchParams();
    qs.set('q', it.destName || it.destId || it.name);
    if (it.destId) qs.set('destinationId', it.destId);
    qs.set('type', p.type);
    if (!past) { qs.set('checkIn', p.checkIn); if (p.checkInTo && p.checkInTo >= p.checkIn) qs.set('checkInTo', p.checkInTo); }
    qs.set('nights', String(p.nights)); qs.set('nightsTo', String(p.nightsTo)); qs.set('adults', String(p.adults));
    if (p.childAges) { qs.set('childAges', p.childAges); qs.set('children', String(p.childAges.split(',').length)); }
    qs.set('hotel', it.id);
    return { href: '/?' + qs.toString(), past };
  }

  // ---- Rəylərin kateqoriya xülasəsi (DEMO, deterministik: otel id + reytinq + məkan əsasında; rəy mətni YOXDUR)
  const RV_CATS = ['clean', 'food', 'service', 'location', 'value'];
  function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function reviewSummary(h) {
    if (!h || h.rating == null || !Number.isFinite(Number(h.rating))) return null;
    const r = Number(h.rating);
    const loc = h.location || {};
    const base = hash(h.id || h.name);
    const cats = RV_CATS.map((key, i) => {
      let d = (((base >>> (i * 5)) % 13) - 6) / 10; // -0.6 … +0.6
      if (key === 'location') {
        const dist = loc.kind === 'beach' ? loc.seaM : loc.kind === 'mountain' ? loc.liftM : loc.centerM;
        if (loc.line === 1 || (dist != null && dist <= 300)) d += 0.4; else if (dist != null && dist > 1500) d -= 0.4;
      }
      if (key === 'value' && h.stars >= 5) d -= 0.2;
      if (key === 'food' && (h.boards || []).some((b) => b === 'UAI' || b === 'AI')) d += 0.2;
      return { key, score: Math.round(Math.min(10, Math.max(5, r + d)) * 10) / 10 };
    });
    const likes = cats.filter((c) => c.score >= 8.5).sort((a, b) => b.score - a.score).slice(0, 3).map((c) => c.key);
    return { cats, likes, reviewCount: h.reviewCount || null, demo: true };
  }
  function reviewSummaryHtml(h) {
    const s = reviewSummary(h);
    if (!s) return '';
    return `<section class="rv-sum" aria-label="${esc(t('rv_title'))}">
      <h4>${esc(t('rv_title'))} <span class="demo-tag" title="${esc(t('rv_demo_t'))}">demo</span></h4>
      ${s.reviewCount ? `<small class="muted">${esc(t('rv_based', { n: fmtInt(s.reviewCount) }))}</small>` : ''}
      <ul class="rv-bars">${s.cats.map((c) => `<li><span class="rv-k">${esc(t('rv_' + c.key))}</span><span class="rv-bar" role="meter" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${c.score}" aria-label="${esc(t('rv_' + c.key))}"><i style="width:${Math.round(c.score * 10)}%"></i></span><b>${esc(c.score.toFixed(1))}</b></li>`).join('')}</ul>
      ${s.likes.length ? `<div class="rv-likes"><span class="muted">${esc(t('rv_likes'))}</span> ${s.likes.map((k) => `<span class="badge good">👍 ${esc(t('rv_' + k))}</span>`).join('')}</div>` : ''}
      <small class="muted">${esc(t('rv_demo_t'))}</small></section>`;
  }

  // ---- Paylaş: navigator.share, yoxdursa linki kopyala
  async function share({ title, url }) {
    const u = safeUrl(url || location.href, location.href);
    if (navigator.share) {
      try { await navigator.share({ title, url: u }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'aborted'; }
    }
    try { await navigator.clipboard.writeText(u); toast(t('share_copied')); return 'copied'; } catch { toast(u); return 'shown'; }
  }

  // ---- Ürək düyməsi HTML-i
  const heartHtml = (id, on, cls = '') => `<button type="button" class="fav-btn ${cls}${on ? ' on' : ''}" data-fav-id="${esc(id)}" aria-pressed="${on ? 'true' : 'false'}" title="${esc(t(on ? 'fav_remove' : 'fav_add'))}" aria-label="${esc(t(on ? 'fav_remove' : 'fav_add'))}">${on ? '♥' : '♡'}</button>`;
  function syncHearts(scope = document) {
    const ids = new Set(favs.list().map((x) => x.id));
    scope.querySelectorAll('[data-fav-id]').forEach((b) => {
      const on = ids.has(b.dataset.favId);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '♥' : '♡';
      b.title = t(on ? 'fav_remove' : 'fav_add');
      b.setAttribute('aria-label', b.title);
    });
  }

  // ---- Qiymət təqvimi zolağı
  const WD = { az: ['B', 'Be', 'Ça', 'Ç', 'Ca', 'C', 'Ş'], en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] };
  function calendarHtml(data, sel) {
    const q = data.query;
    const pax = q.adults + (q.childAges || []).length;
    const cur = q.currency;
    const days = data.days.map((d) => {
      const dt = new Date(d.date + 'T00:00:00Z');
      const wd = (WD[LANG] || WD.az)[dt.getUTCDay()];
      const inSel = sel && d.date >= sel.from && d.date <= sel.to;
      const cls = ['cal-day', d.price == null ? 'none' : 'lv-' + (d.level || 'mid'), d.cheapest ? 'cheapest' : '', inSel ? 'sel' : '', dt.getUTCDay() === 0 || dt.getUTCDay() === 6 ? 'we' : ''].filter(Boolean).join(' ');
      const label = d.price == null ? `${fmtDate(d.date)} — ${t('cal_none')}` : `${t('cal_pick', { d: fmtDate(d.date) })} — ${money(d.price, cur)} (${d.providerName})`;
      return `<button type="button" class="${cls}" data-cal-date="${esc(d.date)}" ${d.price == null ? 'disabled' : ''} title="${esc(label)}" aria-label="${esc(label)}"${inSel ? ' aria-current="date"' : ''}>
        <span class="cd-wd">${esc(wd)}</span><span class="cd-d">${esc(shortDate(d.date))}</span><span class="cd-p">${d.price == null ? '—' : esc(money(d.price, cur))}</span></button>`;
    }).join('');
    return `<div class="cal-head"><div><b>📅 ${esc(t('cal_title'))}</b> <span class="demo-tag" title="${esc(t('cal_note'))}">demo</span>
        <div class="muted cal-sub">${esc(q.destination ? q.destination.name + ' · ' : '')}${esc(t(q.type === 'hotel' ? 'cal_sub_hotel' : 'cal_sub', { n: q.nights, p: pax }))}</div></div>
        <div class="seg cal-seg"><button type="button" data-cal-mode="span" class="${q.mode === 'span' ? 'active' : ''}">${esc(t('cal_span'))}</button><button type="button" data-cal-mode="month" class="${q.mode === 'month' ? 'active' : ''}">${esc(t('cal_month'))}</button></div></div>
      <div class="cal-strip" role="group" aria-label="${esc(t('cal_title'))}">${days}</div>
      <small class="muted cal-foot">${esc(t('cal_cheap'))} ${esc(t('cal_note'))}</small>`;
  }

  // ---- UI montajı: başlıq linki, seçilmişlər paneli, müqayisə zolağı + modal, son baxılanlar, əlaqə paneli
  function mountUi(cfg, hooks) {
    const $ = (s) => document.querySelector(s);
    const xModal = $('#xModal');
    const xBody = $('#xModalBody');
    let xOpener = null;
    // render: xBody-ni dolduran funksiya (renderFavs / renderCompare); fokus bağla düyməsinə keçir
    function openX(render, opener) {
      xOpener = opener || document.activeElement;
      render();
      xModal.classList.add('open');
      document.body.classList.add('no-scroll');
      const c = xBody.querySelector('[data-x-close]'); if (c) c.focus();
    }
    function closeX() {
      if (!xModal.classList.contains('open')) return;
      xModal.classList.remove('open');
      document.body.classList.remove('no-scroll');
      xBody.innerHTML = '';
      xBody.dataset.view = '';
      if (xOpener && xOpener.isConnected && typeof xOpener.focus === 'function') xOpener.focus();
      xOpener = null;
    }
    const xHead = (title) => `<div class="hd-head"><h3 id="xTitle">${esc(title)}</h3><button type="button" class="hd-x" data-x-close aria-label="${esc(t('hd_close'))}">✕</button></div>`;
    xModal.addEventListener('click', (e) => {
      if (e.target === xModal || e.target.closest('[data-x-close]')) { closeX(); return; }
      const rm = e.target.closest('[data-fav-rm]');
      if (rm) { favs.remove(rm.dataset.favRm); return; }
      if (e.target.closest('[data-fav-clear]')) { favs.clear(); return; }
      const cr = e.target.closest('[data-cmp-rm]');
      if (cr) { compare.remove(cr.dataset.cmpRm); if (compare.list().length < 2) closeX(); else renderCompare(); return; }
      const co = e.target.closest('[data-cmp-open]');
      if (co) { const id = co.dataset.cmpOpen; closeX(); if (hooks && hooks.openHotel) hooks.openHotel(id, null); }
    });
    document.addEventListener('keydown', (e) => {
      if (!xModal.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeX(); return; }
      if (e.key !== 'Tab') return;
      const f = [...xBody.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')].filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Seçilmişlər
    const favLink = $('#favLink');
    const syncFavCount = () => { const n = favs.list().length; favLink.querySelector('[data-fav-n]').textContent = String(n); favLink.classList.toggle('has', n > 0); };
    function renderFavs() {
      const list = favs.list();
      xBody.dataset.view = 'favs';
      xBody.innerHTML = `${xHead(t('fav_title'))}
        ${list.length ? `<ul class="fav-list">${list.map((it) => {
          const l = hotelLink(it);
          const pax = it.p.adults + (it.p.childAges ? it.p.childAges.split(',').length : 0);
          const d = it.p.checkIn ? fmtDate(it.p.checkIn) : '—';
          return `<li class="fav-item">
            <span class="fav-thumb" style="background:${gradFor(it.id)}" aria-hidden="true"></span>
            <div class="fav-main"><b>${esc(it.name)}</b> <span class="stars">${starStr(it.stars)}</span>
              <div class="muted fav-sub">${esc(it.destName)}${it.district ? ' · ' + esc(it.district) : ''}${it.country ? ', ' + esc(it.country) : ''}</div>
              <div class="muted fav-sub">${esc(t('fav_params', { d, n: it.p.nights === it.p.nightsTo ? it.p.nights : `${it.p.nights}–${it.p.nightsTo}`, p: pax }))}${l.past ? ` · <i>${esc(t('fav_past'))}</i>` : ''}</div></div>
            <div class="fav-price">${it.price ? `<b>${esc(money(it.price, it.cur))}</b><small class="muted">${esc(t('fav_seen'))}</small>` : ''}
              <span class="fav-acts"><a class="btn sm" href="${esc(safeUrl(l.href))}">${esc(t('fav_open'))}</a><button type="button" class="btn secondary sm" data-fav-rm="${esc(it.id)}" aria-label="${esc(t('fav_remove'))}: ${esc(it.name)}">✕</button></span></div>
          </li>`;
        }).join('')}</ul>` : `<p class="muted">${esc(t('fav_empty'))}</p>`}
        <p class="demo-note">${esc(t('fav_note'))}</p>
        <div class="hd-foot">${list.length ? `<button type="button" class="btn secondary sm" data-fav-clear>${esc(t('fav_clear'))}</button>` : ''}<button type="button" class="btn secondary sm" data-x-close>${esc(t('hd_close'))}</button></div>`;
    }
    favLink.addEventListener('click', () => openX(renderFavs, favLink));
    document.addEventListener('favchange', () => { syncFavCount(); syncHearts(); if (xModal.classList.contains('open') && xBody.dataset.view === 'favs') renderFavs(); });
    syncFavCount();

    // Müqayisə zolağı + cədvəl
    const bar = $('#cmpBar');
    function syncBar() {
      const list = compare.list();
      bar.hidden = !list.length;
      document.body.classList.toggle('has-cmp', list.length > 0);
      bar.innerHTML = `<div class="container cmp-in"><div class="cmp-chips">${list.map((x) => `<span class="cmp-chip"><span class="cmp-name">${esc(x.name)}</span><button type="button" data-cmp-x="${esc(x.id)}" aria-label="${esc(t('cmp_remove'))}: ${esc(x.name)}">✕</button></span>`).join('')}${list.length < 2 ? `<span class="muted cmp-hint">${esc(t('cmp_hint'))}</span>` : ''}</div>
        <div class="cmp-acts"><button type="button" class="btn secondary sm" data-cmp-clear>${esc(t('cmp_clear'))}</button><button type="button" class="btn sm" data-cmp-go ${list.length < 2 ? 'disabled' : ''}>${esc(t('cmp_bar', { n: list.length }))}</button></div></div>`;
      document.querySelectorAll('[data-cmp-id]').forEach((c) => { c.checked = compare.has(c.dataset.cmpId); });
    }
    bar.addEventListener('click', (e) => {
      const x = e.target.closest('[data-cmp-x]'); if (x) { compare.remove(x.dataset.cmpX); return; }
      if (e.target.closest('[data-cmp-clear]')) { compare.clear(); return; }
      const go = e.target.closest('[data-cmp-go]');
      if (go) { if (compare.list().length < 2) { toast(t('cmp_min')); return; } openX(renderCompare, go); }
    });
    function renderCompare() {
      const list = compare.list();
      xBody.dataset.view = 'cmp';
      const minP = Math.min(...list.map((x) => (x.cur === list[0].cur ? x.price : Infinity)));
      const row = (label, fn) => `<tr><th scope="row">${esc(t(label))}</th>${list.map((x) => `<td>${fn(x)}</td>`).join('')}</tr>`;
      const loc = (l) => (!l ? '—' : l.kind === 'beach' ? `🏖 ${esc(distText(l.seaM))}${l.line ? ' · ' + esc(t('line_' + Math.min(3, l.line))) : ''}` : esc(locationText(l)));
      xBody.innerHTML = `${xHead(t('cmp_title'))}
        <div class="cmp-wrap"><table class="cmp-table cols-${list.length}">
          <thead><tr><th scope="col"><span class="sr-only">${esc(t('cmp_title'))}</span></th>${list.map((x) => `<th scope="col"><span class="cmp-thumb" style="background:${gradFor(x.id)}" aria-hidden="true"></span><b>${esc(x.name)}</b><small class="muted">${esc(x.destName || '')}${x.country ? ', ' + esc(x.country) : ''}</small>
            <span class="cmp-th-acts"><button type="button" class="btn secondary sm" data-cmp-open="${esc(x.id)}">${esc(t('cmp_more'))}</button><button type="button" class="btn secondary sm" data-cmp-rm="${esc(x.id)}" aria-label="${esc(t('cmp_remove'))}: ${esc(x.name)}">✕</button></span></th>`).join('')}</tr></thead>
          <tbody>
            ${row('cmp_price', (x) => `<b class="cmp-price${x.price === minP ? ' best' : ''}">${esc(money(x.price, x.cur))}</b>${x.price === minP ? ` <span class="badge good">${esc(t('cmp_best'))}</span>` : ''}`)}
            ${row('cmp_ops', (x) => `<span class="dot" style="background:${esc(x.providerColor || '#999')}"></span> ${esc(x.providerName || '—')}${x.providers > 1 ? ` <small class="muted">(+${x.providers - 1})</small>` : ''}`)}
            ${row('cmp_stars', (x) => `<span class="stars">${starStr(x.stars)}</span>`)}
            ${row('cmp_rating', (x) => (x.rating != null ? esc(ratingText(x)) + ' <span class="demo-tag">demo</span>' : '—'))}
            ${row('cmp_district', (x) => esc(x.district || '—'))}
            ${row('cmp_loc', (x) => loc(x.location))}
            ${row('cmp_board', (x) => `<b>${esc(x.board || '—')}</b>${x.boardLabel ? ` <small class="muted">${esc(x.boardLabel)}</small>` : ''}${x.boards.length > 1 ? `<br><small class="muted">${esc(x.boards.join(', '))}</small>` : ''}`)}
            ${row('cmp_room', (x) => esc(x.room || '—'))}
            ${row('cmp_dates', (x) => (x.checkIn ? `${esc(fmtDate(x.checkIn))} · ${esc(t('nights_n', { n: x.nights }))}${x.includesFlight ? ' · ✈' : ''}` : '—'))}
            ${row('cmp_amen', (x) => `<div class="badges tight">${attrBadges(x.attrs)}${x.tags.slice(0, 6).map((g) => `<span class="badge">${esc(g)}</span>`).join('')}</div>`)}
            ${row('cmp_terms', (x) => `<div class="badges tight">${termBadges(x) || '—'}</div>`)}
          </tbody></table></div>
        <p class="demo-note">${esc(t('cmp_note'))}</p>
        <div class="hd-foot"><button type="button" class="btn secondary sm" data-x-close>${esc(t('hd_close'))}</button></div>`;
    }
    document.addEventListener('cmpchange', () => { syncBar(); if (xModal.classList.contains('open') && xBody.dataset.view === 'cmp') { if (compare.list().length < 2) closeX(); else renderCompare(); } });
    syncBar();

    // Son baxılanlar (ana səhifə)
    function renderRecent() {
      const sec = $('#recentSection');
      if (!sec) return;
      const list = recent.list();
      sec.hidden = !list.length;
      $('#recentTitle').textContent = t('recent_title');
      $('#recentClear').textContent = t('recent_clear');
      $('#recentGrid').innerHTML = list.map((it) => {
        const l = hotelLink(it);
        return `<div class="recent-card"><a class="recent-link" href="${esc(safeUrl(l.href))}">
          <span class="recent-img" style="background:${gradFor(it.id)}"><b>${esc(it.destName)}</b></span>
          <span class="recent-b"><b>${esc(it.name)}</b> <span class="stars">${starStr(it.stars)}</span>
          <small class="muted">${esc(it.district || it.country || '')}</small>
          ${it.price ? `<span class="recent-p">${esc(money(it.price, it.cur))}</span>` : ''}</span></a>${heartHtml(it.id, favs.has(it.id), 'fav-mini')}</div>`;
      }).join('');
    }
    const rc = $('#recentClear'); if (rc) rc.addEventListener('click', () => recent.clear());
    const rg = $('#recentGrid');
    if (rg) {
      rg.addEventListener('click', (e) => {
        const b = e.target.closest('[data-fav-id]'); if (!b) return;
        e.preventDefault();
        const it = recent.list().find((x) => x.id === b.dataset.favId);
        if (it) toast(t(favs.toggle(it) ? 'fav_added' : 'fav_removed'));
      });
    }
    document.addEventListener('recentchange', renderRecent);
    document.addEventListener('favchange', renderRecent);
    renderRecent();

    // Əlaqə paneli
    const sup = (cfg && cfg.support) || {};
    const fab = $('#helpFab');
    const panel = $('#helpPanel');
    function renderHelp() {
      fab.querySelector('[data-help-l]').textContent = t('help_btn');
      const wa = sup.whatsapp && /^[0-9]{7,15}$/.test(sup.whatsapp) ? `https://wa.me/${sup.whatsapp}` : null;
      const tel = sup.phone && /^\+?[0-9]{7,15}$/.test(sup.phone) ? sup.phone : null;
      panel.innerHTML = `<div class="help-head"><b id="helpTitle">💬 ${esc(t('help_title'))}</b><button type="button" class="hd-x" data-help-close aria-label="${esc(t('help_close'))}">✕</button></div>
        <p class="muted help-sub">${esc(t('help_sub'))}</p>
        ${wa || tel ? `<div class="help-links">${wa ? `<a class="btn sm help-wa" href="${esc(safeUrl(wa))}" target="_blank" rel="noopener noreferrer" data-help="wa">🟢 ${esc(t('help_wa'))}</a>` : ''}${tel ? `<a class="btn secondary sm" href="tel:${esc(tel)}" data-help="tel">📞 ${esc(t('help_call'))} ${esc(tel)}</a>` : ''}</div>` : ''}
        <b class="help-cb-t">${esc(t('help_cb'))}</b>${callbackFormHtml('helpCbForm')}`;
      bindCallbackForm(panel.querySelector('#helpCbForm'), () => `Kömək paneli · ${location.pathname}${location.search}`.slice(0, 300));
    }
    const setHelp = (open) => {
      panel.hidden = !open;
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { renderHelp(); const c = panel.querySelector('[data-help-close]'); if (c) c.focus(); }
    };
    fab.addEventListener('click', () => setHelp(panel.hidden));
    panel.addEventListener('click', (e) => { if (e.target.closest('[data-help-close]')) { setHelp(false); fab.focus(); } });
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setHelp(false); fab.focus(); } });
    fab.querySelector('[data-help-l]').textContent = t('help_btn');

    document.addEventListener('langchange', () => {
      syncFavCount(); syncHearts(); syncBar(); renderRecent();
      fab.querySelector('[data-help-l]').textContent = t('help_btn');
      if (!panel.hidden) renderHelp();
      if (xModal.classList.contains('open')) { if (xBody.dataset.view === 'favs') renderFavs(); else if (xBody.dataset.view === 'cmp') renderCompare(); }
    });
    return { closeX, renderRecent };
  }

  root.Odx = { favs, recent, compare, snapFromGroup, metaFrom, hotelLink, reviewSummary, reviewSummaryHtml, share, heartHtml, syncHearts, calendarHtml, mountUi, cleanItem, CMP_MAX };
})(typeof self !== 'undefined' ? self : this);
