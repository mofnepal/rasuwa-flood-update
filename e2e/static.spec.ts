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
  { path: 'rescue/', ne: 'उद्धार तथा राहत', en: 'Rescue & Relief' },
  { path: 'initiatives/', ne: 'सरकारबाट भएका पहल', en: 'Government initiatives' },
  { path: 'plans/', ne: 'सरकारका कार्ययोजना', en: 'Government Action Plans' },
  { path: 'revenue/', ne: 'राजस्व', en: 'Revenue' },
  { path: 'contact/', ne: 'सम्पर्क विवरण', en: 'contact details' },
] as const;

/**
 * Opens a page and waits until React has taken it over — the Nepal-time clock is
 * only rendered in the browser. Waiting for `load` instead would wait on the live
 * NDRRMA embed, a third-party page that can take most of a minute.
 */
async function open(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.locator('.ticker .clock').waitFor();
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

test('the rescue page shows the latest report; earlier dates open from the archive', async ({
  page,
}) => {
  await open(page, 'ne/rescue/');
  // No row of date cards above the figures: the latest report is what the page shows.
  await expect(page.locator('.tabs')).toHaveCount(0);
  const dates = page.locator('table.tbl td.nm a');
  expect(await dates.count()).toBeGreaterThan(1);
  await expect(dates.first()).toHaveAttribute('aria-current', 'page');
  await dates.nth(1).click();
  await expect(page).toHaveURL(/\/ne\/rescue\/\d{4}-\d{2}-\d{2}\/$/);
  await expect(page.locator('table.tbl td.nm a').nth(1)).toHaveAttribute('aria-current', 'page');
});

test('the foreign register lists the Prime Minister’s Office support beside verified deposits, by source', async ({
  page,
}) => {
  await open(page, 'en/foreign/');
  await expect(page.locator('.kpi')).toHaveCount(4);
  await expect(page.locator('body')).not.toContainText('Awaiting attribution');
  await expect(page.locator('body')).not.toContainText('Reported by');
  const register = page.locator('#register');
  await register.scrollIntoViewIfNeeded();
  // One register, categorised: countries, organisations, companies.
  await register.getByRole('tab', { name: 'Companies' }).click();
  await expect(register.locator('tbody tr')).toHaveCount(6);
  await register.getByRole('tab', { name: 'Countries' }).click();
  await expect(register).toContainText('United Arab Emirates');
  // The only mark of origin is the source column.
  await expect(register.locator('tbody .chip.n').first()).toHaveText("Prime Minister's Office");
  await register.locator('select').first().selectOption('mof');
  await expect(register.locator('tbody tr')).toHaveCount(2);
});

test('announced domestic support is listed on the contributions page and never counted', async ({
  page,
}) => {
  await open(page, 'en/contributions/');
  await expect(page.locator('.kpi').first()).toContainText('NPR 15,54,20,01,339');
  const card = page.locator('#announced');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.kpi')).toHaveCount(3);
  await expect(card.locator('.kpi').first()).toContainText('NPR 55,18,30,000');
  await expect(card.locator('table.tbl tbody tr')).toHaveCount(9);
  await expect(card).toContainText('Armed Police Force');
  await card.getByRole('tab', { name: 'Pledged' }).click();
  await expect(card.locator('table.tbl tbody tr')).toHaveCount(7);
});

test('the revenue page shows customs and inland revenue as printed, each in its own section', async ({
  page,
}) => {
  await open(page, 'en/revenue/');
  const customs = page.locator('#customs');
  await expect(customs.locator('.kpi')).toHaveCount(4);
  await expect(customs.locator('.kpi').nth(0)).toContainText('NPR 628 billion');
  await expect(customs.locator('.kpi').nth(1)).toContainText('NPR 102 billion');
  // The Department prints 527 billion where the arithmetic gives 526; the print wins.
  await expect(customs.locator('.kpi').nth(2)).toContainText('NPR 527 billion');
  await expect(customs.locator('#progress .mini > div')).toHaveCount(2);
  await expect(customs).toContainText('Tatopani Customs Office');
  const ird = page.locator('#ird');
  await expect(ird.locator('.kpi')).toHaveCount(4);
  await expect(ird.locator('.kpi').nth(0)).toContainText('NPR 1,580.32 billion');
  await expect(ird.locator('.kpi').nth(1)).toContainText('NPR 202.72 billion');
  await expect(ird.locator('.kpi').nth(1)).toContainText('61.39%');
  await expect(ird.locator('#ird-progress .mini > div')).toHaveCount(4);
  await expect(ird.locator('table.tbl tbody tr')).toHaveCount(4);
  await expect(ird).toContainText('2082/83');
  // The home dashboard carries both departments in the source's own words.
  await open(page, 'ne/');
  await expect(page.locator('#revenue')).toContainText('रु. ६ खर्ब २८ अर्ब');
  await expect(page.locator('#revenue')).toContainText('रु. १५ खर्ब ८० अर्ब ३२ करोड');
});

test('the fund usage card shows the transfer out of the Fund and every onward disbursement', async ({
  page,
}) => {
  await open(page, 'en/contributions/');
  const card = page.locator('#usage');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.kpi')).toHaveCount(4);
  await expect(card.locator('.flow > div')).toHaveCount(4);
  // The transfer out of the Fund is the statement's fund-usage figure.
  await expect(card.locator('.kpi').nth(1)).toContainText('NPR 1,00,00,00,000');
  // One transfer plus the four onward disbursements of the Bhadra 21 report.
  await expect(card.locator('table.tbl tbody tr')).toHaveCount(5);
  await expect(card).toContainText('15 affected local governments');
});

test('the action plan shows every action, and its roadmap filters the list', async ({ page }) => {
  await open(page, 'en/plans/');
  await expect(page.locator('h1')).toContainText('Government Action Plans');
  // Every numbered action of the plan is listed, in the plan's own numbering.
  const actions = page.locator('.plan-actions > li');
  const total = await actions.count();
  expect(total).toBeGreaterThanOrEqual(21);
  await expect(actions.first().locator('.no')).toHaveText('1');
  // The roadmap has one column per deadline; the numbers in it add up to the actions.
  const columns = page.locator('.roadmap .col');
  expect(await columns.count()).toBeGreaterThan(3);
  const counted = await columns
    .locator('.head em')
    .allInnerTexts()
    .then((texts) => texts.reduce((sum, text) => sum + Number(text.replace(/,/g, '')), 0));
  expect(counted).toBe(total);
  // Choosing a deadline column narrows the list to that column's actions.
  const first = columns.first();
  const inColumn = await first.locator('.num').count();
  await first.locator('.head').click();
  await expect(page.locator('.plan-actions > li')).toHaveCount(inColumn);
  await page.locator('.planfilters .btn').click();
  await expect(page.locator('.plan-actions > li')).toHaveCount(total);
  // An action opens to its full wording and names the body responsible.
  await actions.nth(6).locator('.ttl').click();
  await expect(actions.nth(6).locator('.detail')).toContainText('Responsible');
});

test('an action of the plan can be deep-linked', async ({ page }) => {
  await open(page, 'ne/plans/?a=21');
  await expect(page.locator('#action-21.open .detail')).toBeVisible();
  await expect(page.locator('#action-21 .detail')).toContainText('नेपाल राष्ट्र बैंक');
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

test('downloads are switched off: no CSV or JSON links, only print', async ({ page }) => {
  await open(page, 'en/contributions/');
  await expect(page.getByRole('button', { name: /CSV/ })).toHaveCount(0);
  await expect(page.locator('a[href$=".csv"], a[href$=".json"], a[href*="/api/"]')).toHaveCount(0);
  await expect(
    page.locator('footer').getByRole('button', { name: /Print or save as PDF/ }),
  ).toBeVisible();
});

test('the ticker shows the current date and time in Nepal', async ({ page }) => {
  await open(page, 'en/');
  const clock = page.locator('.ticker .clock');
  await expect(clock).toContainText('Nepal time');
  const year = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
  }).format(new Date());
  await expect(clock).toContainText(year);
});

test('every bar in every chart carries its label', async ({ page }) => {
  for (const path of [
    'en/',
    'ne/contributions/',
    'en/contributions/',
    'en/foreign/',
    'ne/rescue/',
    'en/initiatives/',
  ]) {
    await open(page, `${path}?static=1`);
    // Charts are drawn once scrolled into view; bring each one on screen first.
    for (const chart of await page.locator('.recharts-wrapper').all()) {
      await chart.scrollIntoViewIfNeeded();
    }
    await page.waitForTimeout(800);
    const missing = await page.evaluate(() =>
      [...document.querySelectorAll('.recharts-wrapper')].flatMap((chart) => {
        const bars = [...chart.querySelectorAll('.recharts-bar-rectangle')];
        if (!bars.length) return [];
        // Horizontal bars share a left edge, so their names are on the y axis. The
        // chart library draws axis labels in a layer of their own, beside the axis.
        const lefts = new Set(bars.map((bar) => Math.round(bar.getBoundingClientRect().left)));
        const axis = lefts.size === 1 && bars.length > 1 ? 'recharts-yAxis' : 'recharts-xAxis';
        const labels = chart.querySelectorAll(`.${axis}-tick-labels text`);
        const title = chart.closest('.card')?.querySelector('h2, h3, .sh b, b')?.textContent ?? '';
        return labels.length >= bars.length
          ? []
          : [`${title.trim()}: ${labels.length} labels for ${bars.length} bars`];
      }),
    );
    expect(missing, path).toEqual([]);
  }
});

test('the emblem favicon, app icons and web manifest are published', async ({ request }) => {
  for (const [file, type] of [
    ['favicon.ico', 'image/'],
    ['img/favicon-16.png', 'image/png'],
    ['img/favicon-32.png', 'image/png'],
    ['img/favicon-48.png', 'image/png'],
    ['img/icon-192.png', 'image/png'],
    ['img/icon-512.png', 'image/png'],
    ['img/apple-touch-icon.png', 'image/png'],
  ] as const) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect(response.headers()['content-type'], file).toContain(type);
  }
  const manifest = await request.get('manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const body = JSON.parse(await manifest.text()) as { icons: { sizes: string }[] };
  expect(body.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);
});

test('every page, and the bare site address, carries its favicon and a full link preview', async ({
  request,
}) => {
  const origin = new URL(test.info().project.use.baseURL ?? 'http://localhost').origin;
  const tag = (html: string, key: string) =>
    new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`).exec(html)?.[1] ?? '';

  for (const target of [
    '',
    'ne/',
    'en/',
    'en/contributions/',
    'ne/foreign/',
    'en/rescue/',
    'ne/initiatives/',
    'en/contact/',
  ]) {
    const html = await (await request.get(target)).text();
    const where = target || '(site root)';

    expect(html, `${where}: favicon`).toMatch(/<link rel="icon" href="[^"]*\/favicon\.ico"/);
    expect(html, `${where}: manifest`).toMatch(
      /<link rel="manifest" href="[^"]*\/manifest\.webmanifest"/,
    );
    expect(tag(html, 'og:title'), `${where}: og:title`).not.toBe('');
    expect(tag(html, 'og:description'), `${where}: og:description`).not.toBe('');
    expect(tag(html, 'og:site_name'), `${where}: og:site_name`).not.toBe('');
    expect(tag(html, 'og:url'), `${where}: og:url`).toMatch(new RegExp(`/${target}$`));
    expect(tag(html, 'twitter:card'), `${where}: twitter:card`).toBe('summary_large_image');

    // The preview image is an absolute address; it must exist in this build.
    const image = tag(html, 'og:image');
    expect(image, `${where}: og:image`).toMatch(/^https?:\/\/.+\/og\/[a-z]+-(ne|en)\.png$/);
    const card = await request.get(`${origin}${new URL(image).pathname}`);
    expect(card.status(), `${where}: ${image}`).toBe(200);
    expect(card.headers()['content-type']).toContain('image/png');
  }
});
