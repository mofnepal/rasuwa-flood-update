import { NextResponse, type NextRequest } from 'next/server';
import { searchPortal } from '@/lib/search';
import type { Locale } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const locale = (request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ne') as Locale;
  if (query.trim().length < 2) return NextResponse.json({ hits: [] });
  const hits = await searchPortal(query, locale);
  return NextResponse.json({ hits });
}
