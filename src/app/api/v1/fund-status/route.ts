import { fundStatus } from '@/lib/open-data';
import { jsonResponse } from '@/lib/api';

// Served from the database on request; the response carries its own cache headers.
export const dynamic = 'force-dynamic';

/**
 * Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status
 * (Nepal Rastra Bank). Account position; not part of the contributions total.
 */
export async function GET() {
  const result = await fundStatus();
  return result.ok ? jsonResponse(result.body) : jsonResponse({ error: result.error }, 404);
}
