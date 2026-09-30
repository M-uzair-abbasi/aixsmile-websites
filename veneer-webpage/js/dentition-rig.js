// The dentition as a stage for the veneer procedure.
//
// Takes the loaded assets/models/dentition.glb and rebuilds the teeth that
// receive veneers (ten upper, premolar to premolar, and the six lower front
// teeth) into the pieces the story needs, all derived from the real crown
// meshes at load time:
//   flawed    the tooth as the patient arrives (stain; on the front teeth a
//             chip, a gap and a short edge)
//   layer     the enamel skin the preparation removes: it lights up, lifts
//             off and fades
//   prepared  the tooth after ~0.6 mm came off the front
//   shell     the ceramic veneer. Outside: a designed "Hollywood" smile —
//             wider along the arch so every gap closes, biting edges redrawn
//             to one smooth smile line, front faces on one even arch, and the
//             left side an exact mirror of the right. Inside: the prepared
//             surface. It tapers to nothing where the two meet.
// plus a scan grid overlay, a blue curing light with a halo, whitening of the
// untouched teeth and a final shine. apply(state) takes the output of
// sampleProcedure() and sets every piece; it never allocates.
//
// Units are millimetres (the model's own), with +z towards the visitor.
import { VENEER_TEETH, smooth } from './procedure-timeline.js';

const PREP_DEPTH = 0.6;        // mm taken off the centre of the front face
const GAP = 0.7;               // mm each central is narrowed on its midline side
const CHIP = 3.0;              // mm deep broken corner on 21
const SHORT = 1.3;             // mm the lateral 22 falls short
const ARCH_CENTRE_Z = -22;     // front faces point away from this line
const BITE_OPEN_DEG = 2.4;     // the source opens the jaw 10°; a smile shows a sliver
const BITE_SMILE_DEG = 0;    // … and the finished smile closes it: the upper teeth just overlap the lower ones
const SHELL_TRAVEL = 9;        // mm in front of the tooth when a shell first appears
const PEEL = 3.2;              // mm the removed enamel lifts off before it fades
const CURE_INTENSITY = 220;
// the veneer shape by position in the quadrant (1 = central … 5 = second premolar)
// how much wider along the arch each veneer is than the tooth under it: the
// centrals clearly dominate, the laterals stay slim, so the sizes step down
const WIDEN = [0, 0.1, 0.03, 0.02, 0.04, 0.04];
const WIDEN_LOWER = [0, 0.04, 0.04, 0.03];
const LENGTHEN = [0, 0.45, 0.3, 0.2, 0.1, 0.1];      // mm longer at the biting edge
const LENGTHEN_LOWER = [0, 0.15, 0.15, 0.1];         // lower veneers: they must still clear the upper ones
const FULLER = 0.15;                                  // mm the front face stands proud
const MIDLINE = 0.04;          // mm each upper central stays clear of the midline: a fine contact line, not a gap
const MESIAL_ROLL = 0.35;      // mm the centrals' front face turns back towards the midline, so the contact reads
const EDGE_BAND = 3.4;         // mm above the biting edge that follow a redrawn edge
const EDGE_ROUND = 0.35;       // mm: how round a shortened edge is

const STAIN = {
  15: 0xdfcfad, 14: 0xe1d1b0, 13: 0xd9c6a0, 12: 0xe3d4b5, 11: 0xe0cfac,
  21: 0xdecca8, 22: 0xe3d4b5, 23: 0xd9c6a0, 24: 0xe1d1b0, 25: 0xdfcfad,
  43: 0xdccaa5, 42: 0xe2d3b3, 41: 0xe1d1b0, 31: 0xe1d1b0, 32: 0xe2d3b3, 33: 0xdccaa5,
};
const IVORY = 0xf4efe6;        // teeth that are left alone …
// … and after whitening: slightly cool and above 1, because it multiplies the
// model's warm cream vertex colour and should come out plain white
const WHITENED = [1.05, 1.08, 1.17];
const PORCELAIN = [0.97, 0.97, 0.955]; // the veneers: bright, but just under white so gloss and form still read
const HIGHLIGHT = 0xf0a276;    // the enamel layer that is about to go
const CURE_BLUE = 0x5aa2ff;
const SCAN_TINT = [0.45, 0.95, 0.85];
const DENTIN_TINT = [0.99, 0.94, 0.85]; // multiplies vertex colour where enamel came off

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const band = (x, a, b) => smooth((x - a) / (b - a));

/** A mesh's geometry as plain floats in its parent's space (the page's GLB is
 *  quantized, with the dequantization on the node). */
function bakedGeometry(THREE, mesh) {
  const src = mesh.geometry;
  const geo = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'color']) {
    const a = src.getAttribute(name);
    if (!a) continue;
    const n = Math.min(3, a.itemSize);
    const arr = new Float32Array(a.count * n);
    for (let i = 0; i < a.count; i++) {
      arr[i * n] = a.getX(i);
      if (n > 1) arr[i * n + 1] = a.getY(i);
      if (n > 2) arr[i * n + 2] = a.getZ(i);
    }
    geo.setAttribute(name, new THREE.BufferAttribute(arr, n));
  }
  geo.setIndex(Array.from(src.index.array));
  mesh.updateMatrix();
  geo.applyMatrix4(mesh.matrix);
  return geo;
}

