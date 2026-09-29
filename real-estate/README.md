# Calder Hale

A prospect-ready luxury real estate brokerage demo for Los Angeles. It shows how an agency site can use cinematic, scroll-driven storytelling while still doing the practical work: listing search, property detail pages, private tour requests and seller valuations.

Calder Hale, its listings, prices, figures and contact details are fictional. Replace and verify everything before presenting a personalized version as a real brokerage.

## Live URL

`https://realestate.webdemos.app` — a separate Vercel project from this repository with **Root Directory** set to `real-estate`. See the root README.

- `/` — homepage
- `/listings` — filterable listings (`?area=`, `status=sale|lease`, `beds=`, `max=`, `sort=`)
- `/property?id=<listing-id>` — residence detail

`real-estate/vercel.json` enables clean URLs without trailing slashes so relative asset paths resolve on every page.

## What it does

- **Scroll-scrubbed film hero.** 148 pre-rendered frames are painted onto a canvas as you scroll, crossfading from the patio into the dining room. Canvas frames are used instead of `<video>.currentTime`, which seeks unreliably (especially on iOS Safari). Frames load coarse-to-fine, so the film scrubs within the first few requests. Portrait screens get a 9:16 set.
- **3D development explorer.** Linea Residences is modelled procedurally in Three.js. Scrolling orbits the camera, separates the six levels and lights up each level group. It loads only when the section approaches, and falls back to a photograph without WebGL.
- **Motion throughout.** Motion (the standalone JavaScript version of Framer Motion) drives the reveals, word-by-word lit statement, counters, pinned horizontal listings rail, 3D-tilt cards, expanding film frame, neighborhood hover previews and menu. Lenis provides smooth scrolling.
- **Working pages.** Search from the homepage, filter and sort listings (the state is kept in the URL), property galleries with a keyboard-accessible lightbox, a mortgage estimator and a tour request form.
- **Forms** validate in the browser and show a clear demo message. Nothing is sent or stored.
- **Accessibility and resilience.** Skip link, landmarks, labelled fields, focus styles, a focus-trapped mobile menu, native `<dialog>` lightbox, `prefers-reduced-motion` support (static hero, no smooth scroll or scroll effects), and readable homepage content without JavaScript.

## Technology

- Semantic HTML5, three pages
- Tailwind CSS v4, compiled to `css/styles.css`
- Motion 13, Lenis and Three.js, bundled with esbuild
- Self-hosted fonts: Instrument Serif (display) and Manrope (text); see `FONT-LICENSES.txt`
- No runtime CDNs, frameworks or API keys

## Structure

```text
real-estate/
├── index.html · listings.html · property.html
├── css/styles.css          compiled Tailwind (do not edit)
├── js/main.js              bundled site script (do not edit)
├── js/residence-3d.js      bundled Three.js scene, loaded on demand
├── src/                    sources: input.css, main.js, sequence.js, listings.js,
│                           property.js, cards.js, data.js, residence-3d.js, package.json
├── assets/sequence/        hero frames: desktop 1440×810, mobile 540×960 (WebP)
├── assets/video/           ambient loops (H.264, muted)
├── assets/images/          listing and interior photography, 1600w and 800w (-sm)
├── fonts/
└── vercel.json · .vercelignore
```

## Editing and rebuilding

The compiled CSS and JavaScript are committed, so deployment needs no build. After changing anything in `src/` or the Tailwind classes in the HTML:

```sh
cd real-estate/src
npm install
npm run build        # or: npm run watch:css while styling
```

`src/` has its own `package.json` so Vercel, which only looks at the project root, keeps serving `real-estate/` as a plain static site. `.vercelignore` keeps `src/` out of the deployment.

Listing data lives in `src/data.js`. The six featured cards on the homepage are static HTML for no-JS and SEO, so keep them in sync with the data.

## Customizing for a prospect

Search for `CUSTOMIZE` in the HTML and `src/data.js`, then:

- Replace the brand, contact details, office, hours, license number (CA DRE #) and fair-housing and MLS/IDX disclaimers.
- Connect listings to the brokerage's IDX/RESO Web API feed. Production property pages should be server-rendered per listing with their own canonical URL, Open Graph image and structured data.
- Replace the statistics with verified figures and cite their source and date.
- Connect the valuation, contact and tour forms to the CRM (for example Follow Up Boss, kvCORE or Lofty) and add analytics to the `data-cta` attributes.
- Replace the stock media with the brokerage's own film and photography. To rebuild the hero sequence from a new clip, export frames at about 6.5 fps: 1440×810 for desktop and a centred 540×960 crop for mobile, as WebP named `f001.webp` onwards, and update `data-frames` in `index.html`.

## Media credits

All film and photography is from Pexels and used under the [Pexels License](https://www.pexels.com/license/) (free to use and modify; attribution not required). Interior photography is shared across listings for this demo.

Film:
- Hero sequence: [7578541](https://www.pexels.com/video/an-exterior-design-of-a-modern-house-7578541/) and [7578552](https://www.pexels.com/video/video-of-a-house-interior-7578552/) (Kindel Media), crossfaded and cropped to remove letterboxing
- Interiors loop and interior stills: [31617692](https://www.pexels.com/video/modern-luxury-interiors-with-spacious-design-31617692/)
- Hollywood Hills aerial: [30670702](https://www.pexels.com/video/aerial-view-of-hollywood-hills-luxury-homes-30670702/)

Photography: [29453302](https://www.pexels.com/photo/modern-luxury-villa-with-pool-in-sunlit-garden-29453302/), [8134746](https://www.pexels.com/photo/a-beautiful-house-with-swimming-pool-8134746/), [17174768](https://www.pexels.com/photo/stylish-modern-villa-17174768/), [7587880](https://www.pexels.com/photo/modern-house-exterior-7587880/), [1974596](https://www.pexels.com/photo/white-and-brown-house-1974596/), [19168388](https://www.pexels.com/photo/white-residential-house-19168388/)

## Production checklist

- Replace all fictional business, listing, pricing and statistical content.
- Use the client's own licensed photography and film. Stock imagery must not be presented as a real listing.
- Add brokerage license, fair housing, MLS/IDX and privacy disclosures, reviewed by the client.
- Connect and test the forms, CRM, analytics and call tracking.
- Update canonical, Open Graph and structured-data URLs for the client's domain.
- Test on real devices (iOS Safari, Android Chrome), with keyboard only, with a screen reader and with reduced motion enabled.
