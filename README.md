# The Demo Collection

Independent niche demos, with everything specific to a niche kept in its own folder.

| Niche | Demo | Entry point | Live URL |
| --- | --- | --- | --- |
| — | Demo directory | [index.html](index.html) | https://webdemos.app/ |
| Pakistani clothing / boutique | SŪRA Atelier | [clothing-boutique/index.html](clothing-boutique/index.html) | https://boutique.webdemos.app/ |
| U.S. HVAC contractor | Summit Comfort | [hvac/index.html](hvac/index.html) | https://hvac.webdemos.app/ |
| Luxury real estate agency | Calder Hale | [real-estate/index.html](real-estate/index.html) | https://realestate.webdemos.app/ |

Open the root `index.html` for the demo directory, or open any niche HTML entry point directly. No install or build step is required to preview or deploy. The real estate demo commits its compiled Tailwind CSS and bundled JavaScript; its sources and build command are in [real-estate/README.md](real-estate/README.md). Its 3D section needs a local server, and shows a photograph instead when opened from disk.

## Local preview

From the repository root:

```sh
python -m http.server 4173
```

Visit:

- `http://localhost:4173/` — demo directory
- `http://localhost:4173/clothing-boutique/` — boutique demo
- `http://localhost:4173/hvac/` — HVAC contractor demo
- `http://localhost:4173/real-estate/` — real estate agency demo

## Vercel

This repository is deployed as one Vercel project per folder, all connected to the same GitHub repository. Every project uses **Other** as the framework preset with build command and output directory overrides disabled.

| Vercel project | Root Directory | Domain |
| --- | --- | --- |
| Demo directory | `./` (repository root) | `webdemos.app`, `www.webdemos.app` |
| Boutique | `clothing-boutique` | `boutique.webdemos.app` |
| HVAC | `hvac` | `hvac.webdemos.app` |
| Real estate | `real-estate` | `realestate.webdemos.app` |

Each folder has its own `vercel.json`, which Vercel reads from the project's Root Directory. The demo folders use clean URLs without trailing slashes so relative stylesheet, script, and image paths resolve from every page. The root `vercel.json` redirects the `/hvac/…`, `/clothing-boutique/…` and `/real-estate/…` folder paths to the matching subdomain. See [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json).

Each niche is self-contained and works as a direct prospect URL.

## Adding a niche

1. Create a descriptive sibling folder (for example, `interior-design/`) with its pages, niche-specific documentation, and a copy of `hvac/vercel.json`.
2. Add a Vercel project from this repository with that folder as its Root Directory, and add the `<niche>.webdemos.app` domain to it.
3. Link the subdomain from the root directory page, add a redirect for the folder path in the root `vercel.json`, and add a row to the tables above.

A production deployment should be verified at the root, every subdomain, and every deep-link route.
