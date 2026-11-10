BEGIN;
SELECT plan(89);

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
-- engagement-cadence-v3 batch limits: one other nudge, one learning slot and one Shloka per user/day.
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','mood','title','t','body','b','send_at','2026-10-02T12:00:00Z','notification_key','mood:1:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','sattvic','title','t','body','b','send_at','2026-10-02T16:00:00Z','notification_key','sattvic:2:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02'))
      ), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch cannot reserve two other nudges for one user/day'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','quiz','title','t','body','b','send_at','2026-10-02T10:00:00Z','notification_key','quiz:1:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','dharm_veer','title','t','body','b','send_at','2026-10-02T14:00:00Z','notification_key','dharm_veer:2:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02'))
      ), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch cannot reserve both quiz and dharm_veer: they share one learning slot'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','shloka','title','t','body','b','send_at','2026-10-02T08:00:00Z','notification_key','shloka:1:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02')),
        jsonb_build_object('user_id','00000000-0000-0000-0000-000000000099','notification_type','streak','title','t','body','b','send_at','2026-10-02T12:00:00Z','notification_key','streak:2:2026-10-02','metadata',jsonb_build_object('local_date','2026-10-02'))
      ), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch cannot reserve two Shloka reminders: the streak alias is the same class'
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
      'notification_type', 'shloka', 'title', 'First', 'body', 'First',
      'send_at', (((now() AT TIME ZONE 'UTC')::DATE + 32) + TIME '12:00') AT TIME ZONE 'UTC',
      'notification_key', 'resolver-batch:first:00000000-0000-0000-0000-000000000051',
      'metadata', jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 32)::TEXT)
    ),
    jsonb_build_object(
      'user_id', '00000000-0000-0000-0000-000000000051',
      'notification_type', 'quiz', 'title', 'Second', 'body', 'Second',
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
SELECT lives_ok(
  $$
    DO $test$
    DECLARE v_day DATE := (now() AT TIME ZONE 'UTC')::DATE + 31;
    BEGIN
      INSERT INTO public.notification_schedule (
        user_id, title, body, send_at, notification_type, notification_key, metadata
      ) VALUES
        ('00000000-0000-0000-0000-000000000053', '10am', '10am', (v_day + TIME '10:00') AT TIME ZONE 'UTC', 'japa', 'no-slot:10am', jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)),
        ('00000000-0000-0000-0000-000000000053', '1pm', '1pm', (v_day + TIME '13:00') AT TIME ZONE 'UTC', 'japa', 'no-slot:1pm', jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)),
        ('00000000-0000-0000-0000-000000000053', '4pm', '4pm', (v_day + TIME '16:00') AT TIME ZONE 'UTC', 'japa', 'no-slot:4pm', jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)),
        ('00000000-0000-0000-0000-000000000053', '7pm', '7pm', (v_day + TIME '19:00') AT TIME ZONE 'UTC', 'japa', 'no-slot:7pm', jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT));
    END;
    $test$
  $$,
  'seed exempt fixed-time reminders that leave no safe three-hour gap before the evening cutoff'
);
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution(
      jsonb_build_array(jsonb_build_object(
        'user_id', '00000000-0000-0000-0000-000000000053',
        'notification_type', 'shloka', 'title', 'Late reflection', 'body', 'A quiet verse.',
        'send_at', (((now() AT TIME ZONE 'UTC')::DATE + 31) + TIME '20:45') AT TIME ZONE 'UTC',
        'notification_key', 'candidate:no-safe-slot',
        'metadata', jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 31)::TEXT, 'candidate_id', '00000000-0000-0000-0000-000000000099')
      )), '[]'::jsonb, '[]'::jsonb
    )$$,
  'P0001',
  'notification_cadence_candidate_reservation_mismatch',
  'an accepted candidate whose spacing shift exceeds the same-day window fails closed'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_schedule
   WHERE user_id = '00000000-0000-0000-0000-000000000053'
     AND notification_key = 'candidate:no-safe-slot'),
  0,
  'failed reservation leaves no schedule row behind'
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
        'shloka', 'spacing:first:00000000-0000-0000-0000-000000000051',
        jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT)
      );
      INSERT INTO public.notification_schedule (
        user_id, title, body, send_at, notification_type, notification_key, metadata
      ) VALUES (
        '00000000-0000-0000-0000-000000000051', 'Second', 'Second',
        (v_day + TIME '13:00') AT TIME ZONE 'UTC',
        'quiz', 'spacing:second:00000000-0000-0000-0000-000000000051',
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
-- ─── engagement-cadence-v3: one other nudge a day, Shloka and the learning slot protected ───────────────────
INSERT INTO auth.users (id)
SELECT ('00000000-0000-0000-0000-0000000000' || n)::uuid FROM unnest(ARRAY['55','56','57','58','59','60','61','62','63','64','65','66']) AS n
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, timezone)
SELECT ('00000000-0000-0000-0000-0000000000' || n)::uuid, 'UTC' FROM unnest(ARRAY['55','56','57','58','59','60','61','62','63','64','65','66']) AS n
ON CONFLICT (id) DO NOTHING;

