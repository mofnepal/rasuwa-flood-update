'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';

export interface BankRow {
  id: string;
  bank: string;
  currency: 'NPR' | 'USD';
  /** The column the statement compares against — the previous day for NPR. */
  compare: number | null;
  balance: number;
  change: number | null;
}

/**
 * Bank-wise account position from the fund status statement. The statement
 * publishes a before-the-flood figure for the USD accounts and, for the rupee
 * accounts, only a total — so a per-bank comparison there is against the
 * previous day, which is what the column says.
 */
export function BankTable({
  rows,
  compareLabel,
  balanceLabel,
}: {
  rows: BankRow[];
  compareLabel: string;
  balanceLabel: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('contributions');

  const money = (value: number, currency: 'NPR' | 'USD') =>
    currency === 'USD' ? formatUSD(value, locale) : formatNPR(value, locale);

  const columns: Column<BankRow>[] = [
    { key: 'bank', label: t('bankWise'), className: 'nm', value: (row) => row.bank },
    {
      key: 'currency',
      label: t('currency'),
      value: (row) => row.currency,
      render: (row) => (
        <span className={`tag ${row.currency === 'USD' ? 'gov' : 'ins'}`}>{row.currency}</span>
      ),
    },
    {
      key: 'compare',
      label: compareLabel,
      className: 'amt',
      value: (row) => row.compare ?? -1,
      render: (row) => (row.compare == null ? '—' : money(row.compare, row.currency)),
    },
    {
      key: 'balance',
      label: balanceLabel,
      className: 'amt',
      value: (row) => row.balance,
      render: (row) => money(row.balance, row.currency),
    },
    {
      key: 'change',
      label: t('changeSince'),
      className: 'amt',
      value: (row) => row.change ?? 0,
      render: (row) =>
        row.change == null ? (
          '—'
        ) : (
          <span className={row.change >= 0 ? 'd up' : 'd dn'}>
            {row.change >= 0 ? '▲ ' : '▼ '}
            {money(Math.abs(row.change), row.currency)}
          </span>
        ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      pageSize={20}
      csvName="rasuwa-flood-fund-accounts.csv"
      formatCount={(value) => formatNumber(value, locale)}
      chips={[
        { key: 'npr', label: t('nprAccounts'), test: (row: BankRow) => row.currency === 'NPR' },
        { key: 'usd', label: t('usdAccounts'), test: (row: BankRow) => row.currency === 'USD' },
      ]}
    />
  );
}
