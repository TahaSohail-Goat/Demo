#!/usr/bin/env bash
# Downloads the hotel photos + the hero film so the site runs fully self-hosted.
# Needs: curl, ffmpeg.   Run from this folder:  bash get-media.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p assets/images assets/video

SRC="https://saksiri-riverside.vercel.app/images"
for k in hero gardens terrace balcony bath1 bath2 aerial mountains gardenportrait welcome buffet gardendine dinnernight r_superior r_double r_twin; do
  echo "photo  $k"
  curl -fsSL "$SRC/$k.webp" -o "assets/images/$k.webp"
done

echo "video  (Pexels: Cozy Modern Restaurant Interior at Night)"
curl -fsSL "https://videos.pexels.com/video-files/31631562/13476221_2560_1440_25fps.mp4" -o assets/video/source.mp4

# Re-encode for scroll-scrubbing: 1600px wide, a keyframe every 4 frames, no audio, fast start.
# Frequent keyframes are what make seeking (scrubbing) smooth instead of jumpy.
ffmpeg -y -loglevel error -i assets/video/source.mp4 \
  -vf "scale=1600:-2" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -g 4 -keyint_min 4 -sc_threshold 0 -an -movflags +faststart assets/video/hero.mp4
rm assets/video/source.mp4

# Point the page at the local photos.
sed -i.bak "s#https://saksiri-riverside.vercel.app/images/#assets/images/#g" index.html assets/js/script.js
rm -f index.html.bak assets/js/script.js.bak
echo "Done. assets/video/hero.mp4 is used first automatically."
