import 'server-only';
import type { Agency, Network, Prisma, SnapshotPeriod } from '@prisma/client';
import { prisma } from './db';
import { getDisaster, getTotals, settlementGap } from './totals';
import { getMinistryReference } from './ministry';
import { FUND_STATUS_SOURCE_EN, OFFICIAL_LINKS } from './constants';
import { publicFileUrl } from './urls';

/**
 * The open-data payloads, built from published records only. The `/api/v1`
 * endpoints serve them with filters and paging; `/open-data/*` serves complete
 * files, which is what the static edition can offer.
 */

export type Row = Record<string, unknown>;

export type OpenData = { ok: true; body: Row; rows?: Row[] } | { ok: false; error: string };

const missing = (error: string): OpenData => ({ ok: false, error });
const NO_DISASTER = 'no active disaster';

/** The headline figures, with each source's cut-off beside them. */
export async function summary(): Promise<OpenData> {
  const totals = await getTotals();
  if (!totals) return missing(NO_DISASTER);

  return {
    ok: true,
    body: {
      as_of: totals.last_public_update,
      currency: 'NPR',
      fx_rate_usd_npr: totals.fx_rate,
      grand_total_npr: totals.grand_total_npr,
      npr_receipts: totals.npr_receipts,
      categories: {
        A_online_channels: {
          total_npr: totals.digital_npr,
          transactions: totals.digital_txn_count,
          networks: totals.networks.map((network) => ({
            network: network.network,
            total_npr: network.total_npr,
            transactions: network.txn_count,
            as_of: network.as_of,
            source: network.source,
          })),
        },
        B_handovers: {
          total_npr: totals.handover.total_npr,
          total_usd: totals.handover.total_usd,
          entries: totals.handover.entries,
          unique_donors: totals.handover.unique_donors,
          as_of: totals.handover.as_of,
          source: totals.handover.source,
        },
        C_foreign_assistance: {
          total_usd: totals.foreign.total_usd,
          total_npr_equivalent: totals.foreign.total_npr_equiv,
          as_of: totals.foreign.as_of,
        },
        D_identified_contributors: {
          note: 'A subset of category C, never added on top of it.',
          total_usd: totals.foreign.identified_usd,
          awaiting_attribution_usd: totals.foreign.unattributed_usd,
          count: totals.foreign.identified_count,
        },
      },
      fund_account_status: totals.fund_status
        ? {
            note: 'Account position of the fund. Not part of the contributions total.',
            as_of: totals.fund_status.as_of,
            source: totals.fund_status.source_en,
            npr_balance: totals.fund_status.npr.balance,
            npr_gross_after_flood: totals.fund_status.npr.gross,
            npr_usage: totals.fund_status.npr.usage,
            usd_balance: totals.fund_status.usd.balance,
            usd_gross_after_flood: totals.fund_status.usd.gross,
            total_available_npr: totals.fund_status.total_available_npr,
          }
        : null,
      settlement_gap_npr: settlementGap(totals),
      cut_offs: totals.cut_offs,
      reconciliation_note:
        'Consolidated figures are subject to reconciliation by the Fund Section of the Ministry of Finance.',
    },
  };
}

export interface ContributionQuery {
  type?: string | null;
  mode?: string | null;
  sector?: string | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
  /** Omit for every matching row. */
  page?: { skip: number; take: number };
}

/** Published handovers to the Hon. Finance Minister (category B). */
export async function contributions(query: ContributionQuery = {}): Promise<OpenData> {
  const disaster = await getDisaster();
  if (!disaster) return missing(NO_DISASTER);

  const where: Prisma.ContributionWhereInput = { disasterId: disaster.id, status: 'published' };
  if (query.type)
    where.contributor_type = query.type as Prisma.ContributionWhereInput['contributor_type'];
  if (query.mode) where.payment_mode = query.mode as Prisma.ContributionWhereInput['payment_mode'];
  if (query.sector) where.sector = query.sector;
  if (query.from || query.to) {
    where.date_ad = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }
  if (query.q) where.contributor_name = { contains: query.q, mode: 'insensitive' };

  const [total, rows, sums] = await Promise.all([
    prisma.contribution.count({ where }),
    prisma.contribution.findMany({
      where,
      orderBy: [{ date_ad: 'desc' }, { sn: 'desc' }],
      skip: query.page?.skip,
      take: query.page?.take,
    }),
    prisma.contribution.aggregate({ where, _sum: { amount_npr: true, amount_usd: true } }),
  ]);

  const data = rows.map((row) => ({
    sn: row.sn,
    date_bs: row.date_bs,
    date_ad: row.date_ad.toISOString().slice(0, 10),
    contributor: row.contributor_name,
    contributor_type: row.contributor_type,
    payment_mode: row.payment_mode,
    sector: row.sector,
    amount_npr: row.amount_npr ? Number(row.amount_npr) : null,
    amount_usd: row.amount_usd ? Number(row.amount_usd) : null,
    source: row.source,
    as_of: row.as_of.toISOString(),
    published_at: row.publishedAt?.toISOString() ?? null,
  }));

  return {
    ok: true,
    rows: data,
    body: {
      as_of: rows[0]?.as_of.toISOString() ?? null,
      source: rows[0]?.source ?? null,
      total_npr: Number(sums._sum.amount_npr ?? 0),
      total_usd: Number(sums._sum.amount_usd ?? 0),
      total,
      data,
    },
  };
}

