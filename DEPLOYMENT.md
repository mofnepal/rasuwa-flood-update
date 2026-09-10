# DEPLOYMENT — रसुवा–भोटेकोशी बाढी अपडेट

**For the Department of Information Technology / NITC**
Rasuwa–Bhotekoshi Flood Relief Transparency Portal
Ministry of Finance, Government of Nepal

This is the complete handover document for the team that runs the server. For the
day-to-day work of publishing figures, see **[RUNBOOK.md](RUNBOOK.md)** — that one is
for Fund Section staff, not for you.

---

## 1. What this is, in one paragraph

A bilingual public portal that publishes, with a source and a timestamp against every
number, what has been contributed to the Prime Minister Disaster Relief Fund for the
Rasuwa–Bhotekoshi flood, what foreign assistance has arrived, what the rescue figures
are, and what the government has decided. It is a Next.js application backed by
PostgreSQL. Ministry staff enter and publish data through an admin area on the same
host; the public sees only records that have been verified and published.

It **must** be served at `https://mof.gov.np/rasuwa-flood` with these sub-paths:

```
/rasuwa-flood/ne              /rasuwa-flood/en              (the two languages)
/rasuwa-flood/<lang>/contributions
/rasuwa-flood/<lang>/foreign
/rasuwa-flood/<lang>/rescue
/rasuwa-flood/<lang>/initiatives
/rasuwa-flood/<lang>/contact
/rasuwa-flood/admin           (staff only, never indexed)
/rasuwa-flood/api/v1          (open data)
/rasuwa-flood/api/health      (health probe)
```

The sub-path `/rasuwa-flood` is compiled into the application (`basePath`). Serving it
from a different prefix means rebuilding, so please keep this one.

### Replacing the interim static site

A static copy is currently served from a folder at the same address. When you cut over:

1. Bring this application up on its own port and confirm `/rasuwa-flood/api/health`.
2. Change the `location /rasuwa-flood/` block from serving the folder to the
   `proxy_pass` shown in section 5, and reload nginx.
3. Keep the old folder for a few days. Rolling back is putting the old block back.

Every path the static site published continues to work, so nothing bookmarked breaks.

### The GitHub Pages edition

The public portal is also published as a static edition from the GitHub repository, at
`https://mofnepal.github.io/rasuwa-flood-update/` — the same pages and figures, with no
admin area, rebuilt on every push ([GITHUB.md](GITHUB.md)). When this server edition goes
live, point the link on mof.gov.np here, and from then on enter figures through the admin
area. The two can run side by side while the ministry cuts over.

---

## 2. What the server needs

|      | Minimum               | Comfortable                      |
| ---- | --------------------- | -------------------------------- |
| CPU  | 2 cores               | 4 cores                          |
| RAM  | 4 GB                  | 8 GB                             |
| Disk | 20 GB                 | 50 GB (uploads and backups grow) |
| OS   | any Linux with Docker | Ubuntu 22.04 / RHEL 9            |

**Software:** Docker Engine 24+ and the Compose plugin. If Docker is not permitted on
the ministry's servers, section 8 has a Docker-free install.

**Outbound network:** none required at runtime. The rescue page frames a page from
`ndrrma.gov.np`, but that request is made by the _visitor's_ browser, not the server,
and the page degrades to a labelled fallback and a link if it is blocked.

**Ports:** the application listens on `3000` inside its container. Nothing else needs
to be exposed; nginx reaches it over the internal Docker network.

---

## 3. Deploying it

```bash
tar xzf mof-rasuwa-flood-portal.tar.gz
cd mof-rasuwa-flood-portal

cp .env.example .env
# Edit .env now — every value marked "change-me" must be changed. See section 4.

docker compose up -d --build

# First run only: create the schema, then load the ministry's data.
docker compose exec web pnpm db:deploy
docker compose exec web pnpm db:seed
```

Then check it:

```bash
curl -s http://localhost:8080/rasuwa-flood/api/health
# {"status":"ok","database":"ok","time":"..."}
```

`docker compose up` starts five containers: the application, PostgreSQL 16, MinIO
(object storage for uploaded documents), nginx, and a nightly backup job.

**The first thing to do after the first sign-in is change all four passwords** — see
section 6.

---

## 4. Configuration

Everything is in `.env`. `.env.example` is the annotated template. Nothing else needs
editing to deploy.

### Must be changed before going live

| Variable               | What it is                                    | How to set it                                                     |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| `POSTGRES_PASSWORD`    | database password                             | `openssl rand -base64 24`                                         |
| `AUTH_SECRET`          | signs admin session cookies                   | `openssl rand -base64 32`                                         |
| `S3_SECRET_KEY`        | MinIO password                                | `openssl rand -base64 24`                                         |
| `SEED_PASSWORD`        | initial password for the four seeded accounts | choose one, then change every account's password at first sign-in |
| `NEXTAUTH_URL`         | `https://mof.gov.np/rasuwa-flood`             | the public address, including the sub-path                        |
| `NEXT_PUBLIC_SITE_URL` | the same                                      | used for share cards and canonical links                          |

