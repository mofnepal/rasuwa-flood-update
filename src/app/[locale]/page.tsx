import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import donateQr from '../../../public/img/donate-qr.svg';
import { Link } from '@/i18n/routing';
import { getTotals, settlementGap, type PortalTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import {
  PALETTE,
  OFFICIAL_LINKS,
  FUND_STATUS_SOURCE_NE,
  FUND_STATUS_SOURCE_EN,
} from '@/lib/constants';
import {
  bsDate,
  formatAsOf,
  formatNPR,
  formatNumber,
  formatPercent,
  formatShort,
  formatUSD,
  type Locale,
} from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { breakdownLabel, districtName } from '@/lib/rescue';
import { Icon } from '@/components/Icon';
import { KpiTile } from '@/components/KpiTile';
import { CountUp } from '@/components/CountUp';
import { Card, Chip, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Donut, DualTrend, HBar, VBar } from '@/components/charts/lazy';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The data is cached for 60 seconds and invalidated the moment an admin action
 * publishes or withdraws a record. The static edition renders the page once instead:
 * scripts/build-static.mjs removes this line from its build copy.
 */
export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const t = await getTranslations('home');
  const ts = await getTranslations('site');
  const tt = await getTranslations('table');
  const tr = await getTranslations('rescue');
  const ty = await getTranslations('types');
  const tc = await getTranslations('contributions');
  const tf = await getTranslations('foreign');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;

  const nchl = totals.networks.find((n) => n.network === 'NCHL');
  const fonepay = totals.networks.find((n) => n.network === 'FONEPAY');
  const fund = totals.fund_status;

  const [latestHandovers, foreignRows, rescueReport, measureCounts, decisionCount] =
    await Promise.all([
      prisma.contribution.findMany({
        where: { disasterId: totals.disasterId, status: 'published' },
        orderBy: [{ date_ad: 'desc' }, { sn: 'desc' }],
        take: 8,
      }),
      prisma.foreignAssistance.findMany({
        where: { disasterId: totals.disasterId, status: 'published' },
        orderBy: [{ featured: 'desc' }, { amount_usd: 'desc' }],
      }),
      prisma.rescueReport.findFirst({
        where: { disasterId: totals.disasterId, status: 'published', agency: 'NDRRMA' },
        orderBy: { report_at: 'desc' },
      }),
      prisma.measure.groupBy({
        by: ['category_code', 'category_ne', 'category_en'],
        where: {
          status: 'published',
          decision: { disasterId: totals.disasterId, status: 'published' },
        },
        _count: true,
        orderBy: { category_code: 'asc' },
      }),
      prisma.decision.count({
        where: { disasterId: totals.disasterId, status: 'published', kind: 'cabinet_decision' },
      }),
    ]);

  const ndrrma = (rescueReport?.data ?? null) as NdrrmaData | null;

  const donutSlices = [
    { name: 'NCHL', value: nchl?.total_npr ?? 0 },
    { name: 'Fonepay', value: fonepay?.total_npr ?? 0 },
    { name: t('handover'), value: totals.handover.total_npr },
    { name: t('foreign'), value: totals.foreign.total_npr_equiv },
  ].filter((slice) => slice.value > 0);

  const gap = settlementGap(totals);

  return (
    <div className="stack">
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div>
          <div className="asof">
            <Icon name="clock" /> {ts('updated')}:{' '}
            {totals.last_public_update ? formatAsOf(totals.last_public_update, locale) : '—'}{' '}
            <SourceChip>{t('asOfAllSources')}</SourceChip>
          </div>
          <h1>{t('headline')}</h1>
          <p>{t('intro')}</p>
          <div className="total">
            <span>{t('grandTotal')}</span>
            <b>
              <CountUp
                value={totals.grand_total_npr}
                prefix={locale === 'ne' ? 'रु. ' : 'NPR '}
                formatted={formatNPR(totals.grand_total_npr, locale)}
              />
            </b>
            <div className="chips">
              {nchl ? <Chip tone="navy">NCHL {formatShort(nchl.total_npr, locale)}</Chip> : null}
              {fonepay ? (
                <Chip tone="navy">Fonepay {formatShort(fonepay.total_npr, locale)}</Chip>
              ) : null}
              <Chip tone="red">
                {t('handover')} {formatShort(totals.handover.total_npr, locale)}
              </Chip>
              <Chip>
                {t('foreign')} {formatUSD(totals.foreign.total_usd, locale)} ≈{' '}
                {formatShort(totals.foreign.total_npr_equiv, locale)}
              </Chip>
            </div>
          </div>
        </div>

        <div className="donutbox">
          <Donut
            data={donutSlices}
            centreValue={formatShort(totals.grand_total_npr, locale)}
            centreLabel={t('sourceSplit')}
            ariaLabel={`${t('grandTotal')}: ${formatNPR(totals.grand_total_npr, locale)}`}
          />
          <div className="legend">
            {donutSlices.map((slice, index) => (
              <div key={slice.name}>
                <i
                  style={{
                    background: [PALETTE.navy, PALETTE.crimson, PALETTE.navy2, PALETTE.navy3][
                      index
                    ],
                  }}
                />
                <b>{slice.name}</b>
                <span>{formatPercent(slice.value, totals.grand_total_npr, locale)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── four headline KPIs ───────────────────────────────────────────── */}
      <section className="grid g4">
        <KpiTile
          icon="bank"
          label={t('nchl')}
          sub={t('nchlSub')}
          value={formatNPR(nchl?.total_npr ?? 0, locale)}
          countTo={{ value: nchl?.total_npr ?? 0, prefix: locale === 'ne' ? 'रु. ' : 'NPR ' }}
          foot={
            nchl
              ? `${formatNumber(nchl.txn_count, locale)} ${t('transactions')} · ${formatAsOf(nchl.as_of!, locale)}`
              : ts('awaitingEntry')
          }
        />
        <KpiTile
          icon="qr"
          label={t('fonepay')}
          sub={t('fonepaySub')}
          value={formatNPR(fonepay?.total_npr ?? 0, locale)}
          countTo={{ value: fonepay?.total_npr ?? 0, prefix: locale === 'ne' ? 'रु. ' : 'NPR ' }}
          foot={
            fonepay
              ? `${formatNumber(fonepay.txn_count, locale)} ${t('transactions')} · ${formatAsOf(fonepay.as_of!, locale)}`
              : ts('awaitingEntry')
          }
        />
        <KpiTile
          icon="handover"
          label={t('handover')}
          sub={t('handoverSub')}
          tone="red"
          value={formatNPR(totals.handover.total_npr, locale)}
          countTo={{ value: totals.handover.total_npr, prefix: locale === 'ne' ? 'रु. ' : 'NPR ' }}
          foot={`${t('handoverFoot', { count: formatNumber(totals.handover.entries, locale) })} · ${
            totals.handover.as_of ? formatAsOf(totals.handover.as_of, locale) : ''
          }`}
        />
        <KpiTile
          icon="foreign"
          label={t('foreign')}
          sub={t('foreignSub')}
          tone="navy"
          value={formatUSD(totals.foreign.total_usd, locale)}
          foot={`${t('foreignFoot')} · ≈ ${formatNPR(totals.foreign.total_npr_equiv, locale)}`}
        />
      </section>

      {/* ── fund account status ──────────────────────────────────────────── */}
      {fund ? (
        <Card>
          <SectionHeader
            icon="bank"
            title={t('accountStatusTitle')}
            subtitle={`${locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN} · ${pick(locale, fund.as_of_bs, fund.as_of_en)}`}
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
              label={tc('totalAvailable')}
              sub={t('totalAvailableSub', { fx: formatNumber(fund.fx_rate, locale, 2) })}
              value={formatNPR(fund.total_available_npr, locale)}
            />
            <KpiTile
              icon="fund"
              tone="red"
              label={tc('grossCollection')}
              sub={t('nprGrossSub', { banks: formatNumber(fund.npr.banks.length, locale) })}
              value={formatNPR(fund.npr.gross, locale)}
            />
            <KpiTile
              icon="foreign"
              label={t('foreign')}
              sub={t('usdGrossSub')}
              value={formatUSD(fund.usd.gross, locale)}
              foot={`≈ ${formatNPR(fund.usd.gross * fund.fx_rate, locale)}`}
            />
            <KpiTile
              icon="customs"
              label={tc('fundUsage')}
              sub={t('usageSub')}
              value={formatNPR(fund.npr.usage, locale)}
              foot={pick(locale, fund.npr.usage_note_ne, fund.npr.usage_note_en)}
            />
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
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
              <p className="ct">{t('cumulative')}</p>
              <ChartFrame height={240}>
                <DualTrend
                  labels={fund.dates_bs.map((label, index) =>
                    locale === 'ne' ? label : (fund.dates_ad[index] ?? label).slice(5),
                  )}
                  npr={fund.npr.gross_series}
                  usd={fund.usd.gross_series}
                  nprLabel={t('cumulative')}
                  usdLabel={t('cumulativeUsd')}
                />
              </ChartFrame>
            </div>
          </div>
          <Note>{t('accountStatusNoteHome')}</Note>
        </Card>
      ) : null}

      {/* ── data sources and cut-off times ───────────────────────────────── */}
      <Card className="srcs">
        <SectionHeader icon="clock" title={ts('cutOffTitle')} subtitle={ts('reconciliationNote')} />
        <div className="tscroll">
          <table className="tbl small">
            <thead>
              <tr>
                <th>{ts('source')}</th>
                <th>{t('sourceTableWhat')}</th>
                <th>{ts('asOf')}</th>
                <th className="amt">{tt('amount')}</th>
                <th>{t('sourceTableRefresh')}</th>
              </tr>
            </thead>
            <tbody>
              {nchl ? (
                <tr>
                  <td className="nm">NCHL</td>
                  <td>{t('nchlSub')}</td>
                  <td>{formatAsOf(nchl.as_of!, locale)}</td>
                  <td className="amt">{formatNPR(nchl.total_npr, locale, 2)}</td>
                  <td>{t('refreshDaily')}</td>
                </tr>
              ) : null}
              {fonepay ? (
                <tr>
                  <td className="nm">Fonepay</td>
                  <td>{t('fonepaySub')}</td>
                  <td>{formatAsOf(fonepay.as_of!, locale)}</td>
                  <td className="amt">{formatNPR(fonepay.total_npr, locale)}</td>
                  <td>{t('refreshDaily')}</td>
                </tr>
              ) : null}
              <tr>
                <td className="nm">{t('handover')}</td>
                <td>{t('handoverSub')}</td>
                <td>{totals.handover.as_of ? formatAsOf(totals.handover.as_of, locale) : '—'}</td>
                <td className="amt">{formatNPR(totals.handover.total_npr, locale, 2)}</td>
                <td>{t('refreshDaily')}</td>
              </tr>
              {fund ? (
                <tr>
                  <td className="nm">
                    {locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN}
                  </td>
                  <td>{t('accountStatusTitle')}</td>
                  <td>{pick(locale, fund.as_of_bs, fund.as_of_en)}</td>
                  <td className="amt">
                    {formatNPR(fund.npr.gross, locale)} · {formatUSD(fund.usd.gross, locale)}
                  </td>
                  <td>{t('refreshDaily')}</td>
                </tr>
              ) : null}
              <tr>
                <td className="nm">{t('foreign')}</td>
                <td>{t('foreignSub')}</td>
                <td>{totals.foreign.as_of ? formatAsOf(totals.foreign.as_of, locale) : '—'}</td>
                <td className="amt">
                  {formatUSD(totals.foreign.identified_usd, locale)} ≈{' '}
                  {formatNPR(totals.foreign.identified_usd * totals.fx_rate, locale)}
                </td>
                <td>{t('refreshPerEvent')}</td>
              </tr>
              {rescueReport ? (
                <tr>
                  <td className="nm">NDRRMA · {tr('policePanel')}</td>
                  <td>{tr('intro')}</td>
                  <td>{bsDate(rescueReport.report_at, rescueReport.report_at_bs, locale)}</td>
                  <td className="amt">—</td>
                  <td>{t('refreshDaily')}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Note>
          {t('fxNote', {
            fx: formatNumber(totals.fx_rate, locale, 2),
            source: locale === 'ne' ? FUND_STATUS_SOURCE_NE : FUND_STATUS_SOURCE_EN,
          })}
          {gap !== null && Math.abs(gap) > 0
            ? ` · ${tc('settlementNote', {
                receipts: formatNPR(totals.npr_receipts, locale),
                deposited: formatNPR(totals.fund_status!.npr.gross, locale),
                gap: formatNPR(Math.abs(gap), locale),
              })}`
            : ''}
        </Note>
      </Card>

      {/* ── channel charts ───────────────────────────────────────────────── */}
      <section className="grid g2">
        {nchl ? (
          <Card>
            <SectionHeader
              icon="bank"
              title={t('nchlChannels')}
              subtitle={t('nchlSub')}
              right={<SourceChip>NCHL · {formatAsOf(nchl.as_of!, locale)}</SourceChip>}
            />
            <ChartFrame height={280}>
              <HBar
                data={nchl.channels.map((channel) => ({
                  name: pick(locale, channel.label_ne, channel.label_en),
                  value: channel.amount_npr,
                  count: channel.txn_count,
                }))}
                countLabel={t('transactions')}
              />
            </ChartFrame>
          </Card>
        ) : null}
        {fonepay ? (
          <Card>
            <SectionHeader
              icon="qr"
              title={t('fonepayChannels')}
              subtitle={t('fonepaySub')}
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
                countLabel={t('transactions')}
              />
            </ChartFrame>
          </Card>
        ) : null}
      </section>

      {/* ── daily handover flow + how contributions reach the fund ───────── */}
      <section className="grid g64">
        <Card>
          <SectionHeader
            icon="chart"
            title={t('dailyHandover')}
            subtitle={t('dailyHandoverSub')}
            right={<SourceChip>{totals.handover.source ?? ''}</SourceChip>}
          />
          <ChartFrame height={240}>
            <VBar
              data={totals.handover.by_day.map((day) => ({
                name: locale === 'ne' ? day.date_bs : day.date_ad.slice(5, 10),
                value: day.total_npr,
              }))}
              color={PALETTE.crimson}
            />
          </ChartFrame>
        </Card>

        <Card>
          <SectionHeader icon="chart" title={t('flowTitle')} />
          <div className="flow">
            <div>
              <Icon name="qr" className="ico" />
              <b>{t('flowStep1')}</b>
              <span>{t('flowStep1Sub')}</span>
              <i>NCHL · Fonepay</i>
            </div>
            <div>
              <Icon name="handover" className="ico" />
              <b>{t('flowStep2')}</b>
              <span>{t('flowStep2Sub')}</span>
              <i>{ts('verified')}</i>
            </div>
            <div>
              <Icon name="foreign" className="ico" />
              <b>{t('flowStep3')}</b>
              <span>{t('flowStep3Sub')}</span>
              <i>USD</i>
            </div>
            <div>
              <Icon name="bank" className="ico" />
              <b>{t('flowStep4')}</b>
              <span>{t('flowStep4Sub')}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ── rescue snapshot ──────────────────────────────────────────────── */}
      {ndrrma ? (
        <Card>
          <SectionHeader
            icon="rescue"
            title={t('rescueGlance')}
            subtitle={`NDRRMA · ${bsDate(rescueReport!.report_at, rescueReport!.report_at_bs, locale)}`}
            right={
              <Link className="btn ghost sm" href="/rescue">
                {t('fullSection')}
              </Link>
            }
          />
          <div className="grid g6">
            <KpiTile
              icon="rescuedPersons"
              tone="red"
              label={tr('rescued')}
              value={formatNumber(ndrrma.rescued_till_date, locale)}
              foot={t('helicopterFlights', {
                count: formatNumber(
                  ndrrma.helicopter_flights.nepali_army_total +
                    (ndrrma.helicopter_flights.apf ?? 0) +
                    (ndrrma.helicopter_flights.private_from_kathmandu ?? 0),
                  locale,
                ),
              })}
            />
            <KpiTile
              icon="casualties"
              label={tr('casualties')}
              value={formatNumber(ndrrma.human_casualties, locale)}
              foot={t('bodiesHandedOver', {
                count: formatNumber(ndrrma.dead_body_handover, locale),
              })}
            />
            <KpiTile
              icon="missing"
              label={tr('missing')}
              value={formatNumber(ndrrma.missing_total_approx, locale)}
              foot={t('foreignNationals', {
                count: formatNumber(
                  ndrrma.missing_breakdown['Foreign tourists'] ??
                    ndrrma.missing_breakdown['Foreign nationals'] ??
                    0,
                  locale,
                ),
              })}
            />
            <KpiTile
              icon="injured"
              label={tr('injured')}
              value={
                ndrrma.injured_receiving_treatment != null
                  ? formatNumber(ndrrma.injured_receiving_treatment, locale)
                  : ts('awaitingEntry')
              }
              foot={t('injuredSub')}
            />
            <KpiTile
              icon="holdingCentre"
              label={tr('holdingCentre')}
              value={formatNumber(ndrrma.holding_center_people, locale)}
              foot={t('holdingSub')}
            />
            <KpiTile
              icon="security"
              label={tr('security')}
              value={formatNumber(ndrrma.security_personnel_mobilised, locale)}
              foot={t('securitySub')}
            />
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <div>
              <p className="ct">{tr('bodiesByDistrict')}</p>
              <ChartFrame height={240}>
                <VBar
                  data={Object.entries(ndrrma.bodies_by_district).map(([name, value]) => ({
                    name: districtName(name, locale),
                    value,
                  }))}
                  unit="count"
                />
              </ChartFrame>
            </div>
            <div>
              <p className="ct">{tr('missingBySource')}</p>
              <ChartFrame height={240}>
                <HBar
                  data={Object.entries(ndrrma.missing_breakdown).map(([name, value]) => ({
                    name: breakdownLabel(name, locale),
                    value,
                  }))}
                  unit="count"
                  color={PALETTE.crimson}
                />
              </ChartFrame>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── foreign + initiatives snapshots ──────────────────────────────── */}
      <section className="grid g2">
        <Card>
          <SectionHeader
            icon="foreign"
            title={t('foreignSnapshot')}
            right={
              <Link className="btn ghost sm" href="/foreign">
                {t('fullSection')}
              </Link>
            }
          />
          {foreignRows.length ? (
            foreignRows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  border: '1px solid var(--bd)',
                  borderLeft: `5px solid ${row.featured ? 'var(--red)' : 'var(--navy)'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15 }}>
                    {pick(locale, row.contributor_ne, row.contributor)}
                  </b>
                  <div style={{ fontSize: '11.5px', color: 'var(--mute)' }}>
                    {pick(locale, row.country_ne, row.country_en)} · {ty(row.contributor_type)} ·{' '}
                    {bsDate(row.date_ad, row.date_bs, locale)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ fontSize: 19, color: 'var(--red)' }}>
                    {formatUSD(Number(row.amount_usd ?? 0), locale)}
                  </b>
                  <div style={{ fontSize: 11, color: 'var(--mute)' }}>
                    ≈ {formatNPR(Number(row.amount_npr_equiv ?? 0), locale)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label={ts('awaitingEntry')} />
          )}
          <Note>{tf('subsetNote')}</Note>
        </Card>

        <Card>
          <SectionHeader
            icon="decisions"
            title={t('initiativesSnapshot')}
            right={
              <Link className="btn ghost sm" href="/initiatives">
                {t('fullSection')}
              </Link>
            }
          />
          <p className="ct">{t('measuresByCategory')}</p>
          <ChartFrame height={240}>
            <HBar
              data={measureCounts.map((group) => ({
                name: `${group.category_code}. ${pick(locale, group.category_ne, group.category_en)}`,
                value: group._count,
              }))}
              unit="count"
              multicolour
            />
          </ChartFrame>
          <Note>{t('measuresNote')}</Note>
        </Card>
      </section>

      {/* ── latest handovers + latest updates ────────────────────────────── */}
      <section className="grid g64">
        <Card>
          <SectionHeader
            icon="handover"
            title={t('latestHandovers')}
            subtitle={tc('registerShort')}
            right={
              <Link className="btn ghost sm" href="/contributions">
                {t('viewAll')} ({formatNumber(totals.handover.entries, locale)})
              </Link>
            }
          />
          <div className="tscroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{tt('date')}</th>
                  <th>{tt('contributor')}</th>
                  <th>{tt('type')}</th>
                  <th className="amt">{tt('amount')}</th>
                </tr>
              </thead>
              <tbody>
                {latestHandovers.map((row) => (
                  <tr key={row.id}>
                    <td>{bsDate(row.date_ad, row.date_bs, locale)}</td>
                    <td className="nm">
                      {pick(locale, row.contributor_name_ne, row.contributor_name)}
                    </td>
                    <td>
                      <span
                        className={`tag ${row.contributor_type === 'individual' ? 'ind' : 'ins'}`}
                      >
                        {ty(row.contributor_type)}
                      </span>
                    </td>
                    <td className="amt">
                      {Number(row.amount_npr ?? 0) > 0
                        ? formatNPR(Number(row.amount_npr), locale)
                        : formatUSD(Number(row.amount_usd ?? 0), locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionHeader icon="clock" title={t('latestUpdates')} />
          <ul className="upd">
            {buildUpdates(
              totals,
              locale,
              {
                nchlLabel: t('nchl'),
                fonepayLabel: t('fonepay'),
                handoverLabel: t('handover'),
                foreignLabel: t('foreign'),
                measuresLabel: t('initiativesSnapshot'),
                rescueLabel: t('rescueSnapshot'),
                fundStatusLabel: t('accountStatusTitle'),
                availableLabel: tc('totalAvailable'),
              },
              {
                rescue: rescueReport
                  ? { at: rescueReport.report_at.toISOString(), bs: rescueReport.report_at_bs }
                  : null,
                measures: decisionCount,
              },
            ).map((update) => (
              <li key={update.key}>
                <span>{update.when}</span>
                <Link href={update.href}>{update.text}</Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── calls to action ──────────────────────────────────────────────── */}
      <section className="cta">
        <a href={OFFICIAL_LINKS.donate} target="_blank" rel="noopener noreferrer">
          <Image
            src={donateQr}
            alt=""
            width={58}
            height={58}
            style={{ background: '#fff', borderRadius: 8, padding: 4, flex: 'none' }}
          />
          <div>
            <b>{t('ctaDonate')}</b>
            <span>{t('ctaDonateSub')}</span>
          </div>
        </a>
        <a href={OFFICIAL_LINKS.rescueRequest} target="_blank" rel="noopener noreferrer">
          <Icon name="rescue" className="ico" />
          <div>
            <b>{t('ctaRescue')}</b>
            <span>{t('ctaRescueSub')}</span>
          </div>
        </a>
        <a href={OFFICIAL_LINKS.rescuedPersons} target="_blank" rel="noopener noreferrer">
          <Icon name="rescuedPersons" className="ico" />
          <div>
            <b>{t('ctaRescued')}</b>
            <span>{t('ctaRescuedSub')}</span>
          </div>
        </a>
      </section>
    </div>
  );
}

/** Shape of the NDRRMA report body, mirrored by the Zod schema in lib/rescue.ts. */
interface NdrrmaData {
  rescued_till_date: number;
  human_casualties: number;
  missing_total_approx: number;
  injured_receiving_treatment?: number;
  holding_center_people: number;
  security_personnel_mobilised: number;
  dead_body_handover: number;
  bodies_by_district: Record<string, number>;
  missing_breakdown: Record<string, number>;
  helicopter_flights: { nepali_army_total: number; apf?: number; private_from_kathmandu?: number };
}

/**
 * The updates feed is generated from the newest published records rather than
 * maintained by hand, so it can never drift from what the portal shows.
 */
interface UpdateLabels {
  nchlLabel: string;
  fonepayLabel: string;
  handoverLabel: string;
  foreignLabel: string;
  measuresLabel: string;
  rescueLabel: string;
  fundStatusLabel: string;
  availableLabel: string;
}

function buildUpdates(
  totals: PortalTotals,
  locale: Locale,
  labels: UpdateLabels,
  extra: { rescue: { at: string; bs: string } | null; measures: number },
) {
  const items: { key: string; when: string; text: string; href: string }[] = [];

  for (const network of totals.networks) {
    items.push({
      key: `network-${network.network}`,
      when: network.as_of ? bsDate(network.as_of, null, locale, { separator: ' · ' }) : '',
      text: `${network.network === 'NCHL' ? labels.nchlLabel : labels.fonepayLabel}: ${formatNPR(
        network.total_npr,
        locale,
      )} · ${formatNumber(network.txn_count, locale)}`,
      href: '/contributions',
    });
  }

  if (totals.handover.as_of) {
    items.push({
      key: 'handover',
      when: bsDate(totals.handover.as_of, null, locale),
      text: `${labels.handoverLabel}: ${formatNPR(totals.handover.total_npr, locale)} · ${formatNumber(
        totals.handover.entries,
        locale,
      )}`,
      href: '/contributions#register',
    });
  }

  if (totals.fund_status) {
    items.push({
      key: 'fund-status',
      when: bsDate(totals.fund_status.as_of, totals.fund_status.as_of_bs, locale),
      text: `${labels.fundStatusLabel}: ${formatNPR(totals.fund_status.npr.gross, locale)} · ${formatUSD(
        totals.fund_status.usd.gross,
        locale,
      )} · ${labels.availableLabel} ${formatNPR(totals.fund_status.total_available_npr, locale)}`,
      href: '/contributions#nrb',
    });
  }

  if (totals.foreign.as_of) {
    items.push({
      key: 'foreign',
      when: bsDate(totals.foreign.as_of, null, locale),
      text: `${labels.foreignLabel}: ${formatUSD(totals.foreign.total_usd, locale)}`,
      href: '/foreign',
    });
  }

  if (extra.rescue) {
    items.push({
      key: 'rescue',
      when: bsDate(extra.rescue.at, extra.rescue.bs, locale),
      text: labels.rescueLabel,
      href: '/rescue',
    });
  }

  if (extra.measures > 0) {
    items.push({
      key: 'measures',
      when: '',
      text: labels.measuresLabel,
      href: '/initiatives',
    });
  }

  return items.slice(0, 6);
}
