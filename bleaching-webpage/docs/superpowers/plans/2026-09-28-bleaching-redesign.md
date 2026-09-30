# Bleaching Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `bleaching-webpage/` into the client's dark + bronze editorial page (one family with the veneer page), with a smile-close-up hero and the bleaching treatment shown in 3D on the veneer page's realistic dentition, played by press-and-hold.

**Architecture:** A static page: `index.html` holds markup, all German copy and one inline `<style>` block; `js/i18n.js` holds English; small ES modules add behaviour. The 3D is a pure timeline (`js/bleach-timeline.js`) read by a rig + stage (`js/src/`) that esbuild bundles with three.js into `js/bleach-stage.js`, and by a section script (`js/treatment-section.js`) that owns the playhead. Section by section, old CSS is pruned from every layer of the style block and a new block is appended, so later rules always win.

**Tech Stack:** HTML/CSS, vanilla ES modules, three.js r184 + esbuild + Playwright borrowed from `~/aixsmile/node_modules` via `tools/lib.mjs`, `node --test` (Node 24), Python PIL for image crops.

**Spec:** `bleaching-webpage/docs/superpowers/specs/2026-09-28-bleaching-redesign-design.md` — read it before starting; this plan argues from it.

All paths below are relative to `bleaching-webpage/` unless they start with `../`. Run every command from `bleaching-webpage/`. `$SCRATCH` stands for the absolute path of a scratch folder outside the repo (e.g. the session scratchpad); substitute it in each command (shell variables do not persist between tool calls).

## Global Constraints

- Work only in `bleaching-webpage/`. `../veneer-webpage/` must not change: `git status --short ../veneer-webpage` stays empty at every checkpoint.
- **Never run `git add`, `git commit` or `git push`.** The owner commits. Each task ends with a checkpoint that lists changed files with `git status --short .`.
- Codex and a second maintainer also edit this repo: run `git status --short .` before each task; before changing a file for the first time, copy it to `$SCRATCH/backup/`.
- German copy lives in `index.html`; English in `js/i18n.js` (`EN` for `data-i18n*` keys, `DYN` for runtime strings). `node tools/check-i18n.mjs` must pass after every task that touches copy (no missing and no orphaned English).
- No 8-word run shared with the veneer page or aixsmile.de's bleaching text: `node tools/check-fresh.mjs`.
- Headings: every h1/h2/h3 in `'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif`, weight 400; one `<em>` italic phrase per h2, in German markup and English strings alike. (The veneer page needs an id on `<body>` to beat older CSS layers; here the old heading rules are replaced, not layered over, so no id is needed.)
- Tokens (exact values): `--night #0b0c0d`, `--night-2 #15171a`, `--cream #f8f7f5`, `--stone #efebe4`, `--ink #17181a`, `--text #3d3a35`, `--soft #6a645b`, on dark `#f3efe8` / `#c9c2b7`, `--bronze #806a48` (hover `#6e5b3d`, white text), `--bronze-ink #7a6444`, `--bronze-light #c9b08a`. Values may move slightly only to pass `tools/check-contrast.mjs`.
- Nothing is tied to scroll position: no scroll-scrubbing, no pinning, no split layout with one side scrolling past a fixed card. Motion is one-time arrival only.
- AI images: dental only, always labelled (`KI-generiert`, hero `KI-generiert · Symbolbild`), never presented as results. The 3D frame says „Symbolbild · kein Behandlungsergebnis“.
- 3D: colour only, never reshape a tooth; press-and-hold + step dots like the veneer page; every visitor with WebGL gets the live 3D; it loads when the section comes near.
- Phones: one column or swipe rows (~80 % cards), 44 px tap areas, the sticky booking bar stays.
- `js/booking.js` is not edited; the widget keeps its ids (`buchen`, `bkForm`, `bkDays`, `miniToggle`, `miniSlots`, …).
- Tools: never run two Playwright browsers at once; headless SwiftShader makes 3D slow — use generous timeouts; the laptop is often under load, so re-run a timing failure in a fresh page before calling it a bug.
- The Wi-Fi preview on port 8090 serves the working tree with `Cache-Control: no-store`; the owner can look at any time.
- The project's Bash hook ("Fact-Forcing Gate") asks you to quote the user's current instruction and list the files before `rm` and before creating or editing files; answer it and retry.

## Review Focus

1. **A swipe that starts on the 3D (phone)** must scroll the page and not start playback. → Task 4, test "phone: a swipe starting on the 3D scrolls instead of playing".
2. **Switching DE/EN while paused mid-treatment** must translate the caption and the dots without moving the playhead. → Task 4, tests "the caption follows the language, the playhead stays" and "the dots are labelled in the page language".
3. **Losing WebGL** (no WebGL at all, or the context lost when a phone switches apps) must leave stills that still follow the dots. → Task 4, tests "without WebGL the dots switch the stills" and "a lost WebGL context falls back to the stills".
4. **Reduced-motion visitors** must see all content (arrivals as fades) and the dots must jump, not glide. → Task 4 (dot jump) and Task 11 (every block arrives, `m-calm`).
5. **Narrow phones in both languages** (320–414 px): long German compounds and the italic heading phrases must not cause sideways scrolling. → Task 12, overflow check in German and English.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `js/bleach-timeline.js` (new) | Pure: progress → step, shade, barrier, gel, camera; anchors; swatch/tint helpers | 1 |
| `tests/bleach-timeline.test.mjs` (new) | Timeline tests | 1 |
| `js/src/bleach-rig.js` (new) | Dentition → enamel tint, gum barrier band, gel overlays, frames; `gumDistances` | 2 |
| `tests/bleach-rig.test.mjs` (new) | `gumDistances` tests | 2 |
| `js/src/bleach-stage.js` (new) | Renderer, light, camera, `render/resize/still` | 2 |
| `js/bleach-stage.js` (new, built) | The bundle the page loads | 2 |
| `tools/build-3d.mjs` (modify) | Builds `js/bleach-stage.js` | 2 |
| `tools/render-teeth.mjs` (rewrite) | Harness renders: test frames, `--stills` | 2 |
| `assets/models/dentition.glb` (copy) | The model | 2 |
| `index.html` (modify, every task from 3) | Markup, German copy, style block, inline scripts | 3–12 |
| `js/i18n.js` (modify) | English | 4–10 |
| `assets/fonts/fonts.css` (modify) | Figtree only | 3 |
| `tools/shoot.mjs` (modify) | Screenshots of every section, ids from the DOM | 3 |
| `js/treatment-section.js` (new) | Playhead, hold zone, dots, captions, shade readout, loading | 4 |
| `assets/treatment/step-1..5.webp` (new) | Stills | 4 |
| `tools/lib.mjs` (modify) | 3D stub path for checks | 4, 5 |
| `tools/check-page.mjs` (modify) | Behaviour checks | 4–12 |
| `tools/css-prune.mjs` (new, deleted in 12) | Dev helper: drop old CSS rules | 5 |
| `assets/photos/doctor-molaie{,-720}.webp`, `.jpg` (copy) | Doctor portrait | 6 |
| `tools/placeholders.json` (modify) | Drop removed AI images | 7 |
| `tools/check-contrast.mjs` (modify) | Force arrivals before auditing | 11 |
| `README.md`, `.vercelignore` (modify) | Docs, deploy ignore | 12 |

Deleted along the way: `js/hero-stage.js`, `js/treatment.js`, `js/teeth-stage.js`, `js/src/teeth-stage.js`, `assets/models/jaw.glb`, `assets/photos/jaw-{yellow,white}{,-wide}.webp`, `assets/photos/doctor.jpg`, `assets/photos/ai/shade-steps.webp`, `assets/photos/ai/smile.webp`, `assets/fonts/source-serif-4-normal-latin{,-ext}.woff2`, `tools/stage-test.html`, `tools/shoot-hero.mjs`, `tools/compress-model.mjs`, `tools/css-prune.mjs`.

---

### Task 1: The bleaching timeline (pure)

**Files:**
- Create: `js/bleach-timeline.js`
- Test: `tests/bleach-timeline.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (exact names, used by Tasks 2, 4):
  - `STEP_COUNT = 5`, `SHADES: string[6]` (`'A3.5','A3','A2','A1','B1','BL4'`), `SWATCHES: string[6]` (hex), `SHADE_TINTS: number[6][3]`
  - `smooth(x) → number`, `stepProgress(step, local) → number`, `stepAt(p) → 0..4`, `stepAnchor(step) → number`, `cameraAt(p) → {close, az, el, zoom}`
  - `sampleBleach(p) → { progress, step, camera, shade (0..1), shadeCode, barrier (0..1), gel (0..1) }`
  - `shadeCode(shade) → string`, `swatchAt(shade) → 'rgb(r g b)'`, `tintAt(shade, out=[0,0,0]) → out`

- [ ] **Step 1: Check the tree and write the failing test**

Run: `git status --short .` (note anything not yours), then create `tests/bleach-timeline.test.mjs`:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  STEP_COUNT, SHADES, sampleBleach, stepAt, stepAnchor, stepProgress, shadeCode, swatchAt, tintAt,
} from '../js/bleach-timeline.js';

const at = (k, local) => sampleBleach(stepProgress(k, local));

test('starts yellow and untouched, ends white and clean, facing front both times', () => {
  const s = sampleBleach(0);
  assert.equal(s.step, 0);
  assert.equal(s.shade, 0);
  assert.equal(s.shadeCode, 'A3.5');
  assert.equal(s.barrier, 0);
  assert.equal(s.gel, 0);
  assert.equal(s.camera.az, 0);
  const e = sampleBleach(1);
  assert.equal(e.step, STEP_COUNT - 1);
  assert.equal(e.shade, 1);
  assert.equal(e.shadeCode, 'BL4');
  assert.equal(e.barrier, 0);
  assert.equal(e.gel, 0);
  assert.equal(e.camera.az, 0);
});

test('each step does its own work', () => {
  assert.ok(at(1, 0.9).barrier > 0.99, 'barrier on by the end of step 2');
  assert.equal(at(1, 0.9).gel, 0, 'no gel yet in step 2');
  assert.ok(at(2, 0.9).gel > 0.99, 'gel on by the end of step 3');
  assert.equal(at(2, 0.9).shade, 0, 'no lightening before the gel works');
  const working = at(3, 0.9);
  assert.equal(working.shadeCode, 'B1');
  assert.ok(working.gel > 0.99 && working.barrier > 0.99, 'gel and barrier stay on while it works');
  const done = at(4, 0.7);
  assert.equal(done.shadeCode, 'BL4');
  assert.equal(done.gel, 0);
  assert.equal(done.barrier, 0);
});

test('values stay in range; step and shade never run backwards', () => {
  let prev = sampleBleach(0);
  for (let i = 1; i <= 2000; i++) {
    const s = sampleBleach(i / 2000);
    for (const k of ['shade', 'barrier', 'gel']) assert.ok(s[k] >= 0 && s[k] <= 1, `${k} out of range at ${i}`);
    assert.ok(s.step >= prev.step, `step went back at ${i}`);
    assert.ok(s.shade >= prev.shade - 1e-12, `shade went back at ${i}`);
    prev = s;
  }
});

test('the readout walks the scale in order', () => {
  const seen = [];
  for (let i = 0; i <= 2000; i++) {
    const c = sampleBleach(i / 2000).shadeCode;
    if (seen.at(-1) !== c) seen.push(c);
  }
  assert.deepEqual(seen, SHADES);
});

test('each dot lands inside its own step, in order', () => {
  assert.equal(stepAnchor(0), 0);
  let last = -1;
  for (let k = 0; k < STEP_COUNT; k++) {
    const p = stepAnchor(k);
    assert.equal(stepAt(p), k, `anchor ${k} is in step ${stepAt(p)}`);
    assert.ok(p > last);
    last = p;
  }
});

test('out-of-range and broken input is clamped, never NaN', () => {
  assert.deepEqual(sampleBleach(-1), sampleBleach(0));
  assert.deepEqual(sampleBleach(2), sampleBleach(1));
  assert.deepEqual(sampleBleach(NaN), sampleBleach(0));
  assert.deepEqual(sampleBleach(0.37), sampleBleach(0.37), 'pure: same input, same output');
});

test('swatches and tints interpolate between their stops', () => {
  assert.equal(swatchAt(0), 'rgb(214 187 134)');
  assert.equal(swatchAt(1), 'rgb(247 244 236)');
  const out = [0, 0, 0];
  assert.equal(tintAt(1, out), out, 'writes into the array it is given');
  [1.05, 1.08, 1.17].forEach((v, k) => assert.ok(Math.abs(out[k] - v) < 1e-12));
  assert.equal(shadeCode(0.5), 'A1');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/bleach-timeline.test.mjs`
Expected: FAIL — `Cannot find module …/js/bleach-timeline.js`.

- [ ] **Step 3: Write the timeline**

Create `js/bleach-timeline.js`:

```js
// The bleaching treatment as a pure function of playback progress (0..1).
// No three.js here: the section script, the 3D rig, the stills tool and the
// tests all read the same numbers, so any progress (held playback, a step
// dot) looks the same everywhere.
//
// Five steps share the progress; the gel working (step 4) gets the most
// time. Inside each step the action runs over roughly its first 80 % and the
// rest holds, so the caption can be read while the teeth stand still.

export const STEP_COUNT = 5;
// The page's own simplified scale; the readout walks it in this order.
export const SHADES = ['A3.5', 'A3', 'A2', 'A1', 'B1', 'BL4'];
// The readout chip's swatch per shade (sRGB).
export const SWATCHES = ['#d6bb86', '#dcc596', '#e3d1ac', '#eadcc0', '#f0e8d6', '#f7f4ec'];
// RGB multipliers for the model's enamel: it multiplies the crowns' warm
// cream vertex colour. The last one is the veneer page's "whitened".
// Tuned by eye in Task 2 against tools/shots/bleach-p*.webp.
export const SHADE_TINTS = [
  [0.98, 0.84, 0.6], [0.99, 0.87, 0.66], [1.0, 0.9, 0.72], [1.01, 0.94, 0.8], [1.02, 0.99, 0.92], [1.05, 1.08, 1.17],
];

// NaN and anything out of range land on 0 or 1
const clamp01 = (x) => (x > 0 ? (x < 1 ? x : 1) : 0);
export const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const ramp = (x, a, b) => clamp01((x - a) / (b - a));

// share of the playback per step: measure, barrier, gel on, gel works, result
const STEP_WEIGHTS = [0.8, 0.9, 0.9, 1.8, 1.2];
const TOTAL = STEP_WEIGHTS.reduce((a, b) => a + b, 0);
const STARTS = STEP_WEIGHTS.map((_, i) => STEP_WEIGHTS.slice(0, i).reduce((a, b) => a + b, 0));

/** Overall progress at `local` (0..1) of the way through `step`. */
export function stepProgress(step, local) {
  return step >= STEP_COUNT ? 1 : (STARTS[step] + local * STEP_WEIGHTS[step]) / TOTAL;
}
const at = stepProgress;

export function stepAt(p) {
  const x = clamp01(p) * TOTAL + 1e-9;
  let k = 0;
  while (k < STEP_COUNT - 1 && x >= STARTS[k + 1]) k++;
  return k;
}

/** Where a step dot takes the playhead: the moment that step's action has finished. */
export function stepAnchor(step) {
  if (step <= 0) return 0;
  return at(step, step === STEP_COUNT - 1 ? 0.7 : 0.85);
}

// Camera keys: `close` 0 = both arches, 1 = the six upper front teeth;
// az/el in degrees (az > 0 swings to the visitor's right); zoom < 1 = nearer.
// Frontal at both ends, so start and result compare head-on.
const CAMERA_KEYS = [
  { p: 0, close: 0.15, az: 0, el: 4, zoom: 1 },
  { p: at(1, 0.9), close: 0.15, az: 0, el: 4, zoom: 1 },
  { p: at(2, 0.5), close: 0.55, az: 0, el: 3, zoom: 1 },
  { p: at(3, 0.45), close: 0.55, az: 12, el: 4, zoom: 1 },
  { p: at(3, 0.95), close: 0.5, az: 0, el: 3, zoom: 1 },
  { p: at(4, 0.5), close: 0.15, az: 0, el: 4, zoom: 0.96 },
  { p: 1, close: 0.15, az: 0, el: 4, zoom: 0.96 },
];

export function cameraAt(p) {
  const x = clamp01(p);
  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && x > CAMERA_KEYS[i + 1].p) i++;
  const a = CAMERA_KEYS[i], b = CAMERA_KEYS[i + 1];
  const t = smooth(ramp(x, a.p, b.p));
  const mix = (k) => a[k] + (b[k] - a[k]) * t;
  return { close: mix('close'), az: mix('az'), el: mix('el'), zoom: mix('zoom') };
}

export const shadeCode = (shade) => SHADES[Math.round(clamp01(shade) * (SHADES.length - 1))];

// The gel lightens A3.5 → B1 in step 4; the final measurement shows BL4 once
// the gel is off in step 5.
const LIGHTEN_TO = (SHADES.length - 2) / (SHADES.length - 1);

export function sampleBleach(p) {
  const x = clamp01(p);
  const lighten = smooth(ramp(x, at(3, 0.1), at(3, 0.85)));
  const settle = smooth(ramp(x, at(4, 0.3), at(4, 0.6)));
  const shade = clamp01(LIGHTEN_TO * lighten + (1 - LIGHTEN_TO) * settle);
  const barrierOn = smooth(ramp(x, at(1, 0.1), at(1, 0.8)));
  const barrierOff = smooth(ramp(x, at(4, 0.2), at(4, 0.45)));
  const gelOn = smooth(ramp(x, at(2, 0.1), at(2, 0.8)));
  const gelOff = smooth(ramp(x, at(4, 0.05), at(4, 0.3)));
  return {
    progress: x,
    step: stepAt(x),
    camera: cameraAt(x),
    shade,
    shadeCode: shadeCode(shade),
    barrier: barrierOn * (1 - barrierOff),
    gel: gelOn * (1 - gelOff),
  };
}

const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));

/** The readout's swatch colour at a shade value, as a CSS colour. */
export function swatchAt(shade) {
  const t = clamp01(shade) * (SWATCHES.length - 1);
  const i = Math.min(Math.floor(t), SWATCHES.length - 2), f = t - i;
  const a = hex(SWATCHES[i]), b = hex(SWATCHES[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(' ')})`;
}

