import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getDisaster } from '@/lib/totals';
import { STATIC_EXPORT } from '@/lib/constants';
import type { Locale } from '@/lib/format';
import { RescueView, rescueMetadata } from '../RescueView';

/** The static edition writes one page per published NDRRMA report date. */
/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The data is cached for 60 seconds and invalidated the moment an admin action
 * publishes or withdraws a record. The static edition renders the page once instead:
 * scripts/build-static.mjs removes this line from its build copy.
 */
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  if (!STATIC_EXPORT) return [];
  const disaster = await getDisaster();
  if (!disaster) return [];
  const reports = await prisma.rescueReport.findMany({
    where: { disasterId: disaster.id, status: 'published', agency: 'NDRRMA' },
    select: { report_at: true },
  });
  return reports.map((report) => ({ date: report.report_at.toISOString().slice(0, 10) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return rescueMetadata(locale);
}

export default async function RescueReportPage({
  params,
}: {
  params: Promise<{ locale: string; date: string }>;
}) {
  const { locale, date } = await params;
  setRequestLocale(locale);
  return <RescueView locale={locale as Locale} date={date} />;
}
