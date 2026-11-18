// Ortaq köməkçilər: dil (AZ/EN/RU), API, avtomatik tamamlama, formatlama
const I18N = {
  az: {
    op_link_short: 'saytda',
    rank_title: 'Operatorlar ucuzdan bahalıya', rank_cheapest: 'ən ucuz',
    op_link: '{op} saytında yoxla', op_link_hint: 'Operatorun öz axtarış səhifəsi eyni tarix və nəfərlə açılır. Qiymət orada fərqli ola bilər.',
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
    op_link_short: 'on site',
    rank_title: 'Operators, cheapest first', rank_cheapest: 'cheapest',
    op_link: 'Check on {op}', op_link_hint: 'Opens the operator’s own search page with the same dates and guests. The price there may differ.',
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
    op_link_short: 'на сайте',
    rank_title: 'Операторы от дешёвых к дорогим', rank_cheapest: 'дешевле всех',
    op_link: 'Проверить на сайте {op}', op_link_hint: 'Откроется поиск оператора с теми же датами и туристами. Цена там может отличаться.',
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
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', el.title); });
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
  explore_title: 'Hara gedə bilərəm? · {date} · {n} gecə', explore_sub: '{n} istiqamət · {budget}', budget_upto: 'büdcə: {b}-dək', budget_none: 'büdcə limitsiz',
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
  b2b_leads_demo: 'Yalnız agentliyinizin seçim linklərindən gələn müraciətlər göstərilir.', b2b_terms: 'Şərtlər', b2b_msg: 'Müştəriyə qeyd (istəyə görə)', b2b_create: 'Link yarat', b2b_need_select: 'Seçilməyibsə, ən ucuz 3 variant götürülür.',
});
Object.assign(I18N.en, {
  explore_btn: 'Where can I go?', explore_hint: 'Leave the destination empty to see every destination that fits your budget and dates, cheapest first.',
  explore_title: 'Where can I go? · {date} · {n} nights', explore_sub: '{n} destinations · {budget}', budget_upto: 'budget up to {b}', budget_none: 'no budget limit',
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
  b2b_leads_demo: 'Only requests from your agency’s selection links are shown.', b2b_terms: 'Terms', b2b_msg: 'Note to the client (optional)', b2b_create: 'Create link', b2b_need_select: 'If nothing is selected, the 3 cheapest options are used.',
});
Object.assign(I18N.ru, {
  explore_btn: 'Куда можно поехать?', explore_hint: 'Оставьте направление пустым — покажем все направления под ваш бюджет и даты, от дешёвых к дорогим.',
  explore_title: 'Куда поехать? · {date} · {n} ночей', explore_sub: '{n} направлений · {budget}', budget_upto: 'бюджет до {b}', budget_none: 'без лимита бюджета',
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
  b2b_leads_demo: 'Показаны только заявки по ссылкам вашего агентства.', b2b_terms: 'Условия', b2b_msg: 'Комментарий для клиента', b2b_create: 'Создать ссылку', b2b_need_select: 'Если ничего не выбрано, берутся 3 самых дешёвых варианта.',
});

// B2B sessiyası: httpOnly cookie-dədir (JS onu oxuya bilmir). Sessiya vəziyyəti və CSRF token
// serverdən (/api/b2b/me) alınır; localStorage-də heç bir giriş məlumatı saxlanılmır.
let B2B_CSRF = null;
async function b2bMe() {
  try {
    const r = await fetch('/api/b2b/me', { credentials: 'same-origin', cache: 'no-store' });
    const d = await r.json();
    B2B_CSRF = d && d.authenticated ? d.csrfToken : null;
    return d && d.authenticated ? d : null;
  } catch { B2B_CSRF = null; return null; }
}
function setCsrf(token) { B2B_CSRF = token || null; }

async function postJson(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (B2B_CSRF) headers['X-CSRF-Token'] = B2B_CSRF;
  const r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Xəta'); e.status = r.status; throw e; }
  return data;
}

// Yalnız http(s) linklərinə icazə (javascript:, data: və s. URL-lər bloklanır)
function safeUrl(u, fallback = '#') {
  try { const x = new URL(String(u), location.origin); return ['http:', 'https:'].includes(x.protocol) ? x.href : fallback; } catch { return fallback; }
}

