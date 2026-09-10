import type { ReactNode } from 'react';

/** Fixed-height responsive container plus the mandatory source chip. */
export function ChartFrame({
  height = 280,
  source,
  children,
}: {
  height?: number;
  source?: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className="chart" style={{ height }}>
        {children}
      </div>
      {source ? (
        <div style={{ marginTop: 8 }}>
          <span className="src">{source}</span>
        </div>
      ) : null}
    </>
  );
}
