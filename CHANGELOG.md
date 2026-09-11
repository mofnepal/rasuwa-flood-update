# Changelog

All notable changes to रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update.

## [Unreleased]

### Charts

- **Every bar keeps its name.** On "Handovers by sector" (क्षेत्र अनुसार हस्तान्तरण) the
  chart had quietly dropped every other label to avoid overlap — 7 names for 14 bars —
  so the first sector, Industry & manufacturing (उद्योग तथा उत्पादन), and six others
  showed no name. The "Balance by bank" chart was exposed to the same fault. Every horizontal bar chart now draws a
  label for every bar, and the two long charts are tall enough for each name to have a
  row of its own.
- A browser test now fails if any bar chart shows fewer labels than bars.

### Data — NCHL and Fonepay, 11 September 2026

- **NCHL collection through its channels, 11 September 2026, 12:00 AM** — seven
  channels, NPR 5,100,441,053.72 across 259,459 transactions. The channel lines sum to
  the printed total to the paisa, and every channel is at or above its 9 September
  figure: +4,550 transactions, +NPR 425,114,853.67.
- **Fonepay transaction summary, till 10 September 2026** — five channels,
  NPR 2,469,450,592 across 919,164 transactions, each summing to the printed total;
  10 September alone was 3,121 transactions and NPR 18,402,866, which also ties. Since
  the summary till 6 September: +16,718 transactions, +NPR 94,175,394, every channel
  higher. Daily figures for 7–9 September were not supplied, so the daily trend shows
  5, 6 and 10 September.
- Headline grand total: **NPR 12,835,232,283.15** — online channels
  NPR 7,569,891,645.72 + handovers NPR 2,152,542,309.25 + USD 20,557,379 × 151.42. The
  gap between receipts recorded (NPR 9,722,433,954.97) and money already in the fund's
  NPR accounts widens accordingly and stays disclosed on the contributions page.
- Both printed totals are recorded in `seed/published_totals.json`, and the grand
  total expected by `scripts/acceptance.mjs` is updated.

### Data — NDRRMA, 11 September 2026

- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 11 September 2026,
  11:00 AM** loaded as the sixth report. Every total reconciles against its own
  parts: deaths by district to 1,385; security personnel (Nepali Army 8,844, Nepal
  Police 7,975, Armed Police Force 4,203) to 21,022; holding centres to 3,685;
  missing — Rasuwa 2,860, Nuwakot 1,787 and 587 foreign nationals, less the 104
  identified bodies — to 5,130. Rescued 13,676. Nepali Army helicopter flights 1,407,
  Armed Police Force 299. The injured total, 7,655, is the sum of the treatment figures
  the report prints (337 in hospital at 19 hospitals, 3,559 by the Nepali Army, 3,759
  by the Armed Police Force), and the page says so.
- The report adds a **bridge connection** — a temporary Acrow bridge in operation at
  Devighat, Nuwakot — now shown under "More detail" on the rescue page. It no longer
  carries the psychosocial counselling figure, so the page shows none rather than
  repeating the previous day's.

### Downloads and the clock

- **Downloads are switched off for now**, at the ministry's request: no CSV button on
  any table, and no JSON or CSV links in the footer. The footer offers only
  "Print or save as PDF", which uses the A4 print stylesheet. One switch,
  `SHOW_DOWNLOADS` in `src/lib/constants.ts`, brings them all back. The files are
  still published under `/open-data/`, unlinked, because the site search reads its
  index from there. The "Original document" links to source reports stay.
- **The current date and time in Nepal** in the ticker under the header — BS first,
  then AD, with the time — refreshed every 15 seconds in the reader's browser, so a
  page published earlier still shows the present moment.

### Data

- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 10 September 2026,
  11:00 AM** loaded as a fifth report. Every total reconciles against its own parts:
  deaths by district to 1,377; security personnel (Nepali Army 8,885, Nepal Police
  7,975, Armed Police Force 4,203) to 21,063; holding centres (Nuwakot 2,615, Rasuwa
  775, Dhading 295) to 3,685; missing — Rasuwa 2,860, Nuwakot 1,787 and 587 foreign
  nationals, less the 104 identified bodies — to 5,130. Rescued 13,656. The report
  prints no headline total for the injured; the portal shows the sum of what it
  prints (333 in hospital, 3,559 treated by the Nepali Army, 3,606 by the Armed Police
  Force = 7,498) and says so. Its original has not yet been supplied as a file.
- `pnpm verify` compares NDRRMA with Nepal Police only for reports of the same day.
  The latest Nepal Police update is still 9 September, and a later NDRRMA figure
  naturally differs from it; that is now stated as a note instead of failing the
  check, which would have blocked publication.

