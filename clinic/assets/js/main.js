/* =========================================================
   Aldena — interactions
   Lenis (smooth scroll) · GSAP ScrollTrigger (scrub) · Motion (reveals, springs)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || {};
  const EASE = [0.16, 1, 0.3, 1];
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    if (hasGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const scrollTo = (el) => { lenis ? lenis.scrollTo(el, { offset: -72, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollTo(el);
  }));

  /* ---------- Nav: light text over the dark film/booking, dark text elsewhere ---------- */
  const nav = $('#nav'), film = $('#top'), book = $('#book');
  const navState = () => {
    const y = window.scrollY, h = 60;
    const overFilm = y < film.offsetTop + film.offsetHeight - h;
    const overBook = y > book.offsetTop - h;
    nav.classList.toggle('on-light', !overFilm && !overBook);
    nav.classList.toggle('is-scrolled', y > 40);
  };
  addEventListener('scroll', navState, { passive: true }); addEventListener('resize', navState); navState();

  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-hidden', 'true'); lenis?.start(); }
  menuBtn?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    open ? lenis?.stop() : lenis?.start();
  });

  /* ---------- Hero headline ---------- */
  const heroH = $('[data-split]');
  if (heroH && M.animate && !reduce) {
    const frag = document.createDocumentFragment();
    const wrap = (node) => { const o = document.createElement('span'); o.className = 'word'; const i = document.createElement('span'); i.appendChild(node); o.appendChild(i); return o; };
    Array.from(heroH.childNodes).forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; frag.appendChild(/^\s+$/.test(w) ? document.createTextNode(' ') : wrap(document.createTextNode(w))); });
      else frag.appendChild(wrap(n.cloneNode(true)));
    });
    heroH.innerHTML = ''; heroH.appendChild(frag);
    M.animate($$('.word > span', heroH), { transform: ['translateY(105%)', 'translateY(0%)'] }, { duration: 1.1, delay: M.stagger(0.05, { startDelay: 0.2 }), ease: EASE });
    M.animate('[data-hero-fade]', { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 1, delay: M.stagger(0.12, { startDelay: 0.7 }), ease: EASE });
  }

  /* ---------- Film timeline ---------- */
  window.__film = window.__film || { p: 0 };
  if (hasGSAP) {
    const bars = $$('.progress i b');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#top', start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress, edges = [0, 0.3, 0.52, 0.74, 0.92, 1];
          bars.forEach((b, i) => { b.style.transform = `scaleX(${Math.min(1, Math.max(0, (p - edges[i]) / (edges[i + 1] - edges[i])))})`; });
        },
      },
    });
    tl.to(window.__film, { p: 1, ease: 'none', duration: 1 }, 0);
    const ch = (n) => $(`.ch[data-ch="${n}"]`);
    const inAt = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: 'power2.out' }, at);
    const outAt = (el, at) => tl.to(el, { autoAlpha: 0, y: -50, duration: 0.04, ease: 'power2.in' }, at);
    outAt(ch(0), 0.1);
    inAt(ch(1), 0.15); outAt(ch(1), 0.3);
    inAt(ch(2), 0.42); inAt('#vitals', 0.44); outAt(ch(2), 0.55); outAt('#vitals', 0.55);
    inAt(ch(3), 0.64); outAt(ch(3), 0.77);
    inAt(ch(4), 0.85);
  }

  /* ---------- ECG trace + BPM flicker ---------- */
  const ecg = $('#ecgPath');
  if (ecg && M.animate && !reduce) {
    const len = ecg.getTotalLength();
    ecg.style.strokeDasharray = `${len * 0.55} ${len * 0.45}`;
    M.animate(ecg, { strokeDashoffset: [len, 0] }, { duration: 2.2, repeat: Infinity, ease: 'linear' });
    const bpm = $('#bpm');
    setInterval(() => { bpm.textContent = 70 + Math.round(Math.random() * 5); }, 1400);
  }

  /* ---------- Phone: 3D tilt with scroll + panes that follow features ---------- */
  const phone = $('#phone');
  if (hasGSAP && phone && !reduce) {
    gsap.fromTo(phone, { rotateY: -22, rotateX: 10, rotateZ: -2 }, {
      rotateY: 16, rotateX: -6, rotateZ: 2, ease: 'none',
      scrollTrigger: { trigger: '#app .app', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
  const panes = $$('.pane');
  $$('.feat').forEach((f, i) => {
    const show = () => panes.forEach((p, j) => p.setAttribute('aria-hidden', String(j !== i)));
    if (hasGSAP) ScrollTrigger.create({ trigger: f, start: 'top 60%', end: 'bottom 40%', onEnter: show, onEnterBack: show });
  });

  /* ---------- Reveals ---------- */
  const revealEls = $$('[data-reveal]');
  if (M.inView && M.animate && !reduce) {
    let queue = [], timer = null;
    const flush = () => { M.animate(queue, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 0.9, delay: M.stagger(0.07), ease: EASE }); queue = []; timer = null; };
    M.inView(revealEls, (el) => { queue.push(el); if (!timer) timer = setTimeout(flush, 30); }, { margin: '0px 0px -8% 0px' });
  } else revealEls.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });

  /* ---------- Counters ---------- */
  $$('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count), d = +(el.dataset.decimals || 0);
    if (reduce || !M.inView) return;
    M.inView(el, () => { M.animate(0, target, { duration: 1.6, ease: EASE, onUpdate: (v) => { el.textContent = v.toFixed(d); } }); }, { amount: 0.6 });
  });

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
    });
  }

  /* ---------- Doctor filter ---------- */
  const docs = $$('.doc');
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    $$('.filter').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const f = btn.dataset.filter;
    const show = docs.filter((d) => f === 'all' || d.dataset.dept === f);
    docs.forEach((d) => { d.hidden = !show.includes(d); });
    if (M.animate && !reduce) M.animate(show, { opacity: [0, 1], transform: ['translateY(16px) scale(.98)', 'translateY(0) scale(1)'] }, { duration: 0.6, delay: M.stagger(0.05), ease: EASE });
  }));
  $$('[data-doctor]').forEach((a) => a.addEventListener('click', () => {
    const sel = $('#f-doc'); const name = a.dataset.doctor;
    Array.from(sel.options).forEach((o) => { if (o.text === name) sel.value = o.value; });
    const dept = a.closest('.doc')?.dataset.dept; if (dept) $('#f-dept').value = dept;
  }));

  /* ---------- Reviews marquee ---------- */
  const REVIEWS = [
    ['Booked at 8 am, saw a GP at 11:20 and had my bloods back before dinner.', 'Priya N.', 'Family medicine'],
    ['Dr. Farooqi walked me through my echo on the screen. First time a cardiologist made me feel calm.', 'Robert T.', 'Cardiology'],
    ['Separate kids’ waiting room with actual toys. My daughter didn’t cry once.', 'Hina A.', 'Pediatrics'],
    ['The app told me my results were normal with a note from the doctor. No anxious phone calls.', 'Marcus L.', 'Lab'],
    ['Walked in with a sprained ankle on a Sunday, X-ray and physio plan in under an hour.', 'Diego R.', 'Urgent care'],
    ['They noticed a mole my old clinic missed for years. Removed the same week.', 'Claire M.', 'Dermatology'],
    ['My GP, cardiologist and lab all had the same notes. I never had to repeat myself.', 'Ahmed S.', 'Cardiology'],
    ['Reception called back within five minutes to move my slot. That never happens.', 'Julia K.', 'Women’s health'],
  ];
  const card = ([t, n, d]) => `<article class="rev-card"><span class="stars" aria-label="5 out of 5">★★★★★</span><p>${t}</p><div class="who"><b>${n}</b><span>${d}</span></div></article>`;
  const fill = (el, list) => { if (!el) return; const html = list.map(card).join(''); el.innerHTML = html + html.replace(/<article/g, '<article aria-hidden="true"'); };
  fill($('#revA'), REVIEWS.slice(0, 4)); fill($('#revB'), REVIEWS.slice(4));

  /* ---------- Booking ---------- */
  $$('.slot-btn:not(:disabled)').forEach((s) => s.addEventListener('click', () => {
    $$('.slot-btn').forEach((o) => o.setAttribute('aria-pressed', String(o === s)));
  }));
  $('#bookForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name'), phone = $('#f-phone'), note = $('#formNote');
    if (!name.value.trim()) { note.textContent = 'Add your full name so reception can find your booking.'; note.style.color = '#ff9aa5'; name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length < 7) { note.textContent = 'Add a mobile number with at least 7 digits for the text confirmation.'; note.style.color = '#ff9aa5'; phone.focus(); return; }
    const slot = $('.slot-btn[aria-pressed="true"]')?.textContent || 'the next free slot';
    const dept = $('#f-dept').selectedOptions[0].text, doc = $('#f-doc').value;
    const ok = document.createElement('div'); ok.className = 'form-success'; ok.setAttribute('role', 'status');
    ok.textContent = `Request sent: ${dept}, today at ${slot}${doc !== 'First available' ? ' with ' + doc : ''}. A confirmation text is on its way to ${phone.value.trim()}.`;
    note.replaceWith(ok); e.target.querySelector('button[type="submit"]').disabled = true;
  });

  $('#yr') && ($('#yr').textContent = new Date().getFullYear());
  if (hasGSAP) { addEventListener('load', () => ScrollTrigger.refresh()); document.fonts?.ready.then(() => ScrollTrigger.refresh()); }
})();