### Should be set

| Variable                                               | What it is                                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | so the contact form emails the portal officer. Without these the message is still stored in the database and visible in the admin area — nothing is lost, it just is not emailed. |
| `CONTACT_TO`                                           | who receives those messages (`fmo@mof.gov.np`)                                                                                                                                    |
| `CONTACT_FROM`                                         | the From address                                                                                                                                                                  |

### Leave alone unless you know why

| Variable               | Default                 | Note                                                            |
| ---------------------- | ----------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`         | set by compose          | points at the `postgres` service                                |
| `STORAGE_DRIVER`       | `local`                 | `s3` switches uploads to MinIO                                  |
| `UPLOAD_DIR`           | `/data/uploads`         | **must stay on a persistent volume**                            |
| `UPLOAD_PUBLIC_PREFIX` | `/rasuwa-flood/uploads` | must keep the sub-path                                          |
| `PDF_CHROMIUM_PATH`    | `/usr/bin/chromium`     | set inside the image; the PDF export needs it                   |
| `PDF_ORIGIN`           | `http://127.0.0.1:3000` | how the PDF renderer reaches the site from inside the container |
| `HTTP_PORT`            | `8080`                  | the port nginx publishes on the host                            |

---

## 5. Putting it behind the ministry's nginx

The package ships a complete `nginx/rasuwa-flood.conf` used by the bundled nginx
container. On `mof.gov.np` you do not need that whole file — add this to the existing
server block, then reload:

```nginx
location /rasuwa-flood/ {
    proxy_pass http://127.0.0.1:8080/rasuwa-flood/;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;   # required: the app trusts this for HTTPS
    proxy_set_header Connection        "";
    proxy_read_timeout 180s;                       # the PDF export can take a minute
    client_max_body_size 25m;                      # officers upload scanned reports
}
```

Three things that matter:

- **`X-Forwarded-Proto` is not optional.** TLS terminates at your edge; without this
  header the application builds `http://` links and admin sign-in fails.
- **`client_max_body_size 25m`.** Officers upload scanned PDFs and photographs of the
  daily reports. The default 1 MB rejects them with a confusing error.
- **`proxy_read_timeout 180s`.** The "Download PDF" button renders the live page
  through a headless browser and can take up to a minute on a busy server.

The shipped config also does one minute of micro-caching in front of the public pages,
which absorbs a traffic spike if the portal is linked from the news, and never serves a
figure more than a minute old. The admin area and the authentication endpoints are
excluded from that cache. If you proxy from the ministry's nginx instead of using the
bundled one, consider copying the `proxy_cache` lines across.

---

## 6. First sign-in and accounts

Seeding creates four accounts, all with `SEED_PASSWORD`:

| Account                | Role      | Can                                    |
| ---------------------- | --------- | -------------------------------------- |
| `admin@mof.gov.np`     | admin     | everything, plus accounts and settings |
| `publisher@mof.gov.np` | publisher | publish, unpublish, archive            |
| `verifier@mof.gov.np`  | verifier  | verify, send back                      |
| `entry@mof.gov.np`     | entry     | create and import drafts               |

**On the day of handover:**

1. Sign in as `admin@mof.gov.np` at `/rasuwa-flood/admin`.
2. Go to **प्रयोगकर्ता · Accounts** and set a new password on every account.
3. Create real accounts for the named officers and deactivate any of the four you do
   not need. Do not share accounts — the audit log records who did what.

Passwords are hashed with argon2. Sign-in is limited to five attempts per account per
fifteen minutes. Sessions last eight hours.

---

## 7. After deploying: the checklist

```bash
# 1. The application and the database are up.
curl -s https://mof.gov.np/rasuwa-flood/api/health

# 2. Both languages render.
curl -sI https://mof.gov.np/rasuwa-flood/ne | head -1
curl -sI https://mof.gov.np/rasuwa-flood/en | head -1

# 3. The figures are the published ones.
curl -s https://mof.gov.np/rasuwa-flood/api/v1/summary | head -c 400

# 4. The admin area is closed to the public.
curl -sI https://mof.gov.np/rasuwa-flood/admin | head -1     # expect a redirect to /admin/login
```

There is also an automated check that verifies the published figures, the absence of
placeholder text in either language, the layout at four screen widths, and the contact
list. Run it from a machine with Node:

```bash
pnpm install
node scripts/acceptance.mjs https://mof.gov.np/rasuwa-flood
```