### Phones

- **Home button** in the top row on a phone, and the emblem and ministry name lead
  home on every screen.
- **Charts** size themselves to the screen: the figure inside the donut stays inside
  the ring, crowded bar labels are slanted and shortened (the tooltip keeps the full
  name), long category names no longer run into each other, and the top axis value is
  no longer cut off. A two-line chart legend no longer overlaps the note beneath it.
- **Layout** on a narrow screen: the header keeps its buttons on one row, the ticker
  has no stray separator, the "updated" line no longer strands its clock icon, tables
  scroll sideways instead of crushing their columns, the updates list puts the date
  above the text, relief measures put the agency under the title, the timeline runs
  down the page, and the Nepal Police panel stacks. "(1 days ago)" now reads "(1 day ago)".
- The sector list shows the name on the left and the amount on the right on every
  screen; the amount had taken the first column.
- A browser test now fails the build if anything runs off a phone screen or out of its
  chart at 320, 375 or 414px, in either language.

### Header

- **Desktop search** has a row of its own under the header, up to 760px wide. Beside the
  portal title and the tools it had been squeezed to 129px, too narrow to read a query.
- **Language on a phone** — the ने | EN toggle sits beside the search, always visible, so
  changing language no longer means opening the menu. The menu still offers it too.

### Live site

- **The public portal is published on GitHub Pages**, at
  `https://mofnepal.github.io/rasuwa-flood-update/`. Every push to `main` seeds a
  fresh database, verifies every figure against its source, builds the static
  edition, tests every page in both languages on desktop and phone, and only then
  publishes. A failed step publishes nothing.
- **The static edition** (`pnpm build:static`) renders every public page, share card
  and open-data file from the published records. Search runs in the browser over a
  published index; the contact page shows the ministry's email address in place of
  the message form; the footer offers the browser's print for a PDF. Admin, sign-in
  and the API stay in the server edition, which is unchanged.
- Each rescue report date now has its own address (`/rescue/2026-09-08`) in place of
  `?d=`, and share cards are addressed as `/og/home-en.png`. Register and relief-measure
  deep links (`?q=`, `?sector=`, `?m=`) are read in the browser, so they work in both
  editions.
- **Complete open-data files** under `/open-data/` in both editions: the whole
  register as JSON and CSV, channels, fund status, foreign contributors, rescue
  reports, decisions, contacts and the search index.
- The mount point is no longer fixed: `NEXT_PUBLIC_BASE_PATH` sets it (default
  `/rasuwa-flood`), and stored document links follow it.
- `pnpm verify` reads the totals printed on each source document from
  `seed/published_totals.json`, so a data update carries its own expected figures.
- The header emblem is a 112px copy (25 KB) of the 292 KB original.

### Data

- **Handover collection sheet for Bhadra 24 (9 September)** — 59 entries, serials
  387–445, NPR 223,249,471. The entries sum exactly to the sheet's own printed total.
  The register is now 389 entries and NPR 2,152,542,309.25; the grand total is
  **NPR 12,315,942,035.48**.

  - **Serials 332–386 have not been supplied.** The register says so on the page and
    `pnpm verify` reports it, rather than presenting the list as complete.

- **NCHL collection through its channels, 9 September 2026, 12:00 AM** — seven
  channels, NPR 4,675,326,200.05 across 254,909 transactions. The channel figures sum
  to the published total to the paisa. Since the 7 Sep snapshot: +2,583 transactions,
  +NPR 226,739,225.71. The 5 and 7 September snapshots are kept as history.
- **Nepal Police — Rasuwa Bhotekoshi flood search and rescue update, 2083/05/24,
  11:00** loaded, with its infographic attached as the original. Every subtotal
  reconciles: bodies found to 1,367, missing to 4,077, injured and rescued to 9,254,
  DNA samples to 2,698. Its bodies-found total now agrees exactly with NDRRMA's
  casualties figure of 1,367.
- Headline grand total: **NPR 12,092,692,564.48**.

- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 9 September 2026,
  11:00 AM** loaded as a fourth report. Every total reconciles against its own parts:
  bodies by district to 1,367, the Rasuwa breakdown to 2,860, the new Nuwakot
  breakdown to 1,787, security to 21,185, holding centres to 3,628, and missing to
  5,132 after the 102 bodies handed over are deducted.
  - casualties 1,357 → 1,367 · missing 5,326 → 5,132 · rescued 13,583 → 13,646 ·
    at holding centres 3,533 → 3,628 · security 21,402 → 21,185
  - This report **omits** three things the previous one carried: electricity
    restoration by district, private helicopter flights, and a headline total for the
    injured. The schema now takes each as optional, and the portal shows nothing
    rather than repeating the previous day's figure.
  - It publishes the three treatment figures without a total. The portal shows their
    sum — the same arithmetic the agency itself published the day before — labelled
    on the tile as the sum of the figures in this report, with a note saying so.
- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/05/24,
  9:00 AM** loaded as a third statement; the two from 7 September are kept, so the
  history is unbroken. It also publishes the 2083/05/23 column, which fills the day
  between, so the daily series now runs Bhadra 11–24.
  - NPR balance 8,788,258,304 · gross after the flood 7,705,835,899
  - USD balance 21,143,427 · gross after the flood 20,557,379
  - Total available fund balance NPR 11,989,796,084
  - **The exchange rate moved from 150.88 to 151.42**, which is the rate printed on
    this statement. The headline grand total becomes **NPR 11,865,953,338.77**.
  - Continuity against the statement already loaded is exact: the 05/22 → 05/23 and
    05/23 → 05/24 movements match the daily figures the statement itself publishes,
    to within the one-rupee rounding in the ministry's own sheet.
  - The scanned original still needs uploading through `/admin`.
- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 8 September 2026,
  1:00 PM** loaded as a new report; the 6 September one is kept, so the date tabs and
  the archive carry the history. Every total in it reconciles against its own parts —
  bodies by district to 1,357, the Rasuwa breakdown to 2,860, injured to 6,827,
  security to 21,402, holding centres to 3,533, and missing to 5,326 after the 102
  bodies handed over are deducted, as the report states.
  - casualties 1,342 → 1,357 · missing 4,996 → 5,326 · rescued 13,391 → 13,583 ·
    injured 6,083 → 6,827 · at holding centres 3,912 → 3,533
  - New in this report and now shown: Armed Police Force helicopter flights, the count
    of holding centres, the detailed breakdown of those missing from Rasuwa, and the
    agency's own notes on DNA samples and on the figures still being verified.
  - The scanned original still needs uploading through `/admin`.
- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status (Nepal Rastra
  Bank), 2083/05/22, 5:00 PM** loaded, superseding the 9:00 AM statement of the same
  day. The earlier statement is kept as its own snapshot with its scanned original, so
  the audit trail is unbroken; the portal reports the latest.
  - NPR balance 8,460,662,427 · gross after the flood 7,378,240,022 · daily 301,987,039
  - USD balance 20,996,438 · gross after the flood 20,410,390 · daily 656,771
  - Total available fund balance NPR 11,628,605,003 · FX 150.88
  - Noted: the statement's NPR bank column sums to NPR 8,460,662,428, one rupee above
    its own printed total. The portal shows the printed total.
- **The handover register is 330 rows, NPR only.** The Embassy of China's USD 200,000
  cheque is marked category D in the source list and is now counted once, under foreign
  assistance, instead of appearing in both places.
- Headline grand total: **NPR 11,832,674,653.79** (online channels + handovers +
  foreign USD at 150.88).

### Added

- Next.js 15 + PostgreSQL/Prisma re-implementation of the approved prototype.
- Public sections: home, contributions, foreign assistance, rescue, government
  initiatives, contact — bilingual (ne default, en), every figure carrying its source
  and cut-off time.
- The four-category accounting rule implemented once in `lib/totals.ts`, and explained
  on the contributions page in the ministry's own words — never as a formula.
- Bank-wise fund account status (`/contributions#nrb`): four figures, a balance chart,
  a searchable bank table with NPR/USD chips and CSV, and daily and cumulative charts.
- Foreign assistance rebuilt: identified against awaiting attribution, daily deposits
  into the USD accounts, contributor-type breakdown and a donate panel.
- Admin: entry → verify → publish with an audit log, importers for the handover
  spreadsheet, the channel tables and the daily rescue report, users and settings.
- Open data under `/api/v1`, share cards under `/og`, and a server-side PDF export that
  renders the page through the portal's own A4 print stylesheet.

### Changed

- The register is titled **"माननीय अर्थमन्त्रीज्यूलाई हस्तान्तरण गरिएको सहयोगको नामावली" /
  "Register of contributions handed over to the Hon. Finance Minister"**, which says
  what the list is rather than describing its contributors. Verification is stated in
  the line beneath it, where it belongs.
- The register names the dates it covers and any run of serial numbers still to come,
  both derived from the data, so the coverage cannot drift from what is published.

