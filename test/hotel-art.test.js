const test = require('node:test');
const assert = require('node:assert');
const A = require('../public/js/hotel-art');
const { hotels, destinations } = require('../src/data/catalog');

const ALL_TAGS = ['Aquapark', 'Uşaq klubu', 'Öz çimərliyi', 'SPA', 'Hovuz'];

// Sadə, asılılıqsız XML yoxlaması: teqlər düzgün açılıb-bağlanır, atributlar dırnaqlıdır.
function assertWellFormed(svg) {
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" '), 'svg kök elementi');
  assert.ok(svg.endsWith('</svg>'));
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g;
  let pos = 0, m;
  while ((m = re.exec(svg))) {
    assert.strictEqual(svg.slice(pos, m.index).trim(), '', `teqlər arasında mətn olmamalıdır: ${svg.slice(pos, m.index).slice(0, 40)}`);
    pos = re.lastIndex;
    const [, close, name, , self] = m;
    if (close) assert.strictEqual(stack.pop(), name, `bağlanan teq uyğun deyil: ${name}`);
    else if (!self) stack.push(name);
  }
  assert.strictEqual(pos, svg.length, 'parse olunmayan hissə qalmamalıdır');
  assert.strictEqual(stack.length, 0, 'bütün teqlər bağlanmalıdır');
}

