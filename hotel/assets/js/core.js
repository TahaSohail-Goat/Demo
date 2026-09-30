/* =========================================================
   Niche core — shared interactions for every template
   Lenis smooth scroll · native scroll-film driver · Motion reveals
   Each site's main.js calls Core.* after this file loads.

   Film chapters: any element inside the film section with
   data-in / data-out (film progress 0..1) fades in/out on scroll.
   Nav colour: sections with data-nav="light" | "dark" set the nav theme.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = window.Motion || {};
  const EASE = [0.16, 1, 0.3, 1];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  let lenis = null;
  if (!reduce && window.Lenis) { try { lenis = new Lenis({ lerp: 0.09 }); } catch (e) { lenis = null; } }

  const scrollTo = (el) => { lenis ? lenis.scrollTo(el, { offset: -76, duration: 1.4 }) : el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };

  /* ---------- Toast ---------- */
  let toastEl, toastT;
  const toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  };

  /* ---------- Nav + menu ---------- */
  function nav() {
    const navEl = $('#nav'), menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
    const close = () => { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-hidden', 'true'); lenis?.start(); };
    menuBtn?.addEventListener('click', () => {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); menu?.setAttribute('aria-hidden', String(!open));
      open ? lenis?.stop() : lenis?.start();
    });
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return; const el = $(id); if (!el) return;
      e.preventDefault(); close(); scrollTo(el);
    }));
    return navEl;
  }

  /* ---------- Hero words + fades ---------- */
  function hero() {
    const h = $('[data-split]');
    if (!M.animate) return;
    if (h && !reduce) {
      const frag = document.createDocumentFragment();
      const wrap = (node) => { const o = document.createElement('span'); o.className = 'word'; const i = document.createElement('span'); i.appendChild(node); o.appendChild(i); return o; };
      Array.from(h.childNodes).forEach((n) => {
        if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; frag.appendChild(/^\s+$/.test(w) ? document.createTextNode(' ') : wrap(document.createTextNode(w))); });
        else if (n.nodeName === 'BR') frag.appendChild(n.cloneNode());
        else frag.appendChild(wrap(n.cloneNode(true)));
      });
      h.innerHTML = ''; h.appendChild(frag);
      M.animate($$('.word > span', h), { transform: ['translateY(110%)', 'translateY(0%)'] }, { duration: 1.15, delay: M.stagger(0.06, { startDelay: 0.25 }), ease: EASE });
      M.animate('[data-hero-fade]', { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0)'] }, { duration: 1, delay: M.stagger(0.12, { startDelay: 0.85 }), ease: EASE });
    } else if (h) {
      M.animate([h, ...$$('[data-hero-fade]')], { opacity: [0, 1] }, { duration: 0.8, delay: M.stagger(0.1) });
    }
  }

  /* ---------- Scroll film + nav theme (one rAF loop) ---------- */
  const film = (window.__film = window.__film || { p: 0 });
  function loop({ filmSel = '#top', onProgress } = {}) {
    const navEl = $('#nav');
    const filmEl = $(filmSel);
    const overlays = filmEl ? $$('[data-in]', filmEl).map((el) => ({ el, a: +el.dataset.in, b: el.dataset.out !== undefined ? +el.dataset.out : 2, move: el.dataset.move !== 'none' })) : [];
    const themed = $$('[data-nav]');
    const FADE = 0.035;
    let lastY = -1, lastP = -1;
    function tick(now) {
      requestAnimationFrame(tick);
      if (lenis) lenis.raf(now);
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      if (navEl) {
        navEl.classList.toggle('is-scrolled', y > 40);
        let theme = null;
        for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= 44 && r.bottom > 44) { theme = s.dataset.nav; break; } }
        navEl.classList.toggle('nav-light', theme === 'light');
        navEl.classList.toggle('nav-dark', theme === 'dark');
      }
      if (!filmEl) return;
      const r = filmEl.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(1, r.height - innerHeight));
      film.p = p;
      if (Math.abs(p - lastP) < 0.0004) return;
      lastP = p;
      for (const o of overlays) {
        const fin = clamp01((p - o.a) / FADE), fout = clamp01((p - o.b) / FADE);
        const op = Math.min(fin, 1 - fout);
        o.el.style.opacity = op.toFixed(3);
        o.el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
        if (o.move && !reduce) o.el.style.translate = `0 ${(fin < 1 ? (1 - fin) * 40 : -fout * 40).toFixed(1)}px`;
      }
      onProgress && onProgress(p);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Reveals, counters, magnetic ---------- */
  function reveals() {
    const els = $$('[data-reveal]');
    if (!(M.inView && M.animate)) { els.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
    let queue = [], timer = null;
    const flush = () => {
      M.animate(queue, reduce ? { opacity: [0, 1] } : { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: reduce ? 0.5 : 0.95, delay: M.stagger(0.07), ease: EASE });
      queue = []; timer = null;
    };
    M.inView(els, (el) => { queue.push(el); if (!timer) timer = setTimeout(flush, 30); }, { margin: '0px 0px -8% 0px' });
  }
  function counters() {
    const fmt = (el, v) => { const d = +(el.dataset.decimals || 0); const s = v.toFixed(d); return el.dataset.format === 'comma' ? Number(s).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : s; };
    $$('[data-count]').forEach((el) => {
      const target = parseFloat(el.dataset.count);
      if (reduce || !M.inView) { el.textContent = fmt(el, target); return; }
      M.inView(el, () => { M.animate(0, target, { duration: 1.7, ease: EASE, onUpdate: (v) => { el.textContent = fmt(el, v); } }); }, { amount: 0.6 });
    });
  }
  function magnetic() {
    if (reduce || !matchMedia('(hover: hover)').matches) return;
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
      b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
    });
  }
  // Single-choice button groups: <div data-choice> <button aria-pressed> ...
  function choices(root = document) {
    $$('[data-choice]', root).forEach((g) => {
      $$('button', g).forEach((b) => b.addEventListener('click', () => {
        if (b.disabled) return;
        $$('button', g).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        g.dispatchEvent(new CustomEvent('choice', { detail: b }));
      }));
    });
  }

  function init(opts = {}) {
    nav(); hero(); loop(opts); reveals(); counters(); magnetic(); choices();
    const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
  }

  window.Core = { $, $$, reduce, M, EASE, clamp01, toast, scrollTo, init, get lenis() { return lenis; } };
})();
