import { animate, scroll, stagger } from 'motion';

/*
 * Scroll-scrubbed film. Pre-rendered frames (assets/sequence/{desktop|mobile}) are
 * painted onto a canvas so scrubbing is frame-accurate on every device, which
 * <video>.currentTime seeking is not (especially on iOS Safari).
 *
 * Frames load coarse-to-fine (every 32nd, 16th, ... frame) and the nearest loaded
 * frame is drawn meanwhile, so the film is scrubbable within the first few requests.
 */

const PORTRAIT = '(max-aspect-ratio: 4/5)';
const CONCURRENCY = 6;
// [fade-in start, fully visible, fade-out start, hidden] per chapter, in scroll progress.
const CHAPTER_WINDOWS = [
  [-1, 0, 0.12, 0.2],
  [0.22, 0.3, 0.44, 0.52],
  [0.6, 0.68, 1.1, 1.2]
];
const LABELS = [[0.2, 'Scroll'], [0.56, '01 · Arrive'], [2, '02 · Step inside']];

const visibility = (p, [a, b, c, d]) => {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  return 1 - (p - c) / (d - c);
};

export function initSequence(section, { reduceMotion }) {
  const canvas = section.querySelector('[data-seq-canvas]');
  const count = Number(section.dataset.frames) || 0;
  const context = canvas?.getContext('2d', { alpha: false });
  if (!canvas || !context || !count || reduceMotion) return;

  section.dataset.ready = '';
  const chapters = [...section.querySelectorAll('[data-chapter]')];
  const bar = section.querySelector('[data-seq-bar]');
  const label = section.querySelector('[data-seq-label]');
  const portrait = window.matchMedia(PORTRAIT);

  let frames = [];
  let generation = 0;
  let target = 0;
  let current = 0;
  let drawnFrame = null;
  let rafId = 0;

  const frameUrl = (set, index) => `assets/sequence/${set}/f${String(index + 1).padStart(3, '0')}.webp`;

  const loadOrder = () => {
    const order = [];
    const seen = new Set();
    for (const step of [32, 16, 8, 4, 2, 1]) {
      for (let i = 0; i < count; i += step) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    if (!seen.has(count - 1)) order.push(count - 1);
    return order;
  };

  const nearestLoaded = index => {
    for (let offset = 0; offset < count; offset += 1) {
      if (frames[index - offset]) return frames[index - offset];
      if (frames[index + offset]) return frames[index + offset];
    }
    return null;
  };

  const draw = () => {
    const image = nearestLoaded(Math.round(current));
    if (!image || image === drawnFrame) return;
    const { width, height } = canvas;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale;
    const h = image.naturalHeight * scale;
    context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
    if (!drawnFrame) canvas.classList.remove('opacity-0');
    drawnFrame = image;
  };

  const tick = () => {
    current += (target - current) * 0.32;
    if (Math.abs(target - current) < 0.02) current = target;
    draw();
    rafId = current === target ? 0 : requestAnimationFrame(tick);
  };
  const requestTick = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

  const load = () => {
    generation += 1;
    const token = generation;
    const set = portrait.matches ? 'mobile' : 'desktop';
    frames = new Array(count);
    drawnFrame = null;
    const order = loadOrder();
    let cursor = 0;
    const next = () => {
      if (token !== generation || cursor >= order.length) return;
      const index = order[cursor++];
      const image = new Image();
      image.decoding = 'async';
      image.src = frameUrl(set, index);
      image.decode()
        .then(() => {
          if (token !== generation) return;
          frames[index] = image;
          drawnFrame = null; // a closer frame may now be available
          requestTick();
        })
        .catch(() => {})
        .finally(next);
    };
    for (let i = 0; i < CONCURRENCY; i += 1) next();
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    drawnFrame = null;
    requestTick();
  };

  const updateChapters = progress => {
    chapters.forEach((chapter, index) => {
      const v = visibility(progress, CHAPTER_WINDOWS[index] || CHAPTER_WINDOWS[0]);
      chapter.style.opacity = v.toFixed(3);
      chapter.style.visibility = v > 0.001 ? 'visible' : 'hidden';
      // transform, not translate: Tailwind v4's translate utilities own the `translate` property.
      chapter.style.transform = `translateY(${((1 - v) * (index === 0 ? -36 : 36)).toFixed(1)}px)`;
    });
    if (bar) bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (label) {
      const text = LABELS.find(([limit]) => progress < limit)[1];
      if (label.textContent !== text) label.textContent = text;
    }
  };

  new ResizeObserver(resize).observe(canvas);
  portrait.addEventListener('change', load);
  load();

  scroll(progress => {
    target = progress * (count - 1);
    requestTick();
    updateChapters(progress);
  }, { target: section, offset: ['start start', 'end end'] });

  // Entrance for the opening chapter.
  const intro = section.querySelectorAll('[data-hero-in]');
  animate(intro, { opacity: [0, 1], transform: ['translateY(36px)', 'translateY(0px)'] }, {
    duration: 1.3,
    delay: stagger(0.12, { startDelay: 0.15 }),
    ease: [0.16, 1, 0.3, 1]
  });
}
