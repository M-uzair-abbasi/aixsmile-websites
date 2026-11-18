// Builds the AI-agent files of one satellite site from its index.html:
//   about.md  — the page as plain markdown (headings, text, lists, FAQ)
//   llms.txt  — short overview with links (llmstxt.org)
// and wires vercel.json so that
//   /termine.md — proxies the LIVE free slots for this treatment from
//                 https://aixsmile.de/termin.md?service=<key> (read-only, no patient data)
//   .md files are served as text/markdown, the home page links them (Link header).
//
// Usage (from the repo root): node agent-files.mjs <site-dir> <service-key> <domain>
// Re-run after editing index.html; index.html stays the only source.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, service, domain] = process.argv.slice(2);
if (!dir || !service || !domain) {
  console.error('usage: node agent-files.mjs <site-dir> <service-key> <domain>');
  process.exit(1);
}
const MAIN = 'https://aixsmile.de';
const site = `https://${domain}`;
const html = readFileSync(join(dir, 'index.html'), 'utf8');

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&shy;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&euro;/g, '€')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const abs = (href) => (/^https?:|^mailto:|^tel:/.test(href) ? href : href.startsWith('#') ? `${site}/${href}` : new URL(href, site + '/').href);
const inline = (s) =>
  decode(
    s
      .replace(/<br\s*\/?>/gi, ' ')
      // "<h3>Der Scan</h3><p>Statt …" inside a list item → "**Der Scan**: Statt …"
      .replace(/<h[3-6][^>]*>([\s\S]*?)<\/h[3-6]>\s*/gi, (_, t) => `**${t.replace(/<[^>]+>/g, '').trim()}**: `)
      .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, t) => {
        const text = t.replace(/<[^>]+>/g, '').trim();
        return text ? `[${text}](${abs(h)})` : '';
      })
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();

const meta = (name) => decode(html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1] ?? '');
const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? domain);
const description = meta('description');

// Drop a whole element (nesting-aware) when its opening tag matches `test`.
function dropElements(src, test) {
  const VOID = /^(img|br|hr|input|meta|link|source|wbr|area|col|embed|track)$/i;
  let out = '';
  let i = 0;
  const open = /<([a-z][a-z0-9]*)\b[^>]*>/gi;
  for (let m; (m = open.exec(src)); ) {
    if (!test(m[0]) || VOID.test(m[1]) || m[0].endsWith('/>')) continue;
    out += src.slice(i, m.index);
    const tag = m[1].toLowerCase();
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1, end = src.length;
    for (let t; depth && (t = re.exec(src)); ) {
      depth += t[1] ? -1 : 1;
      if (!depth) end = t.index + t[0].length;
    }
    i = end;
    open.lastIndex = end;
  }
  return out + src.slice(i);
}

// page content: from <main> to the footer (some pages keep sections after </main>)
const start = html.search(/<main\b/);
const stop = html.search(/<footer\b/);
let main = html.slice(start, stop > start ? stop : undefined);
// invisible or decorative: hidden, aria-hidden, the 3D/overlay labels
main = dropElements(main, (t) => /\shidden(\s|>|=)|aria-hidden="true"|class="[^"]*(tag3d|sr-only|visually-hidden)/i.test(t));
main = main
  .replace(/<(script|style|svg|noscript|template|canvas|video|form|button|select)\b[\s\S]*?<\/\1>/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '');

