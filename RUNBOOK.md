# RUNBOOK — रसुवा–भोटेकोशी बाढी अपडेट

**कोष शाखा, अर्थ मन्त्रालय · Fund Section, Ministry of Finance**
Portal: `https://mof.gov.np/rasuwa-flood` · Admin: `https://mof.gov.np/rasuwa-flood/admin`

This is the day-to-day guide. The daily update takes under ten minutes.

---

## 1. The daily update in under ten minutes

Sign in at `/rasuwa-flood/admin`. Everything below lands as a **draft**; nothing
appears on the public site until it is verified and published. That is deliberate.

### (a) NCHL and Fonepay figures — about 2 minutes

1. Open **आयात · Imports**.
2. In _NCHL / Fonepay दैनिक विवरण_, paste the network's table exactly as it is
   printed — channel, transaction count, amount, one line per channel. The parser
   reads `2,11,76,39,003`, `2117639003` and `२,११,७६,३९,००३` alike, and skips the
   `Total` / `जम्मा` line so it is never imported as a channel.
3. Press **पूर्वावलोकन · Preview** and check the parsed table.
4. Choose the network, `cumulative` (the running total) or `daily` (that day only),
   the date and time the figures are _as of_, and the source, then
   **मस्यौदा बनाउनुहोस् · Save as drafts**.

Repeat for the other network. The public site shows the newest **cumulative**
snapshot per network; the daily rows feed the trend charts.

### (b) The handover list — about 3 minutes

1. In _हस्तान्तरण सूची आयात_, choose the Fund Section's own spreadsheet
   (`.xlsx` or `.csv`, the `bhadra_19.xlsx` layout). Column order does not matter —
   headers are matched by name.
2. **पूर्वावलोकन · Preview** shows every row with its BS→AD date, the suggested
   sector, and any problem in red. Rows that repeat an entry already in the
   database are marked _duplicate_.
3. Leave **दोहोरिएका पङ्क्ति छाड्नुहोस् · skip duplicates** ticked, set the source,
   then **Create drafts**.

Only clean rows are created. Rows with errors are reported and left out — correct
them in the spreadsheet and import again.

### (c) The NDRRMA / Nepal Police report — about 3 minutes

1. In _उद्धार प्रतिवेदन_, pick the agency. The figures box is **pre-filled with
   yesterday's report** — edit only the numbers that changed.
2. Set the date (BS and AD) and the time on the report.
3. Attach the day's original (PDF or photo) and **Save as draft**.

The figures are checked against a schema before saving, so a mistyped report is
refused rather than published.

### (d) The fund status statement

The bank-wise view of the statement is published at `/rasuwa-flood/<language>/contributions#nrb`.

The Prime Minister Disaster Relief Fund's _Daily Deposit and Fund Status_
statement (received via Nepal Rastra Bank) is entered by the Fund Section. Each
statement is its own record, so the previous day's is kept intact. The public
site reports the newest one. Attach the scanned original to every statement.

### (e) Verify, then publish — about 2 minutes

1. **कार्यसूची · Queue** → choose the record type → status `draft`.
2. Check the rows against the source document, tick them, choose
   **प्रमाणित गर्नुहोस् · Verify**, and apply. If something is wrong, choose
   **फिर्ता पठाउनुहोस् · Send back** and leave a comment.
3. A **publisher** then filters to `verified`, ticks the rows and applies
   **प्रकाशन गर्नुहोस् · Publish**.

The public pages update within a minute. To force it, use
**पुनः गणना · regenerate totals** on the dashboard.

---

## 1b. The live site on GitHub — publishing by commit

Until the server edition runs at mof.gov.np, the public site is the static edition
at **https://mofnepal.github.io/rasuwa-flood-update/**. It has no admin area: its
figures come from the files in `seed/`, and it is rebuilt and republished on every
push to `main`. See [GITHUB.md](GITHUB.md) for how that works.

1. **Keep the source.** Put the new document in `reference/` under a dated name, for
   example `reference/nchl-collection-2026-09-10.jpeg`.
2. **Enter the figures** in the file they belong to:

   | Source document                           | File                                    |
   | ----------------------------------------- | --------------------------------------- |
   | NCHL or Fonepay channel figures           | `seed/digital_channel_snapshots.csv`    |
   | Handover list (cheques, bank transfers)   | `seed/inperson_contributions.csv`       |
   | Fund status statement (Nepal Rastra Bank) | `seed/fund_status.json` → `statements`  |
   | NDRRMA or Nepal Police report             | `seed/rescue_snapshot.json` → `reports` |
   | Identified foreign contributors           | `seed/foreign_assistance.csv`           |
   | Decisions, notices, contacts              | `seed/decisions.json`                   |

