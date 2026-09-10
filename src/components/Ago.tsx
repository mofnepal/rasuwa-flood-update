'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber, type Locale } from '@/lib/format';

/**
 * "(3 h ago)" beside the last-updated time. Worked out in the reader's browser
 * and refreshed every minute, so a page rendered earlier — the static edition is
 * rendered when the data is published — never states a stale age.
 */
export function Ago({ iso }: { iso: string }) {
  const t = useTranslations('site');
  const locale = useLocale() as Locale;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return null;
  const ms = now - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  const text =
    hours < 1
      ? t('justNow')
      : hours < 24
        ? t('hoursAgo', { count: formatNumber(hours, locale) })
        : t('daysAgo', { count: formatNumber(Math.floor(hours / 24), locale) });
  return <em className="ago">{text}</em>;
}
