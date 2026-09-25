// Render the hero's 3D jaw at chosen points of the treatment, as PNGs.
//
//   node tools/render-teeth.mjs            test frames into tools/shots/
//   node tools/render-teeth.mjs --posters  the hero's two still images
//
// The stills stand in for the live model while it loads, and replace it
// where WebGL is missing: the slider then blends the yellow still into the
// white one.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, serve, launch, loadPageModule } from './lib.mjs';

const posters = process.argv.includes('--posters');
fs.mkdirSync(path.join(ROOT, 'tools/shots'), { recursive: true });
const srv = await serve();
const browser = await launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

async function frames(w, h, dpr, list) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`${srv.url}tools/stage-test.html?w=${w}&h=${h}&dpr=${dpr}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  const out = [];
  for (const [name, params] of list) {
    const url = await page.evaluate((p) => window.shot(p), params);
    out.push([name, Buffer.from(url.split(',')[1], 'base64')]);
  }
  return out;
}

try {
  if (posters) {
    // One pair per frame shape, at 2x: square for the arch (laptop, tablet),
    // 3:2 for phones. The live model frames itself the same way.
    const ends = (suffix) => [
      ['jaw-yellow' + suffix, { shade: 0, barrier: 0, gel: 0, turn: 0 }],
      ['jaw-white' + suffix, { shade: 1, barrier: 0, gel: 0, turn: 0 }],
    ];
    const shots = [...await frames(640, 640, 2, ends('')), ...await frames(480, 320, 2, ends('-wide'))];
    const dir = path.join(ROOT, 'assets/photos');
    for (const [name, buf] of shots) {
      const png = path.join(ROOT, 'tools/shots', name + '.png');
      fs.writeFileSync(png, buf);
      execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(png)})
im.save(${JSON.stringify(path.join(dir, name + '.webp'))}, 'WEBP', quality=82, method=6, alpha_quality=80)
`]);
      console.log('assets/photos/' + name + '.webp', (fs.statSync(path.join(dir, name + '.webp')).size / 1024).toFixed(0) + ' KB');
    }
  } else {
    const { treatment } = await loadPageModule('js/treatment.js');
    const list = [0, 0.14, 0.3, 0.55, 0.8, 1].map((p) => [`p${Math.round(p * 100)}`, treatment(p)]);
    const w = Number(process.env.W || 640), h = Number(process.env.H || 640);
    for (const [name, buf] of await frames(w, h, 1, list)) {
      fs.writeFileSync(path.join(ROOT, 'tools/shots', `teeth-${name}.png`), buf);
    }
    console.log('frames in tools/shots/teeth-*.png');
  }
  if (errors.length) console.log('page errors:\n' + errors.join('\n'));
} finally {
  await browser.close();
  await srv.close();
}
