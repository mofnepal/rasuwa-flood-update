import 'server-only';
import { unstable_cache } from 'next/cache';
import { publicFileUrl } from './urls';
import type { Network, Prisma } from '@prisma/client';
import { prisma } from './db';
import { DEFAULT_FX_USD_NPR, DISASTER_SLUG, SETTING_KEYS } from './constants';

/**
 * The four contribution categories, and the one place the grand total is computed.
 *
 *   A  Online / banking channels (NPR)   — latest published cumulative snapshot per network
 *   B  Handovers to the Hon. Finance Minister (NPR) — published Contribution rows, NPR only
 *   C  Foreign assistance (USD)          — USD gross on the Fund status statement
 *   D  Identified foreign contributors   — a SUBSET of C, never added on top
 *
 *   Grand total = A + B + C × FX
 *
 * The NPR side of the Fund status statement is account status. It is reported on
 * its own and is never added to the contributions total.
 */

const num = (value: Prisma.Decimal | number | string | null | undefined): number =>
  value == null ? 0 : Number(value);

export interface ChannelLine {
  code: string;
  label_ne: string;
  label_en: string;
  txn_count: number;
  amount_npr: number;
}

export interface NetworkTotals {
  network: Network;
  total_npr: number;
  txn_count: number;
  as_of: string | null;
  source: string | null;
  channels: ChannelLine[];
  /** Cumulative history, oldest first, for the trend charts. */
  history: { as_of: string; total_npr: number; txn_count: number }[];
  /** Per-day figures where the network publishes them (Fonepay). */
  daily: { date: string; total_npr: number; txn_count: number }[];
}

export interface FundStatusView {
  as_of: string;
  as_of_bs: string;
  as_of_en: string;
  source_ne: string;
  source_en: string;
  fx_rate: number;
  npr: {
    before: number;
    balance: number;
    gross: number;
    usage: number;
    usage_note_ne: string | null;
    usage_note_en: string | null;
    banks: [string, number, number][];
    balance_series: number[];
    gross_series: number[];
    daily_series: number[];
  };
  usd: {
    before: number;
    balance: number;
    gross: number;
    equiv_npr: number;
    banks: [string, number, number][];
    balance_series: number[];
    gross_series: number[];
    daily_series: number[];
  };
  dates_bs: string[];
  dates_ad: string[];
  /** The column the statement compares against, e.g. the previous day. */
  compare_bs: string;
  compare_en: string;
  total_available_npr: number;
  original_url: string | null;
}

export interface PortalTotals {
  disasterId: string;
  fx_rate: number;
  /** A — one entry per network with a published cumulative snapshot. */
  networks: NetworkTotals[];
  digital_npr: number;
  digital_txn_count: number;
  /** B */
  handover: {
    total_npr: number;
    total_usd: number;
    entries: number;
    unique_donors: number;
    institutional_npr: number;
    individual_npr: number;
    institutional_count: number;
    individual_count: number;
    cheque_npr: number;
    bank_transfer_npr: number;
    cheque_count: number;
    bank_transfer_count: number;
    average_npr: number;
    as_of: string | null;
    source: string | null;
    by_day: { date_bs: string; date_ad: string; total_npr: number; entries: number }[];
    by_sector: { sector: string; total_npr: number; entries: number }[];
    /** The dates the register covers, in the order the source list gives them. */
    dates_covered: string[];
    /** A run of serial numbers the Fund Section has not yet supplied, if any. */
    serial_gaps: { from: number; to: number }[];
  };
  /** A + B */
  npr_receipts: number;
  /** C */
  foreign: {
    total_usd: number;
    total_npr_equiv: number;
    identified_usd: number;
    unattributed_usd: number;
    identified_count: number;
    cash_usd: number;
    in_kind_npr: number;
    pledged_usd: number;
    as_of: string | null;
  };
  fund_status: FundStatusView | null;
  /** A + B + C × FX */
  grand_total_npr: number;
  /** Cut-off time per source, printed beneath every combined figure. */
  cut_offs: { key: string; label_ne: string; label_en: string; as_of: string | null }[];
  last_public_update: string | null;
}

async function fxRate(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEYS.fxUsdNpr } });
  const value = setting?.value as { rate?: number } | null;
  return value?.rate ?? DEFAULT_FX_USD_NPR;
}

export async function getDisaster(slug: string = DISASTER_SLUG) {
  return prisma.disaster.findUnique({ where: { slug } });
}

