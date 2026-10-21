// Render the implant page's illustrations from the client's dentition model:
// the slider pair (a studio view and an X-ray from the same camera), the five
// situation cards and the four treatment steps, into assets/renders/ as WebP,
// each with a -960 version for phones. Illustrations only ("Symbolbild"),
// never shown as results.
//   node tools/render-implants.mjs                 every shot
//   node tools/render-implants.mjs slider-xray …   only the named shots
//   node tools/render-implants.mjs --png <dir>     also keep the full-size PNGs
//   node tools/render-implants.mjs --info          print the teeth's positions
// The scenes are built by tools/render-implants.scene.js inside headless
// Chromium on the real GPU (SwiftShader takes minutes a frame and stalls).
// three.js (0.184), Playwright and sharp are borrowed from the main app's
// node_modules (AIXSMILE_DIR wins), so this folder needs no install. The
// source model is ../veneer-webpage/human_dentition.glb (with roots; 18 MB,
// never deployed). Label positions for the slider are written to
// tools/render-implants.marks.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = path.resolve(ROOT, '..', 'veneer-webpage', 'human_dentition.glb');
const OUT = path.join(ROOT, 'assets', 'renders');
const SS = 2;            // supersampling: rendered at twice the size, then downsized
const MAX_KB = 250;

function appWith(pkg) {
  const dirs = [process.env.AIXSMILE_DIR, '/home/muhammad-uzair/aixsmile/', `${process.env.HOME}/playground/aixsmile/`]
    .filter(Boolean).map((d) => (d.endsWith('/') ? d : `${d}/`));
  for (const dir of dirs) {
    const req = createRequire(dir);
    try { req.resolve(pkg); return { dir, require: req }; } catch { /* next */ }
  }
  throw new Error(`${pkg} not found; set AIXSMILE_DIR to the main app checkout`);
}

// ---- the shots. cam: target (mm), az/el (degrees; az 0 = from the front,
// +az from the patient's left), frameH (mm of height in frame), shift (where
// the target lands, fraction of the frame from its centre, +x right, +y down).
// fade: the studio layer fades in from the top between these fractions of the
// height, so the gum runs out into the dark.
const SLIDER_CAM = { target: [0, 10.6, 0.5], az: 0, el: -4, frameH: 33, fov: 20 };
const STEP_CAM = { target: [3.8, 9.5, 0.5], az: 8, el: -7, frameH: 33, fov: 20 };
// the left side from the cheek: front teeth at the left of the frame, molars right
const SIDE_CAM = { target: [24, 12, -25], az: 86, el: -4, frameH: 33, fov: 20, shift: [0.08, -0.1] };
export const SHOTS = [
  { name: 'slider-real', case: 'single21', mode: 'real', w: 1600, h: 1000, cam: SLIDER_CAM, fade: [0.1, 0.48], fadeX: 0.1 },
  { name: 'slider-xray', case: 'single21', mode: 'xray', w: 1600, h: 1000, cam: SLIDER_CAM, fadeX: 0.1 },
  { name: 'sit-gap', case: 'gap26', mode: 'xray', w: 1200, h: 900, cam: SIDE_CAM },
  { name: 'sit-several', case: 'several', mode: 'xray', w: 1200, h: 900, cam: SIDE_CAM },
  { name: 'sit-denture', case: 'allon4', mode: 'xray', w: 1200, h: 900, cam: { target: [0, 12, -12], az: 6, el: -6, frameH: 46, fov: 20, shift: [0.06, -0.06] } },
  { name: 'sit-bone', case: 'sinus26', mode: 'xray', k: { mark: 0.1 }, w: 1200, h: 900, cam: { ...SIDE_CAM, target: [24, 14, -25], frameH: 34 } },
  { name: 'sit-second', case: 'product', mode: 'real', w: 1200, h: 900, cam: { target: [24.8, -9.1, -28.5], az: 35, el: 10, frameH: 25, fov: 18, shift: [0.14, -0.04] }, light: { key: 1.6, rim: 2.2, fill: 0.35, env: 0.85 } },
  { name: 'step-scan', case: 'scan21', mode: 'xray', w: 1200, h: 900, cam: { target: [0, 6, -18], az: 0, el: -89.9, frameH: 58, fov: 20, up: [0, 0, 1] } },
  { name: 'step-plan', case: 'plan21', mode: 'xray', w: 1200, h: 900, cam: STEP_CAM, plan: true },
  { name: 'step-place', case: 'placed21', mode: 'xray', w: 1200, h: 900, cam: STEP_CAM },
  { name: 'step-crown', case: 'crown21', mode: 'real', w: 1200, h: 900, cam: { target: [2.5, 6.5, 2], az: 16, el: -3, frameH: 24, fov: 20 }, fade: [0.0, 0.42], fadeX: 0.06 },
];

