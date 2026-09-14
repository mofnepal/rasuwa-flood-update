import { z } from 'zod';
import { BS_MONTHS_EN, BS_MONTHS_NE, BS_MONTH_DAYS, bsToAd } from './bs';
import type { Locale } from './format';

/**
 * A government action plan — a numbered list of actions, each with the body the
 * plan makes responsible and the deadline it sets. The first is the Ministry of
 * Finance's Capital Market Strengthening and Revival Action Plan, 2083; the same
 * shape takes any later plan, so the dashboard needs no change to show one.
 *
 * `ActionPlan.data` is validated against this schema before it is saved.
 */

const deadlineSchema = z.object({
  /// `immediate` is the document's "तत्काल", `prompt` its "यथाशीघ्र", `month_end`
  /// its "<month> मसान्तभित्र"; `none` where the action carries no date.
  kind: z.enum(['immediate', 'prompt', 'month_end', 'none']),
  bs_year: z.number().int().optional(),
  /// 1–12
  bs_month: z.number().int().min(1).max(12).optional(),
  note_ne: z.string().optional(),
  note_en: z.string().optional(),
});

const subItemSchema = z.object({
  label: z.string(),
  text_ne: z.string(),
  text_en: z.string(),
  deadline: deadlineSchema.optional(),
});

export const actionSchema = z.object({
  no: z.number().int().positive(),
  theme: z.string(),
  agencies: z.array(z.string()).min(1),
  title_ne: z.string(),
  title_en: z.string(),
  detail_ne: z.string(),
  detail_en: z.string(),
  deadline: deadlineSchema,
  sub_items: z.array(subItemSchema).optional(),
  /// What the ministry reports about the action; every action starts `planned`.
  status: z.enum(['planned', 'in_progress', 'done']).optional(),
});

export const actionPlanSchema = z.object({
  short_ne: z.string(),
  short_en: z.string(),
  context_ne: z.string(),
  context_en: z.string(),
  themes: z.array(z.object({ code: z.string(), name_ne: z.string(), name_en: z.string() })),
  agencies: z.array(
    z.object({
      code: z.string(),
      name_ne: z.string(),
      name_en: z.string(),
      short_ne: z.string(),
      short_en: z.string(),
    }),
  ),
  actions: z.array(actionSchema).min(1),
  /// How the wording was taken from the document, where that needs saying.
  note_ne: z.string().optional(),
  note_en: z.string().optional(),
});

export type PlanDeadline = z.infer<typeof deadlineSchema>;
export type PlanAction = z.infer<typeof actionSchema>;
export type ActionPlanData = z.infer<typeof actionPlanSchema>;

/** The order deadlines are laid out in: at once, then month by month, then undated. */
export type DeadlineBucket =
  | { kind: 'immediate' | 'prompt' | 'none'; key: string; order: number }
  | { kind: 'month_end'; key: string; order: number; bs_year: number; bs_month: number };

export function deadlineBucket(deadline: PlanDeadline): DeadlineBucket {
  switch (deadline.kind) {
    case 'immediate':
      return { kind: 'immediate', key: 'immediate', order: 0 };
    case 'prompt':
      return { kind: 'prompt', key: 'prompt', order: 1 };
    case 'month_end': {
      const year = deadline.bs_year!;
      const month = deadline.bs_month!;
      return {
        kind: 'month_end',
        key: `${year}-${String(month).padStart(2, '0')}`,
        // 2083/06 sorts before 2083/07 and both before 2084/01.
        order: 100 + year * 12 + month,
        bs_year: year,
        bs_month: month,
      };
    }
    default:
      return { kind: 'none', key: 'none', order: 10_000 };
  }
}

/** The last day of a BS month, as an AD date at UTC midnight. */
export function bsMonthEnd(year: number, month: number): Date {
  const days = BS_MONTH_DAYS[year]?.[month - 1];
  if (!days) throw new RangeError(`BS ${year}/${month} is outside the calendar table`);
  return bsToAd({ year, month, day: days });
}

/** "असोज मसान्त" / "End of Asoj" — the deadline as the document words it. */
export function deadlineLabel(deadline: PlanDeadline, locale: Locale): string {
  const ne = locale === 'ne';
  switch (deadline.kind) {
    case 'immediate':
      return ne ? 'तत्काल' : 'Immediately';
    case 'prompt':
      return ne ? 'यथाशीघ्र' : 'Promptly';
    case 'month_end': {
      const month = deadline.bs_month!;
      const name = ne ? BS_MONTHS_NE[month - 1] : BS_MONTHS_EN[month - 1];
      return ne ? `${name} मसान्त` : `End of ${name}`;
    }
    default:
      return ne ? 'मिति नतोकिएको' : 'No date set';
  }
}

/** The AD date a `month_end` deadline falls on; null for the other kinds. */
export function deadlineDate(deadline: PlanDeadline): Date | null {
  return deadline.kind === 'month_end' ? bsMonthEnd(deadline.bs_year!, deadline.bs_month!) : null;
}

export function themeName(plan: ActionPlanData, code: string, locale: Locale): string {
  const theme = plan.themes.find((entry) => entry.code === code);
  return theme ? (locale === 'ne' ? theme.name_ne : theme.name_en) : code;
}

export function agencyName(
  plan: ActionPlanData,
  code: string,
  locale: Locale,
  short = false,
): string {
  const agency = plan.agencies.find((entry) => entry.code === code);
  if (!agency) return code;
  if (short) return locale === 'ne' ? agency.short_ne : agency.short_en;
  return locale === 'ne' ? agency.name_ne : agency.name_en;
}

/** Actions per deadline bucket, in deadline order; every bucket carries its actions. */
export function actionsByDeadline(plan: ActionPlanData) {
  const buckets = new Map<string, { bucket: DeadlineBucket; actions: PlanAction[] }>();
  for (const action of plan.actions) {
    const bucket = deadlineBucket(action.deadline);
    const entry = buckets.get(bucket.key) ?? { bucket, actions: [] };
    entry.actions.push(action);
    buckets.set(bucket.key, entry);
  }
  return [...buckets.values()].sort((a, b) => a.bucket.order - b.bucket.order);
}

/** Actions per responsible body — an action with two bodies counts once for each. */
export function actionsByAgency(plan: ActionPlanData) {
  return plan.agencies
    .map((agency) => ({
      agency,
      actions: plan.actions.filter((action) => action.agencies.includes(agency.code)),
    }))
    .filter((entry) => entry.actions.length > 0)
    .sort((a, b) => b.actions.length - a.actions.length);
}

export function actionsByTheme(plan: ActionPlanData) {
  return plan.themes
    .map((theme) => ({
      theme,
      actions: plan.actions.filter((action) => action.theme === theme.code),
    }))
    .filter((entry) => entry.actions.length > 0)
    .sort((a, b) => b.actions.length - a.actions.length);
}

/** The nearest dated deadline still ahead of `now`, or the last one if all have passed. */
export function nextDeadline(plan: ActionPlanData, now = new Date()) {
  const dated = actionsByDeadline(plan).filter(
    (
      entry,
    ): entry is { bucket: Extract<DeadlineBucket, { kind: 'month_end' }>; actions: PlanAction[] } =>
      entry.bucket.kind === 'month_end',
  );
  if (dated.length === 0) return null;
  const upcoming = dated.find(
    (entry) => bsMonthEnd(entry.bucket.bs_year, entry.bucket.bs_month).getTime() >= now.getTime(),
  );
  return upcoming ?? dated[dated.length - 1]!;
}