- **A foreign contribution is stated at the rate its own published rupee equivalent
  was computed with, not at today's rate.** Restating a past contribution when the
  exchange rate moves would change a figure the ministry has already published, so
  NVIDIA and the Embassy of China stay at 150.88. The fund's USD _balance_ is a
  different matter — the statement itself restates that at the current rate, and the
  portal follows it.
- The portal's "updated" time now follows the newest published source across every
  dataset rather than being pinned to one of them.

- Sector auto-classification: two rules in the prototype's generator were written with
  double-escaped patterns (`\bait\b`, `c\.g\. square`) and so never matched. Ported as
  intended, which moves "AIT Pvt. Ltd." to _Education_ and "C.G. Square Private Limited"
  to _Industry_ instead of _Other_. Sector is an editable admin field either way.
- The fund statement's per-bank columns are labelled as what they are — the comparison
  date and the statement date — rather than "before the flood". Only the NPR _total_
  before the disaster is published, and it is shown as such.
- The settlement note now compares all NPR receipts against what has actually reached
  the fund's accounts, and prints all three figures.

### Fixed

- **The importer could not read a continuation sheet.** The Fund Section sends two
  shapes — the full list with Nepali headers, and a day's sheet with no header row at
  all, indented several columns in. The second failed every row. The importer now
  works out which column is which from the data when no header is recognised, so an
  officer can import either.

- **The headline total could render as a negative figure.** `requestAnimationFrame`
  reports the time the frame began, which can predate the `performance.now()` taken
  when the count-up was scheduled. Unclamped, that drove progress negative and the
  easing below zero, so the hero briefly showed something like "NPR -1,97,87,579"
  before settling. Found by a test that looked flaky and was not.
- `next start` was being used against an `output: standalone` build, a combination
  Next prints a warning about on every run. The tests and `pnpm start` now run the
  standalone server the way the container does.
- A literal `<head>` element in the locale layout — unsupported in the App Router.
  The font preload is now hoisted by React from the body instead.

- **KPI figures were being clipped.** The stock rule was `white-space: nowrap;
overflow: hidden`, which silently cut long grouped amounts short — showing
  "रु. १,९२,९२,९२,८३" instead of the full figure. Values now size themselves against
  their own tile and wrap after the currency label; the number itself never breaks and
  never clips.
- **Horizontal overflow on phones.** The hero, its chips and the updates feed could not
  shrink below their content. Fixed at 320–1280px in both languages.
- **`?static=1` never took effect** — a layout does not receive `searchParams`, so the
  flag that freezes animation for printing and PDF export was silently ignored, and
  exports could capture a mid-animation figure.
- Number parsing: a currency prefix's trailing full stop was read as a decimal point,
  so "रु. 30,00,000" parsed as 0.3.
- Channel import: `Int'l QR` was not recognised as a known channel, and a Devanagari
  total row (`जम्मा`) was imported as though it were a channel.
- The updates feed could print "undefined" if a label was missing; the labels are now a
  named type, so a missing one fails the build instead.
- **Machine field names were reaching public pages.** The agencies key their breakdowns
  inconsistently, and `nepali_army`, `hospitals_discharged` and untranslated English
  labels were being printed as-is on the Nepali page. Every key now has a label in both
  languages, an unmapped one is rendered as words rather than an identifier, and the
  acceptance checks fail on any `snake_case` token in rendered text.

### Performance and accessibility

Lighthouse on the mobile home page, median of five runs: **performance 90,
accessibility 100, best practices 100, SEO 100**; LCP 2.7 s, CLS 0.000.

- The emblem was a 292 KB PNG served unoptimised at 56 px, which alone pushed LCP to
  8.4 s. It is now resampled at the size it is displayed — never recoloured or
  restyled — and the favicon and touch icon are generated from it.
- Mukta is subsetted to Devanagari and Latin and served as WOFF2 (1.6 MB of TTF → 468 KB).
  Only the weight the headline is painted in is preloaded.
- The charting library loads after first paint; every figure it draws is also published
  as text, so nothing is withheld.
- Two accessibility failures fixed: the donate button had no accessible name on a phone
  (its label is hidden there), and the "hours ago" note failed AA contrast.

### Not yet supplied

- The scanned original of the 2083/05/22 5:00 PM fund status statement. Its record
  carries no attachment until an officer uploads one through `/admin`.
- The ministry's `graphics/` set and the pre-rendered share images. Share cards are
  generated at `/og/<page>?lang=<ne|en>` in the meantime.
- An official payment QR. `public/img/donate-qr.svg` is generated by
  `node scripts/make-qr.mjs` and encodes the portal address `https://donate.gov.np/`
  and nothing else; replace the file if the ministry issues a QR with its own payload.
