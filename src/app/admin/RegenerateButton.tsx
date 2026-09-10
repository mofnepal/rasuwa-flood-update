'use client';

import { useState, useTransition } from 'react';
import { regenerateTotals } from './actions';

/** One click recomputes the cached public totals. */
export function RegenerateButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  return (
    <>
      <button
        type="button"
        className="btn ghost sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await regenerateTotals();
            setMessage(result.message ?? '');
          })
        }
      >
        {pending ? 'गणना हुँदै…' : 'पुनः गणना · regenerate totals'}
      </button>
      {message ? <div style={{ marginTop: 6 }}>{message}</div> : null}
    </>
  );
}
