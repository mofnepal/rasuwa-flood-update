'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Network, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { writeAudit } from '@/lib/audit';
import { getDisaster } from '@/lib/totals';
import { attachmentKindOf, putFile } from '@/lib/storage';
import { ndrrmaSchema, policeSchema } from '@/lib/rescue';
import {
  parseContributionRows,
  readCsv,
  readWorkbook,
  type ImportPreview,
} from '@/lib/import/contributions';
import { parseChannelTable, type ChannelPreview } from '@/lib/import/channels';
import { bsToAd, parseBsLabel } from '@/lib/bs';

export type PreviewState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'preview'; preview: ImportPreview; filename: string }
  | { status: 'imported'; created: number; skipped: number };

/**
 * Step one of the handover import: read the file and hand the officer a
 * row-by-row preview. Nothing is written until they confirm.
 */
export async function previewContributionFile(
  _previous: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  await requireRole('entry');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'फाइल छानिएको छैन · no file was chosen' };
  }
  if (file.size > 12 * 1024 * 1024) {
    return { status: 'error', message: 'फाइल १२ MB भन्दा ठूलो छ · the file is larger than 12 MB' };
  }

  const disaster = await getDisaster();
  if (!disaster) return { status: 'error', message: 'no active disaster' };

  const existing = await prisma.contribution.findMany({
    where: { disasterId: disaster.id },
    select: { contributor_name: true, amount_npr: true, date_bs: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  let sheet: { headers: string[]; rows: (string | number | null)[][] };
  try {
    sheet = isCsv ? readCsv(buffer.toString('utf8')) : await readWorkbook(buffer);
  } catch {
    return { status: 'error', message: 'फाइल पढ्न सकिएन · the file could not be read' };
  }
  if (sheet.rows.length === 0) {
    return { status: 'error', message: 'फाइलमा कुनै पङ्क्ति भेटिएन · no rows were found' };
  }

  const preview = parseContributionRows(
    sheet.headers,
    sheet.rows,
    existing.map((row) => ({
      name: row.contributor_name,
      amount: Number(row.amount_npr ?? 0),
      date_bs: row.date_bs,
    })),
  );

  return { status: 'preview', preview, filename: file.name };
}

const commitSchema = z.object({
  payload: z.string(),
  source: z.string().min(3).max(300),
  skipDuplicates: z.boolean(),
});

/** Step two: create the confirmed rows as drafts, for a verifier to review. */
export async function commitContributions(
  _previous: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const user = await requireRole('entry');
  const parsed = commitSchema.safeParse({
    payload: String(formData.get('payload') ?? ''),
    source: String(formData.get('source') ?? '').trim(),
    skipDuplicates: formData.get('skipDuplicates') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: 'invalid submission' };

  const disaster = await getDisaster();
  if (!disaster) return { status: 'error', message: 'no active disaster' };

  const rows = JSON.parse(parsed.data.payload) as ImportPreview['rows'];
  const usable = rows.filter(
    (row) => row.errors.length === 0 && (!parsed.data.skipDuplicates || !row.duplicate),
  );
  if (usable.length === 0)
    return { status: 'error', message: 'आयात गर्न केही छैन · nothing to import' };

  const asOf = new Date();
  const data: Prisma.ContributionCreateManyInput[] = usable.map((row) => ({
    disasterId: disaster.id,
    sn: row.sn,
    date_ad: new Date(`${row.date_ad}T00:00:00+05:45`),
    date_bs: row.date_bs,
    contributor_name: row.contributor_name,
    contributor_type: row.contributor_type,
    payment_mode: row.payment_mode,
    amount_npr: row.amount_npr != null ? String(row.amount_npr) : null,
    amount_usd: row.amount_usd != null ? String(row.amount_usd) : null,
    sector: row.sector,
    sector_auto: row.sector,
    source: parsed.data.source,
    as_of: asOf,
    status: 'draft',
    createdById: user.id,
  }));

  const result = await prisma.contribution.createMany({ data });
  await writeAudit({
    userId: user.id,
    action: 'import_contributions',
    entity: 'contribution',
    entityId: disaster.id,
    after: { created: result.count, source: parsed.data.source },
  });

  revalidatePath('/admin/queue');
  revalidatePath('/admin');
  return { status: 'imported', created: result.count, skipped: rows.length - usable.length };
}

export type ChannelState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'preview'; preview: ChannelPreview }
  | { status: 'imported'; created: number };

/** Reads a pasted NCHL / Fonepay table and shows what it found. */
export async function previewChannelTable(
  _previous: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  await requireRole('entry');
  const text = String(formData.get('table') ?? '');
  if (text.trim().length < 5) {
    return { status: 'error', message: 'तालिका टाँस्नुहोस् · paste the table first' };
  }
  const preview = parseChannelTable(text);
  if (preview.rows.length === 0) {
    return { status: 'error', message: 'कुनै च्यानल पङ्क्ति भेटिएन · no channel rows were found' };
  }
  return { status: 'preview', preview };
}

const channelCommitSchema = z.object({
  payload: z.string(),
  network: z.enum(['NCHL', 'FONEPAY', 'CARD', 'OTHER']),
  period: z.enum(['cumulative', 'daily']),
  snapshotDate: z.string().min(4),
  snapshotTime: z.string().default('00:00'),
  source: z.string().min(2).max(200),
});

/** Creates one ChannelSnapshot row per channel, as drafts. */
export async function commitChannelSnapshot(
  _previous: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  const user = await requireRole('entry');
  const parsed = channelCommitSchema.safeParse({
    payload: String(formData.get('payload') ?? ''),
    network: String(formData.get('network') ?? ''),
    period: String(formData.get('period') ?? 'cumulative'),
    snapshotDate: String(formData.get('snapshotDate') ?? ''),
    snapshotTime: String(formData.get('snapshotTime') ?? '00:00'),
    source: String(formData.get('source') ?? '').trim(),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'सबै विवरण भर्नुहोस् · fill in every field' };
  }

  const disaster = await getDisaster();
  if (!disaster) return { status: 'error', message: 'no active disaster' };

  const snapshotAt = new Date(
    `${parsed.data.snapshotDate}T${parsed.data.snapshotTime || '00:00'}:00+05:45`,
  );
  if (Number.isNaN(snapshotAt.getTime())) {
    return { status: 'error', message: 'मिति मान्य छैन · the date is not valid' };
  }

  const rows = (JSON.parse(parsed.data.payload) as ChannelPreview['rows']).filter(
    (row) => row.errors.length === 0,
  );
  if (rows.length === 0) return { status: 'error', message: 'nothing to import' };

  let created = 0;
  for (const row of rows) {
    await prisma.channelSnapshot.upsert({
      where: {
        disasterId_network_period_snapshot_at_channel_code: {
          disasterId: disaster.id,
          network: parsed.data.network as Network,
          period: parsed.data.period,
          snapshot_at: snapshotAt,
          channel_code: row.channel_code,
        },
      },
      update: {
        txn_count: row.txn_count ?? 0,
        amount_npr: String(row.amount_npr ?? 0),
        source: parsed.data.source,
        status: 'draft',
      },
      create: {
        disasterId: disaster.id,
        network: parsed.data.network as Network,
        period: parsed.data.period,
        snapshot_at: snapshotAt,
        period_date: parsed.data.period === 'daily' ? snapshotAt : null,
        channel_code: row.channel_code,
        channel_label_en: row.label,
        channel_label_ne: row.label,
        txn_count: row.txn_count ?? 0,
        amount_npr: String(row.amount_npr ?? 0),
        source: parsed.data.source,
        status: 'draft',
        createdById: user.id,
      },
    });
    created += 1;
  }

  await writeAudit({
    userId: user.id,
    action: 'import_channel_snapshot',
    entity: 'channelSnapshot',
    entityId: disaster.id,
    after: { network: parsed.data.network, snapshot_at: snapshotAt.toISOString(), rows: created },
  });

  revalidatePath('/admin/queue');
  return { status: 'imported', created };
}

export type RescueState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'imported'; agency: string };

/**
 * Uploads the day's report and stores the structured figures beside it.
 * The form is pre-filled from the previous day, so an officer types only what changed.
 */
export async function saveRescueReport(
  _previous: RescueState,
  formData: FormData,
): Promise<RescueState> {
  const user = await requireRole('entry');
  const disaster = await getDisaster();
  if (!disaster) return { status: 'error', message: 'no active disaster' };

  const agency =
    String(formData.get('agency') ?? '') === 'NEPAL_POLICE' ? 'NEPAL_POLICE' : 'NDRRMA';
  const reportBs = String(formData.get('report_at_bs') ?? '').trim();
  const reportDate = String(formData.get('report_at') ?? '').trim();
  const reportTime = String(formData.get('report_time') ?? '18:00').trim();
  const source = String(formData.get('source') ?? '').trim();
  const rawJson = String(formData.get('data') ?? '');

  if (!reportBs || !reportDate || !source) {
    return { status: 'error', message: 'मिति र स्रोत आवश्यक छ · date and source are required' };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawJson);
  } catch {
    return { status: 'error', message: 'JSON मान्य छैन · the figures are not valid JSON' };
  }

  const schema = agency === 'NDRRMA' ? ndrrmaSchema : policeSchema;
  const validated = schema.safeParse(payload);
  if (!validated.success) {
    const first = validated.error.issues[0];
    return {
      status: 'error',
      message: `विवरण मिलेन · ${first?.path.join('.') ?? ''}: ${first?.message ?? 'invalid'}`,
    };
  }

  const reportAt = new Date(`${reportDate}T${reportTime}:00+05:45`);
  if (Number.isNaN(reportAt.getTime())) {
    return { status: 'error', message: 'मिति मान्य छैन · the date is not valid' };
  }

  let originalId: string | null = null;
  const file = formData.get('original');
  if (file instanceof File && file.size > 0) {
    if (file.size > 20 * 1024 * 1024) {
      return {
        status: 'error',
        message: 'फाइल २० MB भन्दा ठूलो छ · the file is larger than 20 MB',
      };
    }
    const stored = await putFile(file.name, Buffer.from(await file.arrayBuffer()));
    const existing = await prisma.attachment.findFirst({ where: { sha256: stored.sha256 } });
    originalId =
      existing?.id ??
      (
        await prisma.attachment.create({
          data: {
            kind: attachmentKindOf(stored.filename),
            filename: stored.filename,
            url: stored.url,
            sha256: stored.sha256,
            size: stored.size,
            uploadedById: user.id,
          },
        })
      ).id;
  }

  const before = await prisma.rescueReport.findUnique({
    where: {
      disasterId_agency_report_at: { disasterId: disaster.id, agency, report_at: reportAt },
    },
  });

  const record = await prisma.rescueReport.upsert({
    where: {
      disasterId_agency_report_at: { disasterId: disaster.id, agency, report_at: reportAt },
    },
    update: {
      report_at_bs: reportBs,
      source,
      data: validated.data as Prisma.InputJsonValue,
      ...(originalId ? { originalId } : {}),
      status: 'draft',
    },
    create: {
      disasterId: disaster.id,
      agency,
      report_at: reportAt,
      report_at_bs: reportBs,
      source,
      data: validated.data as Prisma.InputJsonValue,
      originalId,
      status: 'draft',
      createdById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: before ? 'update_rescue_report' : 'create_rescue_report',
    entity: 'rescueReport',
    entityId: record.id,
    after: { agency, report_at: reportAt.toISOString() },
  });

  revalidatePath('/admin/queue');
  return { status: 'imported', agency };
}

export type DecisionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved'; slug: string };

/** Records a Cabinet decision or ministry notice, with its measures. */
export async function saveDecision(
  _previous: DecisionState,
  formData: FormData,
): Promise<DecisionState> {
  const user = await requireRole('entry');
  const disaster = await getDisaster();
  if (!disaster) return { status: 'error', message: 'no active disaster' };

  const slug = String(formData.get('slug') ?? '').trim();
  const dateBs = String(formData.get('date_bs') ?? '').trim();
  if (!slug || !dateBs) {
    return { status: 'error', message: 'slug र मिति आवश्यक छ · slug and date are required' };
  }

  const parsedBs = parseBsLabel(dateBs, 2083);
  let dateAd: Date | null = null;
  if (parsedBs) {
    try {
      dateAd = bsToAd(parsedBs);
    } catch {
      dateAd = null;
    }
  }

  let originalId: string | null = null;
  const file = formData.get('original');
  if (file instanceof File && file.size > 0) {
    const stored = await putFile(file.name, Buffer.from(await file.arrayBuffer()));
    const existing = await prisma.attachment.findFirst({ where: { sha256: stored.sha256 } });
    originalId =
      existing?.id ??
      (
        await prisma.attachment.create({
          data: {
            kind: attachmentKindOf(stored.filename),
            filename: stored.filename,
            url: stored.url,
            sha256: stored.sha256,
            size: stored.size,
            uploadedById: user.id,
          },
        })
      ).id;
  }

  const record = await prisma.decision.upsert({
    where: { disasterId_slug: { disasterId: disaster.id, slug } },
    update: {
      date_bs: dateBs,
      date_ad: dateAd,
      issuer_ne: String(formData.get('issuer_ne') ?? ''),
      issuer_en: String(formData.get('issuer_en') ?? ''),
      title_ne: String(formData.get('title_ne') ?? ''),
      title_en: String(formData.get('title_en') ?? ''),
      summary_ne: String(formData.get('summary_ne') ?? ''),
      summary_en: String(formData.get('summary_en') ?? ''),
      ...(originalId ? { originalId } : {}),
      status: 'draft',
    },
    create: {
      disasterId: disaster.id,
      slug,
      kind: String(formData.get('kind') ?? 'other') as
        | 'cabinet_decision'
        | 'mof_notice'
        | 'mof_decision'
        | 'cash_support'
        | 'other',
      date_bs: dateBs,
      date_ad: dateAd,
      issuer_ne: String(formData.get('issuer_ne') ?? ''),
      issuer_en: String(formData.get('issuer_en') ?? ''),
      title_ne: String(formData.get('title_ne') ?? ''),
      title_en: String(formData.get('title_en') ?? ''),
      summary_ne: String(formData.get('summary_ne') ?? ''),
      summary_en: String(formData.get('summary_en') ?? ''),
      originalId,
      status: 'draft',
      createdById: user.id,
    },
  });

  await writeAudit({
    userId: user.id,
    action: 'save_decision',
    entity: 'decision',
    entityId: record.id,
    after: { slug, date_bs: dateBs },
  });

  revalidatePath('/admin/queue');
  return { status: 'saved', slug };
}
