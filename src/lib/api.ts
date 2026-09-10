import 'server-only';
import { NextResponse } from 'next/server';

/**
 * Helpers shared by the open-data endpoints. Every response is read-only,
 * carries an `as_of`, and is built from published records only.
 */

export const API_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  'Access-Control-Allow-Origin': '*',
};

export function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return NextResponse.json(payload, { status, headers: API_CACHE_HEADERS });
}

/** Serialises a list of flat objects as CSV with a BOM, so Excel opens it as UTF-8. */
export function csvResponse(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) {
    return new NextResponse('﻿', {
      headers: { ...API_CACHE_HEADERS, 'Content-Type': 'text/csv; charset=utf-8' },
    });
  }
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');

  return new NextResponse(`﻿${body}`, {
    headers: {
      ...API_CACHE_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export interface PageParams {
  page: number;
  perPage: number;
  skip: number;
}

export function readPaging(searchParams: URLSearchParams, defaultPerPage = 100): PageParams {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const perPage = Math.min(
    500,
    Math.max(1, Number(searchParams.get('per_page') ?? defaultPerPage) || defaultPerPage),
  );
  return { page, perPage, skip: (page - 1) * perPage };
}

export function wantsCsv(searchParams: URLSearchParams): boolean {
  return searchParams.get('format')?.toLowerCase() === 'csv';
}
