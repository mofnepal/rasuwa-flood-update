'use client';

import { useActionState, useState } from 'react';
import { saveRescueReport, type RescueState } from './actions';

/**
 * The structured form is pre-filled from the previous day's report, so an
 * officer edits only the figures that changed and uploads the day's original.
 */
export function RescueImport({
  today,
  previous,
}: {
  today: string;
  previous: { ndrrma: string; police: string };
}) {
  const [state, action, pending] = useActionState<RescueState, FormData>(saveRescueReport, {
    status: 'idle',
  });
  const [agency, setAgency] = useState<'NDRRMA' | 'NEPAL_POLICE'>('NDRRMA');
  const [figures, setFigures] = useState(previous.ndrrma);

  const switchAgency = (next: 'NDRRMA' | 'NEPAL_POLICE') => {
    setAgency(next);
    setFigures(next === 'NDRRMA' ? previous.ndrrma : previous.police);
  };

  return (
    <div className="card">
      <h2>उद्धार प्रतिवेदन · Daily rescue report</h2>
      <p className="lede">
        अघिल्लो दिनको विवरण भरिएको छ — परिवर्तन भएका अङ्क मात्र सम्पादन गर्नुहोस्, र सोही दिनको मूल
        प्रतिवेदन अपलोड गर्नुहोस्। · Pre-filled from the previous day; edit only what changed and
        attach the original.
      </p>

      <form action={action} style={{ marginTop: 12 }}>
        <div className="adm-actions" style={{ marginBottom: 10 }}>
          <select
            name="agency"
            value={agency}
            onChange={(event) => switchAgency(event.target.value as 'NDRRMA' | 'NEPAL_POLICE')}
            aria-label="Agency"
          >
            <option value="NDRRMA">NDRRMA</option>
            <option value="NEPAL_POLICE">Nepal Police</option>
          </select>
          <input
            type="date"
            name="report_at"
            defaultValue={today}
            required
            aria-label="Report date"
          />
          <input type="time" name="report_time" defaultValue="18:00" aria-label="Report time" />
          <input
            name="report_at_bs"
            placeholder="२०८३ भदौ २२"
            required
            aria-label="Report date (BS)"
          />
          <input
            name="source"
            defaultValue={
              agency === 'NDRRMA'
                ? 'NDRRMA – Rasuwa Flood: Search, Rescue and Relief Update'
                : 'Nepal Police – रसुवा भोटेकोशी बाढी सम्बन्धी खोज तथा उद्धार अपडेट'
            }
            required
            aria-label="Source"
            style={{ minWidth: 320 }}
          />
        </div>

        <textarea
          name="data"
          rows={16}
          value={figures}
          onChange={(event) => setFigures(event.target.value)}
          aria-label="Report figures"
          spellCheck={false}
          style={{
            width: '100%',
            font: 'ui-monospace, monospace',
            fontSize: 12.5,
            padding: 10,
            border: '1px solid var(--bd)',
            borderRadius: 8,
          }}
        />

        <div className="adm-actions" style={{ marginTop: 10 }}>
          <input
            type="file"
            name="original"
            accept=".pdf,.jpg,.jpeg,.png"
            aria-label="Original report"
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
      {state.status === 'imported' ? (
        <div className="adm-ok" style={{ marginTop: 12 }}>
          {state.agency} प्रतिवेदन मस्यौदामा सुरक्षित भयो · saved as a draft for review.
        </div>
      ) : null}
    </div>
  );
}
