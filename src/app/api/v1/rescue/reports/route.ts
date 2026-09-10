import type { NextRequest } from 'next/server';
import { rescueReports } from '@/lib/open-data';
import { jsonResponse, readPaging } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Archive of every published daily report. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { page, perPage, skip } = readPaging(params, 50);
  const result = await rescueReports({
    agency: params.get('agency'),
    page: { skip, take: perPage },
  });
  if (!result.ok) return jsonResponse({ error: result.error }, 404);

  const { as_of, total, data } = result.body;
  return jsonResponse({ as_of, page, per_page: perPage, total, data });
}
