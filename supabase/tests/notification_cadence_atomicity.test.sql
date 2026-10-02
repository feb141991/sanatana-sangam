BEGIN;
SELECT plan(31);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000051'),
  ('00000000-0000-0000-0000-000000000052'),
  ('00000000-0000-0000-0000-000000000053'),
  ('00000000-0000-0000-0000-000000000054')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, timezone)
VALUES
  ('00000000-0000-0000-0000-000000000051', 'UTC'),
  ('00000000-0000-0000-0000-000000000052', 'UTC'),
  ('00000000-0000-0000-0000-000000000053', 'UTC'),
  ('00000000-0000-0000-0000-000000000054', 'UTC')
ON CONFLICT (id) DO NOTHING;

SELECT ok(
  public.try_acquire_notification_resolver_lock('00000000-0000-0000-0000-000000000001', 300),
  'first resolver owns the lease'
);
SELECT ok(
  NOT public.try_acquire_notification_resolver_lock('00000000-0000-0000-0000-000000000002', 300),
  'a second resolver cannot take an active lease'
);
SELECT is(
  public.canonical_notification_budget_type('mood-evening', NULL),
  'mood',
  'legacy mood aliases share one budget type'
);
SELECT is(
  public.canonical_notification_budget_type('general', 'streak:2026-10-02'),
  'shloka',
  'generic bell rows use their semantic notification key'
);
SELECT ok(
  NOT public.notification_is_budget_exempt('mood_checkin', NULL),
  'routine engagement consumes the shared daily budget'
);
SELECT ok(
  public.notification_is_budget_exempt('japa', NULL),
  'explicit Japa requests stay outside the shared daily budget'
);
SELECT ok(
  public.notification_is_budget_exempt('sanskar_milestone', NULL),
  'family milestone reminders preserve their explicit user-scheduled delivery'
);
SELECT ok(
  public.notification_is_budget_exempt('aarti', NULL),
  'live Aarti reminders preserve their fixed ritual delivery window'
);
UPDATE public.profiles
SET seva_score = 100, spiritual_level = 'jigyasu'
WHERE id = '00000000-0000-0000-0000-000000000051';
CREATE TEMP TABLE seva_tier_result AS
SELECT * FROM public.update_seva_tier_and_queue_notification(
  '00000000-0000-0000-0000-000000000051',
  100,
  'jigyasu',
  'shishya',
  'Tier promotion',
  'Your practice is growing.',
  'seva-tier:shishya',
  (((now() AT TIME ZONE 'UTC')::DATE + 45) + TIME '10:00') AT TIME ZONE 'UTC',
  jsonb_build_object(
    'type', 'general', 'action_url', '/seva', 'timezone', 'UTC',
    'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 45)::TEXT
  )
);
SELECT is((SELECT profile_updated FROM seva_tier_result), true,
  'seva tier update succeeds only with the expected score and prior tier');
SELECT is((SELECT notification_queued FROM seva_tier_result), true,
  'seva tier celebration is queued atomically with the profile update');