/** The enamel multiplier at a shade value, written into `out` (no allocation). */
export function tintAt(shade, out = [0, 0, 0]) {
  const t = clamp01(shade) * (SHADE_TINTS.length - 1);
  const i = Math.min(Math.floor(t), SHADE_TINTS.length - 2), f = t - i;
  const a = SHADE_TINTS[i], b = SHADE_TINTS[i + 1];
  for (let k = 0; k < 3; k++) out[k] = a[k] + (b[k] - a[k]) * f;
  return out;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/bleach-timeline.test.mjs`
Expected: `pass 7`, `fail 0`.

- [ ] **Step 5: Checkpoint (no git)**

Run: `git status --short .` — expect `?? js/bleach-timeline.js`, `?? tests/`. Do not commit.

---

### Task 2: The 3D rig and stage on the dentition model

**Files:**
- Copy: `../veneer-webpage/assets/models/dentition.glb` → `assets/models/dentition.glb`
- Create: `js/src/bleach-rig.js`, `js/src/bleach-stage.js`
- Create (built): `js/bleach-stage.js`
- Modify: `tools/build-3d.mjs`
- Rewrite: `tools/render-teeth.mjs`
- Test: `tests/bleach-rig.test.mjs`

**Interfaces:**
- Consumes: `tintAt`, `sampleBleach` from Task 1.
- Produces:
  - `gumDistances(gum: Float32Array, crowns: Float32Array[], cap: number) → Float32Array` (exported from `js/src/bleach-rig.js`)
  - `buildBleachRig(T, gltfScene) → { root, frames: { wide: {center, size}, close: {center, size} }, apply(state), showAll() }` where `T = { Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils }`
  - `createBleachStage({ canvas, modelUrl }) → Promise<{ render(p), resize(), still(p, w, h) → 'data:image/webp;…' }>` — exported by the bundle `js/bleach-stage.js`
  - `node tools/render-teeth.mjs [--stills]`

- [ ] **Step 1: Write the failing rig test**

Create `tests/bleach-rig.test.mjs`:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gumDistances } from '../js/src/bleach-rig.js';

test('gumDistances finds the nearest crown point and caps the rest', () => {
  const gum = new Float32Array([0, 0, 0, 10, 0, 0, 0, 5, 0]);
  const crowns = [new Float32Array([1, 0, 0, 0, 0, 2]), new Float32Array([0, 4, 0])];
  assert.deepEqual([...gumDistances(gum, crowns, 3)].map((d) => +d.toFixed(4)), [1, 3, 1]);
});

test('gumDistances looks across cell borders and below zero', () => {
  const d = gumDistances(new Float32Array([-0.1, -0.1, -0.1]), [new Float32Array([0.1, 0.1, 0.1])], 2.6);
  assert.ok(Math.abs(d[0] - Math.sqrt(0.12)) < 1e-6, String(d[0]));
});

test('gumDistances with no crowns returns the cap everywhere', () => {
  assert.deepEqual([...gumDistances(new Float32Array([5, 5, 5, -5, 0, 1]), [], 2.6)].map((d) => +d.toFixed(4)), [2.6, 2.6]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test tests/bleach-rig.test.mjs`
Expected: FAIL — `Cannot find module …/js/src/bleach-rig.js`.

- [ ] **Step 3: Write the rig**

Create `js/src/bleach-rig.js`:

```js
// The dentition as a stage for the bleaching treatment.
//
// Takes the loaded assets/models/dentition.glb (the veneer page's model: 32
// real crowns, both gums, a hinge for the bite) and adds what the story
// needs without changing any tooth's shape — bleaching changes colour only:
//   enamel   every crown shares one material; its colour multiplies the
//            crowns' warm vertex colour, from a natural A3.5 to BL4
//   barrier  a blue band along the gum line, drawn in the gum shader from a
//            per-vertex distance to the nearest crown (computed once here)
//   gel      a glossy mint coat over the visible teeth (15–25, 35–45),
//            pushed out along the normals so it stands on the enamel
// apply(state) takes sampleBleach() output and sets every piece; it never
// allocates. three.js classes come in as `T`, so this file imports nothing
// but the timeline (the node tests import it directly).
// Units are millimetres (the model's own), +z towards the visitor.
import { tintAt } from '../bleach-timeline.js';

const BITE_OPEN_DEG = 2.4;   // the source opens the jaw 10°; a smile shows a sliver
const BARRIER = 0x3f86c6;    // the light-cured gum protection
const GEL = 0x86d6bd;        // mint, clearly apart from the blue barrier
const BAND = 2.6;            // mm of gum next to the teeth that the barrier covers
const GEL_THICK = 0.22;      // mm the gel stands proud of the enamel
const GEL_TEETH = /^tooth_[1-4][1-5]_.*_crown$/;
const CLOSE_TEETH = ['13', '12', '11', '21', '22', '23'];
const WIDE_TEETH = ['15', '14', '13', '12', '11', '21', '22', '23', '24', '25',
  '45', '44', '43', '42', '41', '31', '32', '33', '34', '35'];

/** For each gum vertex (flat xyz, mm) the distance to the nearest point of
 *  `crowns` (flat xyz arrays), capped at `cap`. A spatial hash with
 *  cap-sized cells keeps the search to the 27 neighbouring cells. */
export function gumDistances(gum, crowns, cap) {
  const cell = (v) => Math.floor(v / cap);
  const key = (x, y, z) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
  const grid = new Map();
  for (const c of crowns) {
    for (let i = 0; i < c.length; i += 3) {
      const k = key(cell(c[i]), cell(c[i + 1]), cell(c[i + 2]));
      let list = grid.get(k);
      if (!list) grid.set(k, (list = []));
      list.push(c[i], c[i + 1], c[i + 2]);
    }
  }
  const out = new Float32Array(gum.length / 3);
  for (let i = 0, n = 0; i < gum.length; i += 3, n++) {
    const x = gum[i], y = gum[i + 1], z = gum[i + 2];
    const cx = cell(x), cy = cell(y), cz = cell(z);
    let best = cap * cap;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const list = grid.get(key(cx + dx, cy + dy, cz + dz));
      if (!list) continue;
      for (let j = 0; j < list.length; j += 3) {
        const ex = list[j] - x, ey = list[j + 1] - y, ez = list[j + 2] - z;
        const d = ex * ex + ey * ey + ez * ez;
        if (d < best) best = d;
      }
    }
    out[n] = Math.sqrt(best);
  }
  return out;
}

/** A mesh's vertex positions in world space (mm), as a flat array. */
function worldPositions(T, mesh) {
  const a = mesh.geometry.getAttribute('position');
  const v = new T.Vector3();
  const out = new Float32Array(a.count * 3);
  for (let i = 0; i < a.count; i++) {
    v.fromBufferAttribute(a, i).applyMatrix4(mesh.matrixWorld);
    out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z;
  }
  return out;
}

// the gums' own material, plus a band of barrier blue where aTooth < BAND
function barrierMaterial(T, base) {
  const m = base.clone();
  m.userData.u = { uBarrier: { value: 0 }, uBarrierColor: { value: new T.Color(BARRIER) }, uBand: { value: BAND } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aTooth;\nvarying float vTooth;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTooth = aTooth;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vTooth;\nuniform float uBarrier, uBand;\nuniform vec3 uBarrierColor;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float bandM = 1.0 - smoothstep(uBand * 0.7, uBand, vTooth);
        diffuseColor.rgb = mix(diffuseColor.rgb, uBarrierColor, bandM * uBarrier);`);
  };
  m.customProgramCacheKey = () => 'bleach-barrier';
  return m;
}

// a glossy mint layer, pushed out along the normals and denser at the edges
// (where a real gel layer is seen at a slant) so it reads as a coating
function gelMaterial(T) {
  const m = new T.MeshPhysicalMaterial({
    color: GEL, transparent: true, opacity: 0, depthWrite: false,
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  });
  m.userData.u = { uThick: { value: GEL_THICK } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThick;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(objectNormal) * (uThick / length(modelMatrix[0].xyz));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <opaque_fragment>', `float gelEdge = 1.0 - abs(dot(normalize(vViewPosition), normal));
        diffuseColor.a = clamp(diffuseColor.a * (0.8 + 1.8 * gelEdge * gelEdge), 0.0, 0.95);
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'bleach-gel';
  return m;
}

export function buildBleachRig(T, gltfScene) {
  const root = gltfScene.getObjectByName('human_dentition');
  root.scale.setScalar(1);                       // work in millimetres
  const hinge = gltfScene.getObjectByName('maxillary_hinge');
  hinge.rotation.x = -T.MathUtils.degToRad(BITE_OPEN_DEG);
  gltfScene.updateMatrixWorld(true);

  const crowns = [], gums = {};
  gltfScene.traverse((o) => {
    if (!o.isMesh) return;
    if (/_crown$/.test(o.name)) crowns.push(o);
    else if (o.name === 'maxillary_gingiva') gums.upper = o;
    else if (o.name === 'mandibular_gingiva') gums.lower = o;
  });
  if (!crowns.length || !gums.upper || !gums.lower) throw new Error('dentition.glb: crowns or gums missing');
  const fdi = (o) => /^tooth_(\d\d)_/.exec(o.name)[1];

  // every crown shares the enamel material as authored
  const enamel = crowns[0].material;

  // the barrier band: each gum measured against its own arch's crowns
  const barrier = barrierMaterial(T, gums.upper.material);
  for (const [gum, arch] of [[gums.upper, /^[12]/], [gums.lower, /^[34]/]]) {
    const near = crowns.filter((c) => arch.test(fdi(c))).map((c) => worldPositions(T, c));
    gum.geometry.setAttribute('aTooth', new T.BufferAttribute(gumDistances(worldPositions(T, gum), near, BAND), 1));
    gum.material = barrier;
  }

  // the gel: an overlay on each visible tooth, sharing its crown's geometry
  const gelMat = gelMaterial(T);
  const gels = crowns.filter((c) => GEL_TEETH.test(c.name)).map((c) => {
    const g = new T.Mesh(c.geometry, gelMat);
    g.renderOrder = 2;
    g.visible = false;
    c.add(g);
    return g;
  });

  const measure = (objects) => {
    const box = new T.Box3();
    objects.forEach((o) => box.expandByObject(o));
    return { center: box.getCenter(new T.Vector3()), size: box.getSize(new T.Vector3()) };
  };
  const pick = (ids) => crowns.filter((c) => ids.includes(fdi(c)));
  const frames = { close: measure(pick(CLOSE_TEETH)), wide: measure(pick(WIDE_TEETH)) };

  const tint = [0, 0, 0];
  function apply(s) {
    tintAt(s.shade, tint);
    enamel.color.setRGB(tint[0], tint[1], tint[2]);
    barrier.userData.u.uBarrier.value = s.barrier;
    gelMat.opacity = 0.42 * s.gel;
    const on = s.gel > 0.01;
    for (const g of gels) g.visible = on;
  }

  /** Make every piece visible once, so all shaders compile up front. */
  function showAll() { for (const g of gels) g.visible = true; }

  return { root, frames, apply, showAll };
}
```

- [ ] **Step 4: Run the rig test to verify it passes**

Run: `node --test tests/`
Expected: `pass 10`, `fail 0` (7 timeline + 3 rig).

- [ ] **Step 5: Write the stage**

Create `js/src/bleach-stage.js`:

```js
// The 3D stage of the treatment section: renderer, light, camera and the
// bleaching rig on the real dentition. It never runs a loop of its own;
// js/treatment-section.js calls render(progress) when the playhead moves or
// the canvas resizes, so an idle page costs nothing. Bundled with three.js
// into js/bleach-stage.js by tools/build-3d.mjs. Adapted from the veneer
// page's js/veneer-procedure.js.
import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, PMREMGenerator, SRGBColorSpace, NeutralToneMapping,
  Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBleachRig } from './bleach-rig.js';
import { sampleBleach } from '../bleach-timeline.js';

const FOV = 24;
// air around the framed teeth, [width, height]; the gums run out of frame
// and fade with the canvas mask, so the view reads as a smile, not a model
const PAD = { wide: [1.24, 1.62], close: [1.16, 2.0] };

export async function createBleachStage({ canvas, modelUrl }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.85;
  const key = new DirectionalLight(0xfff1e2, 1.6);
  key.position.set(-35, 55, 100);
  const fill = new DirectionalLight(0xe8ecf2, 0.45);
  fill.position.set(70, 10, 30);
  scene.add(key, fill);

  const camera = new PerspectiveCamera(FOV, 1, 5, 1500);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  scene.add(gltf.scene);
  const rig = buildBleachRig({ Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils }, gltf.scene);

  const centre = new Vector3(), size = new Vector3(), dir = new Vector3();
  const tanHalf = Math.tan(MathUtils.degToRad(FOV / 2));
  function place(c) {
    const { wide, close } = rig.frames;
    centre.lerpVectors(wide.center, close.center, c.close);
    size.lerpVectors(wide.size, close.size, c.close);
    const padW = PAD.wide[0] + (PAD.close[0] - PAD.wide[0]) * c.close;
    const padH = PAD.wide[1] + (PAD.close[1] - PAD.wide[1]) * c.close;
    const fit = Math.max((size.y * padH) / 2 / tanHalf, (size.x * padW) / 2 / (tanHalf * camera.aspect));
    const az = MathUtils.degToRad(c.az), el = MathUtils.degToRad(c.el);
    // turned to the side, the near teeth loom larger; aim a little towards them
    centre.x += Math.sin(az) * size.x * 0.25;
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(centre).addScaledVector(dir, fit * c.zoom + size.z / 2);
    camera.lookAt(centre);
  }

  function draw(p) {
    const s = sampleBleach(p);
    rig.apply(s);
    place(s.camera);
    renderer.render(scene, camera);
  }

  function fit(width, height, ratio) {
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    // sharp on phones, but at most ~2.4 million pixels on large screens
    fit(w, h, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (w * h))));
    return true;
  }

  // compile every shader now, with all pieces visible, instead of stalling
  // the first time the gel appears
  resize();
  rig.showAll();
  place(sampleBleach(0).camera);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);

  let last = 0;
  return {
    render(p) { last = p; draw(p); },
    resize() { if (resize()) draw(last); },
    /** One frame at a fixed size as a WebP data URL (tools/render-teeth.mjs). */
    still(p, width, height) {
      fit(width, height, 1);
      draw(p);
      const url = canvas.toDataURL('image/webp', 0.86);
      resize();
      draw(last);
      return url;
    },
  };
}
```

- [ ] **Step 6: Point the build at the new stage and build it**

In `tools/build-3d.mjs`:
- change the first two comment lines to `// Bundle the treatment's 3D stage (js/src/bleach-stage.js, its rig and the` / `// timeline) with three.js into one minified module, js/bleach-stage.js.`;
- replace `const out = path.join(root, 'js/teeth-stage.js');` with `const out = path.join(root, 'js/bleach-stage.js');`;
- replace `  entryPoints: [path.join(root, 'js/src/teeth-stage.js')],` with `  entryPoints: [path.join(root, 'js/src/bleach-stage.js')],`;
- in the `banner`, replace `AIXSMILE bleaching hero: 3D jaw. Built from js/src/teeth-stage.js` with `AIXSMILE bleaching: the treatment in 3D. Built from js/src/bleach-stage.js`;
- if the final `console.log` names `js/teeth-stage.js`, make it `js/bleach-stage.js`.

Then copy the model and build:

```bash
cp ../veneer-webpage/assets/models/dentition.glb assets/models/dentition.glb
node tools/build-3d.mjs
grep -c 'from"three"\|from "three"' js/bleach-stage.js || true
```
Expected: a size line for `js/bleach-stage.js` around 600 KB raw / 160–180 KB gzip; the grep prints `0` (self-contained bundle, no bare imports).

- [ ] **Step 7: Rewrite the render tool as a harness**

Replace `tools/render-teeth.mjs` completely:

```js
// Render the treatment's 3D (js/bleach-stage.js + assets/models/dentition.glb)
// without the page: a tiny harness page on the same origin imports the
// bundle and calls still(p, w, h).
//   node tools/render-teeth.mjs            test frames along the treatment, tools/shots/bleach-p*.webp
//   node tools/render-teeth.mjs --stills   the five step stills, assets/treatment/step-N.webp
// Re-run --stills after changing the model, the rig or the timeline.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, loadPageModule } from './lib.mjs';

const stills = process.argv.includes('--stills');
const { STEP_COUNT, stepAnchor } = await loadPageModule('js/bleach-timeline.js');
const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0c0d">
<canvas id="c" style="width:600px;height:600px;display:block"></canvas>
<script type="module">
  import { createBleachStage } from './js/bleach-stage.js';
  window.stage = await createBleachStage({ canvas: document.getElementById('c'), modelUrl: './assets/models/dentition.glb' });
  window.ready = true;
</script>`;

