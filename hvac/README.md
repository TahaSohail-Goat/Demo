# Summit Comfort Heating & Air

A static, prospect-ready U.S. HVAC contractor website demo. It shows how a modern local-service site can support calls, service requests, replacement estimates, maintenance-plan interest, financing inquiries, and service-area visibility.

All company information, testimonials, cities, availability, and offerings are fictional demo data. Replace and verify them before presenting a personalized version as a real company website.

## Direct URL architecture

- `/hvac/` — HVAC homepage
- `/hvac/services/` — all services
- `/hvac/ac-repair/`
- `/hvac/heating/`
- `/hvac/hvac-installation/`
- `/hvac/maintenance/`
- `/hvac/indoor-air-quality/`
- `/hvac/about/`
- `/hvac/service-area/`
- `/hvac/contact/`

The source uses relative `.html` links so it also works from disk. Vercel's root `cleanUrls` and `trailingSlash` settings expose clean production paths.

## Technology

- Semantic HTML5
- CSS with centralized custom properties
- Small, dependency-free JavaScript
- Original generated hero photography stored locally
- Inline SVG icon system
- No frameworks, package manager, build tools, CDNs, or runtime dependencies

## Structure

```text
hvac/
├── index.html
├── services.html
├── ac-repair.html
├── heating.html
├── hvac-installation.html
├── maintenance.html
├── indoor-air-quality.html
├── about.html
├── service-area.html
├── contact.html
├── css/
│   ├── style.css
│   └── responsive.css
├── js/main.js
├── assets/
│   ├── images/hvac-technician-hero.jpg
│   └── icons/
├── README.md
└── CUSTOMIZATION.md
```

## Preview locally

From the repository root:

```sh
python -m http.server 4173
```

Open `http://localhost:4173/hvac/` and directly test several deep links.

## Forms and integrations

The request form validates in the browser and displays a transparent demo message. It does not send or store information. Before launch, connect it to an approved CRM, email handler, or scheduling platform.

The static architecture leaves integration points for ServiceTitan, Housecall Pro, Jobber, email services, or a custom CRM. CTA `data-cta` attributes can support future Google Analytics or Google Tag Manager events. Phone links can be replaced with a verified call-tracking number.

## SEO foundation

Every page has a unique title, description, H1, Open Graph metadata, canonical placeholder, relevant internal links, and geographic/service copy. The homepage includes a syntactically valid `HVACBusiness` JSON-LD template without fabricated rating data.

Replace the placeholder domain, public business address, hours, service area, logo, social profiles, and all other structured-data values before production.

## Images

The hero image was generated specifically for this concept and optimized locally. Replace it with approved owner, team, truck, equipment, shop, and community photography for a real prospect. Keep explicit dimensions and optimized sizes/formats.

## Deployment assumptions

Deploy the repository root as one static Vercel project. Do not set `hvac/` as a separate project root if the collection launcher and boutique demo should remain available.

## Prospect workflow

Duplicate the self-contained `hvac/` folder, follow [CUSTOMIZATION.md](CUSTOMIZATION.md), search for `CUSTOMIZE:`, verify every factual claim, preview every page, and deploy under the intended route. No API keys are included or required.

## Production checklist

- Replace fictional business/contact/service-area information.
- Confirm licenses, insurance, certifications, schedules, emergency availability, financing, maintenance benefits, service capabilities, and policies.
- Replace demo testimonials with approved reviews and accurate sources.
- Add the final logo and real photography.
- Update canonical, Open Graph, schema, and favicon assets.
- Connect and test the request form, booking, analytics, CRM, and call tracking.
- Add legally reviewed privacy, terms, consent, and accessibility content.
- Test keyboard use, assistive technology, major browsers, real devices, form delivery, analytics, and direct clean URLs.
