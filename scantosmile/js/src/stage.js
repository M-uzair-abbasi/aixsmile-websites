// Scan to Smile: the 3D world behind the page.
//
// One fixed, transparent canvas. The page reports one number, P, as it
// scrolls through the dark chapters (site.js); set(P) turns it into poses
// and shader values, render() draws.
//
// One story, every move with a reason, and three big moments (the user's
// choice after "no wow moment"):
//   0  hero      the PRODUCT SHOT: the tray, seen from the front looking
//                into it, in a soft pool of light with a faint measuring grid
//                (a texture plane behind it). Its front surface looks the
//                plane up along a refracted ray (three IORs = a little
//                dispersion), so the grid bends inside every tooth, and it
//                reflects a dark studio with strip lights (crisp streaks,
//                not milk). The page hands over the box it fills (place());
//                the whole shot scrolls away with the page
//   1  methode   the scan streams in as points → a plaster model (a scan
//                line passes: the dentist's check) → the tray is
//                thermoformed over it → the model goes
//   2  post      the mailer rises, both trays go in, lid, label; then
//                THROUGH THE LETTERBOX: a front door slides in, the box
//                pushes through its brass flap (a 230 × 32 mm slot, the
//                24 mm box just fits) and drops
//   3  ankunft   the box lands and opens; aligner 01 lifts out and clicks
//                onto real teeth; then SMILE: a portrait grows out from its
//                mouth, aligned with the 3D teeth, and the view pulls back
//                to the whole face
//
// Pieces in millimetres (tools/make_aligner.py, split_aligner.py,
// export_scan.py). heroIn() turns the hero's light on.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, Color, Vector2, Vector3, Euler, Quaternion, MathUtils, Box3,
  MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, BufferGeometry, BufferAttribute, PMREMGenerator, DirectionalLight,
  HemisphereLight, BackSide, FrontSide, DoubleSide, PlaneGeometry, BoxGeometry, ExtrudeGeometry, Shape, Path,
  CanvasTexture, TextureLoader, SRGBColorSpace, ACESFilmicToneMapping, RepeatWrapping,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

const SIGNAL = new Color(0xff5a1f);
const WARM = new Color(0xffb27a);
const INK = new Color(0x12100e);
const CREAM = new Color(0xebe5d9);
const BOX = { w: 96, d: 70, h: 24, wall: 1.6 };
const SLOT = { w: 230, h: 32 };             // DIN EN 13724: at least 230 × 30 mm
const DOOR = { w: 1100, h: 820, depth: 40 };
const HERO_TURN = { rx: 0.8, ry: -0.32, rz: 0.14 };   // the hero's view: from the front, looking into the tray
const BACK_Z = -70;                        // the backdrop plane behind the hero tray (world mm)
// where the upper teeth are in assets/photos/smile.webp (image fractions, measured)
const SMILE = { u: 0.492, v: 0.575, span: 0.195, aspect: 1152 / 1536 };

// ---------- small maths ----------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, k) => a + (b - a) * k;
const ease = (k) => k * k * (3 - 2 * k);
const easeOut = (k) => 1 - (1 - k) * (1 - k) * (1 - k);
const easeIn = (k) => k * k * k;
const seg = (p, a, b) => clamp01((p - a) / (b - a));
function track(p, keys) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i][0]) {
      const [p0, v0] = keys[i - 1], [p1, v1] = keys[i];
      return lerp(v0, v1, ease((p - p0) / (p1 - p0)));
    }
  }
  return keys[keys.length - 1][1];
}

// ---------- GLSL ----------
// Clear PETG. Reads by its rim and a faint film where the surface turns away;
// the inside pass (BackSide) is a faint dark tint, so what is behind dims a
// little. Extras:
//   uGlass          front pass only: refracts the backdrop plane (hero)
//   uGlintX/On      a band of light that follows the mouse (hero)
//   uFormOn/uFormY  formed up to a level (thermoforming), a hot line leads
//   uBoost          denser body + darker edges, to read on plaster / teeth
//   uClick          a flash along the rim as it snaps on
function clearMaterial(side, uniforms) {
  const m = new MeshStandardMaterial({
    color: side === BackSide ? 0x161a24 : 0xf3f6ff, roughness: 0.06, metalness: 0, transparent: true,
    opacity: side === BackSide ? 0.22 : 0.09, depthWrite: false, side, envMapIntensity: side === BackSide ? 0.7 : 1.6,
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObj;
        varying vec3 vWorld;
        uniform float uFade, uFormOn, uFormY, uGlow, uInner, uBoost, uClick, uGlass, uPlaneZ, uGlintX, uGlintOn;
        uniform vec2 uPlaneSize, uPlaneOff, uRes;
        uniform vec3 uSignal, uWarm, uInk, uCream;
        uniform sampler2D uBack;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float lead = 0.0;
        if (uFormOn > 0.5) {
          float d = vObj.y - uFormY;                // > 0: not formed yet
          if (d > 0.0) discard;
          lead = 1.0 - smoothstep(0.0, 2.2, -d);
        }
        float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.4);
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (fres * 0.8 + vObj.x * 0.012 + vec3(0.0, 0.33, 0.67)));
        float rim = fres * mix(0.62, 0.3, uInner);
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(0.78, 0.86, 1.0), vec3(0.1, 0.14, 0.28), fres), uBoost);
        float alpha = diffuseColor.a + rim + lead * 0.7 + uBoost * (0.2 + fres * 0.5) + uClick * fres * 0.4;
        vec3 seen = vec3(0.0);
        if (uGlass > 0.001) {
          // the backdrop (the light behind the product) seen through the plastic:
          // bent by the surface, three IORs for a little dispersion
          vec3 nW = normalize(inverseTransformDirection(normal, viewMatrix));
          vec3 vd = normalize(vWorld - cameraPosition);
          for (int i = 0; i < 3; i++) {
            vec3 r = refract(vd, nW, 1.0 / (1.1 + float(i) * 0.02));
            float t = (uPlaneZ - vWorld.z) / min(r.z, -0.08);
            vec2 uv = (vWorld.xy + r.xy * t - uPlaneOff) / uPlaneSize + 0.5;
            vec4 c = texture2D(uBack, uv);
            seen[i] = mix(uInk[i], c[i], c.a);
          }
          // thin plastic: a little light is lost, and where the surface turns
          // away it reflects the room, so the edges and folds read light
          seen = seen * vec3(0.9, 0.94, 0.98) + vec3(0.82, 0.88, 1.0) * pow(fres, 1.6) * 0.3;
          diffuseColor.rgb *= 1.0 - uGlass * 0.985;
          alpha = mix(alpha, 0.95, uGlass);
        }
        float glint = exp(-pow((vObj.x - uGlintX) / 3.2, 2.0)) * (0.25 + fres) * uGlintOn;
        diffuseColor.a = clamp(alpha, 0.0, 0.97) * uFade;
        float plain = 1.0 - uGlass;
        totalEmissiveRadiance += (seen * uGlass + film * fres * 0.16 * plain + uWarm * fres * uGlow * 0.55 * plain
          + vec3(1.0, 0.96, 0.9) * glint * 0.5 + uSignal * (lead * 3.2 + uClick * fres * 2.2)) * uFade;`);
  };
  m.customProgramCacheKey = () => `sts-clear-${side}`;
  return m;
}

// Plaster (the scan model) or enamel (the teeth): revealed (and taken away)
// behind a moving line across the arch (object z, front → molars).
function solidMaterial(kind, color, uniforms) {
  const enamel = kind === 'enamel';
  const m = new MeshStandardMaterial(enamel
    ? { color, roughness: 0.32, metalness: 0, envMapIntensity: 0.9, emissive: 0x2a2620, emissiveIntensity: 0.4, transparent: true }
    : { color, roughness: 0.9, metalness: 0, envMapIntensity: 0.45 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObj;
        uniform float uCut, uCutDir, uOn, uDim, uTop;
        uniform vec3 uSignal;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float d = (vObj.z - uCut) * uCutDir;
        if (d < 0.0 || vObj.y > uTop) discard;
        diffuseColor.rgb *= 1.0 - uDim * 0.45;
        float seam = (1.0 - smoothstep(0.0, 1.4, d)) * uOn;
        totalEmissiveRadiance += uSignal * seam * 1.8;`);
  };
  m.customProgramCacheKey = () => `sts-solid-${kind}`;
  return m;
}

