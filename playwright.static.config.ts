import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end checks for the static edition, served from ./out the way GitHub
 * Pages serves it. Build first: `pnpm build:static`, with the same
 * NEXT_PUBLIC_BASE_PATH.
 */
const PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rasuwa-flood';
const BASE_URL = `http://localhost:${PORT}${BASE_PATH}/`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'static.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
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
  webServer: {
    command: `node scripts/serve-static.mjs --port ${PORT}`,
    url: `${BASE_URL}ne/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
