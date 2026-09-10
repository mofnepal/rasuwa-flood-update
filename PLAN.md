# PLAN — रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update

Production re-implementation of `prototype/` on Next.js 15 + PostgreSQL + Prisma,
served at `https://mof.gov.np/rasuwa-flood` (`basePath: /rasuwa-flood`).

## 0. Source of truth & one resolved discrepancy

`prototype/data/data.js` + `seed/*` are newer than §4 of the build prompt.
§4 quotes NCHL as of 5 Sep 14:00, FX 152 and grand total NPR 10,088,871,967.10.
The shipped seed carries a 7 Sep 17:00 NCHL snapshot, a 6 Sep Fonepay snapshot,
`seed/fund_status.json` (FX **150.88**, the rate printed in the Fund status statement)
and the four-category accounting rule of §2.8, which §4 predates.

**Decision: seed data + §2.8 are authoritative.** Verified totals become:

|                                                                            |                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------- |
| A · NCHL (9 Sep 2026 00:00)                                                | NPR 4,675,326,200.05 · 254,909 txns                 |
| A · Fonepay (till 6 Sep 2026)                                              | NPR 2,375,275,198 · 902,446 txns                    |
| B · Handovers to Hon. Finance Minister (389 rows, Bhadra 11–19 and 24)     | NPR 2,152,542,309.25 — NPR only                     |
| **NPR receipts (A + B)**                                                   | **NPR 9,203,143,707.30**                            |
| C · Foreign = USD gross into the Fund's USD accounts (2083/05/24, 9:00 AM) | USD 20,557,379                                      |
| D · Identified foreign contributors (subset of C)                          | USD 10,200,000 — NVIDIA 10M + Embassy of China 200K |
| FX (Fund status statement)                                                 | 151.42                                              |
| **Grand total = A + B + C × FX**                                           | **NPR 12,315,942,035.48**                           |

Account status (never added to the contributions total), from the 2083/05/24 9:00 AM
statement: NPR balance 8,788,258,304 · USD balance 21,143,427 (≈ NPR 3,201,537,780) ·
total available fund balance NPR 11,989,796,084, after NPR 1,000,000,000 transferred to
NDRRMA on 2083/05/16. The statement's own NPR bank column sums to NPR 8,788,258,305 —
one rupee above its printed total; the portal shows the printed total.
Vitest asserts every figure above against the seeded database.

## 1. Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 **plus a ported `site.css`
design system** (the prototype's tokens and class names, so there is no visual drift) ·
next-intl 4 · Recharts 3 · lucide-react · PostgreSQL 16 + Prisma 6 · Auth.js v5
(credentials, argon2 via `@node-rs/argon2`) · Zod 4 · Vitest · Playwright ·
Docker Compose (web · postgres · minio · nginx) · MinIO-backed storage adapter.
Local dev without Docker uses `embedded-postgres` (`pnpm db:local`).

## 2. Routes

```
/[locale]                      Home — infographic front page, snapshot of every section
/[locale]/contributions        Categories A + B: KPIs, channel charts, register, sectors, account status
/[locale]/foreign              Categories C + D: featured card, type breakdown, register
/[locale]/rescue               NDRRMA + Nepal Police mirror, portal banner, live embed, archive
/[locale]/initiatives          Cabinet decisions, 5 categories, 18 measures + drawer
/[locale]/contact              Single-window contacts, ministry details, map, message form
/[locale]/search               Server-side site search (header box posts here)
/admin                         Dashboard, queues, imports, users, settings (auth)
/api/v1/*                      Open data (JSON + ?format=csv), published records only
/api/health                    Health probe
/og/[page]                     OG image per page
```

Locales `ne` (default) and `en`, always in the URL. `?static=1` disables animation for PDF print.

## 3. Data model (Prisma)

Exactly §3 of the spec: `Disaster · Contribution · ForeignAssistance · ChannelSnapshot ·
FundStatusSnapshot · RescueReport · Decision · Measure · Contact · Attachment · User ·
AuditLog · Message · Setting`, enums `RecordStatus · Role · ContributorType · PaymentMode ·
AssistanceKind · Network · SnapshotPeriod`. All money `Decimal(18,2)`; everything scoped by
`Disaster` so the next disaster is a new slug. `Contribution.sector` added (editable, with
keyword auto-suggestion at entry time). A row marked category D in the source list is a
foreign-currency cheque and is recorded only as foreign assistance, never as a handover.

## 4. Shared libraries

- `lib/format.ts` — `toNepaliDigits`, `groupIndian`, `formatNumber`, `formatNPR`, `formatUSD`,
  `formatShort`, `formatPercent`, `formatAD`, `bsDate` (BS first, AD second). Unit-tested.
- `lib/bs.ts` — BS↔AD calendar table for 2080–2090.
- `lib/totals.ts` — the §2.8 accounting rule in one place, cached 60 s, over SQL views.
- `lib/sectors.ts` — 15 sector codes + keyword rules used for auto-suggestion.
- `lib/parse.ts` — Indian-grouped/Devanagari number parser for the importers.
- `lib/storage.ts` — S3-compatible adapter (MinIO), local disk fallback.
- `lib/audit.ts` — every mutation writes `AuditLog` before/after.

## 5. Components

`SiteHeader` (emblem, search, ने|EN, donate), `MainNav`, `Stripe`, `Ticker`, `SiteFooter`,
`KpiTile`, `SectionHeader`, `SourceChip`, `HeroTotal`, `DataTable` (search / filter / chips /
sort / paginate / CSV, URL-synced), `Donut` `HBar` `VBar` `LineChart` (Recharts wrappers with
locale digits, source chip, reduced-motion), `CountUp`, `MeasureDrawer`, `PortalBanner`,
`LiveEmbed`, `EmptyState`, `Icon` (Lucide map from §7).

## 6. Build order

1. Scaffold, Prisma schema, seed, `/` rendering real totals in both locales.
2. contributions → foreign → initiatives → rescue → contact.
3. Admin (auth, roles, workflow, imports, audit) → API v1 → OG + print → CI/Docker.
4. Vitest (format, parsers, totals, workflow) + Playwright (every page × 2 locales).

## 7. Public-content rules honoured

Published records only; every figure carries `source` + `as_of`; combined totals list each
source's cut-off; no formulas, file names or developer text on public pages; empty states read
"प्रविष्टि प्रतीक्षारत · awaiting verified entry"; currency is "रु." / "NPR", never "Rs";
the statement is called "Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status
(Nepal Rastra Bank)"; NDRRMA rescued-persons data is linked and embedded, never copied.
