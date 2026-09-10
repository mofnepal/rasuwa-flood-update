# रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update — Build prompt for Claude Code

> Paste everything below this line into Claude Code as the first message (or save as `CLAUDE.md` in the repo root and say "read CLAUDE.md and build it"). Keep the `seed/`, `prototype/` and `reference/` folders from this starter pack in the repo root before you start.

---

You are building **रसुवा–भोटेकोशी बाढी अपडेट (MoF Rasuwa–Bhotekoshi Flood Update)** — the official _Rasuwa–Bhotekoshi Flood Relief Transparency Portal_ of the **Government of Nepal, Ministry of Finance**. It will live at **https://mof.gov.np/rasuwa-flood** (subpath of the existing ministry site, behind a reverse proxy) and must serve the public for years, across future disasters, so build it as a maintainable product, not a one-off page.

The portal answers one question in public: _"Every rupee and every dollar given for the Rasuwa flood — where did it come from, through which channel, on what date, and what has the government decided?"_ — plus a rescue section that mirrors official NDRRMA / Nepal Police data and links to the official rescue portals.

A **working, responsive, bilingual prototype already exists in `prototype/`** (plain HTML/CSS/JS, open `prototype/index.html`; language toggle ने|EN; every number rendered from `prototype/data/data.js`; charts with Chart.js). The Nepali and English PDFs in `prototype/` are printed from it. Treat the prototype as the visual and functional specification: reproduce its pages, layout, palette, typography, icon language, chart types, table behaviour (search/filter/sort/paginate/CSV) and the rescue-portal banner and live embed exactly — then re-implement them on the production stack below with a database, admin workflow and imports. `prototype/assets/js/app.js` contains the number/date formatting rules (Indian grouping, Devanagari digits, BS-first dates) and the exact total formulas; port them with tests.

## 0. Non-negotiables

1. **Official identity only.** Colours: Crimson `#C8102E`, Navy `#003893`, Surface `#F4F6FA`, Border `#DCE1EA`, Ink `#14213D`, Muted `#5B6478`, Gold accent `#C9A227` (sparingly), Success `#1F8A4C`. Nothing else. Emblem of Nepal (`design/assets/emblem_crop.png` is a placeholder — replace with the official high-res emblem the ministry provides; keep aspect ratio, never recolour or restyle it). The red/blue "stripe" under the nav is the only decorative flourish.
2. **Bilingual, Nepali first.** Every string in Nepali (Devanagari) and English via `next-intl`. Default locale `ne`; toggle `ने | EN` in the header; locale in the URL (`/rasuwa-flood/ne/...`, `/rasuwa-flood/en/...`). In `ne` mode all numbers use Devanagari digits and lakh/crore grouping (`४,२६,३५,६५,१७४`); in `en` mode Western digits with Indian grouping (`4,26,35,65,174`) and also show short form (`Rs 4.26 billion`). Dates shown as **BS first, AD second** (`२०८३ भदौ २१ · 6 Sep 2026`). Write a `formatNumber`, `formatNPR`, `toNepaliDigits`, `bsDate` utility set with unit tests.
3. **Typeface Mukta** (Google Fonts, OFL — supports Devanagari + Latin in one family; files are in `design/fonts/`). Self-host it. Weights 400/600/700/800.
4. **No invented data, ever.** Every number shown comes from the database, has a `source` and an `as_of` timestamp, and public pages print that "as of" next to the figure. Different sources have different cut-off times (NCHL 5 Sep 14:00, Fonepay till 5 Sep, in-person list till Bhadra 19, NDRRMA 6 Sep 18:00) — when you show a combined total, show the per-source cut-offs beneath it and a one-line note that consolidated figures are subject to reconciliation by the Fund Section.
5. **Nothing goes public without verification.** Public pages only render records with `status = published`. The admin workflow (Section 6) enforces entry → verify → publish with an audit log.
6. **Icons, not clip-art.** Use a single consistent line-icon set (Lucide) tinted navy/crimson, as in the design. Every KPI, section header and category has an icon. No emoji, no stock photos except official handover photos uploaded by admins.
7. **Official links, exact URLs:** donate: `https://donate.gov.np/` · rescue request: `https://rescue.opmcm.gov.np/` · rescued persons list: `https://ndrrma.gov.np/np/rasuwa` · command centre: `https://setu.ndrrma.gov.np` · ministry: `https://mof.gov.np/`. The rescued-persons **data is never copied** into our DB — we link to the NDRRMA page and (optionally) embed it in an iframe with a clear source label.
8. **Accessibility & performance:** WCAG 2.1 AA, keyboard navigable, visible focus, `prefers-reduced-motion` respected, Lighthouse ≥ 90 on all four scores for the home page on mobile.

