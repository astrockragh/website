# media/

Source clips for the hero reel. These are **not** served by the site — the
reel delivers video through YouTube embeds. Each file here gets uploaded to
Christian's channel, and its video id goes into `data/reel.yaml`.

## 05-jwst-deployment-20s.mp4  ← current

The JWST slot. 100–103s of the SVS master, stretched 6.67× to exactly 20.0s.

- Source: [NASA SVS 14016 — Webb Telescope Nominal Deployment Sequence **with
  Graphics**](https://svs.gsfc.nasa.gov/14016),
  `WEBB_Mominal_Deployment_Sequence-graphics-4k_h264.mp4` (3840×2160, 30fps,
  **106.97s**)
- That is the exact master behind the public upload `RzGLKQ7_KZQ` (1:47), so
  timestamps map 1:1 — 1:40–1:43 there is 100–103s here, no offset.
- The window is clean: the "LAUNCH+ 29 days / orbital injection burn" graphic
  clears by 100s and the WEBB logo card does not begin until 104s. Just the
  deployed telescope drifting against a starfield.
- 1920×1080, **1200 frames, 20.0s**, 19 MB
- **Credit on upload:** NASA's Goddard Space Flight Center Conceptual Image Lab

### How it was made

Order of operations matters. `setpts` runs **before** `minterpolate`, so the
clip is slowed first and the interpolator then synthesises genuinely new
frames across the stretched timeline. The other way round you get 180 real
frames and 1000 duplicates, which judders.

```
scale=1920:1080,setpts=6.6667*PTS,minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1
```

Rendered in a **single pass**. An earlier attempt split the work into two
parallel halves to use both cores; that left a visible skip at exactly 10s,
because each half was interpolated with no knowledge of the other and the
boundary frame was mishandled. Measured, the seam frame had 12.9x the median
frame-to-frame difference; the single-pass render peaks at 2.6x, which is
just ordinary motion. It takes ~18 minutes — run it in the background rather
than splitting it.

The source window is padded 0.2s each side and trimmed back afterwards, so
the interpolator has real frames for context at both edges.

`tools/retime_clip.sh` reproduces this exactly if the segment ever needs to
change.

> SVS **20339** (`WEBB_Deployment_v2_30fps_4k_h264.mp4`) is a *different*,
> shorter cut — 90s, no graphics, telescope small against empty black. It is
> **not** the source of the public upload. Use 14016.

## _superseded/

`05-jwst-deployment-x4-12s.mp4` — the earlier 11.8s version, kept only for
reference. Safe to delete. (The chunked 20s render with the skip at 10s was
overwritten by the good one.)

## 02-ultramassive-20s.mp4  ← current

Slot 2, the ultramassive zoom tour. Christian's own render.

- Source: `content/projects/most-massive-environment/zoom_tour.mp4`
  (1920×1088, 20fps, 19s)
- Dropped the near-empty first ~2.8s, cropped the odd 1088 height to a clean
  1080, and interpolated to 60fps so the 20fps source does not judder behind
  hero text. The zoom was first slowed 1.5× to 24s, then tightened to **20.0s**
  — still slower than source, but with less dead air at the end.
- 1920×1080, 1200 frames at 60fps, **20.0s**, 2.3 MB
- Verified: worst frame-to-frame difference 2.6× median, no discontinuities.

### The M_max inset

`0_phimax.mp4` is composited into the lower right at **1/3 the frame height**
(360px, 975px wide), 48px from each edge. Both panels are kept: the stellar
mass function coloured by density percentile on the left, P(M_max | N_δ) on
the right.

It runs at **native speed for its first 10.0s**, then **holds its final frame**
for the remaining 10s. Only the zoom was sped up when the clip went from 24s to
20s — the inset keeps its true pacing, so the peak now lands exactly at the
halfway point. That 10.0s mark is the peak of the sweep — N_δ = 9989,
mean M_max = **10.80** — verified by reading the titles frame by frame:

```
 t= 9.0s   N_δ 5327   M_max 10.74
 t= 9.5s   N_δ 7554   M_max 10.77
 t=10.0s   N_δ 9989   M_max 10.80   <- peak, held from here
 t=10.5s   N_δ 7045   M_max 10.77   (sweep turns back down)
```

The source loops back down to N_δ = 1 after this, which would undo the story;
stopping at the peak means the posterior climbs and stays there while the zoom
settles on the ultramassive galaxy.

**Outstanding: the colormap is inverted.** The figure is rendered on white, so
it is passed through `negate,hue=h=180` to sit on the dark field — which also
flips the plasma colormap, so density percentile currently reads backwards.
The proper fix is re-rendering `0_phimax` with a dark matplotlib style
(`fig.patch.set_facecolor('#06070b')`, light text and tick colours, colormap
untouched). Christian has the script; agreed to leave the inversion in place
until then.

## Not yet made

- **Slot 1** — cosmic web → graph. Source `GNN_astro_review/animations/
  cosmic_web_to_graph.mp4`; Christian wants a mid-box rotation, not a
  fly-through.
- **Slot 3** — spectra fitting. Nothing exists yet; the molecular spectra
  binaries and the viewer widget are the raw material.
- **Slot 4** — airglow over Mauna Kea. Nothing exists yet.
- **Slot 6** — clustering. **Parked.** The existing two-point-correlation
  animation is not Christian's work: it carries a CAASTRO watermark and the
  filename matches the Wikimedia Commons file. It must not be uploaded to his
  channel or captioned as his. Needs an original render from the COSMOS /
  PANORAMIC clustering measurement, or the slot dropped.

## 01-cosmic-web-27s.mp4  ← current

Slot 1, cosmic web → graph. Christian's own render, used as-is per his
instruction; we may redo it later as a mid-box rotation.

- Source: `~/Princeton/thesis/GNN_astro_review/animations/cosmic_web_to_graph.mp4`
  (1920×1080, 30fps, 27s)
- Only change: cropped off the burned-in caption strip along the bottom
  ("Dark-matter density field · TNG100" / "Halo graph · M ≥ 10¹¹ M☉ …"), which
  sits in the same corner as the site's own hero caption. Re-framed to 16:9
  with a ~12% zoom. No retiming.
- 1920×1080, 810 frames, 27.0s

## 04-airglow-40s.mp4  ← current

Slot 4, airglow and aurora from orbit. **Assembled from the original NASA
frames**, not from anyone's YouTube edit.

- Source: [NASA Gateway to Astronaut Photography](https://eol.jsc.nasa.gov/),
  **ISS070-E-71956 through ISS070-E-72300** — 345 frames, 17 January 2024,
  Nikon D5, 24mm, from 407 km. Public domain.

  Christian's range began at 71955, but **that frame is dropped**: see
  "The one bad frame" below.
- Each frame fetched at its full 5568×3712, cropped 3:2 → 16:9 (y offset 200,
  biased up to place the limb well) and downscaled to 1920×1080. This is a
  true **downscale**, so it is much sharper than any 720p source.
- 345 frames at 8.625 fps in, interpolated to 30 fps out = **40.0s**.
- Credit burned in bottom-right, small and light grey:
  "NASA · ISS Expedition 70 · Crew Earth Observations · 17 Jan 2024"
- 1920×1080, 1200 frames, 19 MB (crf 23 — sized to fit the 20 MB transfer cap;
  YouTube re-encodes anyway).
- Verified: **no frame exceeds 3× the median** frame-to-frame difference
  anywhere in the clip; the worst is 2.6× at t=8.4s, which is ordinary
  content motion.

### The one bad frame

The first cut had a visible lurch in its opening tenth of a second. I first
blamed the encoder settling, then the interpolator priming — both wrong, and
adding lead-in frames changed nothing (the output was pixel-identical).

Measuring the *source* settled it. Across the 345 gaps between consecutive
frames, the median inter-frame difference is 0.86, and every gap sits between
0.90 and 1.14 — except one:

```
71955 -> 71956    7.70   (8.93x median)   <- outlier
71956 -> 71957    0.95   (1.11x median)
71957 -> 71958    0.90   (1.05x median)
...
```

Exactly one gap in the whole sequence exceeds 1.6× median. Looking at the
frames, 71955 has **different framing** — an extra structural element on the
right edge that is gone by 71956 — so the camera had not settled when it was
taken. Interpolating across a jump that large tore the solar array into
fragments, and no estimator setting fixes it (`vsbmc=1`, a wider
`search_param`, and `mi_mode=blend` were all tried; all mangled or ghosted it).

Dropping that single frame costs 0.116s of source time and makes every gap in
the sequence uniform. **Lesson: profile the source's inter-frame motion before
blaming the encoder.**

**Why this source.** Christian first pointed at a YouTube upload
(`tvMSorSqy64`, "ISS Timelapse - North America Aurora & Airglow (17 Jan 2024)"
by AstronautiCAST). That is a third party's edit of NASA imagery, so it is not
ours to re-upload — and it should not be pulled from YouTube. The frames above
are dated 17 Jan 2024 and are the primary source that edit was made from, so
we get the same sequence, at higher resolution, unambiguously public domain.

`tools/fetch_iss_frames.py` re-fetches the sequence if it is ever needed again.

## _alternatives/

`04-airglow-iss057-40s.mp4` — a second airglow option built from NASA's
ready-made ISS057 timelapse (aurora over North America, 2018-11). Only
1080×720 at source, so it had to be upscaled and is noticeably softer than the
ISS070 assembly. Kept in case the framing is preferred.

## 06-clustering-15s.mp4  ← current

Slot 6. **Not Christian's animation** — used with credit, at his instruction.

- Source: `content/projects/measuring-clustering-cosmic-variance/Two-point-correlation-function-astronomy_trimmed.mp4`, which is CAASTRO's explainer of the two-point correlation function, matching the Wikimedia Commons file `Two-point-correlation-function-astronomy.webm`.
- The clip already carries a CAASTRO logo bottom-right. A text credit —
  "Animation by CAASTRO · via Wikimedia Commons" — is burned in **top-left**,
  where the frame is empty star field, so it collides with neither the logo nor
  the site's own hero caption bottom-left.
- The reel caption names what is on screen and links to Christian's clustering
  project, rather than presenting the animation as his.
- The project page now carries the same attribution (it had none before).
- 1920×1080, 395 frames, **15.8s**, 525 KB. No retiming — the source is a
  25fps synthetic animation and looks correct at its native rate.

**Licence confirmed (Christian checked the Commons file page):** a full public
domain dedication — "The copyright holder of this image hereby irrevocably
releases all rights to it, allowing it to be freely reproduced, distributed,
transmitted, used, modified, built upon, or otherwise exploited in any way by
anyone for any purpose, commercial or non-commercial." That is CC0-equivalent.

So there is **no share-alike obligation and no legal requirement to attribute**,
and no restriction on commercial use or modification. The credit stays anyway,
by choice: it is the academic norm, and it keeps the reel honest about which
clips are Christian's own work and which are not.

> Watch the colons. `drawtext` uses `:` to separate filter options, so a credit
> written "Animation: CAASTRO" silently truncates to "Animation". Escape it or
> avoid it — the first render of this clip lost its whole credit that way.