// Gizli honeypot sahəsi (bot qoruması): insan görmür, bot doldurursa server müraciəti atır
const HONEYPOT_HTML = '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">';

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
    ${HONEYPOT_HTML}<button class="btn sm primary">${esc(t('cb_send'))}</button></form>`;
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

// ---- Genişləndirilmiş axtarış (operator saytları səviyyəsində): tarix/gecə aralığı, rayonlar, otel seçimi,
// otel atributları, otaq/yerləşmə, qiymət növü, uçuş/yer statusu, cədvəl görünüşü, boş nəticə diaqnostikası ----
Object.assign(I18N.az, {
  f_date_range: 'Gediş -dan / -dək', f_date_from: 'Gediş -dan', f_date_to: 'Gediş -dək', f_nights_range: 'Gecə -dan / -dək', f_nights_from: 'Gecə -dan', f_nights_to: 'Gecə -dək',
  dq_title: 'Tarix:', dq_exact: 'Dəqiq tarix', dq_pm3: '±3 gün', dq_7: '+7 gün', dq_14: '+14 gün',
  range_combo: 'Tarix × gecə kombinasiyası maksimum {n} ola bilər — aralıq daraldıldı.',
  f_district: 'Kurort / rayon', f_hotel: 'Otel', ms_all: 'Hamısı', ms_search: 'Ada görə axtar...', ms_only_sel: 'Yalnız seçilmişlər', ms_n: '{n} seçilib',
  ms_empty: 'Siyahı axtarışdan sonra dolur', ms_none: 'Uyğun nəticə yoxdur',
  attr_title: 'Otel xüsusiyyətləri', attr_chdFree: 'CHD FREE (uşaq pulsuz)', attr_adultsOnly: 'Yalnız böyüklər üçün', attr_recommended: 'Tövsiyə edirik', attr_family: 'Ailəvi',
  attr_b_chdFree: 'CHD FREE', attr_b_adultsOnly: 'Adults only', attr_b_recommended: '👍 Tövsiyə edirik', attr_b_family: 'Ailəvi',
  avail_title: 'Yer və satış', f_seats: 'Reyslərdə yer var', f_no_stop: 'Satış dayandırılmayıb', f_instant: 'Ani təsdiq',
  view_cards: 'Kartlar', view_table: 'Cədvəl', group_by: 'Qruplaşdır (otel üzrə ən ucuz)',
  col_date: 'Tarix / uçuş', col_tour: 'Tur', col_nights: 'Gecə', col_hotel: 'Otel (rayon)', col_seats: 'Yer', col_board: 'Qida', col_room: 'Otaq / yerləşmə',
  col_price: 'Qiymət', col_ptype: 'Qiymət növü', col_op: 'Operator', col_opprice: 'Operator qiyməti',
  pt_EB: 'Erkən rezervasiya {y}', pt_SPO: 'SPO (xüsusi təklif)', pt_STD: 'Standart',
  seat_many: 'çox', seat_few: 'az', seat_none: 'yoxdur', seat_request: 'sorğu ilə', seats_hotel: 'Otel', seats_out: 'Gediş reysi', seats_back: 'Dönüş reysi',
  cls_econom: 'Ekonom', cls_business: 'Biznes', stop_sale: 'Stop-sale', flight_at: 'Uçuş {t}',
  rate_line: 'Operator məzənnəsi {d}: {pair} {v}', rate_demo: 'DEMO məzənnə; CBAR / operator gündəlik məzənnəsi ilə inteqrasiya planlaşdırılır.',
  table_more: 'Cədvəldə ilk {n} təklif göstərilir. Filtrlərlə daraldın.',
  empty_no_tours: 'Bu istiqamət üçün ekskursiya turu yoxdur', empty_no_tours_sub: 'Tur paketinə və ya yalnız otelə baxa bilərsiniz.',
  empty_no_departures: 'Seçilmiş tarixlərdə ekskursiya turunun çıxışı yoxdur', empty_no_departures_sub: 'Tarix aralığını genişləndirin və ya başqa istiqamət seçin.',
  empty_no_pkg: 'Daxili istiqamətlər üçün aviabiletli tur paketi yoxdur', empty_no_pkg_sub: 'Yalnız otel axtarışına keçin.',
  btn_see_package: 'Tur paketinə bax', btn_see_hotel: 'Yalnız otelə bax', tours_avail: 'Ekskursiya turu olan istiqamətlər:',
  empty_filters: 'Filtrlər {n} təklifin hamısını gizlətdi. Bunu sınayın:', relax_maxPrice: 'Büdcəni {v}-ə qaldırsanız {n} təklif var',
  relax_generic: '“{f}” filtrini götürsəniz {n} təklif var', f_minprice: 'Minimum qiymət', f_lastmin_short: 'Son dəqiqə',
});
Object.assign(I18N.en, {
  f_date_range: 'Departure from / to', f_date_from: 'Departure from', f_date_to: 'Departure to', f_nights_range: 'Nights from / to', f_nights_from: 'Nights from', f_nights_to: 'Nights to',
  dq_title: 'Dates:', dq_exact: 'Exact date', dq_pm3: '±3 days', dq_7: '+7 days', dq_14: '+14 days',
  range_combo: 'Dates × nights combinations are limited to {n} — the range was narrowed.',
  f_district: 'Resort area', f_hotel: 'Hotel', ms_all: 'All', ms_search: 'Search by name...', ms_only_sel: 'Selected only', ms_n: '{n} selected',
  ms_empty: 'The list fills after a search', ms_none: 'No matches',
  attr_title: 'Hotel features', attr_chdFree: 'CHD FREE (kids stay free)', attr_adultsOnly: 'Adults only', attr_recommended: 'Recommended', attr_family: 'Family friendly',
  attr_b_chdFree: 'CHD FREE', attr_b_adultsOnly: 'Adults only', attr_b_recommended: '👍 Recommended', attr_b_family: 'Family',
  avail_title: 'Availability', f_seats: 'Seats on flights', f_no_stop: 'No stop-sale', f_instant: 'Instant confirmation',
  view_cards: 'Cards', view_table: 'Table', group_by: 'Group (cheapest per hotel)',
  col_date: 'Date / flight', col_tour: 'Tour', col_nights: 'Nights', col_hotel: 'Hotel (area)', col_seats: 'Seats', col_board: 'Board', col_room: 'Room / occupancy',
  col_price: 'Price', col_ptype: 'Price type', col_op: 'Operator', col_opprice: 'Operator price',
  pt_EB: 'Early booking {y}', pt_SPO: 'SPO (special offer)', pt_STD: 'Standard',
  seat_many: 'many', seat_few: 'few', seat_none: 'none', seat_request: 'on request', seats_hotel: 'Hotel', seats_out: 'Outbound flight', seats_back: 'Return flight',
  cls_econom: 'Economy', cls_business: 'Business', stop_sale: 'Stop-sale', flight_at: 'Flight {t}',
  rate_line: 'Operator rate {d}: {pair} {v}', rate_demo: 'DEMO rate; integration with CBAR / operator daily rate is planned.',
  table_more: 'The table shows the first {n} offers. Narrow down with filters.',
  empty_no_tours: 'There are no guided tours for this destination', empty_no_tours_sub: 'You can look at packages or hotel-only offers instead.',
  empty_no_departures: 'No guided tour departures on the selected dates', empty_no_departures_sub: 'Widen the date range or choose another destination.',
  empty_no_pkg: 'Flight packages are not available for domestic destinations', empty_no_pkg_sub: 'Switch to hotel-only search.',
  btn_see_package: 'See packages', btn_see_hotel: 'See hotels only', tours_avail: 'Destinations with guided tours:',
  empty_filters: 'Filters hid all {n} offers. Try this:', relax_maxPrice: 'Raise the budget to {v} — {n} offers',
  relax_generic: 'Remove the “{f}” filter — {n} offers', f_minprice: 'Minimum price', f_lastmin_short: 'Last minute',
});
Object.assign(I18N.ru, {
  f_date_range: 'Вылет с / по', f_date_from: 'Вылет с', f_date_to: 'Вылет по', f_nights_range: 'Ночей от / до', f_nights_from: 'Ночей от', f_nights_to: 'Ночей до',
  dq_title: 'Даты:', dq_exact: 'Точная дата', dq_pm3: '±3 дня', dq_7: '+7 дней', dq_14: '+14 дней',
  range_combo: 'Комбинаций дат × ночей не больше {n} — диапазон сокращён.',
  f_district: 'Курорт / район', f_hotel: 'Отель', ms_all: 'Все', ms_search: 'Поиск по названию...', ms_only_sel: 'Только выбранные', ms_n: 'выбрано: {n}',
  ms_empty: 'Список заполнится после поиска', ms_none: 'Ничего не найдено',
  attr_title: 'Особенности отеля', attr_chdFree: 'CHD FREE (ребёнок бесплатно)', attr_adultsOnly: 'Только для взрослых', attr_recommended: 'Рекомендуем', attr_family: 'Семейный',
  attr_b_chdFree: 'CHD FREE', attr_b_adultsOnly: 'Adults only', attr_b_recommended: '👍 Рекомендуем', attr_b_family: 'Семейный',
  avail_title: 'Места и продажа', f_seats: 'Есть места на рейсы', f_no_stop: 'Нет остановки продажи', f_instant: 'Мгновенное подтверждение',
  view_cards: 'Карточки', view_table: 'Таблица', group_by: 'Группировать (самый дешёвый по отелю)',
  col_date: 'Дата / вылет', col_tour: 'Тур', col_nights: 'Ночей', col_hotel: 'Отель (район)', col_seats: 'Места', col_board: 'Питание', col_room: 'Номер / размещение',
  col_price: 'Цена', col_ptype: 'Тип цены', col_op: 'Оператор', col_opprice: 'Цена оператора',
  pt_EB: 'Раннее бронирование {y}', pt_SPO: 'SPO (спецпредложение)', pt_STD: 'Стандарт',
  seat_many: 'много', seat_few: 'мало', seat_none: 'нет', seat_request: 'под запрос', seats_hotel: 'Отель', seats_out: 'Рейс туда', seats_back: 'Рейс обратно',
  cls_econom: 'Эконом', cls_business: 'Бизнес', stop_sale: 'Стоп-продажа', flight_at: 'Вылет {t}',
  rate_line: 'Курс оператора {d}: {pair} {v}', rate_demo: 'ДЕМО-курс; интеграция с ЦБА / дневным курсом оператора планируется.',
  table_more: 'В таблице первые {n} предложений. Сузьте фильтрами.',
  empty_no_tours: 'Для этого направления нет экскурсионных туров', empty_no_tours_sub: 'Посмотрите турпакеты или только отели.',
  empty_no_departures: 'На выбранные даты нет выездов экскурсионного тура', empty_no_departures_sub: 'Расширьте диапазон дат или выберите другое направление.',
  empty_no_pkg: 'Для направлений по Азербайджану нет пакетов с перелётом', empty_no_pkg_sub: 'Переключитесь на поиск только отелей.',
  btn_see_package: 'Смотреть турпакеты', btn_see_hotel: 'Смотреть только отели', tours_avail: 'Направления с экскурсионными турами:',
  empty_filters: 'Фильтры скрыли все {n} предложений. Попробуйте:', relax_maxPrice: 'Бюджет до {v} — {n} предложений',
  relax_generic: 'Убрать фильтр «{f}» — {n} предложений', f_minprice: 'Минимальная цена', f_lastmin_short: 'Горящие',
});

const HOTEL_ATTR_KEYS = ['chdFree', 'adultsOnly', 'recommended', 'family'];
// Otel atributları nişanları
function attrBadges(attrs) {
  return (attrs || []).filter((a) => HOTEL_ATTR_KEYS.includes(a))
    .map((a) => `<span class="badge attr attr-${a}" title="${esc(t('attr_' + a))}">${esc(t('attr_b_' + a))}</span>`).join('');
}
// Qiymət növü: "Erkən rezervasiya 2027" / SPO / Standart
function priceTypeText(o) {
  if (!o || !o.priceType) return '';
  return o.priceType === 'EB' ? t('pt_EB', { y: String(o.checkIn || '').slice(0, 4) }) : t('pt_' + o.priceType);
}
// Otaq / yerləşmə: "Standard Land View / DBL+1CHD(2-11.99)"
const roomText = (o) => [o.room, o.accommodation].filter(Boolean).join(' / ');
// Uçuş: "✈ 07:55 · Ekonom"
const flightText = (o) => (o.flight ? `✈ ${o.flight.out.time} · ${t('cls_' + o.flight.cls)}` : '');
// Yer statusu çipləri: otel + reys (gediş/dönüş). Rəng statusa görə, mətn title-da.
function seatChip(kind, status, icon) {
  if (!status) return '';
  const label = `${t('seats_' + kind)}: ${t('seat_' + status)}`;
  return `<span class="seat s-${esc(status)}" title="${esc(label)}" aria-label="${esc(label)}">${icon} ${esc(t('seat_' + status))}</span>`;
}
function seatsHtml(o) {
  const parts = [seatChip('hotel', o.hotelSeats, '🏨')];
  if (o.flight) parts.push(seatChip('out', o.flight.out.seats, '✈→'), seatChip('back', o.flight.back.seats, '←✈'));
  if (o.stopSale) parts.push(`<span class="badge stop">${esc(t('stop_sale'))}</span>`);
  return `<span class="seats">${parts.join('')}</span>`;
}
// "Operator məzənnəsi 13.11.2026: USD/AZN 1.7055"
function rateLineText(rate) {
  if (!rate) return '';
  return t('rate_line', { d: fmtDate(rate.date), pair: rate.pair, v: Number(rate.value).toFixed(4) });
}
function rateLineHtml(rate) {
  if (!rate) return '';
  return `<span class="rate-line" title="${esc(t('rate_demo'))}">💱 ${esc(rateLineText(rate))} <span class="demo-tag">demo</span></span>`;
}

// Filtr açarı → istifadəçi üçün ad (boş nəticə tövsiyələri)
function filterLabel(key) {
  const m = {
    minPrice: 'f_minprice', stars: 'stars', boards: 'board', earlyOnly: 'early_only', prepay: 'f_terms', freeCancel: 'f_free_cancel',
    lastMinute: 'f_lastmin_short', seatsOnly: 'f_seats', noStopSale: 'f_no_stop', instantOnly: 'f_instant', districts: 'f_district', hotels: 'f_hotel', attrs: 'attr_title',
    minRating: 'f_minrating', beachLines: 'f_lines', maxDist: 'f_maxdist',
  };
  return t(m[key] || key);
}

// Boş nəticə: səbəb + düymələr (data-switch-type / data-go-dest / data-relax). Səhifə klikləri özü emal edir.
function emptyDiagnosisHtml(data, cur) {
  const e = (data && data.empty) || {};
  const btn = (attrs, label, cls = 'secondary') => `<button type="button" class="btn ${cls} sm" ${attrs}>${esc(label)}</button>`;
  const destList = (list) => (list && list.length
    ? `<p class="muted" style="margin:14px 0 6px">${esc(t('tours_avail'))}</p><div class="chips">${list.map((d) => `<button type="button" class="chip" data-go-dest="${esc(d.id)}" data-go-name="${esc(d.name)}">${esc(d.name)} <small class="muted">${esc(d.country)}</small></button>`).join('')}</div>`
    : '');
  if (e.reason === 'no_tours' || e.reason === 'no_departures') {
    const nt = e.reason === 'no_tours';
    return `<div class="diag"><h3>${esc(t(nt ? 'empty_no_tours' : 'empty_no_departures'))}</h3><p class="muted">${esc(t(nt ? 'empty_no_tours_sub' : 'empty_no_departures_sub'))}</p>
      <div class="chips">${btn('data-switch-type="package"', t('btn_see_package'), 'primary')}${btn('data-switch-type="hotel"', t('btn_see_hotel'))}</div>${destList(e.tourDestinations)}</div>`;
  }
  if (e.reason === 'no_package_domestic') {
    return `<div class="diag"><h3>${esc(t('empty_no_pkg'))}</h3><p class="muted">${esc(t('empty_no_pkg_sub'))}</p><div class="chips">${btn('data-switch-type="hotel"', t('btn_see_hotel'), 'primary')}</div></div>`;
  }
  if (e.reason === 'filters' && e.relax && e.relax.length) {
    return `<div class="diag"><h3>${esc(t('empty_filters', { n: e.total }))}</h3><div class="chips">${e.relax.map((r) => btn(
      `data-relax="${esc(r.key)}"${r.value != null ? ` data-value="${esc(r.value)}"` : ''}`,
      r.key === 'maxPrice' ? t('relax_maxPrice', { v: money(r.value, cur), n: r.count }) : t('relax_generic', { f: filterLabel(r.key), n: r.count }),
    )).join('')}</div></div>`;
  }
  return `<div class="diag"><h3>${esc((data && data.message) || t('no_results'))}</h3></div>`;
}

// Multi-select (axtarışlı siyahı, "Hamısı", istəyə görə "Yalnız seçilmişlər").
// root-da 'mschange' hadisəsi yaranır; daxili change/input hadisələri yuxarı ötürülmür.
function msCreate(root, { title, onlySelToggle = false } = {}) {
  root.classList.add('ms');
  const st = { items: [], sel: new Set(), title, onlySelToggle, onlySel: false, filter: '' };
  root._ms = st;
  root.innerHTML = `<details><summary class="ms-sum"></summary><div class="ms-panel">
    <input type="search" class="ms-q" maxlength="60">
    <div class="ms-tools"><label><input type="checkbox" class="ms-all"> <span class="ms-all-l"></span></label>${onlySelToggle ? '<label><input type="checkbox" class="ms-only"> <span class="ms-only-l"></span></label>' : ''}</div>
    <div class="ms-list" role="group"></div></div></details>`;
  const emit = () => { msRender(root); root.dispatchEvent(new CustomEvent('mschange', { bubbles: true })); };
  root.addEventListener('input', (e) => {
    e.stopPropagation();
    if (e.target.classList.contains('ms-q')) { st.filter = e.target.value; msRenderList(root); }
  });
  root.addEventListener('change', (e) => {
    e.stopPropagation();
    const el = e.target;
    if (el.classList.contains('ms-q')) return;
    if (el.classList.contains('ms-all')) { if (el.checked) { st.sel.clear(); emit(); } else el.checked = !st.sel.size; return; }
    if (el.classList.contains('ms-only')) { st.onlySel = el.checked; msRenderList(root); return; }
    const v = el.dataset.ms; if (v === undefined) return;
    if (el.checked) st.sel.add(v); else st.sel.delete(v);
    emit();
  });
  msRender(root);
  return root;
}
function msRenderList(root) {
  const st = root._ms;
  const f = st.filter.trim().toLocaleLowerCase();
  const list = st.items.filter((x) => (!f || `${x.label} ${x.sub || ''}`.toLocaleLowerCase().includes(f)) && (!st.onlySel || st.sel.has(x.id)));
  root.querySelector('.ms-list').innerHTML = !st.items.length ? `<small class="muted">${esc(t('ms_empty'))}</small>`
    : !list.length ? `<small class="muted">${esc(t('ms_none'))}</small>`
      : list.map((x) => `<label class="ms-item${x.count === 0 ? ' zero' : ''}"><input type="checkbox" data-ms="${esc(x.id)}" ${st.sel.has(x.id) ? 'checked' : ''}>
        <span class="ms-l">${esc(x.label)}${x.sub ? ` <small class="muted">${esc(x.sub)}</small>` : ''}</span>${x.count != null ? `<small class="ms-c">${esc(x.count)}</small>` : ''}</label>`).join('');
}
function msRender(root) {
  const st = root._ms;
  root.querySelector('.ms-sum').innerHTML = `<b>${esc(t(st.title))}</b> <span class="ms-v">${esc(st.sel.size ? t('ms_n', { n: st.sel.size }) : t('ms_all'))}</span>`;
  root.querySelector('.ms-q').placeholder = t('ms_search');
  root.querySelector('.ms-q').setAttribute('aria-label', `${t(st.title)}: ${t('ms_search')}`);
  root.querySelector('.ms-all').checked = !st.sel.size;
  root.querySelector('.ms-all-l').textContent = t('ms_all');
  const ol = root.querySelector('.ms-only-l'); if (ol) ol.textContent = t('ms_only_sel');
  msRenderList(root);
}
function msSetItems(root, items) { root._ms.items = items || []; msRender(root); }
function msSetSelected(root, ids) { root._ms.sel = new Set(ids || []); msRender(root); }
const msValue = (root) => [...root._ms.sel];

// Tarix və gecə aralığı sahələri: -dək ≥ -dan, maks. aralıq, tarix × gecə kombinasiya limiti
function bindRangeInputs({ from, to, nFrom, nTo }, limits) {
  const L = limits || { maxDateRangeDays: 14, maxNightsSpan: 7, maxCombos: 60 };
  const addD = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const days = () => (from.value && to.value ? Math.round((Date.parse(to.value) - Date.parse(from.value)) / 864e5) + 1 : 1);
  function fixDates() {
    if (!from.value) return;
    to.min = from.value; to.max = addD(from.value, L.maxDateRangeDays);
    if (!to.value || to.value < from.value) to.value = from.value;
    if (to.value > to.max) to.value = to.max;
  }
  function fixNights(changed) {
    let a = parseInt(nFrom.value, 10) || 1; let b = parseInt(nTo.value, 10) || a;
    if (b < a) { if (changed === nTo) a = b; else b = a; }
    if (b - a > L.maxNightsSpan) { if (changed === nFrom) b = a + L.maxNightsSpan; else a = b - L.maxNightsSpan; }
    const maxSpan = Math.max(0, Math.floor(L.maxCombos / days()) - 1);
    if (b - a > maxSpan) { b = a + maxSpan; toast(t('range_combo', { n: L.maxCombos })); }
    nFrom.value = String(a); nTo.value = String(b);
  }
  from.addEventListener('change', () => { fixDates(); fixNights(); });
  to.addEventListener('change', () => { fixDates(); fixNights(); });
  nFrom.addEventListener('change', () => fixNights(nFrom));
  nTo.addEventListener('change', () => fixNights(nTo));
  fixDates();
  return {
    fix() { fixDates(); fixNights(); },
    // Qısa yollar: span 0 = dəqiq tarix, 'pm3' = ±3 gün, 7/14 = +N gün
    quick(span) {
      const today = new Date().toISOString().slice(0, 10);
      if (span === 'pm3') {
        const c = from.value || today;
        from.value = addD(c, -3) < today ? today : addD(c, -3);
        to.value = addD(c, 3);
      } else {
        to.value = addD(from.value || today, Number(span) || 0);
      }
      fixDates(); fixNights();
    },
  };
}

// ---- Otel/tur P1: reytinq sözü + rəy sayı, məsafə/çimərlik xətti, otel detal pəncərəsi, "Necə işləyirik" ----
Object.assign(I18N.az, {
  rw_superb: 'Möhtəşəm', rw_excellent: 'Əla', rw_very_good: 'Çox yaxşı', rw_good: 'Yaxşı', reviews_n: '{n} rəy',
  rating_demo_t: 'DEMO: reytinq və rəy sayı nümunədir. Real rəy mənbəyi qoşulduqdan sonra əvəz olunacaq.',
  f_rating: 'Reytinq', f_any: 'İstənilən', rating_plus: '{n}+', f_location: 'Yerləşmə və məsafə', f_beach_line: 'Çimərlik xətti (dəniz kurortları)',
  line_1: '1-ci xətt', line_2: '2-ci xətt', line_3: '3-cü xətt+', f_max_dist: 'Maks. məsafə (dəniz / kanat / mərkəz)', dist_upto: '≤ {d}',
  sort_distance: 'Dənizə / mərkəzə ən yaxın', loc_sea: 'dənizə {d}', loc_center: 'mərkəzə {d}', loc_lift: 'kanata / ski liftinə {d}', loc_airport: 'hava limanına ~{d}',
  loc_demo_t: 'DEMO: məsafələr təxminidir (nümunə məlumat).', col_location: 'Yerləşmə / məsafə', f_minrating: 'Reytinq həddi', f_lines: 'Çimərlik xətti', f_maxdist: 'Maks. məsafə',
  hd_open: 'Otel haqqında və bütün otaqlar', hd_more: 'Otaqlar və qiymətlər', hd_rooms: 'Otaq tipləri, qidalanma və operator qiymətləri', hd_room: 'Otaq / yerləşmə', hd_board: 'Qidalanma',
  hd_op: 'Operator', hd_dates: 'Tarix / gecə', hd_terms: 'Ödəniş və ləğv', hd_price: 'Qiymət', hd_amen: 'Olanaqlar', hd_dist: 'Məsafələr', hd_rules: 'Otel qaydaları',
  hd_rules_note: 'DEMO: qaydalar nümunədir — rezervasiyadan əvvəl operatordan dəqiqləşdirin.', hd_checkin: 'Check-in', hd_checkin_v: '{t}-dan', hd_checkout: 'Check-out', hd_checkout_v: '{t}-dək',
  hd_children: 'Uşaqlar', ch_welcome: 'Uşaqlar qəbul olunur', ch_chd_free: 'Uşaqlar qəbul olunur; CHD FREE — ilk 2–11 yaş uşaq otelə pulsuz (operatorun şərtinə görə)', ch_adults_only: 'Yalnız böyüklər ({n}+ yaş)',
  hd_pets: 'Ev heyvanları', pets_no: 'Qəbul olunmur', pets_on_request: 'Sorğu ilə', hd_close: 'Bağla', hd_loading: 'Otelin bütün təklifləri yüklənir...',
  hd_empty: 'Bu tarix və nəfər sayı üçün həmin oteldə təklif tapılmadı.', hd_desc_note: 'Təsvir şablon əsasında yaradılıb (DEMO) — otelin rəsmi təsviri deyil.', hd_rows: '{r} variant · {o} təklif · ucuzdan bahalıya',
  hd_copy: 'Linki kopyala', hd_copied: 'Link kopyalandı', hd_cheapest: 'ən ucuz', hd_illus: 'Şəkillər illüstrasiyadır.',
  desc_beach: '{name} — {dest} ({district}) ərazisində {stars} ulduzlu dəniz kənarı otel: {line}, dənizə təxminən {sea}.',
  desc_city: '{name} — {dest} ({district}) ərazisində {stars} ulduzlu otel; şəhər mərkəzinə təxminən {center}.',
  desc_mountain: '{name} — {dest} ({district}) ərazisində {stars} ulduzlu dağ oteli; kanata / ski liftinə təxminən {lift}.',
  desc_boards: 'Operatorlarda qidalanma variantları: {b}.', desc_tags: 'Olanaqlar: {t}.',
  how_link: 'Necə işləyirik', nav_how: 'Necə işləyirik', how_title: 'TurTap necə işləyir', how_sub: 'Qiymətləri haradan götürürük, necə sıralayırıq və nəyi etmirik — açıq şəkildə.',
  how_s1_t: 'TurTap nədir?', how_s1_d: 'TurTap tur operatorlarının və otel mənbələrinin qiymətlərini bir axtarışda toplayan müqayisə platformasıdır. Biz bilet, tur və ya otel satmırıq və ödəniş qəbul etmirik: siz variant seçirsiniz, müraciətiniz operatora / agentliyə ötürülür və ya operatorun öz saytına keçirsiniz. Rezervasiya və ödəniş birbaşa operatorla aparılır.',
  how_s2_t: 'Qiymətlər haradan gəlir və nə vaxt yoxlanılıb?', how_s2_d: 'Hər axtarışda qoşulmuş operatorlar paralel sorğulanır. Hər mənbənin yanında qiymətin nə vaxt yoxlanıldığı yazılır («X dəq əvvəl yoxlanılıb»). Cavablar ən çox 30 dəqiqə yaddaşda saxlanılır; «Yenilə» düyməsi operatorları yenidən soruşur. Operatorun saytında yekun qiymət fərqli ola bilər — rezervasiyanı operator təsdiqləyir.',
  how_s3_t: '«Ən ucuz əvvəl» sıralaması', how_s3_d: 'Defolt sıralama yalnız qiymətə görədir: hər otel üçün bütün operatorların ən ucuz təklifi götürülür və otellər ucuzdan bahalıya düzülür. Kartda operatorlar da ucuzdan bahalıya alt-alta göstərilir; ən ucuz mənbə həmişə yaşıl rənglə vurğulanır, qalanlarının fərqi (+X) yazılır.',
  how_s4_t: 'Digər sıralamalar və «Ən yaxşı» düsturu', how_s4_d: '«Reytinq» — əvvəl bal, sonra rəy sayı, sonra qiymət. «Dənizə / mərkəzə ən yaxın» — dəniz kurortunda dənizə, dağda kanata, şəhərdə mərkəzə məsafə. «Ulduz» və «Ən çox qənaət» (operatorlar arası fərq). Aviabiletdə «Ən yaxşı» = qiymət / ən ucuz qiymət + 0.7 × müddət / ən qısa müddət + 0.1 × aktarma sayı (kiçik bal daha yaxşıdır). İstənilən sıralamada ən ucuz variant ayrıca göstərilir.',
  how_s5_t: 'Reklam və ödənişli yerləşdirmə', how_s5_d: 'Hazırda ödənişli yerləşdirmə yoxdur. Gələcəkdə olarsa, belə təklif həmişə «Reklam» nişanı ilə göstəriləcək və «Ən ucuz əvvəl» sıralamasına təsir etməyəcək — ən ucuz mənbə yenə birinci və vurğulanmış qalacaq.',
  how_s6_t: 'Saxta qıtlıq göstərmirik', how_s6_d: '«Son 1 otaq qaldı!», «İndi 25 nəfər baxır», geri sayan saatlar kimi təzyiq yaradan mesajlar göstərmirik. Yer statusu (çox / az / sorğu ilə / stop-sale) yalnız operatorun cavabında gələn məlumatdır.',
  how_s7_t: 'Demo məlumat bəyanatı', how_s7_d: 'Bu versiyada qiymətlər, reytinq və rəy sayı, məsafələr, otel təsvirləri, qaydalar və şəkillər nümunə (DEMO) məlumatdır və «DEMO» işarəsi ilə göstərilir. Otel adları uydurmadır. Real operator inteqrasiyası qoşulduqca bu məlumatlar operatorların rəsmi API / feed-ləri ilə əvəz olunacaq.',
  how_s8_t: 'Məxfilik — qısa xülasə', how_s8_d: 'Yalnız müraciət üçün lazım olanı toplayırıq: ad, telefon və (istəsəniz) qeyd — menecer sizinlə əlaqə saxlasın deyə. Ödəniş və kart məlumatı toplamırıq. Axtarış parametrləri yalnız nəticəni göstərmək üçün istifadə olunur; dil və valyuta seçimi brauzerinizdə saxlanılır. Məlumatlarınızı satmırıq.',
  how_s9_t: 'Əlaqə', how_s9_d: 'Sualınız və ya təklifiniz varsa, ana səhifədəki «Sizə zəng edək» formasından istifadə edin — menecer sizinlə əlaqə saxlayacaq. Agentliklər üçün: B2B bölməsi.',
  how_cta: 'Axtarışa keç', how_cb: '«Sizə zəng edək» forması',
});
Object.assign(I18N.en, {
  rw_superb: 'Superb', rw_excellent: 'Excellent', rw_very_good: 'Very good', rw_good: 'Good', reviews_n: '{n} reviews',
  rating_demo_t: 'DEMO: rating and review count are sample data and will be replaced once a real review source is connected.',
  f_rating: 'Rating', f_any: 'Any', rating_plus: '{n}+', f_location: 'Location & distance', f_beach_line: 'Beach line (seaside resorts)',
  line_1: '1st line', line_2: '2nd line', line_3: '3rd line+', f_max_dist: 'Max distance (sea / lift / centre)', dist_upto: '≤ {d}',
  sort_distance: 'Closest to sea / centre', loc_sea: '{d} to the sea', loc_center: '{d} to the centre', loc_lift: '{d} to the lift', loc_airport: '~{d} to the airport',
  loc_demo_t: 'DEMO: distances are approximate (sample data).', col_location: 'Location / distance', f_minrating: 'Minimum rating', f_lines: 'Beach line', f_maxdist: 'Max distance',
  hd_open: 'Hotel details and all rooms', hd_more: 'Rooms & prices', hd_rooms: 'Room types, board and operator prices', hd_room: 'Room / occupancy', hd_board: 'Board',
  hd_op: 'Operator', hd_dates: 'Date / nights', hd_terms: 'Payment & cancellation', hd_price: 'Price', hd_amen: 'Facilities', hd_dist: 'Distances', hd_rules: 'House rules',
  hd_rules_note: 'DEMO: rules are illustrative — please confirm with the operator before booking.', hd_checkin: 'Check-in', hd_checkin_v: 'from {t}', hd_checkout: 'Check-out', hd_checkout_v: 'until {t}',
  hd_children: 'Children', ch_welcome: 'Children welcome', ch_chd_free: 'Children welcome; CHD FREE — first child aged 2–11 stays free (per operator terms)', ch_adults_only: 'Adults only ({n}+)',
  hd_pets: 'Pets', pets_no: 'Not allowed', pets_on_request: 'On request', hd_close: 'Close', hd_loading: 'Loading all offers for this hotel...',
  hd_empty: 'No offers for this hotel with these dates and guests.', hd_desc_note: 'Description generated from a template (DEMO) — not the hotel’s official text.', hd_rows: '{r} options · {o} offers · cheapest first',
  hd_copy: 'Copy link', hd_copied: 'Link copied', hd_cheapest: 'cheapest', hd_illus: 'Images are illustrations.',
  desc_beach: '{name} is a {stars}-star seaside hotel in {dest} ({district}): {line}, about {sea} to the sea.',
  desc_city: '{name} is a {stars}-star hotel in {dest} ({district}), about {center} from the city centre.',
  desc_mountain: '{name} is a {stars}-star mountain hotel in {dest} ({district}), about {lift} from the lift.',
  desc_boards: 'Board options with operators: {b}.', desc_tags: 'Facilities: {t}.',
  how_link: 'How we work', nav_how: 'How we work', how_title: 'How TurTap works', how_sub: 'Where prices come from, how we rank them and what we never do — in plain words.',
  how_s1_t: 'What is TurTap?', how_s1_d: 'TurTap is a comparison platform that gathers prices from tour operators and hotel sources in one search. We do not sell tickets, tours or hotels and we do not take payments: you choose an option, and your request is passed to the operator / agency or you continue on the operator’s own website. Booking and payment happen directly with the operator.',
  how_s2_t: 'Where do prices come from and when were they checked?', how_s2_d: 'Each search queries the connected operators in parallel. Every source shows when its price was checked (“checked X min ago”). Responses are cached for at most 30 minutes; the “Refresh” button asks the operators again. The final price on the operator’s site may differ — the operator confirms the booking.',
  how_s3_t: '“Cheapest first” ranking', how_s3_d: 'The default ranking is by price only: for every hotel we take the cheapest offer across all operators and list hotels from cheapest to most expensive. On each card operators are also listed cheapest first; the cheapest source is always highlighted in green and the others show the difference (+X).',
  how_s4_t: 'Other sort orders and the “Best” formula', how_s4_d: '“Rating” — score first, then review count, then price. “Closest to sea / centre” — distance to the sea at seaside resorts, to the lift in the mountains, to the centre in cities. “Stars” and “Biggest savings” (difference between operators). For flights, “Best” = price / cheapest price + 0.7 × duration / shortest duration + 0.1 × number of stops (lower is better). Whatever the order, the cheapest option is always shown separately.',
  how_s5_t: 'Advertising and paid placement', how_s5_d: 'There is no paid placement today. If there ever is, such offers will always carry an “Ad” label and will not affect the “Cheapest first” ranking — the cheapest source stays first and highlighted.',
  how_s6_t: 'No fake scarcity', how_s6_d: 'We do not show pressure messages like “Only 1 room left!”, “25 people are looking now” or countdown timers. Availability (many / few / on request / stop-sale) is shown only as returned by the operator.',
  how_s7_t: 'Demo data disclaimer', how_s7_d: 'In this version, prices, ratings and review counts, distances, hotel descriptions, rules and images are sample (DEMO) data and are marked “DEMO”. Hotel names are fictional. As real operator integrations are connected, this data will be replaced by the operators’ official APIs / feeds.',
  how_s8_t: 'Privacy in short', how_s8_d: 'We only collect what a request needs: your name, phone and (optionally) a note, so a manager can contact you. We do not collect payment or card details. Search parameters are used only to show results; your language and currency choice is stored in your browser. We do not sell your data.',
  how_s9_t: 'Contact', how_s9_d: 'Questions or suggestions? Use the “Request a call back” form on the home page and a manager will contact you. For agencies: the B2B section.',
  how_cta: 'Go to search', how_cb: '“Request a call back” form',
});
Object.assign(I18N.ru, {
  rw_superb: 'Превосходно', rw_excellent: 'Отлично', rw_very_good: 'Очень хорошо', rw_good: 'Хорошо', reviews_n: '{n} отзывов',
  rating_demo_t: 'ДЕМО: рейтинг и число отзывов — пример. Будут заменены после подключения реального источника отзывов.',
  f_rating: 'Рейтинг', f_any: 'Любой', rating_plus: '{n}+', f_location: 'Расположение и расстояние', f_beach_line: 'Пляжная линия (морские курорты)',
  line_1: '1-я линия', line_2: '2-я линия', line_3: '3-я линия+', f_max_dist: 'Макс. расстояние (море / подъёмник / центр)', dist_upto: '≤ {d}',
  sort_distance: 'Ближе к морю / центру', loc_sea: 'до моря {d}', loc_center: 'до центра {d}', loc_lift: 'до подъёмника {d}', loc_airport: 'до аэропорта ~{d}',
  loc_demo_t: 'ДЕМО: расстояния приблизительные (пример).', col_location: 'Расположение / расстояние', f_minrating: 'Мин. рейтинг', f_lines: 'Пляжная линия', f_maxdist: 'Макс. расстояние',
  hd_open: 'Об отеле и все номера', hd_more: 'Номера и цены', hd_rooms: 'Типы номеров, питание и цены операторов', hd_room: 'Номер / размещение', hd_board: 'Питание',
  hd_op: 'Оператор', hd_dates: 'Дата / ночей', hd_terms: 'Оплата и отмена', hd_price: 'Цена', hd_amen: 'Удобства', hd_dist: 'Расстояния', hd_rules: 'Правила отеля',
  hd_rules_note: 'ДЕМО: правила для примера — уточняйте у оператора до бронирования.', hd_checkin: 'Заезд', hd_checkin_v: 'с {t}', hd_checkout: 'Выезд', hd_checkout_v: 'до {t}',
  hd_children: 'Дети', ch_welcome: 'Дети принимаются', ch_chd_free: 'Дети принимаются; CHD FREE — первый ребёнок 2–11 лет бесплатно (по условиям оператора)', ch_adults_only: 'Только для взрослых ({n}+)',
  hd_pets: 'Животные', pets_no: 'Не допускаются', pets_on_request: 'По запросу', hd_close: 'Закрыть', hd_loading: 'Загружаем все предложения отеля...',
  hd_empty: 'Для этого отеля нет предложений на эти даты и состав.', hd_desc_note: 'Описание создано по шаблону (ДЕМО) — это не официальный текст отеля.', hd_rows: '{r} вариантов · {o} предложений · от дешёвых к дорогим',
  hd_copy: 'Копировать ссылку', hd_copied: 'Ссылка скопирована', hd_cheapest: 'дешевле всех', hd_illus: 'Изображения — иллюстрации.',
  desc_beach: '{name} — отель {stars}* у моря, {dest} ({district}): {line}, до моря около {sea}.',
  desc_city: '{name} — отель {stars}*, {dest} ({district}); до центра около {center}.',
  desc_mountain: '{name} — горный отель {stars}*, {dest} ({district}); до подъёмника около {lift}.',
  desc_boards: 'Варианты питания у операторов: {b}.', desc_tags: 'Удобства: {t}.',
  how_link: 'Как мы работаем', nav_how: 'Как мы работаем', how_title: 'Как работает TurTap', how_sub: 'Откуда цены, как мы их сортируем и чего никогда не делаем — открыто.',
  how_s1_t: 'Что такое TurTap?', how_s1_d: 'TurTap — платформа сравнения, которая собирает цены туроператоров и отельных источников в одном поиске. Мы не продаём билеты, туры или отели и не принимаем оплату: вы выбираете вариант, ваша заявка передаётся оператору / агентству или вы переходите на сайт оператора. Бронирование и оплата — напрямую с оператором.',
  how_s2_t: 'Откуда цены и когда они проверены?', how_s2_d: 'При каждом поиске подключённые операторы опрашиваются параллельно. Рядом с каждым источником указано, когда проверена цена («проверено X мин назад»). Ответы хранятся в кэше не дольше 30 минут; кнопка «Обновить» опрашивает операторов заново. Итоговая цена на сайте оператора может отличаться — бронирование подтверждает оператор.',
  how_s3_t: 'Сортировка «Сначала дешёвые»', how_s3_d: 'Сортировка по умолчанию — только по цене: для каждого отеля берётся самое дешёвое предложение среди всех операторов, отели идут от дешёвых к дорогим. В карточке операторы тоже идут от дешёвых к дорогим; самый дешёвый источник всегда выделен зелёным, у остальных указана разница (+X).',
  how_s4_t: 'Другие сортировки и формула «Лучшие»', how_s4_d: '«Рейтинг» — сначала оценка, затем число отзывов, затем цена. «Ближе к морю / центру» — расстояние до моря на морских курортах, до подъёмника в горах, до центра в городах. «Звёзды» и «Макс. экономия» (разница между операторами). В авиабилетах «Лучшие» = цена / минимальная цена + 0.7 × длительность / минимальная длительность + 0.1 × число пересадок (меньше — лучше). При любой сортировке самый дешёвый вариант показывается отдельно.',
  how_s5_t: 'Реклама и платное размещение', how_s5_d: 'Сейчас платного размещения нет. Если оно появится, такие предложения всегда будут с пометкой «Реклама» и не повлияют на сортировку «Сначала дешёвые» — самый дешёвый источник останется первым и выделенным.',
  how_s6_t: 'Без искусственного дефицита', how_s6_d: 'Мы не показываем давящие сообщения вроде «Остался 1 номер!», «Сейчас смотрят 25 человек» или таймеры обратного отсчёта. Наличие мест (много / мало / под запрос / стоп-продажа) показывается только так, как его передал оператор.',
  how_s7_t: 'Демо-данные', how_s7_d: 'В этой версии цены, рейтинг и число отзывов, расстояния, описания отелей, правила и изображения — пример (ДЕМО) и помечены «ДЕМО». Названия отелей вымышлены. По мере подключения операторов эти данные будут заменены официальными API / фидами операторов.',
  how_s8_t: 'Коротко о конфиденциальности', how_s8_d: 'Мы собираем только то, что нужно для заявки: имя, телефон и (по желанию) комментарий, чтобы менеджер мог с вами связаться. Платёжные и карточные данные мы не собираем. Параметры поиска используются только для показа результатов; язык и валюта хранятся в вашем браузере. Мы не продаём ваши данные.',
  how_s9_t: 'Контакты', how_s9_d: 'Есть вопрос или предложение? Воспользуйтесь формой «Перезвоним вам» на главной странице — менеджер свяжется с вами. Для агентств: раздел B2B.',
  how_cta: 'Перейти к поиску', how_cb: 'Форма «Перезвоним вам»',
});

// Reytinq: "Möhtəşəm 9.2 · 1 240 rəy" + kiçik DEMO etiketi (tooltip). Söz açarı serverdən (ratingWord).
const fmtInt = (n) => Number(n).toLocaleString('en-US').replace(/,/g, ' ');
function ratingText(o) {
  if (!o || o.rating == null) return '';
  const word = o.ratingWord ? t('rw_' + o.ratingWord) + ' ' : '';
  return `${word}${o.rating}${o.reviewCount ? ' · ' + t('reviews_n', { n: fmtInt(o.reviewCount) }) : ''}`;
}
function ratingHtml(o) {
  if (!o || o.rating == null) return '';
  return `<span class="badge rating" title="${esc(t('rating_demo_t'))}">${o.ratingWord ? `<b>${esc(t('rw_' + o.ratingWord))}</b> ` : ''}${esc(o.rating)}${o.reviewCount ? ` <span class="rv">· ${esc(t('reviews_n', { n: fmtInt(o.reviewCount) }))}</span>` : ''} <span class="demo-tag">demo</span></span>`;
}
// Məsafə: <1000 m → "120 m", əks halda "2.4 km"
const distText = (m) => (m == null ? '' : m < 1000 ? `${Math.round(m)} m` : `${Math.round(m / 100) / 10} km`);
// Əsas məsafə (server keyDistance ilə eyni): dəniz → dənizə, dağ → kanata, şəhər → mərkəzə
const keyDist = (loc) => (!loc ? null : loc.kind === 'beach' ? loc.seaM : loc.kind === 'mountain' ? loc.liftM : loc.centerM);
function locationText(loc) {
  if (!loc) return '';
  if (loc.kind === 'beach') return `${loc.line ? t('line_' + Math.min(3, loc.line)) + ' · ' : ''}${t('loc_sea', { d: distText(loc.seaM) })}`;
  if (loc.kind === 'mountain') return t('loc_lift', { d: distText(loc.liftM) });
  return t('loc_center', { d: distText(loc.centerM) });
}
function locationBadge(loc) {
  if (!loc) return '';
  const icon = loc.kind === 'beach' ? '🏖' : loc.kind === 'mountain' ? '🚡' : '📍';
  return `<span class="badge loc loc-${esc(loc.kind)}${loc.line === 1 ? ' line1' : ''}" title="${esc(t('loc_demo_t'))}">${icon} ${esc(locationText(loc))}</span>`;
}
