import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { getTotals } from '@/lib/totals';
import { ENTITY_LABELS, statusCounts, type Entity } from '@/lib/workflow';
import { formatAsOf, formatNPR, formatNumber, formatUSD } from '@/lib/format';
import { RegenerateButton } from './RegenerateButton';

const ENTITIES = Object.keys(ENTITY_LABELS) as Entity[];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireRole('entry');
  const { denied } = await searchParams;

  const totals = await getTotals();
  if (!totals) {
    return (
      <>
        <h1>ड्यासबोर्ड · Dashboard</h1>
        <div className="adm-err">
          कुनै सक्रिय विपद् छैन — पहिले seed चलाउनुहोस्। · No active disaster; run the seed first.
        </div>
      </>
    );
  }

  const counts = await Promise.all(
    ENTITIES.map(async (entity) => ({
      entity,
      counts: await statusCounts(entity, totals.disasterId),
    })),
  );

  const [pending, recentAudit, messages] = await Promise.all([
    Promise.all(
      ENTITIES.map(async (entity) => ({
        entity,
        counts: await statusCounts(entity, totals.disasterId),
      })),
    ),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.message.count({ where: { handled: false } }),
  ]);

  const totalPending = pending.reduce(
    (sum, row) => sum + row.counts.draft + row.counts.verified,
    0,
  );

  return (
    <>
      {denied ? (
        <div className="adm-err">
          यो कामका लागि तपाईंको भूमिकामा अनुमति छैन। · Your role does not permit that action.
        </div>
      ) : null}

      <div>
        <h1>ड्यासबोर्ड · Dashboard</h1>
        <p className="lede">
          नमस्ते {user.name}. प्रकाशित अभिलेख मात्र सार्वजनिक पृष्ठमा देखिन्छ। · Only published
          records appear on the public site.
        </p>
      </div>

      <section className="grid g4">
        <div className="kpi red">
          <div className="l">
            <b>प्रतीक्षामा · Awaiting action</b>
            <span>draft + verified</span>
          </div>
          <div className="v">{formatNumber(totalPending, 'ne')}</div>
          <div className="s">
            <Link href="/admin/queue">कार्यसूची खोल्नुहोस् · open the queue</Link>
          </div>
        </div>
        <div className="kpi">
          <div className="l">
            <b>कुल प्राप्त सहयोग · Grand total</b>
            <span>A + B + C × FX</span>
          </div>
          <div className="v">{formatNPR(totals.grand_total_npr, 'ne')}</div>
          <div className="s">{formatNPR(totals.grand_total_npr, 'en')}</div>
        </div>
        <div className="kpi navy">
          <div className="l">
            <b>वैदेशिक सहयोग · Foreign</b>
            <span>fund USD accounts</span>
          </div>
          <div className="v">{formatUSD(totals.foreign.total_usd, 'en')}</div>
          <div className="s">
            पहिचान · identified {formatUSD(totals.foreign.identified_usd, 'en')}
          </div>
        </div>
        <div className="kpi">
          <div className="l">
            <b>अन्तिम सार्वजनिक अद्यावधिक · Last public update</b>
          </div>
          <div className="v" style={{ fontSize: 19 }}>
            {totals.last_public_update ? formatAsOf(totals.last_public_update, 'en') : '—'}
          </div>
          <div className="s">
            <RegenerateButton />
          </div>
        </div>
      </section>

      <div className="card">
        <h2>अभिलेखको अवस्था · Records by status</h2>
        <div className="tscroll" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>अभिलेख · Record</th>
                <th className="amt">मस्यौदा · draft</th>
                <th className="amt">प्रमाणित · verified</th>
                <th className="amt">प्रकाशित · published</th>
                <th className="amt">अभिलेखित · archived</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {counts.map(({ entity, counts: row }) => (
                <tr key={entity}>
                  <td className="nm">
                    {ENTITY_LABELS[entity].ne} · {ENTITY_LABELS[entity].en}
                  </td>
                  <td className="amt">
                    {row.draft ? <span className="pill draft">{row.draft}</span> : '—'}
                  </td>
                  <td className="amt">
                    {row.verified ? <span className="pill verified">{row.verified}</span> : '—'}
                  </td>
                  <td className="amt">
                    {row.published ? <span className="pill published">{row.published}</span> : '—'}
                  </td>
                  <td className="amt">
                    {row.archived ? <span className="pill archived">{row.archived}</span> : '—'}
                  </td>
                  <td>
                    <Link className="btn ghost sm" href={`/admin/queue?entity=${entity}`}>
                      खोल्नुहोस् · open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid g2">
        <div className="card">
          <h2>पछिल्ला कार्य · Recent activity</h2>
          <ul className="upd" style={{ marginTop: 10 }}>
            {recentAudit.length ? (
              recentAudit.map((entry) => (
                <li key={entry.id}>
                  <span>{formatAsOf(entry.createdAt, 'en')}</span>
                  <span style={{ background: 'none', padding: 0 }}>
                    {entry.action} · {entry.entity} — {entry.user?.name ?? 'system'} (
                    {entry.user?.role ?? '—'})
                  </span>
                </li>
              ))
            ) : (
              <li>
                <span>—</span>
                <span style={{ background: 'none', padding: 0 }}>कुनै कार्य छैन · nothing yet</span>
              </li>
            )}
          </ul>
          <p style={{ marginTop: 12 }}>
            <Link className="btn ghost sm" href="/admin/audit">
              पूर्ण अभिलेख · full audit log
            </Link>
          </p>
        </div>

        <div className="card">
          <h2>छिटो काम · Quick actions</h2>
          <div className="adm-actions" style={{ marginTop: 12 }}>
            <Link className="btn navy" href="/admin/imports">
              दैनिक तथ्याङ्क आयात · import today&apos;s figures
            </Link>
            <Link className="btn ghost" href="/admin/queue?status=draft">
              मस्यौदा जाँच्नुहोस् · review drafts
            </Link>
            <Link className="btn ghost" href="/admin/settings">
              विनिमय दर · exchange rate
            </Link>
          </div>
          <div className="note" style={{ marginTop: 14 }}>
            सम्पर्क फारमबाट प्राप्त, हेर्न बाँकी सन्देश: {formatNumber(messages, 'ne')} ·{' '}
            {formatNumber(messages, 'en')} unread message(s) from the contact form.
          </div>
          <div className="note">
            विनिमय दर · exchange rate: NPR {formatNumber(totals.fx_rate, 'en', 2)} per USD
          </div>
        </div>
      </section>
    </>
  );
}
