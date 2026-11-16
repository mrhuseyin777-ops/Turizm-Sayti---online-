// Ortaq köməkçilər: dil (AZ/EN/RU), API, avtomatik tamamlama, formatlama
const I18N = {
  az: {
    nav_search: 'Turlar və otellər', nav_flights: 'Aviabilet', nav_cars: 'Avtomobil', nav_b2b: 'Agentliklər üçün (B2B)', tab_package: 'Tur paketi (uçuş + otel)', tab_hotel: 'Yalnız otel', tab_tour: 'Ekskursiya turları',
    reg_all: 'Hamısı', reg_intl: 'Xarici', reg_domestic: 'Daxili', f_dest: 'Hara?', f_dest_ph: 'Antalya, Dubay, Qəbələ...', f_date: 'Gediş tarixi', f_nights: 'Gecə', f_pax: 'Böyük / Uşaq',
    f_budget: 'Büdcə (maks.)', f_budget_ph: 'Limitsiz', btn_search: 'Axtar', hero_title: 'Bütün tur operatorları — bir axtarışda',
    hero_sub: 'Summer Tour, Funsun, Kompas və digərlərinin qiymətlərini müqayisə et. Ən ucuzdan bahalıya.',
    step1: 'İstiqamət və tarix seç', step2: 'Büdcəni yaz', step3: 'Ən sərfəli təklifi götür',
    filters: 'Filtrlər', price: 'Qiymət', stars: 'Ulduz', board: 'Qidalanma', operators: 'Operatorlar', early_only: 'Yalnız erkən rezervasiya',
    sort_price: 'Ən ucuz əvvəl', sort_price_desc: 'Ən baha əvvəl', sort_rating: 'Reytinq', sort_stars: 'Ulduz', sort_savings: 'Ən çox qənaət',
    from: 'başlayan', per_total: 'cəmi, {pax} nəfər', save: '{n} qənaət', early: 'Erkən rezervasiya', book: 'Müraciət et', compare_all: 'Bütün operatorlar',
    results: '{n} otel/tur, {o} təklif', no_results: 'Bu parametrlərlə təklif tapılmadı. Büdcəni və ya tarixi dəyişin.', flight_incl: 'Aviabilet daxil',
    nights_n: '{n} gecə', popular: 'Populyar:', demo_note: 'DEMO: qiymətlər nümunədir. Real operator inteqrasiyası qoşulduqdan sonra canlı qiymətlər göstəriləcək.',
    lead_title: 'Müraciət', lead_name: 'Adınız', lead_phone: 'Telefon (WhatsApp)', lead_note: 'Qeyd (istəyə görə)', lead_send: 'Göndər', lead_ok: 'Müraciətiniz qəbul edildi! Tezliklə əlaqə saxlayacağıq.',
    filter_btn: 'Filtrlər', searching: 'Operatorlar sorğulanır...', cheapest_at: 'Ən ucuz: {op}', on_request: 'Sorğu ilə',
    feat1_t: 'Bir axtarış — bütün operatorlar', feat1_d: 'Saytdan sayta keçmədən qiymətləri yan-yana gör.', feat2_t: 'Erkən rezervasiya radarı', feat2_d: 'Endirim açılan kimi hamısında görürsən.',
    feat3_t: 'Büdcəyə görə', feat3_d: 'Büdcəni yaz — uyğun otellər ucuzdan bahalıya düzülür.', feat4_t: 'Agentliklər üçün B2B', feat4_d: 'Menecerlər üçün müqayisə cədvəli, kommersiya təklifi və CSV.',
  },
  en: {
    nav_search: 'Tours & hotels', nav_flights: 'Flights', nav_cars: 'Cars', nav_b2b: 'For agencies (B2B)', tab_package: 'Package (flight + hotel)', tab_hotel: 'Hotel only', tab_tour: 'Guided tours',
    reg_all: 'All', reg_intl: 'International', reg_domestic: 'Domestic', f_dest: 'Where to?', f_dest_ph: 'Antalya, Dubai, Gabala...', f_date: 'Departure', f_nights: 'Nights', f_pax: 'Adults / Kids',
    f_budget: 'Budget (max)', f_budget_ph: 'No limit', btn_search: 'Search', hero_title: 'Every tour operator — one search',
    hero_sub: 'Compare prices from Summer Tour, Funsun, Kompas and more. Cheapest first.',
    step1: 'Pick destination & date', step2: 'Set your budget', step3: 'Grab the best deal',
    filters: 'Filters', price: 'Price', stars: 'Stars', board: 'Board', operators: 'Operators', early_only: 'Early booking only',
    sort_price: 'Cheapest first', sort_price_desc: 'Most expensive first', sort_rating: 'Rating', sort_stars: 'Stars', sort_savings: 'Biggest savings',
    from: 'from', per_total: 'total, {pax} guests', save: 'save {n}', early: 'Early booking', book: 'Request', compare_all: 'All operators',
    results: '{n} hotels/tours, {o} offers', no_results: 'No offers found. Try another budget or date.', flight_incl: 'Flight included',
    nights_n: '{n} nights', popular: 'Popular:', demo_note: 'DEMO: prices are sample data. Live prices appear once operator integrations are connected.',
    lead_title: 'Request', lead_name: 'Your name', lead_phone: 'Phone (WhatsApp)', lead_note: 'Note (optional)', lead_send: 'Send', lead_ok: 'Request received! We will contact you shortly.',
    filter_btn: 'Filters', searching: 'Querying operators...', cheapest_at: 'Cheapest: {op}', on_request: 'On request',
    feat1_t: 'One search — all operators', feat1_d: 'See prices side by side without hopping sites.', feat2_t: 'Early booking radar', feat2_d: 'Spot discounts across all operators instantly.',
    feat3_t: 'Budget first', feat3_d: 'Enter a budget — matching hotels sorted cheapest first.', feat4_t: 'B2B for agencies', feat4_d: 'Comparison grid, client quotes and CSV export for managers.',
  },
  ru: {
    nav_search: 'Туры и отели', nav_flights: 'Авиабилеты', nav_cars: 'Авто', nav_b2b: 'Для агентств (B2B)', tab_package: 'Тур (перелёт + отель)', tab_hotel: 'Только отель', tab_tour: 'Экскурсионные туры',
    reg_all: 'Все', reg_intl: 'Зарубежные', reg_domestic: 'По Азербайджану', f_dest: 'Куда?', f_dest_ph: 'Анталья, Дубай, Габала...', f_date: 'Дата вылета', f_nights: 'Ночей', f_pax: 'Взрослые / Дети',
    f_budget: 'Бюджет (макс.)', f_budget_ph: 'Без лимита', btn_search: 'Найти', hero_title: 'Все туроператоры — в одном поиске',
    hero_sub: 'Сравните цены Summer Tour, Funsun, Kompas и других. Сначала дешёвые.',
    step1: 'Выберите направление и дату', step2: 'Укажите бюджет', step3: 'Берите лучшее предложение',
    filters: 'Фильтры', price: 'Цена', stars: 'Звёзды', board: 'Питание', operators: 'Операторы', early_only: 'Только раннее бронирование',
    sort_price: 'Сначала дешёвые', sort_price_desc: 'Сначала дорогие', sort_rating: 'Рейтинг', sort_stars: 'Звёзды', sort_savings: 'Макс. экономия',
    from: 'от', per_total: 'итого, {pax} чел.', save: 'экономия {n}', early: 'Раннее бронирование', book: 'Оставить заявку', compare_all: 'Все операторы',
    results: '{n} отелей/туров, {o} предложений', no_results: 'Ничего не найдено. Измените бюджет или дату.', flight_incl: 'Перелёт включён',
    nights_n: '{n} ночей', popular: 'Популярные:', demo_note: 'ДЕМО: цены примерные. Реальные цены появятся после подключения операторов.',
    lead_title: 'Заявка', lead_name: 'Ваше имя', lead_phone: 'Телефон (WhatsApp)', lead_note: 'Комментарий', lead_send: 'Отправить', lead_ok: 'Заявка принята! Мы скоро свяжемся с вами.',
    filter_btn: 'Фильтры', searching: 'Опрашиваем операторов...', cheapest_at: 'Дешевле всего: {op}', on_request: 'Под запрос',
    feat1_t: 'Один поиск — все операторы', feat1_d: 'Цены рядом, без переходов по сайтам.', feat2_t: 'Радар раннего бронирования', feat2_d: 'Скидки всех операторов сразу.',
    feat3_t: 'По бюджету', feat3_d: 'Укажите бюджет — отели от дешёвых к дорогим.', feat4_t: 'B2B для агентств', feat4_d: 'Таблица сравнения, КП клиенту и экспорт CSV.',
  },
};

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

