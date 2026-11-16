// Yaddaşdaxili rate limiter (sabit pəncərə). Bir proses üçündür; bir neçə server
// nüsxəsində (cluster / horizontal scale) Redis kimi ortaq saxlama lazımdır — bax SECURITY.md.
//
// Yaddaş qoruması: açar sayı maxKeys ilə məhduddur; dolduqda ən köhnə açarlar silinir
// (əvvəlki versiyadakı kimi bütün xəritəni sıfırlamır — bu, hücumçuya limiti sıfırlamağa imkan verirdi).

const counters = new Set(); // bütün limiter-lərin xəritələri (sweep üçün)

function createCounter({ windowMs, maxKeys = 50000 }) {
  const map = new Map(); // key -> { count, resetAt }
  const counter = {
    windowMs,
    map,
    // Sayğacı artırıb vəziyyəti qaytarır
    hit(key, n = 1) {
      const now = Date.now();
      let e = map.get(key);
      if (!e || e.resetAt <= now) {
        if (e) map.delete(key);
        e = { count: 0, resetAt: now + windowMs };
        map.set(key, e);
        while (map.size > maxKeys) map.delete(map.keys().next().value);
      }
      e.count += n;
      return e;
    },
    peek(key) {
      const e = map.get(key);
      if (!e || e.resetAt <= Date.now()) return null;
      return e;
    },
    reset(key) { map.delete(key); },
    sweep() {
      const now = Date.now();
      for (const [k, e] of map) if (e.resetAt <= now) map.delete(k);
    },
  };
  counters.add(counter);
  return counter;
}

const timer = setInterval(() => { for (const c of counters) c.sweep(); }, 60 * 1000);
timer.unref();

const defaultMessage = 'Çox sayda sorğu. Bir az sonra yenidən cəhd edin.';

// Express middleware. key(req) — default IP; skip(req) — limitdən azad sorğular
function rateLimit({ name = 'rl', windowMs, max, key = (req) => req.ip, skip, message = defaultMessage }) {
  const counter = createCounter({ windowMs });
  const mw = (req, res, next) => {
    if (skip && skip(req)) return next();
    const k = `${name}:${key(req) || 'unknown'}`;
    const e = counter.hit(k);
    const remaining = Math.max(0, max - e.count);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(remaining));
    res.set('RateLimit-Reset', String(Math.ceil((e.resetAt - Date.now()) / 1000)));
    if (e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.resetAt - Date.now()) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
  mw.counter = counter;
  return mw;
}

module.exports = { rateLimit, createCounter };
