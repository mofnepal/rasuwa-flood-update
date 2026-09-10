import type { Locale } from './format';

/** Picks the right side of a bilingual database column. */
export function pick(
  locale: Locale,
  ne: string | null | undefined,
  en: string | null | undefined,
): string {
  const value = locale === 'ne' ? ne : en;
  return (value ?? ne ?? en ?? '').toString();
}
