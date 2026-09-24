// One real booking, end to end, against a LOCAL dev server of the main app:
// the page's widget loads real slots, books one, and the appointment is read
// back from that dev server's SQLite database with its source tag.
//
//   DATA_DIR=<dir of the dev server's aixsmile.db> node tools/book-local.mjs http://localhost:3001
//
// Refuses anything that is not localhost, so it can never book on the live
// system. Run the dev server without TURSO_* / RESEND_API_KEY / VAPID_* set:
// then it writes to local SQLite and sends no mail and no push.
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { serve, launch } from './lib.mjs';

const api = process.argv[2] || 'http://localhost:3001';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(api)) { console.error(`refusing non-local API ${api}`); process.exit(2); }
const dbFile = path.join(process.env.DATA_DIR || path.join(os.homedir(), 'aixsmile', '.data'), 'aixsmile.db');
const email = `bleaching-e2e-${Date.now()}@example.org`;

const srv = await serve();
const browser = await launch();
let ok = false;
try {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${srv.url}?api=${encodeURIComponent(api)}`, { waitUntil: 'load' });
  await page.waitForSelector('#bkDays .day', { timeout: 120000 });
  const base = await page.evaluate(() => window.__booking.apiBase);
  if (base !== api) throw new Error(`widget is talking to ${base}, not ${api}`);
  await page.evaluate(() => document.getElementById('buchen').scrollIntoView({ behavior: 'instant' }));
  const dayButtons = await page.$$('#bkDays .day');
  await dayButtons[Math.min(1, dayButtons.length - 1)].click(); // tomorrow or later: never a slot that is passing right now
  await page.click('#bkTimesWrap .time');
  const picked = await page.evaluate(() => document.getElementById('bkPickWhen').textContent);
  await page.click('#bkGender button');
  await page.fill('#bkFirst', 'Erika');
  await page.fill('#bkLast', 'Bleaching-Satellit');
  await page.fill('#bkPhone', '0241 0000000');
  await page.fill('#bkEmail', email);
  await page.check('#bkConsent');
  await page.click('#bkSubmit');
  await page.waitForSelector('#bkPane3:not([hidden])', { timeout: 120000 });
  console.log(`PASS the widget booked ${picked} and shows the confirmation`);

  const db = new DatabaseSync(dbFile, { readOnly: true });
  const row = db.prepare('select date, time, service, via, locale, consent_version, status from appointments where email = ?').get(email);
  db.close();
  if (!row) throw new Error(`no appointment for ${email} in ${dbFile}`);
  console.log(`PASS stored in ${dbFile}: ${JSON.stringify(row)}`);
  if (row.via !== 'bleaching-aachen') throw new Error(`via is ${row.via}`);
  console.log('PASS the booking carries via=bleaching-aachen, so the admin list shows it with the satellite badge');
  if (errors.length) throw new Error(errors.join(' | '));
  ok = true;
} catch (e) {
  console.log(`FAIL ${e.message}`);
} finally { await browser.close(); await srv.close(); }
process.exit(ok ? 0 : 1);
