// The browser half of tools/render-implants.mjs: builds the implant scenes
// from the client's dentition model (veneer-webpage/human_dentition.glb, the
// source with roots) and renders one shot at a time, either as a studio view
// ("real") or as an X-ray.
//
// The X-ray is a thickness render. Every closed object writes its view depth
// with a minus sign where a ray enters it and a plus sign where it leaves,
// into a float target with additive blending, so each pixel ends up holding
// the path length through the object times its density; overlaps add up the
// way attenuation does. Four channels keep four kinds of matter apart:
//   r  tooth (enamel, dentin, a ceramic crown)
//   g  bone
//   b  titanium (implant, abutment, the bar of a full-arch bridge)
//   a  a highlight: rebuilt bone (tinted sand) or the planned implant (outlined)
// A composite pass turns that into film: 1 − e^(−attenuation), edge
// sharpening like a digital sensor, a cool ramp from ink to white, a soft glow.
//
// Units are millimetres; +y points to the nose for the upper jaw, +z towards
// the visitor, +x to the patient's left (the 2x teeth).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const INK = '#0a1119';
const INK2 = '#0f1924';
const SAND = '#d2b07a';
const UPPER = ['17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27'];

// densities per millimetre of path, before the composite's channel gains
const D = { enamel: 1.0, dentin: 0.74, ceramic: 1.5, bone: 1.0, metal: 1.0, graft: 1.0, plan: 1.0 };

const v3 = (a) => new THREE.Vector3(...a);
const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const hexToVec = (hex) => { const c = parseInt(hex.slice(1), 16); return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255); };

// ---------------------------------------------------------------- geometry

/** A mesh's geometry in world space. */
function baked(mesh) {
  mesh.updateWorldMatrix(true, false);
  const g = mesh.geometry.clone();
  g.applyMatrix4(mesh.matrixWorld);
  return g;
}

function signedVolume(geo) {
  const p = geo.getAttribute('position').array, idx = geo.getIndex().array;
  let v = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    v += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1])
       - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c])
       + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  return v / 6;
}

function flipWinding(geo) {
  const idx = geo.getIndex();
  const a = idx.array;
  for (let t = 0; t < a.length; t += 3) { const s = a[t + 1]; a[t + 1] = a[t + 2]; a[t + 2] = s; }
  idx.needsUpdate = true;
}
const orientOutward = (geo) => { if (signedVolume(geo) < 0) flipWinding(geo); return geo; };

/** A closed geometry pushed out along its normals by d mm. */
function inflate(geo, d) {
  const g = geo.clone();
  orientOutward(g);
  g.computeVertexNormals();
  const p = g.getAttribute('position'), n = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * d, p.getY(i) + n.getY(i) * d, p.getZ(i) + n.getZ(i) * d);
  g.deleteAttribute('normal');
  return g;
}

/** Position-only copy of a geometry with every boundary loop closed by a fan
 *  around the loop's centre, so it encloses a volume. The model's crowns and
 *  roots are open where they meet; capped, each is a solid of its own. */
function closed(source) {
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', source.getAttribute('position').clone());
  if (source.getIndex()) g.setIndex(source.getIndex().clone());
  g = mergeVertices(g, 1e-4);
  const pos = g.getAttribute('position');
  const idx = Array.from(g.getIndex().array);
  const N = pos.count;
  const half = new Set();
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) half.add(idx[t + k] * N + idx[t + (k + 1) % 3]);
  const next = new Map();
  for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
    const a = idx[t + k], b = idx[t + (k + 1) % 3];
    if (!half.has(b * N + a)) next.set(a, b);
  }
  const P = Array.from(pos.array);
  const loops = [];
  const seen = new Set();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop = [];
    let v = start;
    while (v !== undefined && !seen.has(v)) { seen.add(v); loop.push(v); v = next.get(v); }
    if (loop.length < 3) continue;
    const c = new THREE.Vector3();
    loop.forEach((i) => c.add(new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])));
    c.divideScalar(loop.length);
    const ci = P.length / 3;
    P.push(c.x, c.y, c.z);
    loop.forEach((i) => idx.push(next.get(i), i, ci));
    loops.push({ centre: c, size: loop.length });
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setIndex(idx);
  return { geo: out, loops };
}

/** A dental implant along +y, platform at y = 0, apex at y = length: a
 *  smooth polished collar, then a tapered core with a single-lead helical
 *  thread (flat crest and root) and a rounded apex. One closed surface; the
 *  `body` attribute is 0 on the collar, 1 on the threaded part. */
function implantGeometry({ length = 11.5, radius = 2.05, depth = 0.36, pitch = 0.8, collar = 0.9 } = {}) {
  const SEG = 128, PER = 30;
  const rows = Math.ceil((length / pitch) * PER);
  const pos = [], body = [];
  const coreAt = (y) => {
    const taper = 1 - 0.2 * smooth((y - length * 0.55) / (length * 0.45));
    const dome = y > length - 1.3 ? Math.sqrt(Math.max(0, 1 - ((y - (length - 1.3)) / 1.3) ** 2)) : 1;
    return (radius - depth) * taper * dome;
  };
  const ampAt = (y) => depth * smooth((y - collar) / 0.9) * (1 - smooth((y - (length - 1.9)) / 1.4));
  for (let j = 0; j <= rows; j++) {
    const y = (j / rows) * length;
    const amp = ampAt(y);
    for (let i = 0; i < SEG; i++) {
      const th = (i / SEG) * Math.PI * 2;
      const ph = (((y / pitch - th / (Math.PI * 2)) % 1) + 1) % 1;
      const prof = Math.min(1, Math.max(0, (1 - Math.abs(2 * ph - 1)) * 1.9 - 0.45));
      let r = y < collar ? radius - 0.06 * smooth(y / collar) : Math.max(coreAt(y) + amp * prof, 0);
      if (y >= collar && y < collar + 0.5) r = Math.max(r, (radius - 0.06) * (1 - smooth((y - collar) / 0.5)) + r * smooth((y - collar) / 0.5));
      if (j === rows) r = 0;
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      body.push(y < collar ? 0 : 1);
    }
  }
  const idx = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < SEG; i++) {
    const a = j * SEG + i, b = j * SEG + ((i + 1) % SEG), c = a + SEG, d = b + SEG;
    idx.push(a, c, b, b, c, d);
  }
  const centre = pos.length / 3;            // the platform: a flat disc
  pos.push(0, 0, 0); body.push(0);
  for (let i = 0; i < SEG; i++) idx.push(centre, i, (i + 1) % SEG);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('body', new THREE.Float32BufferAttribute(body, 1));
  geo.setIndex(idx);
  orientOutward(geo);
  geo.computeVertexNormals();
  return geo;
}

