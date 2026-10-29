-- Reverses 20261029160100_sanskara_tracker_core.sql.
-- DISCARDS ALL SANSKARA DATA: subjects, managers, records, private fields, grants, audit rows and request logs.
-- Before the tracker ships there is none. After launch, export first (sanskara_export_mine for each person) and tell
-- people; this cannot be undone. Run the later Sanskara rollbacks (M3 to M6) first if they have been applied: they
-- depend on these tables. It does not touch the old user_sanskaras / user_sanskars / sanskars tables (M6 retires those).
begin;

drop table if exists public.sanskara_request_log cascade;
drop table if exists public.sanskara_audit cascade;
drop table if exists public.sanskara_grants cascade;
drop table if exists public.sanskara_record_private cascade;
drop table if exists public.sanskara_records cascade;
drop table if exists public.sanskara_subject_managers cascade;
drop table if exists public.sanskara_subjects cascade;
drop table if exists public.sanskara_rites cascade;

drop function if exists public.sanskara_my_timeline();
drop function if exists public.sanskara_dependents();
drop function if exists public.sanskara_export_mine();
drop function if exists public.sanskara_create_dependent(uuid, text, date);
drop function if exists public.sanskara_create_record(uuid, uuid, text, text, date);
drop function if exists public.sanskara_update_record(uuid, uuid, text, date, integer);
drop function if exists public.sanskara_save_private(uuid, uuid, text, text, text, date, integer);
drop function if exists public.sanskara_set_completion(uuid, uuid, date, integer);
drop function if exists public.sanskara_delete_record(uuid, uuid);
drop function if exists public.sanskara_add_manager(uuid, uuid, uuid);
drop function if exists public.sanskara_remove_manager(uuid, uuid, uuid);
drop function if exists public.sanskara_delete_dependent(uuid, uuid);
drop function if exists public.sanskara_delete_mine(uuid);
drop function if exists public.sanskara_records_json_unchecked(uuid, boolean);
drop function if exists public.sanskara_on_record_completed(uuid);
drop function if exists public.sanskara_on_access_lost(uuid, uuid);
drop function if exists public.sanskara_finish_request(uuid, uuid, jsonb);
drop function if exists public.sanskara_claim_request(uuid, uuid, text);
drop function if exists public.sanskara_actor(boolean);
drop function if exists public.sanskara_can(text, uuid, uuid, uuid);
drop function if exists public.sanskara_enforce_private_rules();
drop function if exists public.sanskara_enforce_record_rules();
drop function if exists public.sanskara_delete_orphan_dependent();
drop function if exists public.sanskara_managers_dependents_only();

commit;