function assertSafe(svg) {
  assert.ok(!/<script/i.test(svg), '<script yoxdur');
  assert.ok(!/\son\w+\s*=/i.test(svg), 'on*= hadisə atributu yoxdur');
  assert.ok(!/javascript:/i.test(svg), 'javascript: yoxdur');
  assert.ok(!/<(foreignObject|iframe|image|a|style|text)\b/i.test(svg), 'qadağan elementlər yoxdur');
  // Yeganə URL svg xmlns-dir; href yalnız daxili (#id), url() yalnız daxili (#id)
  const urls = svg.match(/(https?:)?\/\/[^\s"')]+/g) || [];
  assert.deepStrictEqual(urls.filter((u) => u !== 'http://www.w3.org/2000/svg'), [], 'xarici URL yoxdur');
  for (const h of svg.match(/href="[^"]*"/g) || []) assert.match(h, /^href="#\w+"$/);
  for (const u of svg.match(/url\([^)]*\)/g) || []) assert.match(u, /^url\(#\w+\)$/);
  assert.ok(!/NaN|undefined|Infinity/.test(svg), 'hesablama xətası yoxdur');
}

test('hər kataloq oteli üçün 3 variant: etibarlı, təhlükəsiz, ölçü limitində', () => {
  assert.strictEqual(A.VARIANTS, 3);
  for (const h of hotels) {
    for (let v = 0; v < 3; v++) {
      const svg = A.hotelArt(h, v);
      assertWellFormed(svg);
      assertSafe(svg);
      assert.ok(Buffer.byteLength(svg) < 6144, `${h.id}/${v}: ${Buffer.byteLength(svg)} bayt (< 6KB)`);
    }
  }
});

test('deterministikdir: eyni giriş => eyni SVG; fərqli otel/variant => fərqli SVG', () => {
  const h = hotels[0];
  assert.strictEqual(A.hotelArt(h, 0), A.hotelArt({ ...h }, 0));
  assert.strictEqual(A.hotelArtUri(h, 1), A.hotelArtUri(h, 1));
  const set = new Set(hotels.map((x) => A.hotelArt(x, 0)));
  assert.strictEqual(set.size, hotels.length, 'hər otelin ümumi görünüşü fərqlidir');
  assert.notStrictEqual(A.hotelArt(h, 0), A.hotelArt(h, 1));
  assert.notStrictEqual(A.hotelArt(h, 1), A.hotelArt(h, 2));
  // variant mod 3, mənfi/qeyri-rəqəm təhlükəsiz
  assert.strictEqual(A.hotelArt(h, 3), A.hotelArt(h, 0));
  assert.strictEqual(A.hotelArt(h, -1), A.hotelArt(h, 2));
  assert.strictEqual(A.hotelArt(h, 'x'), A.hotelArt(h, 0));
});

test('ən ağır hallar (bütün tag-lar, 5★, çox id) də limitdədir', () => {
  for (const d of destinations) {
    for (let i = 0; i < 40; i++) {
      for (const stars of [3, 5]) {
        for (let v = 0; v < 3; v++) {
          const svg = A.hotelArt({ id: `${d.id}-z${i}`, destinationId: d.id, region: d.region, stars, tags: ALL_TAGS }, v);
          assert.ok(svg.length <= A.MAX_BYTES, `${d.id}-z${i}/${stars}/${v}: ${svg.length}`);
        }
      }
    }
  }
});

test('istiqamət → səhnə xəritəsi', () => {
  const scene = (id) => A.sceneFor({ id: `${id}-h1`, destinationId: id }).scene;
  for (const id of ['antalya', 'alanya', 'kemer', 'side', 'bodrum', 'sharm', 'maldives']) assert.strictEqual(scene(id), 'beach', id);
  for (const id of ['istanbul', 'dubai', 'baku', 'tbilisi']) assert.strictEqual(scene(id), 'city', id);
  for (const id of ['qabala', 'shahdag', 'sheki', 'batumi']) assert.strictEqual(scene(id), 'mountain', id);
  for (const id of ['lankaran', 'naftalan']) assert.strictEqual(scene(id), 'nature', id);
  // kataloqdakı hər istiqamət xəritədədir
  for (const d of destinations) assert.ok(A.DEST[d.id], d.id);
  // axtarış nəticəsi formatı (itemId + destination obyekti) da işləyir
  assert.strictEqual(A.sceneFor({ itemId: 'dubai-h2', destination: { id: 'dubai' } }).scene, 'city');
  // naməlum istiqamət: region-a görə ehtiyat
  assert.strictEqual(A.sceneFor({ id: 'x', destinationId: 'nowhere', region: 'domestic' }).scene, 'nature');
  assert.strictEqual(A.sceneFor({ id: 'x', destinationId: 'nowhere' }).scene, 'beach');
});

test('XSS: otel adı/tag/destinationId SVG-yə düşmür', () => {
  const evil = '"><script>alert(1)</script><img src=x onerror=alert(1)>';
  const h = { id: evil, name: evil, destinationId: evil, region: evil, stars: evil, tags: [evil, 'SPA'], images: [evil] };
  for (let v = 0; v < 3; v++) {
    const svg = A.hotelArt(h, v);
    assertWellFormed(svg);
    assertSafe(svg);
    assert.ok(!svg.includes('alert'));
    assert.ok(!A.hotelArtUri(h, v).includes('alert'));
  }
  // boş / null giriş
  assertWellFormed(A.hotelArt(null, 0));
  assertWellFormed(A.hotelArt({}, 2));
});

test('tag-lar səhnəyə təsir edir (Aquapark, SPA, Öz çimərliyi)', () => {
  const base = { id: 'antalya-test', destinationId: 'antalya', stars: 5, tags: [] };
  assert.notStrictEqual(A.hotelArt(base, 0), A.hotelArt({ ...base, tags: ['Aquapark'] }, 0));
  assert.notStrictEqual(A.hotelArt(base, 0), A.hotelArt({ ...base, tags: ['SPA'] }, 0));
  assert.notStrictEqual(A.hotelArt(base, 0), A.hotelArt({ ...base, tags: ['Öz çimərliyi'] }, 0));
  assert.notStrictEqual(A.hotelArt(base, 0), A.hotelArt({ ...base, stars: 3 }, 0));
});

test('hotelImage: real foto üstünlük, təhlükəli URL rədd, yoxdursa illüstrasiya', () => {
  const h = { id: 'kemer-h1', destinationId: 'kemer', stars: 4, tags: [], images: ['https://cdn.example.com/a.jpg', '/img/b.jpg', 'javascript:alert(1)'] };
  const a = A.hotelImage(h, 0);
  assert.strictEqual(a.real, true);
  assert.strictEqual(a.src, 'https://cdn.example.com/a.jpg');
  assert.ok(a.fallback.startsWith('data:image/svg+xml,'));
  assert.strictEqual(A.hotelImage(h, 1).src, '/img/b.jpg');
  const c = A.hotelImage(h, 2);
  assert.strictEqual(c.real, false);
  assert.ok(c.src.startsWith('data:image/svg+xml,'));
  assert.strictEqual(A.hotelImage({ id: 'x' }, 1).real, false);
  for (const bad of ['//evil.com/x.jpg', 'http://insecure/x.jpg', 'data:image/svg+xml,<svg onload=alert(1)>', ' /a b.jpg', '/x".jpg', 42, null]) {
    assert.strictEqual(A.safeImageUrl(bad), null, String(bad));
  }
});

test('data: URI etibarlı və decode olunanda eyni SVG-dir', () => {
  const h = hotels[5];
  const uri = A.hotelArtUri(h, 2);
  assert.ok(uri.startsWith('data:image/svg+xml,'));
  assert.ok(!/[\s"<>#]/.test(uri.slice(19).replace(/ /g, '')), 'URI-də escape olunmamış təhlükəli simvol yoxdur');
  assert.strictEqual(decodeURIComponent(uri.slice(19)).replace(/'/g, '"'), A.hotelArt(h, 2));
});
