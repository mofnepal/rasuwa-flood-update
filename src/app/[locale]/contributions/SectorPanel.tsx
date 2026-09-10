'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { formatNPR, formatNumber, formatPercent, type Locale } from '@/lib/format';
import { sectorName } from '@/lib/sectors';

/** Click-to-filter list of sectors beside the sector chart. */
export function SectorPanel({
  sectors,
  total,
}: {
  sectors: { sector: string; total_npr: number; entries: number }[];
  total: number;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('table');
  const router = useRouter();

  return (
    <div className="seclist">
      {sectors.map((row) => (
        <button
          key={row.sector}
          type="button"
          onClick={() => router.push(`/contributions?sector=${row.sector}#register`)}
        >
          <b>{sectorName(row.sector, locale)}</b>
          <em>{formatNPR(row.total_npr, locale)}</em>
          <span>
            {formatNumber(row.entries, locale)} {t('sn')} ·{' '}
            {formatPercent(row.total_npr, total, locale)}
          </span>
          <i style={{ width: `${Math.max(2, (100 * row.total_npr) / (total || 1))}%` }} />
        </button>
      ))}
    </div>
  );
}
