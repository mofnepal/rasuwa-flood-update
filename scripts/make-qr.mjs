/**
 * Draws the QR code that appears beside the donate button.
 *
 * It encodes the official payment portal address and nothing else, so scanning
 * it simply opens donate.gov.np. If the ministry issues an official payment QR
 * with its own payload, replace public/img/donate-qr.svg with that file — the
 * pages reference it by path and need no change.
 *
 *   node scripts/make-qr.mjs
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';

const URL = 'https://donate.gov.np/';
const out = path.join(process.cwd(), 'public', 'img', 'donate-qr.svg');

const svg = await QRCode.toString(URL, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 1,
  color: { dark: '#003893', light: '#00000000' },
});

await writeFile(out, svg, 'utf8');
console.log(`donate-qr.svg — encodes ${URL}`);