/** Latest published cumulative snapshot for one network, plus its history. */
async function networkTotals(disasterId: string, network: Network): Promise<NetworkTotals | null> {
  const latest = await prisma.channelSnapshot.findFirst({
    where: { disasterId, network, period: 'cumulative', status: 'published' },
    orderBy: { snapshot_at: 'desc' },
  });
  if (!latest) return null;

  const rows = await prisma.channelSnapshot.findMany({
    where: {
      disasterId,
      network,
      period: 'cumulative',
      status: 'published',
      snapshot_at: latest.snapshot_at,
    },
    orderBy: { amount_npr: 'desc' },
  });

  const allCumulative = await prisma.channelSnapshot.groupBy({
    by: ['snapshot_at'],
    where: { disasterId, network, period: 'cumulative', status: 'published' },
    _sum: { amount_npr: true, txn_count: true },
    orderBy: { snapshot_at: 'asc' },
  });

  const allDaily = await prisma.channelSnapshot.groupBy({
    by: ['period_date'],
    where: { disasterId, network, period: 'daily', status: 'published' },
    _sum: { amount_npr: true, txn_count: true },
    orderBy: { period_date: 'asc' },
  });

  return {
    network,
    total_npr: rows.reduce((sum, row) => sum + num(row.amount_npr), 0),
    txn_count: rows.reduce((sum, row) => sum + row.txn_count, 0),
    as_of: latest.snapshot_at.toISOString(),
    source: latest.source,
    channels: rows.map((row) => ({
      code: row.channel_code,
      label_ne: row.channel_label_ne,
      label_en: row.channel_label_en,
      txn_count: row.txn_count,
      amount_npr: num(row.amount_npr),
    })),
    history: allCumulative.map((row) => ({
      as_of: row.snapshot_at.toISOString(),
      total_npr: num(row._sum.amount_npr),
      txn_count: row._sum.txn_count ?? 0,
    })),
    daily: allDaily
      .filter((row) => row.period_date)
      .map((row) => ({
        date: row.period_date!.toISOString(),
        total_npr: num(row._sum.amount_npr),
        txn_count: row._sum.txn_count ?? 0,
      })),
  };
}

