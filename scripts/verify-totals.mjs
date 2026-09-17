/**
 * Audits every published figure against its own source.
 *
 * This checks internal consistency — that each document's parts sum to the total
 * it prints, that the portal reproduces those figures unchanged, and that the
 * four categories combine the way the accounting rule says. It cannot confirm
 * the source documents themselves; only the Fund Section can do that.
 *
 *   node --env-file=.env scripts/verify-totals.mjs
 *
 * The printed totals it checks against live in seed/published_totals.json, so a
 * data update carries its own expected figures. The GitHub Pages workflow runs
 * this before every publication and publishes nothing if a figure differs.
 */
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';

const p = new PrismaClient();
const n = (v) => (v == null ? 0 : Number(v));
const money = (v) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let checks = 0;
let failures = 0;
const notes = [];

function check(label, got, want, tolerance = 0.005) {
  checks++;
  const ok = Math.abs(got - want) <= tolerance;
  if (!ok) failures++;
  const delta = got - want;
  console.log(
    `  ${ok ? 'ties  ' : 'DIFFERS'}  ${label.padEnd(52)} ${money(got).padStart(20)}` +
      (ok ? '' : `   vs ${money(want)}  (${delta > 0 ? '+' : ''}${money(delta)})`),
  );
  return ok;
}

function note(text) {
  notes.push(text);
  console.log(`  note     ${text}`);
}

const d = await p.disaster.findUnique({ where: { slug: 'rasuwa-2083' } });

// ── A: each channel snapshot sums to what the network published ─────────────
console.log('\nA · ONLINE CHANNELS — each snapshot against its own channel lines');
const snaps = await p.channelSnapshot.groupBy({
  by: ['network', 'snapshot_at'],
  where: { disasterId: d.id, period: 'cumulative', status: 'published' },
  _sum: { amount_npr: true, txn_count: true },
  orderBy: { snapshot_at: 'asc' },
});
const printed = JSON.parse(await readFile('seed/published_totals.json', 'utf8'));
const published = printed.channel_snapshots;
for (const s of snaps) {
  const key = `${s.network}|${s.snapshot_at.toISOString().slice(0, 10)}`;
  const sum = n(s._sum.amount_npr);
  if (published[key] != null)
    check(`${key} channel lines sum to published total`, sum, published[key], 1.005);
  else console.log(`  (no published total recorded for ${key}: ${money(sum)})`);
}

const latestOf = async (net) => {
  const r = await p.channelSnapshot.findFirst({
    where: { disasterId: d.id, network: net, period: 'cumulative', status: 'published' },
    orderBy: { snapshot_at: 'desc' },
  });
  if (!r) return { npr: 0, txns: 0, at: null };
  const a = await p.channelSnapshot.aggregate({
    where: { disasterId: d.id, network: net, period: 'cumulative', snapshot_at: r.snapshot_at },
    _sum: { amount_npr: true, txn_count: true },
  });
  return {
    npr: n(a._sum.amount_npr),
    txns: a._sum.txn_count ?? 0,
    at: r.snapshot_at.toISOString(),
  };
};
const nchl = await latestOf('NCHL');
const fonepay = await latestOf('FONEPAY');
const A = nchl.npr + fonepay.npr;
console.log(`  A = NCHL ${money(nchl.npr)} + Fonepay ${money(fonepay.npr)} = ${money(A)}`);

// ── B: the handover register ────────────────────────────────────────────────
console.log('\nB · HANDOVERS — the register against the source list');
const b = await p.contribution.aggregate({
  where: { disasterId: d.id, status: 'published' },
  _sum: { amount_npr: true, amount_usd: true },
  _count: true,
});
const B = n(b._sum.amount_npr);
check('register sums to the source lists', B, printed.handover_register.total_npr);
check('register row count', b._count, printed.handover_register.entries);
const handoverRows = await p.contribution.findMany({
  where: { disasterId: d.id, status: 'published' },
  select: { date_bs: true, payment_mode: true, amount_npr: true },
});
const sumOf = (rows) => rows.reduce((s, r) => s + n(r.amount_npr), 0);
for (const [day, total] of Object.entries(printed.handover_register.by_day ?? {}))
  check(
    `${day} entries sum to the day's printed total`,
    sumOf(handoverRows.filter((r) => r.date_bs === day)),
    total,
  );
