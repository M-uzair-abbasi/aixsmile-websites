// The bleaching treatment as one number, p from 0 to 1: where the hero's
// slider stands. Everything the hero shows is read from here (the 3D jaw,
// the still images, the step caption and the shade readout), so the
// pieces cannot drift apart.
//
//   0.00  1  the starting shade is measured
//   0.08  2  the gums are covered with a protective barrier
//   0.20  3  the gel goes on
//   0.32  4  the gel works; the teeth lighten step by step
//   0.90  5  gel and barrier come off, the new shade is measured

export const STEP_STARTS = [0, 0.08, 0.2, 0.32, 0.9];

// Shades along the way, on the scale the page explains further down, and
// the tooth colour at each (sRGB). The start is a deliberately full yellow,
// the end a natural light white: an illustration, labelled as one.
export const SHADES = ['A3.5', 'A3', 'A2', 'A1', 'B1', 'BL4'];
export const TOOTH_STOPS = ['#cf9f45', '#d8b26a', '#e0c48e', '#e8d6b0', '#efe4c9', '#f4eee0'];

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** What the jaw looks like at p: shade 0 (yellow) to 1 (white), barrier and
 *  gel 0 (none) to 1 (on), turn -1 to 1 (a slight turn mid-treatment, facing
 *  front at both ends so the start and the end compare head-on). */
export function treatment(p) {
  p = clamp01(p);
  return {
    shade: ease(0.3, 0.88, p),
    barrier: ease(0.08, 0.17, p) * (1 - ease(0.92, 0.99, p)),
    gel: ease(0.2, 0.3, p) * (1 - ease(0.9, 0.96, p)),
    turn: -Math.sin(Math.PI * p),
  };
}

/** Index of the step p falls in (0 to 4). */
export function stepAt(p) {
  let i = 0;
  STEP_STARTS.forEach((s, k) => { if (p >= s) i = k; });
  return i;
}

/** The shade the readout shows for a shade value from treatment(). */
export const shadeAt = (shade) => SHADES[Math.round(clamp01(shade) * (SHADES.length - 1))];

/** The tooth colour at a shade value, as a CSS colour (for the readout's swatch). */
export function toothColour(shade) {
  const t = clamp01(shade) * (TOOTH_STOPS.length - 1);
  const i = Math.min(Math.floor(t), TOOTH_STOPS.length - 2);
  const f = t - i;
  const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const a = rgb(TOOTH_STOPS[i]);
  const b = rgb(TOOTH_STOPS[i + 1]);
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(' ')})`;
}
