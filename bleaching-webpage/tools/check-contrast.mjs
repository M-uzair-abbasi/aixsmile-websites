// WCAG AA contrast for every piece of visible text, laptop and phone, including
// every section and every booking pane (forced visible with fixture data).
// Semi-transparent backgrounds are composited over the worst case: black for
// dark text, white for light text.   node tools/check-contrast.mjs
import { serve, launch, mockApi } from './lib.mjs';

const VIEWS = [{ width: 1280, height: 800, mobile: false }, { width: 390, height: 844, mobile: true }];

function audit() {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const visible = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
    }
    const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
  };
  const bgOf = (el, textColor) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    // worst case under anything still translucent
    let base = lum(textColor) > 0.4 ? [255, 255, 255, 1] : [0, 0, 0, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  const fails = []; let checked = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    if (!t.textContent.trim() || !el || seen.has(el) || el.closest('script,style,noscript,.hp,.brand')  /* the wordmark is a logotype: exempt under WCAG 1.4.3 */) continue;
    seen.add(el);
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const fg0 = parse(cs.color); if (!fg0) continue;
    let bg = bgOf(el, fg0);
    // The active language label sits on the toggle's light pill, which is a
    // ::before pseudo-element the walk above cannot see. Use the pill colour.
    // Hero text sits on a photo under a dark gradient; its section colour is
    // the charcoal the gradient fades to on the text side.
    const toggle = el.closest('.langToggle');
    if (toggle && el.dataset.lang === toggle.dataset.active) bg = parse(getComputedStyle(toggle, '::before').backgroundColor);
    const fg = fg0[3] < 1 ? over(fg0, bg) : fg0;
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, bg); checked++;
    if (r < need) fails.push(`${r.toFixed(2)}:1 (need ${need}) "${t.textContent.trim().slice(0, 50)}" <${el.tagName.toLowerCase()} class="${el.className}">`);
  }
  return { checked, fails };
}

const srv = await serve();
const browser = await launch();
let total = 0; const all = [];
try {
  for (const v of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await mockApi(page);
    await page.goto(srv.url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // every booking pane, a picked day and time, the error and info notes
    await page.evaluate(() => {
      document.querySelector('#bkDays .day')?.click();
      ['bkPane1', 'bkPane2', 'bkPane3', 'bkUnavailable', 'bkTaken', 'bkNoteWrap'].forEach((id) => { const e = document.getElementById(id); if (e) e.hidden = false; });
      const err = document.getElementById('bkError'); err.textContent = 'Bitte füllen Sie die Pflichtfelder aus.'; err.hidden = false;
      document.getElementById('bkPickWhen').textContent = 'Mo, 5. Okt · 09:30 Uhr';
      document.getElementById('bkDoneWhen').textContent = 'Montag, 5. Oktober · 09:30 Uhr';
      const pf = document.getElementById('priceFrom'); pf.textContent = 'Bleaching in der Praxis ab 290 €.'; pf.hidden = false;
      document.querySelectorAll('.faq details').forEach((d) => { d.open = true; });
    });
    await page.waitForTimeout(200);
    for (const lang of ['de', 'en']) {
      if (lang === 'en') { await page.click('#langToggle'); await page.waitForTimeout(150); }
      const { checked, fails } = await page.evaluate(audit);
      total += checked;
      fails.forEach((f) => all.push(`${v.width}px ${lang}: ${f}`));
    }
    await ctx.close();
  }
} finally { await browser.close(); await srv.close(); }
if (all.length) { console.log(all.map((f) => `FAIL ${f}`).join('\n')); process.exit(1); }
console.log(`PASS contrast: ${total} text elements checked across laptop and phone, German and English; all meet WCAG AA.`);