3. **Record the printed total** in `seed/published_totals.json`: a network's total
   under `channel_snapshots`, keyed `NETWORK|date`; the handover register's new total
   and entry count under `handover_register`; the identified foreign total under
   `foreign_identified_usd`.
4. **Check it on this computer** — the local database must be running
   (`pnpm db:local`) and `SEED_PASSWORD` in `.env` must be at least 12 characters:

   ```bash
   pnpm db:reset
   pnpm verify
   ```

   It must end with `N of N checks tie`. To see the site exactly as it will be
   published: `NEXT_PUBLIC_BASE_PATH=/rasuwa-flood-update pnpm build:static`, then
   start `portal-static` from the preview panel.

5. **Commit and push:**

   ```bash
   git add seed reference
   git commit -m "Load the NCHL collection of 10 September"
   git push
   ```

6. **Watch Actions → Live site.** Green means it is live. Red means nothing was
   published and the previous version is still up — open the red step; a `DIFFERS`
   line names the figure that does not tie.

To withdraw a published update, `git revert` its commit and push.

---

## 2. Who can do what

| Role        | Can                                                                   |
| ----------- | --------------------------------------------------------------------- |
| `entry`     | create and import records as drafts                                   |
| `verifier`  | everything above, plus verify and send back                           |
| `publisher` | everything above, plus publish, unpublish, archive, regenerate totals |
| `admin`     | everything above, plus accounts, the exchange rate and settings       |

Every change is written to **अभिलेख · Audit** with the record before and after,
the account that made it and the IP. **Staff names never appear on the public
site** — a published record shows only that it was verified, and when.

Publishing is deliberately two people: the person who verifies a record cannot
also publish it unless they hold the publisher role.

---

## 3. Corrections

**A figure was published in error.** Queue → status `published` → tick it →
**प्रकाशन हटाउनुहोस् · Unpublish**. It leaves the public site at once and returns
to `verified`. Correct it, verify, publish again.

**A whole day's import was wrong.** Filter the queue to that record type and
status, tick the rows, and **अभिलेखमा राख्नुहोस् · Archive**. Archived records stay
in the database and in the audit log; they are simply not public.

**A contributor is in the wrong sector.** The sector is an editable field. The
importer only suggests one from the contributor's name.

**The exchange rate changed.** Settings → _विनिमय दर_. Enter the rate printed on
the fund status statement and its source. The rupee equivalent of foreign
assistance and the grand total recompute immediately.

---

## 3a. Checking the figures

Two commands. Run both after every update, before telling anyone the site is current.

```bash
pnpm verify                    # every figure against its own source
node scripts/acceptance.mjs    # the published site, in both languages
```

`pnpm verify` re-derives everything from the database and checks that each
document's parts sum to the total it prints — the channel lines to the network's
published total, the register to the Bhadra 19 list, the fund statement's bank
balances to its own totals, each rescue report's breakdowns to its headline — and
that the four categories combine the way section 4 says. It ends with
`N of N checks tie`. **If anything says DIFFERS, do not publish until it is
explained.**

It also prints, under "Stated, not hidden", the differences that are real and
disclosed rather than corrected: the rounding in the ministry's own sheet, and the
gap between receipts recorded and money already in the fund's accounts.

What it cannot do is confirm a source document. It checks that the portal says
what the documents say. Only the Fund Section can confirm the documents.

---

## 4. How the total is built

Four categories, and the grand total is **A + B + C × FX**:

|       |                                              |                                                                                              |
| ----- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A** | Online / banking channels (NPR)              | latest published cumulative snapshot per network                                             |
| **B** | Handovers to the Hon. Finance Minister (NPR) | published contribution rows, NPR only                                                        |
| **C** | Foreign assistance (USD)                     | USD deposited after the flood in the fund's USD accounts, from the fund status statement     |
| **D** | Identified foreign contributors              | **a subset of C** — shown as "identified" against "awaiting attribution", never added on top |

The NPR side of the fund status statement — bank balances, daily deposits, the
NPR 1 billion transferred to NDRRMA, the total available balance — is reported as
**account status**. It is never added to the contributions total.

A USD cheque handed to the Minister — the Embassy of China's USD 200,000 — belongs to
**D**, never to **B**. B is NPR only, and the handover register is 330 rows. In the
Fund Section's spreadsheet such a row carries `D` in the `category` column, and the
importer keeps it out of the register automatically. If a new foreign-currency cheque
arrives, mark it `D` in the spreadsheet and add it under foreign assistance.

