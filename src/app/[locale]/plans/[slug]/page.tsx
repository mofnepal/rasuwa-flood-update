import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getDisaster } from '@/lib/totals';
import { STATIC_EXPORT } from '@/lib/constants';
import type { Locale } from '@/lib/format';
import { PlanView, planMetadata } from '../PlanView';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The static edition renders the page once instead: scripts/build-static.mjs removes
 * this line from its build copy.
 */
export const dynamic = 'force-dynamic';

/** The static edition writes one page per published plan. */
export async function generateStaticParams() {
  if (!STATIC_EXPORT) return [];
  const disaster = await getDisaster();
  if (!disaster) return [];
  const plans = await prisma.actionPlan.findMany({
    where: { disasterId: disaster.id, status: 'published' },
    select: { slug: true },
  });
  return plans.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  return planMetadata(locale, slug);
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <PlanView locale={locale as Locale} slug={slug} />;
}
