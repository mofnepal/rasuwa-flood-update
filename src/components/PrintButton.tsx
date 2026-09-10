'use client';

import { Icon } from './Icon';

/** Opens the browser's print dialog, from which the reader can also save a PDF. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        background: 'none',
        border: 0,
        padding: 0,
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <Icon name="download" /> {label}
    </button>
  );
}
