/* =========================================================
   KILO — page interactions (uses window.Core from core.js)
   ========================================================= */
(() => {
  const { $, $$, M, EASE, reduce, toast, clamp01 } = window.Core;

  /* ---------- Film HUD: kg on bar, plate legend, progress ---------- */
  // Plate load windows must match scene.js
  const LOADS = [[25, 0.15, 0.25], [20, 0.33, 0.43], [15, 0.51, 0.61], [10, 0.69, 0.79]];
  const kgEl = $('#kg'), bars = $$('.film-progress i b'), legend = $$('.legend span');
  const edges = [0, 0.3, 0.48, 0.66, 0.84, 1];
  let lastKg = 20;
  Core.init({
    onProgress(p) {
      let kg = 20;
      LOADS.forEach(([w, a, b], i) => {
        const on = p > a + (b - a) * 0.7;
        if (on) kg += w * 2;
        legend[i]?.classList.toggle('on', on);
      });
      if (kg !== lastKg) {
        const from = lastKg; lastKg = kg;
        if (M.animate && !reduce) M.animate(from, kg, { duration: 0.5, ease: EASE, onUpdate: (v) => { kgEl.textContent = Math.round(v); } });
        else kgEl.textContent = kg;
      }
      bars.forEach((b, i) => { b.style.transform = `scaleX(${clamp01((p - edges[i]) / (edges[i + 1] - edges[i]))})`; });
    },
  });

  /* ---------- Timetable ---------- */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CLASSES = [
    ['05:30', 'Strength foundations', 'strength', 'Hamza T.', 2, 'Barbell basics, 60 min'],
    ['06:30', 'Conditioning', 'conditioning', 'Daniyal K.', 3, 'Sled, row, bike, 45 min'],
    ['07:30', 'Mobility flow', 'mobility', 'Sara I.', 1, 'Hips & shoulders, 40 min'],
    ['12:15', 'Lunch lift', 'strength', 'Hamza T.', 2, 'Squat focus, 45 min'],
    ['17:30', 'Boxing', 'boxing', 'Daniyal K.', 2, 'Pads & bags, 50 min'],
    ['18:30', 'Olympic lifting', 'strength', 'Sara I.', 3, 'Snatch technique, 75 min'],
    ['19:30', 'Conditioning', 'conditioning', 'Daniyal K.', 3, 'Intervals, 45 min'],
    ['20:30', 'Ladies-only strength', 'strength', 'Sara I.', 2, 'Women-only floor, 60 min'],
    ['21:30', 'Late mobility', 'mobility', 'Hamza T.', 1, 'Stretch & breathe, 30 min'],
  ];
  const daysEl = $('#days'), ttEl = $('#tt');
  const todayIdx = (new Date().getDay() + 6) % 7;
  DAYS.forEach((d, i) => {
    const b = document.createElement('button'); b.className = 'day'; b.textContent = i === todayIdx ? 'Today' : d; b.dataset.d = i;
    b.setAttribute('aria-pressed', String(i === todayIdx)); daysEl.appendChild(b);
  });
  let day = todayIdx, filter = 'all';
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  function renderTT() {
    const list = CLASSES.filter((c, i) => (filter === 'all' || c[2] === filter) && !(day === 6 && i > 5) && !(day === 5 && i === 3));
    if (!list.length) { ttEl.innerHTML = '<p class="tt-empty">No classes of this type today. Try another day.</p>'; return; }
    ttEl.innerHTML = list.map(([t, n, type, coach, lvl, sub]) => {
      const cap = 16, taken = hash(DAYS[day] + t) % 18, left = Math.max(0, cap - taken);
      return `<div class="row" data-reveal-row>
        <span class="time">${t}</span>
        <span class="name">${n}<small>${sub}</small></span>
        <span class="coach">${coach}</span>
        <span class="lvl" aria-label="Intensity ${lvl} of 3">${[1, 2, 3].map((k) => `<i class="${k <= lvl ? 'on' : ''}"></i>`).join('')}</span>
        <span class="spots ${left <= 3 ? 'low' : ''}">${left ? `${left} spots left` : 'Full · waitlist'}</span>
        <button class="book" data-class="${n}" data-time="${t}">${left ? 'Book' : 'Waitlist'}</button>
      </div>`;
    }).join('');
    $$('.book', ttEl).forEach((b) => b.addEventListener('click', () => {
      b.textContent = 'Booked'; b.disabled = true;
      toast(`${b.dataset.class}, ${DAYS[day]} ${b.dataset.time} booked. See you on the floor.`);
    }));
    if (M.animate && !reduce) M.animate($$('.row', ttEl), { opacity: [0, 1], transform: ['translateX(-12px)', 'translateX(0)'] }, { duration: 0.45, delay: M.stagger(0.04), ease: EASE });
  }
  daysEl.addEventListener('choice', (e) => { day = +e.detail.dataset.d; renderTT(); });
  $('#filters').addEventListener('choice', (e) => { filter = e.detail.dataset.f; renderTT(); });
  // core.js wires [data-choice] groups present at init; the day buttons were added after, so wire them here
  $$('.day', daysEl).forEach((b) => b.addEventListener('click', () => {
    $$('.day', daysEl).forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    day = +b.dataset.d; renderTT();
  }));
  renderTT();

  /* ---------- 1RM + plate loader ---------- */
  const PLATES = [[25, '#d7262e', 46], [20, '#1f5fbf', 46], [15, '#f2c230', 40], [10, '#2e9b4f', 34], [5, '#f1f1ec', 26], [2.5, '#1a1a1a', 22], [1.25, '#bdbdb8', 18]];
  const perSide = (target) => {
    let rem = Math.max(0, (target - 20) / 2); const out = [];
    for (const [w, c, h] of PLATES) { while (rem >= w - 1e-6) { out.push([w, c, h]); rem -= w; } }
    return out;
  };
  const plateSvg = (plates) => {
    let x = 26; const parts = [];
    plates.forEach(([w, c, h]) => { const t = w >= 10 ? 9 : w >= 5 ? 7 : 5; parts.push(`<rect x="${x}" y="${19 - h / 2}" width="${t}" height="${h}" rx="1.5" fill="${c}" stroke="#111" stroke-width="${c === '#f1f1ec' || c === '#bdbdb8' ? 1 : 0}"/>`); x += t + 1.5; });
    return `<svg viewBox="0 0 360 38" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><rect x="0" y="16" width="340" height="6" fill="#9a9a95"/><rect x="18" y="12" width="7" height="14" fill="#6f6f6a"/>${parts.join('')}</svg>`;
  };
  const wIn = $('#w'), rIn = $('#r');
  const roundTo = (v, s) => Math.round(v / s) * s;
  function calc() {
    const w = Math.min(400, Math.max(20, +wIn.value || 20)), r = Math.min(12, Math.max(1, Math.round(+rIn.value || 1)));
    const orm = r === 1 ? w : w * (1 + r / 30);
    $('#orm').innerHTML = `${Math.round(orm)}<small>kg</small>`;
    $('#pctTable').innerHTML = [100, 90, 85, 80, 75, 70, 60].map((pc) => {
      const load = Math.max(20, roundTo(orm * pc / 100, 2.5));
      const ps = perSide(load);
      const label = ps.length ? ps.map((p) => p[0]).join(' + ') + ' per side' : 'Empty bar';
      return `<div class="pct-row"><span class="p">${pc}%</span><span class="w num">${load} kg</span><span title="${label}" aria-label="${label}">${plateSvg(ps)}</span></div>`;
    }).join('');
  }
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const inp = $('#' + b.dataset.step); inp.value = Math.max(+inp.min, Math.min(+inp.max, (+inp.value || 0) + +b.dataset.d)); calc();
  }));
  [wIn, rIn].forEach((i) => i.addEventListener('input', calc));
  calc();

  /* ---------- Membership billing toggle ---------- */
  $('#bill').addEventListener('choice', (e) => {
    const yearly = e.detail.dataset.b === 'y';
    $$('.plan').forEach((pl) => {
      const m = +pl.dataset.m, y = +pl.dataset.y;
      const amt = $('.amt', pl), per = $('.per', pl), save = $('.save', pl);
      const to = yearly ? y : m, from = +amt.textContent.replace(/,/g, '');
      if (M.animate && !reduce) M.animate(from, to, { duration: 0.5, ease: EASE, onUpdate: (v) => { amt.textContent = Math.round(v).toLocaleString('en-US'); } }); else amt.textContent = to.toLocaleString('en-US');
      per.textContent = yearly ? '/ year' : '/ month';
      save.textContent = yearly ? `Save $${(m * 12 - y).toLocaleString('en-US')} vs monthly` : '';
    });
  });

  /* ---------- Trial form ---------- */
  const start = $('#t-start'); if (start) { const d = new Date(); d.setDate(d.getDate() + 1); start.value = d.toISOString().slice(0, 10); }
  $('#trialForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#t-name'), phone = $('#t-phone'), note = $('#trialNote');
    if (!name.value.trim()) { note.textContent = 'Add your name so the front desk knows who to expect.'; note.style.color = '#f2c230'; name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length < 7) { note.textContent = 'Add a phone number with at least 7 digits for your pass.'; note.style.color = '#f2c230'; phone.focus(); return; }
    const goal = $('.goals [aria-pressed="true"]')?.textContent || 'training';
    const ok = document.createElement('div'); ok.className = 'ok'; ok.setAttribute('role', 'status');
    ok.textContent = `You're in, ${name.value.trim().split(' ')[0]}. Your free week starts ${start.value || 'whenever you arrive'}. Goal noted: ${goal.toLowerCase()}. Your pass is on its way to ${phone.value.trim()}.`;
    note.replaceWith(ok); e.target.querySelector('button[type="submit"]').disabled = true;
  });
})();
