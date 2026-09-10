'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from './Icon';

export interface Column<T> {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  /** Plain value used for search, sorting and CSV. */
  value: (row: T) => string | number;
  /** Rich cell content; falls back to `value`. */
  render?: (row: T) => ReactNode;
  /** Rows are summed on this column and the total shown in the footer. */
  total?: (row: T) => number;
}

export interface Filter<T> {
  key: string;
  label: string;
  options: [string, string][];
  test: (row: T, value: string) => boolean;
}

export interface QuickChip<T> {
  key: string;
  label: string;
  test: (row: T) => boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  pageSize?: number;
  filters?: Filter<T>[];
  chips?: QuickChip<T>[];
  csvName?: string;
  /**
   * Query-string parameters applied once the page has loaded, so a link can open
   * the table already searched or filtered: `{ query: 'q', filters: { sector:
   * 'sector' } }` reads `?q=` into the search box and `?sector=` into the filter
   * with that key. Read in the browser, so the same link works on the static edition.
   */
  urlParams?: { query?: string; filters?: Record<string, string> };
  /** Formats the footer sum, e.g. as NPR. */
  formatTotal?: (value: number) => string;
  /** Locale-aware digits for counts and page numbers. */
  formatCount?: (value: number) => string;
}

/**
 * The register table used across the portal: search, quick chips, select
 * filters, sortable columns, pagination and CSV export of the filtered view.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  pageSize = 25,
  filters = [],
  chips = [],
  csvName = 'data.csv',
  urlParams,
  formatTotal,
  formatCount = (value) => String(value),
}: DataTableProps<T>) {
  const t = useTranslations('table');
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<[string, 'asc' | 'desc'] | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!urlParams) return;
    const search = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.query ? search.get(urlParams.query) : null;
    if (fromUrl) setQuery(fromUrl);
    const filtersFromUrl: Record<string, string> = {};
    for (const [key, param] of Object.entries(urlParams.filters ?? {})) {
      const value = search.get(param);
      if (value) filtersFromUrl[key] = value;
    }
    if (Object.keys(filtersFromUrl).length) setSelected(filtersFromUrl);
    // Read once, when the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chipped = useMemo(() => {
    const active = chips.find((c) => c.key === chip);
    return active ? rows.filter(active.test) : rows;
  }, [rows, chips, chip]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = chipped;
    if (needle) {
      result = result.filter((row) =>
        columns.some((column) => String(column.value(row)).toLowerCase().includes(needle)),
      );
    }
    for (const filter of filters) {
      const value = selected[filter.key];
      if (value) result = result.filter((row) => filter.test(row, value));
    }
    if (sort) {
      const column = columns.find((c) => c.key === sort[0]);
      if (column) {
        const direction = sort[1] === 'asc' ? 1 : -1;
        result = [...result].sort((a, b) => {
          const va = column.value(a);
          const vb = column.value(b);
          return (va > vb ? 1 : va < vb ? -1 : 0) * direction;
        });
      }
    }
    return result;
  }, [chipped, query, columns, filters, selected, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);
  const totalColumn = columns.find((c) => c.total);
  const sum = totalColumn
    ? filtered.reduce((acc, row) => acc + (totalColumn.total!(row) || 0), 0)
    : null;
  const isFiltered = Boolean(query || chip || Object.values(selected).some(Boolean));

  const exportCsv = () => {
    const lines = [columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',')];
    for (const row of filtered) {
      lines.push(columns.map((c) => `"${String(c.value(row)).replace(/"/g, '""')}"`).join(','));
    }
    const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const pageButtons = () => {
    const wanted = new Set(
      [1, pages, current - 1, current, current + 1].filter((n) => n >= 1 && n <= pages),
    );
    const list = [...wanted].sort((a, b) => a - b);
    return list.map((n, index) => (
      <span key={n} style={{ display: 'contents' }}>
        {index > 0 && n - list[index - 1]! > 1 ? <span>…</span> : null}
        <button type="button" className={n === current ? 'on' : ''} onClick={() => setPage(n)}>
          {formatCount(n)}
        </button>
      </span>
    ));
  };

  return (
    <>
      {chips.length ? (
        <div className="chips" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={chip === ''}
            className={`qchip${chip === '' ? ' on' : ''}`}
            onClick={() => {
              setChip('');
              setPage(1);
            }}
          >
            {t('all')}
            <em>{formatCount(rows.length)}</em>
          </button>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={chip === c.key}
              className={`qchip${chip === c.key ? ' on' : ''}`}
              onClick={() => {
                setChip(c.key);
                setPage(1);
              }}
            >
              {c.label}
              <em>{formatCount(rows.filter(c.test).length)}</em>
            </button>
          ))}
        </div>
      ) : null}

      <div className="filters">
        <Icon name="search" />
        <input
          type="search"
          placeholder={t('search')}
          aria-label={t('search')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        {filters.map((filter) => (
          <select
            key={filter.key}
            aria-label={filter.label}
            value={selected[filter.key] ?? ''}
            onChange={(event) => {
              setSelected((previous) => ({ ...previous, [filter.key]: event.target.value }));
              setPage(1);
            }}
          >
            <option value="">
              {filter.label}: {t('all')}
            </option>
            {filter.options.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        ))}
        {isFiltered ? (
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              setQuery('');
              setSelected({});
              setChip('');
              setPage(1);
            }}
          >
            <Icon name="close" /> {t('clear')}
          </button>
        ) : null}
        <button type="button" className="btn ghost sm" onClick={exportCsv}>
          <Icon name="download" /> {t('csv')}
        </button>
      </div>

      <div className="tscroll">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((column) => {
                const sortable = column.sortable !== false;
                const active = sort?.[0] === column.key;
                return (
                  <th
                    key={column.key}
                    className={`${column.className ?? ''} ${sortable ? 's' : ''} ${
                      active ? sort![1] : ''
                    }`}
                    aria-sort={active ? (sort![1] === 'asc' ? 'ascending' : 'descending') : 'none'}
                    onClick={
                      sortable
                        ? () =>
                            setSort((previous) =>
                              previous?.[0] === column.key && previous[1] === 'desc'
                                ? [column.key, 'asc']
                                : [column.key, 'desc'],
                            )
                        : undefined
                    }
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.length ? (
              slice.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td key={column.key} className={column.className}>
                      {column.render ? column.render(row) : column.value(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty">{t('empty')}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="tfoot">
        <span>
          {t('entriesOf', { shown: formatCount(filtered.length), total: formatCount(rows.length) })}{' '}
          · {t('page', { page: formatCount(current), pages: formatCount(pages) })}
          {sum !== null && formatTotal ? (
            <>
              {' · '}
              <b>{formatTotal(sum)}</b>
            </>
          ) : null}
        </span>
        <div className="pager">
          <button
            type="button"
            aria-label={t('previous')}
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            ‹
          </button>
          {pageButtons()}
          <button
            type="button"
            aria-label={t('next')}
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}
