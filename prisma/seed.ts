/**
 * Seeds the portal from `seed/` — the ministry's own source documents.
 *
 * Everything loaded here is already verified by the Fund Section, so it is
 * created with status `published` and attributed to the seed publisher account.
 * Re-running is safe: records are upserted on their natural keys.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { hash } from '@node-rs/argon2';
import {
  PrismaClient,
  type AssistanceKind,
  type ContributorType,
  type DecisionKind,
  type Network,
  type PaymentMode,
  type Prisma,
  type Role,
} from '@prisma/client';
import { attachmentKindOf, putLocalFile } from '../src/lib/storage';
import { suggestSector } from '../src/lib/sectors';
import { parseBsLabel, bsToAd } from '../src/lib/bs';
import { DISASTER_SLUG, SETTING_KEYS } from '../src/lib/constants';

const prisma = new PrismaClient();
const ROOT = process.cwd();
const SEED = path.join(ROOT, 'seed');

/** Nepal Time, so a "17:00" in a source document stays 17:00 in the database. */
function npt(date: string, time = '00:00:00'): Date {
  return new Date(`${date}T${time}+05:45`);
}

async function readCsv(file: string): Promise<Record<string, string>[]> {
  const text = await readFile(path.join(SEED, file), 'utf8');
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  const header = splitCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])) as Record<string, string>;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

async function readJson<T>(file: string, base = SEED): Promise<T> {
  return JSON.parse(await readFile(path.join(base, file), 'utf8')) as T;
}

