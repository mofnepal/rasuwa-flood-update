import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// The same two variables are read by src/lib/constants.ts, so the pages and the
// build always agree on the edition and the mount point.
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/rasuwa-flood';

/** The ministry's server: Node, PostgreSQL, admin, API. */
const serverEdition: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**': ['./prisma/**', './seed/**'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // Public pages are rendered per request so the figures are always the
        // published ones, and so the image builds without a database. A short
        // shared cache in front absorbs traffic spikes without going stale.
        source: '/:locale(ne|en)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/api/v1/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

/**
 * The static edition for GitHub Pages — see scripts/build-static.mjs. Plain
 * files, one folder per page (so every address ends in a slash, which is how
 * Pages serves index.html), and images served as they are.
 */
const staticEdition: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  reactStrictMode: true,
  poweredByHeader: false,
  // CI lints the repository itself; the static build runs on a trimmed copy.
  eslint: { ignoreDuringBuilds: STATIC_EXPORT },
  ...(STATIC_EXPORT ? staticEdition : serverEdition),
};

export default withNextIntl(nextConfig);
