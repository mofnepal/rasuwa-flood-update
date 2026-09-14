import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getTotals } from '@/lib/totals';
import type { Locale } from '@/lib/format';
import { PALETTE, SITE_URL, STATIC_EXPORT } from '@/lib/constants';
import { CARD_SIZE, CARD_TITLES, cardHeadline, parseCardName } from '@/lib/share-card';

export const runtime = 'nodejs';
// Built per request on the ministry's server. The static edition writes each file
// once at build time instead: scripts/build-static.mjs removes this line from its copy.
export const dynamic = 'force-dynamic';

/** The static edition draws every card at build time: `home-ne.png`, `home-en.png`, … */
export function generateStaticParams() {
  if (!STATIC_EXPORT) return [];
  return Object.keys(CARD_TITLES).flatMap((key) =>
    ['ne', 'en'].map((locale) => ({ page: `${key}-${locale}.png` })),
  );
}

/**
 * The share card drawn on request, for the ministry's server. Addressed as
 * `/og/<page>-<ne|en>.png`; the server also accepts the older `/og/<page>?lang=en`.
 * Cached for 5 minutes. The static edition overwrites these files with the same
 * card photographed in Chromium (scripts/build-static.mjs), because this renderer
 * does not shape Devanagari conjuncts.
 */
export async function GET(request: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const { key, locale: named } = parseCardName(page);
  const queried: Locale =
    !STATIC_EXPORT && new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ne';
  const locale = named ?? queried;
  const title = CARD_TITLES[key] ?? CARD_TITLES.home!;

  const [totals, mukta, emblem] = await Promise.all([
    getTotals(),
    // The share-card renderer reads TrueType, not woff2, so this one original
    // stays alongside the subsetted web fonts.
    readFile(path.join(process.cwd(), 'public', 'fonts', 'Mukta-ExtraBold.ttf')),
    readFile(path.join(process.cwd(), 'public', 'img', 'emblem.png')),
  ]);

  const headline = await cardHeadline(key, totals, locale);

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
      ...CARD_SIZE,
      fonts: [{ name: 'Mukta', data: mukta, weight: 800, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    },
  );
}
