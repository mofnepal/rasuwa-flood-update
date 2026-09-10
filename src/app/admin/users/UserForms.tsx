'use client';

import { useActionState } from 'react';
import { createUser, resetPassword, setUserActive, setUserRole, type UserState } from './actions';

const ROLES = [
  ['entry', 'प्रविष्टि · Data entry'],
  ['verifier', 'प्रमाणक · Verifier'],
  ['publisher', 'प्रकाशक · Publisher'],
  ['admin', 'प्रशासक · Admin'],
] as const;

export function CreateUserForm() {
  const [state, action, pending] = useActionState<UserState, FormData>(createUser, {
    status: 'idle',
  });

  return (
    <form action={action} className="form">
      <div className="adm-actions">
        <input name="name" placeholder="नाम · Name" required aria-label="Name" />
        <input name="email" type="email" placeholder="इमेल · Email" required aria-label="Email" />
        <select name="role" defaultValue="entry" aria-label="Role">
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="password"
          type="password"
          minLength={12}
          placeholder="अस्थायी पासवर्ड (१२+) · temporary password"
          required
          aria-label="Temporary password"
        />
        <button className="btn navy sm" type="submit" disabled={pending}>
          {pending ? 'थप्दै…' : 'खाता थप्नुहोस् · Create'}
        </button>
      </div>
      {state.status === 'error' ? <div className="adm-err">{state.message}</div> : null}
      {state.status === 'ok' ? <div className="adm-ok">{state.message}</div> : null}
    </form>
  );
}

export function UserRow({ id, role, active }: { id: string; role: string; active: boolean }) {
  const [roleState, roleAction] = useActionState<UserState, FormData>(setUserRole, {
    status: 'idle',
  });
  const [activeState, activeAction] = useActionState<UserState, FormData>(setUserActive, {
    status: 'idle',
  });
  const [pwState, pwAction] = useActionState<UserState, FormData>(resetPassword, {
    status: 'idle',
  });
  const message = [roleState, activeState, pwState].find((s) => s.status !== 'idle');

  return (
    <>
      <div className="adm-actions">
        <form action={roleAction} className="adm-actions">
          <input type="hidden" name="id" value={id} />
          <select name="role" defaultValue={role} aria-label="Role">
            {ROLES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="btn ghost sm" type="submit">
            भूमिका · Set role
          </button>
        </form>

        <form action={activeAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="active" value={active ? 'false' : 'true'} />
          <button className="btn ghost sm" type="submit">
            {active ? 'निष्क्रिय · Deactivate' : 'सक्रिय · Activate'}
          </button>
        </form>

        <form action={pwAction} className="adm-actions">
          <input type="hidden" name="id" value={id} />
          <input
            name="password"
            type="password"
            minLength={12}
            placeholder="नयाँ पासवर्ड · new password"
            aria-label="New password"
          />
          <button className="btn ghost sm" type="submit">
            रिसेट · Reset
          </button>
        </form>
      </div>
      {message && message.status === 'error' ? (
        <div className="adm-err">{message.message}</div>
      ) : null}
      {message && message.status === 'ok' ? <div className="adm-ok">{message.message}</div> : null}
    </>
  );
}
