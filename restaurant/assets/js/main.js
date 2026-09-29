/* =========================================================
   Verdell — interactions
   Lenis (smooth scroll) · native scroll-driven film · Motion (reveals, springs)
   The film is driven by a plain requestAnimationFrame loop that reads the
   section's position, so it never depends on a third-party ticker.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || {};
  const EASE = [0.16, 1, 0.3, 1];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    try { lenis = new Lenis({ lerp: 0.085 }); } catch (e) { lenis = null; }
  }
  const scrollTo = (el) => { lenis ? lenis.scrollTo(el, { offset: -76, duration: 1.5 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollTo(el);
  }));

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-hidden', 'true'); lenis?.start(); }
  menuBtn?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    open ? lenis?.stop() : lenis?.start();
  });

  // Live open/closed state (Tue–Sat 17:30–23:00, visitor's local time)
  (() => {
    const el = $('#navHours'); if (!el) return;
    const d = new Date(), day = d.getDay(), mins = d.getHours() * 60 + d.getMinutes();
    const openDay = day >= 2 && day <= 6;
    if (openDay && mins >= 1050 && mins < 1380) el.textContent = 'Open now · until 23:00';
    else if (openDay && mins < 1050) el.textContent = 'Opens today · 17:30';
    else { const next = ['Tue', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Tue'][day]; el.textContent = `Opens ${next} · 17:30`; }
  })();

  /* ---------- Hero headline ---------- */
  const heroH = $('[data-split]');
  if (heroH && M.animate) {
    if (!reduce) {
      const frag = document.createDocumentFragment();
      const wrap = (node) => { const o = document.createElement('span'); o.className = 'word'; const i = document.createElement('span'); i.appendChild(node); o.appendChild(i); return o; };
      Array.from(heroH.childNodes).forEach((n) => {
        if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; frag.appendChild(/^\s+$/.test(w) ? document.createTextNode(' ') : wrap(document.createTextNode(w))); });
        else frag.appendChild(wrap(n.cloneNode(true)));
      });
      heroH.innerHTML = ''; heroH.appendChild(frag);
      M.animate($$('.word > span', heroH), { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 1.2, delay: M.stagger(0.07, { startDelay: 0.3 }), ease: EASE });
      M.animate('[data-hero-fade]', { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 1, delay: M.stagger(0.12, { startDelay: 0.9 }), ease: EASE });
      M.animate('.nav', { opacity: [0, 1], transform: ['translateY(-14px)', 'translateY(0)'] }, { duration: 0.9, delay: 0.2, ease: EASE });
    } else {
      M.animate([heroH, ...$$('[data-hero-fade]')], { opacity: [0, 1] }, { duration: 0.8, delay: M.stagger(0.1) });
    }
  }

  /* ---------- Plating film: native scroll driver ---------- */
  const film = (window.__film = window.__film || { p: 0 });
  const filmEl = $('#top'), bar = $('#filmBar'), pct = $('#filmPct'), card = $('#menuCard');
  const chapters = $$('.ch').map((el) => ({ el, n: +el.dataset.ch }));
  // [fade-in start, fade-out start] in film progress; chapter 0 is visible at load
  const WINDOWS = { 0: [-1, 0.09], 1: [0.13, 0.27], 2: [0.31, 0.45], 3: [0.49, 0.63], 4: [0.67, 0.81], 5: [0.86, 2] };
  const FADE = 0.035;
  const reserveEl = $('#reserve');
  let lastP = -1, lastY = -1;
  function tick() {
    requestAnimationFrame(tick);
    if (lenis) lenis.raf(performance.now());
    const y = window.scrollY;
    if (y === lastY && lastP >= 0) return;
    lastY = y;
    nav.classList.toggle('is-scrolled', y > 40);
    if (reserveEl) { const r = reserveEl.getBoundingClientRect(); nav.classList.toggle('on-light', r.top < 40 && r.bottom > 40); }
    const r = filmEl.getBoundingClientRect();
    const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
    film.p = p;
    if (Math.abs(p - lastP) < 0.0005) return;
    lastP = p;
    bar.style.transform = `scaleX(${p})`;
    pct.textContent = String(Math.round(p * 100)).padStart(2, '0') + '%';
    for (const { el, n } of chapters) {
      const [a, b] = WINDOWS[n];
      const fin = clamp01((p - a) / FADE), fout = clamp01((p - b) / FADE);
      const o = Math.min(fin, 1 - fout);
      const dy = fin < 1 ? (1 - fin) * 40 : -fout * 40;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      el.style.translate = reduce ? '0 0' : `0 ${dy.toFixed(1)}px`;
    }
    if (card) { const o = clamp01((p - 0.9) / FADE); card.style.opacity = o; card.style.visibility = o > 0.01 ? 'visible' : 'hidden'; }
  }
  requestAnimationFrame(tick);

  /* ---------- Reveals & counters ---------- */
  const revealEls = $$('[data-reveal]');
  if (M.inView && M.animate) {
    let queue = [], timer = null;
    const flush = () => {
      M.animate(queue, reduce ? { opacity: [0, 1], transform: ['none', 'none'] } : { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: reduce ? 0.6 : 1, delay: M.stagger(0.07), ease: EASE });
      queue = []; timer = null;
    };
    M.inView(revealEls, (el) => { queue.push(el); if (!timer) timer = setTimeout(flush, 30); }, { margin: '0px 0px -8% 0px' });
  } else revealEls.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  if (M.inView && !reduce) $$('[data-count]').forEach((el) => {
    const target = +el.dataset.count;
    M.inView(el, () => { M.animate(0, target, { duration: 1.6, ease: EASE, onUpdate: (v) => { el.textContent = Math.round(v); } }); }, { amount: 0.6 });
  });

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) $$('[data-magnetic]').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
    b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
  });

  /* ---------- Menu tabs + wine pairing ---------- */
  const tabs = $$('.tab');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute('aria-selected', String(on)); $('#' + t.getAttribute('aria-controls')).hidden = !on; });
    $('#pairSwitch').style.visibility = tab.id === 'tabTasting' ? 'visible' : 'hidden';
    const panel = $('#' + tab.getAttribute('aria-controls'));
    if (M.animate && !reduce) M.animate($$('.course', panel), { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: 0.6, delay: M.stagger(0.04), ease: EASE });
  }));
  $('#pairToggle')?.addEventListener('change', (e) => {
    const on = e.target.checked;
    $('#tastingList').classList.toggle('pairing-on', on);
    $('#menuTotal').innerHTML = `<small>Per guest</small>${on ? '$220 <span style="font-size:.55em;color:var(--cream-2)">with pairing</span>' : '$135'}`;
    if (on && M.animate && !reduce) M.animate('#tastingList .pairing', { opacity: [0, 1], transform: ['translateX(-8px)', 'translateX(0)'] }, { duration: 0.5, delay: M.stagger(0.05) });
  });

  /* ---------- Embers in the chef panel ---------- */
  const emb = $('#embers');
  if (emb) {
    const ctx = emb.getContext('2d'); let w, h, parts = [];
    const size = () => { const r = emb.getBoundingClientRect(); w = emb.width = r.width * Math.min(devicePixelRatio, 2); h = emb.height = r.height * Math.min(devicePixelRatio, 2); };
    size(); addEventListener('resize', size);
    const spawn = () => ({ x: w * (0.3 + Math.random() * 0.4), y: h + 10, vx: (Math.random() - 0.5) * 0.6, vy: -(0.6 + Math.random() * 1.6), r: 0.8 + Math.random() * 2.2, life: 0, max: 180 + Math.random() * 220 });
    for (let i = 0; i < 90; i++) { const p = spawn(); p.y = Math.random() * h; p.life = Math.random() * p.max; parts.push(p); }
    let on = true; new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(emb);
    const draw = () => {
      requestAnimationFrame(draw); if (!on) return;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w / 2, h * 1.05, 0, w / 2, h * 1.05, h * 0.7);
      g.addColorStop(0, 'rgba(229,162,58,.35)'); g.addColorStop(1, 'rgba(229,162,58,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      parts.forEach((p, i) => {
        if (!reduce) { p.x += p.vx + Math.sin((p.life + i) * 0.03) * 0.4; p.y += p.vy; p.life++; }
        const a = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = `rgba(255,${150 + Math.round(a * 80)},${60},${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + a), 0, Math.PI * 2); ctx.fill();
        if (p.life > p.max || p.y < -10) parts[i] = spawn();
      });
      ctx.globalCompositeOperation = 'source-over';
    };
    draw();
  }

  /* ---------- Reservation flow ---------- */
  const state = { party: 2, date: null, time: '19:30', seat: 'Dining room' };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const TIMES = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  const datesEl = $('#dates'), timesEl = $('#times');
  const fmtDate = (d) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const closed = d.getDay() === 0 || d.getDay() === 1;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'date'; b.disabled = closed;
    b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', fmtDate(d) + (closed ? ', closed' : ''));
    b.innerHTML = `<small>${i === 0 ? 'Today' : DAYS[d.getDay()]}</small><b class="num">${d.getDate()}</b><small>${closed ? 'Closed' : MONTHS[d.getMonth()]}</small>`;
    b.addEventListener('click', () => { state.date = d; $$('.date', datesEl).forEach((o) => o.setAttribute('aria-pressed', String(o === b))); renderTimes(); summary(); });
    datesEl.appendChild(b);
    if (!state.date && !closed) { state.date = d; b.setAttribute('aria-pressed', 'true'); }
  }

  function renderTimes() {
    timesEl.innerHTML = '';
    const key = state.date.toDateString() + state.party;
    let firstFree = null;
    TIMES.forEach((t, i) => {
      const full = (hash(key + t) % 5 === 0) || (state.party > 4 && i % 3 === 1);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'time num'; b.textContent = t; b.disabled = full;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { state.time = t; $$('.time', timesEl).forEach((o) => o.setAttribute('aria-pressed', String(o === b))); summary(); });
      timesEl.appendChild(b);
      if (!full && !firstFree) firstFree = b;
      if (!full && t === state.time) b.setAttribute('aria-pressed', 'true');
    });
    if (!$('.time[aria-pressed="true"]', timesEl) && firstFree) { firstFree.setAttribute('aria-pressed', 'true'); state.time = firstFree.textContent; }
  }

  const seats = $$('.seat');
  seats.forEach((s) => s.addEventListener('click', () => { if (s.disabled) return; state.seat = s.textContent; seats.forEach((o) => o.setAttribute('aria-pressed', String(o === s))); summary(); }));
  const setParty = (n) => {
    state.party = Math.max(1, Math.min(10, n));
    $('#party').textContent = `${state.party} guest${state.party > 1 ? 's' : ''}`;
    const counter = seats[0]; counter.disabled = state.party > 4; counter.style.opacity = counter.disabled ? 0.35 : 1;
    if (counter.disabled && state.seat === "Chef's counter") seats[1].click();
    if (state.party > 6 && state.seat !== 'Garden room') seats[2].click();
    renderTimes(); summary();
  };
  $('#minus').addEventListener('click', () => setParty(state.party - 1));
  $('#plus').addEventListener('click', () => setParty(state.party + 1));

  function summary() {
    const s = `Table for ${state.party} · ${fmtDate(state.date)} · ${state.time} · ${state.seat}`;
    $('#summary').textContent = s;
    if (M.animate && !reduce) M.animate('#summary', { opacity: [0.4, 1] }, { duration: 0.4 });
  }
  renderTimes(); summary();

  $('#resForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#r-name'), phone = $('#r-phone'), note = $('#rnote');
    if (!name.value.trim()) { note.textContent = 'Add the name the table is under.'; name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length < 7) { note.textContent = 'Add a phone number so we can text your confirmation.'; phone.focus(); return; }
    const ok = document.createElement('div'); ok.className = 'confirm'; ok.setAttribute('role', 'status');
    ok.innerHTML = `<span class="label" style="color:var(--brass)">Request received</span><b></b><span></span>`;
    ok.querySelector('b').textContent = `${name.value.trim().split(' ')[0]}, we're holding it.`;
    ok.querySelector('span:last-child').textContent = `${$('#summary').textContent}. We'll text ${phone.value.trim()} to confirm within 30 minutes.`;
    note.replaceWith(ok); e.target.querySelector('button[type="submit"]').disabled = true;
    if (M.animate && !reduce) M.animate(ok, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { duration: 0.6, ease: EASE });
  });

  $('#yr') && ($('#yr').textContent = new Date().getFullYear());
})();
