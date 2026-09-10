/**
 * Bikram Sambat ↔ Gregorian conversion.
 *
 * Anchor: 2080/01/01 BS = 14 April 2023 AD.
 * Month-length table covers 2076–2090 BS (1 Apr 2019 – 13 Apr 2034 AD); extend
 * `BS_MONTH_DAYS` with the officially published panchanga when 2091 BS approaches.
 */

export const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
] as const;

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

/** Days in each of the twelve months, keyed by BS year. */
export const BS_MONTH_DAYS: Readonly<Record<number, readonly number[]>> = {
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

export const BS_MIN_YEAR = 2076;
export const BS_MAX_YEAR = 2090;

const ANCHOR_BS_YEAR = 2080;
/** 2080/01/01 BS, as a UTC midnight so arithmetic never touches a timezone. */
const ANCHOR_AD_UTC = Date.UTC(2023, 3, 14);
const MS_PER_DAY = 86_400_000;

export interface BsDate {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–32 */
  day: number;
}

function yearLength(year: number): number {
  const months = BS_MONTH_DAYS[year];
  if (!months) throw new RangeError(`BS year ${year} is outside the calendar table`);
  return months.reduce((a, b) => a + b, 0);
}

/** Days elapsed from 2080/01/01 BS to the given BS date (may be negative). */
function daysFromAnchor({ year, month, day }: BsDate): number {
  const months = BS_MONTH_DAYS[year];
  if (!months) throw new RangeError(`BS year ${year} is outside the calendar table`);
  if (month < 1 || month > 12) throw new RangeError(`BS month ${month} is out of range`);
  const monthLength = months[month - 1]!;
  if (day < 1 || day > monthLength) {
    throw new RangeError(`${year}/${month} has ${monthLength} days, got ${day}`);
  }

  let days = 0;
  if (year >= ANCHOR_BS_YEAR) {
    for (let y = ANCHOR_BS_YEAR; y < year; y++) days += yearLength(y);
  } else {
    for (let y = year; y < ANCHOR_BS_YEAR; y++) days -= yearLength(y);
  }
  for (let m = 0; m < month - 1; m++) days += months[m]!;
  return days + (day - 1);
}

/** BS → AD. Returns a Date at UTC midnight. */
export function bsToAd(bs: BsDate): Date {
  return new Date(ANCHOR_AD_UTC + daysFromAnchor(bs) * MS_PER_DAY);
}

/** AD → BS. The time of day is ignored; the calendar date is taken in UTC. */
export function adToBs(ad: Date): BsDate {
  const utcMidnight = Date.UTC(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate());
  let remaining = Math.round((utcMidnight - ANCHOR_AD_UTC) / MS_PER_DAY);

  let year = ANCHOR_BS_YEAR;
  while (remaining < 0) {
    year -= 1;
    remaining += yearLength(year);
  }
  for (;;) {
    const length = yearLength(year);
    if (remaining < length) break;
    remaining -= length;
    year += 1;
  }

  const months = BS_MONTH_DAYS[year]!;
  let month = 1;
  while (remaining >= months[month - 1]!) {
    remaining -= months[month - 1]!;
    month += 1;
  }
  return { year, month, day: remaining + 1 };
}

/**
 * Parses the short BS labels used across the ministry's source documents:
 * "भदौ ११", "२०८३ भदौ ११", "2083/05/11", "२०८३/०५/११".
 * `defaultYear` fills in the year when the label omits it.
 */
export function parseBsLabel(label: string, defaultYear?: number): BsDate | null {
  const western = label.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d))).trim();

  const numeric = western.match(/(\d{4})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{1,2})/);
  if (numeric) {
    return { year: +numeric[1]!, month: +numeric[2]!, day: +numeric[3]! };
  }

  const monthIndex = BS_MONTHS_NE.findIndex((m) => western.includes(m));
  if (monthIndex === -1) return null;
  const numbers = western.match(/\d+/g) ?? [];
  const year = numbers.find((n) => n.length === 4);
  const day = numbers.find((n) => n.length <= 2);
  if (!day) return null;
  const resolvedYear = year ? +year : defaultYear;
  if (!resolvedYear) return null;
  return { year: resolvedYear, month: monthIndex + 1, day: +day };
}
