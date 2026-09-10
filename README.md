# रसुवा–भोटेकोशी बाढी अपडेट · MoF Rasuwa–Bhotekoshi Flood Update

The **Rasuwa–Bhotekoshi Flood Relief Transparency Portal** of the Ministry of
Finance, Government of Nepal. It answers one question in public: _every rupee and
every dollar given for the Rasuwa flood — where did it come from, through which
channel, on what date, and what has the government decided?_

Live at `https://mof.gov.np/rasuwa-flood`.

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — for DoIT / NITC: server requirements, deploying,
  nginx, backups, updating, rollback. **Start here if you run the server.**
- **[GITHUB.md](GITHUB.md)** — the live site on GitHub Pages, how a pushed update is
  checked and published, and the server edition's image for DoIT.
- **[RUNBOOK.md](RUNBOOK.md)** — for Fund Section staff: the daily update, corrections,
  and how the total is built. **Start here if you publish the figures.**
- **[PLAN.md](PLAN.md)** — the architecture and the verified totals.
- **[CHANGELOG.md](CHANGELOG.md)** — what changed, and the data behind it.

## Running it

```bash
cp .env.example .env          # set every secret marked "change-me"
docker compose up -d --build
docker compose exec web pnpm db:deploy
docker compose exec web pnpm db:seed
```

Then `http://localhost:8080/rasuwa-flood/`.

### Developing without Docker

```bash
pnpm install
pnpm db:local                 # a real PostgreSQL on :55432, no Docker needed
pnpm db:push && pnpm db:seed  # in a second terminal
pnpm dev
```

|                                |                                                                            |
| ------------------------------ | -------------------------------------------------------------------------- |
| `pnpm test`                    | unit tests — formatting, the BS calendar, sectors, importers, the workflow |
| `pnpm e2e`                     | Playwright, every public page in both locales at desktop and phone         |
| `pnpm lint` · `pnpm typecheck` | ESLint and TypeScript                                                      |
| `pnpm build`                   | production build                                                           |

## What is in here

```
src/app/[locale]/       the six public sections, Nepali first
src/app/admin/          entry → verify → publish, imports, users, audit
src/app/api/v1/         open data, published records only
src/lib/totals.ts       the four-category accounting rule, in one place
src/lib/bs.ts           Bikram Sambat ↔ Gregorian
src/lib/format.ts       Devanagari digits, lakh/crore grouping, BS-first dates
prisma/                 schema and seed
seed/ · reference/      the ministry's own source documents
prototype/              the approved prototype this was built from
```

## The things that matter

- **Nothing is published without verification.** Public pages render only
  `status = published`, reached by draft → verified → published, each step by a
  role permitted to take it. Every change is audited.
- **No figure without a source and an as-of.** Sources have different cut-off
  times; any combined total prints each of them and says that consolidated
  figures are subject to reconciliation by the Fund Section.
- **Nepali first.** Both languages carry every string; `ne` is the default and
  sits in the URL. Nepali uses Devanagari digits and lakh/crore grouping; English
  uses Western digits with the same Indian grouping. Dates are BS first, AD
  second. Currency is `रु.` / `NPR`, never `Rs`.
- **The rescued-persons list is never copied.** The portal links to NDRRMA and
  embeds their page, with a fallback for when they refuse framing.
- **One disaster is one `slug`.** Every record is scoped to a `Disaster`, so the
  same portal serves the next one without a rebuild.

## Licence and attribution

Content is published by the Government of Nepal, Ministry of Finance. The open
data endpoints are free to use with attribution. Mukta is used under the SIL Open
Font License. The Emblem of Nepal is a state symbol and is never recoloured,
restyled or re-encoded — replace `public/img/emblem.png` with the ministry's
high-resolution original, keeping the aspect ratio.
