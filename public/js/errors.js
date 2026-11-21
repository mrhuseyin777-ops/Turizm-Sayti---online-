// Brauzer xətalarının serverə bildirilməsi (POST /api/client-errors). Bütün səhifələrdə common.js-dən ƏVVƏL
// yüklənir ki, sonrakı skriptlərin xətaları da tutulsun. CSP-uyğun: inline kod yoxdur, yalnız öz origin-ə
// sorğu (connect-src 'self').
// Göndərilən: yalnız xəta mesajı (≤300 simvol), skript faylının yolu, sətir/sütun, səhifənin yolu —
// query string, hash, forma dəyərləri, cookie və ya istifadəçi daxiletməsi GÖNDƏRİLMİR.
// Limit: səhifə yüklənməsi başına ən çox 5 bildiriş, eyni xəta bir dəfə; body ≤ 4 KB.
(function () {
  'use strict';
  var ENDPOINT = '/api/client-errors';
  var MAX_REPORTS = 5;
  var MAX_BYTES = 4096;
  var sent = 0;
  var seen = {};

  function pathOnly(u) {
    try {
      var url = new URL(String(u || ''), location.href);
      return url.origin === location.origin ? url.pathname : 'external';
    } catch (_e) {
      return '';
    }
  }

  function report(kind, message, file, line, col) {
    try {
      if (sent >= MAX_REPORTS) return;
      var msg = String(message || 'Unknown error').slice(0, 300);
      var key = kind + '|' + msg + '|' + file + '|' + line;
      if (seen[key]) return;
      seen[key] = true;
      sent += 1;
      var body = JSON.stringify({
        kind: kind,
        message: msg,
        file: pathOnly(file),
        line: typeof line === 'number' ? line : null,
        col: typeof col === 'number' ? col : null,
        page: location.pathname,
      });
      if (body.length > MAX_BYTES) return;
      var blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
      if (window.fetch) {
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true, credentials: 'same-origin' })
          .catch(function () { /* bildiriş alınmadı — səssizcə keç */ });
      }
    } catch (_e) {
      /* bildirişin özü xəta atmamalıdır */
    }
  }

  window.addEventListener('error', function (e) {
    // Resurs xətaları (şəkil/skript yüklənmədi) — e.target element olur; yalnız JS xətaları bildirilir
    if (!e || (e.target && e.target !== window)) return;
    report('error', e.message, e.filename, e.lineno, e.colno);
  });

  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    var msg = r && typeof r === 'object' && r.message ? r.message : typeof r === 'string' ? r : 'Unhandled promise rejection';
    report('unhandledrejection', msg, '', null, null);
  });
})();
