'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { formatNumber, type Locale } from '@/lib/format';

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Rendered as-is when animation is off, so the server and client agree. */
  formatted: string;
}

/**
 * Counts a KPI up on first paint. Respects prefers-reduced-motion and the
 * `?static=1` flag used for PDF export, and always ends on the exact figure.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  formatted,
}: CountUpProps) {
  const locale = useLocale() as Locale;
  const [display, setDisplay] = useState(formatted);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('static') ||
      new URLSearchParams(window.location.search).get('static') === '1' ||
      value < 10;
    if (reduced) {
      setDisplay(formatted);
      return;
    }

    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const step = (now: number) => {
      // requestAnimationFrame reports the time the frame began, which can predate
      // the performance.now() taken when the animation was scheduled. Left
      // unclamped that makes progress negative, the easing overshoot below zero,
      // and the headline total render for a frame as a negative amount.
      const progress = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${prefix}${formatNumber(value * eased, locale, decimals)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(step);
      else setDisplay(formatted);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, prefix, suffix, formatted, locale]);

  return <>{display}</>;
}
