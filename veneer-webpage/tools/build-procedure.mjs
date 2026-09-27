// Bundle the procedure's 3D stage (js/veneer-procedure.js, the dentition rig,
// the timeline) with three.js into one minified module,
// js/veneer-procedure.bundle.js, which the page loads. One self-contained file
// needs no import map, so iPhones on iOS 15.0–16.3 (no import maps) get the
// same 3D as everyone else. Run after editing any of those sources:
//
//   node tools/build-procedure.mjs
//
// Borrows esbuild and three (0.184) from the main aixsmile app's node_modules
// via the bleaching page's tools/lib.mjs, like that page's tools/build-3d.mjs.
import { statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appWith } from '../../bleaching-webpage/tools/lib.mjs';

const { require } = appWith('esbuild');
const { dir: THREE_APP } = appWith('three');
const esbuild = require('esbuild');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'js/veneer-procedure.bundle.js');

await esbuild.build({
  entryPoints: [path.join(root, 'js/veneer-procedure.js')],
  outfile: out,
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020', 'safari15'],
  nodePaths: [path.join(THREE_APP, 'node_modules')],
  legalComments: 'none',
  banner: { js: '/* AIXSMILE veneers: the treatment in 3D. Built from js/veneer-procedure.js by tools/build-procedure.mjs. Includes three.js r184 (MIT, (c) 2010-2026 three.js authors) and meshoptimizer decoder (MIT, (c) 2016-2026 Arseny Kapoulkine). */' },
  logLevel: 'warning',
});
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`js/veneer-procedure.bundle.js ${kb(statSync(out).size)}, gzip ${kb(gzipSync(readFileSync(out), { level: 9 }).length)}`);
