# AIXSMILE — Zahnimplantate in Aachen (satellite site #3)

A single static page for dental implants at Zahnarztpraxis AIXSMILE, Aachen,
meant for `implantate-aachen.de` (domain still to be confirmed). Built
2026-10-21. Unlike the bleaching and veneer pages it deliberately has its own
style and layout; the owner picked three reference sites (slobodiandental.com
first, then minemal.dental and lavadental.lv) and asked for a new look.

**The look ("Röntgenblau"):** a deep blue-black ink taken from the hero
portrait's own backdrop, bone white and paper for the reading sections, one
warm sand accent. Headlines in Inter Tight (bold, tight, two-tone by colour
only: no italics, no small labels above headings), text in Inter. From
Slobodian: the full-screen hero that stays in place while the page slides up
over it like a curtain, the glass "plate" in the hero, the floating pill menu
that appears once the hero is covered, the situation cards, the quiz, the
comparison table. From Minémal: two huge statements between sections. From
LAVA: words that come into focus one by one (once, quickly) and the FAQ by
topic. Our own: the X-ray slider ("Was unter der Krone steckt"), the quiz
answers that travel into the booking note, and the next free consultation
shown in the hero.

**Motion:** a short opening once per visit (wordmark, sand line, curtain
lifts), the hero builds itself, sections arrive once, smooth wheel scrolling
on laptops (Lenis). On top, scroll scenes taken from the three reference
sites (the owner asked for their animations, 2026-10-21): the hero zooms and
darkens under the curtain; pictures drift inside their frames; "Ein Implantat
ersetzt die Wurzel" lights up word by word and its small inline X-ray grows to
fill the screen, handing over to the X-ray section (LAVA); the four steps play
along a drawing line while the section is pinned (Slobodian's timeline); two
giant lines slide sideways (Minémal); "Eine Lücke bleibt nicht, wie sie ist"
gets pictures drifting in from the edges, then splits apart (LAVA, Minémal);
the quiz and booking panels open from rounded corners; the "5" counts up;
situation cards open on hover; the footer wordmark rises. One small engine in
`js/site.js` gives every scene its progress; `html.scenes` (set in the page
head) lays the pinned scenes out. Reduced motion and no-JS get plain, still
sections.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The page: markup, all German copy, JSON-LD |
| `css/site.css` | All styles (tokens at the top, sections in page order, then tablets, phones) |
| `css/legal.css` | Impressum and Datenschutz |
| `js/i18n.js` | English strings, runtime strings in both languages, the DE/EN switch, `PRICE_FROM` (same scheme as the bleaching page) |
| `js/booking.js` | The booking widget (from the bleaching page: `SERVICE = 'implantate'`, `VIA = 'implantate-aachen'`), the hero plate's next free slot, notes carried in from the cards and the check |
| `js/site.js` | The opening, smooth scrolling, arrivals, X-ray slider, situation cards, steps, 60-second check, FAQ topics |
| `js/legal.js` | DE/EN switch on the legal pages |
| `js/vendor/lenis.min.js` | Lenis 1.3.27 (MIT), smooth wheel scrolling, self-hosted |
| `assets/fonts/` | Inter Tight (headlines), Inter (text), self-hosted |
| `assets/photos/ai/` | The two AI portraits (hero, band) in web sizes and phone crops; sources in `incoming/` (not deployed) |
| `assets/photos/` | The doctor's portrait and the map, copied from the bleaching page |
| `assets/renders/` | 3D illustrations: the X-ray slider pair, five situation cards, four steps |
| `tools/render-implants.mjs` | Renders `assets/renders/` from the client's dentition model (see its header) |

German lives in the HTML; English is in `js/i18n.js`. The switch restores the
German from the page itself, so the two cannot drift.

## Run locally

No build step. Serve the folder over http (ES modules do not load from `file://`):

```
cd implant-webpage
python3 -m http.server 8092
```

On localhost the widget can be pointed at a dev server of the main app with
`?api=http://localhost:3001`.

## Before going live

1. **Domain.** Everything assumes `https://implantate-aachen.de/` (canonical,
   Open Graph, JSON-LD, sitemap, Impressum). Change them together if it differs.
2. **Booking origin.** Add the domain (with and without `www.`) to the main
   app's `SATELLITE_ORIGINS`. Until then the widget shows the phone number, and
   the hero plate shows the opening hours instead of the next free slot.
3. **Indexing.** Remove the `X-Robots-Tag: noindex, nofollow` header from
   `vercel.json` once the real domain is attached.
4. **Price.** Optional: set `PRICE_FROM` in `js/i18n.js` and one line appears in
   the costs section in both languages.

## Sign-off still needed

- **Clinician:** every claim on the page. Most are taken from the implant
  page on aixsmile.de (3D diagnostics, navigated planning, drilling guide,
  local anaesthesia, healing weeks to months, temporary restoration, written
  cost plan, implants usually private, insurance subsidy for the restoration,
  "Auf Wunsch … Möglichkeiten zur Beruhigung"). New here and unconfirmed:
  "two implants often carry a bridge over three or four teeth"; a denture
  held by a few implants "on press studs or screwed in"; the second-opinion
  offer; the comparison table (clasps, bone loss, time, cost order); the quiz
  result sentences; "Im Beratungstermin … zeigt Ihnen am 3D-Bild".
- **Practice:** whether the 3D X-ray (DVT) is done in the practice itself (the
  page only says "3D-Röntgen (DVT)", not where); that Novin Molaie places the
  implants himself (the doctor section says he sees you at the consultation).
- **Images:** the two portraits are AI-generated (Higgsfield Soul 2,
  2026-10-21), checked up close for tooth errors; alt texts and the Impressum
  say so, no visible label (as on the other pages). The renders are
  illustrations from the client's dentition model, labelled „Symbolbild“.
  No real implant case exists yet; real consented cases would be stronger proof.
