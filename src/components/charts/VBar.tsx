'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from 'next-intl';
import { AXIS_TICK, GRID, prefersReducedMotion, toNumber, TOOLTIP_STYLE } from './chart-theme';
import { formatNPR, formatNumber, formatShort, formatUSD, type Locale } from '@/lib/format';
import { PALETTE } from '@/lib/constants';

export function VBar({
  data,
  color = PALETTE.navy,
  unit = 'npr',
}: {
  data: { name: string; value: number }[];
  color?: string;
  unit?: 'npr' | 'usd' | 'count';
}) {
  const locale = useLocale() as Locale;
  const format = (value: number) =>
    unit === 'npr'
      ? formatNPR(value, locale)
      : unit === 'usd'
        ? formatUSD(value, locale)
        : formatNumber(value, locale);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0} />
        <YAxis
          tickFormatter={(value: number) =>
            unit === 'count' ? formatNumber(value, locale) : formatShort(value, locale)
          }
          tick={{ ...AXIS_TICK, fontWeight: 400, fill: PALETTE.muted }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(0,56,147,.05)' }}
          formatter={(value: unknown) => [format(toNumber(value)), '']}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
          isAnimationActive={!prefersReducedMotion()}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
