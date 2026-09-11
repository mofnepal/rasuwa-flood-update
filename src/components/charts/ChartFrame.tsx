import type { ReactNode } from 'react';

/**
 * The height a horizontal bar chart needs so each bar's name, which may wrap to
 * two lines, has a row of its own: 30px a bar plus room for the axis.
 */
export function barChartHeight(bars: number, minimum = 240): number {
  return Math.max(minimum, bars * 30 + 40);
}

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
