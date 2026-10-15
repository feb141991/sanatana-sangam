BEGIN;
SELECT plan(2);

INSERT INTO auth.users (id, raw_user_meta_data) VALUES
  ('00000000-0000-0000-0000-000000009983', '{"username":"location_owner_9983"}'::jsonb),
  ('00000000-0000-0000-0000-000000009984', '{"username":"location_other_9984"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, username, timezone, latitude, longitude, city, country) VALUES
  ('00000000-0000-0000-0000-000000009983', 'Location Owner 9983', 'location_owner_9983', 'UTC', NULL, NULL, NULL, NULL),
  ('00000000-0000-0000-0000-000000009984', 'Location Other 9984', 'location_other_9984', 'UTC', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET latitude = NULL, longitude = NULL, city = NULL, country = NULL;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009983', true);
UPDATE public.profiles SET latitude = 51.7520, longitude = -0.3390, city = 'Oxford', country = 'United Kingdom'
WHERE id = auth.uid();
SELECT is(
  (SELECT concat_ws('|', round(latitude::numeric, 6)::text, round(longitude::numeric, 6)::text, city, country) FROM public.profiles WHERE id = auth.uid()),
  '51.752000|-0.339000|Oxford|United Kingdom',
  'confirmed location writes are readable back by the same account'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009984', true);
UPDATE public.profiles SET latitude = 0, longitude = 0, city = 'Tampered', country = 'XX'
WHERE id = '00000000-0000-0000-0000-000000009983';
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000009983', true);
SELECT is(
  (SELECT concat_ws('|', round(latitude::numeric, 6)::text, round(longitude::numeric, 6)::text, city, country) FROM public.profiles WHERE id = auth.uid()),
  '51.752000|-0.339000|Oxford|United Kingdom',
  'another account cannot replace a saved location'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
