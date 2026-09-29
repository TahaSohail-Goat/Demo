/* SURA — demonstration storefront. Conversion and delivery values are illustrative. */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const BRAND_CONFIG = Object.freeze({ whatsappNumber: '' });
  const STORAGE_KEY = 'sura-storefront-v2';
  const RATES = Object.freeze({ PKR: 1, USD: 0.0036, GBP: 0.0028, AED: 0.0132, CAD: 0.0049, EUR: 0.0033 });
  const SIZES = Object.freeze(['S', 'M', 'L', 'XL', 'Custom']);
  const CATEGORIES = Object.freeze({ pret: 'Everyday', festive: 'Festive', wedding: 'Wedding' });
  const CATALOG = Object.freeze({
    noor: {
      name: 'Noor', subtitle: 'Ivory silk set', category: 'pret', price: 18500,
      image: './images/product-noor.webp',
      description: 'A softly structured ivory set with a relaxed silhouette and delicate tonal detail. Easy to dress up for lunch, an intimate gathering, or an evening out.',
      fabric: 'Silk blend with a soft drape', color: 'Warm ivory',
      pieces: 'Kurta, straight trousers, and dupatta',
      fit: 'Relaxed fit; choose your usual size or request custom sizing',
      care: 'Professional dry clean; steam on a low setting',
      leadTime: 'Production timing confirmed with your enquiry'
    },
    mehr: {
      name: 'Mehr', subtitle: 'Burgundy peshwas', category: 'wedding', price: 38500,
      image: './images/product-mehr.webp',
      description: 'A flowing burgundy peshwas with warm metallic detail and a generous flare. Designed for wedding celebrations, with a coordinating dupatta to complete the look.',
      fabric: 'Silk blend peshwas with an organza dupatta', color: 'Deep burgundy',
      pieces: 'Peshwas, trousers, and dupatta',
      fit: 'Fitted through the bodice with a flared skirt; custom sizing available',
      care: 'Professional dry clean; protect embellishments when steaming',
      leadTime: 'Production timing confirmed with your enquiry'
    },
    gul: {
      name: 'Gul', subtitle: 'Rose organza set', category: 'festive', price: 26900,
      image: './images/product-gul.webp',
      description: 'Rose organza brings a light, layered feel to this festive set. Fine detailing and a coordinating dupatta make it an easy choice for celebrations from afternoon to evening.',
      fabric: 'Lined organza with silk blend trousers', color: 'Muted rose',
      pieces: 'Lined kurta, trousers, and dupatta',
      fit: 'Straight silhouette with room to move; custom sizing available',
      care: 'Professional dry clean; avoid direct heat on organza',
      leadTime: 'Production timing confirmed with your enquiry'
    },
    sahar: {
      name: 'Sahar', subtitle: 'Sage everyday silk', category: 'pret', price: 16900,
      image: './images/product-sahar.webp',
      description: 'An uncomplicated sage set with clean lines and a fluid finish. A considered everyday piece for work, visiting family, and everything in between.',
      fabric: 'Lightweight silk blend', color: 'Soft sage',
      pieces: 'Kurta and straight trousers',
      fit: 'Easy, relaxed fit; choose your usual size or request custom sizing',
      care: 'Professional dry clean; steam on a low setting',
      leadTime: 'Production timing confirmed with your enquiry'
    },
    neel: {
      name: 'Neel', subtitle: 'Midnight festive set', category: 'festive', price: 29500,
      image: './images/product-neel.webp',
      description: 'Deep midnight blue, a fluid silhouette, and restrained metallic accents. A festive set with enough presence for a celebration and enough ease to wear all evening.',
      fabric: 'Silk blend with an organza dupatta', color: 'Midnight blue',
      pieces: 'Kurta, trousers, and dupatta',
      fit: 'Straight silhouette; custom sizing available',
      care: 'Professional dry clean; protect embellishments when steaming',
      leadTime: 'Production timing confirmed with your enquiry'
    }
  });

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const isProduct = id => typeof id === 'string' && Object.hasOwn(CATALOG, id);
  const isCurrency = value => typeof value === 'string' && Object.hasOwn(RATES, value);

  function readState() {
    const clean = { currency: 'PKR', saved: [], bag: [] };
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
      if (isCurrency(raw.currency)) clean.currency = raw.currency;
      if (Array.isArray(raw.saved)) clean.saved = [...new Set(raw.saved.filter(isProduct))];
      if (Array.isArray(raw.bag)) {
        raw.bag.slice(0, 100).forEach(item => {
          if (!item || !isProduct(item.id) || !SIZES.includes(item.size)
            || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return;
          const existing = clean.bag.find(line => line.id === item.id && line.size === item.size);
          if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
          else clean.bag.push({ id: item.id, size: item.size, quantity: item.quantity });
        });
      }
    } catch { /* Browsing and enquiries remain available when storage is unavailable. */ }
    return clean;
  }

  const initial = readState();
  let currency = initial.currency;
  const saved = new Set(initial.saved);
  let bag = initial.bag;
  let filter = 'all';
  let activeProduct = null;
  let chosenSize = null;
  let enquiryContext = { type: 'general' };
  let toastTimeout;
  let scrollLocked = false;
  let previousOverflow = '';
  const dialogOrigins = new WeakMap();
  const productCards = $$('.product-card[data-product]');
  // The adjacent product title describes each decorative colour swatch.
  $$('.colour-dot[aria-label]').forEach(dot => {
    dot.setAttribute('aria-hidden', 'true');
    dot.removeAttribute('aria-label');
  });

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency, saved: [...saved], bag })); }
    catch { /* An unavailable storage quota should never block shopping. */ }
  }

  const money = (value, code = currency) => `${code} ${new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(Math.round(value * RATES[code]))}`;
  const subtotal = items => items.reduce((sum, item) => sum + CATALOG[item.id].price * item.quantity, 0);

  function announce(message) {
    const toast = $('#toast');
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 3500);
  }

  function syncScrollLock() {
    const hasDialog = Boolean($('dialog[open]'));
    document.body.classList.toggle('modal-open', hasDialog);
    if (hasDialog && !scrollLocked) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      scrollLocked = true;
    } else if (!hasDialog && scrollLocked) {
      document.body.style.overflow = previousOverflow;
      scrollLocked = false;
    }
  }

  function closeMenu() {
    $('#menu-toggle')?.setAttribute('aria-expanded', 'false');
    $('#menu-toggle')?.setAttribute('aria-label', 'Open navigation');
    $('#navigation')?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }

  function openDialog(dialog, { nested = false } = {}) {
    if (!dialog || dialog.open) return;
    let origin = document.activeElement;
    if (!nested) {
      $$('dialog[open]').reverse().forEach(open => {
        if (open.contains(origin)) origin = dialogOrigins.get(open) || origin;
        open.close();
      });
    }
    closeMenu();
    dialogOrigins.set(dialog, origin);
    dialog.showModal();
    syncScrollLock();
  }

  $$('dialog').forEach(dialog => {
    let pointerStartedOutside = false;
    dialog.addEventListener('pointerdown', event => {
      const bounds = dialog.getBoundingClientRect();
      pointerStartedOutside = event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      if (pointerStartedOutside && event.target === dialog && outside) dialog.close();
      pointerStartedOutside = false;
    });
    dialog.addEventListener('close', () => {
      syncScrollLock();
      const origin = dialogOrigins.get(dialog);
      const remaining = $$('dialog[open]').at(-1);
      if (origin?.isConnected && (!remaining || remaining.contains(origin)) && origin.getClientRects().length) {
        origin.focus({ preventScroll: true });
      } else if (!remaining && origin?.closest('.product-card')) {
        const fallback = $('.product-card:not([hidden]) [data-product-open]')
          || $('#no-results:not([hidden]) #reset-filters')
          || $('[data-filter="all"]');
        fallback?.focus({ preventScroll: true });
      }
    });
  });

  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog')?.close();
    const guide = event.target.closest('[data-open-size-guide]');
    if (guide) {
      event.preventDefault();
      openDialog($('#size-dialog'), { nested: true });
    }
  });

  $('#menu-toggle')?.addEventListener('click', () => {
    const expanded = $('#menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('#menu-toggle').setAttribute('aria-expanded', String(expanded));
    $('#menu-toggle').setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
    $('#navigation')?.classList.toggle('is-open', expanded);
    document.body.classList.toggle('menu-open', expanded);
  });
  $('#navigation')?.addEventListener('click', event => {
    if (event.target.closest('a, button')) closeMenu();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#navigation, #menu-toggle')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || $('dialog[open]')) return;
    if ($('#menu-toggle')?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      $('#menu-toggle').focus();
    }
    if ($('#search-panel') && !$('#search-panel').hidden) {
      $('#search-panel').hidden = true;
      $('#search-toggle')?.setAttribute('aria-expanded', 'false');
      $('#search-toggle')?.focus();
    }
  });

  function applyFilters() {
    const query = ($('#product-search')?.value || '').trim().toLocaleLowerCase();
    const order = $('#sort-select')?.value || 'featured';
    let visible = 0;
    const ordered = [...productCards];
    if (order === 'price-low' || order === 'price-high') {
      ordered.sort((a, b) => {
        const difference = (CATALOG[a.dataset.product]?.price || 0) - (CATALOG[b.dataset.product]?.price || 0);
        return order === 'price-low' ? difference : -difference;
      });
    }
    ordered.forEach(card => {
      const product = CATALOG[card.dataset.product];
      if (!product) return;
      const matchesCategory = filter === 'all' || (filter === 'saved' ? saved.has(card.dataset.product) : product.category === filter);
      const searchable = `${product.name} ${product.subtitle} ${CATEGORIES[product.category]} ${product.fabric} ${product.color} ${product.description}`.toLocaleLowerCase();
      const matches = matchesCategory && (!query || query.split(/\s+/).every(word => searchable.includes(word)));
      card.hidden = !matches;
      if (matches) visible += 1;
      $('#product-grid')?.append(card);
    });
    $$('[data-filter]').forEach(button => {
      const selected = button.dataset.filter === filter;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
      button.classList.toggle('active', selected);
    });
    $('#saved-toggle')?.setAttribute('aria-pressed', String(filter === 'saved'));
    if ($('#results-count')) $('#results-count').textContent = `${visible} ${visible === 1 ? 'piece' : 'pieces'}${filter === 'saved' ? ' saved' : ''}`;
    if ($('#no-results')) $('#no-results').hidden = visible > 0;
  }

  function chooseFilter(value, navigate = false) {
    if (!['all', 'pret', 'festive', 'wedding', 'saved'].includes(value)) return;
    filter = value;
    applyFilters();
    if (navigate) {
      const collection = $('#collection');
      collection?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      const heading = collection?.querySelector('h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
  }

  $$('[data-filter]').forEach(button => button.addEventListener('click', () => chooseFilter(button.dataset.filter)));
  $$('[data-shop-category]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    if ($('#product-search')) $('#product-search').value = '';
    chooseFilter(link.dataset.shopCategory, true);
    closeMenu();
  }));
  $('#saved-toggle')?.addEventListener('click', () => chooseFilter('saved', true));
  $('#sort-select')?.addEventListener('change', applyFilters);
  $('#product-search')?.addEventListener('input', applyFilters);
  $('#reset-filters')?.addEventListener('click', () => {
    if ($('#product-search')) $('#product-search').value = '';
    if ($('#sort-select')) $('#sort-select').value = 'featured';
    chooseFilter('all');
    $('[data-filter="all"]')?.focus();
  });
  $('#search-toggle')?.addEventListener('click', () => {
    const panel = $('#search-panel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    $('#search-toggle').setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) $('#product-search')?.focus();
  });

  function updateSaved() {
    $$('[data-save]').forEach(button => {
      const selected = saved.has(button.dataset.save);
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-saved', selected);
      button.setAttribute('aria-label', `${selected ? 'Unsave' : 'Save'} ${CATALOG[button.dataset.save]?.name || 'piece'}`);
    });
    if ($('#saved-count')) $('#saved-count').textContent = String(saved.size);
    $('#saved-toggle')?.setAttribute('aria-label', `View saved pieces, ${saved.size} saved`);
    const modalSave = $('#product-save');
    if (modalSave && activeProduct) {
      const selected = saved.has(activeProduct);
      modalSave.setAttribute('aria-pressed', String(selected));
      modalSave.textContent = selected ? 'Saved to favourites' : 'Save this piece';
      modalSave.classList.toggle('is-saved', selected);
    }
    if (filter === 'saved') applyFilters();
  }

  function toggleSaved(id) {
    if (!isProduct(id)) return;
    const focused = document.activeElement;
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    persist();
    updateSaved();
    if (focused?.closest('.product-card[hidden]')) {
      const fallback = $('.product-card:not([hidden]) [data-save]')
        || $('#no-results:not([hidden]) #reset-filters')
        || $('[data-filter="all"]');
      fallback?.focus({ preventScroll: true });
    }
    announce(`${CATALOG[id].name} ${saved.has(id) ? 'saved to' : 'removed from'} your favourites.`);
  }
  $$('[data-save]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleSaved(button.dataset.save);
  }));
  $('#product-save')?.addEventListener('click', () => toggleSaved(activeProduct));

  function openProduct(id) {
    if (!isProduct(id)) return;
    activeProduct = id;
    chosenSize = null;
    const product = CATALOG[id];
    const productImage = $('#product-image');
    if (productImage) {
      productImage.src = product.image;
      productImage.alt = `${product.name} — ${product.subtitle}, shown on a fictional AI-generated model`;
    }
    if ($('#product-category')) $('#product-category').textContent = `${CATEGORIES[product.category]} · ${product.subtitle}`;
    if ($('#product-name')) $('#product-name').textContent = product.name;
    if ($('#product-price')) $('#product-price').textContent = money(product.price);
    if ($('#product-description')) $('#product-description').textContent = product.description;
    const details = $('#product-details');
    if (details) {
      details.replaceChildren();
      [ ['Fabric', product.fabric], ['Colour', product.color], ['Includes', product.pieces], ['Fit', product.fit], ['Care', product.care], ['Lead time', product.leadTime] ].forEach(([label, value]) => {
        const row = make('div', 'product-detail');
        row.append(make('dt', '', label), make('dd', '', value));
        details.append(row);
      });
    }
    const sizeFieldset = $('#product-sizes');
    if (sizeFieldset) {
      sizeFieldset.replaceChildren(make('legend', 'sr-only', 'Choose your size'));
      SIZES.forEach(size => {
        const label = make('label', 'size-option');
        const radio = make('input');
        radio.type = 'radio';
        radio.name = 'product-size';
        radio.value = size;
        radio.setAttribute('aria-describedby', 'product-size-error');
        radio.addEventListener('change', () => {
          chosenSize = size;
          if ($('#product-size-error')) {
            $('#product-size-error').textContent = '';
            $('#product-size-error').hidden = true;
          }
          sizeFieldset.removeAttribute('aria-invalid');
        });
        label.append(radio, make('span', '', size));
        sizeFieldset.append(label);
      });
      sizeFieldset.removeAttribute('aria-invalid');
    }
    if ($('#product-size-error')) {
      $('#product-size-error').textContent = '';
      $('#product-size-error').hidden = true;
    }
    updateSaved();
    openDialog($('#product-dialog'));
  }
  $$('[data-product-open]').forEach(button => button.addEventListener('click', () => openProduct(button.dataset.productOpen)));

  function renderBag() {
    const count = bag.reduce((sum, item) => sum + item.quantity, 0);
    if ($('#bag-count')) $('#bag-count').textContent = String(count);
    $('#bag-toggle')?.setAttribute('aria-label', `Open bag, ${count} ${count === 1 ? 'item' : 'items'}`);
    if ($('#bag-empty')) $('#bag-empty').hidden = bag.length > 0;
    if ($('#bag-summary')) $('#bag-summary').hidden = bag.length === 0;
    if ($('#bag-enquire')) $('#bag-enquire').disabled = bag.length === 0;
    if ($('#bag-subtotal')) $('#bag-subtotal').textContent = money(subtotal(bag));
    const container = $('#bag-items');
    if (!container) return;
    container.replaceChildren();
    bag.forEach(item => {
      const product = CATALOG[item.id];
      const row = make('div', 'bag-item');
      row.dataset.bagId = item.id;
      row.dataset.bagSize = item.size;
      const img = make('img');
      img.src = product.image;
      img.alt = `${product.name} ${product.subtitle}`;
      img.width = 86;
      img.height = 110;
      const copy = make('div', 'bag-item-copy');
      copy.append(make('h3', '', product.name), make('p', '', product.subtitle), make('p', 'bag-item-size', `Size: ${item.size === 'Custom' ? 'Custom — measurements to confirm' : item.size}`));
      const controls = make('div', 'quantity-control');
      controls.setAttribute('role', 'group');
      controls.setAttribute('aria-label', `${product.name}, size ${item.size}, quantity`);
      ['-', '+'].forEach(direction => {
        const button = make('button', '', direction === '-' ? '−' : '+');
        button.type = 'button';
        button.dataset.quantity = direction;
        button.setAttribute('aria-label', `${direction === '-' ? 'Decrease' : 'Increase'} quantity of ${product.name}, size ${item.size}`);
        button.disabled = direction === '-' ? item.quantity <= 1 : item.quantity >= 99;
        if (direction === '+') controls.append(make('span', '', String(item.quantity)));
        controls.append(button);
      });
      const remove = make('button', 'bag-remove', 'Remove');
      remove.type = 'button';
      remove.dataset.remove = '';
      remove.setAttribute('aria-label', `Remove ${product.name}, size ${item.size}, from bag`);
      copy.append(controls, remove);
      row.append(img, copy, make('p', 'bag-item-price', money(product.price * item.quantity)));
      container.append(row);
    });
  }

  $('#product-add')?.addEventListener('click', () => {
    if (!isProduct(activeProduct)) return;
    if (!SIZES.includes(chosenSize)) {
      if ($('#product-size-error')) {
        $('#product-size-error').textContent = 'Choose a size, or select Custom for a made-to-measure enquiry.';
        $('#product-size-error').hidden = false;
      }
      $('#product-sizes')?.setAttribute('aria-invalid', 'true');
      $('#product-sizes input')?.focus();
      return;
    }
    const existing = bag.find(item => item.id === activeProduct && item.size === chosenSize);
    if (existing?.quantity >= 99) {
      announce('You have reached the limit of 99 for this piece and size.');
      return;
    }
    if (existing) existing.quantity += 1;
    else bag.push({ id: activeProduct, size: chosenSize, quantity: 1 });
    persist();
    renderBag();
    announce(`${CATALOG[activeProduct].name}, size ${chosenSize}, added to your bag.`);
    openDialog($('#bag-dialog'));
  });
  $('#bag-toggle')?.addEventListener('click', () => {
    renderBag();
    openDialog($('#bag-dialog'));
  });
  $('#bag-items')?.addEventListener('click', event => {
    const button = event.target.closest('[data-quantity], [data-remove]');
    if (!button) return;
    const row = button.closest('[data-bag-id]');
    const item = bag.find(line => line.id === row?.dataset.bagId && line.size === row?.dataset.bagSize);
    if (!item) return;
    const removing = button.hasAttribute('data-remove');
    const direction = button.dataset.quantity;
    if (removing) bag = bag.filter(line => line !== item);
    else item.quantity = Math.max(1, Math.min(99, item.quantity + (direction === '+' ? 1 : -1)));
    persist();
    renderBag();
    const currentRow = $$('#bag-items [data-bag-id]').find(line => line.dataset.bagId === item.id && line.dataset.bagSize === item.size);
    const target = removing ? $('#bag-items [data-remove]') || $('#bag-continue') : $(`[data-quantity="${direction}"]:not(:disabled)`, currentRow) || $('[data-remove]', currentRow);
    target?.focus({ preventScroll: true });
    announce(removing ? `${CATALOG[item.id].name} removed from your bag.` : `${CATALOG[item.id].name} quantity: ${item.quantity}.`);
    invalidateEnquiry();
  });

  function updatePrices() {
    $$('[data-price]').forEach(element => {
      const value = Number(element.dataset.price);
      if (Number.isFinite(value)) element.textContent = money(value);
    });
    if (activeProduct && $('#product-price')) $('#product-price').textContent = money(CATALOG[activeProduct].price);
    if ($('#currency-note')) $('#currency-note').textContent = currency === 'PKR'
      ? 'Prices in PKR. Delivery calculated with your enquiry.'
      : 'Illustrative conversion. Final quote confirmed in PKR.';
    renderBag();
  }
  if ($('#currency-select')) $('#currency-select').value = currency;
  $('#currency-select')?.addEventListener('change', event => {
    if (!isCurrency(event.target.value)) return;
    currency = event.target.value;
    persist();
    updatePrices();
    invalidateEnquiry();
    announce(`Prices shown in ${currency}${currency === 'PKR' ? '.' : ' using an illustrative conversion.'}`);
  });

  function invalidateEnquiry() {
    if ($('#enquiry-preview')) $('#enquiry-preview').hidden = true;
    if ($('#enquiry-status')) $('#enquiry-status').textContent = '';
  }

  function openEnquiry(type = 'general') {
    enquiryContext = type === 'product'
      ? { type, id: activeProduct, size: chosenSize }
      : { type };
    const interest = $('#enquiry-interest');
    if (interest) interest.value = type === 'styling' ? 'Personal styling' : type === 'bridal' ? 'Bridal consultation' : (type === 'product' && chosenSize === 'Custom') ? 'Custom sizing' : 'General enquiry';
    invalidateEnquiry();
    openDialog($('#enquiry-dialog'));
  }
  $$('[data-enquiry]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    openEnquiry(button.dataset.enquiry);
  }));
  $('#product-enquire')?.addEventListener('click', () => {
    if (isProduct(activeProduct)) openEnquiry('product');
  });
  $('#bag-enquire')?.addEventListener('click', () => { if (bag.length) openEnquiry('bag'); });

  function updateWhatsAppLink() {
    const link = $('#enquiry-whatsapp');
    const message = $('#enquiry-message')?.value.trim() || '';
    if (!link) return;
    const number = BRAND_CONFIG.whatsappNumber.replace(/\D/g, '');
    if (message) {
      link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      link.removeAttribute('aria-disabled');
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
    }
    link.rel = 'noopener noreferrer';
  }

  const dateInput = $('#enquiry-date');
  if (dateInput) {
    const today = new Date();
    dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  $('#enquiry-form')?.addEventListener('input', event => {
    if (event.target.id === 'enquiry-message') return;
    if (event.target.id === 'enquiry-name') event.target.setCustomValidity('');
    invalidateEnquiry();
  });
  $('#enquiry-form')?.addEventListener('change', event => {
    if (event.target.id !== 'enquiry-message') invalidateEnquiry();
  });
  $('#enquiry-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const nameInput = $('#enquiry-name');
    nameInput?.setCustomValidity(nameInput.value.trim() ? '' : 'Please enter your name.');
    if (!form.reportValidity()) return;
    const name = nameInput?.value.trim() || '';
    const country = $('#enquiry-country')?.value || 'Pakistan';
    const interest = $('#enquiry-interest')?.value || 'General enquiry';
    const date = dateInput?.value;
    const notes = $('#enquiry-notes')?.value.trim();
    const items = enquiryContext.type === 'product' && isProduct(enquiryContext.id)
      ? [{ id: enquiryContext.id, size: enquiryContext.size || 'To be confirmed', quantity: 1 }]
      : bag.map(item => ({ ...item }));
    const lines = [
      'Hello SURA,', '',
      `My name is ${name}. I am enquiring from ${country}.`,
      `I am interested in: ${interest}.`
    ];
    if (date) {
      const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      lines.push(`Preferred delivery / occasion date: ${formattedDate} (please confirm feasibility).`);
    }
    if (items.length) {
      lines.push('', 'My selection:');
      items.forEach((item, index) => {
        const product = CATALOG[item.id];
        lines.push(`${index + 1}. ${product.name} — ${product.subtitle}`, `   Size: ${item.size}; quantity: ${item.quantity}`, `   ${money(product.price, 'PKR')} each · ${money(product.price * item.quantity, 'PKR')} total`);
      });
      lines.push('', `Selection subtotal: ${money(subtotal(items), 'PKR')}.`);
      if (currency !== 'PKR') lines.push(`Illustrative display conversion: ${money(subtotal(items))}. Final quote to be confirmed in PKR.`);
      lines.push('Please confirm availability, sizing, production time, delivery charges, and any applicable duties before an order is placed.');
    } else {
      lines.push('', 'Please help me explore the collection, sizing, and delivery options.');
    }
    if (notes) lines.push('', 'My notes:', notes);
    lines.push('', 'This message was prepared using the SURA demonstration storefront. No order or appointment has been confirmed.');
    const messageInput = $('#enquiry-message');
    if (messageInput) messageInput.value = lines.join('\n');
    if ($('#enquiry-preview')) $('#enquiry-preview').hidden = false;
    if ($('#enquiry-status')) $('#enquiry-status').textContent = 'Your enquiry is ready to review. Nothing has been sent.';
    updateWhatsAppLink();
    messageInput?.focus();
  });
  $('#enquiry-message')?.addEventListener('input', () => {
    updateWhatsAppLink();
    if ($('#enquiry-status')) $('#enquiry-status').textContent = 'Message updated. Nothing has been sent.';
  });
  $('#enquiry-copy')?.addEventListener('click', async () => {
    const messageInput = $('#enquiry-message');
    if (!messageInput?.value.trim()) {
      if ($('#enquiry-status')) $('#enquiry-status').textContent = 'Add a message before copying.';
      return;
    }
    try {
      await navigator.clipboard.writeText(messageInput.value);
      if ($('#enquiry-status')) $('#enquiry-status').textContent = 'Enquiry copied. Paste it into your preferred messaging app.';
    } catch {
      messageInput.focus();
      messageInput.select();
      if ($('#enquiry-status')) $('#enquiry-status').textContent = 'Select Copy from your device menu, or press Ctrl+C / Command+C to copy the selected enquiry.';
    }
  });

  $$('[data-unit]').forEach(button => button.addEventListener('click', () => {
    const unit = button.dataset.unit;
    if (!['in', 'cm'].includes(unit)) return;
    $$('[data-unit]').forEach(option => {
      const selected = option.dataset.unit === unit;
      option.setAttribute('aria-pressed', String(selected));
      option.classList.toggle('is-active', selected);
      option.classList.toggle('active', selected);
    });
    $$('td[data-in]').forEach(cell => {
      const inches = Number(cell.dataset.in);
      if (Number.isFinite(inches)) cell.textContent = unit === 'cm' ? String(Math.round(inches * 2.54 * 10) / 10) : cell.dataset.in;
    });
    if ($('#size-unit-label')) $('#size-unit-label').textContent = unit === 'cm' ? 'Body measurements in centimetres' : 'Body measurements in inches';
  }));

  function updateShipping() {
    const region = $('#shipping-country')?.value || 'Pakistan';
    const local = region === 'Pakistan';
    const other = region === 'Other';
    if ($('#shipping-time')) $('#shipping-time').textContent = other ? 'Confirmed with your enquiry' : local ? '3–5 business days after dispatch' : '7–12 business days after dispatch';
    if ($('#shipping-note')) $('#shipping-note').textContent = other
      ? 'Tell us your destination for a delivery estimate. Production time is confirmed separately.'
      : local
        ? 'Indicative transit time within Pakistan after production. Availability, delivery cost, and dispatch date are confirmed with your enquiry.'
        : 'Indicative international transit time after production. Destination, customs, and courier availability may affect delivery. Charges and any duties are confirmed with your enquiry.';
  }
  $('#shipping-country')?.addEventListener('change', () => {
    updateShipping();
    const countries = { Pakistan: 'Pakistan', US: 'United States', UK: 'United Kingdom', UAE: 'United Arab Emirates', Canada: 'Canada', Europe: 'Europe', Other: 'Other' };
    if ($('#enquiry-country')) $('#enquiry-country').value = countries[$('#shipping-country').value] || 'Other';
    invalidateEnquiry();
  });

  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    const incoming = readState();
    currency = incoming.currency;
    bag = incoming.bag;
    saved.clear();
    incoming.saved.forEach(id => saved.add(id));
    if ($('#currency-select')) $('#currency-select').value = currency;
    updateSaved();
    updatePrices();
    applyFilters();
    invalidateEnquiry();
  });

  if ($('#year')) $('#year').textContent = String(new Date().getFullYear());
  updateSaved();
  updatePrices();
  applyFilters();
  updateShipping();
});
