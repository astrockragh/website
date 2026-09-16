# astrockragh.github.io

New personal site. Hugo, custom theme, no HugoBlox.

## Running it

```sh
brew install hugo          # extended by default
cd ~/Toronto/website
hugo server                # http://localhost:1313
```

**Hugo 0.146 or newer, extended.** Two hard requirements:

- **extended** — the theme compiles SCSS (`assets/scss/main.scss`) via `toCSS`.
- **0.146+** — the site uses the modern template layout: `layouts/baseof.html`,
  `layouts/_partials/`, `layouts/_shortcodes/`.

An older Hugo fails on both, with errors that do not obviously say so.

```sh
hugo version     # expect v0.146+ ... +extended
which -a hugo    # a stale 0.95 earlier on PATH is the usual culprit
```

If an old Hugo shadows the new one, call Homebrew's directly:
`/opt/homebrew/bin/hugo server` (Apple Silicon) or `/usr/local/bin/hugo server` (Intel).

`package.json` pins `hugo-extended` as an alternative for machines that have
Node. It is not required — Homebrew is simpler.

## Building and deploying

```sh
hugo --minify              # writes public/
```

Deployment is **not wired yet**. The old site pushed `public/` as a git
submodule to the `astrockragh.github.io` repo; this one needs the same setup
before anything goes live.

## Checking it

```sh
tests/build_check.sh           # toolchain, build, front matter, links
tests/build_check.sh --media   # also decode every video end to end
```

Exit 0 is clean; exit 1 means something is broken. It builds into a temp
directory, never `public/`, so a failing run cannot leave a half-built site
where a deploy would find it.

The build is the easy half. Hugo is forgiving in exactly the places that hurt:
`site.GetPage` on a project slug that no longer exists returns nothing and the
related-work partial renders nothing, a `figure` pointing at a missing resource
falls through to a raw `<img>` with a dead `src`, and a link to a renamed page
is just a 404 nobody clicks until someone does. None of that fails a build, so
the checks also walk every internal link, page-bundle resource, `projects:`
slug, menu URL and entry in `data/`, and resolve each one against what Hugo
actually wrote.

Warnings never fail the run — `draft: true` and a stale `image:` in a section
whose templates ignore it are worth seeing, not worth blocking on.

The content still carries the HugoBlox URL scheme in places: `/project/some_slug`
with a singular section and underscores, where this site serves
`/projects/some-slug`. Those show up as dead links and are real — every one of
them is a broken image or link on the live page.

## Layout

```
content/     talks/ projects/ publications/ blog/ outreach/ work-with-me/
layouts/     baseof, home, page, list + per-section, _partials/, _shortcodes/
assets/scss/ main.scss — the whole design system, tokens at the top
assets/js/   reel.js (hero), site.js (header, nav, reveals, talk filters)
data/        reel.yaml — the hero clips; highlights.yaml — landing cards
static/      img/reel/ posters, widgets/, data/, uploads/CV.pdf
media/       source clips uploaded to YouTube — not served by the site
tools/       migrate.py, retime_clip.sh, fetch_iss_frames.py
```

## The hero reel

`data/reel.yaml` drives it. Each clip carries a `src`, a caption, a link to its
project, a poster still, and `duration_ms` — how long it holds the screen.

Video is **self-hosted** from `static/video/` (~21 MB for five clips), not
embedded from YouTube. That was a deliberate reversal after trying YouTube
first, and the reasons are worth keeping:

- **YouTube paints its own chrome.** A centred pause glyph appears whenever the
  player is not actively playing, inside a cross-origin iframe that CSS cannot
  reach. `controls=0` does not remove it.
- **YouTube picks the rendition, not you.** Measured on the real page: the
  visible player pinned to `medium` with `hd1080` sitting in its available
  list, because both players were streaming and its ABR split the bandwidth.
- Self-hosting also returns privacy (no YouTube cookies), gives seamless native
  looping, and halves the reel code.

The YouTube uploads still exist on Christian's channel and are fine as public
copies — they are simply not what the site plays.

### How it works

Two `<video>` elements alternate. The incoming one starts playing off-screen
and only fades up once it is genuinely producing frames (`playing`, plus a
`currentTime > 0.05` check, because `playing` alone can fire on a stalled
element). The outgoing one is paused 1.8s later, so **only one clip decodes at
a time** — that is what keeps quality up. Poster stills sit underneath, so
there is never a black flash.

On mobile and under `prefers-reduced-motion` the video is skipped entirely and
the posters cross-fade instead, captions and links intact.

### If the hero looks static

Open the console. The reel logs which path it took on boot:

```
[reel] clips: 5 | reduced-motion: false | small screen: false | video mode
[reel] clip 1 playing
```

- **"POSTER MODE"** — working as designed: macOS *Reduce motion* is on, or the
  window is under 760px.
- **"autoplay blocked: NotAllowedError"** — a browser refused muted autoplay.
  The posters stay up, which is the intended graceful failure.
- **Playing but nothing visible** — check stacking. The posters and the player
  stage are both absolutely positioned inside `.hero__media` and the posters
  come later in the DOM, so at equal `z-index` they paint on top and hide the
  video. The stage is pinned to `z-index: 1` and the posters to `0`. This cost
  four rounds of debugging once; do not remove those.

Lesson from that hunt: when the code says it is playing and the screen
disagrees, render the page and ask what pixel is on top, rather than re-reading
the JS.

### Re-encoding the clips

Masters live in `media/` at upload bitrate. The web set is derived:

```sh
ffmpeg -i media/CLIP.mp4 -an -c:v libx264 -preset slow -crf 26 \
       -pix_fmt yuv420p -movflags +faststart static/video/CLIP.mp4
```

crf 26 is generous for dark, low-motion footage sitting behind a scrim. The
cosmic-web (13 MB) and airglow (8 MB) clips are the heavy ones — dense
particles and a full starfield respectively, both genuinely hard to compress.
crf 28 roughly halves either if repo weight ever matters.

**Always verify the encode, never trust that the file exists.** A background
encode once died mid-clip and left a truncated `04-airglow.mp4`; a later
"finish what's missing" pass checked for the file's presence, saw it, and
skipped it — so a corrupt file shipped and that clip silently failed to render.
`ffprobe` reported `moov atom not found`. Decode every file through to the end
after re-encoding:

```sh
cd static/video
for f in *.mp4; do
  ffmpeg -v error -i "$f" -f null - 2>&1 | head -1 | grep -q . \
    && echo "BROKEN $f" || echo "ok $f"
done
```
