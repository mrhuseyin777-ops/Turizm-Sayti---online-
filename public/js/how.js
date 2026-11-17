// "Necə işləyirik" səhifəsi: mətnlər common.js I18N-dədir (data-i18n); burada yalnız il, valyuta seçimi
// (digər səhifələrlə eyni header) və ödəniş üsulları zolağı.
(async function () {
  const $ = (s) => document.querySelector(s);
  $('#year').textContent = new Date().getFullYear();
  const renderStatic = () => { $('#payStrip').innerHTML = paymentStripHtml(); };
  renderStatic();
  document.addEventListener('langchange', renderStatic);
  const sel = $('#currency');
  try {
    const cfg = await api('/api/config');
    sel.innerHTML = cfg.currencies.map((c) => `<option>${esc(c)}</option>`).join('');
    sel.value = store.get('currency', 'AZN');
  } catch { sel.hidden = true; }
  sel.addEventListener('change', () => store.set('currency', sel.value));
})();