/** Average each value with its mesh neighbours, a few passes. */
function smoothOverMesh(values, index, passes) {
  const n = values.length;
  const sum = new Float32Array(n), deg = new Uint16Array(n);
  let v = values;
  for (let p = 0; p < passes; p++) {
    sum.fill(0); deg.fill(0);
    for (let t = 0; t < index.length; t += 3) {
      const a = index[t], b = index[t + 1], c = index[t + 2];
      sum[a] += v[b] + v[c]; sum[b] += v[a] + v[c]; sum[c] += v[a] + v[b];
      deg[a] += 2; deg[b] += 2; deg[c] += 2;
    }
    const next = new Float32Array(n);
    for (let i = 0; i < n; i++) next[i] = deg[i] ? 0.5 * v[i] + 0.5 * (sum[i] / deg[i]) : v[i];
    v = next;
  }
  return v;
}

function withPositions(THREE, base, positions, colors) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors || base.getAttribute('color').array.slice(), 3));
  geo.setIndex(base.getIndex().clone());
  geo.computeVertexNormals();
  return geo;
}

/** A closed thin solid between two versions of the same surface: `outer`
 *  facing out, `inner` facing in. Only triangles touching a selected vertex
 *  are kept; unselected vertices sit on both surfaces, so the edges close. */
function solidBetween(THREE, index, outer, inner, colors, selected) {
  const tris = [];
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    if (selected[a] || selected[b] || selected[c]) tris.push(a, b, c);
  }
  const remap = new Map();
  for (const v of tris) if (!remap.has(v)) remap.set(v, remap.size);
  const n = remap.size;
  const pos = new Float32Array(n * 6), nor = new Float32Array(n * 6), col = new Float32Array(n * 6);
  const on = outer.getAttribute('normal').array, inn = inner.getAttribute('normal').array;
  const op = outer.getAttribute('position').array, ip = inner.getAttribute('position').array;
  for (const [v, j] of remap) {
    for (let k = 0; k < 3; k++) {
      pos[j * 3 + k] = op[v * 3 + k]; nor[j * 3 + k] = on[v * 3 + k];
      pos[(j + n) * 3 + k] = ip[v * 3 + k]; nor[(j + n) * 3 + k] = -inn[v * 3 + k];
      col[j * 3 + k] = col[(j + n) * 3 + k] = colors[v * 3 + k];
    }
  }
  const idx = [];
  for (let t = 0; t < tris.length; t += 3) {
    const a = remap.get(tris[t]), b = remap.get(tris[t + 1]), c = remap.get(tris[t + 2]);
    idx.push(a, b, c, c + n, b + n, a + n);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  return geo;
}

/** The model's canines end in a fang-like point; squeeze the last few tenths
 *  of a millimetre towards the tip into a lower dome. */
function bluntTip(pos, upper, depth = 1.4, keep = 0.4) {
  let tip = upper ? Infinity : -Infinity;
  for (let i = 1; i < pos.length; i += 3) tip = upper ? Math.min(tip, pos[i]) : Math.max(tip, pos[i]);
  const dir = upper ? 1 : -1;
  for (let i = 1; i < pos.length; i += 3) {
    const v = (pos[i] - tip) * dir;
    if (v < depth) pos[i] = tip + dir * (depth - (depth - v) * keep);
  }
}

