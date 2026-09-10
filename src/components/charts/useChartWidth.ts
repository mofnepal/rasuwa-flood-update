'use client';

import { useCallback, useState } from 'react';

/**
 * The rendered width of a chart, reported by its ResponsiveContainer, so axis
 * labels can be laid out for a phone rather than a desktop. Zero until measured.
 */
export function useChartWidth() {
  const [width, setWidth] = useState(0);
  const onResize = useCallback((next: number) => setWidth(Math.round(next)), []);
  return [width, onResize] as const;
}

/**
 * Shortens a label to `max` characters as the reader sees them — a Devanagari
 * letter with its vowel sign counts as one — with an ellipsis. The tooltip
 * still carries the full name.
 */
export function shortenLabel(label: string, max: number, locale: string): string {
  const characters =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(label)].map(
          (part) => part.segment,
        )
      : [...label];
  return characters.length > max
    ? `${characters
        .slice(0, max - 1)
        .join('')
        .trim()}…`
    : label;
}