async function computeTotals(): Promise<PortalTotals | null> {
  const disaster = await getDisaster();
  if (!disaster) return null;
  const disasterId = disaster.id;
  const fx = await fxRate();

  /* ---- A ---- */
  const networks = (
    await Promise.all(
      (['NCHL', 'FONEPAY', 'CARD', 'OTHER'] as Network[]).map((n) => networkTotals(disasterId, n)),
    )
  ).filter((n): n is NetworkTotals => n !== null && n.total_npr > 0);
  const digital_npr = networks.reduce((sum, n) => sum + n.total_npr, 0);
  const digital_txn_count = networks.reduce((sum, n) => sum + n.txn_count, 0);

  /* ---- B ---- */
  const contributions = await prisma.contribution.findMany({
    where: { disasterId, status: 'published' },
    select: {
      sn: true,
      contributor_name: true,
      contributor_type: true,
      payment_mode: true,
      amount_npr: true,
      amount_usd: true,
      sector: true,
      date_bs: true,
      date_ad: true,
      as_of: true,
      source: true,
    },
    orderBy: { date_ad: 'asc' },
  });

  const handoverNpr = contributions.reduce((sum, c) => sum + num(c.amount_npr), 0);
  const handoverUsd = contributions.reduce((sum, c) => sum + num(c.amount_usd), 0);
  const withNpr = contributions.filter((c) => num(c.amount_npr) > 0);

  const byDayMap = new Map<
    string,
    { date_bs: string; date_ad: string; total_npr: number; entries: number }
  >();
  for (const c of contributions) {
    const key = c.date_bs;
    const entry = byDayMap.get(key) ?? {
      date_bs: c.date_bs,
      date_ad: c.date_ad.toISOString(),
      total_npr: 0,
      entries: 0,
    };
    entry.total_npr += num(c.amount_npr);
    entry.entries += 1;
    byDayMap.set(key, entry);
  }

  const bySectorMap = new Map<string, { sector: string; total_npr: number; entries: number }>();
  for (const c of contributions) {
    const entry = bySectorMap.get(c.sector) ?? { sector: c.sector, total_npr: 0, entries: 0 };
    entry.total_npr += num(c.amount_npr);
    entry.entries += 1;
    bySectorMap.set(c.sector, entry);
  }

  // The register is numbered by the Fund Section. A break in the run means
  // entries exist that have not reached the portal, and the page says so rather
  // than presenting the register as complete.
  const serials = contributions
    .map((c) => c.sn)
    .filter((sn): sn is number => sn != null)
    .sort((a, b) => a - b);
  // A serial that moved to foreign assistance is accounted for, not missing.
  const movedSetting = await prisma.setting.findUnique({
    where: { key: SETTING_KEYS.registerSerialsInForeign },
  });
  const moved = new Set((movedSetting?.value as { serials?: number[] } | null)?.serials ?? []);

  const serialGaps: { from: number; to: number }[] = [];
  for (let i = 1; i < serials.length; i++) {
    let from = serials[i - 1]! + 1;
    const to = serials[i]! - 1;
    while (from <= to && moved.has(from)) from++;
    let end = to;
    while (end >= from && moved.has(end)) end--;
    if (from <= end) serialGaps.push({ from, to: end });
  }

  const handoverAsOf = contributions.reduce<Date | null>(
    (latest, c) => (!latest || c.as_of > latest ? c.as_of : latest),
    null,
  );

  /* ---- C and the Fund status statement ---- */
  const fundStatusRow = await prisma.fundStatusSnapshot.findFirst({
    where: { disasterId, status: 'published' },
    orderBy: { as_of: 'desc' },
    include: { original: true },
  });

  interface Series {
    dates_bs: string[];
    dates_ad: string[];
    compare_bs?: string;
    compare_en?: string;
    npr: {
      balance_series: number[];
      gross_series: number[];
      daily_series: number[];
      banks: [string, number, number][];
    };
    usd: {
      balance_series: number[];
      gross_series: number[];
      daily_series: number[];
      banks: [string, number, number][];
    };
  }

  const fund_status: FundStatusView | null = fundStatusRow
    ? (() => {
        const series = fundStatusRow.series as unknown as Series;
        return {
          as_of: fundStatusRow.as_of.toISOString(),
          as_of_bs: fundStatusRow.as_of_bs,
          as_of_en: fundStatusRow.as_of_en,
          source_ne: fundStatusRow.source_ne,
          source_en: fundStatusRow.source_en,
          fx_rate: num(fundStatusRow.fx_rate),
          npr: {
            before: num(fundStatusRow.npr_before),
            balance: num(fundStatusRow.npr_balance),
            gross: num(fundStatusRow.npr_gross),
            usage: num(fundStatusRow.npr_usage),
            usage_note_ne: fundStatusRow.npr_usage_note_ne,
            usage_note_en: fundStatusRow.npr_usage_note_en,
            banks: series.npr.banks,
            balance_series: series.npr.balance_series,
            gross_series: series.npr.gross_series,
            daily_series: series.npr.daily_series,
          },
          usd: {
            before: num(fundStatusRow.usd_before),
            balance: num(fundStatusRow.usd_balance),
            gross: num(fundStatusRow.usd_gross),
            equiv_npr: num(fundStatusRow.usd_equiv_npr),
            banks: series.usd.banks,
            balance_series: series.usd.balance_series,
            gross_series: series.usd.gross_series,
            daily_series: series.usd.daily_series,
          },
          dates_bs: series.dates_bs,
          dates_ad: series.dates_ad,
          compare_bs: series.compare_bs ?? '',
          compare_en: series.compare_en ?? '',
          total_available_npr: num(fundStatusRow.total_available_npr),
          original_url: publicFileUrl(fundStatusRow.original?.url),
        };
      })()
    : null;

  /* ---- D ---- */
  const foreignRows = await prisma.foreignAssistance.findMany({
    where: { disasterId, status: 'published' },
    select: {
      amount_usd: true,
      amount_npr_equiv: true,
      kind: true,
      in_kind_valuation_npr: true,
      as_of: true,
    },
  });

  const identified_usd = foreignRows.reduce((sum, f) => sum + num(f.amount_usd), 0);
  const total_usd = fund_status ? fund_status.usd.gross : identified_usd;
  const foreignAsOf = fund_status
    ? fund_status.as_of
    : (foreignRows
        .reduce<Date | null>((latest, f) => (!latest || f.as_of > latest ? f.as_of : latest), null)
        ?.toISOString() ?? null);

  const npr_receipts = digital_npr + handoverNpr;
  const grand_total_npr = npr_receipts + total_usd * fx;

  const lastUpdateSetting = await prisma.setting.findUnique({
    where: { key: SETTING_KEYS.lastPublicUpdate },
  });

  const cut_offs = [
    ...networks.map((n) => ({
      key: n.network.toLowerCase(),
      label_ne: n.network === 'FONEPAY' ? 'Fonepay' : n.network === 'NCHL' ? 'NCHL' : n.network,
      label_en: n.network === 'FONEPAY' ? 'Fonepay' : n.network === 'NCHL' ? 'NCHL' : n.network,
      as_of: n.as_of,
    })),
    {
      key: 'handover',
      label_ne: 'माननीय अर्थमन्त्रीज्यूलाई हस्तान्तरण',
      label_en: 'Handover to Hon. Finance Minister',
      as_of: handoverAsOf?.toISOString() ?? null,
    },
    {
      key: 'fund_status',
      label_ne: 'प्रधानमन्त्री दैवी प्रकोप उद्धार कोष — कोष स्थिति',
      label_en: 'Prime Minister Disaster Relief Fund — fund status',
      as_of: fund_status?.as_of ?? null,
    },
  ];

  return {
    disasterId,
    fx_rate: fx,
    networks,
    digital_npr,
    digital_txn_count,
    handover: {
      total_npr: handoverNpr,
      total_usd: handoverUsd,
      entries: contributions.length,
      unique_donors: new Set(contributions.map((c) => c.contributor_name.trim().toLowerCase()))
        .size,
      institutional_npr: contributions
        .filter((c) => c.contributor_type === 'institutional')
        .reduce((sum, c) => sum + num(c.amount_npr), 0),
      individual_npr: contributions
        .filter((c) => c.contributor_type === 'individual')
        .reduce((sum, c) => sum + num(c.amount_npr), 0),
      institutional_count: contributions.filter((c) => c.contributor_type === 'institutional')
        .length,
      individual_count: contributions.filter((c) => c.contributor_type === 'individual').length,
      cheque_npr: contributions
        .filter((c) => c.payment_mode === 'cheque')
        .reduce((sum, c) => sum + num(c.amount_npr), 0),
      bank_transfer_npr: contributions
        .filter((c) => c.payment_mode === 'bank_transfer')
        .reduce((sum, c) => sum + num(c.amount_npr), 0),
      cheque_count: contributions.filter((c) => c.payment_mode === 'cheque').length,
      bank_transfer_count: contributions.filter((c) => c.payment_mode === 'bank_transfer').length,
      average_npr: withNpr.length ? handoverNpr / withNpr.length : 0,
      as_of: handoverAsOf?.toISOString() ?? null,
      source: contributions[0]?.source ?? null,
      by_day: [...byDayMap.values()],
      by_sector: [...bySectorMap.values()].sort((a, b) => b.total_npr - a.total_npr),
      dates_covered: [...byDayMap.values()].map((day) => day.date_bs),
      serial_gaps: serialGaps,
    },
    npr_receipts,
    foreign: {
      total_usd,
      total_npr_equiv: total_usd * fx,
      identified_usd,
      unattributed_usd: Math.max(0, total_usd - identified_usd),
      identified_count: foreignRows.length,
      cash_usd: foreignRows
        .filter((f) => f.kind === 'cash' || f.kind === 'cash_cheque')
        .reduce((sum, f) => sum + num(f.amount_usd), 0),
      in_kind_npr: foreignRows.reduce((sum, f) => sum + num(f.in_kind_valuation_npr), 0),
      pledged_usd: foreignRows
        .filter((f) => f.kind === 'pledge')
        .reduce((sum, f) => sum + num(f.amount_usd), 0),
      as_of: foreignAsOf,
    },
    fund_status,
    grand_total_npr,
    cut_offs,
    last_public_update: (lastUpdateSetting?.value as { at?: string } | null)?.at ?? null,
  };
}

/** Cached for 60 seconds; the admin "Regenerate public totals" action revalidates it. */
export const getTotals = unstable_cache(computeTotals, ['portal-totals'], {
  revalidate: 60,
  tags: ['totals'],
});

/**
 * The difference between the NPR receipts this portal records (A + B) and what the
 * fund's NPR accounts show as deposited since the flood. It is settlement still in
 * the clearing cycle — cheques not yet cleared, network settlement not yet posted —
 * not a shortfall. Returns null when no statement has been published.
 */
export function settlementGap(totals: PortalTotals): number | null {
  if (!totals.fund_status) return null;
  return totals.npr_receipts - totals.fund_status.npr.gross;
}
