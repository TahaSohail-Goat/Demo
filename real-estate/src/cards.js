import { formatNumber, formatPrice } from './data.js';

const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

export const specLine = listing =>
  `${listing.beds} Beds · ${listing.baths} Baths · ${formatNumber(listing.sqft)} Sq Ft`;

/** Listing card, matching the static featured cards in index.html. */
export function buildCard(listing, { sizes = '(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 92vw' } = {}) {
  const article = make('article', '[perspective:1400px]');
  article.dataset.tilt = '';

  const link = make('a', 'tilt-card group block');
  link.href = `property.html?id=${encodeURIComponent(listing.id)}`;
  link.dataset.tiltTarget = '';

  const media = make('div', 'tilt-media relative aspect-[4/5] overflow-hidden rounded-[22px] bg-sand');
  const img = make('img', 'h-full w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-[1.06]');
  img.src = listing.cover.small;
  img.srcset = `${listing.cover.small} 800w, ${listing.cover.src} 1600w`;
  img.sizes = sizes;
  img.alt = `${listing.name}, ${listing.area}`;
  img.loading = 'lazy';
  img.decoding = 'async';
  const glare = make('span', 'glare absolute inset-0');
  glare.setAttribute('aria-hidden', 'true');
  media.append(img, glare, make('span', 'chip absolute left-4 top-4', listing.status));

  const row = make('div', 'mt-5 flex items-start justify-between gap-4');
  const titles = make('div');
  titles.append(
    make('h3', 'display text-[2rem] leading-none', listing.name),
    make('p', 'mt-2 text-sm text-stone', `${listing.area} · ${listing.locale}`)
  );
  row.append(titles, make('p', 'shrink-0 pt-1 text-right text-[15px] font-bold', formatPrice(listing)));

  link.append(media, row, make('p', 'mt-3 text-[13px] font-semibold tracking-wide text-stone', specLine(listing)));
  article.append(link);
  return article;
}
