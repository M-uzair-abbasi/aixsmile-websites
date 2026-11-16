// Bundle js/src/upload.js (@vercel/blob/client's uploadPresigned) into
// js/vendor/blob-upload.js. Borrows esbuild + @vercel/blob from the main
// aixsmile app's node_modules, like build-3d.mjs.
//
//   node tools/build-upload.mjs
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = [process.env.AIXSMILE_DIR, '/home/muhammad-uzair/aixsmile/', `${process.env.HOME}/playground/aixsmile/`]
  .filter(Boolean).map((d) => (d.endsWith('/') ? d : `${d}/`))
  .find((d) => { try { createRequire(d).resolve('esbuild'); createRequire(d).resolve('@vercel/blob/client'); return true; } catch { return false; } });
if (!appDir) throw new Error('esbuild/@vercel/blob not found; set AIXSMILE_DIR to the main app checkout');
const esbuild = createRequire(appDir)('esbuild');

await esbuild.build({
  entryPoints: [path.join(root, 'js/src/upload.js')],
  outfile: path.join(root, 'js/vendor/blob-upload.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  target: ['es2020', 'safari15'],
  nodePaths: [path.join(appDir, 'node_modules')],
  define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' },
  legalComments: 'none',
  banner: { js: '/* Scan to Smile: scan upload. @vercel/blob client (Apache-2.0), built by tools/build-upload.mjs. */' },
  logLevel: 'warning',
});
console.log('js/vendor/blob-upload.js built');
