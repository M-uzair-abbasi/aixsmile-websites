# Veneer procedure in 3D — design

Date: 2026-09-27. Supersedes the "3D explainer behavior" part of
`2026-09-26-veneer-page-redesign-design.md` (the contained three-state card).

## Why

The practice owner wants patients to see, on a real human dentition, what
actually happens during a veneer treatment, played step by step. Since
2026-09-28 it plays only while the visitor presses and holds (see below). The page is cosmetic marketing for nervous patients: honest about the
enamel removal, never clinical-scary.

## Decisions (agreed with the maintainer)

- **What is shown:** every step happens on the teeth themselves. No
  instruments, needles or blood.
- **Where:** replaces the old explainer directly below the hero. The section
  keeps `id="veneerExplainer"`, so the nav link still works.
- **Layout:** a dark band, one screen tall: heading on top, model large in the
  centre, one caption below, six step dots.
- **Mechanism (changed 2026-09-28):** the section no longer pins or follows
  the scroll — the maintainer asked to drop the scroll animation and keep only
  press and hold. Holding the right side plays the treatment; the step dots
  glide to a step. The drawn progress eases towards the playhead (time
  constant 0.11 s), and frames render only while it moves.
- **Teeth:** ten upper teeth, premolar to premolar (FDI 15–25), and the six
  lower front teeth (33–43) receive veneers (six → ten on 2026-09-27, lower six
  added 2026-09-28: the client wants a flawless "Hollywood smile"). A lower
  tooth shares the timing slot of the upper tooth above it.
- **Result:** every step is deliberately prominent; the finished veneers are
  bright white, slightly wider, longer and fuller than the natural teeth so all
  gaps close; the lower teeth whiten to match (the caption says so).

## Storyboard (six parts of the playback; the preparation takes 1.6×)

| # | DE / EN | On the teeth | Camera |
|---|---------|--------------|--------|
| 1 | Ausgangslage / Starting point | stained teeth, 3 mm chipped corner on 21, 1.4 mm gap between 11 and 21, short 22 | wide smile, easing in |
| 2 | Vorbereitung / Preparation | a thin front layer glows, lifts off and fades tooth by tooth (0.6 mm model depth) | close on the six front teeth |
| 3 | Digitaler Abdruck / Digital impression | a light band sweeps across, leaving a scan grid that fades | close |
| 4 | Anprobe / Try-in | ten ceramic shells swing in from 9 mm in front, centrals → laterals → canines → premolars | turned 16° |
| 5 | Befestigung / Bonding | blue curing light and halo pass over each tooth; seams disappear | front |
| 6 | Ergebnis / Result | Hollywood smile: designed veneers (see below); the bite closes to a natural smile; lower teeth whitened; a shine sweeps across; "Beratung buchen" button | framed on the smile, slightly from above |

Captions are one sentence each (dictionary keys `procedure.s1t` … `s6p`). A
clinician should sign off on the claims (0.3–0.7 mm enamel, 1–2 weeks lab).
The canvas carries the tag "Schematische Darstellung".

## Architecture

- `human_dentition.glb` (source, 18 MB, not deployed) →
  `tools/prepare-dentition.mjs` → `assets/models/dentition.glb` (~1 MB: roots
  dropped, crowns simplified by camera distance, quantized, meshopt).
- `js/procedure-timeline.js`: pure `sampleProcedure(progress)` → per-tooth
  prep / seat / glow / bonded values, scan sweep, camera key. No three.js;
  unit-tested in `tests/procedure-timeline.test.mjs`.
- `js/dentition-rig.js`: builds, from the real crowns at load time, the flawed
  tooth, the enamel layer, the prepared tooth and the veneer shell (outer =
  original crown, inner = prepared surface, so it closes the gap and restores
  the chip and tapers to zero at its margin); scan-grid shader; curing light.
  `apply(state)` sets everything without allocating.
- `js/veneer-procedure.js`: renderer, lights, camera framing, shader
  pre-compilation, `render(p)`, `still(p, w, h)`.