CREATE FUNCTION pg_temp.queue(p_user UUID, p_type TEXT, p_key TEXT, p_time TEXT)
RETURNS VOID LANGUAGE plpgsql AS $f$
DECLARE v_day DATE := (now() AT TIME ZONE 'UTC')::DATE + 30;
BEGIN
  INSERT INTO public.notification_schedule (user_id, title, body, send_at, notification_type, notification_key, metadata)
  VALUES (p_user, p_key, p_key, (v_day + p_time::TIME) AT TIME ZONE 'UTC', p_type, p_key,
          jsonb_build_object('timezone', 'UTC', 'local_date', v_day::TEXT));
END $f$;
CREATE FUNCTION pg_temp.rows_for(p_user UUID) RETURNS INTEGER LANGUAGE sql AS $f$
  SELECT count(*)::INTEGER FROM public.notification_schedule
  WHERE user_id = p_user AND metadata ->> 'local_date' = ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT
$f$;
CREATE FUNCTION pg_temp.refused_reason(p_user UUID, p_key TEXT) RETURNS TEXT LANGUAGE sql AS $f$
  SELECT reason FROM public.notification_cadence_events WHERE user_id = p_user AND notification_key = p_key AND decision = 'suppressed'
$f$;

-- Classifier: the classes the whole policy rests on.
SELECT is(public.notification_cadence_class('shloka', NULL), 'shloka', 'shloka is its own protected class');
SELECT is(public.notification_cadence_class('streak_nudge', NULL), 'shloka', 'the streak alias is the same Shloka class');
SELECT is(public.notification_cadence_class('general', 'streak:2026-11-10'), 'shloka', 'a generic bell row takes its class from its semantic key');
SELECT is(public.notification_cadence_class('quiz_daily', NULL), 'learning', 'quiz is the learning class');
SELECT is(public.notification_cadence_class('dharm_veer', NULL), 'learning', 'dharm_veer shares the learning class with quiz');
SELECT is(public.notification_cadence_class('mood_evening', NULL), 'other', 'mood aliases are the single other-nudge class');
SELECT is(public.notification_cadence_class('daily_digest', NULL), 'other', 'the digest is an other nudge');
SELECT is(public.notification_cadence_class('weekly_summary', NULL), 'other', 'the weekly summary is an other nudge');
SELECT is(public.notification_cadence_class('something_new', NULL), 'other', 'an unknown type is counted, never silently free');
SELECT is(public.notification_cadence_class('japa', NULL), 'exempt', 'a time the person chose is never counted');
SELECT is(public.notification_cadence_class('brahma_muhurta', NULL), 'exempt', 'ritual windows are never counted');
SELECT is(public.notification_cadence_class('festival', NULL), 'exempt', 'observances are never counted');
SELECT ok(
  (SELECT bool_and(public.notification_cadence_class(t, NULL) = 'exempt')
   FROM unnest(ARRAY['connection_request','connection_accepted','connection_rejected','connection_cancelled',
                     'post_reaction','comment_reaction','mandali_comment','user_blocked','content_reported']) AS t),
  'a person-initiated Mandali row or a safety receipt is not a Shoonaya nudge'
);
SELECT is(public.notification_cadence_limit('ceiling'), 7, 'the outer ceiling is 7');
SELECT is(
  (SELECT array_agg(public.notification_cadence_limit(s) ORDER BY s) FROM unnest(ARRAY['shloka','learning','other']) AS s),
  ARRAY[1, 1, 1],
  'shloka, learning slot and other nudge are one each'
);
SELECT is(public.notification_cadence_limit('typo'), 0, 'an unknown scope fails closed');
SELECT is(public.notification_cadence_policy_version(), 'engagement-cadence-v3', 'the policy version is v3');

