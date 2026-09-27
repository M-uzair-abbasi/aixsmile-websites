// Renders the six procedure stills (assets/procedure/step-N.webp) from the
// real 3D stage, so the fallback, the loading poster and the reduced-motion
// list always match what the 3D shows. Re-run after changing the model, the
// rig or the timeline. Not deployed (.vercelignore). From veneer-webpage/:
//   node tools/render-procedure-stills.mjs
//
// Reuses the bleaching page's check helpers (local server, Chromium with
// software WebGL, Playwright borrowed from the main app).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch } from '../../bleaching-webpage/tools/lib.mjs';
import { STEP_COUNT, stepAnchor } from '../js/procedure-timeline.js';

const SIZE = 1200;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'procedure');
mkdirSync(outDir, { recursive: true });

const server = await serve(root);
const browser = await launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(server.url);
  await page.evaluate(() => document.querySelector('.procedure__track').scrollIntoView());
  await page.evaluate(() => window.aixsmileProcedure.ready);
  for (let k = 0; k < STEP_COUNT; k++) {
    const url = await page.evaluate(([p, s]) => window.aixsmileProcedure.still(p, s, s), [stepAnchor(k), SIZE]);
    if (!url || !url.startsWith('data:image/webp')) throw new Error(`step ${k + 1}: no WebP from the canvas`);
    const file = path.join(outDir, `step-${k + 1}.webp`);
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(path.relative(root, file), Math.round((url.length * 3) / 4 / 1024) + ' KB');
  }
} finally {
  await browser.close();
  await server.close();
}