function buildTooth(THREE, id, crown, enamel) {
  const place = Number(id[1]);
  const upper = id[0] === '1' || id[0] === '2';
  const dir = upper ? 1 : -1;              // which way (in y) the gum is from the biting edge
  const base = bakedGeometry(THREE, crown);
  if (place === 3) { bluntTip(base.getAttribute('position').array, upper); base.computeVertexNormals(); }
  base.computeBoundingBox();
  const bb = base.boundingBox;
  const edgeY = upper ? bb.min.y : bb.max.y;
  const centre = bb.getCenter(new THREE.Vector3());
  const L = new THREE.Vector3(centre.x, 0, centre.z - ARCH_CENTRE_Z).normalize(); // out of the arch
  const T = new THREE.Vector3(-L.z, 0, L.x);                                       // along the arch
  const halfW = (bb.max.x - bb.min.x) / 2;
  const crownH = bb.max.y - bb.min.y;
  const toMid = centre.x < 0 ? 1 : -1;
  const O = base.getAttribute('position').array;
  const N = base.getAttribute('normal').array;
  const colors = base.getAttribute('color').array;
  const count = O.length / 3;
  const facing = (i) => N[i * 3] * L.x + N[i * 3 + 1] * L.y + N[i * 3 + 2] * L.z;

  // how much each vertex belongs to the front face, smoothed over the mesh so
  // the preparation margin is a soft line rather than a ragged one
  const index = base.getIndex().array;
  let w = new Float32Array(count);
  for (let i = 0; i < count; i++) w[i] = band(facing(i), 0.2, 0.65);
  w = smoothOverMesh(w, index, 4);
  // smoothing leaks a little weight onto side faces; moving those straight
  // back would push them out through the shell, so only forward faces move
  for (let i = 0; i < count; i++) w[i] *= band(facing(i), -0.05, 0.3);

  // the flaws
  const F = O.slice();
  for (let i = 0; i < count; i++) {
    const x = F[i * 3], y = F[i * 3 + 1];
    const u = (toMid * (x - centre.x)) / halfW;   // -1 far side .. 1 midline side
    const v = y - bb.min.y;                       // mm above the biting edge
    if (id === '11' || id === '21') F[i * 3] -= toMid * GAP * smooth(u);
    if (id === '21') {
      const depth = CHIP * clamp01((u - 0.12) / 0.88) + 0.15 * Math.sin(u * 23);
      if (depth > 0 && v < depth) F[i * 3 + 1] = bb.min.y + depth;
    }
    if (id === '22' && v < 3.5) F[i * 3 + 1] += SHORT * Math.pow(1 - v / 3.5, 1.5);
  }
  const flawed = withPositions(THREE, base, F);

  // the preparation: the front face moves straight back (one direction per
  // tooth, so curved edges bevel instead of folding over)
  const P = F.slice();
  const prepColors = colors.slice();
  const back = [L.x, L.y, L.z];
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) {
      P[i * 3 + k] -= back[k] * PREP_DEPTH * w[i];
      prepColors[i * 3 + k] *= 1 + (DENTIN_TINT[k] - 1) * w[i];
    }
  }
  const prepared = withPositions(THREE, base, P, prepColors);

  // the veneer's outside: the tooth's own shape, wider along the arch (more
  // towards the biting edge, where the gaps are), a touch longer and fuller.
  // The tongue side stays put, so the shell remains a veneer, not a crown.
  const H = O.slice();
  const longer = upper ? LENGTHEN[place] : LENGTHEN_LOWER[place];
  for (let i = 0; i < count; i++) {
    const m = band(facing(i), -0.35, 0.15);
    const along = (O[i * 3] - centre.x) * T.x + (O[i * 3 + 2] - centre.z) * T.z;
    const v = (O[i * 3 + 1] - edgeY) * dir;   // mm from the biting edge towards the gum
    // the upper centrals already touch at the midline: they widen away from it only
    const mesial = upper && place === 1 && toMid * (O[i * 3] - centre.x) > 0;
    const spread = mesial ? 0 : along * (upper ? WIDEN : WIDEN_LOWER)[place] * (0.55 + 0.45 * (1 - clamp01(v / crownH))) * m;
    H[i * 3] += T.x * spread + L.x * FULLER * w[i];
    H[i * 3 + 2] += T.z * spread + L.z * FULLER * w[i];
    if (v < 2.5) H[i * 3 + 1] -= dir * longer * (1 - v / 2.5) * m;
  }
  // which vertices the veneer may reshape: front and sides, never the tongue side
  const mask = new Float32Array(count);
  for (let i = 0; i < count; i++) mask[i] = band(facing(i), -0.35, 0.15);
  // the biting edge itself may move too (the veneer wraps over it), but not
  // the tongue side behind it
  const edgeMask = new Float32Array(count);
  for (let i = 0; i < count; i++) edgeMask[i] = band(facing(i), -0.65, -0.05);

  const layerSel = new Uint8Array(count);
  for (let i = 0; i < count; i++) layerSel[i] = w[i] > 0.01 ? 1 : 0;
  const layer = solidBetween(THREE, index, flawed, prepared, colors, layerSel);
  // the layer lifts and turns about the tooth's own centre
  layer.translate(-centre.x, -centre.y, -centre.z);
  // the veneers are near-uniform bright ceramic
  const shellColors = colors.map((c) => c + (1 - c) * 0.85);

  const stain = new THREE.Color(STAIN[id]);
  const flawMat = enamel.clone(); flawMat.color.copy(stain);
  const prepMat = enamel.clone();
  prepMat.color.copy(stain); prepMat.roughness = 0.45; prepMat.clearcoat = 0.2; prepMat.sheen = 0;
  const offset = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };
  const layerMat = enamel.clone();
  Object.assign(layerMat, offset, { transparent: true });
  layerMat.color.copy(stain); layerMat.emissive = new THREE.Color(HIGHLIGHT);
  const shellMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03,
    ior: 1.6, specularIntensity: 1, sheen: 0.25, sheenRoughness: 0.45, sheenColor: 0xffffff,
    emissive: CURE_BLUE, emissiveIntensity: 0, transparent: true, ...offset,
  });
  shellMat.color.setRGB(...PORCELAIN);

  const parent = crown.parent;
  parent.remove(crown);
  crown.geometry.dispose();
  base.dispose();
  const mk = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; parent.add(m); return m; };

  return {
    id, place, upper, dir, L, T, centre, stain, toMid, parent,
    H, P, w, mask, edgeMask, index, count, shellColors,   // for the smile design pass
    flawed: mk(flawed, flawMat, 0),
    prepared: mk(prepared, prepMat, 0),
    layer: mk(layer, layerMat, 3),
    flawMat, prepMat, layerMat, shellMat,
  };
}

