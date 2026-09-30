# Saksiri Riverside: clone with a scroll-scrubbed video hero

A rebuild of https://saksiri-riverside.vercel.app/ with the same sections, copy, photos and design tokens (charcoal / paper / stone / bronze, Cormorant Garamond + Archivo + Righteous). The hero photo reel is replaced by a **restaurant film that plays as you scroll**. Everything else keeps the original photos.

```
saksiri-riverside/
├── index.html
├── assets/css/styles.css   original stylesheet + an "ADDITIONS" block at the end (video hero, sticky scenes)
├── assets/js/script.js     all interactions (no build step)
├── assets/video/           put hero.mp4 here (see below)
└── get-media.sh            downloads photos + film and switches the page to local files
```

## Run

```bash
python3 -m http.server 8080     # then open http://localhost:8080
```

## The hero film

- The hero section is 400vh tall with a sticky 100vh frame. The first two thirds of the scroll move the video from its first frame to its last. The last third dims it while "About us" slides up over it, as on the original.
- Three chapter captions appear over the film: dining room → at the table → evening. The Arrive / Dining / Table / Evening tabs fill as you scroll, and clicking a tab jumps to that chapter.
- The video is downloaded into memory as a Blob, so seeking is instant on any host. If a host blocks that (no CORS), it streams instead.
- The page tries these sources in order:
  1. `assets/video/hero.mp4` (your own file)
  2. Pexels: "Cozy Modern Restaurant Interior at Night" by gusat silviu
  3. Pexels: "Elegant Chairs and Tables in Restaurant" by utopia 36
- Both clips are under the Pexels License: free for commercial use, attribution not required. A credit is in the footer anyway.
- If no video loads, the hero cross-fades the hotel's own photos (hero → buffet → garden dining → dinner at night) on scroll, so it never goes blank.

**Before launch, run `bash get-media.sh`.** The Pexels originals are 2560×1440 and heavy. The script re-encodes the clip to 1600px with a keyframe every 4 frames (smooth scrubbing, roughly 5–10 MB) and saves it as `assets/video/hero.mp4`. It also downloads the 16 photos and points the page at them. Manual version:

```bash
ffmpeg -i input.mp4 -vf scale=1600:-2 -c:v libx264 -crf 26 -g 4 -keyint_min 4 -sc_threshold 0 -an -movflags +faststart assets/video/hero.mp4
```

To use a different clip, drop any landscape MP4 in as `assets/video/hero.mp4` (re-encode it with the command above).

## Photos

All 16 images load from the original site (`/images/<key>.webp`): hero, gardens, terrace, balcony, bath1, bath2, aerial, mountains, gardenportrait, welcome, buffet, gardendine, dinnernight, r_superior, r_double, r_twin. `get-media.sh` copies them locally, which is the recommended step so the clone doesn't depend on the other deployment.

## Scroll scenes (same as the original)

| Section | Behaviour |
|---|---|
| Hero | scroll-scrubbed video, chapter captions, tabs, intro slides over it |
| River | framed photo opens to full bleed, then the copy rises |
| Rooms | pinned horizontal track on ≥1024px, with a counter and progress bar; stacked on smaller screens |
| Dining | layered photos drifting at different speeds |
| Visual tour | 5 stacked curtains wiping upward on ≥768px; a swipe strip on phones; click to open the 16-photo lightbox |
| Band | two lines of type sliding in opposite directions |
| Vang Vieng | parallax background |
| Experience | index list with a cursor-following preview image (desktop) |
| Reviews | 4.5 counts up |
| Final | framed → full screen, like River |
| Reserve | live price estimate (rooms, extra beds, nights), validation, confirmation (front-end demo) |

Reduced motion turns off smooth scroll, pinning and scrubbing, and shows the content statically.

Stack: HTML + CSS, Lenis 1.3.26 (smooth scroll), Motion 13.4.6 (vanilla Framer Motion: reveals, counter, springs), all from jsDelivr.
