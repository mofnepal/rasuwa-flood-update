'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { formatAD, formatNPR, formatNumber, type Locale } from '@/lib/format';
import type { AnnouncedRow } from '@/lib/announced';

const KIND_KEYS: Record<string, string> = {
  security_force: 'kindSecurity',
  civil_servants: 'kindCivil',
  ministry_staff: 'kindMinistry',
  cabinet: 'kindCabinet',
  political_party: 'kindParty',
  province_government: 'kindProvince',
  government_cash: 'kindGovCash',
};

const STATE_KEYS = {
  pledged: 'statePledged',
  in_register: 'stateInRegister',
  disbursed: 'stateDisbursed',
} as const;

const STATE_TAG = { pledged: 'gov', in_register: 'corp', disbursed: 'ind' } as const;

/** Every announced entry, one row each: who, what kind, the amount, where it stands. */
export function AnnouncedTable({ rows }: { rows: AnnouncedRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('announced');
  const tt = useTranslations('table');
  const pick = (ne: string, en: string) => (locale === 'ne' ? ne : en);
  const kindLabel = (kind: string) => t(KIND_KEYS[kind] ?? 'kindOther');
  const kinds = [...new Set(rows.map((row) => row.contributor_kind))];

  const columns: Column<AnnouncedRow>[] = [
    {
      key: 'contributor',
      label: tt('contributor'),
      className: 'nm',
      value: (row) => pick(row.contributor_ne, row.contributor_en),
    },
    {
      key: 'kind',
      label: t('category'),
      value: (row) => kindLabel(row.contributor_kind),
      render: (row) => <span className="tag ins">{kindLabel(row.contributor_kind)}</span>,
    },
    {
      key: 'amount',
      label: tt('amount'),
      className: 'amt',
      sortable: true,
      value: (row) => row.amount_npr ?? 0,
      // The figure where the Office gives one, its own words where it does not.
      render: (row) =>
        row.amount_npr ? (
          <>
            {row.approximate ? `${t('approx')} ` : ''}
            {formatNPR(row.amount_npr, locale)}
          </>
        ) : (
          <span className="mute">{pick(row.amount_text_ne, row.amount_text_en)}</span>
        ),
    },
    {
      key: 'state',
      label: t('state'),
      value: (row) => t(STATE_KEYS[row.state]),
      render: (row) => (
        <span className={`tag ${STATE_TAG[row.state]}`}>{t(STATE_KEYS[row.state])}</span>
      ),
    },
    {
      key: 'date',
      label: tt('date'),
      sortable: true,
      value: (row) => row.announced_on ?? '',
      render: (row) =>
        row.announced_on ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            {locale === 'ne'
              ? (row.announced_bs ?? formatAD(row.announced_on))
              : formatAD(row.announced_on)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'source',
      label: t('sourceCol'),
      sortable: false,
      value: () => t('source'),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      pageSize={20}
      csvName="rasuwa-flood-announced-support.csv"
      formatCount={(value) => formatNumber(value, locale)}
      chips={(Object.keys(STATE_KEYS) as (keyof typeof STATE_KEYS)[]).map((state) => ({
        key: state,
        label: t(STATE_KEYS[state]),
        test: (row: AnnouncedRow) => row.state === state,
      }))}
      filters={[
        {
          key: 'kind',
          label: t('category'),
          options: kinds.map((kind) => [kind, kindLabel(kind)]),
          test: (row, value) => row.contributor_kind === value,
        },
      ]}
    />
  );
}