- The page loads `js/veneer-procedure.bundle.js`: the stage, rig, timeline and
  three.js bundled by `tools/build-procedure.mjs` (esbuild, target Safari 15).
  No import map, so iOS 15.0–16.3 get the same 3D. **Rebuild the bundle after
  editing veneer-procedure.js, dentition-rig.js or procedure-timeline.js.**
  Only devices without WebGL 2 (iOS 14 and older) fall back to stills.
- `js/procedure-section.js`: the playhead (press and hold, step dots), caption,
  lazy-loads the 3D when the section is near (after the hero has settled).
  API on `window.aixsmileProcedure`: `ready`, `seek(p)`, `progress()`,
  `still(p, w, h)`, `setLang(lang)`.
- Stills `assets/procedure/step-1..6.webp` are rendered from the same stage by
  `tools/render-procedure-stills.mjs`. They are the poster while the 3D loads,
  the fallback without WebGL, and the list shown with reduced motion.

## Smile design (2026-09-28, reworked the same day)

The veneers are designed, not copied from the natural teeth ("the canines are
not proper and all teeth look the same size" — the maintainer). In
`dentition-rig.js`, for the patient's right-hand teeth (upper 11–15, lower 41–43;
the left-hand ones are exact mirror images):

- **Proportions:** `WIDEN` makes the centrals clearly dominant (+10%) while the
  laterals stay slim (+3%); lower teeth use `WIDEN_LOWER`.
- **Smile line** (`UPPER_EDGE` / `LOWER_EDGE`, built from `flatEdge` and
  `cuspEdge`): centrals longest with near-square inner corners; laterals
  1.2 mm shorter with rounder corners; canines come back down to a sharp point
  level with (0.25 mm past) the centrals — the corners of the smile; premolar
  cusps step up behind. Rounded corners open small V-gaps between the edges.
  Lower incisors on one even line, lower canines pointed.
- **Edge redraw** (`levelEdge`): lengthening stretches the front and the edge
  (the veneer carries the length); shortening applies to the whole tooth, front
  and back, and folds into a softly rounded edge (`EDGE_ROUND` 0.35 mm) — a hard
  cut shaded as a grey band.
- **Finish:** Taubin smoothing *before* the redraw, a light edge-protected pass
  after (`polish(t, 2, true)`), then `sculpt` (the canine's light-catching
  ridge with both halves turning away, faint lobes on the incisors) and `shade`
  (translucent edge, warmer towards the gum, canines a shade warmer).
- **Once seated,** each veneer swaps to its finished tooth (`t.finished`, the
  whole designed surface): a thin shell alone left the premolars hollow.
- **The result** closes the bite fully (`BITE_SMILE_DEG` 0) so the upper teeth
  overlap the lower ones, and frames the smile (camera close 0.3, el 6, zoom 0.78).

Tune the look in `UPPER_EDGE`, `WIDEN`, `sculpt` and `PORCELAIN`. Iterate with a
harness that renders the unbundled sources (see the QA memory), then rebuild the
bundle and the stills.

## Press and hold to play (2026-09-28)

Like holding the right side of a video: pressing and holding the right part of
the 3D view (`.procedure__hold`, 42% wide; 50% on phones) plays the treatment by
itself in about 15 s (`PLAY_SECONDS` in `procedure-section.js`): the playhead
advances at a steady pace after a short run-up, and letting go pauses exactly
there. Scrolling never moves it. Held at the end, it restarts from the
beginning. A finger that
moves more than 10 px within 250 ms is a swipe, not a hold; long-press menus
are suppressed. Space/Enter on the focused zone does the same. A hint pill
("Gedrückt halten ▸▸") shows where; while playing, a "▸▸ Abspielen" badge shows.

## Fallbacks

- Every visitor gets the same stage, including phones set to reduce motion
  (playback only runs while they hold it).
- No JS, or the section script fails to load: the six stills with captions as
  a grid (3 columns, 2 on phones).
- WebGL or model failure: the stage stays and swaps stills per step.

## Performance budget

Model ≤ 1.1 MB, ~140k triangles; pixel ratio ≤ 2 and ≤ 2.4 MP; all shaders
compiled once before the first frame; no render loop while idle.
