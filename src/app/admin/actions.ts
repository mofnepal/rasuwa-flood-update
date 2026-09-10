'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { writeAudit } from '@/lib/audit';
import { applyTransition, refreshPublicTotals, type Entity, type Transition } from '@/lib/workflow';
import { SETTING_KEYS } from '@/lib/constants';

export type ActionState = { status: 'idle' | 'ok' | 'error'; message?: string };

/** Verify, send back, publish, unpublish or archive the selected records. */
export async function transitionRecords(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const entity = String(formData.get('entity') ?? '') as Entity;
  const transition = String(formData.get('transition') ?? '') as Transition;
  const note = String(formData.get('note') ?? '').trim() || undefined;
  const ids = formData.getAll('id').map(String).filter(Boolean);

  const minimum = transition === 'verify' || transition === 'send_back' ? 'verifier' : 'publisher';
  const user = await requireRole(minimum);

  const result = await applyTransition(user, entity, ids, transition, note);
  revalidatePath('/admin/queue');
  revalidatePath('/admin');

  if (!result.ok) return { status: 'error', message: result.message };
  return {
    status: 'ok',
    message: `${result.changed ?? 0} अभिलेख अद्यावधिक · ${result.changed ?? 0} record(s) updated`,
  };
}

/** Recomputes the cached public totals immediately. */
export async function regenerateTotals(): Promise<ActionState> {
  const user = await requireRole('publisher');
  await refreshPublicTotals();
  await prisma.setting.upsert({
    where: { key: SETTING_KEYS.lastPublicUpdate },
    update: { value: { at: new Date().toISOString() } },
    create: { key: SETTING_KEYS.lastPublicUpdate, value: { at: new Date().toISOString() } },
  });
  await writeAudit({
    userId: user.id,
    action: 'regenerate_totals',
    entity: 'Setting',
    entityId: SETTING_KEYS.lastPublicUpdate,
  });
  revalidatePath('/admin');
  return { status: 'ok', message: 'सार्वजनिक अङ्क पुनः गणना भयो · public totals regenerated' };
}

/** Changes one contribution's sector; the auto-suggestion is only a suggestion. */
export async function updateSector(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('entry');
  const id = String(formData.get('id') ?? '');
  const sector = String(formData.get('sector') ?? '');
  if (!id || !sector) return { status: 'error', message: 'missing id or sector' };

  const before = await prisma.contribution.findUnique({ where: { id } });
  if (!before) return { status: 'error', message: 'record not found' };

  const after = await prisma.contribution.update({ where: { id }, data: { sector } });
  await writeAudit({
    userId: user.id,
    action: 'update_sector',
    entity: 'contribution',
    entityId: id,
    before: { sector: before.sector },
    after: { sector: after.sector },
  });
  await refreshPublicTotals();
  revalidatePath('/admin/queue');
  return { status: 'ok', message: 'क्षेत्र अद्यावधिक · sector updated' };
}

/** Sets the exchange rate used to state foreign assistance in rupees. */
export async function updateFxRate(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('admin');
  const rate = Number(formData.get('rate'));
  if (!Number.isFinite(rate) || rate <= 0) {
    return { status: 'error', message: 'दर मान्य छैन · the rate is not valid' };
  }

  const before = await prisma.setting.findUnique({ where: { key: SETTING_KEYS.fxUsdNpr } });
  const value = {
    rate,
    source_ne: String(formData.get('source_ne') ?? ''),
    source_en: String(formData.get('source_en') ?? ''),
  };
  await prisma.setting.upsert({
    where: { key: SETTING_KEYS.fxUsdNpr },
    update: { value },
    create: { key: SETTING_KEYS.fxUsdNpr, value },
  });
  await writeAudit({
    userId: user.id,
    action: 'update_fx_rate',
    entity: 'Setting',
    entityId: SETTING_KEYS.fxUsdNpr,
    before: before?.value,
    after: value,
  });
  await refreshPublicTotals();
  revalidatePath('/admin/settings');
  return { status: 'ok', message: 'विनिमय दर अद्यावधिक · exchange rate updated' };
}

/** Pins one foreign contribution as the featured card. */
export async function setFeatured(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole('publisher');
  const id = String(formData.get('id') ?? '');
  const record = await prisma.foreignAssistance.findUnique({ where: { id } });
  if (!record) return { status: 'error', message: 'record not found' };

  await prisma.foreignAssistance.updateMany({
    where: { disasterId: record.disasterId },
    data: { featured: false },
  });
  await prisma.foreignAssistance.update({ where: { id }, data: { featured: true } });
  await writeAudit({
    userId: user.id,
    action: 'set_featured',
    entity: 'foreignAssistance',
    entityId: id,
    after: { featured: true },
  });
  await refreshPublicTotals();
  revalidatePath('/admin/queue');
  return { status: 'ok', message: 'प्रमुख सहयोग तोकियो · featured contribution set' };
}