const srv = await serve();
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/__harness.html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: HARNESS }));
  await page.goto(`${srv.url}__harness.html`);
  await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  const shoot = (p, w, h) => page.evaluate(([q, x, y]) => window.stage.still(q, x, y), [p, w, h]);
  const save = (file, url) => {
    if (!url || !url.startsWith('data:image/webp')) throw new Error(`${file}: no WebP from the canvas`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  };
  if (stills) {
    const dir = path.join(ROOT, 'assets', 'treatment');
    fs.mkdirSync(dir, { recursive: true });
    for (let k = 0; k < STEP_COUNT; k++) {
      const file = path.join(dir, `step-${k + 1}.webp`);
      save(file, await shoot(stepAnchor(k), 1200, 1200));
      console.log(path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + ' KB');
    }
  } else {
    const dir = path.join(ROOT, 'tools', 'shots');
    fs.mkdirSync(dir, { recursive: true });
    for (const p of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]) save(path.join(dir, `bleach-p${Math.round(p * 100)}.webp`), await shoot(p, 800, 800));
    console.log('frames in tools/shots/bleach-p*.webp');
  }
  if (errors.length) { console.log('page errors:\n' + errors.join('\n')); process.exitCode = 1; }
} finally {
  await browser.close();
  await srv.close();
}
```

- [ ] **Step 8: Render test frames and look at them**

Run: `node tools/render-teeth.mjs` (takes 1–3 minutes under SwiftShader).
Expected: `frames in tools/shots/bleach-p*.webp`, no `page errors`.

Open each frame (Read tool) and check, fixing constants and re-running until all hold:
- `p0`: both arches frontal, teeth fill about 70 % of the width, nothing clipped; a natural warm yellow (compare with `assets/photos/ai/stain-coffee.webp`), not mustard. Adjust `SHADE_TINTS[0..1]` in `js/bleach-timeline.js`.
- `p15`/`p30`: a clearly blue band only along the gum line of both arches, not over the whole gum. Adjust `BAND` or `BARRIER` in the rig.
- `p45`/`p60`: a glossy mint coat on the visible teeth, camera closer, slight turn. Adjust `GEL_THICK`, the `0.42` opacity factor, or the camera keys.
- `p100`: frontal, natural white with no blue cast, gel and barrier gone. Adjust `SHADE_TINTS[4..5]`.

After any change to `js/src/*` or `js/bleach-timeline.js`: `node tools/build-3d.mjs && node tools/render-teeth.mjs`, and `node --test tests/` must still pass (the swatch/tint test pins the first and last swatch and the last tint; update that test together with those three values if you change them).

- [ ] **Step 9: Checkpoint (no git)**

Run: `node --test tests/ && git status --short . && git status --short ../veneer-webpage`
Expected: tests pass; new files `assets/models/dentition.glb`, `js/src/bleach-*.js`, `js/bleach-stage.js`, `tests/bleach-rig.test.mjs`; modified `tools/build-3d.mjs`, `tools/render-teeth.mjs`; veneer clean. Do not commit.

---

### Task 3: Visual foundation — tokens, type, buttons, header, fonts

**Files:**
- Modify: `index.html` (`<head>` links and meta, the `:root` block, Type, Buttons, Header, splash, section tone classes)
- Modify: `assets/fonts/fonts.css`, `tools/shoot.mjs`
- Delete: `assets/fonts/source-serif-4-normal-latin.woff2`, `assets/fonts/source-serif-4-normal-latin-ext.woff2`

**Interfaces:**
- Produces CSS tokens every later task uses: `--night`, `--night-2`, `--cream`, `--stone`, `--paper` (= cream), `--paper-2`, `--ink`, `--text`, `--soft`, `--bronze`, `--bronze-hover`, `--bronze-ink`, `--bronze-light`, `--bronze-tint`, `--line`, `--line-strong`, `--serif`, `--sans`, `--hdr`, `--gutter`, `--ease`, and the band classes `.tone-night`, `.tone-stone` (cream is the default).
- `node tools/shoot.mjs [outDir]` screenshots every `main > section[id]` plus top and footer.

- [ ] **Step 1: Back up and record the baseline**

```bash
git status --short .
mkdir -p $SCRATCH/backup && cp index.html js/i18n.js tools/check-page.mjs tools/lib.mjs tools/shoot.mjs tools/check-contrast.mjs README.md $SCRATCH/backup/
node -e "const h=require('fs').readFileSync('index.html','utf8');const m=h.slice(h.indexOf('<main'),h.indexOf('</main>'));const t=m.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/g,' ');console.log('words in main:',t.split(/\s+/).filter(w=>/\p{L}/u.test(w)).length)"
```
Write the word count down; Task 12 compares against it.

- [ ] **Step 2: Replace the tokens**

In `index.html`, replace the whole block from `  /* Porcelain white, ice-blue surfaces, one mineral-teal accent; a single` down to and including the line `  .tone-ice, .tone-navy { background: var(--bg); color: var(--text); }` with:

```css
  /* Dark editorial with bronze, after the client's own mock of this page
     (redesign 2026-09-28): near-black bands, warm cream and stone sections,
     bronze buttons, headings in the veneer page's serif with one italic
     phrase. Figtree for everything else. Nothing moves on scroll. */
  :root {
    --night: #0b0c0d; --night-2: #15171a;
    --cream: #f8f7f5; --stone: #efebe4; --paper: var(--cream); --paper-2: #f3efe8;
    --ink: #17181a; --text: #3d3a35; --soft: #6a645b;
    --bronze: #806a48; --bronze-hover: #6e5b3d; --bronze-ink: #7a6444; --bronze-light: #c9b08a; --bronze-tint: #efe8dc;
    --line: rgba(23, 24, 26, .13); --line-strong: rgba(23, 24, 26, .3);
    --wordmark: var(--bronze-light);
    --serif: 'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif;
    --sans: 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --hdr: 64px; --gutter: clamp(20px, 5vw, 88px); --ease: cubic-bezier(.2, .7, .2, 1);
    --bg: var(--cream); --heading: var(--ink); --accent: var(--bronze-ink); --accent-hover: var(--bronze-hover);
    --btn-bg: var(--bronze); --btn-fg: #fff; --btn-hover: var(--bronze-hover);
  }
  .tone-stone { --bg: var(--stone); }
  .tone-night { --bg: var(--night); --heading: #f3efe8; --text: #c9c2b7; --soft: #a39b8f;
    --accent: var(--bronze-light); --accent-hover: #e0cba8; --line: rgba(243, 239, 232, .14); --line-strong: rgba(243, 239, 232, .32);
    --btn-bg: var(--bronze); --btn-fg: #fff; --btn-hover: var(--bronze-hover); }
  .tone-stone, .tone-night { background: var(--bg); color: var(--text); }
```

- [ ] **Step 3: Map the old colours in one pass**

Run (writes `index.html` in place; prints how many of each it replaced):

```bash
node -e "
const fs=require('fs');let h=fs.readFileSync('index.html','utf8');
const map=[['var(--teal-hover)','var(--bronze-hover)'],['var(--teal-tint)','var(--bronze-tint)'],['var(--teal)','var(--bronze)'],
['var(--ice-2)','var(--stone)'],['var(--ice)','var(--stone)'],['var(--navy-2)','var(--night-2)'],['var(--navy)','var(--night)'],
['%230f6b78','%23806a48'],['#0f6b78','#806a48'],['#0a5561','#6e5b3d'],['#7fd0dc','#c9b08a'],['rgba(15, 107, 120,','rgba(128, 106, 72,'],
['#dcebee','#efe8dc'],['#eef3f4','#f3efe8'],['#e6f0f2','#efebe4'],['#f4f7f8','#f3efe8'],
['rgba(16, 32, 42,','rgba(23, 24, 26,'],['rgba(14, 27, 38,','rgba(11, 12, 13,'],['rgba(251, 251, 249,','rgba(11, 12, 13,'],
['class=\"section tone-ice','class=\"section tone-stone'],['class=\"section tone-navy','class=\"section tone-night'],['<footer class=\"tone-navy\">','<footer class=\"tone-night\">']];
for(const [a,b] of map){const n=h.split(a).length-1;h=h.split(a).join(b);console.log(n,a);}
fs.writeFileSync('index.html',h);"
grep -nE 'teal|--ice|navy|#0f6b78|16, 32, 42' index.html
```
Expected: the last grep prints nothing, or only comment lines — reword those comments by hand.

- [ ] **Step 4: Type, eyebrows, buttons**

Replace the Type block (from `  /* ===== Type ===== */` to the line `  .sectionHead > :last-child { margin-bottom: 0; }`) with:

```css
  /* ===== Type ===== */
  h1, h2, h3 { font-family: var(--serif); font-weight: 400; color: var(--heading); text-wrap: balance; margin: 0; }
  h1 { font-size: clamp(40px, 4.6vw, 66px); line-height: 1.04; letter-spacing: -.02em; }
  h2 { font-size: clamp(30px, 3.2vw, 46px); line-height: 1.1; letter-spacing: -.015em; margin-bottom: 20px; }
  h3 { font-size: 22px; line-height: 1.25; }
  h1 em, h2 em { font-style: italic; }
  p { margin: 0 0 16px; text-wrap: pretty; }
  .eyebrow { margin: 0 0 16px; font-size: 12px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; color: var(--accent); }
  .lede { max-width: 38rem; font-size: 18px; line-height: 1.55; color: var(--text); }
  .sectionHead { max-width: 44rem; margin: 0 0 clamp(32px, 4vw, 52px); }
  .sectionHead > :last-child { margin-bottom: 0; }
```

In the Buttons block change `border-radius: 12px;` (in `.btn`) to `border-radius: 3px;` and `border-radius: 10px;` (in `.btnSm`) to `border-radius: 3px;`.

- [ ] **Step 5: Dark header, splash, phone bar**

In the markup:
- `<header class="top" id="top">` → `<header class="top tone-night" id="top">`
- `<nav class="mbar" id="mbar"` → `<nav class="mbar tone-night" id="mbar"`

Insert right after the Header block's `.brandSwoosh { … }` line:

```css
  /* the header is dark over every band, like the client's mock; its language pill is light */
  .top .langToggle::before { background: #f3efe8; }
  .top .langToggle[data-active="de"] span[data-lang="de"], .top .langToggle[data-active="en"] span[data-lang="en"] { color: var(--ink); }
```

In the splash rules change `background: var(--paper);` (in `.splash`) to `background: var(--night);` and `color: var(--soft);` (in `.splashText`) to `color: #a39b8f;`. Change `<meta name="theme-color" content="#17151a">` to `<meta name="theme-color" content="#0b0c0d">`.

- [ ] **Step 6: Drop Source Serif 4**

- Delete the line `<link rel="preload" href="assets/fonts/source-serif-4-normal-latin.woff2" as="font" type="font/woff2" crossorigin>` from `index.html`.
- In `assets/fonts/fonts.css` remove both `@font-face { font-family: 'Source Serif 4'; … }` blocks and replace the header comment with:
  `/* Figtree (text), self-hosted so no visitor IP reaches Google (GDPR). Headings use the system serif stack (Iowan Old Style, Palatino, Georgia). Figtree is a variable font, SIL Open Font License 1.1, fetched once from Google Fonts (2026-09-24). */`
- `rm assets/fonts/source-serif-4-normal-latin.woff2 assets/fonts/source-serif-4-normal-latin-ext.woff2`

- [ ] **Step 7: Screenshot every section, ids from the page**

In `tools/shoot.mjs` delete the `const SECTIONS = [...]` line and replace the loop head

```js
    for (const [i, id] of SECTIONS.entries()) {
```
with
```js
    const SECTIONS = await page.evaluate(() => ['top', ...[...document.querySelectorAll('main > section[id]')].map((s) => s.id), 'footer']);
    for (const [i, id] of SECTIONS.entries()) {
```

- [ ] **Step 8: Verify**

```bash
node tools/check-contrast.mjs
node tools/check-page.mjs
npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t3
```
Expected: contrast PASS (if a bronze or soft value fails, darken it slightly in `:root`/`.tone-night` and re-run); check-page all PASS; html-validate no errors; the shots show a dark header, bronze buttons, serif headings, cream/stone/night bands. Look at the laptop hero and one phone section.

- [ ] **Step 9: Checkpoint (no git)**

`git status --short . && git status --short ../veneer-webpage` — expected: `index.html`, `assets/fonts/fonts.css`, `tools/shoot.mjs` modified; two font files deleted; veneer clean.

---

### Task 4: The 3D treatment section

**Files:**
- Modify: `index.html` (new `<section id="behandlung">` after the hero, CSS block, `proc-live` class, bootstrap in the module script)
- Create: `js/treatment-section.js`
- Create: `assets/treatment/step-1..5.webp` (via `node tools/render-teeth.mjs --stills`)
- Modify: `js/i18n.js` (`EN.proc`), `tools/lib.mjs` (3D stub path), `tools/check-page.mjs` (image check, new 3D blocks)

**Interfaces:**
- Consumes: `STEP_COUNT`, `stepAt`, `stepAnchor`, `sampleBleach`, `swatchAt` (Task 1); `createBleachStage` from the bundle (Task 2); `onLangChange` from `js/i18n.js`.
- Produces: `initTreatmentSection({ section, stageUrl, modelUrl, stillUrl }) → api` and `window.aixsmileTreatment = { ready: Promise, seek(p), progress() → number, still(p, w, h) }`. Section classes: `.procedure`, `is-3d` (live), `is-stills` (fallback), `is-playing`, `is-end`.

- [ ] **Step 1: Write the failing checks**

In `tools/lib.mjs`, replace inside `mockApi`:

```js
  if (!live3d) {
    await page.route('**/js/teeth-stage.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript',
      body: "export async function createTeethStage() { throw new Error('3D off in this check'); }" }));
  }
```
with
```js
  if (!live3d) {
    await page.route('**/js/teeth-stage.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript',
      body: "export async function createTeethStage() { throw new Error('3D off in this check'); }" }));
    await page.route('**/js/bleach-stage.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript',
      body: "export async function createBleachStage() { throw new Error('3D off in this check'); }" }));
  }
```
and change the doc comment above `mockApi` from "the hero's 3D bundle is swapped for a stub that fails cleanly, so the hero keeps its still images" to "the 3D bundles are swapped for stubs that fail cleanly, so the page keeps its stills".

In `tools/check-page.mjs`, in the first block, replace

```js
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
```
with
```js
    // images that are not rendered (the no-JS stills list) never load, by design
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.getClientRects().length && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc || i.src));
```

Then insert before the line `  // ---- no JavaScript: everything readable, booking falls back to links ----`:

```js
  // ---- the 3D treatment section: live stage, hold to play, dots, shade, captions, language ----
  {
    const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length;
    const files = ['js/bleach-stage.js', 'assets/models/dentition.glb'];
    const total = files.reduce((n, f) => n + gz(f), 0);
    ok('3D: bundle and model (loaded only near the section) stay under 1,250 KB gzipped', total < 1250 * 1024,
      files.map((f) => `${f} ${Math.round(gz(f) / 1024)} KB`).join(' + '));

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const first = await page.evaluate(() => ({
      early: performance.getEntriesByType('resource').some((e) => /dentition\.glb/.test(e.name)),
      below: document.querySelector('#behandlung .procedure__view').getBoundingClientRect().top > innerHeight,
    }));
    // (before Task 6 the section starts inside the first screen and rightly loads at once)
    ok('3D: the model is not fetched with the first paint when the section starts below the fold', !first.below || !first.early, JSON.stringify(first));
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => /\bis-(3d|stills)\b/.test(document.getElementById('behandlung').className), null, { timeout: 180000 });
    const live = await page.evaluate(() => document.getElementById('behandlung').classList.contains('is-3d'));
    ok('3D: the live dentition replaces the still once loaded', live, live ? 'is-3d' : 'fell back to stills');
    const read = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return { num: q('.procedure__num').textContent, title: q('.procedure__title').textContent, shade: q('.procedure__shade b').textContent,
        cta: !q('.procedure__cta').hidden, p: window.aixsmileTreatment.progress() };
    });
    const start = await read();
    ok('3D: starts at step 1 with the yellow shade', start.num === '01' && start.title === 'Ausgangsfarbe messen' && start.shade === 'A3.5', `${start.num} ${start.title} ${start.shade}`);
    const hold = await page.locator('.procedure__hold').boundingBox();
    await page.mouse.move(hold.x + hold.width * 0.6, hold.y + hold.height * 0.5);
    await page.mouse.down(); await page.waitForTimeout(4000); await page.mouse.up();
    const held = await read();
    ok('3D: pressing and holding plays the treatment', held.p > 0.03, `progress ${held.p.toFixed(3)}`);
    await page.waitForTimeout(800);
    const paused = await read();
    ok('3D: letting go pauses it', paused.p - held.p < 0.02, `${held.p.toFixed(3)} -> ${paused.p.toFixed(3)}`);
    const anchor = (k) => page.evaluate(async (s) => (await import('/js/bleach-timeline.js')).stepAnchor(s), k);
    await page.click('.procedure__dots button[data-step="4"]'); await page.waitForTimeout(400);
    const end = await read();
    ok('3D: the last dot shows the new shade and the booking link', end.num === '05' && end.title === 'Neue Farbe messen' && end.shade === 'BL4' && end.cta, `${end.num} ${end.title} ${end.shade} cta:${end.cta}`);
    ok('3D: with reduced motion a dot jumps without gliding', Math.abs(end.p - await anchor(4)) < 0.005, end.p.toFixed(4));
    await page.click('.procedure__dots button[data-step="3"]'); await page.waitForTimeout(400);
    const mid = await read();
    ok('3D: step 4 shows the gel working at B1', mid.num === '04' && mid.title === 'Gel wirken lassen' && mid.shade === 'B1', `${mid.num} ${mid.title} ${mid.shade}`);
    const tag = await page.evaluate(() => {
      const t = document.querySelector('.procedure__tag'); const r = t.getBoundingClientRect();
      const v = t.closest('.procedure__view').getBoundingClientRect();
      return { text: t.textContent, hidden: !!t.closest('[aria-hidden="true"]'), shown: r.width > 0 && r.left >= v.left && r.right <= v.right && t.scrollWidth <= t.clientWidth + 1 };
    });
    ok('3D: labelled as an illustration, not a result, fully visible and read by screen readers', /kein Behandlungsergebnis/.test(tag.text) && tag.shown && !tag.hidden, tag.text);
    await page.click('#langToggle'); await page.waitForTimeout(200);
    const en = await read();
    ok('3D: the caption follows the language, the playhead stays', en.title === 'Let the gel work' && Math.abs(en.p - mid.p) < 1e-6, `${en.title} p ${en.p.toFixed(4)}`);
    const dotLabel = await page.evaluate(() => document.querySelector('.procedure__dots button[data-step="3"]').getAttribute('aria-label'));
    ok('3D: the dots are labelled in the page language', dotLabel === 'Let the gel work', dotLabel);
    await page.click('#langToggle');
    // a lost WebGL context (a phone switching apps) falls back to the stills
    await page.evaluate(() => document.querySelector('.procedure__canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext());
    await page.waitForTimeout(500);
    const lost = await page.evaluate(() => ({ stills: document.getElementById('behandlung').classList.contains('is-stills'), src: document.querySelector('.procedure__poster').getAttribute('src') }));
    ok('3D: a lost WebGL context falls back to the stills', lost.stills && /step-4\.webp$/.test(lost.src), JSON.stringify(lost));
    ok('3D: no console or page errors', errors.length === 0, errors.join(' | ') || 'none');
    await ctx.close();
  }

  // ---- phone: a swipe that starts on the 3D scrolls the page instead of playing ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => /\bis-(3d|stills)\b/.test(document.getElementById('behandlung').className), null, { timeout: 180000 });
    await page.evaluate(() => {
      const h = document.querySelector('.procedure__hold'); const r = h.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const ev = (type, dy) => h.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y + dy, button: 0 }));
      ev('pointerdown', 0); ev('pointermove', -30);
      window.__ev = ev;
    });
    await page.waitForTimeout(700);
    const p = await page.evaluate(() => window.aixsmileTreatment.progress());
    await page.evaluate(() => window.__ev('pointerup', -30));
    ok('phone: a swipe starting on the 3D scrolls instead of playing', p === 0, `progress ${p}`);
    await ctx.close();
  }

  // ---- without WebGL the dots switch between the five stills ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(type) ? null : orig.call(this, type, ...rest); };
    });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForSelector('#behandlung.is-stills', { timeout: 20000 });
    await page.click('.procedure__dots button[data-step="4"]');
    await page.waitForTimeout(600);
    const s = await page.evaluate(() => {
      const img = document.querySelector('.procedure__poster');
      return { src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0, hint: getComputedStyle(document.querySelector('.procedure__hold')).display };
    });
    ok('without WebGL the dots switch the stills and the hold hint is hidden', /step-5\.webp$/.test(s.src) && s.loaded && s.hint === 'none', JSON.stringify(s));
    await ctx.close();
  }
```

- [ ] **Step 2: Run the checks to verify they fail**

Run: `node tools/check-page.mjs 2>&1 | tail -5`
Expected: the run throws at `#behandlung` (no such section yet).

- [ ] **Step 3: The section script**

Create `js/treatment-section.js`:

```js
// The 3D treatment section: the bleaching on the real dentition, played
// while the visitor presses and holds the right side of the view (like
// holding the right edge of a video). Scrolling past the section changes
// nothing. This file owns the playhead, the caption, the shade readout and
// the step dots; the captions come from the section's own step list, which
// i18n.js translates. The 3D stage (js/src/bleach-stage.js, shipped as the
// bundle js/bleach-stage.js — rebuild it with tools/build-3d.mjs) loads when
// the section comes near and only draws what it is told; until then, and
// where WebGL is missing or lost, the stage shows a rendered still per step.
// Adapted from the veneer page's js/procedure-section.js.
import { STEP_COUNT, stepAt, stepAnchor, sampleBleach, swatchAt } from './bleach-timeline.js';
import { onLangChange } from './i18n.js';

const SETTLE = 0.11;      // seconds: how softly the drawn progress follows the playhead
const PLAY_SECONDS = 12;  // holding plays the whole treatment in about this long
const RUN_UP = 0.35;      // seconds to reach full speed, instead of a jolt
const GLIDE_MS = 900;     // a step dot glides the playhead to its step in this long

function whenCalm(fn) {
  // the hero plays its entrance first; then wait for an idle moment
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  const wait = () => setTimeout(idle, 2600);
  if (document.readyState === 'complete') wait(); else addEventListener('load', wait, { once: true });
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function initTreatmentSection({ section, stageUrl, modelUrl, stillUrl }) {
  const $ = (sel) => section.querySelector(sel);
  const canvas = $('.procedure__canvas'), poster = $('.procedure__poster');
  const caption = $('.procedure__caption'), num = $('.procedure__num'), title = $('.procedure__title'), text = $('.procedure__text');
  const cta = $('.procedure__cta');
  const chip = $('.procedure__shade'), shadeOut = $('.procedure__shade b');
  const dots = [...section.querySelectorAll('.procedure__dots button')];
  const steps = [...section.querySelectorAll('.procedure__list li')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let step = -1, target = 0, shown = 0, frame = 0, lastTime = 0, view = null;

  function showStep(k, force) {
    if (k === step && !force) return;
    const moved = k !== step;
    step = k;
    num.textContent = String(k + 1).padStart(2, '0');
    title.innerHTML = steps[k].querySelector('h3').innerHTML;
    text.innerHTML = steps[k].querySelector('p').innerHTML;
    cta.hidden = k !== STEP_COUNT - 1;
    section.classList.toggle('is-end', k === STEP_COUNT - 1);
    dots.forEach((d, i) => (i === k ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
    if (!view) poster.src = stillUrl(k);
    if (moved && !reduce) { caption.classList.remove('is-swapping'); void caption.offsetWidth; caption.classList.add('is-swapping'); }
  }
  function showShade(p) {
    const s = sampleBleach(p);
    if (shadeOut.textContent !== s.shadeCode) shadeOut.textContent = s.shadeCode;
    chip.style.setProperty('--tooth', swatchAt(s.shade));
  }

  const api = { ready: Promise.reject(new Error('3D off')), seek() {}, progress: () => shown, still: () => null };
  api.ready.catch(() => {});
  // the step list is translated by i18n.js; the caption re-reads it
  onLangChange(() => { if (step >= 0) showStep(step, true); });
  if (!document.documentElement.classList.contains('proc-live')) return api;

  // The drawn progress eases towards the playhead; frames are drawn only
  // while it moves, so an idle section costs nothing.
  function tick(now) {
    frame = 0;
    const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;
    shown += (target - shown) * (1 - Math.exp(-dt / SETTLE));
    if (Math.abs(target - shown) < 5e-4) shown = target;
    showStep(stepAt(shown));
    showShade(shown);
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
    if (shown !== target) frame = requestAnimationFrame(tick); else lastTime = 0;
  }
  const draw = () => { if (!frame) frame = requestAnimationFrame(tick); };
  const setTarget = (p) => { target = clamp01(p); draw(); };
  showStep(0, true);
  showShade(0);

  // ---- playback: while held, the playhead advances at a steady pace --------
  let playing = false, playRaf = 0, playLast = 0, speed = 0, glideRaf = 0;
  const cancelGlide = () => { cancelAnimationFrame(glideRaf); glideRaf = 0; };
  function run(now) {
    if (!playing) return;
    // up to 0.1 s per frame, so a slow phone (down to ~10 fps) keeps the pace
    const dt = playLast ? Math.min(0.1, (now - playLast) / 1000) : 0;
    playLast = now;
    speed = Math.min(1, speed + dt / RUN_UP);
    setTarget(target + (speed * dt) / PLAY_SECONDS);
    if (target >= 1) { stop(); return; }
    playRaf = requestAnimationFrame(run);
  }
  function play() {
    cancelGlide();
    // held at the end: start the treatment again from the beginning
    if (target >= 0.995) { target = shown = 0; draw(); }
    playing = true; speed = 0; playLast = 0;
    section.classList.add('is-playing');
    playRaf = requestAnimationFrame(run);
  }
  function stop() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(playRaf);
    section.classList.remove('is-playing');
  }

  // a step dot takes the playhead to the moment that step's action is done:
  // gliding, or at once with reduced motion
  function glideTo(to) {
    stop(); cancelGlide();
    if (reduce) { shown = target = clamp01(to); draw(); return; }
    const from = target, t0 = performance.now();
    const glide = (now) => {
      const k = Math.min(1, (now - t0) / GLIDE_MS);
      setTarget(from + (to - from) * easeInOut(k));
      glideRaf = k < 1 ? requestAnimationFrame(glide) : 0;
    };
    glideRaf = requestAnimationFrame(glide);
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => glideTo(stepAnchor(i))));

  // ---- the hold zone: the right side of the view --------------------------
  // A finger that moves is scrolling, not holding, so normal swipes on that
  // side keep working; playback starts once the press has stayed still.
  const hold = $('.procedure__hold');
  let timer = 0, origin = null;
  const release = () => { clearTimeout(timer); timer = 0; origin = null; stop(); };
  hold.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    origin = { x: e.clientX, y: e.clientY };
    clearTimeout(timer);
    timer = setTimeout(() => { timer = 0; play(); }, e.pointerType === 'mouse' ? 120 : 250);
  });
  hold.addEventListener('pointermove', (e) => {
    if (timer && origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) { clearTimeout(timer); timer = 0; }
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => hold.addEventListener(type, release));
  hold.addEventListener('contextmenu', (e) => e.preventDefault());   // no long-press menu on phones
  hold.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat && !playing) play();
  });
  hold.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
  addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
  // scrolled away while holding (mouse wheel): pause there
  new IntersectionObserver((entries) => { if (!entries[entries.length - 1].isIntersecting) release(); }).observe($('.procedure__view'));

  // ---- the 3D stage ----------------------------------------------------------
  const toStills = () => {
    view = null;
    section.classList.remove('is-3d');
    section.classList.add('is-stills');
    poster.src = stillUrl(Math.max(0, step));
  };
  let startPromise = null;
  const start3d = () => {
    if (startPromise) return startPromise;
    startPromise = import(stageUrl)
      .then(({ createBleachStage }) => createBleachStage({ canvas, modelUrl }))
      .then((stage3d) => {
        view = stage3d;
        view.render(shown);
        section.classList.add('is-3d');
        new ResizeObserver(() => view && view.resize()).observe(canvas);
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toStills(); }, { once: true });
        return view;
      });
    startPromise.catch((err) => { console.warn('Bleaching 3D unavailable, showing stills.', err); toStills(); });
    return startPromise;
  };
  api.ready = new Promise((resolve, reject) => {
    const go = () => start3d().then(resolve, reject);
    // near: start once the page is calm; on screen: start at once
    const near = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { near.disconnect(); whenCalm(go); } }, { rootMargin: '900px 0px' });
    const seen = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { seen.disconnect(); go(); } }, { threshold: 0.02 });
    near.observe(section);
    seen.observe($('.procedure__view'));
  });
  api.ready.catch(() => {});
  /** Jump straight to progress p, without easing (used by the check tools). */
  api.seek = (p) => {
    stop(); cancelGlide();
    shown = target = clamp01(p);
    showStep(stepAt(shown));
    showShade(shown);
    section.style.setProperty('--proc-p', shown.toFixed(4));
    if (view) view.render(shown);
  };
  api.still = (p, width, height) => view && view.still(p, width, height);
  return api;
}
```

- [ ] **Step 4: The markup**

In `index.html`:
- Change `<script>document.documentElement.classList.add('js');</script>` to `<script>document.documentElement.classList.add('js', 'proc-live');</script>` with the comment `<!-- every visitor gets the 3D treatment (press and hold to play); the stills list remains for no JS -->` on the line above it.
- Insert this section directly after the hero's closing `</section>` (before `<section class="section tone-night band--cases" id="faelle"`):

```html
<section class="procedure tone-night" id="behandlung" aria-labelledby="procH">
  <div class="procedure__stage">
    <div class="procedure__view">
      <img class="procedure__poster" src="assets/treatment/step-1.webp" width="1200" height="1200" alt="" decoding="async">
      <canvas class="procedure__canvas" aria-hidden="true"></canvas>
      <p class="procedure__shade" aria-hidden="true"><i></i><span data-i18n="proc.shade">Farbe</span><b>A3.5</b></p>
      <span class="procedure__tag" data-i18n="proc.tag">Symbolbild · kein Behandlungsergebnis</span>
      <div class="procedure__hold" role="button" tabindex="0" data-i18n-aria="proc.holdAria" aria-label="Behandlung abspielen: gedrückt halten">
        <span class="procedure__holdHint"><span data-i18n="proc.hold">Gedrückt halten</span> <i aria-hidden="true">▸▸</i></span>
      </div>
      <span class="procedure__playing" aria-hidden="true"><i>▸▸</i> <span data-i18n="proc.playing">Abspielen</span></span>
    </div>
    <div class="procedure__side">
      <div class="procedure__head">
        <p class="eyebrow" data-i18n="proc.eyebrow">Die Behandlung in 3D</p>
        <h2 id="procH" data-i18n="proc.h2">So wirkt <em>ein Bleaching.</em></h2>
        <p class="procedure__hint" data-i18n="proc.hint">Halten Sie das Bild rechts gedrückt – die Behandlung spielt ab.</p>
      </div>
      <div class="procedure__caption" aria-live="polite">
        <span class="procedure__num">01</span>
        <h3 class="procedure__title">Ausgangsfarbe messen</h3>
        <p class="procedure__text">Erst Zahnreinigung und Untersuchung, dann halten wir die Farbskala an: hier A3.5.</p>
        <a class="procedure__cta" href="#buchen" data-cta="book" data-i18n="proc.cta" hidden>Beratung buchen</a>
      </div>
      <ol class="procedure__dots" data-i18n-aria="proc.dots" aria-label="Behandlungsschritte">
        <li><button type="button" data-step="0" data-i18n-aria="proc.s1t" aria-label="Ausgangsfarbe messen" aria-current="step"></button></li>
        <li><button type="button" data-step="1" data-i18n-aria="proc.s2t" aria-label="Zahnfleisch schützen"></button></li>
        <li><button type="button" data-step="2" data-i18n-aria="proc.s3t" aria-label="Gel auftragen"></button></li>
        <li><button type="button" data-step="3" data-i18n-aria="proc.s4t" aria-label="Gel wirken lassen"></button></li>
        <li><button type="button" data-step="4" data-i18n-aria="proc.s5t" aria-label="Neue Farbe messen"></button></li>
      </ol>
    </div>
  </div>
  <!-- the five steps as stills: shown without JS; the section script reads its captions from here -->
  <ol class="procedure__list">
    <li><img src="assets/treatment/step-1.webp" width="1200" height="1200" loading="lazy" decoding="async" alt=""><span>01</span><h3 data-i18n="proc.s1t">Ausgangsfarbe messen</h3><p data-i18n="proc.s1p">Erst Zahnreinigung und Untersuchung, dann halten wir die Farbskala an: hier A3.5.</p></li>
    <li><img src="assets/treatment/step-2.webp" width="1200" height="1200" loading="lazy" decoding="async" alt=""><span>02</span><h3 data-i18n="proc.s2t">Zahnfleisch schützen</h3><p data-i18n="proc.s2p">Eine lichthärtende Schutzschicht deckt das Zahnfleisch ab.</p></li>
    <li><img src="assets/treatment/step-3.webp" width="1200" height="1200" loading="lazy" decoding="async" alt=""><span>03</span><h3 data-i18n="proc.s3t">Gel auftragen</h3><p data-i18n="proc.s3p">Das Aufhellungsgel kommt auf die sichtbaren Zähne; Konzentration und Zeit legen wir fest.</p></li>
    <li><img src="assets/treatment/step-4.webp" width="1200" height="1200" loading="lazy" decoding="async" alt=""><span>04</span><h3 data-i18n="proc.s4t">Gel wirken lassen</h3><p data-i18n="proc.s4p">Oft in mehreren Durchgängen. Eine kurze Kälteempfindlichkeit ist möglich und vergeht meist nach wenigen Tagen.</p></li>
    <li><img src="assets/treatment/step-5.webp" width="1200" height="1200" loading="lazy" decoding="async" alt=""><span>05</span><h3 data-i18n="proc.s5t">Neue Farbe messen</h3><p data-i18n="proc.s5p">Dieselbe Skala, eine neue Nummer. Die Farbe setzt sich in ein bis zwei Wochen und hält meist ein bis drei Jahre.</p></li>
  </ol>
</section>
```

- In the module script, after `import './js/hero-stage.js';` add `  import { initTreatmentSection } from './js/treatment-section.js';`, and after the `onLangChange(renderPrice);` line add:

```js
  // The 3D treatment: the section script (captions, dots, stills) starts at
  // once; it loads three.js and the model itself when the section comes near.
  const procSection = document.getElementById('behandlung');
  if (procSection) window.aixsmileTreatment = initTreatmentSection({
    section: procSection,
    stageUrl: new URL('js/bleach-stage.js', document.baseURI).href,
    modelUrl: new URL('assets/models/dentition.glb', document.baseURI).href,
    stillUrl: (k) => new URL(`assets/treatment/step-${k + 1}.webp`, document.baseURI).href,
  });
```

- [ ] **Step 5: The CSS**

Append at the end of the `<style>` block (just before `</style>`):

```css
  /* ===== The treatment in 3D (2026-09-28) =====
     The bleaching on the real dentition (js/treatment-section.js). One screen
     tall, never pinned; holding the right side of the view plays it, the dots
     jump to a step, scrolling changes nothing. Without JS the five steps show
     as stills (.procedure__list); without WebGL the dots switch the stills.
     Adapted from the veneer page's procedure section. */
  .procedure { --proc-glow: #27231d; --proc-ink: #f3efe8; --proc-soft: rgba(243, 239, 232, .72); --proc-faint: rgba(243, 239, 232, .24);
    --proc-bronze: var(--bronze-light); position: relative; scroll-margin-top: var(--hdr); color: var(--proc-ink); }
  .procedure__stage { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); align-items: center; gap: clamp(20px, 4vw, 64px);
    height: calc(100vh - var(--hdr)); height: calc(100svh - var(--hdr)); min-height: 560px; max-height: 920px; padding: 0 var(--gutter) 0 0;
    background: radial-gradient(ellipse 50% 60% at 32% 50%, var(--proc-glow) 0%, rgba(39, 35, 29, 0) 74%); }
  .procedure__view { position: relative; height: 100%; min-height: 0; }
  .procedure__canvas, .procedure__poster { position: absolute; inset: 0; width: 100%; height: 100%;
    --proc-fade: linear-gradient(to right, transparent 0, #000 8%, #000 86%, transparent 100%),
      linear-gradient(to bottom, transparent 0, #000 10%, #000 90%, transparent 100%);
    -webkit-mask-image: var(--proc-fade); -webkit-mask-composite: source-in; mask-image: var(--proc-fade); mask-composite: intersect; }
  .procedure__canvas { display: block; opacity: 0; transition: opacity .7s ease; }
  .procedure__poster { object-fit: contain; transition: opacity .7s ease; }
  .procedure.is-3d .procedure__canvas { opacity: 1; }
  .procedure.is-3d .procedure__poster { opacity: 0; }
  .procedure__shade { position: absolute; z-index: 3; top: 24px; left: clamp(20px, 4vw, 56px); margin: 0; display: flex; align-items: center; gap: 8px;
    padding: 5px 14px 5px 7px; border: 1px solid var(--proc-faint); border-radius: 999px; background: rgba(11, 12, 13, .6); pointer-events: none; }
  .procedure__shade i { width: 18px; height: 18px; border-radius: 50%; background: var(--tooth, #d6bb86); box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .25); }
  .procedure__shade span { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--proc-soft); }
  .procedure__shade b { min-width: 2.7em; font-family: var(--serif); font-size: 19px; font-weight: 400; color: var(--proc-ink); font-variant-numeric: tabular-nums; }
  .procedure__tag { position: absolute; z-index: 3; left: clamp(20px, 4vw, 56px); bottom: 20px; padding: 4px 10px; border: 1px solid var(--proc-faint);
    border-radius: 999px; color: var(--proc-soft); font-size: 11px; letter-spacing: .04em; line-height: 1.3; pointer-events: none; }
  .procedure__side { display: grid; gap: clamp(20px, 3.4vh, 36px); align-content: center; max-width: 30rem; }
  .procedure h2 { margin: 0; color: var(--proc-ink); font-size: clamp(32px, 3.4vw, 52px); line-height: 1.04; }
  .procedure__hint { margin: 12px 0 0; color: var(--proc-soft); font-size: 14px; }
  .procedure__caption { min-height: 11.5em; }
  .procedure__num { color: var(--proc-bronze); font-size: 12px; font-weight: 650; letter-spacing: .16em; }
  .procedure__title { margin: 6px 0 0; color: var(--proc-ink); font-size: clamp(24px, 2.2vw, 32px); line-height: 1.1; }
  .procedure__text { min-height: 4.5em; margin: 10px 0 0; color: var(--proc-soft); font-size: 16px; line-height: 1.5; }
  .procedure__cta { display: inline-flex; align-items: center; min-height: 46px; margin-top: 16px; padding: 0 22px; border-radius: 3px;
    background: var(--bronze); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; }
  .procedure__cta:hover { background: var(--bronze-hover); color: #fff; }
  .procedure__cta[hidden] { display: none; }
  .procedure__caption.is-swapping > * { animation: procSwap .45s var(--ease) backwards; }
  .procedure__caption.is-swapping > :nth-child(2) { animation-delay: .04s; }
  .procedure__caption.is-swapping > :nth-child(3) { animation-delay: .08s; }
  @keyframes procSwap { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  /* the dots sit on a hairline that fills with the playhead; 44 px to tap */
  .procedure__dots { position: relative; display: flex; margin: 0; padding: 0; list-style: none; }
  .procedure__dots::before, .procedure__dots::after { content: ''; position: absolute; left: 22px; right: 22px; top: 50%; height: 1px; background: var(--proc-faint); }
  .procedure__dots::after { background: var(--proc-bronze); transform: scaleX(var(--proc-p, 0)); transform-origin: left center; }
  .procedure__dots li { position: relative; z-index: 1; }
  .procedure__dots button { position: relative; display: block; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer; }
  .procedure__dots button::before { content: ''; position: absolute; top: 50%; left: 50%; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%;
    background: var(--night); box-shadow: inset 0 0 0 1.5px var(--proc-faint); transition: transform .3s ease, background-color .3s ease, box-shadow .3s ease; }
  .procedure__dots button:hover::before { box-shadow: inset 0 0 0 1.5px var(--proc-bronze); }
  .procedure__dots button[aria-current="step"]::before { background: var(--proc-bronze); box-shadow: none; transform: scale(1.35); }
  .procedure__dots button:focus-visible { outline: 2px solid var(--proc-bronze); outline-offset: -4px; }
  /* press and hold: the right side of the view */
  .procedure__hold { position: absolute; top: 0; right: 0; bottom: 0; z-index: 2; display: flex; align-items: center; justify-content: flex-end;
    width: 42%; padding-right: clamp(12px, 3vw, 40px); cursor: pointer; touch-action: pan-y;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
  .procedure__hold:focus-visible { outline: none; }
  .procedure__hold:focus-visible .procedure__holdHint { outline: 2px solid var(--proc-bronze); outline-offset: 3px; }
  .procedure__holdHint { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border: 1px solid var(--proc-faint); border-radius: 999px;
    background: rgba(11, 12, 13, .55); color: var(--proc-soft); font-size: 12.5px; font-weight: 600; letter-spacing: .02em;
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: opacity .3s ease, transform .3s ease, color .2s ease, border-color .2s ease; }
  .procedure__holdHint i { color: var(--proc-bronze); font-style: normal; letter-spacing: -.12em; animation: procHoldNudge 1.6s ease-in-out infinite; }
  .procedure__hold:hover .procedure__holdHint { color: var(--proc-ink); border-color: rgba(201, 176, 138, .6); }
  .procedure.is-playing .procedure__holdHint { opacity: 0; transform: translateX(10px); }
  .procedure__playing { position: absolute; top: 24px; right: clamp(20px, 4vw, 56px); z-index: 3; display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 999px; background: rgba(0, 0, 0, .55); color: #fff; font-size: 13px; font-weight: 600;
    opacity: 0; transform: translateY(-6px); pointer-events: none; transition: opacity .2s ease, transform .2s ease; }
  .procedure__playing i { font-style: normal; letter-spacing: -.12em; }
  .procedure.is-playing .procedure__playing { opacity: 1; transform: none; }
  @keyframes procHoldNudge { 0%, 100% { opacity: .65; transform: translateX(0); } 50% { opacity: 1; transform: translateX(3px); } }
  @media (prefers-reduced-motion: reduce) { .procedure__holdHint i { animation: none; } }
  .procedure.is-stills :is(.procedure__hold, .procedure__playing) { display: none; }
  /* without JS: heading plus the five stills */
  .procedure__list { display: none; }
  html:not(.proc-live) .procedure__stage { display: block; height: auto; min-height: 0; max-height: none; padding: clamp(48px, 7vw, 88px) var(--gutter) 24px; background: none; }
  html:not(.proc-live) :is(.procedure__view, .procedure__caption, .procedure__dots, .procedure__hint) { display: none; }
  html:not(.proc-live) .procedure__list { display: grid; }
  .procedure__list { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px 22px; max-width: 74rem; margin: 0 auto;
    padding: 0 var(--gutter) clamp(56px, 8vw, 96px); list-style: none; }
  .procedure__list li { display: grid; align-content: start; gap: 6px; }
  .procedure__list img { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 3px; background: radial-gradient(circle, var(--proc-glow), var(--night) 75%); }
  .procedure__list span { margin-top: 8px; color: var(--proc-bronze); font-size: 12px; font-weight: 650; letter-spacing: .16em; }
  .procedure__list h3 { margin: 0; color: var(--proc-ink); font-size: 22px; line-height: 1.15; }
  .procedure__list p { margin: 0; color: var(--proc-soft); font-size: 14.5px; line-height: 1.5; }
  @media (max-width: 900px) {
    .procedure__stage { grid-template-columns: minmax(0, 1fr); height: auto; min-height: 0; max-height: none; padding: 40px 0 28px; gap: 12px;
      background: radial-gradient(ellipse 80% 40% at 50% 45%, var(--proc-glow) 0%, rgba(39, 35, 29, 0) 74%); }
    .procedure__side { display: contents; }
    .procedure__head { order: 1; padding: 0 var(--gutter); }
    .procedure__view { order: 2; height: 46svh; min-height: 300px; }
    .procedure__caption { order: 3; min-height: 10em; padding: 0 var(--gutter); }
    .procedure__dots { order: 4; margin: 0 var(--gutter); }
    .procedure h2 { font-size: clamp(28px, 7.6vw, 36px); }
    .procedure__hint { font-size: 13px; }
    .procedure__title { font-size: 22px; }
    .procedure__text { min-height: 4.5em; font-size: 15px; }
    .procedure__shade { top: 10px; left: var(--gutter); }
    .procedure__tag { bottom: 8px; left: var(--gutter); }
    .procedure__hold { width: 50%; align-items: flex-end; padding: 0 10px 10px 0; }
    .procedure__holdHint { gap: 6px; padding: 6px 10px; font-size: 11px; }
    .procedure.is-end .procedure__holdHint { opacity: 0; }
    .procedure__playing { top: 10px; right: var(--gutter); }
    .procedure__list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
  }
```

- [ ] **Step 6: English**

In `js/i18n.js`, add to `EN` right after the `ai: { … },` line:

```js
  proc: {
    eyebrow: 'The treatment in 3D',
    h2: 'How <em>whitening works.</em>',
    hint: 'Press and hold the image on the right – the treatment plays.',
    tag: 'Illustration · not a treatment result',
    shade: 'Shade',
    holdAria: 'Play the treatment: press and hold',
    hold: 'Press and hold',
    playing: 'Playing',
    cta: 'Book a consultation',
    dots: 'Treatment steps',
    s1t: 'Measure the starting shade',
    s1p: 'First a cleaning and an examination, then we hold up the shade guide: here A3.5.',
    s2t: 'Protect the gums',
    s2p: 'A light-cured barrier covers the gums.',
    s3t: 'Apply the gel',
    s3p: 'The whitening gel goes onto the visible teeth; we set its strength and timing.',
    s4t: 'Let the gel work',
    s4p: 'Often in several rounds. Brief sensitivity to cold can occur and usually passes within a few days.',
    s5t: 'Measure the new shade',
    s5p: 'The same guide, a new number. The shade settles over one to two weeks and usually lasts one to three years.',
  },
```

- [ ] **Step 7: Render the stills and run the checks**

```bash
node tools/render-teeth.mjs --stills
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs
npx html-validate@9 index.html
```
Expected: five `assets/treatment/step-N.webp` (each under ~120 KB); i18n, freshness, contrast PASS (rephrase a German or English sentence if check-fresh reports a shared run); check-page all PASS including every `3D:` line, the phone swipe line and the no-WebGL line (SwiftShader: the live wait can take minutes; if a timing line fails, re-run once before debugging).

- [ ] **Step 8: Look at it**

`node tools/shoot.mjs $SCRATCH/shots-t4`; view the laptop and phone shots of `behandlung`: stills visible (the shoot tool stubs 3D), caption right of the stage on laptop and below it on phone, shade chip top-left, tag bottom-left, dots on their hairline. Then hold the right side of the view on the live preview in a real browser.

- [ ] **Step 9: Checkpoint (no git)**

`git status --short . && git status --short ../veneer-webpage` — expected: `index.html`, `js/i18n.js`, `tools/lib.mjs`, `tools/check-page.mjs` modified; `js/treatment-section.js`, `assets/treatment/` new; veneer clean.

---

### Task 5: The hero

**Files:**
- Create: `tools/css-prune.mjs`
- Modify: `index.html` (hero section, preload, CSS, module imports), `js/i18n.js` (`EN.hero`, remove `DYN.*.stage`), `tools/lib.mjs`, `tools/check-page.mjs`
- Delete: `js/hero-stage.js`, `js/treatment.js`, `js/teeth-stage.js`, `js/src/teeth-stage.js`, `assets/models/jaw.glb`, `assets/photos/jaw-yellow.webp`, `assets/photos/jaw-white.webp`, `assets/photos/jaw-yellow-wide.webp`, `assets/photos/jaw-white-wide.webp`, `tools/stage-test.html`, `tools/shoot-hero.mjs`, `tools/compress-model.mjs`

**Interfaces:**
- Produces: `node tools/css-prune.mjs '<regex>' … ['comment:<regex>' …]` (used by Tasks 5–10). Hero classes used later: `.hero`, `.heroMedia`, `.heroInner`, `.heroCopy`, `.heroCta`, `.heroPoints`, `.heroCase`.

- [ ] **Step 1: Update the checks first (failing)**

In `tools/check-page.mjs`:
- In the language block replace `/Measure the shade/.test(en.h1)` with `/measured, not guessed/.test(en.h1)`.
- Delete the whole block that starts `  // ---- the hero's 3D stage: live jaw, slider, keyboard, drag, labels ----` and the whole block that starts `  // ---- without WebGL the slider blends the yellow still into the white one ----` (each up to and including its closing `  }`).
- Insert after the language block:

```js
  // ---- hero: two buttons, the image labelled ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const h = await page.evaluate(() => ({
      book: document.querySelector('.heroCta .btn[data-cta="book"]')?.getAttribute('href'),
      cases: document.querySelector('.heroCta .btn.ghost')?.getAttribute('href'),
      tag: document.querySelector('.heroMedia .aiTag')?.textContent,
      em: !!document.querySelector('.hero h1 em'),
    }));
    ok('hero: a book button to #buchen and a cases button to #faelle', h.book === '#buchen' && h.cases === '#faelle', JSON.stringify(h));
    ok('hero: the image is labelled as AI-generated and the headline has its italic phrase', /KI-generiert/.test(h.tag || '') && h.em, h.tag);
    await ctx.close();
  }
```

In `tools/lib.mjs` delete the `**/js/teeth-stage.js` route (keep the `bleach-stage.js` one) and in `loadPageModule`'s doc comment replace `(js/treatment.js)` with `(js/bleach-timeline.js)`.

Run: `node tools/check-page.mjs 2>&1 | grep -E 'hero:|English applies'` — expected FAIL on these lines.

- [ ] **Step 2: The prune helper**

Create `tools/css-prune.mjs`:

```js
// Development helper for the 2026-09-28 redesign; delete it when the
// redesign is done. Removes CSS rules from index.html's <style> block
// wherever they appear (also inside @media), so a section's old rules can go
// before its new block is added. A selector is dropped when any pattern
// matches it; a rule keeps its other selectors; @media blocks left empty go.
// Comments whose text matches a "comment:<regex>" argument go too.
//   node tools/css-prune.mjs '<regex>' ['<regex>' ...] ['comment:<regex>' ...]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const file = path.join(ROOT, 'index.html');
const args = process.argv.slice(2);
const sel = args.filter((a) => !a.startsWith('comment:')).map((a) => new RegExp(a));
const com = args.filter((a) => a.startsWith('comment:')).map((a) => new RegExp(a.slice(8)));
const html = fs.readFileSync(file, 'utf8');
const open = html.indexOf('<style>') + '<style>'.length, close = html.indexOf('</style>');
let removed = 0;

// a selector list, split on commas outside parentheses and brackets
function splitList(head) {
  const out = []; let depth = 0, cur = '';
  for (const ch of head) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

// index just past the brace that closes the block whose body starts at `from`
function blockEnd(src, from) {
  let depth = 1, j = from;
  while (depth && j < src.length) {
    if (src.startsWith('/*', j)) { j = src.indexOf('*/', j) + 2; continue; }
    if (src[j] === '"' || src[j] === "'") {
      const q = src[j]; j++;
      while (j < src.length && src[j] !== q) j += src[j] === '\\' ? 2 : 1;
      j++; continue;
    }
    if (src[j] === '{') depth++; else if (src[j] === '}') depth--;
    j++;
  }
  return j;
}

function prune(src) {
  let out = '', i = 0;
  while (i < src.length) {
    const ws = /^\s+/.exec(src.slice(i, i + 200));
    if (ws) { out += ws[0]; i += ws[0].length; continue; }
    if (src.startsWith('/*', i)) {
      const e = src.indexOf('*/', i) + 2, c = src.slice(i, e);
      if (!com.some((r) => r.test(c))) out += c;
      i = e; continue;
    }
    const brace = src.indexOf('{', i);
    if (brace === -1) { out += src.slice(i); break; }
    const head = src.slice(i, brace), end = blockEnd(src, brace + 1), body = src.slice(brace + 1, end - 1), h = head.trim();
    if (/^@(media|supports)/.test(h)) {
      const inner = prune(body);
      if (inner.replace(/\/\*[\s\S]*?\*\//g, '').trim()) out += `${head}{${inner}}`;
    } else if (h.startsWith('@')) {
      out += src.slice(i, end);
    } else {
      const list = splitList(head), keep = list.filter((s) => !sel.some((r) => r.test(s)));
      removed += list.length - keep.length;
      if (keep.length === list.length) out += src.slice(i, end);
      else if (keep.length) out += `${keep.join(', ')} {${body}}`;
    }
    i = end;
  }
  return out;
}

fs.writeFileSync(file, html.slice(0, open) + prune(html.slice(open, close)) + html.slice(close));
console.log(`removed ${removed} selectors`);
```

Sanity check: `cp index.html $SCRATCH/idx.html && node tools/css-prune.mjs '^\.nothing-matches-this$' && cmp index.html $SCRATCH/idx.html` — expected `removed 0 selectors` and no `cmp` output (byte-identical).

- [ ] **Step 3: Prune the old hero CSS**

```bash
node tools/css-prune.mjs '^\.hero' '^\.stage' '^\.frame\.stageFrame' '^\.blob' '^\.lead\b' '^\.trustRow' '^html\.js:not\(\.is-revealed\)' \
  'comment:Hero: the promise beside' 'comment:The 3D jaw \(js/hero-stage' 'comment:The stage never grows' 'comment:the shade readout: a swatch' \
  'comment:the slider: a track' 'comment:real proof right under' 'comment:the hero.s own entrance waits' 'comment:Phones: headline, then the 3D stage'
node -e "const h=require('fs').readFileSync('index.html','utf8');const c=h.slice(h.indexOf('<style>'),h.indexOf('</style>'));console.log((c.match(/\.(hero|stage|blob|trustRow)\w*/g)||[]).join(' ')||'clean')"
```
Expected: some dozens of selectors removed; the second command prints `clean`.

- [ ] **Step 4: The new hero markup**

Replace the whole `<section class="hero" aria-labelledby="heroH">` … `</section>` element with:

```html
<section class="hero tone-night" aria-labelledby="heroH">
  <figure class="heroMedia">
    <img src="assets/photos/ai/hero.webp" width="1000" height="1250" decoding="async" fetchpriority="high" data-i18n-alt="hero.imgAlt" alt="Ein Lächeln in Nahaufnahme; eine behandschuhte Hand hält einen Musterzahn der Farbskala an die Frontzähne (KI-generiertes Bild)">
    <span class="aiTag" aria-hidden="true" data-i18n="ai.symbol">KI-generiert · Symbolbild</span>
  </figure>
  <div class="wrap heroInner">
    <div class="heroCopy">
      <p class="eyebrow" data-i18n="hero.eyebrow">Zahnbleaching in Aachen</p>
      <h1 id="heroH" data-i18n="hero.h1">Ein helleres Lächeln – <em>gemessen, nicht geschätzt.</em></h1>
      <p class="lead" data-i18n="hero.lead">Wir bestimmen Ihre Zahnfarbe vorher und nachher mit derselben Farbskala. So sehen Sie schwarz auf weiß, was sich verändert hat.</p>
      <div class="cta heroCta">
        <a class="btn" href="#buchen" data-cta="book" data-i18n="hero.book">Beratungstermin buchen</a>
        <a class="btn ghost" href="#faelle"><span data-i18n="hero.cases">Echte Fälle ansehen</span> <span aria-hidden="true">↓</span></a>
      </div>
      <ul class="heroPoints" data-i18n-aria="hero.trustAria" aria-label="Kurz und knapp">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/></svg><b data-i18n="hero.t1">Vorher &amp; nachher gemessen</b></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg><b data-i18n="hero.t2">Erster Termin über die Kasse</b></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg><b data-i18n="hero.t3">Schriftlicher Kostenplan</b></li>
      </ul>
    </div>
  </div>
  <a class="heroCase" href="#faelle">
    <img src="assets/photos/case-1-pair.webp" width="726" height="192" decoding="async" data-i18n-alt="hero.caseAlt" alt="Fall 1 aus unserer Praxis: links vorher, rechts nachher">
    <span class="heroCaseText"><b data-i18n="hero.caseB">Echter Fall aus unserer Praxis</b><span data-i18n="hero.caseS">Vorher und nachher ansehen</span></span>
  </a>
</section>
```

In `<head>` replace the two `<link rel="preload" as="image" href="assets/photos/jaw-yellow…">` lines with `<link rel="preload" as="image" href="assets/photos/ai/hero.webp" fetchpriority="high">`.

In the module script delete `  import './js/hero-stage.js';` and change the comment above the imports to `// i18n evaluates first (the others import it), captures the German text`.

- [ ] **Step 5: The new hero CSS**

Append before `</style>` (the existing `@keyframes riseIn` survives the prune and is reused):

```css
  /* ===== Hero (2026-09-28): dark; the smile on the right, the promise on the left ===== */
  .hero { position: relative; display: flex; align-items: center; min-height: max(600px, 100svh); overflow: hidden; }
  .heroMedia { position: absolute; top: 0; right: 0; bottom: 0; width: 58%; margin: 0; }
  .heroMedia img { width: 100%; height: 100%; object-fit: cover; object-position: 62% 30%; }
  .heroMedia::after { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(90deg, var(--night) 0%, rgba(11, 12, 13, .72) 18%, rgba(11, 12, 13, 0) 52%),
      linear-gradient(0deg, rgba(11, 12, 13, .55) 0%, rgba(11, 12, 13, 0) 30%); }
  .heroMedia .aiTag { top: calc(var(--hdr) + 16px); bottom: auto; right: var(--gutter); }
  .heroInner { position: relative; z-index: 1; width: 100%; padding-top: calc(var(--hdr) + 48px); padding-bottom: 72px; }
  .heroCopy { max-width: 36rem; }
  .hero h1 { margin: 0 0 22px; font-size: clamp(42px, 5vw, 72px); line-height: 1.02; }
  .hero h1 em { display: block; }
  .lead { max-width: 30rem; margin: 0; font-size: 19px; line-height: 1.55; color: var(--text); }
  .heroCta { margin-top: 30px; }
  .heroPoints { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 34rem; margin: 40px 0 0; padding: 22px 0 0; border-top: 1px solid var(--line); }
  .heroPoints li { display: grid; justify-items: start; gap: 10px; padding: 0 16px; border-left: 1px solid var(--line); font-size: 13.5px; line-height: 1.35; }
  .heroPoints li:first-child { padding-left: 0; border-left: 0; }
  .heroPoints svg { width: 26px; height: 26px; color: var(--accent); }
  .heroPoints b { font-weight: 600; color: var(--heading); }
  .heroCase { position: absolute; z-index: 2; right: var(--gutter); bottom: 32px; display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 12px; align-items: center;
    width: 330px; padding: 8px 14px 8px 8px; border: 1px solid var(--line); border-radius: 3px; background: rgba(11, 12, 13, .72);
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: var(--text); text-decoration: none; transition: border-color .2s ease, transform .25s var(--ease); }
  .heroCase:hover { border-color: var(--accent); transform: translateY(-2px); color: var(--text); }
  .heroCase img { width: 100%; height: auto; border-radius: 2px; }
  .heroCaseText { display: grid; gap: 2px; font-size: 13px; line-height: 1.35; }
  .heroCaseText b { color: var(--heading); font-weight: 600; }
  .heroCaseText span { color: var(--accent); font-weight: 600; }
  .heroCaseText span::after { content: ' →'; }
  /* the hero's entrance waits until the splash has lifted */
  html.js:not(.is-revealed) .heroCopy > *, html.js:not(.is-revealed) .heroMedia img { animation-play-state: paused; }
  @media (prefers-reduced-motion: no-preference) {
    .heroCopy > * { animation: riseIn .8s var(--ease) backwards; }
    .heroCopy > :nth-child(2) { animation-delay: .08s; }
    .heroCopy > :nth-child(3) { animation-delay: .16s; }
    .heroCopy > :nth-child(4) { animation-delay: .24s; }
    .heroCopy > :nth-child(5) { animation-delay: .32s; }
    .heroMedia img { animation: heroSettle 1.6s var(--ease) backwards; }
  }
  @keyframes heroSettle { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: none; } }
  @media (max-width: 900px) {
    .hero { display: block; min-height: 0; }
    .heroMedia { position: relative; width: 100%; height: 42svh; min-height: 250px; }
    .heroMedia img { object-position: 60% 35%; }
    .heroMedia::after { background: linear-gradient(0deg, var(--night) 0%, rgba(11, 12, 13, 0) 45%); }
    .heroMedia .aiTag { top: calc(var(--hdr) + 10px); right: 12px; }
    .heroInner { margin-top: -28px; padding-top: 0; padding-bottom: 28px; }
    .hero h1 { margin-bottom: 12px; font-size: clamp(32px, 8.8vw, 42px); }
    .lead { font-size: 16px; }
    .heroCta { margin-top: 18px; gap: 10px; }
    .heroCta .btn { flex: 1 1 auto; min-height: 48px; padding: 0 16px; }
    .heroPoints { margin-top: 24px; padding-top: 16px; }
    .heroPoints li { padding: 0 10px; font-size: 12px; }
    .heroCase { position: relative; right: auto; bottom: auto; width: auto; margin: 0 var(--gutter) 28px; grid-template-columns: 100px minmax(0, 1fr); }
  }
```
If `grep -c '@keyframes riseIn' index.html` prints `0`, add `  @keyframes riseIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }` to this block.

- [ ] **Step 6: English**

In `js/i18n.js` replace the whole `hero: { … },` object in `EN` with:

```js
  hero: {
    eyebrow: 'Teeth whitening in Aachen',
    h1: 'A brighter smile – <em>measured, not guessed.</em>',
    lead: 'We read your tooth shade before and after with the same shade guide, so you see in black and white what has changed.',
    book: 'Book a consultation',
    cases: 'See real cases',
    trustAria: 'In short',
    t1: 'Measured before and after',
    t2: 'First visit via your health insurance',
    t3: 'Written cost plan',
    imgAlt: 'A smile in close-up; a gloved hand holds a shade-guide sample tooth to the front teeth (AI-generated image)',
    caseB: 'A real case from our practice',
    caseS: 'See before and after',
    caseAlt: 'Case 1 from our practice: before on the left, after on the right',
  },
```
and delete both `stage: { … },` entries from `DYN.de` and `DYN.en`.

- [ ] **Step 7: Delete the old hero 3D**

```bash
grep -rn "hero-stage\|treatment\.js\|teeth-stage\|jaw-yellow\|jaw-white\|jaw\.glb\|stage-test\|shoot-hero\|compress-model" --include=*.html --include=*.js --include=*.mjs --include=*.json . | grep -v '^./docs/'
```
Expected before deleting: hits only inside the files about to go and in `tools/lib.mjs`'s now-removed route (none left) — README hits are fixed in Task 12. Then:

```bash
rm js/hero-stage.js js/treatment.js js/teeth-stage.js js/src/teeth-stage.js assets/models/jaw.glb \
   assets/photos/jaw-yellow.webp assets/photos/jaw-white.webp assets/photos/jaw-yellow-wide.webp assets/photos/jaw-white-wide.webp \
   tools/stage-test.html tools/shoot-hero.mjs tools/compress-model.mjs
```

- [ ] **Step 8: Verify**

```bash
node --test tests/ && node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs
npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t5
```
Expected: all PASS. Laptop hero: copy left on black, image right fading into black, case card bottom-right, AI tag top-right under the header. Phone hero: image banner, then headline, lead and both buttons within the first 844 px above the sticky bar.

- [ ] **Step 9: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 6: The doctor section

**Files:**
- Copy: `../veneer-webpage/assets/doctor-molaie.webp`, `doctor-molaie-720.webp`, `doctor-molaie.jpg` → `assets/photos/`
- Modify: `index.html` (move and replace `#behandler`, JSON-LD image, CSS), `js/i18n.js` (`EN.doctor`), `tools/check-page.mjs`
- Delete: `assets/photos/doctor.jpg`

**Interfaces:**
- Produces: `.doctorFeature`, `.doctorFeature__photo`, `.doctorFeature__text`, `.doctorFeature__quote`, `.doctorFeature__facts`, `[data-count]` numbers (animated in Task 11).

- [ ] **Step 1: Failing check**

Add to `tools/check-page.mjs` right after the hero block from Task 5:

```js
  // ---- doctor: portrait, quote, three facts, right after the hero ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const d = await page.evaluate(() => ({
      next: document.querySelector('main > section.hero').nextElementSibling?.id,
      photo: document.querySelector('.doctorFeature__photo img')?.getAttribute('src'),
      quote: document.querySelector('.doctorFeature__quote p')?.textContent,
      facts: document.querySelectorAll('.doctorFeature__facts > div').length,
    }));
    ok('doctor: follows the hero, suit portrait, quote and three facts', d.next === 'behandler' && /doctor-molaie/.test(d.photo || '') && /Lebensfreude/.test(d.quote || '') && d.facts === 3, JSON.stringify(d));
    await ctx.close();
  }
```
Run `node tools/check-page.mjs 2>&1 | grep doctor:` — expected FAIL.

- [ ] **Step 2: Assets**

`cp ../veneer-webpage/assets/doctor-molaie.webp ../veneer-webpage/assets/doctor-molaie-720.webp ../veneer-webpage/assets/doctor-molaie.jpg assets/photos/`

- [ ] **Step 3: Markup — move and replace**

Delete the old `<section class="section band--doctor" id="behandler" …>` … `</section>` element where it stands, and insert this directly after the hero's `</section>` (so it sits before `#behandlung`):

```html
<section class="band--doctor" id="behandler" aria-labelledby="docH">
  <div class="doctorFeature">
    <figure class="doctorFeature__photo">
      <img src="assets/photos/doctor-molaie.webp" srcset="assets/photos/doctor-molaie-720.webp 720w, assets/photos/doctor-molaie.webp 1120w" sizes="(max-width: 900px) 100vw, 50vw" width="1120" height="1400" loading="lazy" decoding="async" data-i18n-alt="doctor.alt" alt="Novin Molaie, Zahnarzt der Zahnarztpraxis AIXSMILE in Aachen">
    </figure>
    <div class="doctorFeature__text">
      <p class="eyebrow" data-i18n="doctor.eyebrow">Ihr Behandler</p>
      <h2 id="docH" data-i18n="doctor.h2">Moderne Zahnaufhellung <em>mit medizinischem Anspruch.</em></h2>
      <blockquote class="doctorFeature__quote">
        <p data-i18n="doctor.quote">„Ein strahlendes Lächeln ist mehr als Ästhetik – es ist ein Stück Lebensfreude.“</p>
        <div class="doctorFeature__sign"><b>Novin Molaie</b><span data-i18n="doctor.role">Zahnarzt · Zahnarztpraxis AIXSMILE, Aachen</span></div>
      </blockquote>
      <p class="doctorFeature__lede" data-i18n="doctor.p1">Vor dem Gel steht bei uns die Untersuchung. Wir sagen Ihnen offen, welches Weiß bei Ihren Zähnen realistisch ist – und wenn Füllungen oder Kronen nicht mit aufhellen, welche Wege es sonst gibt.</p>
      <dl class="doctorFeature__facts">
        <div><dt data-count>5</dt><dd data-i18n="doctor.fact1">Sprachen in der Praxis</dd></div>
        <div><dt data-count>2×</dt><dd data-i18n="doctor.fact2">gemessen: vorher und nachher</dd></div>
        <div><dt>1–3</dt><dd data-i18n="doctor.fact3">Jahre hält das Ergebnis meist</dd></div>
      </dl>
      <a class="doctorFeature__link" href="#buchen" data-cta="book"><span data-i18n="doctor.cta">Beratung vereinbaren</span> <i aria-hidden="true">→</i></a>
    </div>
  </div>
</section>
```

In the JSON-LD change `"image": "https://bleaching-aachen.de/assets/photos/doctor.jpg",` to `"image": "https://bleaching-aachen.de/assets/photos/doctor-molaie.jpg",`.

- [ ] **Step 4: CSS**

`node tools/css-prune.mjs '^\.band--doctor' '^\.portrait' '^\.doctorRole' 'comment:===== Behandler ====='`

Append before `</style>`:

```css
  /* ===== Doctor (2026-09-28): the veneer page's doctor feature ===== */
  .doctorFeature { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: min(92vh, 860px); }
  .doctorFeature__photo { position: relative; margin: 0; overflow: hidden; background: var(--stone); }
  .doctorFeature__photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 22%; }
  .doctorFeature__text { align-self: center; max-width: 640px; padding: clamp(56px, 8vw, 120px) clamp(24px, 6vw, 104px); }
  .doctorFeature h2 { margin: 0; font-size: clamp(34px, 3.6vw, 54px); line-height: 1.06; }
  .doctorFeature__quote { position: relative; margin: clamp(22px, 3vw, 34px) 0 0; padding: 0 0 0 20px; }
  .doctorFeature__quote::before { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--accent); opacity: .6; transform-origin: top; }
  .doctorFeature__quote p { margin: 0; color: var(--heading); font-family: var(--serif); font-size: clamp(20px, 1.7vw, 25px); font-style: italic; line-height: 1.35; }
  .doctorFeature__sign { display: grid; gap: 4px; margin-top: 14px; }
  .doctorFeature__sign b { color: var(--heading); font-size: 12px; font-weight: 650; letter-spacing: .16em; text-transform: uppercase; }
  .doctorFeature__sign span { color: var(--soft); font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; }
  .doctorFeature__lede { margin: 24px 0 0; font-size: 16.5px; line-height: 1.6; }
  .doctorFeature__facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 30px 0 0; padding: 22px 0 0; border-top: 1px solid var(--line); }
  .doctorFeature__facts div { padding: 0 14px; border-left: 1px solid var(--line); text-align: center; }
  .doctorFeature__facts div:first-child { padding-left: 0; border-left: 0; }
  .doctorFeature__facts dt { color: var(--heading); font-family: var(--serif); font-size: clamp(28px, 2.6vw, 38px); line-height: 1; }
  .doctorFeature__facts dd { margin: 8px 0 0; color: var(--soft); font-size: 10.5px; font-weight: 650; letter-spacing: .14em; line-height: 1.35; text-transform: uppercase; }
  .doctorFeature__link { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; margin-top: 30px; padding: 0 22px; border: 1px solid var(--line-strong);
    border-radius: 3px; color: var(--heading); font-size: 15px; font-weight: 600; text-decoration: none; transition: background-color .2s ease, color .2s ease; }
  .doctorFeature__link:hover, .doctorFeature__link:focus-visible { background: var(--ink); color: #fff; }
  @media (max-width: 900px) {
    .doctorFeature { grid-template-columns: 1fr; min-height: 0; }
    .doctorFeature__photo { aspect-ratio: 1 / .95; }
    .doctorFeature__text { max-width: none; padding: 30px var(--gutter) 48px; }
    .doctorFeature h2 { font-size: clamp(28px, 8vw, 36px); }
    .doctorFeature__quote p { font-size: 19px; }
    .doctorFeature__lede { font-size: 15px; }
    .doctorFeature__facts { margin-top: 24px; padding-top: 18px; }
    .doctorFeature__facts div { padding: 0 8px; }
    .doctorFeature__facts dd { font-size: 9.5px; letter-spacing: .1em; }
  }
```

- [ ] **Step 5: English**

Replace `EN.doctor` with:

```js
  doctor: {
    eyebrow: 'Your dentist',
    h2: 'Modern teeth whitening <em>to medical standards.</em>',
    quote: '“A radiant smile is more than looks – it is a piece of joy in life.”',
    role: 'Dentist · AIXSMILE dental practice, Aachen',
    p1: 'With us, the examination comes before the gel. We tell you openly which white is realistic for your teeth – and, if fillings or crowns will not lighten, which other routes there are.',
    fact1: 'Languages in the practice',
    fact2: 'measured: before and after',
    fact3: 'years the result usually lasts',
    cta: 'Book a consultation',
    alt: 'Novin Molaie, dentist at the AIXSMILE dental practice in Aachen',
  },
```

- [ ] **Step 6: Delete the old portrait and verify**

```bash
grep -rn "doctor\.jpg" index.html js tools | grep -v molaie   # expect nothing
rm assets/photos/doctor.jpg
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-schema.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs && npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t6
```
Expected: all PASS; laptop: portrait fills the left half edge to edge, text right; phone: portrait on top, facts in one row.

- [ ] **Step 7: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 7: Cases and the measuring band

**Files:**
- Modify: `index.html` (`#faelle`, `#messen`, CSS), `js/i18n.js` (`EN.ba`, `EN.s2`), `tools/placeholders.json`, `tools/check-page.mjs`
- Delete: `assets/photos/ai/shade-steps.webp`, `assets/photos/ai/smile.webp`

**Interfaces:**
- Produces: `.swipeRow` (phone swipe-row utility, reused in Task 8), `.cases`, `.case`, `.measure`, `.measurePhoto`, `.measureText`.

- [ ] **Step 1: Failing check**

Add to `tools/check-page.mjs` after the doctor block:

```js
  // ---- phone: cases and methods are swipe rows that do not widen the page ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const rows = await page.evaluate(() => [...document.querySelectorAll('.swipeRow')].map((r) => ({
      id: r.closest('section').id, scrolls: r.scrollWidth > r.clientWidth + 10, snap: getComputedStyle(r).scrollSnapType,
    })));
    const wider = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok('phone: cases (and methods) swipe sideways inside their row, the page does not', rows.length >= 1 && rows.every((r) => r.scrolls && /x/.test(r.snap)) && wider <= 0, JSON.stringify(rows));
    await ctx.close();
  }
```
Run it — expected FAIL (no `.swipeRow`).

- [ ] **Step 2: Cases markup**

In `<section class="section tone-night band--cases" id="faelle" …>`:
- opening tag → `<section class="section band--cases" id="faelle" aria-labelledby="baH">`;
- `<h2 id="baH" data-i18n="ba.h2">Zwei Fälle aus unserer Praxis.</h2>` → `<h2 id="baH" data-i18n="ba.h2">Zwei Fälle <em>aus unserer Praxis.</em></h2>`;
- the `ba.lede` paragraph text → `Mit Einwilligung veröffentlicht. Licht und Kamera waren vorher und nachher nicht gleich – genauer als jedes Foto misst die Farbskala.`;
- `<div class="cases">` → `<div class="cases swipeRow">`;
- `ba.cap1` text → `Gelbliche Verfärbung, in der Praxis aufgehellt. Oben vorher, unten nachher.`; `ba.cap2` text → `Nachgedunkelte Frontzähne, in der Praxis aufgehellt. Oben vorher, unten nachher.`

- [ ] **Step 3: Measuring markup**

Replace the whole `<section class="section section--tight" id="messen" …>` … `</section>` with:

```html
<section class="section tone-night band--measure" id="messen" aria-labelledby="s2H">
  <div class="wrap measure">
    <figure class="media measurePhoto">
      <div class="frame frame--measure">
        <img src="assets/photos/ai/shade-fan.webp" width="1200" height="800" loading="lazy" decoding="async" data-i18n-alt="s2.photoAlt" alt="Eine Farbskala mit Musterzähnen, von gelblich bis hell, auf dunklem Grund (KI-generiertes Bild)">
        <span class="aiTag" aria-hidden="true" data-i18n="ai.tag">KI-generiert</span>
      </div>
    </figure>
    <div class="measureText">
      <p class="eyebrow" data-i18n="s2.eyebrow">Natürlich. Sichtbar. Messbar.</p>
      <h2 id="s2H" data-i18n="s2.h2">Ein hellerer Zahnfarbton – <em>für ein selbstbewussteres Ich.</em></h2>
      <p class="scaleIntro" data-i18n="s2.cardP">Neben Ihre Zähne halten wir Musterzähne mit Kürzeln wie A2 oder BL3: vorher ein Wert, nachher ein Wert.</p>
      <div class="scaleTabs" role="img" data-i18n-aria="s2.scaleAria" aria-label="Vereinfachte Farbskala mit acht Musterzähnen, von A3 bis BL1">
        <span class="tab tab--a3"><i></i>A3</span><span class="tab tab--a2"><i></i>A2</span><span class="tab tab--a1"><i></i>A1</span><span class="tab tab--b1"><i></i>B1</span><span class="tab tab--bl4"><i></i>BL4</span><span class="tab tab--bl3"><i></i>BL3</span><span class="tab tab--bl2"><i></i>BL2</span><span class="tab tab--bl1"><i></i>BL1</span>
      </div>
      <p class="scaleAxis" aria-hidden="true"><span data-i18n="s2.darker">← dunkler</span><span data-i18n="s2.lighter">heller →</span></p>
      <p class="scaleNote" data-i18n="s2.scaleNote">Vereinfacht. Die echte Skala hat mehr Stufen; gemessen wird im Mund, bei Tageslicht.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 4: CSS**

```bash
node tools/css-prune.mjs '^\.band--cases' '^\.cases' '^\.case(?=[\s:,]|$)' '^\.caseNote' '^\.measure' '^\.frame--tall' '^\.stepStrip' '^\.frame--strip' '^\.shadeCard' \
  'comment:Cases: the one dark band' 'comment:cases: both side by side' 'comment:^/\* measuring \*/$'
```
Append before `</style>`:

```css
  /* ===== Phones: a row of cards to swipe (2026-09-28) ===== */
  @media (max-width: 900px) {
    .swipeRow { display: grid; grid-auto-flow: column; grid-template-columns: none; grid-auto-columns: 82%; gap: 12px; overflow-x: auto; overscroll-behavior-x: contain;
      scroll-snap-type: x mandatory; margin: 0 calc(-1 * var(--gutter)); padding: 0 var(--gutter) 6px; scroll-padding-inline: var(--gutter); scrollbar-width: none; }
    .swipeRow::-webkit-scrollbar { display: none; }
    .swipeRow > * { scroll-snap-align: start; }
  }
  /* ===== Cases (2026-09-28): both large, side by side ===== */
  .cases { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(20px, 3vw, 40px); align-items: start; }
  .case { margin: 0; }
  .caseFrame { max-width: none; border-radius: 3px; background: var(--night-2); }
  .case figcaption { margin-top: 14px; font-size: 15.5px; line-height: 1.5; color: var(--text); }
  .case figcaption b { display: block; margin-bottom: 4px; font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--heading); }
  @media (max-width: 900px) {
    .case figcaption { font-size: 14px; }
    .case figcaption b { font-size: 19px; }
  }
  /* ===== Measuring (2026-09-28): the mock's smile band, carrying the shade guide ===== */
  .measure { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr); gap: clamp(28px, 5vw, 80px); align-items: center; }
  .frame--measure { aspect-ratio: 3 / 2; border-radius: 3px; background: var(--night-2); }
  .measureText h2 { max-width: 16ch; }
  .scaleIntro { max-width: 30rem; margin: 0 0 24px; font-size: 17px; }
  @media (max-width: 900px) {
    .measure { grid-template-columns: minmax(0, 1fr); gap: 20px; }
    .frame--measure { aspect-ratio: 16 / 9; }
    .scaleIntro { margin-bottom: 16px; font-size: 15.5px; }
  }
