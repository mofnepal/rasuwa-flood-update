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
  await open(page, 'ne/contributions/');
  // On a phone the toggle sits beside the search, without opening the menu.
  const toggle = page.locator(testInfo.project.name === 'mobile' ? '.srow .lang' : '.tools .lang');
  await expect(toggle).toBeVisible();
  await toggle.getByRole('button', { name: 'EN' }).click();
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
  await open(page, 'en/');
  const search = page.locator('.gsearch input');
  // Wide enough to read what is typed: on a desktop it was once squeezed beside the
  // title. On a phone it shares its row with the language toggle.
  const minimum = testInfo.project.name === 'mobile' ? 200 : 600;
  expect((await search.boundingBox())?.width ?? 0).toBeGreaterThan(minimum);
  await search.fill('Kumari');
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

test('on a phone nothing runs off the screen or out of its chart', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'a phone-width check');
  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 800 });
    for (const locale of LOCALES) {
      for (const target of PAGES) {
        await open(page, `${locale}/${target.path}?static=1`);
        // Charts are drawn after the page loads.
        await page.waitForTimeout(800);
        const problems = await page.evaluate(() => {
          const found: string[] = [];
          const screen = document.documentElement.clientWidth;
          const name = (el: Element) =>
            `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 40)}"`;
          const scrolls = (el: Element) => {
            for (let up = el.parentElement; up; up = up.parentElement) {
              const overflow = getComputedStyle(up).overflowX;
              if (overflow === 'auto' || overflow === 'scroll') return true;
            }
            return false;
          };
          for (const el of document.querySelectorAll('.top *, .ticker *, main *, footer *')) {
            if (el.closest('iframe, nav.main, .gsr, .drawer')) continue;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const box = el.getBoundingClientRect();
            if (!box.width || !box.height || scrolls(el)) continue;
            if (box.right > screen + 1 || box.left < -1) found.push(`off the screen: ${name(el)}`);
          }
          for (const text of document.querySelectorAll('svg text')) {
            const svg = text.closest('svg')!.getBoundingClientRect();
            const box = text.getBoundingClientRect();
            if (box.width && (box.left < svg.left - 1 || box.right > svg.right + 1)) {
              found.push(`outside its chart: ${name(text)}`);
            }
          }
          // The figure in a donut stays inside the ring's hole (68% of its width).
          for (const donut of document.querySelectorAll('.donutbox .cv')) {
            const hole = donut.getBoundingClientRect().width * 0.68;
            const figure = donut.querySelector('.c b')?.getBoundingClientRect().width ?? 0;
            if (figure > hole)
              found.push(`donut figure ${Math.round(figure)}px in a ${Math.round(hole)}px hole`);
          }
          return [...new Set(found)];
        });
        expect(problems, `${width}px ${locale}/${target.path}`).toEqual([]);
      }
    }
  }
});

test('on a phone, home is one tap away and the emblem leads home too', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'a phone-width check');
  await open(page, 'en/contributions/');
  const home = page.locator('.tools .homebtn');
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('.tools .homebtn')).toHaveAttribute('aria-current', 'page');

  await open(page, 'ne/rescue/');
  await page.locator('.brand').click();
  await expect(page).toHaveURL(/\/ne\/$/);
});
