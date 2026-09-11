'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatAsOf, type Locale } from '@/lib/format';
import { Icon } from './Icon';

/**
 * Today's date and the time in Nepal, BS first — "Bhadra 26, 2083 · 11 Sep 2026,
 * 10:42 AM". Shown in the reader's browser and refreshed every 15 seconds, so a
 * page published earlier still shows the present moment. Nepal time whatever the
 * reader's own time zone.
 */
export function Clock() {
  const t = useTranslations('site');
  const locale = useLocale() as Locale;
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;
  return (
    <span className="clock">
      <Icon name="calendar" /> {t('nepalTime')}: <b>{formatAsOf(now, locale)}</b>
    </span>
  );
}
