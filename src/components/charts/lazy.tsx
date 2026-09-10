'use client';

import dynamic from 'next/dynamic';

/**
 * The charting library is the single largest script on the site, and every
 * figure it draws is also published as text — in a KPI tile, a register or a
 * table. Loading it after the page has painted keeps the reader's first view
 * fast without withholding any information.
 *
 * Each placeholder fills the height its parent ChartFrame has already reserved,
 * so nothing moves when the chart arrives.
 */
const placeholder = () => <div className="chart-loading" aria-hidden="true" />;

export const Donut = dynamic(() => import('./Donut').then((m) => m.Donut), {
  ssr: false,
  loading: placeholder,
});

export const HBar = dynamic(() => import('./HBar').then((m) => m.HBar), {
  ssr: false,
  loading: placeholder,
});

export const VBar = dynamic(() => import('./VBar').then((m) => m.VBar), {
  ssr: false,
  loading: placeholder,
});

export const TrendLine = dynamic(() => import('./TrendLine').then((m) => m.TrendLine), {
  ssr: false,
  loading: placeholder,
});

export const DualTrend = dynamic(() => import('./DualTrend').then((m) => m.DualTrend), {
  ssr: false,
  loading: placeholder,
});
