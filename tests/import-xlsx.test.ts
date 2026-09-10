import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContributionRows, readWorkbook } from '@/lib/import/contributions';

/**
 * The importer is checked against the ministry's own workbook, so a change to the
 * parser that would mis-read the real list fails here rather than in production.
 */
describe('the Bhadra 19 workbook the Fund Section keeps', () => {
  const file = path.join(process.cwd(), 'reference', 'bhadra_19_inperson_list.xlsx');

  it('reads every row and totals exactly what the seed reconciles to', async () => {
    const { headers, rows } = await readWorkbook(await readFile(file));
    const preview = parseContributionRows(headers, rows);

    expect(preview.rows).toHaveLength(331);
    expect(preview.invalid).toBe(0);
    expect(preview.total_npr).toBeCloseTo(1929292838.25, 2);
    expect(preview.total_usd).toBe(200000);
  });

  it('classifies the types, modes and dates the sheet carries', async () => {
    const { headers, rows } = await readWorkbook(await readFile(file));
    const { rows: parsed } = parseContributionRows(headers, rows);

    expect(parsed.filter((row) => row.contributor_type === 'institutional')).toHaveLength(315);
    expect(parsed.filter((row) => row.contributor_type === 'individual')).toHaveLength(16);
    expect(parsed.filter((row) => row.payment_mode === 'cheque')).toHaveLength(300);
    expect(parsed.filter((row) => row.payment_mode === 'bank_transfer')).toHaveLength(31);

    // Bhadra 11–19, 2083 = 27 Aug – 4 Sep 2026.
    const dates = [...new Set(parsed.map((row) => row.date_ad))].sort();
    expect(dates[0]).toBe('2026-08-27');
    expect(dates.at(-1)).toBe('2026-09-04');
    expect(parsed.every((row) => row.date_ad !== null)).toBe(true);
  });

  it('gives every row a sector the portal can display', async () => {
    const { headers, rows } = await readWorkbook(await readFile(file));
    const { rows: parsed } = parseContributionRows(headers, rows);
    expect(parsed.every((row) => row.sector.length > 0)).toBe(true);
    expect(parsed.find((row) => row.contributor_name.includes('Kumari Bank'))?.sector).toBe('bank');
  });
});
