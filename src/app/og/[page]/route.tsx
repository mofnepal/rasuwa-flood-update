import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';
import { PALETTE, SITE_URL, STATIC_EXPORT } from '@/lib/constants';

export const runtime = 'nodejs';
// Built per request on the ministry's server. The static edition writes each file
// once at build time instead: scripts/build-static.mjs removes this line from its copy.
export const dynamic = 'force-dynamic';

const SIZE = { width: 1200, height: 630 };

const TITLES: Record<string, { ne: string; en: string }> = {
  home: { ne: 'रसुवा–भोटेकोशी बाढी अपडेट', en: 'Rasuwa–Bhotekoshi Flood Update' },
  contributions: { ne: 'प्राप्त सहयोग', en: 'Contributions Received' },
  foreign: { ne: 'वैदेशिक सहयोग', en: 'Foreign Assistance' },
  rescue: { ne: 'उद्धार', en: 'Rescue' },
  initiatives: { ne: 'सरकारबाट भएका पहल', en: 'Government Initiatives' },
  contact: { ne: 'सम्पर्क', en: 'Contact' },
};

/** The static edition draws every card at build time: `home-ne.png`, `home-en.png`, … */
export function generateStaticParams() {
  if (!STATIC_EXPORT) return [];
  return Object.keys(TITLES).flatMap((key) =>
    ['ne', 'en'].map((locale) => ({ page: `${key}-${locale}.png` })),
  );
}

/**
 * One share card per page, carrying the emblem, the page title and the headline
 * figure — so a link shared on X, Facebook or WhatsApp shows the number itself.
 * Addressed as `/og/<page>-<ne|en>.png`; the server also accepts the older
 * `/og/<page>?lang=en`. Drawn on request there, and cached for 5 minutes.
 */
export async function GET(request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const [, key = 'home', named] = /^([a-z]+?)(?:-(ne|en))?(?:\.png)?$/.exec(page) ?? [];
  const queried =
    !STATIC_EXPORT && new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ne';
  const locale = (named ?? queried) as Locale;
  const title = TITLES[key] ?? TITLES.home!;

  const [totals, mukta, emblem] = await Promise.all([
    getTotals(),
    // The share-card renderer reads TrueType, not woff2, so this one original
    // stays alongside the subsetted web fonts.
    readFile(path.join(process.cwd(), 'public', 'fonts', 'Mukta-ExtraBold.ttf')),
    readFile(path.join(process.cwd(), 'public', 'img', 'emblem.png')),
  ]);

  const headline = await headlineFor(key, totals, locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          fontFamily: 'Mukta',
          padding: 64,
          position: 'relative',
        }}
      >
        {/* the red / blue stripe, the only decorative flourish */}
        <div
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, display: 'flex' }}
        >
          <div style={{ flex: 1, background: PALETTE.crimson }} />
          <div style={{ flex: 1, background: PALETTE.navy }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${emblem.toString('base64')}`}
            width={92}
            height={92}
            alt=""
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 26, color: PALETTE.muted }}>
              {locale === 'ne' ? 'नेपाल सरकार' : 'Government of Nepal'}
            </div>
            <div style={{ fontSize: 40, color: PALETTE.navy }}>
              {locale === 'ne' ? 'अर्थ मन्त्रालय' : 'Ministry of Finance'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ fontSize: 46, color: PALETTE.ink, lineHeight: 1.15 }}>
            {locale === 'ne' ? title.ne : title.en}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 26,
              borderLeft: `10px solid ${PALETTE.crimson}`,
              paddingLeft: 24,
            }}
          >
            <div style={{ fontSize: 26, color: PALETTE.muted }}>{headline.label}</div>
            <div style={{ fontSize: 84, color: PALETTE.crimson, lineHeight: 1.1 }}>
              {headline.value}
            </div>
          </div>
          <div style={{ fontSize: 24, color: PALETTE.muted, marginTop: 26 }}>
            {SITE_URL.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [{ name: 'Mukta', data: mukta, weight: 800, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    },
  );
}

/** The one figure that matters on each page. */
async function headlineFor(
  key: string,
  totals: Awaited<ReturnType<typeof getTotals>>,
  locale: Locale,
): Promise<{ label: string; value: string }> {
  const t = (ne: string, en: string) => (locale === 'ne' ? ne : en);
  if (!totals) return { label: t('अद्यावधिक', 'Update'), value: '—' };

  switch (key) {
    case 'foreign':
      return {
        label: t('कुल वैदेशिक सहयोग', 'Total foreign assistance'),
        value: formatUSD(totals.foreign.total_usd, locale),
      };
    case 'contributions':
      return {
        label: t('कुल प्राप्त सहयोग', 'Total contributions received'),
        value: formatNPR(totals.grand_total_npr, locale),
      };
    case 'rescue': {
      const report = await prisma.rescueReport.findFirst({
        where: { disasterId: totals.disasterId, status: 'published', agency: 'NDRRMA' },
        orderBy: { report_at: 'desc' },
      });
      const rescued =
        (report?.data as { rescued_till_date?: number } | null)?.rescued_till_date ?? 0;
      return {
        label: t('उद्धार गरिएका', 'Rescued'),
        value: formatNumber(rescued, locale),
      };
    }
    case 'initiatives': {
      const measures = await prisma.measure.count({
        where: {
          status: 'published',
          decision: { disasterId: totals.disasterId, status: 'published' },
        },
      });
      return {
        label: t('लागू राहत व्यवस्था', 'Relief measures in force'),
        value: formatNumber(measures, locale),
      };
    }
    case 'contact':
      return {
        label: t('एकद्वार प्रणाली', 'Single-window system'),
        value: t('सम्पर्क विवरण', 'Contact details'),
      };
    default:
      return {
        label: t('कुल प्राप्त सहयोग', 'Total contributions received'),
        value: formatNPR(totals.grand_total_npr, locale),
      };
  }
}
