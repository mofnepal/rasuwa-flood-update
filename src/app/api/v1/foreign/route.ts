import type { NextRequest } from 'next/server';
import { foreign } from '@/lib/open-data';
import { csvResponse, jsonResponse, wantsCsv } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Identified foreign contributors (category D), a subset of category C. */
export async function GET(request: NextRequest) {
  const result = await foreign();
  if (!result.ok) return jsonResponse({ error: result.error }, 404);
  if (wantsCsv(request.nextUrl.searchParams)) {
    return csvResponse(result.rows ?? [], 'rasuwa-flood-foreign-assistance.csv');
  }
  return jsonResponse(result.body);
}
