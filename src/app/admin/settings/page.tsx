import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/permissions';
import { getTotals } from '@/lib/totals';
import { DEFAULT_FX_USD_NPR, OFFICIAL_LINKS, SETTING_KEYS } from '@/lib/constants';
import { formatAsOf, formatNPR, formatUSD } from '@/lib/format';
import { FxForm } from './FxForm';

export default async function SettingsPage() {
  await requireRole('admin');

  const [fxSetting, disasters, totals] = await Promise.all([
    prisma.setting.findUnique({ where: { key: SETTING_KEYS.fxUsdNpr } }),
    prisma.disaster.findMany({ orderBy: { createdAt: 'desc' } }),
    getTotals(),
  ]);

  const fx = (fxSetting?.value ?? {}) as { rate?: number; source_ne?: string; source_en?: string };

  return (
    <>
      <div>
        <h1>सेटिङ · Settings</h1>
        <p className="lede">
          विनिमय दर परिवर्तन गर्दा वैदेशिक सहयोगको रुपैयाँ समतुल्य र कुल जोड तुरुन्तै पुनः गणना
          हुन्छ। · Changing the exchange rate immediately recomputes the rupee equivalent of foreign
          assistance and the grand total.
        </p>
      </div>

      <div className="card">
        <h2>विनिमय दर · Exchange rate (USD → NPR)</h2>
        <div style={{ marginTop: 12 }}>
          <FxForm
            rate={fx.rate ?? DEFAULT_FX_USD_NPR}
            sourceNe={fx.source_ne ?? ''}
            sourceEn={fx.source_en ?? ''}
          />
        </div>
        {totals ? (
          <div className="note" style={{ marginTop: 14 }}>
            हालको प्रभाव · current effect: {formatUSD(totals.foreign.total_usd, 'en')} ×{' '}
            {totals.fx_rate} = {formatNPR(totals.foreign.total_npr_equiv, 'en')} · grand total{' '}
            {formatNPR(totals.grand_total_npr, 'en')}
          </div>
        ) : null}
      </div>

      <div className="card">
        <h2>विपद् · Disasters</h2>
        <p className="lede">
          हरेक अभिलेख कुनै एक विपद्सँग जोडिएको हुन्छ, त्यसैले यही पोर्टलले अर्को विपद् पनि नयाँ slug
          मा सेवा दिन्छ। · Every record is scoped to a disaster, so the same portal serves the next
          one under a new slug.
        </p>
        <div className="tscroll" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Slug</th>
                <th>नाम · Name</th>
                <th>घटना मिति · Event date</th>
                <th>अवस्था · State</th>
              </tr>
            </thead>
            <tbody>
              {disasters.map((disaster) => (
                <tr key={disaster.id}>
                  <td className="nm">
                    <code>{disaster.slug}</code>
                  </td>
                  <td>
                    {disaster.name_ne} · {disaster.name_en}
                  </td>
                  <td>
                    {disaster.event_date_bs} · {formatAsOf(disaster.event_date_ad, 'en')}
                  </td>
                  <td>
                    <span className={`pill ${disaster.active ? 'published' : 'archived'}`}>
                      {disaster.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>आधिकारिक लिङ्क · Official links</h2>
        <div className="adm-kv" style={{ marginTop: 12 }}>
          {Object.entries(OFFICIAL_LINKS).map(([key, url]) => (
            <div key={key} style={{ display: 'contents' }}>
              <b>{key}</b>
              <span>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </span>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          यी ठेगाना कोडमा निश्चित छन् — परिवर्तन गर्नुपरे <code>src/lib/constants.ts</code> मा
          सम्पादन गरी पुनः तैनाथ गर्नुहोस्। · These addresses are fixed in code; changing one is a
          deployment, not a setting, so it cannot be altered by accident.
        </div>
      </div>
    </>
  );
}
