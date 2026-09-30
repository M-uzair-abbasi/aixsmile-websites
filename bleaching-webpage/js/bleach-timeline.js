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
// Tuned by eye against tools/shots/bleach-p*.webp (tools/render-teeth.mjs).
export const SHADE_TINTS = [
  [0.94, 0.76, 0.45], [0.97, 0.81, 0.53], [0.99, 0.87, 0.65], [1.0, 0.93, 0.78], [1.02, 0.99, 0.9], [1.05, 1.08, 1.17],
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
