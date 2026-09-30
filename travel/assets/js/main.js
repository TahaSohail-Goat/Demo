/* =========================================================
   Safarnama — page interactions (uses window.Core from core.js)
   ========================================================= */
(() => {
  const { $, $$, M, EASE, reduce, toast } = window.Core;

  const PKGS = [
    { cat: 'umrah', dest: 'umrah', name: 'Umrah Economy', from: 'KHI', fromCity: 'Karachi', to: 'JED', toCity: 'Jeddah', days: '15 days', price: 285000, incl: ['Flights', 'Umrah visa', '3★ hotels · 800 m', 'Transfers'] },
    { cat: 'umrah', dest: 'umrah', name: 'Umrah Premium', from: 'LHE', fromCity: 'Lahore', to: 'JED', toCity: 'Jeddah', days: '21 days', price: 465000, incl: ['Flights', 'Umrah visa', '5★ walking distance', 'Ziyarat tours'] },
    { cat: 'umrah', dest: 'umrah', name: 'Umrah Family', from: 'ISB', fromCity: 'Islamabad', to: 'MED', toCity: 'Madinah', days: '28 days', price: 398000, incl: ['Flights', 'Umrah visa', 'Family rooms', 'Group leader'] },
    { cat: 'north', dest: 'north', name: 'Hunza & Attabad', from: 'ISB', fromCity: 'Islamabad', to: 'GIL', toCity: 'Gilgit', days: '6 days', price: 78000, incl: ['Flights', 'Hotels', 'Private car', 'Boating'] },
    { cat: 'north', dest: 'north', name: 'Skardu & Deosai', from: 'ISB', fromCity: 'Islamabad', to: 'KDU', toCity: 'Skardu', days: '7 days', price: 92000, incl: ['Flights', 'Hotels', 'Jeep to Deosai', 'Guide'] },
    { cat: 'intl', dest: 'turkey', name: 'Istanbul & Cappadocia', from: 'LHE', fromCity: 'Lahore', to: 'IST', toCity: 'Istanbul', days: '8 days', price: 425000, incl: ['Flights', 'Visa file', '4★ hotels', 'Balloon ride'] },
    { cat: 'intl', dest: 'azerbaijan', name: 'Baku city break', from: 'ISB', fromCity: 'Islamabad', to: 'GYD', toCity: 'Baku', days: '5 days', price: 235000, incl: ['Flights', 'E-visa', '4★ hotel', 'Gabala day trip'] },
    { cat: 'intl', dest: 'uae', name: 'Dubai family week', from: 'KHI', fromCity: 'Karachi', to: 'DXB', toCity: 'Dubai', days: '5 days', price: 198000, incl: ['Flights', 'UAE visa', '4★ hotel', 'Desert safari'] },
    { cat: 'intl', dest: 'malaysia', name: 'Kuala Lumpur & Langkawi', from: 'LHE', fromCity: 'Lahore', to: 'KUL', toCity: 'Kuala Lumpur', days: '7 days', price: 265000, incl: ['Flights', 'E-visa', 'Hotels', 'Island hopping'] },
    { cat: 'honeymoon', dest: 'maldives', name: 'Maldives water villa', from: 'KHI', fromCity: 'Karachi', to: 'MLE', toCity: 'Malé', days: '6 days', price: 520000, incl: ['Flights', 'Water villa', 'Half board', 'Speedboat'] },
    { cat: 'honeymoon', dest: 'north', name: 'Hunza honeymoon', from: 'ISB', fromCity: 'Islamabad', to: 'GIL', toCity: 'Gilgit', days: '6 days', price: 145000, incl: ['Flights', 'Boutique hotel', 'Private car', 'Candlelit dinner'] },
  ];
  const CATS = [['all', 'All'], ['umrah', 'Umrah'], ['north', 'Northern Pakistan'], ['intl', 'International'], ['honeymoon', 'Honeymoon']];
  const tabs = $('#tabs');
  tabs.innerHTML = CATS.map(([k, l], i) => `<button class="tab" type="button" aria-pressed="${i === 0}" data-cat="${k}">${l}<span class="n">${k === 'all' ? PKGS.length : PKGS.filter((p) => p.cat === k).length}</span></button>`).join('');

  const fmt = (n) => 'Rs ' + n.toLocaleString('en-US');
  const ICON = { Flights: 'plane', 'Umrah visa': 'stamp', 'Visa file': 'stamp', 'UAE visa': 'stamp', 'E-visa': 'stamp', Transfers: 'bus', 'Private car': 'car', default: 'check' };
  // real Lucide SVGs, inlined at build time by _shared/icons.py
  const SVG = { plane: '<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>', stamp: '<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/><path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z"/><path d="M5 22h14"/></svg>', bus: '<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>', car: '<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8"/><path d="M7 14h.01"/><path d="M17 14h.01"/><rect width="18" height="8" x="3" y="10" rx="2"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>', check: '<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ><path d="M20 6 9 17l-5-5"/></svg>' };
  const ic = (label) => { const k = Object.keys(ICON).find((x) => label.startsWith(x)) || 'default'; return SVG[ICON[k]]; };
  const arc = '<svg viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true"><path d="M2 20 Q50 -8 98 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/><circle cx="50" cy="6" r="3" fill="currentColor"/></svg>';

  let cat = 'all';
  const fromSel = $('#s-from'), toSel = $('#s-to'), pax = $('#s-pax'), month = $('#s-month');
  const passes = $('#passes');
  function render(animate) {
    const n = +pax.value, f = fromSel.value, t = toSel.value;
    const list = PKGS.filter((p) => (cat === 'all' || p.cat === cat) && (f === 'any' || p.from === f) && (t === 'any' || p.dest === t));
    if (!list.length) { passes.innerHTML = '<p class="empty">No packages match these filters yet. Send us your dates and we’ll build one.</p>'; return; }
    passes.innerHTML = list.map((p) => `<article class="pass">
      <div class="main">
        <div class="top"><span class="type">${CATS.find((c) => c[0] === p.cat)[1]}</span><span class="dur">${p.days}</span></div>
        <div class="route"><div><b>${p.from}</b><small>${p.fromCity}</small></div><div class="arc">${arc}</div><div style="text-align:right"><b>${p.to}</b><small>${p.toCity}</small></div></div>
        <h3>${p.name}</h3>
        <div class="incl">${p.incl.map((i) => `<span>${ic(i)}${i}</span>`).join('')}</div>
      </div>
      <div class="stub">
        <div class="price num">${fmt(p.price)}<small>per person${n > 1 ? ` · ${fmt(p.price * n)} for ${n}` : ''}</small></div>
        <div class="barcode" aria-hidden="true"></div>
        <button class="btn btn-navy" type="button" data-pkg="${p.name}">Enquire</button>
      </div>
    </article>`).join('');
    $$('[data-pkg]', passes).forEach((b) => b.addEventListener('click', () => {
      $('#e-trip').value = [...$('#e-trip').options].find((o) => b.dataset.pkg.toLowerCase().includes(o.text.toLowerCase().split(' ')[0]))?.text || 'Something else';
      $('#e-pax').value = pax.value; if (month.value) $('#e-month').value = month.value;
      $('#e-notes').value = `Interested in: ${b.dataset.pkg}`;
      Core.scrollTo($('#enquire'));
    }));
    if (animate && M.animate && !reduce) M.animate($$('.pass', passes), { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: 0.5, delay: M.stagger(0.05), ease: EASE });
  }
  tabs.addEventListener('choice', (e) => { cat = e.detail.dataset.cat; render(true); });
  [fromSel, toSel, pax].forEach((el) => el.addEventListener('change', () => render(true)));
  $('#search').addEventListener('submit', (e) => { e.preventDefault(); cat = 'all'; $$('.tab', tabs).forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0))); render(true); Core.scrollTo($('#packages')); });
  const nm = new Date(); nm.setMonth(nm.getMonth() + 1); const ym = nm.toISOString().slice(0, 7); month.value = ym; $('#e-month').value = ym;
  render(false);

  Core.init();

  /* ---------- Enquiry ---------- */
  $('#enqForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#e-name'), phone = $('#e-phone'), note = $('#enqNote');
    if (!name.value.trim()) { note.textContent = 'Add your name so the agent knows who to message.'; note.style.color = '#ffb08a'; name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length < 10) { note.textContent = 'Add a WhatsApp number with country code, e.g. +92 300 1234567.'; note.style.color = '#ffb08a'; phone.focus(); return; }
    const ok = document.createElement('div'); ok.className = 'ok'; ok.setAttribute('role', 'status');
    ok.textContent = `Thanks, ${name.value.trim().split(' ')[0]}. ${$('#e-trip').value} from ${$('#e-from').value} for ${$('#e-pax').value}. An agent will WhatsApp ${phone.value.trim()} with a written plan and price.`;
    note.replaceWith(ok); e.target.querySelector('button[type="submit"]').disabled = true;
    toast('Request sent. Check WhatsApp shortly.');
  });
})();
