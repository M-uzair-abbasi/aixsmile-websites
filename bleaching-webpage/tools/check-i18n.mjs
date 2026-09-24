// Every translatable element in index.html has an English string, no English
// string is orphaned, and the runtime strings exist in both languages with the
// same shape.   node tools/check-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadI18n } from './lib.mjs';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const { EN, DYN, getPath } = await loadI18n();
const problems = [];

const used = new Set();
for (const attr of ['data-i18n', 'data-i18n-alt', 'data-i18n-aria']) {
  for (const m of html.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))) used.add(m[1]);
}
for (const key of used) {
  const v = getPath(EN, key);
  if (typeof v !== 'string' || !v.trim()) problems.push(`missing English for "${key}"`);
}
const flat = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${pre}${k}.`) : [`${pre}${k}`]));
for (const key of flat(EN)) if (!used.has(key)) problems.push(`English string "${key}" is not used by any element`);

const shape = (v) => (Array.isArray(v) ? `array(${v.length})` : typeof v === 'function' ? `function(${v.length})` : v && typeof v === 'object' ? 'object' : typeof v);
const walk = (a, b, pre) => {
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (!(k in a) || !(k in b)) { problems.push(`runtime string "${pre}${k}" exists in only one language`); continue; }
    if (shape(a[k]) !== shape(b[k])) problems.push(`runtime string "${pre}${k}" differs in shape: ${shape(a[k])} vs ${shape(b[k])}`);
    else if (shape(a[k]) === 'object') walk(a[k], b[k], `${pre}${k}.`);
  }
};
walk(DYN.de, DYN.en, '');

console.log(`${used.size} translatable keys in the page, ${flat(EN).length} English strings.`);
if (problems.length) { console.log(problems.map((p) => `FAIL ${p}`).join('\n')); process.exit(1); }
console.log('PASS i18n: every key has English, nothing orphaned, runtime strings match.');