The gap between the NPR this portal records (A + B) and the NPR already in the
fund's accounts is settlement and cheque clearing still in progress. The portal
states it plainly rather than hiding it.

---

## 5. Running the portal

```bash
cp .env.example .env          # then set every secret marked "change-me"
docker compose up -d --build
docker compose exec web pnpm db:deploy
docker compose exec web pnpm db:seed
```

The seed creates four accounts, all with `SEED_PASSWORD`:

| Account                | Role      |
| ---------------------- | --------- |
| `admin@mof.gov.np`     | admin     |
| `publisher@mof.gov.np` | publisher |
| `verifier@mof.gov.np`  | verifier  |
| `entry@mof.gov.np`     | entry     |

**Change every password from Users on first sign-in**, and deactivate any account
that is not in use.

### On the ministry's own server

The portal expects to sit at a subpath. Add this to the existing server block —
the full file is in `nginx/rasuwa-flood.conf`:

```nginx
location /rasuwa-flood/ {
    proxy_pass http://rasuwa_web:3000/rasuwa-flood/;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Checks

- Health: `GET /rasuwa-flood/api/health` → `{"status":"ok","database":"ok"}`
- Logs: `docker compose logs -f web`
- Backups: `pg_dump` runs nightly at 02:15 Nepal Time into `./backups`, thirty
  days kept. Restore with
  `gunzip -c backups/rasuwa-flood_<stamp>.sql.gz | docker compose exec -T postgres psql -U rasuwa -d rasuwa_flood`.
  **Test a restore before you need one.**

---

## 6. Open data

Everything the public site shows is available as JSON, published records only:

```
/rasuwa-flood/api/v1                     index of the endpoints
/rasuwa-flood/api/v1/summary             headline figures and every cut-off time
/rasuwa-flood/api/v1/contributions       ?type= &mode= &sector= &from= &to= &q= &page= &format=csv
/rasuwa-flood/api/v1/channels            ?network=NCHL|FONEPAY &period=cumulative|daily
/rasuwa-flood/api/v1/fund-status         the fund status statement
/rasuwa-flood/api/v1/foreign             identified foreign contributors
/rasuwa-flood/api/v1/rescue/latest       newest NDRRMA and Nepal Police reports
/rasuwa-flood/api/v1/rescue/reports      the archive
/rasuwa-flood/api/v1/decisions           decisions and their relief measures
/rasuwa-flood/api/v1/contacts            single-window contacts
```

Add `?format=csv` to any list endpoint. Every response carries an `as_of`.

---

## 7. The next disaster

Every record is scoped to a `Disaster`. To serve a new one, add a row with a new
`slug`, set `active`, and start importing. The existing records stay where they
are, and nothing about the portal needs rebuilding.

---

## 8. Rules that do not bend

1. **No figure without a source and an as-of.** If it cannot be sourced, it does
   not go on the site. Use the empty state — _प्रविष्टि प्रतीक्षारत · awaiting
   verified entry_ — rather than an estimate.
2. **Different sources have different cut-offs.** Any combined total shows each
   source's cut-off beneath it, and the reconciliation note stays.
3. **The rescued-persons list is never copied here.** The portal links to NDRRMA
   and embeds their page. Their site is the record.
4. **No internal or developer text on a public page** — no formulas, no field
   names, no change notes. Explanatory notes read as official statements.
5. **Currency is `रु.` in Nepali and `NPR` in English.** Never `Rs`.
6. **Dates are BS first, AD second**: `२०८३ भदौ २१ · 6 Sep 2026`.
7. The statement is called _Prime Minister Disaster Relief Fund — Daily Deposit
   and Fund Status (Nepal Rastra Bank)_, not by the office acronym.
8. **The emblem is never recoloured, restyled or re-encoded.**

---

## 9. When something is wrong

| Symptom                                 | What to do                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Public figures look stale               | Dashboard → **पुनः गणना · regenerate totals**                                                                                    |
| `/api/health` returns 503               | Postgres is down: `docker compose ps`, `docker compose logs postgres`                                                            |
| The PDF download returns 503            | `PDF_CHROMIUM_PATH` is unset or wrong. Until it is fixed, print the page from the browser — the A4 print stylesheet is built in  |
| The rescued-persons embed is blank      | NDRRMA is refusing to be framed. The fallback and the "open in a new tab" button are there for exactly this; nothing to fix here |
| An import says a date could not be read | The BS date label is not one the parser knows. Use `भदौ २२` or `2083/05/22`                                                      |
| Sign-in fails repeatedly                | Five attempts per account per fifteen minutes. Wait, or have an admin reset the password                                         |
