// Bundle the hero's 3D jaw (js/src/teeth-stage.js) with three.js into one
// minified module, js/teeth-stage.js. Run after editing the source:
//
//   node tools/build-3d.mjs
//
// Borrows esbuild and three (0.184, the same version the veneers page
// vendors) from the main aixsmile app's node_modules (tools/lib.mjs finds
// it on either machine), so this folder keeps no package.json and Vercel
// serves it as plain static files.
import { statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { ROOT, appWith } from './lib.mjs';

const { require } = appWith('esbuild');
const { dir: THREE_APP } = appWith('three');
const esbuild = require('esbuild');
const root = ROOT;
const out = path.join(root, 'js/teeth-stage.js');

await esbuild.build({
  entryPoints: [path.join(root, 'js/src/teeth-stage.js')],
  outfile: out,
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020', 'safari15'],
  nodePaths: [path.join(THREE_APP, 'node_modules')],
  legalComments: 'none',
  banner: { js: '/* AIXSMILE bleaching hero: 3D jaw. Built from js/src/teeth-stage.js by tools/build-3d.mjs. Includes three.js r184 (MIT, (c) 2010-2026 three.js authors) and meshoptimizer decoder (MIT, (c) 2016-2026 Arseny Kapoulkine). */' },
  logLevel: 'warning',
});
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`js/teeth-stage.js ${kb(statSync(out).size)}, gzip ${kb(gzipSync(readFileSync(out), { level: 9 }).length)}`);
