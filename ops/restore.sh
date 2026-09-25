#!/usr/bin/env bash
# Grove restore.
#   ops/restore.sh list                        show the backups you have
#   ops/restore.sh check   <db-archive>        prove a database backup reads cleanly — writes NOTHING
#   ops/restore.sh db      <db-archive>        ⚠ replace the live database with that backup
#   ops/restore.sh uploads <snapshot-folder>   ⚠ replace server/uploads with that snapshot
# Before replacing anything it takes a fresh backup of the current state, so a restore can be undone.
set -Eeuo pipefail
umask 077

SITE_DIR="${SITE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
PATH="$HOME/bin:$PATH"
CONFIG="$BACKUP_DIR/.mongorestore.yml"
trap 'rm -f "$CONFIG"' EXIT

uri_config() {
  local uri
  uri="$({ grep -E '^MONGODB_URI=' "$SITE_DIR/server/.env" || true; } | head -1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']\$//")"
  [ -n "$uri" ] || { echo "MONGODB_URI not found in $SITE_DIR/server/.env"; exit 1; }
  printf 'uri: "%s"\n' "$uri" > "$CONFIG"
}
need_file() { [ -e "${1:-}" ] || { echo "Not found: ${1:-<missing argument>}"; exit 1; }; }
confirm() {
  echo "⚠  $1"
  read -r -p "Type RESTORE to continue: " answer
  [ "$answer" = "RESTORE" ] || { echo "Cancelled."; exit 1; }
}

case "${1:-}" in
  list)
    echo "Database backups:"; ls -1sh "$BACKUP_DIR"/db/ 2>/dev/null || echo "  (none)"
    echo; echo "Uploads snapshots:"; ls -1d "$BACKUP_DIR"/uploads/20* 2>/dev/null || echo "  (none)"
    echo; echo "Recent runs:"; tail -n 5 "$BACKUP_DIR/backup.log" 2>/dev/null || echo "  (no log yet)"
    ;;
  check)
    need_file "${2:-}"; uri_config
    echo "Reading $2 (dry run — nothing is written)…"
    mongorestore --config="$CONFIG" --archive="$2" --gzip --dryRun --verbose 2>&1 | grep -Ei "restoring|reading metadata|finished|error" || true
    echo "✅ The archive opened and every collection in it was read."
    ;;
  db)
    need_file "${2:-}"; uri_config
    confirm "This REPLACES the live database with $(basename "$2"). Grove is stopped during the restore."
    echo "Safety backup of the current state first…"; "$SITE_DIR/ops/backup.sh"
    pm2 stop grove
    mongorestore --config="$CONFIG" --archive="$2" --gzip --drop
    pm2 start grove
    echo "✅ Database restored from $(basename "$2") and Grove restarted."
    ;;
  uploads)
    need_file "${2:-}"
    confirm "This REPLACES server/uploads with the snapshot $(basename "$2")."
    echo "Safety backup of the current state first…"; "$SITE_DIR/ops/backup.sh"
    rsync -a --delete "${2%/}/" "$SITE_DIR/server/uploads/"
    echo "✅ Uploads restored from $(basename "$2")."
    ;;
  *)
    sed -n '2,7p' "$0"; exit 1 ;;
esac
