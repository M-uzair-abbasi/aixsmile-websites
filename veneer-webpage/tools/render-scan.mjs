// Renders the "digital scan" pictures for the smile → scan → ceramic scene:
// the upper arch of the dentition model seen from below (the classic
// occlusal view of an intraoral scan), once as a point cloud and once as the
// finished matte scan surface, same camera. The points come on black (the
// page blends them in with mix-blend-mode: screen; far smaller than alpha),
// the surface is transparent WebP. The page lays the surface over the points
// and sweeps a scan line across (assets/scan/).
//
//   node tools/render-scan.mjs
//
// Needs the page served on BASE (default the no-cache preview on :8091) and a
// real GPU (ANGLE/EGL). Not deployed (tools/ is in .vercelignore).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('/home/muhammad-uzair/aixsmile/package.json');
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8091';
const outDir = path.join(root, 'assets', 'scan');
const W = 1120, H = 960;

const harness = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/js/vendor/three/three.module.js","three/addons/":"/js/vendor/three/addons/"}}</script>
<style>html,body{margin:0;background:transparent}canvas{display:block}</style></head><body>
<canvas id="c"></canvas>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDentitionRig } from '/js/dentition-rig.js';
import { sampleProcedure } from '/js/procedure-timeline.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(1); renderer.setSize(${W}, ${H}, false);
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
const key = new THREE.DirectionalLight(0xffffff, 2.2);
const fill = new THREE.DirectionalLight(0xf1f4ff, 0.7);
scene.add(key, fill, key.target, fill.target);

const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/models/dentition.glb');
scene.add(gltf.scene);
const rig = buildDentitionRig(THREE, gltf.scene);
rig.apply(sampleProcedure(0));
gltf.scene.updateMatrixWorld(true);

// keep the upper arch only (teeth 11–28 and the gum; the palate is open from below)
const upper = /tooth_[12]\\d_|maxillary_gingiva/;
const meshes = [];
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false;
  const mat = Array.isArray(o.material) ? o.material[0] : o.material;
  const op = mat && mat.transparent ? mat.opacity : 1;
  const label = o.name + ' ' + (o.parent && o.parent.name);
  if (!vis || op < 0.5 || !upper.test(label)) { o.visible = false; return; }
  meshes.push({ o, gum: /gingiva|palate/.test(label) });
});

const tooth = new THREE.MeshStandardMaterial({ color: 0xece7df, roughness: 0.5, metalness: 0 });
const gum = new THREE.MeshStandardMaterial({ color: 0xc7aaa6, roughness: 0.72, metalness: 0 });
const hide = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
const ptsTooth = new THREE.PointsMaterial({ color: 0xf6e3de, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false });
const ptsGum = new THREE.PointsMaterial({ color: 0xe0a59f, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
// points spread evenly over the surface (random points weighted by triangle
// area), so the low-poly molars read as densely as the front teeth
const tri = new THREE.Triangle(), va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3();
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (const m of meshes) {
  const pos = m.o.geometry.attributes.position, idx = m.o.geometry.index;
  const n = idx ? idx.count / 3 : pos.count / 3;
  const vid = (i, k) => (idx ? idx.getX(3 * i + k) : 3 * i + k);
  const cum = new Float32Array(n), mw = m.o.matrixWorld; let area = 0;
  for (let i = 0; i < n; i++) {
    // world-space area (some parts carry a scale in their node)
    tri.set(va.fromBufferAttribute(pos, vid(i, 0)).applyMatrix4(mw), vb.fromBufferAttribute(pos, vid(i, 1)).applyMatrix4(mw), vc.fromBufferAttribute(pos, vid(i, 2)).applyMatrix4(mw));
    area += tri.getArea(); cum[i] = area;
  }
  const count = Math.round(area * (m.gum ? 4.5 : 9));
  const arr = new Float32Array(count * 3);
  for (let j = 0; j < count; j++) {
    const t = rnd() * area; let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < t) lo = mid + 1; else hi = mid; }
    va.fromBufferAttribute(pos, vid(lo, 0)); vb.fromBufferAttribute(pos, vid(lo, 1)); vc.fromBufferAttribute(pos, vid(lo, 2));
    let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    arr[3 * j] = va.x + (vb.x - va.x) * u + (vc.x - va.x) * v;
    arr[3 * j + 1] = va.y + (vb.y - va.y) * u + (vc.y - va.y) * v;
    arr[3 * j + 2] = va.z + (vb.z - va.z) * u + (vc.z - va.z) * v;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  m.pts = new THREE.Points(g, m.gum ? ptsGum : ptsTooth);
  m.pts.visible = false;
  m.o.add(m.pts);
  m.count = count;
}

const box = new THREE.Box3(); meshes.forEach((m) => box.expandByObject(m.o));
const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
const camera = new THREE.PerspectiveCamera(20, ${W} / ${H}, 1, 5000);
const r = Math.max(size.x, size.z) * 0.5 * 1.06;
const dist = r / Math.tan(THREE.MathUtils.degToRad(10)) / Math.min(1, ${W} / ${H});
camera.up.set(0, 0, 1);                       // the front teeth at the top
camera.position.set(c.x, c.y - dist, c.z + dist * 0.06);
camera.lookAt(c);
key.position.set(c.x - r, c.y - r * 2.4, c.z + r * 1.6); key.target.position.copy(c);
fill.position.set(c.x + r * 1.5, c.y - r * 1.2, c.z - r); fill.target.position.copy(c);
window.sizeInfo = { size: size.toArray(), counts: meshes.map((m) => m.count) };

window.shot = (mode) => {
  for (const m of meshes) {
    m.pts.visible = mode === 'points';
    m.o.material = mode === 'points' ? hide : m.gum ? gum : tooth;
  }
  renderer.setClearColor(0x000000, mode === 'points' ? 1 : 0);
  renderer.render(scene, camera);
  return canvas.toDataURL('image/webp', mode === 'points' ? 0.8 : 0.88);
};
window.ready = true;
</script></body></html>`;

const browser = await chromium.launch({ args: ['--use-angle=gl-egl', '--use-gl=angle', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.route(`${BASE}/__scan.html`, (r) => r.fulfill({ contentType: 'text/html', body: harness }));
  await page.goto(`${BASE}/__scan.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  console.log(JSON.stringify(await page.evaluate(() => window.sizeInfo)));
  mkdirSync(outDir, { recursive: true });
  for (const mode of ['points', 'surface']) {
    const url = await page.evaluate((m) => window.shot(m), mode);
    const file = path.join(outDir, `arch-${mode}.webp`);
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(path.relative(root, file), Math.round((url.length * 3) / 4 / 1024) + ' KB');
  }
} finally {
  await browser.close();
}