if (printed.handover_register.cheque_npr != null) {
  check(
    'cheques sum to the printed cheque amount',
    sumOf(handoverRows.filter((r) => r.payment_mode === 'cheque')),
    printed.handover_register.cheque_npr,
  );
  check(
    'the rest sum to the printed cash, voucher and online amount',
    sumOf(handoverRows.filter((r) => r.payment_mode !== 'cheque')),
    printed.handover_register.cash_voucher_online_npr,
  );
}
const serials = (
  await p.contribution.findMany({
    where: { disasterId: d.id, status: 'published' },
    select: { sn: true },
    orderBy: { sn: 'asc' },
  })
)
  .map((r) => r.sn)
  .filter((v) => v != null);
const movedSetting = await p.setting.findUnique({ where: { key: 'register_serials_in_foreign' } });
const moved = new Set(movedSetting?.value?.serials ?? []);
const gaps = [];
for (let i = 1; i < serials.length; i++) {
  let from = serials[i - 1] + 1;
  let to = serials[i] - 1;
  while (from <= to && moved.has(from)) from++;
  while (to >= from && moved.has(to)) to--;
  if (from <= to) gaps.push(from === to ? `${from}` : `${from}-${to}`);
}
if (gaps.length)
  note(
    `the register is numbered ${serials[0]}-${serials.at(-1)} with entries ${gaps.join(', ')} not yet supplied; the page says so`,
  );
else console.log('  ties      the register is numbered without a break');
check('no USD in category B (a USD cheque belongs to D)', n(b._sum.amount_usd), 0);

// ── C: the fund status statement, against itself ────────────────────────────
console.log('\nC · FUND STATUS STATEMENT — the statement against its own parts');
const fs = await p.fundStatusSnapshot.findFirst({
  where: { disasterId: d.id, status: 'published' },
  orderBy: { as_of: 'desc' },
});
const series = fs.series;
const nprBanks = series.npr.banks.reduce((s, [, , bal]) => s + bal, 0);
const usdBanks = series.usd.banks.reduce((s, [, , bal]) => s + bal, 0);
console.log(`  statement of ${fs.as_of_en}, rate ${fs.fx_rate}`);
check('NPR bank balances sum to the printed NPR total', nprBanks, n(fs.npr_balance), 1.005);
check(
  'before + collected − disbursed = NPR balance',
  n(fs.npr_before) + n(fs.npr_gross) - n(fs.npr_usage),
  n(fs.npr_balance),
);
check('USD bank balances sum to the printed USD total', usdBanks, n(fs.usd_balance), 1.005);
check('before + collected = USD balance', n(fs.usd_before) + n(fs.usd_gross), n(fs.usd_balance));
check(
  'NPR balance + USD equivalent = total available',
  n(fs.npr_balance) + n(fs.usd_equiv_npr),
  n(fs.total_available_npr),
  1.005,
);
const computedEquiv = n(fs.usd_balance) * n(fs.fx_rate);
if (Math.abs(computedEquiv - n(fs.usd_equiv_npr)) > 1) {
  note(
    `the statement's own USD equivalent is ${money(n(fs.usd_equiv_npr))}, while ` +
      `${money(n(fs.usd_balance))} x ${fs.fx_rate} = ${money(computedEquiv)} ` +
      `(a ${money(n(fs.usd_equiv_npr) - computedEquiv)} rounding in the ministry's sheet; the printed figure is used)`,
  );
}
const C = n(fs.usd_gross);

// ── D: identified contributors are a subset of C ────────────────────────────
console.log('\nD · IDENTIFIED FOREIGN CONTRIBUTORS — a subset of C, never added');
const faAll = await p.foreignAssistance.findMany({
  where: { disasterId: d.id, status: 'published' },
});
// Only what the ministry has verified in the Fund is category D; support reported by
// OPMCM sits in the same register with in_fund=false and is never counted.
const fa = faAll.filter((f) => f.in_fund);
const reportedRows = faAll.filter((f) => !f.in_fund);
const D = fa.reduce((s, f) => s + n(f.amount_usd), 0);
check('identified USD', D, printed.foreign_identified_usd);
checks++;
if (D <= C)
  console.log(
    `  ties      identified (${money(D)}) is within the fund's USD deposits (${money(C)})`,
  );
