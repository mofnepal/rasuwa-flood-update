import { rescueLatest } from '@/lib/open-data';
import { jsonResponse } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** The newest published report from each agency. */
export async function GET() {
  const result = await rescueLatest();
  return result.ok ? jsonResponse(result.body) : jsonResponse({ error: result.error }, 404);
}
