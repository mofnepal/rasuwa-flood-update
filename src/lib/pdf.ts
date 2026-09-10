import 'server-only';
import { chromium } from 'playwright-core';

/**
 * Renders a public page to A4 using the portal's own print stylesheet, so the
 * download matches what the page prints from a browser.
 *
 * The renderer needs a Chromium binary. In the Docker image one is installed and
 * PDF_CHROMIUM_PATH points at it; where none is available the caller is told so
 * plainly rather than being handed a broken file.
 */
export class ChromiumUnavailable extends Error {
  constructor() {
    super('no Chromium binary is available to render the PDF');
    this.name = 'ChromiumUnavailable';
  }
}

export async function renderPagePdf(url: string): Promise<Buffer> {
  const executablePath = process.env.PDF_CHROMIUM_PATH;

  let browser;
  try {
    browser = await chromium.launch({
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  } catch {
    throw new ChromiumUnavailable();
  }

  try {
    const page = await browser.newPage();
    // `?static=1` disables the count-up and chart animations, so every figure is
    // final before the page is captured.
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(600);

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: 0.85,
      margin: { top: '12mm', bottom: '16mm', left: '10mm', right: '10mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#5B6478;padding:0 10mm;
                    display:flex;justify-content:space-between;font-family:sans-serif">
          <span>नेपाल सरकार, अर्थ मन्त्रालय — Government of Nepal, Ministry of Finance</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
    });
  } finally {
    await browser.close();
  }
}