SELECT is(
  (SELECT spiritual_level FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000051'),
  'shishya',
  'seva tier update persists the new profile level'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(jsonb_build_object(
        'user_id', '00000000-0000-0000-0000-000000000099',
        'notification_type', 'mood', 'title', 'test', 'body', 'test',
        'send_at', '2026-10-02T12:00:00Z', 'notification_key', 'mood:missing-date',
        'metadata', jsonb_build_object('local_date', 'not-a-date')
      )), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'budgeted candidate schedule rows require a valid local_date and notification_key',
  'budgeted rows without a valid local date fail closed'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(jsonb_build_object(
        'user_id', '00000000-0000-0000-0000-000000000099',
        'notification_type', 'mood', 'title', 'test', 'body', 'test',
        'send_at', '2026-10-02T12:00:00Z', 'notification_key', NULL,
        'metadata', jsonb_build_object('local_date', '2026-10-02')
      )), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'budgeted candidate schedule rows require a valid local_date and notification_key',
  'budgeted rows without a stable key fail closed'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','mood','title','t','body','b','send_at','2026-10-02T12:00:00Z','notification_key','mood:1:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','sattvic','title','t','body','b','send_at','2026-10-02T13:00:00Z','notification_key','sattvic:2:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','shloka','title','t','body','b','send_at','2026-10-02T14:00:00Z','notification_key','shloka:3:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','quiz','title','t','body','b','send_at','2026-10-02T15:00:00Z','notification_key','quiz:4:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','dharm_veer','title','t','body','b','send_at','2026-10-02T16:00:00Z','notification_key','dharm_veer:5:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','daily_digest','title','t','body','b','send_at','2026-10-02T17:00:00Z','notification_key','daily_digest:6:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02'))
      ), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch cannot reserve more than five budgeted notifications for one user/day'
);
SELECT is(
  (SELECT promoted_count FROM public.persist_notification_candidate_resolution_with_lock(
    '00000000-0000-0000-0000-000000000001', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb
  )),
  0,
  'the lease owner can call atomic persistence with an empty batch'
);
CREATE TEMP TABLE resolver_batch_result AS
SELECT * FROM public.persist_notification_candidate_resolution_internal(
  jsonb_build_array(
    jsonb_build_object(
      'user_id', '00000000-0000-0000-0000-000000000051',
      'notification_type', 'mood', 'title', 'First', 'body', 'First',
      'send_at', (((now() AT TIME ZONE 'UTC')::DATE + 32) + TIME '12:00') AT TIME ZONE 'UTC',
      'notification_key', 'resolver-batch:first:00000000-0000-0000-0000-000000000051',
      'metadata', jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 32)::TEXT)
    ),
    jsonb_build_object(
      'user_id', '00000000-0000-0000-0000-000000000051',
      'notification_type', 'sattvic', 'title', 'Second', 'body', 'Second',
      'send_at', (((now() AT TIME ZONE 'UTC')::DATE + 32) + TIME '13:00') AT TIME ZONE 'UTC',
      'notification_key', 'resolver-batch:second:00000000-0000-0000-0000-000000000051',
      'metadata', jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 32)::TEXT)
    )
  ),
  '[]'::JSONB,
  '[]'::JSONB
);
SELECT is((SELECT promoted_count FROM resolver_batch_result), 2,
  'candidate persistence inserts each row with a separately visible cadence reservation');
