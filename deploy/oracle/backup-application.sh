#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/var/www/apps/azon/current
DB_FILE=/var/www/apps/azon/shared/database/database.sqlite
BACKUP_DIR=/var/backups/azon
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

install -d -m 0700 "$BACKUP_DIR"
TEMP_DIR="$(mktemp -d "$BACKUP_DIR/.tmp-XXXXXX")"
trap 'rm -rf -- "$TEMP_DIR"' EXIT

sqlite3 "$DB_FILE" ".backup '$TEMP_DIR/database.sqlite'"
tar --create --gzip --file="$TEMP_DIR/uploads.tar.gz" \
    --directory="$APP_DIR/storage/app" public
sha256sum "$TEMP_DIR/database.sqlite" "$TEMP_DIR/uploads.tar.gz" \
    > "$TEMP_DIR/SHA256SUMS"

mv "$TEMP_DIR/database.sqlite" "$BACKUP_DIR/database-$STAMP.sqlite"
mv "$TEMP_DIR/uploads.tar.gz" "$BACKUP_DIR/uploads-$STAMP.tar.gz"
mv "$TEMP_DIR/SHA256SUMS" "$BACKUP_DIR/SHA256SUMS-$STAMP"

find "$BACKUP_DIR" -maxdepth 1 -type f -mtime +7 -delete

echo "Backup completed at $STAMP."
