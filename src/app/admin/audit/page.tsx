import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { formatAsOf, formatNumber } from '@/lib/format';

const PAGE_SIZE = 60;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  await requireRole('verifier');
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const entity = params.entity;

  const where = entity ? { entity } : {};
  const [total, entries, entities] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.auditLog.groupBy({ by: ['entity'], _count: true }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <div>
        <h1>अभिलेख · Audit log</h1>
        <p className="lede">
          हरेक परिवर्तनको अघि र पछिको अवस्था यहाँ रहन्छ। सार्वजनिक पृष्ठमा कर्मचारीको नाम कहिल्यै
          देखिँदैन। · Every change is recorded here with the record before and after. Staff names
          never appear on the public site.
        </p>
      </div>

      <div className="card">
        <div className="tabs">
          <Link className={!entity ? 'on' : ''} href="/admin/audit">
            सबै · all ({formatNumber(total, 'en')})
          </Link>
          {entities.map((row) => (
            <Link
              key={row.entity}
              className={entity === row.entity ? 'on' : ''}
              href={`/admin/audit?entity=${row.entity}`}
            >
              {row.entity} ({row._count})
            </Link>
          ))}
        </div>

        <div className="tscroll" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>समय · When</th>
                <th>कार्य · Action</th>
                <th>अभिलेख · Entity</th>
                <th>प्रयोगकर्ता · By</th>
                <th>IP</th>
                <th>परिवर्तन · Change</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatAsOf(entry.createdAt, 'en')}</td>
                  <td className="nm">{entry.action}</td>
                  <td>
                    {entry.entity}
                    <div style={{ fontSize: 11, color: 'var(--mute)' }}>
                      <code>{entry.entityId.slice(0, 12)}</code>
                    </div>
                  </td>
                  <td>
                    {entry.user?.name ?? 'system'}
                    <div style={{ fontSize: 11, color: 'var(--mute)' }}>
                      {entry.user?.role ?? '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: 11 }}>{entry.ip ?? '—'}</td>
                  <td style={{ maxWidth: 420 }}>
                    <details>
                      <summary style={{ cursor: 'pointer', fontSize: 12.5 }}>
                        before / after
                      </summary>
                      <pre
                        style={{
                          fontSize: 11,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          marginTop: 6,
                          maxHeight: 220,
                          overflow: 'auto',
                        }}
                      >
                        {JSON.stringify({ before: entry.before, after: entry.after }, null, 1)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tfoot">
          <span>
            {formatNumber(total, 'en')} entries · page {page} of {pages}
          </span>
          <div className="pager">
            {page > 1 ? (
              <Link
                className="btn ghost sm"
                href={`/admin/audit?page=${page - 1}${entity ? `&entity=${entity}` : ''}`}
              >
                ‹
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                className="btn ghost sm"
                href={`/admin/audit?page=${page + 1}${entity ? `&entity=${entity}` : ''}`}
              >
                ›
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
