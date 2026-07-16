-- Make the push-token trigger function's intended execution grant explicit.
-- Live Supabase already grants service_role broadly, but this keeps restored
-- environments self-contained and aligned with the other push-token RPCs.
grant execute on function public.update_push_token_timestamp() to service_role;
