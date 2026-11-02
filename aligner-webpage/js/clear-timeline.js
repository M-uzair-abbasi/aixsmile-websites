// The aligner journey as numbers. One pinned section, one scroll progress p
// (0..1), and everything her photo and its captions do at that point. The
// steps (and their timing) are the ones the 3D version had, now on her teeth:
//
//   hero     a woman smiles; her teeth are crooked. Scrolling moves the view
//            in to her mouth; labels mark the crooked teeth
//   scan     the photo dims, a scan line passes over her teeth and leaves them
//            as a dot cloud with a wireframe
//   plan     every tooth moves into place, tray 01 → 24, the labels count down
//   aligner  the bite opens; the upper aligner comes in from the front, waits
//            just under her upper teeth, is pushed on and clicks; then the
//            lower one; the bite closes, a glint runs over the aligners
//   result   white fog, then her straight smile, her aligner in her hand, and
//            the last line
//
// Between the chapters the view dives through a little fog (dive).
// Pure: no DOM, so js/site.js reads it and node can test it.

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

// the frame strips tools/make-face-layers.py writes: the plan's (crooked →
// straight, 7 frames) and the aligners' (straight, opening ×2, open, upper
// on, both on, closing ×2, closed with aligners: 9 frames)
export const FILM = { plan: 7, tray: 9 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (u) => { const t = clamp(u); return t * t * (3 - 2 * t); };
const ramp = (p, a, b) => smooth((p - a) / (b - a));
// straight from 0 to 1 between a and b
const lin = (p, a, b) => clamp((p - a) / (b - a));
// on between a→b, off between c→d
const span = (p, a, b, c, d) => ramp(p, a, b) * (1 - ramp(p, c, d));
// a short bump that peaks at m and is gone w either side
const bump = (p, m, w) => smooth(1 - Math.abs(p - m) / w);

export function chapterAt(p) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (p >= CHAPTERS[i].from) return i;
  return 0;
}

/** Where to scroll for chapter i (a point where it is fully on show; for the
 *  aligner, the moment the upper aligner comes in). */
export function chapterAnchor(i) {
  return [0, 0.2, 0.41, 0.56, 0.97][i] ?? 0;
}

/** Everything at progress p. Reuses `out` when given (no allocation per frame). */
export function sample(p, out = {}) {
  p = clamp(p);
  out.p = p;
  // the hero's words make way, then the chapter caption comes in
  out.play = ramp(p, 0, 0.045);
  out.cap = ramp(p, 0.064, 0.094);
  // the camera moves in to her mouth; behind the white fog at the end it
  // switches to the closing framing (her whole smile) and to the photo of
  // her holding her aligner
  out.end = p >= 0.93 ? 1 : 0;
  out.zoom = out.end ? 0 : ramp(p, 0.015, 0.085);
  // the scan: the photo dims, points come up, a line passes, all fades back
  out.dissolve = span(p, 0.142, 0.176, 0.258, 0.288);
  out.points = span(p, 0.138, 0.176, 0.264, 0.294);
  out.sweep = ramp(p, 0.176, 0.258);
  out.line = span(p, 0.17, 0.18, 0.25, 0.262);
  // the plan: crooked → straight
  out.straight = ramp(p, 0.325, 0.48);
  out.tray = Math.max(1, Math.min(TRAYS, 1 + Math.floor(out.straight * TRAYS * 0.999)));
  // the aligners, one arch at a time: the bite opens; each aligner comes in
  // (upIn / loIn) to just off its teeth, then is pushed on (upSeat / loSeat,
  // straight 0..1: site.js makes it speed up into the click); click flashes
  // it as it seats. Then the bite closes and a glint runs over them.
  out.trays3d = span(p, 0.515, 0.55, 0.9, 0.935);
  const opening = ramp(p, 0.52, 0.565), closing = ramp(p, 0.775, 0.815);
  out.upIn = ramp(p, 0.54, 0.6);
  out.upSeat = lin(p, 0.612, 0.655);
  out.loIn = ramp(p, 0.66, 0.712);
  out.loSeat = lin(p, 0.722, 0.765);
  // the photo of each aligner in place takes over as it seats
  out.upOn = lin(p, 0.65, 0.662);
  out.loOn = lin(p, 0.76, 0.772);
  out.upClick = span(p, 0.651, 0.656, 0.659, 0.69);
  out.loClick = span(p, 0.761, 0.766, 0.769, 0.8);
  out.trayFrame = closing > 0 ? 5 + 3 * closing : 3 * opening + out.upOn + out.loOn;
  out.form = ramp(p, 0.81, 0.865);
  // the tags that name the aligners
  out.trays = span(p, 0.545, 0.57, 0.8, 0.83);
  // dives between chapters: a breath of fog
  out.dive = Math.max(bump(p, 0.05, 0.034), bump(p, 0.122, 0.026), bump(p, 0.305, 0.026), bump(p, 0.505, 0.03));
  // the end: white fog, it clears onto her smile, the last line
  out.white = ramp(p, 0.878, 0.93) * (1 - ramp(p, 0.932, 0.968));
  out.finale = ramp(p, 0.94, 0.975);
  // labels on the crooked teeth: at the start, and while they straighten
  out.labels = Math.max(span(p, 0.064, 0.082, 0.106, 0.122), span(p, 0.312, 0.335, 0.47, 0.495));
  out.chapter = chapterAt(p);
  return out;
}
