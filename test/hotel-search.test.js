const test = require('node:test');
const assert = require('node:assert');
const { suggest } = require('../src/search');

test('suggest: otel adı ilə axtarış (bütün sözlər), istiqamət sətirləri ilə birlikdə', () => {
  const r = suggest('blue wave beach');
  const h = r.filter((x) => x.kind === 'hotel');
  assert.ok(h.length >= 1);
  assert.ok(h.every((x) => /blue wave/i.test(x.name) && /beach/i.test(x.name)));
  assert.ok(h.every((x) => x.destinationId && x.id && x.country));
  // istiqamət axtarışı əvvəlki kimi işləyir
  assert.ok(suggest('Antalya').some((x) => x.kind === 'dest' && x.id === 'antalya'));
  // 1 simvolda otel axtarılmır
  assert.ok(suggest('b').every((x) => x.kind === 'dest'));
  // daxili qiymət əmsalı (priceFactor) sızmır
  assert.ok(h.every((x) => !('priceFactor' in x)));
});

test('B2B otel müqayisəsi: girişsiz 401, girişlə operatorlar ucuzdan bahalıya + clientPrice qaydalar olanda', async (t) => {
  const { startServer, createAccount, login, client, future } = require('./_helpers');
  const app = require('../server');
  const srv = await startServer(app);
  t.after(() => srv.close());
  const anon = await fetch(`${srv.base}/api/b2b/hotels/antalya-h2/offers?checkIn=${future(40)}&nights=7&adults=2`);
  assert.strictEqual(anon.status, 401);
  await createAccount({ agency: 'HotelCmp Agentlik', username: 'hotelcmp1' });
  const s = await login(srv.base, 'hotelcmp1', 'Test-Parol-Uzun-2026');
  const c = client(srv.base, s);
  const r = await c.get(`/api/b2b/hotels/antalya-h2/offers?checkIn=${future(40)}&nights=7&adults=2`);
  assert.strictEqual(r.status, 200);
  const d = await r.json();
  assert.ok(d.rows.length > 0);
  for (let i = 1; i < d.rows.length; i++) assert.ok(d.rows[i - 1].price <= d.rows[i].price);
  const bad = await c.get('/api/b2b/hotels/../../etc/offers');
  assert.ok([400, 404].includes(bad.status));
});