SELECT is(
  (SELECT to_char(send_at AT TIME ZONE 'UTC', 'HH24:MI')
   FROM public.notification_schedule
   WHERE notification_key = 'resolver-batch:second:00000000-0000-0000-0000-000000000051'),
  '15:00',
  'candidate batch spacing shifts a later same-day notification instead of failing the batch'
);
SELECT ok(
  public.release_notification_resolver_lock('00000000-0000-0000-0000-000000000001'),
  'only the current owner releases the resolver lease'
);
SELECT ok(
  to_regclass('public.idx_notification_schedule_notification_key') IS NULL,
  'semantic queue keys are no longer globally unique across recipients'
);
SELECT lives_ok(
  $$
    DO $test$
    DECLARE v_day DATE := (now() AT TIME ZONE 'UTC')::DATE + 30;
    BEGIN
      INSERT INTO public.notification_schedule (
        user_id, title, body, send_at, notification_type, notification_key, metadata
      ) VALUES (
        '00000000-0000-0000-0000-000000000051', 'First', 'First',
        (v_day + TIME '12:00') AT TIME ZONE 'UTC',
        'daily_digest', 'spacing:first:00000000-0000-0000-0000-000000000051',
        jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)
      );
      INSERT INTO public.notification_schedule (
        user_id, title, body, send_at, notification_type, notification_key, metadata
      ) VALUES (
        '00000000-0000-0000-0000-000000000051', 'Second', 'Second',
        (v_day + TIME '13:00') AT TIME ZONE 'UTC',
        'weekly_summary', 'spacing:second:00000000-0000-0000-0000-000000000051',
        jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)
      );
    END;
    $test$
  $$,
  'separate direct queue statements for the same day are admitted through the cadence guard'
);
SELECT is(
  (
    SELECT extract(epoch FROM (second.send_at - first.send_at))::INTEGER / 60
    FROM public.notification_schedule AS first
    JOIN public.notification_schedule AS second
      ON second.user_id = first.user_id
     AND second.notification_key = 'spacing:second:00000000-0000-0000-0000-000000000051'
    WHERE first.user_id = '00000000-0000-0000-0000-000000000051'
      AND first.notification_key = 'spacing:first:00000000-0000-0000-0000-000000000051'
  ),
  180,
  'direct queue writes are spaced at least three hours apart'
);
SELECT is(
  (
    SELECT metadata ->> 'cadence_delay_minutes'
    FROM public.notification_schedule
    WHERE user_id = '00000000-0000-0000-0000-000000000051'
      AND notification_key = 'spacing:second:00000000-0000-0000-0000-000000000051'
  ),
  '120',
  'the queue stores how long cadence shifted the requested delivery'
);
SELECT lives_ok(
  $$
    INSERT INTO public.notification_schedule (
      user_id, title, body, send_at, notification_type, notification_key, metadata
    ) VALUES
      (
        '00000000-0000-0000-0000-000000000052', 'Shared', 'Shared',
        (((now() AT TIME ZONE 'UTC')::DATE + 30) + TIME '12:00') AT TIME ZONE 'UTC',
        'daily_digest', 'shared-event:2026-11-01',
        jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT)
      ),
      (
        '00000000-0000-0000-0000-000000000053', 'Shared', 'Shared',
        (((now() AT TIME ZONE 'UTC')::DATE + 30) + TIME '12:00') AT TIME ZONE 'UTC',
        'daily_digest', 'shared-event:2026-11-01',
        jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT)
      )
  $$,
  'the same semantic key can be queued for distinct recipients'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_schedule WHERE notification_key = 'shared-event:2026-11-01'),
  2,
  'recipient-scoped uniqueness preserves both deliveries'
);
SELECT lives_ok(
  $$
    INSERT INTO public.notification_schedule (
      user_id, title, body, send_at, notification_type, notification_key, metadata
    ) VALUES (
      '00000000-0000-0000-0000-000000000052', 'Duplicate', 'Duplicate',
      (((now() AT TIME ZONE 'UTC')::DATE + 30) + TIME '12:15') AT TIME ZONE 'UTC',
      'daily_digest', 'shared-event:2026-11-01',
      jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT)
    )
  $$,
  'duplicate idempotency retries are ignored safely'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_schedule
   WHERE user_id = '00000000-0000-0000-0000-000000000052'
     AND notification_key = 'shared-event:2026-11-01'),
  1,
  'a repeated same-user key does not reserve another schedule row'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_cadence_events
   WHERE user_id = '00000000-0000-0000-0000-000000000052'
     AND notification_key = 'shared-event:2026-11-01'
     AND decision = 'duplicate'),
  1,
  'duplicate retries have a durable audit decision'
);
SELECT lives_ok(
  $$
    DO $test$
    DECLARE
      v_day DATE := (now() AT TIME ZONE 'UTC')::DATE + 30;
      v_slot INTEGER;
    BEGIN
      FOR v_slot IN 0..4 LOOP
        INSERT INTO public.notification_schedule (
          user_id, title, body, send_at, notification_type, notification_key, metadata
        ) VALUES (
          '00000000-0000-0000-0000-000000000054',
          'Routine ' || v_slot, 'Routine',
          (v_day + TIME '07:00' + v_slot * INTERVAL '3 hours') AT TIME ZONE 'UTC',
          'weekly_summary',
          'budget:' || v_slot || ':00000000-0000-0000-0000-000000000054',
          jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)
        );
      END LOOP;
    END;
    $test$
  $$,
  'five direct queued notifications fit the shared daily budget'
);
SELECT lives_ok(
  $$
    DO $test$
    DECLARE v_day DATE := (now() AT TIME ZONE 'UTC')::DATE + 30;
    BEGIN
      INSERT INTO public.notification_schedule (
        user_id, title, body, send_at, notification_type, notification_key, metadata
      ) VALUES (
        '00000000-0000-0000-0000-000000000054', 'Sixth', 'Sixth',
        (v_day + TIME '20:00') AT TIME ZONE 'UTC',
        'weekly_summary', 'budget:sixth:00000000-0000-0000-0000-000000000054',
        jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)
      );
    END;
    $test$
  $$,
  'a sixth direct queued notification is suppressed rather than delivered'
);
SELECT is(
  (
    SELECT count(*)::INTEGER FROM public.notification_schedule
    WHERE user_id = '00000000-0000-0000-0000-000000000054'
      AND metadata ->> 'local_date' = ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT
  ),
  5,
  'the direct queue never stores more than five budgeted items for one user/day'
);
SELECT is(
  (
    SELECT count(*)::INTEGER FROM public.notification_cadence_events
    WHERE user_id = '00000000-0000-0000-0000-000000000054'
      AND local_date = (now() AT TIME ZONE 'UTC')::DATE + 30
      AND decision = 'suppressed'
      AND reason = 'daily_budget_full'
  ),
  1,
  'quota suppression is durably recorded with its reason'
);
SELECT * FROM finish();
ROLLBACK;
