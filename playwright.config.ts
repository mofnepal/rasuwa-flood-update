import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3111);
// The trailing slash matters: Playwright resolves test paths with `new URL(path,
// baseURL)`, and without it the basePath segment is replaced rather than kept.
const BASE_URL = (process.env.E2E_BASE_URL ?? `http://localhost:${PORT}/rasuwa-flood`).replace(
  /\/?$/,
  '/',
);

export default defineConfig({
  testDir: './e2e',
  // The static edition has its own suite and config: playwright.static.config.ts.
  testIgnore: 'static.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Two projects each drive a browser against a single Node server. Left
  // unbounded the suite saturates a modest machine, and a starved server can
  // truncate a streamed response, which surfaces as a hydration error that has
  // nothing to do with the page. Two workers keeps it deterministic.
  workers: 2,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'ne-NP',
    timezoneId: 'Asia/Kathmandu',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        // The standalone server, as the container runs it — `next start` is
        // unsupported with `output: standalone` and was producing intermittent
        // hydration errors under concurrent load.
        command: `node scripts/start-standalone.mjs --port ${PORT}`,
        url: `${BASE_URL}api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