## 1. Stack

- **Next.js 15 (App Router), TypeScript, Tailwind CSS**, `next-intl`, **Recharts** for charts (donut, horizontal bars, daily columns, district bars), **Lucide** icons.
- **PostgreSQL 16 + Prisma.** Server Actions for admin mutations; public read API under `/api/v1/*` (JSON) with CSV/XLSX export.
- **Auth.js** (credentials + optional Google Workspace SSO later). Roles: `entry`, `verifier`, `publisher`, `admin`. Passwords hashed with argon2. Rate-limit login.
- **File storage:** local `/data/uploads` behind an S3-compatible adapter (MinIO in Docker) so it can move to cloud later. PDFs/JPGs of reports, cheques, letters and handover photos.
- **Docker Compose** (web, postgres, minio, nginx). `basePath: '/rasuwa-flood'` in `next.config`. Nightly `pg_dump` to `/backups`, 30-day retention.
- **Testing:** Vitest for utils and server actions; Playwright smoke tests for each public page in both locales.
- **Tooling:** ESLint, Prettier, Husky pre-commit, GitHub Actions CI (lint, test, build, docker image).

## 2. Information architecture (6 public sections + admin)

Header (all pages): emblem · "नेपाल सरकार / अर्थ मन्त्रालय" · portal name · **site-wide search box** (contributors, sectors, foreign assistance, relief measures, contacts, updates, sections — results grouped, Enter opens the first; server-side search over published records in production) · language toggle · red **donate.gov.np** button. Nav: गृहपृष्ठ · प्राप्त सहयोग · वैदेशिक सहयोग · उद्धार · सरकारका पहल · सम्पर्क (Nepali bold, English small). Below the nav a LIVE ticker with the last-updated time and sources. Footer: portal name, ministry address/phones/emails, "last updated" timestamp, link to `/api/v1` open data, © नेपाल सरकार.

### 2.1 `/` गृहपृष्ठ · Home — _the infographic front page; every section has a live snapshot here_

- Hero: update timestamp; headline; **grand total NPR received** in a crimson-bordered tile; donut of the three sources (NCHL, Fonepay, in-person/cheque) with legend %; sub-line for foreign USD.
- Four KPI tiles: Online NCHL · Online Fonepay · Handover to Hon. Finance Minister (crimson) · Foreign assistance (navy) — each with icon, amount, transaction/entry count and as-of; numbers count up on load (respect reduced-motion).
- NCHL and Fonepay channel bar charts; daily handover flow chart; "how contributions reach the fund" flow.
- **Rescue snapshot**: six KPI tiles + bodies-by-district and missing-by-source charts, linking to `/rescue`.
- **Foreign snapshot** (each contributor card) and **Government initiatives snapshot** (measures-by-category chart), each linking to its section.
- Latest handovers table (8 newest) and latest-updates feed.
- "How contributions reach the fund" — 4-step flow (donate.gov.np → handover → foreign → PM Disaster Relief Fund).
- "Latest updates" — auto-generated feed from the newest published records across all sections (max 6).
- Three CTA cards: Donate (crimson) · Request rescue · Rescued persons list.

### 2.2 `/contributions` प्राप्त सहयोग · Contributions Received — _database + infographics_

- Tabs: All · NCHL · Fonepay · Card · In-person. Export CSV/XLSX.
- KPI row: grand total · digital total (NCHL+Fonepay) · in-person total (entries, unique donors) · average online gift.
- **NCHL channel chart** (horizontal bars, 7 channels, amount + count + %) and **Fonepay channel chart** (5 channels). Each chart shows the network's own as-of. A **daily trend line** per network is built from stored daily snapshots (Fonepay gives "yesterday" numbers; NCHL cumulative deltas).
- **Verified contributor register** (in-person/cheque list): searchable, filterable (date BS, type institutional/individual, mode cheque/bank transfer, amount range), sortable, paginated 25/page, columns: क्र. · मिति · दाता · प्रकार · माध्यम · रकम · ✓ (verified badge with hover showing verifier role + date, no personal names of staff). USD entries show USD and NPR equivalent at the rate stored on the record.
- Breakdown panel: institutional vs individual, cheque vs bank transfer, **daily flow column chart** by BS date.
- **Sector classification** of every contributor (15 categories as in `prototype/data/data.js → sectors`; the keyword rules are in the seed generator and must become an editable admin field with the auto-suggestion shown at entry time). Sector column + filter in the register, a "handovers by sector" bar chart and click-to-filter sector list.
- **Quick-filter chips with counts** (institutional / individual / cheque / bank transfer / ≥ 1 crore / USD) above the register, a Clear button, and deep links `?q=`, `?sector=`.
- "Top contributors" is fine as a sort, but do **not** rank people on a leaderboard by default — default sort is date descending.

