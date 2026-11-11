// Write the two line drawings the page draws itself from (inline SVG in
// index.html, pasted from this script's output):
//   intro  the upper tray from above: outline, every tooth, centre lines,
//          width/depth dimensions (from tools/aligner-upper-top.json)
//   cut    the section through tooth 21: the tray's wall, the gum line,
//          a wall-thickness callout (from tools/section-21.json)
// Run: node tools/make-blueprints.mjs > /tmp/blueprints.html
import { readFileSync } from 'node:fs';
const here = new URL('.', import.meta.url).pathname;
const top = JSON.parse(readFileSync(here + 'aligner-upper-top.json', 'utf8'));
const cut = JSON.parse(readFileSync(here + 'section-21.json', 'utf8'));
const f = (n) => (Math.round(n * 10) / 10).toString();
const path = (pts, close = true) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + (close ? 'Z' : '');

// ---- intro: x right, z towards the viewer = down on paper
{
  const xs = top.outline.map((p) => p[0]), zs = top.outline.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  const pad = 16, vb = [x0 - pad, z0 - pad - 4, x1 - x0 + pad * 2, z1 - z0 + pad * 2 + 8];
  const teeth = Object.entries(top.teeth).map(([id, p]) => `<path class="bp-tooth" d="${path(p)}" style="--i:${id}"/>`).join('');
  const cx = (x0 + x1) / 2;
  const out = [
    `<svg class="bp" viewBox="${vb.map(f).join(' ')}" aria-hidden="true" focusable="false">`,
    `<g class="bp-guides"><path d="M${f(cx)} ${f(vb[1])}V${f(vb[1] + vb[3])}M${f(vb[0])} ${f((z0 + z1) / 2)}H${f(vb[0] + vb[2])}"/>`,
    `<circle cx="${f(cx)}" cy="${f(z1 - 6)}" r="9"/><circle cx="${f(cx)}" cy="${f((z0 + z1) / 2)}" r="${f((x1 - x0) / 2)}"/></g>`,
    `<path class="bp-outline" d="${path(top.outline)}" pathLength="1"/>`,
    `<g class="bp-teeth">${teeth}</g>`,
    `<g class="bp-dims"><path d="M${f(x0)} ${f(z0 - 8)}H${f(x1)}M${f(x0)} ${f(z0 - 11)}v6M${f(x1)} ${f(z0 - 11)}v6"/>`,
    `<path d="M${f(x1 + 8)} ${f(z0)}V${f(z1)}M${f(x1 + 5)} ${f(z0)}h6M${f(x1 + 5)} ${f(z1)}h6"/>`,
    `<text x="${f(cx)}" y="${f(z0 - 10)}" text-anchor="middle">${(x1 - x0).toFixed(1).replace('.', ',')} mm</text>`,
    `<text x="${f(x1 + 10)}" y="${f((z0 + z1) / 2)}" transform="rotate(90 ${f(x1 + 10)} ${f((z0 + z1) / 2)})" text-anchor="middle">${(z1 - z0).toFixed(1).replace('.', ',')} mm</text></g>`,
    `</svg>`,
  ];
  console.log('<!-- intro -->\n' + out.join('\n'));
}

// ---- cut: paper x = z (front of the tooth to the right), paper y = -y (biting edge down)
{
  const all = cut.aligner[0].map((p) => [p[0], -p[1]]);
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const vb = [x0 - 7, y0 - 3, x1 - x0 + 20, y1 - y0 + 6];
  // labial wall callout: the outermost points around 40 % of the height from the biting edge
  const at = y1 - (y1 - y0) * 0.4;
  const near = all.filter(([, y]) => Math.abs(y - at) < 0.35).sort((a, b) => b[0] - a[0]);
  const outerX = near[0][0];
  const innerX = near.find(([x]) => x < outerX - 0.2)?.[0] ?? outerX - 0.5;
  const cx = (x0 + x1) / 2 - 0.6, cy = (y0 + y1) / 2 + 1;
  const out = [
    `<svg class="cut" viewBox="${vb.map(f).join(' ')}" role="img" aria-labelledby="cutTitle">`,
    `<title id="cutTitle">Schnitt durch einen Schneidezahn mit Aligner: die Wand ist etwa 0,5 mm dünn</title>`,
    `<defs><pattern id="hatch" width="0.5" height="0.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V0.5"/></pattern></defs>`,
    `<path class="cut-guide" d="M${f(vb[0])} ${f(at)}H${f(vb[0] + vb[2])}"/>`,
    `<path class="cut-wall" d="${path(all)}" pathLength="1"/>`,
    `<text class="cut-label" x="${f(cx)}" y="${f(cy)}" text-anchor="middle">ZAHN 21</text>`,
    `<g class="cut-dim"><path d="M${f(outerX + 0.4)} ${f(at)}H${f(outerX + 3.2)}M${f(innerX - 2.4)} ${f(at)}H${f(innerX - 0.2)}"/>`,
    `<text x="${f(outerX + 3.6)}" y="${f(at + 0.22)}">≈ 0,5 mm</text></g>`,
    `<g class="cut-dim"><path d="M${f(x0 - 3)} ${f(y0)}V${f(y1)}M${f(x0 - 3.8)} ${f(y0)}h1.6M${f(x0 - 3.8)} ${f(y1)}h1.6"/>`,
    `<text x="${f(x0 - 3.7)}" y="${f((y0 + y1) / 2)}" transform="rotate(-90 ${f(x0 - 3.7)} ${f((y0 + y1) / 2)})" text-anchor="middle">${(y1 - y0).toFixed(1).replace('.', ',')} mm</text></g>`,
    `</svg>`,
  ];
  console.log('<!-- cut -->\n' + out.join('\n'));
}
