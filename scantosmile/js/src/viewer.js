// The order form's 3D preview: shows the visitor's own scan file (STL, PLY,
// OBJ) right after it is dropped, before anything is sent. Everything runs
// in the browser; the file never leaves the page here.
//
// parseScan(name, buffer) → { obj, stats }   (throws on anything unreadable)
// createViewer(canvas) → { show(obj), clear(), resize(), dispose() }
// Drag to turn (with a little inertia); it turns slowly on its own while
// nobody touches it, and only draws while it is on screen.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Points, PointsMaterial, MeshStandardMaterial,
  DirectionalLight, HemisphereLight, PMREMGenerator, Box3, Vector3, Sphere, ACESFilmicToneMapping, DoubleSide,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const plaster = () => new MeshStandardMaterial({ color: 0xd9cfbe, roughness: 0.78, metalness: 0, side: DoubleSide, envMapIntensity: 0.6 });

export function parseScan(name, buffer) {
  const ext = name.toLowerCase().split('.').pop();
  let obj;
  if (ext === 'stl') {
    obj = new Mesh(new STLLoader().parse(buffer), plaster());
  } else if (ext === 'ply') {
    const g = new PLYLoader().parse(buffer);
    // a PLY with faces is a mesh; without, a point cloud
    obj = g.index ? new Mesh(g, plaster())
      : new Points(g, new PointsMaterial({ size: 0.15, color: 0xd9cfbe, vertexColors: !!g.attributes.color }));
  } else if (ext === 'obj') {
    obj = new OBJLoader().parse(new TextDecoder().decode(buffer));
    obj.traverse((o) => { if (o.isMesh) o.material = plaster(); });
  } else throw new Error('format');
  let tris = 0, verts = 0;
  obj.traverse((o) => {
    const g = o.geometry;
    if (!g || !g.attributes.position) return;
    if (o.isMesh && !g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count;
    verts += n;
    if (o.isMesh) tris += g.index ? g.index.count / 3 : n / 3;
  });
  if (!verts) throw new Error('empty');
  const size = new Box3().setFromObject(obj).getSize(new Vector3());
  if (![size.x, size.y, size.z].every(Number.isFinite) || size.length() === 0) throw new Error('empty');
  return { obj, stats: { tris: Math.round(tris), verts, size: [size.x, size.y, size.z], points: !tris } };
}

export function createViewer(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xffd2b0, 2); key.position.set(-1, -0.6, 1.4); scene.add(key);
  const rim = new DirectionalLight(0xdfe8ff, 1.4); rim.position.set(1.2, 1.4, -0.6); scene.add(rim);
  scene.add(new HemisphereLight(0xf4efe6, 0x2a1d14, 0.6));
  const camera = new PerspectiveCamera(30, 1, 0.1, 10000);
  const turn = new Group();
  scene.add(turn);

  let current = null, radius = 1;
  let yaw = 0.5, pitch = -0.55, vy = 0, vp = 0, dragging = false, lastX = 0, lastY = 0, idle = 0;
  let visible = true, raf = 0, last = performance.now();

  function frame() {
    const fov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
    const fit = radius / Math.sin(Math.min(fov, hfov) / 2);
    camera.position.set(0, 0, fit * 1.08);
    camera.near = fit / 100; camera.far = fit * 10;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  function size() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    frame();
    if (current) renderer.render(scene, camera);
  }
  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!dragging) {
      idle += dt;
      yaw += vy; pitch += vp; vy *= 0.92; vp *= 0.92;
      if (idle > 1.5) yaw += dt * 0.35;
    }
    pitch = Math.max(-1.4, Math.min(1.4, pitch));
    turn.rotation.set(pitch, yaw, 0, 'XYZ');
    renderer.render(scene, camera);
    if (visible && current && !document.hidden) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && visible && current && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  canvas.addEventListener('pointerdown', (e) => { dragging = true; idle = 0; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); kick(); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = (e.clientX - lastX) / canvas.clientWidth, dy = (e.clientY - lastY) / canvas.clientHeight;
    lastX = e.clientX; lastY = e.clientY;
    yaw += dx * 4; pitch += dy * 3; vy = dx * 4 * 0.2; vp = dy * 3 * 0.2;
  });
  const up = () => { dragging = false; idle = 0; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', kick);

  function clear() {
    if (!current) return;
    turn.remove(current);
    current = null;
    renderer.clear();
  }

  function show(obj) {
    clear();
    const box = new Box3().setFromObject(obj);
    obj.position.sub(box.getCenter(new Vector3()));
    radius = box.getBoundingSphere(new Sphere()).radius || 1;
    current = new Group();
    current.add(obj);
    turn.add(current);
    yaw = 0.5; pitch = -0.55; idle = 0;
    size();
    kick();
  }

  return { show, clear, resize: size, dispose: () => { clear(); renderer.dispose(); } };
}
