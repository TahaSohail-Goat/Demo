/* Calder Hale — site behaviour. Bundled to ../js/main.js with esbuild (see README). */
import Lenis from 'lenis';
import { animate, inView, scroll, stagger } from 'motion';
import { initSequence } from './sequence.js';
import { initListingsPage } from './listings.js';
import { initPropertyPage } from './property.js';

const EASE = [0.16, 1, 0.3, 1];
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

let lenis = null;

function initSmoothScroll() {
  if (reduceMotion) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -76 } });
  const raf = time => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

function initHeader() {
  const header = $('[data-header]');
  if (!header) return;
  const overlay = header.dataset.variant !== 'solid';
  const hero = $('[data-sequence]');
  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (overlay) {
      const limit = hero ? hero.offsetTop + hero.offsetHeight - header.offsetHeight : 40;
      header.classList.toggle('is-solid', y > limit);
      // Auto-hide while reading, reveal on any upward scroll.
      const menuOpen = document.body.classList.contains('menu-open');
      header.classList.toggle('is-hidden', !menuOpen && y > lastY + 2 && y > limit + 200);
      if (y < lastY - 2) header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();
}

function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const panel = $('[data-menu-panel]');
  const close = $('[data-menu-close]');
  if (!toggle || !panel) return;
  const links = $$('[data-menu-link]', panel);
  let open = false;

  const focusables = () => $$('a[href], button:not([disabled])', panel);

  const openMenu = () => {
    open = true;
    panel.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    lenis?.stop();
    if (!reduceMotion) {
      animate(panel, { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] }, { duration: 0.7, ease: EASE });
      animate(links, { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, { duration: 0.8, delay: stagger(0.06, { startDelay: 0.18 }), ease: EASE });
    }
    close.focus();
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!open) return;
    open = false;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    lenis?.start();
    const finish = () => { if (!open) panel.classList.remove('is-open'); };
    if (reduceMotion) finish();
    else animate(panel, { clipPath: 'inset(0 0 100% 0)' }, { duration: 0.5, ease: EASE }).then(finish);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  close.addEventListener('click', () => closeMenu());
  links.forEach(item => item.querySelector('a')?.addEventListener('click', () => closeMenu({ restoreFocus: false })));
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
    if (event.key !== 'Tab') return;
    const items = focusables();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', event => { if (event.matches) closeMenu({ restoreFocus: false }); });
}

function initReveals() {
  if (reduceMotion) return;
  root.classList.add('motion-ready');
  inView('[data-reveal]', element => {
    const delay = Number(element.dataset.delay) || 0;
    const type = element.dataset.reveal;
    if (type === 'clip') animate(element, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.2, delay, ease: EASE });
    else if (type === 'fade') animate(element, { opacity: [0, 1] }, { duration: 1, delay });
    else animate(element, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 1.1, delay, ease: EASE });
  }, { margin: '0px 0px -8% 0px' });
}

/** Statement text that lights up word by word as it scrolls through the viewport. */
function initLitText() {
  if (reduceMotion) return;
  $$('[data-lit]').forEach(element => {
    const words = element.textContent.trim().split(/\s+/);
    element.replaceChildren(...words.flatMap((word, i) => {
      const span = document.createElement('span');
      span.className = 'lit-word';
      span.textContent = word;
      return i < words.length - 1 ? [span, ' '] : [span];
    }));
    const spans = $$('.lit-word', element);
    scroll(progress => {
      const lit = progress * spans.length * 1.15;
      spans.forEach((span, i) => { span.style.opacity = clamp(0.16 + (lit - i), 0.16, 1).toFixed(2); });
    }, { target: element, offset: ['start 88%', 'end 45%'] });
  });
}

function initCounters() {
  if (reduceMotion) return;
  inView('[data-count]', element => {
    const to = Number.parseFloat(element.dataset.count);
    const decimals = Number(element.dataset.decimals) || 0;
    animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: value => { element.textContent = value.toFixed(decimals); }
    });
  });
}

