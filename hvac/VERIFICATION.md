# Verification

Checked locally in Chromium on 29 September 2026.

- Exact responsive viewport checks at 320, 375, 390, 430, 768, 1024, 1280, and 1440 pixels reported no horizontal overflow.
- Desktop and exact 390-pixel mobile screenshots were visually reviewed.
- Root collection directory, existing boutique, direct HVAC homepage, and HVAC AC repair, heating, maintenance, and contact deep links loaded with correct titles/H1s and no broken images.
- Mobile menu opens, updates `aria-expanded`, closes, and returns the page to its normal state.
- FAQ accordion opens and exposes its associated answer.
- Request form validates and shows the explicit static-demo success state without transmitting data.
- Mobile call/request bar appears below 700 pixels and is absent at larger widths.
- Desktop navigation appears above 900 pixels; the hamburger replaces it below that breakpoint.
- All ten HVAC pages contain one H1, a unique title and description, canonical placeholder, and Open Graph metadata.
- Relative page, stylesheet, script, and image references resolve locally.
- No JavaScript console errors remained in the final route and interaction pass.
- The existing boutique mobile render and direct route remain intact.

Automated checks and screenshots do not replace a full manual accessibility audit, real-device testing, production form-delivery testing, or final tests with a client’s real content.
