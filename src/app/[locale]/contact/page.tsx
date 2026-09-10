import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { getMinistryReference } from '@/lib/ministry';
import { OFFICIAL_LINKS, STATIC_EXPORT } from '@/lib/constants';
import type { Locale } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { Card, EmptyState, SectionHeader } from '@/components/ui';
import { ContactTable, type ContactRow } from './ContactTable';
import { MessageForm } from './MessageForm';

/**
 * Rendered at request time on the ministry's server: the portal must never ship a
 * page with figures frozen into the image, and the image builds without a database.
 * The data is cached for 60 seconds and invalidated the moment an admin action
 * publishes or withdraws a record. The static edition renders the page once instead:
 * scripts/build-static.mjs removes this line from its build copy.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return {
    title: t('title'),
    openGraph: { images: [{ url: `/og/contact-${locale}.png`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [`/og/contact-${locale}.png`] },
  };
}

/** Singha Durbar, Kathmandu — OpenStreetMap needs no API key. */
const MAP_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=85.3195%2C27.6968%2C85.3305%2C27.7040&layer=mapnik&marker=27.7004%2C85.3250';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const t = await getTranslations('contact');
  const ts = await getTranslations('site');

  const [contacts, reference] = await Promise.all([
    prisma.contact.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
    getMinistryReference(),
  ]);

  const rows: ContactRow[] = contacts.map((row) => ({
    id: row.id,
    group_ne: row.group_ne,
    group_en: row.group_en,
    title_ne: row.title_ne,
    title_en: row.title_en,
    name_ne: row.name_ne,
    name_en: row.name_en,
    phone: row.phone,
  }));

  const intro = locale === 'ne' ? reference.contact_intro_ne : reference.contact_intro_en;

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          {intro ? <p>{intro}</p> : null}
        </div>
        <a
          className="btn red"
          href={OFFICIAL_LINKS.donate}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="qr" /> {ts('donate')}
        </a>
      </div>

      <Card>
        <SectionHeader icon="contact" title={t('contactTable')} subtitle={intro ?? undefined} />
        {rows.length ? <ContactTable rows={rows} /> : <EmptyState label={ts('awaitingEntry')} />}
      </Card>

      <section className="grid g2">
        <Card>
          <SectionHeader
            icon="location"
            title={t('ministryDetails')}
            subtitle={t('ministryIntro')}
          />
          <div className="addr">
            <div>
              <span className="av">
                <Icon name="location" />
              </span>
              <div>
                <b>{locale === 'ne' ? reference.ministry.name_ne : reference.ministry.name_en}</b>
                <span>
                  {locale === 'ne' ? reference.ministry.address_ne : reference.ministry.address_en}
                </span>
              </div>
            </div>
            <div>
              <span className="av">
                <Icon name="contact" />
              </span>
              <div>
                <b>
                  {reference.ministry.phones.map((phone, index) => (
                    <span key={phone}>
                      {index > 0 ? ' · ' : ''}
                      <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
                    </span>
                  ))}
                </b>
                <span>
                  {t('officeHours')}: {t('officeHoursValue')}
                </span>
              </div>
            </div>
            <div>
              <span className="av">
                <Icon name="mail" />
              </span>
              <div>
                <b>
                  {reference.ministry.emails.map((email, index) => (
                    <span key={email}>
                      {index > 0 ? ' · ' : ''}
                      <a href={`mailto:${email}`}>{email}</a>
                    </span>
                  ))}
                </b>
                <span>
                  {t('officialEmail')} · {t('donationPortal')}:{' '}
                  <a href={OFFICIAL_LINKS.donate} target="_blank" rel="noopener noreferrer">
                    donate.gov.np
                  </a>{' '}
                  ·{' '}
                  <a href={reference.ministry.website} target="_blank" rel="noopener noreferrer">
                    {reference.ministry.website.replace('https://', '')}
                  </a>
                </span>
              </div>
            </div>
          </div>
          <div className="map">
            <iframe
              src={MAP_SRC}
              title={t('map')}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Card>

        {/* The message form needs the ministry's server to deliver it; the static
            edition points to the official email address instead. */}
        {STATIC_EXPORT ? (
          <Card>
            <SectionHeader icon="mail" title={t('writeTitle')} subtitle={t('writeIntro')} />
            <div className="chips">
              {reference.ministry.emails.map((email) => (
                <a key={email} className="btn navy" href={`mailto:${email}`}>
                  <Icon name="mail" /> {email}
                </a>
              ))}
            </div>
            <div className="note" style={{ marginTop: 14 }}>
              {t('formNote')}
            </div>
          </Card>
        ) : (
          <Card>
            <SectionHeader icon="mail" title={t('messageForm')} subtitle={t('formIntro')} />
            <MessageForm />
          </Card>
        )}
      </section>
    </div>
  );
}
