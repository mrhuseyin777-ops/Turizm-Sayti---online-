// "Qiymətə nə daxildir" (B2C kartı, otel detal pəncərəsi, müraciət forması, agentlik vidjeti).
// Asılılıqsızdır (common.js tələb etmir) — vidjet də istifadə edir. Məlumat serverdən: offer.includes / offer.excludes
// (src/includes.js, DEMO, deterministik). Bütün mətn öz escape funksiyası ilə yazılır.
window.Inclusions = (() => {
  const E = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = {
    az: {
      title: 'Qiymətə nə daxildir', yes: 'Daxildir', no: 'Daxil deyil', demo: 'DEMO — məlumat nümunədir, operatordan dəqiqləşdirilir.',
      vary: 'Ən ucuz variant üzrə; operator və otaqdan asılı olaraq fərqlənə bilər.',
      hotel: 'Otel yerləşməsi', flight: 'Aviabilet (gediş-dönüş)', baggage: 'Baqaj {v} kq', transfer: 'Transfer (hava limanı ↔ otel)',
      insurance: 'Tibbi sığorta', meal: 'Qida: {v}', transport: 'Nəqliyyat', guide: 'Bələdçi', excursions: 'Ekskursiyalar', skipass: 'Ski-pass',
      visa: 'Viza', visa_n: 'Azərbaycan vətəndaşları üçün viza tələbi — rəsmi mənbədən yoxlayın',
      tourist_tax: 'Turist vergisi', tourist_tax_n: 'bəzi ölkələrdə otelə yerində ödənilir',
      personal: 'Şəxsi xərclər', personal_n: 'minibar, əlavə ekskursiyalar və s.',
      x_flight: 'Aviabilet', x_transfer: 'Transfer', x_insurance: 'Tibbi sığorta',
      b_RO: 'yalnız otaq', b_BB: 'səhər yeməyi', b_HB: 'yarım pansion', b_FB: 'tam pansion', b_AI: 'hər şey daxil', b_UAI: 'ultra hər şey daxil',
    },
    en: {
      title: 'What the price includes', yes: 'Included', no: 'Not included', demo: 'DEMO — illustrative data, to be confirmed with the operator.',
      vary: 'For the cheapest option; may differ by operator and room.',
      hotel: 'Hotel stay', flight: 'Return flight', baggage: 'Baggage {v} kg', transfer: 'Transfer (airport ↔ hotel)',
      insurance: 'Medical insurance', meal: 'Meals: {v}', transport: 'Transport', guide: 'Guide', excursions: 'Excursions', skipass: 'Ski pass',
      visa: 'Visa', visa_n: 'Visa requirements for citizens of Azerbaijan — check the official source',
      tourist_tax: 'Tourist tax', tourist_tax_n: 'paid at the hotel in some countries',
      personal: 'Personal expenses', personal_n: 'minibar, extra excursions, etc.',
      x_flight: 'Flight', x_transfer: 'Transfer', x_insurance: 'Medical insurance',
      b_RO: 'room only', b_BB: 'breakfast', b_HB: 'half board', b_FB: 'full board', b_AI: 'all inclusive', b_UAI: 'ultra all inclusive',
    },
    ru: {
      title: 'Что входит в цену', yes: 'Входит', no: 'Не входит', demo: 'ДЕМО — данные для примера, уточняются у оператора.',
      vary: 'Для самого дешёвого варианта; может отличаться у разных операторов и номеров.',
      hotel: 'Проживание в отеле', flight: 'Авиабилет (туда-обратно)', baggage: 'Багаж {v} кг', transfer: 'Трансфер (аэропорт ↔ отель)',
      insurance: 'Медицинская страховка', meal: 'Питание: {v}', transport: 'Транспорт', guide: 'Гид', excursions: 'Экскурсии', skipass: 'Ски-пасс',
      visa: 'Виза', visa_n: 'Визовые требования для граждан Азербайджана — проверьте на официальном источнике',
      tourist_tax: 'Туристический налог', tourist_tax_n: 'в некоторых странах оплачивается в отеле',
      personal: 'Личные расходы', personal_n: 'минибар, доп. экскурсии и т. п.',
      x_flight: 'Авиабилет', x_transfer: 'Трансфер', x_insurance: 'Медицинская страховка',
      b_RO: 'без питания', b_BB: 'завтрак', b_HB: 'полупансион', b_FB: 'полный пансион', b_AI: 'всё включено', b_UAI: 'ультра всё включено',
    },
  };
  const ICON = {
    hotel: '🏨', flight: '✈', baggage: '🧳', transfer: '🚐', insurance: '🩺', meal: '🍽', transport: '🚌', guide: '🧭',
    excursions: '🎟', skipass: '⛷', visa: '🛂', tourist_tax: '🏛', personal: '💳',
  };
  const tr = (lang, k, v) => ((S[lang] && S[lang][k]) || S.az[k] || k).replace('{v}', v ?? '');
  const parse = (code) => { const [k, v] = String(code).split(':'); return { k, v }; };
  const valid = (arr) => (Array.isArray(arr) ? arr.filter((c) => typeof c === 'string' && ICON[parse(c).k]) : []);

  function incLabel(code, lang) {
    const { k, v } = parse(code);
    if (k === 'meal') return tr(lang, 'meal', tr(lang, 'b_' + v) === 'b_' + v ? v : `${tr(lang, 'b_' + v)} (${v})`);
    return tr(lang, k, v);
  }
  function excLabel(code, lang) {
    const { k } = parse(code);
    if (['flight', 'transfer', 'insurance'].includes(k)) return tr(lang, 'x_' + k);
    return tr(lang, k);
  }
  const excNote = (code, lang) => { const k = parse(code).k; return S.az[k + '_n'] ? tr(lang, k + '_n') : ''; };

  // Kart üçün qısa ikon sətri: ✓ ✈ 🧳 🚐 🩺 🍽 · ✕ 🛂 (hər ikonun izahı title/aria-label-da)
  function line(includes, excludes, lang = 'az') {
    const inc = valid(includes);
    const exc = valid(excludes).filter((c) => !['personal'].includes(parse(c).k));
    if (!inc.length && !exc.length) return '';
    const chip = (c, ok) => {
      const lbl = ok ? incLabel(c, lang) : `${excLabel(c, lang)} — ${tr(lang, 'no').toLowerCase()}`;
      const extra = ok && parse(c).k === 'meal' ? `<small>${E(parse(c).v)}</small>` : '';
      return `<span class="inc-i ${ok ? 'ok' : 'no'}" title="${E(lbl)}" aria-label="${E(lbl)}" role="img">${ICON[parse(c).k]}${extra}</span>`;
    };
    return `<div class="inc-line" title="${E(tr(lang, 'title'))}"><span class="inc-yes" aria-hidden="true">✓</span>${inc.map((c) => chip(c, true)).join('')}`
      + (exc.length ? `<span class="inc-sep" aria-hidden="true">·</span><span class="inc-no" aria-hidden="true">✕</span>${exc.map((c) => chip(c, false)).join('')}` : '')
      + `<span class="inc-demo">demo</span></div>`;
  }

  // Detal pəncərəsi / müraciət forması üçün tam blok
  function block(includes, excludes, lang = 'az', { vary = false } = {}) {
    const inc = valid(includes);
    const exc = valid(excludes);
    if (!inc.length && !exc.length) return '';
    const li = (c, ok) => {
      const note = ok ? '' : excNote(c, lang);
      return `<li class="${ok ? 'ok' : 'no'}"><span class="inc-mark" aria-hidden="true">${ok ? '✓' : '✕'}</span><span aria-hidden="true">${ICON[parse(c).k]}</span> `
        + `<span>${E(ok ? incLabel(c, lang) : excLabel(c, lang))}${note ? `<small> — ${E(note)}</small>` : ''}</span></li>`;
    };
    return `<section class="inc-block" aria-label="${E(tr(lang, 'title'))}">
      <h4>${E(tr(lang, 'title'))} <span class="demo-tag" title="${E(tr(lang, 'demo'))}">demo</span></h4>
      <div class="inc-cols">
        <div><b class="inc-h ok">${E(tr(lang, 'yes'))}</b><ul class="inc-list">${inc.map((c) => li(c, true)).join('')}</ul></div>
        <div><b class="inc-h no">${E(tr(lang, 'no'))}</b><ul class="inc-list">${exc.map((c) => li(c, false)).join('')}</ul></div>
      </div>
      <p class="inc-note">${vary ? E(tr(lang, 'vary')) + ' ' : ''}${E(tr(lang, 'demo'))}</p>
    </section>`;
  }

  return { line, block, incLabel, excLabel };
})();