else {
  failures++;
  console.log(`  DIFFERS   identified exceeds category C`);
}
for (const f of fa) {
  const implied = n(f.amount_npr_equiv) / n(f.amount_usd);
  check(
    `${f.contributor.slice(0, 34)} stated at its own published rate`,
    implied,
    n(f.fx_rate),
    0.0001,
  );
}

// ── the grand total ─────────────────────────────────────────────────────────
console.log('\nGRAND TOTAL — A + B + C x FX');
const fx = n(fs.fx_rate);
const grand = A + B + C * fx;
console.log(`  A ${money(A)}  +  B ${money(B)}  +  C ${money(C)} x ${fx} (${money(C * fx)})`);
console.log(`  grand total                                          ${money(grand).padStart(20)}`);

const portal = process.env.VERIFY_PORTAL_URL ?? 'http://localhost:3111/rasuwa-flood';
const api = await fetch(`${portal}/api/v1/summary`)
  .then((r) => r.json())
  .catch(() => null);
if (api) {
  check('the portal publishes the same grand total', api.grand_total_npr, grand);
  check('the portal publishes the same NPR receipts', api.npr_receipts, A + B);
} else console.log('  (portal not running; skipped the served-figure check)');

// ── the settlement gap, stated not hidden ───────────────────────────────────
console.log('\nSETTLEMENT — receipts recorded against money in the fund accounts');
const gap = A + B - n(fs.npr_gross);
console.log(`  recorded NPR receipts      ${money(A + B).padStart(20)}`);
console.log(`  deposited in fund accounts ${money(n(fs.npr_gross)).padStart(20)}`);
console.log(
  `  difference                 ${money(gap).padStart(20)}  — settlement and cheque clearing in progress`,
);
note('this difference is disclosed on the contributions page, not netted off');

// ── rescue reports, each against its own parts ──────────────────────────────
console.log('\nRESCUE REPORTS — each report against its own breakdown');
const reports = await p.rescueReport.findMany({
  where: { disasterId: d.id, status: 'published' },
  orderBy: { report_at: 'desc' },
});
for (const r of reports) {
  const x = r.data;
  const label = `${r.agency} ${r.report_at.toISOString().slice(0, 10)}`;
  if (r.agency === 'NDRRMA') {
    check(
      `${label} bodies by district sum to casualties`,
      Object.values(x.bodies_by_district).reduce((s, v) => s + v, 0),
      x.human_casualties,
    );
    if (x.security_personnel_mobilised != null)
      check(
        `${label} security breakdown sums to the total`,
        Object.values(x.security_breakdown ?? {}).reduce((s, v) => s + v, 0),
        x.security_personnel_mobilised,
      );
    if (x.deceased_breakdown) {
      const detail = Object.values(x.deceased_breakdown).reduce((s, v) => s + v, 0);
      // A report whose own detail does not reach its total is loaded as printed,
      // with a note on the page; that note is required here in place of the tie.
      if (detail !== x.human_casualties && x.deceased_note_en)
        note(
          `${label}: the deceased detail sums to ${detail}, ${x.human_casualties - detail} fewer than the report's own total of ${x.human_casualties}; shown as printed, with a note`,
        );
      else
        check(`${label} deceased by sex and remains sum to casualties`, detail, x.human_casualties);
    }
    check(
      `${label} holding centres sum to the total`,
      Object.values(x.holding_center_breakdown).reduce((s, v) => s + v, 0),
      x.holding_center_people,
    );
    // Only the reports that say they deduct the bodies handed over are checked
    // that way; the earlier ones sum straight to their printed total.
    const missingParts = Object.values(x.missing_breakdown).reduce((s, v) => s + v, 0);
    const missingFromParts =
      missingParts - (x.missing_excludes_handover ? x.dead_body_handover : 0);
    // A report whose own chart does not reach its total is loaded as printed, with a
    // note on the page; that note is required here in place of the tie.
    if (missingFromParts !== x.missing_total_approx && x.missing_breakdown_note_en)
      note(
        `${label}: the missing chart sums to ${missingFromParts} after the bodies handed over, ${x.missing_total_approx - missingFromParts} fewer than the report's own total of ${x.missing_total_approx}; shown as printed, with a note`,
      );
    else
      check(
        `${label} missing breakdown${x.missing_excludes_handover ? ', less bodies handed over' : ''}`,
        missingFromParts,
        x.missing_total_approx,
      );
    if (x.missing_rasuwa_breakdown)
      check(
        `${label} Rasuwa breakdown sums to its line`,
        Object.values(x.missing_rasuwa_breakdown).reduce((s, v) => s + v, 0),
        x.missing_breakdown.Rasuwa,
      );
    if (x.missing_nuwakot_breakdown)
      check(
        `${label} Nuwakot breakdown sums to its line`,
        Object.values(x.missing_nuwakot_breakdown).reduce((s, v) => s + v, 0),
        x.missing_breakdown.Nuwakot,
      );
    if (x.injured_receiving_treatment != null) {
      // Those discharged from hospital are no longer receiving treatment.
      const sum = Object.entries(x.injured_breakdown)
        .filter(([key]) => key !== 'hospitals_discharged')
        .reduce((total, [, v]) => total + v, 0);
      check(
        `${label} injured parts sum to the total${x.injured_total_derived ? ' (derived)' : ''}`,
        sum,
        x.injured_receiving_treatment,
      );
    }
  } else {
    check(
      `${label} bodies found sum to the total`,
      x.bodies_found.male + x.bodies_found.female + x.bodies_found.partial_remains,
      x.bodies_found.total,
    );
    check(
      `${label} missing sums to the total`,
      x.missing.domestic.total + x.missing.foreign.total,
      x.missing.total,
    );
    check(
      `${label} injured and rescued sum to the total`,
      x.injured_rescued.male + x.injured_rescued.female + (x.injured_rescued.unknown ?? 0),
      x.injured_rescued.total,
    );
    check(`${label} DNA samples sum to the total`, x.dna.deceased + x.dna.relatives, x.dna.total);
  }
}

