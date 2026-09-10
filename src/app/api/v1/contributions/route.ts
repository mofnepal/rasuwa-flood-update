import type { NextRequest } from 'next/server';
import { contributions } from '@/lib/open-data';
import { csvResponse, jsonResponse, readPaging, wantsCsv } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Published handovers to the Hon. Finance Minister (category B). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const csv = wantsCsv(params);
  const { page, perPage, skip } = readPaging(params);

  const result = await contributions({
    type: params.get('type'),
    mode: params.get('mode'),
    sector: params.get('sector'),
    from: params.get('from'),
    to: params.get('to'),
    q: params.get('q'),
    page: csv ? undefined : { skip, take: perPage },
  });
  if (!result.ok) return jsonResponse({ error: result.error }, 404);
  if (csv) return csvResponse(result.rows ?? [], 'rasuwa-flood-contributions.csv');

  const total = Number(result.body.total);
  return jsonResponse({
    ...result.body,
    page,
    per_page: perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
}
