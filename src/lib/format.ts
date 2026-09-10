/**
 * Number, currency and date formatting for both locales.
 *
 * Nepali: Devanagari digits with lakh/crore grouping — ४,२६,३५,६५,१७४
 * English: Western digits with the same Indian grouping — 4,26,35,65,174
 * Dates are always BS first, AD second — २०८३ भदौ २१ · 6 Sep 2026
 */

import { adToBs, BS_MONTHS_EN, BS_MONTHS_NE, parseBsLabel, type BsDate } from './bs';

export type Locale = 'ne' | 'en';

const DEVANAGARI = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;

/** 4263 → ४२६३. Non-digits pass through untouched. */
export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => DEVANAGARI[Number(d)]!);
}

/** ४२६३ → 4263. */
export function toWesternDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) =>
    String(DEVANAGARI.indexOf(d as (typeof DEVANAGARI)[number])),
  );
}

/** Indian grouping: the last three digits, then pairs — 4,26,35,65,174 */
export function groupIndian(value: number | string, decimals = 0): string {
  const n = Number(value) || 0;
  const negative = n < 0;
  const [intPart, fracPart] = Math.abs(n).toFixed(decimals).split('.');
  let head = intPart!;
  if (head.length > 3) {
    const last3 = head.slice(-3);
    let rest = head.slice(0, -3);
    const pairs: string[] = [];
    while (rest.length > 2) {
      pairs.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) pairs.unshift(rest);
    head = `${pairs.join(',')},${last3}`;
  }
  return `${negative ? '-' : ''}${head}${fracPart ? `.${fracPart}` : ''}`;
}

/** Locale-aware grouped number. */
export function formatNumber(value: number | string, locale: Locale, decimals = 0): string {
  const grouped = groupIndian(value, decimals);
  return locale === 'ne' ? toNepaliDigits(grouped) : grouped;
}

/** "रु. ४,२६,३५,६५,१७४" / "NPR 4,26,35,65,174". Never "Rs". */
export function formatNPR(value: number | string, locale: Locale, decimals = 0): string {
  return `${locale === 'ne' ? 'रु. ' : 'NPR '}${formatNumber(value, locale, decimals)}`;
}

/** USD keeps international grouping in English and Devanagari digits in Nepali. */
export function formatUSD(value: number | string, locale: Locale, decimals = 0): string {
  const n = Number(value) || 0;
  if (locale === 'ne') return `USD ${toNepaliDigits(groupIndian(n, decimals))}`;
  return `USD ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Short form: 4.26 अर्ब / 4.26 billion, 1.5 करोड / 15.0 million, 2.4 लाख / 2.4 lakh. */
export function formatShort(value: number | string, locale: Locale): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) {
    return locale === 'ne'
      ? `${toNepaliDigits((n / 1e9).toFixed(2))} अर्ब`
      : `${(n / 1e9).toFixed(2)} billion`;
  }
  if (abs >= 1e7) {
    return locale === 'ne'
      ? `${toNepaliDigits((n / 1e7).toFixed(1))} करोड`
      : `${(n / 1e6).toFixed(1)} million`;
  }
  if (abs >= 1e5) {
    return locale === 'ne'
      ? `${toNepaliDigits((n / 1e5).toFixed(1))} लाख`
      : `${(n / 1e5).toFixed(1)} lakh`;
  }
  return formatNumber(n, locale);
}

/** "NPR 4,26,35,65,174 · 4.26 billion" — English pages show both forms. */
export function formatNPRWithShort(value: number | string, locale: Locale): string {
  const long = formatNPR(value, locale);
  return locale === 'en' ? `${long} · ${formatShort(value, 'en')}` : long;
}

export function formatPercent(part: number, whole: number, locale: Locale, decimals = 1): string {
  if (!whole) return formatNumber(0, locale, decimals) + '%';
  return `${formatNumber(((100 * part) / whole).toFixed(decimals), locale, decimals)}%`;
}

const AD_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** 2026-09-06 → "6 Sep 2026". Accepts a Date or an ISO string. */
export function formatAD(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCDate()} ${AD_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "२०८३ भदौ २१" / "Bhadra 21, 2083" from a structured BS date. */
export function formatBs(bs: BsDate, locale: Locale): string {
  return locale === 'ne'
    ? `${toNepaliDigits(bs.year)} ${BS_MONTHS_NE[bs.month - 1]} ${toNepaliDigits(bs.day)}`
    : `${BS_MONTHS_EN[bs.month - 1]} ${bs.day}, ${bs.year}`;
}

/**
 * The portal's canonical date rendering: BS first, AD second.
 * "२०८३ भदौ २१ · 6 Sep 2026"
 *
 * `bsLabel` is the label as written in the source document; when it is missing
 * or unparseable the BS date is derived from the AD date.
 */
export function bsDate(
  ad: Date | string | null | undefined,
  bsLabel: string | null | undefined,
  locale: Locale,
  options: { separator?: string; adOnlyFallback?: boolean } = {},
): string {
  const separator = options.separator ?? ' · ';
  const adText = formatAD(ad);

  let bsText = '';
  if (bsLabel) {
    const parsed = parseBsLabel(
      bsLabel,
      ad ? adToBs(typeof ad === 'string' ? new Date(ad) : ad).year : undefined,
    );
    bsText = parsed ? formatBs(parsed, locale) : locale === 'ne' ? bsLabel : bsLabel;
  } else if (ad) {
    const date = typeof ad === 'string' ? new Date(ad) : ad;
    if (!Number.isNaN(date.getTime())) bsText = formatBs(adToBs(date), locale);
  }

  if (!bsText) return adText;
  if (!adText) return bsText;
  return `${bsText}${separator}${adText}`;
}

/** Time of day in Nepal Time, "१७:०० बजे" / "5:00 PM". */
export function formatTimeNPT(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale === 'en',
  }).format(date);
  return locale === 'ne' ? `${toNepaliDigits(parts)} बजे` : parts;
}

/** "as of" line beneath a figure: BS · AD · time. */
export function formatAsOf(value: Date | string, locale: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return `${bsDate(date, null, locale)}, ${formatTimeNPT(date, locale)}`;
}

/**
 * Reads a number written the way the source documents write it —
 * "2,11,76,39,003", "1,409,503,106.84", "४,२६,३५,६५,१७४", "रु. 30,00,000".
 */
export function parseGroupedNumber(input: string): number | null {
  if (input == null) return null;
  const cleaned = toWesternDigits(String(input))
    // Strip currency labels as whole tokens — "रु." carries a full stop that must
    // not survive to be read as a decimal point.
    .replace(/रु\.?|रू\.?|NPR|USD|Rs\.?/gi, '')
    .replace(/[,\s]/g, '')
    .trim();
  if (!cleaned || !/^-?(\d+(\.\d+)?|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