### 2.3 `/foreign` वैदेशिक सहयोग · Foreign Assistance

- KPIs: total USD (and NPR equiv), cash, in-kind (with valuation), pledged-not-received.
- **Featured contribution card** (currently NVIDIA USD 10,000,000 ≈ NPR 1.52 billion, 1 Sep 2026) — admin can pin any record as featured; supports an official handover photo.
- Breakdown by contributor type: `corporation` · `government_embassy` · `multilateral` · `ingo_foundation` · `diaspora` · `individual_abroad`.
- Register table: date · contributor · country (flag icon optional, no third-party images) · type · kind (cash / cash_cheque / in_kind / pledge) · channel · USD · NPR equiv · ✓. Pledge → received status change is tracked.

### 2.4 `/rescue` उद्धार · Rescue

- Date tabs (each published NDRRMA daily report is a tab; latest default). PDF download of the original.
- Six KPIs from NDRRMA: rescued · casualties · missing · injured in treatment · people at holding centres · security personnel mobilised, each with the breakdown line.
- **Bodies recovered by district** column chart; Nepal Police panel (bodies found M/F/partial, managed, DNA samples, unidentified uploaded, missing domestic/foreign).
- **A full-width navy banner directly under the page title** ("आधिकारिक उद्धार पोर्टलहरू") with a LIVE pulse and three tiles linking to rescue.opmcm.gov.np, ndrrma.gov.np/np/rasuwa and setu.ndrrma.gov.np (as in the prototype).
- **Live embed** of ndrrma.gov.np/np/rasuwa (iframe with a styled fallback that stays visible if the site blocks framing, plus an "open in new tab" button). The NDRRMA data is never copied into our database.
- Additional NDRRMA fields shown in an accordion: helicopter flights, electricity restoration %, relief supplies text, fuel stock, telecom towers, cash support to districts, psychosocial personnel.
- **District-level table** (bodies, missing by DAO, holding centres, electricity %, cash support) — searchable, sortable, with chips for core vs downstream districts.
- **Daily report archive**: searchable table of every uploaded report (PDF/JPG) filterable by agency and date, with its parsed structured fields; diff vs previous day shown as small ▲▼ deltas.

### 2.5 `/initiatives` सरकारका पहल · Government Initiatives

- Page title is "सरकारबाट भएका पहल · Government initiatives" (never "decisions" in the UI).
- KPIs: cabinet decisions · relief measures in force · MoF notices · cash support to districts.
- Timeline of decisions (date BS/AD, issuer, title).
- **Business Recovery Plan Phase 1** block: 5 category cards (क–ङ with agency and count) and the **18-measure grid** (number, category chip, title, agency). Each measure opens a detail drawer: कसलाई · के सुविधा · समयसीमा/अवधि · कार्यान्वयन · full Cabinet wording (`मन्त्रिपरिषद् निर्णयको व्यहोरा`) · link to original PDF page.
- Filters: category cards (click to filter), free-text search over measures, implementing-agency select, issuer (Cabinet / MoF / other). Deep links `?m=<no>` (opens the drawer) and `?cat=`. Every decision stores its original document and an optional explainer PDF.

### 2.6 `/contact` सम्पर्क · Contact

- Page title "रसुवा बाढी राहत संकलन एकद्वार प्रणाली — सम्पर्क विवरण"; the intro paragraph is the Ministry's official single-window notice sentence (see `prototype/data/data.js` -> contact_intro_ne/en). One merged, searchable contact table (group, designation, name, phone); Niraj Bhusal is listed under माननीय अर्थमन्त्रीज्यूको सचिवालय with designation "आइटी / IT". Single-window contacts exactly as in `seed/decisions.json → contacts` (groups: International donors & agencies; Private sector & individuals — Finance Minister's Secretariat; Ministry of Finance — **Niraj Bhusal, 9851175115, shown with name and phone only, no title**). Phone numbers as tap-to-call.
- Ministry address, phones, emails, office hours, embedded map (OpenStreetMap tile, no API key), and a message form (name, email/phone, subject select, message) that emails the portal officer and stores the message in DB with spam protection (honeypot + rate limit). Note under the form: donations go through donate.gov.np, the form is for coordination only.

