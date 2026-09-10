'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useLocale } from 'next-intl';
import { CHART_COLORS, prefersReducedMotion, toNumber, TOOLTIP_STYLE } from './chart-theme';
import { formatNPR, formatPercent, type Locale } from '@/lib/format';

export interface DonutSlice {
  name: string;
  value: number;
}

export function Donut({
  data,
  centreValue,
  centreLabel,
  ariaLabel,
}: {
  data: DonutSlice[];
  centreValue: string;
  centreLabel: string;
  ariaLabel: string;
}) {
  const locale = useLocale() as Locale;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="cv" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={1}
            stroke="#fff"
            strokeWidth={2}
            isAnimationActive={!prefersReducedMotion()}
          >
            {data.map((slice, index) => (
              <Cell key={slice.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(value: unknown, name: unknown) => [
              `${formatNPR(toNumber(value), locale)} · ${formatPercent(toNumber(value), total, locale)}`,
              String(name ?? ''),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="c">
        <b>{centreValue}</b>
        <span>{centreLabel}</span>
      </div>
    </div>
  );
}
