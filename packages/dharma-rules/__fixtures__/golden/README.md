# Golden fixtures moved to the database

Golden fixtures used to live here as one JSON file per case. As of 2026-08-12
they live in `public.golden_fixtures` (Supabase), so the admin governance GUI
(`/admin/calendar-governance`) can read and update approval state directly
instead of requiring a file edit + commit for every council decision.

- Load them in code: `loadGoldenFixtures()` in `harness/fixture-loader.ts`
  (now async, queries Supabase, requires `SUPABASE_SERVICE_ROLE_KEY`).
- Generate placeholder rows: `npx tsx scripts/generate-golden-placeholders.ts`
  (writes to the table, not this directory).
- One-time migration history: `scripts/backfill-golden-fixtures.mts` (repo root)
  is what moved the original 219 files here into the table.

The `golden.schema.json` validation, the `source` block requirement, and the
"never populate from model output" rule are unchanged — they now apply to a
row instead of a file.

Snapshot fixtures (`../snapshot/`) are unaffected and still file-based; they
are behaviour tripwires, not sourced correctness claims, so there is no
council-approval workflow that would benefit from moving them.
