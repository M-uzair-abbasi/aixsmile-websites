// Builds en/index.html from index.html: the same page with the English
// dictionary already applied to the markup, an English <head> and the
// English structured data. Run by Vercel at deploy time (package.json
// "build"); locally: `node build-en.mjs`. index.html stays the only source.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = readFileSync('index.html', 'utf8');

// The I18N dictionary is a JS object literal in the page; evaluate it as is.
const dictSrc = src.match(/const I18N = (\{[\s\S]*?\n\});\n/);
if (!dictSrc) throw new Error('I18N dictionary not found');
const I18N = new Function(`return ${dictSrc[1]}`)();
const en = I18N.en;
const getPath = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const attr = (x) => String(x).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const jsonText = (x) => JSON.stringify(String(x)).slice(1, -1);

let out = src;
let applied = 0, missing = [];

// data-i18n: innerHTML of the element (no element nests its own tag name)
out = out.replace(/<([a-z0-9]+)((?:\s[^>]*?)?\sdata-i18n="([\w.]+)"[^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, key, inner) => {
  const val = getPath(en, key);
  if (val == null) { missing.push(key); return m; }
  applied++;
  return `<${tag}${attrs}>${val}</${tag}>`;
});
// data-i18n-alt / data-i18n-aria: the attribute
out = out.replace(/<img([^>]*?)\sdata-i18n-alt="([\w.]+)"([^>]*?)\salt="[^"]*"/g, (m, a, key, b) => {
  const val = getPath(en, key); if (val == null) { missing.push(key); return m; }
  return `<img${a} data-i18n-alt="${key}"${b} alt="${attr(val)}"`;
});
out = out.replace(/data-i18n-aria="([\w.]+)"/g, (m, key) => {
  const val = getPath(en, key); if (val == null) { missing.push(key); return m; }
  return `${m} aria-label="${attr(val)}" title="${attr(val)}"`;
});

// <head>
const rep = (a, b) => { if (!out.includes(a)) throw new Error(`head marker missing: ${a.slice(0, 60)}`); out = out.replace(a, b); };
rep('<html lang="de">', '<html lang="en">');
out = out.replace(/<title>[^<]*<\/title>/, `<title>${attr(en.title)}</title>`);
out = out.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(en.metaDescription)}">`);
rep('<link rel="canonical" href="https://veneers-aachen.de/">', '<link rel="canonical" href="https://veneers-aachen.de/en/">');
rep('<meta property="og:locale" content="de_DE">', '<meta property="og:locale" content="en_GB">');
out = out.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(en.title)}">`);
out = out.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(en.metaDescription)}">`);
rep('<meta property="og:url" content="https://veneers-aachen.de/">', '<meta property="og:url" content="https://veneers-aachen.de/en/">');
out = out.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(en.ba.img6Alt)} at AIXSMILE Aachen">`);
rep('<button type="button" class="langToggle" id="langToggle" data-active="de"', '<button type="button" class="langToggle" id="langToggle" data-active="en"');

// structured data: the WebPage and the FAQ in English (the Dentist entity is shared)
const ld = out.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
const graph = JSON.parse(ld[1]);
for (const node of graph['@graph']) {
  if (node['@type'] === 'WebPage') {
    Object.assign(node, {
      '@id': 'https://veneers-aachen.de/en/#webpage', url: 'https://veneers-aachen.de/en/',
      name: en.title, description: en.metaDescription, inLanguage: 'en',
    });
  }
  if (node['@type'] === 'FAQPage') {
    node.mainEntity = node.mainEntity.map((_, i) => ({
      '@type': 'Question', name: en.faq[`q${i + 1}`],
      acceptedAnswer: { '@type': 'Answer', text: en.faq[`a${i + 1}`] },
    }));
    if (node.mainEntity.some((q) => !q.name || !q.acceptedAnswer.text)) throw new Error('FAQ translation incomplete');
  }
}
out = out.replace(ld[0], `<script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n</script>`);

if (missing.length) console.warn('untranslated keys:', [...new Set(missing)].join(', '));
mkdirSync('en', { recursive: true });
writeFileSync('en/index.html', out);
console.log(`en/index.html written, ${applied} elements translated`);