```

- [ ] **Step 5: English and the image manifest**

In `EN.ba` set:

```js
    h2: 'Two cases <em>from our practice.</em>',
    lede: 'Published with consent. Light and camera were not the same before and after – the shade guide measures more precisely than any photo.',
    cap1: 'Yellowish discolouration, whitened in the practice. Top: before, bottom: after.',
    cap2: 'Front teeth darkened over the years, whitened in the practice. Top: before, bottom: after.',
```
(the other `ba` keys stay). Replace the whole `EN.s2` object with:

```js
  s2: {
    eyebrow: 'Natural. Visible. Measurable.',
    h2: 'A lighter shade – <em>for a more confident you.</em>',
    photoAlt: 'A shade guide with sample teeth from yellowish to light, on a dark background (AI-generated image)',
    cardP: 'We hold sample teeth with codes such as A2 or BL3 next to yours: one value before, one value after.',
    scaleAria: 'Simplified shade guide with eight sample teeth, from A3 to BL1',
    darker: '← darker',
    lighter: 'lighter →',
    scaleNote: 'Simplified. The real guide has more steps; we measure in the mouth, in daylight.',
  },
```
In `tools/placeholders.json` delete the `"smile.webp"` and `"shade-steps.webp"` entries (keep it valid JSON — no trailing comma).

- [ ] **Step 6: Delete, verify**

```bash
grep -rn "shade-steps\|ai/smile" index.html js tools   # expect nothing
rm assets/photos/ai/shade-steps.webp assets/photos/ai/smile.webp
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-images.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs && npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t7
```
Expected: all PASS (check-images lists only the remaining images); laptop cases side by side at full width; measuring band dark with the shade-fan image left, the scale right; phone cases swipe.

- [ ] **Step 7: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 8: Methods; the old routes and Ablauf sections go; the nav

**Files:**
- Modify: `index.html` (new `#methoden` after `#messen`; delete `#zwei-wege` and `#ablauf`; nav; CSS), `js/i18n.js` (`EN.methods`, `EN.nav`; delete `EN.routes`, `EN.steps`), `tools/check-page.mjs`

