import 'server-only';
import { revalidateTag, revalidatePath } from 'next/cache';
import type { Prisma, RecordStatus } from '@prisma/client';
import { prisma } from './db';
import { auditSnapshot, writeAudit } from './audit';
import { can, type CurrentUser } from './permissions';

/**
 * The one place a record changes status.
 *
 *   entry     creates and edits drafts
 *   verifier  moves draft → verified, or sends it back with a comment
 *   publisher moves verified → published, and published → archived or back
 *   admin     may do any of the above
 *
 * Nothing reaches a public page except `published`, and every transition is
 * written to the audit log with the record before and after.
 */

export type Entity =
  | 'contribution'
  | 'foreignAssistance'
  | 'channelSnapshot'
  | 'fundStatusSnapshot'
  | 'rescueReport'
  | 'decision';

export const ENTITY_LABELS: Record<Entity, { ne: string; en: string }> = {
  contribution: { ne: 'हस्तान्तरण', en: 'Handovers' },
  foreignAssistance: { ne: 'वैदेशिक सहयोग', en: 'Foreign assistance' },
  channelSnapshot: { ne: 'च्यानल विवरण', en: 'Channel snapshots' },
  fundStatusSnapshot: { ne: 'कोष स्थिति', en: 'Fund status' },
  rescueReport: { ne: 'उद्धार प्रतिवेदन', en: 'Rescue reports' },
  decision: { ne: 'सरकारका पहल', en: 'Government initiatives' },
};

export type Transition = 'verify' | 'send_back' | 'publish' | 'unpublish' | 'archive';

/** Which status a transition may be applied from, and what it produces. */
const TRANSITIONS: Record<
  Transition,
  { from: RecordStatus[]; to: RecordStatus; role: 'verifier' | 'publisher' }
> = {
  verify: { from: ['draft'], to: 'verified', role: 'verifier' },
  send_back: { from: ['verified', 'published'], to: 'draft', role: 'verifier' },
  publish: { from: ['verified', 'archived'], to: 'published', role: 'publisher' },
  unpublish: { from: ['published'], to: 'verified', role: 'publisher' },
  archive: { from: ['draft', 'verified', 'published'], to: 'archived', role: 'publisher' },
};

export interface TransitionResult {
  ok: boolean;
  message?: string;
  changed?: number;
}

/** Prisma delegates, keyed by entity, so one function serves every record type. */
function delegate(entity: Entity) {
  return {
    contribution: prisma.contribution,
    foreignAssistance: prisma.foreignAssistance,
    channelSnapshot: prisma.channelSnapshot,
    fundStatusSnapshot: prisma.fundStatusSnapshot,
    rescueReport: prisma.rescueReport,
    decision: prisma.decision,
  }[entity];
}

export async function applyTransition(
  user: CurrentUser,
  entity: Entity,
  ids: string[],
  transition: Transition,
  note?: string,
): Promise<TransitionResult> {
  const rule = TRANSITIONS[transition];
  if (!can(user.role, rule.role)) {
    return { ok: false, message: 'not permitted for this role' };
  }
  if (ids.length === 0) return { ok: false, message: 'nothing selected' };

  const model = delegate(entity);
  let changed = 0;

  for (const id of ids) {
    // @ts-expect-error — the delegates share this shape but not a common type.
    const before = await model.findUnique({ where: { id } });
    if (!before) continue;
    if (!rule.from.includes(before.status as RecordStatus)) continue;

    const data: Record<string, unknown> = { status: rule.to, reviewNote: note ?? null };
    if (transition === 'verify') {
      data.verifiedById = user.id;
      data.verifiedAt = new Date();
    }
    if (transition === 'publish') {
      data.publishedById = user.id;
      data.publishedAt = new Date();
    }
    if (transition === 'send_back') {
      data.verifiedById = null;
      data.verifiedAt = null;
      data.publishedById = null;
      data.publishedAt = null;
    }
    if (transition === 'unpublish') {
      data.publishedById = null;
      data.publishedAt = null;
    }

    // @ts-expect-error — see above.
    const after = await model.update({ where: { id }, data });
    changed += 1;

    await writeAudit({
      userId: user.id,
      action: transition,
      entity,
      entityId: id,
      before: auditSnapshot(before as Record<string, unknown>),
      after: auditSnapshot(after as Record<string, unknown>),
    });
  }

  // A measure follows the status of the decision it belongs to.
  if (entity === 'decision' && changed > 0) {
    await prisma.measure.updateMany({
      where: { decisionId: { in: ids } },
      data: { status: rule.to },
    });
  }

  await refreshPublicTotals();
  return { ok: true, changed };
}

/** Drops the cached totals and re-renders the public pages. */
export async function refreshPublicTotals(): Promise<void> {
  revalidateTag('totals');
  for (const locale of ['ne', 'en']) {
    for (const path of ['', '/contributions', '/foreign', '/rescue', '/initiatives', '/contact']) {
      revalidatePath(`/${locale}${path}`);
    }
  }
}

export interface StatusCounts {
  draft: number;
  verified: number;
  published: number;
  archived: number;
}

export async function statusCounts(entity: Entity, disasterId: string): Promise<StatusCounts> {
  const model = delegate(entity);
  // @ts-expect-error — the delegates share this shape but not a common type.
  const grouped: { status: RecordStatus; _count: number }[] = await model.groupBy({
    by: ['status'],
    where: { disasterId },
    _count: true,
  });
  const counts: StatusCounts = { draft: 0, verified: 0, published: 0, archived: 0 };
  for (const row of grouped) counts[row.status] = row._count;
  return counts;
}

export type UpdatableRecord = Prisma.ContributionUpdateInput;
