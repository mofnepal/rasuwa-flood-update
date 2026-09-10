import { contacts } from '@/lib/open-data';
import { jsonResponse } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/** Single-window contacts and the ministry's own details. */
export async function GET() {
  const result = await contacts();
  return result.ok ? jsonResponse(result.body) : jsonResponse({ error: result.error }, 404);
}
