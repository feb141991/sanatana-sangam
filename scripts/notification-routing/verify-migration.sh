#!/usr/bin/env bash
# Isolated local PostgreSQL verification. Never points at the linked Supabase DB.
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGHOST="${NOTIFICATION_TEST_PGHOST:-/tmp}"
export PGPORT="${NOTIFICATION_TEST_PGPORT:-5432}"
unset PGDATABASE PGSERVICE PGSERVICEFILE
case "$PGHOST" in /tmp|localhost|127.0.0.1) ;; *) echo 'Only local PostgreSQL is supported'; exit 1;; esac
routing_db="notification_routing_test_$$"
createdb "$routing_db"
trap 'dropdb --if-exists "$routing_db"' EXIT
psql -X -v ON_ERROR_STOP=1 -d "$routing_db" <<'SQL'
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid, type text, action_url text, notification_key text);
create table public.post_comments (id uuid primary key, post_id uuid);
SQL
psql -X -v ON_ERROR_STOP=1 -d "$routing_db" -f supabase/migrations/20261029151743_notification_item_destinations.sql
psql -X -v ON_ERROR_STOP=1 -d "$routing_db" -f scripts/notification-routing/migration-cases.sql
