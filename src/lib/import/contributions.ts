import 'server-only';
import ExcelJS from 'exceljs';
import { parseGroupedNumber } from '@/lib/format';
import { parseBsLabel, bsToAd } from '@/lib/bs';
import { suggestSector } from '@/lib/sectors';

/**
 * Reads the in-person handover list exactly as the Fund Section keeps it:
 *
 *   सि.नं. | मिति | सहयोग गर्ने निकाय / व्यक्ति | Institution / Personnal (Type)
 *         | Cheque/Non Cheque | सहयोग रकम (रू.) | सहयोग रकम (अमेरिकी डलर)
 *
 * Column order is not assumed — headers are matched by name, so a re-ordered
 * sheet still imports. Every row is validated and reported back before anything
 * is written; the officer sees the preview first.
 */

export interface ParsedContribution {
  row: number;
  sn: number | null;
  date_bs: string;
  date_ad: string | null;
  contributor_name: string;
  contributor_type: 'institutional' | 'individual';
  payment_mode: 'cheque' | 'bank_transfer';
  amount_npr: number | null;
  amount_usd: number | null;
  sector: string;
  errors: string[];
  duplicate: boolean;
}

export interface ImportPreview {
  rows: ParsedContribution[];
  valid: number;
  invalid: number;
  duplicates: number;
  total_npr: number;
  total_usd: number;
}

type Field = 'sn' | 'date' | 'name' | 'type' | 'mode' | 'npr' | 'usd';

const HEADER_ALIASES: Record<Field, string[]> = {
  sn: ['सि.नं.', 'सि.नं', 'क्र.सं.', 's.n.', 'sn', 'sno', 's.no'],
  date: ['मिति', 'date', 'date_bs'],
  name: [
    'सहयोग गर्ने निकाय / व्यक्ति',
    'सहयोग गर्ने निकाय',
    'contributor',
    'contributor_name',
    'name',
  ],
  type: [
    'institution / personnal (type)',
    'institution / personal (type)',
    'contributor_type',
    'type',
    'प्रकार',
  ],
  mode: ['cheque/non cheque', 'cheque / non cheque', 'payment_mode', 'mode', 'माध्यम'],
  npr: ['सहयोग रकम (रू.)', 'सहयोग रकम (रु.)', 'amount (npr)', 'amount_npr', 'amount npr', 'रकम'],
  usd: ['सहयोग रकम (अमेरिकी डलर)', 'amount (usd)', 'amount_usd', 'amount usd', 'usd'],
};

const FIELDS = Object.keys(HEADER_ALIASES) as Field[];

