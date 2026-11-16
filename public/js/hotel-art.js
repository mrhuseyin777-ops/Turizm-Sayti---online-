// TurTap — otel illüstrasiyaları (real foto olmayanda).
// Kənar resurs yoxdur, nəticə deterministikdir: eyni otel + variant => eyni SVG.
// TƏHLÜKƏSİZLİK: SVG yalnız bu fayldakı sabit fraqmentlərdən və hesablanmış rəqəmlərdən qurulur.
// Otelin adı, tag mətni və s. heç vaxt SVG-yə yazılmır — id yalnız hash üçün, destinationId yalnız
// ağ siyahı (DEST) açarı kimi, tags yalnız sabit sətirlərlə müqayisə üçün istifadə olunur.
// UMD: brauzerdə window.HotelArt (+ hotelArt, hotelImage), Node-da module.exports.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.HotelArt = api; root.hotelArt = api.hotelArt; root.hotelImage = api.hotelImage; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const W = 480, H = 320;
  const VARIANTS = 3;

  // İstiqamət → səhnə (s) + yerli motiv (k). Ağ siyahı: başqa dəyərlər SVG-yə düşmür.
  const DEST = {
    antalya: { s: 'beach', k: 'taurus' }, alanya: { s: 'beach', k: 'castle' }, kemer: { s: 'beach', k: 'pine' },
    side: { s: 'beach', k: 'ruins' }, bodrum: { s: 'beach', k: 'cubes' }, sharm: { s: 'beach', k: 'desert' },
    maldives: { s: 'beach', k: 'atoll' },
    istanbul: { s: 'city', k: 'domes' }, dubai: { s: 'city', k: 'towers' }, baku: { s: 'city', k: 'flames' },
    tbilisi: { s: 'city', k: 'oldtown' },
    qabala: { s: 'mountain', k: 'green' }, shahdag: { s: 'mountain', k: 'snow' }, sheki: { s: 'mountain', k: 'hills' },
    batumi: { s: 'mountain', k: 'coast' },
    lankaran: { s: 'nature', k: 'tea' }, naftalan: { s: 'nature', k: 'spa' },
  };

  // Günün vaxtı: s = göy (yuxarı, orta, üfüq), sea = dəniz, sun = günəş/ay, sy = günəşin hündürlüyü
  const TIMES = {
    morning: { s: ['#7dbbe6', '#bfdff0', '#ffe2c2'], sea: ['#78bcd6', '#2f7fa8'], sun: '#fff3d4', glow: '#ffe1b8', sy: 112, warm: 0.12, lit: 0 },
    day: { s: ['#3b8fd8', '#8cc8ee', '#d9f0fb'], sea: ['#3cb6cf', '#0f6c99'], sun: '#fffdf2', glow: '#fff', sy: 52, warm: 0, lit: 0 },
    sunset: { s: ['#2c2c68', '#b04f78', '#ffb466'], sea: ['#c9757c', '#33356f'], sun: '#ffe09a', glow: '#ff9a62', sy: 146, warm: 0.3, lit: 0.6 },
    night: { s: ['#0a1230', '#1d2b5e', '#46508a'], sea: ['#2a3768', '#0b1431'], sun: '#f3f0dc', glow: '#7f93e0', sy: 64, warm: 0, lit: 1 },
  };
  const FACADES = ['#f7f2e9', '#f2e8d9', '#eef1f3', '#f6ece3', '#e9e2d5'];
  const ACCENTS = ['#e76f51', '#2a9d8f', '#e9a23b', '#d1495b', '#3d6fb6', '#00a19a', '#ef8354', '#8e5bb5'];
  const WALLS = ['#efe6da', '#e6ebee', '#f0e3d6', '#e3e8df', '#ece4ef'];
  const INK = { beach: '#24584a', desert: '#8a4a32', city: '#1b2442', mountain: '#1f4b3d', nature: '#2f5d33' };

  // ---- yardımçılar
  function fnv(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const n = (v) => Math.round(v);
  const rgb = (c) => (c.length === 4 ? [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  function mix(a, b, t) {
    const x = rgb(a), y = rgb(b);
    return '#' + x.map((v, i) => n(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  const path = (d, fill, extra) => `<path d="${d}" fill="${fill}"${extra || ''}/>`;
  const rect = (x, y, w, h, fill, extra) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"${extra || ''}/>`;
  const circ = (x, y, r, fill, extra) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"${extra || ''}/>`;
  // <use>: miqyas 1 olanda qısa x/y forması
  const use = (id, x, y, s, fill, flip) => `<use href="#${id}" ${s === 1 && !flip ? `x="${n(x)}" y="${n(y)}"` : `transform="translate(${n(x)} ${n(y)}) scale(${flip ? -s.toFixed(2) : s.toFixed(2)} ${s.toFixed(2)})"`}${fill ? ` fill="${fill}"` : ''}/>`;

  // Dağ silsiləsi (iti zirvələr). Zirvələri (qar papaqları üçün) və kölgəli yamacları da qaytarır.
  function ridge(R, x0, x1, base, lo, hi, step) {
    let d = `M${x0} ${H}L${x0} ${n(base - lo * R())}`, sh = '';
    const peaks = [];
    for (let x = x0 + step * (0.4 + R() * 0.4); x < x1; x += step * (0.7 + R() * 0.6)) {
      const py = n(base - lo - (hi - lo) * (0.45 + R() * 0.55)), vx = n(x + step * 0.45), vy = n(base - lo * (0.6 + R()));
      peaks.push([n(x), py]);
      d += `L${n(x)} ${py}L${vx} ${vy}`;
      sh += `M${n(x)} ${py}L${vx} ${vy}L${n(x + step * 0.1)} ${vy + 6}z`;
    }
    return { d: d + `L${x1} ${n(base - lo * R())}L${x1} ${H}Z`, peaks, sh };
  }
  // silsilə + kölgə bir çağırışda
  function mount(r, fill) { return path(r.d, fill) + path(r.sh, mix(fill, '#000', 0.13)); }
  function snowCaps(peaks, fill, size) {
    return peaks.map(([x, y]) => {
      const s = size;
      return `M${x} ${y}l${n(s * 0.75)} ${n(s)}l-${n(s * 0.3)} -${n(s * 0.3)}l-${n(s * 0.25)} ${n(s * 0.35)}l-${n(s * 0.3)} -${n(s * 0.4)}l-${n(s * 0.3)} ${n(s * 0.3)}z`;
    }).join('').replace(/^/, `<path fill="${fill}" d="`) + '"/>';
  }
  // Yumşaq təpələr (kvadratik əyrilər)
  function hills(R, base, amp, seg) {
    const w = W / seg;
    let d = `M0 ${H}L0 ${n(base - amp * R())}`;
    for (let i = 0; i < seg; i++) d += `Q${n(w * i + w / 2)} ${n(base - amp * (0.6 + R() * 0.8))} ${n(w * (i + 1))} ${n(base - amp * R() * 0.6)}`;
    return d + `L${W} ${H}Z`;
  }
  // iki ölçülü bulud simvolu (k kiçik, K böyük) — x/y ilə, transform-suz
  function cloud(c, x, y, big, fill, op) {
    return `<use href="#${c.p}${big ? 'K' : 'k'}" x="${n(x)}" y="${n(y)}" fill="${fill}" opacity="${op}"/>`;
  }

  // Ağaclar bir path-da: nisbi əmrlər miqyaslanır (hər ağac üçün ayrıca <use> lazım deyil)
  const TREE = {
    t: 'm0-44l11 16h-5l10 13h-6l11 14h-42l11-14h-6l10-13h-5zm-2 43h4v6h-4z',
    r: 'm-2 0h4v-12h-4zm2-2c-12 0-16-8-12-15c-3-8 5-15 12-13c7-2 15 5 12 13c4 7 0 15-12 15z',
  };
  function trees(kind, list, fill) {
    const d = list.map(([x, y, s]) => `M${n(x)} ${n(y)}` + TREE[kind].replace(/-?\d+/g, (v) => n(v * s))).join('');
    return path(d, fill);
  }

  // ---- defs: göy, dəniz, işıq, simvollar
  function defs(c) {
    const T = c.T, p = c.p;
    let d = `<linearGradient id="${p}a" x1="0" y1="0" x2="0" y2="${c.hz}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${T.s[0]}"/><stop offset=".6" stop-color="${T.s[1]}"/><stop offset="1" stop-color="${T.s[2]}"/></linearGradient>`
      + `<linearGradient id="${p}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sea[0]}"/><stop offset="1" stop-color="${T.sea[1]}"/></linearGradient>`
      + `<radialGradient id="${p}g"><stop offset="0" stop-color="${T.glow}" stop-opacity=".75"/><stop offset="1" stop-color="${T.glow}" stop-opacity="0"/></radialGradient>`
      + `<path id="${p}k" d="M0 0h56c0-7-6-11-13-9c-2-9-14-12-21-6c-6-5-16 0-14 7c-5-1-8 3-8 8z"/><path id="${p}K" d="M0 0h84c0-11-10-17-19-13c-4-13-22-18-33-8c-10-7-24 0-21 11c-7-1-11 5-11 10z"/>`
      + `<linearGradient id="${p}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0e6"/><stop offset="1" stop-color="#1aa3c4"/></linearGradient>`;
    if (c.need.palm) {
      d += `<path id="${p}f" d="M0 0c-12-12-32-13-46 2c4-3 9-4 13-3c-4 1-7 4-9 7c6-5 13-6 20-5c-3 2-5 4-6 7c8-6 18-8 28-8z"/>`
        + `<g id="${p}P"><path d="M-3 0c-2-30 2-58 10-84l4 1c-7 26-9 52-7 83z" fill="${c.trunk}"/><g fill="${c.leaf}" transform="translate(9 -84)">`
        + [-18, 14, 48].map((a) => `<use href="#${p}f" transform="rotate(${a})"/><use href="#${p}f" transform="scale(-1 1) rotate(${a + 6})"/>`).join('')
        + `</g></g>`;
    }
    if (c.need.bed) d += `<g id="${p}s"><path d="M3-2v6M27-2v6" stroke="#6f6a64" stroke-width="2"/><path d="M0-6h26l8-12 4 2-8 13H0z"/><path d="M0-3h28" stroke="#fff" opacity=".5"/></g>`;
    if (c.need.umb) d += `<g id="${p}u"><path d="M-1 0h2v-27h-2z" fill="#7b5a40"/><path d="M-19-24q19-13 38 0q-6-3-12.6 0q-6.4-3-12.8 0q-6.6-3-12.6 0z"/></g>`;
    return `<defs>${d}</defs>`;
  }

  // Göy: fon, günəş/ay, buludlar, ulduzlar
  function sky(c) {
    const T = c.T, R = c.R;
    let o = rect(0, 0, W, H, `url(#${c.p}a)`);
    const sx = c.sunX, sy = T.sy;
    o += circ(sx, sy, 120, `url(#${c.p}g)`);
    if (c.tod === 'night') {
      let st = '';
      for (let i = 0; i < 26 - c.lite * 10; i++) st += `M${n(R() * W)} ${n(R() * c.hz * 0.7)}h1.6v1.6h-1.6z`;
      o += path(st, '#fff', ' opacity=".7"') + circ(sx, sy, 15, T.sun) + circ(sx + 6, sy - 4, 13, T.s[1]);
    } else {
      o += circ(sx, sy, c.tod === 'day' ? 18 : 24, T.sun);
      const cf = c.tod === 'sunset' ? '#ffc6b0' : '#fff';
      const k = c.lite ? 1 : 2 + (R() * 2 | 0);
      for (let i = 0; i < k; i++) o += cloud(c, 30 + R() * 380, 30 + R() * (c.hz * 0.35), i % 2, cf, c.tod === 'sunset' ? '.45' : '.8');
    }
    return o;
  }

  // Su: dəniz zolağı + günəş parıltısı
  function sea(c, y0) {
    const R = c.R;
    let o = rect(0, y0, W, H - y0, `url(#${c.p}b)`);
    let g = '';
    for (let i = 0; i < 7 - c.lite * 2; i++) {
      const y = y0 + 4 + i * i * 2.4, w = 14 + i * 7 + R() * 10;
      g += `M${n(c.sunX - w / 2 + (R() - 0.5) * 16)} ${n(y)}h${n(w)}`;
    }
    o += path(g, 'none', ` stroke="${c.T.glow}" stroke-width="2" stroke-linecap="round" opacity=".55"`);
    let wv = '';
    for (let i = 0; i < 4 - c.lite * 2; i++) wv += `M${n(R() * 420)} ${n(y0 + 14 + R() * (H - y0 - 20))}q6-3 12 0q6 3 12 0`;
    return o + path(wv, 'none', ` stroke="#fff" stroke-width="1.4" opacity=".35"`);
  }

  // Müasir otel binası. Pəncərə şəbəkəsi 2 xətt ilə: şaquli kəsikli xətt (mərtəbələr) +
  // üfüqi kəsikli "divar" xətti (sütunlar) — hər mərtəbəyə ayrıca element lazım deyil.
  function tower(c, x, base, w, floors, opt) {
    opt = opt || {};
    const fh = opt.fh || 11, h = floors * fh, top = base - h, dp = opt.depth || 14;
    const face = opt.face || c.facade, glass = opt.glass || c.glass;
    const cx = n(x + w / 2), wh = n(fh * 0.5), y0 = n(top + fh * 0.22);
    let o = rect(x + w, top + 4, dp, h - 4, mix(face, c.ink, 0.28)) + rect(x, top, w, h, face);
    o += path(`M${cx} ${y0}V${base - 2}`, 'none', ` stroke="${glass}" stroke-width="${n(w - 8)}" stroke-dasharray="${wh} ${fh - wh}"`);
    if (c.T.lit) o += path(`M${n(x + w * 0.3)} ${y0 + fh}V${base}M${n(x + w * 0.7)} ${y0}V${base}`, 'none', ` stroke="#ffd27c" stroke-width="${n(w * 0.24)}" stroke-dasharray="${wh} ${2 * fh - wh} ${wh} ${3 * fh - wh}" opacity="${c.T.lit}"`);
    o += path(`M${n(x)} ${n(top + h / 2)}h${n(w)}`, 'none', ` stroke="${face}" stroke-width="${n(h)}" stroke-dasharray="${opt.col || '5 7'}"`);
    if (!opt.noRail) o += path(`M${cx} ${y0 + wh + 1}V${base}`, 'none', ` stroke="${opt.rail || '#fff'}" stroke-width="${n(w - 4)}" stroke-dasharray="2 ${fh - 2}" opacity=".9"`);
    o += rect(x - 3, top - 4, w + dp + 3, 5, mix(face, c.ink, 0.45));
    return o;
  }

  // Aquapark su təpəsi (qüllə + borular)
  function slide(c, x, base, s) {
    const a = c.accent, b = '#ffcf3f', k = '#2f8fd8';
    const t = `transform="translate(${n(x)} ${n(base)}) scale(${s.toFixed(2)})"`;
    return `<g ${t}><path d="M-4 0v-92h8v92zM-14-92h28v6h-28z" fill="#e8edf2"/>`
      + `<path d="M8-88c40 6 44 30 10 38c-30 7-26 30 14 34c14 1 22 6 22 16" fill="none" stroke="${a}" stroke-width="9" stroke-linecap="round"/>`
      + `<path d="M-8-86c-36 10-30 34 0 40c24 5 18 26-14 32c-12 2-18 8-18 14" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/>`
      + `<path d="M0-60c22 0 30 18 6 28" fill="none" stroke="${k}" stroke-width="7" stroke-linecap="round"/></g>`;
  }
  // SPA emblemi (lotus) — binanın lövhəsi kimi, mətnsiz
  function spaMark(x, y, s, fill) {
    return `<g transform="translate(${n(x)} ${n(y)}) scale(${s.toFixed(2)})"><circle r="11" fill="${fill}"/><path d="M0 5c-3-3-4-8 0-13c4 5 3 10 0 13zM0 5c-5 0-9-3-10-7c4-1 8 1 10 7zM0 5c5 0 9-3 10-7c-4-1-8 1-10 7z" fill="#fff"/></g>`;
  }

  // Şezlong + çətir sırası
  function loungers(c, x0, x1, y, s, umbrellas) {
    let o = '';
    const step = 50 * s * (1 + c.lite * 0.35);
    for (let x = x0, i = 0; x < x1; x += step, i++) {
      if (umbrellas) o += use(c.p + 'u', x + 16 * s, y - 4, s, i % 2 ? c.accent2 : c.accent);
      o += use(c.p + 's', x, y, s, i % 2 && !umbrellas ? c.accent2 : c.accent);
    }
    return o;
  }

  // ===================== SƏHNƏLƏR: ümumi görünüş (variant 0)
  function beach0(c) {
    const R = c.R, hz = c.hz;
    let o = sky(c);
    // fon motivi
    if (c.k === 'atoll') {
      o += path(`M300 ${hz}q30-10 60 0z`, mix(c.T.s[2], c.ink, 0.5));
    } else {
      const far = ridge(R, 120, W, hz, 14, c.k === 'desert' ? 62 : 78, 58);
      o += mount(far, mix(c.T.s[2], c.ink, 0.25));
      const mid = ridge(R, 210, W, hz, 10, 46, 48);
      o += mount(mid, mix(c.T.s[2], c.ink, 0.45));
      if (c.k === 'castle') o += path(`M330 ${hz - 40}h86v-7h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-6v4h-6v-4h-4zM390 ${hz - 47}v-16h10v16z`, mix(c.T.s[2], c.ink, 0.6));
      if (c.k === 'cubes') { let q = ''; for (let i = 0; i < 7 - c.lite * 3; i++) q += `M${n(250 + R() * 220)} ${n(hz - 8 - R() * 30)}h9v6h-9z`; o += path(q, '#fbfbf7'); }
    }
    o += sea(c, hz);
    if (c.k !== 'atoll') o += path(`M${n(60 + R() * 120)} ${hz + 10}l9-16v16zm-10 2h20l-3 3h-15z`, '#fff', ' opacity=".9"');
    // quru: təpə və qum
    const land = mix(c.green, c.ink, 0.15);
    o += path(`M180 ${H}C200 ${hz + 60} 230 ${hz + 34} 290 ${hz + 30}L${W} ${hz + 24}V${H}Z`, land);
    if (c.k === 'atoll') return o + atoll(c);
    // otel
    const base = hz + 40, w = 64 + c.stars * 12, x = 262;
    if (c.aqua) o += slide(c, 238, base + 10, 0.55);
    if (c.stars >= 5) o += rect(x + w, base - 40, 64, 40, mix(c.facade, c.ink, 0.12)) + path(`M${x + w + 18} ${base - 30}h42M${x + w + 18} ${base - 16}h42`, 'none', ` stroke="${c.glass}" stroke-width="7" stroke-dasharray="8 5"`);
    o += tower(c, x, base, w, 3 + c.stars * 2);
    if (c.stars >= 5) o += path(`M${x - 2} ${base - (3 + c.stars * 2) * 11 - 4}q${n(w / 2 + 8)}-18 ${n(w + 17)} 0z`, mix(c.facade, c.ink, 0.4));
    if (c.spa) o += spaMark(x + w / 2, base - 8, 0.8, c.accent);
    // kollar
    let b = '';
    for (let i = 0; i < 7; i++) b += `M${n(222 + i * 38)} ${base + 4}a${n(18 + R() * 8)} 11 0 0 1 38 0z`;
    o += path(b, mix(c.green, c.ink, 0.4));
    // qum və köpük
    const sand = c.sand;
    o += path(`M90 ${H}C150 ${hz + 96} 230 ${hz + 66} 320 ${hz + 60}L${W} ${hz + 54}V${H}Z`, sand);
    o += path(`M86 ${H}C146 ${hz + 94} 226 ${hz + 64} 316 ${hz + 58}L${W} ${hz + 52}`, 'none', ` stroke="#fff" stroke-width="3" opacity=".85"`);
    o += path(`M60 ${H - 4}C126 ${hz + 96} 210 ${hz + 74} 300 ${hz + 66}`, 'none', ` stroke="#fff" stroke-width="1.5" opacity=".45"`);
    if (c.beach) o += loungers(c, 214, 450, hz + 116, 1, true);
    // palmalar
    const palms = c.lite ? 2 : 2 + (c.stars >= 4) + (R() * 2 | 0);
    for (let i = 0; i < palms; i++) {
      const px = 205 + R() * 260, s = 0.65 + R() * 0.55;
      o += use(c.p + 'P', px, hz + 76 + s * 40, s, null, R() > 0.5);
    }
    return o;
  }
  function atoll(c) {
    const R = c.R, hz = c.hz;
    let o = path(`M0 ${hz + 70}C120 ${hz + 60} 300 ${hz + 64} ${W} ${hz + 58}V${H}H0Z`, '#5fd6d8', ' opacity=".55"');
    // su üstü villalar
    let pier = `M40 ${hz + 66}H${W}`;
    let v = '';
    const k = 3 + c.stars;
    for (let i = 0; i < k; i++) {
      const x = 30 + i * (420 / k), y = hz + 46 + (i % 2) * 4;
      v += rect(x, y, 30, 12, mix(c.facade, '#c8a27a', 0.35)) + path(`M${n(x - 4)} ${y}l19-14 19 14z`, '#b07a4a') + rect(x + 11, y + 4, 8, 8, c.glass);
      pier += `M${n(x + 4)} ${y + 12}v14M${n(x + 26)} ${y + 12}v14`;
    }
    o += path(pier, 'none', ' stroke="#8a6142" stroke-width="2.5"') + v;
    o += path(`M110 ${H}C180 ${hz + 108} 300 ${hz + 100} ${W} ${hz + 106}V${H}Z`, c.sand);
    for (let i = 0; i < 3; i++) o += use(c.p + 'P', 300 + i * 60 + R() * 20, hz + 120 + i * 8, 0.8 + R() * 0.3, null, i % 2);
    return o + (c.beach ? loungers(c, 150, 300, H - 16, 1, true) : '');
  }

  function city0(c) {
    const R = c.R, hz = c.hz;
    let o = sky(c);
    const far = mix(c.T.s[2], c.ink, 0.3), near = mix(c.T.s[2], c.ink, 0.6);
    const water = c.k !== 'towers';
    if (c.k === 'towers') {
      let f = '', m = '';
      for (let x = 0; x < W; x += 16 + R() * 16) { const h = 30 + R() * 70; f += `M${n(x)} ${hz}v-${n(h)}h${n(10 + R() * 8)}v${n(h)}z`; }
      for (let x = 10; x < W; x += 30 + R() * 30) { const h = 50 + R() * 90, w = 14 + R() * 12; m += `M${n(x)} ${hz}v-${n(h)}l${n(w / 2)}-${n(10 + R() * 14)}l${n(w / 2)} ${n(10 + R() * 8)}v${n(h)}z`; }
      // super hündür qüllə (ümumi, pilləli)
      const sx = 120;
      m += `M${sx} ${hz}v-120h6v-40h4v-34h3v-30h1v-10h1v10h1v30h3v34h4v40h6v120z`;
      o += path(f, far) + path(m, near);
      o += rect(0, hz, W, H - hz, mix(c.sand, c.ink, 0.1));
      o += path(`M0 ${hz + 24}H${W}`, 'none', ` stroke="${mix(c.sand, c.ink, 0.3)}" stroke-width="10"`);
    } else if (c.k === 'domes') {
      let f = path(hills(R, hz - 6, 20, 4), far);
      let m = '';
      const mosque = (x, s) => {
        const r = 20 * s;
        m += `M${n(x - r * 1.6)} ${hz}v-${n(r * 0.9)}h${n(r * 3.2)}v${n(r * 0.9)}z`;
        m += `M${n(x - r)} ${n(hz - r * 0.9)}a${n(r)} ${n(r)} 0 0 1 ${n(2 * r)} 0z`;
        m += `M${n(x - r * 1.6)} ${n(hz - r * 0.9)}a${n(r * 0.6)} ${n(r * 0.55)} 0 0 1 ${n(r * 1.1)} 0zM${n(x + r * 0.5)} ${n(hz - r * 0.9)}a${n(r * 0.6)} ${n(r * 0.55)} 0 0 1 ${n(r * 1.1)} 0z`;
        m += `M${n(x)} ${n(hz - r * 1.9)}v-${n(r * 0.3)}h1v${n(r * 0.3)}z`;
        for (const dx of [-2.2, 2.1]) m += `M${n(x + dx * r)} ${hz}v-${n(r * 2.6)}l2-${n(r * 0.6)}l2 ${n(r * 0.6)}v${n(r * 2.6)}z`;
      };
      mosque(110, 1.15); mosque(300, 0.8);
      m += `M200 ${hz}v-44l7-12 7 12v44z`; // qüllə
      for (let x = 0; x < W; x += 18 + R() * 12) if (x < 60 || (x > 160 && x < 240) || x > 360) { const h = 8 + R() * 18; m += `M${n(x)} ${hz}v-${n(h)}h${n(14)}v${n(h)}z`; }
      o += f + path(m, near);
    } else if (c.k === 'flames') {
      o += path(hills(R, hz - 4, 26, 3), far);
      let m = '';
      const flame = (x, h, w) => { m += `M${n(x)} ${hz - 30}c${n(-w * 0.2)}-${n(h * 0.4)} ${n(w * 0.3)}-${n(h * 0.8)} ${n(w * 0.55)}-${n(h)}c${n(w * 0.2)} ${n(h * 0.35)} ${n(w * 0.45)} ${n(h * 0.65)} ${n(w * 0.45)} ${n(h)}z`; };
      flame(170, 96, 30); flame(206, 112, 32); flame(244, 90, 30);
      m += `M140 ${hz}v-34h150v34z`;
      for (let x = 0; x < W; x += 20 + R() * 14) if (x < 130 || x > 300) { const h = 10 + R() * 30; m += `M${n(x)} ${hz}v-${n(h)}h16v${n(h)}z`; }
      m += `M360 ${hz}v-40a10 10 0 0 1 20 0v40z`; // qala qülləsi
      o += path(m, near);
      if (c.T.lit) o += path(`M174 ${hz - 40}l10-70M211 ${hz - 40}l10-84M248 ${hz - 40}l10-66`, 'none', ` stroke="#ffb35c" stroke-width="3" opacity=".7"`);
    } else { // oldtown
      o += path(hills(R, hz - 20, 50, 3), far);
      let m = path(`M300 ${hz - 40}l8-6h40l8 6v-14h-6v5h-6v-5h-6v5h-6v-5h-6v5h-6v-5h-6v5h-6v-5h-6v14z`, near);
      let hs = '', roofs = '';
      for (let x = 0; x < W; x += 24 + R() * 10) {
        const y = hz - 4 - Math.abs(Math.sin(x / 70)) * 26, h = 16 + R() * 14;
        hs += `M${n(x)} ${n(y + 30)}v-${n(h)}h22v${n(h)}z`;
        roofs += `M${n(x - 2)} ${n(y + 30 - h)}l13-8 13 8z`;
      }
      o += m + path(hs, mix(c.facade, near, 0.25)) + path(roofs, '#b4553a');
      o += path(`M40 ${hz - 70}L330 ${hz - 44}`, 'none', ` stroke="${near}" stroke-width="1"`) + rect(160, hz - 62, 10, 7, c.accent);
    }
    if (water) o += sea(c, hz + 8);
    // ön planda otel qülləsi
    const w = 56 + c.stars * 8, floors = 6 + c.stars * 3, base = H - 22, x = 300;
    const gl = mix(c.T.s[1], '#1c2c4c', 0.45);
    o += tower(c, x, base, w, floors, { fh: 10, face: mix(gl, '#fff', 0.15), glass: mix(gl, '#0a1530', 0.35), noRail: true, depth: 18 });
    if (c.stars >= 5) o += path(`M${x} ${base - floors * 10 - 4}l${n(w / 2)}-${26}l${n(w / 2 + 18)} ${26}z`, mix(gl, c.ink, 0.3));
    if (c.spa) o += spaMark(x + w / 2, base - 12, 0.8, c.accent);
    if (c.aqua) o += slide(c, 410, base + 8, 0.5);
    o += rect(0, base, W, H - base, mix(c.ink, '#000', 0.2));
    if (c.k === 'towers' || c.k === 'flames') for (let i = 0; i < 4; i++) o += use(c.p + 'P', 30 + i * 70 + R() * 20, base + 4, 0.6 + R() * 0.2, null, i % 2);
    let lamps = '';
    for (let x = 12; x < W; x += 40) lamps += `M${x} ${base}v-16h6`;
    return o + path(lamps, 'none', ` stroke="${mix(c.ink, '#000', 0.3)}" stroke-width="2"`) + (c.T.lit ? path(lamps.replace(/v-16h6/g, 'm6-16h1'), 'none', ' stroke="#ffd27c" stroke-width="4" stroke-linecap="round"') : '');
  }

  function mountain0(c) {
    const R = c.R, hz = c.hz;
    let o = sky(c);
    const snow = c.k === 'snow';
    const f = ridge(R, 0, W, hz - 10, 20, 120, 82);
    o += mount(f, mix(c.T.s[2], c.ink, 0.25)) + snowCaps(f.peaks, mix('#fff', c.T.s[2], 0.25), 26);
    if (c.k === 'hills') o += path(hills(R, hz + 10, 40, 3), mix(c.T.s[2], c.green, 0.6));
    else {
      const m = ridge(R, 0, W, hz + 12, 16, 70, 68);
      o += mount(m, mix(c.T.s[2], c.ink, 0.5)) + (snow ? snowCaps(m.peaks, '#f4f8fb', 22) : '');
    }
    if (c.k === 'coast') o += sea(c, hz + 40);
    // kanat yolu
    if (c.k === 'green' || snow) {
      o += path(`M20 ${hz + 70}L470 ${hz - 70}`, 'none', ` stroke="${mix(c.ink, '#000', 0.3)}" stroke-width="1.2"`);
      for (const t of [0.3, 0.68]) {
        const x = 20 + 450 * t, y = hz + 70 - 140 * t;
        o += path(`M${n(x)} ${n(y)}v8`, 'none', ` stroke="${mix(c.ink, '#000', 0.3)}"`) + rect(x - 6, y + 8, 12, 10, c.accent, ' rx="2"') + rect(x - 4, y + 10, 8, 4, '#dff2ff');
      }
    }
    // çəmən / qar
    const ground = snow ? '#eef4f8' : mix(c.green, c.ink, 0.05);
    o += path(hills(R, hz + 72, 16, 2), ground);
    if (c.k === 'coast') o += path(`M0 ${H}V${hz + 74}C80 ${hz + 64} 160 ${hz + 70} 230 ${hz + 66}V${H}Z`, c.sand);
    // meşə
    const treeFill = snow ? '#2c5a4a' : mix(c.green, c.ink, 0.55);
    const sym = c.k === 'hills' ? 'r' : 't';
    const fz = mix(treeFill, c.T.s[2], 0.2);
    if (sym === 't') o += path(hills(R, hz + 70, 7, 16), mix(fz, c.T.s[2], 0.15));
    const fl1 = [];
    for (let i = 0; i < (c.k === 'coast' ? 0 : 10 - c.lite * 3); i++) fl1.push([R() * W, hz + 68 + R() * 12, 0.5 + R() * 0.3]);
    o += trees(sym, fl1, fz);
    if (c.k === 'coast') { // Batumi: dəniz kənarında müasir qüllə, arxada yaşıl dağlar
      const w = 60 + c.stars * 8, base = H - 30, x = 236;
      if (c.aqua) o += slide(c, x - 34, base + 4, 0.5);
      o += tower(c, x, base, w, 5 + c.stars * 2);
      if (c.spa) o += spaMark(x + w / 2, base - 8, 0.8, c.accent);
      o += path(hills(R, H - 20, 8, 3), mix(c.green, c.ink, 0.25));
      for (let i = 0; i < 3; i++) o += use(c.p + 'P', 190 + i * 110 + R() * 30, H - 4, 0.8 + R() * 0.3, null, i % 2);
      return o;
    }
    // otel: şale/kurort
    const x = 196, base = H - 40, w = 70 + c.stars * 14, fl = c.stars - 1;
    const wall = c.k === 'hills' ? '#e9dcc6' : c.facade, wood = '#8a5a3c';
    const roof = snow ? '#f4f7fa' : c.k === 'hills' ? '#a64b34' : '#5b4033';
    o += rect(x, base - fl * 16, w, fl * 16, wall) + rect(x, base - 10, w, 10, wood);
    let win = '';
    for (let i = 0; i < fl; i++) win += `M${x + 8} ${base - fl * 16 + 8 + i * 16}h${w - 14}`;
    o += path(win, 'none', ` stroke="${c.T.lit ? '#ffd27c' : c.glass}" stroke-width="8" stroke-dasharray="${c.k === 'hills' ? '8 6' : '12 6'}"`);
    if (c.k === 'hills') o += path(win.replace(/M(\d+) (\d+)/g, (s, a, b) => `M${a} ${b - 4}`), 'none', ` stroke="${wall}" stroke-width="3" stroke-dasharray="1 6 7 0" stroke-linecap="round"`);
    const top = base - fl * 16;
    o += path(`M${x - 10} ${top}L${x + w / 2} ${top - 34}L${x + w + 10} ${top}z`, roof) + path(`M${x - 10} ${top}L${x + w / 2} ${top - 34}L${x + w + 10} ${top}`, 'none', ` stroke="${wood}" stroke-width="3"`);
    if (c.stars >= 4) o += rect(x + w, base - 32, 52, 32, wall) + path(`M${x + w - 4} ${base - 32}l30-20 30 20z`, roof) + path(`M${x + w + 8} ${base - 18}h30`, 'none', ` stroke="${c.T.lit ? '#ffd27c' : c.glass}" stroke-width="8" stroke-dasharray="9 5"`);
    if (c.stars >= 5) o += rect(x - 46, base - 28, 46, 28, wall) + path(`M${x - 50} ${base - 28}l27-18 27 18z`, roof);
    if (c.spa) o += spaMark(x + w / 2, top - 12, 0.7, c.accent);
    if (c.aqua) o += slide(c, x - 70, base + 6, 0.45);
    o += path(hills(R, H - 22, 10, 3), mix(ground, c.ink, snow ? 0.08 : 0.2));
    const fl2 = [];
    for (let i = 0; i < 5; i++) fl2.push([i < 2 ? 20 + i * 60 + R() * 30 : 360 + (i - 2) * 40 + R() * 20, H - 8, 0.8 + R() * 0.4]);
    o += trees(sym, fl2, treeFill);
    return o;
  }

  function nature0(c) {
    const R = c.R, hz = c.hz;
    let o = sky(c);
    o += path(hills(R, hz - 6, 40, 3), mix(c.T.s[2], c.ink, 0.3));
    o += path(hills(R, hz + 18, 34, 4), mix(c.T.s[2], c.green, 0.7));
    // göl / çay
    o += path(`M0 ${hz + 44}C120 ${hz + 34} 260 ${hz + 52} ${W} ${hz + 40}V${hz + 72}C300 ${hz + 84} 140 ${hz + 66} 0 ${hz + 78}Z`, `url(#${c.p}b)`);
    // ön təpə: çay plantasiyası sıraları
    const front = mix(c.green, '#9ccf6a', 0.25);
    o += path(`M0 ${H}V${hz + 96}C140 ${hz + 70} 320 ${hz + 86} ${W} ${hz + 74}V${H}Z`, front);
    if (c.k === 'tea') {
      let rows = '';
      for (let i = 0; i < 7; i++) { const y = hz + 100 + i * 14; rows += `M-10 ${y + 10}C140 ${y - 12} 320 ${y + 4} 490 ${y - 8}`; }
      o += path(rows, 'none', ` stroke="${mix(front, c.ink, 0.35)}" stroke-width="7" stroke-linecap="round"`);
    }
    const tl = [];
    for (let i = 0; i < 12; i++) tl.push([R() * W, hz + 40 + R() * 6, 0.7 + R() * 0.5]);
    o += trees('r', tl, mix(c.green, c.ink, 0.45));
    // aşağı mərtəbəli kurort binası, terrakota dam
    const x = 150, base = hz + 92, w = 120 + c.stars * 16, fl = Math.max(2, c.stars - 1);
    const wall = c.facade, roof = '#b55a3c';
    o += rect(x, base - fl * 15, w, fl * 15, wall);
    let win = '';
    for (let i = 0; i < fl; i++) win += `M${x + 8} ${base - fl * 15 + 7 + i * 15}h${w - 12}`;
    o += path(win, 'none', ` stroke="${c.T.lit ? '#ffd27c' : c.glass}" stroke-width="7" stroke-dasharray="${c.k === 'spa' ? '4 4 4 10' : '9 6'}"`);
    if (c.k === 'spa') { let col = ''; for (let i = 0; i <= 8; i++) col += `M${n(x + 4 + i * (w - 8) / 8)} ${base}v-14`; o += path(col, 'none', ` stroke="#fff" stroke-width="3"`) + rect(x - 4, base - 17, w + 8, 4, mix(wall, c.ink, 0.2)); }
    o += path(`M${x - 8} ${base - fl * 15}l14-14h${w - 12}l14 14z`, roof);
    if (c.stars >= 5) o += rect(x + w / 2 - 20, base - fl * 15 - 26, 40, 14, wall) + path(`M${x + w / 2 - 26} ${base - fl * 15 - 26}l26-14 26 14z`, roof);
    if (c.spa) o += spaMark(x + w / 2, base - fl * 15 - (c.stars >= 5 ? 42 : 24), 0.7, c.accent);
    if (c.aqua) o += slide(c, x + w + 40, base + 4, 0.45);
    o += trees('r', [[30, H - 6, 1.4], [90, H - 4, 1.2], [400, H - 6, 1.5], [450, H - 2, 1.3]], mix(c.green, c.ink, 0.5));
    return o;
  }

  // ===================== variant 1: hovuz / çimərlik
  function pool1(c) {
    const R = c.R, hz = c.hz;
    let o = sky(c);
    // fon
    if (c.s === 'beach' || c.k === 'coast') o += sea(c, hz);
    else if (c.s === 'city') {
      let m = '';
      for (let x = 0; x < W; x += 18 + R() * 16) { const h = 20 + R() * (c.k === 'towers' ? 110 : 50); m += `M${n(x)} ${hz}v-${n(h)}h${n(12 + R() * 6)}v${n(h)}z`; }
      if (c.k === 'domes') m += `M200 ${hz - 20}a26 26 0 0 1 52 0zM180 ${hz}v-60l2-8 2 8v60zM268 ${hz}v-60l2-8 2 8v60zM196 ${hz}v-20h60v20z`;
      if (c.k === 'flames') m += `M180 ${hz}c-6-30 4-60 14-80c8 20 14 50 12 80zM214 ${hz}c-6-36 4-70 14-92c8 24 14 58 12 92zM248 ${hz}c-6-26 4-52 14-70c8 18 14 44 12 70z`;
      o += path(m, mix(c.T.s[2], c.ink, 0.45));
      if (c.T.lit) o += path(m.replace(/z/g, 'z'), 'none', ` stroke="#ffd27c" stroke-width="2" stroke-dasharray="2 9" opacity=".7"`);
    } else {
      if (c.s === 'mountain') {
        const f = ridge(R, 0, W, hz, 20, 100, 70);
        o += mount(f, mix(c.T.s[2], c.ink, 0.3)) + snowCaps(f.peaks, '#f4f8fb', 22);
      } else o += path(hills(R, hz - 10, 46, 3), mix(c.T.s[2], c.ink, 0.3));
      o += path(hills(R, hz + 10, 20, 3), mix(c.T.s[2], c.green, 0.6));
    }
    const ownBeach = c.beach && !c.aqua && c.s === 'beach';
    if (ownBeach) {
      // çimərlik yaxın plan: qum, dalğa, çətirlər, iskələ
      o += path(`M0 ${hz + 44}C160 ${hz + 34} 320 ${hz + 48} ${W} ${hz + 38}V${H}H0Z`, c.sand);
      o += path(`M0 ${hz + 44}C160 ${hz + 34} 320 ${hz + 48} ${W} ${hz + 38}`, 'none', ' stroke="#fff" stroke-width="4" opacity=".9"');
      o += path(`M300 ${hz + 4}h180v5H300z`, '#8a6142') + path(`M310 ${hz + 9}v30M350 ${hz + 9}v30M390 ${hz + 9}v30M430 ${hz + 9}v30`, 'none', ' stroke="#6b4a32" stroke-width="3"');
      o += loungers(c, 30, 460, hz + 86, 1, true) + loungers(c, 60, 440, H - 14, 1, true);
      o += use(c.p + 'P', 20, H - 10, 1.2, null, false) + use(c.p + 'P', 466, H - 30, 1, null, true);
      return o;
    }
    const deck = c.s === 'mountain' && c.k === 'snow' ? '#e7ecf0' : mix('#efe3cf', c.T.s[2], 0.15);
    const hedgeY = hz + 20;
    // fonda otel korpusu (dəniz/təbiət səhnəsində boş göyü doldurur)
    if (c.s === 'beach' || c.s === 'nature') o += tower(c, 318, hedgeY + 8, c.s === 'nature' ? 130 : 100, c.s === 'nature' ? 4 : 3 + c.stars * 2, { fh: 10 });
    if (c.s !== 'city') {
      let b = '';
      for (let i = 0; i < 12; i++) b += `M${n(i * 42 - 10)} ${hedgeY + 6}a24 14 0 0 1 48 0z`;
      o += path(b, mix(c.green, c.ink, 0.35));
    }
    o += rect(0, hedgeY + 6, W, H - hedgeY, deck);
    if (c.s === 'city') o += path(`M0 ${hedgeY + 6}H${W}`, 'none', ' stroke="#cfe8f2" stroke-width="3" opacity=".8"');
    // hovuz (perspektiv)
    const py = hedgeY + 30;
    o += path(`M40 ${py}H${W - 30}L${W + 40} ${H}H-40Z`, '#e9f3f6') + path(`M52 ${py + 6}H${W - 42}L${W + 20} ${H}H-20Z`, `url(#${c.p}w)`);
    let rip = '';
    for (let i = 0; i < 9; i++) { const y = py + 18 + i * 9 + R() * 4, x = R() * 380; rip += `M${n(x)} ${n(y)}q10-4 20 0t20 0`; }
    o += path(rip, 'none', ' stroke="#fff" stroke-width="1.6" opacity=".55"');
    if (c.T.lit) o += path(`M60 ${py + 30}h360`, 'none', ' stroke="#ffd27c" stroke-width="2" opacity=".4"');
    if (c.spa && c.s === 'mountain') o += path(`M120 ${py + 2}c-6-8 6-12 0-20M200 ${py}c-6-8 6-12 0-20M300 ${py + 2}c-6-8 6-12 0-20`, 'none', ' stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"');
    o += loungers(c, 46, 440, py - 4, 1, c.s === 'beach' || c.s === 'nature');
    if (c.aqua) o += slide(c, c.s === 'city' || c.s === 'beach' || c.s === 'nature' ? 84 : 380, py + 4, 0.75);
    if (c.s === 'beach' || c.s === 'nature' || c.k === 'towers') {
      o += use(c.p + 'P', 16, H - 4, 1.25, null, false);
      if (!c.aqua) o += use(c.p + 'P', 462, H - 16, 1.05, null, true);
    } else if (c.s === 'mountain') {
      o += trees('t', [[10, H - 2, 1.4], [44, H - 2, 1.1], [420, H - 2, 1.4], [456, H - 2, 1.1]], '#2c5a4a');
    } else {
      o += path(`M0 ${hedgeY - 14}H${W}`, 'none', ' stroke="#dff3fa" stroke-width="22" opacity=".25"') + path(`M0 ${hedgeY - 25}H${W}`, 'none', ' stroke="#fff" stroke-width="2" opacity=".7"');
      for (const x of [26, 454]) o += path(`M${x - 16} ${H - 40}h32l-4 40h-24z`, '#8a6a52') + trees('r', [[x, H - 38, 1.3]], mix('#3c7a4a', c.ink, c.T.lit * 0.5));
    }
    return o;
  }

  // ===================== variant 2: otaq interyeri (pəncərədən mənzərə)
  function room2(c) {
    const R = c.R;
    const wall = mix(c.wall, c.T.glow, c.T.warm * 0.3);
    const wood = mix(c.floor, '#3a2618', 0.35);
    const wx = 36, wy = 40, ww = 190 + (c.stars >= 5 ? 30 : 0), wh = 150, hz = wy + 96;
    let o = rect(0, 0, W, H, wall) + rect(0, 0, W, 30, mix(wall, '#fff', 0.35));
    // pəncərə mənzərəsi (clipPath ilə yalnız pəncərə daxilində)
    o += `<clipPath id="${c.p}c"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></clipPath><g clip-path="url(#${c.p}c)">`;
    o += rect(wx, wy, ww, wh, `url(#${c.p}a)`);
    o += circ(wx + ww * 0.68, hz - 46, 50, `url(#${c.p}g)`) + circ(wx + ww * 0.68, hz - 46, 12, c.T.sun);
    const far = mix(c.T.s[2], c.ink, 0.5);
    if (c.s === 'beach' || c.k === 'coast') {
      o += rect(wx, hz, ww, wh, `url(#${c.p}b)`) + path(`M${wx + 10} ${hz + 14}h30M${wx + 90} ${hz + 26}h40M${wx + 40} ${hz + 40}h50`, 'none', ' stroke="#fff" stroke-width="2" opacity=".4"');
      if (c.s === 'beach') o += use(c.p + 'P', wx + ww - 24, wy + wh + 10, 0.95, null, true);
    } else if (c.s === 'city') {
      let m = '';
      for (let x = wx; x < wx + ww; x += 14 + R() * 10) { const h = 20 + R() * 64; m += `M${n(x)} ${hz + 30}v-${n(h)}h${n(10 + R() * 4)}v${n(h)}z`; }
      o += path(m, far) + path(m, 'none', ` stroke="${c.T.lit ? '#ffd27c' : '#fff'}" stroke-width="2" stroke-dasharray="2 7" opacity="${c.T.lit ? 0.8 : 0.3}"`);
      o += rect(wx, hz + 30, ww, wh, mix(c.T.s[2], c.ink, 0.7));
    } else {
      if (c.s === 'mountain') {
        const f = ridge(R, wx, wx + ww, hz, 10, 70, 50);
        o += mount(f, mix(c.T.s[2], c.ink, 0.35)) + snowCaps(f.peaks, '#f4f8fb', 16);
      } else o += `<g transform="translate(${wx} ${hz - 150}) scale(.42 1)">${path(hills(R, 150, 36, 3), mix(c.T.s[2], c.ink, 0.3))}</g>`;
      o += path(`M${wx} ${hz + 20}Q${wx + ww / 2} ${hz} ${wx + ww} ${hz + 18}V${wy + wh}H${wx}Z`, c.k === 'snow' ? '#eef4f8' : mix(c.green, c.ink, 0.2));
    }
    o += '</g>';
    // çərçivə, pərdələr, karniz
    o += path(`M${wx} ${wy}h${ww}v${wh}h-${ww}zM${wx + ww / 2} ${wy}v${wh}`, 'none', ' stroke="#fbfaf7" stroke-width="6"') + rect(wx - 8, wy + wh, ww + 16, 7, '#fbfaf7');
    const cur = mix(c.accent, '#fff', 0.55);
    o += path(`M${wx - 26} ${wy - 12}h34c-8 60 6 120-4 ${wh + 46}h-30zM${wx + ww - 8} ${wy - 12}h34v${wh + 46}h-30c-10-60 4-126-4-${wh + 46}z`, cur);
    o += path(`M${wx - 18} ${wy - 6}c-4 50 4 110-2 ${wh + 40}M${wx + ww + 16} ${wy - 6}c4 50-4 110 2 ${wh + 40}`, 'none', ` stroke="${mix(cur, '#000', 0.1)}" stroke-width="3"`);
    o += rect(wx - 34, wy - 16, ww + 68, 5, mix(c.wall, c.ink, 0.5), ' rx="2"');
    // döşəmə + xalça
    o += rect(0, 240, W, 80, c.floor);
    let pl = 'M0 240H480';
    for (let i = 0; i < 7; i++) pl += `M${i * 76 + (i % 2) * 24} 242v78`;
    o += path(pl, 'none', ` stroke="${mix(c.floor, '#000', 0.15)}" stroke-width="1.5"`);
    o += path('M150 312l36-40h240l36 40z', mix(c.accent, '#fff', 0.72));
    // tablo
    if (c.stars < 5) o += rect(300, 52, 120, 70, '#fbfaf7') + rect(306, 58, 108, 58, mix(c.accent, c.wall, 0.6)) + path('M306 116l30-28 22 18 18-12 38 22z', mix(c.accent, '#000', 0.15));
    // çarpayı
    const bx = 262;
    if (c.stars >= 5) o += rect(bx - 14, 96, 224, 150, mix(c.wall, wood, 0.35), ' rx="6"') + path(`M${bx + 42} 96v150M${bx + 98} 96v150M${bx + 154} 96v150`, 'none', ` stroke="${mix(c.wall, wood, 0.5)}" stroke-width="2"`);
    o += rect(bx, 142, 196, 104, wood, ' rx="10"');
    o += rect(bx - 6, 204, 208, 44, '#fff', ' rx="10"') + rect(bx - 2, 244, 200, 12, mix(wood, '#000', 0.15), ' rx="3"');
    o += rect(bx + 12, 180, 76, 30, '#f7f6f1', ' rx="12"') + rect(bx + 108, 180, 76, 30, '#f7f6f1', ' rx="12"');
    o += rect(bx + 34, 190, 36, 20, cur, ' rx="8"') + rect(bx + 128, 190, 36, 20, cur, ' rx="8"');
    o += rect(bx - 6, 220, 208, 22, c.accent, ' rx="4"') + path(`M${bx - 6} 226h208`, 'none', ' stroke="#fff" stroke-width="2" opacity=".5"');
    // tumba + lampa (çarpayının solunda)
    const tx = bx - 54;
    o += rect(tx, 206, 42, 46, wood, ' rx="4"') + path(`M${tx + 4} 228h34`, 'none', ` stroke="${mix(wood, '#000', 0.25)}" stroke-width="1.5"`);
    o += circ(tx + 21, 170, 36, c.T.lit ? '#ffd27c' : '#fff4d6', ' opacity=".35"') + rect(tx + 20, 176, 2, 30, '#7a6a5a') + path(`M${tx + 8} 178h26l-5-22h-16z`, '#fbf3e3');
    if (c.spa) o += path(`M${tx + 6} 200h22v6h-22zM${tx + 9} 200a8 5 0 0 1 16 0z`, '#8a9a96') + circ(tx + 34, 202, 3, '#fff');
    // bitki (sağ kənarda)
    o += path('M14 306l-5-40h36l-5 40z', mix(c.accent, '#3a3a3a', 0.55)) + trees('r', [[27, 268, 1.9]], '#3f7d4e');
    if (c.T.warm) o += rect(0, 0, W, H, c.T.glow, ` opacity="${(c.T.warm * 0.3).toFixed(2)}"`);
    return o;
  }

  // ---- əsas API
  function context(hotel, variant) {
    hotel = hotel || {};
    const id = String(hotel.id || hotel.itemId || 'hotel').slice(0, 120);
    const dRaw = String(hotel.destinationId || (hotel.destination && hotel.destination.id) || id.split('-')[0]);
    const info = DEST[dRaw] || (hotel.region === 'domestic' ? { s: 'nature', k: 'tea' } : { s: 'beach', k: 'taurus' });
    const stars = Math.min(5, Math.max(2, Number.parseInt(hotel.stars, 10) || 4));
    const tags = Array.isArray(hotel.tags) ? hotel.tags.map((t) => String(t).toLowerCase()) : [];
    const has = (t) => tags.includes(t);
    const base = fnv(id);
    const v = ((Number.parseInt(variant, 10) || 0) % VARIANTS + VARIANTS) % VARIANTS;
    const times = info.s === 'city' ? ['day', 'sunset', 'night', 'morning'] : ['morning', 'day', 'sunset', 'day'];
    const tod = times[(base >>> 3) % times.length];
    const T = TIMES[tod];
    const sceneInk = info.k === 'desert' ? INK.desert : INK[info.s];
    const c = {
      v, s: info.s, k: info.k, stars, tod, T, R: rng(fnv(id + '#' + v)),
      p: '', // id-lər hər şəkil sənədinin daxilindədir (img/data: URI) — prefiks lazım deyil
      hz: v === 2 ? 136 : v === 1 ? 156 : info.s === 'mountain' ? 170 : info.s === 'nature' ? 150 : 176,
      flip: (base >>> 7) & 1,
      sunX: 90 + ((base >>> 9) % 80),
      aqua: has('aquapark'), beach: has('öz çimərliyi') || info.k === 'atoll', spa: has('spa'),
      accent: ACCENTS[(base >>> 11) % ACCENTS.length],
      accent2: ['#fff', '#f6e7c8', '#fff'][(base >>> 12) % 3],
      facade: mix(FACADES[(base >>> 14) % FACADES.length], T.glow, T.warm * 0.35),
      wall: WALLS[(base >>> 17) % WALLS.length],
      floor: ['#c79d74', '#a9805e', '#d8b99a', '#8f6a50'][(base >>> 20) % 4],
      ink: sceneInk,
      green: info.k === 'desert' ? '#c99a6a' : ['#5f9e57', '#4f8f5a', '#6aa35a'][(base >>> 22) % 3],
      sand: mix('#efd6a3', T.glow, T.warm * 0.4),
      glass: mix(T.s[1], '#2b4a6a', 0.35),
    };
    if (tod === 'night') { c.facade = mix(c.facade, '#1a2340', 0.55); c.green = mix(c.green, '#0a1430', 0.5); c.sand = mix(c.sand, '#1a2340', 0.5); }
    if (tod === 'sunset') c.green = mix(c.green, '#5a3a5a', 0.25);
    c.trunk = mix('#7a5236', c.ink, tod === 'sunset' ? 0.4 : 0.1);
    c.leaf = mix('#2f8a4f', c.ink, tod === 'sunset' ? 0.5 : 0.15);
    if (tod === 'night') { c.trunk = mix(c.trunk, '#0a1430', 0.5); c.leaf = mix(c.leaf, '#0a1430', 0.5); }
    const palmy = info.s === 'beach' || info.k === 'coast' || info.k === 'towers' || info.k === 'flames' || info.s === 'nature';
    c.need = {
      palm: palmy || (v === 2 && info.s === 'beach'),
      bed: v === 1 || c.beach, umb: v === 1 || c.beach,
    };
    return c;
  }

  // Ölçü limiti (bayt). Limiti keçsə, eyni otel daha az dekorativ detalla yenidən çəkilir (deterministik).
  const MAX_BYTES = 6000;
  function hotelArt(hotel, variant) {
    let svg = '';
    for (let lite = 0; lite < 3; lite++) {
      svg = render(context(hotel, variant), lite);
      if (svg.length <= MAX_BYTES) break;
    }
    return svg;
  }
  function render(c, lite) {
    c.lite = lite;
    let body;
    if (c.v === 0) body = c.s === 'city' ? city0(c) : c.s === 'mountain' ? mountain0(c) : c.s === 'nature' ? nature0(c) : beach0(c);
    else if (c.v === 1) body = pool1(c);
    else body = room2(c);
    let d = defs(c);
    if (c.flip && c.v !== 2) body = `<g transform="matrix(-1 0 0 1 ${W} 0)">${body}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${d}${body}</svg>`;
  }

  // data: URI (img src üçün; CSP img-src 'self' data: icazə verir)
  function hotelArtUri(hotel, variant) {
    return 'data:image/svg+xml,' + encodeURIComponent(hotelArt(hotel, variant)).replace(/%20/g, ' ').replace(/%3D/g, '=').replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%22/g, "'");
  }

  // Real foto URL-i yalnız təhlükəsiz sxemlərlə: https:// və ya eyni-origin yol (/...). "//", javascript:, data: rədd.
  function safeImageUrl(u) {
    if (typeof u !== 'string') return null;
    const s = u.trim();
    if (!s || s.length > 2048 || /[\s"'<>\\]/.test(s)) return null;
    if (/^\/(?!\/)/.test(s)) return s;
    if (/^https:\/\/[a-z0-9.-]+(:\d+)?(\/|$)/i.test(s)) return s;
    return null;
  }

  // Şəkil i: əvvəl real foto (hotel.images[i]), yoxdursa illüstrasiya (variant i).
  function hotelImage(hotel, i) {
    const idx = Number.parseInt(i, 10) || 0;
    const imgs = hotel && Array.isArray(hotel.images) ? hotel.images : [];
    const real = safeImageUrl(imgs[idx]);
    return { src: real || hotelArtUri(hotel, idx), fallback: hotelArtUri(hotel, idx), real: !!real };
  }

  // Brauzer: <img> yaradır; real foto yüklənməsə (404, CSP bloku) — illüstrasiyaya keçir.
  function createHotelImg(hotel, i, alt, lazy) {
    const im = hotelImage(hotel, i);
    const img = document.createElement('img');
    img.decoding = 'async';
    if (lazy) img.loading = 'lazy';
    img.alt = alt || '';
    img.draggable = false;
    if (im.real) {
      img.addEventListener('error', function onErr() { img.removeEventListener('error', onErr); img.src = im.fallback; img.dataset.fallback = '1'; });
    }
    img.src = im.src;
    return img;
  }

  return { hotelArt, hotelArtUri, hotelImage, createHotelImg, safeImageUrl, sceneFor: (h) => { const c = context(h, 0); return { scene: c.s, motif: c.k, time: c.tod }; }, VARIANTS, DEST, MAX_BYTES };
});