/** Desktop: vertical scroll drives a pinned horizontal rail. Mobile: native swipe. */
function initRail() {
  const section = $('[data-hscroll]');
  const track = section && $('[data-rail]', section);
  if (!track) return;
  const bar = $('[data-rail-bar]', section);
  const desktop = window.matchMedia('(min-width: 1024px)');
  let stop = null;
  let distance = 0;

  const setup = () => {
    stop?.();
    stop = null;
    track.style.transform = '';
    section.style.height = '';
    delete section.dataset.ready;
    if (!desktop.matches || reduceMotion) return;
    section.dataset.ready = '';
    distance = Math.max(0, track.scrollWidth - track.clientWidth);
    section.style.height = `${distance + window.innerHeight}px`;
    stop = scroll(progress => {
      track.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
      if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    }, { target: section, offset: ['start start', 'end end'] });
  };

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setup, 200);
  });
  desktop.addEventListener('change', setup);
  // Keyboard users tabbing through cards should land on the card they focused.
  track.addEventListener('focusin', event => {
    if (!section.dataset.ready || !distance) return;
    const card = event.target.closest('[data-tilt], a');
    if (!card) return;
    const offset = clamp(card.offsetLeft - track.offsetLeft - 48, 0, distance);
    const top = section.offsetTop + offset;
    if (lenis) lenis.scrollTo(top, { immediate: true });
    else window.scrollTo(0, top);
  });
  setup();
}

