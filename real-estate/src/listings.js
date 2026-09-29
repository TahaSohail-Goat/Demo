import { animate, stagger } from 'motion';
import { LISTINGS } from './data.js';
import { buildCard } from './cards.js';

const FIELDS = ['area', 'status', 'beds', 'max', 'sort'];

const SORTERS = {
  'price-desc': (a, b) => comparablePrice(b) - comparablePrice(a),
  'price-asc': (a, b) => comparablePrice(a) - comparablePrice(b),
  newest: (a, b) => b.year - a.year,
  size: (a, b) => b.sqft - a.sqft
};

// Monthly lease prices are ranked as if annualised so they sort sensibly beside sale prices.
function comparablePrice(listing) {
  return listing.listing === 'lease' ? listing.price * 12 : listing.price;
}

function matches(listing, filters) {
  if (filters.area && listing.area !== filters.area) return false;
  if (filters.status && listing.listing !== filters.status) return false;
  if (filters.beds && listing.beds < Number(filters.beds)) return false;
  // Max price applies to sale prices only; monthly rents are never above it.
  if (filters.max && listing.listing === 'sale' && listing.price > Number(filters.max)) return false;
  return true;
}

export function initListingsPage(root, { reduceMotion, onCardsRendered }) {
  const form = root.querySelector('[data-filters]');
  const results = root.querySelector('[data-results]');
  const countLabel = root.querySelector('[data-count-label]');
  const empty = root.querySelector('[data-empty]');
  const title = root.querySelector('#listings-title');
  if (!form || !results) return;

  const params = new URLSearchParams(window.location.search);
  FIELDS.forEach(name => {
    const control = form.elements.namedItem(name);
    const value = params.get(name);
    if (control && value !== null && [...control.options].some(option => option.value === value)) control.value = value;
  });

  const readFilters = () => Object.fromEntries(FIELDS.map(name => [name, form.elements.namedItem(name)?.value || '']));

  const syncUrl = filters => {
    const next = new URLSearchParams();
    FIELDS.forEach(name => { if (filters[name]) next.set(name, filters[name]); });
    const query = next.toString();
    window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
  };

  const syncHeading = filters => {
    if (!title) return;
    const [lead, accent] = {
      lease: ['Homes for ', 'lease'],
      sale: ['Homes for ', 'sale']
    }[filters.status] || ['Every home we ', 'represent'];
    const em = document.createElement('em');
    em.className = 'italic';
    em.textContent = accent;
    title.replaceChildren(lead, em, filters.area ? ` in ${filters.area}` : '');
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === filters.status) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const render = ({ animateIn = true } = {}) => {
    const filters = readFilters();
    let list = LISTINGS.filter(listing => matches(listing, filters));
    if (SORTERS[filters.sort]) list = [...list].sort(SORTERS[filters.sort]);

    results.replaceChildren(...list.map(listing => buildCard(listing)));
    countLabel.textContent = list.length === 1 ? '1 residence' : `${list.length} residences`;
    empty.hidden = list.length > 0;
    syncHeading(filters);
    onCardsRendered?.(results);

    if (animateIn && !reduceMotion && list.length) {
      animate(results.children, { opacity: [0, 1], transform: ['translateY(30px)', 'translateY(0px)'] }, {
        duration: 0.9,
        delay: stagger(0.07),
        ease: [0.16, 1, 0.3, 1]
      });
    }
    return filters;
  };

  form.addEventListener('change', () => syncUrl(render()));
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => {
    // Wait for the browser to restore default values before re-rendering.
    window.setTimeout(() => syncUrl(render()), 0);
  });
  root.querySelectorAll('[data-reset]').forEach(button => {
    if (button.type !== 'reset') button.addEventListener('click', () => form.reset());
  });

  render();
}
