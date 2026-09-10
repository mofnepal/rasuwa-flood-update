'use server';

import { revalidatePath } from 'next/cache';
import { hash } from '@node-rs/argon2';
import { z } from 'zod';
import type { Role } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { writeAudit } from '@/lib/audit';

export type UserState = { status: 'idle' | 'ok' | 'error'; message?: string };

const createSchema = z.object({
  email: z.string().email().max(160),
  name: z.string().trim().min(2).max(120),
  role: z.enum(['entry', 'verifier', 'publisher', 'admin']),
  password: z
    .string()
    .min(12, 'पासवर्ड कम्तीमा १२ अक्षरको हुनुपर्छ · the password must be at least 12 characters'),
});

export async function createUser(_previous: UserState, formData: FormData): Promise<UserState> {
  const actor = await requireRole('admin');
  const parsed = createSchema.safeParse({
    email: String(formData.get('email') ?? '')
      .toLowerCase()
      .trim(),
    name: String(formData.get('name') ?? ''),
    role: String(formData.get('role') ?? 'entry'),
    password: String(formData.get('password') ?? ''),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'invalid input' };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return {
      status: 'error',
      message: 'यो इमेल पहिले नै दर्ता छ · that email already has an account',
    };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role as Role,
      passwordHash: await hash(parsed.data.password),
    },
  });

  await writeAudit({
    userId: actor.id,
    action: 'create_user',
    entity: 'User',
    entityId: user.id,
    after: { email: user.email, role: user.role },
  });
  revalidatePath('/admin/users');
  return { status: 'ok', message: 'प्रयोगकर्ता थपियो · account created' };
}

export async function setUserRole(_previous: UserState, formData: FormData): Promise<UserState> {
  const actor = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const role = String(formData.get('role') ?? '') as Role;

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return { status: 'error', message: 'account not found' };
  if (before.id === actor.id && role !== 'admin') {
    return { status: 'error', message: 'आफ्नै भूमिका घटाउन मिल्दैन · you cannot demote yourself' };
  }

  const after = await prisma.user.update({ where: { id }, data: { role } });
  await writeAudit({
    userId: actor.id,
    action: 'update_user_role',
    entity: 'User',
    entityId: id,
    before: { role: before.role },
    after: { role: after.role },
  });
  revalidatePath('/admin/users');
  return { status: 'ok', message: 'भूमिका अद्यावधिक · role updated' };
}

export async function setUserActive(_previous: UserState, formData: FormData): Promise<UserState> {
  const actor = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';

  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return { status: 'error', message: 'account not found' };
  if (before.id === actor.id && !active) {
    return {
      status: 'error',
      message: 'आफ्नै खाता निष्क्रिय गर्न मिल्दैन · you cannot deactivate yourself',
    };
  }

  await prisma.user.update({ where: { id }, data: { active } });
  await writeAudit({
    userId: actor.id,
    action: active ? 'activate_user' : 'deactivate_user',
    entity: 'User',
    entityId: id,
    before: { active: before.active },
    after: { active },
  });
  revalidatePath('/admin/users');
  return {
    status: 'ok',
    message: active ? 'खाता सक्रिय · account activated' : 'खाता निष्क्रिय · account deactivated',
  };
}

export async function resetPassword(_previous: UserState, formData: FormData): Promise<UserState> {
  const actor = await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const password = String(formData.get('password') ?? '');
  if (password.length < 12) {
    return {
      status: 'error',
      message: 'पासवर्ड कम्तीमा १२ अक्षरको हुनुपर्छ · at least 12 characters',
    };
  }

  await prisma.user.update({ where: { id }, data: { passwordHash: await hash(password) } });
  await writeAudit({ userId: actor.id, action: 'reset_password', entity: 'User', entityId: id });
  revalidatePath('/admin/users');
  return { status: 'ok', message: 'पासवर्ड परिवर्तन भयो · password changed' };
}
