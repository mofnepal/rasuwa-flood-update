import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { prisma } from '@/lib/db';
import { getTotals } from '@/lib/totals';
import { pageMetadata } from '@/lib/metadata';
import { bsDate, formatNumber, type Locale } from '@/lib/format';
import { pick } from '@/lib/i18n-helpers';
import { publicFileUrl } from '@/lib/urls';
import {
  actionPlanSchema,
  actionsByAgency,
  actionsByTheme,
  deadlineDate,
  deadlineLabel,
  nextDeadline,
  type ActionPlanData,
} from '@/lib/action-plan';
import { Icon } from '@/components/Icon';
import { KpiTile } from '@/components/KpiTile';
import { Card, EmptyState, Note, SectionHeader, SourceChip } from '@/components/ui';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { HBar } from '@/components/charts/HBar';
import { Donut } from '@/components/charts/Donut';
import { CHART_COLORS } from '@/components/charts/chart-theme';
import { PlanDashboard } from './PlanDashboard';

export async function planMetadata(locale: string, slug?: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'plans' });
  const site = await getTranslations({ locale, namespace: 'site' });
  let title = t('title');
  let description = t('intro');
  if (slug) {
    const plan = await prisma.actionPlan.findFirst({ where: { slug, status: 'published' } });
    if (plan) {
      title = locale === 'ne' ? plan.title_ne : plan.title_en;
      description = locale === 'ne' ? plan.summary_ne : plan.summary_en;
    }
  }
  return pageMetadata({
    locale,
    path: slug ? `/plans/${slug}` : '/plans',
    card: 'plans',
    title,
    description,
    siteName: site('portal'),
    imageAlt: site('shareImageAlt'),
  });
}

/**
 * One government action plan as a dashboard — the headline counts, the roadmap
 * of deadlines, the split by theme and by responsible body, and every action as
 * the document words it — with the other published plans listed beneath, so a
 * later plan takes its place here without a change to the page.
 */
