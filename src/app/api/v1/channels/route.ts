import type { NextRequest } from 'next/server';
import { channels } from '@/lib/open-data';
import { csvResponse, jsonResponse, wantsCsv } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Published NCHL / Fonepay channel snapshots (category A). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await channels({
    network: params.get('network'),
    period: params.get('period'),
    all: Boolean(params.get('all')),
  });
  if (!result.ok) return jsonResponse({ error: result.error }, 404);
  if (wantsCsv(params)) return csvResponse(result.rows ?? [], 'rasuwa-flood-channels.csv');
  return jsonResponse(result.body);
}