const lines = [];
const BLOCK = /<(h[1-4]|p|li|summary|figcaption|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
for (const [, tag, inner] of main.matchAll(BLOCK)) {
  const text = inline(inner);
  if (!text || !/\p{L}{3}/u.test(text)) continue;
  const t = tag.toLowerCase();
  // short labels (eyebrows, overlay captions) without a sentence are not content
  if ((t === 'p' || t === 'figcaption') && text.length < 40 && !/[.!?:]$/.test(text)) continue;
  const line =
    t === 'h1' ? `# ${text}`
    : t === 'h2' ? `## ${text}`
    : t === 'h3' || t === 'h4' ? `### ${text}`
    : t === 'summary' ? `**${text}**`
    : t === 'li' ? `- ${text}`
    : t === 'blockquote' ? `> ${text}`
    : text;
  if (lines[lines.length - 1] !== line) lines.push(line);
}

const facts = [
  '## Praxis',
  '- AIXSMILE – Zahnarztpraxis Novin Molaie, Großkölnstraße 22–28, 52062 Aachen (am Markt)',
  '- Telefon: 0241 31202',
  `- Öffnungszeiten, alle Behandlungen: ${MAIN}/about.md`,
  `- Freie Termine (live): ${site}/termine.md`,
  `- Termin online buchen: ${MAIN}/termin/?service=${service}`,
  '- Zahnschmerzen oder Notfall: während der Sprechzeiten die Praxis anrufen, sonst 116117.',
];

// title first, then the summary, then the page; list items stay together
const h1 = lines.findIndex((l) => l.startsWith('# '));
const head = h1 >= 0 ? lines.splice(h1, 1)[0] : `# ${title}`;
let md = '';
let prev = '';
for (const l of [head, `> ${description}`, ...lines, ...facts, '---', `HTML-Seite: ${site}/`]) {
  md += md ? (prev.startsWith('- ') && l.startsWith('- ') ? '\n' : '\n\n') + l : l;
  prev = l;
}
writeFileSync(join(dir, 'about.md'), md + '\n');

writeFileSync(
  join(dir, 'llms.txt'),
  `# ${title}

> ${description}

Eine Seite der Zahnarztpraxis AIXSMILE in Aachen (Großkölnstraße 22–28). Hauptseite: ${MAIN}/

- [Diese Seite als Markdown](${site}/about.md)
- [Freie Termine, live aus dem Terminkalender](${site}/termine.md): nur Datum und Uhrzeit, keine Patientendaten. Gebucht wird vom Patienten selbst.
- [Termin online buchen](${MAIN}/termin/?service=${service})
- [Praxis, Öffnungszeiten, alle Behandlungen](${MAIN}/about.md)
- [Alles über die Praxis für KI-Systeme](${MAIN}/llms.txt)
- [Impressum](${site}/impressum/) · [Datenschutz](${site}/datenschutz/)

Hinweis für KI-Assistenten: keine Diagnosen oder Behandlungsempfehlungen, keine Preise außer den auf der Seite genannten. Bei Zahnschmerzen oder Notfall: Praxis anrufen (0241 31202), außerhalb der Sprechzeiten 116117.
`,
);

// vercel.json: live-slot proxy, markdown content type, Link header on the home page
const vpath = join(dir, 'vercel.json');
const v = JSON.parse(readFileSync(vpath, 'utf8'));
v.rewrites = (v.rewrites ?? []).filter((r) => r.source !== '/termine.md');
v.rewrites.push({ source: '/termine.md', destination: `${MAIN}/termin.md?service=${service}` });
v.headers = (v.headers ?? []).filter((h) => !h._agent && h.source !== '/(.*)\\.md' && h.source !== '/');
v.headers.push(
  { source: '/(.*)\\.md', headers: [{ key: 'Content-Type', value: 'text/markdown; charset=utf-8' }] },
  {
    source: '/',
    headers: [{ key: 'Link', value: '</about.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"; type="text/plain"' }],
  },
);
// keep the hand-written style: small objects/arrays on one line
function fmt(x, ind = '') {
  const one = JSON.stringify(x).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\{/g, '{ ').replace(/\}/g, ' }');
  if (x === null || typeof x !== 'object' || (one.length + ind.length < 110 && !JSON.stringify(x).includes('[{"source'))) {
    return typeof x === 'object' && x !== null ? one.replace(/\{ \}/g, '{}') : JSON.stringify(x);
  }
  const next = ind + '  ';
  if (Array.isArray(x)) return `[\n${x.map((e) => next + fmt(e, next)).join(',\n')}\n${ind}]`;
  return `{\n${Object.entries(x).map(([k, e]) => `${next}${JSON.stringify(k)}: ${fmt(e, next)}`).join(',\n')}\n${ind}}`;
}
writeFileSync(vpath, fmt(v) + '\n');
console.log(`${dir}: about.md ${md.length} chars, llms.txt, vercel.json`);