**Interfaces:**
- Produces: `.methods`, `.method`, `.frame--method`, `.methodMeta`; nav links `#behandlung`, `#faelle`, `#methoden`, `#kosten`, `#faq`.

- [ ] **Step 1: Failing check**

Add to `tools/check-page.mjs` after the swipe-row block:

```js
  // ---- methods: three cards, and the nav points at sections that exist ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const m = await page.evaluate(() => ({
      cards: document.querySelectorAll('#methoden .method').length,
      missing: [...document.querySelectorAll('.navLinks a')].map((a) => a.getAttribute('href')).filter((h) => !document.querySelector(h)),
      old: !!document.getElementById('zwei-wege') || !!document.getElementById('ablauf'),
    }));
    ok('methods: three cards; every nav link has its section; the old routes and Ablauf are gone', m.cards === 3 && m.missing.length === 0 && !m.old, JSON.stringify(m));
    await ctx.close();
  }
```
Run it — expected FAIL.

- [ ] **Step 2: Markup**

Delete the whole `<section class="section section--tight" id="zwei-wege" …>` element and the whole `<section class="section tone-stone" id="ablauf" …>` element. Insert directly after the `#messen` section:

```html
<section class="section" id="methoden" aria-labelledby="methodsH">
  <div class="wrap">
    <div class="sectionHead">
      <p class="eyebrow" data-i18n="methods.eyebrow">Unsere Bleaching-Methoden</p>
      <h2 id="methodsH" data-i18n="methods.h2">Individuell. Sicher. <em>Effektiv.</em></h2>
      <p class="lede" data-i18n="methods.lede">Welcher Weg zu Ihren Zähnen, Ihrer Zeit und Ihrer Empfindlichkeit passt, klären wir in der Beratung.</p>
    </div>
    <div class="methods swipeRow">
      <article class="method">
        <div class="frame frame--method"><img src="assets/photos/ai/in-office.webp" width="900" height="1125" loading="lazy" decoding="async" data-i18n-alt="methods.alt1" alt="Eine Person im Behandlungsstuhl mit Schutzbrille, davor die Lampe für die Aufhellung (KI-generiertes Bild)"><span class="aiTag" aria-hidden="true" data-i18n="ai.tag">KI-generiert</span></div>
        <p class="methodMeta" data-i18n="methods.m1">Ein Termin · unter Aufsicht</p>
        <h3 data-i18n="methods.t1">In der Praxis</h3>
        <p data-i18n="methods.p1">Ein stärker dosiertes Gel, von uns aufgetragen und überwacht. Das Ergebnis sehen Sie am selben Tag.</p>
      </article>
      <article class="method">
        <div class="frame frame--method"><img src="assets/photos/ai/at-home.webp" width="900" height="1125" loading="lazy" decoding="async" data-i18n-alt="methods.alt2" alt="Eine Hand hält durchsichtige Bleaching-Schienen und eine kleine Gelspritze (KI-generiertes Bild)"><span class="aiTag" aria-hidden="true" data-i18n="ai.tag">KI-generiert</span></div>
        <p class="methodMeta" data-i18n="methods.m2">Mehrere Tage · zu Hause</p>
        <h3 data-i18n="methods.t2">Zu Hause mit Schienen</h3>
        <p data-i18n="methods.p2">Dünne Schienen nach Maß, darin ein milderes Gel über mehrere Tage – oft angenehmer für empfindliche Zähne.</p>
      </article>
      <article class="method">
        <div class="frame frame--method"><img src="assets/photos/ai/gel.webp" width="900" height="1125" loading="lazy" decoding="async" data-i18n-alt="methods.alt3" alt="Aufhellungsgel wird auf die Frontzähne aufgetragen, das Zahnfleisch ist abgedeckt (KI-generiertes Bild)"><span class="aiTag" aria-hidden="true" data-i18n="ai.tag">KI-generiert</span></div>
        <p class="methodMeta" data-i18n="methods.m3">Praxis und zu Hause</p>
        <h3 data-i18n="methods.t3">Kombiniert</h3>
        <p data-i18n="methods.p3">Der Start in der Praxis, danach mit den Schienen weiter aufhellen oder später auffrischen.</p>
      </article>
    </div>
  </div>
</section>
```

