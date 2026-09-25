import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageMetadata } from '@/lib/metadata';
import { getTotals } from '@/lib/totals';
import { changeShare, getAllLatestRevenue, type RevenueView } from '@/lib/revenue';
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
  const t = await getTranslations({ locale, namespace: 'revenue' });
  const site = await getTranslations({ locale, namespace: 'site' });
  return pageMetadata({
    locale,
    path: '/revenue',
    card: 'revenue',
    title: t('title'),
    description: t('intro'),
    siteName: site('portal'),
    imageAlt: site('shareImageAlt'),
  });
}

type T = Awaited<ReturnType<typeof getTranslations<'revenue'>>>;

/** A percentage as the department printed it, else the portal's own. */
const pct = (printed: number | undefined, part: number, whole: number, locale: Locale) =>
  printed != null ? formatNumber(printed, locale, 2) + '%' : formatPercent(part, whole, locale);

/** One progress bar of the `.mini` block. */
function Bar({
  label,
  sub,
  share,
  value,
  red,
}: {
  label: string;
  sub: string;
  share: number;
  value: string;
  red?: boolean;
}) {
  return (
    <div>
      <b>{label}</b>
      <span>{sub}</span>
      <i
        style={{
          width: `${Math.min(100, Math.max(0, 100 * share))}%`,
          ...(red ? { background: 'var(--red)' } : {}),
        }}
      />
      <em>{value}</em>
    </div>
  );
}

