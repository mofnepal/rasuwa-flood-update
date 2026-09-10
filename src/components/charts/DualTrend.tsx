'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocale } from 'next-intl';
import { AXIS_TICK, GRID, prefersReducedMotion, toNumber, TOOLTIP_STYLE } from './chart-theme';
import { formatNPR, formatNumber, formatUSD, type Locale } from '@/lib/format';
import { PALETTE } from '@/lib/constants';

/** Cumulative NPR and USD on one chart, each on its own axis. */
export function DualTrend({
  labels,
  npr,
  usd,
  nprLabel,
  usdLabel,
}: {
  labels: string[];
  npr: number[];
  usd: number[];
  nprLabel: string;
  usdLabel: string;
}) {
  const locale = useLocale() as Locale;
  const data = labels.map((name, index) => ({
    name,
    npr: (npr[index] ?? 0) / 1e9,
    usd: (usd[index] ?? 0) / 1e6,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 4, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="npr"
          tickFormatter={(value: number) =>
            locale === 'ne' ? `${formatNumber(value, locale)} अर्ब` : `${value} bn`
          }
          tick={{ ...AXIS_TICK, fontWeight: 400, fill: PALETTE.muted }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <YAxis
          yAxisId="usd"
          orientation="right"
          tickFormatter={(value: number) => `${formatNumber(value, locale)} M`}
          tick={{ ...AXIS_TICK, fontWeight: 400, fill: PALETTE.muted }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: unknown, name: unknown) =>
            name === 'npr'
              ? [formatNPR(Math.round(toNumber(value) * 1e9), locale), nprLabel]
              : [formatUSD(Math.round(toNumber(value) * 1e6), locale), usdLabel]
          }
        />
        <Legend
          verticalAlign="bottom"
          height={26}
          formatter={(value: string) => (value === 'npr' ? nprLabel : usdLabel)}
          wrapperStyle={{ fontSize: 12.5 }}
        />
        <Line
          yAxisId="npr"
          type="monotone"
          dataKey="npr"
          stroke={PALETTE.navy}
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={!prefersReducedMotion()}
        />
        <Line
          yAxisId="usd"
          type="monotone"
          dataKey="usd"
          stroke={PALETTE.crimson}
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={!prefersReducedMotion()}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
