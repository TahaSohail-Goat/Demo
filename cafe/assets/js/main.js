/* =========================================================
   Morrow — interactions
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
  const scrollTo = (el) => { lenis ? lenis.scrollTo(el, { offset: -80, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' }); };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return; const el = $(id); if (!el) return;
    e.preventDefault(); closeMenu(); scrollTo(el);
  }));

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), menu = $('#mobileMenu');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-hidden', 'true'); lenis?.start(); }
  menuBtn?.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); menuBtn.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    open ? lenis?.stop() : lenis?.start();
  });

  /* ---------- Toast + bag ---------- */
  const toastEl = $('#toast'); let toastT;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); };
  let bag = 0;
  const bump = (msg) => {
    bag++; const b = $('#bagCount'); b.hidden = false; b.textContent = bag; $('#bagBtn').setAttribute('aria-label', `Bag, ${bag} item${bag > 1 ? 's' : ''}`);
    if (M.animate && !reduce) M.animate('#bagBtn', { transform: ['scale(1)', 'scale(1.18)', 'scale(1)'] }, { duration: 0.45 });
    toast(msg);
  };
  $('#bagBtn').addEventListener('click', () => toast(bag ? `${bag} item${bag > 1 ? 's' : ''} in your order · pay at pickup` : 'Your bag is empty. Tap any menu item to add it.'));
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => bump(`${b.dataset.add} · 250 g added`)));

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
    M.animate($$('.word > span', heroH), { transform: ['translateY(110%) rotate(4deg)', 'translateY(0%) rotate(0deg)'] }, { duration: 1, delay: M.stagger(0.06, { startDelay: 0.2 }), ease: EASE });
    M.animate('[data-hero-fade]', { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] }, { duration: 0.9, delay: M.stagger(0.1, { startDelay: 0.7 }), ease: EASE });
    M.animate('.readout', { opacity: [0, 1], transform: ['translateY(-12px) rotate(3deg)', 'translateY(0) rotate(0deg)'] }, { duration: 1, delay: 0.9, ease: EASE });
  }

  /* ---------- Film timeline ---------- */
  window.__film = window.__film || { p: 0 };
  if (hasGSAP) {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    tl.to(window.__film, { p: 1, ease: 'none', duration: 1 }, 0);
    const ch = (n) => $(`.ch[data-ch="${n}"]`);
    const inAt = (el, at) => tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.035, ease: 'power2.out' }, at);
    const outAt = (el, at) => tl.to(el, { autoAlpha: 0, y: -40, duration: 0.035, ease: 'power2.in' }, at);
    outAt(ch(0), 0.08);
    inAt(ch(1), 0.12); outAt(ch(1), 0.27);
    inAt(ch(2), 0.31); outAt(ch(2), 0.48);
    inAt(ch(3), 0.53); outAt(ch(3), 0.69);
    inAt(ch(4), 0.73); outAt(ch(4), 0.86);
    inAt(ch(5), 0.89);
  }

  /* ---------- Reveals ---------- */
  const revealEls = $$('[data-reveal]');
  if (M.inView && M.animate && !reduce) {
    let queue = [], timer = null;
    const flush = () => { M.animate(queue, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 0.9, delay: M.stagger(0.07), ease: EASE }); queue = []; timer = null; };
    M.inView(revealEls, (el) => { queue.push(el); if (!timer) timer = setTimeout(flush, 30); }, { margin: '0px 0px -8% 0px' });
  } else revealEls.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) $$('[data-magnetic]').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; });
    b.addEventListener('pointerleave', () => { M.animate ? M.animate(b, { transform: 'translate(0px, 0px)' }, { type: 'spring', stiffness: 300, damping: 15 }) : (b.style.transform = ''); });
  });

  /* ---------- Menu board ---------- */
  const MENU = {
    coffee: [
      ['Espresso', '3.20', 'Double shot of the Daybreak blend.', []],
      ['Flat white', '4.40', 'Double shot, 5 oz of silky milk.', ['Oat free']],
      ['Cortado', '4.00', 'Equal parts espresso and warm milk.', ['Oat free']],
      ['Batch filter', '3.60', "Today: Guji Hambela. Peach, jasmine, honey.", ['VG']],
      ['V60 pour-over', '5.20', 'Any bean on the shelf, brewed to order.', ['VG']],
      ['Iced latte', '4.80', 'Double shot over ice with cold milk.', ['Oat free']],
    ],
    other: [
      ['Ceremonial matcha', '4.90', 'Whisked to order, with oat or whole milk.', ['VG option']],
      ['Chai', '4.50', 'House-spiced black tea, simmered with milk.', []],
      ['Hot chocolate', '4.20', '70% dark chocolate, not powder.', ['GF']],
      ['Loose-leaf tea', '3.40', 'Sencha, Earl Grey or chamomile.', ['VG']],
    ],
    bakery: [
      ['Butter croissant', '3.60', 'Laminated in-house, baked at 6 am.', ['V']],
      ['Cardamom bun', '4.20', 'Swedish-style, knotted and sugared.', ['V']],
      ['Banana bread', '3.80', 'With brown butter and walnuts.', ['V']],
      ['Olive oil orange cake', '4.00', 'Dense, citrusy, no dairy.', ['VG', 'GF']],
    ],
    brunch: [
      ['Eggs on sourdough', '11.50', 'Soft scrambled, chives, cultured butter.', ['V']],
      ['Avocado & chilli', '12.00', 'Lime, pickled onion, seeds, poached egg.', ['V']],
      ['Morrow breakfast bowl', '10.50', 'Yoghurt, granola, poached fruit, honey.', ['V', 'GF']],
      ['Ham & gruyère toastie', '10.00', 'Mustard, pickles, sourdough.', []],
    ],
  };
  const body = $('#boardBody');
  const renderMenu = (cat) => {
    body.innerHTML = MENU[cat].map(([n, p, d, tags]) => `
      <button type="button" class="item" data-item="${n}" style="text-align:left;background:none;border-left:0;border-right:0;border-top:0;font:inherit;color:inherit;cursor:pointer;width:100%">
        <h3>${n}</h3><span class="price num">$${p}</span><p>${d}</p>
        ${tags.length ? `<span class="tags">${tags.map((t) => `<span class="pill ok">${t}</span>`).join('')}</span>` : ''}
      </button>`).join('');
    $$('.item', body).forEach((it) => it.addEventListener('click', () => bump(`${it.dataset.item} added to your order`)));
    if (M.animate && !reduce) M.animate($$('.item', body), { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] }, { duration: 0.5, delay: M.stagger(0.04), ease: EASE });
  };
  $$('.btab').forEach((b) => b.addEventListener('click', () => { $$('.btab').forEach((o) => o.setAttribute('aria-selected', String(o === b))); renderMenu(b.dataset.cat); }));
  renderMenu('coffee');

  /* ---------- Brew calculator ---------- */
  const METHODS = {
    espresso: { name: 'Espresso', min: 14, max: 22, def: 18, ratios: [2.4, 2, 1.7], temp: '93 °C', grind: 1, unit: 'yield', time: () => '0:28', makes: () => '1 double', note: 'Aim for 25–30 seconds. Too fast? Grind finer. Too slow? Coarser.' },
    v60: { name: 'V60', min: 10, max: 40, def: 20, ratios: [17, 16, 15], temp: '94 °C', grind: 3, unit: 'water', time: (d) => { const s = 150 + d * 2; return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, makes: (w) => w < 300 ? '1 cup' : w < 420 ? '1 mug' : `${Math.round(w / 250)} cups`, note: 'Bloom with twice the coffee weight in water for 40 seconds, then pour slowly in circles.' },
    aeropress: { name: 'AeroPress', min: 11, max: 20, def: 15, ratios: [16, 15, 13], temp: '90 °C', grind: 2, unit: 'water', time: () => '2:00', makes: () => '1 cup', note: 'Stir three times, steep, then press gently for about 30 seconds.' },
    french: { name: 'French press', min: 20, max: 60, def: 30, ratios: [17, 15, 13], temp: '95 °C', grind: 5, unit: 'water', time: () => '4:00', makes: (w) => `${Math.max(1, Math.round(w / 250))} cups`, note: 'After 4 minutes, skim the crust off the top, then plunge slowly.' },
    cold: { name: 'Cold brew', min: 30, max: 100, def: 60, ratios: [10, 8, 6], temp: 'Room temp', grind: 6, unit: 'water', time: () => '16 h', makes: (w) => `${(w / 1000).toFixed(1)} L conc.`, note: 'Steep in the fridge, filter, then dilute 1:1 with water or milk.' },
  };
  let method = 'v60';
  const dose = $('#dose'), str = $('#cups');
  const calc = () => {
    const m = METHODS[method], d = +dose.value, ratio = m.ratios[+str.value], w = Math.round(d * ratio);
    $('#doseOut').textContent = `${d} g`;
    $('#strOut').textContent = ['Lighter', 'Balanced', 'Stronger'][+str.value];
    $('#calcTitle').textContent = `${m.name} · 1 : ${ratio} · ${m.unit}`;
    $('#water').innerHTML = `${w}<small>g</small>`;
    $('#time').textContent = m.time(d); $('#temp').textContent = m.temp; $('#makes').textContent = m.makes(w);
    $('#calcNote').textContent = m.note;
    $$('#grindScale i').forEach((i, k) => i.classList.toggle('on', k === m.grind));
  };
  $$('.method').forEach((b) => b.addEventListener('click', () => {
    method = b.dataset.m; $$('.method').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const m = METHODS[method]; dose.min = m.min; dose.max = m.max; dose.value = m.def; calc();
    if (M.animate && !reduce) M.animate('#water', { transform: ['translateY(10px)', 'translateY(0)'], opacity: [0.3, 1] }, { duration: 0.4 });
  }));
  dose.addEventListener('input', calc); str.addEventListener('input', calc); calc();

  /* ---------- Stamp card ---------- */
  const stampsEl = $('#stamps'); let stamps = 3;
  const cupSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1a3 3 0 0 1 0 6h-1"/></svg>';
  const renderStamps = (animIdx) => {
    stampsEl.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('span');
      if (i === 9) { s.className = 'free' + (stamps >= 9 ? ' on' : ''); s.textContent = 'FREE'; }
      else if (i < stamps) { s.className = 'on'; s.innerHTML = cupSvg; }
      else s.textContent = String(i + 1);
      stampsEl.appendChild(s);
      if (i === animIdx && M.animate && !reduce) M.animate(s, { transform: ['scale(1.6) rotate(-20deg)', 'scale(1) rotate(0deg)'], opacity: [0, 1] }, { type: 'spring', stiffness: 400, damping: 18 });
    }
    $('#stampCount').textContent = `${Math.min(stamps, 9)} of 9`;
    $('#stampMsg').textContent = stamps >= 9 ? 'Your next drink is on us' : `${9 - stamps} more until a free drink`;
    $('#addStamp').textContent = stamps >= 9 ? 'Redeem' : 'Add a visit';
  };
  $('#addStamp').addEventListener('click', () => {
    if (stamps >= 9) { stamps = 0; renderStamps(); toast('Free drink redeemed. Card reset.'); return; }
    stamps++; renderStamps(stamps === 9 ? 9 : stamps - 1);
    if (stamps === 9) toast('Nine stamps! Your next drink is free.');
  });
  renderStamps();

  /* ---------- Open / closed from the visitor's clock ---------- */
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  $$('.shop').forEach((shop) => {
    const d = new Date(), weekend = d.getDay() === 0 || d.getDay() === 6;
    const [o, c] = (weekend ? shop.dataset.weekend : shop.dataset.open).split('-');
    const now = d.getHours() * 60 + d.getMinutes(), open = now >= toMin(o) && now < toMin(c);
    const st = $('.status', shop);
    st.className = 'status ' + (open ? 'open' : 'closed');
    st.textContent = open ? `Open · until ${c}` : now < toMin(o) ? `Opens ${o}` : 'Closed now';
    $(`dt[data-d="${weekend ? 'we' : 'wk'}"]`, shop)?.classList.add('today');
  });

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('#nEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast('Enter an email address like name@example.com'); $('#nEmail').focus(); return; }
    toast('Subscribed. First roast notes arrive next month.'); e.target.reset();
  });

  $('#yr') && ($('#yr').textContent = new Date().getFullYear());
  if (hasGSAP) { addEventListener('load', () => ScrollTrigger.refresh()); document.fonts?.ready.then(() => ScrollTrigger.refresh()); }
})();
