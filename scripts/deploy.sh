#!/usr/bin/env bash
set -euo pipefail

DRY=false
NO_RESTART=false
BACKUP_ONLY=false

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run|-n)
      DRY=true; shift;;
    --no-restart)
      NO_RESTART=true; shift;;
    --backup-only)
      BACKUP_ONLY=true; shift;;
    *)
      echo "Unknown arg: $1"; exit 1;;
  esac
done

run_cmd() {
  if [ "$DRY" = true ]; then
    echo "+ $*"
  else
    echo "+ $*"
    eval "$@"
  fi
}

echo "[deploy] Starting deploy script"

# 1) Build
run_cmd npm run build

if [ "$BACKUP_ONLY" = true ]; then
  echo "[deploy] Backup-only mode; skipping restart"
  exit 0
fi

# 2) Backup SQLite DB (if exists)
DB_PATH="./db/goshuin.sqlite3"
BACKUP_DIR="./backups"
if [ -f "$DB_PATH" ]; then
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  run_cmd mkdir -p "$BACKUP_DIR"
  run_cmd cp "$DB_PATH" "$BACKUP_DIR/goshuin.sqlite3.$TIMESTAMP"
  echo "[deploy] Backed up $DB_PATH -> $BACKUP_DIR/goshuin.sqlite3.$TIMESTAMP"
else
  echo "[deploy] Warning: DB file not found at $DB_PATH; skipping backup"
fi

# 3) Restart via pm2 (if available)
PM2_LOCAL="./node_modules/.bin/pm2"
if [ -x "$PM2_LOCAL" ]; then
  PM2_CMD="$PM2_LOCAL"
else
  PM2_CMD=$(command -v pm2 || true)
fi

if [ -z "$PM2_CMD" ]; then
  echo "[deploy] pm2 not found (neither global nor project-local). Skipping pm2 restart/save."
else
  if [ "$NO_RESTART" = true ]; then
    echo "[deploy] NO_RESTART set; skipping pm2 restart"
  else
    echo "[deploy] Restarting app via pm2"
    if $PM2_CMD restart ecosystem.config.js --env production 2>/dev/null; then
      echo "[deploy] pm2 restart succeeded"
    else
      echo "[deploy] pm2 restart failed or app not running; attempting start"
      run_cmd "$PM2_CMD" start ecosystem.config.js --env production
    fi
  fi
  # Save process list so startup is preserved
  run_cmd "$PM2_CMD" save || true
fi

echo "[deploy] Done"
