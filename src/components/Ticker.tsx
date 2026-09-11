import { getTranslations, getLocale } from 'next-intl/server';
import { Icon } from './Icon';
import { Ago } from './Ago';
import { Clock } from './Clock';
import { formatAsOf, bsDate, type Locale } from '@/lib/format';

interface TickerProps {
  updatedAt: string | null;
  eventDateAd: string;
  eventDateBs: string;
}

/** The LIVE line under the navigation: last-updated time and the source list. */
export async function Ticker({ updatedAt, eventDateAd, eventDateBs }: TickerProps) {
  const t = await getTranslations('site');
  const locale = (await getLocale()) as Locale;

  return (
    <div className="ticker">
      <div className="wrap">
        <span className="live">
          <i />
          {t('live')}
        </span>
        <Clock />
        {updatedAt && (
          <span>
            <Icon name="clock" /> {t('updated')}: {formatAsOf(updatedAt, locale)}{' '}
            <Ago iso={updatedAt} />
          </span>
        )}
        <span className="sep" aria-hidden="true">
          ·
        </span>
        <span>{t('event', { date: bsDate(eventDateAd, eventDateBs, locale) })}</span>
        <span className="src" style={{ marginLeft: 'auto' }}>
          {t('sources')}
        </span>
      </div>
    </div>
  );
}
