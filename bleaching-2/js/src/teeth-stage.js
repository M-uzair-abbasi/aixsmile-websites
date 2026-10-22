// The hero's 3D teeth (bleaching 2). The real dentition from the veneer
// page with the bleaching rig on it (barrier, gel, enamel shade), adapted
// from bleaching-webpage/js/src/bleach-stage.js. Two differences:
//   - render(p, lx, ly) takes a "look" (-1..1 each way) that swings the
//     camera a little, so the teeth turn towards the mouse (Lando's helmet);
//   - the pixel ratio is capped lower on phones (the hero is full screen).
// It never runs a loop of its own: js/site.js calls render() when the scroll
// position or the mouse moves, so an idle page costs nothing. Bundled with
// three.js into js/teeth-stage.js by tools/build-3d.mjs.
import {
  WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, PMREMGenerator, SRGBColorSpace, NeutralToneMapping,
  Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildBleachRig } from './bleach-rig.js';
import { sampleBleach } from '../bleach-timeline.js';

const FOV = 24;
// air around the framed teeth, [width, height]: wide enough that the whole
// set floats as one object in the hero (Lando's helmet), closer for the gel
const PAD = { wide: [1.62, 2.75], close: [1.42, 2.5] };
const LOOK_AZ = 16;  // degrees the camera swings left/right at full look
const LOOK_EL = 8;   // and up/down

export async function createTeethStage({ canvas, modelUrl }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.9;
  const key = new DirectionalLight(0xfff4ea, 1.7);
  key.position.set(-35, 55, 100);
  const fill = new DirectionalLight(0xe6f2ec, 0.5);
  fill.position.set(70, 10, 30);
  const rim = new DirectionalLight(0xd8fff0, 0.55);
  rim.position.set(0, 40, -80);
  scene.add(key, fill, rim);

  const camera = new PerspectiveCamera(FOV, 1, 5, 1500);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  scene.add(gltf.scene);
  const rig = buildBleachRig({ Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils }, gltf.scene);

  const centre = new Vector3(), size = new Vector3(), dir = new Vector3();
  const tanHalf = Math.tan(MathUtils.degToRad(FOV / 2));
  function place(c, lx, ly) {
    const { wide, close } = rig.frames;
    centre.lerpVectors(wide.center, close.center, c.close);
    size.lerpVectors(wide.size, close.size, c.close);
    const padW = PAD.wide[0] + (PAD.close[0] - PAD.wide[0]) * c.close;
    const padH = PAD.wide[1] + (PAD.close[1] - PAD.wide[1]) * c.close;
    const fit = Math.max((size.y * padH) / 2 / tanHalf, (size.x * padW) / 2 / (tanHalf * camera.aspect));
    const az = MathUtils.degToRad(c.az + lx * LOOK_AZ), el = MathUtils.degToRad(c.el - ly * LOOK_EL);
    centre.x += Math.sin(az) * size.x * 0.25;
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(centre).addScaledVector(dir, fit * c.zoom + size.z / 2);
    camera.lookAt(centre);
  }

  let last = { p: 0, lx: 0, ly: 0 };
  function draw(p, lx, ly) {
    const s = sampleBleach(p);
    rig.apply(s);
    place(s.camera, lx, ly);
    renderer.render(scene, camera);
  }

  function fit(width, height, ratio) {
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return false;
    const cap = matchMedia('(max-width: 760px)').matches ? 1.75 : 2;
    // sharp, but at most ~2.6 million pixels on large screens
    fit(w, h, Math.min(window.devicePixelRatio || 1, cap, Math.sqrt(2.6e6 / (w * h))));
    return true;
  }

  // compile every shader now, with all pieces visible, instead of stalling
  // the first time the gel appears
  resize();
  rig.showAll();
  place(sampleBleach(0).camera, 0, 0);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);
  draw(0, 0, 0);

  return {
    render(p, lx = 0, ly = 0) { last = { p, lx, ly }; draw(p, lx, ly); },
    resize() { if (resize()) draw(last.p, last.lx, last.ly); },
    lost(fn) { canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fn(); }, { once: true }); },
  };
}
