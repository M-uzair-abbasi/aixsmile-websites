# Bleaching Aachen 2 · AIXSMILE

A second, competing bleaching landing page (the first is `../bleaching-webpage/`).
Built 2026-10-22 after **landonorris.com** (Awwwards Site of the Year 2025) and the
implant page's scroll scenes. Same facts and copy as bleaching 1, a new look and motion.

## The idea
The page whitens. A smiling man with yellowish teeth sits in the hero (since
2026-10-23; the client found the 3D dentition fake). Scrolling zooms in to his mouth
and plays the treatment on his teeth (measure with a shade tab → blue gum barrier →
gel → the lamp, the teeth lighten under the gel → measure again), then zooms out to
his white smile, while a giant outlined shade code counts A3.5 → BL4 and at the end
the whole screen turns white.

## Look
Ink `#0b1210`, bleach white `#f7f8f4`, paper `#eef1ec`, one neon mint `#8ff5c8`
(text on light uses `#0b6a49`). Mona Sans (variable, OFL, self-hosted), giant words in
its 125 % width.

## Sections
1. Opening (once per visit): dark field, wordmark, a tooth draws itself and turns white from the gum line up while the 3D loads (code under it A3.5 → BL4), shine + sparkles, then the field lifts with a mint edge. After bleaching 1's first splash.
2. Hero + treatment (`#top`, pinned 560svh): the man cut out of his photo's backdrop, no
   frame: he stands up from the bottom of the screen on the page itself, the zoom fades out
   toward the words (`assets/photos/face/`), next free slot plate, step caption, shade chip, step rail
   (click = scroll to that step), page turns white at the end. The layers over his mouth
   are cut from the same photo, so they sit exactly on his teeth; the zoom keys and the
   layer timing are `ZOOM_KEYS`/`paintFace` in site.js, driven by `sampleBleach`.
3. `#laecheln` "Heller lachen." (added 2026-10-23 after the client asked for a more beautiful page
   with people who have perfect smiles): five AI beauty portraits (`look-1…5.webp`, Higgsfield
   soul_2) lie in a stack and are dealt across the screen while you scroll (pinned 290svh,
   `--e`); on phones the top portrait slides away and the next face shows (`--o`).
   `--e`); on phones the top portrait slides away and the next face shows (`--o`).
5. `#flecken`: the six stains as a loose collage on a sideways track (pinned). Each picture
   has its own size, shape and height, and drifts up or down at its own depth; its few words
   sit on the open side (picture high: words under it; picture low: words above it).
   Sizes and positions are the `.stain--a` … `--f` rules in site.css.
   Photos 01, 03, 04 and 05 are the client's own pictures (2026-10-23, from 1/3/4/5.jpeg,
   4.jpeg trimmed of a white frame) in `assets/photos/stains/`; 02 and 06 are still the AI
   close-ups in `assets/photos/ai/`. Crops are the `--so` values on the same rules.
6. `#wege`: In der Praxis / Zu Hause / Kombiniert as giant words; tap opens; with a mouse
   a photo follows the pointer (Lando's ON TRACK / OFF TRACK).
7. `#heller`: "Heller, aber [photo] nicht künstlich weiß." words light up, the photo grows to
   full screen, then "Lachen, ohne die Hand vor dem Mund." and the booking button come up
   on it. The photo is used once (2026-10-22: it used to repeat as a separate band).
8. `#faelle`: the two real cases as compare sliders (mouse follows, drag, keyboard).
9. `#messen`: tap a sample tooth, the code shows big.
10. `#kosten`: mint panel opening from rounded corners, the cost plan sheet.
11. Doctor, booking (`SERVICE 'bleaching'`, `VIA 'bleaching-aachen'`),
    FAQ by topic, practice + map, footer with the address and the rising wordmark.

Reduced motion / no JS: no pinning, a still hero picture, the five steps as a list.

## Files
- `index.html`: German copy (crawlers, no-JS), structured data from bleaching 1.
- `css/site.css`: all styles; scroll scenes under `html.scenes`.
- `js/site.js`: opening, the hero photo's treatment (`paintFace`), scene engine (from the
  implant page), interactions.
- `js/i18n.js`: English + runtime strings; `js/booking.js`: the implant page's widget.
- `tools/make-face-layers.py` + `tools/face-source.webp` (the untouched AI photo, his teeth
  white): builds `assets/photos/face/` (the man cut out of the backdrop with yellow teeth,
  the white-teeth, barrier and gel layers, the five step stills). Run `python3
  tools/make-face-layers.py tools/face-source.webp` (OpenCV + NumPy) and look at
  `tools/face-check.jpg` (teeth) and `tools/face-cut-check.jpg` (the cut-out on ink and white).
- No longer used since the photo hero (kept for a way back): `js/teeth-stage.js` (the 3D
  bundle), `js/src/`, `tools/build-3d.mjs`, `assets/models/dentition.glb`,
  `assets/treatment/step-*.webp`.
- `js/bleach-timeline.js`: the treatment as numbers (copied from bleaching 1).
- `assets/`: copied from bleaching 1 (model, stills, photos, cases, doctor, map) + Mona Sans.
- `impressum/`, `datenschutz/`: from the implant page, reworded for bleaching.

## Before going live
- `vercel.json` sends `noindex` (this is the competitor version; canonical points at
  bleaching-aachen.de, the same domain as bleaching 1). Remove it only for the winner.
- Booking uses the same `via` slug as bleaching 1; the main app must allow the origin.
- Sign-offs carried over from bleaching 1: the doctor's quote, the 2× / 1–3 facts,
  the 3D captions, „Kombiniert“. New lines to approve: hero lead, „Wo Ihre Zähne
  stehen, sehen wir bei der Untersuchung.“, the marquee lines, the ways hint.
