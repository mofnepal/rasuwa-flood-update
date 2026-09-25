/**
 * The acceptance checks for the portal, run against a live server.
 *   node scripts/acceptance.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';

const BASE = (process.argv[2] ?? 'http://localhost:3111/rasuwa-flood').replace(/\/$/, '');
const PAGES = [
  '',
  '/contributions',
  '/foreign',
  '/rescue',
  '/initiatives',
  '/plans',
  '/revenue',
  '/contact',
];

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const text = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.locator('footer').waitFor();
  await page.waitForTimeout(1800);
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ');
};

// ── 1. figures ─────────────────────────────────────────────────────────────
console.log('\nFigures');
const neHome = await text('/ne');
const enHome = await text('/en');
check(neHome.includes('रु. १५,५४,२०,०१,३३९'), 'grand total, Nepali', 'रु. १५,५४,२०,०१,३३९');
check(enHome.includes('NPR 15,54,20,01,339'), 'grand total, English', 'NPR 15,54,20,01,339');
check(enHome.includes('15,60,37,29,530'), 'available fund balance 15,603,729,530');

const enForeign = await text('/en/foreign');
check(enForeign.includes('USD 24,885,498'), 'foreign total USD 24,885,498');
check(enForeign.includes('USD 11,215,654'), 'identified USD 11,215,654 (register tile)');
check(enForeign.includes('USD 50,473,800'), 'OPMCM-stated international support USD 50,473,800');

const enContrib = await text('/en/contributions');
check(enContrib.includes('NPR 2,73,76,30,634'), 'handovers NPR 2,737,630,633.82');
check(/485 entries/.test(enContrib), 'handover register is 485 entries');
check(
  enContrib.includes('NPR 55,18,30,000'),
  'announced domestic pledges NPR 551,830,000, listed not counted',
);

const enRevenue = await text('/en/revenue');
check(enRevenue.includes('NPR 628 billion'), 'customs revenue target NPR 628 billion');
check(enRevenue.includes('NPR 102 billion'), 'customs revenue collected NPR 102 billion');
check(
  enRevenue.includes('NPR 527 billion'),
  'customs revenue remaining NPR 527 billion, as printed',
);
check(
  enRevenue.includes('NPR 1,580.32 billion'),
  'inland revenue annual target NPR 1,580.32 billion',
);
check(enRevenue.includes('NPR 202.72 billion'), 'inland revenue collected NPR 202.72 billion');
check(enRevenue.includes('61.39%'), 'inland revenue achievement 61.39%, as printed');

// ── 2. forbidden strings ───────────────────────────────────────────────────
console.log('\nForbidden text');
const forbidden = [
  ['undefined', /\bundefined\b/],
  ['NaN', /\bNaN\b/],
  ['Rs', /\bRs\.?\s/],
  ['a formula', /[ABCD]\s*\+\s*[ABCD]\s*\+/],
  ['a file name', /data\.js|\.tsx|\.prisma|seed\//],
  // A machine field name that escaped onto a page: nepali_army, hospitals_discharged.
  ['a field name', /\b[a-z][a-z0-9]*(_[a-z0-9]+)+\b/],
];
for (const locale of ['ne', 'en']) {
  for (const path of PAGES) {
    const body = await text(`/${locale}${path}`);
    for (const [label, pattern] of forbidden) {
      const hit = body.match(pattern);
      if (hit) check(false, `${locale}${path || '/'} contains "${label}"`, hit[0]);
    }
    // The office acronym is allowed only as the rescue portal's owner label.
    const opmcm = [...body.matchAll(/OPMCM/g)].length;
    const allowed = path === '/rescue' ? 1 : 0;
    if (opmcm > allowed) check(false, `${locale}${path || '/'} uses "OPMCM" ${opmcm} time(s)`);
  }
}
check(true, 'no undefined / NaN / Rs / formulas / file names on any page, both languages');

// ── 3. layout ──────────────────────────────────────────────────────────────
console.log('\nLayout');
for (const width of [1280, 1024, 768, 390]) {
  await page.setViewportSize({ width, height: 900 });
  const bad = [];
  for (const locale of ['ne', 'en']) {
    for (const path of PAGES) {
      await page.goto(`${BASE}/${locale}${path}`, { waitUntil: 'domcontentloaded' });
      await page.locator('footer').waitFor();
      await page.waitForTimeout(1800);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (over > 1) bad.push(`${locale}${path || '/'} +${over}px`);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll('.kpi .v, .total b, .feat .big')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => (el.textContent || '').trim().slice(0, 30)),
      );
      if (clipped.length) bad.push(`${locale}${path || '/'} clipped: ${clipped.join(', ')}`);
    }
  }
  check(bad.length === 0, `${width}px — no overflow, no clipped figures`, bad.join('; '));
}

// ── 4. contacts ────────────────────────────────────────────────────────────
console.log('\nContacts');
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/ne/contact`, { waitUntil: 'domcontentloaded' });
await page.locator('#ctbl tbody tr').first().waitFor();
const rows = await page.locator('#ctbl tbody tr').count();
check(rows === 6, 'exactly six contacts', `found ${rows}`);
const intro = await page.locator('.ph p').first().innerText();
check(
  intro.includes('एकद्वार प्रणाली अर्थ मन्त्रालय मार्फत सञ्चालन गरिएको छ'),
  'the single-window notice sentence is printed verbatim',
);
const niraj = await page.locator('#ctbl tbody tr', { hasText: 'निरज' }).first().innerText();
check(/आइटी/.test(niraj) && /IT/.test(niraj), 'Niraj Bhusal — आइटी / IT');
check(/सचिवालय/.test(niraj), 'listed under the Finance Minister’s Secretariat group');

console.log(`\n${failures === 0 ? 'ALL ACCEPTANCE CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
