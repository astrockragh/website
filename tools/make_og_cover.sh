#!/usr/bin/env bash
# Regenerate the link-preview image (static/img/og-cover.jpg).
#
# A still from the cosmic-web reel at t=10s -- the moment the density field has
# resolved into the halo graph. Earlier is empty, later it blurs back into a
# density field, so the graph window is narrow: check the frame if you retime
# the clip.
#
# 1200x630 is the Open Graph standard. The source is 1920x1080 (1.78), so the
# crop takes 1008 rows starting at y=72 -- measured to keep the whole box and
# its particles, which reach the bottom edge of the frame.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=static/video/01-cosmic-web.mp4
OUT=static/img/og-cover.jpg
AT=${1:-10.0}

ffmpeg -v error -ss "$AT" -i "$SRC" -frames:v 1 \
  -vf "crop=1920:1008:0:72,scale=1200:630:flags=lanczos" -q:v 2 "$OUT" -y

python3 - "$OUT" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1])
bb = im.convert("L").point(lambda p: 255 if p > 18 else 0).getbbox()
print(f"{sys.argv[1]}  {im.size}  content bbox {bb}")
assert im.size == (1200, 630), "wrong dimensions for og:image"
PY
