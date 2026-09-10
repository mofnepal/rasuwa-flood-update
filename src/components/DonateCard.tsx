import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { OFFICIAL_LINKS } from '@/lib/constants';
import { Icon } from './Icon';
import { Card, SectionHeader } from './ui';
import donateQr from '../../public/img/donate-qr.svg';

/**
 * The donate panel. The QR encodes the official payment portal address, so
 * scanning it opens donate.gov.np — the same destination as the button.
 */
export async function DonateCard() {
  const t = await getTranslations('foreign');
  const ts = await getTranslations('site');

  return (
    <Card>
      <SectionHeader icon="qr" title={t('donateTitle')} subtitle={t('donateSub')} />
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <Image
            src={donateQr}
            alt={t('qrCaption')}
            width={148}
            height={148}
            style={{
              border: '2px solid var(--navy)',
              borderRadius: 10,
              padding: 8,
              background: '#fff',
            }}
          />
          <span style={{ display: 'block', fontSize: 12, color: 'var(--mute)', marginTop: 6 }}>
            {t('qrCaption')}
          </span>
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <p style={{ fontSize: 15, color: 'var(--mute)', lineHeight: 1.5, marginBottom: 14 }}>
            {t('donateSub')}
          </p>
          <a
            className="btn red"
            href={OFFICIAL_LINKS.donate}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="qr" /> {ts('donate')}
          </a>
        </div>
      </div>
    </Card>
  );
}