// The scan as points: each flies in from aFrom to its place (staggered by aDelay).
function pointsMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uT: { value: 0 }, uOpacity: { value: 0 }, uSize: { value: 0.3 }, uScale: { value: 2000 },
      uColor: { value: SIGNAL.clone() }, uHot: { value: new Color(0xffe2cf) }, uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      attribute vec3 aFrom;
      attribute float aDelay;
      uniform float uT, uSize, uScale, uTime;
      varying float vK, vA;
      void main() {
        float k = clamp(uT * 1.6 - aDelay, 0.0, 1.0);
        k = k * k * (3.0 - 2.0 * k);
        vec3 p = mix(aFrom, position, k);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uSize * (1.0 + (1.0 - k) * 1.6) * (uScale / -mv.z);
        gl_Position = projectionMatrix * mv;
        vK = k;
        vA = (0.35 + 0.65 * k) * (0.75 + 0.25 * sin(uTime * 3.0 + aDelay * 60.0));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uHot;
      uniform float uOpacity;
      varying float vK, vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float a = vA * uOpacity * (1.0 - smoothstep(0.32, 0.5, r));
        gl_FragColor = vec4(mix(uColor, uHot, vK * 0.8), a);
      }`,
  });
}

// The portrait: grows out from its mouth (uR), fades at its own edges.
function photoMaterial(map) {
  const m = new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
  m.userData.u = { uR: { value: 0 }, uMouth: { value: new Vector2(SMILE.u, 1 - SMILE.v) }, uAspect: { value: SMILE.aspect }, uOpacity: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vUv0;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvUv0 = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vUv0;\nuniform float uR, uAspect, uOpacity;\nuniform vec2 uMouth;')
      .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>
        float dm = length((vUv0 - uMouth) * vec2(uAspect, 1.0));
        float grow = 1.0 - smoothstep(uR - 0.09, uR, dm);
        vec2 e = smoothstep(vec2(0.0), vec2(0.12, 0.08), vUv0) * smoothstep(vec2(0.0), vec2(0.12, 0.1), 1.0 - vUv0);
        diffuseColor.a *= grow * e.x * e.y * uOpacity;`);
  };
  return m;
}

// A dark studio with a few soft strip lights: what the clear plastic reflects
// (crisp streaks instead of a bright room, so it reads as glass, not milk).
function studioScene() {
  const s = new Scene();
  s.background = new Color(0x020202);
  const strip = (w, h, x, y, z, k, col = 0xffffff) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(col).multiplyScalar(k), side: DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  strip(10, 2.4, -2, 8, 6, 5);                  // overhead softbox, in front, a little left
  strip(1.4, 11, -8, 0.5, 3, 3.2);              // tall strip, left
  strip(1.0, 11, 8, 0.5, -3, 4.2, 0xffe6cf);    // rim strip, right and behind (warm)
  strip(14, 1.2, 0, -7, 5, 0.7, 0xff8a4a);      // a low ember bounce
  return s;
}

