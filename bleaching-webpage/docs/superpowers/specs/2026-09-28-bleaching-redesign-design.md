# Bleaching page redesign — design spec

**Date:** 2026-09-28 · **Status:** design approved in chat, section by section, on 2026-09-28 · **Not committed** (the owner commits; nothing in this work runs git).

## Why

The bleaching page (`bleaching-webpage/`) works (no errors, no overflow, booking, real cases, FAQ, 3D slider), but:

- it does not look like one family with the finished veneer page, and not like the client's own mock of this page (dark editorial, bronze buttons, serif headings with an italic phrase, doctor quote beside a large portrait);
- the hero leads with a toy-like yellow jaw and has no button of its own;
- on laptops the route images are 144 px thumbnails and the cases band is mostly empty; on phones four sections squeeze text into 2–3 hyphenated columns about 90 px wide;
- the copy is long (≈ 9,800 px of page on a laptop).

Reference: the client's mock `~/.claude/uploads/c77f5ca6-559c-467e-9f09-00f9aed0c64f/2d6ff08e-image.jpg`; the approved veneer patterns in `../veneer-webpage/index.html`.

## Decisions (the owner's, 2026-09-28)

1. **Look:** the client's dark + bronze editorial style, sharing the veneer page's heading voice, doctor section, footer and motion. Teal and ice blue are retired.
2. **Hero:** a large dental smile close-up (AI, labelled), headline + lead + two buttons on the dark side. The 3D leaves the hero for its own section.
3. **Hero image:** built now with the placeholder `assets/photos/ai/hero.webp` (gloved hand, shade tab, smile); the owner generates the final image in ChatGPT from the prompt below and it is dropped in as `assets/photos/ai/hero-smile.webp`.
4. **Headline:** „Ein helleres Lächeln – *gemessen, nicht geschätzt.*“
5. **Structure:** as in the table below; the four-step Ablauf section is folded into the 3D captions; three method cards including „Kombiniert“.
6. **3D:** the veneer page's realistic `dentition.glb`, colour only (no reshaping), five steps, **press-and-hold + step dots exactly like the veneer page**.
7. **Build approach:** copy and adapt inside `bleaching-webpage/`; the veneer page is not touched; each site still deploys on its own.

## Visual system

Tokens (on `:root`; the old porcelain/ice/teal tokens are replaced, not layered over):

| Token | Value | Use |
| --- | --- | --- |
| `--night` | `#0b0c0d` | hero, 3D band, measuring band, booking band, footer |
| `--night-2` | `#15171a` | cards and lines on dark |
| `--cream` | `#f8f7f5` | light sections |
| `--stone` | `#efebe4` | alternate light sections |
| `--ink` | `#17181a` | headings and strong text on light |
| `--text` | `#3d3a35` | body on light |
| `--soft` | `#6a645b` | captions on light |
| `--on-dark` | `#f3efe8` / `#c9c2b7` | headings / body on dark |
| `--bronze` | `#806a48` (hover `#6e5b3d`) | primary buttons, white text — the mock's `#917a58` darkened to pass WCAG AA |
| `--bronze-ink` | `#7a6444` | eyebrows and links on light |
| `--bronze-light` | `#c9b08a` | eyebrows, rules and links on dark |

Exact values may move a little to pass `tools/check-contrast.mjs`; the look must stay the mock's.

- **Headings:** every h2/h3 in `'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif` with one `<em>` italic phrase per h2 (DE markup and EN dictionary alike), applied through an id on `<body>` like the veneer page's `#page`. Source Serif 4 is dropped (its font files and preload go).
- **Body:** Figtree stays (self-hosted).
- **Buttons:** primary = bronze fill, white text, square-ish corners as in the mock, with a → arrow; secondary = 1 px outline (cream on dark, ink on light).
- **Eyebrows:** small caps, letter-spaced, bronze.
- **Images:** square corners or a very small radius, as in the mock; AI images keep their „KI-generiert“ tag.

## Page structure

