# Niche website templates

One folder per industry, one sub-folder per site. Every site is plain HTML + CSS + JS with no build step: open `index.html` through any static server and it runs.

```
niches/
├── medical/
│   ├── dental/       Ivora Dental Studio     – 3D molar → implant exploded-view film
│   └── clinic/       Aldena Health           – 16k-particle film: DNA → heart → cell → clinic cross
└── restaurants-cafes/
    ├── restaurant/   Verdell Tasting Kitchen – 3D plating film: plate → sauce → scallops → garnish → top-down
    └── cafe/         Morrow Coffee Roasters  – 3D bean-to-cup film: green → roast → espresso → latte art
```

### Restaurant & café extras

- **Verdell**: tasting menu with a wine-pairing toggle (updates the price), à la carte tab, room floor plans, and a reservation flow (guests stepper, 21-day date strip with closed days, time slots, seating) that reads the booking back as you choose. Opening status in the nav uses the visitor's clock.
- **Morrow**: live brew readout during the film (bean temp, dose, yield, time), tabbed menu board where items add to an order bag, a brew-ratio calculator for 5 brewers, beans shop cards, a working stamp card, and open/closed status per café.
- To connect real ordering/booking: replace the `submit` / `bump()` handlers in `main.js` with the client's system (OpenTable, Resy, SevenRooms, Square, Toast, Shopify, or WhatsApp links).

## Stack (all loaded from jsDelivr, versions pinned)

| Library | Version | Used for |
|---|---|---|
| Tailwind CSS (browser build) | 4.3.3 | Utility classes in markup |
| Three.js | 0.186.1 | Procedural 3D scenes (no model files) |
| GSAP + ScrollTrigger | 3.15.0 | Scroll-scrubbed timelines, pinning |
| Lenis | 1.3.26 | Smooth scrolling |
| Motion (vanilla Framer Motion) | 13.4.6 | Reveals, staggers, springs, counters |

Framer Motion itself only works inside React. **Motion** is the same team's library for plain JavaScript (same animation engine, `animate()`, `inView()`, `stagger()`), so the sites get Framer-Motion-quality animation without React.

## Run locally

```bash
cd niches
python3 -m http.server 8080
# open http://localhost:8080/medical/dental/  and  /medical/clinic/
```

Opening `index.html` by double-click (file://) blocks ES modules, so the 3D scene won't load. Always use a server (VS Code Live Server works too).

## Customising for a client (about 30–60 minutes)

1. **Brand**: change the tokens at the top of `assets/css/styles.css` (colours + fonts). Every component reads from them.
2. **Copy**: all text is in `index.html`. Search for the demo brand name (Ivora / Aldena) and replace.
3. **Placeholders to replace before launch**: doctor portraits (initials blocks), reviews, prices, phone numbers, addresses, opening hours. The footer line "Demo brand…" should be removed once real content is in.
4. **Booking form**: currently shows a success message only. Point it at the client's system (Formspree, Calendly, a clinic PMS API, or WhatsApp) in `main.js` → the `submit` handler.
5. **3D colours**: materials live in `assets/js/scene.js` (dental: `enamel`, `titanium`, `anodised`; clinic: `uC0`–`uC4` uniforms).

## Production build (recommended before going live)

The Tailwind browser build compiles CSS in the visitor's browser. For a live client site, compile once instead:

```bash
npm i -D tailwindcss @tailwindcss/cli
npx @tailwindcss/cli -i ./input.css -o ./assets/css/tailwind.css --minify
```

`input.css` = `@import "tailwindcss";` plus the `@theme inline {…}` block from the `<head>`. Then swap the Tailwind `<script>` tag for a `<link>` to the compiled file.

## Performance & accessibility built in

- 3D pauses when off-screen; pixel ratio and particle count drop on phones and low-core devices.
- WebGL missing → static fallback, page still works.
- `prefers-reduced-motion` → no smooth scroll, no idle animation, content shown immediately.
- Skip link, visible focus rings, labelled form fields, `aria-live` results, semantic landmarks.
