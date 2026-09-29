# Verification

Checked locally on 30 September 2026 in headless Chrome (SwiftShader WebGL), served from the repository root with `python -m http.server`.

- Homepage, listings and property pages at 1440×900 and 390×844, plus the 3D section at 820×1180, reported no horizontal overflow and no JavaScript errors or warnings.
- Scroll-scrubbed hero: frames change with scroll position, the three chapters ("Homes that stay with you", "Arrive.", "Step inside.") appear in turn, and the portrait frame set is used on phones. The source letterboxing is cropped out.
- Featured rail pins and scrolls horizontally on desktop and swipes natively on mobile.
- Linea Residences 3D scene loads on approach, orbits and separates its floors with scroll, and highlights the active level group on desktop, tablet and phone.
- Expanding film frame, word-by-word statement, counters, seller timeline and neighborhood list rendered as intended.
- Listings: URL parameters from the homepage search pre-fill the filters (for example `?status=sale&area=Malibu` shows one residence), and changing filters re-renders and updates the URL.
- Property page renders every field for `?id=villa-serein`, the gallery lightbox opens, and an unknown id shows the "Residence not found" state.
- `prefers-reduced-motion: reduce` gives a static 100vh hero, no smooth scrolling or scroll-linked effects, and the 3D building shown in a single still state.
- The demo directory at the repository root shows the new Calder Hale card.

Not yet verified: real iOS Safari and Android devices, GPU-accelerated WebGL performance on low-end phones, screen-reader passes, form delivery (forms are demo-only), and the production Vercel deployment at `realestate.webdemos.app`.
