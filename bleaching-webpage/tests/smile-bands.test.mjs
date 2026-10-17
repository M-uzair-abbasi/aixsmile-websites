import test from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, mockApi } from '../tools/lib.mjs';

test('responsive hero and three localized smile bands appear in the agreed order', async (t) => {
  const server = await serve();
  const browser = await launch();
  t.after(async () => { await browser.close(); await server.close(); });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await mockApi(page);
  await page.goto(server.url, { waitUntil: 'load' });

  const de = await page.evaluate(() => ({
    heroDesktop: document.querySelector('.heroMedia picture img')?.getAttribute('src'),
    heroMobile: document.querySelector('.heroMedia picture source')?.getAttribute('srcset'),
    order: [
      document.getElementById('faelle')?.nextElementSibling?.id,
      document.getElementById('wann')?.nextElementSibling?.id,
      document.getElementById('faq')?.nextElementSibling?.id,
    ],
    bands: [...document.querySelectorAll('main > figure.smileBand')].map((band) => ({
      id: band.id,
      line: band.querySelector('.smileBand__line')?.textContent.trim(),
      alt: band.querySelector('img')?.alt,
      tag: band.querySelector('.aiTag'),
    })),
    cta: document.querySelector('#smile3 [data-cta="book"]')?.textContent.trim(),
  }));

  assert.equal(de.heroDesktop, 'assets/photos/ai/smile-band-1.webp');
  assert.equal(de.heroMobile, 'assets/photos/ai/smile-band-1-sq.webp');
  assert.deepEqual(de.order, ['smile1', 'smile2', 'smile3']);
  assert.deepEqual(de.bands.map(({ id }) => id), ['smile1', 'smile2', 'smile3']);
  assert.match(de.bands[0].line, /Heller/);
  assert.match(de.bands[2].line, /Der erste Schritt/);
  // no visible AI label (owner's request, 2026-10-07); the alt text still says what the picture is
  assert.ok(de.bands.every(({ alt, tag }) => /KI-generiert/.test(alt) && tag === null));
  assert.equal(de.cta, 'Beratungstermin buchen');

  await page.click('#langToggle');
  await page.waitForTimeout(100);
  const en = await page.evaluate(() => ({
    lines: [...document.querySelectorAll('.smileBand__line')].map((line) => line.textContent.trim()),
    alts: [...document.querySelectorAll('.smileBand img')].map((img) => img.alt),
    cta: document.querySelector('#smile3 [data-cta="book"]')?.textContent.trim(),
  }));
  assert.match(en.lines[0], /Lighter/);
  assert.match(en.lines[1], /Laughing/);
  assert.match(en.lines[2], /first step/);
  assert.ok(en.alts.every((alt) => /AI-generated image/.test(alt)));
  assert.equal(en.cta, 'Book a consultation');
});

// cinematic since 2026-10-17: on phones each band is one screen of photo, the line at its foot
test('phone smile bands fill one screen with the photo, the line at the bottom clear of the booking bar', async (t) => {
  const server = await serve();
  const browser = await launch();
  t.after(async () => { await browser.close(); await server.close(); });

  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mockApi(page);
  await page.goto(server.url, { waitUntil: 'load' });

  const { bands, usable } = await page.evaluate(() => ({
    usable: innerHeight - document.querySelector('.top').getBoundingClientRect().height,
    // (the line has not faded in yet, so it still sits 18px low: measuring now is the strict case)
    bands: [...document.querySelectorAll('.smileBand')].map((band) => {
      const picture = band.querySelector('picture').getBoundingClientRect();
      // the visible words (line, and the button on band 3), not the caption's padded box
      const parts = [...band.querySelectorAll('figcaption > *')].map((el) => el.getBoundingClientRect());
      const caption = { top: Math.min(...parts.map((r) => r.top)), bottom: Math.max(...parts.map((r) => r.bottom)) };
      const whole = band.getBoundingClientRect();
      return {
        coverDelta: Math.abs(picture.height - whole.height) + Math.abs(picture.width - whole.width),
        captionInside: caption.top >= whole.top && caption.bottom <= whole.bottom - document.getElementById('mbar').getBoundingClientRect().height,
        height: whole.height,
      };
    }),
  }));

  assert.equal(bands.length, 3);
  assert.ok(bands.every(({ coverDelta }) => coverDelta <= 2), JSON.stringify(bands));
  assert.ok(bands.every(({ captionInside }) => captionInside), JSON.stringify(bands));
  assert.ok(bands.every(({ height }) => height >= usable * 0.9 && height <= usable), JSON.stringify({ usable, bands }));
});
