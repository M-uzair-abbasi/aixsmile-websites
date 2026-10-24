// Bundle the page's 3D world (js/src/clear-stage.js, its rig and the
// timeline) with three.js into one minified module, js/clear-stage.js.
// Run after editing the sources:
//
//   node tools/build-3d.mjs
//
// Borrows esbuild and three (0.184) from the main aixsmile app's
// node_modules, like bleaching-2/tools/build-3d.mjs, so this folder keeps no
// package.json and Vercel serves it as plain static files.
import { statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = [process.env.AIXSMILE_DIR, '/home/muhammad-uzair/aixsmile/', `${process.env.HOME}/playground/aixsmile/`]
  .filter(Boolean).map((d) => (d.endsWith('/') ? d : `${d}/`))
  .find((d) => { try { createRequire(d).resolve('esbuild'); createRequire(d).resolve('three'); return true; } catch { return false; } });
if (!appDir) throw new Error('esbuild/three not found; set AIXSMILE_DIR to the main app checkout');
const esbuild = createRequire(appDir)('esbuild');
const out = path.join(root, 'js/clear-stage.js');

await esbuild.build({
  entryPoints: [path.join(root, 'js/src/clear-stage.js')],
  outfile: out,
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020', 'safari15'],
  nodePaths: [path.join(appDir, 'node_modules')],
  legalComments: 'none',
  banner: { js: '/* AIXSMILE aligners: the 3D world. Built from js/src/clear-stage.js by tools/build-3d.mjs. Includes three.js r184 (MIT, (c) 2010-2026 three.js authors) and meshoptimizer decoder (MIT, (c) 2016-2026 Arseny Kapoulkine). */' },
  logLevel: 'warning',
});
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`js/clear-stage.js ${kb(statSync(out).size)}, gzip ${kb(gzipSync(readFileSync(out), { level: 9 }).length)}`);