// ---------- printed parts ----------
function canvasTexture(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function lidPrint(ctx, w, h) {
  ctx.fillStyle = '#d9cfbd'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(18,16,14,0.10)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += w / 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += w / 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = '#ff5a1f'; ctx.lineWidth = w * 0.004;
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.34, h * 0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.78 - h * 0.28, h * 0.34); ctx.lineTo(w * 0.78 + h * 0.28, h * 0.34);
  ctx.moveTo(w * 0.78, h * 0.06); ctx.lineTo(w * 0.78, h * 0.62); ctx.stroke();
  ctx.fillStyle = '#12100e';
  ctx.font = `800 ${Math.round(h * 0.2)}px "Host Grotesk", Arial, sans-serif`;
  ctx.fillText('AIX', w * 0.07, h * 0.42);
  ctx.fillStyle = '#ff5a1f';
  ctx.fillText('SMILE', w * 0.07, h * 0.64);
  ctx.fillStyle = '#12100e';
  ctx.font = `500 ${Math.round(h * 0.045)}px "Martian Mono", monospace`;
  ctx.fillText('ALIGNER · AACHEN', w * 0.07, h * 0.86);
}
function labelPrint(ctx, w, h) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#12100e';
  ctx.font = `500 ${Math.round(h * 0.09)}px "Martian Mono", monospace`;
  ctx.fillText('AN / TO', w * 0.07, h * 0.2);
  ctx.font = `700 ${Math.round(h * 0.2)}px "Host Grotesk", Arial, sans-serif`;
  ctx.fillText('Ihr Lächeln', w * 0.07, h * 0.45);
  ctx.font = `500 ${Math.round(h * 0.075)}px "Martian Mono", monospace`;
  ctx.fillText('VON: AIXSMILE, GROSSKÖLNSTR. 22-28', w * 0.07, h * 0.64);
  ctx.fillText('52062 AACHEN', w * 0.07, h * 0.75);
  for (let i = 0; i < 46; i++) ctx.fillRect(w * 0.07 + i * (w * 0.86 / 46), h * 0.82, (i % 3 === 0 ? 2.2 : 1) * (w / 400), h * 0.12);
}
// the door's paint: two panels with mouldings, soft grain (mapped in mm: 1 px = 1 mm)
function doorPaint(ctx, w, h) {
  ctx.fillStyle = '#10251c'; ctx.fillRect(0, 0, w, h);          // bottle green (the lights lift it ~3×)
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 20 + Math.random() * 120);
  }
  const panel = (x, y, pw, ph) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 10; ctx.strokeRect(x, y, pw, ph);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; ctx.strokeRect(x + 7, y + 7, pw - 14, ph - 14);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(x + 22, y + 22, pw - 44, ph - 44);
  };
  panel(w * 0.12, h * 0.04, w * 0.76, h * 0.32);
  panel(w * 0.12, h * 0.62, w * 0.76, h * 0.34);
}
function flapPrint(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#d8b77a'); g.addColorStop(0.5, '#b58d52'); g.addColorStop(1, '#8a6a3c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(60,40,15,0.75)';
  ctx.font = `600 ${Math.round(h * 0.42)}px "Martian Mono", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('B R I E F E', w / 2, h * 0.54);
}

// ---------- build ----------
export async function createStage(canvas, { base = 'assets/models/', photo = 'assets/photos/smile.webp', lowPower = false } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: !lowPower, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let pixelRatio = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.6);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
  scene.environment = room;
  const studio = pmrem.fromScene(studioScene(), 0.01).texture;   // the hero's tray only (same size: no new shader)
  pmrem.dispose();
  const key = new DirectionalLight(0xffc29a, 2.2); key.position.set(-120, -60, 140); scene.add(key);
  const rim = new DirectionalLight(0xdfe8ff, 1.6); rim.position.set(140, 160, -60); scene.add(rim);
  scene.add(new HemisphereLight(0xf4efe6, 0x1a1410, 0.5));

  const camera = new PerspectiveCamera(24, 1, 10, 6000);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const load = (f) => loader.loadAsync(base + f);
  const [gParts, gL, gScan, photoTex] = await Promise.all([
    load('aligner-upper-parts.glb'), load('aligner-lower.glb'), load('scan-upper.glb'),
    new TextureLoader().loadAsync(photo).catch(() => null),
  ]);
  if (photoTex) photoTex.colorSpace = SRGBColorSpace;
  // quantized files keep their scale on the node and their positions as
  // normalized int16: copy to floats, then bake the node transform (mm)
  const bake = (m) => {
    const g = m.geometry, a = g.attributes.position, f = new Float32Array(a.count * 3);
    for (let i = 0; i < a.count; i++) { f[i * 3] = a.getX(i); f[i * 3 + 1] = a.getY(i); f[i * 3 + 2] = a.getZ(i); }
    g.setAttribute('position', new BufferAttribute(f, 3));
    g.deleteAttribute('normal');
    m.updateWorldMatrix(true, false);
    g.applyMatrix4(m.matrixWorld);
    g.computeVertexNormals();
    return g;
  };
  const meshes = (g) => { const list = []; g.scene.traverse((o) => { if (o.isMesh) list.push(o); }); return list; };
  const byName = (g, n) => meshes(g).find((o) => o.name === n || o.parent?.name === n);

  // the upper tray (stored as one cap per tooth; drawn as one tray)
  const capGeos = meshes(gParts).map(bake);
  const trayBox = new Box3();
  capGeos.forEach((g) => { g.computeBoundingBox(); trayBox.union(g.boundingBox); });
  const center = trayBox.getCenter(new Vector3());
  const yMin = trayBox.min.y, yMax = trayBox.max.y, zMax = trayBox.max.z;
  const geoL = bake(meshes(gL)[0]);
  // the tray's outline seen at the hero's turn (mm, about its centre), so it fits its box exactly
  const heroFit = (() => {
    const q = new Quaternion().setFromEuler(new Euler(HERO_TURN.rx, HERO_TURN.ry, HERO_TURN.rz, 'XYZ'));
    const v = new Vector3();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const g of capGeos) {
      const a = g.attributes.position;
      for (let i = 0; i < a.count; i += 5) {
        v.fromBufferAttribute(a, i).sub(center).applyQuaternion(q);
        x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      }
    }
    return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  })();

  // ---- the hero's backdrop: drawn into a texture the tray also looks through
  const backCanvas = document.createElement('canvas');
  const backTex = new CanvasTexture(backCanvas);
  backTex.colorSpace = SRGBColorSpace;
  const backdrop = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: backTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  backdrop.position.z = BACK_Z;
  backdrop.renderOrder = 0;
  scene.add(backdrop);

  const shared = {
    uBack: { value: backTex }, uPlaneZ: { value: BACK_Z }, uPlaneSize: { value: new Vector2(1, 1) }, uPlaneOff: { value: new Vector2() },
    uRes: { value: new Vector2(1, 1) }, uInk: { value: INK }, uCream: { value: CREAM }, uGlintX: { value: 0 }, uGlintOn: { value: 0 },
  };
  const trayUniforms = (glass) => ({
    ...shared,
    uFade: { value: 1 }, uFormOn: { value: 0 }, uFormY: { value: 0 }, uGlow: { value: 1 }, uInner: { value: 0 },
    uBoost: { value: 0 }, uClick: { value: 0 }, uGlass: glass || { value: 0 }, uSignal: { value: SIGNAL }, uWarm: { value: WARM },
  });
  function tray(geometries, uniforms) {
    const g = new Group();
    const inner = clearMaterial(BackSide, { ...uniforms, uInner: { value: 1 }, uGlass: { value: 0 } });
    const outer = clearMaterial(FrontSide, uniforms);
    for (const geo of geometries) {
      const a = new Mesh(geo, inner), b = new Mesh(geo, outer);
      a.renderOrder = 5; b.renderOrder = 6;
      g.add(a, b);
    }
    return g;
  }

  // the product: everything on the upper arch, centred on the tray
  const prod = new Group();
  scene.add(prod);
  const lab = new Group();
  lab.position.copy(center).multiplyScalar(-1);
  prod.add(lab);
  const glass = { value: 0 };
  const uU = trayUniforms(glass);
  const alignerU = tray(capGeos, uU);
  lab.add(alignerU);

  // the scan model in plaster, and the same teeth in enamel
  const plasterU = { uCut: { value: 0 }, uCutDir: { value: 1 }, uOn: { value: 0 }, uDim: { value: 0 }, uTop: { value: 1e5 }, uSignal: { value: SIGNAL } };
  const enamelU = { uCut: { value: 0 }, uCutDir: { value: 1 }, uOn: { value: 0 }, uDim: { value: 0 }, uTop: { value: yMax + 0.4 }, uSignal: { value: SIGNAL } };
  const teethMesh = byName(gScan, 'teeth'), gumMesh = byName(gScan, 'gum');
  bake(teethMesh); bake(gumMesh);
  const model = new Group();
  for (const [m, col] of [[teethMesh, 0x9d927f], [gumMesh, 0x7d705c]]) {
    const mm = new Mesh(m.geometry, solidMaterial('plaster', col, plasterU));
    mm.renderOrder = 1;
    model.add(mm);
  }
  lab.add(model);
  const sBox = new Box3().setFromObject(model);
  const enamelMat = solidMaterial('enamel', 0xf1ece2, enamelU);
  const enamel = new Mesh(teethMesh.geometry, enamelMat);
  enamel.renderOrder = 1;
  enamel.visible = false;
  lab.add(enamel);

  // points sampled on the scan
  const pts = (() => {
    const counts = [[teethMesh, lowPower ? 4200 : 7500], [gumMesh, lowPower ? 3800 : 7000]];
    const total = counts.reduce((sum, c) => sum + c[1], 0);
    const pos = new Float32Array(total * 3), from = new Float32Array(total * 3), delay = new Float32Array(total);
    const v = new Vector3(), dir = new Vector3();
    let i = 0;
    for (const [m, count] of counts) {
      const sampler = new MeshSurfaceSampler(new Mesh(m.geometry)).build();
      for (let k = 0; k < count; k++, i++) {
        sampler.sample(v);
        pos.set([v.x, v.y, v.z], i * 3);
        dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(18 + Math.random() * 55);
        from.set([v.x + dir.x, v.y + dir.y, v.z + dir.z], i * 3);
        delay[i] = clamp01((center.z + 30 - v.z) / 75) * 0.55 + Math.random() * 0.1;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aFrom', new BufferAttribute(from, 3));
    g.setAttribute('aDelay', new BufferAttribute(delay, 1));
    const p = new Points(g, pointsMaterial());
    p.frustumCulled = false;
    p.renderOrder = 8;
    return p;
  })();
  lab.add(pts);

  // the lower tray (it goes into the box too)
  geoL.computeBoundingBox();
  const centerL = geoL.boundingBox.getCenter(new Vector3());
  const lowerPivot = new Group();
  const uL = trayUniforms();
  const alignerL = tray([geoL], uL);
  alignerL.position.copy(centerL).multiplyScalar(-1);
  lowerPivot.add(alignerL);
  scene.add(lowerPivot);

  await (document.fonts ? document.fonts.ready : Promise.resolve());

  // ---- the mailer
  const cardboard = new MeshStandardMaterial({ color: 0xc9bea9, roughness: 0.92, metalness: 0 });
  const cardboardIn = new MeshStandardMaterial({ color: 0xa99d88, roughness: 0.95, metalness: 0 });
  const box = new Group();
  const { w, d, h, wall } = BOX;
  const add = (g, mat, x, y, z, parent = box) => { const m = new Mesh(g, mat); m.position.set(x, y, z); parent.add(m); return m; };
  add(new BoxGeometry(w, wall, d), cardboard, 0, -h / 2 + wall / 2, 0);
  add(new BoxGeometry(w, h, wall), [cardboard, cardboard, cardboard, cardboard, cardboard, cardboardIn], 0, 0, d / 2 - wall / 2);
  add(new BoxGeometry(w, h, wall), [cardboard, cardboard, cardboard, cardboard, cardboardIn, cardboard], 0, 0, -d / 2 + wall / 2);
  add(new BoxGeometry(wall, h, d), cardboard, w / 2 - wall / 2, 0, 0);
  add(new BoxGeometry(wall, h, d), cardboard, -w / 2 + wall / 2, 0, 0);
  add(new BoxGeometry(w - wall * 2, 0.6, d - wall * 2), cardboardIn, 0, -h / 2 + wall + 0.3, 0);
  const lidHinge = new Group();
  lidHinge.position.set(0, h / 2, -d / 2);
  box.add(lidHinge);
  const top = new MeshStandardMaterial({ map: canvasTexture(lidPrint, 1024, 750), roughness: 0.88, metalness: 0 });
  add(new BoxGeometry(w + 0.6, wall, d + 0.6), [cardboard, cardboard, top, cardboardIn, cardboard, cardboard], 0, wall / 2, d / 2 + 0.3, lidHinge);
  const label = new Mesh(new PlaneGeometry(34, 20), new MeshStandardMaterial({ map: canvasTexture(labelPrint, 640, 380), roughness: 0.7, transparent: true }));
  label.rotation.set(-Math.PI / 2, 0, 0.06);
  label.position.set(w * 0.26, wall + 0.08, d * 0.76);
  lidHinge.add(label);
  box.visible = false;
  scene.add(box);

  // ---- the front door with its letterbox (seen from inside the house)
  const door = new Group();
  const doorShape = new Shape();
  doorShape.moveTo(-DOOR.w / 2, -DOOR.h / 2); doorShape.lineTo(DOOR.w / 2, -DOOR.h / 2);
  doorShape.lineTo(DOOR.w / 2, DOOR.h / 2); doorShape.lineTo(-DOOR.w / 2, DOOR.h / 2); doorShape.closePath();
  const slotPath = new Path();
  slotPath.moveTo(-SLOT.w / 2, -SLOT.h / 2); slotPath.lineTo(-SLOT.w / 2, SLOT.h / 2);
  slotPath.lineTo(SLOT.w / 2, SLOT.h / 2); slotPath.lineTo(SLOT.w / 2, -SLOT.h / 2); slotPath.closePath();
  doorShape.holes.push(slotPath);
  const paint = canvasTexture(doorPaint, 1100, 820);
  paint.wrapS = paint.wrapT = RepeatWrapping;
  paint.repeat.set(1 / DOOR.w, 1 / DOOR.h);
  paint.offset.set(0.5, 0.5);
  const doorMat = new MeshStandardMaterial({ map: paint, roughness: 0.72, metalness: 0, envMapIntensity: 0.2 });
  const doorMesh = new Mesh(new ExtrudeGeometry(doorShape, { depth: DOOR.depth, bevelEnabled: false }), doorMat);
  door.add(doorMesh);
  // the brass plate around the slot, and the flap (hinged at the top, swings in)
  const brass = new MeshStandardMaterial({ color: 0xc19a5b, metalness: 1, roughness: 0.32 });
  const plateShape = new Shape();
  plateShape.moveTo(-150, -34); plateShape.lineTo(150, -34); plateShape.lineTo(150, 34); plateShape.lineTo(-150, 34); plateShape.closePath();
  const plateHole = new Path();
  plateHole.moveTo(-SLOT.w / 2, -SLOT.h / 2); plateHole.lineTo(-SLOT.w / 2, SLOT.h / 2);
  plateHole.lineTo(SLOT.w / 2, SLOT.h / 2); plateHole.lineTo(SLOT.w / 2, -SLOT.h / 2); plateHole.closePath();
  plateShape.holes.push(plateHole);
  const plate = new Mesh(new ExtrudeGeometry(plateShape, { depth: 4, bevelEnabled: true, bevelSize: 1.5, bevelThickness: 1.5, bevelSegments: 2 }), brass);
  plate.position.z = DOOR.depth;
  door.add(plate);
  const flapHinge = new Group();
  flapHinge.position.set(0, SLOT.h / 2 + 1, DOOR.depth + 6.5);
  const flapMat = new MeshStandardMaterial({ map: canvasTexture(flapPrint, 512, 80), metalness: 0.85, roughness: 0.35 });
  const flap = new Mesh(new BoxGeometry(SLOT.w + 6, SLOT.h + 4, 2), [brass, brass, brass, brass, flapMat, brass]);
  flap.position.set(0, -(SLOT.h + 4) / 2, 0);
  flapHinge.add(flap);
  door.add(flapHinge);
  door.visible = false;
  scene.add(door);

  // ---- the portrait for the ending
  const photoMat = photoTex ? photoMaterial(photoTex) : null;
  const photoPlane = new Mesh(new PlaneGeometry(SMILE.aspect, 1), photoMat || new MeshBasicMaterial({ visible: false }));
  photoPlane.renderOrder = 0;
  photoPlane.visible = false;
  scene.add(photoPlane);

  // ---------- layout ----------
  let W = 1, H = 1, frameH = 150, frameW = 240, portrait = false, camZ = 1;
  let backIn = 0, backStart = null;
  // where the product rests in the hero (frame units: -1..1 across the view,
  // and its scale): it fills the box the page hands over (place()), by its
  // real outline at the hero's turn (heroFit).
  let heroBox = null, heroScroll = 0;                            // heroScroll: the hero's height (px; 0 = the view's), P 0 → 1 over it
  function heroAt(n) {
    if (!heroBox) return n ? { x: 0, y: -0.07, s: 1.5 } : { x: 0.4, y: -0.02, s: 1.7 };
    const { left, top, width, height } = heroBox;
    const mm = H / frameH;                                       // px per mm at the product's depth
    const s = Math.max(0.3, Math.min(width / (heroFit.w * 1.14 * mm), height / (heroFit.h * 1.14 * mm)));
    return {
      x: ((left + width / 2) / W) * 2 - 1 - heroFit.cx * s / (frameW / 2),
      y: 1 - ((top + height / 2) / H) * 2 - heroFit.cy * s / (frameH / 2),
      s,
    };
  }
  // the light behind the product: a soft pool on the back wall with a faint
  // measuring grid in it. Drawn where the tray rests (HERO); the tray bends it.
  function drawBackdrop() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.min(2048, Math.round(W * dpr)), ch = Math.round(cw * H / W);
    backCanvas.width = cw; backCanvas.height = ch;
    const ctx = backCanvas.getContext('2d');
    const k = cw / W;
    const at = heroAt(W / H < 0.85);
    const cx = heroBox && !centred ? (heroBox.left + heroBox.width / 2) * k : (0.5 + (centred ? 0 : at.x) / 2) * W * k;
    const cy = heroBox ? (heroBox.top + heroBox.height / 2) * k : (0.5 - at.y / 2) * H * k;
    const R = (heroBox ? Math.max(heroBox.width * 0.66, heroBox.height * 0.8) : W / H < 0.85 ? 0.75 * W : 0.5 * H) * k;
    ctx.clearRect(0, 0, cw, ch);
    // the grid, then masked by the pool
    const cell = Math.max(18, Math.round(H * 0.034)) * k;
    ctx.lineWidth = Math.max(1, k);
    for (let i = -40; i <= 40; i++) {
      const major = i % 5 === 0;
      ctx.strokeStyle = major ? 'rgba(235,229,217,0.4)' : 'rgba(235,229,217,0.2)';
      const x = Math.round(cx + i * cell) + 0.5, y = Math.round(cy + i * cell) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'destination-in';
    let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.55, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    // the light itself, under the grid
    ctx.globalCompositeOperation = 'destination-over';
    g = ctx.createRadialGradient(cx, cy + R * 0.08, 0, cx, cy + R * 0.08, R);
    g.addColorStop(0, 'rgba(244,238,228,0.36)'); g.addColorStop(0.32, 'rgba(232,222,206,0.2)');
    g.addColorStop(0.66, 'rgba(210,190,170,0.07)'); g.addColorStop(1, 'rgba(200,180,160,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'source-over';
    backTex.needsUpdate = true;
  }
  function resize(width, height) {
    W = width; H = height;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    portrait = W / H < 0.85;
    frameH = Math.max(150, 120 / camera.aspect);   // ~150 mm of height in view, or 120 mm of width on phones
    frameW = frameH * camera.aspect;
    camZ = frameH / 2 / Math.tan(MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, camZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    pts.material.uniforms.uScale.value = H / (2 * Math.tan(MathUtils.degToRad(camera.fov / 2))) * pixelRatio;
    // the backdrop fills the view at its depth
    const sc = (camZ - BACK_Z) / camZ;
    backdrop.scale.set(frameW * sc, frameH * sc, 1);
    shared.uPlaneSize.value.set(frameW * sc, frameH * sc);
    shared.uRes.value.set(W * pixelRatio, H * pixelRatio);
    drawBackdrop();
  }
  const fx = (k) => k * frameW / 2;
  const fy = (k) => k * frameH / 2;

  // ---------- state ----------
  let P = 0, mx = 0, my = 0, smx = 0, smy = 0, centred = false;
  const tmpE = new Euler(), tmpV = new Vector3(), tmpA = new Vector3(), tmpB = new Vector3(), tmpQ = new Quaternion();
  const inBoxPos = new Vector3(), inBoxQ = new Quaternion(), lowerPos = new Vector3(), lowerQ = new Quaternion();
  const finalPos = new Vector3(), finalQ = new Quaternion(), turnZ = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI);
  const idQ = new Quaternion();
  let inS = 0.41;
  const out = { smile: 0 };

  // the box's pose for the current P (chapter 2: rise, fill, close, the door;
  // chapter 3: lands in front of us and opens)
  function boxPose(n) {
    const b = P - 2, a = P - 3;
    const bs = n ? 0.66 : 0.74;
    const k = n ? 0.4 : 0.5;                                     // the door's scale; the box shrinks to it
    const rise = easeOut(seg(b, 0.02, 0.12));
    const home = { x: fx(n || centred ? 0 : 0.22), y: fy(n ? -0.3 : -0.24) };
    // chapter 2: on the table, then away behind the door, through the slot, down
    const away = ease(seg(b, 0.5, 0.6)), through = seg(b, 0.66, 0.8), fall = easeIn(seg(b, 0.8, 0.9));
    const slotX = fx(n || centred ? 0 : 0.3), slotY = fy(n ? 0.05 : 0.08);
    const doorZ = -40;
    const behind = doorZ - 60 * k, past = doorZ + (DOOR.depth + 70) * k;
    let x = home.x, y = fy(n ? -0.3 : -0.24) - (1 - rise) * frameH, z = 0, s = bs;
    let rx = 0.62 + track(b, [[0.42, 0], [0.5, -0.08]]), ry = track(b, [[0, -0.35], [0.42, -0.2], [0.5, 0.15]]), rz = 0;
    if (P < 3) {
      x = lerp(x, slotX, away); y = lerp(y, slotY, away); z = lerp(0, behind, away); s = lerp(bs, k, away);
      rx = lerp(rx, 0, away); ry = lerp(ry, 0, away);
      z = lerp(z, past, through);
      rx += fall * 1.3; y -= fall * frameH * 0.9; z += fall * 30;
    } else {
      // chapter 3: it lands from above, in front of us, and opens
      const land = easeOut(seg(a, 0.0, 0.14));
      x = home.x; z = 0; s = bs;
      y = lerp(home.y + frameH, home.y, land) + Math.sin(seg(a, 0.1, 0.16) * Math.PI) * 4;
      rx = 0.74; ry = -0.2;
      const leave = easeIn(seg(a, 0.36, 0.6));
      x = lerp(x, n || centred ? 0 : fx(0.32), ease(seg(a, 0.14, 0.24)));
      y -= leave * frameH * 1.2;
    }
    box.scale.setScalar(s);
    box.position.set(x, y, z);
    box.rotation.set(rx, ry, rz);
    // the lid: open while the trays go in, shut for the post, open again on arrival
    lidHinge.rotation.x = -MathUtils.degToRad(P < 3 ? track(b, [[0, 112], [0.3, 112], [0.42, 0]]) : track(a, [[0.12, 0], [0.24, 108]]));
    box.updateMatrixWorld();
    return s;
  }

  function apply(time) {
    smx += (mx - smx) * 0.06; smy += (my - smy) * 0.06;
    const t = time;
    if (backStart !== null) backIn = easeOut(clamp01((t - backStart) / 1.2));
    const n = portrait;

    // ---- product pose (frame units, scale, euler 'XYZ'), keyed on P
    // hero (P < 1): the product shot sits in its box and scrolls away with the page;
    // from P = 1 the method's tracks take over (the tray is gone by then, the scan arrives)
    const scrolled = Math.min(P, 1) * (heroScroll || H) / H * 2;          // frame units the page has moved up
    let px, py, s, rx, ry, rz;
    if (P < 1) {
      const at = heroAt(n);
      px = centred ? 0 : at.x; py = at.y + scrolled; s = at.s;
      rx = HERO_TURN.rx; ry = HERO_TURN.ry; rz = HERO_TURN.rz;
      ry += Math.sin(t * 0.42) * 0.1 + smx * 0.26;
      rx += smy * 0.12 + Math.sin(t * 0.6) * 0.03;
      py += Math.sin(t * 0.9) * 0.008;
    } else {
      px = track(P, [[1, 0], [1.12, n ? 0 : 0.22], [1.86, n ? 0 : 0.22], [2, n ? 0 : 0.2]]);
      py = track(P, [[1, 0], [1.12, n ? -0.12 : -0.04], [1.86, n ? -0.12 : -0.04], [2, n ? -0.02 : 0.36]]);
      s = track(P, [[1, n ? 1.05 : 1.3], [1.12, n ? 1.12 : 1.42], [1.86, n ? 1.12 : 1.42], [2, 0.82]]);
      rz = track(P, [[1, 0], [1.12, Math.PI], [1.86, Math.PI], [1.99, 0]]);
      rx = track(P, [[1, -0.62], [1.12, 0.38], [1.86, 0.38], [1.99, -1.0], [2.1, -1.25]]);
      ry = track(P, [[1, 0.1], [1.12, -0.35], [1.86, 0.35], [1.99, 0]]);
      if (centred) px = 0;
    }
    tmpE.set(rx, ry, rz, 'XYZ');
    prod.quaternion.setFromEuler(tmpE);
    prod.scale.setScalar(s);
    prod.position.set(fx(px), fy(py) - (1 - backIn) * 6, 0);

    // ---- 0: the product shot: the light behind it scrolls away with it
    const inHero = P < 1;
    backdrop.visible = inHero;
    backdrop.material.opacity = backIn;
    backdrop.position.set(-smx * 5, smy * 3 - (1 - backIn) * 8 + fy(scrolled) * (camZ - BACK_Z) / camZ, BACK_Z);
    shared.uPlaneOff.value.set(backdrop.position.x, backdrop.position.y);
    glass.value = inHero ? 1 : 0;
    const env = inHero ? studio : room;
    for (const o of alignerU.children) if (o.material.envMap !== env) o.material.envMap = env;
    shared.uGlintOn.value = inHero ? 1 - seg(P, 0.3, 0.8) : 0;
    shared.uGlintX.value = center.x + smx * 36 + Math.sin(t * 0.35) * 6;

    // ---- 1: the method: points → plaster → formed tray → model away
    const m = P - 1;
    const inMethod = P > 0.98 && P < 2.02;
    const ptsIn = seg(m, 0.06, 0.36), ptsOut = seg(m, 0.3, 0.5);
    pts.visible = inMethod && ptsIn > 0.001 && ptsOut < 0.999;
    pts.material.uniforms.uT.value = ptsIn;
    pts.material.uniforms.uOpacity.value = (1 - ptsOut) * Math.min(1, ptsIn * 4);
    pts.material.uniforms.uTime.value = t;
    const solidIn = seg(m, 0.3, 0.5), solidOut = seg(m, 0.74, 0.86);
    const zF = sBox.max.z + 1, zB = sBox.min.z - 1;
    if (solidOut > 0) { plasterU.uCutDir.value = -1; plasterU.uCut.value = lerp(zF, zB, ease(solidOut)); plasterU.uOn.value = solidOut < 1 ? 1 : 0; }
    else { plasterU.uCutDir.value = 1; plasterU.uCut.value = lerp(zF, zB, ease(solidIn)); plasterU.uOn.value = solidIn > 0 && solidIn < 1 ? 1 : 0; }
    model.visible = inMethod && solidIn > 0.001 && solidOut < 0.999;
    const formK = seg(m, 0.5, 0.74);
    let fade = 1;
    // the hero's tray has scrolled away: the method's tray only exists once it is formed
    if (P >= 1 && P <= 1.75) { fade = m < 0.5 ? 0 : 1; uU.uFormOn.value = m < 0.5 ? 0 : 1; } else uU.uFormOn.value = 0;
    uU.uFormY.value = lerp(yMin - 0.5, yMax + 1, easeOut(formK));
    const boostMethod = inMethod ? seg(m, 0.48, 0.55) * (1 - seg(m, 0.8, 0.9)) : 0;
    plasterU.uDim.value = boostMethod;

    // ---- 2 + 3: the box (and the door)
    box.visible = P > 2.02 && P < 3.62;
    const b = P - 2;
    const closed = P > 2.42 && P < 3.14;                         // lid shut: the trays inside are hidden
    if (box.visible) {
      const bs = boxPose(n);
      const lk = easeOut(seg(b, 0.42, 0.5));
      label.visible = P > 2.42;
      label.position.y = wall + 0.08 + (P < 3 ? (1 - lk) * 40 : 0);
      label.material.opacity = P < 3 ? lk : 1;
      box.getWorldQuaternion(tmpQ);
      inBoxPos.set(-w * 0.22, -h / 2 + 5, 4).applyMatrix4(box.matrixWorld);
      inBoxQ.copy(tmpQ);
      lowerPos.set(w * 0.22, -h / 2 + 5, 4).applyMatrix4(box.matrixWorld);
      lowerQ.copy(tmpQ).multiply(turnZ);
      inS = 0.56 * bs;
    }
    lowerPivot.visible = box.visible && !closed && P > 2.06;
    if (lowerPivot.visible) {
      if (P < 3) {
        const into = ease(seg(b, 0.1, 0.3));
        tmpE.set(0.9, 0.4, 0, 'XYZ');
        lowerPivot.position.set(fx(n ? 0.62 : 0.5), fy(n ? -0.05 : 0.42), 20).lerp(lowerPos, into);
        lowerPivot.quaternion.setFromEuler(tmpE).slerp(lowerQ, into);
        lowerPivot.scale.setScalar(lerp(0.8, inS, into));
        uL.uFade.value = Math.min(1, seg(b, 0.06, 0.14) * 1.2);
      } else {
        lowerPivot.position.copy(lowerPos); lowerPivot.quaternion.copy(lowerQ); lowerPivot.scale.setScalar(inS);
      }
    }
    if (P >= 2 && P < 3) {
      const into = ease(seg(b, 0.1, 0.3));
      prod.position.lerp(inBoxPos, into);
      prod.quaternion.slerp(inBoxQ, into);
      prod.scale.setScalar(lerp(prod.scale.x, inS, into));
    }
    // the door: slides in from the right while the box goes behind it, the flap swings
    door.visible = P > 2.48 && P < 3.2;
    if (door.visible) {
      const k = n ? 0.4 : 0.5;
      const inK = easeOut(seg(b, 0.5, 0.62));
      const leave = P >= 3 ? easeIn(seg(P - 3, 0.0, 0.16)) : 0;
      door.scale.setScalar(k);
      door.position.set(fx(n || centred ? 0 : 0.3) + (1 - inK) * frameW * 1.4, fy(n ? 0.05 : 0.08) + leave * frameH * 1.4, -40);
      door.rotation.set(0, 0, 0);
      // the flap: pushed open by the box, then swings shut with a little bounce
      const push = seg(b, 0.68, 0.76), swing = seg(b, 0.83, 1.0);
      const openA = 1.15 * ease(push) * (1 - ease(seg(b, 0.8, 0.83)));
      const bounce = b > 0.83 ? 0.55 * Math.exp(-5 * swing) * Math.cos(swing * 16) * (1 - swing) : 0;
      flapHinge.rotation.x = -(b < 0.83 ? openA : Math.max(0, bounce));
    }

    // ---- 3: arrival. Aligner 01 lifts out, the teeth appear, it clicks on, then the smile
    const a = P - 3;
    const arrive = P >= 3;
    const lift = ease(seg(a, 0.24, 0.44));
    const snap = seg(a, 0.52, 0.64);
    const smile = seg(a, 0.72, 0.8), pull = ease(seg(a, 0.8, 0.97));
    out.smile = smile;
    if (arrive) {
      finalPos.set(fx(n || centred ? 0 : 0.27), fy(n ? -0.06 : -0.02), 0);
      tmpE.set(-0.14, lerp(-0.3, 0, ease(seg(a, 0.64, 0.74))), 0, 'XYZ');
      finalQ.setFromEuler(tmpE);
      prod.position.copy(inBoxPos).lerp(finalPos, lift);
      prod.position.y += Math.sin(lift * Math.PI) * 14;
      prod.quaternion.copy(inBoxQ).slerp(finalQ, lift);
      prod.scale.setScalar(lerp(inS, n ? 1.45 : 1.72, lift));
    }
    prod.visible = !(P > 2.42 && P < 3.14) && !(arrive && smile >= 1);
    // the teeth: revealed behind a seam while 01 waits in front of them
    const tIn = seg(a, 0.44, 0.54);
    enamel.visible = arrive && tIn > 0.001;
    enamelU.uCutDir.value = 1;
    enamelU.uCut.value = lerp(sBox.max.z + 1, sBox.min.z - 1, ease(tIn));
    enamelU.uOn.value = tIn > 0 && tIn < 1 ? 1 : 0;
    alignerU.position.set(0, 0, arrive ? lift * (1 - snap * snap * snap) * 26 : 0);
    uU.uClick.value = arrive ? Math.max(0, 1 - Math.abs(a - 0.65) / 0.05) : 0;
    uU.uBoost.value = inMethod ? boostMethod : arrive ? 0.55 * snap : 0;
    // as the portrait takes over, the 3D teeth and tray fade
    const take = arrive ? Math.min(1, smile * 1.6) : 0;
    uU.uFade.value = fade * (1 - take) * backIn;
    enamelMat.opacity = 1 - take;

    // the portrait: its teeth on the 3D teeth, then the view pulls back to the face
    photoPlane.visible = !!photoMat && arrive && a > 0.7;
    if (photoPlane.visible) {
      prod.updateMatrixWorld(true);
      // the 3D incisors' centre on screen, and their visible width (canine to canine ≈ the photo's span)
      tmpA.set(center.x, (yMin + yMax) / 2 + 6, zMax - 1).applyMatrix4(lab.matrixWorld);
      const zp = -12;                                                  // the plane, just behind the teeth
      const r = (camZ - zp) / (camZ - tmpA.z);
      const mouthX = tmpA.x * r, mouthY = tmpA.y * r;
      const teethW = 46 * prod.scale.x * r;                            // the photo's visible span ≈ first premolar to first premolar, mm
      const startH = teethW / SMILE.span / SMILE.aspect;               // plane height so the spans match
      const endH = (n ? 0.66 : 0.98) * frameH * (camZ - zp) / camZ;
      const ph = lerp(startH, endH, pull);
      const endX = fx(n || centred ? 0 : 0.27) * (camZ - zp) / camZ, endY = fy(n ? -0.22 : 0) * (camZ - zp) / camZ;
      // where the mouth sits: on the teeth, then at the face's final place
      const mxW = lerp(mouthX, endX + (SMILE.u - 0.5) * SMILE.aspect * endH, pull);
      const myW = lerp(mouthY, endY + (0.5 - SMILE.v) * endH, pull);
      photoPlane.scale.set(ph, ph, 1);
      photoPlane.position.set(mxW - (SMILE.u - 0.5) * SMILE.aspect * ph, myW - (0.5 - SMILE.v) * ph, zp);
      photoMat.userData.u.uOpacity.value = Math.min(1, smile * 1.6);
      photoMat.userData.u.uR.value = lerp(0.08, 0.25, ease(smile)) + pull * 1.2;
      // the teeth follow the portrait's scale while they fade
      if (pull > 0) prod.scale.multiplyScalar(lerp(1, endH / startH, pull));
    }
  }

  function render(time) {
    if (backStart === null && heroRequested) backStart = time;
    apply(time);
    renderer.render(scene, camera);
  }
  let heroRequested = false;

  /** compile every shader once (everything visible), so scrolling never stalls */
  function warm() {
    box.visible = true; model.visible = true; pts.visible = true; lowerPivot.visible = true; enamel.visible = true; door.visible = true;
    photoPlane.visible = !!photoMat; backdrop.visible = true;
    renderer.compile(scene, camera);
  }

  return {
    resize,
    set(p) { P = p; },
    pointer(x, y) { mx = x; my = y; },
    render,
    warm,
    /** the light comes on and the product comes up (call once the opening is out of the way) */
    heroIn() { heroRequested = true; },
    /** the box (viewport px, page at the top) the hero product should fill, and the hero's height; null = defaults */
    place(rect, scroll) { heroBox = rect && rect.width > 40 && rect.height > 40 ? rect : null; heroScroll = scroll || 0; drawBackdrop(); },
    labels: () => out,
    /** for still pictures: the object in the middle of the frame, the light on */
    centre(on) { centred = on; heroRequested = true; backStart = -100; drawBackdrop(); },
    setLowPower(on) { pixelRatio = Math.min(window.devicePixelRatio || 1, on ? 1 : 1.6); resize(W, H); },
    renderer,
  };
}

// the order form's preview lives in the same bundle (one copy of three.js)
export { createViewer, parseScan } from './viewer.js';
