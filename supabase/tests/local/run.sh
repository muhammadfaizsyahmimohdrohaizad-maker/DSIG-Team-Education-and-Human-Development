#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres 16 cluster and runs the SQL tests, without Docker,
# the Supabase CLI or pgTAP. Usage, from the repo root:
#
#   supabase/tests/local/run.sh           # migrations + supabase/tests/*.test.sql + seed check
#   supabase/tests/local/run.sh --keep    # leave the cluster running and print how to connect
#
# Needs: initdb, pg_ctl, postgres (PGBIN, default /usr/lib/postgresql/16/bin) and psql on PATH.
# As root, the server runs as the "postgres" OS user (initdb refuses root).
# Two databases are made: "rls" (migrations + tests) and "demo" (migrations + seed_reference.sql + seed.sql + seed_check.sql).
set -euo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
KEEP=${1:-}

TMP=$(mktemp -d "${TMPDIR:-/tmp}/careerprep-pg.XXXXXX")
chmod 755 "$TMP"
PORT=${PGPORT_TEST:-$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])' 2>/dev/null || echo 55432)}

RUNAS=()
if [ "$(id -u)" = 0 ]; then
  chown postgres "$TMP"
  RUNAS=(runuser -u postgres --)
fi

cleanup() {
  if [ "$KEEP" != "--keep" ]; then
    "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -m fast stop >/dev/null 2>&1 || true
    rm -rf "$TMP"
  fi
}
trap cleanup EXIT

"${RUNAS[@]}" "$PGBIN/initdb" -D "$TMP/data" -U postgres -A trust -E UTF8 --no-locale >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -l "$TMP/server.log" -w \
  -o "-p $PORT -k $TMP -c listen_addresses='' -c timezone=UTC -c fsync=off" start >/dev/null

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$TMP" -p "$PORT" -U postgres)

setup_db() { # name, with_tap
  "${PSQL[@]}" -d postgres -c "create database $1" >/dev/null
  # The roles are cluster-wide, so only the first database creates them.
  if [ "$1" = rls ]; then
    "${PSQL[@]}" -d "$1" -f "$HERE/supabase_standin.sql" >/dev/null
  else
    sed '/^create role /d' "$HERE/supabase_standin.sql" | "${PSQL[@]}" -d "$1" >/dev/null
  fi
  "${PSQL[@]}" -d "$1" -f "$HERE/pgtap_shim.sql" >/dev/null
  for m in "$ROOT"/supabase/migrations/*.sql; do
    echo "  apply $(basename "$m") -> $1"
    "${PSQL[@]}" -d "$1" -1 -f "$m" >/dev/null
  done
}

echo "Postgres $("$PGBIN/postgres" --version | awk '{print $3}') on socket $TMP port $PORT"
setup_db rls
setup_db demo

export PGOPTIONS="-c search_path=public,extensions,tap"
status=0
for t in "$ROOT"/supabase/tests/*.test.sql; do
  echo "== $(basename "$t")"
  if ! "${PSQL[@]}" -d rls -t -A -f "$t" | grep -v '^$'; then status=1; fi
done

echo "== seed_reference.sql + seed.sql"
"${PSQL[@]}" -d demo -1 -f "$ROOT/supabase/seed_reference.sql" >/dev/null
"${PSQL[@]}" -d demo -1 -f "$ROOT/supabase/seed.sql" >/dev/null
echo "== seed_reference.sql again (idempotent, with student answers present)"
"${PSQL[@]}" -d demo -1 -f "$ROOT/supabase/seed_reference.sql" >/dev/null
echo "== seed_check.sql"
if ! "${PSQL[@]}" -d demo -t -A -f "$HERE/seed_check.sql" | grep -v '^$'; then status=1; fi

if [ "$KEEP" = "--keep" ]; then
  echo "Cluster left running: psql -h $TMP -p $PORT -U postgres -d demo   (stop: pg_ctl -D $TMP/data stop)"
fi
if [ $status -ne 0 ]; then echo "FAILED"; exit 1; fi
echo "ALL PASSED"
