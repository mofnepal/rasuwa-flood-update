import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/metadata';
import { getTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { PALETTE, FUND_STATUS_SOURCE_EN, FUND_STATUS_SOURCE_NE } from '@/lib/constants';
import {
  formatAsOf,
  formatNPR,
  formatNumber,
  formatPercent,
  formatUSD,
  type Locale,
} from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { KpiTile } from '@/components/KpiTile';
import { Card, Chip, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HBar, VBar } from '@/components/charts/lazy';
import { DonateCard } from '@/components/DonateCard';
import { ForeignRegister, type ForeignRow } from './ForeignRegister';

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
  const t = await getTranslations({ locale, namespace: 'foreign' });
  const site = await getTranslations({ locale, namespace: 'site' });
  return pageMetadata({
    locale,
    path: '/foreign',
    card: 'foreign',
    title: t('title'),
    description: t('intro'),
    siteName: site('portal'),
    imageAlt: site('shareImageAlt'),
  });
}

export default async function ForeignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const t = await getTranslations('foreign');
  const ts = await getTranslations('site');
  const ty = await getTranslations('types');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;
  const fund = totals.fund_status;

  const rows = await prisma.foreignAssistance.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: [{ featured: 'desc' }, { amount_usd: 'desc' }],
  });

  const registerRows: ForeignRow[] = rows.map((row) => ({
    id: row.id,
    date_ad: row.date_ad.toISOString(),
    date_bs: row.date_bs,
    contributor: row.contributor,
    contributor_ne: row.contributor_ne,
    country_ne: row.country_ne,
    country_en: row.country_en,
    contributor_type: row.contributor_type,
    kind: row.kind,
    channel: row.channel,
    channel_ne: row.channel_ne,
    amount_usd: Number(row.amount_usd ?? 0),
    amount_npr_equiv: Number(row.amount_npr_equiv ?? 0),
    in_kind_valuation_npr: Number(row.in_kind_valuation_npr ?? 0),
    pledge_received_at: row.pledge_received_at?.toISOString() ?? null,
    published_at: row.publishedAt?.toISOString() ?? null,
  }));

  const byType = new Map<string, number>();
  for (const row of rows) {
    byType.set(
      row.contributor_type,
      (byType.get(row.contributor_type) ?? 0) + Number(row.amount_usd ?? 0),
    );
  }

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <SourceChip>
          {totals.foreign.as_of ? `${ts('asOf')}: ${formatAsOf(totals.foreign.as_of, locale)}` : ''}
        </SourceChip>
      </div>

      <section className="grid g4">
        <KpiTile
          icon="foreign"
          tone="red"
          label={t('kpiTotal')}
          sub={t('kpiTotalSub')}
          value={formatUSD(totals.foreign.total_usd, locale)}
          foot={`≈ ${formatNPR(totals.foreign.total_npr_equiv, locale)} · ${formatNumber(totals.fx_rate, locale, 2)}`}
        />
        <KpiTile
          icon="verified"
          label={t('kpiIdentified')}
          sub={t('kpiIdentifiedSub', {
            percent: formatPercent(totals.foreign.identified_usd, totals.foreign.total_usd, locale),
          })}
          value={formatUSD(totals.foreign.identified_usd, locale)}
          foot={`${formatNumber(totals.foreign.identified_count, locale)} · ${t('register')}`}
        />
        <KpiTile
          icon="missing"
          label={t('kpiAwaiting')}
          value={formatUSD(totals.foreign.unattributed_usd, locale)}
          foot={t('subsetNote')}
        />
        <KpiTile
          icon="bank"
          tone="navy"
          label={t('kpiBalance')}
          sub={
            fund ? t('kpiBalanceSub', { before: formatUSD(fund.usd.before, locale) }) : undefined
          }
          value={fund ? formatUSD(fund.usd.balance, locale) : ts('awaitingEntry')}
          foot={fund ? `≈ ${formatNPR(fund.usd.equiv_npr, locale)}` : undefined}
        />
      </section>

      {/* ── identified vs awaiting attribution ───────────────────────────── */}
      <Card>
        <SectionHeader
          icon="chart"
          title={`${t('identified')} · ${t('unattributed')}`}
          right={
            <SourceChip>
              {locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN}
            </SourceChip>
          }
        />
        <div className="mini">
          <div>
            <b>{t('identified')}</b>
            <span>
              {formatPercent(totals.foreign.identified_usd, totals.foreign.total_usd, locale)}
            </span>
            <i
              style={{
                width: `${(100 * totals.foreign.identified_usd) / (totals.foreign.total_usd || 1)}%`,
              }}
            />
            <em>{formatUSD(totals.foreign.identified_usd, locale)}</em>
          </div>
          <div>
            <b>{t('unattributed')}</b>
            <span>
              {formatPercent(totals.foreign.unattributed_usd, totals.foreign.total_usd, locale)}
            </span>
            <i
              style={{
                width: `${(100 * totals.foreign.unattributed_usd) / (totals.foreign.total_usd || 1)}%`,
                background: PALETTE.navy3,
              }}
            />
            <em>{formatUSD(totals.foreign.unattributed_usd, locale)}</em>
          </div>
        </div>
        <Note>{t('subsetNote')}</Note>
      </Card>

      {/* ── by contributor type, beside the donate panel ─────────────────── */}
      <section className="grid g64">
        <Card>
          <SectionHeader icon="organisation" title={t('byType')} />
          {byType.size ? (
            <ChartFrame height={240}>
              <HBar
                data={[...byType.entries()].map(([type, value]) => ({ name: ty(type), value }))}
                multicolour
                unit="count"
              />
            </ChartFrame>
          ) : (
            <EmptyState label={ts('awaitingEntry')} />
          )}
          <div className="chips" style={{ marginTop: 12 }}>
            {[...byType.entries()].map(([type, value]) => (
              <Chip key={type}>
                {ty(type)}: {formatUSD(value, locale)}
              </Chip>
            ))}
          </div>
        </Card>
        <DonateCard />
      </section>

      {/* ── daily deposits into the USD accounts ─────────────────────────── */}
      {fund ? (
        <Card>
          <SectionHeader
            icon="chart"
            title={t('dailyUsdTitle')}
            subtitle={pick(locale, fund.as_of_bs, fund.as_of_en)}
            right={
              <SourceChip>
                {locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN}
              </SourceChip>
            }
          />
          <ChartFrame height={260}>
            <VBar
              data={fund.dates_bs.map((label, index) => ({
                name: locale === 'ne' ? label : (fund.dates_ad[index] ?? label).slice(5),
                value: fund.usd.daily_series[index] ?? 0,
              }))}
              unit="usd"
              color={PALETTE.crimson}
            />
          </ChartFrame>
          <Note>{t('dailyUsdNote')}</Note>
        </Card>
      ) : null}

      {/* ── register ─────────────────────────────────────────────────────── */}
      <Card id="register">
        <SectionHeader
          icon="foreign"
          title={t('register')}
          subtitle={t('subsetNote')}
          right={<SourceChip>{rows[0]?.source ?? ''}</SourceChip>}
        />
        {registerRows.length ? (
          <ForeignRegister rows={registerRows} />
        ) : (
          <EmptyState label={ts('awaitingEntry')} />
        )}
      </Card>
    </div>
  );
}
