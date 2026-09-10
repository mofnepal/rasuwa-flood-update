'use client';

import { useActionState } from 'react';
import { updateFxRate, type ActionState } from '../actions';

export function FxForm({
  rate,
  sourceNe,
  sourceEn,
}: {
  rate: number;
  sourceNe: string;
  sourceEn: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateFxRate, {
    status: 'idle',
  });

  return (
    <form action={action} className="form">
      <div className="adm-actions">
        <input
          name="rate"
          type="number"
          step="0.01"
          min="1"
          defaultValue={rate}
          required
          aria-label="USD to NPR rate"
        />
        <button className="btn navy sm" type="submit" disabled={pending}>
          {pending ? 'सुरक्षित हुँदै…' : 'दर सुरक्षित · Save rate'}
        </button>
      </div>
      <input name="source_ne" defaultValue={sourceNe} aria-label="Source (Nepali)" />
      <input name="source_en" defaultValue={sourceEn} aria-label="Source (English)" />
      {state.status === 'error' ? <div className="adm-err">{state.message}</div> : null}
      {state.status === 'ok' ? <div className="adm-ok">{state.message}</div> : null}
    </form>
  );
}
