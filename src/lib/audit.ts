import 'server-only';
import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';

/**
 * Every admin mutation writes one of these, with the record before and after.
 * Public pages never show who acted — only that a record was verified and when.
 */
export async function writeAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headerList.get('x-real-ip') ?? null;

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: (params.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (params.after ?? undefined) as Prisma.InputJsonValue | undefined,
      ip,
    },
  });
}

/** Decimal and Date values are not JSON — flatten a record for the audit log. */
export function auditSnapshot<T extends Record<string, unknown>>(
  record: T | null,
): Prisma.InputJsonValue | undefined {
  if (!record) return undefined;
  return JSON.parse(
    JSON.stringify(record, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
  ) as Prisma.InputJsonValue;
}