-- A normal day: Shloka in the morning, the learning slot at 10:00, one other nudge in the evening.
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000054', 'shloka', 'day:shloka', '07:00'),
           pg_temp.queue('00000000-0000-0000-0000-000000000054', 'quiz', 'day:quiz', '10:00'),
           pg_temp.queue('00000000-0000-0000-0000-000000000054', 'mood', 'day:mood', '18:00')$$,
  'Shloka, the learning slot and one other nudge are all admitted on one day'
);
SELECT is(pg_temp.rows_for('00000000-0000-0000-0000-000000000054'), 3, 'all three are stored');
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_schedule
   WHERE user_id = '00000000-0000-0000-0000-000000000054' AND metadata ? 'cadence_delay_minutes'),
  0,
  'none of the three had to be shifted: 07:00, 10:00 and 18:00 are at least three hours apart'
);
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000054', 'sattvic_reminder', 'day:other2', '21:00')$$,
  'a second other nudge is refused quietly, not as an error'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000054', 'day:other2'), 'other_nudge_reached',
  'the second other nudge is recorded as refused because the one allowance is used');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000054', 'dharm_veer', 'day:dv', '14:00')$$,
  'dharm_veer after quiz is refused quietly'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000054', 'day:dv'), 'learning_slot_reached',
  'dharm_veer is refused because quiz already holds the learning slot');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000054', 'streak', 'day:streak', '15:00')$$,
  'a second Shloka-class row is refused quietly'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000054', 'day:streak'), 'shloka_slot_reached',
  'the streak alias cannot be a second Shloka');
SELECT is(pg_temp.rows_for('00000000-0000-0000-0000-000000000054'), 3, 'the refusals stored nothing');
SELECT is(
  (SELECT policy_version FROM public.notification_cadence_events
   WHERE user_id = '00000000-0000-0000-0000-000000000054' AND notification_key = 'day:other2' AND decision = 'suppressed'),
  'engagement-cadence-v3',
  'refusals are recorded under the v3 policy version'
);
SELECT is(
  (SELECT policy_version FROM public.notification_cadence_events
   WHERE user_id = '00000000-0000-0000-0000-000000000054' AND notification_key = 'day:shloka' AND decision = 'scheduled'),
  'engagement-cadence-v3',
  'admissions are recorded under the v3 policy version'
);
SELECT is(
  (SELECT metadata ->> 'cadence_policy_version' FROM public.notification_schedule
   WHERE user_id = '00000000-0000-0000-0000-000000000051' AND notification_key = 'spacing:second:00000000-0000-0000-0000-000000000051'),
  'engagement-cadence-v3',
  'a shifted row carries the v3 policy version'
);

-- The other two audit paths also carry the v3 version: a duplicate retry and a row with no safe same-day slot.
SELECT is(
  (SELECT policy_version FROM public.notification_cadence_events
   WHERE user_id = '00000000-0000-0000-0000-000000000052' AND notification_key = 'shared-event:2026-11-01' AND decision = 'duplicate'),
  'engagement-cadence-v3',
  'a duplicate retry is recorded under the v3 policy version'
);
SELECT lives_ok(
  $$INSERT INTO public.notification_schedule (user_id, title, body, send_at, notification_type, notification_key, metadata)
    VALUES ('00000000-0000-0000-0000-000000000053', 'Late', 'Late',
            (((now() AT TIME ZONE 'UTC')::DATE + 31) + TIME '20:45') AT TIME ZONE 'UTC', 'quiz', 'noslot53:quiz',
            jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 31)::TEXT))$$,
  'a row with no safe same-day slot is dropped quietly'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000053', 'noslot53:quiz'), 'no_safe_same_day_slot',
  'a missing safe slot is recorded with its own reason, not as a quota refusal');
