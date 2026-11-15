# Scan to Smile

The method page of the AIXSMILE dental practice: practices or private
people send the 3D scan of their teeth, the dentist checks it, the aligners
are made in Aachen and arrive by post. A product page more than a treatment
page. Static site (HTML, CSS, JS modules, one three.js bundle), German first
with an English switch, no build step on Vercel.

Reference: oryzo.ai (Lusion). Taken from it: the blueprint opening, the
object as the hero, a fixed 3D canvas behind the copy, giant words, chapters
that each show one property, a closing "product" moment. Not taken: its
satirical tone, its horizontal panel track, its photo-real desk scene.

## Files

| Path | What |
| --- | --- |
| `index.html` | the page. German in the markup, English in `data-en` / `data-en-label` / `data-en-alt` |
| `css/site.css` | everything visual. Tokens at the top (ink, plaster, signal orange) |
| `js/site.js` | scroll → `P` (chapter + progress), chapter states, the opening, bar, Lenis, arrivals |
| `js/i18n.js` | DE/EN switch + strings built at runtime (`DYN`) |
| `js/order.js` | file drop, 3D preview, validation, sending (`ORDER_ENDPOINT`) |
| `js/stage.js` | **built** bundle: the 3D world + the order preview + three.js r184 |
| `js/src/stage.js` | source of the 3D world (poses keyed on `P`, materials, the box) |
| `js/src/viewer.js` | source of the order form's preview (STL / PLY / OBJ) |
| `assets/models/` | `aligner-upper-parts.glb` (the upper tray, stored as 14 caps; the page draws them as one tray), `aligner-upper.glb` (whole, source for the parts), `aligner-lower.glb`, `aligner-upper-lo.glb` (stack copies), `scan-upper.glb` (teeth + gum), `beispiel-scan-oberkiefer.stl` (the example scan) |
| `assets/stills/` | pictures of the 3D for reduced motion / no WebGL (rendered from the stage; `see.webp` and `stack.webp` are left over from removed chapters and can be deleted) |
| `assets/photos/smile.webp` | the AI portrait for the ending (source in `tools/ai-src/smile-portrait.png`, Higgsfield soul_2) |
| `impressum/`, `datenschutz/` | legal pages (`css/legal.css`, `js/legal.js`) |
| `tools/` | how the models and drawings were made (not deployed, see `.vercelignore`) |

## The 3D

After editing `js/src/*.js`:

    node tools/build-3d.mjs

(borrows esbuild + three from `~/aixsmile/node_modules`, like the other satellites).

The chapters and what the stage does at each `P`:

One story from top to bottom, every move with a reason, and big moments
(history, 2026-11-11: plain rotating looked the same from every side; then a
version where each chapter did its own trick "looked random"; then the stack
"felt off" and there was "no wow moment" → the user picked glass hero,
letterbox and smile reveal; then the glass words hid the text, and the tray
under them "looked cheap" in a "scattered" layout → the product-shot hero):

