import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense, type ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { FONT_FACE_CSS, PRELOADED_FONTS } from '@/lib/fonts';
import { SiteHeader } from '@/components/SiteHeader';
import { StaticMode } from '@/components/StaticMode';
import { SiteFooter } from '@/components/SiteFooter';
import { Ticker } from '@/components/Ticker';
import { getTotals, getDisaster } from '@/lib/totals';
import { getMinistryReference } from '@/lib/ministry';
import { BASE_PATH, SITE_URL } from '@/lib/constants';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'site' });
  return {
    title: {
      default: `${t('portal')} | ${t('ministry')}, ${t('government')}`,
      template: `%s — ${t('portal')} | ${t('ministry')}, ${t('government')}`,
    },
    description: t('footerBlurb'),
    metadataBase: new URL(SITE_URL),
    // Metadata icons are not basePath-prefixed automatically. These are sized
    // copies of the emblem — regenerate with `node scripts/make-icons.mjs`.
    icons: {
      icon: [
        { url: `${BASE_PATH}/img/favicon-32.png`, sizes: '32x32', type: 'image/png' },
        { url: `${BASE_PATH}/img/favicon-64.png`, sizes: '64x64', type: 'image/png' },
      ],
      apple: [{ url: `${BASE_PATH}/img/apple-touch-icon.png`, sizes: '180x180' }],
    },
    openGraph: {
      title: t('portal'),
      description: t('footerBlurb'),
      type: 'website',
      locale: locale === 'ne' ? 'ne_NP' : 'en_US',
      images: [{ url: `/og/home-${locale}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/og/home-${locale}.png`],
    },
    alternates: { languages: { ne: '/ne', en: '/en' } },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [totals, disaster, reference] = await Promise.all([
    getTotals(),
    getDisaster(),
    getMinistryReference(),
  ]);

  return (
    // StaticMode toggles a class on this element after hydration, and print
    // extensions add their own; React must not treat that as a mismatch.
    <html lang={locale} suppressHydrationWarning>
      <body>
        {/* React hoists these into <head>. A literal <head> element in a layout
            is not supported by the App Router and caused an intermittent
            hydration mismatch on the root element. */}
        <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />
        {PRELOADED_FONTS.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        <NextIntlClientProvider>
          <Suspense fallback={null}>
            <StaticMode />
          </Suspense>
          <SiteHeader />
          <Ticker
            updatedAt={totals?.last_public_update ?? null}
            eventDateAd={disaster?.event_date_ad.toISOString() ?? ''}
            eventDateBs={disaster?.event_date_bs ?? ''}
          />
          <main id="main" tabIndex={-1}>
            <div className="wrap">{children}</div>
          </main>
          <SiteFooter
            updatedAt={totals?.last_public_update ?? null}
            ministry={reference.ministry}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
