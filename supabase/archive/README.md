# Migration Archive

These files represent the original v1–v85 migration history applied
to production before the Supabase CLI timestamped migration system
was adopted.

**Do not run these files directly.** They are preserved for historical
reference only. The current production schema is the result of applying
all files in this archive sequentially, followed by the migrations in
../migrations/.

To reconstruct the full schema on a fresh Supabase project:
1. Export the current production schema from the Supabase dashboard
   (Database → Schema → Export)
2. Save it as supabase/migrations/00000000000000_baseline.sql
3. Run `supabase db push` on the new project
