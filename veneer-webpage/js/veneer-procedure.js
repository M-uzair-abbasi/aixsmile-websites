// The 3D stage of the procedure section: renderer, light, camera and the
// dentition rig. It never runs a loop of its own; procedure-section.js calls
// render(progress) when the playhead moves or the canvas resizes, so an idle
// page costs nothing.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDentitionRig } from './dentition-rig.js';
import { sampleProcedure } from './procedure-timeline.js';

const FOV = 24;
// air around the framed teeth, [width, height]; the gums run out of frame and
// fade with the canvas mask, so the wide view reads as a smile, not a model
const PAD = { wide: [1.24, 1.62], close: [1.16, 2.0] };

export async function createVeneerProcedure({ canvas, modelUrl }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.85;
  const key = new THREE.DirectionalLight(0xfff1e2, 1.6);
  key.position.set(-35, 55, 100);
  const fill = new THREE.DirectionalLight(0xe4ecff, 0.45);
  fill.position.set(70, 10, 30);
  scene.add(key, fill);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 5, 1500);
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl);
  scene.add(gltf.scene);
  const rig = buildDentitionRig(THREE, gltf.scene);

  const centre = new THREE.Vector3(), size = new THREE.Vector3(), dir = new THREE.Vector3();
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  function place(c) {
    const { wide, close } = rig.frames;
    centre.lerpVectors(wide.center, close.center, c.close);
    size.lerpVectors(wide.size, close.size, c.close);
    const padW = PAD.wide[0] + (PAD.close[0] - PAD.wide[0]) * c.close;
    const padH = PAD.wide[1] + (PAD.close[1] - PAD.wide[1]) * c.close;
    const fit = Math.max((size.y * padH) / 2 / tanHalf, (size.x * padW) / 2 / (tanHalf * camera.aspect));
    const az = THREE.MathUtils.degToRad(c.az), el = THREE.MathUtils.degToRad(c.el);
    // turned to the side, the near teeth loom larger; aim a little towards
    // them so the six stay centred in the frame
    centre.x += Math.sin(az) * size.x * 0.25;
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    camera.position.copy(centre).addScaledVector(dir, fit * c.zoom + size.z / 2);
    camera.lookAt(centre);
  }

  function draw(p) {
    const s = sampleProcedure(p);
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
  // halfway through playback the first time a piece appears
  resize();
  rig.showAll();
  place(sampleProcedure(0).camera);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  else renderer.compile(scene, camera);

  let last = 0;
  return {
    render(p) { last = p; draw(p); },
    resize() { if (resize()) draw(last); },
    /** One frame at a fixed size as a WebP data URL, for the stills
     *  (tools/render-procedure-stills.mjs). */
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