// ---- smile design ------------------------------------------------------

// Edge profiles, in mm above the centrals' edge, across the tooth as seen
// from the front (u = -1 at the corner facing the midline, +1 at the far one).
const sq = (x) => { const c = clamp01(x); return c * c; };
/** A straight edge whose corners round off: rising `m` mm at the corner facing
 *  the midline and `d` mm at the far one, over the outer `span` of the width. */
const flatEdge = (base, m, d, span = 0.35) => (u) =>
  base + (u < 0 ? m * sq((-u - (1 - span)) / span) : d * sq((u - (1 - span)) / span));
/** A cusp: tip at `at`, rounded by `r`, rising `m` mm to the near corner and
 *  `d` mm to the far one. */
const cuspEdge = (base, at, m, d, r = 0.14) => {
  const slope = (end, rise) => rise / (Math.hypot(end - at, r) - r);
  const km = slope(-1, m), kd = slope(1, d);
  return (u) => base + (u < at ? km : kd) * (Math.hypot(u - at, r) - r);
};
// The designed smile line: dominant centrals whose inner corners round off
// just enough to open a small V between them (square ones read as one block),
// laterals 1 mm shorter and rounder, canines coming back down to a point
// almost as long as the centrals (the corners of the smile), premolar cusps
// stepping up behind them. The corners open small V-shaped gaps between the
// biting edges, so every tooth reads on its own.
const UPPER_EDGE = [null,
  flatEdge(0, 0.55, 0.9, 0.3),
  flatEdge(1.2, 0.45, 1.3, 0.45),
  cuspEdge(-0.25, -0.15, 2.6, 3.4, 0.08),
  cuspEdge(1.3, 0, 0.9, 1.1, 0.2),
  cuspEdge(1.9, 0, 0.8, 0.9, 0.2)];
// the lower front: incisors on one even line, canines a clear point
const LOWER_EDGE = [null,
  flatEdge(0, 0.25, 0.3),
  flatEdge(0.1, 0.3, 0.5),
  cuspEdge(0.05, -0.12, 1.5, 2.1, 0.1)];
const smileEdge = (place, yc) => (u) => yc + UPPER_EDGE[place](u);
const lowerEdge = (place, yc) => (u) => yc + LOWER_EDGE[place](u);

/** The tooth's width across (u) and height above its edge (v, mm), measured
 *  on the veneer's current shape. */
function measure(t) {
  const { H, mask, T, centre, count, dir } = t;
  const u = new Float32Array(count), v = new Float32Array(count);
  let half = 0, lo = Infinity, hi = -Infinity;
  for (let i = 0; i < count; i++) {
    u[i] = (H[i * 3] - centre.x) * T.x + (H[i * 3 + 2] - centre.z) * T.z;
    if (mask[i] > 0.2) { half = Math.max(half, Math.abs(u[i])); lo = Math.min(lo, H[i * 3 + 1] * dir); hi = Math.max(hi, H[i * 3 + 1] * dir); }
  }
  for (let i = 0; i < count; i++) { u[i] /= half; v[i] = H[i * 3 + 1] * dir - lo; }
  return { u, v, height: hi - lo };
}

/** Redraw a veneer's biting edge (seen from the front) onto targetAt(u); the
 *  band above the edge follows and fades out. Corners keep a little of their
 *  rounding, so the edge reads crisp but not cut. */
