# Aligner Aachen · AIXSMILE

The fourth satellite page: clear aligners. Built 2026-10-24 after **igloo.inc**
(Awwwards Site of the Year 2024), which the user picked after rejecting the
aligner brands' own sites as not "wow". The igloo-style 3D glass teeth were replaced on
2026-11-02 by the journey on her photo (below); the HUD, captions, rail and opening stay.

## The idea
The page is one aligner treatment, told on one woman's photo, step by step as the 3D version had it
(since 2026-11-02; the user: "a woman smiling in front and her teeth are not aligned, and as we scroll
all the operations that were on the 3D model happen on her teeth"). **Hero:** she smiles; her teeth are
crooked and crowded. Scrolling moves the view in to her mouth (a breath of fog between chapters):

0. **Die Ausgangslage**: close up, small monospace labels on four crooked teeth (12, 22, 23, 41).
1. **Der Scan**: the photo dims, a scan line crosses her teeth and leaves them as an ice-blue dot
   cloud with a wireframe.
2. **Der Plan**: every tooth moves into place (the frames glide, they do not cross-fade); the labels
   count down to "gerade", the corner counter runs Schiene 01 → 24.
3. **Die Schienen** (the longest chapter): her bite opens; the upper aligner (pale clear plastic with
   slate edges) comes in from the front, waits just under her upper teeth, is pushed on and clicks
   (an ice-blue flash with a flick of rainbow), and the photo of it in place takes over; then the lower
   one the same way. Tags follow each aligner ("Oben / Unten · Schiene wird eingesetzt → Schiene
   sitzt"). The bite closes and a glint runs over the aligners.
4. **Das Ergebnis**: white fog, then her straight smile with her aligner in her hand (a photo of its
   own, swapped in behind the fog), the last line and the booking button.

How: AI photos of the same woman, identical outside the mouth/jaw (tools/ai-src/face-A crooked,
-E straight, -Eo straight with the bite open, -EoT open with both aligners, -D closed with aligners,
-hand straight, holding an aligner: the end and the reduced-motion result picture).
`tools/make-face-layers.py` cools the studio backdrop to the stage's lilac-grey and writes
`assets/photos/face/`: the photo, the plan's 7 mouth frames (optical-flow morphs), the aligners' 9 jaw
frames (bite opening, upper on, both on, bite closing; the jaw morphs are seeded with the jaw's own
drop), the two aligners on their own (cut from the difference the real ones make), and the scan's
points/wireframe and the glint mask. `js/site.js` moves and zooms the photo (its `FACE` numbers are
what the script prints), blends neighbouring frames and moves the two aligners; `js/clear-timeline.js`
holds the 3D version's timings.

After the journey (sections and motion after bleaching-2 and the implant page, 2026-10-24):
- **Welche Situation kennen Sie?** (`#situation`): five photo cards (the implant page's situation
  cards): crowded, gaps, bite, shifted after braces, no fixed braces wanted. A tap (or pointing with a
  mouse) opens what aligners do there; the card's link puts the concern into the booking note.
- **"Im Gespräch [photo] fällt die Schiene kaum auf."** (`#kaum`): the words light up, the photo
  grows from its box to the whole screen, then the line and the booking button (the implant
  page's box).
- **Und im Alltag?** (`#alltag`): six everyday questions as giant words that open (bleaching-2's
  ways): Essen, Trinken, Sprechen, Sport, Drückt es, Pflege; each with a photo and a short answer, and
  with a mouse a photo follows the pointer. The words slide in from alternate sides.
- "22 hours a day" as a ring (out 40 minutes for each meal), then a marquee (two giant lines,
  one each way), the 60-second check (three questions, the answers go into the booking note), a real
  case to compare (grows into place), costs, the doctor, booking, FAQ by
  topic, the practice, the footer with the rising wordmark.

## Look
Frost `#eceef3`, lilac-grey field `#c6c9d6`, ink `#12141b`, one ice blue `#3a46c9`
for accents on light (`#b9c4ff` on dark), and a prism gradient used sparingly (the
ring, the quiz edge, the map pin). Archivo (variable, wide cut for headings) and
IBM Plex Mono for the labels, both self-hosted (OFL). (Geist Mono was swapped out: the
impeccable detector lists Geist as an overused AI-site font.)

## Files
- `index.html`: German copy (crawlers, no-JS), structured data incl. FAQ.
- `css/site.css`: all styles; scroll scenes under `html.scenes`.
- `js/site.js`: the opening, the journey's loop (scroll → progress, mouse look, labels,
  captions, rail), the scene engine (from the implant page), quiz, ring, compare slider, FAQ.
- `js/clear-timeline.js`: the journey as numbers (what every piece does at scroll progress p).
- `tools/make-face-layers.py`: builds `assets/photos/face/*` and `assets/stills/*` from
  `tools/ai-src/face-*.png` (run `python3 tools/make-face-layers.py`; OpenCV, numpy, Pillow) and
  prints the `FACE` numbers for `js/site.js`. The woman: Higgsfield soul_2 (`face-source.png`); her
  crooked teeth: GPT Image 2 edit; straight teeth, the open bite and the aligners: Nano Banana 2.1
  edits; each edit was registered back onto the source and pasted in through the mouth (or jaw) mask.
  The end photo (her hand holding an aligner, Nano Banana 2.1 from face-E) changes too much to paste
  in, so it was only registered onto the same frame and is shown whole (`end.webp`).
- `assets/stills/`: the share picture and the chapter pictures for reduced motion, all from her photo.
- **No longer used** (kept for now, never downloaded): the 3D journey `js/clear-stage.js`,
  `js/src/clear-*.js`, `tools/build-3d.mjs`, `assets/models/dentition.glb`, and the earlier hero
  photos `hero-wide/-tall.webp`, `finale*.webp`. The 3D source no longer matches the timeline
  (its camera keys are gone), so it would need work before it builds again.
- `day.webp`: AI portrait (Higgsfield soul_2; source in `tools/ai-src/`). `talk.webp`, `day-morning/office/lunch.webp`, `wear.webp`: AI photos
  from Canva AI (sources `tools/ai-src/canva-*.jpg`, also kept in the Canva design "Aligner Seite
  Fotos"). `sit-*.webp`, `ways-*.webp`: Higgsfield soul_2 (sources `tools/ai-src/sit-*.png`,
  `ways-*.png`; the retainer photo came inside a film frame and is cropped). `case-*.webp`: the
  main site's aligner before/after (only 242×145 px originals, upscaled).
- `js/i18n.js` (English + runtime strings), `js/booking.js` (the shared widget, `SERVICE 'kfo'`,
  `VIA 'aligner-aachen'`), `impressum/`, `datenschutz/`, `css/legal.css`.

Phones: the same journey, framed upright (the words at the top with a soft wash behind them, her
mouth below). Reduced motion: her photo and the chapters as a list.

## Before going live
- **Domain**: assumed `aligneraachen.de` (canonical, sitemap, robots, structured data). Confirm.
- `vercel.json` sends `noindex` until the domain is settled.
- Booking: the main app must allow this origin (`SATELLITE_ORIGINS`) and the `aligner-aachen` via slug.
- **Real case**: the before/after is the main site's tiny 242×145 picture; we need the original
  (or more cases), and confirmation it is a patient of the practice.
- Sign-offs: the woman's photo and the illustrated tooth changes (crooked → straight are AI edits,
  not a case), the tooth labels and their amounts (12 gedreht 16°, 22 1,8 mm nach innen, 23 2,0 mm
  zu hoch, 41 gedreht 13°: illustrative), the quiz result lines (new), the tray tags ("Schiene wird eingesetzt" / "Schiene sitzt"),
  the new section copy (the five situations and their answers, the six everyday answers incl.
  "Heißes Wasser verformt die Schiene" and the sport/contact-sport line, "Im Gespräch fällt die
  Schiene kaum auf", the three meal breaks on the ring),
  "Ratenzahlung häufig möglich" and the cost wording
  (from the main site), the doctor's quote (reused from bleaching), the facts 22 h / 1–2 weeks,
  the tooth movements on her photo are an illustration.
