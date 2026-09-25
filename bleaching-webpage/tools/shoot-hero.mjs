// Screenshots of the hero's 3D stage at points along the slider, laptop and
// phone, once the live jaw has replaced the still image.
//   node tools/shoot-hero.mjs [outDir]      (default tools/shots/)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, mockApi, cdpShot, ROOT } from './lib.mjs';

const out = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'shots'));
fs.mkdirSync(out, { recursive: true });
const VIEWS = [
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'phone', width: 390, height: 844, mobile: true },
];
const STOPS = [0, 14, 30, 60, 100];

const srv = await serve();
const browser = await launch();
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile,
      // One frame per slider move instead of the easing: software WebGL is slow.
      reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1600);
    await cdpShot(page, path.join(out, `hero-${v.name}-still.png`));
    const t0 = Date.now();
    await page.waitForSelector('#heroStage.is-live, #heroStage.is-still', { timeout: 120000 });
    const mode = await page.evaluate(() => document.getElementById('heroStage').className);
    console.log(`${v.name}: ${mode} after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await page.waitForTimeout(1200);
    for (const s of STOPS) {
      await page.evaluate((val) => { const r = document.querySelector('.stageRange'); r.value = String(val); r.dispatchEvent(new Event('input', { bubbles: true })); }, s);
      await page.waitForTimeout(400);
      await cdpShot(page, path.join(out, `hero-${v.name}-${s}.png`));
    }
    if (errors.length) console.log(`${v.name} errors:\n  ${errors.join('\n  ')}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  await srv.close();
}
