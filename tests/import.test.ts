import { describe, expect, it } from 'vitest';
import { channelCodeFor, parseChannelTable } from '@/lib/import/channels';
import {
  mapColumns,
  parseContributionRows,
  readCsv,
  splitCsvLine,
} from '@/lib/import/contributions';

describe('splitCsvLine', () => {
  it('honours quoted fields and doubled quotes', () => {
    expect(splitCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
    expect(splitCsvLine('"Kumari Bank, Limited",30000000')).toEqual([
      'Kumari Bank, Limited',
      '30000000',
    ]);
    expect(splitCsvLine('"He said ""yes""",1')).toEqual(['He said "yes"', '1']);
  });
});

describe('mapColumns', () => {
  it("finds the ministry sheet's own headers, in any order", () => {
    const headers = [
      'सि.नं.',
      'मिति',
      'सहयोग गर्ने निकाय / व्यक्ति',
      'Institution / Personnal (Type)',
      'Cheque/Non Cheque',
      'सहयोग रकम (रू.)',
      'सहयोग रकम (अमेरिकी डलर)',
    ];
    expect(mapColumns(headers)).toEqual({
      sn: 0,
      date: 1,
      name: 2,
      type: 3,
      mode: 4,
      npr: 5,
      usd: 6,
    });

    const shuffled = ['सहयोग रकम (रू.)', 'मिति', 'सहयोग गर्ने निकाय / व्यक्ति'];
    const map = mapColumns(shuffled);
    expect(map.npr).toBe(0);
    expect(map.name).toBe(2);
    expect(map.usd).toBe(-1);
  });
});

describe('parseContributionRows', () => {
  const headers = [
    'सि.नं.',
    'मिति',
    'सहयोग गर्ने निकाय / व्यक्ति',
    'Institution / Personnal (Type)',
    'Cheque/Non Cheque',
    'सहयोग रकम (रू.)',
    'सहयोग रकम (अमेरिकी डलर)',
  ];

  it('reads a clean row and converts its BS date', () => {
    const preview = parseContributionRows(headers, [
      ['1', 'भदौ ११', 'Kumari Bank Limited', 'Institution', 'Non Cheque', '3,00,00,000', ''],
    ]);
    const row = preview.rows[0]!;
    expect(row.errors).toEqual([]);
    expect(row.contributor_name).toBe('Kumari Bank Limited');
    expect(row.contributor_type).toBe('institutional');
    expect(row.payment_mode).toBe('bank_transfer');
    expect(row.amount_npr).toBe(30000000);
    expect(row.date_ad).toBe('2026-08-27');
    expect(row.sector).toBe('bank');
    expect(preview.valid).toBe(1);
    expect(preview.total_npr).toBe(30000000);
  });

  it('reads a cheque from an individual, and a USD amount', () => {
    const preview = parseContributionRows(headers, [
      ['2', 'भदौ १४', 'Embassy of China', 'Institution', 'Cheque', '', '200000'],
      ['3', 'भदौ १५', 'Sita Sharma', 'Personnal', 'Cheque', '50,000', ''],
    ]);
    expect(preview.rows[0]!.payment_mode).toBe('cheque');
    expect(preview.rows[0]!.amount_usd).toBe(200000);
    expect(preview.rows[0]!.sector).toBe('embassy');
    expect(preview.rows[1]!.contributor_type).toBe('individual');
    expect(preview.rows[1]!.sector).toBe('individual');
  });

  it('reports every problem on the row rather than throwing', () => {
    const preview = parseContributionRows(headers, [
      ['4', '', '', 'Institution', 'Cheque', '', ''],
      ['5', 'not a date', 'Some Trust', 'Institution', 'Cheque', '1000', ''],
      ['6', 'भदौ १५', 'Negative Ltd', 'Institution', 'Cheque', '-500', ''],
    ]);
    expect(preview.rows[0]!.errors).toContain('contributor name is missing');
    expect(preview.rows[0]!.errors).toContain('date is missing');
    expect(preview.rows[1]!.errors.some((e) => e.includes('could not be read'))).toBe(true);
    expect(preview.rows[2]!.errors).toContain('the NPR amount is negative');
    expect(preview.valid).toBe(0);
    expect(preview.invalid).toBe(3);
  });

  it('flags a row that repeats one already in the database', () => {
    const preview = parseContributionRows(
      headers,
      [['1', 'भदौ ११', 'Kumari Bank Limited', 'Institution', 'Non Cheque', '30000000', '']],
      [{ name: 'Kumari Bank Limited', amount: 30000000, date_bs: 'भदौ ११' }],
    );
    expect(preview.rows[0]!.duplicate).toBe(true);
    expect(preview.duplicates).toBe(1);
  });

  it('flags a row that repeats another row in the same file', () => {
    const row = ['1', 'भदौ ११', 'Same Ltd', 'Institution', 'Cheque', '1000', ''];
    const preview = parseContributionRows(headers, [row, [...row]]);
    expect(preview.rows[0]!.duplicate).toBe(false);
    expect(preview.rows[1]!.duplicate).toBe(true);
  });

  it('reads a CSV export of the same sheet', () => {
    const { headers: h, rows } = readCsv(
      '﻿सि.नं.,मिति,सहयोग गर्ने निकाय / व्यक्ति,Institution / Personnal (Type),Cheque/Non Cheque,सहयोग रकम (रू.),सहयोग रकम (अमेरिकी डलर)\n1,भदौ ११,"Gorkha Brewery",Institution,Non Cheque,100000000,\n',
    );
    const preview = parseContributionRows(h, rows);
    expect(preview.valid).toBe(1);
    expect(preview.rows[0]!.amount_npr).toBe(100000000);
    expect(preview.rows[0]!.sector).toBe('industry');
  });
});

describe('channelCodeFor', () => {
  it('recognises the channels both networks publish', () => {
    expect(channelCodeFor('IPS/Cheque Transfer')).toBe('ips_cheque');
    expect(channelCodeFor('Card – International')).toBe('card_intl');
    expect(channelCodeFor('Card – Domestic')).toBe('card_domestic');
    expect(channelCodeFor('Domestic QR')).toBe('domestic_qr');
    expect(channelCodeFor("Int'l QR")).toBe('intl_qr');
    expect(channelCodeFor('Remittance')).toBe('remittance');
    expect(channelCodeFor('Fonepay Bills')).toBe('fonepay_bills');
    expect(channelCodeFor('NPCI (India)')).toBe('npci');
    expect(channelCodeFor('Alipay')).toBe('alipay');
    expect(channelCodeFor('IBFT')).toBe('ibft');
  });

  it('falls back to a slug for a channel it has not seen', () => {
    expect(channelCodeFor('New Wallet Scheme')).toBe('new_wallet_scheme');
  });
});

describe('parseChannelTable', () => {
  it('reads a pasted NCHL table with Indian grouping', () => {
    const preview = parseChannelTable(
      [
        'Channel\tTransactions\tAmount',
        'IPS/Cheque Transfer\t1,225\t1,69,89,07,769.22',
        'Card – International\t96,899\t1,49,00,69,985.09',
        'Total\t98,124\t3,18,89,77,754.31',
      ].join('\n'),
    );
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]!.channel_code).toBe('ips_cheque');
    expect(preview.rows[0]!.txn_count).toBe(1225);
    expect(preview.rows[0]!.amount_npr).toBeCloseTo(1698907769.22, 2);
    expect(preview.rows[1]!.amount_npr).toBeCloseTo(1490069985.09, 2);
    expect(preview.valid).toBe(2);
    expect(preview.total_txns).toBe(98124);
  });

  it('skips the total row so it is never imported as a channel', () => {
    const preview = parseChannelTable('Domestic QR\t100\t5000\nजम्मा\t100\t5000');
    expect(preview.rows).toHaveLength(1);
    expect(preview.total_npr).toBe(5000);
  });

  it('reads Devanagari digits and pipe separators', () => {
    const preview = parseChannelTable('घरेलु QR | ८,२२,९४६ | २,१३,७८,७२,२१८');
    expect(preview.rows[0]!.txn_count).toBe(822946);
    expect(preview.rows[0]!.amount_npr).toBe(2137872218);
  });

  it('flags a line with an amount but no count', () => {
    const preview = parseChannelTable('Alipay\t19,025,058');
    expect(preview.rows[0]!.errors).toContain('no transaction count on this line');
    expect(preview.invalid).toBe(1);
  });

  it('ignores a header row that carries no numbers', () => {
    const preview = parseChannelTable('Channel\tTransactions\tAmount');
    expect(preview.rows).toHaveLength(0);
  });
});