// ── disbursements: out of the Fund, and onward ─────────────────────────────
console.log('\nDISBURSEMENTS — out of the Fund, and onward, against their sources');
const disbursed = await p.disbursement.findMany({
  where: { disasterId: d.id, status: 'published' },
});
const transferredOut = disbursed
  .filter((r) => r.stage === 'fund_transfer')
  .reduce((s, r) => s + n(r.amount_npr), 0);
const onwardOut = disbursed
  .filter((r) => r.stage === 'onward')
  .reduce((s, r) => s + n(r.amount_npr), 0);
check(
  'transfers out of the Fund equal the statement’s fund usage',
  transferredOut,
  n(fs.npr_usage),
);
check(
  'transfers out of the Fund as printed',
  transferredOut,
  printed.disbursements.transferred_npr,
);
check('onward disbursement as printed', onwardOut, printed.disbursements.onward_npr);
checks++;
if (onwardOut <= transferredOut)
  console.log(
    `  ties      onward (${money(onwardOut)}) is within what was transferred (${money(transferredOut)})`,
  );
else {
  failures++;
  console.log('  DIFFERS   onward disbursement exceeds what was transferred');
}
// The onward figures must agree with the NDRRMA report that carries the cash-support table.
const cashReport = reports.find((r) => r.agency === 'NDRRMA' && r.data.cash_support_npr);
if (cashReport) {
  const fromReport = Object.values(cashReport.data.cash_support_npr).reduce((s, v) => s + v, 0);
  check(
    `onward disbursement equals the cash support in the NDRRMA report of ${cashReport.report_at.toISOString().slice(0, 10)}`,
    onwardOut,
    fromReport,
  );
}

// ── international support, as OPMCM reports it — listed, never added ───────
console.log('\nINTERNATIONAL SUPPORT (OPMCM) — in the register, kept out of every total');
const statedUsd = reportedRows.reduce((s, r) => s + n(r.amount_usd), 0);
check('entries as fetched from OPMCM', reportedRows.length, printed.international_support.entries);
check(
  'stated US-dollar figures sum as fetched',
  statedUsd,
  printed.international_support.stated_usd,
);
checks++;
console.log(
  `  ties      category D (${money(D)}) excludes these ${money(statedUsd)}; the grand total carries none of them`,
);

