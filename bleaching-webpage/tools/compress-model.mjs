// Compress the jaw model for the hero: weld, drop duplicates, then meshopt
// (quantised positions and normals + EXT_meshopt_compression). three.js
// decodes it with the small meshopt decoder that the hero bundle carries.
//
//   node tools/compress-model.mjs [source.glb] [out.glb]
//
// Borrows @gltf-transform and meshoptimizer from the main aixsmile app's
// node_modules (tools/lib.mjs finds it on either machine), like the other
// tools borrow Playwright, so this folder needs no package.json.
import { pathToFileURL } from 'node:url';
import { statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, appWith } from './lib.mjs';

const { dir: APP, require } = appWith('@gltf-transform/core');
const { NodeIO } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { dedup, weld, prune, meshopt } = require('@gltf-transform/functions');
const { MeshoptEncoder } = await import(pathToFileURL(path.join(APP, 'node_modules/meshoptimizer/index.js')).href);

const root = ROOT;
const src = path.resolve(root, process.argv[2] || 'human-jaw.glb');
const out = path.resolve(root, process.argv[3] || 'assets/models/jaw.glb');

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(src);
await doc.transform(dedup(), weld(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
await io.write(out, doc);

const kb = (f) => (statSync(f).size / 1024).toFixed(0) + ' KB';
console.log(`${path.relative(root, src)} ${kb(src)} -> ${path.relative(root, out)} ${kb(out)}`);
