# syntax=docker/dockerfile:1

# ── dependencies ────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma
# A flat node_modules inside the image: pnpm's default layout keeps Prisma's
# generated client and CLI behind symlinks in .pnpm/, which the runtime stage
# below could not copy. The lockfile is the same either way.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
 && pnpm install --frozen-lockfile --config.node-linker=hoisted

# ── build ───────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The schema is needed at build time to generate the client; DATABASE_URL is not
# read during the build, so a placeholder is enough.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm exec prisma generate && pnpm exec next build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

# Chromium renders the "Download PDF" output through the portal's own print
# stylesheet; the fonts are needed for Devanagari to render correctly.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium fonts-noto-core fonts-noto-color-emoji ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PDF_CHROMIUM_PATH=/usr/bin/chromium \
    UPLOAD_DIR=/data/uploads

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p /data/uploads /backups \
 && chown -R nextjs:nodejs /data /backups

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Kept so an officer can run the seed and the importers inside the container.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/seed ./seed
COPY --from=builder --chown=nextjs:nodejs /app/reference ./reference
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000
VOLUME ["/data/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/rasuwa-flood/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
