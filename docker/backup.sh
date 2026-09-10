#!/bin/sh
# Nightly pg_dump at 02:15 Nepal Time, thirty days kept.
set -eu

USER="${POSTGRES_USER:-rasuwa}"
DB="${POSTGRES_DB:-rasuwa_flood}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

while true; do
  now=$(TZ=Asia/Kathmandu date +%H%M)
  if [ "$now" = "0215" ]; then
    stamp=$(TZ=Asia/Kathmandu date +%Y-%m-%d_%H%M)
    file="/backups/rasuwa-flood_${stamp}.sql.gz"
    echo "[backup] writing ${file}"
    if pg_dump -h postgres -U "$USER" -d "$DB" --no-owner --no-privileges | gzip > "$file"; then
      echo "[backup] done: $(du -h "$file" | cut -f1)"
      find /backups -name 'rasuwa-flood_*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
    else
      echo "[backup] FAILED" >&2
      rm -f "$file"
    fi
    sleep 3600
  fi
  sleep 45
done