let LANG = store.get('lang', 'az');
function t(key, vars = {}) {
  const s = (I18N[LANG] && I18N[LANG][key]) || I18N.az[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
function applyI18n(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}
function setLang(l) { LANG = l; store.set('lang', l); applyI18n(); document.dispatchEvent(new Event('langchange')); }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SYM = { AZN: '₼', USD: '$', EUR: '€', TRY: '₺', RUB: '₽' };
const money = (n, cur) => `${Number(n).toLocaleString('az-AZ').replace(/,/g, ' ')} ${SYM[cur] || cur}`;
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
const starStr = (n) => (n ? '★'.repeat(n) : '');

async function api(path, params) {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString() : '';
  const r = await fetch(path + qs);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Xəta');
  return data;
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(el._t); el._t = setTimeout(() => { el.style.display = 'none'; }, 2600);
}

// İstiqamət üçün avtomatik tamamlama
function autocomplete(input, onPick) {
  const wrap = input.parentElement; wrap.classList.add('ac');
  const list = document.createElement('div'); list.className = 'ac-list'; list.hidden = true; wrap.appendChild(list);
  let items = []; let hl = -1; let timer;
  const render = () => {
    list.innerHTML = items.map((d, i) => `<div data-i="${i}" class="${i === hl ? 'hl' : ''}"><span>${esc(d.name)}</span><small>${esc(d.country)}</small></div>`).join('');
    list.hidden = !items.length;
  };
  const pick = (d) => { input.value = d.name; input.dataset.id = d.id; list.hidden = true; onPick && onPick(d); };
  input.addEventListener('input', () => {
    delete input.dataset.id;
    clearTimeout(timer);
    timer = setTimeout(async () => { items = await api('/api/suggest', { q: input.value }); hl = -1; if (document.activeElement === input) render(); }, 120);
  });
  input.addEventListener('focus', async () => { if (!input.value) { items = await api('/api/suggest', { q: '' }); render(); } });
  input.addEventListener('keydown', (e) => {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { hl = Math.min(items.length - 1, hl + 1); render(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { hl = Math.max(0, hl - 1); render(); e.preventDefault(); }
    if (e.key === 'Enter' && hl >= 0) { pick(items[hl]); e.preventDefault(); }
    if (e.key === 'Escape') list.hidden = true;
  });
  list.addEventListener('mousedown', (e) => { const el = e.target.closest('[data-i]'); if (el) pick(items[+el.dataset.i]); });
  input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
  if (input.form) input.form.addEventListener('submit', () => { clearTimeout(timer); list.hidden = true; items = []; });
}

function defaultDate(daysAhead = 30) {
  const d = new Date(); d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

// Otel kartı üçün istiqamətə görə rəng (şəkil yerinə; real versiyada operator şəkilləri)
const GRADIENTS = ['#0e7c86,#38bdf8', '#f97316,#facc15', '#1e3a8a,#0ea5e9', '#15803d,#84cc16', '#9333ea,#f472b6', '#0f766e,#22d3ee', '#b45309,#f59e0b'];
const gradFor = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `linear-gradient(135deg, ${GRADIENTS[h % GRADIENTS.length]})`; };

document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('lang');
  if (sel) { sel.value = LANG; sel.addEventListener('change', () => setLang(sel.value)); }
  applyI18n();
});

// ---- P1 funksiyaları (istiqamətsiz axtarış, şərtlər, taksit, etibar, geri zəng, B2B seçim linki) ----
Object.assign(I18N.az, {
  explore_btn: 'Hara gedə bilərəm?', explore_hint: 'İstiqamət yazmasanız, büdcə və tarixə uyğun bütün istiqamətlər ucuzdan bahalıya göstərilir.',
  explore_title: 'Hara gedə bilərəm? · {date} ±{flex} · {n} gecə', explore_sub: '{n} istiqamət · {budget}', budget_upto: 'büdcə: {b}-dək', budget_none: 'büdcə limitsiz',
  dest_meta: '{h} otel/tur · {p} operator', dest_go: 'Variantlara bax', from_price: 'başlayan',
  lastmin_title: 'Son dəqiqə turları', lastmin_sub: 'Yaxın {n} gündə çıxış — istiqamətlər üzrə ən ucuz', lastmin_btn: '🔥 Son dəqiqə', lastmin_badge: 'Son dəqiqə', lastmin_all: 'Hamısı',
  f_lastmin: 'Son dəqiqə ({n} gün)', f_terms: 'Ödəniş və ləğv', f_prepay_none: 'İlkin ödənişsiz', f_prepay_50: 'İlkin ödəniş ≤ 50%', f_free_cancel: 'Pulsuz ləğv',
  pay_monthly: '≈ {m}/ay × {n}', pay_upfront: 'və ya indi {pct}% ödə: {v}', pay_demo: 'demo', pay_demo_t: 'Taksit nümunədir: bank inteqrasiyası planlaşdırılır, faiz {i}%.',
  prepay_none: 'İlkin ödənişsiz', prepay_50: '50% ilkin ödəniş', prepay_full: 'Tam ilkin ödəniş', free_cancel: 'Pulsuz ləğv {d}-ə qədər',
  checked_now: 'indicə yoxlanılıb', checked_min: '{n} dəq əvvəl yoxlanılıb', checked_h: '{n} saat əvvəl yoxlanılıb', refresh: '↻ Yenilə',
  trust_title: 'Operator haqqında', trust_license: 'Lisenziya', trust_members: 'Üzvlük', trust_since: 'Fəaliyyət ili', trust_unverified: 'təsdiqlənməyib',
  trust_claim: 'operatorun öz məlumatına görə', trust_note: 'TurTap bu məlumatları hələ rəsmi sənədlə yoxlamayıb (DEMO). Ödəniş birbaşa operatora edilir.', trust_hint: 'Operator haqqında məlumat üçün klikləyin',
  child_ages: 'Uşaqların yaşı:', child_n: '{n}-ci uşaq', age_y: '{n} yaş', age_infant: '0–1 yaş',
  cb_title: 'Sizə zəng edək', cb_sub: 'Uyğun variant tapmadınız və ya sualınız var? Menecer qiyməti sizin üçün dəqiqləşdirsin.', cb_time: 'Nə vaxt?', cb_now: 'İndi',
  cb_morning: 'Səhər', cb_afternoon: 'Günorta', cb_evening: 'Axşam', cb_send: 'Zəng sifariş et', cb_ok: 'Sorğunuz qəbul edildi — menecer sizə zəng edəcək.',
  paym_title: 'Ödəniş üsulları:', paym_card: '💳 Bank kartı', paym_inst: '🗓 Taksit kartları', paym_cash: '💵 Nağd — operatorun ofisində', paym_planned: 'planlaşdırılır · demo',
  paym_direct: 'TurTap ödəniş qəbul etmir: rezervasiya və ödəniş birbaşa seçdiyiniz tur operatoruna gedir. Biz qiymətləri müqayisə edir və müraciətinizi ötürürük.',
  s_title: 'Sizin üçün seçilmiş variantlar', s_by: '{agency} tərəfindən hazırlanıb', s_want: 'Bu variantı istəyirəm', s_ok: 'Müraciətiniz {agency} agentliyinə göndərildi. Tezliklə əlaqə saxlanılacaq.',
  s_notfound: 'Link tapılmadı və ya müddəti bitib.', s_price_note: 'Qiymətlər cəmidir ({pax} nəfər) və yerlərin mövcudluğundan asılı olaraq dəyişə bilər.', s_made: 'TurTap ilə hazırlanıb', s_contact: 'Əlaqə',
  b2b_share: '🔗 Seçim linki', b2b_share_title: 'Müştəri üçün seçim linki', b2b_share_note: 'Linkdə agentliyinizin adı görünür; operator adları və net qiymət gizlidir — yalnız müştəri qiyməti (komissiya daxil).',
  b2b_copy: 'Kopyala', b2b_open: 'Aç', b2b_leads: 'Müraciətlər', b2b_leads_empty: 'Hələ müraciət yoxdur. Seçim linkini müştəriyə göndərin.', b2b_reload: 'Yenilə',
  b2b_leads_demo: 'DEMO: müraciətlər agentlik adına görə göstərilir; real giriş (autentifikasiya) sonra əlavə olunacaq.', b2b_terms: 'Şərtlər', b2b_msg: 'Müştəriyə qeyd (istəyə görə)', b2b_create: 'Link yarat', b2b_need_select: 'Seçilməyibsə, ən ucuz 3 variant götürülür.',
});
Object.assign(I18N.en, {
  explore_btn: 'Where can I go?', explore_hint: 'Leave the destination empty to see every destination that fits your budget and dates, cheapest first.',
  explore_title: 'Where can I go? · {date} ±{flex} · {n} nights', explore_sub: '{n} destinations · {budget}', budget_upto: 'budget up to {b}', budget_none: 'no budget limit',
  dest_meta: '{h} hotels/tours · {p} operators', dest_go: 'See options', from_price: 'from',
  lastmin_title: 'Last-minute deals', lastmin_sub: 'Departures within {n} days — cheapest per destination', lastmin_btn: '🔥 Last minute', lastmin_badge: 'Last minute', lastmin_all: 'Show all',
  f_lastmin: 'Last minute ({n} days)', f_terms: 'Payment & cancellation', f_prepay_none: 'No prepayment', f_prepay_50: 'Prepayment ≤ 50%', f_free_cancel: 'Free cancellation',
  pay_monthly: '≈ {m}/mo × {n}', pay_upfront: 'or pay {pct}% now: {v}', pay_demo: 'demo', pay_demo_t: 'Instalments are illustrative: bank integration is planned, interest {i}%.',
  prepay_none: 'No prepayment', prepay_50: '50% prepayment', prepay_full: 'Full prepayment', free_cancel: 'Free cancellation until {d}',
  checked_now: 'checked just now', checked_min: 'checked {n} min ago', checked_h: 'checked {n} h ago', refresh: '↻ Refresh',
  trust_title: 'About the operator', trust_license: 'Licence', trust_members: 'Memberships', trust_since: 'Operating since', trust_unverified: 'not verified',
  trust_claim: 'according to the operator', trust_note: 'TurTap has not yet verified this with official documents (DEMO). You pay the operator directly.', trust_hint: 'Click for operator details',
  child_ages: 'Children ages:', child_n: 'Child {n}', age_y: '{n} y', age_infant: '0–1 y',
  cb_title: 'Request a call back', cb_sub: 'Did not find a match or have a question? A manager will check the price for you.', cb_time: 'When?', cb_now: 'Now',
  cb_morning: 'Morning', cb_afternoon: 'Afternoon', cb_evening: 'Evening', cb_send: 'Call me back', cb_ok: 'Request received — a manager will call you.',
  paym_title: 'Payment methods:', paym_card: '💳 Bank card', paym_inst: '🗓 Instalment cards', paym_cash: '💵 Cash at the operator office', paym_planned: 'planned · demo',
  paym_direct: 'TurTap does not take payments: booking and payment go directly to the tour operator you choose. We compare prices and pass on your request.',
  s_title: 'Options selected for you', s_by: 'Prepared by {agency}', s_want: 'I want this option', s_ok: 'Your request was sent to {agency}. They will contact you shortly.',
  s_notfound: 'Link not found or expired.', s_price_note: 'Prices are totals ({pax} guests) and may change depending on availability.', s_made: 'Made with TurTap', s_contact: 'Contact',
  b2b_share: '🔗 Selection link', b2b_share_title: 'Selection link for the client', b2b_share_note: 'The link shows your agency name; operator names and net prices are hidden — only the client price (incl. commission).',
  b2b_copy: 'Copy', b2b_open: 'Open', b2b_leads: 'Requests', b2b_leads_empty: 'No requests yet. Send the selection link to your client.', b2b_reload: 'Reload',
  b2b_leads_demo: 'DEMO: requests are filtered by agency name; real authentication comes later.', b2b_terms: 'Terms', b2b_msg: 'Note to the client (optional)', b2b_create: 'Create link', b2b_need_select: 'If nothing is selected, the 3 cheapest options are used.',
});
Object.assign(I18N.ru, {
  explore_btn: 'Куда можно поехать?', explore_hint: 'Оставьте направление пустым — покажем все направления под ваш бюджет и даты, от дешёвых к дорогим.',
  explore_title: 'Куда поехать? · {date} ±{flex} · {n} ночей', explore_sub: '{n} направлений · {budget}', budget_upto: 'бюджет до {b}', budget_none: 'без лимита бюджета',
  dest_meta: '{h} отелей/туров · {p} операторов', dest_go: 'Смотреть варианты', from_price: 'от',
  lastmin_title: 'Горящие туры', lastmin_sub: 'Вылет в ближайшие {n} дней — самые дешёвые по направлениям', lastmin_btn: '🔥 Горящие', lastmin_badge: 'Горящий', lastmin_all: 'Все',
  f_lastmin: 'Горящие ({n} дней)', f_terms: 'Оплата и отмена', f_prepay_none: 'Без предоплаты', f_prepay_50: 'Предоплата ≤ 50%', f_free_cancel: 'Бесплатная отмена',
  pay_monthly: '≈ {m}/мес × {n}', pay_upfront: 'или {pct}% сейчас: {v}', pay_demo: 'демо', pay_demo_t: 'Рассрочка для примера: интеграция с банками планируется, ставка {i}%.',
  prepay_none: 'Без предоплаты', prepay_50: 'Предоплата 50%', prepay_full: 'Полная предоплата', free_cancel: 'Бесплатная отмена до {d}',
  checked_now: 'проверено только что', checked_min: 'проверено {n} мин назад', checked_h: 'проверено {n} ч назад', refresh: '↻ Обновить',
  trust_title: 'Об операторе', trust_license: 'Лицензия', trust_members: 'Членство', trust_since: 'Работает с', trust_unverified: 'не подтверждено',
  trust_claim: 'по данным самого оператора', trust_note: 'TurTap ещё не проверил эти данные по официальным документам (ДЕМО). Оплата идёт напрямую оператору.', trust_hint: 'Нажмите, чтобы узнать об операторе',
  child_ages: 'Возраст детей:', child_n: 'Ребёнок {n}', age_y: '{n} лет', age_infant: '0–1 год',
  cb_title: 'Перезвоним вам', cb_sub: 'Не нашли подходящий вариант или есть вопрос? Менеджер уточнит цену для вас.', cb_time: 'Когда?', cb_now: 'Сейчас',
  cb_morning: 'Утром', cb_afternoon: 'Днём', cb_evening: 'Вечером', cb_send: 'Заказать звонок', cb_ok: 'Заявка принята — менеджер вам перезвонит.',
  paym_title: 'Способы оплаты:', paym_card: '💳 Банковская карта', paym_inst: '🗓 Карты рассрочки', paym_cash: '💵 Наличными в офисе оператора', paym_planned: 'планируется · демо',
  paym_direct: 'TurTap не принимает платежи: бронирование и оплата идут напрямую выбранному туроператору. Мы сравниваем цены и передаём вашу заявку.',
  s_title: 'Варианты, подобранные для вас', s_by: 'Подготовлено: {agency}', s_want: 'Хочу этот вариант', s_ok: 'Заявка отправлена в {agency}. С вами скоро свяжутся.',
  s_notfound: 'Ссылка не найдена или устарела.', s_price_note: 'Цены итоговые ({pax} чел.) и могут меняться в зависимости от наличия мест.', s_made: 'Сделано в TurTap', s_contact: 'Контакт',
  b2b_share: '🔗 Ссылка-подборка', b2b_share_title: 'Ссылка-подборка для клиента', b2b_share_note: 'В ссылке видно название вашего агентства; операторы и нетто-цены скрыты — только цена для клиента (с комиссией).',
  b2b_copy: 'Копировать', b2b_open: 'Открыть', b2b_leads: 'Заявки', b2b_leads_empty: 'Заявок пока нет. Отправьте ссылку клиенту.', b2b_reload: 'Обновить',
  b2b_leads_demo: 'ДЕМО: заявки фильтруются по названию агентства; настоящая авторизация будет позже.', b2b_terms: 'Условия', b2b_msg: 'Комментарий для клиента', b2b_create: 'Создать ссылку', b2b_need_select: 'Если ничего не выбрано, берутся 3 самых дешёвых варианта.',
});

async function postJson(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Xəta');
  return data;
}

// "X dəq əvvəl yoxlanılıb" — server vaxtına nisbətən (istifadəçinin saat fərqindən asılı olmasın)
function checkedAgo(checkedAt, serverTime) {
  if (!checkedAt) return '';
  const min = Math.max(0, Math.floor((Date.parse(serverTime || new Date().toISOString()) - Date.parse(checkedAt)) / 60000));
  if (min < 1) return t('checked_now');
  if (min < 60) return t('checked_min', { n: min });
  return t('checked_h', { n: Math.floor(min / 60) });
}

const shortDate = (iso) => fmtDate(iso).slice(0, 5);

// Ödəniş/ləğv şərtləri nişanları
function termBadges(o) {
  const out = [];
  if (o.prepayment === 'none') out.push(`<span class="badge good">${esc(t('prepay_none'))}</span>`);
  else if (o.prepayment === '50') out.push(`<span class="badge">${esc(t('prepay_50'))}</span>`);
  else if (o.prepayment === 'full') out.push(`<span class="badge">${esc(t('prepay_full'))}</span>`);
  if (o.freeCancelUntil) out.push(`<span class="badge good">${esc(t('free_cancel', { d: shortDate(o.freeCancelUntil) }))}</span>`);
  return out.join('');
}

// Kartda aylıq ödəniş (taksit vitrini — DEMO)
function planHtml(plan, cur) {
  if (!plan || !plan.months || !plan.months.length) return '';
  const months = plan.months.map((m) => t('pay_monthly', { m: money(m.monthly, cur), n: m.n })).join(' · ');
  return `<div class="plan" title="${esc(t('pay_demo_t', { i: plan.interestPct }))}"><b>${esc(months)}</b><span class="demo-tag">${esc(t('pay_demo'))}</span><br>${esc(t('pay_upfront', { pct: plan.upfrontPct, v: money(plan.upfront, cur) }))}</div>`;
}

// Operator etibar paneli. Bilinməyən sahə → "təsdiqlənməyib"; operatorun öz iddiası ayrıca qeyd olunur.
function trustPanelHtml(p) {
  const tr = (p && p.trust) || {};
  const unv = `<span class="unv">${esc(t('trust_unverified'))}</span>`;
  const members = (tr.memberships || []).length
    ? tr.memberships.map((m) => `${esc(m.name)}${m.claim === 'verified' ? ' ✓' : ` <small class="muted">(${esc(t('trust_claim'))}${m.source ? ': ' + esc(m.source) : ''})</small>`}`).join(', ')
    : unv;
  return `<div class="trust-panel" role="region" aria-label="${esc(t('trust_title'))}">
    <b><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${esc(p.color)}"></span> ${esc(p.name)} — ${esc(t('trust_title'))}</b>
    <dl><dt>${esc(t('trust_license'))}</dt><dd>${tr.licenseNo ? esc(tr.licenseNo) : unv}</dd>
    <dt>${esc(t('trust_members'))}</dt><dd>${members}</dd>
    <dt>${esc(t('trust_since'))}</dt><dd>${tr.since ? esc(tr.since) : unv}</dd></dl>
    <small class="muted">${esc(t('trust_note'))}</small></div>`;
}

// Uşaq yaşı seçimləri (0–17). prev = əvvəlki dəyərlər saxlanılır.
function renderChildAges(container, count, prev = []) {
  const n = Math.max(0, Math.min(6, parseInt(count, 10) || 0));
  const opts = (sel) => Array.from({ length: 18 }, (_, a) => `<option value="${a}" ${a === sel ? 'selected' : ''}>${a === 0 ? esc(t('age_infant')) : esc(t('age_y', { n: a }))}</option>`).join('');
  container.hidden = n === 0;
  container.innerHTML = n ? `<span class="muted">${esc(t('child_ages'))}</span>` + Array.from({ length: n }, (_, i) => {
    const v = Number.isInteger(prev[i]) ? prev[i] : 7;
    return `<label>${esc(t('child_n', { n: i + 1 }))} <select data-child-age="${i}" aria-label="${esc(t('child_n', { n: i + 1 }))}">${opts(v)}</select></label>`;
  }).join('') : '';
}
const readChildAges = (container) => [...container.querySelectorAll('[data-child-age]')].map((s) => Number(s.value));

// Ödəniş üsulları zolağı (footer): hələ heç biri real deyil — "planlaşdırılır/demo"
function paymentStripHtml() {
  return `<div class="pay-strip"><b>${esc(t('paym_title'))}</b>
    <span class="pm">${esc(t('paym_card'))}</span><span class="pm">${esc(t('paym_inst'))}</span><span class="pm">${esc(t('paym_cash'))}</span>
    <span class="badge">${esc(t('paym_planned'))}</span>
    <span class="note">${esc(t('paym_direct'))}</span></div>`;
}

// "Sizə zəng edək" forması (mövcud /api/leads, type:'callback')
function callbackFormHtml(id) {
  return `<form class="callback" id="${esc(id)}">
    <input name="name" required maxlength="80" placeholder="${esc(t('lead_name'))}" aria-label="${esc(t('lead_name'))}">
    <input name="phone" required maxlength="30" inputmode="tel" placeholder="${esc(t('lead_phone'))}" aria-label="${esc(t('lead_phone'))}">
    <select name="preferredTime" aria-label="${esc(t('cb_time'))}">${['now', 'morning', 'afternoon', 'evening'].map((k) => `<option value="${k}">${esc(t('cb_' + k))}</option>`).join('')}</select>
    <button class="btn sm primary">${esc(t('cb_send'))}</button></form>`;
}
function bindCallbackForm(form, contextFn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    const btn = form.querySelector('button'); btn.disabled = true;
    try {
      await postJson('/api/leads', { ...fd, type: 'callback', context: contextFn ? contextFn() : '' });
      form.reset(); toast(t('cb_ok'));
    } catch (err) { toast(err.message); } finally { btn.disabled = false; }
  });
}
