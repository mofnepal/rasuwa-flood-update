'use client';

import { useActionState, useState } from 'react';
import { transitionRecords, type ActionState } from '../actions';
import type { Entity, Transition } from '@/lib/workflow';

export interface QueueRow {
  id: string;
  status: 'draft' | 'verified' | 'published' | 'archived';
  title: string;
  detail: string;
  amount: string;
  date: string;
  reviewNote: string | null;
}

const TRANSITION_LABELS: Record<Transition, string> = {
  verify: 'प्रमाणित गर्नुहोस् · Verify',
  send_back: 'फिर्ता पठाउनुहोस् · Send back',
  publish: 'प्रकाशन गर्नुहोस् · Publish',
  unpublish: 'प्रकाशन हटाउनुहोस् · Unpublish',
  archive: 'अभिलेखमा राख्नुहोस् · Archive',
};

/**
 * Select records, then apply one transition to all of them. The buttons a user
 * sees follow their role, and the server checks the role again before acting.
 */
export function QueueTable({
  entity,
  rows,
  allowed,
}: {
  entity: Entity;
  rows: QueueRow[];
  allowed: Transition[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(transitionRecords, {
    status: 'idle',
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [transition, setTransition] = useState<Transition>(allowed[0] ?? 'verify');

  const toggle = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));

  return (
    <form action={action}>
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="transition" value={transition} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="id" value={id} />
      ))}

      {state.status === 'ok' ? <div className="adm-ok">{state.message}</div> : null}
      {state.status === 'error' ? <div className="adm-err">{state.message}</div> : null}

      <div className="adm-actions" style={{ margin: '12px 0' }}>
        <select
          value={transition}
          onChange={(event) => setTransition(event.target.value as Transition)}
          aria-label="Action"
        >
          {allowed.map((option) => (
            <option key={option} value={option}>
              {TRANSITION_LABELS[option]}
            </option>
          ))}
        </select>
        <input
          name="note"
          placeholder="टिप्पणी (ऐच्छिक) · comment (optional)"
          aria-label="Comment"
          style={{ minWidth: 240 }}
        />
        <button className="btn navy sm" type="submit" disabled={pending || selected.size === 0}>
          {pending ? 'लागू हुँदै…' : `लागू गर्नुहोस् (${selected.size}) · Apply`}
        </button>
        {allowed.length === 0 ? (
          <span className="src">तपाईंको भूमिकामा यहाँ कार्य छैन · no actions for your role</span>
        ) : null}
      </div>

      <div className="tscroll">
        <table className="tbl adm-table">
          <thead>
            <tr>
              <th className="sel">
                <input
                  type="checkbox"
                  checked={allSelected}
                  aria-label="Select all"
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)))
                  }
                />
              </th>
              <th>अवस्था · Status</th>
              <th>मिति · Date</th>
              <th>विवरण · Record</th>
              <th className="amt">रकम · Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="sel">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      aria-label={row.title}
                      onChange={() => toggle(row.id)}
                    />
                  </td>
                  <td>
                    <span className={`pill ${row.status}`}>{row.status}</span>
                  </td>
                  <td>{row.date}</td>
                  <td className="nm">
                    {row.title}
                    <div style={{ fontSize: 12, color: 'var(--mute)', fontWeight: 400 }}>
                      {row.detail}
                      {row.reviewNote ? ` — ${row.reviewNote}` : ''}
                    </div>
                  </td>
                  <td className="amt">{row.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="empty">यस अवस्थामा कुनै अभिलेख छैन · nothing in this state</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </form>
  );
}
