// Freshness: no run of 8 words on this page may appear on the veneers page or
// in the main site's bleaching text (the strategy's "no shared paragraph" rule).
// Practice facts that must be identical everywhere (address, phone, hours,
// languages) are allowed.   node tools/check-fresh.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadI18n } from './lib.mjs';

const N = 8;
const SOURCES = [
  path.join(ROOT, '..', 'veneer-webpage', 'index.html'),
  '/home/muhammad-uzair/aixsmile/content/treatments/bleaching.ts',
];
const ALLOW = /(großkölnstraße|52062|31202|4018150|praxis aixsmile de|farsi|türkisch|turkish|9 00 16 00)/;

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;|&#\d+;/g, ' ');
const words = (s) => (decode(s).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
const grams = (ws) => { const g = new Set(); for (let i = 0; i + N <= ws.length; i++) g.add(ws.slice(i, i + N).join(' ')); return g; };
// Tags and string quotes are boundaries: a run of words only counts when it
// sits inside one element or one string, so short labels that happen to stand
// next to each other on both pages (form fields, footer links) are not a hit.
const SEP = '\u0000';
const strip = (html, keepScripts) => {
  let s = html.replace(/<style[\s\S]*?<\/style>/gi, SEP);
  if (!keepScripts) s = s.replace(/<script[\s\S]*?<\/script>/gi, SEP);
  return s.replace(/<[^>]+>/g, SEP);
};
const pieces = (text) => text.split(/[\u0000'"`]/);

// the other sites: everything they say, including their script dictionaries
const source = new Set();
for (const f of SOURCES) {
  const raw = fs.readFileSync(f, 'utf8');
  for (const piece of pieces(f.endsWith('.html') ? strip(raw, true) : raw)) for (const g of grams(words(piece))) source.add(g);
}

// this site: the visible German, plus every English and runtime string
const { EN, DYN } = await loadI18n();
const strings = [];
const collect = (o) => { for (const v of Object.values(o)) { if (typeof v === 'string') strings.push(v); else if (Array.isArray(v)) v.flat().forEach((x) => typeof x === 'string' && strings.push(x)); else if (v && typeof v === 'object') collect(v); } };
collect(EN); collect(DYN);
const mine = [...pieces(strip(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), false)), ...strings];

const hits = new Set();
for (const p of mine) for (const g of grams(words(p))) if (source.has(g) && !ALLOW.test(g)) hits.add(g);

if (hits.size) {
  console.log(`FAIL ${hits.size} shared ${N}-word runs:`);
  for (const h of hits) console.log(`  "${h}"`);
  process.exit(1);
}
console.log(`PASS freshness: no ${N}-word run shared with the veneers page or the main site's bleaching text.`);
