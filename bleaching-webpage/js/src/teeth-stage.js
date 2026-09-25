// The hero's 3D jaw. Source of js/teeth-stage.js, which tools/build-3d.mjs
// bundles with three.js (tree-shaken, minified). The page never loads this
// file directly.
//
// It draws only when something changes: a slider move, a resize, or the
// short easing after a move. No loop runs while the hero sits still.

import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, HemisphereLight,
  PMREMGenerator, Color, MeshPhysicalMaterial, Mesh, Box3, Vector3, Group,
  NeutralToneMapping, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TOOTH_STOPS } from '../treatment.js';

const BARRIER = '#528db3';   // the blue, light-cured gum protection
const GUM = '#9e5058';
const GEL = '#86d6bd';       // a mint gel, clearly apart from the blue barrier

export async function createTeethStage(canvas, {
  modelUrl, maxDpr = 2, preserve = false, reduceMotion = false,
} = {}) {
  const renderer = new WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'low-power',
    preserveDrawingBuffer: preserve,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  scene.add(new HemisphereLight(0xfff6ea, 0x2a2420, 0.9));
  const key = new DirectionalLight(0xfff3e2, 2.4);
  key.position.set(-0.6, 0.9, 1.4);
  scene.add(key);
  const fill = new DirectionalLight(0xe9eef5, 0.7);
  fill.position.set(1.2, -0.2, 0.9);
  scene.add(fill);
  const rim = new DirectionalLight(0xe6f0f2, 1.4);   // the page's ice blue
  rim.position.set(0.2, 1.2, -1.4);
  scene.add(rim);

  const camera = new PerspectiveCamera(24, 1, 0.001, 10);

  // ---- model ----
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(modelUrl);
  const jaw = gltf.scene;
  const pivot = new Group();
  pivot.add(jaw);
  scene.add(pivot);

  const enamel = new MeshPhysicalMaterial({
    color: TOOTH_STOPS[0], roughness: 0.32, metalness: 0,
    clearcoat: 0.45, clearcoatRoughness: 0.28,
  });

  // Gums take the barrier as a band along the edge that meets the teeth,
  // not as a colour over everything.
  const gumMat = (edgeY, dir, band) => {
    const m = new MeshPhysicalMaterial({ color: GUM, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4 });
    m.userData.u = {
      uBarrier: { value: 0 }, uBarrierColor: { value: new Color(BARRIER) },
      uEdge: { value: edgeY }, uDir: { value: dir }, uBand: { value: band },
    };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vGumY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGumY = position.y;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vGumY;\nuniform float uBarrier, uEdge, uDir, uBand;\nuniform vec3 uBarrierColor;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float gumD = (vGumY - uEdge) * uDir;              // 0 at the teeth, grows away
          float gumM = 1.0 - smoothstep(uBand * 0.75, uBand, gumD);
          diffuseColor.rgb = mix(diffuseColor.rgb, uBarrierColor, gumM * uBarrier);`);
    };
    return m;
  };

  // Gel: a glossy mint layer over the front crowns, pushed out along the
  // normals so it stands on the enamel, and denser at the edges (where a
  // real gel layer is seen at a slant) so it reads as a coating.
  const gelMat = new MeshPhysicalMaterial({
    color: GEL, transparent: true, opacity: 0, depthWrite: false,
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
  });
  gelMat.userData.u = { uThick: { value: 0.0006 } };
  gelMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, gelMat.userData.u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThick;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed += normalize(objectNormal) * (uThick / length(modelMatrix[0].xyz));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <opaque_fragment>', `float gelEdge = 1.0 - abs(dot(normalize(vViewPosition), normal));
        diffuseColor.a = clamp(diffuseColor.a * (0.8 + 1.8 * gelEdge * gelEdge), 0.0, 0.95);
        #include <opaque_fragment>`);
  };

  const gums = [];
  const gels = [];
  const teethBox = new Box3();
  const jawBox = new Box3();
  jaw.updateMatrixWorld(true);
  const meshes = [];
  jaw.traverse((o) => { if (o.isMesh) meshes.push(o); });
  for (const o of meshes) {
    const name = (o.material && o.material.name) || '';
    if (!/palatal/.test(o.name)) jawBox.expandByObject(o);
    if (name === 'enamel') {
      o.material = enamel;
      teethBox.expandByObject(o);
      // Front teeth, canine to second premolar (FDI x1 to x5), get the gel.
      const m = /tooth_[1-4]([1-5])_/.exec(o.name) || /tooth_[1-4]([1-5])_/.exec(o.parent && o.parent.name || '');
      if (m) {
        const g = new Mesh(o.geometry, gelMat);
        g.renderOrder = 2;
        o.add(g);
        gels.push(g);
      }
    } else if (name === 'gingiva') {
      const geo = o.geometry;
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const lower = /lower/.test(o.name) || /lower|mandible/.test(o.parent && o.parent.name || '');
      const palatal = /palatal/.test(o.name);
      const h = bb.max.y - bb.min.y;
      // Upper gum meets the teeth at its lowest edge, lower gum at its highest.
      o.material = gumMat(lower ? bb.max.y : bb.min.y, lower ? -1 : 1, palatal ? 0 : h * 0.42);
      gums.push(o);
    }
  }
  gels.forEach((g) => { g.visible = false; });

  // Turn around the middle of the smile; frame the whole jaw, gums included.
  const centre = teethBox.getCenter(new Vector3());
  jaw.position.sub(centre);
  const jawSize = jawBox.getSize(new Vector3());
  const jawMid = jawBox.getCenter(new Vector3()).sub(centre);

  // ---- state ----
  const target = { shade: 0, barrier: 0, gel: 0, turn: 0 };
  const cur = { ...target };
  const col = new Color();
  const stopCols = TOOTH_STOPS.map((h) => new Color(h));

  function applyState() {
    const t = MathUtils.clamp(cur.shade, 0, 1) * (stopCols.length - 1);
    const i = Math.min(Math.floor(t), stopCols.length - 2);
    col.lerpColors(stopCols[i], stopCols[i + 1], t - i);
    enamel.color.copy(col);
    // Whiter enamel reads a touch glossier, yellow a touch duller.
    enamel.roughness = MathUtils.lerp(0.36, 0.26, cur.shade);
    for (const g of gums) g.material.userData.u.uBarrier.value = cur.barrier;
    gelMat.opacity = 0.42 * cur.gel;
    const showGel = cur.gel > 0.01;
    for (const g of gels) g.visible = showGel;
    pivot.rotation.y = MathUtils.degToRad(cur.turn * 16);
    pivot.rotation.x = MathUtils.degToRad(6 - Math.abs(cur.turn) * 2);
  }

  // Fit the whole jaw. In the square frame (laptop, tablet) it fills about
  // three quarters of the height and sits a little low, clear of the shade
  // readout; in the phone's wide frame it fills nine tenths, centred.
  // tools/render-teeth.mjs renders the stills through this same function,
  // one per frame shape, so still and live line up.
  function frame(w, h) {
    const aspect = w / h;
    const wide = aspect > 1.15;
    const fill = wide ? 0.9 : 0.74;           // share of the height
    const centreAt = wide ? 0.52 : 0.58;      // jaw centre, from the top
    camera.aspect = aspect;
    const t = Math.tan(MathUtils.degToRad(camera.fov) / 2);
    const front = jawSize.z * 0.5;
    let dist = jawSize.y / (fill * 2 * t);
    dist = Math.max(dist, jawSize.x / (0.86 * 2 * t * aspect));
    const viewH = 2 * t * (dist - front);
    const lift = (centreAt - 0.5) * viewH;     // look above the jaw to set it lower
    camera.position.set(jawMid.x, jawMid.y + lift, jawMid.z + dist);
    camera.lookAt(jawMid.x, jawMid.y + lift, jawMid.z);
    camera.near = dist / 50;
    camera.far = dist * 10;
    camera.updateProjectionMatrix();
  }

  let w = 0, h = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width));
    const nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    frame(w, h);
    requestRender();
  }

  let raf = 0;
  function tick() {
    raf = 0;
    let moving = false;
    for (const k of Object.keys(target)) {
      const d = target[k] - cur[k];
      if (reduceMotion || Math.abs(d) < 0.002) cur[k] = target[k];
      else { cur[k] += d * 0.22; moving = true; }
    }
    applyState();
    renderer.render(scene, camera);
    if (moving) raf = requestAnimationFrame(tick);
  }
  function requestRender() { if (!raf) raf = requestAnimationFrame(tick); }

  function set(p, { instant = false } = {}) {
    Object.assign(target, p);
    if (instant) Object.assign(cur, target);
    requestRender();
  }

  function renderNow() {
    Object.assign(cur, target);
    applyState();
    renderer.render(scene, camera);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  applyState();
  renderer.compile(scene, camera);
  renderNow();

  return {
    set, renderNow, resize,
    dispose() {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      renderer.dispose();
    },
  };
}
