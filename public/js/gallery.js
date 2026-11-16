// TurTap — otel kartı qalereyası: 3 slayd, oxlar, nöqtələr, swipe (pointer events), klaviatura,
// lightbox (modal: Esc, fokus tələsi, fokusun geri qaytarılması), IntersectionObserver ilə lazy render.
// Asılılıq: hotel-art.js (window.HotelArt). CSP-uyğun: inline handler yoxdur, yalnız addEventListener.
// Otel adı yalnız DOM xassələri ilə (alt, aria-label, textContent) yazılır — innerHTML-ə düşmür.
//
// API:
//   mountGallery(containerEl, hotel, opts?) -> controller { go(i), open(i), destroy(), index }
//     hotel: { id, destinationId, region, stars, tags, name, images? }
//     opts.eager = true  -> görünməsini gözləmədən dərhal render
//   openLightbox(hotel, i)
//   Avto: <div data-gallery data-hotel-id data-dest data-stars data-tags="A,B" data-name data-images="url,url">
(function (root) {
  'use strict';
  const SLIDES = 3;
  const L = {
    az: { gallery: 'Otel şəkilləri', prev: 'Əvvəlki şəkil', next: 'Növbəti şəkil', open: 'Şəkli böyüt', close: 'Bağla', slide: 'Şəkil', of: '/', scenes: ['ümumi görünüş', 'hovuz və istirahət zonası', 'otaq'], illus: 'illüstrasiya' },
    en: { gallery: 'Hotel photos', prev: 'Previous image', next: 'Next image', open: 'Enlarge image', close: 'Close', slide: 'Image', of: '/', scenes: ['overview', 'pool and leisure area', 'room'], illus: 'illustration' },
    ru: { gallery: 'Фото отеля', prev: 'Предыдущее фото', next: 'Следующее фото', open: 'Увеличить фото', close: 'Закрыть', slide: 'Фото', of: '/', scenes: ['общий вид', 'бассейн и зона отдыха', 'номер'], illus: 'иллюстрация' },
  };
  const lang = () => {
    const l = (typeof LANG === 'string' && LANG) || document.documentElement.lang || 'az';
    return L[l] ? l : 'az';
  };
  const tr = () => L[lang()];
  const el = (tag, cls, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };
  const HA = () => root.HotelArt;
  const altFor = (hotel, i) => {
    const T = tr();
    const im = HA().hotelImage(hotel, i);
    const nm = hotel && hotel.name ? String(hotel.name).slice(0, 120) + ' — ' : '';
    return nm + T.scenes[i % T.scenes.length] + (im.real ? '' : ` (${T.illus})`);
  };
  const reduceMotion = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- swipe: üfüqi sürüşdürmə; şaquli skrolu brauzerə saxlayır (touch-action: pan-y)
  function swipe(target, track, getIndex, count, onGo, onTap) {
    let sx = 0, sy = 0, dx = 0, id = null, horiz = false;
    target.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = 0; horiz = false;
    });
    target.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const mx = e.clientX - sx, my = e.clientY - sy;
      if (!horiz && Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) {
        horiz = true;
        try { target.setPointerCapture(id); } catch (_) { /* köhnə brauzer */ }
        track.style.transition = 'none';
      }
      if (horiz) {
        dx = mx;
        const i = getIndex();
        const edge = (i === 0 && dx > 0) || (i === count - 1 && dx < 0) ? 0.35 : 1; // kənarda müqavimət
        track.style.transform = `translateX(calc(${-i * 100}% + ${dx * edge}px))`;
      }
    });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      track.style.transition = '';
      if (horiz) {
        const w = target.clientWidth || 1;
        const i = getIndex();
        if (Math.abs(dx) > Math.min(60, w * 0.18)) onGo(i + (dx < 0 ? 1 : -1));
        else onGo(i);
      } else if (e.type === 'pointerup' && onTap && Math.hypot(e.clientX - sx, e.clientY - sy) < 8) onTap();
      horiz = false;
    };
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  }

  // ---- Lightbox (tək, paylaşılan)
  let lb = null;
  function ensureLightbox() {
    if (lb) return lb;
    const T = tr();
    const wrap = el('div', 'tg-lb', { role: 'dialog', 'aria-modal': 'true', hidden: '' });
    const box = el('div', 'tg-lb-box');
    const stage = el('div', 'tg-lb-stage');
    const track = el('div', 'tg-lb-track');
    stage.appendChild(track);
    const close = el('button', 'tg-lb-close', { type: 'button', 'aria-label': T.close });
    const prev = el('button', 'tg-nav tg-prev tg-lb-nav', { type: 'button', 'aria-label': T.prev });
    const next = el('button', 'tg-nav tg-next tg-lb-nav', { type: 'button', 'aria-label': T.next });
    const cap = el('div', 'tg-lb-cap', { 'aria-live': 'polite' });
    box.append(stage, prev, next, close, cap);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    lb = { wrap, track, stage, close, prev, next, cap, hotel: null, i: 0, ret: null, onClose: null };

    const go = (i) => {
      lb.i = Math.max(0, Math.min(SLIDES - 1, i));
      lb.track.style.transform = `translateX(${-lb.i * 100}%)`;
      [...lb.track.children].forEach((s, k) => s.setAttribute('aria-hidden', k === lb.i ? 'false' : 'true'));
      lb.prev.disabled = lb.i === 0;
      lb.next.disabled = lb.i === SLIDES - 1;
      lb.cap.textContent = `${lb.i + 1} ${tr().of} ${SLIDES} · ${altFor(lb.hotel, lb.i)}`;
    };
    lb.go = go;
    prev.addEventListener('click', () => go(lb.i - 1));
    next.addEventListener('click', () => go(lb.i + 1));
    close.addEventListener('click', closeLightbox);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) closeLightbox(); });
    swipe(stage, track, () => lb.i, SLIDES, go, null);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(lb.i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(lb.i + 1); }
      else if (e.key === 'Tab') { // fokus tələsi
        const f = [lb.close, lb.prev, lb.next].filter((b) => !b.disabled);
        const cur = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(cur + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    return lb;
  }

  function openLightbox(hotel, i, onClose) {
    const box = ensureLightbox();
    const T = tr();
    box.hotel = hotel;
    box.onClose = onClose || null;
    box.ret = document.activeElement;
    box.wrap.setAttribute('aria-label', (hotel && hotel.name ? String(hotel.name).slice(0, 120) + ' — ' : '') + T.gallery);
    box.close.setAttribute('aria-label', T.close);
    box.prev.setAttribute('aria-label', T.prev);
    box.next.setAttribute('aria-label', T.next);
    box.track.textContent = '';
    for (let k = 0; k < SLIDES; k++) {
      const s = el('div', 'tg-lb-slide');
      const img = HA().createHotelImg(hotel, k, altFor(hotel, k));
      s.appendChild(img);
      box.track.appendChild(s);
    }
    box.track.style.transition = 'none';
    box.go(i || 0);
    box.wrap.hidden = false;
    document.documentElement.classList.add('tg-lock');
    void box.track.offsetWidth; // keçid animasiyası açılışda oynamasın
    box.track.style.transition = '';
    box.close.focus();
  }

  function closeLightbox() {
    if (!lb || lb.wrap.hidden) return;
    lb.wrap.hidden = true;
    document.documentElement.classList.remove('tg-lock');
    lb.track.textContent = '';
    if (lb.onClose) lb.onClose(lb.i);
    if (lb.ret && typeof lb.ret.focus === 'function' && document.contains(lb.ret)) lb.ret.focus();
    lb.ret = null;
  }

  // ---- Kart qalereyası
  function build(container, hotel) {
    const T = tr();
    const root_ = el('div', 'tg', { role: 'group', 'aria-roledescription': 'carousel' });
    root_.setAttribute('aria-label', (hotel && hotel.name ? String(hotel.name).slice(0, 120) + ' — ' : '') + T.gallery);
    const track = el('div', 'tg-track', { tabindex: '0', 'aria-live': 'polite' });
    track.setAttribute('aria-label', T.open);
    const slides = [];
    for (let k = 0; k < SLIDES; k++) {
      const s = el('div', 'tg-slide', { role: 'group', 'aria-roledescription': 'slide' });
      s.setAttribute('aria-label', `${k + 1} ${T.of} ${SLIDES}`);
      const img = HA().createHotelImg(hotel, k, altFor(hotel, k), k > 0);
      s.appendChild(img);
      track.appendChild(s);
      slides.push(s);
    }
    const prev = el('button', 'tg-nav tg-prev', { type: 'button', 'aria-label': T.prev });
    const next = el('button', 'tg-nav tg-next', { type: 'button', 'aria-label': T.next });
    const dots = el('div', 'tg-dots');
    const dotBtns = [];
    for (let k = 0; k < SLIDES; k++) {
      const d = el('button', '', { type: 'button', 'aria-label': `${T.slide} ${k + 1}` });
      d.addEventListener('click', (e) => { e.stopPropagation(); go(k); });
      dots.appendChild(d);
      dotBtns.push(d);
    }
    root_.append(track, prev, next, dots);
    container.classList.add('has-gallery');
    container.insertBefore(root_, container.firstChild);

    const ctl = { index: 0 };
    function go(i) {
      ctl.index = Math.max(0, Math.min(SLIDES - 1, i));
      track.style.transform = `translateX(${-ctl.index * 100}%)`;
      slides.forEach((s, k) => s.setAttribute('aria-hidden', k === ctl.index ? 'false' : 'true'));
      dotBtns.forEach((d, k) => (k === ctl.index ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
      prev.disabled = ctl.index === 0;
      next.disabled = ctl.index === SLIDES - 1;
    }
    const open = (i) => openLightbox(hotel, i == null ? ctl.index : i, (j) => { go(j); });
    prev.addEventListener('click', (e) => { e.stopPropagation(); go(ctl.index - 1); });
    next.addEventListener('click', (e) => { e.stopPropagation(); go(ctl.index + 1); });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(ctl.index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(ctl.index + 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(SLIDES - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
    swipe(track, track, () => ctl.index, SLIDES, go, () => open());
    if (reduceMotion()) track.style.transition = 'none';
    go(0);
    ctl.go = go;
    ctl.open = open;
    ctl.destroy = () => { root_.remove(); container.classList.remove('has-gallery'); delete container.__tg; };
    return ctl;
  }

  // ---- Lazy: yalnız görünən kartlarda render
  let io = null;
  const queue = new Map();
  function observer() {
    if (io || !('IntersectionObserver' in root)) return io;
    io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        const job = queue.get(en.target);
        queue.delete(en.target);
        if (job) job();
      }
    }, { rootMargin: '200px 0px' });
    return io;
  }

  function mountGallery(container, hotel, opts) {
    if (!container || !root.HotelArt) return null;
    if (container.__tg) return container.__tg;
    const ctl = { index: 0, ready: false };
    const run = () => { Object.assign(ctl, build(container, hotel || {}), { ready: true }); };
    ctl.go = (i) => { if (!ctl.ready) run(); ctl.go(i); };
    ctl.open = (i) => { if (!ctl.ready) run(); ctl.open(i); };
    ctl.destroy = () => { if (io) io.unobserve(container); queue.delete(container); delete container.__tg; };
    container.__tg = ctl;
    const obs = !(opts && opts.eager) && observer();
    if (obs) { queue.set(container, run); obs.observe(container); } else run();
    return ctl;
  }

  // data-* atributlarından otel obyekti (demo və statik HTML üçün)
  function hotelFromData(node) {
    const d = node.dataset;
    const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
    return { id: d.hotelId || '', destinationId: d.dest || '', region: d.region || '', stars: Number(d.stars) || 0, tags: list(d.tags), name: d.name || '', images: list(d.images) };
  }
  function autoMount(scope) {
    (scope || document).querySelectorAll('[data-gallery]').forEach((n) => mountGallery(n, hotelFromData(n)));
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => autoMount());
    else autoMount();
  }

  root.mountGallery = mountGallery;
  root.TurGallery = { mountGallery, openLightbox, closeLightbox, autoMount, hotelFromData };
})(typeof self !== 'undefined' ? self : this);
