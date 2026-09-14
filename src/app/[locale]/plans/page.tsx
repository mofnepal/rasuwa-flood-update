import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/lib/format';
import { PlanView, planMetadata } from './PlanView';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The data is cached for 60 seconds and invalidated the moment an admin action
 * publishes or withdraws a record. The static edition renders the page once instead:
 * scripts/build-static.mjs removes this line from its build copy.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return planMetadata(locale);
}

/** The latest published action plan, with the others listed beneath it. */
export default async function PlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PlanView locale={locale as Locale} />;
}