Replace the five links inside `<nav class="navLinks" …>` with:

```html
    <a href="#behandlung" data-i18n="nav.behandlung">Behandlung</a>
    <a href="#faelle" data-i18n="nav.faelle">Fälle</a>
    <a href="#methoden" data-i18n="nav.methoden">Methoden</a>
    <a href="#kosten" data-i18n="nav.kosten">Kosten</a>
    <a href="#faq" data-i18n="nav.faq">Fragen</a>
```

- [ ] **Step 3: CSS**

```bash
node tools/css-prune.mjs '^\.routes' '^\.route(?=[\s:,.]|$)' '^\.routeMeta' '^\.frame--route' '^\.steps4' '^\.stepNum' '^\.stepsHead' '^\.frame--land' \
  'comment:two columns on the laptop stay two columns' 'comment:narrow two-column text: hyphenate' 'comment:^/\* process, routes, when \*/$'
```
Append before `</style>`:

```css
  /* ===== Methods (2026-09-28): three cards as in the client's mock ===== */
  .methods { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(18px, 2.4vw, 32px); }
  .method { margin: 0; }
  .frame--method { aspect-ratio: 4 / 3; margin-bottom: 18px; border-radius: 3px; }
  .frame--method img { transition: transform .7s var(--ease); }
  .method:hover .frame--method img { transform: scale(1.03); }
  .methodMeta { margin: 0 0 6px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
  .method h3 { margin: 0 0 8px; font-size: 24px; }
  .method p:last-child { margin: 0; font-size: 16px; }
  @media (max-width: 900px) {
    .frame--method { margin-bottom: 12px; }
    .method h3 { font-size: 20px; }
    .method p:last-child { font-size: 15px; }
  }
```

