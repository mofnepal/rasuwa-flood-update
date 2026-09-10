/**
 * Local PostgreSQL for development without Docker.
 *
 * Starts a real PostgreSQL server under .pgdata on port 55432 and leaves it
 * running until interrupted. Production uses the postgres service in
 * docker-compose.yml; nothing here ships to the ministry's server.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';

const dataDir = path.join(process.cwd(), '.pgdata');
const port = Number(process.env.DEV_DB_PORT ?? 55432);
const fresh = !existsSync(dataDir);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'rasuwa',
  password: 'rasuwa',
  port,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C', '--lc-ctype=C'],
});

if (fresh) {
  console.log('initialising local PostgreSQL cluster …');
  await pg.initialise();
}
await pg.start();
if (fresh) await pg.createDatabase('rasuwa_flood');

console.log(`PostgreSQL ready on postgresql://rasuwa:rasuwa@localhost:${port}/rasuwa_flood`);
console.log('Press Ctrl+C to stop.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