It should end with `ALL ACCEPTANCE CHECKS PASSED`. Run it after every deployment.

There is a second check that audits the figures themselves rather than the pages:

```bash
pnpm verify
```

It re-derives every published figure from the database and checks it against its
own source — 48 checks at the time of handover, all tying. Run it after the seed
and after any data import.

To measure performance on the real server:

```bash
node scripts/lighthouse.mjs https://mof.gov.np/rasuwa-flood/ne
```

---

## 8. Installing without Docker

If Docker is not allowed, the application is an ordinary Node service.

**Needs:** Node.js 22 LTS, pnpm 10, PostgreSQL 16 (created with `--encoding=UTF8` —
the portal stores Devanagari throughout), and Chromium if you want the PDF export.

```bash
sudo -u postgres createuser rasuwa --pwprompt
sudo -u postgres createdb rasuwa_flood -O rasuwa -E UTF8 --lc-collate=C --lc-ctype=C

cd /opt/rasuwa-flood
cp .env.example .env          # set DATABASE_URL to the local server, and the secrets
corepack enable
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm db:seed
pnpm build
```

Run it under systemd — `/etc/systemd/system/rasuwa-flood.service`:

```ini
[Unit]
Description=MoF Rasuwa-Bhotekoshi Flood Update
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=rasuwa
WorkingDirectory=/opt/rasuwa-flood
EnvironmentFile=/opt/rasuwa-flood/.env
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/rasuwa-flood/data

[Install]
WantedBy=multi-user.target
```

The standalone server expects the static assets beside it:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public        .next/standalone/public
sudo systemctl enable --now rasuwa-flood
```

Set `UPLOAD_DIR=/opt/rasuwa-flood/data/uploads` and make sure that directory survives
deployments. Add the nightly backup as a cron job — see `docker/backup.sh` for the
command.

---

## 9. Backups

The `backup` container runs `pg_dump` every night at **02:15 Nepal Time** into
`./backups`, gzipped, and deletes anything older than thirty days.

```bash
ls -lh backups/
```

**Restoring:**

```bash
gunzip -c backups/rasuwa-flood_2026-09-08_0215.sql.gz \
  | docker compose exec -T postgres psql -U rasuwa -d rasuwa_flood
```

Two things to do, not later:

1. **Test a restore into a scratch database before you need one.** A backup nobody has
   restored is not a backup.
2. **Copy `backups/` off this machine.** A dump sitting on the same disk as the
   database does not survive the failure it exists for.

**Also back up the uploads.** The database stores the _records_; the scanned Cabinet
decisions, statements and daily reports are files. In Docker they are in the `uploads`
volume:

```bash
docker run --rm -v rasuwa-flood_uploads:/data -v "$PWD/backups:/out" \
  alpine tar czf /out/uploads_$(date +%F).tar.gz -C /data .
