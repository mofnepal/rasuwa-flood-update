import { prisma } from './db';

/**
 * Money going out for the disaster, in two stages: transfers out of the Prime
 * Minister Disaster Relief Fund (as the fund status statement records them) and
 * the receiving agency's onward disbursement (as its own report records it).
 * The two are never netted against contributions; they are shown beside them.
 */
export interface DisbursementRow {
  id: string;
  stage: 'fund_transfer' | 'onward';
  date_ad: string;
  date_bs: string;
  payer_ne: string;
  payer_en: string;
  recipient_ne: string;
  recipient_en: string;
  recipient_kind: string;
  recipient_count: number | null;
  amount_npr: number;
  purpose_ne: string;
  purpose_en: string;
  source_ne: string;
  source_en: string;
  as_of: string;
}

export interface DisbursementSummary {
  /** Out of the Fund, as its statement records. */
  transferred_npr: number;
  /** Passed on by the receiving agency, as it reports. */
  onward_npr: number;
  /** Transferred but not yet reported as disbursed onward. */
  held_npr: number;
  by_recipient: { name_ne: string; name_en: string; kind: string; amount_npr: number }[];
  as_of: string | null;
}

export async function getDisbursements(disasterId: string): Promise<DisbursementRow[]> {
  const rows = await prisma.disbursement.findMany({
    where: { disasterId, status: 'published' },
    orderBy: [{ date_ad: 'asc' }, { amount_npr: 'desc' }],
  });
  return rows.map((row) => ({
    id: row.slug,
    stage: row.stage,
    date_ad: row.date_ad.toISOString(),
    date_bs: row.date_bs,
    payer_ne: row.payer_ne,
    payer_en: row.payer_en,
    recipient_ne: row.recipient_ne,
    recipient_en: row.recipient_en,
    recipient_kind: row.recipient_kind,
    recipient_count: row.recipient_count,
    amount_npr: Number(row.amount_npr),
    purpose_ne: row.purpose_ne,
    purpose_en: row.purpose_en,
    source_ne: row.source_ne,
    source_en: row.source_en,
    as_of: row.as_of.toISOString(),
  }));
}

export function summariseDisbursements(rows: DisbursementRow[]): DisbursementSummary {
  const transferred = rows
    .filter((row) => row.stage === 'fund_transfer')
    .reduce((sum, row) => sum + row.amount_npr, 0);
  const onwardRows = rows.filter((row) => row.stage === 'onward');
  const onward = onwardRows.reduce((sum, row) => sum + row.amount_npr, 0);
  const asOf = rows.reduce<string | null>(
    (latest, row) => (!latest || row.as_of > latest ? row.as_of : latest),
    null,
  );
  return {
    transferred_npr: transferred,
    onward_npr: onward,
    held_npr: Math.max(0, transferred - onward),
    by_recipient: onwardRows
      .map((row) => ({
        name_ne: row.recipient_ne,
        name_en: row.recipient_en,
        kind: row.recipient_kind,
        amount_npr: row.amount_npr,
      }))
      .sort((a, b) => b.amount_npr - a.amount_npr),
    as_of: asOf,
  };
}
