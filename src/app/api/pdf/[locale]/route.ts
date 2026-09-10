import { NextResponse, type NextRequest } from 'next/server';
import { ChromiumUnavailable, renderPagePdf } from '@/lib/pdf';
import { BASE_PATH } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const PAGES = ['', 'contributions', 'foreign', 'rescue', 'initiatives', 'contact'] as const;

/**
 * "Download PDF (ने / EN)" — renders the live page through the print stylesheet.
 * `?page=` selects a section; the default is the home page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: raw } = await params;
  const locale = raw === 'en' ? 'en' : 'ne';
  const page = request.nextUrl.searchParams.get('page') ?? '';
  if (!PAGES.includes(page as (typeof PAGES)[number])) {
    return NextResponse.json({ error: 'unknown page' }, { status: 400 });
  }

  const origin = process.env.PDF_ORIGIN ?? request.nextUrl.origin;
  const target = `${origin}${BASE_PATH}/${locale}${page ? `/${page}` : ''}?static=1`;

  try {
    const pdf = await renderPagePdf(target);
    const name = `MoF-Rasuwa-Bhotekoshi-Flood-Update${page ? `-${page}` : ''}-${locale}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    if (error instanceof ChromiumUnavailable) {
      return NextResponse.json(
        {
          error: 'pdf rendering is not configured on this server',
          hint: "Set PDF_CHROMIUM_PATH to a Chromium binary. Until then, use the browser's own Print to PDF — the page carries an A4 print stylesheet.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: 'the PDF could not be rendered' }, { status: 500 });
  }
}
