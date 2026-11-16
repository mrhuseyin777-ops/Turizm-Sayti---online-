// Ortaq köməkçilər: dil (AZ/EN/RU), API, avtomatik tamamlama, formatlama
const I18N = {
  az: {
    nav_search: 'Axtarış', nav_b2b: 'Agentliklər üçün (B2B)', tab_package: 'Tur paketi (uçuş + otel)', tab_hotel: 'Yalnız otel', tab_tour: 'Ekskursiya turları',
    reg_all: 'Hamısı', reg_intl: 'Xarici', reg_domestic: 'Daxili', f_dest: 'Hara?', f_dest_ph: 'Antalya, Dubay, Qəbələ...', f_date: 'Gediş tarixi', f_nights: 'Gecə', f_pax: 'Böyük / Uşaq',
    f_budget: 'Büdcə (maks.)', f_budget_ph: 'Limitsiz', btn_search: 'Axtar', hero_title: 'Bütün tur operatorları — bir axtarışda',
    hero_sub: 'Summer Tour, Funsun, Kompas, Samatur və digərlərinin qiymətlərini müqayisə et. Ən ucuzdan bahalıya.',
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
    nav_search: 'Search', nav_b2b: 'For agencies (B2B)', tab_package: 'Package (flight + hotel)', tab_hotel: 'Hotel only', tab_tour: 'Guided tours',
    reg_all: 'All', reg_intl: 'International', reg_domestic: 'Domestic', f_dest: 'Where to?', f_dest_ph: 'Antalya, Dubai, Gabala...', f_date: 'Departure', f_nights: 'Nights', f_pax: 'Adults / Kids',
    f_budget: 'Budget (max)', f_budget_ph: 'No limit', btn_search: 'Search', hero_title: 'Every tour operator — one search',
    hero_sub: 'Compare prices from Summer Tour, Funsun, Kompas, Samatur and more. Cheapest first.',
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
    nav_search: 'Поиск', nav_b2b: 'Для агентств (B2B)', tab_package: 'Тур (перелёт + отель)', tab_hotel: 'Только отель', tab_tour: 'Экскурсионные туры',
    reg_all: 'Все', reg_intl: 'Зарубежные', reg_domestic: 'По Азербайджану', f_dest: 'Куда?', f_dest_ph: 'Анталья, Дубай, Габала...', f_date: 'Дата вылета', f_nights: 'Ночей', f_pax: 'Взрослые / Дети',
    f_budget: 'Бюджет (макс.)', f_budget_ph: 'Без лимита', btn_search: 'Найти', hero_title: 'Все туроператоры — в одном поиске',
    hero_sub: 'Сравните цены Summer Tour, Funsun, Kompas, Samatur и других. Сначала дешёвые.',
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
