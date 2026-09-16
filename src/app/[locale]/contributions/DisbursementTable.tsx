'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { Chip } from '@/components/ui';
import { bsDate, formatNPR, formatNumber, type Locale } from '@/lib/format';
import type { DisbursementRow } from '@/lib/disbursements';

const KIND_KEYS: Record<string, 'kindAgency' | 'kindDistrict' | 'kindLocal' | 'kindOther'> = {
  agency: 'kindAgency',
  district: 'kindDistrict',
  local_government: 'kindLocal',
};

/** Every transfer and onward disbursement, one row each, with its source. */
export function DisbursementTable({ rows }: { rows: DisbursementRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('disburse');
  const tt = useTranslations('table');
  const pick = (ne: string, en: string) => (locale === 'ne' ? ne : en);

  const columns: Column<DisbursementRow>[] = [
    {
      key: 'date',
      label: tt('date'),
      className: 'nm',
      sortable: true,
      value: (row) => row.date_ad,
      render: (row) => bsDate(row.date_ad, row.date_bs, locale),
    },
    {
      key: 'stage',
      label: t('stage'),
      value: (row) => (row.stage === 'fund_transfer' ? t('stageFundTransfer') : t('stageOnward')),
      render: (row) => (
        <Chip tone={row.stage === 'fund_transfer' ? 'red' : 'navy'}>
          {row.stage === 'fund_transfer' ? t('stageFundTransfer') : t('stageOnward')}
        </Chip>
      ),
    },
    { key: 'payer', label: t('payer'), value: (row) => pick(row.payer_ne, row.payer_en) },
    {
      key: 'recipient',
      label: t('recipient'),
      value: (row) => pick(row.recipient_ne, row.recipient_en),
      render: (row) => (
        <>
          <b>{pick(row.recipient_ne, row.recipient_en)}</b>
          <br />
          <small>
            {t(KIND_KEYS[row.recipient_kind] ?? 'kindOther')}
            {row.recipient_count
              ? ` · ${t('recipients', { count: formatNumber(row.recipient_count, locale) })}`
              : ''}
          </small>
        </>
      ),
    },
    {
      key: 'amount',
      label: t('amount'),
      className: 'amt',
      sortable: true,
      value: (row) => row.amount_npr,
      render: (row) => formatNPR(row.amount_npr, locale),
    },
    {
      key: 'purpose',
      label: t('purpose'),
      value: (row) => pick(row.purpose_ne, row.purpose_en),
      render: (row) => (
        <>
          {pick(row.purpose_ne, row.purpose_en)}
          <br />
          <small>{pick(row.source_ne, row.source_en)}</small>
        </>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      pageSize={20}
      csvName="rasuwa-flood-disbursements.csv"
      formatCount={(value) => formatNumber(value, locale)}
      chips={[
        {
          key: 'transfer',
          label: t('stageFundTransfer'),
          test: (row: DisbursementRow) => row.stage === 'fund_transfer',
        },
        {
          key: 'onward',
          label: t('stageOnward'),
          test: (row: DisbursementRow) => row.stage === 'onward',
        },
      ]}
    />
  );
}