function levelEdge(t, targetAt) {
  const { H, mask, edgeMask, T, centre, count, dir } = t;
  const u = new Float32Array(count);
  let half = 0;
  for (let i = 0; i < count; i++) {
    u[i] = (H[i * 3] - centre.x) * T.x + (H[i * 3 + 2] - centre.z) * T.z;
    if (mask[i] > 0.2) half = Math.max(half, Math.abs(u[i]));
  }
  const BINS = 28;
  const slot = (un) => ((un + 1) / 2) * BINS - 0.5;
  const edge = new Float32Array(BINS).fill(Infinity);
  for (let i = 0; i < count; i++) {
    if (mask[i] <= 0.2) continue;
    const b = Math.min(BINS - 1, Math.max(0, Math.round(slot(u[i] / half))));
    edge[b] = Math.min(edge[b], H[i * 3 + 1] * dir);
  }
  for (let pass = 0; pass < BINS; pass++) {
    for (let b = 0; b < BINS; b++) if (edge[b] === Infinity) edge[b] = Math.min(b > 0 ? edge[b - 1] : Infinity, b < BINS - 1 ? edge[b + 1] : Infinity);
  }
  const sm = edge.map((e, b) => (edge[Math.max(0, b - 1)] + 2 * e + edge[Math.min(BINS - 1, b + 1)]) / 4);
  const edgeAt = (un) => {
    const x = Math.min(BINS - 1, Math.max(0, slot(un)));
    const b0 = Math.floor(x), b1 = Math.min(BINS - 1, b0 + 1);
    return sm[b0] + (sm[b1] - sm[b0]) * (x - b0);
  };
  for (let i = 0; i < count; i++) {
    const un = u[i] / half;
    const target = targetAt(un);
    let yd = H[i * 3 + 1] * dir;                 // height, with "down" = towards the biting edge
    // lengthen: the front and the edge stretch out to the designed line (the
    // veneer carries the extra length); the band above follows smoothly
    const e = edgeAt(un);
    if (e > target && edgeMask[i] > 0) {
      const h = Math.max(0, yd - e);
      const side = 1 - 0.5 * smooth((Math.abs(un) - 0.9) / 0.1);
      if (h < EDGE_BAND) yd -= Math.min(2.4, e - target) * smooth(1 - h / EDGE_BAND) * edgeMask[i] * side;
    }
    // shorten: nothing of the tooth, front or back, reaches past the designed
    // line, as the dentist shortens a tooth before the veneer. Whatever lay
    // beyond it folds into a softly rounded edge (radius EDGE_ROUND) instead of
    // a hard cut, which would shade as a grey band along the edge.
    if (yd < target + EDGE_ROUND) yd = target + EDGE_ROUND * Math.exp((yd - target) / EDGE_ROUND - 1);
    H[i * 3 + 1] = yd * dir;
  }
}

/** Put the veneers' front faces on one smooth arch: fit r(θ) = a + bθ² through
 *  the most frontal point of each (radius from the arch centre, angle of its
 *  outward direction) and move each face onto the curve. */
function alignToArch(teeth) {
  const pts = teeth.map((t) => {
    let r = -Infinity;
    for (let i = 0; i < t.count; i++) if (t.w[i] > 0.5) r = Math.max(r, t.H[i * 3] * t.L.x + (t.H[i * 3 + 2] - ARCH_CENTRE_Z) * t.L.z);
    return { t, q: Math.atan2(t.L.x, t.L.z) ** 2, r };
  });
  let s0 = 0, s1 = 0, s2 = 0, r0 = 0, r1 = 0;
  for (const p of pts) { s0 += 1; s1 += p.q; s2 += p.q * p.q; r0 += p.r; r1 += p.r * p.q; }
  const det = s0 * s2 - s1 * s1;
  const a = (r0 * s2 - s1 * r1) / det, b = (s0 * r1 - s1 * r0) / det;
  for (const { t, q, r } of pts) {
    const shift = Math.min(0.6, Math.max(-0.6, a + b * q - r));
    for (let i = 0; i < t.count; i++) {
      t.H[i * 3] += t.L.x * shift * t.mask[i];
      t.H[i * 3 + 2] += t.L.z * shift * t.mask[i];
    }
  }
}

/** Porcelain-smooth faces: Taubin smoothing (a smoothing step, then a slight
 *  un-shrinking one) of the part the veneer reshapes. Removes the natural
 *  tooth's small bumps. With `keepEdge` it leaves the biting edge alone, so a
 *  designed edge (the canine's point, the corners) keeps its shape. */
function polish(t, passes = 6, keepEdge = false) {
  const { H, index, mask, count } = t;
  const hold = keepEdge ? measure(t).v.map((v) => smooth(v / 2.5)) : null;
  const sum = new Float32Array(count * 3), deg = new Uint16Array(count);
  for (let k = 0; k < index.length; k += 3) { deg[index[k]] += 2; deg[index[k + 1]] += 2; deg[index[k + 2]] += 2; }
  const step = (lambda) => {
    sum.fill(0);
    for (let k = 0; k < index.length; k += 3) {
      const a = index[k] * 3, b = index[k + 1] * 3, c = index[k + 2] * 3;
      for (let j = 0; j < 3; j++) {
        sum[a + j] += H[b + j] + H[c + j]; sum[b + j] += H[a + j] + H[c + j]; sum[c + j] += H[a + j] + H[b + j];
      }
    }
    for (let i = 0; i < count; i++) {
      if (!deg[i] || mask[i] <= 0) continue;
      const f = lambda * mask[i] * (hold ? hold[i] : 1);
      for (let j = 0; j < 3; j++) H[i * 3 + j] += f * (sum[i * 3 + j] / deg[i] - H[i * 3 + j]);
    }
  };
  for (let p = 0; p < passes; p++) { step(0.5); step(-0.53); }
}

/** Character that polishing must not remove: the canine's vertical ridge (it
 *  catches the light and makes the canine read as the corner of the smile)
 *  and a faint lobe either side of the incisors' faces. */
