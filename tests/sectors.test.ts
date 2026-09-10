import { describe, expect, it } from 'vitest';
import { SECTORS, SECTOR_CODES, sectorName, suggestSector } from '@/lib/sectors';

describe('SECTORS', () => {
  it('publishes the fifteen categories with unique codes', () => {
    expect(SECTORS).toHaveLength(15);
    expect(new Set(SECTOR_CODES).size).toBe(15);
  });

  it('names every sector in both languages', () => {
    for (const sector of SECTORS) {
      expect(sectorName(sector.code, 'ne')).toBe(sector.name_ne);
      expect(sectorName(sector.code, 'en')).toBe(sector.name_en);
    }
  });

  it('returns the code unchanged when it is unknown', () => {
    expect(sectorName('nonexistent', 'en')).toBe('nonexistent');
  });
});

describe('suggestSector', () => {
  it('classifies every individual as individual, whatever the name says', () => {
    expect(suggestSector('Ram Bahadur Bank', 'individual')).toBe('individual');
    expect(suggestSector('', 'individual')).toBe('individual');
  });

  it('classifies institutions from the contributor name', () => {
    expect(suggestSector('Kumari Bank Limited', 'institutional')).toBe('bank');
    expect(suggestSector('NIC Asia Bank', 'institutional')).toBe('bank');
    expect(suggestSector('Gorkha Brewery', 'institutional')).toBe('industry');
    expect(suggestSector('Ncell Axiata', 'institutional')).toBe('tech');
    expect(suggestSector("Embassy of the People's Republic of China", 'institutional')).toBe(
      'embassy',
    );
    expect(suggestSector('Soaltee Hotel Limited', 'institutional')).toBe('hospitality');
    expect(suggestSector('Nepal Insurance Authority', 'institutional')).toBe('gov');
    expect(suggestSector('Shikhar Insurance Company', 'institutional')).toBe('insurance');
  });

  it('applies rules in order, so a regulator is not filed as a bank', () => {
    expect(suggestSector('Rastriya Banijya Bank Limited', 'institutional')).toBe('gov');
    expect(suggestSector('Nepal Bank Limited', 'institutional')).toBe('gov');
  });

  it('falls back to "other" when nothing matches', () => {
    expect(suggestSector('Zzz Qqq', 'institutional')).toBe('other');
  });

  it('only ever returns a code the portal knows how to display', () => {
    const names = [
      'Everest Bank',
      'Himalaya Airlines',
      'XYZ',
      'Ama Foundation',
      'Kathmandu Medical College',
    ];
    for (const name of names) {
      expect(SECTOR_CODES).toContain(suggestSector(name, 'institutional'));
    }
  });
});
