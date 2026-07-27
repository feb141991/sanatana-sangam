-- Same rationale as the earlier notify_mandali_comment lockdown: these are
-- meant to run only as triggers, not be directly callable PostgREST RPCs.
REVOKE EXECUTE ON FUNCTION public.log_user_activity(uuid, uuid, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_mandali_connection_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_block_cascade() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_content_report() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_post_reaction() FROM PUBLIC, anon, authenticated;
