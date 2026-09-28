# The Demo Collection

Independent niche demos, with everything specific to a niche kept in its own folder.

| Niche | Demo | Entry point |
| --- | --- | --- |
| Pakistani clothing / boutique | SŪRA Atelier | [clothing-boutique/index.html](clothing-boutique/index.html) |
| U.S. HVAC contractor | Summit Comfort | [hvac/index.html](hvac/index.html) |

Open the root `index.html` for the demo directory, or open either niche HTML entry point directly. No install or build step is required.

## Local preview

From the repository root:

```sh
python -m http.server 4173
```

Visit:

- `http://localhost:4173/` — demo directory
- `http://localhost:4173/clothing-boutique/` — boutique demo
- `http://localhost:4173/hvac/` — HVAC contractor demo

## Vercel

Import this repository into Vercel. Use **Other** as the framework preset, keep the repository root as the root directory, and leave the build command and output directory overrides disabled. This is a static HTML project.

- `/` — demo directory
- `/clothing-boutique/` — boutique demo
- `/hvac/` — HVAC contractor demo

The root `vercel.json` enables clean URLs and trailing slashes. See [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json).

Each niche is self-contained and works as a direct prospect URL. The HVAC demo keeps its pages, CSS, JavaScript, imagery, and documentation under `hvac/`.

## Adding a niche

Create a descriptive sibling folder (for example, `interior-design/`), put its pages and niche-specific documentation inside it, and add its link to the root directory page and the table above. Keep shared deployment settings at the root.

A production deployment should be verified at the root and every direct niche/deep-link route.
