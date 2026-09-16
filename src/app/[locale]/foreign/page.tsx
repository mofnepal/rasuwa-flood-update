import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/metadata';
import { getTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { PALETTE, FUND_STATUS_SOURCE_EN, FUND_STATUS_SOURCE_NE } from '@/lib/constants';
import { formatAsOf, formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';
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
    in_fund: row.in_fund,
    amount_text: row.amount_text,
    report_status: row.report_status,
    stated_to_fund: row.stated_to_fund ?? false,
    fund_register_ref: row.fund_register_ref,
    detail_en: row.detail_en,
    detail_ne: row.detail_ne,
    aid_list_note: (row.aid_list_note as { en?: string; ne?: string } | null) ?? null,
    source_url: row.source_url,
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
          label={t('kpiRegister')}
          sub={t('kpiRegisterSub')}
          value={formatUSD(totals.foreign.identified_usd, locale)}
          foot={t('kpiRegisterFoot', {
            count: formatNumber(totals.foreign.identified_count, locale),
          })}
        />
        <KpiTile
          icon="flag"
          label={t('kpiReported')}
          sub={t('kpiReportedSub')}
          value={formatUSD(totals.foreign.reported_usd, locale)}
          foot={t('kpiReportedFoot', {
            count: formatNumber(totals.foreign.reported_count, locale),
            withUsd: formatNumber(totals.foreign.reported_with_usd, locale),
          })}
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
          <Note>{t('byTypeNote')}</Note>
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
          <>
            <Note>{t('registerNoteMerged')}</Note>
            <ForeignRegister rows={registerRows} />
          </>
        ) : (
          <EmptyState label={ts('awaitingEntry')} />
        )}
      </Card>
    </div>
  );
}