- [ ] **Step 4: English**

In `EN.nav` replace `wann: 'When it helps', ablauf: 'Process', faelle: 'Before/after', kosten: 'Costs', faq: 'Questions',` with `behandlung: 'Treatment', faelle: 'Cases', methoden: 'Methods', kosten: 'Costs', faq: 'Questions',`. Delete the whole `steps: { … },` and `routes: { … },` objects. Add:

```js
  methods: {
    eyebrow: 'Our whitening methods',
    h2: 'Individual. Safe. <em>Effective.</em>',
    lede: 'Which route suits your teeth, your time and your sensitivity, we clarify in the consultation.',
    alt1: 'A person in the treatment chair wearing protective glasses, the whitening light in front (AI-generated image)',
    m1: 'One appointment · supervised',
    t1: 'In the practice',
    p1: 'A more concentrated gel, applied and monitored by us. You see the result the same day.',
    alt2: 'A hand holding clear whitening trays and a small gel syringe (AI-generated image)',
    m2: 'Several days · at home',
    t2: 'At home with trays',
    p2: 'Thin custom trays with a milder gel, worn over several days – often gentler on sensitive teeth.',
    alt3: 'Whitening gel being applied to the front teeth, with the gums covered (AI-generated image)',
    m3: 'Practice and home',
    t3: 'Combined',
    p3: 'Start in the practice, then keep whitening with the trays or refresh later on.',
  },
```

- [ ] **Step 5: Verify**

```bash
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs && npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t8
```
Expected: all PASS; three equal cards on laptop; a swipe row on phone.

- [ ] **Step 6: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 9: When it helps, and the costs

**Files:**
- Modify: `index.html` (`#wann` moved after `#methoden`, `#kosten`, CSS), `js/i18n.js` (`EN.when`, `EN.kosten`), `tools/check-page.mjs`

**Interfaces:**
- Produces: `.whenCols`, `.whenList`, `.costCards`, `.costNum`, `.costFactors`, `.factors`, `#priceFrom` (same id; the price script keeps working).

- [ ] **Step 1: Failing check**

Add to `tools/check-page.mjs` after the methods block:

```js
  // ---- phone: stain types in one column; costs as numbered cards ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const c = await page.evaluate(() => ({
      whenCols: getComputedStyle(document.querySelector('.whenCols')).gridTemplateColumns.split(' ').length,
      cards: document.querySelectorAll('.costCards li').length,
      afterMethods: document.getElementById('methoden').nextElementSibling?.id,
    }));
    ok('phone: stain types in one column, three cost cards, "when" follows the methods', c.whenCols === 1 && c.cards === 3 && c.afterMethods === 'wann', JSON.stringify(c));
    await ctx.close();
  }
```
Run it — expected FAIL.

- [ ] **Step 2: When — move and tighten**

Cut the whole `<section class="section section--tight" id="wann" …>` element and paste it directly after the `#methoden` section. Then in it:
- opening tag → `<section class="section tone-stone" id="wann" aria-labelledby="whenH">`;
- `when.h2` → `Nicht jede Verfärbung <em>ist gleich.</em>`;
- `when.lede` → `Woher die Farbe kommt, entscheidet, wie gut sie sich aufhellen lässt. Das klären wir bei der Untersuchung.`;
- `when.p1` → `Die häufigste Verfärbung – und die, die am besten anspricht.`
- `when.p2` → `Mit dem Alter eingelagerte Farbe hellt ein Bleaching meist gut auf.`
- `when.p3` → `Die Reinigung nimmt die Beläge, das Bleaching das Eingelagerte.`
- `when.p4` → `Etwa nach Antibiotika in der Kindheit: hellt zurückhaltender und ungleichmäßiger auf.`
- `when.p5` → `Oft nach einer Wurzelbehandlung; hier braucht es ein anderes Vorgehen.`
- `when.p6` → `Sie behalten ihre Farbe – liegen sie vorn, planen wir die Anpassung mit ein.`

- [ ] **Step 3: Costs markup**

Replace the whole `<section class="section tone-stone band--kosten" id="kosten" …>` element with:

```html
<section class="section" id="kosten" aria-labelledby="kostenH">
  <div class="wrap">
    <div class="sectionHead">
      <p class="eyebrow" data-i18n="kosten.eyebrow">Kosten</p>
      <h2 id="kostenH" data-i18n="kosten.h2">Was ein Bleaching kostet – <em>und wovon das abhängt.</em></h2>
      <p class="lede" data-i18n="kosten.p1">Untersuchung und Farbbestimmung laufen über Ihre Krankenkasse. Bezahlt wird nur die Aufhellung selbst, als Privatleistung nach der GOZ.</p>
    </div>
    <ol class="costCards">
      <li><span class="costNum">01</span><h3 data-i18n="kosten.s1k">Untersuchung und Farbbestimmung</h3><p data-i18n="kosten.s1v">Über Ihre Krankenkasse; Privatversicherte reichen sie wie gewohnt ein.</p></li>
      <li><span class="costNum">02</span><h3 data-i18n="kosten.s2k">Schriftlicher Kostenplan</h3><p data-i18n="kosten.s2v">Mit allen Positionen, bevor irgendetwas behandelt wird.</p></li>
      <li><span class="costNum">03</span><h3 data-i18n="kosten.s3k">Ihre Entscheidung</h3><p data-i18n="kosten.s3v">Sie nehmen den Plan mit und entscheiden ohne Zeitdruck.</p></li>
    </ol>
    <div class="costFactors">
      <h3 data-i18n="kosten.factorsH">Der Preis hängt ab von</h3>
      <ul class="factors">
        <li><b data-i18n="kosten.f1k">Verfahren</b><span data-i18n="kosten.f1v">In der Praxis in einer Sitzung oder zu Hause mit individuell angefertigten Schienen.</span></li>
        <li><b data-i18n="kosten.f2k">Vorbereitung</b><span data-i18n="kosten.f2v">Die professionelle Zahnreinigung vorab, und ob zusätzlich eine kleine Behandlung nötig ist.</span></li>
        <li><b data-i18n="kosten.f3k">Ausgangslage</b><span data-i18n="kosten.f3v">Wie ausgeprägt die Verfärbung ist und wie viele Zähne im sichtbaren Bereich dazugehören.</span></li>
      </ul>
      <p class="priceFrom" id="priceFrom" hidden></p>
    </div>
  </div>
</section>
```

- [ ] **Step 4: CSS**

```bash
node tools/css-prune.mjs '^\.whenCols' '^\.whenList' '^\.frame--thumb' '^\.verdict' '^\.band--kosten' '^\.promise' '^\.factors' '^\.priceFrom' \
  'comment:===== Kosten =====' 'comment:^/\* costs \*/$' 'comment:Two routes, four steps, when it helps'
```
Append before `</style>`:

```css
  /* ===== When it helps (2026-09-28): two groups; one column on phones ===== */
  .whenCols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(28px, 5vw, 72px); }
  .verdict { display: flex; align-items: center; gap: 10px; margin: 0 0 6px; font-family: var(--sans); font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--heading); }
  .verdict::before { content: ''; flex: 0 0 auto; width: 10px; height: 10px; border-radius: 50%; }
  .verdict--good::before { background: var(--accent); }
  .verdict--limit::before { border: 1.5px solid var(--accent); }
  .whenList { list-style: none; margin: 0; padding: 0; }
  .whenList li { display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px 0; border-top: 1px solid var(--line); }
  .frame--thumb { aspect-ratio: 1; border-radius: 3px; }
  .whenList h4 { margin: 0 0 4px; font-family: var(--serif); font-size: 20px; font-weight: 400; line-height: 1.25; color: var(--heading); }
  .whenList p { margin: 0; font-size: 15.5px; line-height: 1.5; }
  /* ===== Costs (2026-09-28): numbered cards as on the veneer page ===== */
  .costCards { list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(14px, 2vw, 24px); margin: 0; padding: 0; }
  .costCards li { padding: 26px 24px 24px; border: 1px solid var(--line); border-radius: 3px; background: #fff; }
  .costNum { display: block; margin-bottom: 18px; font-size: 12px; font-weight: 650; letter-spacing: .16em; color: var(--accent); }
  .costCards h3 { margin: 0 0 8px; font-size: 21px; }
  .costCards p { margin: 0; font-size: 15.5px; }
  .costFactors { display: grid; grid-template-columns: minmax(0, 14rem) minmax(0, 1fr); gap: 8px clamp(24px, 4vw, 56px); margin-top: clamp(32px, 4vw, 48px); }
  .costFactors h3 { font-size: 21px; }
  .factors { list-style: none; margin: 0; padding: 0; }
  .factors li { display: grid; grid-template-columns: 10rem minmax(0, 1fr); gap: 16px; padding: 12px 0; border-top: 1px solid var(--line); font-size: 15.5px; }
  .factors li:last-child { border-bottom: 1px solid var(--line); }
  .factors b { color: var(--heading); font-weight: 600; }
  .priceFrom { grid-column: 2; margin: 14px 0 0; padding: 12px 16px; border-radius: 3px; background: var(--bronze-tint); color: var(--heading); }
  @media (max-width: 900px) {
    .whenCols { grid-template-columns: minmax(0, 1fr); gap: 22px; }
    .whenList li { grid-template-columns: 60px minmax(0, 1fr); gap: 12px; padding: 12px 0; }
    .whenList h4 { font-size: 17px; }
    .whenList p { font-size: 14.5px; }
    .costCards { grid-template-columns: minmax(0, 1fr); gap: 10px; }
    .costCards li { padding: 18px 18px 16px; }
    .costNum { margin-bottom: 8px; }
    .costCards h3 { font-size: 18px; }
    .costCards p { font-size: 14.5px; }
    .costFactors { grid-template-columns: minmax(0, 1fr); margin-top: 24px; }
    .factors li { grid-template-columns: minmax(0, 1fr); gap: 2px; font-size: 14.5px; }
    .priceFrom { grid-column: auto; }
  }
```

- [ ] **Step 5: English**

In `EN.when` set `h2: 'Not every discolouration <em>is the same.</em>'`, `lede: 'Where the colour comes from decides how well it lightens. We find that out at the examination.'`, `p1: 'The most common discolouration – and the one that responds best.'`, `p2: 'Colour stored with age usually lightens well.'`, `p3: 'The cleaning removes the deposits, the whitening what is stored inside.'`, `p4: 'For example after antibiotics in childhood: lightens more modestly and less evenly.'`, `p5: 'Often after a root canal; this needs a different approach.'`, `p6: 'They keep their colour – if they sit at the front, we plan their matching in.'` (the other `when` keys stay).

Replace `EN.kosten` with:

```js
  kosten: {
    eyebrow: 'Costs',
    h2: 'What whitening costs – <em>and what that depends on.</em>',
    p1: 'The examination and shade check go through your health insurance. You only pay for the whitening itself, as a private service under the GOZ fee scale.',
    s1k: 'Examination and shade check', s1v: 'Via your health insurance; privately insured patients submit it as usual.',
    s2k: 'Written cost plan', s2v: 'With every item listed, before anything is treated.',
    s3k: 'Your decision', s3v: 'You take the plan home and decide without time pressure.',
    factorsH: 'The price depends on',
    f1k: 'Method', f1v: 'In the practice in one session, or at home with custom-made trays.',
    f2k: 'Preparation', f2v: 'The professional cleaning beforehand, and whether a small treatment is needed as well.',
    f3k: 'Starting point', f3v: 'How pronounced the discolouration is and how many teeth in the visible area are involved.',
  },
```

- [ ] **Step 6: Verify**

```bash
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs && npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t9
```
Expected: all PASS (the contrast tool forces the price line visible, so the bronze-tint box is audited too).

- [ ] **Step 7: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 10: Booking band, FAQ, practice, footer

**Files:**
- Modify: `index.html` (`#buchen`, `#faq`, `#praxis`, `<footer>`, CSS), `js/i18n.js` (`EN.bk.eyebrow/h2/p`, `EN.faq.h2`, `EN.praxis.h2`), `tools/check-page.mjs`

**Interfaces:**
- Consumes: `js/booking.js` needs only the ids `buchen`, `bkForm` …, `miniToggle`, `miniSlots` — keep them.
- Produces: `.faqIntro`, `.faq` (grid), `.praxisGrid`, `.praxisText`, `.praxisFacts`, `.colophonMark`, `.colophonLead`.

- [ ] **Step 1: Failing check**

Add to `tools/check-page.mjs` after the costs block:

```js
  // ---- booking band dark, FAQ in two columns, practice facts, editorial footer ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const b = await page.evaluate(() => ({
      dark: document.getElementById('buchen').classList.contains('tone-night'),
      faqCols: getComputedStyle(document.querySelector('.faq')).gridTemplateColumns.split(' ').length,
      facts: document.querySelectorAll('.praxisFacts > div').length,
      lead: document.querySelector('.colophonLead')?.textContent.trim(),
      mini: !!document.getElementById('miniToggle') && !!document.getElementById('miniSlots'),
    }));
    ok('booking band dark, FAQ two columns, three practice facts, footer lead, mini slots intact', b.dark && b.faqCols === 2 && b.facts === 3 && b.lead === 'It’s time to smile.' && b.mini, JSON.stringify(b));
    await ctx.close();
  }
```
Run it — expected FAIL.

- [ ] **Step 2: Booking**

In `#buchen`: opening tag → `<section class="section tone-night band--buchen" id="buchen" aria-labelledby="bkH">`; `bk.eyebrow` text → `Bereit für Ihr helleres Lächeln?`; `bk.h2` → `Vereinbaren Sie Ihren <em>persönlichen Beratungstermin.</em>`; `bk.p` → `Unten stehen die Zeiten, die gerade wirklich frei sind. Zeit wählen, Name und Telefonnummer hinterlassen – der Termin steht.` Nothing inside `<form class="bk" …>` changes.

- [ ] **Step 3: FAQ**

In `#faq`: opening tag → `<section class="section band--faq" id="faq" aria-labelledby="faqH">`; its `<div class="wrap inner">` → `<div class="wrap">`; `faq.h2` → `Was vor einem Bleaching <em>oft gefragt wird.</em>`. Leave every `<details>` exactly as it is (the JSON-LD must keep matching).

- [ ] **Step 4: Practice**

Replace the whole `<section class="section band--praxis" id="praxis" …>` element with:

```html
<section class="section tone-stone band--praxis" id="praxis" aria-labelledby="praxisH">
  <div class="wrap praxisGrid">
    <div class="praxisText">
      <p class="eyebrow" data-i18n="praxis.eyebrow">Die Praxis</p>
      <h2 id="praxisH" data-i18n="praxis.h2">In der Großkölnstraße, <em>mitten in Aachen.</em></h2>
      <p class="praxisSoft" data-i18n="praxis.addrP">Mitten in der Innenstadt, wenige Minuten vom Bushof und vom Markt. Parkhaus Großkölnstraße direkt gegenüber.</p>
      <dl class="praxisFacts">
        <div><dt data-i18n="praxis.hoursH">Sprechzeiten</dt><dd><b data-i18n="praxis.hoursDays">Mo · Di · Do</b> · <span data-i18n="praxis.hoursTime">9:00 – 16:00 Uhr</span> · <span data-i18n="praxis.hoursNote">Nur mit Termin.</span><br><button type="button" class="textLink" id="miniToggle" aria-expanded="false" aria-controls="miniSlots" data-i18n="praxis.slotsBtn">Freie Termine ansehen</button><div class="miniSlots" id="miniSlots" hidden></div></dd></div>
        <div><dt data-i18n="praxis.addrH">Anschrift</dt><dd><b>Zahnarztpraxis AIXSMILE</b><br>Großkölnstraße 22–28, 52062 Aachen</dd></div>
        <div><dt data-i18n="praxis.reviewsH">Bewertungen</dt><dd><a class="textLink" href="https://g.page/zahnarztpraxis-aixsmile" target="_blank" rel="noopener" data-i18n="praxis.reviewsBtn">Zu den Google-Bewertungen</a></dd></div>
      </dl>
      <p class="reviewNote" data-i18n="praxis.reviewsP">Was Patientinnen und Patienten über uns schreiben, steht bei Google: vollständig, ungekürzt und nicht von uns ausgewählt.</p>
    </div>
    <a class="mapTile" id="mapTile" href="https://www.google.com/maps/search/?api=1&amp;query=Zahnarztpraxis+AIXSMILE%2C+Gro%C3%9Fk%C3%B6lnstra%C3%9Fe+22-28%2C+52062+Aachen" target="_blank" rel="noopener" data-i18n-aria="praxis.mapAria" aria-label="Karte: Großkölnstraße 22–28, 52062 Aachen. Öffnet die Route in Ihrer Karten-App">
      <img src="assets/photos/map-aachen.webp" width="640" height="640" loading="lazy" decoding="async" alt="">
      <span class="mapPin" aria-hidden="true"><i></i></span>
      <span class="mapLabel"><b>Großkölnstraße 22–28</b><span data-i18n="praxis.mapGo">Route öffnen →</span></span>
      <span class="mapCredit" aria-hidden="true">© OpenStreetMap</span>
    </a>
  </div>
</section>
```

- [ ] **Step 5: Footer**

Replace the `<a class="brand brandFooter" …> … </a>` inside `<div class="colophon">` with:

```html
    <p class="colophonMark" aria-hidden="true">AIXSMILE</p>
    <p class="colophonLead"><em>It&rsquo;s time to smile.</em></p>
```

- [ ] **Step 6: CSS**

```bash
node tools/css-prune.mjs '^\.band--faq' '^\.faq(?=[\s:,]|$)' '^\.faqAside' '^\.band--praxis' '^\.praxisCols' '^\.praxisCol' '^\.praxisSoft' '^\.brandFooter' \
  'comment:===== FAQ =====' 'comment:Praxis: a map tile beside' 'comment:quiet actions in the practice band' 'comment:dentist, faq, practice'
```
Append before `</style>`:

```css
  /* ===== FAQ (2026-09-28): compact, two columns on laptops ===== */
  .faqIntro { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 32px; align-items: end; margin-bottom: clamp(24px, 3vw, 36px); }
  .faqIntro .eyebrow, .faqIntro h2, .faqIntro .faqAside { grid-column: 1; }
  .faqIntro h2 { max-width: 22ch; margin: 0; }
  .faqAside { max-width: 34rem; margin: 10px 0 0; font-size: 16px; color: var(--soft); }
  .faqIntro .cta { grid-column: 2; grid-row: 2 / span 2; margin: 0; }
  .faq { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; align-items: start; }
  .faq details { border: 1px solid var(--line); border-radius: 3px; background: #fff; }
  .faq summary { display: grid; grid-template-columns: minmax(0, 1fr) 30px; gap: 12px; align-items: center; min-height: 56px; padding: 12px 14px 12px 18px;
    cursor: pointer; list-style: none; font-size: 15.5px; font-weight: 600; line-height: 1.35; color: var(--heading); }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::after { content: ''; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line-strong);
    background: linear-gradient(var(--accent), var(--accent)) center / 10px 1.5px no-repeat, linear-gradient(var(--accent), var(--accent)) center / 1.5px 10px no-repeat;
    transition: transform .3s var(--ease); }
  .faq details[open] summary::after { transform: rotate(45deg); }
  .faq summary:hover { color: var(--accent-hover); }
  .faq details p { margin: 0; padding: 0 18px 16px; font-size: 15px; line-height: 1.55; }
  /* ===== Practice (2026-09-28): text and facts beside the map, as on the veneer page ===== */
  .praxisGrid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(260px, .9fr); gap: clamp(28px, 5vw, 72px); align-items: center; }
  .praxisText h2 { max-width: 20ch; }
  .praxisSoft { max-width: 34rem; font-size: 16px; color: var(--soft); }
  .praxisFacts { margin: 22px 0 0; }
  .praxisFacts > div { display: grid; grid-template-columns: 9rem minmax(0, 1fr); gap: 16px; padding: 14px 0; border-top: 1px solid var(--line); }
  .praxisFacts > div:last-child { border-bottom: 1px solid var(--line); }
  .praxisFacts dt { padding-top: 3px; font-size: 12px; font-weight: 650; letter-spacing: .14em; text-transform: uppercase; color: var(--soft); }
  .praxisFacts dd { margin: 0; font-size: 15.5px; color: var(--heading); }
  .reviewNote { margin: 14px 0 0; font-size: 14px; color: var(--soft); }
  .mapTile { border-radius: 3px; }
  /* ===== Footer (2026-09-28): the veneer page's editorial colophon ===== */
  footer { padding: clamp(56px, 8vw, 96px) var(--gutter) 48px; }
  .colophon { max-width: 74rem; margin: 0 auto; }
  .colophonMark { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: .42em; color: var(--heading); }
  .colophonLead { margin: 14px 0 30px; font-family: var(--serif); font-size: clamp(40px, 6vw, 84px); line-height: 1; letter-spacing: -.02em; color: var(--heading); }
  @media (max-width: 900px) {
    .faqIntro { grid-template-columns: minmax(0, 1fr); }
    .faqIntro .cta { grid-column: 1; grid-row: auto; margin-top: 12px; }
    .faq { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .faq summary { min-height: 48px; padding: 10px 12px 10px 14px; font-size: 15px; }
    .faq details p { padding: 0 14px 14px; font-size: 14.5px; }
    .praxisGrid { grid-template-columns: minmax(0, 1fr); }
    .praxisFacts > div { grid-template-columns: minmax(0, 1fr); gap: 4px; }
    .mapTile { aspect-ratio: 16 / 10; }
    .colophonLead { margin-bottom: 22px; font-size: clamp(34px, 11vw, 48px); }
  }
```

- [ ] **Step 7: English**

Set `EN.bk.eyebrow: 'Ready for a brighter smile?'`, `EN.bk.h2: 'Book your <em>personal consultation.</em>'`, `EN.bk.p: 'Below are the times genuinely open right now. Pick one, leave your name and phone number – and the appointment is yours.'`, `EN.faq.h2: 'What people often ask <em>before whitening.</em>'`, `EN.praxis.h2: 'On Großkölnstraße, <em>right in the centre of Aachen.</em>'`.

- [ ] **Step 8: Verify**

```bash
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-schema.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs && npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-t10
```
Expected: all PASS, including every booking-widget flow (full booking, outage, slot taken) and the mini slots; phone footer lead large and italic.

- [ ] **Step 9: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 11: One-time arrivals

**Files:**
- Modify: `index.html` (reveal CSS + inline script), `tools/check-page.mjs` (motion block), `tools/check-contrast.mjs` (force arrivals)

**Interfaces:**
- Produces: classes `.m-rise`, `.m-wipe`, `.m-in`, `html.m-calm`; `[data-count]` count-up.

- [ ] **Step 1: Replace the motion check (failing)**

In `tools/check-page.mjs` replace the whole block that starts `  // ---- motion: nothing is tied to scrolling; reduced motion stills the hero ----` with:

```js
  // ---- motion: sections arrive once; nothing follows the scroll position ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const names = await page.evaluate(() => [...document.querySelectorAll('.heroCopy > *')].map((e) => getComputedStyle(e).animationName));
    ok('reduced motion: the hero copy does not animate', names.every((n) => n === 'none'), names.join(','));
    const calm = await page.evaluate(() => document.documentElement.classList.contains('m-calm'));
    ok('reduced motion: arrivals play as plain fades (html.m-calm)', calm);
    const count = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).length, sel);
    const marked = await count('.m-rise, .m-wipe');
    for (let y = 0; y < 40; y++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(80); }
    await page.waitForTimeout(1200);
    const arrived = await count('.m-rise.m-in, .m-wipe.m-in');
    ok('every marked block has arrived after scrolling through the page', marked > 20 && arrived === marked, `${arrived} of ${marked}`);
    const sample = () => page.evaluate(() => [...document.querySelectorAll('.m-in')].slice(0, 40).map((e) => getComputedStyle(e).opacity + getComputedStyle(e).transform).join('|'));
    const atEnd = await sample();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(600);
    const atTop = await sample();
    const still = await count('.m-rise.m-in, .m-wipe.m-in');
    ok('arrivals are one-time and do not follow the scroll position', still === arrived && atTop === atEnd, `${still} still in; styles ${atTop === atEnd ? 'unchanged' : 'changed'}`);
    await ctx.close();
  }
```
Run it — expected FAIL (`m-calm` missing, 0 marked).

- [ ] **Step 2: The arrivals CSS**

Append before `</style>`:

```css
  /* ===== Arrivals (2026-09-28, ported from the veneer page) =====
     Headings, cards, rows and pictures rise or wipe into place once, the
     first time they come into view (the script before </body> marks them
     .m-rise / .m-wipe and adds .m-in on arrival); numbers count up. Nothing
     follows the scroll position. Content is visible by default: the hidden
     start state needs html.js plus the script's mark. Reduced motion gets
     plain fades (html.m-calm). */
  :root { --m-out: cubic-bezier(.16, 1, .3, 1); }
  @media (prefers-reduced-motion: no-preference) {
    .js .m-rise { opacity: 0; transform: translateY(28px); transition: opacity .9s var(--m-out) var(--m-delay, 0s), transform .9s var(--m-out) var(--m-delay, 0s); }
    .js .m-rise.m-in { opacity: 1; transform: none; }
    .js .m-rise img { scale: 1.08; transition: scale 1.5s var(--m-out) var(--m-delay, 0s), transform .6s var(--m-out); }
    .js .m-rise.m-in img { scale: 1; }
    .js :is(.whenList li, .faq details, .costCards li).m-rise:not(.m-in) { transform: translateY(14px); }
    .js .m-wipe img { clip-path: inset(100% 0 0 0); scale: 1.14;
      transition: clip-path 1.25s var(--m-out) var(--m-delay, 0s), scale 1.9s var(--m-out) var(--m-delay, 0s), transform .9s var(--m-out); }
    .js .m-wipe.m-in img { clip-path: inset(0 0 0 0); scale: 1; }
    .js .doctorFeature__quote.m-rise::before { transform: scaleY(0); transition: transform 1.1s var(--m-out) calc(var(--m-delay, 0s) + .3s); }
    .js .doctorFeature__quote.m-rise.m-in::before { transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .js.m-calm .m-rise { opacity: 0; transition: opacity .8s ease var(--m-delay, 0s); }
    .js.m-calm .m-rise.m-in { opacity: 1; }
    .js.m-calm .m-wipe img { opacity: 0; transition: opacity .9s ease var(--m-delay, 0s); }
    .js.m-calm .m-wipe.m-in img { opacity: 1; }
  }
```

- [ ] **Step 3: The arrivals script**

Insert right after the splash `</script>` (before `<script type="module">`):

```html
<script>
  // Arrivals (2026-09-28, ported from the veneer page): blocks rise or wipe
  // into place once, the first time they come into view, 80 ms apart when
  // several arrive together; numbers marked [data-count] count up. Nothing
  // is tied to the scroll position, and nothing is hidden unless this script
  // runs and the browser can observe intersections.
  (function () {
    if (!('IntersectionObserver' in window)) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) document.documentElement.classList.add('m-calm');
    var RISE = [
      '.sectionHead > *', '.procedure__head > *',
      '.doctorFeature__text > :not(h2)', '.doctorFeature__facts > div',
      '.case', '.measureText > *', '.method', '.whenCols .verdict', '.whenList li',
      '.costCards li', '.costFactors',
      '.band--buchen .intro > *', '.bk',
      '.faqIntro > *', '.faq details',
      '.praxisText > *', 'body > footer .colophon > *'
    ].join(', ');
    var WIPE = ['.doctorFeature__photo', '.measurePhoto', '.frame--method', '.mapTile'].join(', ');
    var items = [].slice.call(document.querySelectorAll(RISE));
    items.forEach(function (el) { el.classList.add('m-rise'); });
    var wipes = [].slice.call(document.querySelectorAll(WIPE));
    wipes.forEach(function (el) { el.classList.add('m-wipe'); });
    var counts = reduce ? [] : [].slice.call(document.querySelectorAll('[data-count]'));

    // numbers count up from zero, keeping their format ("5", "2×")
    function countUp(el) {
      var text = el.textContent, m = text.match(/\d+(?:[.,]\d+)?/);
      if (!m) return;
      var raw = m[0], comma = raw.indexOf(',') > -1, dec = (raw.split(/[.,]/)[1] || '').length;
      var goal = parseFloat(raw.replace(',', '.')), head = text.slice(0, m.index), tail = text.slice(m.index + raw.length), start = 0;
      function step(now) {
        if (!start) start = now;
        var k = Math.min(1, (now - start) / 1300), v = (goal * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        el.textContent = head + (comma ? v.replace('.', ',') : v) + tail;
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      var i = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (counts.indexOf(el) > -1) { countUp(el); return; }
        el.style.setProperty('--m-delay', (Math.min(i++, 7) * 0.08).toFixed(2) + 's');
        el.classList.add('m-in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.concat(wipes, counts).forEach(function (el) { io.observe(el); });
  })();
</script>
```

- [ ] **Step 4: Let the contrast audit see every block**

In `tools/check-contrast.mjs`, inside the `page.evaluate(() => { … })` that opens the booking panes, add as its first line:

```js
      document.querySelectorAll('.m-rise, .m-wipe').forEach((e) => e.classList.add('m-in'));
```
and change the following `await page.waitForTimeout(200);` to `await page.waitForTimeout(1200);` (the reduced-motion fades take .8–.9 s).

- [ ] **Step 5: Verify**

```bash
node tools/check-contrast.mjs && node tools/check-page.mjs && npx html-validate@9 index.html
```
Expected: all PASS; the motion line reports something like `57 of 57`. In a normal (motion-allowed) browser on the live preview: sections rise once, pictures wipe up, the doctor's "5" and "2×" count up; scrolling back up changes nothing.

- [ ] **Step 6: Checkpoint (no git)** — `git status --short . && git status --short ../veneer-webpage`.

---

### Task 12: Final pass — order, narrow phones, docs, cleanup, full verification

**Files:**
- Modify: `tools/check-page.mjs` (section order, overflow in English), `README.md`, `.vercelignore`
- Delete: `tools/css-prune.mjs`

- [ ] **Step 1: Checks for order and English on narrow phones**

In `tools/check-page.mjs` replace the overflow block (`  // ---- no sideways scroll at any width ----` … its closing `  }`) with:

```js
  // ---- no sideways scroll at any width, German and English ----
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [901, 700], [900, 800], [768, 1024], [414, 896], [390, 844], [360, 740], [320, 568]]) {
    for (const lang of w <= 414 ? ['de', 'en'] : ['de']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
      const page = await ctx.newPage(); await mockApi(page);
      await page.goto(srv.url, { waitUntil: 'load' });
      if (lang === 'en') { await page.click('#langToggle'); await page.waitForTimeout(150); }
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(150);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(`no horizontal overflow at ${w}x${h} (${lang})`, over <= 0, `${over}px`);
      await ctx.close();
    }
  }

  // ---- the sections in the agreed order ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || 'hero'));
    const want = ['hero', 'behandler', 'behandlung', 'faelle', 'messen', 'methoden', 'wann', 'kosten', 'buchen', 'faq', 'praxis'];
    ok('sections in the agreed order', JSON.stringify(order) === JSON.stringify(want), order.join(' → '));
    await ctx.close();
  }
```

Run: `node tools/check-page.mjs`. Expected: PASS if Tasks 5–10 placed everything; otherwise move section elements into the listed order and re-run. Fix any English overflow at 320–414 px (typical fixes: `overflow-wrap: anywhere` on the offending element, or a smaller phone font size for that heading).

- [ ] **Step 2: Clean up the dev helper and stale references**

```bash
rm tools/css-prune.mjs
grep -rn "css-prune\|teeth-stage\|hero-stage\|treatment\.js\|jaw\.glb\|jaw-yellow\|Source Serif\|stage-test\|shoot-hero\|compress-model" --include=*.html --include=*.js --include=*.mjs --include=*.css --include=*.json . | grep -v '^./docs/'
```
Expected: no hits (README is fixed next).

- [ ] **Step 3: Deploy ignore**

Add two lines to `.vercelignore` under `# Not part of the site`: `docs` and `tests`.

- [ ] **Step 4: README**

In `README.md`:
- Replace the "**The idea:**" paragraph with: `**The look (redesign 2026-09-28):** the client's own mock of this page — near-black bands, warm cream and stone sections, bronze buttons, headings in the veneer page's serif (Iowan/Palatino) with one italic phrase, Figtree for text. The hero is a smile close-up with the promise "Ein helleres Lächeln – gemessen, nicht geschätzt."; the page keeps its honest idea that the shade is measured before and after. Spec: docs/superpowers/specs/2026-09-28-bleaching-redesign-design.md; plan: docs/superpowers/plans/2026-09-28-bleaching-redesign.md.`
- In the "What's here" table replace the rows for `js/treatment.js`, `js/hero-stage.js`, `js/teeth-stage.js`, `assets/models/jaw.glb` and `assets/fonts/` with:
  - `| js/bleach-timeline.js | The treatment as one number p (0..1): steps, shades, barrier, gel, camera — read by the 3D, the section script, the stills tool and the tests |`
  - `| js/treatment-section.js | The 3D section: press-and-hold playback, step dots, captions (read from the section's step list), shade readout, loading and stills fallback |`
  - `| js/bleach-stage.js | The 3D stage with three.js, bundled and minified (built from js/src/bleach-stage.js + js/src/bleach-rig.js, do not edit) |`
  - `| assets/models/dentition.glb | The dentition model, copied from the veneer page (32 crowns, gums, bite hinge) |`
  - `| assets/treatment/ | The five step stills (poster, no-WebGL and no-JS fallback) |`
  - `| assets/fonts/ | Figtree, self-hosted (headings use the system serif stack) |`
  
  and change the `assets/photos/` row to `| assets/photos/ | Two consented cases (+ the hero's case pair), the doctor's portrait (doctor-molaie*), the map; ai/ holds the labelled AI images in use |`. Delete the `assets/photos/ai/` row that says the images were removed.
- Replace the section "## The 3D jaw in the hero (2026-09-25)" (up to the next `##`) with:

```markdown
## The 3D treatment (2026-09-28)

Section `#behandlung`: the bleaching on the veneer page's realistic dentition, colour only (tooth shapes never change). Five steps: measure A3.5, protect the gums, apply the gel, let it work (A3 → B1), gel off and measure BL4. The visitor presses and holds the right side of the view to play it (about 12 s); letting go pauses; the dots jump to a step; scrolling changes nothing. Every visitor with WebGL gets the live 3D; it loads when the section comes near. Without WebGL (or when a phone drops the context) the dots switch between five stills; without JS the stills show as a list. Labelled "Symbolbild · kein Behandlungsergebnis".

After editing `js/src/*` or `js/bleach-timeline.js`:

    node tools/build-3d.mjs              # js/bleach-stage.js
    node tools/render-teeth.mjs          # test frames into tools/shots/
    node tools/render-teeth.mjs --stills # assets/treatment/step-N.webp
    node --test tests/

Both tools borrow esbuild, three.js (0.184) and Playwright from the main app's node_modules (`AIXSMILE_DIR` wins).
```
- Replace the section "## The AI images (no longer on the page)" (up to the next `##`) with:

```markdown
## The AI images

In use, all dental and labelled "KI-generiert": `hero.webp` (hero placeholder until the final smile close-up arrives), `shade-fan.webp` (measuring band), `in-office.webp`, `at-home.webp`, `gel.webp` (methods), six `stain-*.webp` (when it helps). None is shown as a result; results come only from the two real cases.

**Swapping in the final hero image:** save the owner's ChatGPT image as `assets/photos/ai/incoming/hero-smile.png`; write `hero-smile.webp` (2400 px wide, quality 82) and `hero-smile-phone.webp` (a 1200×900 crop centred on the smile) with PIL; point the hero `<img>` and the `<link rel="preload">` at them (a `<picture>` with a `(max-width: 900px)` source for the phone crop); change the German alt text to „Nahaufnahme eines natürlichen, hellen Lächelns (KI-generiertes Bild)“ and `EN.hero.imgAlt` to "A natural, bright smile in close-up (AI-generated image)"; add `"hero-smile.webp": "real-image"` to `tools/placeholders.json`; run the checks.
```
- In "## Checks" add as the first line `node --test tests/                 # the timeline and the rig`.
- In "## Sign-off still needed": in the clinician bullet replace "the hero's five treatment steps and the shade path A3.5 to BL4 on the 3D model" with "the five 3D steps and captions and the shade path A3.5 to BL4 on the dentition model", and add the bullets "**Doctor:** the quote from the client's mock attributed to him; the facts „2× gemessen“ and „1–3 Jahre“." and "**Clinician:** that a combined route („Kombiniert“) is offered."

- [ ] **Step 5: Full verification**

```bash
node --test tests/
node tools/check-i18n.mjs && node tools/check-fresh.mjs && node tools/check-schema.mjs && node tools/check-images.mjs && node tools/check-contrast.mjs
node tools/check-page.mjs
npx html-validate@9 index.html
node tools/shoot.mjs $SCRATCH/shots-final
node -e "const h=require('fs').readFileSync('index.html','utf8');const m=h.slice(h.indexOf('<main'),h.indexOf('</main>'));const t=m.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/g,' ');console.log('words in main:',t.split(/\s+/).filter(w=>/\p{L}/u.test(w)).length)"
curl -sI http://127.0.0.1:8090/js/bleach-stage.js | grep -i cache-control
```
Expected: everything PASS; the word count roughly 30 % below Task 3's baseline (report both numbers; the 3D step list counts once as visible copy); the preview serves `no-store`. Look at every final screenshot on laptop and phone next to the client's mock (`~/.claude/uploads/c77f5ca6-559c-467e-9f09-00f9aed0c64f/2d6ff08e-image.jpg`): dark hero with bronze buttons and the italic phrase, doctor quote beside the large portrait with facts, dark smile band, three method cards, dark booking band, editorial footer.

- [ ] **Step 6: Report (no git)**

Run `git status --short . && git status --short ../veneer-webpage`. Report to the owner: every changed, new and deleted file; the check results; the Wi-Fi preview link (`ip -4 -o route get 1.1.1.1` for the current IP, port 8090); the open sign-offs (doctor quote and facts, clinician captions and "Kombiniert", the final hero image). Update the memory note `bleaching-page-state.md` with what shipped. Do not commit.
