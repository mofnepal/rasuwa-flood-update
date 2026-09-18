# Changelog

All notable changes to रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update.

## [Unreleased]

### Data — fund status, 2083/06/02 9:00 AM

- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/06/02
  (18 September 2026), 9:00 AM**, at **NPR 153.20** per US dollar (from 153.24). Its
  2083/06/01 column equals the 5:00 PM statement already loaded, bank by bank.
  - NPR balance **10,962,254,243**; the nine bank lines sum to it exactly; collected
    since the flood 9,879,831,838, and balance − before + the NPR 1 billion transferred
    = collected exactly. Every bank is at or above its 06/01 figure.
  - USD: Himalayan Bank 14,079,314 + Laxmi Sunrise 9,981,274 = **24,060,588** exactly;
    collected 23,474,540; the day's USD 129,857 equals the rise in the balance exactly.
  - Total available fund balance **NPR 14,648,336,312** = NPR balance + printed USD
    equivalent, exactly.
- Stated, not corrected: the fund-usage line is printed blank again while the collected
  figure carries the NPR 1 billion transfer (the note stays); the printed daily NPR
  collection (65,591,966) is one rupee below the rise in the collected figure
  (65,591,967); and the printed USD equivalent, NPR 3,686,082,069, is NPR 12.60 below
  USD 24,060,588 × 153.20.
- The grand total is **15,07,66,07,409** (15,076,607,409.41): A NPR 8,742,677,247.59 +
  B NPR 2,737,630,633.82 + C USD 23,474,540 × 153.20.

### Data — 17–18 September 2026: fund status 2083/06/01 5:00 PM, NCHL and NDRRMA report

- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/06/01
  (17 September 2026), 5:00 PM**, at **NPR 153.24** per US dollar (from 152.59). It
  publishes the 2083/05/31 column as its comparison; no statement for Bhadra 30 was
  received.
  - NPR balance **10,896,662,277**; collected since the flood 9,814,239,871; the day's
    collection 219,996,977 equals the rise in the collected figure exactly. Every bank
    is at or above its 05/31 figure.
  - USD: Himalayan Bank 13,949,458 + Laxmi Sunrise 9,981,274 = 23,930,732, one dollar
    above the printed **23,930,731**; collected 23,344,683; the day's USD 49,212 equals
    the rise in the balance exactly.
  - Total available fund balance **NPR 14,563,807,556**.
- **Stated, not corrected:** the statement prints its fund-usage line blank, while its
  collected figure still carries the NPR 1 billion transferred to NDRRMA on 2083/05/16
  (balance − before + 1 billion = collected, within a rupee); the portal keeps the
  transfer with a note saying so. The nine NPR bank lines sum to 10,896,662,275, two
  rupees below the printed total; before + collected − transferred is one rupee below
  the printed balance; the NPR balance plus the printed USD equivalent is one rupee
  above the printed total available; and the printed USD equivalent, NPR 3,667,145,280,
  is NPR 61.56 above USD 23,930,731 × 153.24. `pnpm verify` now records rupee rounding
  of this size as a note, as printed, and fails on anything larger; it also checks that
  each daily series ends at, and sums to, the printed collection.
- **The Bhadra 30 point of the daily series is derived:** from the Bhadra 31 daily
  collection printed in this statement (NPR 146,337,283; USD 18,314), so it also carries
  what came in after 9:00 AM on Bhadra 29 (NPR 525,897,852; USD 420,682). The series
  carries a note saying so.
- **NCHL collection through its channels, 18 September 2026, 12:00 AM** — seven
  channels, **NPR 6,235,427,785.59** across 269,780 transactions; the lines sum to the
  printed total to the paisa, and every channel is at or above its 14 September figure
  (+6,513 transactions, +NPR 713,994,417.37).
- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 17 September 2026,
  7:00 PM** (Asoj 1). Bodies by district sum to **1,410** (Rasuwa 199, Nuwakot 203), and
  the deceased detail (336 female, 549 male, 525 human remains) sums to the same 1,410;
  **6,145 missing** with 110 bodies handed over; holding centres 832 + 817 + 94 =
  **1,743** at 27 centres; rescued **13,756**; Army helicopter flights 1,634 (31 today),
  APF 320; DNA samples 1,286 and 1,944; fuel diesel 60,000 l, petrol 12,000 l, aviation
  4,000 l, 502 gas cylinders. Treatment 344 in hospital, 290 discharged, 9,820 by the
  security agencies; derived injured total 344 + 9,820 = 10,164.
- **Stated, not corrected:** the report's missing chart is unchanged (587 foreign
  nationals, Rasuwa 2,679, Nuwakot 1,787 — 5,053, or 4,943 after the 110 bodies handed
  over) while its own total is 6,145; both are shown as printed with a note, and
  `pnpm verify` records the difference in place of a tie.
- The grand total is **15,05,76,47,104** (15,057,647,104.33): A NPR
  8,742,677,247.59 + B NPR 2,737,630,633.82 + C USD 23,344,683 × 153.24.

### Data — Announced domestic support, and one source column in the foreign register

- **A "घोषित स्वदेशी सहयोग / Announced domestic support" card on the contributions page**,
  beneath the handover register, with its own database (`AnnouncedSupport`, seeded from
  `seed/announced_support.json`): the nine entries of the domestic support list on the
  Office of the Prime Minister and Council of Ministers' rescue portal, copied word for
  word (raw copy under `reference/`) — the Armed Police Force's salary deductions (NPR
  155 million, announced 4 September), federal employees' salary contribution (about
  NPR 360 million), Ministry of Finance staff and agencies (NPR 1.83 million), one
  month's salary of the Prime Minister and ministers, Nepali Congress (NPR 10 million,
  7 September), immediate cash to Rasuwa, Nuwakot and Dhading (NPR 25 million), half a
  month's salary of Lumbini's Chief Minister and ministers, Karnali Province (NPR 5
  million) and Lumbini Province (NPR 30 million). Each row carries the contributor, a
  category, the figure or the Office's own words where there is none, where it stands
  and the source, "Prime Minister's Office".
- **Nothing announced is counted.** The grand total is unchanged at NPR 14,253,982,984.29.
  The card's three tiles show pledges with a figure summed (NPR 551,830,000, seven
  pledges, two without a figure), what is already in the Fund's register, and what is
  government cash out of the Fund. Nepali Congress's NPR 10 million is the handover
  register's entry no. 336 (Bhadra 22, NPR 10,000,000) and stays counted only there; the
  district cash is NDRRMA's onward disbursement of Bhadra 21 and stays under fund usage.
  The seed refuses an entry that cites a register number with a different amount, and
  `pnpm verify` checks the count, the pledged sum, the register cross-reference and that
  the district cash equals the onward disbursement to districts. Open data gains
  `announced-support.json`.
- **Verified against the source.** The list is hard-coded in the Office's front-end
  bundle; every figure matches it. The Office's list has one row more than was passed
  to us — half a month's salary from Lumbini's Chief Minister and ministers — which is
  included. The Office's first row, the Fund's own nine-bank balance, is account
  status, not a contribution, and is omitted.
- **The foreign register has one source column instead of status tags.** Every row
  reads the same — date, name, country, type, kind, channel, amounts — and a source
  chip says "Ministry of Finance" (verified in the Fund, counted) or "Prime
  Minister's Office" (listed, not counted). The quick chips now categorise the
  register as countries, organisations and companies, and the table heading gains a
  source filter beside type, kind and country. The "Reported by…" tags, chips and
  wording are gone; the tile reads "Source: Prime Minister's Office". The Office's
  per-entry status (pledged, in transit, delivered) stays in the open data.

### Data — Foreign assistance: OPMCM's international and government support, in the register

