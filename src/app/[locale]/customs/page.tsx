import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/metadata';
import { getTotals } from '@/lib/totals';
import { getLatestRevenue } from '@/lib/revenue';
import { formatKharba, formatNPR, formatNumber, formatPercent, type Locale } from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { KpiTile } from '@/components/KpiTile';
import { Card, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HBar } from '@/components/charts/lazy';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The data is cached for 60 seconds and invalidated the moment an admin action
 * publishes or withdraws a record. The static edition renders the page once instead:
 * scripts/build-static.mjs removes this line from its build copy.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'customs' });
  const site = await getTranslations({ locale, namespace: 'site' });
  return pageMetadata({
    locale,
    path: '/customs',
    card: 'customs',
    title: t('title'),
    description: t('intro'),
    siteName: site('portal'),
    imageAlt: site('shareImageAlt'),
  });
}

/** The Department of Customs's revenue target and collection, as it publishes them. */
export default async function CustomsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const t = await getTranslations('customs');
  const ts = await getTranslations('site');

  const totals = await getTotals();
  const revenue = totals ? await getLatestRevenue(totals.disasterId) : null;
  if (!totals || !revenue) return <EmptyState label={ts('awaitingEntry')} />;

  const year = pick(locale, revenue.fiscal_year_bs, revenue.fiscal_year_en);
  const date = pick(locale, revenue.as_of_bs, revenue.as_of_en);
  const fy = revenue.fiscal_year;
  const collectedPct = formatPercent(revenue.collected_npr, revenue.target_npr, locale);
  const elapsedPct = formatPercent(fy.elapsed_days, fy.days, locale);

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <SourceChip>
          {t('source')} · {t('fiscalYear', { year })}
        </SourceChip>
      </div>

      {/* ── the three printed figures, and the share they imply ─────────── */}
      <section className="grid g4">
        <KpiTile
          icon="tax"
          tone="navy"
          label={t('kpiTarget')}
          sub={t('kpiTargetSub', { year })}
          value={formatKharba(revenue.target_npr, locale)}
          foot={formatNPR(revenue.target_npr, locale)}
        />
        <KpiTile
          icon="customs"
          tone="red"
          label={t('kpiCollected')}
          sub={t('kpiCollectedSub', { date })}
          value={formatKharba(revenue.collected_npr, locale)}
          foot={formatNPR(revenue.collected_npr, locale)}
        />
        <KpiTile
          icon="measure"
          label={t('kpiRemaining')}
          sub={t('kpiRemainingSub')}
          value={formatKharba(revenue.remaining_npr, locale)}
          foot={formatNPR(revenue.remaining_npr, locale)}
        />
        <KpiTile
          icon="chart"
          label={t('kpiShare')}
          sub={t('kpiShareSub')}
          value={collectedPct}
          foot={t('kpiShareFoot', { pct: elapsedPct, days: formatNumber(fy.elapsed_days, locale) })}
        />
      </section>

      <section className="grid g64">
        {/* ── progress: collection against time ─────────────────────────── */}
        <Card id="progress">
          <SectionHeader icon="chart" title={t('progressTitle')} subtitle={t('progressSub')} />
          <div className="mini">
            <div>
              <b>{t('barCollected')}</b>
              <span>{t('ofTarget', { pct: collectedPct })}</span>
              <i style={{ width: `${Math.min(100, 100 * revenue.share_of_target)}%` }} />
              <em>{formatKharba(revenue.collected_npr, locale)}</em>
            </div>
            <div>
              <b>{t('barElapsed')}</b>
              <span>
                {t('ofYear', {
                  elapsed: formatNumber(fy.elapsed_days, locale),
                  days: formatNumber(fy.days, locale),
                })}
              </span>
              <i
                style={{
                  width: `${Math.min(100, 100 * fy.elapsed_share)}%`,
                  background: 'var(--red)',
                }}
              />
              <em>{elapsedPct}</em>
            </div>
          </div>
          <p className="ct" style={{ marginTop: 18 }}>
            {t('chartTitle')}
          </p>
          <ChartFrame height={170}>
            <HBar
              data={[
                { name: t('kpiTarget'), value: revenue.target_npr },
                { name: t('kpiCollected'), value: revenue.collected_npr },
                { name: t('kpiRemaining'), value: revenue.remaining_npr },
              ]}
              multicolour
            />
          </ChartFrame>
          <Note>{t('derivedNote')}</Note>
        </Card>

        {/* ── the offices the report names ───────────────────────────────── */}
        <Card>
          <SectionHeader icon="location" title={t('officesTitle')} subtitle={t('officesSub')} />
          <ul className="upd">
            {revenue.offices.map((office) => (
              <li key={office.name_en}>
                <span className={`tag ${office.state === 'damaged' ? 'ind' : 'gov'}`}>
                  {office.state === 'damaged' ? t('stateDamaged') : t('stateClosed')}
                </span>
                <div>
                  <b>{pick(locale, office.name_ne, office.name_en)}</b>
                  {office.note_ne || office.note_en ? (
                    <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                      {pick(locale, office.note_ne ?? '', office.note_en ?? '')}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── the department's own words, and what is stated not corrected ─── */}
      <Card>
        <SectionHeader
          icon="decisions"
          title={t('narrativeTitle')}
          subtitle={t('fiscalYear', { year })}
          right={<SourceChip>{t('source')}</SourceChip>}
        />
        {revenue.narrative_ne || revenue.narrative_en ? (
          <p style={{ margin: '0 0 12px', lineHeight: 1.7 }}>
            {pick(locale, revenue.narrative_ne ?? '', revenue.narrative_en ?? '')}
          </p>
        ) : null}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--mute)' }}>
          {ts('source')}: {pick(locale, revenue.source_ne, revenue.source_en)}
        </p>
        {revenue.remaining_note_ne || revenue.remaining_note_en ? (
          <Note>
            {pick(locale, revenue.remaining_note_ne ?? '', revenue.remaining_note_en ?? '')}
          </Note>
        ) : null}
        {revenue.date_note_ne || revenue.date_note_en ? (
          <Note>{pick(locale, revenue.date_note_ne ?? '', revenue.date_note_en ?? '')}</Note>
        ) : null}
      </Card>
    </div>
  );
}
