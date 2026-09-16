#!/usr/bin/env bash
# Cut a segment from a source video and retime it, synthesising intermediate
# frames so the slow motion stays smooth.
#
#   ./retime_clip.sh source.mp4 100 103 20 ../media/out
#
# args: <source> <start_s> <end_s> <target_duration_s> <output_basename>
#
# Two things matter here, both learned the hard way:
#
#  1. setpts runs BEFORE minterpolate. Slow the clip first, then interpolate
#     across the stretched timeline, so every output frame is synthesised.
#     The other order gives you a handful of real frames and a pile of
#     duplicates, which judders.
#
#  2. Render in ONE pass. Splitting the work into parallel chunks leaves a
#     one-frame discontinuity at every boundary, because each chunk is
#     interpolated with no knowledge of its neighbours. It is slow; run it
#     in the background rather than splitting it.
#
# The source window is padded by 0.2s on each side and trimmed back afterwards,
# so the interpolator has real frames for context at both edges.
set -euo pipefail

SRC="$1"; START="$2"; END="$3"; TARGET="$4"; OUT="$5"
PAD=0.2
PTS=$(python3 -c "print($TARGET / ($END - $START))")
PSTART=$(python3 -c "print($START - $PAD)")
PEND=$(python3 -c "print($END + $PAD)")
TRIM=$(python3 -c "print($PAD * $PTS)")
TEND=$(python3 -c "print($PAD * $PTS + $TARGET)")

echo "$(python3 -c "print($END-$START)")s -> ${TARGET}s   (setpts ${PTS}x)"

ffmpeg -y -ss "$PSTART" -to "$PEND" -i "$SRC" \
  -vf "scale=1920:1080,setpts=${PTS}*PTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir,trim=start=${TRIM}:end=${TEND},setpts=PTS-STARTPTS" \
  -an -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p "${OUT}.mp4"

ffmpeg -y -ss $(python3 -c "print($TARGET/2)") -i "${OUT}.mp4" -frames:v 1 -vf "scale=1920:-2" -q:v 4 "${OUT}-poster.jpg"
ffprobe -v error -show_entries format=duration:stream=nb_frames -of default=nw=1 "${OUT}.mp4"
