revoke all on function public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text) from authenticated, service_role;
revoke all on function public.get_japa_context() from authenticated, service_role;
drop function if exists public.complete_japa_session(uuid, text, integer, integer, integer, text, text, text);
drop function if exists public.get_japa_context();
drop index if exists public.mala_sessions_user_completion_uidx;
alter table public.mala_sessions drop column if exists client_completion_id;
