'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/Icon';

/**
 * Shows the NDRRMA rescued-persons page live. The data is never copied into
 * this portal; if the site refuses framing the fallback and the link remain.
 */
export function LiveEmbed({ url, title }: { url: string; title: string }) {
  const t = useTranslations('rescue');
  const ts = useTranslations('site');
  const [loaded, setLoaded] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Cross-origin framing failures are silent; after a grace period we simply
      // leave the fallback visible behind the frame.
      if (!frameRef.current?.contentWindow) setLoaded(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="embed">
      <div className="bar">
        <Icon name="rescuedPersons" />
        <b>{title}</b>
        <span className="src">ndrrma.gov.np</span>
        <div className="r">
          <a className="btn ghost sm" href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="external" /> {ts('openInNewTab')}
          </a>
        </div>
      </div>
      <div className="frame">
        <div className="fallback">
          <Icon name="rescuedPersons" style={{ fontSize: 30 }} />
          <span>{t('embedFallback')}</span>
          <a className="btn navy" href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="external" /> {ts('openInNewTab')}
          </a>
        </div>
        <iframe
          ref={frameRef}
          src={url}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity .3s' }}
        />
      </div>
    </div>
  );
}
