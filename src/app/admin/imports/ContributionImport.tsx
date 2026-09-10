'use client';

import { useActionState } from 'react';
import { commitContributions, previewContributionFile, type PreviewState } from './actions';
import { SECTORS } from '@/lib/sectors';

/** Upload → row-by-row preview → confirm. Nothing is written before the confirm. */
export function ContributionImport({ defaultSource }: { defaultSource: string }) {
  const [state, action, pending] = useActionState<PreviewState, FormData>(previewContributionFile, {
    status: 'idle',
  });
  const [commitState, commitAction, committing] = useActionState<PreviewState, FormData>(
    commitContributions,
    { status: 'idle' },
  );

  const sectorName = (code: string) => SECTORS.find((s) => s.code === code)?.name_en ?? code;

  return (
    <div className="card">
      <h2>हस्तान्तरण सूची आयात · Import the handover list</h2>
      <p className="lede">
        अर्थमन्त्रीज्यूको सचिवालयको <code>bhadra_19.xlsx</code> ढाँचा (.xlsx वा .csv)। · The Fund
        Section&apos;s own spreadsheet format. Rows are created as drafts for a verifier.
      </p>

      <form action={action} className="adm-actions" style={{ marginTop: 14 }}>
        <input type="file" name="file" accept=".xlsx,.xls,.csv" required aria-label="Spreadsheet" />
        <button className="btn navy sm" type="submit" disabled={pending}>
          {pending ? 'पढ्दै…' : 'पूर्वावलोकन · Preview'}
        </button>
      </form>

      {state.status === 'error' ? (
        <div className="adm-err" style={{ marginTop: 12 }}>
          {state.message}
        </div>
      ) : null}
      {commitState.status === 'error' ? (
        <div className="adm-err" style={{ marginTop: 12 }}>
          {commitState.message}
        </div>
      ) : null}
      {commitState.status === 'imported' ? (
        <div className="adm-ok" style={{ marginTop: 12 }}>
          {commitState.created} पङ्क्ति मस्यौदाका रूपमा थपियो · {commitState.created} row(s) created
          as drafts{commitState.skipped ? `, ${commitState.skipped} skipped` : ''}.
        </div>
      ) : null}

      {state.status === 'preview' ? (
        <form action={commitAction} style={{ marginTop: 16 }}>
          <div className="adm-actions" style={{ marginBottom: 10 }}>
            <span className="pill verified">{state.preview.valid} valid</span>
            {state.preview.invalid ? (
              <span className="pill draft">{state.preview.invalid} with errors</span>
            ) : null}
            {state.preview.duplicates ? (
              <span className="pill archived">{state.preview.duplicates} duplicate</span>
            ) : null}
            <span className="src">
              NPR {state.preview.total_npr.toLocaleString('en-IN')} · USD{' '}
              {state.preview.total_usd.toLocaleString('en-US')}
            </span>
            <span className="src">{state.filename}</span>
          </div>

          <div className="adm-preview">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Date (BS → AD)</th>
                  <th>Contributor</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Sector</th>
                  <th className="amt">NPR</th>
                  <th className="amt">USD</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {state.preview.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={
                      row.errors.length ? 'adm-row-bad' : row.duplicate ? 'adm-row-dupe' : ''
                    }
                  >
                    <td>{row.row}</td>
                    <td>
                      {row.date_bs} {row.date_ad ? `→ ${row.date_ad}` : ''}
                    </td>
                    <td className="nm">{row.contributor_name}</td>
                    <td>{row.contributor_type}</td>
                    <td>{row.payment_mode}</td>
                    <td>{sectorName(row.sector)}</td>
                    <td className="amt">{row.amount_npr?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="amt">{row.amount_usd?.toLocaleString('en-US') ?? '—'}</td>
                    <td style={{ color: 'var(--red)', fontSize: 12 }}>
                      {row.errors.join('; ')}
                      {row.duplicate ? (row.errors.length ? ' · ' : '') + 'duplicate' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <input type="hidden" name="payload" value={JSON.stringify(state.preview.rows)} />
          <div className="adm-actions" style={{ marginTop: 12 }}>
            <input
              name="source"
              defaultValue={defaultSource}
              required
              aria-label="Source"
              style={{ minWidth: 340 }}
            />
            <label style={{ fontSize: 14 }}>
              <input type="checkbox" name="skipDuplicates" defaultChecked /> दोहोरिएका पङ्क्ति
              छाड्नुहोस् · skip duplicates
            </label>
            <button
              className="btn navy sm"
              type="submit"
              disabled={committing || state.preview.valid === 0}
            >
              {committing ? 'थप्दै…' : `${state.preview.valid} पङ्क्ति थप्नुहोस् · Create drafts`}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
