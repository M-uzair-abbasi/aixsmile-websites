// The aligner journey as numbers. One pinned section, one scroll progress p
// (0..1), and everything her photo and its captions do at that point. The
// steps are the 3D version's, in the order a treatment goes: the aligners go
// onto her crooked teeth, then the teeth straighten under them:
//
//   hero     a woman smiles; her teeth are crooked. Scrolling moves the view
//            in to her mouth; labels mark the crooked teeth
//   scan     the photo dims, a scan line passes over her teeth and leaves them
//            as a dot cloud with a wireframe
//   aligner  the bite opens; the upper aligner comes in from the front, waits
//            just under her crooked upper teeth, is pushed on and clicks; then
//            the lower one; the bite closes
//   wear     with the aligners on, every tooth moves into place, tray 01 → 24,
//            the labels count down; a glint runs over the aligners
//   result   white fog, then her straight smile, her aligner in her hand, and
//            the last line
//
// Between the chapters the view dives through a little fog (dive).
// Pure: no DOM, so js/site.js reads it and node can test it.

export const TRAYS = 24;

// [from, to] in scroll progress; the aligners get the most room, they are
// what the page is about
export const CHAPTERS = [
  { id: 'hero', from: 0, to: 0.11 },
  { id: 'scan', from: 0.11, to: 0.3 },
  { id: 'aligner', from: 0.3, to: 0.64 },
  { id: 'wear', from: 0.64, to: 0.885 },
  { id: 'result', from: 0.885, to: 1 },
];

// the frame strips tools/make-face-layers.py writes: the aligners' (crooked,
// opening ×2, open, upper on, both on, closing ×2, closed with aligners: 9
// frames) and the wear's (crooked → straight under the aligners, 7 frames)
export const FILM = { tray: 9, wear: 7 };

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
 *  aligners, the moment the upper one comes in). */
export function chapterAnchor(i) {
  return [0, 0.2, 0.37, 0.75, 0.97][i] ?? 0;
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
  // the aligners, one arch at a time, onto the crooked teeth: the bite opens;
  // each aligner comes in (upIn / loIn) to just off its teeth, then is pushed
  // on (upSeat / loSeat, straight 0..1: site.js makes it speed up into the
  // click); click flashes it as it seats. Then the bite closes.
  const opening = ramp(p, 0.32, 0.365), closing = ramp(p, 0.575, 0.615);
  out.upIn = ramp(p, 0.34, 0.4);
  out.upSeat = lin(p, 0.412, 0.455);
  out.loIn = ramp(p, 0.46, 0.512);
  out.loSeat = lin(p, 0.522, 0.565);
  // the photo of each aligner in place takes over as it seats
  out.upOn = lin(p, 0.45, 0.462);
  out.loOn = lin(p, 0.56, 0.572);
  out.upClick = span(p, 0.451, 0.456, 0.459, 0.49);
  out.loClick = span(p, 0.561, 0.566, 0.569, 0.6);
  out.trayFrame = closing > 0 ? 5 + 3 * closing : 3 * opening + out.upOn + out.loOn;
  // the tags that name the aligners
  out.trays = span(p, 0.345, 0.37, 0.6, 0.63);
  // the wear: once the bite is closed, the wear frames take over from the
  // jaw's (their first is the jaw's last); crooked → straight under the
  // aligners, tray 01 → 24, then a glint runs over them
  out.wear = p >= 0.62 ? 1 : 0;
  out.straight = ramp(p, 0.665, 0.82);
  out.tray = Math.max(1, Math.min(TRAYS, 1 + Math.floor(out.straight * TRAYS * 0.999)));
  out.form = ramp(p, 0.822, 0.872);
  // dives between chapters: a breath of fog
  out.dive = Math.max(bump(p, 0.05, 0.034), bump(p, 0.122, 0.026), bump(p, 0.305, 0.026), bump(p, 0.645, 0.03));
  // the end: white fog, it clears onto her smile, the last line
  out.white = ramp(p, 0.878, 0.93) * (1 - ramp(p, 0.932, 0.968));
  out.finale = ramp(p, 0.94, 0.975);
  // labels on the crooked teeth: at the start, and while they straighten
  out.labels = Math.max(span(p, 0.064, 0.082, 0.106, 0.122), span(p, 0.652, 0.675, 0.81, 0.835));
  out.chapter = chapterAt(p);
  return out;
}