### 2.7 `/admin` प्रशासन (auth required)

See Section 6.

## 2.8 Contribution categories - the accounting rule (implement exactly)

Four categories, shown on `/contributions` and enforced in the totals service:

- **A** Online / banking channels (NPR): `ChannelSnapshot` for NCHL + Fonepay (keep every snapshot; the trend charts use the history).
- **B** Cheques / handovers to the Hon. Finance Minister (NPR): `Contribution` rows in NPR only.
- **C** Foreign assistance (USD) = total USD deposited after the flood in the Fund's USD accounts, from the **Prime Minister Disaster Relief Fund daily fund-status statement (from Nepal Rastra Bank)** (new model `FundStatusSnapshot`: date, per-bank balance NPR/USD, pre-flood balance, gross collection, daily collection, fund usage with note, FX rate, total available balance). Counted at the statement's FX rate.
- **D** Identified foreign contributors (`ForeignAssistance`, incl. USD cheques handed to the Minister such as Embassy of China USD 200,000, which must never appear in B). D is a **subset of C** - shown as "identified" vs "awaiting attribution", never added on top.
  Grand total = A + B + C x FX. The statement's NPR part (bank-wise balances, daily deposits, NPR 1 bn transferred to NDRRMA, total available balance) is displayed as **account status** with its own charts and bank table - never added to the contributions total. Show the gap between channel sum (A) and NPR deposited in the accounts as a settlement/clearing note. Currency labels: "रु." in Nepali, "NPR" in English (never "Rs"). Seed: `seed/fund_status.json`, `seed/digital_channel_snapshots.csv`.

## 3. Data model (Prisma) — implement exactly, extend if needed

```prisma
enum RecordStatus { draft verified published archived }
enum Role { entry verifier publisher admin }
enum ContributorType { institutional individual government_embassy corporation multilateral ingo_foundation diaspora individual_abroad }
enum PaymentMode { cheque bank_transfer cash card qr ips remittance online other }
enum AssistanceKind { cash cash_cheque in_kind pledge }
enum Network { NCHL FONEPAY CARD OTHER }
enum SnapshotPeriod { daily cumulative }

model Disaster { id, slug (rasuwa-2083), name_ne, name_en, event_date_ad, event_date_bs, active Boolean, createdAt }
model Contribution {            // in-person / cheque / bank transfer to the Fund via MoF
  id, disasterId, sn Int?, date_ad DateTime, date_bs String,
  contributor_name String, contributor_name_ne String?, contributor_type ContributorType,
  payment_mode PaymentMode, amount_npr Decimal?, amount_usd Decimal?, fx_rate Decimal?,
  cheque_or_ref String?, receiving_office String?, notes String?,
  status RecordStatus, evidence Attachment[], createdBy, verifiedBy?, publishedBy?, timestamps
}
model ForeignAssistance {
  id, disasterId, date_ad, date_bs, contributor, contributor_ne?, country_iso2, contributor_type,
  kind AssistanceKind, channel String, amount_usd Decimal?, amount_npr_equiv Decimal?, fx_rate Decimal?,
  in_kind_description?, in_kind_valuation_npr?, purpose_ne, purpose_en, featured Boolean, photo Attachment?,
  pledge_received_at DateTime?, status, audit fields
}
model ChannelSnapshot {         // NCHL / Fonepay / card network figures
  id, disasterId, network Network, period SnapshotPeriod, snapshot_at DateTime, period_date DateTime?,
  channel_code String, channel_label_en, channel_label_ne, txn_count Int, amount_npr Decimal, source String,
  status, audit fields
  @@unique([disasterId, network, period, snapshot_at, channel_code])
}
model RescueReport {            // one row per NDRRMA or Police daily report
  id, disasterId, agency (NDRRMA | NEPAL_POLICE), report_at DateTime, report_at_bs String,
  original Attachment, data Json (validated against a Zod schema mirroring seed/rescue_snapshot.json),
  status, audit fields
}
model Decision {
  id, disasterId, kind (cabinet_decision | mof_notice | mof_decision | cash_support | other), date_ad?, date_bs,
  issuer_ne, issuer_en, title_ne, title_en, summary_ne, summary_en, original Attachment?, explainer Attachment?,
  status, audit fields, measures Measure[]
}
model Measure { id, decisionId, no Int, category_code, category_ne, category_en, agency_ne, agency_en,
  title_ne, title_en, who_ne, benefit_ne, deadline_ne?, cabinet_text_ne, status }
model Contact { id, group_ne, group_en, title_ne, title_en, name_ne, name_en, phone, email?, order, visible }
model Attachment { id, kind (pdf|jpg|png|xlsx|csv), filename, url, sha256, uploadedBy, createdAt }
model User { id, email, name, passwordHash, role Role, active, lastLoginAt }
model AuditLog { id, userId, action, entity, entityId, before Json?, after Json?, ip, createdAt }
model Message { id, name, contact, subject, body, ip, createdAt, handled Boolean }
model Setting { key, value Json }   // e.g. fx_rate_usd_npr, last_public_update, featured ids
```