```

---

## 10. Monitoring and logs

```bash
docker compose ps                    # what is running
docker compose logs -f web           # application log
docker compose logs -f postgres
docker compose logs --tail=50 backup # did last night's dump run
```

Point your monitoring at `GET /rasuwa-flood/api/health`. It returns `200` with
`{"status":"ok","database":"ok"}` and `503` if the database is unreachable. The
container also has a Docker healthcheck on the same endpoint.

---

## 11. Updating and rolling back

```bash
cd /opt/rasuwa-flood
docker compose down
tar xzf mof-rasuwa-flood-portal-<new>.tar.gz --strip-components=1
docker compose up -d --build
docker compose exec web pnpm db:deploy      # applies any new migrations
node scripts/acceptance.mjs https://mof.gov.np/rasuwa-flood
```

Database changes ship as Prisma migrations in `prisma/migrations/`. `db:deploy` applies
only what has not been applied and never destroys data. **`db:seed` is for the first
install only** — running it again resets the contributions, foreign assistance,
decisions and contacts tables to the shipped figures and would discard anything entered
since. It does not touch accounts or the audit log, but do not run it on a live portal.

**Rolling back:** keep the previous directory. Restore it, `docker compose up -d
--build`, and if the newer version applied a migration, restore that night's dump.

---

## 12. Security

Built in:

- Only `published` records reach a public page, and publishing takes two roles.
- Every change is recorded in an audit log with the record before and after, the
  account and the IP.
- Passwords are argon2-hashed; sign-in is rate-limited to five attempts per account per
  fifteen minutes; sessions expire after eight hours.
- The contact form has a honeypot and is limited to five submissions per IP per hour.
- `/admin` is served with `X-Robots-Tag: noindex, nofollow` and is never cached.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  and `X-Frame-Options: SAMEORIGIN` are set on every response.

Your side:

- Serve the whole site over HTTPS and redirect plain HTTP.
- Do not expose PostgreSQL or MinIO outside the host. The compose file keeps them on an
  internal network; do not add port mappings.
- Restrict `/rasuwa-flood/admin` to the ministry network if that is practical.
- Keep `.env` at mode `600`, owned by the service user, and out of version control.

---

## 13. Open data

Read-only, published records only, CORS open, cached for a minute:

```
/rasuwa-flood/api/v1                 index of the endpoints
/rasuwa-flood/api/v1/summary         headline figures with every cut-off time
/rasuwa-flood/api/v1/contributions   ?type= &mode= &sector= &from= &to= &q= &page= &format=csv
/rasuwa-flood/api/v1/channels        ?network=NCHL|FONEPAY &period=cumulative|daily
/rasuwa-flood/api/v1/fund-status
/rasuwa-flood/api/v1/foreign
/rasuwa-flood/api/v1/rescue/latest
/rasuwa-flood/api/v1/rescue/reports
/rasuwa-flood/api/v1/decisions
/rasuwa-flood/api/v1/contacts
```

These are public by design — they are how journalists and researchers verify the
figures without scraping the pages. Please do not block them at the edge.

---

## 14. Still to be supplied by the ministry

The portal runs and is correct without these, but they should be in place before it is
publicised:

| What                                                         | Where it goes                                                         | Until then                                                                                       |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| The official high-resolution Emblem of Nepal                 | `public/img/emblem.png`, then `pnpm icons` to regenerate the favicons | a lower-resolution emblem is in place                                                            |
| The official payment QR, if one exists with its own payload  | `public/img/donate-qr.svg`                                            | a QR encoding `https://donate.gov.np/` and nothing else, generated by `node scripts/make-qr.mjs` |
| The scan of the 2083/05/22 5:00 PM fund status statement     | upload through `/admin` against that record                           | the figures are published; the record has no attached original                                   |
| The ministry's `graphics/` set and pre-rendered share images | `public/img/`                                                         | share cards are generated per page at `/rasuwa-flood/og/<page>?lang=ne`                          |

The emblem is only ever resampled to the size it is displayed. It is never recoloured,
restyled or cropped, and it should stay that way.

---

## 15. What was and was not tested before handover

Tested on the machine this was built on:

- 58 unit tests (number and date formatting, the Bikram Sambat calendar, the sector
  rules, both importers against the ministry's own spreadsheet, the publishing workflow)
- 50 browser tests across both languages at desktop and phone sizes
- The acceptance checks in section 7, all passing
- A production build, and the exact first-run sequence in section 3 — `migrate deploy`
  then `db:seed` — against a completely empty database, reproducing every published
  figure
- The build with no database reachable at all, which is what happens inside the image

**Not tested here, because this machine has no Docker installed:** `docker compose up
--build` itself. The Dockerfile and compose file are written and reviewed but have not
been executed. The GitHub Actions workflow in `.github/workflows/ci.yml` builds the
image on every push, so the first run of that workflow will confirm it. **Please build
on a staging host before production**, and if the image build fails, section 8's
Docker-free path is a complete alternative.

Performance was measured at Lighthouse 90 (mobile, median of five) earlier in the
build; later readings on the same machine fell to the mid-seventies purely because the
host was busy. Measure it on the real server with `node scripts/lighthouse.mjs` — that
number is the one that matters.

---

## 16. If something is wrong

| Symptom                               | Cause and fix                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/api/health` returns 503             | PostgreSQL is down or unreachable. `docker compose ps`, `docker compose logs postgres`                                        |
| Sign-in fails, or redirects in a loop | `AUTH_SECRET` is unset, or `X-Forwarded-Proto` is missing from the proxy                                                      |
| Uploads return 404 after a redeploy   | `UPLOAD_DIR` is not on a persistent volume; the files were in the container                                                   |
| The PDF download returns 503          | `PDF_CHROMIUM_PATH` is unset or wrong. Meanwhile the page prints correctly from a browser — it carries an A4 print stylesheet |
| Officers cannot upload a scan         | `client_max_body_size` is too small in the ministry's nginx                                                                   |
| The rescued-persons panel is blank    | NDRRMA is refusing to be framed. That is theirs, not ours; the fallback and the link are there for it                         |
| Devanagari shows as boxes or `?`      | The database was created without UTF-8. Recreate it with `--encoding=UTF8` and restore from a dump                            |
| Figures look stale                    | Have a publisher press **पुनः गणना · regenerate totals** on the admin dashboard                                               |

---

## 17. Who to contact

- **The portal and its figures:** Fund Section, Ministry of Finance — see the contacts
  published at `/rasuwa-flood/ne/contact`
- **The ministry's IT contact:** Niraj Bhusal, 9851175115
- **Ministry switchboard:** +977-1-4200537 · +977-1-4211720