function normaliseHeader(value: string): string {
  return value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Maps each known field to its column index, or -1 when the sheet omits it. */
export function mapColumns(headers: string[]): Record<Field, number> {
  const map = {} as Record<Field, number>;
  for (const field of FIELDS) {
    map[field] = headers.findIndex((header) =>
      HEADER_ALIASES[field].some((alias) => normaliseHeader(header) === normaliseHeader(alias)),
    );
  }
  return map;
}

/**
 * Works out which column is which by looking at the data, for the days when the
 * Fund Section sends a continuation sheet with no header row at all — just the
 * serial, the date, the name and the amount, often indented several columns in.
 *
 * A column is the date column if most of its cells parse as a BS date, the
 * contributor column if most hold text that is not a date, the amount column if
 * most hold numbers and it carries the largest values, and the serial column if
 * it holds small whole numbers that only ever increase.
 */
export function inferColumns(rows: (string | number | null)[][]): Record<Field, number> {
  const map = { sn: -1, date: -1, name: -1, type: -1, mode: -1, npr: -1, usd: -1 } as Record<
    Field,
    number
  >;
  const width = rows.reduce((w, row) => Math.max(w, row.length), 0);
  const sample = rows.slice(0, 40);
  if (sample.length === 0) return map;

  const columns = Array.from({ length: width }, (_, index) => {
    const cells = sample
      .map((row) => row[index])
      .filter((c) => c != null && String(c).trim() !== '');
    const dates = cells.filter((c) => parseBsLabel(String(c), 2083) !== null).length;
    const numbers = cells
      .map((c) => parseGroupedNumber(String(c)))
      .filter((n): n is number => n != null);
    const texts = cells.filter(
      (c) => parseGroupedNumber(String(c)) == null && parseBsLabel(String(c), 2083) === null,
    );
    const ints = numbers.filter((n) => Number.isInteger(n) && n > 0 && n < 100_000);
    const ascending = ints.length > 2 && ints.every((n, i) => i === 0 || n > ints[i - 1]!);
    return {
      index,
      filled: cells.length,
      dateRatio: cells.length ? dates / cells.length : 0,
      numberRatio: cells.length ? numbers.length / cells.length : 0,
      textRatio: cells.length ? texts.length / cells.length : 0,
      maxValue: numbers.length ? Math.max(...numbers) : 0,
      looksLikeSerial: ascending && ints.length === numbers.length,
      averageTextLength: texts.length
        ? texts.reduce((sum: number, c) => sum + String(c).length, 0) / texts.length
        : 0,
    };
  }).filter((c) => c.filled > 0);

  const best = (candidates: typeof columns, score: (c: (typeof columns)[number]) => number) =>
    candidates.length ? candidates.reduce((a, b) => (score(b) > score(a) ? b : a)) : null;

  const dateColumn = best(
    columns.filter((c) => c.dateRatio > 0.6),
    (c) => c.dateRatio * c.filled,
  );
  if (dateColumn) map.date = dateColumn.index;

  const nameColumn = best(
    columns.filter((c) => c.index !== map.date && c.textRatio > 0.6),
    (c) => c.averageTextLength * c.filled,
  );
  if (nameColumn) map.name = nameColumn.index;

  const amountCandidates = columns.filter(
    (c) =>
      c.index !== map.date && c.index !== map.name && c.numberRatio > 0.6 && !c.looksLikeSerial,
  );
  const amountColumn = best(amountCandidates, (c) => c.maxValue);
  if (amountColumn) map.npr = amountColumn.index;

  const serialColumn = best(
    columns.filter((c) => c.looksLikeSerial && c.index !== map.npr),
    (c) => c.filled,
  );
  if (serialColumn) map.sn = serialColumn.index;

  return map;
}

function readCell(row: (string | number | null)[], index: number): string {
  if (index < 0) return '';
  const value = row[index];
  return value == null ? '' : String(value).trim();
}

/** Turns a sheet of rows into validated contributions. `existing` powers duplicate detection. */
export function parseContributionRows(
  headers: string[],
  dataRows: (string | number | null)[][],
  existing: { name: string; amount: number; date_bs: string }[] = [],
  defaultBsYear = 2083,
): ImportPreview {
  // A sheet sent without a header row has its first line of data where the
  // headers would be, so that line is data too and the columns are worked out
  // from the values instead.
  const headerMap = mapColumns(headers);
  const headerRecognised = headerMap.name >= 0 && headerMap.npr >= 0;
  const allRows = headerRecognised
    ? dataRows
    : [headers as (string | number | null)[], ...dataRows];
  const columns = headerRecognised ? headerMap : inferColumns(allRows);
  const seen = new Set(
    existing.map((row) => `${row.name.trim().toLowerCase()}|${row.amount}|${row.date_bs.trim()}`),
  );

  const rows: ParsedContribution[] = allRows.map((raw, index) => {
    const errors: string[] = [];
    const sn = Number(readCell(raw, columns.sn)) || null;
    const dateLabel = readCell(raw, columns.date);
    const name = readCell(raw, columns.name);
    const typeRaw = readCell(raw, columns.type).toLowerCase();
    const modeRaw = readCell(raw, columns.mode).toLowerCase();
    const npr = parseGroupedNumber(readCell(raw, columns.npr));
    const usd = parseGroupedNumber(readCell(raw, columns.usd));

    if (columns.name < 0) errors.push('the contributor column was not found in the sheet');
    if (!name) errors.push('contributor name is missing');
    if (!dateLabel) errors.push('date is missing');
    if (npr == null && usd == null) errors.push('neither an NPR nor a USD amount was given');
    if (npr != null && npr < 0) errors.push('the NPR amount is negative');
    if (usd != null && usd < 0) errors.push('the USD amount is negative');

    const parsedBs = dateLabel ? parseBsLabel(dateLabel, defaultBsYear) : null;
    if (dateLabel && !parsedBs) errors.push(`the date "${dateLabel}" could not be read`);

    let date_ad: string | null = null;
    if (parsedBs) {
      try {
        date_ad = bsToAd(parsedBs).toISOString().slice(0, 10);
      } catch {
        errors.push(`the date "${dateLabel}" is outside the calendar table`);
      }
    }

    const contributor_type: 'institutional' | 'individual' =
      typeRaw.startsWith('inst') || typeRaw.includes('संस्था') ? 'institutional' : 'individual';
    const payment_mode: 'cheque' | 'bank_transfer' =
      modeRaw.startsWith('cheque') || modeRaw === 'chq' || modeRaw.includes('चेक')
        ? 'cheque'
        : 'bank_transfer';

    const key = `${name.trim().toLowerCase()}|${npr ?? 0}|${dateLabel.trim()}`;
    const duplicate = seen.has(key);
    seen.add(key);

    return {
      row: index + (headerRecognised ? 2 : 1),
      sn,
      date_bs: dateLabel,
      date_ad,
      contributor_name: name,
      contributor_type,
      payment_mode,
      amount_npr: npr,
      amount_usd: usd,
      sector: suggestSector(name, contributor_type),
      errors,
      duplicate,
    };
  });

  const valid = rows.filter((row) => row.errors.length === 0);
  return {
    rows,
    valid: valid.length,
    invalid: rows.length - valid.length,
    duplicates: rows.filter((row) => row.duplicate).length,
    total_npr: valid.reduce((sum, row) => sum + (row.amount_npr ?? 0), 0),
    total_usd: valid.reduce((sum, row) => sum + (row.amount_usd ?? 0), 0),
  };
}

/** Reads an .xlsx workbook — the worksheet named "List", else the first one. */
export async function readWorkbook(
  buffer: Buffer,
): Promise<{ headers: string[]; rows: (string | number | null)[][] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.getWorksheet('List') ?? workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const cellValue = (cell: ExcelJS.Cell): string | number | null => {
    const value = cell.value;
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'object') {
      if ('richText' in value) return value.richText.map((part) => part.text).join('');
      if ('text' in value) return String(value.text);
      if ('result' in value) return (value.result as string | number | null) ?? null;
      return null;
    }
    return value as string | number;
  };

  const allRows: (string | number | null)[][] = [];
  sheet.eachRow((row) => {
    const cells: (string | number | null)[] = [];
    row.eachCell({ includeEmpty: true }, (cell, index) => {
      cells[index - 1] = cellValue(cell);
    });
    allRows.push(cells);
  });

  const [headerRow = [], ...rest] = allRows;
  return {
    headers: headerRow.map((cell) => String(cell ?? '')),
    rows: rest.filter((row) => row.some((cell) => cell != null && String(cell).trim() !== '')),
  };
}

/** Splits one CSV line, honouring quoted fields and doubled quotes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((cell) => cell.trim());
}

/** Reads a CSV export of the same sheet. */
export function readCsv(text: string): { headers: string[]; rows: (string | number | null)[][] } {
  const lines = text
    .replace(/^﻿/, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const [headerLine, ...rest] = lines;
  return { headers: splitCsvLine(headerLine!), rows: rest.map(splitCsvLine) };
}
