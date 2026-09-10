# GitHub — the code, the live site, and how an update goes live

## The short version

**GitHub holds the code and the data, and publishes the public portal.** Every push
to `main` rebuilds the site from the files in `seed/`, checks that every figure ties
to its source document, tests the result in a browser, and publishes it.

```
edit seed/  ─►  commit  ─►  push to main
                                 │
                                 ▼
          GitHub Actions — "Live site"
            fresh database  ◄── migrations + seed/
            pnpm verify         every figure ties to its source document
            pnpm build:static   every page, share card and open-data file
            pnpm e2e:static     every page, both languages, desktop and phone
                                 │   any failure: nothing is published
                                 ▼
          https://mofnepal.github.io/rasuwa-flood-update/   ◄── linked from mof.gov.np
```

A push is normally live within a few minutes. If a step fails, the version already
live stays up.

---

## 1. Two editions, one codebase

The same pages, design and figures, built two ways:

|                           | Static edition — GitHub Pages                       | Server edition — the ministry's server    |
| ------------------------- | --------------------------------------------------- | ----------------------------------------- |
| Address                   | `mofnepal.github.io/rasuwa-flood-update`            | `mof.gov.np/rasuwa-flood`                 |
| Where the figures come in | files in `seed/`, committed and pushed              | the admin area: entry → verify → publish  |
| When a change appears     | a few minutes after the push                        | within a minute of publishing             |
| Admin, sign-in, audit log | —                                                   | yes                                       |
| Search                    | in the browser, over the published index            | on the server                             |
| Open data                 | complete files under `/open-data/`                  | `/api/v1` with filters, and `/open-data/` |
| Message form              | the ministry's email address is shown               | yes                                       |
| PDF                       | the browser's print, with the A4 stylesheet         | rendered PDF                              |
| Built by                  | `pnpm build:static` (`NEXT_PUBLIC_STATIC_EXPORT=1`) | `pnpm build`, or the Docker image         |

Nothing about the figures differs: both editions compute every total with the same
code from the same published records.

---

## 2. One-time setup

1. **The repository.** `mofnepal/rasuwa-flood-update`, created empty — no README,
   licence or `.gitignore`; those are already here.
2. **Visibility.** On a free GitHub account, Pages publishes only from a **public**
   repository. A private repository needs GitHub Pro (for a personal account) or
   GitHub Team (for an organisation). Nothing tracked is secret: `.env` is not
   committed, and no password is — the seed refuses to run without
   `SEED_PASSWORD`, and every workflow generates a new one for its own run.
3. **Pages.** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. **Push.** The first run of **Actions → Live site** publishes the site.

**Linking from mof.gov.np.** Link to `https://mofnepal.github.io/rasuwa-flood-update/`.
The root opens the Nepali edition; `/en/` opens English.

**The ministry's own address (recommended).** Readers cannot tell a `github.io`
address from an imitation. In Settings → Pages → Custom domain, enter an address such
as `rasuwaflood.mof.gov.np`, have DoIT add a `CNAME` record pointing it to
`mofnepal.github.io`, then tick **Enforce HTTPS**. The workflow reads the address
from GitHub on every run, so nothing in the code changes.

---

## 3. Publishing an update

The step-by-step is in [RUNBOOK.md](RUNBOOK.md), section 1b. In short: add the new
document's figures to the file in `seed/` it belongs to, record the total it prints in
`seed/published_totals.json`, commit, push, and watch **Actions → Live site** turn
green.

**When it fails.** Open the red step.

- **`pnpm verify` reports DIFFERS** — the figures entered do not add up to the total
  the document prints, or the printed total was not recorded. Correct the data and
  push again.
- **`pnpm e2e:static` fails** — a page did not render as expected. The report is
  attached to the run as `playwright-report-static`.

**Rolling back.** `git revert <commit>` and push; the previous figures are
republished. Or open an earlier green run of **Live site** and choose **Re-run all
jobs**.

---

## 4. What runs

| Workflow        | When                                | Does                                                                                                    |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Live site`     | every push to `main`                | seeds a fresh database, verifies every figure, builds the static edition, tests it, publishes to Pages  |
| `CI`            | every push and pull request         | format, lint, typecheck, unit tests; builds the server edition and runs its browser tests; Docker build |
| `Publish image` | every push to `main`, and tags `v*` | publishes the server edition as `ghcr.io/mofnepal/rasuwa-flood-update`                                  |

No secrets are needed for any of them.

**Branch protection** (recommended once more than one person pushes): Settings →
Branches → `main` — require the `CI` checks to pass, and no force-pushes.

---

## 5. The server edition, from the image

When DoIT runs the full portal, it pulls the published image rather than building on
the server. In `docker-compose.yml`, on the `web` service, replace the `build:` block
with:

```yaml
image: ghcr.io/mofnepal/rasuwa-flood-update:sha-<commit>
```

```bash
docker login ghcr.io          # only if the package is private
docker compose pull web
docker compose up -d
docker compose exec web pnpm db:deploy
```

Pin a commit or a version tag in production, never `:latest`, so a push never changes
the ministry's server until DoIT chooses to. Everything else — nginx, backups,
environment variables — is in [DEPLOYMENT.md](DEPLOYMENT.md).

Once the server edition is live, its figures are entered through its admin area
([RUNBOOK.md](RUNBOOK.md), section 1), and the link from mof.gov.np should point to it.
