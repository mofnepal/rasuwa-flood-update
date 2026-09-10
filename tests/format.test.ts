import { describe, expect, it } from 'vitest';
import {
  bsDate,
  formatAD,
  formatNPR,
  formatNumber,
  formatPercent,
  formatShort,
  formatUSD,
  groupIndian,
  parseGroupedNumber,
  toNepaliDigits,
  toWesternDigits,
} from '@/lib/format';

describe('toNepaliDigits', () => {
  it('converts every digit and leaves the rest alone', () => {
    expect(toNepaliDigits('2083')).toBe('२०८३');
    expect(toNepaliDigits(4263565174)).toBe('४२६३५६५१७४');
    expect(toNepaliDigits('4,26,35,65,174')).toBe('४,२६,३५,६५,१७४');
    expect(toNepaliDigits('NPR 100')).toBe('NPR १००');
  });
  it('round-trips with toWesternDigits', () => {
    expect(toWesternDigits(toNepaliDigits('1234567890'))).toBe('1234567890');
  });
});

describe('groupIndian', () => {
  it('groups the last three digits then in pairs', () => {
    expect(groupIndian(4263565174)).toBe('4,26,35,65,174');
    expect(groupIndian(1929292838.25, 2)).toBe('1,92,92,92,838.25');
    expect(groupIndian(100)).toBe('100');
    expect(groupIndian(1000)).toBe('1,000');
    expect(groupIndian(100000)).toBe('1,00,000');
    expect(groupIndian(10000000)).toBe('1,00,00,000');
  });
  it('keeps the sign and honours the decimal count', () => {
    expect(groupIndian(-1234567)).toBe('-12,34,567');
    expect(groupIndian(0)).toBe('0');
    expect(groupIndian(1234.5678, 2)).toBe('1,234.57');
  });
});

describe('formatNumber and formatNPR', () => {
  it('uses Devanagari digits in Nepali and Western digits in English', () => {
    expect(formatNumber(4263565174, 'ne')).toBe('४,२६,३५,६५,१७४');
    expect(formatNumber(4263565174, 'en')).toBe('4,26,35,65,174');
  });
  it('labels the currency "रु." in Nepali and "NPR" in English, never "Rs"', () => {
    expect(formatNPR(4263565174, 'ne')).toBe('रु. ४,२६,३५,६५,१७४');
    expect(formatNPR(4263565174, 'en')).toBe('NPR 4,26,35,65,174');
    expect(formatNPR(100, 'en')).not.toContain('Rs');
  });
  it('formats the verified grand total exactly', () => {
    expect(formatNPR(11832674653.79, 'en', 2)).toBe('NPR 11,83,26,74,653.79');
  });
});

describe('formatUSD', () => {
  it('uses international grouping in English and Devanagari digits in Nepali', () => {
    expect(formatUSD(20410390, 'en')).toBe('USD 20,410,390');
    expect(formatUSD(20410390, 'ne')).toBe('USD २,०४,१०,३९०');
  });
});

describe('formatShort', () => {
  it('uses arab/crore/lakh in Nepali and billion/million/lakh in English', () => {
    expect(formatShort(4263565174, 'ne')).toBe('४.२६ अर्ब');
    expect(formatShort(4263565174, 'en')).toBe('4.26 billion');
    expect(formatShort(15000000, 'ne')).toBe('१.५ करोड');
    expect(formatShort(15000000, 'en')).toBe('15.0 million');
    expect(formatShort(240000, 'en')).toBe('2.4 lakh');
    expect(formatShort(900, 'en')).toBe('900');
  });
});

describe('formatPercent', () => {
  it('handles a zero denominator without dividing by zero', () => {
    expect(formatPercent(5, 0, 'en')).toBe('0.0%');
    expect(formatPercent(25, 100, 'en')).toBe('25.0%');
    expect(formatPercent(25, 100, 'ne')).toBe('२५.०%');
  });
});

describe('formatAD', () => {
  it('renders the Gregorian date the way the ministry writes it', () => {
    expect(formatAD('2026-09-06T12:00:00Z')).toBe('6 Sep 2026');
    expect(formatAD(null)).toBe('');
    expect(formatAD('not a date')).toBe('');
  });
});

describe('bsDate', () => {
  it('puts the BS date first and the AD date second', () => {
    expect(bsDate('2026-09-06T00:00:00Z', 'भदौ २१', 'ne')).toBe('२०८३ भदौ २१ · 6 Sep 2026');
    expect(bsDate('2026-09-06T00:00:00Z', 'भदौ २१', 'en')).toBe('Bhadra 21, 2083 · 6 Sep 2026');
  });
  it('derives the BS date when the source document gives none', () => {
    expect(bsDate('2026-08-27T00:00:00Z', null, 'en')).toBe('Bhadra 11, 2083 · 27 Aug 2026');
  });
  it('falls back to the AD date alone when there is nothing to convert', () => {
    expect(bsDate('2026-09-06T00:00:00Z', '', 'en')).toContain('6 Sep 2026');
  });
});

describe('parseGroupedNumber', () => {
  it('reads numbers as the source documents write them', () => {
    expect(parseGroupedNumber('2,11,76,39,003')).toBe(2117639003);
    expect(parseGroupedNumber('1,409,503,106.84')).toBe(1409503106.84);
    expect(parseGroupedNumber('४,२६,३५,६५,१७४')).toBe(426356517_4);
    expect(parseGroupedNumber('रु. 30,00,000')).toBe(3000000);
    expect(parseGroupedNumber('NPR 8,460,662,427')).toBe(8460662427);
  });
  it('rejects anything that is not a number', () => {
    expect(parseGroupedNumber('')).toBeNull();
    expect(parseGroupedNumber('n/a')).toBeNull();
    expect(parseGroupedNumber('—')).toBeNull();
  });
});
