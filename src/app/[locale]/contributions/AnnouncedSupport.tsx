import { getTranslations } from 'next-intl/server';
import { getAnnouncedSupport, summariseAnnounced } from '@/lib/announced';
import { formatAsOf, formatNPR, formatNumber, type Locale } from '@/lib/format';
import { KpiTile } from '@/components/KpiTile';
import { Card, Note, SectionHeader, SourceChip } from '@/components/ui';
import { AnnouncedTable } from './AnnouncedTable';

/**
 * Domestic support announced for the flood, as the Office of the Prime Minister
 * lists it — salary contributions, party and provincial pledges, government cash
 * to districts. Shown beside the handover register and kept out of every total:
 * a pledge counts only once the Fund's own records carry it.
 */
export async function AnnouncedSupport({
  locale,
  disasterId,
}: {
  locale: Locale;
  disasterId: string;
}) {
  const rows = await getAnnouncedSupport(disasterId);
  if (rows.length === 0) return null;
  const t = await getTranslations('announced');
  const summary = summariseAnnounced(rows);

  return (
    <Card id="announced">
      <SectionHeader
        icon="organisation"
        title={t('title')}
        subtitle={t('sub')}
        right={
          <SourceChip>
            {t('source')}
            {summary.as_of ? ` · ${formatAsOf(summary.as_of, locale)}` : ''}
          </SourceChip>
        }
      />

      <div className="grid g3">
        <KpiTile
          icon="handover"
          tone="navy"
          label={t('kpiPledged')}
          sub={t('kpiPledgedSub')}
          value={formatNPR(summary.pledged_npr, locale)}
          foot={t('kpiPledgedFoot', {
            count: formatNumber(summary.pledged_count, locale),
            noFigure: formatNumber(summary.pledged_without_figure, locale),
          })}
        />
        <KpiTile
          icon="verified"
          label={t('kpiRegister')}
          sub={t('kpiRegisterSub')}
          value={formatNPR(summary.in_register_npr, locale)}
          foot={t('kpiRegisterFoot', { count: formatNumber(summary.in_register_count, locale) })}
        />
        <KpiTile
          icon="cash"
          label={t('kpiDisbursed')}
          sub={t('kpiDisbursedSub')}
          value={formatNPR(summary.disbursed_npr, locale)}
          foot={t('kpiDisbursedFoot')}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <AnnouncedTable rows={rows} />
      </div>
      <Note>{t('note')}</Note>
    </Card>
  );
}
