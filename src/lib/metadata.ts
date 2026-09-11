import type { Metadata } from 'next';
import { STATIC_EXPORT } from './constants';

/**
 * A page's address under the metadata base, exactly as it is served — the static
 * edition serves every page as a folder, so its addresses end in a slash.
 */
export function pageUrl(locale: string, path: string): string {
  const address = `/${locale}${path}`;
  return STATIC_EXPORT ? `${address}/` : address;
}

export interface PageShare {
  locale: string;
  /** '' for the home page, '/contributions' and so on for a section. */
  path: string;
  /** The share card drawn for the page: /og/<card>-<locale>.png. */
  card: string;
  title: string;
  description: string;
  siteName: string;
  imageAlt: string;
}

/**
 * Everything a search engine or a messaging app reads to preview a page: its
 * canonical address and the other language's, and the Open Graph and Twitter
 * card with the page's own share image — the emblem and its headline figure.
 */
export function pageMetadata({
  locale,
  path,
  card,
  title,
  description,
  siteName,
  imageAlt,
}: PageShare): Metadata {
  const url = pageUrl(locale, path);
  const shareTitle = path ? `${title} — ${siteName}` : siteName;
  const image = { url: `/og/${card}-${locale}.png`, width: 1200, height: 630, alt: imageAlt };
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { ne: pageUrl('ne', path), en: pageUrl('en', path) },
    },
    openGraph: {
      type: 'website',
      siteName,
      title: shareTitle,
      description,
      url,
      locale: locale === 'ne' ? 'ne_NP' : 'en_US',
      alternateLocale: locale === 'ne' ? 'en_US' : 'ne_NP',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: shareTitle,
      description,
      images: [image],
    },
  };
}
