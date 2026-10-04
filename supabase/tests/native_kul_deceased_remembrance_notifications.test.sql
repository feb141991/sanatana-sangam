BEGIN;
SELECT plan(17);

SELECT has_column('public', 'profiles', 'wants_family_remembrance_reminders', 'family remembrance has its own explicit consent field');
SELECT has_column('public', 'profiles', 'family_remembrance_time', 'family remembrance stores the recipient local time');
SELECT has_column('public', 'profiles', 'family_remembrance_opt_in_generation', 're-enabling consent creates a new candidate generation');
SELECT has_column('public', 'kul_family_members', 'remembrance_generation', 'alive-state changes invalidate old reminders');
SELECT has_column('public', 'kul_events', 'remembrance_generation', 'event edits receive a new reminder generation');
SELECT has_column('public', 'kuls', 'remembrance_generation', 'calendar edits receive a new reminder generation');
SELECT has_constraint('public', 'profiles', 'profiles_family_remembrance_time_check', 'reminder time is validated by the database');
SELECT has_trigger('public', 'kul_events', 'validate_kul_death_anniversary_event', 'death-anniversary events require a recurring date for a deceased KUL member');
SELECT has_trigger('public', 'notification_candidates', 'validate_family_remembrance_candidate', 'candidate insert checks its current source snapshot');
SELECT has_trigger('public', 'profiles', 'handle_family_remembrance_preference_change', 'preference changes invalidate queued reminders');
SELECT has_trigger('public', 'kul_events', 'handle_kul_remembrance_event_change', 'event edits and deletion cancel queued reminders');
SELECT has_trigger('public', 'kul_events', 'guard_kul_event_remembrance_generation', 'event generation changes are server-managed');
SELECT has_trigger('public', 'kul_family_members', 'handle_kul_remembrance_member_change', 'member status changes cancel queued reminders');
SELECT has_trigger('public', 'kuls', 'handle_kul_remembrance_calendar_change', 'family calendar changes cancel queued reminders');
SELECT has_trigger('public', 'kuls', 'guard_kul_calendar_remembrance_generation', 'calendar generation changes are server-managed');
SELECT ok(public.notification_is_budget_exempt('family_remembrance', 'family_remembrance:example'), 'family remembrance is exempt from the shared engagement budget');
SELECT has_trigger('public', 'kul_members', 'handle_kul_remembrance_membership_delete', 'leaving a KUL cancels that user's queued reminders');

SELECT * FROM finish();
ROLLBACK;
