'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLocale } from 'next-intl';
import {
  AXIS_TICK,
  CHART_COLORS,
  GRID,
  prefersReducedMotion,
  toNumber,
  TOOLTIP_STYLE,
} from './chart-theme';
import { shortenLabel, useChartWidth } from './useChartWidth';
import { formatNPR, formatNumber, formatShort, type Locale } from '@/lib/format';
import { PALETTE } from '@/lib/constants';

export interface BarDatum {
  name: string;
  value: number;
  /** Shown in the tooltip beside the amount. */
  count?: number;
}

export function HBar({
  data,
  color = PALETTE.navy,
  multicolour = false,
  unit = 'npr',
  countLabel,
}: {
  data: BarDatum[];
  color?: string;
  multicolour?: boolean;
  unit?: 'npr' | 'count';
  countLabel?: string;
}) {
  const locale = useLocale() as Locale;
  const [width, onResize] = useChartWidth();
  // On a phone the category names take less of the width, leaving room for the bars.
  const labelWidth = width > 0 && width < 380 ? 112 : 140;
  const format = (value: number) =>
    unit === 'npr' ? formatNPR(value, locale) : formatNumber(value, locale);

  return (
    <ResponsiveContainer width="100%" height="100%" onResize={onResize}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(value: number) =>
            unit === 'npr' ? formatShort(value, locale) : formatNumber(value, locale)
          }
          tick={{ ...AXIS_TICK, fontWeight: 400, fill: PALETTE.muted }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={labelWidth}
          tick={{ ...AXIS_TICK, fontSize: labelWidth < 140 ? 11 : 12 }}
          tickFormatter={(name: string) =>
            labelWidth < 140 ? shortenLabel(name, 18, locale) : name
          }
          // Every bar keeps its name. Left to itself the chart drops labels that
          // might overlap, which left the first sector with no name at all.
          interval={0}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(0,56,147,.05)' }}
          formatter={(value: unknown, _name: unknown, item: { payload?: BarDatum }) => [
            item?.payload?.count != null && countLabel
              ? `${format(toNumber(value))} · ${formatNumber(item.payload.count, locale)} ${countLabel}`
              : format(toNumber(value)),
            '',
          ]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={!prefersReducedMotion()}>
          {data.map((datum, index) => (
            <Cell
              key={datum.name}
              fill={multicolour ? CHART_COLORS[index % CHART_COLORS.length] : color}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
