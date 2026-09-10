'use client';

import { useLocale, useTranslations } from 'next-intl';
import { DataTable, type Column } from '@/components/DataTable';
import { Icon } from '@/components/Icon';
import { formatNumber, type Locale } from '@/lib/format';

export interface ContactRow {
  id: string;
  group_ne: string;
  group_en: string;
  title_ne: string;
  title_en: string;
  name_ne: string;
  name_en: string;
  phone: string;
}

/** One merged, searchable table of every single-window contact. */
export function ContactTable({ rows }: { rows: ContactRow[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('contact');
  const groups = [...new Set(rows.map((row) => (locale === 'ne' ? row.group_ne : row.group_en)))];

  const columns: Column<ContactRow>[] = [
    {
      key: 'sn',
      label: '#',
      value: (row) => rows.indexOf(row) + 1,
      render: (row) => formatNumber(rows.indexOf(row) + 1, locale),
    },
    {
      key: 'group',
      label: t('group'),
      value: (row) => (locale === 'ne' ? row.group_ne : row.group_en),
    },
    {
      key: 'title',
      label: t('designation'),
      value: (row) => (locale === 'ne' ? row.title_ne : row.title_en),
      render: (row) => `${row.title_ne} / ${row.title_en}`,
    },
    {
      key: 'name',
      label: t('name'),
      className: 'nm',
      value: (row) => `${row.name_ne} ${row.name_en}`,
      render: (row) => (
        <>
          {row.name_ne}
          <div style={{ fontSize: 12.5, color: 'var(--mute)', fontWeight: 400 }}>{row.name_en}</div>
        </>
      ),
    },
    {
      key: 'phone',
      label: t('phone'),
      sortable: false,
      value: (row) => row.phone,
      render: (row) => (
        <a className="tel" href={`tel:+977${row.phone}`}>
          <Icon name="contact" /> {formatNumber(Number(row.phone), locale).replace(/,/g, '')}
        </a>
      ),
    },
  ];

  return (
    <div id="ctbl">
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        pageSize={25}
        csvName="rasuwa-flood-contacts.csv"
        formatCount={(value) => formatNumber(value, locale)}
        filters={[
          {
            key: 'group',
            label: t('group'),
            options: groups.map((group) => [group, group]),
            test: (row, value) => (locale === 'ne' ? row.group_ne : row.group_en) === value,
          },
        ]}
      />
    </div>
  );
}
