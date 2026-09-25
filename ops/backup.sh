#!/usr/bin/env bash
# Grove backup — the database (mongodump) + the uploads folder (photos, voice notes, covers, avatars).
# Scheduled weekly by cron as the site user. Keeps the newest $KEEP of each; logs to $BACKUP_DIR/backup.log.
#
#   ops/backup.sh                 run a backup now
#   BACKUP_DIR  where backups go          (default: ~/backups — outside the site folder, which deploys overwrite)
#   KEEP        how many backups to keep  (default: 4 → about a month of weekly backups)
#   HEALTHCHECK_URL  optional: pinged after a successful run (e.g. healthchecks.io), so a silent failure gets noticed
set -Eeuo pipefail
umask 077 # backups contain everyone's data: readable by this user only

SITE_DIR="${SITE_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP="${KEEP:-4}"
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"
PATH="$HOME/bin:$PATH" # mongodump lives in ~/bin (installed without root)
LOG="$BACKUP_DIR/backup.log"
CONFIG="$BACKUP_DIR/.mongodump.yml"

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG"; }
trap 'log "FAILED at line $LINENO"; rm -f "$CONFIG"; exit 1' ERR

# The database address comes from the app's own .env (never typed on the command line, where `ps` would show it).
URI="$({ grep -E '^MONGODB_URI=' "$SITE_DIR/server/.env" || true; } | head -1 | cut -d= -f2- | sed -e "s/^[\"']//" -e "s/[\"']\$//")"
if [ -z "$URI" ]; then log "FAILED: MONGODB_URI not found in $SITE_DIR/server/.env"; exit 1; fi
printf 'uri: "%s"\n' "$URI" > "$CONFIG"

# 1) Database → one compressed archive file
DB_FILE="$BACKUP_DIR/db/grove-$STAMP.archive.gz"
mongodump --config="$CONFIG" --archive="$DB_FILE" --gzip --quiet
rm -f "$CONFIG"

# 2) Uploads → a dated snapshot. Files unchanged since the last snapshot are hard links (no extra space).
SRC="$SITE_DIR/server/uploads"
mkdir -p "$SRC"
PREV="$(ls -1d "$BACKUP_DIR"/uploads/20* 2>/dev/null | sort | tail -1 || true)"
rsync -a --delete ${PREV:+--link-dest="$PREV"} "$SRC/" "$BACKUP_DIR/uploads/$STAMP/"

# 3) Keep the newest $KEEP of each (names start with the date, so name order = age order)
ls -1 "$BACKUP_DIR"/db/grove-*.archive.gz | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do rm -f "$old"; done
ls -1d "$BACKUP_DIR"/uploads/20* | sort -r | tail -n +$((KEEP + 1)) | while read -r old; do rm -rf "$old"; done

log "OK db=$(du -h "$DB_FILE" | cut -f1) uploads=$(du -sh "$BACKUP_DIR/uploads/$STAMP" | cut -f1) kept=$KEEP"
if [ -n "${HEALTHCHECK_URL:-}" ]; then curl -fsS -m 10 "$HEALTHCHECK_URL" > /dev/null || log "warning: health-check ping failed"; fi
