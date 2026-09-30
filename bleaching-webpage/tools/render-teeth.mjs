// Render the treatment's 3D (js/bleach-stage.js + assets/models/dentition.glb)
// without the page: a tiny harness page on the same origin imports the
// bundle and calls still(p, w, h).
//   node tools/render-teeth.mjs            test frames along the treatment, tools/shots/bleach-p*.webp
//   node tools/render-teeth.mjs --stills   the five step stills, assets/treatment/step-N.webp
// Re-run --stills after changing the model, the rig or the timeline.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, launch, loadPageModule } from './lib.mjs';

const stills = process.argv.includes('--stills');
const { STEP_COUNT, stepAnchor } = await loadPageModule('js/bleach-timeline.js');
const HARNESS = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0c0d">
<canvas id="c" style="width:600px;height:600px;display:block"></canvas>
<script type="module">
  import { createBleachStage } from './js/bleach-stage.js';
  window.stage = await createBleachStage({ canvas: document.getElementById('c'), modelUrl: './assets/models/dentition.glb' });
  window.ready = true;
</script>`;

const srv = await serve();
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route('**/__harness.html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: HARNESS }));
  await page.goto(`${srv.url}__harness.html`);
  await page.waitForFunction('window.ready === true', null, { timeout: 180000 });
  const shoot = (p, w, h) => page.evaluate(([q, x, y]) => window.stage.still(q, x, y), [p, w, h]);
  const save = (file, url) => {
    if (!url || !url.startsWith('data:image/webp')) throw new Error(`${file}: no WebP from the canvas`);
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  };
  if (stills) {
    const dir = path.join(ROOT, 'assets', 'treatment');
    fs.mkdirSync(dir, { recursive: true });
    for (let k = 0; k < STEP_COUNT; k++) {
      const file = path.join(dir, `step-${k + 1}.webp`);
      save(file, await shoot(stepAnchor(k), 1200, 1200));
      console.log(path.relative(ROOT, file), Math.round(fs.statSync(file).size / 1024) + ' KB');
    }
  } else {
    const dir = path.join(ROOT, 'tools', 'shots');
    fs.mkdirSync(dir, { recursive: true });
    for (const p of [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]) save(path.join(dir, `bleach-p${Math.round(p * 100)}.webp`), await shoot(p, 800, 800));
    console.log('frames in tools/shots/bleach-p*.webp');
  }
  if (errors.length) { console.log('page errors:\n' + errors.join('\n')); process.exitCode = 1; }
} finally {
  await browser.close();
  await srv.close();
}