- **The foreign assistance register now carries the support the Office of the Prime
  Minister and Council of Ministers reports on its rescue portal**
  (rescue.opmcm.gov.np/donations): 39 entries — 30 governments, 4 multilateral agencies
  and 5 foreign companies — kept word for word with the sources OPMCM cites and its own
  currency conversions, each labelled "Reported by the Prime Minister's Office" with its status (pledged, in
  transit, delivered) and whether OPMCM states it as going to the PM Fund. Where OPMCM's
  separate "donor aid" list differs from its donor list (UAE, UK, China, Switzerland,
  Australia, South Korea, Ireland, Qatar, Pakistan, Bangladesh, the United States and
  India), both wordings are shown. Sri Lanka and China cross-reference their verified
  register entries; NVIDIA, which OPMCM also lists, stays only as the verified deposit.
- **Nothing reported is counted.** Contributions verified in the Fund's own records keep
  the "Deposited in the Fund" label and remain category D; the reported entries are
  flagged `in_fund = false`, are excluded from every total, and `pnpm verify` checks both
  that exclusion and that their count (39) and stated dollar sum (USD 50,473,800) match
  what was fetched. The raw API responses are kept under `reference/`; the open-data
  register carries the flag.
- **The page's headline row and charts follow the merged register:** total USD deposited
  · verified in the Fund (count and USD) · reported by OPMCM (stated USD, with counts) ·
  the USD account balance. The "Identified by contributor" and "Awaiting attribution"
  tiles and the identified-versus-awaiting bar are gone; the contributor-type chart shows
  verified and reported amounts together, with a note that only the verified part is
  counted. The register's chips filter to "In the Fund" or "Reported by the PM Office". Where OPMCM writes "Rs", the portal writes "NPR"; figures are untouched.
- **A cleaner register.** Each row carries only the name, one date on one line (the Nepali
  date in Nepali, the Gregorian in English), a short status tag, the amount, and the
  channel in a word or two — "Through partners", "Relief goods and teams" or none. The
  wording of each reported entry stays in the open data. The country filter lists
  countries in the reader's language.

### Added — Fund usage and disbursement

- **A "कोष परिचालन तथा वितरण / Fund usage and disbursement" card on the contributions
  page**, beneath the Fund's account status, with its own database of money going out:
  transfers out of the Prime Minister Disaster Relief Fund, as the fund statement records
  them, and the receiving agency's onward disbursement, as it reports. It shows the
  amount collected, transferred, disbursed onward and still held, a four-step flow with
  each step's share of what was collected, a chart of onward disbursement by recipient,
  and every entry as a table with its source. Nothing is netted against contributions.
- **Loaded:** the NPR 1,000,000,000 transfer to NDRRMA of 2083/05/16 (the statement's
  fund-usage line) and NDRRMA's onward cash support of 2083/05/21 — Rasuwa NPR 10,000,000,
  Nuwakot NPR 10,000,000, Dhading NPR 5,000,000 and NPR 135,000,000 to 15 affected local
  governments, NPR 160,000,000 in all, leaving NPR 840,000,000 transferred but not yet
  reported as disbursed. Later entries go into `seed/disbursements.json`.
- `pnpm verify` ties the transfers to the statement's fund usage and the onward total
  to the NDRRMA report's cash-support table; the figures are published as
  `open-data/disbursements.json`.

### Data — NDRRMA update, 16 September 2026, 7:00 PM

- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 16 September 2026,
  7:00 PM** (Bhadra 31). Bodies by district sum to **1,403**, and the deceased detail
  (336 female, 544 male, 523 human remains) now sums to the same 1,403; **6,150 missing**
  with 105 bodies handed over; holding centres 1,185 + 817 + 94 = **2,096** at 29
  centres; rescued **13,742**; Army helicopter flights 1,603 (42 today), APF 320; DNA
  samples 1,286 and 1,889; fuel diesel 59,000 l, petrol 15,000 l, aviation 6,000 l, 502
  gas cylinders. Treatment 344 in hospital, 289 discharged, 9,496 by the security
  agencies; derived injured total 344 + 9,496 = 9,840.
