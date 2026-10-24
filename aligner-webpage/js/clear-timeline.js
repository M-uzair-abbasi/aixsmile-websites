// The aligner journey as numbers. One pinned section, one scroll progress p
// (0..1), and everything the 3D world and its captions do at that point:
//
//   hero     a woman holds out her open palm; the crooked glass teeth float
//            above it, turning slowly. Scrolling lifts them out of her hand
//            and she dissolves into the mist; labels mark the crooked teeth
//   scan     the teeth dissolve into points and a scan line passes over them
//   plan     every tooth moves into place, tray 01 → 24
//   aligner  the bite opens; the upper tray comes in under the upper teeth and
//            clicks on, then the lower one; the bite closes, a glint runs
//   result   the world turns to white fog, the photo of a smile comes up
//
// Between the chapters the camera dives through fog with rainbow edges (dive).
// Pure: no DOM, no three.js, so js/site.js and the 3D stage read the same
// timeline, and node can test it.

export const TRAYS = 24;

// [from, to] in scroll progress; the aligner gets the most room, it is the
// moment the page is about
export const CHAPTERS = [
  { id: 'hero', from: 0, to: 0.11 },
  { id: 'scan', from: 0.11, to: 0.3 },
  { id: 'plan', from: 0.3, to: 0.5 },
  { id: 'aligner', from: 0.5, to: 0.885 },
  { id: 'result', from: 0.885, to: 1 },
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (u) => { const t = clamp(u); return t * t * (3 - 2 * t); };
const ramp = (p, a, b) => smooth((p - a) / (b - a));
// straight from 0 to 1 between a and b (the rig shapes it itself)
const lin = (p, a, b) => clamp((p - a) / (b - a));
// on between a→b, off between c→d
const span = (p, a, b, c, d) => ramp(p, a, b) * (1 - ramp(p, c, d));
// a short bump that peaks at m and is gone w either side
const bump = (p, m, w) => smooth(1 - Math.abs(p - m) / w);

// camera keys: azimuth / elevation in degrees, zoom (1 = the whole set fills
// the frame), lift (fraction of the set's height the view looks above centre)
const CAM = [
  [0.00, { az: -14, el: 24, zoom: 1.0, lift: 0 }],
  [0.08, { az: -12, el: 15, zoom: 0.95, lift: 0 }],
  [0.11, { az: -6, el: 14, zoom: 0.92, lift: 0 }],
  [0.155, { az: 0, el: 46, zoom: 0.9, lift: 0 }],
  [0.2, { az: -24, el: 42, zoom: 0.88, lift: 0 }],
  [0.26, { az: 24, el: 40, zoom: 0.88, lift: 0 }],
  [0.325, { az: 0, el: 3, zoom: 0.62, lift: 0.02 }],
  [0.48, { az: 0, el: 3, zoom: 0.64, lift: 0.02 }],
  // the trays: from the front, a little to the side, level with the open
  // bite so the gap each tray closes is plain to see; then round to the other
  // side to show both seated
  [0.55, { az: -24, el: 1, zoom: 0.84, lift: 0.2 }],
  [0.655, { az: -14, el: 0, zoom: 0.8, lift: 0.2 }],
  [0.7, { az: 12, el: 3, zoom: 0.82, lift: 0.17 }],
  [0.77, { az: 20, el: 4, zoom: 0.82, lift: 0.15 }],
  [0.82, { az: -26, el: 8, zoom: 0.7, lift: 0.06 }],
  [0.875, { az: 16, el: 6, zoom: 0.68, lift: 0.06 }],
  [0.97, { az: 0, el: 3, zoom: 1.5, lift: 0 }],
  [1.00, { az: 0, el: 3, zoom: 1.6, lift: 0 }],
];

function camAt(p, out) {
  let i = 0;
  while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++;
  const [a, ca] = CAM[i], [b, cb] = CAM[i + 1];
  const k = smooth((p - a) / (b - a));
  for (const key of ['az', 'el', 'zoom', 'lift']) out[key] = ca[key] + (cb[key] - ca[key]) * k;
  return out;
}

export function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (p >= CHAPTERS[i].from) return i;
  return 0;
}

/** Where to scroll for chapter i (a point where it is fully on show; for the
 *  aligner, the moment the upper tray comes in). */
export function chapterAnchor(i) {
  return [0, 0.2, 0.41, 0.56, 0.97][i] ?? 0;
}

/** Everything at progress p. Reuses `out` when given (no allocation per frame). */
export function sample(p, out = { camera: {} }) {
  p = clamp(p);
  out.p = p;
  // the hero's words make way, then the chapter caption comes in
  out.play = ramp(p, 0, 0.045);
  out.cap = ramp(p, 0.064, 0.094);
  // the set floats in her hand, then lifts out and comes to the middle;
  // she dissolves into the mist meanwhile
  out.hold = 1 - ramp(p, 0.015, 0.085);
  out.person = 1 - ramp(p, 0.018, 0.075);
  // the scan: solid → points → a line passes → solid again
  out.dissolve = span(p, 0.142, 0.176, 0.258, 0.288);
  out.points = span(p, 0.138, 0.176, 0.264, 0.294);
  out.sweep = -1.2 + 2.4 * ramp(p, 0.176, 0.258);
  // the plan: crooked → straight
  out.straight = ramp(p, 0.325, 0.48);
  out.tray = Math.max(1, Math.min(TRAYS, 1 + Math.floor(out.straight * TRAYS * 0.999)));
  // the aligner, one arch at a time: the bite opens; each tray comes in
  // (upIn / loIn) to just off its teeth, then is pushed on (upSeat / loSeat,
  // straight 0..1: the rig makes it speed up into the click); click flashes
  // its edges as it seats. Then the bite closes and a glint runs to the gums.
  out.tray3d = span(p, 0.515, 0.55, 0.9, 0.935);
  out.open = span(p, 0.52, 0.565, 0.775, 0.815);
  out.upIn = ramp(p, 0.54, 0.6);
  out.upSeat = lin(p, 0.612, 0.655);
  out.loIn = ramp(p, 0.66, 0.712);
  out.loSeat = lin(p, 0.722, 0.765);
  // sharp as the tray touches down, fading after
  out.upClick = span(p, 0.651, 0.656, 0.659, 0.69);
  out.loClick = span(p, 0.761, 0.766, 0.769, 0.8);
  out.form = ramp(p, 0.81, 0.865);
  // the tags that name the trays
  out.trays = span(p, 0.545, 0.57, 0.8, 0.83);
  // dives between chapters: rainbow edges + fog
  out.dive = Math.max(bump(p, 0.05, 0.034), bump(p, 0.122, 0.026), bump(p, 0.305, 0.026), bump(p, 0.505, 0.03));
  // a flick of rainbow edge as a tray clicks on (no fog)
  out.snap = Math.max(out.upClick, out.loClick);
  // the end: white fog, then the photo
  out.white = ramp(p, 0.878, 0.93);
  out.photo = ramp(p, 0.905, 0.965);
  // labels on the crooked teeth: once out of her hand, and while they straighten
  out.labels = Math.max(span(p, 0.064, 0.082, 0.106, 0.122), span(p, 0.312, 0.335, 0.47, 0.495));
  out.chapter = chapterAt(p);
  camAt(p, out.camera);
  return out;
}
