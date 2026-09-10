import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTotals, settlementGap } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { PALETTE, FUND_STATUS_SOURCE_NE, FUND_STATUS_SOURCE_EN } from '@/lib/constants';
import {
  bsDate,
  formatAsOf,
  formatNPR,
  formatNumber,
  formatPercent,
  formatUSD,
  type Locale,
} from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { SECTOR_NOTE_EN, SECTOR_NOTE_NE, sectorName } from '@/lib/sectors';
import {
  CATEGORY_BLOCK_SUBTITLE_EN,
  CATEGORY_BLOCK_SUBTITLE_NE,
  CATEGORY_BLOCK_TITLE_EN,
  CATEGORY_BLOCK_TITLE_NE,
  CONTRIBUTION_CATEGORIES,
  categoryDescription,
  categoryName,
} from '@/lib/categories';
import { KpiTile } from '@/components/KpiTile';
import { Card, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { DualTrend, HBar, TrendLine, VBar } from '@/components/charts/lazy';
import { ContributionRegister, type RegisterRow } from './ContributionRegister';
import { BankTable, type BankRow } from './BankTable';
import { SectorPanel } from './SectorPanel';

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
  const t = await getTranslations({ locale, namespace: 'contributions' });
  return {
    title: t('title'),
    description: t('intro'),

    openGraph: { images: [{ url: `/og/contributions-${locale}.png`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [`/og/contributions-${locale}.png`] },
  };
}

export default async function ContributionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const t = await getTranslations('contributions');
  const ts = await getTranslations('site');
  const th = await getTranslations('home');
  const tt = await getTranslations('table');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;

  const rows = await prisma.contribution.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: [{ date_ad: 'desc' }, { sn: 'desc' }],
  });

  const registerRows: RegisterRow[] = rows.map((row) => ({
    id: row.id,
    sn: row.sn,
    date_ad: row.date_ad.toISOString(),
    date_bs: row.date_bs,
    name: row.contributor_name,
    name_ne: row.contributor_name_ne,
    contributor_type: row.contributor_type,
    payment_mode: row.payment_mode,
    sector: row.sector,
    amount_npr: Number(row.amount_npr ?? 0),
    amount_usd: Number(row.amount_usd ?? 0),
    fx_rate: Number(row.fx_rate ?? totals.fx_rate),
    verified_at: row.verifiedAt?.toISOString() ?? null,
    published_at: row.publishedAt?.toISOString() ?? null,
  }));

  const nchl = totals.networks.find((n) => n.network === 'NCHL');
  const fonepay = totals.networks.find((n) => n.network === 'FONEPAY');
  const fund = totals.fund_status;
  const gap = settlementGap(totals);
  // The statement publishes a before-the-flood figure per bank only for the USD
  // accounts; for the rupee accounts it publishes one total, so the per-bank
  // comparison there is against the date the statement itself compares against.
  const bankRows: BankRow[] = fund
    ? [
        ...fund.npr.banks.map(([bank, compare, balance]) => ({
          id: `npr-${bank}`,
          bank,
          currency: 'NPR' as const,
          compare,
          balance,
          change: balance - compare,
        })),
        ...fund.usd.banks.map(([bank, compare, balance]) => ({
          id: `usd-${bank}`,
          bank,
          currency: 'USD' as const,
          compare,
          balance,
          change: balance - compare,
        })),
      ]
    : [];

  const averageOnline = totals.digital_txn_count
    ? totals.digital_npr / totals.digital_txn_count
    : 0;

  return (
    <div className="stack" id="top">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <div className="tabs">
          <a className="on" href="#top">
            {t('tabAll')}
          </a>
          {nchl ? <a href="#nchl">NCHL</a> : null}
          {fonepay ? <a href="#fonepay">Fonepay</a> : null}
          {fund ? <a href="#nrb">{t('tabBankWise')}</a> : null}
          <a href="#register">{t('tabHandover')}</a>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <section className="grid g4">
        <KpiTile
          icon="fund"
          tone="red"
          label={t('kpiGrand')}
          sub={th('grandTotalNote')}
          value={formatNPR(totals.grand_total_npr, locale)}
          countTo={{
            value: totals.grand_total_npr,
            prefix: locale === 'ne' ? 'रु. ' : 'NPR ',
          }}
          foot={ts('reconciliationNote')}
        />
        <KpiTile
          icon="online"
          label={t('kpiDigital')}
          sub="NCHL + Fonepay"
          value={formatNPR(totals.digital_npr, locale)}
          foot={`${formatNumber(totals.digital_txn_count, locale)} ${th('transactions')}`}
        />
        <KpiTile
          icon="handover"
          label={t('kpiInPerson')}
          sub={th('handoverSub')}
          value={formatNPR(totals.handover.total_npr, locale)}
          foot={t('handoverSubline', {
            entries: formatNumber(totals.handover.entries, locale),
            donors: formatNumber(totals.handover.unique_donors, locale),
          })}
        />
        <KpiTile
          icon="chart"
          tone="navy"
          label={t('kpiAverage')}
          sub="NCHL + Fonepay"
          value={formatNPR(averageOnline, locale)}
          foot={
            totals.handover.average_npr
              ? `${t('kpiInPerson')}: ${formatNPR(totals.handover.average_npr, locale)}`
              : undefined
          }
        />
      </section>

      {/* ── the four categories, explained in words ──────────────────────── */}
      <Card id="categories">
        <SectionHeader
          icon="chart"
          title={locale === 'ne' ? CATEGORY_BLOCK_TITLE_NE : CATEGORY_BLOCK_TITLE_EN}
          subtitle={locale === 'ne' ? CATEGORY_BLOCK_SUBTITLE_NE : CATEGORY_BLOCK_SUBTITLE_EN}
        />
        <div className="grid g4 catg">
          {CONTRIBUTION_CATEGORIES.map((category) => (
            <div key={category.code}>
              <em>{category.code}</em>
              <b>{categoryName(category, locale)}</b>
              <p>{categoryDescription(category, locale)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── channel charts ───────────────────────────────────────────────── */}
      <section className="grid g2">
        {nchl ? (
          <Card id="nchl">
            <SectionHeader
              icon="bank"
              title={th('nchlChannels')}
              subtitle={th('nchlSub')}
              right={<SourceChip>NCHL · {formatAsOf(nchl.as_of!, locale)}</SourceChip>}
            />
            <ChartFrame height={280}>
              <HBar
                data={nchl.channels.map((channel) => ({
                  name: pick(locale, channel.label_ne, channel.label_en),
                  value: channel.amount_npr,
                  count: channel.txn_count,
                }))}
                countLabel={th('transactions')}
              />
            </ChartFrame>
            <div className="mini" style={{ marginTop: 14 }}>
              {nchl.channels.map((channel) => (
                <div key={channel.code}>
                  <b>{pick(locale, channel.label_ne, channel.label_en)}</b>
                  <span>
                    {formatNumber(channel.txn_count, locale)} {th('transactions')} ·{' '}
                    {formatPercent(channel.amount_npr, nchl.total_npr, locale)}
                  </span>
                  <i style={{ width: `${(100 * channel.amount_npr) / nchl.total_npr}%` }} />
                  <em>{formatNPR(channel.amount_npr, locale)}</em>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {fonepay ? (
          <Card id="fonepay">
            <SectionHeader
              icon="qr"
              title={th('fonepayChannels')}
              subtitle={th('fonepaySub')}
              right={<SourceChip>Fonepay · {formatAsOf(fonepay.as_of!, locale)}</SourceChip>}
            />
            <ChartFrame height={280}>
              <HBar
                data={fonepay.channels.map((channel) => ({
                  name: pick(locale, channel.label_ne, channel.label_en),
                  value: channel.amount_npr,
                  count: channel.txn_count,
                }))}
                color={PALETTE.crimson}
                countLabel={th('transactions')}
              />
            </ChartFrame>
            <div className="mini" style={{ marginTop: 14 }}>
              {fonepay.channels.map((channel) => (
                <div key={channel.code}>
                  <b>{pick(locale, channel.label_ne, channel.label_en)}</b>
                  <span>
                    {formatNumber(channel.txn_count, locale)} {th('transactions')} ·{' '}
                    {formatPercent(channel.amount_npr, fonepay.total_npr, locale)}
                  </span>
                  <i
                    style={{
                      width: `${(100 * channel.amount_npr) / fonepay.total_npr}%`,
                      background: PALETTE.crimson,
                    }}
                  />
                  <em>{formatNPR(channel.amount_npr, locale)}</em>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </section>

      {/* ── daily trend per network ──────────────────────────────────────── */}
      <section className="grid g2">
        {totals.networks
          .filter((network) => network.history.length > 1 || network.daily.length > 0)
          .map((network) => {
            const series = network.daily.length
              ? network.daily.map((day) => ({
                  name: day.date.slice(5, 10),
                  value: day.total_npr,
                }))
              : network.history.map((point) => ({
                  name: point.as_of.slice(5, 10),
                  value: point.total_npr,
                }));
            return (
              <Card key={network.network}>
                <SectionHeader
                  icon="chart"
                  title={`${network.network === 'NCHL' ? 'NCHL' : 'Fonepay'} — ${t('trend')}`}
                  right={<SourceChip>{network.source ?? ''}</SourceChip>}
                />
                <ChartFrame height={220}>
                  <TrendLine
                    data={series}
                    color={network.network === 'NCHL' ? PALETTE.navy : PALETTE.crimson}
                  />
                </ChartFrame>
                {network.daily.length ? (
                  <Note>
                    {t('fonepayDaily', {
                      points: network.daily
                        .map(
                          (day) =>
                            `${bsDate(day.date, null, locale)} — ${formatNPR(day.total_npr, locale)} · ${formatNumber(day.txn_count, locale)}`,
                        )
                        .join(' · '),
                    })}
                  </Note>
                ) : null}
              </Card>
            );
          })}
      </section>

      {/* ── breakdown of the handover register ───────────────────────────── */}
      <section className="grid g3">
        <Card>
          <SectionHeader icon="organisation" title={t('institutionalVsIndividual')} />
          <ChartFrame height={220}>
            <VBar
              data={[
                { name: tt('type') + ' 1', value: totals.handover.institutional_npr },
                { name: tt('type') + ' 2', value: totals.handover.individual_npr },
              ].map((entry, index) => ({
                name:
                  index === 0
                    ? `${t('chipInstitutional')} (${formatNumber(totals.handover.institutional_count, locale)})`
                    : `${t('chipIndividual')} (${formatNumber(totals.handover.individual_count, locale)})`,
                value: entry.value,
              }))}
            />
          </ChartFrame>
        </Card>
        <Card>
          <SectionHeader icon="cash" title={t('chequeVsTransfer')} />
          <ChartFrame height={220}>
            <VBar
              data={[
                {
                  name: `${t('chipCheque')} (${formatNumber(totals.handover.cheque_count, locale)})`,
                  value: totals.handover.cheque_npr,
                },
                {
                  name: `${t('chipTransfer')} (${formatNumber(totals.handover.bank_transfer_count, locale)})`,
                  value: totals.handover.bank_transfer_npr,
                },
              ]}
              color={PALETTE.crimson}
            />
          </ChartFrame>
        </Card>
        <Card>
          <SectionHeader icon="calendar" title={t('dailyFlow')} />
          <ChartFrame height={220}>
            <VBar
              data={totals.handover.by_day.map((day) => ({
                name: locale === 'ne' ? day.date_bs : day.date_ad.slice(5, 10),
                value: day.total_npr,
              }))}
              color={PALETTE.navy2}
            />
          </ChartFrame>
        </Card>
      </section>

      {/* ── sectors ──────────────────────────────────────────────────────── */}
      <section className="grid g64">
        <Card>
          <SectionHeader
            icon="chart"
            title={t('bySector')}
            right={<SourceChip>{totals.handover.source ?? ''}</SourceChip>}
          />
          <ChartFrame height={320}>
            <HBar
              data={totals.handover.by_sector.map((row) => ({
                name: sectorName(row.sector, locale),
                value: row.total_npr,
                count: row.entries,
              }))}
              multicolour
              countLabel={tt('sn')}
            />
          </ChartFrame>
          <Note>{locale === 'ne' ? SECTOR_NOTE_NE : SECTOR_NOTE_EN}</Note>
        </Card>
        <Card>
          <SectionHeader icon="organisation" title={t('sectorList')} />
          <SectorPanel sectors={totals.handover.by_sector} total={totals.handover.total_npr} />
        </Card>
      </section>

      {/* ── the register ─────────────────────────────────────────────────── */}
      <Card id="register">
        <SectionHeader
          icon="handover"
          title={t('register')}
          subtitle={t('registerNote')}
          right={
            <SourceChip>
              {totals.handover.as_of ? formatAsOf(totals.handover.as_of, locale) : ''}
            </SourceChip>
          }
        />
        <Note>
          {t('registerCoverage', { dates: totals.handover.dates_covered.join(', ') })}
          {totals.handover.serial_gaps.length
            ? ` ${totals.handover.serial_gaps
                .map((gap) =>
                  t('registerGap', {
                    from: formatNumber(gap.from, locale),
                    to: formatNumber(gap.to, locale),
                  }),
                )
                .join(' ')}`
            : ''}
        </Note>
        {registerRows.length ? (
          <ContributionRegister rows={registerRows} />
        ) : (
          <EmptyState label={ts('awaitingEntry')} />
        )}
      </Card>

      {/* ── the fund's own accounts, bank by bank ────────────────────────── */}
      {fund ? (
        <Card id="nrb">
          <SectionHeader
            icon="bank"
            title={t('nrbTitle')}
            subtitle={`${t('nrbSubtitle')} · ${pick(locale, fund.as_of_bs, fund.as_of_en)}`}
            right={
              <SourceChip>
                {locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN}
              </SourceChip>
            }
          />

          <div className="grid g4">
            <KpiTile
              icon="bank"
              tone="navy"
              label={t('totalAvailable')}
              sub={`${t('nprAccounts')} + ${t('usdAccounts')}`}
              value={formatNPR(fund.total_available_npr, locale)}
              foot={`${t('beforeFlood')}: ${formatNPR(fund.npr.before, locale)} · ${formatUSD(fund.usd.before, locale)}`}
            />
            <KpiTile
              icon="fund"
              tone="red"
              label={`${t('grossCollection')} — ${t('nprAccounts')}`}
              sub={t('nprGrossSubBanks', { banks: formatNumber(fund.npr.banks.length, locale) })}
              value={formatNPR(fund.npr.gross, locale)}
              foot={`${t('totalAvailable')}: ${formatNPR(fund.npr.balance, locale)}`}
            />
            <KpiTile
              icon="foreign"
              label={`${t('grossCollection')} — ${t('usdAccounts')}`}
              sub={th('usdGrossSub')}
              value={formatUSD(fund.usd.gross, locale)}
              foot={`≈ ${formatNPR(fund.usd.gross * fund.fx_rate, locale)}`}
            />
            <KpiTile
              icon="customs"
              label={t('fundUsage')}
              sub={th('usageSub')}
              value={formatNPR(fund.npr.usage, locale)}
              foot={pick(locale, fund.npr.usage_note_ne, fund.npr.usage_note_en)}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <p className="ct">{t('bankChart')}</p>
            <ChartFrame height={280}>
              <HBar
                data={fund.npr.banks.map(([bank, , balance]) => ({ name: bank, value: balance }))}
              />
            </ChartFrame>
          </div>

          <div style={{ marginTop: 18 }}>
            <BankTable
              rows={bankRows}
              compareLabel={pick(locale, fund.compare_bs, fund.compare_en)}
              balanceLabel={pick(locale, fund.as_of_bs, fund.as_of_en)}
            />
          </div>

          <div className="grid g2" style={{ marginTop: 18 }}>
            <div>
              <p className="ct">{t('dailyDeposits')}</p>
              <ChartFrame height={240}>
                <VBar
                  data={fund.dates_bs.map((label, index) => ({
                    name: locale === 'ne' ? label : (fund.dates_ad[index] ?? label).slice(5),
                    value: fund.npr.daily_series[index] ?? 0,
                  }))}
                />
              </ChartFrame>
            </div>
            <div>
              <p className="ct">{t('cumulativeDeposits')}</p>
              <ChartFrame height={240}>
                <DualTrend
                  labels={fund.dates_bs.map((label, index) =>
                    locale === 'ne' ? label : (fund.dates_ad[index] ?? label).slice(5),
                  )}
                  npr={fund.npr.gross_series}
                  usd={fund.usd.gross_series}
                  nprLabel={`${t('cumulativeDeposits')} — ${t('nprAccounts')}`}
                  usdLabel={`${t('cumulativeDeposits')} — ${t('usdAccounts')}`}
                />
              </ChartFrame>
            </div>
          </div>

          <Note>{t('accountStatusNote')}</Note>
          <Note>{t('nrbNote')}</Note>
          {gap !== null ? (
            <Note>
              {t('settlementNote', {
                receipts: formatNPR(totals.npr_receipts, locale),
                deposited: formatNPR(fund.npr.gross, locale),
                gap: formatNPR(Math.abs(gap), locale),
              })}
            </Note>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
