import { summary } from '@/lib/open-data';
import { jsonResponse } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/**
 * The headline figures, with each source's cut-off beside them.
 * Grand total = online channels + handovers + foreign USD × FX.
 */
export async function GET() {
  const result = await summary();
  return result.ok ? jsonResponse(result.body) : jsonResponse({ error: result.error }, 404);
}
