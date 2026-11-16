const test = require('node:test');
const assert = require('node:assert');
const { search, resolveDestinations } = require('../src/search');

const future = (days) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

test('istiqamət adları müxtəlif dillərdə tanınır', () => {
  assert.deepStrictEqual(resolveDestinations('Анталья'), ['antalya']);
  assert.ok(resolveDestinations('gabala').includes('qabala'));
  assert.ok(resolveDestinations('Qəbələ').includes('qabala'));
});

test('nəticələr ən ucuzdan bahalıya sıralanır', async () => {
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(40), nights: 7, adults: 2 });
  assert.ok(r.groups.length > 0);
  for (let i = 1; i < r.groups.length; i++) assert.ok(r.groups[i - 1].best.price <= r.groups[i].best.price);
  for (const g of r.groups) assert.strictEqual(g.best.price, g.providers[0].price);
});

test('büdcə filtri tətbiq olunur', async () => {
  const r = await search({ q: 'Dubay', type: 'package', checkIn: future(40), nights: 5, adults: 2, maxPrice: 3000, flat: '1' });
  assert.ok(r.offers.every((o) => o.price <= 3000));
});

test('erkən rezervasiya uzaq tarixlərdə görünür', async () => {
  const r = await search({ q: 'Antalya', type: 'package', checkIn: future(150), nights: 7, adults: 2, earlyOnly: '1', flat: '1' });
  assert.ok(r.offers.length > 0 && r.offers.every((o) => o.earlyBooking && o.oldPrice > o.price));
});

test('daxili turlar və otellər', async () => {
  const h = await search({ q: 'Qəbələ', type: 'hotel', checkIn: future(20), nights: 2, adults: 2 });
  assert.ok(h.groups.length > 0);
  const p = await search({ q: 'Qəbələ', type: 'package', checkIn: future(20), nights: 2, adults: 2 });
  assert.strictEqual(p.groups.length, 0); // daxildə aviabiletli paket yoxdur
});

test('yanlış tarix xəta verir', async () => {
  await assert.rejects(() => search({ q: 'Antalya', checkIn: 'abc' }));
});
