#!/usr/bin/env bash
# Isolated PostgreSQL; no production credentials. Run actual migration + TS consumers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TASK_TMP="$(mktemp -d "${TMPDIR:-/tmp/}shoonaya-pitru-shadow.XXXXXX")"
export PGHOST="$TASK_TMP" PGPORT=55439 PGUSER="$(id -un)"
cleanup() { pg_ctl -D "$TASK_TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TASK_TMP"; }
trap cleanup EXIT INT TERM
initdb -D "$TASK_TMP/data" --auth-local=trust --auth-host=trust >/dev/null
pg_ctl -D "$TASK_TMP/data" -o "-p $PGPORT -k $TASK_TMP" -w start >/dev/null
createdb shoonaya_pitru_shadow
psql -d shoonaya_pitru_shadow -X -v ON_ERROR_STOP=1 -q -f "$ROOT/scripts/shadow/shadow-schema.sql"
psql -d shoonaya_pitru_shadow -X -v ON_ERROR_STOP=1 -q -c 'create unique index observance_definitions_slug_key on observance_definitions(slug); alter table observance_occurrences add column series_instance_key text, add column batch_id uuid; alter table observance_occurrences drop constraint uq_observance_occurrences_instance; create unique index uq_observance_occurrences_instance on observance_occurrences(definition_id,year,calendar_profile,occurrence_date,variant_key,computed_latitude,computed_longitude,computed_timezone) nulls not distinct;'
cd "$ROOT"
SHADOW_DATABASE_URL="postgresql://$PGUSER@localhost:$PGPORT/shoonaya_pitru_shadow?host=$PGHOST" npx tsx scripts/shadow/run-pitru-publication-shadow.mts