| P | Chapter | 3D |
| --- | --- | --- |
| 0–1 | hero, "Scan to Smile" | **product shot** (since the user found the floating tray "cheap" and the layout "scattered"): all copy in one left column (headline, claim, buttons, the dentist's line); the tray on the right, seen from the front looking into it, in a soft pool of light with a faint measuring grid. The tray reflects a dark studio with strip lights (`studioScene()`, hero only) and looks the backdrop up along a refracted ray (three IORs), so the grid bends inside every tooth. `site.js` hands the 3D the box of `#heroStage` (`stage.place(rect, heroHeight)`); the tray fills it by its real outline and the whole shot scrolls away with the page |
| 1–2 | `#methode` "Daten rein. Schiene raus." | the scan streams in as points → plaster model revealed behind a scan line (the dentist's check) → the aligner is thermoformed over it → the model goes |
| 2–3 | `#post` "Passt in jeden Briefkasten." | the mailer rises, both aligners go in, lid, label; then **through the letterbox**: a bottle-green front door slides in, the box pushes through the brass flap (slot 230 × 32 mm, the DIN minimum; the 24 mm box just fits), the flap swings shut with a bounce, the box drops |
| 3–4 | `#ankunft` "Auspacken. Einsetzen. Lächeln." | the box lands and opens, aligner 01 lifts out and clicks onto white teeth; then **the smile**: the portrait (assets/photos/smile.webp) grows out from its mouth, aligned with the 3D teeth (the photo's upper teeth: centre u 0.492 / v 0.575, span 0.195 of its width: `SMILE` in `js/src/stage.js`; measure again if the portrait changes), and the view pulls back to the face; "Lächeln." arrives in orange; the copy steps aside while the face passes |

The light behind changes with the chapter (`.glow` layers, `body[data-chapter]`):
warm → scanner teal → ember → cream halo.

Poses are tracks in `apply()` (`track(P, [[p, value], …])`); phones (`portrait`) have their own values.
The canvas stops drawing once the light part covers it, and drops to 1× pixels if the GPU is slow.

### Remaking the models

The aligner is a real, continuous thermoformed shell computed from the
veneer/aligner pages' dentition model (32 crowns + gums):

    python3 -m venv geo && geo/bin/pip install scikit-image trimesh scipy numpy opencv-python-headless
    node tools/decode.mjs ../aligner-webpage/assets/models/dentition.glb dentition-plain.glb   # undo meshopt
    geo/bin/python tools/make_aligner.py dentition-plain.glb upper out 0.13                     # → out/aligner-upper-raw.glb + top view JSON
    geo/bin/python tools/make_aligner.py dentition-plain.glb lower out 0.13
    geo/bin/python tools/export_scan.py dentition-plain.glb upper out                          # → scan-upper-raw.glb, the "customer's scan"
    node tools/simplify.mjs out/aligner-upper-raw.glb assets/models/aligner-upper.glb 0.05 0.0004 --compress
    node tools/simplify.mjs out/aligner-upper-raw.glb assets/models/aligner-upper-lo.glb 0.012 0.003 --compress
    node tools/decode.mjs assets/models/aligner-upper.glb out/aligner-upper-plain.glb
    geo/bin/python tools/split_aligner.py out/aligner-upper-plain.glb dentition-plain.glb out/aligner-upper-parts-raw.glb   # one cap per tooth
    node tools/simplify.mjs out/aligner-upper-parts-raw.glb assets/models/aligner-upper-parts.glb 1 0.00001 --compress
    node tools/simplify.mjs out/aligner-lower-raw.glb assets/models/aligner-lower.glb 0.06 0.0005 --compress
    node tools/simplify.mjs out/scan-upper-raw.glb assets/models/scan-upper.glb 1 0.0001 --compress
    node tools/make-blueprints.mjs     # prints the opening's inline SVG (and an older section drawing) to paste into index.html

How the shell is made (`make_aligner.py`): crowns → solid voxels (0.13 mm),
signed distance; the plastic is everything within 0.42 mm of the teeth,
closed by 0.85 mm so it bridges the gaps between teeth; trimmed 0.9 mm past
the gum line (traced where the crowns meet the gingiva, the contact nearest
the biting edge per column); marching cubes. Simplify with meshoptimizer
only: Python QEM joined the two walls of the thin shell into spikes.
Loading gotcha: the compressed files keep their scale on the node and
positions are normalized int16; `stage.js` copies them to floats before
baking the transform (else every vertex clamps to ±1 mm).

## The order form

`js/order.js` → `ORDER_ENDPOINT` is **null**: there is no receiver yet.
Until one exists, the form checks everything and then offers an email to
info@aixsmile.de with the visitor's details filled in (files have to be
attached by hand). To switch on real uploads, set `ORDER_ENDPOINT` to a URL
that accepts `multipart/form-data`:

- fields `role` (praxis | privat), `practice`, `name`, `email`, `phone`, `street`, `zip`, `city`, `country`, `arch[]` (oben, unten), `note`, `consent` (on), `lang` (de | en)
- files: `scans` (one part per file; STL / PLY / OBJ, ≤ 100 MB each, ≤ 6 files)
- answer 2xx on success. The browser shows the upload progress.

Options: a route on the main site (`~/aixsmile`, needs CORS for this origin
and storage for large files), a Vercel function with Blob storage in this
folder, or a form service that accepts files. Scans are health data: the
receiver needs EU storage, encryption in transit, a data processing
agreement, and the Datenschutz text must then name it.

The example scan is never sent (it is marked "Beispiel · wird nicht gesendet").

## Preview

Any static server, from this folder (the satellites' no-cache server is in
the QA notes; port 8095 was used for this page).

## Go live

1. Domain: not chosen. Then add `<link rel="canonical">`, `og:url`, absolute
   `og:image`, a sitemap, and remove `X-Robots-Tag: noindex` from
   `vercel.json` and `<meta name="robots">` from the three pages.
2. Set `ORDER_ENDPOINT` (above) and update the Datenschutz section
   "Scan senden" with the actual service.
3. Prices: none are shown ("Den Preis erfahren Sie, bevor gefertigt wird").

## Needs sign-off by the practice (claims written for this page)

- Private people can order with their own scan, without coming in; the dentist checks every case and says so if something should be examined.
- "Jeder Scan wird von Zahnarzt Novin Molaie geprüft" / "Rückfragen direkt mit Zahnarzt Novin Molaie".
- The aligners are made in Aachen, thermoformed over a model, trimmed and polished; numbered; sent with short instructions; packed in a box that fits a letterbox.
- "Dünner als eine Kreditkarte" (a card is 0.76 mm; 0.75 mm sheet before forming, ≈ 0.5 mm wall in the drawing). Use the real material.
- Scanner names (iTero, 3Shape TRIOS, Medit, Primescan) as examples of files we can read; delivery countries in the form (DE, AT, CH, NL, BE, LU, other).
- "Der Scan dauert wenige Minuten und kommt ohne Abdruckmasse aus" (scan appointment in Aachen, booking link `https://aixsmile.de/termin/?service=kfo`).
- No online payment; the price is told before anything is made.
- Legal review of the Datenschutz text for uploads (written in the style of the other satellites).

## Checks run (2026-11-11)

html-validate (recommended) clean on all three pages; 35/35 interaction tests; no horizontal overflow at 320 / 390 / 768 / 1024 / 1440 in DE and EN; interaction tests for the language switch, form validation, wrong file type, example scan, real STL, email fallback, practice field, removing files, reduced motion (no tall chapters, stills, no canvas, no opening), no JavaScript, method steps and stack numbers on scroll, canvas off under the light part.
