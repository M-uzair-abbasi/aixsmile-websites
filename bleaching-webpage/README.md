# AIXSMILE — Bleaching in Aachen (satellite site #2)

A single static page for the bleaching treatment at Zahnarztpraxis AIXSMILE,
Aachen, meant for `bleaching-aachen.de`. It is the second satellite after
`../veneer-webpage/` and follows the same rules
(`~/Downloads/SATELLITE-DOMAINS-STRATEGY.md`): fresh copy, its own look,
AIXSMILE named openly, one booking system. Design spec:
`../docs/superpowers/specs/2026-09-24-bleaching-satellite-design.md`.

**The look (redesign 2026-09-28):** the client's own mock of this page —
near-black bands, warm cream and stone sections, bronze buttons, headings in
the veneer page's serif (Iowan/Palatino) with one italic phrase, Figtree for
text. The hero is a smile close-up with the promise „Ein helleres Lächeln –
gemessen, nicht geschätzt.“; the page keeps its honest idea that the shade is
measured before and after. Nothing moves with the scroll position; sections
arrive once. Spec: `docs/superpowers/specs/2026-09-28-bleaching-redesign-design.md`;
plan: `docs/superpowers/plans/2026-09-28-bleaching-redesign.md`.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The page: markup, inline CSS, JSON-LD, all German copy |
| `js/i18n.js` | English strings, runtime strings in both languages, the DE/EN switch, `PRICE_FROM` |
| `js/booking.js` | The embedded booking widget; `API_BASE`, `SERVICE`, `VIA` at the top |
| `js/bleach-timeline.js` | The treatment as one number p (0..1): steps, shades, barrier, gel, camera — read by the 3D, the section script, the stills tool and the tests |
| `js/treatment-section.js` | The 3D section: press-and-hold playback, step dots, captions (read from the section's step list), shade readout, loading and stills fallback |
| `js/bleach-stage.js` | The 3D stage with three.js, bundled and minified (built from `js/src/bleach-stage.js` + `js/src/bleach-rig.js`, do not edit) |
| `assets/models/dentition.glb` | The dentition model, copied from the veneer page (32 crowns, gums, bite hinge) |
| `assets/treatment/` | The five step stills (poster, no-WebGL and no-JS fallback) |
| `assets/fonts/` | Figtree, self-hosted (headings use the system serif stack) |
| `assets/photos/` | Two consented cases (+ the hero's case pair), the doctor's portrait (`doctor-molaie*`), the map; `ai/` holds the labelled AI images in use |
| `assets/tooth-mark.png` | Favicon |
| `tests/` | `node --test tests/*.test.mjs`: the timeline and the rig (`site-esm.mjs` lets Node read the site's `.js` as ES modules) |
| `robots.txt`, `sitemap.xml` | For the real domain |
| `vercel.json` | Headers; **noindex while on the Vercel preview URL** |
| `tools/` | Checks and screenshots (not deployed) |

German lives in the HTML so search engines and visitors without JavaScript get
it directly. English is in `js/i18n.js`; the switch restores the German from
the page itself, so the two cannot drift.

## Run locally

No build step. Serve the folder over http (ES modules do not load from `file://`):

```
cd bleaching-webpage
python3 -m http.server 8090
```

Then open http://localhost:8090/. On localhost the widget can be pointed at a
dev server of the main app with `?api=http://localhost:3001`; it refuses any
non-localhost value.

## Deploy (you run these; nothing here commits or deploys)

```
cd bleaching-webpage
vercel link        # once: create or pick the project for this site
vercel --prod
```

`.vercelignore` keeps `tools/` and this README out of the upload.

## The 3D treatment (2026-09-28)

Section `#behandlung`: the bleaching on the veneer page's realistic dentition,
colour only (tooth shapes never change). Five steps: measure A3.5, protect
the gums, apply the gel, let it work (A3 → B1), gel off and measure BL4. The
visitor presses and holds the right side of the view to play it (about
12 s); letting go pauses; the dots jump to a step; scrolling changes nothing.
Every visitor with WebGL gets the live 3D; it loads when the section comes
near (bundle ~160 KB + model ~915 KB gzipped). Without WebGL (or when a phone
drops the context) the dots switch between five stills; without JS the stills
show as a list. Labelled "Symbolbild · kein Behandlungsergebnis".

After editing `js/src/*` or `js/bleach-timeline.js`, from this folder:

```
node tools/build-3d.mjs              # js/bleach-stage.js
node tools/render-teeth.mjs          # test frames into tools/shots/
node tools/render-teeth.mjs --stills # assets/treatment/step-N.webp
node --test tests/*.test.mjs
```

Both tools borrow esbuild, three.js (0.184) and Playwright from the main app's
`node_modules` (`AIXSMILE_DIR` wins), so this folder still has no
`package.json` and Vercel serves plain files. `human-jaw.glb` (the old jaw's
source) and `js/src/` are in `.vercelignore`.

## The AI images

In use, no longer with a visible "KI-generiert" label (removed at the owner's
request on 2026-10-07; the alt texts and the Impressum still say they are
AI-generated): `hero-smile.webp` and
`hero-smile-960.webp`; `smile-band-1.webp`, `smile-band-1-960.webp`,
`smile-band-1-sq.webp`, `smile-band-2.webp`, `smile-band-2-960.webp`,
`smile-band-2-sq.webp`, `smile-band-3.webp`, `smile-band-3-960.webp` and
`smile-band-3-sq.webp`; `shade-fan.webp` (measuring band); `in-office.webp`,
`at-home.webp`, `gel.webp` (methods); and the six `stain-*.webp` files (when it
helps). The hero and all three smile-band portraits were generated specifically
for this bleaching page and were not taken from or adapted from the veneer
page. None is shown as a result; results come only from the two real cases.

## Before going live

0. **Images.** `node tools/check-images.mjs` must pass: no placeholder left.
1. **Domain.** The exact spelling from the client. Everything assumes
   `https://bleaching-aachen.de/` (canonical, Open Graph, JSON-LD, sitemap,
   robots). Change all of them together if it differs.
2. **Booking origin.** Add `https://bleaching-aachen.de` and
   `https://www.bleaching-aachen.de` to the main app's `SATELLITE_ORIGINS` env
   on Vercel and redeploy the main app. Until then the widget cannot book from
   the real domain; it falls back to the aixsmile.de link on its own.
3. **Indexing.** Remove the `X-Robots-Tag: noindex, nofollow` header from
   `vercel.json` once the real domain is attached.
4. **After the aixsmile.de cutover.** Set `API_BASE` in `js/booking.js` to
   `https://aixsmile.de`.
5. **Search Console.** Own property for the domain; submit `sitemap.xml`.

## Sign-off still needed

- **Doctor:** the quote from the client's mock attributed to him („Ein
  strahlendes Lächeln ist mehr als Ästhetik – es ist ein Stück
  Lebensfreude.“); the facts „2× gemessen“ and „1–3 Jahre“.
- **Clinician:** that a combined route („Kombiniert“) is offered.
- **Clinician:** the five 3D steps and captions and the shade path A3.5 to
  BL4 on the dentition model (labelled "Symbolbild · kein Behandlungsergebnis"),
  the section texts (when it helps, measuring, the three methods) and the ten
  FAQ answers. Claims to confirm, besides those below: grey or
  banded discolouration lightens more modestly; a single dark tooth after a
  root canal needs a different approach. Claims to confirm: yellowish discolouration responds better than grey;
  teeth look lighter straight after treatment and settle over one to two weeks;
  results last one to three years; in-office and take-home trays are both
  offered.
- **Client:** domain spelling; optionally a price-from figure. Set
  `PRICE_FROM` in `js/i18n.js` to a number and one line appears in the Kosten
  band in both languages. Leave it `null` to show no price.
- **Photos:** the two cases are the practice's consented images. Case 1 was
  cropped only to remove the baked-in "Vorher"/"Nacher" labels; the page sets
  its own labels. The result smile from the main site (`ergebnis.jpg`) is not
  used: it may show veneers rather than bleaching, and a bleaching page must
  not suggest otherwise.

## Checks

All run from this folder. They serve the folder themselves, borrow Playwright
from `~/aixsmile`, and answer the booking API from fixtures, so nothing
reaches the live API.

```
node --test tests/*.test.mjs   # the timeline and the rig
node tools/check-i18n.mjs      # every element has English, runtime strings match
node tools/check-fresh.mjs     # no 8-word run shared with the veneers page or aixsmile.de's bleaching text
node tools/check-schema.mjs    # JSON-LD valid, practice details identical to the veneers page, FAQ = visible FAQ
node tools/check-contrast.mjs  # WCAG AA for all text, laptop and phone, DE and EN
node tools/check-page.mjs      # weight, images, third parties, overflow (DE+EN), language, sections, the 3D and its fallbacks, one-time arrivals, no-JS, widget flows (SKIP_3D=1 skips the slow live-3D blocks)
node tools/check-images.mjs    # which AI images are still placeholders
node tools/shoot.mjs           # screenshots of every section, laptop and phone, into tools/shots/
npx html-validate@9 index.html # markup
```

`tools/book-local.mjs <dev-server-url>` makes one real booking against a local
dev server of the main app (its local SQLite database, no mail, no push) and is
refused for any non-localhost URL.

## Image rule (2026-09-24)

`case-1.jpg`, `case-1-pair.webp` and `case-2.jpg` are the same two cases that
aixsmile.de shows on its bleaching page. That is a known duplicate-image
signal, accepted for now for the conversion value; swap them for cases that
are NOT on the main site as soon as the practice supplies any. The former
shade-guide photo was the main site's own `farbbestimmung.jpg` and was removed.
