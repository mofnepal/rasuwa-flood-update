import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { searchPortal } from '@/lib/search';
import type { Locale } from '@/lib/format';
import { Card, EmptyState, SectionHeader } from '@/components/ui';

/**
 * Search runs against the database on every request, so this page is never
 * prerendered — and the build does not need a database.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });
  return { title: t('title') };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const { q = '' } = await searchParams;

  const t = await getTranslations('search');
  const hits = q.trim().length >= 2 ? await searchPortal(q, locale, 40) : [];

  const groups = new Map<string, typeof hits>();
  for (const hit of hits) {
    groups.set(hit.group, [...(groups.get(hit.group) ?? []), hit]);
  }

  const groupLabel = (group: string) =>
    ({
      contributions: t('groupContributions'),
      foreign: t('groupForeign'),
      initiatives: t('groupInitiatives'),
      sector: t('groupSector'),
      contact: t('groupContact'),
      section: t('groupSection'),
    })[group] ?? group;

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          {q ? <p>{t('resultsFor', { query: q })}</p> : null}
        </div>
      </div>

      {hits.length ? (
        [...groups.entries()].map(([group, groupHits]) => (
          <Card key={group}>
            <SectionHeader icon="search" title={groupLabel(group)} />
            <ul className="upd">
              {groupHits.map((hit, index) => (
                <li key={`${hit.href}-${index}`}>
                  <span>{hit.subtitle}</span>
                  <Link href={hit.href}>{hit.title}</Link>
                </li>
              ))}
            </ul>
          </Card>
        ))
      ) : (
        <EmptyState label={t('noResults')} />
      )}
    </div>
  );
}
