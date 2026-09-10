/**
 * Generates the favicon and touch icon from the ministry's emblem.
 * Run after replacing public/img/emblem.png with a new original:
 *   node scripts/make-icons.mjs
 * The emblem is only ever resampled — never recoloured, restyled or cropped.
 */
import sharp from 'sharp';
import path from 'node:path';

const source = path.join(process.cwd(), 'public', 'img', 'emblem.png');
const targets = [
  ['favicon-32.png', 32],
  ['favicon-64.png', 64],
  ['apple-touch-icon.png', 180],
  // The header shows the emblem at 56px; this is its 2x copy, so the page never
  // ships the full-size original where no image optimiser runs (GitHub Pages).
  ['emblem-112.png', 112],
];

for (const [name, size] of targets) {
  const out = path.join(process.cwd(), 'public', 'img', name);
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`${name} — ${size}px`);
}
