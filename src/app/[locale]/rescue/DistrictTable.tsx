'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { formatNPR, formatNumber, type Locale } from '@/lib/format';
import { CORE_DISTRICTS, districtName } from '@/lib/rescue';

export interface DistrictRow {
  district: string;
  bodies: number;
  missing: number;
  holding: number;
  electricity: number | null;
  cash_support: number;
}

export function DistrictTable({ rows }: { rows: DistrictRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('rescue');
  const count = (value: number) => formatNumber(value, locale);

  const columns: Column<DistrictRow>[] = [
    {
      key: 'district',
      label: t('district'),
      className: 'nm',
      value: (row) => districtName(row.district, locale),
    },
    {
      key: 'bodies',
      label: t('bodiesFound'),
      className: 'amt',
      value: (row) => row.bodies,
      render: (row) => count(row.bodies),
    },
    {
      key: 'missing',
      label: t('missing'),
      className: 'amt',
      value: (row) => row.missing,
      render: (row) => (row.missing ? count(row.missing) : '—'),
    },
    {
      key: 'holding',
      label: t('holdingCentre'),
      className: 'amt',
      value: (row) => row.holding,
      render: (row) => (row.holding ? count(row.holding) : '—'),
    },
    {
      key: 'electricity',
      label: t('electricity'),
      className: 'amt',
      value: (row) => row.electricity ?? -1,
      render: (row) =>
        row.electricity == null
          ? '—'
          : `${formatNumber(row.electricity, locale, row.electricity % 1 ? 1 : 0)}%`,
    },
    {
      key: 'cash',
      label: t('cashSupport'),
      className: 'amt',
      value: (row) => row.cash_support,
      total: (row) => row.cash_support,
      render: (row) => (row.cash_support ? formatNPR(row.cash_support, locale) : '—'),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.district}
      pageSize={20}
      csvName="rasuwa-flood-districts.csv"
      formatCount={count}
      formatTotal={(value) => formatNPR(value, locale)}
      chips={[
        {
          key: 'core',
          label: t('coreDistricts'),
          test: (row: DistrictRow) => (CORE_DISTRICTS as readonly string[]).includes(row.district),
        },
        {
          key: 'downstream',
          label: t('downstream'),
          test: (row: DistrictRow) => !(CORE_DISTRICTS as readonly string[]).includes(row.district),
        },
      ]}
    />
  );
}
