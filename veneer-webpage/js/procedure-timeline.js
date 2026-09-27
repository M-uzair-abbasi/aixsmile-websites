// The veneer procedure as a pure function of scroll progress (0..1).
// No three.js here: the section script, the 3D rig and the tests all read the
// same numbers, so scrolling back simply plays the treatment in reverse.
//
// Six steps share the progress; the preparation, the heart of the story, gets
// more scroll than the others (STEP_WEIGHTS). Inside each step the action runs
// over roughly the first 70–80% and the rest holds, so the caption can be read
// while the teeth stand still.

export const STEP_COUNT = 6;
export const STEP_IDS = ['start', 'prep', 'scan', 'tryin', 'bond', 'result'];

// The ten veneer teeth, premolar to premolar, left to right as the visitor
// sees them (FDI numbers): everything a wide smile shows.
export const VENEER_TEETH = ['15', '14', '13', '12', '11', '21', '22', '23', '24', '25'];
// Shells go on from the middle outwards: centrals, laterals, canines, premolars.
const SEAT_RANK = { 11: 0, 21: 1, 12: 2, 22: 3, 13: 4, 23: 5, 14: 6, 24: 7, 15: 8, 25: 9 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const ramp = (x, a, b) => clamp01((x - a) / (b - a));
// scroll share per step: start, preparation, scan, try-in, bonding, result.
// The section's scroll length in CSS (.procedure__track) follows the total.
const STEP_WEIGHTS = [1, 1.6, 1, 1, 1, 1];
const TOTAL = STEP_WEIGHTS.reduce((a, b) => a + b, 0);
const STARTS = STEP_WEIGHTS.map((_, i) => STEP_WEIGHTS.slice(0, i).reduce((a, b) => a + b, 0));
/** Overall progress at `local` (0..1) of the way through `step`. */
export function stepProgress(step, local) {
  return step >= STEP_COUNT ? 1 : (STARTS[step] + local * STEP_WEIGHTS[step]) / TOTAL;
}
const at = stepProgress;

/** n items share one interval; each starts a little after the previous. */
function stagger(t, n, i, overlap) {
  const d = 1 / ((n - 1) * (1 - overlap) + 1);
  // rounded, so the last item really reaches 1 (and the first really starts at 0)
  return clamp01(Math.round(((t - i * d * (1 - overlap)) / d) * 1e9) / 1e9);
}

// Camera keys: `close` 0 = both arches in view, 1 = the six front teeth;
// az/el in degrees (az > 0 swings to the visitor's right); zoom < 1 = nearer.
const CAMERA_KEYS = [
  { p: at(0, 0), close: 0, az: 0, el: 5, zoom: 1.0 },
  { p: at(0, 0.78), close: 0.35, az: 0, el: 4, zoom: 1.0 },
  { p: at(1, 0.14), close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: at(3, 0), close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: at(3, 0.36), close: 1, az: 16, el: 5, zoom: 1.02 },
  { p: at(3, 0.84), close: 1, az: 16, el: 5, zoom: 1.02 },
  { p: at(4, 0.23), close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: at(5, 0.01), close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: at(5, 0.49), close: 0, az: 0, el: 4, zoom: 0.94 },
  { p: 1, close: 0, az: 0, el: 4, zoom: 0.94 },
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

export function stepAt(p) {
  const x = clamp01(p) * TOTAL + 1e-9;
  let k = 0;
  while (k < STEP_COUNT - 1 && x >= STARTS[k + 1]) k++;
  return k;
}

/** Where a step dot scrolls to: the moment that step's action has finished. */
export function stepAnchor(step) {
  return step === 0 ? 0 : at(step, step === STEP_COUNT - 1 ? 0.6 : 0.8);
}

export function sampleProcedure(p) {
  const x = clamp01(p);
  const prepT = ramp(x, at(1, 0.16), at(1, 0.8));
  const scanT = ramp(x, at(2, 0.08), at(2, 0.78));
  const scanVis = smooth(ramp(x, at(2, 0.02), at(2, 0.1))) * (1 - smooth(ramp(x, at(2, 0.84), at(2, 0.97))));
  const shellShow = smooth(ramp(x, at(3, 0.02), at(3, 0.16)));
  const seatT = ramp(x, at(3, 0.16), at(3, 0.78));
  const cureT = ramp(x, at(4, 0.06), at(4, 0.82));

  const n = VENEER_TEETH.length;
  const prep = [], seat = [], glow = [], bonded = [];
  VENEER_TEETH.forEach((id, i) => {
    prep.push(stagger(prepT, n, i, 0.68));
    seat.push(smooth(stagger(seatT, n, SEAT_RANK[id], 0.6)));
    const c = stagger(cureT, n, i, 0.5);
    glow.push(Math.sin(Math.PI * c));
    bonded.push(smooth(ramp(c, 0.5, 1)));
  });

  return {
    progress: x,
    step: stepAt(x),
    camera: cameraAt(x),
    prep,
    scan: { sweep: scanT, opacity: scanVis },
    shellShow,
    seat,
    glow,
    bonded,
    result: smooth(ramp(x, at(5, 0), at(5, 0.4))),
    // the lower teeth are whitened to match, then a shine runs across the smile
    whiten: smooth(ramp(x, at(5, 0.05), at(5, 0.4))),
    shine: ramp(x, at(5, 0.2), at(5, 0.75)),
  };
}
