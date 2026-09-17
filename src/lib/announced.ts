import { prisma } from './db';

/**
 * Domestic support announced for the flood — salary contributions, party and
 * provincial pledges, government cash to districts — as the Office of the Prime
 * Minister lists it. Listed on the contributions page beside the handover register
 * and never added to a total: a pledge counts only once it appears in the Fund's
 * own records, and an entry already there, or already shown as a disbursement,
 * says so through its `state`.
 */
export type AnnouncedState = 'pledged' | 'in_register' | 'disbursed';

export interface AnnouncedRow {
  id: string;
  contributor_ne: string;
  contributor_en: string;
  contributor_kind: string;
  amount_npr: number | null;
  amount_text_ne: string;
  amount_text_en: string;
  approximate: boolean;
  announced_on: string | null;
  announced_bs: string | null;
  state: AnnouncedState;
  register_ref: string | null;
  note_ne: string | null;
  note_en: string | null;
  source_ne: string;
  source_en: string;
  source_url: string | null;
  as_of: string;
}

export interface AnnouncedSummary {
  entries: number;
  /** Pledges with a rupee figure, summed — never part of any total. */
  pledged_npr: number;
  pledged_count: number;
  pledged_without_figure: number;
  /** Already in the handover register, so already counted there. */
  in_register_npr: number;
  in_register_count: number;
  /** Money out of the Fund, shown under fund usage. */
  disbursed_npr: number;
  as_of: string | null;
}

export async function getAnnouncedSupport(disasterId: string): Promise<AnnouncedRow[]> {
  const rows = await prisma.announcedSupport.findMany({
    where: { disasterId, status: 'published' },
    orderBy: [{ amount_npr: { sort: 'desc', nulls: 'last' } }, { slug: 'asc' }],
  });
  return rows.map((row) => ({
    id: row.slug,
    contributor_ne: row.contributor_ne,
    contributor_en: row.contributor_en,
    contributor_kind: row.contributor_kind,
    amount_npr: row.amount_npr == null ? null : Number(row.amount_npr),
    amount_text_ne: row.amount_text_ne,
    amount_text_en: row.amount_text_en,
    approximate: row.approximate,
    announced_on: row.announced_on?.toISOString() ?? null,
    announced_bs: row.announced_bs,
    state: row.state as AnnouncedState,
    register_ref: row.register_ref,
    note_ne: row.note_ne,
    note_en: row.note_en,
    source_ne: row.source_ne,
    source_en: row.source_en,
    source_url: row.source_url,
    as_of: row.as_of.toISOString(),
  }));
}

export function summariseAnnounced(rows: AnnouncedRow[]): AnnouncedSummary {
  const pledged = rows.filter((row) => row.state === 'pledged');
  const inRegister = rows.filter((row) => row.state === 'in_register');
  const disbursed = rows.filter((row) => row.state === 'disbursed');
  const sum = (list: AnnouncedRow[]) =>
    list.reduce((total, row) => total + (row.amount_npr ?? 0), 0);
  return {
    entries: rows.length,
    pledged_npr: sum(pledged),
    pledged_count: pledged.length,
    pledged_without_figure: pledged.filter((row) => row.amount_npr == null).length,
    in_register_npr: sum(inRegister),
    in_register_count: inRegister.length,
    disbursed_npr: sum(disbursed),
    as_of: rows.reduce<string | null>(
      (latest, row) => (!latest || row.as_of > latest ? row.as_of : latest),
      null,
    ),
  };
}
