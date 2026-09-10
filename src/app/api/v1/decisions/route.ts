import { decisions } from '@/lib/open-data';
import { jsonResponse } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Published Cabinet decisions, ministry notices and their relief measures. */
export async function GET() {
  const result = await decisions();
  return result.ok ? jsonResponse(result.body) : jsonResponse({ error: result.error }, 404);
}
