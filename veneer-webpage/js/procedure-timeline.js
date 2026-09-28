// The veneer procedure as a pure function of playback progress (0..1).
// No three.js here: the section script, the 3D rig and the tests all read the
// same numbers, so any progress (held playback, a step dot) looks the same.
//
// Six steps share the progress; the preparation, the heart of the story, gets
// more time than the others (STEP_WEIGHTS). Inside each step the action runs
// over roughly the first 70–80% and the rest holds, so the caption can be read
// while the teeth stand still.

export const STEP_COUNT = 6;
export const STEP_IDS = ['start', 'prep', 'scan', 'tryin', 'bond', 'result'];

// The veneer teeth (FDI numbers): ten upper, premolar to premolar, left to
// right as the visitor sees them, then the six lower front teeth.
export const VENEER_TEETH = [
  '15', '14', '13', '12', '11', '21', '22', '23', '24', '25',
  '43', '42', '41', '31', '32', '33',
];
// Left-to-right slot for the preparation and curing sweeps; a lower tooth
// shares the slot of the upper tooth above it.
const SLOTS = 10;
const SLOT = { 15: 0, 14: 1, 13: 2, 12: 3, 11: 4, 21: 5, 22: 6, 23: 7, 24: 8, 25: 9, 43: 2, 42: 3, 41: 4, 31: 5, 32: 6, 33: 7 };
// Shells go on from the middle outwards: centrals, laterals, canines,
// premolars; each lower shell half a beat after the upper one above it.
const SEAT_RANK = { 11: 0, 21: 1, 12: 2, 22: 3, 13: 4, 23: 5, 14: 6, 24: 7, 15: 8, 25: 9, 41: 0.5, 31: 1.5, 42: 2.5, 32: 3.5, 43: 4.5, 33: 5.5 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const ramp = (x, a, b) => clamp01((x - a) / (b - a));
// share of the playback per step: start, preparation, scan, try-in, bonding,
// result (held playback takes PLAY_SECONDS in procedure-section.js in all).
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
  // the result: both rows of veneers fill the frame, a little from above;
  // the gums run out of view, so it reads as a smile, not a model
  { p: at(5, 0.49), close: 0.3, az: 0, el: 6, zoom: 0.78 },
  { p: 1, close: 0.3, az: 0, el: 6, zoom: 0.78 },
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

/** Where a step dot takes the playhead: the moment that step's action has finished. */
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

  const prep = [], seat = [], glow = [], bonded = [];
  VENEER_TEETH.forEach((id) => {
    prep.push(stagger(prepT, SLOTS, SLOT[id], 0.68));
    seat.push(smooth(stagger(seatT, SLOTS, SEAT_RANK[id], 0.6)));
    const c = stagger(cureT, SLOTS, SLOT[id], 0.5);
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
