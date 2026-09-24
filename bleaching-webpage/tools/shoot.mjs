// Screenshots of every section, laptop and phone, plus the English hero.
//   node tools/shoot.mjs [outDir]      (default tools/shots/, git-ignored)
// The booking API is answered from a fixture; nothing reaches the live API.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, mockApi, toSection, cdpShot, ROOT } from './lib.mjs';

const out = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'shots'));
fs.mkdirSync(out, { recursive: true });
const VIEWS = [
  { name: 'laptop', width: 1280, height: 800, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
];
const SECTIONS = ['top', 'bleaching', 'wann', 'was-passiert', 'messen', 'ablauf', 'zwei-wege', 'faelle', 'buchen', 'kosten', 'behandler', 'faq', 'praxis', 'footer'];

const srv = await serve();
const browser = await launch();
const log = [];
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    for (const [i, id] of SECTIONS.entries()) {
      await toSection(page, id);
      await cdpShot(page, path.join(out, `${v.name}-${String(i).padStart(2, '0')}-${id}.png`));
    }
    await toSection(page, 'top');
    await page.click('#langToggle');
    await page.waitForTimeout(300);
    await cdpShot(page, path.join(out, `${v.name}-en-hero.png`));
    await page.click('#langToggle');
    log.push(`${v.name}: ${SECTIONS.length} sections captured; errors: ${errors.length ? errors.join(' | ') : 'none'}`);
    await ctx.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(log.join('\n'));
console.log(`shots in ${out}`);
