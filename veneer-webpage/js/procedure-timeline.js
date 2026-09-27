// The veneer procedure as a pure function of scroll progress (0..1).
// No three.js here: the section script, the 3D rig and the tests all read the
// same numbers, so scrolling back simply plays the treatment in reverse.
//
// Six steps share the progress evenly. Inside each step the action runs over
// roughly the first 70% and the last part holds, so the caption can be read
// while the teeth stand still.

export const STEP_COUNT = 6;
export const STEP_IDS = ['start', 'prep', 'scan', 'tryin', 'bond', 'result'];

// The six veneer teeth, left to right as the visitor sees them (FDI numbers).
export const VENEER_TEETH = ['13', '12', '11', '21', '22', '23'];
// Shells go on centrals first, then laterals, then canines.
const SEAT_RANK = { 11: 0, 21: 1, 12: 2, 22: 3, 13: 4, 23: 5 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const ramp = (x, a, b) => clamp01((x - a) / (b - a));
const at = (step, local) => (step + local) / STEP_COUNT;

/** n items share one interval; each starts a little after the previous. */
function stagger(t, n, i, overlap) {
  const d = 1 / ((n - 1) * (1 - overlap) + 1);
  return clamp01((t - i * d * (1 - overlap)) / d);
}

// Camera keys: `close` 0 = both arches in view, 1 = the six front teeth;
// az/el in degrees (az > 0 swings to the visitor's right); zoom < 1 = nearer.
const CAMERA_KEYS = [
  { p: 0.000, close: 0, az: 0, el: 5, zoom: 1.0 },
  { p: 0.130, close: 0.35, az: 0, el: 4, zoom: 1.0 },
  { p: 0.205, close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: 0.500, close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: 0.560, close: 1, az: 16, el: 5, zoom: 1.02 },
  { p: 0.640, close: 1, az: 16, el: 5, zoom: 1.02 },
  { p: 0.705, close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: 0.835, close: 1, az: 0, el: 2, zoom: 1.0 },
  { p: 0.915, close: 0, az: 0, el: 4, zoom: 0.94 },
  { p: 1.000, close: 0, az: 0, el: 4, zoom: 0.94 },
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
  return Math.min(STEP_COUNT - 1, Math.max(0, Math.floor(clamp01(p) * STEP_COUNT + 1e-9)));
}

/** Where a step dot scrolls to: the moment that step's action has finished. */
export function stepAnchor(step) {
  return step === 0 ? 0 : at(step, step === STEP_COUNT - 1 ? 0.6 : 0.8);
}

export function sampleProcedure(p) {
  const x = clamp01(p);
  const prepT = ramp(x, at(1, 0.08), at(1, 0.72));
  const scanT = ramp(x, at(2, 0.1), at(2, 0.72));
  const scanVis = smooth(ramp(x, at(2, 0.02), at(2, 0.12))) * (1 - smooth(ramp(x, at(2, 0.8), at(2, 0.96))));
  const shellShow = smooth(ramp(x, at(3, 0.02), at(3, 0.2)));
  const seatT = ramp(x, at(3, 0.22), at(3, 0.74));
  const cureT = ramp(x, at(4, 0.08), at(4, 0.8));

  const prep = [], seat = [], glow = [], bonded = [];
  VENEER_TEETH.forEach((id, i) => {
    prep.push(stagger(prepT, 6, i, 0.55));
    seat.push(smooth(stagger(seatT, 6, SEAT_RANK[id], 0.5)));
    const c = stagger(cureT, 6, i, 0.35);
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
  };
}
