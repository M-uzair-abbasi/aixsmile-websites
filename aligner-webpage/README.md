# Aligner Aachen · AIXSMILE

The fourth satellite page: clear aligners. Built 2026-10-24 after **igloo.inc**
(Awwwards Site of the Year 2024), which the user picked after rejecting the
aligner brands' own sites as not "wow".

## The idea
The page is one aligner treatment, told as one 3D world on a misty lilac field
(Igloo's ice world). **Hero:** a woman holds out her open palm; a set of crooked
teeth made of frosted glass floats above it, turning slowly (the photo is drawn
inside the 3D scene, the set is live 3D placed on her palm for every screen shape;
a soft shadow lies on her palm). Scrolling lifts the set out of her hand and she
dissolves into the mist in soft clouds with rainbow edges. Then:

0. **Die Ausgangslage**: the set in the middle, small monospace labels on the crooked teeth.
1. **Der Scan**: the teeth dissolve into a point cloud and a scan line passes over them.
2. **Der Plan**: every tooth moves to its place; the labels count down (11° → gerade), the
   corner counter runs tray 01 → 24.
3. **Die Schienen** (the longest chapter, about 40 % of the journey): the bite opens; the upper
   tray (pale clear plastic with slate-blue edges) comes in from the front, waits just under its
   teeth, then is pushed on and clicks (its edges flash ice blue); then the lower one the same
   way. Tags follow each tray ("Oben / Unten · Schiene wird eingesetzt → Schiene sitzt"). The
   bite closes and a soft glint runs up the trays.
4. **Das Ergebnis**: the world turns to white fog and the photo of a woman (same styling as
   the hero) laughing with a clear aligner comes up, with the booking button.

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
- `js/src/clear-stage.js` (renderer, glow, rainbow-edge/fog pass) and `js/src/clear-rig.js`
  (glass teeth, crooked offsets, hero float, scan points, aligner shells), bundled with
  three.js into **`js/clear-stage.js`**: run `node tools/build-3d.mjs` after editing them
  (borrows esbuild + three from `~/aixsmile/node_modules`).
- `assets/models/dentition.glb`: the veneer page's dentition model (gums hidden here).
- `assets/stills/`: rendered stills of the 3D (the poster before WebGL is ready, and the
  chapter pictures for reduced motion / no WebGL).
- `assets/photos/hero-wide.webp` (laptops) and `hero-tall.webp` (phones, flies painted out),
  `finale*.webp`, `day.webp`: AI portraits (Higgsfield soul_2; sources in `tools/ai-src/`).
  The palm positions for the 3D are the `HERO` table in `js/site.js` (image fractions); a new
  photo needs new numbers there. `talk.webp`, `day-morning/office/lunch.webp`, `wear.webp`: AI photos
  from Canva AI (sources `tools/ai-src/canva-*.jpg`, also kept in the Canva design "Aligner Seite
  Fotos"). `sit-*.webp`, `ways-*.webp`: Higgsfield soul_2 (sources `tools/ai-src/sit-*.png`,
  `ways-*.png`; the retainer photo came inside a film frame and is cropped). `assets/stills/hero*.webp` are posters rendered from the 3D
  over these photos (reduced motion / before WebGL is ready). `case-*.webp`: the
  main site's aligner before/after (only 242×145 px originals, upscaled).
- `js/i18n.js` (English + runtime strings), `js/booking.js` (the shared widget, `SERVICE 'kfo'`,
  `VIA 'aligner-aachen'`), `impressum/`, `datenschutz/`, `css/legal.css`.

Phones and slow machines: the 3D runs everywhere WebGL2 exists; phones get the light version
(no glow, fewer scan points). If frames run slow, the page drops to 1× pixels and switches the
glow off by itself. Reduced motion / no WebGL: a still picture and the chapters as a list.

## Before going live
- **Domain**: assumed `aligneraachen.de` (canonical, sitemap, robots, structured data). Confirm.
- `vercel.json` sends `noindex` until the domain is settled.
- Booking: the main app must allow this origin (`SATELLITE_ORIGINS`) and the `aligner-aachen` via slug.
- **Real case**: the before/after is the main site's tiny 242×145 picture; we need the original
  (or more cases), and confirmation it is a patient of the practice.
- Sign-offs: the quiz result lines (new), the tray tags ("Schiene wird eingesetzt" / "Schiene sitzt"),
  the new section copy (the five situations and their answers, the six everyday answers incl.
  "Heißes Wasser verformt die Schiene" and the sport/contact-sport line, "Im Gespräch fällt die
  Schiene kaum auf", the three meal breaks on the ring),
  "Ratenzahlung häufig möglich" and the cost wording
  (from the main site), the doctor's quote (reused from bleaching), the facts 22 h / 1–2 weeks,
  the 3D tooth movements are an illustration.