export async function PlanView({ locale, slug }: { locale: Locale; slug?: string }) {
  const t = await getTranslations('plans');
  const ts = await getTranslations('site');

  const totals = await getTotals();
  if (!totals) return <EmptyState label={ts('awaitingEntry')} />;

  const plans = await prisma.actionPlan.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: { date_ad: 'desc' },
    include: { original: true },
  });
  const selected = slug ? plans.find((plan) => plan.slug === slug) : plans[0];
  if (slug && !selected) notFound();
  if (!selected) return <EmptyState label={ts('awaitingEntry')} />;

  const plan: ActionPlanData = actionPlanSchema.parse(selected.data);
  const byAgency = actionsByAgency(plan);
  const byTheme = actionsByTheme(plan);
  const immediate = plan.actions.filter((action) => action.deadline.kind === 'immediate');
  const prompt = plan.actions.filter((action) => action.deadline.kind === 'prompt');
  const undated = plan.actions.filter((action) => action.deadline.kind === 'none');
  const next = nextDeadline(plan);
  const themeSlices = byTheme.map(({ theme, actions }) => ({
    name: locale === 'ne' ? theme.name_ne : theme.name_en,
    value: actions.length,
  }));
  const nextDate = next ? deadlineDate(next.actions[0]!.deadline) : null;
  const issued = bsDate(selected.date_ad, selected.date_bs, locale);

  return (
    <div className="stack">
      <div className="ph">
        <div>
          <h1>{t('title')}</h1>
          <p>{t('intro')}</p>
        </div>
      </div>

      {/* ── the plan ─────────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          icon="recovery"
          title={pick(locale, selected.title_ne, selected.title_en)}
          subtitle={`${pick(locale, selected.issuer_ne, selected.issuer_en)} · ${t('issued')} ${issued}`}
          right={
            selected.original ? (
              <a
                className="btn ghost sm"
                href={publicFileUrl(selected.original.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="download" /> {ts('originalDocument')}
              </a>
            ) : (
              <SourceChip>{issued}</SourceChip>
            )
          }
        />
        <p className="lede">{pick(locale, selected.summary_ne, selected.summary_en)}</p>

        <section className="grid g4" style={{ marginTop: 14 }}>
          <KpiTile
            icon="measure"
            tone="red"
            label={t('kpiActions')}
            value={formatNumber(plan.actions.length, locale)}
            foot={`${formatNumber(byTheme.length, locale)} ${locale === 'ne' ? 'विषय' : 'themes'}`}
          />
          <KpiTile
            icon="organisation"
            label={t('kpiAgencies')}
            value={formatNumber(byAgency.length, locale)}
            foot={byAgency
              .map(
                ({ agency, actions }) =>
                  `${locale === 'ne' ? agency.short_ne : agency.short_en} ${formatNumber(actions.length, locale)}`,
              )
              .join(' · ')}
          />
          <KpiTile
            icon="clock"
            label={t('kpiImmediate')}
            value={formatNumber(immediate.length + prompt.length, locale)}
            foot={[
              immediate.length
                ? `${deadlineLabel({ kind: 'immediate' }, locale)} ${formatNumber(immediate.length, locale)}`
                : null,
              prompt.length
                ? `${deadlineLabel({ kind: 'prompt' }, locale)} ${formatNumber(prompt.length, locale)}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          />
          <KpiTile
            icon="calendar"
            tone="navy"
            label={t('kpiNext')}
            value={next ? deadlineLabel(next.actions[0]!.deadline, locale) : '—'}
            foot={
              next
                ? `${nextDate ? bsDate(nextDate, null, locale) : ''} · ${t('kpiNextSub', {
                    count: formatNumber(next.actions.length, locale),
                  })}${undated.length ? ` · ${formatNumber(undated.length, locale)} ${t('kpiUndated')}` : ''}`
                : undefined
            }
          />
        </section>
      </Card>

      {/* ── why, and the split by theme and by body ──────────────────────── */}
      <section className="grid g3">
        <Card>
          <SectionHeader icon="flag" title={t('why')} />
          <p className="prose">{pick(locale, plan.context_ne, plan.context_en)}</p>
        </Card>
        <Card>
          <SectionHeader icon="chart" title={t('byTheme')} />
          <div className="donutbox">
            <Donut
              data={themeSlices}
              unit="count"
              centreValue={formatNumber(plan.actions.length, locale)}
              centreLabel={t('actions')}
              ariaLabel={`${t('byTheme')}: ${themeSlices
                .map((slice) => `${slice.name} ${formatNumber(slice.value, locale)}`)
                .join(', ')}`}
            />
            <div className="legend">
              {themeSlices.map((slice, index) => (
                <div key={slice.name}>
                  <i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                  <b>{slice.name}</b>
                  <span>{formatNumber(slice.value, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <SectionHeader icon="organisation" title={t('byAgency')} />
          <ChartFrame height={Math.max(220, byAgency.length * 34 + 40)}>
            <HBar
              data={byAgency.map(({ agency, actions }) => ({
                name: locale === 'ne' ? agency.short_ne : agency.short_en,
                value: actions.length,
              }))}
              unit="count"
              multicolour
            />
          </ChartFrame>
          <Note>{t('byAgencyNote')}</Note>
        </Card>
      </section>

      {/* ── roadmap and the actions ──────────────────────────────────────── */}
      <Card id="actions">
        <SectionHeader icon="calendar" title={t('roadmap')} subtitle={t('roadmapSub')} />
        <PlanDashboard plan={plan} />
        <Note>
          {t('originalNote')} {t('unstatedAgency')}
          {plan.note_ne || plan.note_en
            ? ` ${pick(locale, plan.note_ne ?? '', plan.note_en ?? '')}`
            : ''}
        </Note>
      </Card>

      {/* ── every plan ───────────────────────────────────────────────────── */}
      {plans.length > 1 ? (
        <Card>
          <SectionHeader icon="decisions" title={t('allPlans')} />
          <div className="tscroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('issued')}</th>
                  <th>{t('plan')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((entry) => {
                  const count = (entry.data as { actions?: unknown[] }).actions?.length ?? 0;
                  return (
                    <tr key={entry.id}>
                      <td className="nm">{bsDate(entry.date_ad, entry.date_bs, locale)}</td>
                      <td>
                        <Link
                          href={entry.id === plans[0]!.id ? '/plans' : `/plans/${entry.slug}`}
                          aria-current={entry.id === selected.id ? 'page' : undefined}
                        >
                          {pick(locale, entry.title_ne, entry.title_en)}
                        </Link>
                        <br />
                        <small>{pick(locale, entry.issuer_ne, entry.issuer_en)}</small>
                      </td>
                      <td className="amt">{formatNumber(count, locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
