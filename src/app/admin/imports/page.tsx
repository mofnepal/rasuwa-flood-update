import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { getDisaster } from '@/lib/totals';
import { ContributionImport } from './ContributionImport';
import { ChannelImport } from './ChannelImport';
import { RescueImport } from './RescueImport';
import { DecisionImport } from './DecisionImport';

/** Today in Nepal Time, so the date fields default to the officer's own day. */
function todayNpt(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default async function ImportsPage() {
  await requireRole('entry');
  const disaster = await getDisaster();
  if (!disaster) return <div className="adm-err">No active disaster.</div>;

  const [latestNdrrma, latestPolice, latestContribution] = await Promise.all([
    prisma.rescueReport.findFirst({
      where: { disasterId: disaster.id, agency: 'NDRRMA' },
      orderBy: { report_at: 'desc' },
    }),
    prisma.rescueReport.findFirst({
      where: { disasterId: disaster.id, agency: 'NEPAL_POLICE' },
      orderBy: { report_at: 'desc' },
    }),
    prisma.contribution.findFirst({
      where: { disasterId: disaster.id },
      orderBy: { createdAt: 'desc' },
      select: { source: true },
    }),
  ]);

  return (
    <>
      <div>
        <h1>आयात · Imports</h1>
        <p className="lede">
          सबै आयात मस्यौदाका रूपमा बन्छ; प्रमाणित र प्रकाशन नभएसम्म सार्वजनिक पृष्ठमा देखिँदैन। ·
          Every import lands as a draft — nothing appears publicly until it is verified and
          published.
        </p>
      </div>

      <ContributionImport
        defaultSource={
          latestContribution?.source ?? "Finance Minister's Secretariat / Fund Section"
        }
      />

      <ChannelImport today={todayNpt()} />

      <RescueImport
        today={todayNpt()}
        previous={{
          ndrrma: JSON.stringify(latestNdrrma?.data ?? {}, null, 1),
          police: JSON.stringify(latestPolice?.data ?? {}, null, 1),
        }}
      />

      <DecisionImport />
    </>
  );
}