- **Stated, not corrected:** the report's missing chart shows 587 foreign nationals,
  Rasuwa 2,679 (1,393 + 1,286) and Nuwakot 1,787 (651 + 1,136) — 5,053 in all, or 4,948
  after the 105 bodies handed over — while its own total is 6,150, a jump of 1,020 from
  the 14 September report that the chart does not carry. Both are shown as printed, with
  a note beneath the missing figures, and `pnpm verify` records the difference in place
  of a tie. The chart also no longer breaks out the security personnel, officials and bank
  staff missing from Rasuwa, so the Rasuwa detail now has two lines.
- This report carries no additional-budget chart, so that line is not shown.

### Added — Government action plans

- **A new section, "सरकारका कार्ययोजना / Government Action Plans" (`/plans`)**, built to
  hold any reform or revival plan the Government announces, action by action. Each plan is
  transcribed from its published document with the body the document makes responsible
  and the deadline it sets, validated before it is saved, and shown as a dashboard: the
  headline counts (actions, responsible bodies, actions due at once, the next deadline), a
  roadmap with one column per deadline and the action numbers due by it, the split by
  theme and by responsible body, and every action as the plan words it — filterable by
  theme, body, deadline and text, each opening to its full wording and sub-points. Earlier
  plans keep their own pages (`/plans/<slug>`) and are listed beneath the latest.
- **The first plan: the Ministry of Finance's Capital Market Strengthening and Revival
  Action Plan, 2083 (पुँजी बजार सुदृढीकरण तथा पुनरूत्थान कार्ययोजना, २०८३), 2083/05/29** —
  21 actions across nine themes and five bodies (SEBON 11, the Ministry 7, NEPSE 2, Nepal
  Rastra Bank 2, CDSC 1; two actions are shared). Deadlines: 3 immediately, 1 promptly,
  6 by the end of Asoj, 1 Kartik, 3 Mangsir, 3 Poush, 1 Magh, 1 Falgun, and 2 with no date.
  Where the document names no body, the issuing ministry is shown, and the page says so.
  The scanned original is attached.
- The wording was first transcribed from the scanned PDF and then checked word by word
  against the Ministry's Word original: the two agree throughout; the document's own
  spellings are kept, and four evident typing slips in it (समूहरू, दोसो, विद्येयक,
  नवप्रर्वतन) are spelled correctly, as the page notes. Both files are kept under
  `reference/`.
- The actions can be read as cards (each opening to its full wording) or as a table of
  number, action, responsible body and deadline — the same filters apply to both.
- **The roadmap is a time axis** from the day the plan was issued to its last deadline:
  each deadline is a mark on the line with the number of actions due in it, its name and
  date beside it and the action numbers beneath; "immediately" and "promptly" sit at the
  start, a dashed line marks today, and undated actions stand in a box apart. On a phone
  the axis stands vertical. Selecting a mark narrows the list to those actions.
- The note beneath the roadmap is only the source line and the line about unnamed
  bodies; the chart headings read "विषय" / "By theme" and "जिम्मेवार निकाय" /
  "By responsible body".
- The section's introduction names the Ministry of Finance and the Hon. Finance Minister,
  Dr. Swarnim Wagle, under whom the plans are announced.
- The section has its own share card, search entry, navigation entry and tests, and
  `pnpm verify` checks each plan's numbering, themes, bodies and deadlines.

### Data — NDRRMA update, 14 September 2026, 7:00 PM

- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, 14 September 2026,
  7:00 PM** (Bhadra 29). Bodies by district sum to **1,395**; missing 5,130 (unchanged,
  every breakdown as before); holding centres 1,499 + 825 + 94 = **2,418** at 33 centres;
  rescued **13,737**; Army helicopter flights 1,531 (15 today), APF 320; DNA samples 1,286
  from the deceased and 1,853 from relatives; fuel diesel 47,000 l, petrol 16,000 l,
  aviation 11,000 l, 502 gas cylinders.
  - Treatment: 341 in hospital, 278 discharged, 9,358 by the security agencies; the
    derived injured total is 341 + 9,358 = 9,699, with the note saying so.
