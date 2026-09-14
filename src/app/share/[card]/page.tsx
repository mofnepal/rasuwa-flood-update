import { notFound } from 'next/navigation';
import { getTotals } from '@/lib/totals';
import { CARD_SIZE, CARD_TITLES, cardHeadline, parseCardName } from '@/lib/share-card';
import { FONT_FACE_CSS } from '@/lib/fonts';
import { BASE_PATH, PALETTE, SITE_URL, STATIC_EXPORT } from '@/lib/constants';
import { formatAsOf } from '@/lib/format';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The static edition renders the page once instead: scripts/build-static.mjs removes
 * this line from its build copy.
 */
export const dynamic = 'force-dynamic';

/** The static edition draws every card: `home-ne`, `home-en`, … */
export function generateStaticParams() {
  if (!STATIC_EXPORT) return [];
  return Object.keys(CARD_TITLES).flatMap((key) =>
    ['ne', 'en'].map((locale) => ({ card: `${key}-${locale}` })),
  );
}

export default async function ShareCardPage({ params }: { params: Promise<{ card: string }> }) {
  const { card } = await params;
  const { key, locale } = parseCardName(card);
  const title = CARD_TITLES[key];
  if (!locale || !title) notFound();

  const totals = await getTotals();
  const headline = await cardHeadline(key, totals, locale);
  const updated = totals?.last_public_update
    ? `${locale === 'ne' ? 'अद्यावधिक' : 'Updated'}: ${formatAsOf(totals.last_public_update, locale)}`
    : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
      <div
        id="card"
        lang={locale}
        style={{
          width: CARD_SIZE.width,
          height: CARD_SIZE.height,
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '58px 64px 48px',
          background: '#FFFFFF',
          color: PALETTE.ink,
          fontFamily: "Mukta, 'Noto Sans Devanagari', system-ui, sans-serif",
          fontWeight: 800,
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
          <img src={`${BASE_PATH}/img/emblem.png`} width={92} height={92} alt="" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 26, lineHeight: 1.3, color: PALETTE.muted, fontWeight: 600 }}>
              {locale === 'ne' ? 'नेपाल सरकार' : 'Government of Nepal'}
            </div>
            <div style={{ fontSize: 40, lineHeight: 1.3, color: PALETTE.navy }}>
              {locale === 'ne' ? 'अर्थ मन्त्रालय' : 'Ministry of Finance'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div style={{ fontSize: 46, lineHeight: 1.3 }}>
            {locale === 'ne' ? title.ne : title.en}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 22,
              borderLeft: `10px solid ${PALETTE.crimson}`,
              paddingLeft: 24,
            }}
          >
            <div style={{ fontSize: 26, lineHeight: 1.3, color: PALETTE.muted, fontWeight: 600 }}>
              {headline.label}
            </div>
            <div
              style={{
                fontSize: 82,
                lineHeight: 1.25,
                color: PALETTE.crimson,
                whiteSpace: 'nowrap',
              }}
            >
              {headline.value}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: 24,
              marginTop: 22,
              fontSize: 24,
              lineHeight: 1.3,
              color: PALETTE.muted,
              fontWeight: 600,
            }}
          >
            <span>{updated ?? ''}</span>
            <span>{SITE_URL.replace(/^https?:\/\//, '')}</span>
          </div>
        </div>
      </div>
    </>
  );
}
