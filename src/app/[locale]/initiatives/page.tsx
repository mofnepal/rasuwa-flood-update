import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { bsDate, formatNumber, type Locale } from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { publicFileUrl } from '@/lib/urls';
import { Icon } from '@/components/Icon';
import { KpiTile } from '@/components/KpiTile';
import { Card, EmptyState, SectionHeader, SourceChip } from '@/components/ui';
import { MeasureBrowser, type MeasureCategory, type MeasureItem } from './MeasureBrowser';

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
  const t = await getTranslations({ locale, namespace: 'initiatives' });
  return {
    title: t('title'),
    description: t('intro'),

    openGraph: { images: [{ url: `/og/initiatives-${locale}.png`, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', images: [`/og/initiatives-${locale}.png`] },
  };
}

export default async function InitiativesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  setRequestLocale(raw);
  const locale = raw as Locale;

  const t = await getTranslations('initiatives');
  const ts = await getTranslations('site');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;

  const decisions = await prisma.decision.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: { date_bs: 'asc' },
    include: {
      original: true,
      explainer: true,
      measures: { where: { status: 'published' }, orderBy: { no: 'asc' } },
    },
  });

  const cabinetDecisions = decisions.filter((d) => d.kind === 'cabinet_decision');
  const notices = decisions.filter((d) => d.kind === 'mof_notice' || d.kind === 'mof_decision');
  const cashSupport = decisions.filter((d) => d.kind === 'cash_support');
  const withMeasures = decisions.find((d) => d.measures.length > 0);

  const categories = (withMeasures?.categories ?? []) as unknown as MeasureCategory[];
  const measures: MeasureItem[] = (withMeasures?.measures ?? []).map((measure) => ({
    id: measure.id,
    no: measure.no,
    category_code: measure.category_code,
    category_ne: measure.category_ne,
    category_en: measure.category_en,
    agency_ne: measure.agency_ne,
    agency_en: measure.agency_en,
    title_ne: measure.title_ne,
    title_en: measure.title_en,
    who_ne: measure.who_ne,
    benefit_ne: measure.benefit_ne,
    deadline_ne: measure.deadline_ne,
    cabinet_text_ne: measure.cabinet_text_ne,
  }));

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        {withMeasures?.original ? (
          <a
            className="btn ghost sm"
            href={publicFileUrl(withMeasures.original.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="download" /> {ts('originalDocument')}
          </a>
        ) : null}
      </div>

      <section className="grid g4">
        <KpiTile
          icon="decisions"
          tone="red"
          label={t('kpiCabinet')}
          value={formatNumber(cabinetDecisions.length, locale)}
          foot={
            cabinetDecisions[0]
              ? pick(locale, cabinetDecisions[0].date_bs, cabinetDecisions[0].date_bs)
              : undefined
          }
        />
        <KpiTile
          icon="measure"
          label={t('kpiMeasures')}
          value={formatNumber(measures.length, locale)}
          foot={`${formatNumber(categories.length, locale)} · ${t('categories')}`}
        />
        <KpiTile
          icon="mail"
          label={t('kpiNotices')}
          value={formatNumber(notices.length, locale)}
          foot={notices[0] ? pick(locale, notices[0].title_ne, notices[0].title_en) : undefined}
        />
        <KpiTile
          icon="cash"
          tone="navy"
          label={t('kpiCashSupport')}
          value={
            cashSupport.length ? formatNumber(cashSupport.length, locale) : ts('awaitingEntry')
          }
          foot={
            cashSupport[0]
              ? pick(locale, cashSupport[0].summary_ne, cashSupport[0].summary_en)
              : undefined
          }
        />
      </section>

      {/* ── timeline ─────────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader icon="calendar" title={t('timeline')} />
        <div className="tl">
          {decisions.map((decision) => (
            <div key={decision.id} className={decision.kind === 'cabinet_decision' ? 'hot' : ''}>
              <span>
                {decision.date_ad
                  ? bsDate(decision.date_ad, decision.date_bs, locale)
                  : decision.date_bs}
              </span>
              <b>{pick(locale, decision.title_ne, decision.title_en)}</b>
              <i>{pick(locale, decision.issuer_ne, decision.issuer_en)}</i>
            </div>
          ))}
        </div>
      </Card>

      {/* ── decision summaries ───────────────────────────────────────────── */}
      <section className="grid g3">
        {decisions.map((decision) => (
          <Card key={decision.id}>
            <SectionHeader
              icon={
                decision.kind === 'cabinet_decision'
                  ? 'decisions'
                  : decision.kind === 'cash_support'
                    ? 'cash'
                    : 'mail'
              }
              title={pick(locale, decision.title_ne, decision.title_en)}
              subtitle={`${pick(locale, decision.issuer_ne, decision.issuer_en)} · ${
                decision.date_ad
                  ? bsDate(decision.date_ad, decision.date_bs, locale)
                  : decision.date_bs
              }`}
            />
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink)' }}>
              {pick(locale, decision.summary_ne, decision.summary_en)}
            </p>
            <div className="chips" style={{ marginTop: 12 }}>
              {decision.original ? (
                <a
                  className="btn ghost sm"
                  href={publicFileUrl(decision.original.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="download" /> {ts('originalDocument')}
                </a>
              ) : null}
              {decision.explainer ? (
                <a
                  className="btn ghost sm"
                  href={publicFileUrl(decision.explainer.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="measure" /> {t('brpTitle')}
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </section>

      {/* ── Business Recovery Plan Phase 1 ───────────────────────────────── */}
      {withMeasures ? (
        <Card id="measures">
          <SectionHeader
            icon="recovery"
            title={t('brpTitle')}
            subtitle={`${pick(locale, withMeasures.issuer_ne, withMeasures.issuer_en)} · ${
              withMeasures.date_ad
                ? bsDate(withMeasures.date_ad, withMeasures.date_bs, locale)
                : withMeasures.date_bs
            }`}
            right={
              <SourceChip>{pick(locale, withMeasures.title_ne, withMeasures.title_en)}</SourceChip>
            }
          />
          <MeasureBrowser
            categories={categories}
            measures={measures}
            originalUrl={publicFileUrl(withMeasures.original?.url)}
          />
        </Card>
      ) : (
        <EmptyState label={ts('awaitingEntry')} />
      )}
    </div>
  );
}
