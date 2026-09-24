// Structured data: the JSON-LD parses, carries Dentist + WebPage + FAQPage, the
// practice details are identical to the veneers page (one practice, one NAP),
// and the FAQ markup says exactly what the visible FAQ says.
//   node tools/check-schema.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const problems = [];
const ld = (file) => {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  return { html, data: JSON.parse(m[1]) };
};
const mine = ld(path.join(ROOT, 'index.html'));
const sibling = ld(path.join(ROOT, '..', 'veneer-webpage', 'index.html'));
const byType = (d, t) => d['@graph'].find((n) => n['@type'] === t);

for (const t of ['Dentist', 'WebPage', 'FAQPage']) if (!byType(mine.data, t)) problems.push(`no ${t} node`);

const a = byType(mine.data, 'Dentist'), b = byType(sibling.data, 'Dentist');
for (const k of ['@id', 'name', 'url', 'telephone', 'email', 'address', 'openingHoursSpecification', 'sameAs']) {
  if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) problems.push(`Dentist.${k} differs from the veneers page: ${JSON.stringify(a[k])} vs ${JSON.stringify(b[k])}`);
}
if (!/bleaching/i.test(a.availableService?.name || '')) problems.push('Dentist.availableService does not name bleaching');
const page = byType(mine.data, 'WebPage');
if (page.url !== 'https://bleaching-aachen.de/') problems.push(`WebPage.url is ${page.url}`);
const title = mine.html.match(/<title>([^<]+)<\/title>/)[1].replace(/&amp;/g, '&');
if (page.name !== title) problems.push(`WebPage.name "${page.name}" is not the <title> "${title}"`);
const canonical = mine.html.match(/<link rel="canonical" href="([^"]+)"/)[1];
if (canonical !== page.url) problems.push(`canonical ${canonical} is not WebPage.url`);

const text = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const visible = [...mine.html.matchAll(/<details><summary data-i18n="faq\.q\d">([\s\S]*?)<\/summary><p data-i18n="faq\.a\d">([\s\S]*?)<\/p><\/details>/g)].map((m) => [text(m[1]), text(m[2])]);
const marked = byType(mine.data, 'FAQPage').mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
if (visible.length !== marked.length) problems.push(`${visible.length} visible questions but ${marked.length} in the markup`);
visible.forEach(([q, ans], i) => {
  if (!marked[i]) return;
  if (marked[i][0] !== q) problems.push(`FAQ ${i + 1} question differs: "${q}" vs "${marked[i][0]}"`);
  if (marked[i][1] !== ans) problems.push(`FAQ ${i + 1} answer differs from the visible text`);
});

if (problems.length) { console.log(problems.map((p) => `FAIL ${p}`).join('\n')); process.exit(1); }
console.log(`PASS schema: Dentist, WebPage, FAQPage present; practice details identical to the veneers page; ${visible.length} FAQ entries match the visible FAQ.`);
