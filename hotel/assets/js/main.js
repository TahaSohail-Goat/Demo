/* =========================================================
   Kestrel House — page interactions (uses window.Core from core.js)
   ========================================================= */
(() => {
  const { $, $$, M, EASE, reduce, toast } = window.Core;

  /* ---------- Film clock: 05:40 → 23:00 across the scroll ---------- */
  const clock = $('#clock'), label = $('#clockLabel'), temp = $('#clockTemp');
  const STOPS = [[0, 'Before sunrise', 4], [0.12, 'Sunrise', 6], [0.3, 'Late morning', 17], [0.48, 'Golden hour', 15], [0.66, 'Night sky', 7], [0.85, 'Night', 5]];
  Core.init({
    onProgress(p) {
      // piecewise so the clock agrees with each chapter's printed time
      const KEY = [[0, 340], [0.2, 370], [0.38, 660], [0.56, 1100], [0.75, 1320], [1, 1410]];
      let k = 0; while (k < KEY.length - 2 && p > KEY[k + 1][0]) k++;
      const [pa, ma] = KEY[k], [pb, mb] = KEY[k + 1];
      const mins = ma + (mb - ma) * Math.min(1, Math.max(0, (p - pa) / (pb - pa)));
      clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.floor(mins % 60 / 10) * 10).padStart(2, '0')}`;
      let s = STOPS[0]; for (const st of STOPS) if (p >= st[0]) s = st;
      label.textContent = s[1]; temp.textContent = `${s[2]} °C`;
    },
  });

  /* ---------- Dates, nights, room totals ---------- */
  const inEl = $('#in'), outEl = $('#out'), guests = $('#guests');
  const iso = (d) => d.toISOString().slice(0, 10);
  const d0 = new Date(); d0.setDate(d0.getDate() + 14); const d1 = new Date(d0); d1.setDate(d1.getDate() + 3);
  inEl.value = iso(d0); outEl.value = iso(d1); inEl.min = iso(new Date());
  const fmt = (n) => 'Rs ' + n.toLocaleString('en-US');
  const nights = () => Math.max(0, Math.round((new Date(outEl.value) - new Date(inEl.value)) / 86400000));
  let picked = null;
  function update() {
    const n = nights(), g = +guests.value;
    outEl.min = inEl.value;
    $$('.room').forEach((r) => {
      const cap = +r.dataset.cap, rate = +r.dataset.rate, stay = $('.stay', r), btn = $('.pick', r);
      const fits = g <= cap;
      btn.disabled = !fits; btn.textContent = fits ? (r === picked ? 'Selected' : 'Select') : `Sleeps ${cap}`;
      stay.textContent = n && fits ? `${fmt(rate * n)} for ${n} night${n > 1 ? 's' : ''}` : '';
      if (!fits && picked === r) { picked = null; r.classList.remove('is-picked'); }
    });
    const line = $('#sumLine'), btn = $('#reserve');
    if (!n) { line.textContent = 'Choose a check-out date after check-in.'; btn.disabled = true; return; }
    if (!picked) { line.innerHTML = `${n} night${n > 1 ? 's' : ''} · ${guests.selectedOptions[0].text}. Select a room to see your total.`; btn.disabled = true; return; }
    const total = +picked.dataset.rate * n;
    line.innerHTML = `${picked.dataset.name} · ${n} night${n > 1 ? 's' : ''} · breakfast included <b class="num">${fmt(total)}</b>`;
    btn.disabled = false;
  }
  $$('.room .pick').forEach((b) => b.addEventListener('click', () => {
    const r = b.closest('.room');
    picked = r; $$('.room').forEach((o) => o.classList.toggle('is-picked', o === r));
    update();
    if (M.animate && !reduce) M.animate('#summary', { transform: ['scale(.98)', 'scale(1)'] }, { duration: 0.4, ease: EASE });
  }));
  [inEl, outEl, guests].forEach((el) => el.addEventListener('change', update));
  $('#booker').addEventListener('submit', (e) => { e.preventDefault(); update(); Core.scrollTo($('#rooms')); });
  $('#reserve').addEventListener('click', () => {
    toast(`Request sent for the ${picked.dataset.name}, ${new Date(inEl.value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(outEl.value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. We'll confirm by email within a few hours.`);
  });
  update();

  /* ---------- Season chart (single series, one scale) ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const HIGHS = [4, 6, 12, 18, 23, 28, 31, 30, 26, 19, 12, 6];
  const svg = $('#tempChart'), tip = $('#tip');
  const W = 640, H = 300, L = 34, R = 8, T = 28, B = 30, max = 35;
  const x = (i) => L + (i * (W - L - R)) / 12, bw = (W - L - R) / 12 - 8, y = (v) => T + (H - T - B) * (1 - v / max);
  const NS = 'http://www.w3.org/2000/svg';
  let g = `<g font-family="Sora, sans-serif" font-size="11" fill="#586870">`;
  [0, 10, 20, 30].forEach((v) => { g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#15232c" stroke-opacity="${v === 0 ? 0.35 : 0.08}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}°</text>`; });
  HIGHS.forEach((v, i) => {
    const bx = x(i) + 4, by = y(v), h = y(0) - by, r = 4;
    g += `<path d="M${bx} ${y(0)}V${by + r}Q${bx} ${by} ${bx + r} ${by}H${bx + bw - r}Q${bx + bw} ${by} ${bx + bw} ${by + r}V${y(0)}Z" fill="#ec8a37" opacity="${i === 3 || i === 9 ? 1 : 0.55}"/>`;
    g += `<text x="${bx + bw / 2}" y="${H - 10}" text-anchor="middle">${MONTHS[i]}</text>`;
    g += `<rect class="hit" data-i="${i}" x="${x(i)}" y="${T}" width="${bw + 8}" height="${H - T - B}" fill="transparent"/>`;
  });
  g += `<text x="${x(3) + 4 + bw / 2}" y="${y(18) - 8}" text-anchor="middle" fill="#15232c" font-weight="600">Blossom</text><text x="${x(9) + 4 + bw / 2}" y="${y(19) - 8}" text-anchor="middle" fill="#15232c" font-weight="600">Autumn</text></g>`;
  svg.insertAdjacentHTML('beforeend', g);
  $('#tempTable').innerHTML = MONTHS.map((m, i) => `<tr><th scope="row">${m}</th><td>${HIGHS[i]} °C</td></tr>`).join('');
  const card = svg.parentElement;
  $$('.hit', svg).forEach((h) => {
    h.addEventListener('pointerenter', () => {
      const i = +h.dataset.i, rc = svg.getBoundingClientRect(), cc = card.getBoundingClientRect();
      const sx = rc.width / W;
      tip.textContent = `${MONTHS[i]} · ${HIGHS[i]} °C`;
      tip.style.left = `${rc.left - cc.left + (x(i) + 4 + bw / 2) * sx}px`;
      tip.style.top = `${rc.top - cc.top + y(HIGHS[i]) * sx}px`;
      tip.classList.add('on');
    });
    h.addEventListener('pointerleave', () => tip.classList.remove('on'));
  });
})();
