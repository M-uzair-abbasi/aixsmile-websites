// Which AI images are still placeholders? Placeholders are listed with their
// hashes in tools/placeholders.json by `prepare_images.py --placeholders`.
// Exits 1 while any remain, so it doubles as a go-live gate.
//   node tools/check-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT } from './lib.mjs';

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'placeholders.json'), 'utf8'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let left = 0;
for (const [file, hash] of Object.entries(manifest)) {
  const p = path.join(ROOT, 'assets', 'photos', 'ai', file);
  const used = html.includes(`assets/photos/ai/${file}`);
  if (!fs.existsSync(p)) { console.log(`FAIL ${file}: missing`); left++; continue; }
  const now = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const kb = Math.round(fs.statSync(p).size / 1024);
  if (now === hash) { console.log(`TODO ${file}: still the placeholder${used ? '' : ' (not used by the page)'}`); left++; }
  else console.log(`PASS ${file}: real image, ${kb} KB${used ? '' : ' (not used by the page)'}`);
}
if (left) { console.log(`${left} of ${Object.keys(manifest).length} images still to come. Brief: docs/superpowers/specs/2026-09-24-bleaching-image-brief.md`); process.exit(1); }
console.log('PASS images: every AI image is a real one.');
