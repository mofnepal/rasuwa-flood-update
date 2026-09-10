#!/usr/bin/env bash
# Builds the handover archive for DoIT / NITC.
#   ./scripts/package.sh
# Produces dist/mof-rasuwa-flood-portal-<date>.tar.gz and .zip, plus SHA-256 sums.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="mof-rasuwa-flood-portal"
STAMP="$(date +%Y-%m-%d)"
STAGE="$(mktemp -d)/${NAME}"
OUT="${ROOT}/dist"

mkdir -p "$STAGE" "$OUT"

# Everything needed to build, deploy, seed and verify — and nothing that is
# rebuilt from it (node_modules, .next), specific to this machine (.env, .git),
# or a duplicate of a file already in reference/. The originals dropped at the
# repository root stay in the repository; they are working files, not part of
# what DoIT deploys.
rsync -a \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.next/' \
  --exclude 'out/' \
  --exclude '.pgdata/' \
  --exclude 'dist/' \
  --exclude 'test-results/' \
  --exclude 'playwright-report/' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'tsconfig.tsbuildinfo' \
  --exclude 'MoF-Rasuwa-Bhotekoshi-Flood-Update_claude-code-starter.zip' \
  --exclude 'prototype/reference/' \
  --exclude 'SitRep_*.pdf' \
  --exclude 'WhatsApp Image*' \
  --exclude 'HRiXEiYbkAAEQ9e.jpeg' \
  --exclude 'bhadra 19.xlsx' \
  --exclude 'new new.pdf' \
  --exclude 'अनूसूची.pdf' \
  "$ROOT/" "$STAGE/"

# .env must be created from the template on the target host, never shipped.
test ! -f "$STAGE/.env" || { echo "refusing to package a .env" >&2; exit 1; }

cd "$(dirname "$STAGE")"
tar czf "${OUT}/${NAME}-${STAMP}.tar.gz" "${NAME}"
zip -qr  "${OUT}/${NAME}-${STAMP}.zip"    "${NAME}"

cd "$OUT"
shasum -a 256 "${NAME}-${STAMP}.tar.gz" "${NAME}-${STAMP}.zip" > "${NAME}-${STAMP}.sha256"

echo "packaged:"
ls -lh "${NAME}-${STAMP}".* | awk '{print "  " $9 "  " $5}'
echo
cat "${NAME}-${STAMP}.sha256"