- **Stated, not corrected:** the report's "Details of the deceased" (334 female, 542 male,
  512 human remains) sums to 1,388 — the same three figures as the 13 September report —
  seven fewer than its own total of 1,395 deaths. Both are shown as printed, with a note
  beside the detail, and `pnpm verify` records the difference instead of a tie.

### Data — handover list as of Bhadra 28, 2083

- **The Fund Section's cumulative handover list as of Bhadra 28 (13 September 2026)**
  replaces the Bhadra 26 list. Every one of its thirteen days ties to its Total sheet to
  the paisa; institutional, personal, cheque and cash/voucher/online totals all tie.
  Register: **485 rupee entries, NPR 2,737,630,633.82** (cheques NPR 2,150,899,659.55).
- **Two entries for Bhadra 28**, both cheques: Vikash Man Shrestha NPR 1,000,000 and
  Vikasananda Foundation Vishwo Pariwar NPR 2,000,000. The Total sheet records them as
  one personal and one institutional contribution, and the register follows it.
- **Corrected by the Fund Section, and followed:** serial 404 (Bhadra 24, NPR 422,027) is
  now named Nandalal Smriti Pratisthan, not Hamro Kosheli Bachat Tatha Rin Sahakari.
- Serials 493–600 in the list are pre-numbered empty rows, not entries; the register ends
  at 492 and reports no gap. Rows 1–490 are otherwise identical to the Bhadra 26 list.
- The grand total is **NPR 14,253,982,984.29**.

### Fixed

- **Dates.** A time recorded at midnight or in the early morning in Kathmandu showed the
  previous day's date — the formatter read the UTC calendar day, and Nepal is 5¾ hours
  ahead. The flood was shown as "Bhadra 10 · 25 Aug 2026" (it was 26 Aug), the single-
  window notice of Bhadra 11 as 26 Aug, the NCHL 12:00 AM cut-off as the day before, and
  the ticker clock was a day behind between midnight and 5:45 AM. Every date on the portal
  is now read on Nepal's calendar day. Figures are unaffected.
- **Share cards (link previews).** The Nepali card showed broken letters — the
  on-request renderer cannot shape Devanagari conjuncts, so "मन्त्रालय" and "प्राप्त"
  came apart — and the card said too little. The static build now photographs each
  card in Chromium from an HTML rendering that uses the portal's own font, so every
  conjunct is correct; the card carries the emblem, the ministry, the page title, the
  headline figure with its label, the time of the latest update and the site address.
  The ministry's server still draws cards on request with the old renderer.
- **Sources line.** "Sources: Ministry of Finance · Nepal Rastra Bank · NCHL · Fonepay ·
  NDRRMA · Nepal Police" now sits at the foot of every page, in the copyright row, rather
  than in the LIVE ticker; Nepal Rastra Bank, through which the fund statements arrive,
  is named for the first time.
- **Rescue page.** The row of date cards above the figures is gone; the page shows the
  latest report. Earlier reports are still there — each date in the daily report archive
  at the foot of the page opens that day's report.
- **Wording.** "Average online gift" is now "Average online contribution", and the
  charity vocabulary is gone with it: "donors" and "donor agencies" read "contributors"
  and "development partners", the search box asks for a contributor, and the
  "Donation portal" label is "Payment portal", as the Nepali already said. In Nepali,
  "दाता" is now "सहयोगदाता" throughout.
  The contact group "International donors & agencies" and the summary of the cabinet
  decision say "development partners". The ministry's single-window notice on the
  contact page is its own published text and is left word for word.
- **The "(N hours ago)" note is gone** from the ticker, in both languages. The line
  already states the update's date and time, and the live Nepal-time clock beside it
  makes the age plain without a second, rounded figure.
- **Phone menu.** The drawer opened underneath the header, so its first two entries —
  Home and Contributions (प्राप्त सहयोग) — were hidden behind the white header bar. The
  drawer now begins where the header ends, measured when it opens and again on resize.
  A browser test opens the drawer and fails if any section link is covered.

### Data — fund status, 2083/05/29 9:00 AM

- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/05/29
  (14 September 2026), 9:00 AM**, at NPR 152.59 per US dollar. Its 2083/05/28 column
  equals the 5:00 PM statement already loaded, bank by bank.
  - NPR balance **10,004,430,164**; collected since the flood 8,922,007,759; before +
    collected − the NPR 1 billion transferred = balance. Every bank is at or above its
    05/28 figure.
  - USD: Himalayan Bank 13,787,952 + Laxmi Sunrise 9,654,571 = **23,442,523** exactly;
    collected 22,856,475; the day's USD 669 equals the rise in the balance exactly.
  - Total available fund balance **NPR 13,581,524,783**.
- Stated, not corrected: the NPR bank lines sum to 10,004,430,165, one rupee above the
  printed total; the printed daily collection (9,405,171) is one rupee above the rise
  in the balance; the NPR balance plus the printed USD equivalent is one rupee below the
  printed total available; and the printed USD equivalent, NPR 3,577,094,618, is
  NPR 33.43 above USD 23,442,523 × 152.59.
- The grand total is **NPR 14,250,982,984.29**.

### Data — 14 September 2026: fund status 2083/05/28 5:00 PM, NCHL, Fonepay and NDRRMA report 11

- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/05/28
  (13 September 2026), 5:00 PM**, at **NPR 152.59** per US dollar (from 152.41). It also
  publishes the 2083/05/27 column, so the daily series now runs Bhadra 11–28 unbroken.
  - NPR: 05/27 balance 9,976,409,456 (its nine bank lines sum exactly); 05/28 balance
    **9,995,024,994**, collected since the flood 8,912,602,589; before + collected − the
    NPR 1 billion transferred = balance on both days. Every bank is at or above its
    previous figure on both days.
  - USD: 05/27 23,438,847; 05/28 **23,441,854**, collected 22,855,806; before + collected
    = balance on both days. The daily USD figures (154,770 and 3,007) equal the movement
    in the balances exactly.
  - Total available fund balance **NPR 13,572,017,563** = NPR balance + printed USD
    equivalent, exactly.
- Stated, not corrected: the 05/28 NPR bank lines sum to NPR 9,995,024,993, one rupee
  below the printed total; the USD bank lines sum one dollar above the printed total on
  both days; each printed NPR daily figure is one rupee off the movement in the balance
  (294,054,432 against 294,054,431; 18,615,537 against 18,615,538), though the two
  together equal the rise since the 05/26 5:00 PM statement exactly; and the printed USD
  equivalent, NPR 3,576,992,569, is NPR 67.14 above USD 23,441,854 × 152.59.
- **NCHL collection through its channels, 14 September 2026, 12:00 AM** — seven
  channels, **NPR 5,521,433,368.22** across 263,267 transactions; the lines sum to the
  printed total to the paisa, and every channel is at or above its 11 September figure
  (+3,808 transactions, +NPR 420,992,314.50).
- **Fonepay, till 13 September 2026** — five channels, **NPR 2,507,249,462** across
  925,407 transactions, lines summing exactly; every channel at or above its 10 September
  figure (+6,243 transactions, +NPR 37,798,870). The 13 September day is loaded too:
  1,512 transactions, NPR 8,942,981, lines summing exactly.
