// Shared helpers for the check tools. Nothing here ships with the site
// (.vercelignore excludes tools/).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.glb': 'model/gltf-binary',
};

/** Serve the site folder on a free localhost port. */
export function serve(root = ROOT) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      let p = decodeURIComponent(url.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ url: `http://127.0.0.1:${port}/`, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

/** Tools borrow packages (Playwright, esbuild, three, gltf-transform) from
 *  the main app's node_modules, so this folder needs no install. The main
 *  app's checkout lives in a different place on each machine: an env var
 *  wins, then the usual locations of both maintainers. Returns the first
 *  checkout that has `pkg`, as { dir, require }. */
export function appWith(pkg) {
  const candidates = [process.env.AIXSMILE_DIR, '/home/muhammad-uzair/aixsmile/', `${process.env.HOME}/playground/aixsmile/`]
    .filter(Boolean).map((d) => (d.endsWith('/') ? d : `${d}/`));
  for (const dir of candidates) {
    const req = createRequire(dir);
    try { req.resolve(pkg); return { dir, require: req }; } catch { /* try the next */ }
  }
  throw new Error(`${pkg} not found; set AIXSMILE_DIR to the main app checkout (tried ${candidates.join(', ')})`);
}

export async function launch() {
  const { chromium } = appWith('playwright').require('playwright');
  // WebGL in headless Chromium runs on SwiftShader, which recent builds
  // only enable on request. The hero's 3D jaw needs it.
  return chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

/** A realistic answer from GET /api/public/slots/ so the widget renders without
 *  touching the live API. Dates start tomorrow. */
export function slotsFixture() {
  const days = [];
  const d = new Date();
  for (let i = 1; days.length < 6; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    const dow = x.getDay();
    if (![1, 2, 4].includes(dow)) continue;
    const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    const slots = ['09:00', '09:30', '10:30', '11:00', '13:30', '14:00', '15:00'].map((t) => ({ time: t, len: 30, services: ['bleaching', 'veneers', 'kontrolle'] }));
    days.push({ date: key, weekday: dow, services: ['bleaching', 'veneers', 'kontrolle'], slots });
  }
  return {
    days,
    services: [{ value: 'bleaching', label: 'Bleaching' }],
    consent: { version: 3, text: {
      de: 'Ich willige ein, dass meine Angaben zur Terminvereinbarung verarbeitet werden, einschließlich der Angabe des Behandlungswunsches. (Testtext)',
      en: 'I agree that my details are processed to arrange the appointment, including the treatment requested. (test text)',
    } },
    fallbackUrl: 'https://aixsmile.de/termin/',
  };
}

/** Route the booking API to fixtures. `book` decides the POST answer.
 *  Unless `live3d`, the hero's 3D bundle is swapped for a stub that fails
 *  cleanly, so the hero keeps its still images: software WebGL in headless
 *  Chromium is slow, and most checks are not about the 3D. */
export async function mockApi(page, { book = { ok: true }, slots = slotsFixture(), fail = false, live3d = false } = {}) {
  const posts = [];
  if (!live3d) {
    await page.route('**/js/teeth-stage.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript',
      body: "export async function createTeethStage() { throw new Error('3D off in this check'); }" }));
  }
  await page.route('**/api/public/slots/**', (route) => fail
    ? route.fulfill({ status: 503, body: 'down' })
    : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(slots) }));
  await page.route('**/api/public/book/**', (route) => {
    if (route.request().method() === 'POST') posts.push(JSON.parse(route.request().postData() || '{}'));
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(book) });
  });
  return posts;
}

/** Scroll a section's top to just under the fixed header. */
export async function toSection(page, id) {
  await page.evaluate((id) => {
    const el = id === 'top' ? document.body : document.getElementById(id) || document.querySelector(id);
    const hdr = matchMedia('(max-width: 900px)').matches ? 58 : 64;
    window.scrollTo({ top: id === 'top' ? 0 : window.scrollY + el.getBoundingClientRect().top - hdr, behavior: 'instant' });
  }, id);
  await page.waitForFunction(() => [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every((i) => i.complete), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);
}

export async function cdpShot(page, file) {
  const c = await page.context().newCDPSession(page);
  const { data } = await c.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  await c.detach();
}

/** Load js/i18n.js as an ES module in Node. The site has no package.json (a
 *  static folder Vercel must not mistake for a build project), so the module
 *  is imported from its source text. */
export async function loadI18n() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
}

/** Import one of the page's own ES modules that has no imports of its own
 *  (js/treatment.js), the same way as loadI18n. */
export async function loadPageModule(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
}
