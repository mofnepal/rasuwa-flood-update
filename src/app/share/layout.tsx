import type { ReactNode } from 'react';

/**
 * The share cards are photographed, not read: no site chrome, no indexing.
 * `app/share/[card]` renders one card per page and language at exactly the
 * card's size; scripts/build-static.mjs screenshots each into `og/`.
 */
export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, background: '#FFFFFF' }}>{children}</body>
    </html>
  );
}
