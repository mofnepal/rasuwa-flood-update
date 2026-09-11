import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { NAV } from '@/lib/nav';
import { BASE_PATH, OFFICIAL_LINKS, SHOW_DOWNLOADS, STATIC_EXPORT } from '@/lib/constants';
import { formatAsOf, toNepaliDigits, type Locale } from '@/lib/format';
import { Icon } from './Icon';
import { PrintButton } from './PrintButton';

interface SiteFooterProps {
  updatedAt: string | null;
  ministry: {
    address_ne: string;
    address_en: string;
    phones: string[];
    emails: string[];
  };
}

export async function SiteFooter({ updatedAt, ministry }: SiteFooterProps) {
  const t = await getTranslations('site');
  const tn = await getTranslations('nav');
  const locale = (await getLocale()) as Locale;
  const year = locale === 'ne' ? toNepaliDigits(2083) : '2026';

  return (
    <footer>
      <div className="wrap">
        <div>
          <b>{t('portal')}</b>
          {t('footerBlurb')}
          <br />
          <br />
          {t('government')}, {t('ministry')} ·{' '}
          {locale === 'ne' ? ministry.address_ne : ministry.address_en}
          <br />
          {ministry.phones.join(' · ')}
          <br />
          {ministry.emails.join(' · ')}
        </div>

        <div>
          <b>{t('sections')}</b>
          <ul>
            {NAV.map((item) => (
              <li key={item.key}>
                <Link href={item.href}>{tn(item.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <b>{t('officialLinks')}</b>
          <ul>
            {Object.values(OFFICIAL_LINKS).map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url.replace('https://', '').replace(/\/$/, '')}
                </a>
              </li>
            ))}
          </ul>
          <b style={{ marginTop: 10 }}>{SHOW_DOWNLOADS ? t('downloads') : t('print')}</b>
          {/* While downloads are switched off, the browser's print — which also saves
              a PDF, through the A4 print stylesheet — is the only option offered. */}
          {!SHOW_DOWNLOADS ? (
            <ul>
              <li>
                <PrintButton label={t('printPdf')} />
              </li>
            </ul>
          ) : (
            <ul>
              {/* Files and endpoints, not pages — plain links are correct. */}
              <li>
                <a href={`${BASE_PATH}/${STATIC_EXPORT ? 'open-data/index.json' : 'api/v1'}`}>
                  <Icon name="download" /> {t('openData')} (JSON)
                </a>
              </li>
              <li>
                <a href={`${BASE_PATH}/open-data/contributions.csv`}>
                  <Icon name="download" /> {t('registerCsv')}
                </a>
              </li>
              {/* PDFs are rendered by the ministry's server; the static edition offers
                the browser's own print, which uses the same A4 print stylesheet. */}
              {STATIC_EXPORT ? (
                <li>
                  <PrintButton label={t('printPdf')} />
                </li>
              ) : (
                <>
                  <li>
                    <a href={`${BASE_PATH}/api/pdf/ne`}>
                      <Icon name="download" /> {t('downloadPdf')} — नेपाली
                    </a>
                  </li>
                  <li>
                    <a href={`${BASE_PATH}/api/pdf/en`}>
                      <Icon name="download" /> {t('downloadPdf')} — English
                    </a>
                  </li>
                </>
              )}
            </ul>
          )}
        </div>

        <div className="copy">
          <span>
            {t('printedOn')}: {updatedAt ? formatAsOf(updatedAt, locale) : '—'}
          </span>
          <span>
            © {year} {t('copyright')}
          </span>
          <span>
            {t('lastUpdated')} {updatedAt ? formatAsOf(updatedAt, locale) : '—'}
          </span>
        </div>
      </div>
    </footer>
  );
}
