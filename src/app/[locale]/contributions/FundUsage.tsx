import { getTranslations } from 'next-intl/server';
import type { PortalTotals } from '@/lib/totals';
import { getDisbursements, summariseDisbursements } from '@/lib/disbursements';
import { formatAsOf, formatNPR, formatPercent, type Locale } from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { Icon } from '@/components/Icon';
import { KpiTile } from '@/components/KpiTile';
import { Card, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame, barChartHeight } from '@/components/charts/ChartFrame';
import { HBar } from '@/components/charts/lazy';
import { DisbursementTable } from './DisbursementTable';

/**
 * Fund usage and disbursement: what has left the Prime Minister Disaster Relief
 * Fund, and how the receiving agency has passed it on — shown beside what the
 * Fund has collected, never netted against contributions. Each entry comes from
 * a named source document; later transfers and disbursements are added to
 * seed/disbursements.json as they are published.
 */
export async function FundUsage({
  locale,
  totals,
}: {
  locale: Locale;
  totals: NonNullable<PortalTotals>;
}) {
  const fund = totals.fund_status;
  if (!fund) return null;
  const rows = await getDisbursements(totals.disasterId);
  if (rows.length === 0) return null;
  const t = await getTranslations('disburse');
  const summary = summariseDisbursements(rows);
  const collected = fund.npr.gross;

  const steps = [
    { icon: 'fund' as const, label: t('stepCollected'), value: collected },
    { icon: 'customs' as const, label: t('stepTransferred'), value: summary.transferred_npr },
    { icon: 'cash' as const, label: t('stepOnward'), value: summary.onward_npr },
    { icon: 'bank' as const, label: t('stepHeld'), value: summary.held_npr },
  ];

  return (
    <Card id="usage">
      <SectionHeader
        icon="cash"
        title={t('title')}
        subtitle={t('sub')}
        right={summary.as_of ? <SourceChip>{formatAsOf(summary.as_of, locale)}</SourceChip> : null}
      />

      <div className="grid g4">
        <KpiTile
          icon="fund"
          tone="red"
          label={t('kpiCollected')}
          sub={t('kpiCollectedSub')}
          value={formatNPR(collected, locale)}
          foot={`${pick(locale, fund.as_of_bs, fund.as_of_en)}`}
        />
        <KpiTile
          icon="customs"
          label={t('kpiTransferred')}
          sub={t('kpiTransferredSub')}
          value={formatNPR(summary.transferred_npr, locale)}
          foot={t('shareOfCollected', {
            pct: formatPercent(summary.transferred_npr, collected, locale),
          })}
        />
        <KpiTile
          icon="cash"
          label={t('kpiOnward')}
          sub={t('kpiOnwardSub')}
          value={formatNPR(summary.onward_npr, locale)}
          foot={`${formatPercent(summary.onward_npr, summary.transferred_npr, locale)} · ${t('kpiTransferred')}`}
        />
        <KpiTile
          icon="bank"
          tone="navy"
          label={t('kpiHeld')}
          sub={t('kpiHeldSub')}
          value={formatNPR(summary.held_npr, locale)}
        />
      </div>

      {/* ── the flow, step by step ───────────────────────────────────────── */}
      <p className="ct" style={{ marginTop: 18 }}>
        {t('flowTitle')}
      </p>
      <div className="flow usageflow">
        {steps.map((step) => (
          <div key={step.label}>
            <Icon name={step.icon} className="ico" />
            <b>{formatNPR(step.value, locale)}</b>
            <span>{step.label}</span>
            <i>{formatPercent(step.value, collected, locale)}</i>
          </div>
        ))}
      </div>

      {/* ── onward, by recipient ─────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <p className="ct">{t('byRecipient')}</p>
        <ChartFrame height={barChartHeight(summary.by_recipient.length, 200)}>
          <HBar
            data={summary.by_recipient.map((entry) => ({
              name: pick(locale, entry.name_ne, entry.name_en),
              value: entry.amount_npr,
            }))}
            multicolour
          />
        </ChartFrame>
      </div>

      {/* ── every entry ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <SectionHeader icon="measure" title={t('table')} subtitle={t('tableSub')} />
        <DisbursementTable rows={rows} />
      </div>
      <Note>{t('note')}</Note>
    </Card>
  );
}
