-- Reverts push_token_events_event_type_check to its original 3-value form.
-- Only safe if no 'registration_failed' rows have been inserted since the
-- forward migration ran; check first with:
--   select count(*) from public.push_token_events where event_type = 'registration_failed';
alter table public.push_token_events
  drop constraint if exists push_token_events_event_type_check;
alter table public.push_token_events
  add constraint push_token_events_event_type_check
  check (event_type in ('registered', 'pruned_device_not_registered', 'pruned_other'));