function sculpt(t) {
  const { H, w, L, count, place } = t;
  const { u, v, height } = measure(t);
  for (let i = 0; i < count; i++) {
    if (w[i] <= 0) continue;
    const vv = v[i] / height;                       // 0 at the edge .. 1 at the gum
    let out = 0;
    if (place === 3) {
      // the ridge down the middle, and both halves turning away from it —
      // the far half more, as the canine turns the corner of the arch
      const d = u[i] + 0.15;
      out = 0.46 * Math.exp(-((d / 0.28) ** 2)) * (0.35 + 0.65 * clamp01(vv * 1.4))
        - (d > 0 ? 0.55 * sq(d / 1.15) : 0.2 * sq(-d / 0.85));
    } else if (place <= 2) {
      const lobes = Math.exp(-(((u[i] - 0.34) / 0.13) ** 2)) + Math.exp(-(((u[i] + 0.34) / 0.13) ** 2));
      out = -0.05 * lobes * clamp01((vv - 0.12) * 3) * (1 - clamp01((vv - 0.72) * 4));
      // the upper centrals round back towards the midline (u = -1), as real
      // centrals do, so the light breaks along their contact
      if (place === 1 && t.upper) out -= MESIAL_ROLL * sq((-u[i] - 0.68) / 0.32);
    }
    H[i * 3] += L.x * out * w[i];
    H[i * 3 + 2] += L.z * out * w[i];
  }
}

/** Keep an upper central on its own side of the midline (x = 0; its twin is
 *  its mirror image there), with a softly rounded approach instead of a cut. */
function clearMidline(t) {
  const { H, count, toMid } = t;
  const R = 0.3;
  for (let i = 0; i < count; i++) {
    const d = -MIDLINE - toMid * H[i * 3];      // mm still to go before the limit
    if (d < R) H[i * 3] = toMid * (-MIDLINE - R * Math.exp(d / R - 1));
  }
}

/** Veneer colour: bright white with a little life in it — a hint of
 *  translucency at the biting edge, a warmer tone towards the gum, and the
 *  canines a shade warmer than the incisors, as natural canines are. */
function shade(t) {
  const { count, place, shellColors } = t;
  const { u, v, height } = measure(t);
  const tone = place === 3 ? [1, 0.982, 0.955] : place >= 4 ? [1, 0.99, 0.972] : [1, 1, 1];
  const centralUp = place === 1 && t.upper;
  for (let i = 0; i < count; i++) {
    const edge = 1 - smooth(v[i] / 1.8);
    const gum = smooth((v[i] / height - 0.62) / 0.38);
    // a breath of shadow where the upper centrals meet
    const contact = centralUp ? 1 - 0.07 * smooth((-u[i] - 0.82) / 0.18) : 1;
    shellColors[i * 3] = (1 - 0.11 * edge) * (1 - 0.015 * gum) * tone[0] * contact;
    shellColors[i * 3 + 1] = (1 - 0.08 * edge) * (1 - 0.035 * gum) * tone[1] * contact;
    shellColors[i * 3 + 2] = (1 - 0.02 * edge) * (1 - 0.07 * gum) * tone[2] * (0.4 + 0.6 * contact);
  }
}

function surface(THREE, positions, index, colors) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(Array.from(index));
  geo.computeVertexNormals();
  return geo;
}

/** The same geometry reflected across the midline (x = 0). */
function mirrored(geo) {
  const g = geo.clone();
  const p = g.getAttribute('position').array, n = g.getAttribute('normal').array;
  for (let i = 0; i < p.length; i += 3) { p[i] = -p[i]; n[i] = -n[i]; }
  const idx = g.getIndex().array;
  for (let i = 0; i < idx.length; i += 3) { const b = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = b; }
  return g;
}

