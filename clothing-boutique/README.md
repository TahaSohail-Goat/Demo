# SŪRA Atelier

A fictional Pakistani fashion boutique for client outreach. The storefront pairs original AI fashion imagery with an editorial cream-and-burgundy design and working shopping enquiries for local and international customers.

## Preview

Open `index.html` directly, or run `python -m http.server 4173` from this folder and visit `http://localhost:4173`. No package installation, framework, build step, external fonts, or image CDN is needed.

## What works

- Responsive collection with categories, search, price sorting, and saved pieces.
- Product details, deliberate size selection, and an inches/centimetres body size guide.
- Shopping bag with quantity controls, removal, and estimated totals.
- Saved pieces, bag, and currency persist on the current device; malformed or unavailable storage is handled gracefully.
- PKR, USD, GBP, AED, CAD, and EUR display prices. Conversion factors are illustrative, not live financial rates.
- Local and international destination guidance, with transit estimates separate from production time.
- Styling, bridal, product, and bag enquiries with destination, optional event date, and notes.
- Validated enquiry preparation, editable message preview, copy-to-clipboard, and explicit WhatsApp sharing. Nothing is sent automatically.
- Native accessible dialogs, keyboard controls, focus restoration, mobile navigation, reduced motion, and readable content without JavaScript.

## Client configuration

Set `BRAND_CONFIG.whatsappNumber` at the top of `js/main.js` to the client's international number, digits only. A blank value deliberately opens WhatsApp's contact chooser. Configure a real number and update the visible demo notice together.

Product data is in `CATALOG` in `js/main.js`; keep static product cards and prices in `index.html` in sync. Brand colours, typography, responsive layout, and dialog styles are in `css/style.css`. Local font definitions are in `css/fonts.css`, with licenses in `FONT-LICENSES.txt`.

Before a live business launch, supply the client's real catalogue, approved imagery, contact details, prices, sizing, shipping destinations, production times, payment methods, and return/privacy terms. This demonstration takes no payments and does not submit bookings or orders to a server. Enquiry personal details are not written to local storage.

## Image provenance

The hero and five fashion images were created with the built-in image-generation tool using fictional adult models, without real-person reference images. Prompts and encoding notes are in `images/generation-prompts.md`. Optimized WebP files total approximately 1.16 MB; original PNGs remain available. The existing generated textile artwork is used in the atelier section.

Legacy `real-dress-*.jpg` files and `products_list.json` are preserved from the earlier working copy but are not referenced by the website. All displayed model imagery is generated.

The fictional brand and indicative products/pricing are disclosed in the footer and shopping guidance. No fake customer reviews, live-availability indicators, invented contact details, or guaranteed delivery claims are used.
