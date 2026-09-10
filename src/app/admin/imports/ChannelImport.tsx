'use client';

import { useActionState } from 'react';
import { commitChannelSnapshot, previewChannelTable, type ChannelState } from './actions';

/** Paste the network's own daily table; the parser reads Indian, Western or Devanagari digits. */
export function ChannelImport({ today }: { today: string }) {
  const [state, action, pending] = useActionState<ChannelState, FormData>(previewChannelTable, {
    status: 'idle',
  });
  const [commitState, commitAction, committing] = useActionState<ChannelState, FormData>(
    commitChannelSnapshot,
    { status: 'idle' },
  );

  return (
    <div className="card">
      <h2>NCHL / Fonepay दैनिक विवरण · Daily channel figures</h2>
      <p className="lede">
        नेटवर्कको तालिका जस्ताको तस्तै टाँस्नुहोस् — <code>च्यानल · कारोबार · रकम</code>। · Paste
        the network&apos;s table as it is printed: channel, transaction count, amount.
      </p>

      <form action={action} style={{ marginTop: 12 }}>
        <textarea
          name="table"
          rows={8}
          required
          aria-label="Channel table"
          placeholder={
            'IPS/Cheque Transfer\t1,225\t1,69,89,07,769.22\nCard – International\t96,899\t1,49,00,69,985.09'
          }
          style={{
            width: '100%',
            font: 'inherit',
            fontSize: 14,
            padding: 10,
            border: '1px solid var(--bd)',
            borderRadius: 8,
          }}
        />
        <button className="btn navy sm" type="submit" disabled={pending} style={{ marginTop: 10 }}>
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
          {commitState.created} च्यानल पङ्क्ति मस्यौदामा · {commitState.created} channel row(s)
          saved as drafts.
        </div>
      ) : null}

      {state.status === 'preview' ? (
        <form action={commitAction} style={{ marginTop: 16 }}>
          <div className="adm-preview">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Channel</th>
                  <th>Code</th>
                  <th className="amt">Transactions</th>
                  <th className="amt">Amount (NPR)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {state.preview.rows.map((row) => (
                  <tr key={row.line} className={row.errors.length ? 'adm-row-bad' : ''}>
                    <td>{row.line}</td>
                    <td className="nm">{row.label}</td>
                    <td>{row.channel_code}</td>
                    <td className="amt">{row.txn_count?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="amt">{row.amount_npr?.toLocaleString('en-IN') ?? '—'}</td>
                    <td style={{ color: 'var(--red)', fontSize: 12 }}>{row.errors.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="src" style={{ display: 'inline-block', marginTop: 10 }}>
            योग · total: NPR {state.preview.total_npr.toLocaleString('en-IN')} ·{' '}
            {state.preview.total_txns.toLocaleString('en-IN')} transactions
          </div>

          <input type="hidden" name="payload" value={JSON.stringify(state.preview.rows)} />
          <div className="adm-actions" style={{ marginTop: 12 }}>
            <select name="network" required aria-label="Network" defaultValue="NCHL">
              <option value="NCHL">NCHL</option>
              <option value="FONEPAY">Fonepay</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
            <select name="period" required aria-label="Period" defaultValue="cumulative">
              <option value="cumulative">cumulative — running total</option>
              <option value="daily">daily — that day only</option>
            </select>
            <input
              type="date"
              name="snapshotDate"
              defaultValue={today}
              required
              aria-label="Snapshot date"
            />
            <input
              type="time"
              name="snapshotTime"
              defaultValue="17:00"
              aria-label="Snapshot time"
            />
            <input name="source" defaultValue="NCHL" required aria-label="Source" />
            <button
              className="btn navy sm"
              type="submit"
              disabled={committing || state.preview.valid === 0}
            >
              {committing ? 'थप्दै…' : 'मस्यौदा बनाउनुहोस् · Save as drafts'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