All amounts are `Decimal(18,2)`. Everything is scoped by `Disaster` so the same portal serves the next disaster with a new slug.

## 4. Seed data — load these on first run (`pnpm db:seed`)

- `seed/inperson_contributions.csv` — **331 verified in-person/cheque entries** (Bhadra 11–19, 2083). Total NPR 1,929,292,838.25 + USD 200,000 (Embassy of China). Map `contributor_type` institutional/individual, `payment_mode` cheque/bank_transfer, status `published`.
- `seed/digital_channel_snapshots.csv` — NCHL cumulative as of 2026-09-05 14:00 (7 channels, total NPR 4,263,565,174.85, 246,614 txns) and Fonepay cumulative till 2026-09-05 (5 channels, total NPR 2,345,613,954, 896,354 txns) plus Fonepay daily for 2026-09-05.
- `seed/foreign_assistance.csv` — NVIDIA USD 10M (featured) and Embassy of China USD 200K.
- `seed/rescue_snapshot.json` — NDRRMA 6 Sep 18:00 and Nepal Police 2083/05/21 20:00 structured data; attach `reference/ndrrma-update-2026-09-06.jpeg` and `reference/nepal-police-update-2083-05-21.jpeg` as originals.
- `seed/decisions.json` — MoF single-window notice (Bhadra 11), **Cabinet decision 2083/05/18 with all 18 measures** (attach `reference/anusuchi-cabinet-decision.pdf` as original and `reference/business-recovery-plan-phase-1.pdf` as explainer), cash support to districts, contacts, ministry details, external portals.
- Store `fx_rate_usd_npr = 152` in `Setting` (NVIDIA graphic states USD 10M ≈ NPR 1.52 billion); admins can change it.

Verify after seeding: NPR receipts = 4,263,565,174.85 (NCHL) + 2,345,613,954 (Fonepay) + 1,929,292,838.25 (handovers) = **NPR 8,538,471,967.10**; foreign = **USD 10,200,000**; the headline **grand total shown on the home page = NPR receipts + foreign USD × FX (152) = NPR 10,088,871,967.10**, always with the chips showing each component and each source's as-of time.

## 5. Imports (admin)

- **XLSX/CSV import** for the in-person list with the exact columns of `bhadra_19.xlsx` (`सि.नं., मिति, सहयोग गर्ने निकाय / व्यक्ति, Institution / Personnal (Type), Cheque/Non Cheque, सहयोग रकम (रू.), सहयोग रकम (अमेरिकी डलर)`), preview with row-level validation, duplicate detection (same name+amount+date), then bulk-create as `draft`.
- **Channel snapshot import**: paste or upload the NCHL / Fonepay daily table; parser accepts Indian-grouped numbers (`2,11,76,39,003`) and Western; creates `ChannelSnapshot` rows for the day and updates cumulative.
- **Rescue report upload**: upload PDF/JPG, then fill a structured form pre-filled from the previous day (so an officer types only what changed). Store both.
- **Decision entry**: form with Nepali/English fields, category list, measures repeater, original PDF upload.

## 6. Admin workflow, roles, audit

- `entry` creates/imports → status `draft`.
- `verifier` reviews, attaches evidence (cheque scan, bank slip, letter), sets `verified`; can send back with a comment.
- `publisher` sets `published` (visible) or `archived`; can un-publish.
- `admin` manages users, settings, FX rate, featured items, disasters.
- Every mutation writes `AuditLog` with before/after JSON. Public detail pages show "verified ✓ · published on <date>" — never staff names.
- Dashboard: counts by status, pending queue, last import, last public update; one-click "Regenerate public totals" (totals are computed in SQL views, cached 60 s).

