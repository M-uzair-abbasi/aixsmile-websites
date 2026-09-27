// The dentition as a stage for the veneer procedure.
//
// Takes the loaded assets/models/dentition.glb and rebuilds the ten upper
// teeth that receive veneers (premolar to premolar) into the pieces the story
// needs, all derived from the real crown meshes at load time:
//   flawed    the tooth as the patient arrives (stain; on the front teeth a
//             chip, a gap and a short edge)
//   layer     the enamel skin the preparation removes: it lights up, lifts
//             off and fades
//   prepared  the tooth after ~0.6 mm came off the front
//   shell     the ceramic veneer. Outside: the tooth's ideal shape, a little
//             wider along the arch, longer and fuller, so neighbouring veneers
//             meet and every gap closes (the "Hollywood" smile). Inside: the
//             prepared surface. It tapers to nothing where the two meet.
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
const SHELL_TRAVEL = 9;        // mm in front of the tooth when a shell first appears
const PEEL = 3.2;              // mm the removed enamel lifts off before it fades
const CURE_INTENSITY = 220;
// the veneer shape by position in the quadrant (1 = central … 5 = second premolar)
const WIDEN = [0, 0.085, 0.08, 0.06, 0.05, 0.045];   // share wider along the arch
const LENGTHEN = [0, 0.45, 0.3, 0.2, 0.1, 0.1];      // mm longer at the biting edge
const FULLER = 0.15;                                  // mm the front face stands proud

