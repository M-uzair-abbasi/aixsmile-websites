// The 3D world of the aligner page (after igloo.inc): glass teeth on a misty
// lilac field, a soft bloom on their rims, and a finishing pass that adds the
// rainbow edges (chromatic aberration) and fog of the dives, a vignette and
// a little grain. In the hero the field is a photo of a woman holding out her
// open palm: the set floats above it, then lifts out while she dissolves into
// the mist. js/site.js calls render() every frame while the world is on screen
// (the set turns in her hand), and stops when it is not.
// Bundled with three.js into js/clear-stage.js by tools/build-3d.mjs.
import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, PMREMGenerator, SRGBColorSpace, NeutralToneMapping,
  Vector2, Vector3, Color, MathUtils, WebGLRenderTarget, HalfFloatType,
  Mesh, PlaneGeometry, ShaderMaterial, TextureLoader,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildClearRig, CROOKED } from './clear-rig.js';
import { sample } from '../clear-timeline.js';

export { CROOKED };

const FOV = 26;
const PAD = [1.28, 2.35];  // air around the landed set, [width, height]
const LOOK_AZ = 9;         // degrees the camera swings at full mouse look
const LOOK_EL = 5;
const POINT_MM = 0.24;     // scan dot diameter in mm

// The backdrop, drawn first behind everything: the misty field (light at the
// top, lilac grey below) and, in the hero, the photo cover-fitted over it. The
// person dissolves into the field in soft clouds (uPerson 1 → 0); a soft
// shadow lies on her palm under the floating set while it is held (uHold).
// Photo coordinates (focus, palm) are in the image's own uv, y from the bottom.
function backdrop() {
  return new ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: {
      tPhoto: { value: null }, uHas: { value: 0 }, uPerson: { value: 1 }, uHold: { value: 1 },
      uView: { value: new Vector2(1, 1) }, uImg: { value: 16 / 9 }, uFocus: { value: new Vector2(0.5, 0.5) },
      uPalm: { value: new Vector2(0.5, 0.4) }, uPalmR: { value: 0.06 },
      uTop: { value: new Color(0xd5d7e1) }, uMid: { value: new Color(0xb7bac9) }, uBot: { value: new Color(0x9a9eb1) },
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tPhoto; uniform float uHas, uPerson, uHold, uImg, uPalmR;
      uniform vec2 uView, uFocus, uPalm; uniform vec3 uTop, uMid, uBot;
      varying vec2 vUv;
      float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p) { return n2(p) * 0.55 + n2(p * 2.3) * 0.3 + n2(p * 5.1) * 0.15; }
      void main() {
        vec3 field = vUv.y > 0.5 ? mix(uMid, uTop, (vUv.y - 0.5) * 2.0) : mix(uBot, uMid, vUv.y * 2.0);
        vec3 col = field;
        if (uHas > 0.5 && uPerson > 0.001) {
          float va = uView.x / uView.y;
          vec2 s = va > uImg ? vec2(1.0, uImg / va) : vec2(va / uImg, 1.0);
          vec2 c = clamp(uFocus, s * 0.5, 1.0 - s * 0.5);
          vec2 uv = c + (vUv - 0.5) * s;
          vec3 photo = texture2D(tPhoto, uv).rgb;
          // the shadow of the floating set on her palm
          vec2 d = (uv - uPalm) * vec2(uImg, 1.0) / vec2(uPalmR * uImg, uPalmR * 0.42);
          photo *= 1.0 - 0.2 * uHold * (1.0 - smoothstep(0.25, 1.0, length(d)));
          // she dissolves into the mist in soft clouds, with a pale rim
          float n = fbm(vUv * vec2(va, 1.0) * 3.4);
          float th = mix(-0.2, 1.2, 1.0 - uPerson);
          float m = smoothstep(th, th + 0.18, n);
          float rim = smoothstep(th - 0.06, th + 0.02, n) * (1.0 - m);
          col = mix(field, photo, m) + vec3(0.06) * rim;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uDive: { value: 0 }, uSnap: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 },
    uFog: { value: new Color(0xeef0f6) },
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uDive, uSnap, uTime, uAspect; uniform vec3 uFog;
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      float r = length(c * vec2(uAspect, 1.0)) / max(1.0, uAspect * 0.5 + 0.5);
      vec2 dir = normalize(c + 1e-5);
      // the dives, and a flick of rainbow edge as a tray clicks on (uSnap)
      float ca = (0.0018 + 0.024 * uDive + 0.007 * uSnap) * smoothstep(0.08, 0.85, r * 1.25);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - dir * ca).r;
      col.g = texture2D(tDiffuse, vUv - dir * ca * 0.35).g;
      col.b = texture2D(tDiffuse, vUv + dir * ca).b;
      // the dive: a white veil, thickest in the middle of the screen
      col = mix(col, uFog, uDive * (0.45 + 0.4 * (1.0 - smoothstep(0.0, 0.75, r))));
      col *= 1.0 - 0.16 * smoothstep(0.4, 1.05, r);
      float g = fract(sin(dot(vUv * (fract(uTime) + 1.0), vec2(12.9898, 78.233))) * 43758.5453);
      col += (g - 0.5) * 0.022;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// hero: { wide, tall } photos, each { url, aspect, focus, float, palm, width }
// in image fractions (x from the left, y from the top): what the crop keeps in
// view, the point where the set floats, the middle of her palm (its shadow),
// and how wide the set is there (fraction of the image width)
export async function createClearStage({ canvas, modelUrl, rich = true, onProgress, hero }) {
  const renderer = new WebGLRenderer({ canvas, antialias: !rich, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new Scene();
  const back = backdrop();
  const backMesh = new Mesh(new PlaneGeometry(2, 2), back);
  backMesh.frustumCulled = false;
  backMesh.renderOrder = -10;
  scene.add(backMesh);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.9;
  const key = new DirectionalLight(0xffffff, 1.7);
  key.position.set(-50, 80, 70);
  const fill = new DirectionalLight(0xdfe4ff, 0.3);
  fill.position.set(80, 0, 40);
  const rim = new DirectionalLight(0xeaf0ff, 0.9);
  rim.position.set(0, 30, -90);
  scene.add(key, fill, rim);

  const camera = new PerspectiveCamera(FOV, 1, 5, 2000);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  // the hero photos load alongside the model
  const photos = {};
  const texLoader = new TextureLoader();
  const photoLoads = hero ? Object.entries(hero).map(([k, h]) => texLoader.loadAsync(h.url).then((t) => {
    t.colorSpace = SRGBColorSpace;
    photos[k] = { ...h, tex: t };
  }).catch(() => null)) : [];
  const [gltf] = await Promise.all([
    loader.loadAsync(modelUrl, (e) => { if (onProgress && e.total) onProgress(e.loaded / e.total); }),
    ...photoLoads,
  ]);
  scene.add(gltf.scene);
  const rig = buildClearRig(gltf.scene, { pointScale: rich ? 1 : 0.6 });

  // post: bloom on the rims (laptops), then the finish
  const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: rich ? 2 : 0 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = rich ? new UnrealBloomPass(new Vector2(256, 256), 0.16, 0.45, 1.0) : null;
  if (bloom) composer.addPass(bloom);
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);
  composer.addPass(new OutputPass());

  const st = sample(0);
  const centre = new Vector3(), dir = new Vector3(), tmp = new Vector3();
  const tanHalf = Math.tan(MathUtils.degToRad(FOV / 2));
  let W = 1, H = 1;
  let photo = null;      // the photo in use for this screen shape
  const held = { x: 0, y: 0, f: 0.2 };  // where the set floats on screen (fractions)

  // pick the photo for this screen shape and work out where her palm lands
  function fitPhoto() {
    const want = W / H < 0.8 ? (photos.tall || photos.wide) : (photos.wide || photos.tall);
    photo = want || null;
    back.uniforms.uHas.value = photo ? 1 : 0;
    back.uniforms.uView.value.set(W, H);
    if (!photo) return;
    const I = photo.aspect, A = W / H;
    const sx = A > I ? 1 : A / I, sy = A > I ? I / A : 1;
    const fx = photo.focus[0], fy = 1 - photo.focus[1];
    const cx = Math.min(1 - sx / 2, Math.max(sx / 2, fx)), cy = Math.min(1 - sy / 2, Math.max(sy / 2, fy));
    back.uniforms.tPhoto.value = photo.tex;
    back.uniforms.uImg.value = I;
    back.uniforms.uFocus.value.set(fx, fy);
    back.uniforms.uPalm.value.set(photo.palm[0], 1 - photo.palm[1]);
    back.uniforms.uPalmR.value = photo.width * 0.5;
    held.x = (photo.float[0] - cx) / sx + 0.5;
    held.y = 1 - ((1 - photo.float[1] - cy) / sy + 0.5);
    held.f = photo.width / sx;
  }

  // k: 1 = the set in her hand (small, above her palm), 0 = the journey's framing
  function place(c, lx, ly, k) {
    const { center, size } = rig.frames.all;
    const fit = Math.max((size.y * PAD[1]) / 2 / tanHalf, (size.x * PAD[0]) / 2 / (tanHalf * camera.aspect));
    const az = MathUtils.degToRad(c.az + lx * LOOK_AZ), el = MathUtils.degToRad(c.el - ly * LOOK_EL);
    centre.copy(center);
    centre.y += size.y * c.lift * (1 - k);
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    // a narrow (phone) screen fits the arch by its width: never closer than that
    const zoom = camera.aspect < 0.8 ? Math.max(c.zoom, 0.94) : c.zoom;
    const far = fit * zoom + size.z / 2;
    const hand = size.x / (2 * tanHalf * camera.aspect * held.f) + size.z / 2;
    // the distance eases in log space, so the growth looks even
    camera.position.copy(centre).addScaledVector(dir, Math.exp(Math.log(far) * (1 - k) + Math.log(hand) * k));
    camera.lookAt(centre);
  }

  function draw(p, time, lx, ly, shift, lift) {
    sample(p, st);
    rig.apply(st, time);
    const k = photo ? st.hold * st.hold * (3 - 2 * st.hold) : 0;
    // move the picture without moving the camera: room for the words in the
    // journey, her palm while it is held
    const dx = shift * (1 - k) + (held.x - 0.5) * k;
    const dy = -lift * (1 - k) + (held.y - 0.5) * k;
    if (dx || dy) camera.setViewOffset(W, H, -dx * W, -dy * H, W, H);
    else camera.clearViewOffset();
    place(st.camera, lx * (1 - 0.5 * k), ly * (1 - 0.5 * k), k);
    back.uniforms.uPerson.value = st.person;
    back.uniforms.uHold.value = st.hold;
    if (bloom) bloom.strength = 0.16 * (1 - 0.75 * st.tray3d) * (1 - 0.45 * st.hold);
    finish.uniforms.uDive.value = st.dive;
    finish.uniforms.uSnap.value = st.snap;
    finish.uniforms.uTime.value = time;
    composer.render();
  }

  let lowered = false;   // degrade(): a slow device gets fewer pixels and no glow
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    const cap = lowered ? 1 : rich ? 1.35 : 1.6;
    const ratio = Math.min(window.devicePixelRatio || 1, cap, Math.sqrt((rich ? 2.4e6 : 1.6e6) / (w * h)));
    W = w; H = h;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(ratio);
    composer.setSize(w, h);
    if (bloom) bloom.resolution.set(Math.round(w * ratio / 3), Math.round(h * ratio / 3));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    finish.uniforms.uAspect.value = w / h;
    fitPhoto();
    rig.setPointScale((POINT_MM * h * ratio) / (2 * tanHalf));
    return true;
  }

  // compile every shader now, with all pieces visible, instead of stalling
  // the first time the scan or the tray appears
  resize();
  rig.showAll();
  place(sample(0).camera, 0, 0, 0);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  // one frame of each chapter now, so nothing is first allocated mid-scroll
  for (const p of [0.25, 0.8, 0]) draw(p, 0, 0, 0, 0, 0);
  let last = [0, 0, 0, 0, 0, 0];

  return {
    render(p, time = 0, lx = 0, ly = 0, shift = 0, lift = 0) { last = [p, time, lx, ly, shift, lift]; draw(p, time, lx, ly, shift, lift); },
    resize() { if (resize()) draw(...last); },
    /** The page saw slow frames: drop to 1× pixels and switch the glow off. */
    degrade() {
      if (lowered) return false;
      lowered = true;
      if (bloom) bloom.enabled = false;
      if (resize()) draw(...last);
      return true;
    },
    /** Screen position (css px) of a tooth's centre, or of the tray over it
     *  (shell), for the labels. */
    project(id, out, shell = false) {
      const t = rig.byId.get(String(id));
      if (!t) return null;
      (shell ? t.shell : t.mesh).getWorldPosition(tmp).project(camera);
      out.x = (tmp.x + 1) / 2 * W;
      out.y = (1 - tmp.y) / 2 * H;
      out.on = tmp.z < 1;
      return out;
    },
    lost(fn) { canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fn(); }, { once: true }); },
  };
}