/** The Department of Customs: the three printed figures, progress, and the offices named. */
function CustomsSection({ r, locale, t }: { r: RevenueView; locale: Locale; t: T }) {
  const year = pick(locale, r.fiscal_year_bs, r.fiscal_year_en);
  const date = pick(locale, r.as_of_bs, r.as_of_en);
  const fy = r.fiscal_year;
  const collectedPct = formatPercent(r.collected_npr, r.target_npr, locale);
  const elapsedPct = formatPercent(fy.elapsed_days, fy.days, locale);
  return (
    <Card id="customs">
      <SectionHeader
        icon="customs"
        title={t('customsSection')}
        subtitle={`${t('fiscalYear', { year })} · ${t('upTo', { date })}`}
        right={<SourceChip>{t('customsSource')}</SourceChip>}
      />
      <div className="grid g4">
        <KpiTile
          icon="tax"
          tone="navy"
          label={t('kpiTarget')}
          sub={t('kpiTargetSub', { year })}
          value={formatKharba(r.target_npr, locale)}
          foot={formatNPR(r.target_npr, locale)}
        />
        <KpiTile
          icon="customs"
          tone="red"
          label={t('kpiCollected')}
          sub={t('kpiCollectedSub', { date })}
          value={formatKharba(r.collected_npr, locale)}
          foot={formatNPR(r.collected_npr, locale)}
        />
        {r.remaining_npr != null ? (
          <KpiTile
            icon="measure"
            label={t('kpiRemaining')}
            sub={t('kpiRemainingSub')}
            value={formatKharba(r.remaining_npr, locale)}
            foot={formatNPR(r.remaining_npr, locale)}
          />
        ) : null}
        <KpiTile
          icon="chart"
          label={t('kpiShare')}
          sub={t('kpiShareSub')}
          value={collectedPct}
          foot={t('kpiShareFoot', { pct: elapsedPct, days: formatNumber(fy.elapsed_days, locale) })}
        />
      </div>

      <div className="grid g64" style={{ marginTop: 18 }}>
        <div id="progress">
          <p className="ct">{t('progressTitle')}</p>
          <div className="mini">
            <Bar
              label={t('barCollected')}
              sub={t('ofTarget', { pct: collectedPct })}
              share={r.share_of_target}
              value={formatKharba(r.collected_npr, locale)}
            />
            <Bar
              label={t('barElapsed')}
              sub={t('ofYear', {
                elapsed: formatNumber(fy.elapsed_days, locale),
                days: formatNumber(fy.days, locale),
              })}
              share={fy.elapsed_share}
              value={elapsedPct}
              red
            />
          </div>
          <p className="ct" style={{ marginTop: 18 }}>
            {t('chartTitle')}
          </p>
          <ChartFrame height={170}>
            <HBar
              data={[
                { name: t('kpiTarget'), value: r.target_npr },
                { name: t('kpiCollected'), value: r.collected_npr },
                ...(r.remaining_npr != null
                  ? [{ name: t('kpiRemaining'), value: r.remaining_npr }]
                  : []),
              ]}
              multicolour
            />
          </ChartFrame>
        </div>
        <div>
          <p className="ct">{t('officesTitle')}</p>
          <ul className="upd">
            {r.offices.map((office) => (
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
        </div>
      </div>
      <Note>{t('derivedNote')}</Note>
      {r.remaining_note_ne || r.remaining_note_en ? (
        <Note>{pick(locale, r.remaining_note_ne ?? '', r.remaining_note_en ?? '')}</Note>
      ) : null}
      {r.date_note_ne || r.date_note_en ? (
        <Note>{pick(locale, r.date_note_ne ?? '', r.date_note_en ?? '')}</Note>
      ) : null}
    </Card>
  );
}

/** The Inland Revenue Department, from RMIS: annual, period, month and day, against last year. */
function IrdSection({ r, locale, t }: { r: RevenueView; locale: Locale; t: T }) {
  const year = pick(locale, r.fiscal_year_bs, r.fiscal_year_en);
  const date = pick(locale, r.as_of_bs, r.as_of_en);
  const fy = r.fiscal_year;
  const d = r.detail ?? {};
  const period = d.period;
  const month = d.month;
  const day = d.day;
  const prev = d.previous_year;
  const periodLabel = period ? pick(locale, period.label_ne, period.label_en) : '';
  const monthLabel = month ? pick(locale, month.label_ne, month.label_en) : '';
  const elapsedPct = formatPercent(fy.elapsed_days, fy.days, locale);
  const change = (before: number | undefined, after: number) => {
    const share = changeShare(before, after);
    if (share == null) return '—';
    const text = formatNumber(Math.abs(share) * 100, locale, 1) + '%';
    return share >= 0 ? `+${text}` : `−${text}`;
  };

  return (
    <Card id="ird">
      <SectionHeader
        icon="bank"
        title={t('irdSection')}
        subtitle={`${t('irdIntro')} · ${t('fiscalYear', { year })} · ${t('upTo', { date })}`}
        right={<SourceChip>{t('irdSource')}</SourceChip>}
      />
      <div className="grid g4">
        <KpiTile
          icon="tax"
          tone="navy"
          label={t('kpiTarget')}
          sub={t('kpiTargetSub', { year })}
          value={formatKharba(r.target_npr, locale)}
          foot={formatNPR(r.target_npr, locale)}
        />
        <KpiTile
          icon="fund"
          tone="red"
          label={t('kpiCollected')}
          sub={t('kpiCollectedSub', { date })}
          value={formatKharba(r.collected_npr, locale)}
          foot={
            period
              ? t('kpiPeriodFoot', {
                  period: periodLabel,
                  pct: pct(
                    period.achievement_pct_printed,
                    r.collected_npr,
                    period.target_npr,
                    locale,
                  ),
                })
              : formatNPR(r.collected_npr, locale)
          }
        />
        {month ? (
          <KpiTile
            icon="calendar"
            label={t('kpiMonth', { month: monthLabel })}
            sub={t('kpiMonthSub', { target: formatKharba(month.target_npr, locale) })}
            value={formatKharba(month.collected_npr, locale)}
            foot={t('kpiMonthFoot', {
              pct: pct(
                month.achievement_pct_printed,
                month.collected_npr,
                month.target_npr,
                locale,
              ),
            })}
          />
        ) : null}
        {day ? (
          <KpiTile
            icon="clock"
            label={t('kpiDay', { date: pick(locale, day.date_bs, day.date_en) })}
            sub={t('kpiDaySub')}
            value={formatKharba(day.collected_npr, locale)}
            foot={formatNPR(day.collected_npr, locale)}
          />
        ) : null}
      </div>

      <div className="grid g64" style={{ marginTop: 18 }}>
        <div id="ird-progress">
          <p className="ct">{t('progressTitle')}</p>
          <div className="mini">
            {period ? (
              <Bar
                label={t('barPeriod', { period: periodLabel })}
                sub={t('ofTargetOf', {
                  pct: pct(
                    period.achievement_pct_printed,
                    r.collected_npr,
                    period.target_npr,
                    locale,
                  ),
                  target: formatKharba(period.target_npr, locale),
                })}
                share={r.collected_npr / period.target_npr}
                value={formatKharba(r.collected_npr, locale)}
              />
            ) : null}
            {month ? (
              <Bar
                label={t('barMonth', { month: monthLabel })}
                sub={t('ofTargetOf', {
                  pct: pct(
                    month.achievement_pct_printed,
                    month.collected_npr,
                    month.target_npr,
                    locale,
                  ),
                  target: formatKharba(month.target_npr, locale),
                })}
                share={month.collected_npr / month.target_npr}
                value={formatKharba(month.collected_npr, locale)}
              />
            ) : null}
            <Bar
              label={t('barAnnual')}
              sub={t('ofTarget', { pct: formatPercent(r.collected_npr, r.target_npr, locale) })}
              share={r.share_of_target}
              value={formatKharba(r.collected_npr, locale)}
            />
            <Bar
              label={t('barElapsed')}
              sub={t('ofYear', {
                elapsed: formatNumber(fy.elapsed_days, locale),
                days: formatNumber(fy.days, locale),
              })}
              share={fy.elapsed_share}
              value={elapsedPct}
              red
            />
          </div>
        </div>
        {prev ? (
          <div>
            <p className="ct">{t('compareTitle')}</p>
            <div className="tscroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th />
                    <th className="amt">
                      {pick(locale, prev.fiscal_year_bs, prev.fiscal_year_en)}
                    </th>
                    <th className="amt">{year}</th>
                    <th className="amt">{t('change')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="nm">{t('rowAnnualTarget')}</td>
                    <td className="amt">{formatKharba(prev.annual_target_npr, locale)}</td>
                    <td className="amt">{formatKharba(r.target_npr, locale)}</td>
                    <td className="amt">{change(prev.annual_target_npr, r.target_npr)}</td>
                  </tr>
                  {period && prev.period_target_npr != null ? (
                    <tr>
                      <td className="nm">{t('rowPeriodTarget', { period: periodLabel })}</td>
                      <td className="amt">{formatKharba(prev.period_target_npr, locale)}</td>
                      <td className="amt">{formatKharba(period.target_npr, locale)}</td>
                      <td className="amt">{change(prev.period_target_npr, period.target_npr)}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="nm">
                      {t('rowCumulative', {
                        date: pick(locale, day?.date_bs ?? r.as_of_bs, day?.date_en ?? r.as_of_en),
                      })}
                    </td>
                    <td className="amt">{formatKharba(prev.collected_to_date_npr, locale)}</td>
                    <td className="amt">{formatKharba(r.collected_npr, locale)}</td>
                    <td className="amt">{change(prev.collected_to_date_npr, r.collected_npr)}</td>
                  </tr>
                  {month && prev.month_collected_npr != null ? (
                    <tr>
                      <td className="nm">{t('rowMonth', { month: monthLabel })}</td>
                      <td className="amt">{formatKharba(prev.month_collected_npr, locale)}</td>
                      <td className="amt">{formatKharba(month.collected_npr, locale)}</td>
                      <td className="amt">
                        {change(prev.month_collected_npr, month.collected_npr)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <p className="ct" style={{ marginTop: 18 }}>
              {t('compareChart')}
            </p>
            <ChartFrame height={150}>
              <HBar
                data={[
                  {
                    name: pick(locale, prev.fiscal_year_bs, prev.fiscal_year_en),
                    value: prev.collected_to_date_npr,
                  },
                  { name: year, value: r.collected_npr },
                ]}
                multicolour
              />
            </ChartFrame>
          </div>
        ) : null}
      </div>
      <Note>{t('irdDerivedNote')}</Note>
    </Card>
  );
}

/** Revenue target and collection, department by department, as each publishes it. */
export default async function RevenuePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;
  const t = await getTranslations('revenue');
  const ts = await getTranslations('site');

  const totals = await getTotals();
  const latest = totals ? await getAllLatestRevenue(totals.disasterId) : {};
  const customs = latest.customs;
  const ird = latest.ird;
  if (!totals || (!customs && !ird)) return <EmptyState label={ts('awaitingEntry')} />;

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        <div className="tabs">
          {customs ? <a href="#customs">{t('customsSection')}</a> : null}
          {ird ? <a href="#ird">{t('irdSection')}</a> : null}
        </div>
      </div>
      {customs ? <CustomsSection r={customs} locale={locale} t={t} /> : null}
      {ird ? <IrdSection r={ird} locale={locale} t={t} /> : null}
    </div>
  );
}
