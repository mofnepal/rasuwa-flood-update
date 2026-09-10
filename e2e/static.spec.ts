import { expect, test, type Page } from '@playwright/test';

/**
 * The static edition, as GitHub Pages serves it. These run before every
 * publication; if one fails, nothing is published and the live site is unchanged.
 */

const LOCALES = ['ne', 'en'] as const;

const PAGES = [
  { path: '', ne: 'रसुवा–भोटेकोशी', en: 'Rasuwa–Bhotekoshi' },
  { path: 'contributions/', ne: 'प्राप्त सहयोग', en: 'Contributions Received' },
  { path: 'foreign/', ne: 'वैदेशिक सहयोग', en: 'Foreign Assistance' },
  { path: 'rescue/', ne: 'उद्धार', en: 'Rescue' },
  { path: 'initiatives/', ne: 'सरकारबाट भएका पहल', en: 'Government initiatives' },
  { path: 'contact/', ne: 'सम्पर्क विवरण', en: 'contact details' },
] as const;

/**
 * Opens a page and waits until React has taken it over — the "(3 h ago)" note is
 * only rendered in the browser. Waiting for `load` instead would wait on the live
 * NDRRMA embed, a third-party page that can take most of a minute.
 */
async function open(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('.ticker .ago').waitFor();
  return response;
}

/** The live NDRRMA embed and the map are third-party pages; their failures are not ours. */
function collectOwnFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.startsWith('http://localhost')) {
      failures.push(`${response.status()} ${url}`);
    }
  });
  return failures;
}

for (const locale of LOCALES) {
  for (const target of PAGES) {
    test(`${locale}/${target.path} renders without errors or sideways scrolling`, async ({
      page,
    }) => {
      const failures = collectOwnFailures(page);
      const response = await open(page, `${locale}/${target.path}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main')).toContainText(target[locale]);
      await expect(page.locator('footer')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      expect(failures).toEqual([]);
    });
  }
}

test('the site root opens the Nepali edition', async ({ page }) => {
  await page.goto('', { waitUntil: 'load' });
  await expect(page).toHaveURL(/\/ne\/$/);
});

test('the language toggle keeps the reader on the same page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the phone layout moves the toggle into the menu');
  await open(page, 'ne/contributions/');
  await page.locator('.tools .lang').getByRole('button', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/contributions\/$/);
  await expect(page.locator('main h1')).toContainText('Contributions Received');
});

test('each rescue report date has its own page', async ({ page }) => {
  await open(page, 'ne/rescue/');
  const tabs = page.locator('.tabs a');
  expect(await tabs.count()).toBeGreaterThan(1);
  await expect(tabs.first()).toHaveAttribute('aria-current', 'page');
  await tabs.nth(1).click();
  await expect(page).toHaveURL(/\/ne\/rescue\/\d{4}-\d{2}-\d{2}\/$/);
  await expect(page.locator('.tabs a').nth(1)).toHaveAttribute('aria-current', 'page');
});

test('a relief measure can be deep-linked and opens its drawer', async ({ page }) => {
  await open(page, 'ne/initiatives/?m=1');
  const drawer = page.locator('.drawer.open');
  await expect(drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
});

test('the register opens filtered from a deep link', async ({ page }) => {
  await open(page, 'en/contributions/?sector=bank#register');
  await expect(page.locator('#register tbody tr').first()).toContainText('Banks');
});

test('header search finds a contributor and opens the register on them', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'the phone layout hides the header search');
  await open(page, 'en/');
  await page.locator('.gsearch input').fill('Kumari');
  const hit = page.locator('.gsr a').first();
  await expect(hit).toContainText('Kumari');
  await hit.click();
  await expect(page).toHaveURL(/\/en\/contributions\/\?q=/);
  await expect(page.locator('#register tbody tr').first()).toContainText('Kumari');
});

test('the contact page offers the official email in place of the form', async ({ page }) => {
  await open(page, 'en/contact/');
  await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
});

test('the open-data summary ties: A + B + C × FX', async ({ request }) => {
  const response = await request.get('open-data/summary.json');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.grand_total_npr).toBeGreaterThan(0);
  expect(body.categories.D_identified_contributors.total_usd).toBeLessThanOrEqual(
    body.categories.C_foreign_assistance.total_usd,
  );
  const expected =
    body.categories.A_online_channels.total_npr +
    body.categories.B_handovers.total_npr +
    body.categories.C_foreign_assistance.total_usd * body.fx_rate_usd_npr;
  expect(Math.abs(body.grand_total_npr - expected)).toBeLessThan(0.01);
});

test('share cards and the register CSV are published as files', async ({ request }) => {
  const card = await request.get('og/home-en.png');
  expect(card.status()).toBe(200);
  expect(card.headers()['content-type']).toContain('image/png');
  const csv = await request.get('open-data/contributions.csv');
  expect(csv.status()).toBe(200);
  expect((await csv.text()).split('\n').length).toBeGreaterThan(10);
});

test('the static edition carries no admin area, and unknown pages say so', async ({ page }) => {
  const response = await page.goto('admin/', { waitUntil: 'load' });
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Page not found');
});
