import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { after, before, test } from 'node:test';

const require = createRequire(import.meta.url);
const bundledModules = '/home/muhammad-uzair/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = (() => {
  try {
    return require('playwright');
  } catch {
    return require(bundledModules);
  }
})();

const root = new URL('..', import.meta.url).pathname;
const mime = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

let browser;
let origin;
let server;

before(async () => {
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = normalize(join(root, requested));
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;

  const bundledChrome = '/home/muhammad-uzair/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome';
  browser = await chromium.launch(existsSync(bundledChrome) ? { headless: true, executablePath: bundledChrome } : { headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'short laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small mobile', width: 360, height: 740 },
]) {
  test(`editorial veneers hero works at ${viewport.name} size`, async () => {
    const page = await browser.newPage({ viewport });
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });

    const hero = page.locator('.heroEditorial');
    await assert.doesNotReject(() => hero.waitFor({ state: 'visible', timeout: 5_000 }));
    await assert.doesNotReject(() => hero.getByRole('link', { name: /beratung buchen/i }).waitFor({ state: 'visible' }));
    assert.equal(await hero.locator('.heroEditorial__trust li').count(), 3);
    await assert.doesNotReject(() => hero.locator('.heroEditorial__proof').waitFor({ state: 'visible' }));
    await assert.doesNotReject(() => hero.locator('.heroEditorial__portrait > img').waitFor({ state: 'visible' }));

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.heroEditorial').getBoundingClientRect();
      const cta = document.querySelector('.heroEditorial__actions .btn').getBoundingClientRect();
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        heroHeight: hero.height,
        ctaBottom: cta.bottom,
        viewportHeight: window.innerHeight,
      };
    });
    assert.equal(layout.scrollWidth, layout.clientWidth, 'hero must not introduce horizontal scrolling');
    assert.ok(
      layout.heroHeight <= layout.viewportHeight + 1,
      `hero is ${layout.heroHeight}px tall in a ${layout.viewportHeight}px viewport`,
    );
    assert.ok(layout.ctaBottom <= layout.viewportHeight, 'booking action must remain inside the first screen');
    assert.deepEqual(pageErrors, []);
    await page.close();
  });
}

test('hero images load when index.html is opened directly', async () => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto(new URL('../index.html', import.meta.url).href, { waitUntil: 'load' });

  const images = await page.locator('.heroEditorial img').evaluateAll((elements) =>
    elements.map((image) => ({ alt: image.alt, width: image.naturalWidth })),
  );
  assert.equal(images.length, 3);
  assert.equal(
    images.every((image) => image.width > 0),
    true,
    `direct-file preview has missing hero images: ${JSON.stringify(images)}`,
  );
  await page.close();
});
