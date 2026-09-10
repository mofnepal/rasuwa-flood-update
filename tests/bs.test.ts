import { describe, expect, it } from 'vitest';
import { adToBs, bsToAd, BS_MAX_YEAR, BS_MIN_YEAR, parseBsLabel } from '@/lib/bs';

const iso = (date: Date) => date.toISOString().slice(0, 10);

describe('bsToAd', () => {
  it("matches the dates printed on the ministry's own documents", () => {
    // The Fund status statement covers Bhadra 11–22, 2083 = 27 Aug – 7 Sep 2026.
    expect(iso(bsToAd({ year: 2083, month: 5, day: 11 }))).toBe('2026-08-27');
    expect(iso(bsToAd({ year: 2083, month: 5, day: 22 }))).toBe('2026-09-07');
    // The flood itself, Bhadra 10, 2083.
    expect(iso(bsToAd({ year: 2083, month: 5, day: 10 }))).toBe('2026-08-26');
    // New year anchors.
    expect(iso(bsToAd({ year: 2080, month: 1, day: 1 }))).toBe('2023-04-14');
    expect(iso(bsToAd({ year: 2083, month: 1, day: 1 }))).toBe('2026-04-14');
  });

  it('rejects dates the calendar cannot represent', () => {
    expect(() => bsToAd({ year: 2083, month: 13, day: 1 })).toThrow();
    expect(() => bsToAd({ year: 2083, month: 5, day: 33 })).toThrow();
    expect(() => bsToAd({ year: 2050, month: 1, day: 1 })).toThrow();
  });
});

describe('adToBs', () => {
  it('inverts bsToAd across the whole supported range', () => {
    for (let year = BS_MIN_YEAR; year <= BS_MAX_YEAR; year++) {
      for (const month of [1, 5, 9, 12]) {
        for (const day of [1, 15]) {
          const bs = { year, month, day };
          expect(adToBs(bsToAd(bs))).toEqual(bs);
        }
      }
    }
  });

  it("converts the ministry's reference dates back", () => {
    expect(adToBs(new Date('2026-08-27T00:00:00Z'))).toEqual({ year: 2083, month: 5, day: 11 });
    expect(adToBs(new Date('2026-09-07T00:00:00Z'))).toEqual({ year: 2083, month: 5, day: 22 });
  });

  it('ignores the time of day', () => {
    expect(adToBs(new Date('2026-09-07T23:45:00Z'))).toEqual({ year: 2083, month: 5, day: 22 });
  });
});

describe('parseBsLabel', () => {
  it('reads the short labels used across the source documents', () => {
    expect(parseBsLabel('२०८३ भदौ ११')).toEqual({ year: 2083, month: 5, day: 11 });
    expect(parseBsLabel('भदौ ११', 2083)).toEqual({ year: 2083, month: 5, day: 11 });
    expect(parseBsLabel('2083/05/11')).toEqual({ year: 2083, month: 5, day: 11 });
    expect(parseBsLabel('२०८३/०५/२२')).toEqual({ year: 2083, month: 5, day: 22 });
    expect(parseBsLabel('२०८३ भदौ २२, बेलुका ५:०० बजे')).toEqual({ year: 2083, month: 5, day: 22 });
  });

  it('returns null when there is no year to fall back on', () => {
    expect(parseBsLabel('भदौ ११')).toBeNull();
    expect(parseBsLabel('निरन्तर', 2083)).toBeNull();
    expect(parseBsLabel('')).toBeNull();
  });
});