const STAIN = {
  15: 0xdfcfad, 14: 0xe1d1b0, 13: 0xd9c6a0, 12: 0xe3d4b5, 11: 0xe0cfac,
  21: 0xdecca8, 22: 0xe3d4b5, 23: 0xd9c6a0, 24: 0xe1d1b0, 25: 0xdfcfad,
};
const IVORY = 0xf4efe6;        // teeth that are left alone …
// … and after whitening: slightly cool and above 1, because it multiplies the
// model's warm cream vertex colour and should come out plain white
const WHITENED = [1.05, 1.08, 1.17];
const PORCELAIN = [1.07, 1.07, 1.05]; // the veneers, a touch brighter than white
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
  const base = bakedGeometry(THREE, crown);
  if (place === 3) { bluntTip(base.getAttribute('position').array, true); base.computeVertexNormals(); }
  base.computeBoundingBox();
  const bb = base.boundingBox;
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
  for (let i = 0; i < count; i++) {
    const m = band(facing(i), -0.35, 0.15);
    const along = (O[i * 3] - centre.x) * T.x + (O[i * 3 + 2] - centre.z) * T.z;
    const v = O[i * 3 + 1] - bb.min.y;
    const spread = along * WIDEN[place] * (0.55 + 0.45 * (1 - clamp01(v / crownH))) * m;
    H[i * 3] += T.x * spread + L.x * FULLER * w[i];
    H[i * 3 + 2] += T.z * spread + L.z * FULLER * w[i];
    if (v < 2.5) H[i * 3 + 1] -= LENGTHEN[place] * (1 - v / 2.5) * m;
  }
  const ideal = withPositions(THREE, base, H);

  const layerSel = new Uint8Array(count), shellSel = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    layerSel[i] = w[i] > 0.01 ? 1 : 0;
    const dx = H[i * 3] - P[i * 3], dy = H[i * 3 + 1] - P[i * 3 + 1], dz = H[i * 3 + 2] - P[i * 3 + 2];
    shellSel[i] = dx * dx + dy * dy + dz * dz > 1e-4 ? 1 : 0;
  }
  const shellColors = colors.map((c) => c + (1 - c) * 0.65);
  const layer = solidBetween(THREE, index, flawed, prepared, colors, layerSel);
  const shell = solidBetween(THREE, index, ideal, prepared, shellColors, shellSel);
  // both move and turn about the tooth's own centre
  layer.translate(-centre.x, -centre.y, -centre.z);
  shell.translate(-centre.x, -centre.y, -centre.z);
  ideal.dispose();

  const stain = new THREE.Color(STAIN[id]);
  const flawMat = enamel.clone(); flawMat.color.copy(stain);
  const prepMat = enamel.clone();
  prepMat.color.copy(stain); prepMat.roughness = 0.45; prepMat.clearcoat = 0.2; prepMat.sheen = 0;
  const offset = { polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };
  const layerMat = enamel.clone();
  Object.assign(layerMat, offset, { transparent: true });
  layerMat.color.copy(stain); layerMat.emissive = new THREE.Color(HIGHLIGHT);
  const shellMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05,
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
    id, L, centre, stain, toMid,
    flawed: mk(flawed, flawMat, 0),
    prepared: mk(prepared, prepMat, 0),
    layer: mk(layer, layerMat, 3),
    shell: mk(shell, shellMat, 2),
    flawMat, prepMat, layerMat, shellMat,
  };
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
  const arch = byName('maxillary_arch');

  // every crown shares the enamel material; the untouched teeth go ivory
  const enamel = find(/_crown$/).material;
  enamel.color.set(IVORY);

  // the lower canines get the same softer tip as the upper ones
  for (const id of ['33', '43']) {
    const crown = find(new RegExp(`^tooth_${id}_.*_crown$`));
    const geo = bakedGeometry(THREE, crown);
    bluntTip(geo.getAttribute('position').array, false);
    geo.computeVertexNormals();
    crown.geometry.dispose();
    crown.geometry = geo;
    crown.position.set(0, 0, 0); crown.quaternion.identity(); crown.scale.set(1, 1, 1);
  }

  const teeth = VENEER_TEETH.map((id) => buildTooth(THREE, id, find(new RegExp(`^tooth_${id}_.*_crown$`)), enamel));

  // scan grid over the upper arch: the prepared teeth, the molars, the gum
  const scanMat = scanMaterial(THREE);
  const overlays = [];
  const overlay = (geo, parent) => { const m = new THREE.Mesh(geo, scanMat); m.renderOrder = 5; m.visible = false; parent.add(m); overlays.push(m); };
  teeth.forEach((t) => overlay(t.prepared.geometry, t.prepared.parent));
  const neighbours = [];
  gltfScene.traverse((o) => { if (o.isMesh && /^tooth_[12][4-8]_.*_crown$|^maxillary_gingiva$/.test(o.name)) neighbours.push(o); });
  neighbours.forEach((o) => overlay(o.geometry, o));

  const cureLight = new THREE.PointLight(CURE_BLUE, 0, 28, 2);
  const halo = haloSprite(THREE);
  arch.add(cureLight, halo);
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
    close: measure(teeth.filter((t) => Number(t.id[1]) <= 3).map((t) => t.flawed)),
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
      t.prepared.visible = prep > 0;
      t.layer.visible = prep > 0 && fade < 1;
      t.layerMat.color.copy(t.stain).lerp(highlight, lit * 0.85);
      t.layerMat.emissiveIntensity = 0.6 * lit * (1 - fade);
      t.layerMat.opacity = 1 - fade;
      t.layer.position.copy(t.centre).addScaledVector(t.L, lift * PEEL);
      t.layer.rotation.set(-lift * 0.25, 0, 0);

      // try-in: each shell swings in from the front and settles
      const away = 1 - s.seat[i];
      t.shell.visible = s.shellShow > 0.002;
      t.shell.position.copy(t.centre).addScaledVector(t.L, away * SHELL_TRAVEL);
      t.shell.position.y -= away * 1.5;
      t.shell.rotation.set(away * 0.35, away * 0.5 * t.toMid, 0);
      t.shellMat.opacity = s.shellShow * (0.92 + 0.08 * s.bonded[i]);
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
      cureLight.position.copy(t.centre).addScaledVector(t.L, 7);
      halo.position.copy(t.centre).addScaledVector(t.L, 4);
    }

    scanMat.uniforms.uSweep.value = -30 + 60 * s.scan.sweep;
    scanMat.uniforms.uOpacity.value = s.scan.opacity;
    overlays.forEach((o) => { o.visible = s.scan.opacity > 0.002; });

    enamel.color.copy(ivory).lerp(whitened, s.whiten);
    shine.intensity = 2.4 * Math.sin(Math.PI * s.shine);
    shine.position.set(-70 + 140 * s.shine, 25, 70);
  }

  /** Make every piece visible once, so the renderer can compile all shaders up
   *  front instead of stalling in the middle of a scroll. */
  function showAll() {
    teeth.forEach((t) => { t.flawed.visible = t.prepared.visible = t.layer.visible = t.shell.visible = true; });
    overlays.forEach((o) => { o.visible = true; });
    halo.visible = true;
    cureLight.intensity = 1;
  }

  return { root, frames, apply, showAll };
}
