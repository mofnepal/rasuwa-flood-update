import Link from 'next/link';
import type { RecordStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireRole, can } from '@/lib/permissions';
import { getTotals } from '@/lib/totals';
import { ENTITY_LABELS, type Entity, type Transition } from '@/lib/workflow';
import { bsDate, formatNPR, formatUSD } from '@/lib/format';
import { QueueTable, type QueueRow } from './QueueTable';

const ENTITIES = Object.keys(ENTITY_LABELS) as Entity[];
const STATUSES: RecordStatus[] = ['draft', 'verified', 'published', 'archived'];

/** Loads the queue for one record type, flattened into a common shape. */
async function loadRows(
  entity: Entity,
  disasterId: string,
  status?: RecordStatus,
): Promise<QueueRow[]> {
  const where = { disasterId, ...(status ? { status } : {}) };
  const common = (
    id: string,
    s: string,
    title: string,
    detail: string,
    amount: string,
    date: string,
    note: string | null,
  ): QueueRow => ({
    id,
    status: s as QueueRow['status'],
    title,
    detail,
    amount,
    date,
    reviewNote: note,
  });

  switch (entity) {
    case 'contribution': {
      const rows = await prisma.contribution.findMany({
        where,
        orderBy: [{ status: 'asc' }, { date_ad: 'desc' }],
        take: 300,
      });
      return rows.map((row) =>
        common(
          row.id,
          row.status,
          row.contributor_name,
          `${row.contributor_type} · ${row.payment_mode} · ${row.sector}`,
          Number(row.amount_npr ?? 0) > 0
            ? formatNPR(Number(row.amount_npr), 'en')
            : formatUSD(Number(row.amount_usd ?? 0), 'en'),
          bsDate(row.date_ad, row.date_bs, 'en'),
          row.reviewNote,
        ),
      );
    }
    case 'foreignAssistance': {
      const rows = await prisma.foreignAssistance.findMany({ where, orderBy: { date_ad: 'desc' } });
      return rows.map((row) =>
        common(
          row.id,
          row.status,
          row.contributor,
          `${row.country_en ?? ''} · ${row.contributor_type} · ${row.kind}${row.featured ? ' · featured' : ''}`,
          formatUSD(Number(row.amount_usd ?? 0), 'en'),
          bsDate(row.date_ad, row.date_bs, 'en'),
          row.reviewNote,
        ),
      );
    }
    case 'channelSnapshot': {
      const rows = await prisma.channelSnapshot.findMany({
        where,
        orderBy: [{ snapshot_at: 'desc' }, { amount_npr: 'desc' }],
        take: 300,
      });
      return rows.map((row) =>
        common(
          row.id,
          row.status,
          `${row.network} — ${row.channel_label_en}`,
          `${row.period} · ${row.txn_count.toLocaleString('en-US')} txns · ${row.source}`,
          formatNPR(Number(row.amount_npr), 'en'),
          bsDate(row.snapshot_at, null, 'en'),
          row.reviewNote,
        ),
      );
    }
    case 'fundStatusSnapshot': {
      const rows = await prisma.fundStatusSnapshot.findMany({ where, orderBy: { as_of: 'desc' } });
      return rows.map((row) =>
        common(
          row.id,
          row.status,
          `Fund status — ${row.as_of_en}`,
          `NPR gross ${formatNPR(Number(row.npr_gross), 'en')} · USD gross ${formatUSD(Number(row.usd_gross), 'en')}`,
          formatNPR(Number(row.total_available_npr), 'en'),
          row.as_of_bs,
          row.reviewNote,
        ),
      );
    }
    case 'rescueReport': {
      const rows = await prisma.rescueReport.findMany({ where, orderBy: { report_at: 'desc' } });
      return rows.map((row) =>
        common(row.id, row.status, row.agency, row.source, '—', row.report_at_bs, row.reviewNote),
      );
    }
    case 'decision': {
      const rows = await prisma.decision.findMany({
        where,
        orderBy: { date_bs: 'desc' },
        include: { _count: { select: { measures: true } } },
      });
      return rows.map((row) =>
        common(
          row.id,
          row.status,
          row.title_en,
          `${row.issuer_en} · ${row.kind} · ${row._count.measures} measure(s)`,
          '—',
          row.date_bs,
          row.reviewNote,
        ),
      );
    }
  }
}

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; status?: string }>;
}) {
  const user = await requireRole('entry');
  const params = await searchParams;

  const entity = (
    ENTITIES.includes(params.entity as Entity) ? params.entity : 'contribution'
  ) as Entity;
  const status = STATUSES.includes(params.status as RecordStatus)
    ? (params.status as RecordStatus)
    : undefined;

  const totals = await getTotals();
  if (!totals) return <div className="adm-err">No active disaster.</div>;

  const rows = await loadRows(entity, totals.disasterId, status);

  const allowed: Transition[] = [
    ...(can(user.role, 'verifier') ? (['verify', 'send_back'] as Transition[]) : []),
    ...(can(user.role, 'publisher') ? (['publish', 'unpublish', 'archive'] as Transition[]) : []),
  ];

  return (
    <>
      <div>
        <h1>कार्यसूची · Review queue</h1>
        <p className="lede">
          मस्यौदा → प्रमाणित → प्रकाशित। प्रकाशित अभिलेख मात्र सार्वजनिक हुन्छ। · draft → verified →
          published; only published records go public.
        </p>
      </div>

      <div className="card">
        <div className="tabs">
          {ENTITIES.map((option) => (
            <Link
              key={option}
              className={option === entity ? 'on' : ''}
              href={`/admin/queue?entity=${option}${status ? `&status=${status}` : ''}`}
            >
              {ENTITY_LABELS[option].ne} · {ENTITY_LABELS[option].en}
            </Link>
          ))}
        </div>

        <div className="tabs" style={{ marginTop: 10 }}>
          <Link className={!status ? 'on' : ''} href={`/admin/queue?entity=${entity}`}>
            सबै · all
          </Link>
          {STATUSES.map((option) => (
            <Link
              key={option}
              className={option === status ? 'on' : ''}
              href={`/admin/queue?entity=${entity}&status=${option}`}
            >
              {option}
            </Link>
          ))}
        </div>

        <QueueTable entity={entity} rows={rows} allowed={allowed} />
      </div>
    </>
  );
}
