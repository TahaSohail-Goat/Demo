/* =========================================================
   Shehnai — page interactions (uses window.Core from core.js)
   ========================================================= */
(() => {
  const { $, $$, M, EASE, reduce, toast } = window.Core;

  /* ---------- Film: highlight the current function ---------- */
  const rail = $$('.event-rail span');
  const bands = [[0.1, 0.3], [0.3, 0.48], [0.48, 0.66], [0.66, 0.86]];
  Core.init({
    onProgress(p) { rail.forEach((s, i) => s.classList.toggle('on', p >= bands[i][0] && p < bands[i][1])); },
  });

  /* ---------- Menu builder ---------- */
  const TIERS = {
    classic: { price: 1850, dishes: [['Chicken biryani', 'Deg'], ['Chicken qorma', 'Deg'], ['Roghni naan', 'Tandoor'], ['Raita & salad', ''], ['Kheer', 'Clay pots'], ['Soft drinks & water', '']] },
    signature: { price: 2950, dishes: [['Mutton pulao', 'Deg'], ['Chicken karahi', 'Live'], ['Seekh kebab', 'Charcoal'], ['Roghni & taftan', 'Tandoor'], ['Russian salad & raita', ''], ['Gajar ka halwa', 'Winter'], ['Soft drinks & water', '']] },
    royal: { price: 4800, dishes: [['Mutton biryani', 'Deg'], ['Mutton qorma', 'Deg'], ['Chicken white handi', 'Live'], ['Lahori fish', 'Fried to order'], ['Live naan', 'Tandoor'], ['Salad bar', '8 items'], ['Gulab jamun & kheer', ''], ['Kashmiri chai', '']] },
  };
  let tier = 'signature';
  const guests = $('#guests');
  const fmt = (n) => 'Rs ' + Math.round(n).toLocaleString('en-US');
  const lakh = (n) => { const l = n / 100000; return l >= 100 ? `${(l / 100).toFixed(2)} crore` : `${l.toFixed(l < 10 ? 2 : 1).replace(/\.0+$/, '')} lakh`; };
  const setNum = (el, to, f) => {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (M.animate && !reduce) M.animate(from, to, { duration: 0.5, ease: EASE, onUpdate: (v) => { el.firstChild.nodeValue = f(v); } });
    else el.firstChild.nodeValue = f(to);
  };
  function renderDishes() {
    $('#dishes').innerHTML = TIERS[tier].dishes.map(([d, n]) => `<div class="dish"><span>${d}</span><small>${n}</small></div>`).join('');
    if (M.animate && !reduce) M.animate($$('#dishes .dish'), { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] }, { duration: 0.4, delay: M.stagger(0.03) });
  }
  function quote() {
    const g = +guests.value;
    $('#guestsOut').textContent = g.toLocaleString('en-US');
    const add = $$('#addons input:checked').reduce((s, i) => s + +i.value, 0);
    const per = TIERS[tier].price + add, total = per * g;
    setNum($('#perHead'), per, fmt);
    setNum($('#total'), total, fmt);
    $('#lakh').textContent = `${lakh(total)} for ${g.toLocaleString('en-US')} guests`;
    $('#waiters').textContent = Math.ceil(g / 12);
    $('#degs').textContent = Math.max(1, Math.round(g / 50));
    $('#advance').textContent = fmt(total * 0.3);
  }
  $('#tiers').addEventListener('choice', (e) => { tier = e.detail.dataset.tier; renderDishes(); quote(); });
  guests.addEventListener('input', quote);
  $$('#addons input').forEach((i) => i.addEventListener('change', quote));
  // the per-head and total nodes hold a text node followed by <small>; ensure a text node exists
  ['#perHead', '#total'].forEach((s) => { const el = $(s); if (el.firstChild.nodeType !== 3) el.insertBefore(document.createTextNode(''), el.firstChild); });
  renderDishes(); quote();

  /* ---------- Booking ---------- */
  const date = $('#b-date');
  if (date) { const d = new Date(); d.setMonth(d.getMonth() + 3); date.min = new Date().toISOString().slice(0, 10); date.value = d.toISOString().slice(0, 10); }
  $('#bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#b-name'), phone = $('#b-phone'), note = $('#bookNote');
    if (!name.value.trim()) { note.textContent = 'Please add your name so we know which family to reply to.'; note.style.color = '#f3d58a'; name.focus(); return; }
    if (phone.value.replace(/\D/g, '').length < 10) { note.textContent = 'Please add a WhatsApp number with country code, e.g. +92 300 1234567.'; note.style.color = '#f3d58a'; phone.focus(); return; }
    const fn = $('.chips [aria-pressed="true"]')?.textContent || 'your function';
    const when = date.value ? new Date(date.value + 'T12:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'your date';
    const ok = document.createElement('div'); ok.className = 'ok'; ok.setAttribute('role', 'status');
    ok.textContent = `Shukriya, ${name.value.trim().split(' ')[0]}. We're checking ${fn} on ${when} in ${$('#b-city').value} for ${$('#b-guests').value} guests, and will message ${phone.value.trim()} on WhatsApp shortly.`;
    note.replaceWith(ok); e.target.querySelector('button[type="submit"]').disabled = true;
    toast('Request received. We’ll reply on WhatsApp.');
  });
})();
