/* =====================================================================
   Saksiri Riverside — interactions
   Lenis smooth scroll + one requestAnimationFrame loop that drives every
   scroll scene (video hero, river reveal, rooms track, tour curtains,
   band, parallax, final frame). Motion (vanilla Framer Motion) handles
   entrance reveals and the rating counter.
   ===================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || {};
  const EASE = [0.16, 1, 0.3, 1];
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Photography (the hotel's own images) ----------
     To self-host: download the files into assets/images/ and set IMG_BASE = 'assets/images/'
     (also find/replace the same URL in index.html). */
  const IMG_BASE = 'https://saksiri-riverside.vercel.app/images/';
  const img = (k) => `${IMG_BASE}${k}.webp`;

  const ROOMS = [
    { key: 'r_superior', name: 'Deluxe Superior', price: 130, extra: 25, count: 2,
      text: 'Our largest rooms: 48 m² with a stand bath and a massage bath, looking out over the river.',
      spec: [['Size', '48 m²'], ['Bed', 'King, 180 × 200 cm'], ['View', 'Riverside'], ['Bath', 'Stand bath + massage bath'], ['Rooms', '2 in the hotel']] },
    { key: 'r_double', name: 'Deluxe Double', price: 85, extra: 35, count: 16,
      text: 'A double bed in 32 m², with coffee and tea, wifi and cable TV.',
      spec: [['Size', '32 m²'], ['Bed', 'Double'], ['In room', 'Coffee & tea, wifi, cable TV'], ['Rooms', '16 in the hotel']] },
    { key: 'r_twin', name: 'Deluxe Twin', price: 85, extra: 35, count: 18,
      text: 'Twin beds in 32 m². Good for friends travelling together.',
      spec: [['Size', '32 m²'], ['Beds', 'Two singles'], ['In room', 'Coffee & tea, wifi, cable TV'], ['Rooms', '18 in the hotel']] },
  ];
  const TOUR = [
    ['hero', 'The pool, beneath the mountains'],
    ['gardens', 'The gardens between the rooms'],
    ['terrace', 'The terrace, for slow afternoons'],
    ['balcony', 'A balcony facing the karst'],
    ['bath1', 'Stand bath in the Deluxe Superior'],
  ];
  const EXPERIENCE = [
    ['Riverside location', 'The Nam Song runs past the garden. Breakfast comes with a view of the water.', 'aerial'],
    ['Swimming pool', 'An outdoor pool framed by palms and the limestone peaks.', 'hero'],
    ['Relaxation', 'Quiet gardens and shaded corners, away from the town’s noise.', 'gardens'],
    ['Scenic mountain views', 'Green karst peaks rise straight above the hotel.', 'mountains'],
    ['Comfortable rooms', '36 rooms from 32 m², each with wifi, coffee and tea.', 'r_double'],
    ['Boutique hospitality', 'A small hotel, so the staff know your name by day two.', 'welcome'],
  ];
  const GALLERY = [
    ['hero', 'The pool, beneath the mountains'], ['aerial', 'The hotel from above, beside the Nam Song'],
    ['mountains', 'Green karst peaks above the hotel'], ['gardens', 'The gardens'],
    ['terrace', 'The terrace'], ['balcony', 'A balcony facing the mountains'],
    ['gardenportrait', 'Palms and flowers in the garden'], ['welcome', 'The welcome at reception'],
    ['buffet', 'The breakfast buffet'], ['gardendine', 'Tables in the garden'],
    ['dinnernight', 'Dinner under the palms'], ['r_superior', 'Deluxe Superior'],
    ['bath1', 'Stand bath, Deluxe Superior'], ['bath2', 'Massage bath, Deluxe Superior'],
    ['r_double', 'Deluxe Double'], ['r_twin', 'Deluxe Twin'],
  ];
  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  /* ---------- Render data-driven sections ---------- */
  $('#rooms-list').outerHTML = ROOMS.map((r, i) => `
    <article class="room" aria-labelledby="room-${i}">
      <figure class="room-fig"><img class="cover" src="${img(r.key)}" alt="${r.name} room" loading="lazy"></figure>
      <div class="room-info">
        <p class="room-idx">${pad(i + 1)} / ${pad(ROOMS.length)}</p>
        <h3 class="d" id="room-${i}">${r.name}</h3>
        <p>${r.text}</p>
        <dl>${r.spec.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
        <div class="room-buy">
          <p class="room-price">US$${r.price}<small>per night · breakfast included · extra bed US$${r.extra}</small></p>
          <a class="btn btn-dark" href="#reserve" data-room="${i}">Choose ${ARROW}</a>
        </div>
      </div>
    </article>`).join('');

  $('#tour-stage').innerHTML = TOUR.map(([k, c], i) => `
    <figure class="tour-slide" data-i="${i}">
      <img class="cover" src="${img(k)}" alt="${c}" loading="lazy">
      <figcaption><b>${pad(i + 1)}</b>${c}</figcaption>
    </figure>`).join('') +
    `<div class="tour-count" aria-hidden="true"><span id="tour-count">01 / ${pad(TOUR.length)}</span><span class="bar"><i id="tour-bar"></i></span></div>`;

  $('#exp-list').innerHTML = EXPERIENCE.map(([t, d, k], i) => `
    <div class="exp-row" data-i="${i}">
      <span class="rule" aria-hidden="true"></span>
      <h3 class="d">${t}</h3>
      <p>${d}</p>
      <div class="exp-thumb"><img class="cover" src="${img(k)}" alt="" loading="lazy"></div>
    </div>`).join('');
  $('#exp-float').innerHTML = EXPERIENCE.map(([, , k]) => `<div class="st"><img class="cover" src="${img(k)}" alt="" loading="lazy"></div>`).join('');

  $('#room').innerHTML = ROOMS.map((r, i) => `<option value="${i}">${r.name} · US$${r.price}</option>`).join('');

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) { try { lenis = new Lenis({ lerp: 0.085 }); } catch (e) { lenis = null; } }
  const navH = () => $('#nav').offsetHeight;
  const scrollToY = (y) => { lenis ? lenis.scrollTo(y, { duration: 1.4 }) : window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); };
  const scrollToEl = (el) => scrollToY(el.getBoundingClientRect().top + window.scrollY - (el.id === 'reserve' || el.id === 'story' ? 0 : navH() * 0));

  /* ---------- Menu ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  const setMenu = (open) => {
    menu.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open)); document.documentElement.classList.toggle('is-locked', open);
    open ? lenis?.stop() : lenis?.start();
    if (open && M.animate && !reduce) M.animate($$('.m-link .li', menu), { transform: ['translateY(105%)', 'translateY(0%)'] }, { duration: 0.8, delay: M.stagger(0.06, { startDelay: 0.05 }), ease: EASE });
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href'); const el = id.length > 1 && $(id); if (!el) return;
    e.preventDefault(); if (menu.classList.contains('open')) setMenu(false);
    if (a.dataset.room !== undefined) { $('#room').value = a.dataset.room; updateSummary(); }
    scrollToEl(el);
  });

  /* =====================================================================
     HERO FILM — the video's time follows the scroll position
     ===================================================================== */
  const heroScroll = $('#top'), video = $('#hero-video');
  const heroContent = $('#hero-content'), heroDim = $('#hero-dim'), heroPz = $('#hero-pz'), cue = $('#hero-cue');
  const slides = $$('.hs'), chapters = $$('.hero-chapter').map((el) => ({ el, a: +el.dataset.a, b: +el.dataset.b }));
  const tabs = $$('.hero-tab');
  const CH = [0, 0.17, 0.35, 0.52, 0.667];          // chapter starts; film ends at 0.667 (then the intro slides over)
  const CAPS = ['Arriving at the riverside', 'The dining room at night', 'Set for the table', 'Dinner under the palms'];
  const capEl = $('#hero-cap'), countEl = $('#hero-count');
  let vidReady = false, vidDur = 0, vidCur = 0, lastCh = -1;

  function videoReady() {
    if (vidReady || !video.duration || !isFinite(video.duration)) return;
    vidReady = true; vidDur = video.duration;
    video.pause(); video.classList.add('ready');
    if (reduce) video.currentTime = vidDur * 0.35;
  }
  if (video) {
    video.muted = true;
    video.addEventListener('loadedmetadata', () => { vidDur = video.duration; });
    video.addEventListener('loadeddata', videoReady);
    video.addEventListener('canplay', videoReady);
    // iOS only buffers after a play() call: start muted, pause at once.
    const kick = () => { if (!video.currentSrc) return; const p = video.play(); if (p && p.then) p.then(() => { video.pause(); videoReady(); }).catch(() => {}); };
    addEventListener('touchstart', kick, { once: true, passive: true });
    addEventListener('pointerdown', kick, { once: true });

    // Load the film into memory (a Blob URL is always fully seekable, whatever the server,
    // so scrubbing never waits on the network). If a host blocks that (no CORS), stream it instead.
    const urls = $$('source', video).map((s) => s.dataset.src).filter(Boolean);
    $$('source', video).forEach((s) => s.remove());
    const stream = (i) => {
      if (i >= urls.length) return;                         // nothing loaded: the photo fallback stays
      video.onerror = () => stream(i + 1);
      video.src = urls[i]; video.load(); kick();
    };
    (async () => {
      for (const u of urls) {
        try {
          const r = await fetch(u, { mode: 'cors' });
          if (!r.ok || !/^video\//.test(r.headers.get('content-type') || 'video/')) continue;
          const blob = await r.blob();
          video.onerror = null;
          video.src = URL.createObjectURL(blob); video.load(); kick();
          return;
        } catch (e) { /* try the next source */ }
      }
      // every fetch failed (usually CORS): stream the first remote clip that plays
      stream(urls.findIndex((u) => /^https?:/.test(u)) >= 0 ? urls.findIndex((u) => /^https?:/.test(u)) : 0);
    })();
  }

  tabs.forEach((t, i) => t.addEventListener('click', () => {
    const range = heroScroll.offsetHeight - innerHeight;
    if (range <= 0) return;
    scrollToY(heroScroll.offsetTop + (CH[i] + (i ? 0.03 : 0)) * range);
  }));

  function heroFrame(p, dt) {
    const vp = clamp(p / CH[4]);
    // video scrub, eased so seeking feels like playback
    if (vidReady) {
      const target = vp * (vidDur - 0.05);
      vidCur = lerp(vidCur, target, 1 - Math.exp(-dt * 9));
      if (Math.abs(vidCur - target) < 0.002) vidCur = target;
      if (!video.seeking && Math.abs(video.currentTime - vidCur) > 0.016) { try { video.currentTime = vidCur; } catch (e) {} }
    } else {
      // fallback: the hotel's photos, cross-faded and slowly zooming with the scroll
      const f = vp * (slides.length - 1);
      slides.forEach((s, i) => {
        const o = clamp(1 - Math.abs(f - i) * 1.25);
        s.style.opacity = i === 0 && f <= 0 ? 1 : o.toFixed(3);
        s.firstElementChild.style.transform = `scale(${(1.02 + 0.08 * clamp(f - i + 1, 0, 2) / 2).toFixed(4)})`;
      });
    }
    // headline leaves as the film starts
    const out = clamp((p - 0.04) / 0.11);
    heroContent.style.opacity = (1 - out).toFixed(3);
    heroContent.style.transform = `translateY(${(-60 * out).toFixed(1)}px)`;
    heroContent.style.visibility = out >= 1 ? 'hidden' : 'visible';
    if (cue) cue.style.opacity = (1 - clamp(p / 0.04)).toFixed(3);
    // chapter captions
    for (const c of chapters) {
      const fin = clamp((p - c.a) / 0.03), fout = clamp((p - c.b) / 0.03);
      const o = Math.min(fin, 1 - fout);
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = `translateY(${(fin < 1 ? (1 - fin) * 24 : -fout * 24).toFixed(1)}px)`;
    }
    // tabs fill + caption
    let ch = 0; for (let i = 0; i < 4; i++) if (p >= CH[i]) ch = i;
    tabs.forEach((t, i) => { t.style.setProperty('--f', clamp((p - CH[i]) / (CH[i + 1] - CH[i])).toFixed(3)); t.classList.toggle('on', i === ch); });
    if (ch !== lastCh) {
      lastCh = ch; countEl.textContent = `${pad(ch + 1)} / 04`;
      capEl.classList.add('out');
      setTimeout(() => { capEl.textContent = CAPS[ch]; capEl.classList.remove('out'); }, reduce ? 0 : 260);
    }
    // the intro slides up over the last frame
    const cover = clamp((p - CH[4]) / (1 - CH[4]));
    heroDim.style.opacity = (cover * 0.7).toFixed(3);
    heroPz.style.transform = `scale(${(1 + 0.06 * cover).toFixed(4)})`;
  }

  /* =====================================================================
     OTHER SCROLL SCENES
     ===================================================================== */
  const river = $('#river'), riverFrame = $('#river-frame'), riverContent = $('#river-content');
  const finalSec = $('#final'), finalFrame = $('#final-frame'), finalContent = $('#final-content');
  const rooms = $('#rooms'), roomsTrack = $('#rooms-track'), roomsBar = $('#rooms-bar'), roomsCount = $('#rooms-count');
  const tourPin = $('#tour-pin'), tourSlides = $$('.tour-slide'), tourBar = $('#tour-bar'), tourCount = $('#tour-count');
  const b1 = $('.band-line.b1'), b2 = $('.band-line.b2'), band = $('.band');
  const landMedia = $('#land-media');
  const drifts = $$('[data-drift]'), pars = $$('[data-par]');
  const progressBar = $('#progress');
  const desk = matchMedia('(min-width: 1024px)'), tab768 = matchMedia('(min-width: 768px)');

  const secP = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  const viewP = (el) => { const r = el.getBoundingClientRect(); return clamp((innerHeight - r.top) / (innerHeight + r.height)); };

  let roomsTravel = 0;
  function sizeRooms() {
    if (reduce || !desk.matches) { rooms.style.height = ''; roomsTrack.style.transform = ''; roomsTravel = 0; return; }
    roomsTravel = Math.max(0, roomsTrack.scrollWidth - innerWidth);
    rooms.style.height = `${roomsTravel + innerHeight}px`;
  }

  function expandFrame(frame, content, p) {
    // framed picture opens to full bleed, then the copy arrives
    const e = clamp(p / 0.55), k = 1 - (1 - e) ** 3;
    const ix = lerp(14, 0, k), iy = lerp(12, 0, k), rad = lerp(6, 0, k);
    const clip = `inset(${iy.toFixed(3)}% ${ix.toFixed(3)}% ${iy.toFixed(3)}% ${ix.toFixed(3)}% round ${rad.toFixed(2)}px)`;
    frame.style.clipPath = clip;
    const shade = frame.nextElementSibling; if (shade && shade.classList.contains('shade-b')) shade.style.clipPath = clip;
    frame.firstElementChild.style.transform = `scale(${lerp(1.18, 1, k).toFixed(4)})`;
    const c = clamp((p - 0.4) / 0.25);
    content.style.opacity = c.toFixed(3);
    content.style.transform = `translateY(${((1 - c) * 40).toFixed(1)}px)`;
  }

  function scenes(p, dt) {
    const y = window.scrollY;
    nav.classList.toggle('solid', y > 40);
    progressBar.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4)})`;
    if (reduce) return;

    heroFrame(p, dt);
    expandFrame(riverFrame, riverContent, secP(river));
    expandFrame(finalFrame, finalContent, secP(finalSec));

    if (roomsTravel) {
      const rp = secP(rooms);
      roomsTrack.style.transform = `translate3d(${(-rp * roomsTravel).toFixed(1)}px,0,0)`;
      roomsBar.style.transform = `scaleX(${rp.toFixed(4)})`;
      roomsCount.textContent = `${pad(Math.min(ROOMS.length, Math.floor(rp * ROOMS.length * 0.999) + 1))} / ${pad(ROOMS.length)}`;
    }

    if (tab768.matches) {
      const tp = secP(tourPin), n = tourSlides.length, f = tp * (n - 1);
      tourSlides.forEach((s, i) => {
        const local = i === 0 ? 1 : clamp(f - (i - 1));
        s.style.zIndex = i;
        s.style.clipPath = i === 0 ? '' : `inset(${((1 - local) * 100).toFixed(2)}% 0 0 0)`;
        s.firstElementChild.style.transform = `scale(${(1.15 - 0.15 * local).toFixed(4)})`;
      });
      const cur = Math.min(n, Math.round(f) + 1);
      tourCount.textContent = `${pad(cur)} / ${pad(n)}`;
      tourBar.style.transform = `scaleX(${tp.toFixed(4)})`;
    } else {
      tourSlides.forEach((s) => { s.style.clipPath = ''; s.style.zIndex = ''; s.firstElementChild.style.transform = ''; });
    }

    const bp = viewP(band);
    b1.style.transform = `translate3d(${(-bp * 32).toFixed(2)}%,0,0)`;
    b2.style.transform = `translate3d(${(-30 + bp * 32).toFixed(2)}%,0,0)`;
    landMedia.style.transform = `translate3d(0,${((viewP(landMedia.parentElement) - 0.5) * -14).toFixed(2)}%,0)`;
    drifts.forEach((d) => { const v = +d.dataset.drift; if (!v || innerWidth < 900) { d.style.transform = ''; return; } d.style.transform = `translate3d(0,${((viewP(d) - 0.5) * v * 2).toFixed(1)}px,0)`; });
    pars.forEach((el) => el.style.setProperty('--py', `${((viewP(el) - 0.5) * -10).toFixed(2)}%`));
  }

  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (lenis) lenis.raf(now);
    scenes(secP(heroScroll), dt);
  }
  sizeRooms();
  addEventListener('resize', () => { sizeRooms(); });
  addEventListener('load', sizeRooms);
  requestAnimationFrame(tick);

  /* ---------- Entrance + reveals (Motion) ---------- */
  if (M.animate && !reduce) {
    M.animate('.hero .h1-line .li', { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 1.2, delay: M.stagger(0.1, { startDelay: 0.35 }), ease: EASE });
    M.animate('.hero [data-hero]', { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 1, delay: M.stagger(0.12, { startDelay: 0.2 }), ease: EASE });
    M.animate('.nav', { opacity: [0, 1] }, { duration: 1, delay: 0.2 });
  }
  if (M.inView && M.animate && !reduce) {
    $$('main .d').forEach((h) => {
      if (h.closest('.hero')) return;
      const lines = $$('.li', h);
      const targets = lines.length ? lines : [h];
      targets.forEach((t) => { t.style.transform = lines.length ? 'translateY(110%)' : 'translateY(24px)'; if (!lines.length) t.style.opacity = 0; });
      M.inView(h, () => { M.animate(targets, lines.length ? { transform: 'translateY(0%)' } : { transform: 'translateY(0px)', opacity: 1 }, { duration: 1.1, delay: M.stagger(0.09), ease: EASE }); }, { margin: '0px 0px -10% 0px' });
    });
    $$('[data-rv]').forEach((el) => { el.style.opacity = 0; el.style.transform = 'translateY(26px)'; });
    M.inView('[data-rv]', (el) => { M.animate(el, { opacity: 1, transform: 'translateY(0px)' }, { duration: 0.95, delay: 0.12, ease: EASE }); }, { margin: '0px 0px -8% 0px' });
    $$('.exp-row .rule').forEach((r) => { r.style.transform = 'scaleX(0)'; });
    M.inView('.exp-row', (row) => { M.animate($('.rule', row), { transform: 'scaleX(1)' }, { duration: 1.2, ease: EASE }); }, { margin: '0px 0px -10% 0px' });
  }

  /* ---------- Rating counter ---------- */
  const score = $('#score');
  if (M.inView && M.animate && !reduce) {
    score.textContent = '0.0';
    M.inView(score, () => { M.animate(0, 4.5, { duration: 1.8, ease: EASE, onUpdate: (v) => { score.textContent = v.toFixed(1); } }); }, { amount: 0.6 });
  }

  /* ---------- Experience: cursor-follow preview ---------- */
  const float = $('#exp-float'), fStates = $$('.st', float);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth >= 900) {
    let fx = 0, fy = 0, tx = 0, ty = 0, shown = false, raf = 0;
    const move = () => { fx = lerp(fx, tx, 0.16); fy = lerp(fy, ty, 0.16); float.style.transform = `translate3d(${fx.toFixed(1)}px,${fy.toFixed(1)}px,0) rotate(${((tx - fx) * 0.02).toFixed(2)}deg)`; raf = shown ? requestAnimationFrame(move) : 0; };
    $$('.exp-row').forEach((row) => {
      row.addEventListener('pointerenter', () => { fStates.forEach((s, i) => s.classList.toggle('on', i === +row.dataset.i)); });
    });
    const list = $('#exp-list');
    list.addEventListener('pointermove', (e) => {
      const w = float.offsetWidth, h = float.offsetHeight;
      tx = Math.min(innerWidth - w - 16, e.clientX + 28); ty = clamp(e.clientY - h / 2, 16, innerHeight - h - 16);
      if (!shown) { shown = true; fx = tx; fy = ty; float.style.visibility = 'visible'; float.style.transition = 'opacity .35s'; float.style.opacity = 1; if (!raf) raf = requestAnimationFrame(move); }
    });
    list.addEventListener('pointerleave', () => { shown = false; float.style.opacity = 0; setTimeout(() => { if (!shown) float.style.visibility = 'hidden'; }, 350); });
  }

  /* ---------- Reservation (front-end demo) ---------- */
  const form = $('#stay-form'), fin = $('#in'), fout = $('#out'), guests = $('#guests'), roomSel = $('#room');
  const err = $('#err'), done = $('#done'), summary = $('#summary');
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d1 = new Date(today); d1.setDate(d1.getDate() + 14);
  const d2 = new Date(today); d2.setDate(d2.getDate() + 17);
  fin.min = iso(today); fin.value = iso(d1); fout.value = iso(d2); fout.min = iso(new Date(d1.getTime() + 864e5));
  const nights = () => { const a = new Date(fin.value), b = new Date(fout.value); return isNaN(a) || isNaN(b) ? 0 : Math.round((b - a) / 864e5); };
  const fmtD = (v) => new Date(v + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  function updateSummary() {
    const r = ROOMS[+roomSel.value], n = nights(), g = +guests.value;
    if (n <= 0) { summary.innerHTML = '<h3>Your stay</h3><p class="fine">Choose a check-out date after check-in.</p>'; return; }
    // up to 3 guests fit one room (extra bed for the third); larger groups need more rooms
    const roomsN = Math.ceil(g / 3), beds = Math.max(0, g - 2 * roomsN);
    const total = (r.price * roomsN + r.extra * beds) * n;
    summary.innerHTML = `<h3>Your stay</h3>
      <div class="row"><span>${roomsN > 1 ? roomsN + ' × ' : ''}${r.name}</span><span>US$${r.price} × ${n} night${n > 1 ? 's' : ''}</span></div>
      ${beds ? `<div class="row"><span>Extra bed${beds > 1 ? 's' : ''}</span><span>${beds} × US$${r.extra} × ${n}</span></div>` : ''}
      <div class="row"><span>${fmtD(fin.value)} → ${fmtD(fout.value)}</span><span>${g === 5 ? '5 or more guests' : g + ' guest' + (g > 1 ? 's' : '')}</span></div>
      <div class="row"><span>Breakfast</span><span>Included</span></div>
      <div class="row tot"><span>Estimated total</span><span>US$${total.toLocaleString('en-US')}</span></div>
      <p class="fine">An estimate only. The hotel confirms availability and rates by email.</p>`;
  }
  window.updateSummary = updateSummary;
  fin.addEventListener('change', () => { const a = new Date(fin.value); if (!isNaN(a)) { fout.min = iso(new Date(a.getTime() + 864e5)); if (nights() <= 0) fout.value = iso(new Date(a.getTime() + 2 * 864e5)); } updateSummary(); });
  [fout, guests, roomSel].forEach((el) => el.addEventListener('change', updateSummary));
  updateSummary();
  form.addEventListener('submit', (e) => {
    e.preventDefault(); err.textContent = '';
    const name = $('#name'), email = $('#email');
    if (nights() <= 0) { err.textContent = 'Check-out must be after check-in.'; fout.focus(); return; }
    if (new Date(fin.value) < today) { err.textContent = 'Check-in can’t be in the past.'; fin.focus(); return; }
    if (!name.value.trim()) { err.textContent = 'Please add your name.'; name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'Please add a valid email so the hotel can reply.'; email.focus(); return; }
    const r = ROOMS[+roomSel.value];
    $('#done-msg').textContent = `Thanks, ${name.value.trim().split(' ')[0]}. We've noted a ${r.name} for ${nights()} night${nights() > 1 ? 's' : ''} from ${fmtD(fin.value)}. The hotel will confirm by email at ${email.value.trim()}.`;
    form.hidden = true; done.hidden = false; done.focus();
    if (M.animate && !reduce) M.animate(done, { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] }, { duration: 0.8, ease: EASE });
  });
  $('#again').addEventListener('click', () => { form.reset(); fin.value = iso(d1); fout.value = iso(d2); updateSummary(); done.hidden = true; form.hidden = false; $('#name').focus(); });

  /* ---------- Lightbox gallery ---------- */
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap'), lbCount = $('#lb-count'), lbThumbs = $('#lb-thumbs');
  lbThumbs.innerHTML = GALLERY.map(([k, c], i) => `<button class="lb-thumb" type="button" data-i="${i}" aria-label="${c}"><img src="${img(k)}" alt="" loading="lazy"></button>`).join('');
  const thumbs = $$('.lb-thumb', lbThumbs);
  let lbI = 0, lastFocus = null;
  function show(i) {
    lbI = (i + GALLERY.length) % GALLERY.length;
    const [k, c] = GALLERY[lbI];
    lbImg.style.opacity = 0;
    const pre = new Image(); pre.onload = pre.onerror = () => { lbImg.src = img(k); lbImg.alt = c; lbImg.style.opacity = 1; }; pre.src = img(k);
    lbCap.textContent = c; lbCount.textContent = `${pad(lbI + 1)} / ${pad(GALLERY.length)}`;
    thumbs.forEach((t, j) => t.setAttribute('aria-current', String(j === lbI)));
    thumbs[lbI].scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function openLb(i) { lastFocus = document.activeElement; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('is-locked'); lenis?.stop(); show(i); $('#lb-close').focus(); }
  function closeLb() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('is-locked'); lenis?.start(); lastFocus?.focus(); }
  $$('[data-lb]').forEach((b) => b.addEventListener('click', () => openLb(+b.dataset.lb)));
  tourSlides.forEach((s) => { s.style.cursor = 'zoom-in'; s.addEventListener('click', () => openLb(GALLERY.findIndex(([k]) => k === TOUR[+s.dataset.i][0]))); });
  $('#lb-close').addEventListener('click', closeLb);
  $('#lb-prev').addEventListener('click', () => show(lbI - 1));
  $('#lb-next').addEventListener('click', () => show(lbI + 1));
  lbThumbs.addEventListener('click', (e) => { const t = e.target.closest('.lb-thumb'); if (t) show(+t.dataset.i); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') show(lbI - 1); else if (e.key === 'ArrowRight') show(lbI + 1);
    else if (e.key === 'Tab') { const f = $$('button', lb); const first = f[0], lastB = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); } else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); } }
  });
  let sx = null;
  $('.lb-stage').addEventListener('pointerdown', (e) => { sx = e.clientX; });
  $('.lb-stage').addEventListener('pointerup', (e) => { if (sx === null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 50) show(lbI + (d < 0 ? 1 : -1)); });

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)}px)`; });
      b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
    });
  }

  $('#yr').textContent = new Date().getFullYear();
})();
