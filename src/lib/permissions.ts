import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export type Role = 'entry' | 'verifier' | 'publisher' | 'admin';

/** Higher roles can do everything a lower one can. */
const RANK: Record<Role, number> = { entry: 1, verifier: 2, publisher: 3, admin: 4 };

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function currentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
    role: session.user.role as Role,
  };
}

/** Use in a server component or action; sends an unauthenticated visitor to the login page. */
export async function requireRole(minimum: Role): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) redirect('/admin/login');
  if (RANK[user.role] < RANK[minimum]) redirect('/admin?denied=1');
  return user;
}

export function can(role: Role | undefined, minimum: Role): boolean {
  return Boolean(role && RANK[role] >= RANK[minimum]);
}
