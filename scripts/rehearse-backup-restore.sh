#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:=127.0.0.1}"
: "${PGPORT:=5432}"
: "${PGUSER:=gym_app}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${PGDATABASE:=gym_membership}"

RESTORE_DB="gridstone_restore_rehearsal"
BACKUP_DIR="$(mktemp -d)"
trap 'rm -rf "$BACKUP_DIR"' EXIT

pg_container() {
  docker run --rm --network host \
    -e PGPASSWORD="$PGPASSWORD" \
    -v "$BACKUP_DIR:/backup" \
    postgres:18-alpine "$@"
}

pg_container pg_dump \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" \
  --format custom --file /backup/gridstone.dump "$PGDATABASE"

pg_container psql \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname postgres \
  --set ON_ERROR_STOP=1 --command "DROP DATABASE IF EXISTS ${RESTORE_DB};" \
  --command "CREATE DATABASE ${RESTORE_DB};"

pg_container pg_restore \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" \
  --dbname "$RESTORE_DB" --exit-on-error /backup/gridstone.dump

source_members="$(pg_container psql --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align --command 'SELECT count(*) FROM members;')"
restored_members="$(pg_container psql --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$RESTORE_DB" --tuples-only --no-align --command 'SELECT count(*) FROM members;')"
source_migrations="$(pg_container psql --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" --tuples-only --no-align --command 'SELECT count(*) FROM alembic_version;')"
restored_migrations="$(pg_container psql --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$RESTORE_DB" --tuples-only --no-align --command 'SELECT count(*) FROM alembic_version;')"

if [[ "$source_members" != "$restored_members" || "$source_migrations" != "$restored_migrations" ]]; then
  echo "Backup/restore rehearsal failed reconciliation." >&2
  exit 1
fi

pg_container psql \
  --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname postgres \
  --set ON_ERROR_STOP=1 --command "DROP DATABASE ${RESTORE_DB};"

echo "Backup/restore rehearsal passed (${restored_members} members restored)."