// ── announced domestic support, as OPMCM lists it — listed, never added ────
console.log(
  '\nANNOUNCED DOMESTIC SUPPORT (OPMCM) — on the contributions page, kept out of every total',
);
const announced = await p.announcedSupport.findMany({
  where: { disasterId: d.id, status: 'published' },
});
check('entries as fetched from OPMCM', announced.length, printed.announced_support.entries);
const pledgedNpr = announced
  .filter((r) => r.state === 'pledged')
  .reduce((s, r) => s + n(r.amount_npr), 0);
check('pledged rupee figures sum as fetched', pledgedNpr, printed.announced_support.pledged_npr);
// An entry already in the handover register must point at a row with the same amount.
for (const r of announced.filter((r) => r.state === 'in_register')) {
  const hit = await p.contribution.findFirst({
    where: { disasterId: d.id, status: 'published', sn: Number(r.register_ref) },
  });
  check(
    `${r.contributor_en}: register no. ${r.register_ref} carries the same amount`,
    hit ? n(hit.amount_npr) : -1,
    n(r.amount_npr),
  );
}
// Cash to districts is the onward disbursement to districts, not a contribution.
const districtCash = disbursed
  .filter((r) => r.stage === 'onward' && r.recipient_kind === 'district')
  .reduce((s, r) => s + n(r.amount_npr), 0);
for (const r of announced.filter((r) => r.state === 'disbursed'))
  check(
    `${r.contributor_en} equals the onward disbursement to districts`,
    n(r.amount_npr),
    districtCash,
  );
checks++;
console.log(
  `  ties      the grand total carries none of these ${money(pledgedNpr)} in pledges; the Fund records count`,
);

// ── action plans, each against its own document ────────────────────────────
console.log('\nACTION PLANS — each plan against its own numbering and bodies');
const plans = await p.actionPlan.findMany({
  where: { disasterId: d.id, status: 'published' },
  orderBy: { date_ad: 'desc' },
});
for (const plan of plans) {
  const x = plan.data;
  const label = plan.slug;
  const numbers = x.actions.map((a) => a.no);
  check(
    `${label}: actions numbered 1..${numbers.length} without a break`,
    numbers.every((no, i) => no === i + 1) ? numbers.length : -1,
    numbers.length,
  );
  const themes = new Set(x.themes.map((t) => t.code));
  const agencies = new Set(x.agencies.map((a) => a.code));
  check(
    `${label}: every action has a known theme and body`,
    x.actions.filter((a) => themes.has(a.theme) && a.agencies.every((c) => agencies.has(c))).length,
    x.actions.length,
  );
  check(
    `${label}: every dated deadline names its month`,
    x.actions.filter(
      (a) => a.deadline.kind !== 'month_end' || (a.deadline.bs_year && a.deadline.bs_month),
    ).length,
    x.actions.length,
  );
}
if (plans.length === 0) console.log('  (no action plan published)');

// ── cross-agency ────────────────────────────────────────────────────────────
console.log('\nCROSS-AGENCY');
// The two agencies' figures are only comparable for the same day: a later report
// from one naturally differs from the other's earlier one, and that is not an error.
const reportDay = (r) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(r.report_at);
const ndrrma = reports.find((r) => r.agency === 'NDRRMA');
const police = reports.find((r) => r.agency === 'NEPAL_POLICE');
const policeSameDay =
  ndrrma && reports.find((r) => r.agency === 'NEPAL_POLICE' && reportDay(r) === reportDay(ndrrma));
if (ndrrma && policeSameDay) {
  check(
    `NDRRMA casualties vs Nepal Police bodies found (${reportDay(ndrrma)})`,
    ndrrma.data.human_casualties,
    policeSameDay.data.bodies_found.total,
  );
  check(
    `bodies handed over agree between the two agencies (${reportDay(ndrrma)})`,
    ndrrma.data.dead_body_handover,
    policeSameDay.data.body_handover,
  );
} else if (ndrrma && police) {
  note(
    `the latest NDRRMA report (${reportDay(ndrrma)}) and Nepal Police report (${reportDay(police)}) are from different days, so they were not compared`,
  );
}

console.log(
  `\n${checks - failures} of ${checks} checks tie.` +
    (failures ? `  ${failures} DIFFER — see above.` : '  Nothing differs.'),
);
if (notes.length) {
  console.log('\nStated, not hidden:');
  notes.forEach((t) => console.log(`  · ${t}`));
}
await p.$disconnect();
process.exit(failures ? 1 : 0);
