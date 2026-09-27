# Veneer procedure in 3D — design

Date: 2026-09-27. Supersedes the "3D explainer behavior" part of
`2026-09-26-veneer-page-redesign-design.md` (the contained three-state card).

## Why

The practice owner wants patients to see, on a real human dentition, what
actually happens during a veneer treatment, played step by step as they
scroll. The page is cosmetic marketing for nervous patients: honest about the
enamel removal, never clinical-scary.

## Decisions (agreed with the maintainer)

- **What is shown:** every step happens on the teeth themselves. No
  instruments, needles or blood.
- **Where:** replaces the old explainer directly below the hero. The section
  keeps `id="veneerExplainer"`, so the nav link still works.
- **Layout:** a dark band. While the visitor scrolls, the whole stage pins:
  heading on top, model large in the centre, one caption below, six step dots.
  Nothing scrolls past beside a fixed card (the maintainer rejected that
  pattern before).
- **Mechanism:** live 3D scrubbed by scroll. Scrolling back plays the
  treatment in reverse. The drawn progress eases towards the scroll position
  (time constant 0.11 s), and frames render only while it moves.
- **Teeth:** ten upper teeth, premolar to premolar (FDI 15–25), receive veneers
  (changed from six on 2026-09-27: the client wants a "Hollywood smile").
- **Result:** every step is deliberately prominent; the finished veneers are
  bright white, slightly wider, longer and fuller than the natural teeth so all
  gaps close; the lower teeth whiten to match (the caption says so).

## Storyboard (six equal parts of the scroll)

| # | DE / EN | On the teeth | Camera |
|---|---------|--------------|--------|
| 1 | Ausgangslage / Starting point | stained teeth, 3 mm chipped corner on 21, 1.4 mm gap between 11 and 21, short 22 | wide smile, easing in |
| 2 | Vorbereitung / Preparation | a thin front layer glows, lifts off and fades tooth by tooth (0.6 mm model depth) | close on the six front teeth |
| 3 | Digitaler Abdruck / Digital impression | a light band sweeps across, leaving a scan grid that fades | close |
| 4 | Anprobe / Try-in | ten ceramic shells swing in from 9 mm in front, centrals → laterals → canines → premolars | turned 16° |
| 5 | Befestigung / Bonding | blue curing light and halo pass over each tooth; seams disappear | front |
| 6 | Ergebnis / Result | Hollywood smile: bright, even, gap-free veneers; lower teeth whitened; a shine sweeps across; "Beratung buchen" button | wide smile |

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
- `js/procedure-section.js`: scroll → progress, caption, dots, lazy-loads the
  3D when the section is near (after the hero has settled).
- Stills `assets/procedure/step-1..6.webp` are rendered from the same stage by
  `tools/render-procedure-stills.mjs`. They are the poster while the 3D loads,
  the fallback without WebGL, and the list shown with reduced motion.

## Fallbacks

- Phones set to reduce motion get the full scroll animation too (owner's
  decision, 2026-09-27: many have the setting on only through battery saver).
- No JS, or the section script fails to load: no pinning; the six stills with
  captions as a grid (3 columns, 2 on phones).
- WebGL or model failure: the pinned stage stays and swaps stills per step.

## Performance budget

Model ≤ 1.1 MB, ~140k triangles; pixel ratio ≤ 2 and ≤ 2.4 MP; all shaders
compiled once before the first frame; no render loop while idle.
