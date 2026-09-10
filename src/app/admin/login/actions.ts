'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { BASE_PATH } from '@/lib/constants';

export type LoginState = { error?: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: String(formData.get('email') ?? '')
        .toLowerCase()
        .trim(),
      password: String(formData.get('password') ?? ''),
      redirectTo: `${BASE_PATH}/admin`,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Never say which half was wrong, and never say whether the account exists.
      return { error: 'इमेल वा पासवर्ड मिलेन · Incorrect email or password' };
    }
    throw error;
  }
}
