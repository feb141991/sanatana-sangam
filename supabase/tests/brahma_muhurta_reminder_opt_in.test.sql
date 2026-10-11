BEGIN;
SELECT plan(4);

SELECT has_column('public', 'profiles', 'wants_brahma_muhurta_reminders', 'profiles has the Brahma Muhurta opt-in');
SELECT col_not_null('public', 'profiles', 'wants_brahma_muhurta_reminders', 'Brahma Muhurta opt-in is never null');
SELECT col_default_is('public', 'profiles', 'wants_brahma_muhurta_reminders', 'false', 'Brahma Muhurta push is off unless the user opts in');

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009501', '{"username": "test_user_9501"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, full_name, username, timezone) VALUES
  ('00000000-0000-0000-0000-000000009501', 'User 9501', 'test_user_9501', 'Europe/London')
ON CONFLICT (id) DO UPDATE SET full_name = excluded.full_name;

SELECT is(
  (SELECT wants_brahma_muhurta_reminders FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000009501'),
  false,
  'a new profile is not opted in to the pre-dawn push'
);

SELECT * FROM finish();
ROLLBACK;
