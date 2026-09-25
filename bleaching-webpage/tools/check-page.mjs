// Behaviour and weight in a real browser. The booking API is answered from
// fixtures, so nothing here reaches the live practice API.
//   node tools/check-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { serve, launch, mockApi, ROOT } from './lib.mjs';

const results = [];
const ok = (name, pass, detail = '') => results.push({ name, pass, detail });

const srv = await serve();
const browser = await launch();
try {
  // ---- weight, outside requests, errors: one full scroll on a laptop ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = []; const outside = []; const api = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('response', async (r) => {
      const u = new URL(r.url());
      if (u.hostname === '127.0.0.1') return;
      if (/\/api\/public\//.test(u.pathname)) api.push(u.host);
      else outside.push(r.url());
    });
    await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const firstKb = await page.evaluate(() => Math.round((performance.getEntriesByType('navigation')[0].decodedBodySize
      + performance.getEntriesByType('resource').reduce((sum, e) => sum + e.decodedBodySize, 0)) / 1024));
    ok('first load (before any scrolling) is under 900 KB', firstKb < 900, `${firstKb} KB`);
    for (let y = 0; y < 40; y++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(120); }
    await page.waitForTimeout(800);
    const broken = await page.evaluate(() => [...document.images].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
    ok('every image loads', broken.length === 0, broken.join(', ') || 'all loaded');
    // decoded sizes from the browser's own resource timing (what gzip or
    // brotli on Vercel would shrink further)
    const kb = await page.evaluate(() => Math.round((performance.getEntriesByType('navigation')[0].decodedBodySize
      + performance.getEntriesByType('resource').reduce((sum, e) => sum + e.decodedBodySize, 0)) / 1024));
    ok('full page after scrolling to the end (every image loaded)', true, `${kb} KB uncompressed`);
    ok('no requests to third parties', outside.length === 0, outside.join(', ') || 'none');
    ok('the only outside host is the practice booking API', api.every((h) => h === 'aixsmile.de'), [...new Set(api)].join(', '));
    ok('no console or page errors', errors.length === 0, errors.join(' | ') || 'none');
    await ctx.close();
  }

  // ---- no sideways scroll at any width ----
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [901, 700], [900, 800], [768, 1024], [414, 896], [390, 844], [360, 740], [320, 568]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(150);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`no horizontal overflow at ${w}x${h}`, over <= 0, `${over}px`);
    await ctx.close();
  }

  // ---- language switch round trip ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const before = await page.evaluate(() => ({ h1: document.querySelector('h1').innerHTML, title: document.title }));
    await page.click('#langToggle');
    const en = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent, title: document.title, lang: document.documentElement.lang}));
    ok('English applies to headline, title and html lang', /Measure the shade/.test(en.h1) && /whitening/i.test(en.title) && en.lang === 'en', `${en.h1} | ${en.lang}`);
    await page.reload({ waitUntil: 'load' });
    const kept = await page.evaluate(() => document.documentElement.lang);
    ok('the language choice survives a reload', kept === 'en', kept);
    await page.click('#langToggle');
    const back = await page.evaluate(() => ({ h1: document.querySelector('h1').innerHTML, title: document.title }));
    ok('German comes back exactly as authored', back.h1 === before.h1 && back.title === before.title, back.h1);
    await ctx.close();
  }

  // ---- motion: nothing is tied to scrolling; reduced motion stills the hero ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const names = await page.evaluate(() => [...document.querySelectorAll('.heroCopy > *')].map((e) => getComputedStyle(e).animationName));
    ok('reduced motion: the hero copy does not animate', names.every((n) => n === 'none'), names.join(','));
    const before = await page.evaluate(() => document.body.innerHTML.length);
    for (let y = 0; y < 20; y++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(60); }
    const classes = await page.evaluate(() => [...document.querySelectorAll('main [class*="in"], main .is-filled, main [data-card-step]')].filter((e) => /\b(in|is-filled|reveal)\b/.test(e.className)).length);
    ok('no scroll-driven reveals or card states in the page', classes === 0 && before > 0, `${classes} scroll-state classes`);
    await ctx.close();
  }

  // ---- the hero's 3D stage: live jaw, slider, keyboard, drag, labels ----
  {
    const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length;
    const files = ['js/teeth-stage.js', 'assets/models/jaw.glb'];
    const total = files.reduce((n, f) => n + gz(f), 0);
    ok('hero 3D: bundle and model, loaded after the page, stay under 450 KB gzipped', total < 450 * 1024,
      files.map((f) => `${f} ${Math.round(gz(f) / 1024)} KB`).join(' + '));

    // reduced motion: one frame per move, no easing (software WebGL is slow)
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#heroStage.is-live, #heroStage.is-still', { timeout: 180000 });
    const live = await page.evaluate(() => document.getElementById('heroStage').classList.contains('is-live'));
    ok('hero 3D: the live jaw replaces the still image once loaded', live, live ? 'is-live' : 'fell back to stills');
    const read = () => page.evaluate(() => ({
      step: document.querySelector('.stageName').textContent,
      num: document.querySelector('.stageNum').textContent,
      shade: document.querySelector('.stageShade b').textContent,
      text: document.querySelector('.stageRange').getAttribute('aria-valuetext'),
      value: document.querySelector('.stageRange').value,
    }));
    const start = await read();
    ok('hero 3D: starts at step 1 with the yellow shade', start.num === 'Schritt 1 von 5' && start.step === 'Ausgangsfarbe messen' && start.shade === 'A3.5', `${start.num} ${start.step} ${start.shade}`);
    await page.focus('.stageRange');
    await page.keyboard.press('End');
    const end = await read();
    ok('hero 3D: the keyboard reaches the last step and the new shade', end.step === 'Neue Farbe messen' && end.shade === 'BL4' && /Schritt 5 von 5/.test(end.text), end.text);
    await page.keyboard.press('Home');
    await page.evaluate(() => { const r = document.querySelector('.stageRange'); r.value = '60'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    const mid = await read();
    ok('hero 3D: mid-way the gel is working', mid.step === 'Gel wirken lassen' && mid.num === 'Schritt 4 von 5', `${mid.num} ${mid.step} ${mid.shade}`);
    await page.evaluate(() => { const r = document.querySelector('.stageRange'); r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    const box = await page.locator('.stageFrame').boundingBox();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5, { steps: 4 });
    await page.mouse.up();
    const dragged = await read();
    ok('hero 3D: dragging across the model moves the slider', Number(dragged.value) > 30, `value ${dragged.value}`);
    const tag = await page.evaluate(() => {
      const t = document.querySelector('.stageTag'); const r = t.getBoundingClientRect();
      const f = t.closest('.stageFrame').getBoundingClientRect();
      return { text: t.textContent, hidden: !!t.closest('[aria-hidden="true"]'),
        shown: r.width > 0 && getComputedStyle(t).visibility !== 'hidden' && t.scrollWidth <= t.clientWidth + 1 && r.left >= f.left && r.right <= f.right };
    });
    ok('hero 3D: labelled as an illustration, not a result, fully visible and read by screen readers', /kein Behandlungsergebnis/.test(tag.text) && tag.shown && !tag.hidden, tag.text);
    await page.click('#langToggle');
    const en = await read();
    ok('hero 3D: the step caption follows the language', en.step === 'Let the gel work' || /^Step \d of 5$/.test(en.num), `${en.num} ${en.step}`);
    ok('hero 3D: no console or page errors', errors.length === 0, errors.join(' | ') || 'none');
    await ctx.close();
  }

  // ---- without WebGL the slider blends the yellow still into the white one ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(type) ? null : orig.call(this, type, ...rest); };
    });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForSelector('#heroStage.is-still', { timeout: 10000 });
    const op = async (v) => {
      await page.evaluate((val) => { const r = document.querySelector('.stageRange'); r.value = String(val); r.dispatchEvent(new Event('input', { bubbles: true })); }, v);
      return page.evaluate(() => Number(getComputedStyle(document.querySelector('.stagePoster--white')).opacity));
    };
    const [o0, o100] = [await op(0), await op(100)];
    await page.waitForTimeout(300);
    const loaded = await page.evaluate(() => { const i = document.querySelector('.stagePoster--white'); return i.complete && i.naturalWidth > 0; });
    ok('hero without WebGL: the slider blends the yellow still into the white one', o0 === 0 && o100 === 1 && loaded, `opacity ${o0} -> ${o100}, white still loaded: ${loaded}`);
    await ctx.close();
  }

  // ---- no JavaScript: everything readable, booking falls back to links ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(1500); // the hero's CSS entrance runs without JavaScript too; let it finish
    const s = await page.evaluate(() => ({
      h1: getComputedStyle(document.querySelector('h1')).opacity,
      sections: document.querySelectorAll('main section').length,
      noscript: !!document.querySelector('noscript'),
    }));
    ok('without JavaScript the page is complete and readable', s.h1 === '1' && s.sections >= 10 && s.noscript, JSON.stringify(s));
    await ctx.close();
  }

  // ---- phone: the sticky bar steps aside at the booking band ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const atTop = await page.evaluate(() => document.getElementById('mbar').classList.contains('is-away'));
    await page.evaluate(() => document.getElementById('buchen').scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(300);
    const atBooking = await page.evaluate(() => document.getElementById('mbar').classList.contains('is-away'));
    ok('phone booking bar shows on the page and hides at the booking band', !atTop && atBooking, `top:${atTop} booking:${atBooking}`);
    await ctx.close();
  }

  // ---- booking widget: full booking, outage, slot taken ----
  const bookFlow = async (page) => {
    await page.evaluate(() => document.getElementById('buchen').scrollIntoView({ behavior: 'instant' }));
    await page.click('#bkDays .day');
    await page.click('#bkAm .time');
    await page.fill('#bkFirst', 'Test'); await page.fill('#bkLast', 'Satellit');
    await page.fill('#bkPhone', '0241 0000000'); await page.fill('#bkEmail', 'test@example.org');
    await page.check('#bkConsent');
    await page.click('#bkSubmit');
    await page.waitForTimeout(500);
  };
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); const posts = await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await bookFlow(page);
    const done = await page.evaluate(() => !document.getElementById('bkPane3').hidden);
    const p = posts[0] || {};
    ok('a booking reaches the confirmation step', done);
    ok('the booking carries service, source and consent version', p.service === 'bleaching' && p.via === 'bleaching-aachen' && p.consentVersion === 3 && p.consent === true && p.website === '', JSON.stringify({ service: p.service, via: p.via, consentVersion: p.consentVersion, locale: p.locale }));
    const ics = await page.evaluate(() => decodeURIComponent(document.getElementById('bkIcs').getAttribute('href')));
    ok('the calendar file names the practice and the slot', /DTSTART;TZID=Europe\/Berlin:\d{8}T\d{6}/.test(ics) && /AIXSMILE/.test(ics), ics.split('\r\n').slice(4, 8).join(' | '));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page, { fail: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => ({ shown: !document.getElementById('bkUnavailable').hidden, href: document.querySelector('#bkUnavailable a').href }));
    ok('with the API down the widget offers the phone number', s.shown && /^tel:\+4924131202$/.test(s.href), s.href);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page, { book: { ok: false, error: 'taken' } });
    await page.goto(srv.url, { waitUntil: 'load' });
    await bookFlow(page);
    const s = await page.evaluate(() => ({ pane1: !document.getElementById('bkPane1').hidden, note: !document.getElementById('bkTaken').hidden }));
    ok('a slot taken mid-booking returns to the calendar with a note', s.pane1 && s.note, JSON.stringify(s));
    await ctx.close();
  }
} finally { await browser.close(); await srv.close(); }

for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.detail ? `  (${r.detail})` : ''}`);
if (results.some((r) => !r.pass)) process.exit(1);