| # | id | Section | Band | Content | Phone |
| --- | --- | --- | --- | --- | --- |
| 1 | — | Hero | night | Eyebrow „Zahnbleaching in Aachen“; h1 „Ein helleres Lächeln – *gemessen, nicht geschätzt.*“; 1–2 line lead (we measure the shade before and after with the same scale); bronze „Beratungstermin buchen →“ (#buchen) + outline „Echte Fälle ansehen ↓“ (#faelle); three honest points with thin line icons: „Vorher & nachher gemessen“ · „Erster Termin über die Kasse“ · „Schriftlicher Kostenplan“. Right ≈55 %: the smile image, faded into black on its left edge, tag „KI-generiert · Symbolbild“; a small real before/after card (case 1 pair) at its bottom corner. Header dark over the hero, bronze book button. | Image as a top banner (~40 % of the screen); headline, lead and both buttons within the first screen; sticky booking bar stays. |
| 2 | behandler | Doctor | cream | Veneer-style `.doctorFeature`: suit portrait (`doctor-molaie`) to the section edge; quote „Ein strahlendes Lächeln ist mehr als Ästhetik – es ist ein Stück Lebensfreude.“ (from the client's mock) with „Novin Molaie · Zahnarzt · Zahnarztpraxis AIXSMILE, Aachen“ in small caps; h2 „Moderne Zahnaufhellung *mit medizinischem Anspruch.*“; two sentences: we examine first and say honestly what is realistic, including when fillings or crowns will not lighten; facts that count up: **5** Sprachen · **2×** gemessen · **1–3** Jahre Haltbarkeit; outline button „Beratung vereinbaren →“. | Photo on top, text below; facts stay a 3-column row. |
| 3 | behandlung | 3D treatment | night | See „3D treatment“ below. | Stage on top, caption and dots below. |
| 4 | faelle | Real cases | cream | h2 with italic phrase; the two consented cases large and side by side with Vorher/Nachher tags and the enlarge button; one line on consent and photo lighting instead of a paragraph. | Swipe row (~80 % cards). |
| 5 | messen | Measuring | night | h2 „Ein hellerer Zahnfarbton – *für ein selbstbewussteres Ich.*“ (the mock's smile band); the dark still life `shade-fan.webp` (KI tag); the 8-tab scale A3 … BL1 with „← dunkler / heller →“; „Vorher ein Wert, nachher ein Wert.“ The A3/A1/BL3 strip image leaves the page. | Image as a banner, scale below in one row. |
| 6 | methoden | Methods | cream | h2 like the mock's „Individuell. Sicher. *Effektiv.*“ with a one-line lede; three cards with full images: **In der Praxis** (`in-office.webp`) · **Zu Hause mit Schienen** (`at-home.webp`) · **Kombiniert** (`gel.webp`: start in the practice, continue or refresh at home). Each: meta line, h3, two lines. | Swipe row. |
| 7 | wann | When it helps | stone | Two groups („Spricht gut an“ / „Stößt an Grenzen“), three stain types each with the existing AI thumbnails; each text cut to one or two lines. | One column. |
| 8 | kosten | Costs | cream | Numbered cost cards like the veneer page: 01 Untersuchung und Farbbestimmung (über die Kasse) · 02 Schriftlicher Kostenplan · 03 Ihre Entscheidung; the three cost factors (Verfahren, Vorbereitung, Ausgangslage) as a compact list; `PRICE_FROM` line unchanged. | One column. |
| 9 | buchen | Booking | night | h2 „Vereinbaren Sie Ihren *persönlichen Beratungstermin.*“; the three booking facts; the existing widget on a light card. No photo. Widget behaviour and `js/booking.js` unchanged. | Widget full width. |
| 10 | faq | FAQ | cream | All 10 questions (the JSON-LD FAQ must keep matching); compact accordion, two columns on laptop like the veneer page; phone call button. | One column, compact rows, 44 px tap areas. |
| 11 | praxis | Practice | stone | Veneer layout: h2 with italic phrase, map tile, hours / address / reviews rows, mini slots button. | One column. |
| 12 | — | Footer | night | Veneer-style editorial footer: AIXSMILE wordmark, large italic „It's time to smile.“, practice line, link row (44 px tap areas), Impressum / Datenschutz. | Same, stacked. |

Nav: Behandlung · Fälle · Methoden · Kosten · Fragen, then the book button, phone, DE/EN. The old `#zwei-wege` and `#ablauf` sections go.

### Copy rules

- German lives in the HTML, English in `js/i18n.js`; `node tools/check-i18n.mjs` must pass. Every new or changed element gets its `data-i18n` key.
- About 30 % shorter than today with every fact kept. Facts from the removed Ablauf section move to the 3D captions (clean and check first; several gel passes; brief cold sensitivity; the colour settles over one to two weeks; usually lasts one to three years) and the doctor text (an honest target, fillings and crowns do not lighten).
- No 8-word run may be shared with the veneer page or aixsmile.de's bleaching text (`node tools/check-fresh.mjs`): write the doctor and footer copy fresh, don't paste the veneer wording.
- No vague superlatives (the mock's „100 %“, „Modernste Technologie“, „Zahlreiche zufriedene Patienten“ are not used).

## 3D treatment (section 3)

### What it shows

`dentition.glb` from the veneer page (all 32 crowns, natural gums, bite parted a sliver like a smile). Colour only: tooth shapes are never changed, because a bleaching page must not suggest a shape change.

| Step | Caption (DE, short) | On the model | Readout |
| --- | --- | --- | --- |
| 01 | Ausgangsfarbe messen — erst Reinigung und Untersuchung | natural warm yellow (A3.5), frontal, both arches | A3.5 |
| 02 | Zahnfleisch schützen | a blue barrier band grows along the gum line of both arches | A3.5 |
| 03 | Gel auftragen | a glossy mint coat over the visible teeth (15–25, 35–45); camera moves closer to the front teeth | A3.5 |
| 04 | Gel wirken lassen — in mehreren Durchgängen, kurz kälteempfindlich möglich | teeth lighten A3 → A2 → A1 → B1, a slight turn (≈ ±12°) | steps through |
| 05 | Neue Farbe messen — setzt sich in 1–2 Wochen, hält meist 1–3 Jahre | gel and barrier come off, frontal again, natural white (BL4); a small „Beratung buchen“ link appears | BL4 |

The frame carries „Symbolbild · kein Behandlungsergebnis“.

### Interaction (same as the veneer page)

- The section is one screen tall, never pins, and scrolling changes nothing.
- Pressing and holding the right side of the stage (`.procedure__hold`, 42 % wide, 50 % on phones) plays the treatment (about 12 s in all); releasing pauses; holding at the end restarts; a moving finger scrolls instead of playing.
- Step dots glide the playhead to a step; Space/Enter on the hold zone plays while pressed.
- A small „Gedrückt halten ▶“ hint as on the veneer page.

### Loading and fallback

- The bundle and model load when the section comes near (after the page has settled) or at once when it is on screen; until then the stage shows a rendered still per step.
- Every visitor with WebGL gets the live 3D (no stills-only mode for capable devices); without WebGL (or if loading fails) the step dots switch between the five stills and the hold hint is hidden.
- Reduced motion: the dots jump without gliding; playback still works on hold.
- Drawing happens only while the playhead moves.

### Code (all inside `bleaching-webpage/`)

| File | Role |
| --- | --- |
| `js/bleach-timeline.js` | Pure: progress 0..1 → `{ step, shade, barrier, gel, camera }`, `stepAt`, `stepAnchor`, `SHADES`, step weights. Replaces `js/treatment.js`. No three.js. |
| `js/src/bleach-rig.js` | Takes the loaded dentition: bite, shared enamel material tinted from A3.5 to BL4 (multiplying the model's vertex colour, as the veneer rig does), the barrier band on both gingiva meshes (a per-vertex distance to the nearest crown, computed once at load, drives the band), gel overlays on 15–25 / 35–45 pushed out along the normals (the current stage's gel shader), camera frames (wide / close). `apply(state)` never allocates. |
| `js/src/bleach-stage.js` | Renderer, lights, camera placement, `render(p)`, `resize()`, `still(p, w, h)`; compiles all shaders up front. Replaces `js/src/teeth-stage.js`. |
| `js/bleach-stage.js` | The bundle (three.js r184 inside, no import map) built by `tools/build-3d.mjs`. Replaces `js/teeth-stage.js`. |
| `js/treatment-section.js` | Playhead, hold zone, dots, captions, shade readout, loading, `window.aixsmileTreatment.{ready,seek,progress,still,setLang}` — adapted from the veneer page's `procedure-section.js`. Replaces `js/hero-stage.js`. |
| `assets/models/dentition.glb` | Copy of `../veneer-webpage/assets/models/dentition.glb` (1.1 MB). |
| `assets/treatment/step-1..5.webp` | Stills rendered by `tools/render-teeth.mjs` (rewritten for the new stage). |

Markup reuses the veneer page's `procedure__*` class names so the section script ports with few changes.

## Motion

One-time arrival only, ported from the veneer page: sections and cards rise (`.m-rise`), pictures wipe in (`.m-wipe`), `[data-count]` numbers count up, reduced-motion visitors get fades (`html.m-calm`). Nothing is tied to scroll position; no pinning; no split layout with one side scrolling past a fixed card.

## Assets

- **Add:** `assets/photos/doctor-molaie.webp`, `doctor-molaie-720.webp`, `doctor-molaie.jpg` (copies from the veneer page; the JSON-LD `image` points at the .jpg); `assets/models/dentition.glb`; `assets/treatment/step-1..5.webp`; later `assets/photos/ai/hero-smile.webp` (+ a phone crop) from the owner.
- **Remove from the page (files deleted, listed in the final report):** `assets/models/jaw.glb`, `assets/photos/jaw-{yellow,white}{,-wide}.webp`, `assets/photos/doctor.jpg`, `assets/photos/ai/shade-steps.webp`, `assets/photos/ai/smile.webp` (unused), `js/teeth-stage.js`, `js/src/teeth-stage.js`, `js/treatment.js`, `js/hero-stage.js`, the Source Serif 4 font files. `human-jaw.glb` (the owner's source model, not deployed) stays.
- **`.vercelignore`:** add `docs`, `tests`.

### Prompt for the final hero image (owner runs it in ChatGPT)

> Photorealistic editorial close-up of a natural, healthy smile. Only the lower half of the face: lips slightly parted, the upper front teeth clearly visible, a hint of chin and jaw — no eyes, no nose tip. The teeth are evenly bright but natural (a light natural white, not blue-white, with slight translucency at the biting edges), straight but not artificially perfect. Warm, low-key studio light from the right; the left 45 % of the frame falls off into a deep near-black background (#0b0c0d) with nothing in it, leaving room for text. Warm, natural skin with fine texture, no lipstick, no heavy gloss. Shallow depth of field, sharp on the front teeth. Landscape 16:9, at least 2400 px wide, the smile centred at about 65 % of the width. No text, no logos, no hands, no dental instruments.

The page labels it „KI-generiert · Symbolbild“ and never presents it as a result.

## Verification

- `node --test tests/` — new `tests/bleach-timeline.test.mjs`: steps and anchors in order, shade A3.5 at 0 and BL4 at 1, barrier and gel off at both ends and on in the middle, camera frontal at 0 and 1, pure (same p → same result).
- The existing checks, updated where the page changed and all passing: `check-i18n`, `check-fresh`, `check-schema` (FAQ = visible FAQ, practice details identical to the veneer page), `check-contrast` (AA, laptop and phone, DE and EN), `check-page` (weight, images, third parties, overflow, language, the 3D section and its stills fallback, no scroll animation, no-JS, widget flows), `check-images`, `npx html-validate@9 index.html`.
- Screenshots at 1440×900 and 390×844 of every section (`tools/shoot.mjs` with the new section ids), plus the 3D at each step on laptop and phone.
- Manual check by the owner on a real phone over the Wi-Fi preview (port 8090).

## Out of scope

- The veneer page (no edits).
- Booking logic (`js/booking.js`), legal pages, domain/deploy settings.
- New real photos (the page keeps the two consented cases).

## Needs sign-off (unchanged from before, plus new)

- **Doctor:** the mock's quote attributed to him; the facts „2× gemessen“ and „1–3 Jahre“.
- **Clinician:** the five 3D captions and the shade path A3.5 → BL4; that a combined route („Kombiniert“) is offered; the existing claims (yellow responds better than grey, settles in 1–2 weeks, lasts 1–3 years).
- **Client:** the final hero image; optionally a price-from figure (`PRICE_FROM`).
