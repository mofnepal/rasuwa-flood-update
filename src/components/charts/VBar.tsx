'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale } from 'next-intl';
import { AXIS_TICK, GRID, prefersReducedMotion, toNumber, TOOLTIP_STYLE } from './chart-theme';
import { shortenLabel, useChartWidth } from './useChartWidth';
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
  const [width, onResize] = useChartWidth();
  // With less than about 60px a bar — nine districts on a phone — labels side by
  // side collide and the last runs off the screen, so they are slanted and shortened.
  const crowded = width > 0 && width / Math.max(1, data.length) < 60;
  const format = (value: number) =>
    unit === 'npr'
      ? formatNPR(value, locale)
      : unit === 'usd'
        ? formatUSD(value, locale)
        : formatNumber(value, locale);

  return (
    <ResponsiveContainer width="100%" height="100%" onResize={onResize}>
      <BarChart data={data} margin={{ top: 14, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ ...AXIS_TICK, fontSize: crowded ? 11 : 12 }}
          tickFormatter={(name: string) => (crowded ? shortenLabel(name, 14, locale) : name)}
          angle={crowded ? -40 : 0}
          textAnchor={crowded ? 'end' : 'middle'}
          height={crowded ? 74 : 30}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
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
