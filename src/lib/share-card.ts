import { prisma } from './db';
import type { getTotals } from './totals';
import { formatNPR, formatNumber, formatUSD, type Locale } from './format';

/**
 * The share card — the picture a link to the portal shows on X, Facebook,
 * WhatsApp or Viber, and beside a search result. One per page and language,
 * carrying the emblem, the page title, the headline figure and its cut-off time.
 *
 * Two renderers draw the same card from what is defined here:
 *   - `app/share/[card]` renders it as an HTML page, and the static build
 *     photographs that page in Chromium — the only renderer that shapes
 *     Devanagari conjuncts correctly (मन्त्रालय, प्राप्त);
 *   - `app/og/[page]` draws it on request on the ministry's server.
 */
export const CARD_SIZE = { width: 1200, height: 630 };

export const CARD_TITLES: Record<string, { ne: string; en: string }> = {
  home: { ne: 'रसुवा–भोटेकोशी बाढी अपडेट', en: 'Rasuwa–Bhotekoshi Flood Update' },
  contributions: { ne: 'प्राप्त सहयोग', en: 'Contributions Received' },
  foreign: { ne: 'वैदेशिक सहयोग', en: 'Foreign Assistance' },
  rescue: { ne: 'उद्धार', en: 'Rescue' },
  initiatives: { ne: 'सरकारबाट भएका पहल', en: 'Government Initiatives' },
  contact: { ne: 'सम्पर्क', en: 'Contact' },
};

/** `home-ne`, `home-ne.png`, `home` → the page key and, where given, the language. */
export function parseCardName(name: string): { key: string; locale: Locale | null } {
  const [, key = 'home', locale] = /^([a-z]+?)(?:-(ne|en))?(?:\.png)?$/.exec(name) ?? [];
  return { key, locale: (locale as Locale | undefined) ?? null };
}

export type Totals = Awaited<ReturnType<typeof getTotals>>;

/** The one figure that matters on each page, with its label. */
export async function cardHeadline(
  key: string,
  totals: Totals,
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
    case 'rescue': {
      const report = await prisma.rescueReport.findFirst({
        where: { disasterId: totals.disasterId, status: 'published', agency: 'NDRRMA' },
        orderBy: { report_at: 'desc' },
      });
      const rescued =
        (report?.data as { rescued_till_date?: number } | null)?.rescued_till_date ?? 0;
      return { label: t('उद्धार गरिएका', 'Rescued'), value: formatNumber(rescued, locale) };
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
      // home and contributions
      return {
        label: t('कुल प्राप्त सहयोग', 'Total contributions received'),
        value: formatNPR(totals.grand_total_npr, locale),
      };
  }
}
