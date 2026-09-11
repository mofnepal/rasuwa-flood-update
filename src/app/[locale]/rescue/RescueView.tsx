import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { publicFileUrl } from '@/lib/urls';
import { pageMetadata } from '@/lib/metadata';
import { getTotals } from '@/lib/totals';
import { prisma } from '@/lib/db';
import { OFFICIAL_LINKS, PALETTE } from '@/lib/constants';
import { bsDate, formatNPR, formatNumber, type Locale } from '@/lib/format';
import { breakdownLabel, districtName, type NdrrmaReport, type PoliceReport } from '@/lib/rescue';
import { pick } from '@/lib/i18n-helpers';
import { Icon } from '@/components/Icon';
import { KpiTile } from '@/components/KpiTile';
import { Card, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HBar, VBar } from '@/components/charts/lazy';
import { LiveEmbed } from './LiveEmbed';
import { DistrictTable, type DistrictRow } from './DistrictTable';

/** Shared by /rescue (the latest report) and /rescue/<date> (an earlier one). */
export async function rescueMetadata(locale: string, date?: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'rescue' });
  const site = await getTranslations({ locale, namespace: 'site' });
  return pageMetadata({
    locale,
    path: date ? `/rescue/${date}` : '/rescue',
    card: 'rescue',
    title: t('title'),
    description: t('intro'),
    siteName: site('portal'),
    imageAlt: site('shareImageAlt'),
  });
}

/**
 * The rescue section. With no date it shows the newest NDRRMA report; with a
 * date (`2026-09-08`) it shows that day's report, and each date has its own
 * address so the static edition can serve it as a page.
 */