SELECT is(
  (SELECT policy_version FROM public.notification_cadence_events
   WHERE user_id = '00000000-0000-0000-0000-000000000053' AND notification_key = 'noslot53:quiz' AND decision = 'suppressed'),
  'engagement-cadence-v3',
  'a no-safe-slot refusal is recorded under the v3 policy version'
);

-- Exempt rows are untouched: a Japa time the person chose, inside Shloka's three-hour window, is neither shifted nor counted.
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000054', 'japa', 'day:japa', '08:00')$$,
  'a chosen Japa time is admitted on a full day'
);
SELECT is(
  (SELECT to_char(send_at AT TIME ZONE 'UTC', 'HH24:MI') FROM public.notification_schedule
   WHERE user_id = '00000000-0000-0000-0000-000000000054' AND notification_key = 'day:japa'),
  '08:00',
  'the chosen Japa time is delivered exactly when chosen'
);

-- Legacy history: rows admitted under the old five-a-day rule must not crowd out the protected classes.
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000055', 'mood', 'legacy55:mood', '09:00'),
       pg_temp.queue('00000000-0000-0000-0000-000000000055', 'sattvic_reminder', 'legacy55:sattvic', '13:00');
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000055', 'shloka', 'p55:shloka', '07:00'),
           pg_temp.queue('00000000-0000-0000-0000-000000000055', 'quiz', 'p55:quiz', '16:00')$$,
  'two legacy other nudges do not crowd out Shloka or the learning slot'
);
SELECT is(pg_temp.rows_for('00000000-0000-0000-0000-000000000055'), 4, 'Shloka and the learning slot were stored beside the legacy rows');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000055', 'weekly_summary', 'p55:third-other', '20:00')$$,
  'a third other nudge on top of legacy history is refused quietly'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000055', 'p55:third-other'), 'other_nudge_reached',
  'legacy other rows count toward the single other allowance');

-- The ceiling is exactly 7 across the three classes.
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000056', 'legacy_type_' || n, 'legacy56:' || n, lpad((7 + n)::TEXT, 2, '0') || ':00')
FROM generate_series(1, 7) AS n;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000057', 'legacy_type_' || n, 'legacy57:' || n, lpad((7 + n)::TEXT, 2, '0') || ':00')
FROM generate_series(1, 6) AS n;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000056', 'shloka', 'ceil56:shloka', '07:00')$$,
  'a protected row is refused quietly when seven counted rows already exist'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000056', 'ceil56:shloka'), 'daily_ceiling_reached',
  'the outer ceiling of seven stops even a protected class');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000057', 'shloka', 'ceil57:shloka', '07:00')$$,
  'a protected row is admitted when six counted rows exist'
);
SELECT is(pg_temp.rows_for('00000000-0000-0000-0000-000000000057'), 7, 'the seventh counted row is allowed: the ceiling is 7, not 6');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000057', 'quiz', 'ceil57:quiz', '10:00')$$,
  'an eighth counted row is refused quietly'
);
SELECT is(pg_temp.refused_reason('00000000-0000-0000-0000-000000000057', 'ceil57:quiz'), 'daily_ceiling_reached',
  'the ceiling applies even though the learning class itself is empty');

-- Mandali rows are another person's action: they do not spend the one other nudge, and they have no local_date.
INSERT INTO public.notifications (user_id, title, body, type, notification_key) VALUES
  ('00000000-0000-0000-0000-000000000058', 'r', 'r', 'post_reaction', 'post_reaction:a:b'),
  ('00000000-0000-0000-0000-000000000058', 'c', 'c', 'mandali_comment', 'mandali_comment:c1'),
  ('00000000-0000-0000-0000-000000000058', 'q', 'q', 'connection_request', 'connection_request:q1');
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000058', 'mood', 'mandali58:mood', '12:00')$$,
  'an other nudge is admitted on a day with Mandali activity'
);
SELECT is(pg_temp.rows_for('00000000-0000-0000-0000-000000000058'), 1, 'Mandali rows did not use up the other-nudge allowance');