/** Stores a reference document and returns its Attachment id (deduped by sha256). */
const attachmentCache = new Map<string, string>();
async function attach(relativePath: string, uploadedById: string): Promise<string | null> {
  const cached = attachmentCache.get(relativePath);
  if (cached) return cached;
  const absolute = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(ROOT, relativePath.replace(/^reference\//, 'reference/'));
  let stored;
  try {
    stored = await putLocalFile(absolute);
  } catch {
    console.warn(`  ! reference file missing, skipped: ${relativePath}`);
    return null;
  }
  const existing = await prisma.attachment.findFirst({ where: { sha256: stored.sha256 } });
  const record =
    existing ??
    (await prisma.attachment.create({
      data: {
        kind: attachmentKindOf(stored.filename),
        filename: stored.filename,
        url: stored.url,
        sha256: stored.sha256,
        size: stored.size,
        uploadedById,
      },
    }));
  attachmentCache.set(relativePath, record.id);
  return record.id;
}

async function main() {
  console.log('Seeding रसुवा–भोटेकोशी बाढी अपडेट …');

  /* ---------- users ---------- */
  // No default. The seeded accounts include admin@mof.gov.np and those addresses
  // are in the repository; a known fallback password would let anyone sign in
  // to a deployment that forgot to set one.
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12 || seedPassword === 'ChangeMe#2083') {
    console.error(
      'SEED_PASSWORD must be set to a password of at least 12 characters before seeding.\n' +
        'Generate one with:  openssl rand -base64 24',
    );
    process.exit(1);
  }
  const accounts: { email: string; name: string; role: Role }[] = [
    { email: 'admin@mof.gov.np', name: 'Portal Administrator', role: 'admin' },
    { email: 'publisher@mof.gov.np', name: 'Fund Section — Publisher', role: 'publisher' },
    { email: 'verifier@mof.gov.np', name: 'Fund Section — Verifier', role: 'verifier' },
    { email: 'entry@mof.gov.np', name: 'Fund Section — Data Entry', role: 'entry' },
  ];
  const passwordHash = await hash(seedPassword);
  const users: Record<string, string> = {};
  for (const account of accounts) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, role: account.role, active: true },
      create: { ...account, passwordHash },
    });
    users[account.role] = user.id;
  }
  const publisherId = users.publisher!;
  console.log(`  users: ${accounts.length}`);

  /* ---------- disaster ---------- */
  const disaster = await prisma.disaster.upsert({
    where: { slug: DISASTER_SLUG },
    update: { active: true },
    create: {
      slug: DISASTER_SLUG,
      name_ne: 'रसुवा–भोटेकोशी बाढी, २०८३',
      name_en: 'Rasuwa–Bhotekoshi flood, 2083',
      event_date_ad: npt('2026-08-26'),
      event_date_bs: '२०८३ भदौ १०',
      active: true,
    },
  });
  const disasterId = disaster.id;

  /* ---------- published status metadata shared by every seeded record ---------- */
  const published = {
    status: 'published' as const,
    verifiedById: users.verifier!,
    verifiedAt: npt('2026-09-07', '09:00:00'),
    publishedById: publisherId,
    publishedAt: npt('2026-09-07', '17:00:00'),
    createdById: users.entry!,
  };

  /* ---------- category B — handovers to the Hon. Finance Minister ---------- */
  // B is NPR only. A row marked category D in the source list is a foreign-currency
  // cheque — the Embassy of China's USD 200,000 — and belongs to foreign assistance
  // alone. Counting it here as well would double-count it.
  const contributionRows = await readCsv('inperson_contributions.csv');
  const handoverRows = contributionRows.filter((row) => !row.category?.startsWith('D'));
  const movedToForeign = contributionRows.length - handoverRows.length;
  // Their serials are recorded so the register does not report them as a gap in
  // its numbering — they are not missing, they are counted under category D.
  const serialsInForeign = contributionRows
    .filter((row) => row.category?.startsWith('D'))
    .map((row) => Number(row.sn))
    .filter((sn) => Number.isFinite(sn));

  await prisma.contribution.deleteMany({ where: { disasterId } });
  const contributions: Prisma.ContributionCreateManyInput[] = handoverRows.map((row) => {
    const contributorType = row.contributor_type as ContributorType;
    return {
      disasterId,
      sn: row.sn ? Number(row.sn) : null,
      date_ad: npt(row.date_ad!),
      date_bs: row.date_bs!,
      contributor_name: row.contributor_name!,
      contributor_type: contributorType,
      payment_mode: row.payment_mode as PaymentMode,
      amount_npr: row.amount_npr ? row.amount_npr : null,
      amount_usd: null,
      sector: suggestSector(row.contributor_name!, contributorType),
      sector_auto: suggestSector(row.contributor_name!, contributorType),
      receiving_office: 'माननीय अर्थमन्त्रीज्यूको सचिवालय / कोष शाखा',
      source: row.source!,
      as_of: npt(row.date_ad!, '17:00:00'),
      ...published,
    };
  });
  await prisma.contribution.createMany({ data: contributions });
  console.log(
    `  contributions (category B): ${contributions.length}` +
      (movedToForeign
        ? ` · ${movedToForeign} USD cheque(s) listed under foreign assistance instead`
        : ''),
  );

  /* ---------- category A — NCHL / Fonepay channel snapshots ---------- */
  const channelRows = await readCsv('digital_channel_snapshots.csv');
  await prisma.channelSnapshot.deleteMany({ where: { disasterId } });
  const channels: Prisma.ChannelSnapshotCreateManyInput[] = channelRows.map((row) => {
    const isDaily = row.period === 'daily';
    const snapshotAt = isDaily ? npt(row.snapshot_at!) : new Date(row.snapshot_at!);
    return {
      disasterId,
      network: row.network!.toUpperCase() as Network,
      period: row.period as 'daily' | 'cumulative',
      snapshot_at: snapshotAt,
      period_date: isDaily ? snapshotAt : null,
      channel_code: row.channel_code!,
      channel_label_en: row.channel_label_en!,
      channel_label_ne: row.channel_label_ne!,
      txn_count: Number(row.txn_count),
      amount_npr: row.amount_npr!,
      source: row.source!,
      ...published,
    };
  });
  await prisma.channelSnapshot.createMany({ data: channels });
  console.log(`  channel snapshots (category A): ${channels.length}`);

  /* ---------- category C — Fund status statement ---------- */
  interface FundStatusSeed {
    source_ne: string;
    source_en: string;
    as_of_bs: string;
    as_of_en: string;
    as_of_ad: string;
    /** The column the statement compares against, e.g. the previous day. */
    compare_bs: string;
    compare_en: string;
    original_file: string | null;
    fx: number;
    dates_bs: string[];
    dates_ad: string[];
    npr: {
      before: number;
      balance: number;
      gross: number;
      usage: number;
      usage_note_ne: string;
      usage_note_en: string;
      balance_series: number[];
      gross_series: number[];
      daily_series: number[];
      banks: [string, number, number][];
    };
    usd: {
      before: number;
      balance: number;
      gross: number;
      equiv_npr: number;
      balance_series: number[];
      gross_series: number[];
      daily_series: number[];
      banks: [string, number, number][];
    };
    total_available_npr: number;
  }
  const { statements } = await readJson<{ statements: FundStatusSeed[] }>('fund_status.json');
  const statementsByDate = [...statements].sort(
    (a, b) => new Date(a.as_of_ad).getTime() - new Date(b.as_of_ad).getTime(),
  );
  const fundStatus = statementsByDate.at(-1)!;
  const fundStatusAsOf = new Date(fundStatus.as_of_ad);

  for (const statement of statementsByDate) {
    const asOf = new Date(statement.as_of_ad);
    // Only a statement whose scanned original the ministry has supplied gets one
    // attached; the rest are uploaded by the Fund Section from admin.
    const originalId = statement.original_file
      ? await attach(statement.original_file, publisherId)
      : null;

    await prisma.fundStatusSnapshot.upsert({
      where: { disasterId_as_of: { disasterId, as_of: asOf } },
      update: {},
      create: {
        disasterId,
        as_of: asOf,
        as_of_bs: statement.as_of_bs,
        as_of_en: statement.as_of_en,
        source_ne: statement.source_ne,
        source_en: statement.source_en,
        fx_rate: String(statement.fx),
        npr_before: String(statement.npr.before),
        npr_balance: String(statement.npr.balance),
        npr_gross: String(statement.npr.gross),
        npr_usage: String(statement.npr.usage),
        npr_usage_note_ne: statement.npr.usage_note_ne,
        npr_usage_note_en: statement.npr.usage_note_en,
        usd_before: String(statement.usd.before),
        usd_balance: String(statement.usd.balance),
        usd_gross: String(statement.usd.gross),
        usd_equiv_npr: String(statement.usd.equiv_npr),
        total_available_npr: String(statement.total_available_npr),
        series: {
          dates_bs: statement.dates_bs,
          dates_ad: statement.dates_ad,
          compare_bs: statement.compare_bs,
          compare_en: statement.compare_en,
          npr: {
            balance_series: statement.npr.balance_series,
            gross_series: statement.npr.gross_series,
            daily_series: statement.npr.daily_series,
            banks: statement.npr.banks,
          },
          usd: {
            balance_series: statement.usd.balance_series,
            gross_series: statement.usd.gross_series,
            daily_series: statement.usd.daily_series,
            banks: statement.usd.banks,
          },
        },
        originalId,
        ...published,
      },
    });
  }
  console.log(
    `  fund status statements (category C): ${statementsByDate.length} · latest ${fundStatus.as_of_en}`,
  );

  /* ---------- category D — identified foreign contributors ---------- */
  const foreignRows = await readCsv('foreign_assistance.csv');
  await prisma.foreignAssistance.deleteMany({ where: { disasterId } });
  const countryNe: Record<string, string> = {
    USA: 'संयुक्त राज्य अमेरिका',
    China: 'चीन',
  };
  const countryIso: Record<string, string> = { USA: 'US', China: 'CN' };
  const nvidiaPhoto = await attach('reference/nvidia-usd-10m-contribution.jpeg', publisherId);
  for (const row of foreignRows) {
    const featured = row.contributor!.startsWith('NVIDIA');
    // The column is named for the rate it was computed at, e.g.
    // `amount_npr_equiv_at_150.88`; the rate is recovered from the figures
    // themselves so the two can never drift apart.
    const nprEquivalent =
      row.amount_npr_equiv_at_150_88 ?? row['amount_npr_equiv_at_150.88'] ?? null;
    const usdAmount = Number(row.amount_usd ?? 0);
    const recordFxRate =
      nprEquivalent && usdAmount ? Number((Number(nprEquivalent) / usdAmount).toFixed(4)) : null;
    await prisma.foreignAssistance.create({
      data: {
        disasterId,
        date_ad: npt(row.date_ad!),
        date_bs: row.date_bs!,
        contributor: row.contributor!,
        country_en: row.country!,
        country_ne: countryNe[row.country!] ?? row.country!,
        country_iso2: countryIso[row.country!] ?? null,
        contributor_type: row.contributor_type as ContributorType,
        kind: row.assistance_kind as AssistanceKind,
        channel: row.channel!,
        channel_ne:
          row.assistance_kind === 'cash_cheque'
            ? 'माननीय अर्थमन्त्रीज्यूलाई हस्तान्तरण (अमेरिकी डलर चेक)'
            : 'प्रधानमन्त्री दैवी प्रकोप उद्धार कोष (बैंक जम्मा)',
        amount_usd: row.amount_usd!,
        amount_npr_equiv: nprEquivalent,
        // A record is stated at the rate its own published rupee equivalent was
        // computed with, not today's — restating a past contribution at a later
        // rate would change a figure the ministry has already published. The
        // fund's USD *balance* is a different matter: the statement itself
        // restates that at the current rate.
        fx_rate: recordFxRate ? String(recordFxRate) : String(fundStatus.fx),
        purpose_en: row.purpose!,
        purpose_ne:
          row.contributor === 'NVIDIA Corporation'
            ? 'रसुवा बाढी राहत तथा पुनर्निर्माण'
            : 'रसुवा बाढी राहत',
        featured,
        photoId: featured ? nvidiaPhoto : null,
        source: 'Ministry of Finance — Fund Section',
        as_of: fundStatusAsOf,
        ...published,
      },
    });
  }
  console.log(`  foreign assistance (category D): ${foreignRows.length}`);

  /* ---------- rescue: NDRRMA and Nepal Police daily reports ---------- */
  // Every report the ministry has supplied is loaded, so the date tabs and the
  // archive on the rescue page carry the full history rather than only the latest.
  const { reports: rescueReports } = await readJson<{
    reports: {
      agency: 'NDRRMA' | 'NEPAL_POLICE';
      original_file: string | null;
      data: Record<string, unknown> & { as_of: string; as_of_bs: string; source: string };
    }[];
  }>('rescue_snapshot.json');

  for (const report of rescueReports) {
    const originalId = report.original_file
      ? await attach(report.original_file, publisherId)
      : null;
    const reportAt = new Date(report.data.as_of);
    await prisma.rescueReport.upsert({
      where: {
        disasterId_agency_report_at: { disasterId, agency: report.agency, report_at: reportAt },
      },
      update: { data: report.data as Prisma.InputJsonValue, ...(originalId ? { originalId } : {}) },
      create: {
        disasterId,
        agency: report.agency,
        report_at: reportAt,
        report_at_bs: report.data.as_of_bs,
        source: report.data.source,
        data: report.data as Prisma.InputJsonValue,
        originalId,
        ...published,
      },
    });
  }
  const latestRescue = [...rescueReports].sort(
    (a, b) => new Date(b.data.as_of).getTime() - new Date(a.data.as_of).getTime(),
  )[0];
  console.log(
    `  rescue reports: ${rescueReports.length} · latest ${latestRescue?.agency} ${latestRescue?.data.as_of_bs}`,
  );

  /* ---------- government initiatives ---------- */
  interface DecisionSeed {
    id: string;
    date_bs: string;
    date_ad: string;
    issuer: string;
    issuer_ne: string;
    kind: string;
    title_ne: string;
    title_en: string;
    summary_ne: string;
    summary_en: string;
    original_file?: string;
    explainer_file?: string;
    categories?: {
      code: string;
      name_ne: string;
      name_en: string;
      agency_ne: string;
      agency_en: string;
      count: number;
    }[];
    measures?: {
      no: number;
      category: string;
      title_ne: string;
      title_en: string;
      who_ne: string;
      benefit_ne: string;
      deadline_ne?: string;
      agency_ne: string;
    }[];
  }
  const decisionsSeed = await readJson<{
    decisions: DecisionSeed[];
    contacts: {
      group_ne: string;
      group_en: string;
      title_ne: string;
      title_en: string;
      name_ne: string;
      name_en: string;
      phone: string;
    }[];
  }>('decisions.json');

  const decisionKindMap: Record<string, DecisionKind> = {
    notice: 'mof_notice',
    cabinet_decision: 'cabinet_decision',
    mof_decision: 'mof_decision',
    cash_support: 'cash_support',
  };

  await prisma.decision.deleteMany({ where: { disasterId } });
  for (const decision of decisionsSeed.decisions) {
    const originalId = decision.original_file
      ? await attach(decision.original_file, publisherId)
      : null;
    const explainerId = decision.explainer_file
      ? await attach(decision.explainer_file, publisherId)
      : null;
    const parsedBs = parseBsLabel(decision.date_bs, 2083);
    const dateAd = decision.date_ad ? npt(decision.date_ad) : parsedBs ? bsToAd(parsedBs) : null;

    const created = await prisma.decision.create({
      data: {
        disasterId,
        slug: decision.id,
        kind: decisionKindMap[decision.kind] ?? 'other',
        date_ad: dateAd,
        date_bs: decision.date_bs,
        issuer_ne: decision.issuer_ne,
        issuer_en: decision.issuer,
        title_ne: decision.title_ne,
        title_en: decision.title_en,
        summary_ne: decision.summary_ne,
        summary_en: decision.summary_en,
        categories: (decision.categories ?? null) as Prisma.InputJsonValue,
        originalId,
        explainerId,
        ...published,
      },
    });

    if (decision.measures?.length) {
      const categoryOf = (code: string) =>
        decision.categories?.find((c) => c.code === code) ?? {
          name_ne: code,
          name_en: code,
          agency_ne: '',
          agency_en: '',
        };
      await prisma.measure.createMany({
        data: decision.measures.map((measure) => {
          const category = categoryOf(measure.category);
          return {
            decisionId: created.id,
            no: measure.no,
            category_code: measure.category,
            category_ne: category.name_ne,
            category_en: category.name_en,
            agency_ne: measure.agency_ne,
            agency_en: category.agency_en,
            title_ne: measure.title_ne,
            title_en: measure.title_en,
            who_ne: measure.who_ne,
            benefit_ne: measure.benefit_ne,
            deadline_ne: measure.deadline_ne ?? null,
            cabinet_text_ne: measure.benefit_ne,
            status: 'published' as const,
          };
        }),
      });
    }
  }
  const measureCount = await prisma.measure.count();
  console.log(`  decisions: ${decisionsSeed.decisions.length} · measures: ${measureCount}`);

  /* ---------- single-window contacts ---------- */
  await prisma.contact.deleteMany({ where: { disasterId } });
  await prisma.contact.createMany({
    data: decisionsSeed.contacts.map((contact, index) => ({
      disasterId,
      group_ne: contact.group_ne,
      group_en: contact.group_en,
      title_ne: contact.title_ne,
      title_en: contact.title_en,
      name_ne: contact.name_ne,
      name_en: contact.name_en,
      phone: contact.phone,
      order: index,
      visible: true,
    })),
  });
  console.log(`  contacts: ${decisionsSeed.contacts.length}`);

  /* ---------- settings ---------- */
  const settings: [string, Prisma.InputJsonValue][] = [
    [
      SETTING_KEYS.fxUsdNpr,
      { rate: fundStatus.fx, source_ne: fundStatus.source_ne, source_en: fundStatus.source_en },
    ],
    // The newest published source, so the ticker never claims to be fresher
    // than the most recent thing the ministry has actually released.
    [
      SETTING_KEYS.lastPublicUpdate,
      {
        at: [
          ...channels.map((c) => c.snapshot_at as Date),
          ...statementsByDate.map((st) => new Date(st.as_of_ad)),
          ...rescueReports.map((r) => new Date(r.data.as_of)),
        ]
          .sort((a, b) => b.getTime() - a.getTime())[0]!
          .toISOString(),
      },
    ],
    [SETTING_KEYS.eventDate, { bs: '२०८३ भदौ १०', ad: '2026-08-26' }],
    [SETTING_KEYS.registerSerialsInForeign, { serials: serialsInForeign }],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
