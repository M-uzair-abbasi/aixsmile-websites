// Turns the source dentition (human_dentition.glb, 18 MB, ~750k triangles)
// into the web asset the procedure section loads (assets/models/dentition.glb).
// Not deployed (.vercelignore). Run from the veneer-webpage folder:
//   node tools/prepare-dentition.mjs
//
// - Roots are dropped: the gums hide them from every camera the page uses.
// - Each crown is simplified by how close the camera gets to it. The six
//   upper front teeth that receive veneers keep the most detail because the
//   page reshapes them at runtime (preparation, chip, shells); the upper
//   premolars, which get veneers too, keep a little more than the rest.
// - Geometry is quantized and meshopt-compressed; the page decodes it with
//   three's MeshoptDecoder.
//
// Packages are borrowed from the main app's node_modules (as in
// bleaching-webpage/tools/lib.mjs), so this folder needs no install.
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import path from 'node:path';

function appRequire(pkg) {
  const dirs = [process.env.AIXSMILE_DIR, '/home/muhammad-uzair/aixsmile/', `${process.env.HOME}/playground/aixsmile/`].filter(Boolean);
  for (const dir of dirs) {
    const req = createRequire(dir.endsWith('/') ? dir : `${dir}/`);
    try { req.resolve(pkg); return req(pkg); } catch { /* next */ }
  }
  throw new Error(`${pkg} not found; set AIXSMILE_DIR to the main app checkout`);
}

const { NodeIO } = appRequire('@gltf-transform/core');
const { ALL_EXTENSIONS } = appRequire('@gltf-transform/extensions');
const { weld, simplifyPrimitive, prune, dedup, quantize, meshopt, reorder } = appRequire('@gltf-transform/functions');
const { MeshoptSimplifier, MeshoptEncoder } = appRequire('meshoptimizer');

const SRC = 'human_dentition.glb';
const OUT = 'assets/models/dentition.glb';

// ratio = share of triangles kept, error = allowed deviation (fraction of mesh size)
function budget(name) {
  if (/_gingiva$|hard_palate/.test(name)) return { ratio: 0.3, error: 0.004 };
  const m = name.match(/^tooth_(\d)(\d)_.*_crown$/);
  if (!m) return null;
  const [, quadrant, pos] = m.map(Number);
  const upper = quadrant === 1 || quadrant === 2;
  if (upper && pos <= 3) return { ratio: 0.55, error: 0.001 };  // front veneer teeth
  if (upper && pos <= 5) return { ratio: 0.4, error: 0.002 };   // premolar veneers
  if (pos <= 3) return { ratio: 0.3, error: 0.003 };            // lower front teeth
  if (pos <= 5) return { ratio: 0.2, error: 0.006 };            // premolars
  return { ratio: 0.1, error: 0.01 };                           // molars, far back
}

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(SRC);
const root = doc.getRoot();

let dropped = 0;
for (const node of root.listNodes()) {
  if (/_root(_\d)?$/.test(node.getName())) { node.getMesh()?.dispose(); node.dispose(); dropped++; }
}

await doc.transform(weld());

let before = 0, after = 0;
const tris = (prim) => (prim.getIndices() ? prim.getIndices().getCount() : prim.getAttribute('POSITION').getCount()) / 3;
for (const node of root.listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const b = budget(node.getName());
  for (const prim of mesh.listPrimitives()) {
    before += tris(prim);
    if (b) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: b.ratio, error: b.error });
    after += tris(prim);
  }
}

await doc.transform(
  prune(),
  dedup(),
  reorder({ encoder: MeshoptEncoder }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeColor: 8 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);

await io.write(OUT, doc);
const mb = (f) => (statSync(f).size / 1048576).toFixed(2) + ' MB';
console.log(`roots dropped: ${dropped}`);
console.log(`triangles: ${Math.round(before)} -> ${Math.round(after)}`);
console.log(`${path.basename(SRC)} ${mb(SRC)} -> ${OUT} ${mb(OUT)}`);
