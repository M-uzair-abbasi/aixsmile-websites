# Bleaching Aachen 2 · AIXSMILE

A second, competing bleaching landing page (the first is `../bleaching-webpage/`).
Built 2026-10-22 after **landonorris.com** (Awwwards Site of the Year 2025) and the
implant page's scroll scenes. Same facts and copy as bleaching 1, a new look and motion.

## The idea
The page whitens. The real 3D dentition (the veneer page's model with bleaching 1's
rig) sits in the hero like Lando's helmet and turns towards the mouse. Scrolling plays
the treatment on it (measure → protect the gums → gel → let it work → measure again)
while a giant outlined shade code behind the teeth counts A3.5 → BL4, and at the end
the whole screen turns white.

## Look
Ink `#0b1210`, bleach white `#f7f8f4`, paper `#eef1ec`, one neon mint `#8ff5c8`
(text on light uses `#0b6a49`). Mona Sans (variable, OFL, self-hosted), giant words in
its 125 % width.

## Sections
1. Opening (once per visit): mint field, wordmark, shade bar A3.5 → BL4 while the 3D loads.
2. Hero + treatment (`#top`, pinned 560svh): 3D teeth, next free slot plate, step caption,
   shade chip, step rail (click = scroll to that step), page turns white at the end.
3. Two giant lines sliding sideways (causes / shade codes).
4. `#flecken`: the six stains as a loose collage on a sideways track (pinned). Each picture
   has its own size, shape and height, and drifts up or down at its own depth; its few words
   sit on the open side (picture high: words under it; picture low: words above it).
   Sizes and positions are the `.stain--a` … `--f` rules in site.css.
5. `#wege`: In der Praxis / Zu Hause / Kombiniert as giant words; tap opens; with a mouse
   a photo follows the pointer (Lando's ON TRACK / OFF TRACK).
6. `#heller`: "Heller, aber [photo] nicht künstlich weiß." words light up, the photo grows to
   full screen, then "Lachen, ohne die Hand vor dem Mund." and the booking button come up
   on it. The photo is used once (2026-10-22: it used to repeat as a separate band).
7. `#faelle`: the two real cases as compare sliders (mouse follows, drag, keyboard).
8. `#messen`: tap a sample tooth, the code shows big.
9. `#kosten`: mint panel opening from rounded corners, the cost plan sheet.
10. Doctor, booking (`SERVICE 'bleaching'`, `VIA 'bleaching-aachen'`), FAQ by topic,
    practice + map, footer with a running line and the rising wordmark.

Reduced motion / no JS: no pinning, a still hero picture, the five steps as a list.

## Files
- `index.html`: German copy (crawlers, no-JS), structured data from bleaching 1.
- `css/site.css`: all styles; scroll scenes under `html.scenes`.
- `js/site.js`: opening, 3D drive, scene engine (from the implant page), interactions.
- `js/i18n.js`: English + runtime strings; `js/booking.js`: the implant page's widget.
- `js/teeth-stage.js`: **built** bundle (three.js r184 + rig). Source in `js/src/`;
  rebuild with `node tools/build-3d.mjs` (borrows esbuild/three from `~/aixsmile`).
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