export interface ChannelQuery {
  network?: string | null;
  period?: string | null;
  /** Every cumulative snapshot, not only the latest per network. */
  all?: boolean;
}

/** Published NCHL / Fonepay channel snapshots (category A). */
export async function channels(query: ChannelQuery = {}): Promise<OpenData> {
  const disaster = await getDisaster();
  if (!disaster) return missing(NO_DISASTER);

  const network = query.network?.toUpperCase() as Network | undefined;
  const period = (query.period ?? 'cumulative') as SnapshotPeriod;

  // Without an explicit request for all of them, the cumulative view returns only
  // the latest snapshot per network, which is what "the current figure" means.
  let rows = await prisma.channelSnapshot.findMany({
    where: {
      disasterId: disaster.id,
      status: 'published',
      period,
      ...(network ? { network } : {}),
    },
    orderBy: { snapshot_at: 'desc' },
  });
  if (period === 'cumulative' && !query.all) {
    const latestPerNetwork = new Map<string, Date>();
    for (const row of rows) {
      const seen = latestPerNetwork.get(row.network);
      if (!seen || row.snapshot_at > seen) latestPerNetwork.set(row.network, row.snapshot_at);
    }
    rows = rows.filter(
      (row) => latestPerNetwork.get(row.network)?.getTime() === row.snapshot_at.getTime(),
    );
  }

  const data = rows.map((row) => ({
    network: row.network,
    period: row.period,
    snapshot_at: row.snapshot_at.toISOString(),
    period_date: row.period_date?.toISOString().slice(0, 10) ?? null,
    channel_code: row.channel_code,
    channel_label_en: row.channel_label_en,
    channel_label_ne: row.channel_label_ne,
    txn_count: row.txn_count,
    amount_npr: Number(row.amount_npr),
    source: row.source,
  }));

  return {
    ok: true,
    rows: data,
    body: {
      as_of: data[0]?.snapshot_at ?? null,
      period,
      total_npr: data.reduce((sum, row) => sum + row.amount_npr, 0),
      total_transactions: data.reduce((sum, row) => sum + row.txn_count, 0),
      count: data.length,
      data,
    },
  };
}

/**
 * Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status
 * (Nepal Rastra Bank). Account position; not part of the contributions total.
 */
export async function fundStatus(): Promise<OpenData> {
  const totals = await getTotals();
  if (!totals) return missing(NO_DISASTER);
  if (!totals.fund_status) return missing('no published statement');

  const fund = totals.fund_status;
  return {
    ok: true,
    body: {
      as_of: fund.as_of,
      as_of_bs: fund.as_of_bs,
      as_of_en: fund.as_of_en,
      source: FUND_STATUS_SOURCE_EN,
      note: 'Account position of the fund. The NPR side is not added to the contributions total; the USD gross is category C.',
      fx_rate_usd_npr: fund.fx_rate,
      npr: fund.npr,
      usd: fund.usd,
      dates_bs: fund.dates_bs,
      dates_ad: fund.dates_ad,
      total_available_npr: fund.total_available_npr,
      original_document: fund.original_url,
    },
  };
}

/** Identified foreign contributors (category D), a subset of category C. */
export async function foreign(): Promise<OpenData> {
  const totals = await getTotals();
  if (!totals) return missing(NO_DISASTER);

  const rows = await prisma.foreignAssistance.findMany({
    where: { disasterId: totals.disasterId, status: 'published' },
    orderBy: [{ featured: 'desc' }, { amount_usd: 'desc' }],
  });

  const data = rows.map((row) => ({
    date_bs: row.date_bs,
    date_ad: row.date_ad.toISOString().slice(0, 10),
    contributor: row.contributor,
    country: row.country_en,
    country_iso2: row.country_iso2,
    contributor_type: row.contributor_type,
    kind: row.kind,
    channel: row.channel,
    amount_usd: row.amount_usd ? Number(row.amount_usd) : null,
    amount_npr_equivalent: row.amount_npr_equiv ? Number(row.amount_npr_equiv) : null,
    in_kind_valuation_npr: row.in_kind_valuation_npr ? Number(row.in_kind_valuation_npr) : null,
    purpose_en: row.purpose_en,
    purpose_ne: row.purpose_ne,
    featured: row.featured,
    source: row.source,
    as_of: row.as_of.toISOString(),
  }));

  return {
    ok: true,
    rows: data,
    body: {
      as_of: totals.foreign.as_of,
      note: "Identified contributors are a subset of the total deposited in the fund's USD accounts.",
      total_deposited_usd: totals.foreign.total_usd,
      identified_usd: totals.foreign.identified_usd,
      awaiting_attribution_usd: totals.foreign.unattributed_usd,
      fx_rate_usd_npr: totals.fx_rate,
      count: data.length,
      data,
    },
  };
}

