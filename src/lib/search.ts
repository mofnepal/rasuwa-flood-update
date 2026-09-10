import 'server-only';
import { unstable_cache } from 'next/cache';
import { prisma } from './db';
import { getDisaster } from './totals';
import { SECTORS } from './sectors';
import { formatNPR, formatUSD, bsDate, type Locale } from './format';
import { matchSearchIndex, type SearchEntry, type SearchHit } from './search-match';

export type { SearchHit } from './search-match';

const SECTIONS: [string, string, string][] = [
  ['/', 'गृहपृष्ठ', 'Home'],
  ['/contributions', 'प्राप्त सहयोग', 'Contributions'],
  ['/foreign', 'वैदेशिक सहयोग', 'Foreign Assistance'],
  ['/rescue', 'उद्धार', 'Rescue'],
  ['/initiatives', 'सरकारका पहल', 'Government Initiatives'],
  ['/contact', 'सम्पर्क', 'Contact'],
];

const terms = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(' ').toLowerCase();

/**
 * Everything the portal search can find, in result order, built from published
 * records only. The static edition ships it as /open-data/search-<locale>.json
 * and matches in the browser; the server matches the same index in memory.
 */
async function buildSearchIndex(locale: Locale): Promise<SearchEntry[]> {
  const disaster = await getDisaster();
  if (!disaster) return [];
  const disasterId = disaster.id;
  const published = { disasterId, status: 'published' as const };

  const [contributions, foreign, measures, sectorCounts, contacts] = await Promise.all([
    prisma.contribution.findMany({ where: published, orderBy: { amount_npr: 'desc' } }),
    prisma.foreignAssistance.findMany({ where: published }),
    prisma.measure.findMany({
      where: { status: 'published', decision: published },
      orderBy: { no: 'asc' },
    }),
    prisma.contribution.groupBy({ by: ['sector'], where: published, _count: true }),
    prisma.contact.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
  ]);

  const index: SearchEntry[] = [];

  for (const row of contributions) {
    index.push({
      group: 'contributions',
      title: row.contributor_name,
      subtitle: `${bsDate(row.date_ad, row.date_bs, locale)} · ${
        Number(row.amount_npr ?? 0) > 0
          ? formatNPR(Number(row.amount_npr), locale)
          : formatUSD(Number(row.amount_usd ?? 0), locale)
      }`,
      href: `/contributions?q=${encodeURIComponent(row.contributor_name)}#register`,
      terms: terms(row.contributor_name, row.contributor_name_ne),
    });
  }

  for (const row of foreign) {
    index.push({
      group: 'foreign',
      title: row.contributor,
      subtitle: formatUSD(Number(row.amount_usd ?? 0), locale),
      href: `/foreign?q=${encodeURIComponent(row.contributor)}`,
      terms: terms(row.contributor, row.country_en, row.country_ne),
    });
  }

  for (const row of measures) {
    index.push({
      group: 'initiatives',
      title: `${row.no}. ${locale === 'ne' ? row.title_ne : row.title_en}`,
      subtitle: locale === 'ne' ? row.agency_ne : row.agency_en,
      href: `/initiatives?m=${row.no}`,
      terms: terms(row.title_ne, row.title_en, row.agency_ne, row.who_ne),
    });
  }

  const countBySector = new Map(sectorCounts.map((group) => [group.sector, group._count]));
  for (const sector of SECTORS) {
    index.push({
      group: 'sector',
      title: locale === 'ne' ? sector.name_ne : sector.name_en,
      subtitle: `${countBySector.get(sector.code) ?? 0}`,
      href: `/contributions?sector=${sector.code}#register`,
      terms: terms(sector.name_ne, sector.name_en),
    });
  }

  for (const row of contacts) {
    index.push({
      group: 'contact',
      title: locale === 'ne' ? row.name_ne : row.name_en,
      subtitle: row.phone,
      href: '/contact',
      terms: terms(row.name_en, row.name_ne, row.title_en, row.title_ne),
    });
  }

  for (const [href, ne, en] of SECTIONS) {
    index.push({
      group: 'section',
      title: locale === 'ne' ? ne : en,
      subtitle: '',
      href,
      terms: terms(ne, en),
    });
  }

  return index;
}

/** Cached like the totals, and dropped with them when a record is published. */
export const getSearchIndex = unstable_cache(buildSearchIndex, ['portal-search-index'], {
  revalidate: 60,
  tags: ['totals'],
});

/** Site-wide search over published records only. */
export async function searchPortal(
  rawQuery: string,
  locale: Locale,
  limit = 12,
): Promise<SearchHit[]> {
  if (rawQuery.trim().length < 2) return [];
  return matchSearchIndex(await getSearchIndex(locale), rawQuery, limit);
}
