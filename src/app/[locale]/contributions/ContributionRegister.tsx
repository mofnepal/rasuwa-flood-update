'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { Icon } from '@/components/Icon';
import { bsDate, formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';
import { SECTORS, sectorName } from '@/lib/sectors';

export interface RegisterRow {
  id: string;
  sn: number | null;
  date_ad: string;
  date_bs: string;
  name: string;
  name_ne: string | null;
  contributor_type: string;
  payment_mode: string;
  sector: string;
  amount_npr: number;
  amount_usd: number;
  fx_rate: number;
  verified_at: string | null;
  published_at: string | null;
}

/** The verified contributor register — searchable, filterable, sortable, exportable. */
export function ContributionRegister({ rows }: { rows: RegisterRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('contributions');
  const tt = useTranslations('table');
  const ty = useTranslations('types');
  const tm = useTranslations('modes');
  const ts = useTranslations('site');

  const count = (value: number) => formatNumber(value, locale);

  const columns: Column<RegisterRow>[] = [
    {
      key: 'sn',
      label: tt('sn'),
      sortable: true,
      value: (row) => row.sn ?? 0,
      render: (row) => count(row.sn ?? 0),
    },
    {
      key: 'date',
      label: tt('date'),
      value: (row) => row.date_ad,
      render: (row) => bsDate(row.date_ad, row.date_bs, locale),
    },
    {
      key: 'name',
      label: tt('contributor'),
      className: 'nm',
      value: (row) => (locale === 'ne' ? (row.name_ne ?? row.name) : row.name),
    },
    {
      key: 'type',
      label: tt('type'),
      value: (row) => ty(row.contributor_type),
      render: (row) => (
        <span className={`tag ${row.contributor_type === 'individual' ? 'ind' : 'ins'}`}>
          {ty(row.contributor_type)}
        </span>
      ),
    },
    {
      key: 'mode',
      label: tt('mode'),
      value: (row) => tm(row.payment_mode),
    },
    {
      key: 'sector',
      label: tt('sector'),
      value: (row) => sectorName(row.sector, locale),
      render: (row) => <span className="tag sec">{sectorName(row.sector, locale)}</span>,
    },
    {
      key: 'amount',
      label: tt('amount'),
      className: 'amt',
      value: (row) => row.amount_npr || row.amount_usd * row.fx_rate,
      total: (row) => row.amount_npr,
      render: (row) =>
        row.amount_npr > 0 ? (
          formatNPR(row.amount_npr, locale)
        ) : (
          <>
            {formatUSD(row.amount_usd, locale)}
            <div style={{ fontSize: '11px', color: 'var(--mute)', fontWeight: 400 }}>
              ≈ {formatNPR(row.amount_usd * row.fx_rate, locale)}
            </div>
          </>
        ),
    },
    {
      key: 'verified',
      label: tt('verified'),
      sortable: false,
      value: () => '✓',
      render: (row) => (
        <span
          className="ok"
          title={`${ts('verified')}${
            row.published_at
              ? ` · ${ts('publishedOn')} ${bsDate(row.published_at, null, locale)}`
              : ''
          }`}
        >
          <Icon name="verified" />
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      csvName="rasuwa-flood-contributions.csv"
      urlParams={{ query: 'q', filters: { sector: 'sector' } }}
      formatCount={count}
      formatTotal={(value) => formatNPR(value, locale)}
      chips={[
        {
          key: 'ins',
          label: t('chipInstitutional'),
          test: (r) => r.contributor_type === 'institutional',
        },
        {
          key: 'ind',
          label: t('chipIndividual'),
          test: (r) => r.contributor_type === 'individual',
        },
        { key: 'chq', label: t('chipCheque'), test: (r) => r.payment_mode === 'cheque' },
        { key: 'bt', label: t('chipTransfer'), test: (r) => r.payment_mode === 'bank_transfer' },
        { key: 'crore', label: t('chipCrore'), test: (r) => r.amount_npr >= 1e7 },
        { key: 'usd', label: t('chipUsd'), test: (r) => r.amount_usd > 0 },
      ]}
      filters={[
        {
          key: 'type',
          label: t('filterType'),
          options: [
            ['institutional', ty('institutional')],
            ['individual', ty('individual')],
          ],
          test: (row, value) => row.contributor_type === value,
        },
        {
          key: 'mode',
          label: t('filterMode'),
          options: [
            ['cheque', tm('cheque')],
            ['bank_transfer', tm('bank_transfer')],
          ],
          test: (row, value) => row.payment_mode === value,
        },
        {
          key: 'sector',
          label: t('filterSector'),
          options: SECTORS.map((sector) => [sector.code, sectorName(sector.code, locale)]),
          test: (row, value) => row.sector === value,
        },
        {
          key: 'amount',
          label: t('filterAmount'),
          options: [
            ['a', t('amountBand1')],
            ['b', t('amountBand2')],
            ['c', t('amountBand3')],
            ['d', t('amountBand4')],
          ],
          test: (row, value) => {
            const amount = row.amount_npr;
            if (value === 'a') return amount > 0 && amount <= 1e6;
            if (value === 'b') return amount > 1e6 && amount <= 1e7;
            if (value === 'c') return amount > 1e7 && amount <= 1e8;
            return amount > 1e8;
          },
        },
        {
          key: 'date',
          label: t('filterDate'),
          options: [...new Set(rows.map((row) => row.date_bs))].map((value) => [value, value]),
          test: (row, value) => row.date_bs === value,
        },
      ]}
    />
  );
}