-- Statement guard: with the row guard bypassed, one statement adding a second other nudge is rejected as a whole.
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_guard;
SELECT throws_ok(
  $$INSERT INTO public.notification_schedule (user_id, title, body, send_at, notification_type, notification_key, metadata)
    SELECT '00000000-0000-0000-0000-000000000059', 'x', 'x', (((now() AT TIME ZONE 'UTC')::DATE + 30) + v.at) AT TIME ZONE 'UTC', v.kind, 'stmt59:' || v.kind,
           jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT)
    FROM (VALUES ('mood', TIME '09:00'), ('sattvic_reminder', TIME '14:00')) AS v(kind, at)$$,
  'P0001',
  'notification_cadence_conflict',
  'the statement guard rejects two other nudges even if the row guard were bypassed'
);
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000060', 'mood', 'legacy60:mood', '09:00'),
       pg_temp.queue('00000000-0000-0000-0000-000000000060', 'sattvic_reminder', 'legacy60:sattvic', '13:00');
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT lives_ok(
  $$SELECT pg_temp.queue('00000000-0000-0000-0000-000000000060', 'shloka', 'stmt60:shloka', '17:00')$$,
  'the statement guard holds only the class being inserted: legacy other rows cannot fail a Shloka insert'
);
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_guard;

-- Resolver batches (persist_notification_candidate_resolution_internal): the same limits, checked before any insert.
CREATE TEMP TABLE v3_batch_ok AS
SELECT * FROM public.persist_notification_candidate_resolution_internal(
  jsonb_build_array(
    jsonb_build_object('user_id','00000000-0000-0000-0000-000000000061','notification_type','shloka','title','t','body','b',
      'send_at',(((now() AT TIME ZONE 'UTC')::DATE + 33) + TIME '07:00') AT TIME ZONE 'UTC','notification_key','v3:shloka',
      'metadata',jsonb_build_object('timezone','UTC','local_date',((now() AT TIME ZONE 'UTC')::DATE + 33)::TEXT)),
    jsonb_build_object('user_id','00000000-0000-0000-0000-000000000061','notification_type','quiz','title','t','body','b',
      'send_at',(((now() AT TIME ZONE 'UTC')::DATE + 33) + TIME '10:00') AT TIME ZONE 'UTC','notification_key','v3:quiz',
      'metadata',jsonb_build_object('timezone','UTC','local_date',((now() AT TIME ZONE 'UTC')::DATE + 33)::TEXT)),
    jsonb_build_object('user_id','00000000-0000-0000-0000-000000000061','notification_type','mood','title','t','body','b',
      'send_at',(((now() AT TIME ZONE 'UTC')::DATE + 33) + TIME '18:00') AT TIME ZONE 'UTC','notification_key','v3:mood',
      'metadata',jsonb_build_object('timezone','UTC','local_date',((now() AT TIME ZONE 'UTC')::DATE + 33)::TEXT))
  ), '[]'::jsonb, '[]'::jsonb
);
SELECT is((SELECT promoted_count FROM v3_batch_ok), 3, 'a batch of Shloka, the learning slot and one other nudge is promoted whole');

ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000062', 'mood', 'legacy62:mood', '09:00'),
       pg_temp.queue('00000000-0000-0000-0000-000000000062', 'sattvic_reminder', 'legacy62:sattvic', '13:00');
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_statement_guard;
CREATE TEMP TABLE v3_batch_legacy AS
SELECT * FROM public.persist_notification_candidate_resolution_internal(
  jsonb_build_array(jsonb_build_object('user_id','00000000-0000-0000-0000-000000000062','notification_type','shloka','title','t','body','b',
    'send_at',(((now() AT TIME ZONE 'UTC')::DATE + 30) + TIME '17:00') AT TIME ZONE 'UTC','notification_key','v3:legacy-shloka',
    'metadata',jsonb_build_object('timezone','UTC','local_date',((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT))),
  '[]'::jsonb, '[]'::jsonb
);
SELECT is((SELECT promoted_count FROM v3_batch_legacy), 1, 'legacy other rows do not stall a batch that adds only a Shloka');

SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(jsonb_build_object('user_id','00000000-0000-0000-0000-000000000062','notification_type','daily_digest','title','t','body','b',
        'send_at',(((now() AT TIME ZONE 'UTC')::DATE + 30) + TIME '21:00') AT TIME ZONE 'UTC','notification_key','v3:digest',
        'metadata',jsonb_build_object('timezone','UTC','local_date',((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT))),
      '[]'::jsonb, '[]'::jsonb)$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch adding an other nudge to a day that already has one is refused before any insert'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.notification_schedule WHERE user_id = '00000000-0000-0000-0000-000000000062' AND notification_key = 'v3:digest'),
  0,
  'the refused batch left nothing behind'
);


-- Batch ceiling and legacy duplicates, checked on the resolver path as well.
CREATE FUNCTION pg_temp.batch_row(p_user UUID, p_type TEXT, p_key TEXT, p_time TEXT) RETURNS JSONB LANGUAGE sql AS $f$
  SELECT jsonb_build_object('user_id', p_user, 'notification_type', p_type, 'title', 't', 'body', 'b',
    'send_at', (((now() AT TIME ZONE 'UTC')::DATE + 30) + p_time::TIME) AT TIME ZONE 'UTC', 'notification_key', p_key,
    'metadata', jsonb_build_object('timezone', 'UTC', 'local_date', ((now() AT TIME ZONE 'UTC')::DATE + 30)::TEXT))
$f$;
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule DISABLE TRIGGER notification_schedule_cadence_statement_guard;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000063', 'shloka', 'legacy63:shloka-a', '07:00'),
       pg_temp.queue('00000000-0000-0000-0000-000000000063', 'shloka', 'legacy63:shloka-b', '11:00');
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000064', 'legacy_type_' || n, 'legacy64:' || n, lpad((7 + n)::TEXT, 2, '0') || ':00')
FROM generate_series(1, 5) AS n;
SELECT pg_temp.queue('00000000-0000-0000-0000-000000000065', 'legacy_type_' || n, 'legacy65:' || n, lpad((7 + n)::TEXT, 2, '0') || ':00')
FROM generate_series(1, 6) AS n;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_guard;
ALTER TABLE public.notification_schedule ENABLE TRIGGER notification_schedule_cadence_statement_guard;
CREATE TEMP TABLE v3_batch_legacy_shloka AS
SELECT * FROM public.persist_notification_candidate_resolution_internal(
  jsonb_build_array(pg_temp.batch_row('00000000-0000-0000-0000-000000000063', 'quiz', 'v3:q63', '16:00')), '[]'::jsonb, '[]'::jsonb);
SELECT is((SELECT promoted_count FROM v3_batch_legacy_shloka), 1,
  'legacy duplicate Shloka rows do not stall a batch that adds only the learning slot');
CREATE TEMP TABLE v3_batch_seven AS
SELECT * FROM public.persist_notification_candidate_resolution_internal(
  jsonb_build_array(pg_temp.batch_row('00000000-0000-0000-0000-000000000064', 'shloka', 'v3:s64', '15:00'),
                    pg_temp.batch_row('00000000-0000-0000-0000-000000000064', 'quiz', 'v3:q64', '18:00')), '[]'::jsonb, '[]'::jsonb);
SELECT is((SELECT promoted_count FROM v3_batch_seven), 2,
  'a batch that brings a day to exactly seven counted rows is promoted');
SELECT throws_ok(
  $$SELECT * FROM public.persist_notification_candidate_resolution_internal(
      jsonb_build_array(pg_temp.batch_row('00000000-0000-0000-0000-000000000065', 'shloka', 'v3:s65', '15:00'),
                        pg_temp.batch_row('00000000-0000-0000-0000-000000000065', 'quiz', 'v3:q65', '18:00')), '[]'::jsonb, '[]'::jsonb)$$,
  'P0001',
  'notification_cadence_conflict',
  'a batch that would take a day past seven counted rows is refused before any insert'
);

SELECT * FROM finish();
ROLLBACK;
