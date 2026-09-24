#!/usr/bin/env python3
"""Turn the supplied AI images into the web files the page loads.

Drop the originals (any of .jpg .jpeg .png .webp) into
assets/photos/ai/incoming/ named as in the image brief, e.g.
incoming/hero-wide.png, then run:

    python3 tools/prepare_images.py            # the real images
    python3 tools/prepare_images.py --placeholders   # (re)draw the placeholders

Each image is centre-cropped to its shape, resized and saved as WebP next to
incoming/. Originals in incoming/ are never changed. Placeholders are marked
in tools/placeholders.json so tools/check-images.mjs can tell them apart.
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
AI = ROOT / 'assets' / 'photos' / 'ai'
INCOMING = AI / 'incoming'
MANIFEST = ROOT / 'tools' / 'placeholders.json'

# name: (width, height, quality, tone, what it shows)
SPECS = {
    'hero':        (1000, 1250, 78, 'dark',  'Shade tab held next to the front teeth'),
    'smile':       (900, 1125, 76, 'light',  'Person laughing, natural teeth'),
    'gel':         (900, 1125, 76, 'dark',   'Whitening gel applied, gums covered'),
    'in-office':   (900, 1125, 76, 'light',  'Patient in the chair, whitening light'),
    'at-home':     (900, 1125, 76, 'light',  'Hand holding clear whitening trays'),
    # "Wann Bleaching hilft": one illustration per kind of discolouration (landscape 4:3)
    'stain-coffee':       (1000, 750, 76, 'light', 'Yellowish teeth from coffee and tea'),
    'stain-age':          (1000, 750, 76, 'light', 'Teeth darkened with age'),
    'stain-smoking':      (1000, 750, 76, 'light', 'Brownish smoking stains'),
    'stain-grey':         (1000, 750, 76, 'light', 'Greyish, banded discolouration'),
    'stain-single':       (1000, 750, 76, 'light', 'One front tooth darker than the rest'),
    'stain-restorations': (1000, 750, 76, 'light', 'A crown or filling in a different shade'),
    # the one labelled AI shade comparison (user's decision 2026-09-24), a wide strip of three panels
    'shade-steps':        (1500, 625, 76, 'light', 'Same smile at three shade steps (illustration)'),
}
# where to centre a crop vertically, for slots whose subject is not in the middle
CENTRE_Y = {
    'shade-steps': 0.34,   # the three mouths sit in the upper half of ChatGPT's 3:2 frame
}
# extra images the user supplied beyond the brief: (width, height, quality, vertical centre of the crop)
EXTRAS = {
    'shade-fan':   (1200, 800, 76, 0.62),   # the shade-guide fan, cropped wide for the steps section
}

def fit(im, w, h, cy=0.5):
    im = ImageOps.exif_transpose(im).convert('RGB')
    return ImageOps.fit(im, (w, h), Image.LANCZOS, centering=(0.5, cy))

def prepare():
    done = []
    for name, (w, h, q, _, _) in SPECS.items():
        src = next((p for p in INCOMING.glob(name + '.*') if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')), None)
        if not src:
            print(f'  -   {name}: nothing in incoming/, placeholder stays')
            continue
        im = Image.open(src)
        if im.width < w * 0.75 or im.height < h * 0.75:
            print(f'  !   {name}: {im.width}x{im.height} is small for {w}x{h}; used anyway')
        out = AI / f'{name}.webp'
        fit(im, w, h, CENTRE_Y.get(name, 0.5)).save(out, 'WEBP', quality=q, method=6)
        done.append(name)
        print(f'  ok  {name}: {src.name} -> {out.name} {w}x{h}, {out.stat().st_size // 1024} KB')
    for name, (w, h, q, cy) in EXTRAS.items():
        src = next((p for p in INCOMING.glob(name + '.*') if p.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp')), None)
        if not src:
            continue
        out = AI / f'{name}.webp'
        fit(Image.open(src), w, h, cy).save(out, 'WEBP', quality=q, method=6)
        done.append(name)
        print(f'  ok  {name}: {src.name} -> {out.name} {w}x{h}, {out.stat().st_size // 1024} KB')
    return done

def placeholders():
    font_b = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
    old = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    hashes = {}
    for name, (w, h, q, tone, what) in SPECS.items():
        out = AI / f'{name}.webp'
        if out.exists() and hashlib.sha256(out.read_bytes()).hexdigest() != old.get(out.name):
            print(f'  keep {out.name}: a real image, not replaced')
            hashes[out.name] = old.get(out.name, 'real-image')   # stays listed; any other hash reads as real
            continue
        bg, fg = ((34, 31, 38), (150, 138, 118)) if tone == 'dark' else ((228, 221, 208), (128, 112, 84))
        im = Image.new('RGB', (w, h), bg)
        d = ImageDraw.Draw(im)
        lines = [('Bild folgt', font_b), (name, font), (what, font)]
        heights = [44, 36, 36]
        y = (h - sum(heights)) // 2
        for (text, f), lh in zip(lines, heights):
            tw = d.textlength(text, font=f)
            d.text(((w - tw) / 2, y), text, font=f, fill=fg)
            y += lh
        out = AI / f'{name}.webp'
        im.save(out, 'WEBP', quality=70, method=6)
        hashes[f'{name}.webp'] = hashlib.sha256(out.read_bytes()).hexdigest()
        print(f'  ph  {out.name} {w}x{h}, {out.stat().st_size // 1024} KB')
    MANIFEST.write_text(json.dumps(hashes, indent=2) + '\n')

if __name__ == '__main__':
    AI.mkdir(parents=True, exist_ok=True)
    INCOMING.mkdir(exist_ok=True)
    placeholders() if '--placeholders' in sys.argv else prepare()