function initTilt(scope = document) {
  if (!finePointer || reduceMotion) return;
  $$('[data-tilt]', scope).forEach(card => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = 'true';
    const target = $('[data-tilt-target]', card) || card;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      target.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
      target.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
      animate(target, { transform: `rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)` }, { duration: 0.45, ease: 'easeOut' });
    });
    card.addEventListener('pointerleave', () => {
      animate(target, { transform: 'rotateY(0deg) rotateX(0deg)' }, { duration: 0.9, ease: EASE });
    });
  });
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Linea Residences: loads the Three.js scene only when the section approaches. */
function initResidences() {
  const section = $('[data-residences]');
  if (!section) return;
  const canvas = $('[data-res-canvas]', section);
  const items = $$('[data-level]', section);
  let api = null;
  let progress = reduceMotion ? 0.5 : 0;
  let visible = false;

  const setActive = group => {
    items.forEach((item, index) => { item.dataset.active = String(group === -1 || index === group); });
    api?.setActive(group);
  };
  const groupFor = p => {
    if (p < 0.2 || p > 0.9) return -1;
    return Math.min(3, Math.floor((p - 0.2) / 0.175));
  };
  const fallback = () => {
    section.dataset.fallback = '';
    delete section.dataset.ready;
    setActive(-1);
  };

  if (!supportsWebGL()) { fallback(); return; }
  if (!reduceMotion) section.dataset.ready = '';
  setActive(reduceMotion ? -1 : groupFor(progress));

  const stopLoading = inView(section, () => {
    stopLoading();
    import(new URL('js/residence-3d.js', document.baseURI).href)
      .then(module => {
        api = module.createResidence(canvas, { reduceMotion });
        api.setProgress(progress);
        api.setActive(reduceMotion ? -1 : groupFor(progress));
        if (visible && !reduceMotion) api.start();
      })
      .catch(fallback);
  }, { margin: '800px 0px 800px 0px' });

  inView(section, () => {
    visible = true;
    if (!reduceMotion) api?.start();
    return () => { visible = false; api?.stop(); };
  }, { margin: '100px 0px 100px 0px' });

  if (!reduceMotion) {
    scroll(p => {
      progress = p;
      api?.setProgress(p);
      setActive(groupFor(p));
    }, { target: section, offset: ['start start', 'end end'] });
  }

  if (finePointer) {
    section.addEventListener('pointermove', event => {
      api?.setPointer(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
    });
  }
}

/** Framed film that expands to full-bleed as the section is scrolled. */
function initExpand() {
  const section = $('[data-expand]');
  if (!section || reduceMotion) return;
  const frame = $('[data-expand-frame]', section);
  const copy = $('[data-expand-copy]', section);
  section.dataset.ready = '';
  scroll(progress => {
    const t = clamp(progress / 0.55, 0, 1);
    const eased = 1 - (1 - t) ** 3;
    const insetX = (window.innerWidth < 768 ? 5 : 20) * (1 - eased);
    const insetY = 13 * (1 - eased);
    frame.style.clipPath = `inset(${insetY.toFixed(2)}% ${insetX.toFixed(2)}% round ${(28 * (1 - eased)).toFixed(1)}px)`;
    const c = clamp((progress - 0.28) / 0.3, 0, 1);
    copy.style.opacity = c.toFixed(3);
    copy.style.transform = `translateY(${((1 - c) * 40).toFixed(1)}px) scale(${(0.96 + c * 0.04).toFixed(3)})`;
  }, { target: section, offset: ['start start', 'end end'] });
}

function initAmbientVideo() {
  $$('video[data-ambient]').forEach(video => {
    if (reduceMotion) return; // Poster frame only.
    inView(video, () => {
      video.preload = 'auto';
      video.play().catch(() => {});
      return () => video.pause();
    }, { margin: '200px 0px 200px 0px' });
  });
  if (reduceMotion) return;
  $$('[data-parallax]').forEach(element => {
    scroll(progress => { element.style.transform = `translateY(${((progress - 0.5) * 16).toFixed(2)}%)`; }, {
      target: element.parentElement,
      offset: ['start end', 'end start']
    });
  });
}

/** Floating image preview that follows the cursor over the neighborhood list. */
function initNeighborhoods() {
  const list = $('[data-hoods]');
  const preview = $('[data-hood-preview]');
  if (!list || !preview || !finePointer || reduceMotion) return;
  const image = $('img', preview);
  const position = { x: 0, y: 0, cx: 0, cy: 0 };
  let rafId = 0;
  let shown = false;

  $$('[data-hood-image]', list).forEach(link => {
    const img = new Image();
    img.src = link.dataset.hoodImage;
    link.addEventListener('pointerenter', () => {
      image.src = link.dataset.hoodImage;
      if (!shown) {
        position.cx = position.x;
        position.cy = position.y;
      }
      shown = true;
      animate(preview, { opacity: 1, scale: 1 }, { duration: 0.5, ease: EASE });
    });
  });
  list.addEventListener('pointerleave', () => {
    shown = false;
    animate(preview, { opacity: 0, scale: 0.9 }, { duration: 0.4, ease: EASE });
  });

  const follow = () => {
    position.cx += (position.x - position.cx) * 0.14;
    position.cy += (position.y - position.cy) * 0.14;
    preview.style.translate = `${(position.cx + 28).toFixed(1)}px ${(position.cy - 170).toFixed(1)}px`;
    rafId = Math.abs(position.x - position.cx) + Math.abs(position.y - position.cy) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  list.addEventListener('pointermove', event => {
    position.x = event.clientX;
    position.y = event.clientY;
    if (!rafId) rafId = requestAnimationFrame(follow);
  });
}

function initSteps() {
  const steps = $('[data-steps]');
  const line = steps && $('[data-steps-line]', steps);
  if (!line || reduceMotion) return;
  scroll(progress => { line.style.transform = `scaleY(${progress.toFixed(4)})`; }, {
    target: steps,
    offset: ['start 70%', 'end 60%']
  });
}

function initForms() {
  $$('[data-demo-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const status = $('.form-status', form);
      if (!status) return;
      status.classList.add('is-visible');
      status.focus();
      if (!reduceMotion) animate(status, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] }, { duration: 0.6, ease: EASE });
    });
  });
}

function initHeroFallback() {
  // The hero intro starts hidden to avoid a flash before its entrance animation;
  // with reduced motion there is no entrance, so show it immediately.
  if (reduceMotion) $$('[data-hero-in]').forEach(element => { element.style.opacity = '1'; });
}

function init() {
  initSmoothScroll();
  initHeader();
  initMenu();
  initHeroFallback();

  const sequence = $('[data-sequence]');
  if (sequence) initSequence(sequence, { reduceMotion });

  const listings = $('[data-listings]');
  if (listings) initListingsPage(listings, { reduceMotion, onCardsRendered: initTilt });

  const property = $('[data-property]');
  if (property) initPropertyPage(property, { reduceMotion, onCardsRendered: initTilt });

  initReveals();
  initLitText();
  initCounters();
  initRail();
  initTilt();
  initResidences();
  initExpand();
  initAmbientVideo();
  initNeighborhoods();
  initSteps();
  initForms();
  $$('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
