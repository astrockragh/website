#!/usr/bin/env python3
"""
Fetch a run of ISS Crew Earth Observations frames from NASA's Gateway to
Astronaut Photography and prepare them as 1920x1080 video frames.

These are public-domain NASA originals. Prefer them over anyone's YouTube
timelapse edit of the same imagery: higher resolution, and unambiguously
free to use with credit.

    ./fetch_iss_frames.py ISS070 71955 72300 /tmp/iss070

Then assemble, letting minterpolate fill in between the stills:

    N=$(ls /tmp/iss070 | wc -l); RATE=$(python3 -c "print($N/40)")
    ffmpeg -framerate $RATE -i /tmp/iss070/f%04d.jpg \
      -vf "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir" \
      -an -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p out.mp4

Keep max_workers low: the server resets connections under heavy parallelism.
The script is idempotent, so just re-run it to fill any gaps.
"""
import concurrent.futures, io, os, sys, urllib.request
from PIL import Image

BASE = "https://eol.jsc.nasa.gov/DatabaseImages/ESC/large/{m}/{m}-E-{n}.JPG"

def main(mission, first, last, out, workers=4):
    os.makedirs(out, exist_ok=True)
    frames = list(range(int(first), int(last) + 1))

    def one(i_n):
        i, n = i_n
        dst = f"{out}/f{i:04d}.jpg"
        if os.path.exists(dst) and os.path.getsize(dst) > 50_000:
            return n, "cached"
        for attempt in range(3):
            try:
                url = BASE.format(m=mission, n=n)
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                data = urllib.request.urlopen(req, timeout=90).read()
                im = Image.open(io.BytesIO(data)).convert("RGB")
                w, h = im.size                       # 5568x3712 (3:2)
                th = int(w * 9 / 16)                 # 16:9 crop height
                top = (h - th) // 2 - 90             # bias up to place the limb well
                top = max(0, min(top, h - th))
                im.crop((0, top, w, top + th)).resize((1920, 1080), Image.LANCZOS).save(dst, quality=95)
                return n, "ok"
            except Exception as e:
                if attempt == 2:
                    return n, f"FAIL {e}"
        return n, "FAIL"

    fails = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as ex:
        for done, (n, status) in enumerate(ex.map(one, enumerate(frames)), 1):
            if status.startswith("FAIL"):
                fails.append((n, status))
            if done % 40 == 0:
                print(f"{done}/{len(frames)}", flush=True)
    print(f"COMPLETE {len(frames)} frames, {len(fails)} failures")
    for f in fails[:10]:
        print("  ", f)

if __name__ == "__main__":
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    main(*sys.argv[1:5])
