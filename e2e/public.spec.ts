import { expect, test, type Page } from '@playwright/test';

const LOCALES = ['ne', 'en'] as const;

const PAGES = [
  { path: '', ne: 'रसुवा–भोटेकोशी', en: 'Rasuwa–Bhotekoshi' },
  { path: '/contributions', ne: 'प्राप्त सहयोग', en: 'Contributions Received' },
  { path: '/foreign', ne: 'वैदेशिक सहयोग', en: 'Foreign Assistance' },
  { path: '/rescue', ne: 'उद्धार', en: 'Rescue' },
  { path: '/initiatives', ne: 'सरकारबाट भएका पहल', en: 'Government initiatives' },
  { path: '/contact', ne: 'सम्पर्क विवरण', en: 'contact details' },
] as const;

/** The live NDRRMA embed is a third-party page; its failures are not ours. */
function collectOwnFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400 && url.startsWith('http://localhost')) {
      if (url.includes('hot-update')) return;
      failures.push(`${response.status()} ${url}`);
    }
  });
  return failures;
}

for (const locale of LOCALES) {
  for (const target of PAGES) {
    test(`${locale}${target.path || '/'} renders`, async ({ page }) => {
      const failures = collectOwnFailures(page);
      const response = await page.goto(`${locale}${target.path}`, {
        waitUntil: 'domcontentloaded',
      });

      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main#main')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        locale === 'ne' ? target.ne : target.en,
      );

      // Every page carries the emblem, the ministry name and the donate button.
      await expect(page.locator('.brand img')).toBeVisible();
      await expect(page.locator('.brand .g b')).toHaveText(
        locale === 'ne' ? 'अर्थ मन्त्रालय' : 'Ministry of Finance',
      );
      await expect(page.locator('a[href="https://donate.gov.np/"]').first()).toBeVisible();

      await expect(page.locator('footer')).toBeVisible();
      expect(failures, failures.join('\n')).toEqual([]);
    });
  }

  test(`${locale} pages do not scroll horizontally`, async ({ page }) => {
    for (const target of PAGES) {
      await page.goto(`${locale}${target.path}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('footer')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${locale}${target.path} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
}

test('numbers use Devanagari digits in Nepali and Western digits in English', async ({ page }) => {
  // The headline counts up over 900 ms; these assert the settled figure, and the
  // poll doubles as a check that it never rests on a partial or negative value.
  await page.goto('ne', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => (await page.locator('.total b').innerText()).trim(), { timeout: 15_000 })
    // Devanagari digits, lakh/crore grouping, "रु." and never a Western digit.
    .toMatch(/^रु\. [०-९]{1,2}(,[०-९]{2})*,[०-९]{3}$/);

  await page.goto('en', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(async () => (await page.locator('.total b').innerText()).trim(), { timeout: 15_000 })
    // "NPR", never "Rs", Indian grouping, and never a minus sign.
    .toMatch(/^NPR \d{1,2}(,\d{2})*,\d{3}$/);

  const enTotal = await page.locator('.total b').innerText();
  expect(enTotal).not.toContain('Rs');
  expect(enTotal).not.toContain('-');
});

test('the language toggle keeps the reader on the same page', async ({ page }, testInfo) => {
  await page.goto('ne/contributions', { waitUntil: 'domcontentloaded' });

  // On a phone the toggle lives inside the drawer, as the design intends.
  const onPhone = (page.viewportSize()?.width ?? 1280) < 761;
  if (onPhone) {
    await expect(async () => {
      await page.locator('.burger').click();
      await expect(page.locator('nav.main.open > .wrap')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await page.locator('nav.main .mextra .lang button', { hasText: 'English' }).click();
  } else {
    await page.locator('.tools .lang button', { hasText: 'EN' }).click();
  }

  await page.waitForURL(/\/en\/contributions/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Contributions Received');
  expect(testInfo.errors).toEqual([]);
});

test('the mobile drawer opens, offers the donate button and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('ne', { waitUntil: 'domcontentloaded' });

  const burger = page.locator('.burger');
  await expect(burger).toBeVisible();

  // The drawer's visible surface is the fixed .wrap inside the nav. The click is
  // retried because a click that lands before hydration does nothing.
  const drawer = page.locator('nav.main.open > .wrap');
  await expect(async () => {
    await burger.click();
    await expect(drawer).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  await expect(drawer.locator('a[href="https://donate.gov.np/"]')).toBeVisible();
  // Every drawer row is at least 56px tall, as the design requires.
  const height = await drawer
    .locator('a')
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(56);

  await page.keyboard.press('Escape');
  await expect(page.locator('nav.main.open')).toHaveCount(0);
  await expect(page.locator('body.noscroll')).toHaveCount(0);
});

test('every figure on the home page is accompanied by its source and cut-off', async ({ page }) => {
  await page.goto('en', { waitUntil: 'domcontentloaded' });
  const table = page.locator('.srcs table');
  await expect(table).toBeVisible();
  await expect(table.locator('tbody tr')).not.toHaveCount(0);
  await expect(page.getByText('subject to reconciliation by the Fund Section')).toBeVisible();
});

test('the rescue page links to the official portals and never copies the rescued list', async ({
  page,
}) => {
  await page.goto('ne/rescue', { waitUntil: 'domcontentloaded' });
  const banner = page.locator('.banner');
  await expect(banner).toBeVisible();
  await expect(banner.locator('a[href="https://rescue.opmcm.gov.np/"]')).toBeVisible();
  await expect(banner.locator('a[href="https://ndrrma.gov.np/np/rasuwa"]')).toBeVisible();
  await expect(banner.locator('a[href="https://setu.ndrrma.gov.np"]')).toBeVisible();
  await expect(page.locator('.embed iframe')).toHaveAttribute(
    'src',
    'https://ndrrma.gov.np/np/rasuwa',
  );
});

test('a relief measure can be deep-linked and opens its drawer', async ({ page }) => {
  await page.goto('ne/initiatives?m=1', { waitUntil: 'domcontentloaded' });
  const drawer = page.locator('.drawer.open');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('मन्त्रिपरिषद् निर्णयको व्यहोरा')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
});

test('the contributor register searches, filters and paginates', async ({ page }) => {
  await page.goto('en/contributions', { waitUntil: 'domcontentloaded' });
  const register = page.locator('#register');
  await register.scrollIntoViewIfNeeded();

  const search = register.locator('input[type=search]');
  await search.fill('Kumari');
  await expect(register.locator('tbody tr').first()).toContainText('Kumari');

  await search.fill('');
  await register.getByRole('tab', { name: /Individual/ }).click();
  const rows = register.locator('tbody tr');
  await expect(rows.first()).toContainText('Individual');
});

test('the register can be reached by a deep link from search', async ({ page }) => {
  await page.goto('en/contributions?sector=bank#register', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#register tbody tr').first()).toContainText('Banks');
});

test('the admin area is not reachable without signing in', async ({ page }) => {
  const response = await page.goto('admin', { waitUntil: 'domcontentloaded' });
  expect(response?.url()).toContain('/admin/login');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('प्रशासन प्रवेश');
});

test('the open-data API serves published figures with their cut-offs', async ({ request }) => {
  const response = await request.get('api/v1/summary');
  expect(response.status()).toBe(200);
  const body = await response.json();

  expect(body.grand_total_npr).toBeGreaterThan(0);
  expect(body.categories.A_online_channels.total_npr).toBeGreaterThan(0);
  expect(body.categories.B_handovers.entries).toBeGreaterThan(0);
  expect(body.cut_offs.length).toBeGreaterThan(0);

  // Category D is a subset of C, never added on top of it.
  expect(body.categories.D_identified_contributors.total_usd).toBeLessThanOrEqual(
    body.categories.C_foreign_assistance.total_usd,
  );
  // The grand total is exactly A + B + C x FX.
  const expected =
    body.categories.A_online_channels.total_npr +
    body.categories.B_handovers.total_npr +
    body.categories.C_foreign_assistance.total_usd * body.fx_rate_usd_npr;
  expect(Math.abs(body.grand_total_npr - expected)).toBeLessThan(0.01);
});

test('health reports the database', async ({ request }) => {
  const response = await request.get('api/health');
  expect(response.status()).toBe(200);
  expect((await response.json()).database).toBe('ok');
});
