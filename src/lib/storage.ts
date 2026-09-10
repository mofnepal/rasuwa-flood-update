/**
 * File storage behind an S3-compatible adapter.
 *
 * `STORAGE_DRIVER=s3` talks to MinIO (or any S3 service); the default `local`
 * driver writes under `UPLOAD_DIR` so the portal runs without object storage.
 * Either way callers only ever see the public URL and the sha256.
 */

import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { BASE_PATH } from './constants';

export interface StoredFile {
  filename: string;
  url: string;
  sha256: string;
  size: number;
}

const DRIVER = process.env.STORAGE_DRIVER ?? 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'public', 'uploads');
// Files live in public/uploads, which the server exposes under the basePath.
const PUBLIC_PREFIX = process.env.UPLOAD_PUBLIC_PREFIX ?? `${BASE_PATH}/uploads`;

export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/** Keeps the original name but namespaces it by content hash, so re-uploads dedupe. */
function objectKey(filename: string, digest: string): string {
  const ext = path.extname(filename);
  const base = path
    .basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${digest.slice(0, 12)}-${base || 'file'}${ext.toLowerCase()}`;
}

export async function putFile(filename: string, buffer: Buffer): Promise<StoredFile> {
  const digest = sha256(buffer);
  const key = objectKey(filename, digest);

  if (DRIVER === 's3') {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: process.env.S3_REGION ?? 'us-east-1',
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET ?? 'rasuwa-flood',
        Key: key,
        Body: buffer,
        ContentType: contentType(filename),
      }),
    );
    return {
      filename,
      url: `${process.env.S3_PUBLIC_URL ?? PUBLIC_PREFIX}/${key}`,
      sha256: digest,
      size: buffer.length,
    };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { filename, url: `${PUBLIC_PREFIX}/${key}`, sha256: digest, size: buffer.length };
}

export async function putLocalFile(sourcePath: string): Promise<StoredFile> {
  const buffer = await readFile(sourcePath);
  return putFile(path.basename(sourcePath), buffer);
}

export function attachmentKindOf(filename: string): 'pdf' | 'jpg' | 'png' | 'xlsx' | 'csv' {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.png') return 'png';
  if (ext === '.xlsx' || ext === '.xls') return 'xlsx';
  if (ext === '.csv') return 'csv';
  return 'jpg';
}

function contentType(filename: string): string {
  return {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
  }[attachmentKindOf(filename)];
}
