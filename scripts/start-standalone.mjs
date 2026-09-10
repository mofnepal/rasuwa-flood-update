/**
 * Runs the production server the way the container does.
 *
 * `next build` with `output: 'standalone'` emits a self-contained server at
 * .next/standalone/server.js, but leaves the static assets and public/ beside
 * the build rather than inside it. `next start` does not work with a standalone
 * build — Next says so on every run — so this copies the two directories into
 * place and starts the real server.
 *
 *   node scripts/start-standalone.mjs [--port 3000]
 */
import { cp, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

try {
  await access(path.join(standalone, 'server.js'));
} catch {
  console.error('No standalone build found. Run `pnpm build` first.');
  process.exit(1);
}

await cp(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
  recursive: true,
});
await cp(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });

const portFlag = process.argv.indexOf('--port');
const port = portFlag !== -1 ? process.argv[portFlag + 1] : (process.env.PORT ?? '3000');

const server = spawn(process.execPath, ['server.js'], {
  cwd: standalone,
  stdio: 'inherit',
  env: { ...process.env, PORT: port, HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0' },
});
server.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