type ReportWithOriginal = Prisma.RescueReportGetPayload<{ include: { original: true } }>;

const reportShape = (report: ReportWithOriginal) => ({
  agency: report.agency,
  report_at: report.report_at.toISOString(),
  report_at_bs: report.report_at_bs,
  source: report.source,
  original_document: publicFileUrl(report.original?.url),
  data: report.data,
});

/** The newest published report from each agency. */
export async function rescueLatest(): Promise<OpenData> {
  const disaster = await getDisaster();
  if (!disaster) return missing(NO_DISASTER);

  const latest = (agency: Agency) =>
    prisma.rescueReport.findFirst({
      where: { disasterId: disaster.id, status: 'published', agency },
      orderBy: { report_at: 'desc' },
      include: { original: true },
    });
  const [ndrrma, police] = await Promise.all([latest('NDRRMA'), latest('NEPAL_POLICE')]);

  return {
    ok: true,
    body: {
      as_of: ndrrma?.report_at.toISOString() ?? null,
      note: 'Mirrors the figures published by NDRRMA and Nepal Police. The list of rescued persons is not held here — see rescued_persons_list.',
      rescued_persons_list: OFFICIAL_LINKS.rescuedPersons,
      rescue_request_portal: OFFICIAL_LINKS.rescueRequest,
      ndrrma: ndrrma ? reportShape(ndrrma) : null,
      nepal_police: police ? reportShape(police) : null,
    },
  };
}

export interface ReportQuery {
  agency?: string | null;
  /** Omit for every report. */
  page?: { skip: number; take: number };
}

/** Archive of every published daily report. */
export async function rescueReports(query: ReportQuery = {}): Promise<OpenData> {
  const disaster = await getDisaster();
  if (!disaster) return missing(NO_DISASTER);

  const agency = query.agency?.toUpperCase() as Agency | undefined;
  const where: Prisma.RescueReportWhereInput = {
    disasterId: disaster.id,
    status: 'published',
    ...(agency ? { agency } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.rescueReport.count({ where }),
    prisma.rescueReport.findMany({
      where,
      orderBy: { report_at: 'desc' },
      skip: query.page?.skip,
      take: query.page?.take,
      include: { original: true },
    }),
  ]);

  return {
    ok: true,
    body: {
      as_of: rows[0]?.report_at.toISOString() ?? null,
      total,
      data: rows.map(reportShape),
    },
  };
}

/** Published Cabinet decisions, ministry notices and their relief measures. */
export async function decisions(): Promise<OpenData> {
  const disaster = await getDisaster();
  if (!disaster) return missing(NO_DISASTER);

  const rows = await prisma.decision.findMany({
    where: { disasterId: disaster.id, status: 'published' },
    orderBy: { date_bs: 'asc' },
    include: {
      original: true,
      explainer: true,
      measures: { where: { status: 'published' }, orderBy: { no: 'asc' } },
    },
  });

  return {
    ok: true,
    body: {
      as_of: rows.at(-1)?.publishedAt?.toISOString() ?? null,
      count: rows.length,
      data: rows.map((row) => ({
        slug: row.slug,
        kind: row.kind,
        date_bs: row.date_bs,
        date_ad: row.date_ad?.toISOString().slice(0, 10) ?? null,
        issuer_en: row.issuer_en,
        issuer_ne: row.issuer_ne,
        title_en: row.title_en,
        title_ne: row.title_ne,
        summary_en: row.summary_en,
        summary_ne: row.summary_ne,
        categories: row.categories,
        original_document: publicFileUrl(row.original?.url),
        explainer_document: publicFileUrl(row.explainer?.url),
        measures: row.measures.map((measure) => ({
          no: measure.no,
          category_code: measure.category_code,
          category_ne: measure.category_ne,
          category_en: measure.category_en,
          title_ne: measure.title_ne,
          title_en: measure.title_en,
          who_ne: measure.who_ne,
          benefit_ne: measure.benefit_ne,
          deadline_ne: measure.deadline_ne,
          agency_ne: measure.agency_ne,
          agency_en: measure.agency_en,
          cabinet_text_ne: measure.cabinet_text_ne,
        })),
      })),
    },
  };
}

/** Single-window contacts and the ministry's own details. */
export async function contacts(): Promise<OpenData> {
  const [rows, reference] = await Promise.all([
    prisma.contact.findMany({ where: { visible: true }, orderBy: { order: 'asc' } }),
    getMinistryReference(),
  ]);

  return {
    ok: true,
    body: {
      ministry: reference.ministry,
      external_portals: reference.external_portals,
      count: rows.length,
      data: rows.map((contact) => ({
        group_ne: contact.group_ne,
        group_en: contact.group_en,
        title_ne: contact.title_ne,
        title_en: contact.title_en,
        name_ne: contact.name_ne,
        name_en: contact.name_en,
        phone: contact.phone,
        email: contact.email,
      })),
    },
  };
}
