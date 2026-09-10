# रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update — website prototype

Static, bilingual (ने / EN), responsive website. No build step, no server required.

## Run
Open `index.html` in a browser, or serve the folder (recommended so the live NDRRMA embed and map load):
    python3 -m http.server 8080      →  http://localhost:8080/
Deploy: copy the folder to `mof.gov.np/rasuwa-flood/` (all paths are relative).

## Structure
- `index.html`, `contributions.html`, `foreign.html`, `rescue.html`, `initiatives.html`, `contact.html` — pages
- `data/data.js` — **all figures live here** (NCHL, Fonepay, 331 handovers, foreign, NDRRMA/Police, initiatives, contacts). Edit this file to update the site; every KPI, chart and table re-renders from it.
- `assets/js/app.js` — rendering, language toggle, number/date formatting (Devanagari digits, lakh/crore grouping), charts, tables, count-up
- `assets/css/site.css` — Nepal government palette (crimson #C8102E, navy #003893), Mukta font, responsive rules
- `assets/js/vendor/chart.umd.js` — Chart.js 4 (vendored)
- `reference/` — original Cabinet annex and Business Recovery Plan PDFs linked from the initiatives page
- `downloads/` — the Nepali and English A4 PDF exports (linked from the footer); every section is paginated with charts and cards kept whole. Regenerate after data updates: print each page from Chromium with media=print, A4, scale 0.85 (the print stylesheet at the end of `site.css` handles layout).
- `cover.html` — PDF cover only (not linked in navigation)

## Contribution categories (no double counting)
| Code | Category | Currency | `data.js` | In grand total |
|---|---|---|---|---|
| A | Online / banking channels: NCHL + Fonepay via donate.gov.np | NPR | `nchl`, `fonepay` (with `history` and `daily`) | yes |
| - | Prime Minister Disaster Relief Fund status statement (NRB) (bank-wise balances, daily deposits, NPR & USD) | NPR/USD | `fund_status` | NPR part: **no** (account view of A, shown as its own section); USD part: **is** category C |
| B | Cheques / handovers to the Hon. Finance Minister | NPR | `contributions` (330 rows, NPR only) | yes |
| C | Foreign assistance = total USD deposited after the flood in the Fund's USD accounts (`fund_status.usd.gross`) | USD | `fund_status.usd` | yes, at `meta.fx_usd_npr` (150.88, the rate in the OPMCM statement) |
| D | Identified foreign contributors (NVIDIA, Embassy of China incl. its USD cheque) | USD | `foreign` | **no** - a subset of C, shown as "identified" vs "awaiting attribution" |

Grand total = A + B + C x FX = 4,448,586,974.34 + 2,375,275,198 + 1,929,292,838.25 + 20,098,123 x 150.88 = **NPR 11,785,559,808.83** (as shipped).
The fund-status statement's own headline - total available fund balance NPR 11,305,075,768 (incl. pre-flood balances and after NPR 1 billion transferred to NDRRMA) - is shown separately as "account status", never mixed with the contributions total.

## Update the numbers
1. Open `data/data.js`. Update `meta.updated_bs / updated_en`, the `nchl`, `fonepay` blocks (channels + as_of), append rows to `contributions`, `foreign`, `updates`, and paste the latest NDRRMA / Police figures into `rescue`.
2. Save. Reload the page. Totals (including the home-page grand total = NCHL + Fonepay + handovers + foreign USD × FX) are computed automatically.

## Search, filters and categories
- Header search box (every page) searches contributors, sectors, foreign assistance, relief measures, contacts, updates and sections; Enter opens the first result.
- Contributions register: quick chips (institutional / individual / cheque / bank transfer / ≥ 1 crore / USD), free-text search, filters for **sector** (15 categories), type, amount band, mode and date; sortable columns; CSV export of the filtered view. Sector chart and sector list are click-to-filter. Deep links: `contributions.html?q=<name>` and `?sector=<code>`.
- Sector codes (edit `sectors` and each contribution's `sector` in `data/data.js`): individual, bank, insurance, industry, trade, hospitality, tech, health, education, media, energy, association, gov, embassy, other.
- Foreign register: chips + filters for contributor type, kind (cash / in-kind / pledge) and country.
- Government initiatives: category cards filter the 18 measures; search box and implementing-agency filter; `initiatives.html?m=<no>` opens a measure; `?cat=<क–ङ>` pre-filters.
- Rescue: searchable district table (bodies, missing, holding centres, electricity, cash support) and report archive filterable by agency.
- Contacts: search by name, title or group.

## Audit checklist (run before each release)
- No horizontal overflow on any page at 1280 / 1024 / 768 / 390 px in both languages (all pass as shipped)
- Home grand total = NCHL + Fonepay + handovers + foreign USD × FX; the "Data sources & cut-off times" table lists each source's as-of
- Channel sums match the network's published total (Fonepay's published total differs from its channel sum by Rs 1 — the published figure is used and noted)
- Every table: search, filters, chips, sort, pagination, CSV; header search returns results for a donor, a sector and a relief measure

## Type scale
Base 17px; nothing below 12px. Large figures (KPI values, hero total) auto-fit their card and never clip. Desktop nav is sticky and two-line (Nepali / English); on phones the hamburger opens a full-screen drawer with 56px rows, language toggle and donate button.

## Public content rule
No change-log or developer text on public pages (no formulas, no file/field names). Notes must read as official statements.

## Language
`?lang=ne` or `?lang=en` in the URL, or the ने | EN toggle (remembered in the browser).
Add `?static=1` to disable animations (used for PDF export).
