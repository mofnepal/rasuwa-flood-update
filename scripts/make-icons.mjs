/**
 * Generates the favicons, app icons and favicon.ico from the ministry's emblem.
 * Run after replacing public/img/emblem.png with a new original:
 *   node scripts/make-icons.mjs
 * The emblem is only ever resampled — never recoloured, restyled or cropped. It is
 * wider than it is tall, so each icon centres it on a square canvas.
 */
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const publicDir = path.join(process.cwd(), 'public');
const source = path.join(publicDir, 'img', 'emblem.png');
const clear = { r: 255, g: 255, b: 255, alpha: 0 };

const square = (size, background = clear) =>
  sharp(source).resize(size, size, { fit: 'contain', background }).png({ compressionLevel: 9 });

const targets = [
  ['favicon-16.png', 16],
  ['favicon-32.png', 32],
  // Search engines ask for a favicon of at least 48px, in multiples of 48.
  ['favicon-48.png', 48],
  ['favicon-64.png', 64],
  // The web app manifest: phones and desktop browsers that add the site as an app.
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  // The header shows the emblem at 56px; this is its 2x copy, so the page never
  // ships the full-size original where no image optimiser runs (GitHub Pages).
  ['emblem-112.png', 112],
];

for (const [name, size] of targets) {
  await square(size).toFile(path.join(publicDir, 'img', name));
  console.log(`${name} — ${size}px`);
}

// iOS draws a transparent touch icon on black, so this one sits on white.
await square(180, { r: 255, g: 255, b: 255, alpha: 1 })
  .flatten({ background: '#ffffff' })
  .toFile(path.join(publicDir, 'img', 'apple-touch-icon.png'));
console.log('apple-touch-icon.png — 180px, on white');

// favicon.ico — 16, 32 and 48px PNGs in one file, for browsers and crawlers that
// ask for the icon by that name rather than reading the page's <link> tags.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => square(size).toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);
let offset = header.length + 16 * sizes.length;
const entries = sizes.map((size, index) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0); // width
  entry.writeUInt8(size, 1); // height
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(images[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += images[index].length;
  return entry;
});
await writeFile(
  path.join(publicDir, 'favicon.ico'),
  Buffer.concat([header, ...entries, ...images]),
);
console.log('favicon.ico — 16, 32 and 48px');
