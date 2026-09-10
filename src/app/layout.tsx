import type { ReactNode } from 'react';
import './globals.css';

/**
 * next-intl serves every page from `/[locale]`; this root layout only exists to
 * satisfy the App Router and never renders its own <html> chrome.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
