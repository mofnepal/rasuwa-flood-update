import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { inferColumns, parseContributionRows, readWorkbook } from '@/lib/import/contributions';

/**
 * The Fund Section sends two shapes of spreadsheet: the full list with Nepali
 * headers, and a continuation sheet for the day with no header row at all — just
 * the serial, the date, the name and the amount, indented several columns in.
 * Both have to import.
 */
describe('a sheet sent without a header row', () => {
  const file = path.join(process.cwd(), 'reference', 'bhadra_24_collection.xlsx');

  it('works out which column is which from the data', () => {
    const rows = [
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        387,
        'भदौ २४',
        'Nar Bahadur Khadka',
        107913,
        null,
        null,
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        388,
        'भदौ २४',
        'G 2.2 Biratnagar Met Morang',
        10001000,
        null,
        null,
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        389,
        'भदौ २४',
        'Bhupendra Kumar Gurung',
        110000,
        null,
        null,
      ],
      [null, null, null, null, null, null, null, 390, 'भदौ २४', 'Upendra Ale', 1000195, null, null],
    ];
    const columns = inferColumns(rows);
    expect(columns.sn).toBe(7);
    expect(columns.date).toBe(8);
    expect(columns.name).toBe(9);
    expect(columns.npr).toBe(10);
  });

  it('reads the Bhadra 24 continuation sheet in full', async () => {
    const { headers, rows } = await readWorkbook(await readFile(file));
    const preview = parseContributionRows(headers, rows);

    // 59 entries, serials 387–445, and the sheet's own total row is not one of them.
    const entries = preview.rows.filter((row) => row.contributor_name);
    expect(entries).toHaveLength(59);
    expect(entries[0]!.sn).toBe(387);
    expect(entries.at(-1)!.sn).toBe(445);
    expect(entries.every((row) => row.date_bs === 'भदौ २४')).toBe(true);
    expect(entries.every((row) => row.date_ad === '2026-09-09')).toBe(true);

    const total = entries.reduce((sum, row) => sum + (row.amount_npr ?? 0), 0);
    expect(total).toBe(223_249_471);
  });

  it('still reads the headed spreadsheet the same way as before', async () => {
    const { headers, rows } = await readWorkbook(
      await readFile(path.join(process.cwd(), 'reference', 'bhadra_19_inperson_list.xlsx')),
    );
    const preview = parseContributionRows(headers, rows);
    expect(preview.rows).toHaveLength(331);
    expect(preview.total_npr).toBeCloseTo(1_929_292_838.25, 2);
  });
});
