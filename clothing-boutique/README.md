# SŪRA Atelier

A fictional Pakistani boutique designed for prospect presentations. The design uses parchment, mulberry and pale citron, an oversized serif hero, original textile imagery, and an asymmetric illustrated lookbook.

## Open it

Double-click `index.html`, or serve the repository and visit `/clothing-boutique/`. The page is a single self-contained document with inline CSS, JavaScript, illustrations, fonts and hero image. No framework, CDN or build step is required.

## Contact configuration

Find `BRAND_CONFIG` near the bottom of `index.html`:

```js
const BRAND_CONFIG = Object.freeze({
  whatsappNumber: '',
  instagramUrl: '',
  instagramHandle: '@sura.atelier'
});
```

- `whatsappNumber`: international digits only, including the country code; omit `+`, spaces, and the local leading zero.
- `instagramUrl`: the client’s full `https://www.instagram.com/.../` profile URL.
- `instagramHandle`: the corresponding visible handle.

With no number, the WhatsApp CTA opens a clearly disclosed demo enquiry. A visitor can select a look and optional size, edit/copy the message, and open WhatsApp’s contact chooser. There is no invented telephone number or real order processing. The placeholder Instagram handle is explicitly labelled as a concept and its link opens Instagram’s homepage until configured.

## Editing

- Copy and layout: semantic HTML sections.
- Colours and type: CSS custom properties at the top.
- Look details and indicative prices: both the HTML captions and `looks` object.
- Contact details: `BRAND_CONFIG`.
- Hero: embedded image data in `#hero-image`.
- Original garment and embroidery illustrations: inline SVG.

The brand, story, garments and prices are fictional. Replace these with approved client content before using this as a real shop. The footer deliberately identifies the concept.

## Accessibility and behaviour

Includes a skip link, keyboard focus outlines, native modal focus containment and Escape dismissal, focus restoration, live copy feedback, optional size selection, editable enquiry text, reduced-motion support, small-screen navigation and a mobile WhatsApp bar. The primary content is readable without JavaScript; the contact section retains a WhatsApp share link.

## Asset provenance

The textile hero was generated for this concept; garment and embroidery illustrations are original inline SVG. No real product photography or third-party brand logos are used. Embedded open-source font license details are recorded in `FONT-LICENSES.txt`.
