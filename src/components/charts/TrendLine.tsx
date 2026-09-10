'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocale } from 'next-intl';
import { AXIS_TICK, GRID, prefersReducedMotion, toNumber, TOOLTIP_STYLE } from './chart-theme';
import { formatNPR, formatShort, type Locale } from '@/lib/format';
import { PALETTE } from '@/lib/constants';

export function TrendLine({
  data,
  color = PALETTE.crimson,
}: {
  data: { name: string; value: number }[];
  color?: string;
}) {
  const locale = useLocale() as Locale;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 14, right: 18, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(value: number) => formatShort(value, locale)}
          tick={{ ...AXIS_TICK, fontWeight: 400, fill: PALETTE.muted }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(value: unknown) => [formatNPR(toNumber(value), locale), '']}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#trend-fill)"
          dot={{ r: 3, fill: '#fff', strokeWidth: 2 }}
          isAnimationActive={!prefersReducedMotion()}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