function scanMaterial(THREE) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    uniforms: { uSweep: { value: -99 }, uOpacity: { value: 0 }, uTint: { value: new THREE.Vector3(...SCAN_TINT) } },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uSweep;
      uniform float uOpacity;
      uniform vec3 uTint;
      varying vec3 vWorld;
      float line(float x, float cell) {
        float d = abs(fract(x / cell - 0.5) - 0.5) * cell;
        return 1.0 - smoothstep(0.0, fwidth(x) * 1.3, d);
      }
      void main() {
        float scanned = step(vWorld.x, uSweep);
        float front = exp(-pow((vWorld.x - uSweep) / 2.2, 2.0));
        float grid = max(line(vWorld.x, 0.85), line(vWorld.y, 0.85));
        float a = scanned * (0.16 + 0.7 * grid) + front;
        gl_FragColor = vec4(mix(uTint, vec3(1.0), front * 0.7), clamp(a, 0.0, 1.0) * uOpacity);
      }`,
  });
}

/** A soft blue glow in front of the tooth being cured. */
function haloSprite(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(190,220,255,0.85)');
  grad.addColorStop(0.55, 'rgba(90,162,255,0.3)');
  grad.addColorStop(1, 'rgba(90,162,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  sprite.scale.setScalar(13);
  sprite.renderOrder = 6;
  sprite.visible = false;
  return sprite;
}

export function buildDentitionRig(THREE, gltfScene) {
  const byName = (name) => gltfScene.getObjectByName(name);
  const find = (re) => { let hit = null; gltfScene.traverse((o) => { if (!hit && o.isMesh && re.test(o.name)) hit = o; }); return hit; };

  const root = byName('human_dentition');
  root.scale.setScalar(1);                       // work in millimetres
  const hinge = byName('maxillary_hinge');
  hinge.rotation.x = -THREE.MathUtils.degToRad(BITE_OPEN_DEG);

  // every crown shares the enamel material; the untouched teeth go ivory
  const enamel = find(/_crown$/).material;
  enamel.color.set(IVORY);

  const teeth = VENEER_TEETH.map((id) => buildTooth(THREE, id, find(new RegExp(`^tooth_${id}_.*_crown$`)), enamel));

  // smile design: the patient's right-hand veneers (upper 11–15, lower 41–43)
  // get the ideal edge line, arch and a porcelain finish; the left-hand ones
  // are their mirror images, so the smile is symmetrical, even and gap-free
  const byId = Object.fromEntries(teeth.map((t) => [t.id, t]));
  const TWIN_QUADRANT = { 1: '1', 2: '1', 3: '4', 4: '4' };
  const twinOf = (t) => byId[TWIN_QUADRANT[t.id[0]] + t.id[1]];
  const right = [];
  for (const [quadrant, centralId, edgeFor] of [['1', '11', smileEdge], ['4', '41', lowerEdge]]) {
    const side = teeth.filter((t) => t.id[0] === quadrant);
    const c = byId[centralId];
    let yc = Infinity;
    for (let i = 0; i < c.count; i++) if (c.mask[i] > 0.2) yc = Math.min(yc, c.H[i * 3 + 1] * c.dir);
    side.forEach((t) => polish(t));            // smooth the natural bumps first …
    side.forEach((t) => levelEdge(t, edgeFor(t.place, yc)));   // … then draw the edge
    alignToArch(side);
    side.forEach((t) => {
      polish(t, 2, true); sculpt(t);
      if (t.upper && t.place === 1) clearMidline(t);
      shade(t);
    });
    right.push(...side);
  }
  const designed = {}, finished = {};
  right.forEach((t) => {
    const sel = new Uint8Array(t.count);
    for (let i = 0; i < t.count; i++) {
      const dx = t.H[i * 3] - t.P[i * 3], dy = t.H[i * 3 + 1] - t.P[i * 3 + 1], dz = t.H[i * 3 + 2] - t.P[i * 3 + 2];
      sel[i] = dx * dx + dy * dy + dz * dz > 1e-4 ? 1 : 0;
    }
    const outer = surface(THREE, t.H, t.index);
    designed[t.id] = solidBetween(THREE, t.index, outer, t.prepared.geometry, t.shellColors, sel);
    outer.dispose();
    // once seated, the veneer and its tooth show as one finished tooth: the
    // whole designed surface (a thin shell alone would leave the back open)
    finished[t.id] = surface(THREE, t.H.slice(), t.index, t.shellColors.slice());
  });
  const shellGeos = teeth.map((t) => (twinOf(t) === t ? designed[t.id] : mirrored(designed[twinOf(t).id])));
  teeth.forEach((t, i) => {
    const twin = twinOf(t);
    const flip = t !== twin ? -1 : 1;
    t.shellCentre = new THREE.Vector3(flip * twin.centre.x, twin.centre.y, twin.centre.z);
    t.shellL = new THREE.Vector3(flip * twin.L.x, twin.L.y, twin.L.z);
    shellGeos[i].translate(-t.shellCentre.x, -t.shellCentre.y, -t.shellCentre.z);   // it moves and turns about its centre
    t.shell = new THREE.Mesh(shellGeos[i], t.shellMat);
    t.shell.renderOrder = 2;
    t.parent.add(t.shell);
    const done = t !== twin ? mirrored(finished[twin.id]) : finished[t.id];
    t.finished = new THREE.Mesh(done, t.shellMat);
    t.finished.visible = false;
    t.finished.renderOrder = 2;
    t.parent.add(t.finished);
    t.H = t.P = t.w = t.mask = t.edgeMask = null;                                     // done with the working arrays
  });

  // scan grid over both arches: the prepared teeth, the upper molars, the gums
  const scanMat = scanMaterial(THREE);
  const overlays = [];
  const overlay = (geo, parent) => { const m = new THREE.Mesh(geo, scanMat); m.renderOrder = 5; m.visible = false; parent.add(m); overlays.push(m); };
  teeth.forEach((t) => overlay(t.prepared.geometry, t.prepared.parent));
  const neighbours = [];
  gltfScene.traverse((o) => { if (o.isMesh && /^tooth_[12][4-8]_.*_crown$|^maxillary_gingiva$|^mandibular_gingiva$/.test(o.name)) neighbours.push(o); });
  neighbours.forEach((o) => overlay(o.geometry, o));

  // curing light and halo live in scene space and are placed at whichever
  // tooth (upper or lower) is being cured
  const cureLight = new THREE.PointLight(CURE_BLUE, 0, 28, 2);
  const halo = haloSprite(THREE);
  gltfScene.add(cureLight, halo);
  const spot = new THREE.Vector3();
  // the closing shine: a light that sweeps across the finished smile
  const shine = new THREE.DirectionalLight(0xffffff, 0);
  root.add(shine);

  // camera framing, measured once the bite is set
  gltfScene.updateMatrixWorld(true);
  const measure = (objects) => {
    const box = new THREE.Box3();
    objects.forEach((o) => box.expandByObject(o));
    return { center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) };
  };
  const lowerFront = [];
  gltfScene.traverse((o) => { if (o.isMesh && /^tooth_[34][1-4]_.*_crown$/.test(o.name)) lowerFront.push(o); });
  const frames = {
    close: measure(teeth.filter((t) => t.upper && t.place <= 3).map((t) => t.flawed)),
    wide: measure([...lowerFront, ...teeth.map((t) => t.flawed)]),
  };

  const white = new THREE.Color(0xffffff);
  const ivory = new THREE.Color(IVORY);
  const whitened = new THREE.Color().setRGB(...WHITENED);
  const highlight = new THREE.Color(HIGHLIGHT);

  function apply(s) {
    let brightest = -1, peak = 0;
    teeth.forEach((t, i) => {
      // preparation: the front layer lights up, lifts off and fades
      const prep = s.prep[i];
      const lit = smooth(prep / 0.35), lift = smooth((prep - 0.3) / 0.7), fade = smooth((prep - 0.6) / 0.4);
      t.flawed.visible = prep <= 0;
      // once its veneer is seated, the finished tooth takes over from the
      // prepared tooth and the shell
      const seated = s.seat[i] >= 1;
      t.prepared.visible = prep > 0 && !seated;
      t.finished.visible = seated;
      t.layer.visible = prep > 0 && fade < 1;
      t.layerMat.color.copy(t.stain).lerp(highlight, lit * 0.85);
      t.layerMat.emissiveIntensity = 0.6 * lit * (1 - fade);
      t.layerMat.opacity = 1 - fade;
      t.layer.position.copy(t.centre).addScaledVector(t.L, lift * PEEL);
      t.layer.rotation.set(-lift * 0.25 * t.dir, 0, 0);

      // try-in: each shell swings in from the front and settles
      const away = 1 - s.seat[i];
      t.shell.visible = s.shellShow > 0.002 && !seated;
      t.shell.position.copy(t.shellCentre).addScaledVector(t.shellL, away * SHELL_TRAVEL);
      t.shell.position.y -= away * 1.5 * t.dir;             // upper shells rise into place, lower ones drop
      t.shell.rotation.set(away * 0.35 * t.dir, away * 0.5 * t.toMid, 0);
      // a touch see-through while it floats in; solid once seated (the tooth beneath is hidden then)
      t.shellMat.opacity = s.shellShow * (s.seat[i] >= 1 ? 1 : 0.92);
      t.shellMat.emissiveIntensity = 0.9 * s.glow[i];
      // once bonded, the prepared tooth takes the ceramic's tone, so no seam shows
      t.prepMat.color.copy(t.stain).lerp(white, s.bonded[i]);
      if (s.glow[i] > peak) { peak = s.glow[i]; brightest = i; }
    });
    cureLight.intensity = peak * CURE_INTENSITY;
    halo.visible = peak > 0.01;
    halo.material.opacity = peak;
    if (brightest >= 0) {
      const t = teeth[brightest];
      t.parent.updateWorldMatrix(true, false);
      cureLight.position.copy(t.parent.localToWorld(spot.copy(t.centre).addScaledVector(t.L, 7)));
      halo.position.copy(t.parent.localToWorld(spot.copy(t.centre).addScaledVector(t.L, 4)));
    }

    scanMat.uniforms.uSweep.value = -30 + 60 * s.scan.sweep;
    scanMat.uniforms.uOpacity.value = s.scan.opacity;
    overlays.forEach((o) => { o.visible = s.scan.opacity > 0.002; });

    enamel.color.copy(ivory).lerp(whitened, s.whiten);
    hinge.rotation.x = -THREE.MathUtils.degToRad(BITE_OPEN_DEG + (BITE_SMILE_DEG - BITE_OPEN_DEG) * s.result);
    shine.intensity = 2.4 * Math.sin(Math.PI * s.shine);
    shine.position.set(-70 + 140 * s.shine, 25, 70);
  }

  /** Make every piece visible once, so the renderer can compile all shaders up
   *  front instead of stalling in the middle of playback. */
  function showAll() {
    teeth.forEach((t) => { t.flawed.visible = t.prepared.visible = t.layer.visible = t.shell.visible = t.finished.visible = true; });
    overlays.forEach((o) => { o.visible = true; });
    halo.visible = true;
    cureLight.intensity = 1;
  }

  return { root, frames, apply, showAll };
}
