/**
 * Serves ./out the way GitHub Pages does, to check the static edition locally.
 *
 *   node scripts/serve-static.mjs [--port 3200]
 *
 * Same rules as Pages: the site lives under its base path, a folder address
 * without a trailing slash is redirected to one, `page` falls back to
 * `page.html`, and anything else gets 404.html.
 */
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = args.indexOf('--port');
const port = Number((flag >= 0 && args[flag + 1]) || process.env.PORT || 3200);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rasuwa-flood';
const root = path.resolve('out');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const isFile = (file) =>
  stat(file).then(
    (s) => s.isFile(),
    () => false,
  );
const isDirectory = (file) =>
  stat(file).then(
    (s) => s.isDirectory(),
    () => false,
  );

function send(response, file, status = 200) {
  response.writeHead(status, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
}

http
  .createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const notFound = () => send(response, path.join(root, '404.html'), 404);

    if (url.pathname === '/' && basePath) {
      response.writeHead(302, { Location: `${basePath}/` });
      return response.end();
    }
    if (basePath && url.pathname !== basePath && !url.pathname.startsWith(`${basePath}/`)) {
      return notFound();
    }

    let relative;
    try {
      relative = decodeURIComponent(url.pathname.slice(basePath.length)) || '/';
    } catch {
      return notFound();
    }
    const file = path.join(root, path.normalize(relative));
    if (!file.startsWith(root)) return notFound();

    if (await isDirectory(file)) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` });
        return response.end();
      }
      const index = path.join(file, 'index.html');
      return (await isFile(index)) ? send(response, index) : notFound();
    }
    if (await isFile(file)) return send(response, file);
    if (await isFile(`${file}.html`)) return send(response, `${file}.html`);
    return notFound();
  })
  .listen(port, () => {
    console.log(`static edition on http://localhost:${port}${basePath}/`);
  });