const args = process.argv.slice(2);
const pngDir = args.includes('--png') ? args[args.indexOf('--png') + 1] : null;
const info = args.includes('--info');
const only = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--png');
const shots = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
if (only.length && shots.length !== only.length) throw new Error(`unknown shot in: ${only.join(', ')}`);

const three = path.join(appWith('three').dir, 'node_modules', 'three');
const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0a1119">
<script type="importmap">{ "imports": { "three": "/three/build/three.module.js", "three/addons/": "/three/examples/jsm/" } }</script>
<script type="module">
  import { createStudio } from '/scene.js';
  try { window.studio = await createStudio({ modelUrl: '/model.glb' }); window.ready = true; }
  catch (e) { window.failed = String(e && e.stack || e); }
</script>`;
const TYPES = { '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = null;
  if (p === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(HARNESS); return; }
  if (p === '/scene.js') file = path.join(ROOT, 'tools', 'render-implants.scene.js');
  else if (p === '/model.glb') file = MODEL;
  else if (p.startsWith('/three/')) file = path.join(three, p.slice(7));
  if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const { chromium } = appWith('playwright').require('playwright');
const sharp = appWith('sharp').require('sharp');
const browser = await chromium.launch({ headless: true, channel: 'chromium', args: ['--enable-gpu', '--use-angle=gl-egl', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction('window.ready === true || !!window.failed', null, { timeout: 240000 });
  const failed = await page.evaluate('window.failed');
  if (failed) throw new Error(failed);
  const gpu = await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const x = g.getExtension('WEBGL_debug_renderer_info'); return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : '?'; });
  console.log(`gpu: ${gpu} · float blending: ${await page.evaluate('window.studio.floatBlend')}`);
  if (info) console.log(JSON.stringify(await page.evaluate('window.studio.teeth'), null, 1));
  fs.mkdirSync(OUT, { recursive: true });
  if (pngDir) fs.mkdirSync(pngDir, { recursive: true });
  const marksFile = path.join(ROOT, 'tools', 'render-implants.marks.json');
  const allMarks = fs.existsSync(marksFile) ? JSON.parse(fs.readFileSync(marksFile, 'utf8')) : {};
  for (const spec of info && !only.length ? [] : shots) {
    const t0 = Date.now();
    const { url: data, marks } = await page.evaluate(([s, w, h]) => window.studio.shot(s, w, h), [spec, spec.w * SS, spec.h * SS]);
    const png = Buffer.from(data.split(',')[1], 'base64');
    if (pngDir) fs.writeFileSync(path.join(pngDir, `${spec.name}.png`), png);
    const full = sharp(png).resize(spec.w, spec.h, { kernel: 'lanczos3' });
    let q = 82, webp;
    do { webp = await full.clone().webp({ quality: q, effort: 6 }).toBuffer(); q -= 4; } while (webp.length / 1024 > MAX_KB && q >= 66);
    fs.writeFileSync(path.join(OUT, `${spec.name}.webp`), webp);
    const small = await sharp(png).resize(960, Math.round((960 * spec.h) / spec.w), { kernel: 'lanczos3' }).webp({ quality: 80, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${spec.name}-960.webp`), small);
    if (Object.keys(marks).length) allMarks[spec.name] = marks;
    console.log(`${spec.name}.webp ${Math.round(webp.length / 1024)} KB (q${q + 4}) · -960 ${Math.round(small.length / 1024)} KB · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  fs.writeFileSync(marksFile, JSON.stringify(allMarks, null, 1) + '\n');
  if (errors.length) { console.log('page messages:\n' + [...new Set(errors)].join('\n')); }
} finally {
  await browser.close();
  server.close();
}
