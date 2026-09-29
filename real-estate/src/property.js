import { scroll } from 'motion';
import { LISTINGS, findListing, formatMoney, formatNumber, formatPrice } from './data.js';
import { buildCard } from './cards.js';

const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

function monthlyPayment(principal, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 100 / 12;
  if (principal <= 0 || n <= 0) return 0;
  if (r === 0) return principal / n;
  const growth = (1 + r) ** n;
  return (principal * r * growth) / (growth - 1);
}

function similarTo(listing) {
  return LISTINGS
    .filter(other => other.id !== listing.id && other.listing === listing.listing)
    .map(other => ({
      other,
      score: (other.area === listing.area ? 0 : 1) + Math.abs(other.price - listing.price) / listing.price
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(({ other }) => other);
}

function initMortgage(form, listing) {
  form.hidden = false;
  const price = form.elements.namedItem('price');
  const down = form.elements.namedItem('down');
  const rate = form.elements.namedItem('rate');
  const term = form.elements.namedItem('term');
  const downLabel = form.querySelector('[data-down-label]');
  const monthly = form.querySelector('[data-monthly]');
  const loan = form.querySelector('[data-loan]');
  price.value = String(listing.price);

  const update = () => {
    const homePrice = Math.max(0, Number(price.value) || 0);
    const downShare = Number(down.value) / 100;
    const principal = homePrice * (1 - downShare);
    downLabel.textContent = `${down.value}% (${formatMoney(homePrice * downShare)})`;
    monthly.textContent = formatMoney(monthlyPayment(principal, Math.max(0, Number(rate.value) || 0), Number(term.value)));
    loan.textContent = formatMoney(principal);
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', event => event.preventDefault());
  update();
}

function initGallery(root, listing) {
  const grid = root.querySelector('[data-gallery]');
  const dialog = document.querySelector('[data-lightbox]');
  const count = root.querySelector('[data-gallery-count]');
  if (!grid || !dialog) return;
  const image = dialog.querySelector('[data-lightbox-img]');
  const counter = dialog.querySelector('[data-lightbox-count]');
  const photos = listing.gallery;
  let index = 0;
  let opener = null;

  count.textContent = `${photos.length} photographs`;
  const layout = [
    'col-span-2 row-span-2',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1'
  ];

  const show = next => {
    index = (next + photos.length) % photos.length;
    image.src = photos[index].src;
    image.alt = `${listing.name}, photograph ${index + 1} of ${photos.length}`;
    counter.textContent = `${index + 1} / ${photos.length}`;
  };

  grid.replaceChildren(...photos.map((photo, i) => {
    const button = make('button', `group relative overflow-hidden rounded-2xl bg-sand ${layout[i] || 'col-span-1'}`);
    button.type = 'button';
    button.setAttribute('aria-label', `Open photograph ${i + 1} of ${photos.length}`);
    const img = make('img', 'absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-[1.05]');
    img.src = i === 0 ? photo.src : photo.small;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    button.append(img);
    button.addEventListener('click', () => {
      opener = button;
      show(i);
      dialog.showModal();
    });
    return button;
  }));

  dialog.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-lightbox-next]').addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lightbox-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
}

export function initPropertyPage(root, { reduceMotion, onCardsRendered }) {
  const listing = findListing(new URLSearchParams(window.location.search).get('id'));
  const content = root.querySelector('[data-property-content]');
  if (!listing) {
    root.querySelector('[data-property-missing]').hidden = false;
    document.title = 'Residence not found | Calder Hale';
    return;
  }

  document.title = `${listing.name}, ${listing.area} | Calder Hale`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', `${listing.name} in ${listing.area}: ${listing.summary}`);

  const bind = (key, value) => root.querySelectorAll(`[data-bind="${key}"]`).forEach(node => { node.textContent = value; });
  bind('name', listing.name);
  bind('status', listing.status);
  bind('place', `${listing.locale}, ${listing.area}, California`);
  bind('price', formatPrice(listing));
  bind('price-label', listing.listing === 'lease' ? 'Monthly rent' : 'Offered at');
  bind('summary', listing.summary);
  root.querySelectorAll('[data-bind-value="id"]').forEach(input => { input.value = listing.id; });

  const cover = root.querySelector('[data-bind-cover]');
  cover.src = listing.cover.src;
  cover.srcset = `${listing.cover.small} 800w, ${listing.cover.src} 1600w`;
  cover.sizes = '100vw';
  cover.alt = `${listing.name}, ${listing.area}`;

  const facts = [
    ['Bedrooms', String(listing.beds)],
    ['Bathrooms', String(listing.baths)],
    ['Interior', `${formatNumber(listing.sqft)} sq ft`],
    ['Lot', listing.lot],
    ['Built', String(listing.year)],
    ['Style', listing.type]
  ];
  root.querySelector('[data-facts]').replaceChildren(...facts.map(([term, value], i) => {
    const cell = make('div', `py-7 ${i % 2 ? 'pl-5' : 'pr-5'} md:px-5 ${i === 0 ? 'md:pl-0' : ''} border-line lg:border-r lg:last:border-r-0`);
    cell.append(make('dt', 'field-label', term), make('dd', 'display text-[2rem] leading-none', value));
    return cell;
  }));

  root.querySelector('[data-bind="description"]').replaceChildren(...listing.description.map(text => make('p', '', text)));
  root.querySelector('[data-bind="features"]').replaceChildren(...listing.features.map(text => {
    const item = make('li', 'flex items-center gap-3 border-b border-line py-3.5 font-medium');
    const dot = make('span', 'size-1.5 shrink-0 rounded-full bg-bronze');
    dot.setAttribute('aria-hidden', 'true');
    item.append(dot, text);
    return item;
  }));

  if (listing.listing === 'sale') initMortgage(root.querySelector('[data-mortgage]'), listing);
  else root.querySelector('[data-lease-terms]').hidden = false;

  initGallery(root, listing);

  const similar = root.querySelector('[data-similar]');
  similar.replaceChildren(...similarTo(listing).map(other => buildCard(other, { sizes: '(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw' })));
  onCardsRendered?.(similar);

  const dateInput = root.querySelector('[data-min-today]');
  if (dateInput) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    dateInput.min = today.toISOString().slice(0, 10);
  }

  content.hidden = false;

  if (!reduceMotion) {
    scroll(progress => { cover.style.transform = `translateY(${(progress * 8).toFixed(2)}%)`; }, {
      target: cover.parentElement,
      offset: ['start start', 'end start']
    });
  }
}