## 7. Charts, icons, infographic rules

- Charts: Recharts, colours navy/crimson/navy2 `#3A62B8`/light `#9DB3E3`/gold only; labels in the active locale with Nepali digits; tooltips show full amount and as-of; every chart has a small "स्रोत: …" chip.
- Lucide icons mapping (keep consistent with the design): fund → `Coins`, card/online → `CreditCard`, NCHL/bank → `Landmark`, Fonepay/QR → `QrCode`, handover → `HandHeart`, foreign → `Globe`, rescue → `LifeBuoy`, rescued persons → `Users`, casualties → `Umbrella`(avoid graphic imagery), missing → `Search`, injured → `ShieldPlus`, holding centre → `Home`, security → `Shield`, helicopter → `Plane`, decisions → `Gavel`, measure → `FileText`, customs → `Truck`, tax → `Percent`, loan → `Landmark`, insurance → `Umbrella`, contact → `Phone`, location → `MapPin`, download → `Download`, verified → `BadgeCheck`.
- Generate **OG images** per page (`/rasuwa-flood/og/<page>.png`) with the emblem, page title and headline number, so shares on X/Facebook/WhatsApp show the figure.
- **Type scale for readability:** base 17px, no text below 12px, section headings ≥ 21px, KPI values 26–34px with an auto-fit so figures never clip; tables 15px. Desktop nav sticky and two-line; mobile nav is a full-screen drawer with 56px rows, language toggle and donate button (see prototype).
- **Print stylesheet:** each public page prints to A4 with cards, charts and table rows kept whole, page numbers and a ministry footer — the two PDFs in `prototype/downloads/` are the reference output. Provide a server-side "Download PDF (ने/EN)" that renders the current data the same way.

## 8. Public API & open data

`GET /api/v1/summary`, `/api/v1/contributions?type=&mode=&from=&to=&q=&page=`, `/api/v1/channels?network=&period=`, `/api/v1/foreign`, `/api/v1/rescue/latest`, `/api/v1/rescue/reports`, `/api/v1/decisions`, `/api/v1/contacts`. All read-only, published records only, JSON with `as_of`, CORS open, cached, rate-limited. `?format=csv` on list endpoints.

## 9. Deployment

- `docker compose up` brings up everything; `.env.example` documents secrets. Nginx snippet for the ministry's server: `location /rasuwa-flood/ { proxy_pass http://rasuwa_web:3000/rasuwa-flood/; }`.
- Health endpoint `/rasuwa-flood/api/health`. Structured logs. Backups nightly. A `RUNBOOK.md` explaining how an officer imports the daily NCHL/Fonepay/NDRRMA data in under 10 minutes.

## 9a. Public-site content rules

- No internal or change-log text anywhere on public pages: no formulas, no version notes, no "data.js" or field-name references, no developer remarks. Explanatory notes must read as official statements (e.g. the sector note: "This classification is based only on the name-wise record of contributions handed over to the Hon. Finance Minister; amounts received through banks, NCHL and Fonepay are available only as totals and carry no contributor categories.").
- Refer to the fund-status statement as "Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status (Nepal Rastra Bank)", not by the office acronym.

## 10. How to work

1. Read `design/index.html`, `design/style.css` and skim the PDF. Then write a short plan (routes, components, models) in `PLAN.md` and confirm the plan against this spec before coding.
2. Scaffold, set up Prisma + seed, and get `/` rendering real seeded totals in both locales **first**. Take a Playwright screenshot of each page at 1280 px and 390 px and compare against the design PDF; fix visual drift before moving on.
3. Build sections in this order: fund → foreign → decisions → rescue → contact → admin → API → OG/print → CI/Docker.
4. Write tests for number/date formatting, import parsers and the status workflow. Run lint/test/build before declaring any milestone done.
5. Never fabricate placeholder figures on public pages; use empty-state components ("प्रविष्टि प्रतीक्षारत · awaiting verified entry").
6. Keep a `CHANGELOG.md`. Commit in small, described commits.

Deliverable at the end: a repo that runs with `docker compose up`, seeded, both locales, all six public sections matching the design, admin workflow functional, tests green, and `RUNBOOK.md` for ministry staff.
