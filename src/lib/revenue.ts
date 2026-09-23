import { prisma } from './db';
import { bsToAd } from './bs';

/**
 * Revenue target and collection as a revenue department publishes it — the
 * Department of Customs to begin with. Every figure is as printed. The two
 * derived figures, the share of the target collected and the share of the fiscal
 * year elapsed, are computed here and labelled as the portal's own on the page.
 */
export interface RevenueOffice {
  name_ne: string;
  name_en: string;
  state: string;
  note_ne?: string;
  note_en?: string;
}

export interface RevenueView {
  department: string;
  fiscal_year_bs: string;
  fiscal_year_en: string;
  as_of: string;
  as_of_bs: string;
  as_of_en: string;
  target_npr: number;
  collected_npr: number;
  /** As the department prints it, even where it is not target − collected. */
  remaining_npr: number;
  remaining_note_ne: string | null;
  remaining_note_en: string | null;
  date_note_ne: string | null;
  date_note_en: string | null;
  offices: RevenueOffice[];
  narrative_ne: string | null;
  narrative_en: string | null;
  source_ne: string;
  source_en: string;
  /** collected ÷ target, 0–1. */
  share_of_target: number;
  fiscal_year: {
    /** Days in the fiscal year, Shrawan 1 to the next Shrawan 1. */
    days: number;
    /** Days from Shrawan 1 to the statement's date, inclusive. */
    elapsed_days: number;
    /** elapsed_days ÷ days, 0–1. */
    elapsed_share: number;
  };
}

const MS_PER_DAY = 86_400_000;

/** "2083/84" → the fiscal year's span in days and the days elapsed to `asOf`. */
export function fiscalYearProgress(fiscalYearEn: string, asOf: Date) {
  const startYear = Number(fiscalYearEn.slice(0, 4));
  const start = bsToAd({ year: startYear, month: 4, day: 1 }).getTime();
  const end = bsToAd({ year: startYear + 1, month: 4, day: 1 }).getTime();
  const days = Math.round((end - start) / MS_PER_DAY);
  // The statement is dated at Nepal midnight; shift it into the UTC calendar day.
  const shifted = new Date(asOf.getTime() + 6 * 3_600_000);
  const day = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  const elapsed = Math.min(days, Math.max(0, Math.round((day - start) / MS_PER_DAY) + 1));
  return { days, elapsed_days: elapsed, elapsed_share: days ? elapsed / days : 0 };
}

export async function getLatestRevenue(
  disasterId: string,
  department = 'customs',
): Promise<RevenueView | null> {
  const row = await prisma.revenueSnapshot.findFirst({
    where: { disasterId, department, status: 'published' },
    orderBy: { as_of: 'desc' },
  });
  if (!row) return null;
  const target = Number(row.target_npr);
  const collected = Number(row.collected_npr);
  return {
    department: row.department,
    fiscal_year_bs: row.fiscal_year_bs,
    fiscal_year_en: row.fiscal_year_en,
    as_of: row.as_of.toISOString(),
    as_of_bs: row.as_of_bs,
    as_of_en: row.as_of_en,
    target_npr: target,
    collected_npr: collected,
    remaining_npr: Number(row.remaining_npr),
    remaining_note_ne: row.remaining_note_ne,
    remaining_note_en: row.remaining_note_en,
    date_note_ne: row.date_note_ne,
    date_note_en: row.date_note_en,
    offices: (row.offices as RevenueOffice[] | null) ?? [],
    narrative_ne: row.narrative_ne,
    narrative_en: row.narrative_en,
    source_ne: row.source_ne,
    source_en: row.source_en,
    share_of_target: target ? collected / target : 0,
    fiscal_year: fiscalYearProgress(row.fiscal_year_en, row.as_of),
  };
}