- **NDRRMA — Rasuwa Flood: Search, Rescue and Relief Update, Situation Report 11,
  13 September 2026, 7:00 PM**. Every total reconciles: bodies by district to 1,388, the
  deceased by sex and remains (334 + 542 + 512) to the same 1,388, the Rasuwa breakdown
  to 2,860, Nuwakot to 1,787, holding centres to 2,532, and missing to 5,130 after the
  104 bodies handed over are deducted.
  - casualties 1,385 → 1,388 · rescued 13,676 → 13,728 · at holding centres 3,685 at 37
    → 2,532 at 33 · Army helicopter flights 1,407 → 1,516 (34 today), APF 299 → 320 ·
    fuel: diesel 45,000 → 33,000 l, petrol 23,000 → 18,000 l, aviation 13,000 → 15,000 l,
    gas cylinders 457 → 502.
  - **New in this report and now shown:** DNA samples collected (1,286 from the deceased,
    1,846 from relatives), the deceased by sex, the additional budget for search and
    rescue equipment (Nepali Army NPR 90 million, Nepal Police 60 million, Armed Police
    Force 60 million), and the monthly allowance for families outside the holding centres
    (NPR 15,000 per family plus NPR 2,000 per further member, up to six months).
  - **Omitted by this report:** the security personnel deployed, and cash support by
    district. The schema now takes both as optional and the portal shows nothing for
    them rather than repeating an older figure; where the security tile stood, the
    DNA-samples figure is shown. Treatment by the security agencies is printed as one
    figure (9,314) without the Army / APF split, so the derived injured total is
    339 + 9,314 = 9,653 — those discharged are not counted, as before — and the note
    beneath it says so.
  - The Rasuwa missing detail is unchanged from 11 September (2,860 in the same seven
    lines); the report labels the 587 as foreign nationals.
- The grand total is **NPR 14,250,880,901.58** (online channels NPR 8,028,682,830.22 +
  handovers NPR 2,734,630,633.82 + USD 22,855,806 × 152.59).

### Data — handover list as of Bhadra 26, and fund status, 2083/05/26 5:00 PM

- **The Fund Section's cumulative handover list as of Bhadra 26, 2083 (11 September 2026)** replaces the Bhadra 19 list and the Bhadra 24 collection sheet as the source
  of the register. It is numbered 1–490 without a break, and every figure was checked
  against its own Total sheet:
  - all twelve days, Bhadra 11 to 26, tie to the paisa — institutional, personal,
    US dollar, and cheque against cash, voucher and online;
  - 483 rupee entries, **NPR 2,734,630,633.82** (cheques NPR 2,147,899,659.55; cash,
    voucher and online NPR 586,730,974.27); every grouped cheque sums to its group total.
- **New in the register:** Bhadra 22 (54 entries, NPR 228,763,390.30 — the serials the
  page had reported as not yet supplied), Bhadra 25 (19, NPR 38,216,147) and Bhadra 26
  (21 new rupee entries), Heifer Project International Nepal (Bhadra 18, NPR 10,000,000)
  and Krishi Samagri Company (Bhadra 24, NPR 3,300,111 in two cheques).
- **Corrected by the Fund Section, and followed:** Raji Rana NPR 10,900,000 →
  10,980,000; Hamro Kosheli Bachat Tatha Rin Sahakari NPR 422,067 → 422,027; Yak
  Brewing's NPR 1,500,000 moved from Bhadra 15 to Bhadra 26. Two contributor types now
  follow the list (the Bhadra 24 sheet had none).
- **Four serials carry no amount** — 28, 125, 128 and 350; each contribution is
  re-listed under a later serial (333, 337, 474, 471), where it is counted once. The
  register does not report them as a gap.
- **Payment mode.** The list prints the cheque date of every cheque and none for cash,
  voucher or online payments; that rule reproduces the printed split on every day. It
  shows eight Bhadra 24 entries (NPR 23,037,313) had been recorded as cheques; they are
  corrected. The portal's label for these now uses the Fund Section's own words —
  "Cash, voucher or online" — instead of "Bank transfer".
- **Two US-dollar contributions join foreign assistance:** the Embassy of Sri Lanka,
  USD 1,000,000 (Bhadra 26), and The Ghyualsumdo Sewa Sanshta Inc., USD 15,654 (Bhadra
  22), each stated at the rate of that day's fund statement (152.41 and 150.88). The
  list does not state the latter's country, so none is shown. Identified foreign
  contributions are now USD 11,215,654.
- `pnpm verify` now checks every day's printed total and the printed cheque and
  non-cheque amounts as well.
- On a phone, a bar's name too long for its share of the chart — "Cash, voucher or
  online (60)" — now wraps beneath its bar instead of running past the chart's edge.
- The register search test looks for Kumari Bank among the hits for "Kumari": the new
  entry "Bramakumari Rajyoga Sewa Kendra" also matches, and now sorts first.
- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/05/26,
  5:00 PM**, at NPR 152.41 per US dollar; the 9:00 AM statement is kept.
  - NPR: the nine bank balances sum to NPR 9,682,355,025; the pre-disaster
    NPR 2,082,422,405 plus NPR 8,599,932,620 collected, less the NPR 1 billion
    transferred to NDRRMA, gives that balance. Every bank is at or above its 9:00 AM
    figure, and the 2083/05/25 column is identical to the morning's.
  - USD: USD 586,048 before the flood plus USD 22,698,029 collected = USD 23,284,077.
  - Total available fund balance NPR 13,231,081,267.
- Stated, not corrected — each a one-unit rounding in the statement: its USD bank lines
  sum to 23,284,078, one above the printed total; its daily figures differ by one from
  the movement in the balances (NPR 355,572,790 against 355,572,789 printed, USD 1,474,633
  against 1,474,634); and the NPR balance plus the printed USD equivalent is
  NPR 13,231,081,268 against 13,231,081,267. The printed USD equivalent,
  NPR 3,548,726,243, is NPR 67.43 above USD 23,284,077 × 152.41.
- Foreign assistance (category C) is USD 22,698,029, of which USD 11,482,375 awaits
  attribution. The grand total is **NPR 13,763,928,879.43**.

### Favicon and link previews

- **The emblem of Nepal as the favicon** — `favicon.ico` (16, 32 and 48px), PNG icons at
  16, 32, 48, 192 and 512px, and an Apple touch icon on white (iOS draws a transparent
  icon on black). Generated only by resampling the emblem: `node scripts/make-icons.mjs`.
- **A web manifest**, so a phone that adds the site to its home screen shows the emblem,
  the portal's name and the ministry's navy.
- **Link previews on every page** — canonical address, the other language's address, site
  name, title, description and the page's own share card with alt text, for search
  engines, Facebook, WhatsApp, Viber and X alike.
- **The bare site address** — the one the ministry links to — carries its own favicon and
  full preview, since link-preview crawlers do not follow its redirect to the Nepali page.
- Structured data names the Ministry of Finance, Government of Nepal, as the publisher,
  with the emblem as its logo.

### Data — fund status, 2083/05/26 9:00 AM

- **Prime Minister Disaster Relief Fund — Daily Deposit and Fund Status, 2083/05/26
  (11 September 2026), 9:00 AM**, at NPR 152.41 per US dollar. Every figure checked
  against the statement's own totals:
  - NPR accounts: the nine bank balances sum to NPR 9,415,287,005; the pre-disaster
    balance of NPR 2,082,422,405 plus NPR 8,332,864,600 collected since the flood, less
    the NPR 1 billion already transferred to NDRRMA, gives that balance. The day's
    collection, NPR 88,504,770, equals both the rise in the balance and the rise in
    collections. The fund-usage row prints "–"; the figures only reconcile with the
    earlier NPR 1 billion transfer counted, so it stays recorded.
  - USD accounts: Himalayan Bank 13,629,507 + Laxmi Sunrise 9,418,404 = USD 23,047,911;
    less USD 586,048 held before the flood, USD 22,461,863 collected; the day's
    USD 1,238,467 was all in the Himalayan Bank account.
  - Total available NPR 12,928,019,102 = NPR balance + the printed USD equivalent.
- Stated, not corrected: the statement's USD equivalent (NPR 3,512,732,097) is NPR 18.51
  below USD 23,047,911 × 152.41; its 2083/05/25 column's bank lines sum to NPR 1 less
  than its printed total; and working back from its 2083/05/25 daily figures gives
  collections for 2083/05/24 NPR 183,170,523 and USD 220,202 above the 9:00 AM statement
  of that day loaded earlier — most likely a later statement of 05/24 not supplied.
- Foreign assistance (category C) is now USD 22,461,863, of which USD 10,200,000 has an
  identified contributor. The grand total is **NPR 13,145,846,494.80**.

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
