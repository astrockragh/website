# tools/

## retime_clip.sh

Cuts a segment and retimes it, synthesising intermediate frames with ffmpeg's
`minterpolate` so a stretched clip reads as smooth slow motion rather than
held frames.

```
./retime_clip.sh source.mp4 100 103 12 ../static/video/05-jwst
```

Built for the JWST reel slot: NASA Webb deployment sequence, 1:40–1:43,
stretched to 12 seconds.

**Get the source from NASA's Scientific Visualization Studio, not from
YouTube** — SVS publishes the public-domain master at higher quality than
YouTube's re-encode, and downloading from YouTube is against their terms.

Because the site delivers video through YouTube embeds, the retimed `.mp4`
then gets uploaded to Christian's channel, and its id goes into
`data/reel.yaml`. The `.webm` is only needed if the delivery decision ever
changes to self-hosting.
