'use client';

import { PALETTE } from '@/lib/constants';

/** The only colours a chart may use. */
export const CHART_COLORS = [
  PALETTE.navy,
  PALETTE.crimson,
  PALETTE.navy2,
  PALETTE.navy3,
  PALETTE.gold,
  PALETTE.success,
] as const;

export const GRID = '#EEF1F6';
export const AXIS_TICK = { fill: PALETTE.ink, fontSize: 12, fontWeight: 600 } as const;
export const AXIS_TICK_MUTED = { fill: PALETTE.muted, fontSize: 12 } as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    border: `1px solid ${PALETTE.border}`,
    borderRadius: 8,
    fontSize: 13,
    boxShadow: '0 8px 24px rgba(20,33,61,.12)',
    padding: '8px 10px',
  },
  labelStyle: { color: PALETTE.ink, fontWeight: 700, marginBottom: 2 },
  itemStyle: { color: PALETTE.muted },
} as const;

/**
 * True when a chart must draw itself in its final state immediately: the reader
 * asked for reduced motion, or the page was requested with `?static=1` for
 * printing or PDF export. Read from the URL directly so it is correct on the
 * very first render, before any effect has run.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('static') ||
    new URLSearchParams(window.location.search).get('static') === '1'
  );
}

/**
 * Recharts types tooltip values loosely; this narrows them once so each chart's
 * formatter can just take a number.
 */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
