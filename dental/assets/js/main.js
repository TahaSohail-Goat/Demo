/* =========================================================
   Ivora — interactions
   Lenis (smooth scroll) · GSAP ScrollTrigger (pin/scrub) · Motion (reveals, springs)
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
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : -70, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (a.hasAttribute('data-scroll-story')) {
      e.preventDefault();
      const story = $('#top');
      scrollTo(story.offsetTop + (story.offsetHeight - innerHeight) * 0.24);
      return;
    }
    if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollTo(el);
  }));

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-hidden', 'true'); lenis?.start(); }
  menuBtn?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    open ? lenis?.stop() : lenis?.start();
  });

  /* ---------- Hero headline split + intro ---------- */
  function splitWords(el) {
    const frag = document.createDocumentFragment();
    const wrap = (node) => { const o = document.createElement('span'); o.className = 'split-line'; const i = document.createElement('span'); i.appendChild(node); o.appendChild(i); return o; };
    Array.from(el.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(wrap(document.createTextNode(w)));
        });
      } else frag.appendChild(wrap(n.cloneNode(true)));
    });
    el.innerHTML = ''; el.appendChild(frag);
    el.querySelectorAll('.split-line').forEach((s) => { s.style.display = 'inline-block'; });
    return $$('.split-line > span', el);
  }
  const heroH = $('[data-split]');
  if (heroH && M.animate) {
    const words = splitWords(heroH);
    if (!reduce) {
      M.animate(words, { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 1.1, delay: M.stagger(0.06, { startDelay: 0.15 }), ease: EASE });
      M.animate('[data-hero-fade]', { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] }, { duration: 1, delay: M.stagger(0.12, { startDelay: 0.6 }), ease: EASE });
      M.animate('.nav', { opacity: [0, 1], transform: ['translateY(-12px)', 'translateY(0)'] }, { duration: 0.9, delay: 0.3, ease: EASE });
    }
  }

  /* ---------- 3D story timeline ---------- */
  window.__story = window.__story || { p: 0 };
  if (hasGSAP) {
    const rails = $$('[data-rail]');
    const ch = (n) => $(`.chapter[data-ch="${n}"]`);
    const lab = (n) => $(`[data-anchor="${n}"]`);
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: '#top', start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          const idx = p < 0.15 ? 0 : p < 0.35 ? 1 : p < 0.57 ? 2 : p < 0.85 ? 3 : 4;
          rails.forEach((r, i) => r.classList.toggle('is-active', i === idx));
        },
      },
    });
    tl.to(window.__story, { p: 1, ease: 'none', duration: 1 }, 0);
    const inAt = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.04 }, at);
    const outAt = (el, at) => tl.to(el, { autoAlpha: 0, y: -50, duration: 0.04, ease: 'power2.in' }, at);
    outAt(ch(0), 0.1);
    outAt('.hero-meta', 0.08);
    inAt(ch(1), 0.16); outAt(ch(1), 0.31);
    tl.fromTo(lab('fdi'), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.19).to(lab('fdi'), { opacity: 0, duration: 0.03 }, 0.3);
    inAt(ch(2), 0.36); outAt(ch(2), 0.53);
    inAt(ch(3), 0.58); outAt(ch(3), 0.81);
    ['crown', 'abutment', 'fixture'].forEach((k, i) => {
      tl.fromTo(lab(k), { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.64 + i * 0.025).to(lab(k), { opacity: 0, duration: 0.03 }, 0.8);
    });
    inAt(ch(4), 0.88);
    tl.fromTo('.story-ghost', { yPercent: 0 }, { yPercent: -30, ease: 'none', duration: 1 }, 0);
  }

  /* ---------- Horizontal treatments (desktop) ---------- */
  if (hasGSAP) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const track = $('.h-track');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#treatments', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      return () => tween.scrollTrigger && tween.scrollTrigger.kill();
    });

    // Process line draws with scroll
    const line = $('#processLine');
    if (line) {
      const vertical = () => innerWidth <= 860;
      gsap.fromTo(line, { scaleX: vertical() ? 1 : 0, scaleY: vertical() ? 0 : 1 }, {
        scaleX: 1, scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '#process', start: 'top 75%', end: 'bottom 60%', scrub: true },
      });
    }
    // Nav flips to dark over dark sections
    ['#treatments', '#book'].forEach((sel) => {
      const el = $(sel); const trg = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;
      ScrollTrigger.create({ trigger: trg, start: 'top 40px', end: sel === '#book' ? 'max' : 'bottom 40px', onToggle: (self) => nav.classList.toggle('on-dark', self.isActive) });
    });
    // Footer wordmark parallax
    gsap.fromTo('.footer-word', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------- Reveals ---------- */
  const revealEls = $$('[data-reveal]');
  if (M.inView && M.animate && !reduce) {
    let queue = [], timer = null;
    const flush = () => { M.animate(queue, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 0.9, delay: M.stagger(0.08), ease: EASE }); queue = []; timer = null; };
    M.inView(revealEls, (el) => { queue.push(el); if (!timer) timer = setTimeout(flush, 30); }, { margin: '0px 0px -8% 0px' });
  } else {
    revealEls.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------- Counters ---------- */
  const fmt = (el, v) => {
    const d = +(el.dataset.decimals || 0);
    const s = v.toFixed(d);
    return el.dataset.format === 'comma' ? Number(s).toLocaleString('en-US') : s;
  };
  $$('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    if (reduce || !M.inView) { el.textContent = fmt(el, target); return; }
    M.inView(el, () => { M.animate(0, target, { duration: 1.8, ease: EASE, onUpdate: (v) => { el.textContent = fmt(el, v); } }); }, { amount: 0.6 });
  });

  /* ---------- Magnetic buttons & tilt cards ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
    });
    $$('[data-tilt]').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8, ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        c.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      c.addEventListener('pointerleave', () => { M.animate ? M.animate(c, { transform: 'perspective(900px) rotateX(0deg) rotateY(0deg)' }, { duration: 0.8, ease: EASE }) : (c.style.transform = ''); });
    });
  }

  /* ---------- VITA shade guide ---------- */
  const SHADES = [
    ['B1', '#f4eee2'], ['A1', '#efe4cf'], ['B2', '#ece0c4'], ['D2', '#e7dac6'], ['A2', '#e9d6b7'], ['C1', '#e3d7c3'],
    ['C2', '#dccdb3'], ['D4', '#dbc8aa'], ['A3', '#dfc7a0'], ['D3', '#d9c6a9'], ['B3', '#dcc295'], ['A3.5', '#d6b98f'],
    ['B4', '#d3b487'], ['C3', '#cdb998'], ['A4', '#caa97f'], ['C4', '#bfa381'],
  ];
  const scale = $('#shadeScale'), codes = $('#shadeCodes'), range = $('#shadeRange');
  if (scale && range) {
    SHADES.forEach(([c, hex]) => {
      const t = document.createElement('div'); t.className = 'shade-tab'; t.style.background = `linear-gradient(180deg, ${hex}, ${hex} 60%, #fff0 140%), ${hex}`; scale.appendChild(t);
      const s = document.createElement('span'); s.textContent = c; codes.appendChild(s);
    });
    const tabs = $$('.shade-tab', scale);
    const tooth = $('#shadeTooth');
    const update = () => {
      const now = +range.value, after = Math.max(0, now - 7);
      tabs.forEach((t, i) => { t.classList.toggle('is-now', i === now); t.classList.toggle('is-after', i === after && after !== now); });
      tooth.setAttribute('fill', SHADES[now][1]);
      $('#shadeNowCode').textContent = SHADES[now][0];
      $('#shadeAfterCode').textContent = SHADES[after][0];
      $('#shadeResult').innerHTML = now === 0
        ? 'You are already at <b>B1</b>, the lightest natural shade. A hygiene clean will keep it that way.'
        : `From <b>${SHADES[now][0]}</b>, in-chair whitening typically lifts you to around <b>${SHADES[after][0]}</b>.`;
    };
    range.addEventListener('input', update);
    // Preview the whitening once when the section comes into view
    if (M.inView && !reduce) {
      M.inView('#whitening', () => {
        let i = 15; const start = +range.value;
        const tick = () => { range.value = i; update(); if (i > start) { i--; setTimeout(tick, 45); } };
        tick();
      }, { amount: 0.4 });
    }
    update();
  }

  /* ---------- Reviews ---------- */
  const REVIEWS = [
    ['I hadn’t been to a dentist in nine years. They showed me my scan, told me the exact cost, and the implant was done before I’d finished my playlist.', 'Hamza K. · Single implant'],
    ['My veneers look like my teeth, just on a good day. Dr. Rehman redesigned the edges twice until I was happy with the trial smile.', 'Mariam S. · Six veneers'],
    ['My son actually asks when his next check-up is. The ceiling projector did more than any bribe I tried.', 'Daniel W. · Family plan'],
  ];
  let qi = 0;
  const qText = $('#quoteText'), qBy = $('#quoteBy'), qCount = $('#quoteCount');
  const showQ = (n) => {
    qi = (n + REVIEWS.length) % REVIEWS.length;
    const set = () => { qText.textContent = REVIEWS[qi][0]; qBy.textContent = REVIEWS[qi][1]; qCount.textContent = `${String(qi + 1).padStart(2, '0')} / ${String(REVIEWS.length).padStart(2, '0')}`; };
    if (!M.animate || reduce) return set();
    M.animate([qText, qBy], { opacity: 0, transform: 'translateY(-12px)' }, { duration: 0.3 }).then(() => {
      set(); M.animate([qText, qBy], { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0px)'] }, { duration: 0.7, ease: EASE });
    });
  };
  $('#qPrev')?.addEventListener('click', () => showQ(qi - 1));
  $('#qNext')?.addEventListener('click', () => showQ(qi + 1));

  /* ---------- Booking form ---------- */
  $$('.chip').forEach((c) => c.addEventListener('click', () => {
    $$('.chip').forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
  }));
  const form = $('#bookForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#f-name'), phone = $('#f-phone');
    const note = $('#formNote');
    if (!name.value.trim() || phone.value.replace(/\D/g, '').length < 7) {
      note.textContent = !name.value.trim() ? 'Please add your name so we know who to ask for.' : 'Please add a phone number with at least 7 digits.';
      note.style.color = '#f08a9c';
      (!name.value.trim() ? name : phone).focus();
      return;
    }
    const concern = $('.chip[aria-pressed="true"]')?.textContent || 'a visit';
    const ok = document.createElement('div'); ok.className = 'form-success'; ok.setAttribute('role', 'status');
    ok.textContent = `Thanks, ${name.value.trim().split(' ')[0]}. Your request for ${concern.toLowerCase()} is in. We'll call ${phone.value.trim()} within one working hour to confirm a time.`;
    note.replaceWith(ok); form.querySelector('button[type="submit"]').disabled = true;
  });

  $('#yr') && ($('#yr').textContent = new Date().getFullYear());
})();