export async function RescueView({ locale, date }: { locale: Locale; date?: string }) {
  const t = await getTranslations('rescue');
  const ts = await getTranslations('site');
  const tt = await getTranslations('table');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;

  const reports = await prisma.rescueReport.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: { report_at: 'desc' },
    include: { original: true },
  });

  const ndrrmaReports = reports.filter((report) => report.agency === 'NDRRMA');
  const dateKey = (report: { report_at: Date }) => report.report_at.toISOString().slice(0, 10);
  const selected = date
    ? ndrrmaReports.find((report) => dateKey(report) === date)
    : ndrrmaReports[0];
  if (date && !selected) notFound();
  const policeReport = reports.find((report) => report.agency === 'NEPAL_POLICE');

  const ndrrma = (selected?.data ?? null) as NdrrmaReport | null;
  const police = (policeReport?.data ?? null) as PoliceReport | null;

  const portals = [
    {
      url: OFFICIAL_LINKS.rescueRequest,
      ne: 'उद्धार अनुरोध पोर्टल',
      en: 'Rescue request portal',
      owner: 'OPMCM',
      icon: 'rescue' as const,
    },
    {
      url: OFFICIAL_LINKS.rescuedPersons,
      ne: 'उद्धार गरिएका व्यक्तिहरूको विवरण',
      en: 'Rescued persons list',
      owner: 'NDRRMA',
      icon: 'rescuedPersons' as const,
    },
    {
      url: OFFICIAL_LINKS.commandCentre,
      ne: 'SETU — कमाण्ड सेन्टर',
      en: 'SETU command centre',
      owner: 'NDRRMA',
      icon: 'security' as const,
    },
  ];

  const districtRows: DistrictRow[] = ndrrma
    ? [
        ...new Set([
          ...Object.keys(ndrrma.bodies_by_district),
          ...Object.keys(ndrrma.holding_center_breakdown),
          ...Object.keys(ndrrma.electricity_restored_pct ?? {}),
        ]),
      ].map((district) => ({
        district,
        bodies: ndrrma.bodies_by_district[district] ?? 0,
        // Reports have keyed this either way — "DAO Rasuwa" and, more recently, "Rasuwa".
        missing:
          ndrrma.missing_breakdown[`DAO ${district}`] ?? ndrrma.missing_breakdown[district] ?? 0,
        holding: ndrrma.holding_center_breakdown[district] ?? 0,
        electricity: ndrrma.electricity_restored_pct?.[district] ?? null,
        cash_support: ndrrma.cash_support_npr[district] ?? 0,
      }))
    : [];

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
        {selected?.original ? (
          <a
            className="btn ghost sm"
            href={publicFileUrl(selected.original.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="download" /> {ts('originalDocument')}
          </a>
        ) : null}
      </div>

      {/* ── official rescue portals ──────────────────────────────────────── */}
      <section className="banner">
        <div className="lead">
          <span className="live" style={{ color: '#fff' }}>
            <i />
            {ts('live')}
          </span>
          <b>{t('portalsTitle')}</b>
          <span>{t('portalsSub')}</span>
        </div>
        <div className="links">
          {portals.map((portal) => (
            <a key={portal.url} href={portal.url} target="_blank" rel="noopener noreferrer">
              <b>
                <Icon name={portal.icon} />
                {locale === 'ne' ? portal.ne : portal.en}
              </b>
              <span>{portal.owner}</span>
              <i>{portal.url.replace('https://', '').replace(/\/$/, '')}</i>
            </a>
          ))}
        </div>
      </section>

      {/* ── date tabs ────────────────────────────────────────────────────── */}
      {ndrrmaReports.length > 1 ? (
        <div className="tabs">
          {ndrrmaReports.map((report, index) => {
            const active = report.id === selected?.id;
            return (
              <Link
                key={report.id}
                className={active ? 'on' : ''}
                aria-current={active ? 'page' : undefined}
                href={index === 0 ? '/rescue' : `/rescue/${dateKey(report)}`}
              >
                {bsDate(report.report_at, report.report_at_bs, locale)}
              </Link>
            );
          })}
        </div>
      ) : null}

      {ndrrma && selected ? (
        <>
          <Card>
            <SectionHeader
              icon="rescue"
              title={t('title')}
              subtitle={`${selected.source} · ${bsDate(selected.report_at, selected.report_at_bs, locale)}`}
              right={<SourceChip>NDRRMA</SourceChip>}
            />
            <div className="grid g6">
              <KpiTile
                icon="rescuedPersons"
                tone="red"
                label={t('rescued')}
                value={formatNumber(ndrrma.rescued_till_date, locale)}
                foot={`${t('helicopterFlights')}: ${formatNumber(
                  ndrrma.helicopter_flights.nepali_army_total +
                    (ndrrma.helicopter_flights.apf ?? 0) +
                    (ndrrma.helicopter_flights.private_from_kathmandu ?? 0),
                  locale,
                )}`}
              />
              <KpiTile
                icon="casualties"
                label={t('casualties')}
                value={formatNumber(ndrrma.human_casualties, locale)}
                foot={`${t('bodiesManaged')}: ${formatNumber(ndrrma.dead_body_handover, locale)}${
                  pick(locale, ndrrma.bodies_note_ne, ndrrma.bodies_note_en)
                    ? ` · ${pick(locale, ndrrma.bodies_note_ne, ndrrma.bodies_note_en)}`
                    : ''
                }`}
              />
              <KpiTile
                icon="missing"
                label={t('missing')}
                value={formatNumber(ndrrma.missing_total_approx, locale)}
                foot={Object.entries(ndrrma.missing_breakdown)
                  .map(
                    ([key, value]) =>
                      `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                  )
                  .join(' · ')}
              />
              <KpiTile
                icon="injured"
                label={t('injured')}
                sub={ndrrma.injured_total_derived ? t('derivedTotal') : undefined}
                value={
                  ndrrma.injured_receiving_treatment != null
                    ? formatNumber(ndrrma.injured_receiving_treatment, locale)
                    : ts('awaitingEntry')
                }
                foot={Object.entries(ndrrma.injured_breakdown)
                  .map(
                    ([key, value]) =>
                      `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                  )
                  .join(' · ')}
              />
              <KpiTile
                icon="holdingCentre"
                label={
                  ndrrma.holding_centers_count
                    ? t('holdingCentresCount', {
                        count: formatNumber(ndrrma.holding_centers_count, locale),
                      })
                    : t('holdingCentre')
                }
                value={formatNumber(ndrrma.holding_center_people, locale)}
                foot={Object.entries(ndrrma.holding_center_breakdown)
                  .map(
                    ([key, value]) => `${districtName(key, locale)} ${formatNumber(value, locale)}`,
                  )
                  .join(' · ')}
              />
              <KpiTile
                icon="security"
                label={t('security')}
                value={formatNumber(ndrrma.security_personnel_mobilised, locale)}
                foot={Object.entries(ndrrma.security_breakdown)
                  .map(
                    ([key, value]) =>
                      `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                  )
                  .join(' · ')}
              />
            </div>
          </Card>

          <section className="grid g2">
            <Card>
              <SectionHeader
                icon="chart"
                title={t('bodiesByDistrict')}
                right={<SourceChip>NDRRMA</SourceChip>}
              />
              <ChartFrame height={260}>
                <VBar
                  data={Object.entries(ndrrma.bodies_by_district).map(([district, value]) => ({
                    name: districtName(district, locale),
                    value,
                  }))}
                  unit="count"
                />
              </ChartFrame>
            </Card>
            <Card>
              <SectionHeader
                icon="missing"
                title={t('missingBySource')}
                right={<SourceChip>NDRRMA</SourceChip>}
              />
              <ChartFrame height={260}>
                <HBar
                  data={Object.entries(ndrrma.missing_breakdown).map(([source, value]) => ({
                    name: breakdownLabel(source, locale),
                    value,
                  }))}
                  unit="count"
                  color={PALETTE.crimson}
                />
              </ChartFrame>
            </Card>
          </section>

          {/* ── additional NDRRMA detail ───────────────────────────────── */}
          <details className="acc">
            <summary>
              <Icon name="chart" /> {t('moreDetail')}
            </summary>
            <div className="b">
              <div>
                <b>{t('helicopterFlights')}</b>
                {[
                  `${formatNumber(ndrrma.helicopter_flights.nepali_army_total, locale)}${
                    ndrrma.helicopter_flights.nepali_army_total_as_of
                      ? ` (${t('flightsAsOf', {
                          date: bsDate(
                            ndrrma.helicopter_flights.nepali_army_total_as_of,
                            null,
                            locale,
                          ),
                        })})`
                      : ''
                  }`,
                  ndrrma.helicopter_flights.apf != null
                    ? `${t('apfFlights')}: ${formatNumber(ndrrma.helicopter_flights.apf, locale)}`
                    : null,
                  ndrrma.helicopter_flights.private_from_kathmandu != null
                    ? formatNumber(ndrrma.helicopter_flights.private_from_kathmandu, locale)
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              {ndrrma.missing_rasuwa_breakdown ? (
                <div>
                  <b>{t('missingFromRasuwa')}</b>
                  {Object.entries(ndrrma.missing_rasuwa_breakdown)
                    .map(
                      ([key, value]) =>
                        `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                    )
                    .join(' · ')}
                </div>
              ) : null}
              {ndrrma.missing_nuwakot_breakdown ? (
                <div>
                  <b>{t('missingFromNuwakot')}</b>
                  {Object.entries(ndrrma.missing_nuwakot_breakdown)
                    .map(
                      ([key, value]) =>
                        `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                    )
                    .join(' · ')}
                </div>
              ) : null}
              {pick(locale, ndrrma.dna_note_ne, ndrrma.dna_note_en) ? (
                <div>
                  <b>{t('dnaNote')}</b>
                  {pick(locale, ndrrma.dna_note_ne, ndrrma.dna_note_en)}
                </div>
              ) : null}
              {ndrrma.electricity_restored_pct ? (
                <div>
                  <b>{t('electricity')}</b>
                  {Object.entries(ndrrma.electricity_restored_pct)
                    .map(
                      ([district, pct]) =>
                        `${districtName(district, locale)} ${formatNumber(pct, locale, pct % 1 ? 1 : 0)}%`,
                    )
                    .join(' · ')}
                </div>
              ) : null}
              <div>
                <b>{t('cashSupport')}</b>
                {Object.entries(ndrrma.cash_support_npr)
                  .map(
                    ([key, value]) => `${breakdownLabel(key, locale)} ${formatNPR(value, locale)}`,
                  )
                  .join(' · ')}
              </div>
              {ndrrma.psychosocial_health_personnel != null ? (
                <div>
                  <b>{t('psychosocial')}</b>
                  {formatNumber(ndrrma.psychosocial_health_personnel, locale)}
                </div>
              ) : null}
              {ndrrma.fuel_stock ? (
                <div>
                  <b>{t('fuelStock')}</b>
                  {Object.entries(ndrrma.fuel_stock)
                    .map(
                      ([key, value]) =>
                        `${breakdownLabel(key, locale)} ${formatNumber(value, locale)}`,
                    )
                    .join(' · ')}
                </div>
              ) : null}
              {ndrrma.telecom_towers ? (
                <div>
                  <b>{t('telecomTowers')}</b>
                  {Object.entries(ndrrma.telecom_towers)
                    .map(
                      ([key, pair]) =>
                        `${key} ${formatNumber(pair[0] ?? 0, locale)}/${formatNumber(pair[1] ?? 0, locale)}`,
                    )
                    .join(' · ')}
                </div>
              ) : null}
              {ndrrma.relief_supplies_ne || ndrrma.relief_supplies_en ? (
                <div>
                  <b>{t('reliefSupplies')}</b>
                  {locale === 'ne' ? ndrrma.relief_supplies_ne : ndrrma.relief_supplies_en}
                </div>
              ) : null}
              {ndrrma.bridge_note_ne || ndrrma.bridge_note_en ? (
                <div>
                  <b>{t('bridge')}</b>
                  {locale === 'ne' ? ndrrma.bridge_note_ne : ndrrma.bridge_note_en}
                </div>
              ) : null}
            </div>
          </details>

          {pick(locale, ndrrma.injured_note_ne, ndrrma.injured_note_en) ? (
            <Note>{pick(locale, ndrrma.injured_note_ne, ndrrma.injured_note_en)}</Note>
          ) : null}
          {pick(locale, ndrrma.missing_note_ne, ndrrma.missing_note_en) ? (
            <Note>{pick(locale, ndrrma.missing_note_ne, ndrrma.missing_note_en)}</Note>
          ) : null}
          {pick(locale, ndrrma.footer_note_ne, ndrrma.footer_note_en) ? (
            <Note>{pick(locale, ndrrma.footer_note_ne, ndrrma.footer_note_en)}</Note>
          ) : null}
        </>
      ) : (
        <EmptyState label={ts('awaitingEntry')} />
      )}

      {/* ── Nepal Police panel ───────────────────────────────────────────── */}
      {police && policeReport ? (
        <Card>
          <SectionHeader
            icon="security"
            title={t('policePanel')}
            subtitle={`${policeReport.source} · ${bsDate(policeReport.report_at, policeReport.report_at_bs, locale)}`}
            right={
              <>
                <SourceChip>{t('policePanel')}</SourceChip>
                {policeReport.original ? (
                  <a
                    className="btn ghost sm"
                    href={publicFileUrl(policeReport.original.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="download" /> {ts('originalDocument')}
                  </a>
                ) : null}
              </>
            }
          />
          <div className="arch">
            <div>
              <b>{t('bodiesFound')}</b>
              <span>
                {t('male')} {formatNumber(police.bodies_found.male, locale)} · {t('female')}{' '}
                {formatNumber(police.bodies_found.female, locale)} · {t('partialRemains')}{' '}
                {formatNumber(police.bodies_found.partial_remains, locale)}
              </span>
              <i>{formatNumber(police.bodies_found.total, locale)}</i>
            </div>
            <div>
              <b>{t('bodiesManaged')}</b>
              <span>{formatNumber(police.bodies_managed_buried, locale)}</span>
              <i>
                {t('unidentifiedUploaded')}{' '}
                {formatNumber(police.unidentified_uploaded_to_website, locale)}
              </i>
            </div>
            <div>
              <b>{t('missing')}</b>
              <span>
                {t('domestic')} {formatNumber(police.missing.domestic.total, locale)} ·{' '}
                {t('foreignNationals')} {formatNumber(police.missing.foreign.total, locale)}
              </span>
              <i>{formatNumber(police.missing.total, locale)}</i>
            </div>
            <div>
              <b>{t('dnaSamples')}</b>
              <span>
                {formatNumber(police.dna.deceased, locale)} ·{' '}
                {formatNumber(police.dna.relatives, locale)}
              </span>
              <i>{formatNumber(police.dna.total, locale)}</i>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── district table ───────────────────────────────────────────────── */}
      {districtRows.length ? (
        <Card>
          <SectionHeader
            icon="location"
            title={t('districtTable')}
            right={<SourceChip>NDRRMA</SourceChip>}
          />
          <DistrictTable rows={districtRows} />
        </Card>
      ) : null}

      {/* ── live NDRRMA list ─────────────────────────────────────────────── */}
      <Card>
        <SectionHeader icon="rescuedPersons" title={t('liveEmbed')} subtitle={t('embedNote')} />
        <LiveEmbed url={OFFICIAL_LINKS.rescuedPersons} title={t('liveEmbed')} />
        <Note>{t('embedNote')}</Note>
      </Card>

      {/* ── daily report archive ─────────────────────────────────────────── */}
      <Card>
        <SectionHeader icon="calendar" title={t('archive')} />
        <div className="tscroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('reportDate')}</th>
                <th>{t('agency')}</th>
                <th>{ts('source')}</th>
                <th>{tt('verified')}</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="nm">{bsDate(report.report_at, report.report_at_bs, locale)}</td>
                  <td>{report.agency === 'NDRRMA' ? 'NDRRMA' : t('policePanel')}</td>
                  <td>{report.source}</td>
                  <td>
                    {report.original ? (
                      <a
                        className="btn ghost sm"
                        href={publicFileUrl(report.original.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon name="download" /> {ts('originalDocument')}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
