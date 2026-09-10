'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form className="form" action={action}>
      <input
        name="email"
        type="email"
        required
        autoComplete="username"
        placeholder="इमेल · Email"
        aria-label="Email"
      />
      <input
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="पासवर्ड · Password"
        aria-label="Password"
      />
      <button className="btn navy" type="submit" disabled={pending}>
        {pending ? 'प्रतीक्षा…' : 'प्रवेश · Sign in'}
      </button>
      {state.error ? (
        <div className="adm-err" role="alert">
          {state.error}
        </div>
      ) : null}
    </form>
  );
}
