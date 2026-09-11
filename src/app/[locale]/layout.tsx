import type { Metadata, Viewport } from 'next';
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
import { BASE_PATH, PALETTE, SITE_URL } from '@/lib/constants';
import { pageMetadata } from '@/lib/metadata';

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
    ...pageMetadata({
      locale,
      path: '',
      card: 'home',
      title: t('portal'),
      description: t('footerBlurb'),
      siteName: t('portal'),
      imageAlt: t('shareImageAlt'),
    }),
    title: {
      default: `${t('portal')} | ${t('ministry')}, ${t('government')}`,
      template: `%s — ${t('portal')} | ${t('ministry')}, ${t('government')}`,
    },
    metadataBase: new URL(SITE_URL),
    applicationName: t('portal'),
    // Metadata icons are not basePath-prefixed automatically. All are copies of the
    // emblem — regenerate with `node scripts/make-icons.mjs`.
    icons: {
      icon: [
        { url: `${BASE_PATH}/favicon.ico`, sizes: '16x16 32x32 48x48' },
        { url: `${BASE_PATH}/img/favicon-16.png`, sizes: '16x16', type: 'image/png' },
        { url: `${BASE_PATH}/img/favicon-32.png`, sizes: '32x32', type: 'image/png' },
        { url: `${BASE_PATH}/img/favicon-48.png`, sizes: '48x48', type: 'image/png' },
        { url: `${BASE_PATH}/img/icon-192.png`, sizes: '192x192', type: 'image/png' },
      ],
      shortcut: [{ url: `${BASE_PATH}/favicon.ico` }],
      apple: [{ url: `${BASE_PATH}/img/apple-touch-icon.png`, sizes: '180x180' }],
    },
    manifest: `${BASE_PATH}/manifest.webmanifest`,
  };
}

/** The browser's address bar and task switcher take the ministry's navy. */
export const viewport: Viewport = { themeColor: PALETTE.navy };

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
  const t = await getTranslations({ locale, namespace: 'site' });

  // Who publishes the portal, for search engines: the ministry, with the emblem as
  // its logo, and the portal itself in both languages.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GovernmentOrganization',
        '@id': 'https://mof.gov.np/#organization',
        name: 'Ministry of Finance, Government of Nepal',
        alternateName: 'अर्थ मन्त्रालय, नेपाल सरकार',
        url: 'https://mof.gov.np',
        logo: `${SITE_URL}/img/icon-512.png`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Singha Durbar',
          addressLocality: 'Kathmandu',
          addressCountry: 'NP',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: t('portal'),
        alternateName: t('portalOther'),
        url: `${SITE_URL}/`,
        inLanguage: ['ne', 'en'],
        publisher: { '@id': 'https://mof.gov.np/#organization' },
      },
    ],
  };

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
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
