'use client';

import { useActionState } from 'react';
import { saveDecision, type DecisionState } from './actions';

/** Records a Cabinet decision or ministry notice, with its original document. */
export function DecisionImport() {
  const [state, action, pending] = useActionState<DecisionState, FormData>(saveDecision, {
    status: 'idle',
  });

  return (
    <div className="card">
      <h2>सरकारका पहल · Government initiative</h2>
      <p className="lede">
        मन्त्रिपरिषद् निर्णय, अर्थ मन्त्रालयको सूचना वा नगद सहयोग — मूल कागजातसहित। · A Cabinet
        decision, a ministry notice or a cash-support announcement, with the original document.
      </p>

      <form action={action} className="form" style={{ marginTop: 12 }}>
        <div className="adm-actions">
          <input
            name="slug"
            placeholder="slug — cabinet-2083-05-25-…"
            required
            aria-label="Slug"
            style={{ minWidth: 300 }}
          />
          <select name="kind" defaultValue="cabinet_decision" aria-label="Kind">
            <option value="cabinet_decision">मन्त्रिपरिषद् निर्णय · Cabinet decision</option>
            <option value="mof_notice">अर्थ मन्त्रालय सूचना · MoF notice</option>
            <option value="mof_decision">अर्थ मन्त्रालय निर्णय · MoF decision</option>
            <option value="cash_support">नगद सहयोग · Cash support</option>
            <option value="other">अन्य · Other</option>
          </select>
          <input name="date_bs" placeholder="२०८३ भदौ २५" required aria-label="Date (BS)" />
        </div>
        <div className="adm-actions">
          <input
            name="issuer_ne"
            placeholder="जारी गर्ने निकाय (नेपाली)"
            required
            aria-label="Issuer (Nepali)"
          />
          <input
            name="issuer_en"
            placeholder="Issuer (English)"
            required
            aria-label="Issuer (English)"
          />
        </div>
        <input name="title_ne" placeholder="शीर्षक (नेपाली)" required aria-label="Title (Nepali)" />
        <input
          name="title_en"
          placeholder="Title (English)"
          required
          aria-label="Title (English)"
        />
        <textarea
          name="summary_ne"
          placeholder="सारांश (नेपाली)"
          required
          aria-label="Summary (Nepali)"
        />
        <textarea
          name="summary_en"
          placeholder="Summary (English)"
          required
          aria-label="Summary (English)"
        />
        <div className="adm-actions">
          <input
            type="file"
            name="original"
            accept=".pdf,.jpg,.jpeg,.png"
            aria-label="Original document"
          />
          <button className="btn navy sm" type="submit" disabled={pending}>
            {pending ? 'सुरक्षित हुँदै…' : 'मस्यौदा सुरक्षित · Save as draft'}
          </button>
        </div>
      </form>

      {state.status === 'error' ? (
        <div className="adm-err" style={{ marginTop: 12 }}>
          {state.message}
        </div>
      ) : null}
      {state.status === 'saved' ? (
        <div className="adm-ok" style={{ marginTop: 12 }}>
          <code>{state.slug}</code> मस्यौदामा सुरक्षित · saved as a draft. Add its measures from the
          record, then send it for verification.
        </div>
      ) : null}
    </div>
  );
}
