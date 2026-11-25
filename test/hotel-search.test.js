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
