import 'server-only';
import { parseGroupedNumber } from '@/lib/format';

/**
 * Reads the daily NCHL / Fonepay tables. An officer can paste the table straight
 * out of the network's own report — the numbers arrive Indian-grouped
 * ("2,11,76,39,003"), Western-grouped, or in Devanagari, and all three are read.
 *
 * A line is: label, transaction count, amount — in any order of the two numbers
 * as long as the count precedes the amount, which is how both networks print it.
 * Columns may be separated by tabs, two or more spaces, or a pipe.
 */

export interface ParsedChannelLine {
  line: number;
  channel_code: string;
  label: string;
  txn_count: number | null;
  amount_npr: number | null;
  errors: string[];
}

export interface ChannelPreview {
  rows: ParsedChannelLine[];
  valid: number;
  invalid: number;
  total_npr: number;
  total_txns: number;
}

/** Known channel labels, so a pasted table lines up with what is already stored. */
const CHANNEL_CODES: [RegExp, string][] = [
  [/ips\s*\/?\s*cheque|ips/i, 'ips_cheque'],
  [/card.*(international|int'?l|अन्तर्राष्ट्रिय)/i, 'card_intl'],
  [/card.*domestic/i, 'card_domestic'],
  [/online\s*transfer/i, 'online_transfer'],
  [/(domestic|घरेलु).*qr/i, 'domestic_qr'],
  // Both networks print this as "Int'l QR" on some days and "International QR" on others.
  [/(international|int'?l|अन्तर्राष्ट्रिय).*qr/i, 'intl_qr'],
  [/remit/i, 'remittance'],
  [/fonepay\s*bills?|बिल्स/i, 'fonepay_bills'],
  [/npci/i, 'npci'],
  [/alipay/i, 'alipay'],
  [/ibft/i, 'ibft'],
];

export function channelCodeFor(label: string): string {
  for (const [pattern, code] of CHANNEL_CODES) {
    if (pattern.test(label)) return code;
  }
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'other'
  );
}

/** A row that is a total rather than a channel — skipped, not imported. */
function isTotalRow(label: string): boolean {
  // \b is defined on ASCII word characters, so it cannot follow a Devanagari word —
  // match the whole label or a following separator instead.
  return /^(grand\s*total|total|कुल\s*जम्मा|कुल|जम्मा|योग)(\s|:|$)/i.test(label.trim());
}

export function parseChannelTable(text: string): ChannelPreview {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: ParsedChannelLine[] = [];

  lines.forEach((line, index) => {
    const cells = line
      .split(/\t|\s\s+|\s*\|\s*/)
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (cells.length < 2) return;

    const label = cells[0]!;
    if (isTotalRow(label)) return;
    // A header row carries no numbers at all.
    const numbers = cells.slice(1).map(parseGroupedNumber);
    if (numbers.every((value) => value == null)) return;

    const present = numbers.filter((value): value is number => value != null);
    const errors: string[] = [];
    let txn_count: number | null = null;
    let amount_npr: number | null = null;

    if (present.length >= 2) {
      [txn_count, amount_npr] = [present[0]!, present[1]!];
    } else if (present.length === 1) {
      amount_npr = present[0]!;
      errors.push('no transaction count on this line');
    }

    if (amount_npr == null) errors.push('no amount could be read');
    if (txn_count != null && !Number.isInteger(txn_count)) {
      errors.push('the transaction count is not a whole number');
    }
    if (amount_npr != null && amount_npr < 0) errors.push('the amount is negative');

    rows.push({
      line: index + 1,
      channel_code: channelCodeFor(label),
      label,
      txn_count,
      amount_npr,
      errors,
    });
  });

  const valid = rows.filter((row) => row.errors.length === 0);
  return {
    rows,
    valid: valid.length,
    invalid: rows.length - valid.length,
    total_npr: valid.reduce((sum, row) => sum + (row.amount_npr ?? 0), 0),
    total_txns: valid.reduce((sum, row) => sum + (row.txn_count ?? 0), 0),
  };
}
