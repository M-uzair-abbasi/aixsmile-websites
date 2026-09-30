// The 3D stage of the treatment section: renderer, light, camera and the
// bleaching rig on the real dentition. It never runs a loop of its own;
// js/treatment-section.js calls render(progress) when the playhead moves or
// the canvas resizes, so an idle page costs nothing. Bundled with three.js
// into js/bleach-stage.js by tools/build-3d.mjs. Adapted from the veneer
// page's js/veneer-procedure.js.
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
// air around the framed teeth, [width, height]; the gums run out of frame
// and fade with the canvas mask, so the view reads as a smile, not a model
const PAD = { wide: [1.08, 1.5], close: [1.16, 2.0] };

export async function createBleachStage({ canvas, modelUrl }) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.85;
  const key = new DirectionalLight(0xfff1e2, 1.6);
  key.position.set(-35, 55, 100);
  const fill = new DirectionalLight(0xe8ecf2, 0.45);
  fill.position.set(70, 10, 30);
  scene.add(key, fill);

  const camera = new PerspectiveCamera(FOV, 1, 5, 1500);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  scene.add(gltf.scene);
  const rig = buildBleachRig({ Vector3, Color, Box3, Mesh, MeshPhysicalMaterial, BufferAttribute, MathUtils }, gltf.scene);

  const centre = new Vector3(), size = new Vector3(), dir = new Vector3();
  const tanHalf = Math.tan(MathUtils.degToRad(FOV / 2));
  function place(c) {
    const { wide, close } = rig.frames;
    centre.lerpVectors(wide.center, close.center, c.close);
    size.lerpVectors(wide.size, close.size, c.close);
    const padW = PAD.wide[0] + (PAD.close[0] - PAD.wide[0]) * c.close;
    const padH = PAD.wide[1] + (PAD.close[1] - PAD.wide[1]) * c.close;
    const fit = Math.max((size.y * padH) / 2 / tanHalf, (size.x * padW) / 2 / (tanHalf * camera.aspect));
    const az = MathUtils.degToRad(c.az), el = MathUtils.degToRad(c.el);
    // turned to the side, the near teeth loom larger; aim a little towards them
    centre.x += Math.sin(az) * size.x * 0.25;
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(centre).addScaledVector(dir, fit * c.zoom + size.z / 2);
    camera.lookAt(centre);
  }

  function draw(p) {
    const s = sampleBleach(p);
    rig.apply(s);
    place(s.camera);
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
    // sharp on phones, but at most ~2.4 million pixels on large screens
    fit(w, h, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.4e6 / (w * h))));
    return true;
  }

  // compile every shader now, with all pieces visible, instead of stalling
  // the first time the gel appears
  resize();
  rig.showAll();
  place(sampleBleach(0).camera);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);

  let last = 0;
  return {
    render(p) { last = p; draw(p); },
    resize() { if (resize()) draw(last); },
    /** One frame at a fixed size as a WebP data URL (tools/render-teeth.mjs). */
    still(p, width, height) {
      fit(width, height, 1);
      draw(p);
      const url = canvas.toDataURL('image/webp', 0.86);
      resize();
      draw(last);
      return url;
    },
  };
}
