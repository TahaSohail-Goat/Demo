/* =========================================================
   Anbar — page interactions (uses window.Core from core.js)
   One source of truth: SCENTS. Choosing a scent anywhere re-tints the page,
   the notes, the pyramid and the 3D bottle (scene.js listens for 'scent').
   ========================================================= */
(() => {
  const { $, $$, M, EASE, reduce, toast } = window.Core;

  const SCENTS = [
    { id: 'oud', name: 'Saffron Oud', fam: 'Woody amber', color: '#c8741f', tiers: ['#e7b36a', '#b3542f', '#5b2a14'], price: 14500,
      top: ['Saffron', 'Pink pepper', 'Bergamot'], heart: ['Taif rose', 'Leather', 'Cinnamon'], base: ['Oud', 'Amber', 'Sandalwood'],
      desc: 'Saffron and pink pepper over Taif rose, settling on oud and amber.', tags: { night: 2, both: 1, warm: 3, room: 2 } },
    { id: 'rose', name: 'Rose Taifi', fam: 'Floral', color: '#c43d5c', tiers: ['#f3a6b8', '#c43d5c', '#6b2033'], price: 13500,
      top: ['Lychee', 'Bergamot', 'Pink pepper'], heart: ['Taif rose', 'Peony', 'Jasmine'], base: ['White musk', 'Cashmere wood', 'Patchouli'],
      desc: 'A dewy Taif rose with lychee brightness and a soft musky trail.', tags: { day: 1, both: 2, floral: 3, hug: 1, room: 1 } },
    { id: 'vetiver', name: 'Vetiver Rain', fam: 'Fresh woody', color: '#6f8f6a', tiers: ['#c9dcae', '#6f8f6a', '#2f3f2c'], price: 12500,
      top: ['Grapefruit', 'Cardamom', 'Mint'], heart: ['Vetiver', 'Iris', 'Sage'], base: ['Cedar', 'Ambrette', 'Oakmoss'],
      desc: 'Wet earth after the first monsoon rain: grapefruit, vetiver and cedar.', tags: { day: 3, both: 1, fresh: 3, hug: 2 } },
    { id: 'musk', name: 'White Musk', fam: 'Soft musky', color: '#d8cbbd', tiers: ['#f4eee6', '#d8cbbd', '#9c8b7a'], price: 11500,
      top: ['Aldehydes', 'Pear', 'Neroli'], heart: ['White musk', 'Orange blossom', 'Lily'], base: ['Vanilla', 'Sandalwood', 'Tonka'],
      desc: 'Clean skin, warm cotton and a whisper of vanilla. Close and comforting.', tags: { day: 2, both: 2, soft: 3, hug: 3 } },
  ];
  window.__scents = SCENTS;
  const fmt = (n) => 'Rs ' + n.toLocaleString('en-US');

  /* ---------- Bag ---------- */
  let bag = 0;
  const add = (label) => {
    bag++; const b = $('#bagCount'); b.hidden = false; b.textContent = bag; $('#bagBtn').setAttribute('aria-label', `Bag, ${bag} item${bag > 1 ? 's' : ''}`);
    if (M.animate && !reduce) M.animate('#bagBtn', { transform: ['scale(1)', 'scale(1.15)', 'scale(1)'] }, { duration: 0.4 });
    toast(`${label} added to your bag`);
  };
  $('#bagBtn').addEventListener('click', () => toast(bag ? `${bag} item${bag > 1 ? 's' : ''} in your bag · cash on delivery` : 'Your bag is empty.'));
  $('#discAdd').addEventListener('click', () => add('Discovery set'));

  /* ---------- Collection cards (SVG bottles) ---------- */
  const bottle = (c) => `<svg viewBox="0 0 120 190" aria-hidden="true">
    <defs><linearGradient id="gl-${c.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".25" stop-color="#fff" stop-opacity=".06"/><stop offset=".85" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
    <linearGradient id="cap-${c.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5a3a"/><stop offset=".45" stop-color="#e9c89a"/><stop offset=".7" stop-color="#b98f5f"/><stop offset="1" stop-color="#6b4c30"/></linearGradient></defs>
    <rect x="42" y="4" width="36" height="36" rx="3" fill="url(#cap-${c.id})"/><path d="M42 16h36M42 28h36" stroke="#5a3f28" stroke-opacity=".35"/>
    <rect x="50" y="40" width="20" height="12" fill="#cfc6bd" opacity=".7"/>
    <rect x="12" y="50" width="96" height="132" rx="12" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.35)"/>
    <rect x="20" y="74" width="80" height="100" rx="8" fill="${c.color}" opacity=".88"/>
    <rect x="12" y="50" width="96" height="132" rx="12" fill="url(#gl-${c.id})"/>
    <rect x="32" y="112" width="56" height="34" fill="#f4eee6" opacity=".92"/><text x="60" y="126" text-anchor="middle" font-family="Marcellus, serif" font-size="8.5" letter-spacing="2.5" fill="#17111a">ANBAR</text><text x="60" y="138" text-anchor="middle" font-family="Jost, sans-serif" font-size="5" letter-spacing="1" fill="#17111a">${c.name.toUpperCase()}</text>
  </svg>`;
  const grid = $('#collectionGrid');
  grid.innerHTML = SCENTS.map((c, i) => `<article class="card${i === 0 ? ' is-active' : ''}" data-i="${i}" style="--c:${c.color}" data-reveal>
      <button type="button" class="pick" data-pick="${i}" aria-label="Show notes for ${c.name}"></button>
      <div class="art">${bottle(c)}</div>
      <span class="fam">${c.fam}</span><h3>${c.name}</h3><p>${c.desc}</p>
      <div class="foot"><span class="price num">${fmt(c.price)} <small style="font-family:Jost;font-size:.7rem;color:var(--mist)">100 ml</small></span><button type="button" class="add" aria-label="Add ${c.name} to bag" data-add="${i}">{{PLUS}}</button></div>
    </article>`).join('').replaceAll('{{PLUS}}', '+');
  $$('.pick', grid).forEach((b) => b.addEventListener('click', () => setScent(+b.dataset.pick, true)));
  $$('.add', grid).forEach((b) => b.addEventListener('click', () => add(`${SCENTS[+b.dataset.add].name} 100 ml`)));

  /* ---------- Swatches in the film ---------- */
  const sw = $('#swatches');
  sw.innerHTML = SCENTS.map((c, i) => `<button class="sw" type="button" aria-pressed="${i === 0}" aria-label="${c.name}" data-i="${i}"><i style="background:${c.color}"></i></button>`).join('');
  $$('.sw', sw).forEach((b) => b.addEventListener('click', () => setScent(+b.dataset.i)));

  /* ---------- Apply a scent everywhere ---------- */
  const chips = (arr) => arr.map((n) => `<span class="pill">${n}</span>`).join('');
  let current = 0;
  function setScent(i, fromCard) {
    current = i; const c = SCENTS[i];
    const root = document.documentElement.style;
    root.setProperty('--scent', c.color); root.setProperty('--t1', c.tiers[0]); root.setProperty('--t2', c.tiers[1]); root.setProperty('--t3', c.tiers[2]);
    $('#scentNow').textContent = c.name;
    $('#nTop').innerHTML = chips(c.top); $('#nHeart').innerHTML = chips(c.heart); $('#nBase').innerHTML = chips(c.base);
    $('#pTop').innerHTML = chips(c.top); $('#pHeart').innerHTML = chips(c.heart); $('#pBase').innerHTML = chips(c.base);
    $('#pyrName').textContent = c.name; $('#pyrDesc').textContent = c.desc;
    $$('.sw', sw).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    $$('.card', grid).forEach((b) => b.classList.toggle('is-active', +b.dataset.i === i));
    window.__scent = i;
    window.dispatchEvent(new CustomEvent('scent', { detail: i }));
    if (fromCard) toast(`${c.name} selected. The bottle and notes now show this fragrance.`);
  }
  setScent(0);

  /* ---------- Film progress line ---------- */
  const line = $('#filmLine');
  Core.init({ onProgress(p) { line.style.transform = `scaleX(${p})`; } });

  /* ---------- Scent finder ---------- */
  const answers = [null, null, null];
  $$('.opts').forEach((g) => g.addEventListener('choice', (e) => { answers[+g.dataset.q] = e.detail.dataset.v; score(); }));
  function score() {
    const picked = answers.filter(Boolean);
    if (!picked.length) return;
    const scores = SCENTS.map((c) => picked.reduce((s, a) => s + (c.tags[a] || 0), 0));
    const best = scores.indexOf(Math.max(...scores));
    const max = picked.length * 3;
    const pct = Math.round(60 + 39 * (scores[best] / max));
    const c = SCENTS[best];
    $('#mPct').textContent = pct + '%';
    $('#mName').textContent = c.name;
    $('#mWhy').textContent = `${c.fam}. ${c.desc}`;
    const btn = $('#mAdd'); btn.disabled = false; btn.dataset.i = best; btn.textContent = `Add ${c.name} 50 ml · ${fmt(Math.round(c.price * 0.66 / 100) * 100)}`;
    if (current !== best) setScent(best);
    if (M.animate && !reduce) M.animate('.match', { transform: ['scale(.98)', 'scale(1)'] }, { duration: 0.4 });
  }
  $('#mAdd').addEventListener('click', (e) => add(`${SCENTS[+e.currentTarget.dataset.i].name} 50 ml`));

  /* ---------- Newsletter ---------- */
  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault(); const v = $('#nEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast('Enter an email address like name@example.com'); $('#nEmail').focus(); return; }
    toast('Subscribed. We’ll write when the next batch is ready.'); e.target.reset();
  });
})();
