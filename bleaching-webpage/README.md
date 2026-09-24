# AIXSMILE — Bleaching in Aachen (satellite site #2)

A single static page for the bleaching treatment at Zahnarztpraxis AIXSMILE,
Aachen, meant for `bleaching-aachen.de`. It is the second satellite after
`../veneer-webpage/` and follows the same rules
(`~/Downloads/SATELLITE-DOMAINS-STRATEGY.md`): fresh copy, its own look,
AIXSMILE named openly, one booking system. Design spec:
`../docs/superpowers/specs/2026-09-24-bleaching-satellite-design.md`.

**The idea:** colour has a number. The hero asks "Welche Nummer hat Ihr
Weiß?"; the page explains that the shade is measured with a shade guide before
and after. Redesign 2026-09-24 (second pass): light porcelain page with ice-blue
bands and one mineral-teal accent, a single navy band for the real before/after
photos, Source Serif 4 headings with Figtree text, no AI imagery, no
scroll-driven animation. The first pass had been (kept here for the record): the
headline on the left with one framed image beside it, then sections
alternating dark and warm cream, and no scroll-driven animation.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The page: markup, inline CSS, JSON-LD, all German copy |
| `js/i18n.js` | English strings, runtime strings in both languages, the DE/EN switch, `PRICE_FROM` |
| `js/booking.js` | The embedded booking widget; `API_BASE`, `SERVICE`, `VIA` at the top |
| `assets/fonts/` | Source Serif 4 + Figtree, self-hosted (no request to Google) |
| `assets/photos/` | Shade-guide photo, two consented cases, the dentist's portrait |
| `assets/photos/ai/` | Removed 2026-09-24: the page shows no AI images any more. Real practice photos (shade guide in the dentist's hand, lamp, trays, team) are still wanted; drop them into `assets/photos/` |
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

## The AI images (no longer on the page)

> Since 2026-09-24 the page carries no AI imagery. The section below documents the earlier setup in case real photos are ever replaced by illustrations again.

The page needs five AI images; the brief with ready prompts is
`../docs/superpowers/specs/2026-09-24-bleaching-image-brief.md`. Until they
arrive the page shows labelled placeholders at the right size and shape.

1. Put the originals in `assets/photos/ai/incoming/`, named `hero`,
   `smile`, `gel`, `in-office`, `at-home` (JPG, PNG or WebP; ChatGPT's
   tall 1024 × 1536 is enough).
2. Run `python3 tools/prepare_images.py`. It crops, resizes and writes the
   WebP files the page loads. `incoming/` is not uploaded and not committed.
3. Run `node tools/check-images.mjs` to confirm no placeholder is left.

All images were supplied on 2026-09-24: `hero`, `smile`, `gel`, `in-office`,
`at-home`, the six `stain-*` illustrations, `shade-steps`, and an extra
`shade-fan` (the shade guide as a still life) beside the heading of the
four-step section. `--placeholders` never replaces a real image.

Every AI image carries a "KI-generiert" label on the page. The images are
dental (a shade check, a natural smile, the gel, the chair, the trays) with
natural tooth shades, no dentist faces, and none of them is shown as a result;
results come only from the two real cases.

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

- **Clinician:** the section texts (what happens, when it helps, measuring,
  the four steps, the two routes) and the nine FAQ answers, plus the one AI
  shade-step comparison ("Symbolbild, kein Behandlungsergebnis"), which the
  user chose to include. Claims to confirm, besides those below: grey or
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
node tools/check-i18n.mjs      # every element has English, runtime strings match
node tools/check-fresh.mjs     # no 8-word run shared with the veneers page or aixsmile.de's bleaching text
node tools/check-schema.mjs    # JSON-LD valid, practice details identical to the veneers page, FAQ = visible FAQ
node tools/check-contrast.mjs  # WCAG AA for all text, laptop and phone, DE and EN
node tools/check-page.mjs      # weight, images load, third parties, overflow, language, no scroll animation, no-JS, widget flows
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
