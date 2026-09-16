'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { Icon } from '@/components/Icon';
import { bsDate, formatAD, formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';

export interface ForeignRow {
  id: string;
  date_ad: string;
  date_bs: string;
  contributor: string;
  contributor_ne: string | null;
  country_ne: string | null;
  country_en: string | null;
  contributor_type: string;
  kind: string;
  channel: string;
  channel_ne: string | null;
  amount_usd: number;
  amount_npr_equiv: number;
  in_kind_valuation_npr: number;
  pledge_received_at: string | null;
  published_at: string | null;
  /** False for support reported by OPMCM, listed but never counted. */
  in_fund: boolean;
  amount_text: string | null;
  report_status: string | null;
  stated_to_fund: boolean;
  fund_register_ref: string | null;
  detail_en: string | null;
  detail_ne: string | null;
  aid_list_note: { en?: string; ne?: string } | null;
  source_url: string | null;
}

export function ForeignRegister({ rows }: { rows: ForeignRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('foreign');
  const tt = useTranslations('table');
  const ty = useTranslations('types');
  const tk = useTranslations('kinds');
  const ts = useTranslations('site');

  const count = (value: number) => formatNumber(value, locale);
  const contributorTypes = [...new Set(rows.map((row) => row.contributor_type))];
  const kinds = [...new Set(rows.map((row) => row.kind))];
  const countries = [...new Set(rows.map((row) => row.country_en ?? ''))].filter(Boolean).sort();
  const countryName = (en: string) =>
    (locale === 'ne' && rows.find((row) => row.country_en === en)?.country_ne) || en;

  const columns: Column<ForeignRow>[] = [
    {
      key: 'date',
      label: tt('date'),
      value: (row) => row.date_ad,
      // One calendar on one line: the Nepali date in Nepali, the Gregorian in English.
      render: (row) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {locale === 'ne'
            ? bsDate(row.date_ad, row.date_bs, locale).split(' · ')[0]
            : formatAD(row.date_ad)}
        </span>
      ),
    },
    {
      key: 'contributor',
      label: tt('contributor'),
      className: 'nm',
      value: (row) => (locale === 'ne' ? (row.contributor_ne ?? row.contributor) : row.contributor),
    },
    {
      key: 'status',
      label: t('statusCol'),
      value: (row) => (row.in_fund ? t('inFund') : t('reported')),
      render: (row) =>
        row.in_fund ? (
          <span className="tag gov">{t('inFund')}</span>
        ) : (
          <span className="tag ins">
            {row.report_status === 'pledged'
              ? t('reportedPledged')
              : row.report_status === 'in_transit'
                ? t('reportedInTransit')
                : row.report_status === 'delivered'
                  ? t('reportedDelivered')
                  : t('reportedShort')}
          </span>
        ),
    },
    {
      key: 'country',
      label: t('country'),
      value: (row) => (locale === 'ne' ? (row.country_ne ?? '') : (row.country_en ?? '')),
    },
    {
      key: 'type',
      label: tt('type'),
      value: (row) => ty(row.contributor_type),
      render: (row) => (
        <span
          className={`tag ${
            row.contributor_type === 'government_embassy'
              ? 'gov'
              : row.contributor_type === 'corporation'
                ? 'corp'
                : 'ins'
          }`}
        >
          {ty(row.contributor_type)}
        </span>
      ),
    },
    {
      key: 'kind',
      label: t('kind'),
      value: (row) => tk(row.kind),
    },
    {
      key: 'channel',
      label: t('channel'),
      value: (row) => (locale === 'ne' ? (row.channel_ne ?? row.channel) : row.channel),
    },
    {
      key: 'usd',
      label: t('usd'),
      className: 'amt',
      value: (row) => row.amount_usd,
      render: (row) => (row.amount_usd ? formatUSD(row.amount_usd, locale) : '—'),
    },
    {
      key: 'npr',
      label: t('nprEquiv'),
      className: 'amt',
      value: (row) => row.amount_npr_equiv,
      total: (row) => row.amount_npr_equiv,
      render: (row) => (row.amount_npr_equiv ? formatNPR(row.amount_npr_equiv, locale) : '—'),
    },
    {
      key: 'verified',
      label: tt('verified'),
      sortable: false,
      value: () => '✓',
      render: (row) =>
        row.in_fund ? (
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
        ) : (
          <span className="mute" title={t('reported')}>
            —
          </span>
        ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      csvName="rasuwa-flood-foreign-assistance.csv"
      urlParams={{ query: 'q' }}
      formatCount={count}
      formatTotal={(value) => formatNPR(value, locale)}
      chips={[
        { key: 'infund', label: t('chipInFund'), test: (row: ForeignRow) => row.in_fund },
        { key: 'reported', label: t('chipReported'), test: (row: ForeignRow) => !row.in_fund },
        ...kinds.map((kind) => ({
          key: kind,
          label: tk(kind),
          test: (row: ForeignRow) => row.kind === kind,
        })),
      ]}
      filters={[
        {
          key: 'type',
          label: tt('type'),
          options: contributorTypes.map((value) => [value, ty(value)]),
          test: (row, value) => row.contributor_type === value,
        },
        {
          key: 'kind',
          label: t('kind'),
          options: kinds.map((value) => [value, tk(value)]),
          test: (row, value) => row.kind === value,
        },
        {
          key: 'country',
          label: t('country'),
          options: countries.map((value) => [value, countryName(value)]),
          test: (row, value) => row.country_en === value,
        },
      ]}
    />
  );
}