/** A closed solid of revolution around y from a profile of [radius, y]
 *  that starts and ends on the axis. */
function revolve(profile, seg = 96) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-4);
  orientOutward(m);
  m.computeVertexNormals();
  return m;
}

/** The abutment, from the implant platform (y = 0) towards the crown (−y):
 *  a narrow neck, the flared emergence through the gum, a tapered post. */
const abutmentGeometry = ({ neck = 1.72, shoulder = 2.5, post = 2.05, height = 6.6 } = {}) => revolve([
  [0, 0], [neck, 0], [neck + 0.05, -0.35], [shoulder, -1.7], [shoulder, -2.0], [post, -2.2],
  [post - 0.45, -height + 0.6], [post - 0.75, -height + 0.15], [0, -height],
]);
/** A short round cap (healing cap, multi-unit abutment), along −y. */
const capGeometry = (rTop, rBottom, height) => revolve([[0, 0], [rTop, 0], [rTop, -0.15], [rBottom, -height + 0.25], [rBottom - 0.25, -height], [0, -height]], 64);
/** A tube with closed ends (the guide sleeve), along −y. */
function sleeveGeometry(rOut, rIn, height) {
  const g = new THREE.LatheGeometry([[rIn, 0], [rOut, 0], [rOut, -height], [rIn, -height], [rIn, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 96);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-4);
  orientOutward(m);
  return m;
}

/** Sweep a closed cross-section along a curve; both ends capped. section(s)
 *  returns points [n, y] in the plane spanned by the outward normal and up. */
function sweep(curve, samples, section, s0 = 0, s1 = 1) {
  const pos = [], idx = [];
  let M = 0;
  for (let k = 0; k <= samples; k++) {
    const s = s0 + ((s1 - s0) * k) / samples;
    const p = curve.getPointAt(s);
    const t = curve.getTangentAt(s).setY(0).normalize();
    const n = new THREE.Vector3(t.z, 0, -t.x);
    if (n.dot(new THREE.Vector3(p.x, 0, p.z + 22)) < 0) n.negate();
    const sec = section(s);
    M = sec.length;
    for (const [a, y] of sec) pos.push(p.x + n.x * a, y, p.z + n.z * a);
  }
  for (let k = 0; k < samples; k++) for (let i = 0; i < M; i++) {
    const a = k * M + i, b = k * M + ((i + 1) % M), c = a + M, d = b + M;
    idx.push(a, b, c, b, d, c);
  }
  for (const [k, flip] of [[0, false], [samples, true]]) {
    const ci = pos.length / 3;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < M; i++) { cx += pos[(k * M + i) * 3]; cy += pos[(k * M + i) * 3 + 1]; cz += pos[(k * M + i) * 3 + 2]; }
    pos.push(cx / M, cy / M, cz / M);
    for (let i = 0; i < M; i++) {
      const a = k * M + i, b = k * M + ((i + 1) % M);
      if (flip) idx.push(ci, a, b); else idx.push(ci, b, a);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  return orientOutward(geo);
}

/** The bone's cross-section: rounded at the crest (bottom), narrowing as it
 *  rises so its top fades out instead of ending on a hard line. */
function boneSection(crest, top, inner, outer) {
  const pts = [];
  const H = top - crest, R = 1.2;
  const steps = 12;
  for (let i = 0; i <= steps; i++) { const f = i / steps; pts.push([outer * (1 - 0.8 * f * f), crest + R + f * (H - R)]); }
  for (let i = 0; i <= steps; i++) { const f = 1 - i / steps; pts.push([-inner * (1 - 0.55 * f * f), crest + R + f * (H - R)]); }
  for (let i = 1; i < 8; i++) {
    const a = Math.PI * (i / 8);
    const w = (inner + outer) / 2, mid = (outer - inner) / 2;
    pts.push([mid - Math.cos(a) * w, crest + R - Math.sin(a) * R]);
  }
  return pts;
}

// ----------------------------------------------------------------- materials

const shared = { uRef: { value: 0 } };
const CH = { tooth: [1, 0, 0, 0], bone: [0, 1, 0, 0], metal: [0, 0, 1, 0], mark: [0, 0, 0, 1] };

function xrayMaterial(channel, density) {
  return new THREE.ShaderMaterial({
    uniforms: { uChannel: { value: new THREE.Vector4(...channel) }, uDensity: { value: density }, uRef: shared.uRef },
    vertexShader: /* glsl */`
      varying float vZ;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vZ = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec4 uChannel; uniform float uDensity; uniform float uRef;
      varying float vZ;
      void main() { float s = gl_FrontFacing ? -1.0 : 1.0; gl_FragColor = uChannel * (s * (vZ - uRef) * uDensity); }`,
    side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
  });
}

/** An X-ray object; a negative volume (inward winding) flips its sign. */
function xmesh(geo, channel, density, matrix) {
  const sign = signedVolume(geo) < 0 ? -1 : 1;
  const m = new THREE.Mesh(geo, xrayMaterial(CH[channel], density * sign));
  if (matrix) { m.matrixAutoUpdate = false; m.matrix.copy(matrix); }
  m.frustumCulled = false;
  return m;
}

// The X-ray in passes, each cheap enough that the GPU never stalls:
// thickness → attenuation (with the bone's texture) → a small blur (for the
// edge sharpening and the planned implant's outline) and a wide, quarter-size
// blur (the glow) → the film.
const NOISE = /* glsl */`
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
  float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }`;
const ATTENUATION = /* glsl */`
  precision highp float;
  uniform sampler2D tT, tBone; uniform vec4 uK; uniform float uMode, uAspect, uTrab;
  varying vec2 vUv;
  ${NOISE}
  vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float walls(vec2 p) {                    // Worley F2 − F1: small at the borders between cells
    vec2 i = floor(p), f = fract(p);
    float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(i + g) * 0.85 + 0.075;
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return d2 - d1;
  }
  // cancellous bone: thin brighter struts around darker marrow spaces, the
  // pattern a little irregular in size and strength
  float trab(vec2 uv) {
    vec2 p = vec2(uv.x * uAspect, uv.y) * uTrab;
    p += vec2(fbm(p * 0.35), fbm(p * 0.35 + 9.0)) * 1.4;
    float strut = (1.0 - smoothstep(0.0, 0.3, walls(p))) * smoothstep(0.35, 0.65, fbm(p * 0.6 + 4.0));
    return 0.9 + 0.17 * strut + 0.14 * (fbm(p * 0.3) - 0.5);
  }
  // grafted bone is granular: particles, not a net
  float granules(vec2 uv) {
    vec2 p = vec2(uv.x * uAspect, uv.y) * uTrab * 1.6;
    return 0.8 + 0.4 * smoothstep(0.4, 0.8, vnoise(p) * 0.7 + vnoise(p * 2.3) * 0.3);
  }
  void main() {
    vec4 t = texture2D(tT, vUv);
    float mark = uK.w * max(t.a, 0.0) * (uMode < 0.5 ? granules(vUv) : 1.0);
    float bone = max(texture2D(tBone, vUv).g, 0.0);
    float a = uK.x * max(t.r, 0.0) + uK.y * bone * trab(vUv) + uK.z * max(t.b, 0.0);
    if (uMode < 0.5) a += mark;
    // r attenuation · g where the planned implant is · b titanium · a rebuilt bone
    gl_FragColor = vec4(a, step(0.02, t.a), 1.0 - exp(-uK.z * max(t.b, 0.0) * 1.4), mark);
  }`;
const BLUR = /* glsl */`
  precision highp float;
  uniform sampler2D tSrc; uniform vec2 uStep; uniform float uFilm;
  varying vec2 vUv;
  vec4 at(vec2 uv) { vec4 v = texture2D(tSrc, uv); if (uFilm > 0.5) v.r = 1.0 - exp(-v.r); return v; }
  void main() {
    vec4 s = vec4(0.0); float wsum = 0.0;
    for (int i = -6; i <= 6; i++) { float w = exp(-float(i * i) / 18.0); s += at(vUv + uStep * float(i)) * w; wsum += w; }
    gl_FragColor = s / wsum;
  }`;
const FILM = /* glsl */`
  precision highp float;
  uniform sampler2D tA, tB, tG; uniform float uSharp, uGlow, uMode, uHatch; uniform vec3 uInk, uSand;
  varying vec2 vUv;
  vec3 ramp(float I) {
    vec3 c1 = vec3(0.105, 0.18, 0.27), c2 = vec3(0.43, 0.56, 0.69), c3 = vec3(0.8, 0.88, 0.97);
    I = clamp(I, 0.0, 1.0);
    if (I < 0.2) return mix(uInk, c1, I / 0.2);
    if (I < 0.5) return mix(c1, c2, (I - 0.2) / 0.3);
    if (I < 0.8) return mix(c2, c3, (I - 0.5) / 0.3);
    return mix(c3, vec3(0.95, 0.98, 1.0), (I - 0.8) / 0.2);
  }
  void main() {
    vec4 A = texture2D(tA, vUv), B = texture2D(tB, vUv);
    float glow = texture2D(tG, vUv).r;
    float s = max(A.r + uSharp * (A.r - B.r), 0.0);
    float I = pow(s / (s + 0.85), 0.92);
    vec3 col = ramp(I) + vec3(0.30, 0.45, 0.62) * glow * uGlow;
    if (uMode < 0.5) {
      float gr = 1.0 - exp(-A.a);
      col = mix(col, uSand * (0.45 + 0.75 * I), gr * 0.75);    // rebuilt bone, warm
    }
    col = mix(col, vec3(0.975, 0.985, 1.0), A.b);              // titanium burns out to white
    if (uMode > 0.5) {
      float cov = B.g, line = 1.0 - abs(2.0 * cov - 1.0);
      float hatch = smoothstep(0.35, 0.5, abs(fract((gl_FragCoord.x + gl_FragCoord.y) / uHatch) - 0.5) * 2.0);
      col += uSand * cov * (0.16 + 0.2 * hatch);              // the plan: a warm fill with a fine hatch …
      col = mix(col, uSand, smoothstep(0.1, 0.65, line));       // … and a fine outline
    }
    gl_FragColor = vec4(col, 1.0);
  }`;

// --------------------------------------------------------------------- stage

export async function createStudio({ modelUrl }) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const gl = renderer.getContext();
  gl.getExtension('EXT_color_buffer_float');
  const floatBlend = !!gl.getExtension('EXT_float_blend');

  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  const model = gltf.scene;
  model.getObjectByName('human_dentition').scale.setScalar(1);       // work in millimetres
  model.getObjectByName('maxillary_hinge').quaternion.identity();    // the upper arch in its own frame
  model.updateMatrixWorld(true);
  const find = (re) => { let hit = null; model.traverse((o) => { if (!hit && o.isMesh && re.test(o.name)) hit = o; }); return hit; };
  const findAll = (re) => { const out = []; model.traverse((o) => { if (o.isMesh && re.test(o.name)) out.push(o); }); return out; };

  // ---- the teeth: studio geometry (normals, a tone from edge to neck) and
  // closed volumes for the X-ray
  const teeth = {};
  for (const id of [...UPPER, '36']) {
    const upper = id[0] === '1' || id[0] === '2';
    const crown = baked(find(new RegExp(`^tooth_${id}_.*_crown$`)));
    const roots = findAll(new RegExp(`^tooth_${id}_.*_root(_\\d)?$`)).map(baked);
    const cc = closed(crown);
    crown.computeBoundingBox();
    const bb = crown.boundingBox.clone();
    const ring = cc.loops[0].centre;
    const tip = (geo) => { const p = geo.getAttribute('position'); let best = -1; const at = new THREE.Vector3(), q = new THREE.Vector3(); for (let i = 0; i < p.count; i += 2) { q.fromBufferAttribute(p, i); const d = q.distanceTo(ring); if (d > best) { best = d; at.copy(q); } } return at; };
    const tips = roots.map(tip);
    const apex = tips.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(roots.length);
    const rootCentre = new THREE.Vector3(); let n = 0;
    roots.forEach((r) => { const p = r.getAttribute('position'); for (let i = 0; i < p.count; i += 7) { rootCentre.add(new THREE.Vector3().fromBufferAttribute(p, i)); n++; } });
    rootCentre.divideScalar(n);
    toothColours(crown, bb, upper);
    crown.computeVertexNormals();
    teeth[id] = { id, upper, crown, crownX: cc.geo, rootsX: roots.map((r) => closed(r).geo), bb, ring, ringY: ring.y, apex, tips, axis: apex.clone().sub(ring).normalize(), rootCentre };
  }
  const gumGeo = baked(find(/^maxillary_gingiva$/));

  const toothMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.09, ior: 1.62,
    specularIntensity: 0.9, sheen: 0.18, sheenColor: new THREE.Color(0xfff4e6), sheenRoughness: 0.5,
  });
  const gumMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, color: new THREE.Color(0.9, 0.7, 0.71), roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.35,
    sheen: 0.5, sheenColor: new THREE.Color(0xff9c94), sheenRoughness: 0.6, specularIntensity: 0.45, envMapIntensity: 0.45,
  });
  const titanium = new THREE.MeshPhysicalMaterial({ color: 0xc3c8cf, metalness: 1, roughness: 0.32 });
  titanium.onBeforeCompile = (sh) => {
    // the threaded body is sandblasted (matte), the collar polished
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float body;\nvarying float vBody;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBody = body;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vBody;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.13, 0.5, vBody);');
  };
  const abutMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd3d9, metalness: 1, roughness: 0.18 });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  function studioLights(scene, { key = 1.7, rim = 1.3, fill = 0.4, env = 0.7 } = {}) {
    scene.environment = envTex;
    scene.environmentIntensity = env;
    const k = new THREE.DirectionalLight(0xfff0de, key); k.position.set(-45, 60, 100);
    const f = new THREE.DirectionalLight(0xdfe9ff, fill); f.position.set(80, -10, 40);
    const r = new THREE.DirectionalLight(0xcfe2ff, rim); r.position.set(30, 70, -110);
    const r2 = new THREE.DirectionalLight(0xffe7cf, rim * 0.5); r2.position.set(-90, -20, -60);
    scene.add(k, f, r, r2);
  }

  const implantGeo = {
    incisor: implantGeometry({ length: 12, radius: 1.95 }),
    molar: implantGeometry({ length: 10, radius: 2.4, depth: 0.42, pitch: 0.85 }),
    allon: implantGeometry({ length: 13, radius: 2.05 }),
  };
  const abutGeo = { incisor: abutmentGeometry(), molar: abutmentGeometry({ neck: 2.1, shoulder: 3.1, post: 2.6, height: 6.2 }) };
  const healGeo = capGeometry(2.3, 2.05, 3.4);
  const muaGeo = capGeometry(2.3, 2.0, 2.4);
  const sleeveGeo = sleeveGeometry(2.6, 2.05, 2.4);
  const UP = new THREE.Vector3(0, 1, 0);

  /** The frame of an implant replacing tooth `id`: platform `depth` mm
   *  apical of the crown's cervical ring, along `axis` (default: the root
   *  axis). `tilt` (degrees) leans the apex towards tooth `toward`. */
  function implantFrame(id, { depth = 1.8, axis, tilt = 0, toward } = {}) {
    const t = teeth[id];
    const ax = (axis || t.axis).clone().normalize();
    if (tilt && toward) {
      const m = teeth[toward].ring.clone().sub(t.ring).setY(0).normalize();
      const a = THREE.MathUtils.degToRad(tilt);
      ax.multiplyScalar(Math.cos(a)).addScaledVector(m, Math.sin(a)).normalize();
    }
    const platform = t.ring.clone().addScaledVector(ax, depth);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, ax);
    return { platform, axis: ax, matrix: new THREE.Matrix4().compose(platform, q, new THREE.Vector3(1, 1, 1)) };
  }

  // ---- the bone: a slab swept along the arch through the root centres
  const archPts = UPPER.map((id) => new THREE.Vector3(teeth[id].rootCentre.x, 0, teeth[id].rootCentre.z));
  const ext = (a, b) => a.clone().add(a.clone().sub(b).setLength(5));
  const arch = new THREE.CatmullRomCurve3([ext(archPts[0], archPts[1]), ...archPts, ext(archPts.at(-1), archPts.at(-2))], false, 'centripetal');
  const sOf = (p) => { let best = 0, bd = Infinity; for (let k = 0; k <= 600; k++) { const q = arch.getPointAt(k / 600); const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < bd) { bd = d; best = k / 600; } } return best; };
  UPPER.forEach((id) => { teeth[id].s = sOf(teeth[id].rootCentre); });

  /** Bone for a case: `missing` teeth leave a resorbed ridge; `sinus` (a
   *  tooth id) drops the sinus floor there to `sinusBone` mm over the crest. */
  function boneGeometry({ missing = [], sinus = null, sinusBone = 4.5, resorb = 2.2, top = 34, range = [0, 1] } = {}) {
    const ids = UPPER;
    const crestAt = (s) => {
      // ~1.6 mm above the cervical line, peaking between the teeth (the septa)
      if (s <= teeth[ids[0]].s) return teeth[ids[0]].ringY + 1.6 + (missing.includes(ids[0]) ? resorb : 0);
      if (s >= teeth[ids.at(-1)].s) return teeth[ids.at(-1)].ringY + 1.6 + (missing.includes(ids.at(-1)) ? resorb : 0);
      let i = 0;
      while (i < ids.length - 2 && teeth[ids[i + 1]].s < s) i++;
      const a = teeth[ids[i]], b = teeth[ids[i + 1]];
      const f = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s)));
      let y = a.ringY + (b.ringY - a.ringY) * f + 1.6;
      const aGone = missing.includes(a.id), bGone = missing.includes(b.id);
      if (!aGone && !bGone) y -= 1.3 * Math.sin(Math.PI * f) ** 2;
      const gone = (aGone ? 1 - f : 0) + (bGone ? f : 0);       // a lost tooth's ridge sinks back
      return y + resorb * smooth(gone * 1.25);
    };
    const topAt = (s) => {
      if (!sinus) return top;
      const dip = 1 - smooth(Math.abs(s - teeth[sinus].s) / 0.12);
      return top + (crestAt(s) + sinusBone - top) * dip;
    };
    const [s0, s1] = range;
    const geo = sweep(arch, 260, (s) => {
      const lead = s0 > 0 ? 0.14 : 0.05;
      const end = smooth((s - s0) / lead) * smooth((s1 - s) / 0.05);
      const c = crestAt(s);
      return boneSection(c, Math.max(c + 2.8, topAt(s)), 7.2 * (0.06 + 0.94 * end), 3.9 * (0.06 + 0.94 * end));
    }, s0, s1);
    // the sinus floor shows as a thin bright line where the bone is thin
    let floor = null;
    if (sinus) {
      const sc = teeth[sinus].s, a = Math.max(s0, sc - 0.075), b = Math.min(s1, sc + 0.075);
      floor = sweep(arch, 120, (s) => {
        const t = topAt(s), w = 0.1 + 0.9 * smooth(1 - Math.abs(s - sc) / 0.075), h = 0.12 + 0.3 * w;
        return [[-6.6 * w, t - h], [3.5 * w, t - h], [3.5 * w, t + h * 0.5], [-6.6 * w, t + h * 0.5]];
      }, a, b);
    }
    return { geo, floor, crestAt, topAt };
  }

  // ---------------------------------------------------------------- cases

  /** Everything a shot needs: X-ray objects, studio objects, label points. */
  function buildCase(name) {
    const xr = new THREE.Group(), real = new THREE.Group();
    const marks = {};
    let gum = false;
    const add = (group, ...objs) => objs.forEach((o) => group.add(o));
    const placed = (geo, mat, matrix) => { const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; m.matrix.copy(matrix); return m; };
    // a natural tooth sits in a socket: a thin gap (the ligament) where
    // there is neither bone nor root, so the root reads with a dark line round it
    // xrayOnly: the X-ray shows only these (a film of the front teeth holds
    // no molars; seen end-on they would stack into one bright block)
    const natural = (ids, xrayOnly) => ids.forEach((id) => {
      const t = teeth[id];
      t.socketsX ||= t.rootsX.map((g) => inflate(g, 0.32));
      t.pulpX ||= pulp(t);
      if (!xrayOnly || xrayOnly.includes(id)) {
        add(xr, xmesh(t.crownX, 'tooth', D.enamel), ...t.rootsX.map((g) => xmesh(g, 'tooth', D.dentin)), ...t.socketsX.map((g) => xmesh(g, 'bone', -D.bone)));
        add(xr, ...t.pulpX.map(({ geo, m }) => xmesh(geo, 'tooth', -D.dentin * 0.85, m)));
      }
      add(real, new THREE.Mesh(t.crown, toothMat));
    });
    const FRONT = ['14', '13', '12', '11', '21', '22', '23', '24'];
    // the pulp: a chamber in the crown and a canal down each root, less dense
    // than dentin, so natural teeth show the dark line an implant crown lacks
    function pulp(t) {
      return t.tips.map((tipAt, k) => {
        const dir = tipAt.clone().sub(t.ring);
        const L = dir.length();
        const chamber = k === 0 ? [[0, -3.4], [0.7, -3.1], [1.05, -2.0], [1.0, -0.6]] : [[0, -0.6]];
        const geo = revolve([...chamber, [0.75, 0.3], [0.5, L * 0.45], [0.26, L * 0.85], [0.12, L * 0.97], [0, L * 0.99]], 32);
        const m = new THREE.Matrix4().compose(t.ring, new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()), new THREE.Vector3(1, 1, 1));
        return { geo, m };
      });
    }
    const others = (except, side) => UPPER.filter((id) => !except.includes(id) && (!side || (id[0] === side && +id[1] >= 3)));
    const leftSide = () => [teeth['23'].s - 0.05, 1];
    /** implant + abutment + ceramic crown replacing tooth `id` */
    const restored = (id, kind, opts) => {
      const t = teeth[id], f = implantFrame(id, opts);
      add(xr, xmesh(implantGeo[kind], 'metal', D.metal, f.matrix), xmesh(abutGeo[kind], 'metal', D.metal, f.matrix), xmesh(t.crownX, 'tooth', D.ceramic));
      add(real, placed(implantGeo[kind], titanium, f.matrix), placed(abutGeo[kind], abutMat, f.matrix), new THREE.Mesh(t.crown, toothMat));
      return f;
    };

    if (name === 'single21') {
      // 21 is an implant crown, everything else natural
      gum = true;
      natural(others(['21']), FRONT);
      const f = restored('21', 'incisor', { depth: 1.9 });
      add(xr, xmesh(boneGeometry().geo, 'bone', D.bone));
      marks.crown = teeth['21'].bb.getCenter(new THREE.Vector3());
      marks.abutment = f.platform.clone().addScaledVector(f.axis, -1.4);
      marks.implant = f.platform.clone().addScaledVector(f.axis, 6.5);
      marks.bone = f.platform.clone().addScaledVector(f.axis, 7.5).lerp(teeth['22'].ring.clone().addScaledVector(teeth['22'].axis, 9), 0.55);
      marks.gumLine = teeth['21'].ring.clone();
    } else if (name === 'gap26') {
      natural(others(['26'], '2'));
      add(xr, xmesh(boneGeometry({ missing: ['26'], resorb: 1.4, range: leftSide() }).geo, 'bone', D.bone));
      marks.gap = teeth['26'].ring.clone();
    } else if (name === 'several') {
      const gone = ['24', '25', '26'];
      natural(others(gone, '2'));
      add(xr, xmesh(boneGeometry({ missing: gone, resorb: 2.4, range: leftSide() }).geo, 'bone', D.bone));
      marks.gap = teeth['25'].ring.clone();
    } else if (name === 'sinus26') {
      // too little bone under the sinus: rebuilt bone (sand) above the thin
      // floor, the implant reaching into it
      natural(others(['26'], '2'));
      const bone = boneGeometry({ missing: ['26'], sinus: '26', sinusBone: 4.0, resorb: 0.8, range: leftSide() });
      add(xr, xmesh(bone.geo, 'bone', D.bone), xmesh(bone.floor, 'bone', D.bone * 2.6));
      const f = restored('26', 'molar', { depth: 2.2, axis: UP.clone().lerp(teeth['26'].axis, 0.5) });
      const s = teeth['26'];
      const centre = arch.getPointAt(s.s);
      const graft = new THREE.SphereGeometry(1, 64, 40);
      const gm = new THREE.Matrix4().compose(new THREE.Vector3(centre.x, bone.topAt(s.s) + 2.6, centre.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.atan2(centre.x, centre.z + 22), 0)), new THREE.Vector3(6.2, 4.2, 6.0));
      add(xr, xmesh(graft, 'mark', D.graft, gm), xmesh(graft, 'bone', D.bone * 0.7, gm));
      marks.graft = new THREE.Vector3(centre.x, bone.topAt(s.s) + 3, centre.z);
      marks.implant = f.platform.clone().addScaledVector(f.axis, 5);
    } else if (name === 'allon4') {
      // no natural teeth: a fixed bridge (crowns 16–26) on four implants, the
      // back two tilted so they stay clear of the sinus, joined by a bar
      add(xr, xmesh(boneGeometry({ missing: UPPER, resorb: 2.4 }).geo, 'bone', D.bone));
      const frames = [['12', 0], ['22', 0], ['15', 38, '13'], ['25', 38, '23']].map(([id, tilt, toward]) => {
        const f = implantFrame(id, { depth: 3.4, axis: UP.clone().lerp(teeth[id].axis, 0.6), tilt, toward });
        add(xr, xmesh(implantGeo.allon, 'metal', D.metal, f.matrix), xmesh(muaGeo, 'metal', D.metal, f.matrix));
        return f;
      });
      ['15', '14', '13', '12', '11', '21', '22', '23', '24', '25'].forEach((id) => add(xr, xmesh(teeth[id].crownX, 'tooth', D.ceramic * 0.85)));
      const tops = frames.map((f) => f.platform.clone().addScaledVector(f.axis, -2.4));
      const back = (i, id) => tops[i].clone().add(teeth[id].ring.clone().sub(teeth[i === 2 ? '14' : '24'].ring).setY(0).setLength(4));
      const bar = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([back(2, '16'), tops[2], tops[0], tops[1], tops[3], back(3, '26')], false, 'centripetal'), 160, 1.1, 20, false);
      add(xr, xmesh(closed(bar).geo, 'metal', D.metal));
      marks.implants = frames.map((f) => f.platform.clone().addScaledVector(f.axis, 6));
    } else if (name === 'scan21' || name === 'plan21' || name === 'placed21') {
      natural(others(['21']), name === 'scan21' ? null : FRONT);
      add(xr, xmesh(boneGeometry({ missing: ['21'], resorb: 0.9 }).geo, 'bone', D.bone));
      const f = implantFrame('21', { depth: 2.4 });
      const q = new THREE.Quaternion().setFromUnitVectors(UP, f.axis);
      if (name === 'plan21') {
        // the planned position outlined in sand, the guide's sleeve above it,
        // the drilling axis through both
        add(xr, xmesh(implantGeo.incisor, 'mark', D.plan, f.matrix), xmesh(teeth['21'].crownX, 'mark', D.plan));
        add(xr, xmesh(sleeveGeo, 'mark', D.plan, new THREE.Matrix4().compose(f.platform.clone().addScaledVector(f.axis, -14.2), q, new THREE.Vector3(1, 1, 1))));
        const line = closed(new THREE.CylinderGeometry(0.12, 0.12, 36, 12)).geo;
        add(xr, xmesh(line, 'mark', D.plan, new THREE.Matrix4().compose(f.platform.clone().addScaledVector(f.axis, -1), q, new THREE.Vector3(1, 1, 1))));
      } else if (name === 'placed21') {
        add(xr, xmesh(implantGeo.incisor, 'metal', D.metal, f.matrix), xmesh(healGeo, 'metal', D.metal, f.matrix));
      }
      marks.site = f.platform.clone().addScaledVector(f.axis, 6);
    } else if (name === 'crown21') {
      gum = true;
      natural(others(['21']));
      restored('21', 'incisor', { depth: 1.9 });
    } else if (name === 'product') {
      // implant, abutment and a lower molar crown on their own, crown up
      const t = teeth['36'];
      const f = implantFrame('36', { depth: 1.6 });
      const g = new THREE.Group();
      const zirconia = new THREE.MeshPhysicalMaterial({ color: 0xf3eee4, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06, ior: 1.7, sheen: 0.2, sheenColor: new THREE.Color(0xffffff) });
      g.add(new THREE.Mesh(t.crown, zirconia), placed(implantGeo.molar, titanium, f.matrix), placed(abutGeo.molar, abutMat, f.matrix));
      // lean it a little about the platform, so the threads catch the light
      const pivot = new THREE.Group();
      pivot.position.copy(f.platform);
      g.position.copy(f.platform).negate();
      pivot.add(g);
      pivot.rotation.set(0.1, 0.35, -0.16);
      add(real, pivot);
    }
    return { xr, real, marks, gum };
  }

  // ---------------------------------------------------------------- render

  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const fsScene = new THREE.Scene();
  fsScene.add(quad);
  const fsVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const fsMat = (fragmentShader, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: fsVert, fragmentShader, depthTest: false, depthWrite: false });
  const attMat = fsMat(ATTENUATION, { tT: { value: null }, tBone: { value: null }, uK: { value: new THREE.Vector4() }, uMode: { value: 0 }, uAspect: { value: 1 }, uTrab: { value: 55 } });
  const blurMat = fsMat(BLUR, { tSrc: { value: null }, uStep: { value: new THREE.Vector2() }, uFilm: { value: 0 } });
  const filmMat = fsMat(FILM, { tA: { value: null }, tB: { value: null }, tG: { value: null }, uSharp: { value: 0.9 }, uGlow: { value: 0.3 }, uMode: { value: 0 }, uHatch: { value: 18 }, uInk: { value: hexToVec(INK) }, uSand: { value: hexToVec(SAND) } });
  function pass(mat, out) { quad.material = mat; renderer.setRenderTarget(out); renderer.render(fsScene, fsCam); }

  const camera = new THREE.PerspectiveCamera(20, 1, 5, 2000);
  function aim({ target, az = 0, el = 0, frameH = 30, fov = 20, shift = [0, 0], up = [0, 1, 0] }, w, h) {
    camera.fov = fov;
    camera.aspect = w / h;
    const dist = frameH / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const A = THREE.MathUtils.degToRad(az), E = THREE.MathUtils.degToRad(el);
    const tg = v3(target);
    camera.position.set(tg.x + dist * Math.sin(A) * Math.cos(E), tg.y + dist * Math.sin(E), tg.z + dist * Math.cos(A) * Math.cos(E));
    camera.up.set(...up);
    camera.lookAt(tg);
    // shift: where the target lands, as a fraction of the frame from its centre (+x right, +y down)
    camera.clearViewOffset();
    if (shift[0] || shift[1]) camera.setViewOffset(w, h, -shift[0] * w, -shift[1] * h, w, h);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    shared.uRef.value = dist;
  }
  const project = (p) => { const q = p.clone().project(camera); return [+(((q.x + 1) / 2) * 100).toFixed(1), +(((1 - q.y) / 2) * 100).toFixed(1)]; };

  const targets = {};
  /** A render target kept per name and size: float for the thickness sums
   *  (they cancel large depths), half float with filtering for the rest. */
  function target(name, w, h, exact) {
    const t = targets[name];
    if (t && t.width === w && t.height === h) return t;
    if (t) t.dispose();
    const filter = exact ? THREE.NearestFilter : THREE.LinearFilter;
    return (targets[name] = new THREE.WebGLRenderTarget(w, h, {
      type: exact && floatBlend ? THREE.FloatType : THREE.HalfFloatType, format: THREE.RGBAFormat,
      minFilter: filter, magFilter: filter, depthBuffer: false,
    }));
  }

  const cases = {};
  const getCase = (name) => (cases[name] ||= buildCase(name));

  /** Render one shot at w×h (the caller supersamples) and return a PNG data
   *  URL plus the label points in % of the frame. */
  function shot(spec, w, h) {
    const c = getCase(spec.case);
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    aim(spec.cam, w, h);
    const scene = new THREE.Scene();
    if (spec.mode === 'xray') {
      scene.add(c.xr);
      const k = spec.k || {};
      const T = target('thick', w, h, true);
      renderer.setRenderTarget(T);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, false, false);
      renderer.render(scene, camera);
      scene.remove(c.xr);
      const blur = (src, out, dx, dy, film) => {
        blurMat.uniforms.tSrc.value = src.texture;
        blurMat.uniforms.uStep.value.set(dx, dy);
        blurMat.uniforms.uFilm.value = film ? 1 : 0;
        pass(blurMat, out);
      };
      // the bone's edges soften (a short blur of the thickness), then attenuation
      const bs = (spec.boneBlur ?? 1.6) * (w / 1600);
      const T1 = target('t1', w, h), T2 = target('t2', w, h);
      renderer.setClearColor(0x000000, 1);
      blur(T, T1, bs / w, 0); blur(T1, T2, 0, bs / h);
      const A = target('att', w, h);
      attMat.uniforms.tT.value = T.texture;
      attMat.uniforms.tBone.value = T2.texture;
      attMat.uniforms.uK.value.set(k.tooth ?? 0.13, k.bone ?? 0.024, k.metal ?? 0.45, k.mark ?? 0.13);
      attMat.uniforms.uMode.value = spec.plan ? 1 : 0;
      attMat.uniforms.uAspect.value = w / h;
      attMat.uniforms.uTrab.value = spec.trab ?? 55;
      renderer.setClearColor(0x000000, 1);
      pass(attMat, A);
      // a small blur, then the wide glow at a quarter of the size
      const r = (spec.blur ?? 5) * (w / 1600) / 3;          // per tap, in pixels
      const B1 = target('b1', w, h), B2 = target('b2', w, h);
      blur(A, B1, r / w, 0); blur(B1, B2, 0, r / h);
      const qw = Math.round(w / 4), qh = Math.round(h / 4);
      const G1 = target('g1', qw, qh), G2 = target('g2', qw, qh), G3 = target('g3', qw, qh);
      const gr = 3.2 * (w / 1600);
      blur(A, G1, gr * 4 / w, 0, true); blur(G1, G2, 0, gr * 4 / h); blur(G2, G3, gr * 8 / w, 0); blur(G3, G2, 0, gr * 8 / h);
      filmMat.uniforms.tA.value = A.texture;
      filmMat.uniforms.tB.value = B2.texture;
      filmMat.uniforms.tG.value = G2.texture;
      filmMat.uniforms.uSharp.value = spec.sharp ?? 0.9;
      filmMat.uniforms.uGlow.value = spec.glow ?? 0.3;
      filmMat.uniforms.uMode.value = spec.plan ? 1 : 0;
      filmMat.uniforms.uHatch.value = 18 * (w / 2400);
      pass(filmMat, null);
    } else {
      studioLights(scene, spec.light);
      scene.add(c.real);
      if (c.gum && spec.gum !== false) scene.add(new THREE.Mesh(gumGeo, gumMat));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMappingExposure = spec.exposure ?? 1.0;
      renderer.render(scene, camera);
      scene.remove(c.real);
    }
    const marks = {};
    for (const [key, p] of Object.entries(c.marks)) marks[key] = Array.isArray(p) ? p.map(project) : project(p);
    return { url: post(canvas, w, h, spec), marks };
  }

  /** Background, the gum's fade into the dark, vignette, a little grain. */
  function post(src, w, h, spec) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (spec.mode === 'xray') {
      g.fillStyle = INK;              // only shows where a fade opens the film
      g.fillRect(0, 0, w, h);
    } else {
      const bg = g.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.75);
      bg.addColorStop(0, INK2);
      bg.addColorStop(1, INK);
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
    }
    let layer = src;
    if (spec.fade || spec.fadeX) {
      const l = document.createElement('canvas');
      l.width = w; l.height = h;
      const lg = l.getContext('2d');
      lg.drawImage(src, 0, 0);
      lg.globalCompositeOperation = 'destination-in';
      if (spec.fade) {
        const grad = lg.createLinearGradient(0, spec.fade[0] * h, 0, spec.fade[1] * h);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
        lg.fillStyle = grad;
        lg.fillRect(0, 0, w, h);
      }
      if (spec.fadeX) {
        const x = spec.fadeX, grad = lg.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(x, 'rgba(0,0,0,1)');
        grad.addColorStop(1 - x, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        lg.fillStyle = grad;
        lg.fillRect(0, 0, w, h);
      }
      layer = l;
    }
    g.drawImage(layer, 0, 0, w, h);
    const vig = g.createRadialGradient(w * 0.5, h * 0.48, Math.min(w, h) * 0.35, w * 0.5, h * 0.48, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(6,10,15,0)');
    vig.addColorStop(1, `rgba(6,10,15,${spec.vignette ?? 0.55})`);
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
    const amp = spec.grain ?? 4;
    if (amp > 0) {
      const img = g.getImageData(0, 0, w, h), d = img.data;
      let seed = 1234567;
      for (let i = 0; i < d.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const n = ((seed >>> 8) / 16777216 - 0.5) * amp * 2;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      g.putImageData(img, 0, 0);
    }
    return c.toDataURL('image/png');
  }

  const r2 = (v) => v.toArray().map((x) => +x.toFixed(2));
  return { shot, floatBlend, teeth: Object.fromEntries(Object.entries(teeth).map(([k, t]) => [k, { ring: r2(t.ring), apex: r2(t.apex), root: r2(t.rootCentre), min: r2(t.bb.min), max: r2(t.bb.max) }])) };
}

/** Warm towards the gum, a cool translucent biting edge, a little of the
 *  model's own colour variation kept. */
function toothColours(geo, bb, upper) {
  const pos = geo.getAttribute('position');
  const src = geo.getAttribute('color');
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const edgeY = upper ? bb.min.y : bb.max.y;
  const H = bb.max.y - bb.min.y;
  const edge = new THREE.Color('#c4cdd3'), body = new THREE.Color('#f0e7d5'), neck = new THREE.Color('#dcc39d');
  const tmp = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const v = Math.abs(pos.getY(i) - edgeY) / H;      // 0 at the biting edge … 1 at the gum
    tmp.copy(edge).lerp(body, smooth(v / 0.36)).lerp(neck, smooth((v - 0.6) / 0.4));
    if (src) {
      const k = 0.18;
      tmp.r = tmp.r * (1 - k) + src.getX(i) * 1.25 * k;
      tmp.g = tmp.g * (1 - k) + src.getY(i) * 1.25 * k;
      tmp.b = tmp.b * (1 - k) + src.getZ(i) * 1.25 * k;
    }
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
}
