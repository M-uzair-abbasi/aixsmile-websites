// Behaviour and weight in a real browser. The booking API is answered from
// fixtures, so nothing here reaches the live practice API.
//   node tools/check-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { serve, launch, mockApi, ROOT } from './lib.mjs';

const results = [];
// SKIP_3D=1 leaves out the three live-3D blocks (minutes under software WebGL) for quick runs
const SKIP_3D = process.env.SKIP_3D === '1';
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
    // lazy images reached at the end of a fast scroll may still be downloading; give them time
    await page.waitForFunction(() => [...document.images].filter((i) => i.getClientRects().length).every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
    // images that are not rendered (the no-JS stills list) never load, by design
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.getClientRects().length && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc || i.src));
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

  // ---- no sideways scroll at any width, German and English ----
  for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768], [901, 700], [900, 800], [768, 1024], [414, 896], [390, 844], [360, 740], [320, 568]]) {
    for (const lang of w <= 414 ? ['de', 'en'] : ['de']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 900, hasTouch: w < 900 });
      const page = await ctx.newPage(); await mockApi(page);
      await page.goto(srv.url, { waitUntil: 'load' });
      if (lang === 'en') { await page.click('#langToggle'); await page.waitForTimeout(150); }
      // html/body clip sideways overflow; lift the clip so overflowing content shows up in the measure
      await page.addStyleTag({ content: 'html, body { overflow-x: visible !important; }' });
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(150);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ok(`no horizontal overflow at ${w}x${h} (${lang})`, over <= 0, `${over}px`);
      await ctx.close();
    }
  }

  // ---- the sections in the agreed order ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const order = await page.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => s.id || 'hero'));
    const want = ['hero', 'behandler', 'behandlung', 'faelle', 'messen', 'methoden', 'wann', 'kosten', 'buchen', 'faq', 'praxis'];
    ok('sections in the agreed order', JSON.stringify(order) === JSON.stringify(want), order.join(' → '));
    await ctx.close();
  }

  // ---- language switch round trip ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    // the entrance wraps the headline's lines for a few seconds (2026-10-18); take the authored text once it is plain again
    await page.waitForFunction(() => document.documentElement.classList.contains('is-revealed') && !document.querySelector('h1 .heroLine'), null, { timeout: 20000 });
    const before = await page.evaluate(() => ({ h1: document.querySelector('h1').innerHTML, title: document.title }));
    await page.click('#langToggle');
    const en = await page.evaluate(() => ({ h1: document.querySelector('h1').textContent, title: document.title, lang: document.documentElement.lang}));
    ok('English applies to headline, title and html lang', /whitening in Aachen, measured before and after/.test(en.h1) && /whitening/i.test(en.title) && en.lang === 'en', `${en.h1} | ${en.lang}`);
    await page.reload({ waitUntil: 'load' });
    const kept = await page.evaluate(() => document.documentElement.lang);
    ok('the language choice survives a reload', kept === 'en', kept);
    await page.click('#langToggle');
    const back = await page.evaluate(() => ({ h1: document.querySelector('h1').innerHTML, title: document.title }));
    ok('German comes back exactly as authored', back.h1 === before.h1 && back.title === before.title, back.h1);
    await ctx.close();
  }

  // ---- hero: two buttons, no visible AI label (removed at the owner's request, 2026-10-07) ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const h = await page.evaluate(() => ({
      book: document.querySelector('.heroCta .btn[data-cta="book"]')?.getAttribute('href'),
      cases: document.querySelector('.heroCta .btn.ghost')?.getAttribute('href'),
      labels: document.querySelectorAll('.aiTag').length,
      plain: !document.querySelector('h1 em, h2 em, main .eyebrow'),
    }));
    ok('hero: a book button to #buchen and a cases button to #faelle', h.book === '#buchen' && h.cases === '#faelle', JSON.stringify(h));
    // plain voice (2026-10-15): upright headings without an italic phrase, no labels above them
    ok('hero: no visible AI labels, headings upright and without section labels', h.labels === 0 && h.plain, JSON.stringify(h));
    await ctx.close();
  }

  // ---- doctor: portrait, quote, three facts, right after the hero ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const d = await page.evaluate(() => ({
      next: document.querySelector('main > section.hero').nextElementSibling?.id,
      photo: document.querySelector('.doctorFeature__photo img')?.getAttribute('src'),
      quote: document.querySelector('.doctorFeature__quote p')?.textContent,
      facts: document.querySelectorAll('.doctorFeature__facts > span').length,
    }));
    ok('doctor: follows the hero, suit portrait, quote and three facts', d.next === 'behandler' && /doctor-molaie/.test(d.photo || '') && /Lebensfreude/.test(d.quote || '') && d.facts === 3, JSON.stringify(d));
    await ctx.close();
  }

  // ---- phone: the cases are drag-to-compare sliders, stacked, inside the page ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('is-revealed'), null, { timeout: 30000 }).catch(() => {});
    await page.evaluate(() => { const el = document.getElementById('faelle'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 58); });
    await page.waitForTimeout(1500);
    const pos = () => page.evaluate(() => parseFloat(document.querySelectorAll('#faelle .compare')[1].style.getPropertyValue('--pos')) || 50);
    const setup = await page.evaluate(() => {
      const f = [...document.querySelectorAll('#faelle .compare')];
      const r = f.map((el) => el.getBoundingClientRect());
      return { n: f.length, stacked: r.length === 2 && r[1].top >= r[0].bottom, labels: f.every((el) => (el.querySelector('.compareRange')?.getAttribute('aria-label') || '').length > 5),
        pairs: f.every((el) => /cmp-after/.test(el.querySelector('img.compareAfter')?.src) && /cmp-before/.test(el.querySelector('.compareBefore img')?.src)) };
    });
    const box = await page.locator('#faelle .compare').nth(1).boundingBox();
    const cdp = await ctx.newCDPSession(page);
    const touch = async (pts) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
      for (const [x, y] of pts.slice(1)) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(300);
    };
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    await touch(Array.from({ length: 13 }, (_, k) => [cx - k * box.width * 0.03, cy]));
    const afterDrag = await pos();
    const y0 = await page.evaluate(() => scrollY);
    await touch(Array.from({ length: 13 }, (_, k) => [cx + 20, cy + 40 - k * 25]));
    const afterSwipe = { pos: await pos(), scrolled: (await page.evaluate(() => scrollY)) - y0 };
    const wider = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok('phone: cases stack as two before/after sliders with labels', setup.n === 2 && setup.stacked && setup.labels && setup.pairs, JSON.stringify(setup));
    ok('phone: a sideways drag moves the divider, an upward swipe still scrolls the page, which does not widen',
      afterDrag < 25 && Math.abs(afterSwipe.pos - afterDrag) < 1 && afterSwipe.scrolled > 100 && wider <= 0, JSON.stringify({ afterDrag, afterSwipe, wider }));
    await ctx.close();
  }

  // ---- laptop: the hero's real case moves once by itself; the shade guide answers a tap ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage(); await mockApi(page);
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('is-revealed'), null, { timeout: 30000 }).catch(() => {});
    const seen = new Set();
    for (let i = 0; i < 16; i++) { await page.waitForTimeout(250); seen.add(await page.evaluate(() => Math.round(parseFloat(getComputedStyle(document.querySelector('.heroCompare')).getPropertyValue('--pos'))))); }
    const hero = await page.evaluate(() => ({ src: document.querySelector('.heroCompare img.compareAfter')?.getAttribute('src'), link: document.querySelector('.heroCaseText a')?.getAttribute('href') }));
    ok('hero: the real case slider sweeps once on its own and links to the cases', [...seen].some((v) => v < 40) && [...seen].some((v) => v > 60) && /case-1-cmp-after/.test(hero.src || '') && hero.link === '#faelle', JSON.stringify({ seen: [...seen], ...hero }));
    await page.evaluate(() => { const el = document.getElementById('messen'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 64); });
    await page.waitForTimeout(1200);
    const start = await page.evaluate(() => document.querySelector('.shadeCode')?.textContent);
    await page.click('#messen .tab--bl3');
    const picked = await page.evaluate(() => ({ code: document.querySelector('.shadeCode')?.textContent, note: !document.querySelector('.shadeNote--picked')?.hidden, pressed: document.querySelectorAll('#messen .tab[aria-pressed="true"]').length }));
    ok('shade guide: the example shows first, a tapped sample tooth shows its own code', /A3.*B1/.test(start || '') && picked.code === 'BL3' && picked.note && picked.pressed === 1, JSON.stringify({ start, ...picked }));
    ok('no script errors with the hero slider and the shade guide', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- laptop: the slider answers the keyboard, and only its button opens the whole photo ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.classList.contains('is-revealed'), null, { timeout: 30000 }).catch(() => {});
    await page.evaluate(() => { const el = document.getElementById('faelle'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 64); });
    await page.waitForTimeout(1500);
    const box = await page.locator('#faelle .compare').first().boundingBox();
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5);
    const lbAfterClick = await page.evaluate(() => document.getElementById('lightbox').hidden);
    const clickPos = await page.evaluate(() => parseFloat(document.querySelector('#faelle .compare').style.getPropertyValue('--pos')));
    await page.focus('#faelle .compare .compareRange');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
    const keyPos = await page.evaluate(() => parseFloat(document.querySelector('#faelle .compare').style.getPropertyValue('--pos')));
    await page.locator('#faelle .compare .expand').first().click();
    const lb = await page.evaluate(() => ({ open: !document.getElementById('lightbox').hidden, src: document.getElementById('lbImg').getAttribute('src') }));
    ok('laptop: a click moves the divider, arrow keys step it, the button opens the whole photo',
      lbAfterClick && Math.abs(clickPos - 30) < 2 && Math.abs(keyPos - clickPos - 2) < 1.5 && lb.open && /case-1\.jpg/.test(lb.src), JSON.stringify({ lbAfterClick, clickPos, keyPos, lb }));
    await ctx.close();
  }

  // ---- methods: three ways beside one photo, and the nav points at sections that exist ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const m = await page.evaluate(() => ({
      cards: document.querySelectorAll('#methoden .way').length,
      missing: [...document.querySelectorAll('.navLinks a')].map((a) => a.getAttribute('href')).filter((h) => !document.querySelector(h)),
      old: !!document.getElementById('zwei-wege') || !!document.getElementById('ablauf'),
    }));
    ok('methods: three ways beside one photo; every nav link has its section; the old routes and Ablauf are gone', m.cards === 3 && m.missing.length === 0 && !m.old, JSON.stringify(m));
    await ctx.close();
  }

  // ---- phone: the stain explorer shows one large picture and six samples to tap; costs are a cost-plan sheet with three price factors ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const state = () => page.evaluate(() => {
      const stage = document.querySelector('.stainStage').getBoundingClientRect();
      const on = [...document.querySelectorAll('.stainStage img')].map((i) => i.classList.contains('is-on'));
      const text = [...document.querySelectorAll('.stainText')].map((t) => getComputedStyle(t).visibility === 'visible');
      const samples = [...document.querySelectorAll('#wann .stainPick .stainSample')].map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
      return { stageW: Math.round(stage.width), on: on.indexOf(true), shown: text.indexOf(true), nShown: text.filter(Boolean).length, samples };
    });
    const first = await state();
    await page.evaluate(() => document.querySelectorAll('#wann .stainPick')[4].click());
    await page.waitForTimeout(600);   // the old words fade out over .35 s
    const second = await state();
    const c = await page.evaluate(() => ({
      plan: !!document.querySelector('#kosten [data-i18n="kosten.plan"]'),
      sheet: !!document.querySelector('#kosten .costSheet'),
      factors: document.querySelectorAll('#kosten .factors li').length,
      afterMethods: document.getElementById('methoden').nextElementSibling?.id,
    }));
    ok('phone: the stain explorer shows one large picture and its words, a tap on a sample switches both; costs are a cost-plan sheet with three factors',
      first.stageW >= 340 && first.on === 0 && first.shown === 0 && first.nShown === 1 && second.on === 4 && second.shown === 4 && second.nShown === 1
        && first.samples.length === 6 && first.samples.every((r) => r.w >= 90 && r.h >= 45)
        && c.plan && c.sheet && c.factors === 3 && c.afterMethods === 'wann', JSON.stringify({ first, second, ...c }));
    await ctx.close();
  }

  // ---- booking band dark, FAQ in two columns, practice facts, editorial footer ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const b = await page.evaluate(() => ({
      dark: document.getElementById('buchen').classList.contains('tone-night'),
      faqCols: getComputedStyle(document.querySelector('.faq')).gridTemplateColumns.split(' ').length,
      whenThumbs: [...document.querySelectorAll('#wann .stainSample')].map((el) => {
        const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) };
      }),
      facts: document.querySelectorAll('.praxisFacts > div').length,
      lead: document.querySelector('.colophonLead')?.textContent.trim(),
      mini: !!document.getElementById('miniToggle') && !!document.getElementById('miniSlots'),
    }));
    // the teeth samples stay readable (cropped to the teeth, at least 110x55) beside the large picture, and the section fits one laptop screen
    ok('lower page: readable teeth samples, dark booking, two-column FAQ, practice facts and footer intact',
      b.dark && b.faqCols === 2 && b.whenThumbs.length === 6 && b.whenThumbs.every((r) => r.w >= 110 && r.h >= 55)
        && b.facts === 3 && b.lead === 'It’s time to smile.' && b.mini, JSON.stringify(b));
    await ctx.close();
  }

  // ---- motion: sections arrive once; nothing follows the scroll position ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const names = await page.evaluate(() => [...document.querySelectorAll('.heroCopy > *')].map((e) => getComputedStyle(e).animationName));
    ok('reduced motion: the hero copy does not animate', names.every((n) => n === 'none'), names.join(','));
    const calm = await page.evaluate(() => document.documentElement.classList.contains('m-calm'));
    ok('reduced motion: arrivals play as plain fades (html.m-calm)', calm);
    const count = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).length, sel);
    for (let y = 0; y < 40; y++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(80); }
    await page.waitForTimeout(1200);
    // counted at the end: blocks hidden meanwhile (the 3D hint in stills mode) do not count
    const marked = await count('.m-rise, .m-wipe');
    const arrived = await count('.m-rise.m-in, .m-wipe.m-in');
    ok('every marked block has arrived after scrolling through the page', marked > 20 && arrived === marked, `${arrived} of ${marked}`);
    const sample = () => page.evaluate(() => [...document.querySelectorAll('.m-in')].slice(0, 40).map((e) => getComputedStyle(e).opacity + getComputedStyle(e).transform).join('|'));
    const atEnd = await sample();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(600);
    const atTop = await sample();
    const still = await count('.m-rise.m-in, .m-wipe.m-in');
    ok('arrivals are one-time and do not follow the scroll position', still === arrived && atTop === atEnd, `${still} still in; styles ${atTop === atEnd ? 'unchanged' : 'changed'}`);
    await ctx.close();
  }

  // ---- hero on short phones and mid-size laptops; the 3D instruction's wording ----
  for (const [w, h] of [[375, 667], [360, 740]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const f = await page.evaluate(() => {
      const bar = document.getElementById('mbar').getBoundingClientRect().height;
      return { limit: Math.round(innerHeight - bar), buttons: [...document.querySelectorAll('.heroCta .btn')].map((b) => Math.round(b.getBoundingClientRect().bottom)) };
    });
    ok(`hero ${w}x${h}: both buttons sit above the sticky booking bar`, f.buttons.length === 2 && f.buttons.every((b) => b <= f.limit), JSON.stringify(f));
    await ctx.close();
  }
  // the portrait fades in behind the copy (2026-10-17), so measure what the eye
  // gets: hide the text, photograph the hero, and hold every line of copy
  // against the pixels actually behind it (2nd percentile, so grain is no excuse)
  for (const [w, h, lang] of [[901, 800, 'de'], [1000, 800, 'de'], [1100, 800, 'de'], [1280, 800, 'de'], [1440, 900, 'de'], [390, 844, 'de'], [360, 800, 'de'], [375, 667, 'de'],
    [901, 800, 'en'], [1440, 900, 'en'], [360, 800, 'en']]) {
    const phone = w < 700;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page);
    if (lang === 'en') await page.addInitScript(() => { try { localStorage.setItem('aixsmileLang', 'en'); } catch (e) {} });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForFunction(() => !document.getElementById('splash'), null, { timeout: 15000 }).catch(() => {});
    const lines = await page.evaluate(() => {
      // only what is on screen above the phone booking bar; the screenshot holds nothing else
      const bar = document.getElementById('mbar'), floor = innerHeight - (bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().height : 0);
      const out = [], walk = document.createTreeWalker(document.querySelector('.heroCopy'), NodeFilter.SHOW_TEXT);
      for (let n; (n = walk.nextNode());) {
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest('.btn:not(.ghost)')) continue;   // filled buttons carry their own background
        const cs = getComputedStyle(el), px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of r.getClientRects()) if (q.bottom <= floor) out.push({ x: q.left, y: q.top, w: q.width, h: q.height, color: cs.color, need: large ? 3 : 4.5, text: n.textContent.trim().slice(0, 24) });
      }
      return out;
    });
    if (!phone) {
      const card = await page.evaluate(() => Math.round(document.querySelector('.heroCase').getBoundingClientRect().right));
      ok(`hero ${w}x${h} ${lang}: the real-case card stays on screen`, card <= w - 16, `right=${card}`);
    }
    await page.addStyleTag({ content: '.heroCopy, .heroCopy * { color: transparent !important; } .heroCopy .hl::after { visibility: hidden; } .cookieChip { display: none !important; }' });   // the cookie note leaves after a few seconds
    const cdp = await page.context().newCDPSession(page);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' }); await cdp.detach();
    const res = await page.evaluate(async ({ data, lines }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const k = img.width / innerWidth;   // screenshot pixels per CSS pixel
      const lum = (r, g, b) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
      return lines.map((l) => {
        const lt = lum(...l.color.match(/[\d.]+/g).slice(0, 3).map(Number));
        const d = cx.getImageData(Math.max(0, Math.floor(l.x * k)), Math.max(0, Math.floor(l.y * k)), Math.max(1, Math.ceil(l.w * k)), Math.max(1, Math.ceil(l.h * k))).data, ratios = [];
        for (let i = 0; i < d.length; i += 4) { const lb = lum(d[i], d[i + 1], d[i + 2]); ratios.push((Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05)); }
        ratios.sort((a, b) => a - b);
        return { text: l.text, need: l.need, ratio: +ratios[Math.floor(ratios.length * 0.02)].toFixed(2) };
      });
    }, { data, lines });
    const bad = res.filter((r) => r.ratio < r.need);
    ok(`hero ${w}x${h} ${lang}: every line of copy keeps its contrast on the photo behind it`, res.length >= 5 && bad.length === 0,
      JSON.stringify(bad.length ? bad : { lines: res.length, lowest: Math.min(...res.map((r) => r.ratio)) }));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    const de = await page.evaluate(() => document.querySelector('.procedure__hint').textContent);
    await page.click('#langToggle'); await page.waitForTimeout(150);
    const en = await page.evaluate(() => document.querySelector('.procedure__hint').textContent);
    ok('3D instruction names the right half of the picture (also true on phones)', /rechte Bildhälfte/.test(de) && /right half/.test(en), `${de} | ${en}`);
    await ctx.close();
  }

  // ---- the 3D treatment section: live stage, hold to play, dots, shade, captions, language ----
  if (!SKIP_3D) {
    const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(ROOT, f)), { level: 9 }).length;
    const files = ['js/bleach-stage.js', 'assets/models/dentition.glb'];
    const total = files.reduce((n, f) => n + gz(f), 0);
    ok('3D: bundle and model (loaded only near the section) stay under 1,250 KB gzipped', total < 1250 * 1024,
      files.map((f) => `${f} ${Math.round(gz(f) / 1024)} KB`).join(' + '));

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const first = await page.evaluate(() => ({
      early: performance.getEntriesByType('resource').some((e) => /dentition\.glb/.test(e.name)),
      below: document.querySelector('#behandlung .procedure__view').getBoundingClientRect().top > innerHeight,
    }));
    // (before the doctor section moves in, the 3D starts inside the first screen and rightly loads at once)
    ok('3D: the model is not fetched with the first paint when the section starts below the fold', !first.below || !first.early, JSON.stringify(first));
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => /\bis-(3d|stills)\b/.test(document.getElementById('behandlung').className), null, { timeout: 180000 });
    const live = await page.evaluate(() => document.getElementById('behandlung').classList.contains('is-3d'));
    ok('3D: the live dentition replaces the still once loaded', live, live ? 'is-3d' : 'fell back to stills');
    const read = () => page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      return { num: q('.procedure__num').textContent, title: q('.procedure__title').textContent, shade: q('.procedure__shade b').textContent,
        cta: !q('.procedure__cta').hidden, p: window.aixsmileTreatment.progress() };
    });
    const start = await read();
    ok('3D: starts at step 1 with the yellow shade', start.num === '01' && start.title === 'Ausgangsfarbe messen' && start.shade === 'A3.5', `${start.num} ${start.title} ${start.shade}`);
    const hold = await page.locator('.procedure__hold').boundingBox();
    await page.mouse.move(hold.x + hold.width * 0.6, hold.y + hold.height * 0.5);
    // software WebGL draws about a frame a second here, so hold until the playhead moves (real GPUs take ~0.4 s)
    await page.mouse.down();
    const moved = await page.waitForFunction(() => window.aixsmileTreatment.progress() > 0.03, null, { timeout: 30000 }).then(() => true, () => false);
    await page.mouse.up();
    const held = await read();
    ok('3D: pressing and holding plays the treatment', moved && held.p > 0.03, `progress ${held.p.toFixed(3)}`);
    await page.waitForTimeout(800);
    const paused = await read();
    ok('3D: letting go pauses it', paused.p - held.p < 0.02, `${held.p.toFixed(3)} -> ${paused.p.toFixed(3)}`);
    const anchor = (k) => page.evaluate(async (s) => (await import('/js/bleach-timeline.js')).stepAnchor(s), k);
    await page.click('.procedure__dots button[data-step="4"]'); await page.waitForTimeout(400);
    const end = await read();
    ok('3D: the last dot shows the new shade and the booking link', end.num === '05' && end.title === 'Neue Farbe messen' && end.shade === 'BL4' && end.cta, `${end.num} ${end.title} ${end.shade} cta:${end.cta}`);
    ok('3D: with reduced motion a dot jumps without gliding', Math.abs(end.p - await anchor(4)) < 0.005, end.p.toFixed(4));
    await page.click('.procedure__dots button[data-step="3"]'); await page.waitForTimeout(400);
    const mid = await read();
    ok('3D: step 4 shows the gel working at B1', mid.num === '04' && mid.title === 'Gel wirken lassen' && mid.shade === 'B1', `${mid.num} ${mid.title} ${mid.shade}`);
    const tag = await page.evaluate(() => {
      const t = document.querySelector('.procedure__tag'); const r = t.getBoundingClientRect();
      const v = t.closest('.procedure__view').getBoundingClientRect();
      return { text: t.textContent, hidden: !!t.closest('[aria-hidden="true"]'), shown: r.width > 0 && r.left >= v.left && r.right <= v.right && t.scrollWidth <= t.clientWidth + 1 };
    });
    ok('3D: labelled as an illustration, not a result, fully visible and read by screen readers', /kein Behandlungsergebnis/.test(tag.text) && tag.shown && !tag.hidden, tag.text);
    await page.click('#langToggle'); await page.waitForTimeout(200);
    const en = await read();
    ok('3D: the caption follows the language, the playhead stays', en.title === 'Let the gel work' && Math.abs(en.p - mid.p) < 1e-6, `${en.title} p ${en.p.toFixed(4)}`);
    const dotLabel = await page.evaluate(() => document.querySelector('.procedure__dots button[data-step="3"]').getAttribute('aria-label'));
    ok('3D: the dots are labelled in the page language', dotLabel === 'Let the gel work', dotLabel);
    await page.click('#langToggle');
    // a lost WebGL context (a phone switching apps) falls back to the stills
    await page.evaluate(() => document.querySelector('.procedure__canvas').getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext());
    await page.waitForTimeout(500);
    const lost = await page.evaluate(() => ({ stills: document.getElementById('behandlung').classList.contains('is-stills'), src: document.querySelector('.procedure__poster').getAttribute('src') }));
    ok('3D: a lost WebGL context falls back to the stills', lost.stills && /step-4\.webp$/.test(lost.src), JSON.stringify(lost));
    ok('3D: no console or page errors', errors.length === 0, errors.join(' | ') || 'none');
    await ctx.close();
  }

  // ---- phone: a swipe that starts on the 3D scrolls the page instead of playing ----
  if (!SKIP_3D) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForFunction(() => /\bis-(3d|stills)\b/.test(document.getElementById('behandlung').className), null, { timeout: 180000 });
    await page.evaluate(() => {
      const h = document.querySelector('.procedure__hold'); const r = h.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const ev = (type, dy) => h.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y + dy, button: 0 }));
      ev('pointerdown', 0); ev('pointermove', -30);
      window.__ev = ev;
    });
    await page.waitForTimeout(700);
    const p = await page.evaluate(() => window.aixsmileTreatment.progress());
    await page.evaluate(() => window.__ev('pointerup', -30));
    ok('phone: a swipe starting on the 3D scrolls instead of playing', p === 0, `progress ${p}`);
    await ctx.close();
  }

  // ---- without WebGL the dots switch between the five stills ----
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/i.test(type) ? null : orig.call(this, type, ...rest); };
    });
    const page = await ctx.newPage(); await mockApi(page, { live3d: true });
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('behandlung').scrollIntoView({ behavior: 'instant' }));
    await page.waitForSelector('#behandlung.is-stills', { timeout: 20000 });
    await page.click('.procedure__dots button[data-step="4"]');
    await page.waitForTimeout(600);
    const s = await page.evaluate(() => {
      const img = document.querySelector('.procedure__poster');
      return { src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0, hint: getComputedStyle(document.querySelector('.procedure__hold')).display,
        text: getComputedStyle(document.querySelector('.procedure__hint')).display };
    });
    ok('without WebGL the dots switch the stills; the hold button and its instruction are hidden', /step-5\.webp$/.test(s.src) && s.loaded && s.hint === 'none' && s.text === 'none', JSON.stringify(s));
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
