-- Close P0-3: users must not be able to spoof daily_sadhana completion
-- booleans directly.
--
-- Today `daily_sadhana` carries a blanket `GRANT ALL` to `authenticated`
-- (and `anon`) with RLS enforcing row ownership only
-- (`USING/WITH CHECK (auth.uid() = user_id)`). Postgres RLS is row-level,
-- not column-level: any authenticated user can already run
--   UPDATE daily_sadhana SET quiz_done = true, nitya_done = true,
--     pathshala_done = true, dharmveer_done = true,
--     perfect_day_bonus_given = true WHERE user_id = auth.uid() AND date = today
-- directly from a browser console or REST call, bypassing every app-side
-- completion check. Full write-path inventory (superseding the 5-column
-- matrix in docs/NATIVE_DAILY_COMPLETION_P0_REMEDIATION_PLAN.md, which
-- undercounted real writers found by re-auditing both repos before this
-- migration):
--
--   quiz_done               -- src/app/api/quiz/save/route.ts (server)
--   pathshala_done           -- src/app/api/pathshala/progress/route.ts (server)
--                               AND src/app/(main)/pathshala/[pathId]/lesson/LessonClient.tsx (browser-direct)
--   nitya_done               -- src/app/api/native/nitya-karma/route.ts (server)
--                               AND src/app/(main)/nitya-karma/NityaKarmaClient.tsx (browser-direct)
--   dharmveer_done            -- src/app/(main)/dharm-veer/[id]/DharmVeerClient.tsx (browser-direct, web)
--                               AND app/dharm-veer.tsx (native, direct)
--   stotram_done              -- src/app/(main)/bhakti/stotram/[id]/StotramClient.tsx (browser-direct)
--   katha_done                -- src/app/(main)/bhakti/katha/[id]/KathaReaderClient.tsx (browser-direct)
--   panchang_viewed           -- src/app/api/native/panchang-viewed/route.ts (server)
--   perfect_day_bonus_given   -- src/app/api/sadhana/perfect-day/route.ts (server, direct
--                               conditional UPDATE -- replayable: a user can reset this
--                               column to false via the same blanket grant, then re-claim
--                               the bonus repeatedly, since re-derivation evidence in
--                               mala_sessions/quiz_responses/nitya_karma_log/
--                               guided_path_progress persists once created for a day)
--   japa_done, streak_count   -- src/app/api/japa/complete/route.ts (server) AND
--                               src/app/api/sadhana/use-freeze/route.ts (server, streak_count only)
--
-- japa_done/streak_count are the one pair NOT migrated in this slice: the
-- carried-streak algorithm (today/yesterday/latest-prior row lookups +
-- streak-freeze bridging) is too complex to safely port into SQL under this
-- change's scope. Per this task's own stop condition, that column pair is
-- deliberately left directly writable (re-granted below) and is a disclosed,
-- accepted gap -- not silently dropped.
--
-- dharmveer_done, stotram_done, katha_done have no independent completion
-- signal anywhere in the schema (no evidence table proves the user actually
-- engaged), so funneling them through an RPC does not make them
-- unspoofable -- it only prevents them being set in the same arbitrary
-- UPDATE statement as the re-derivable/reward-relevant columns below, and
-- gives a single, auditable write path. This is disclosed, not claimed as
-- fully closed.
--
-- quiz_done and pathshala_done are set to true unconditionally by their RPC
-- (the caller has already durably persisted the underlying evidence row
-- before calling -- quiz_responses insert, guided_path_progress upsert -- so
-- the RPC's job is only to enforce ownership, not to re-derive).
--
-- nitya_done is the one column this migration re-derives independently
-- inside the RPC itself (COUNT of the 7 canonical nitya_karma_log step_ids
-- for that user/day), rather than trusting the caller's own "all done"
-- computation -- the same defense-in-depth already used by the perfect-day
-- route's re-derivation for the other four practices.

-- -- 1. sync_quiz_completion --------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_quiz_completion(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, quiz_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET quiz_done = true;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_quiz_completion(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_quiz_completion(uuid, date) TO authenticated, service_role;

-- -- 2. sync_pathshala_completion -----------------------------------------
CREATE OR REPLACE FUNCTION public.sync_pathshala_completion(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, pathshala_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET pathshala_done = true;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_pathshala_completion(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_pathshala_completion(uuid, date) TO authenticated, service_role;

-- -- 3. sync_nitya_completion -----------------------------------------
-- Re-derives nitya_done from nitya_karma_log itself (does not trust the
-- caller's own "all 7 steps done" computation), matching the same 7
-- canonical step ids as NATIVE_NITYA_STEP_ORDER / countCompletedNativeNityaSteps
-- (src/lib/native-nitya-karma.ts). These ids must stay in sync with that
-- TS source if the canonical step list ever changes.
CREATE OR REPLACE FUNCTION public.sync_nitya_completion(p_user_id uuid, p_date date)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_steps text[] := ARRAY[
    'woke_brahma_muhurta', 'snana_done', 'tilak_done', 'japa_done',
    'sandhya_done', 'aarti_done', 'shloka_done'
  ];
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(DISTINCT step_id) INTO v_count
  FROM public.nitya_karma_log
  WHERE user_id = v_user_id
    AND log_date = p_date
    AND step_id = ANY(v_steps);

  IF v_count < array_length(v_steps, 1) THEN
    RETURN false;
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, nitya_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET nitya_done = true;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_nitya_completion(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_nitya_completion(uuid, date) TO authenticated, service_role;

-- -- 4. complete_dharmveer -----------------------------------------------
-- No independent engagement signal exists for this practice (see header
-- comment) -- ownership is enforced, genuine engagement is not.
CREATE OR REPLACE FUNCTION public.complete_dharmveer(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, dharmveer_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET dharmveer_done = true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_dharmveer(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_dharmveer(uuid, date) TO authenticated, service_role;

-- -- 5. complete_stotram ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_stotram(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, stotram_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET stotram_done = true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_stotram(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_stotram(uuid, date) TO authenticated, service_role;

-- -- 6. complete_katha -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_katha(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, katha_done)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET katha_done = true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_katha(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_katha(uuid, date) TO authenticated, service_role;

-- -- 7. mark_panchang_viewed ------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_panchang_viewed(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot modify another user''s daily sadhana' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.daily_sadhana (user_id, date, panchang_viewed)
  VALUES (v_user_id, p_date, true)
  ON CONFLICT (user_id, date) DO UPDATE SET panchang_viewed = true;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_panchang_viewed(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_panchang_viewed(uuid, date) TO authenticated, service_role;

-- -- 8. claim_perfect_day_bonus ---------------------------------------------
-- Replaces /api/sadhana/perfect-day's own direct conditional UPDATE. The
-- route still independently re-derives japa/quiz/nitya/pathshala from their
-- source tables in TS before calling this (unchanged, already correct --
-- Slice 1) and still trust-reads dharmveer_done (disclosed gap, unchanged).
-- This RPC's only job is the atomic, replay-proof claim: it flips
-- perfect_day_bonus_given from false to true exactly once and reports
-- whether this call was the one that did it. Because the column itself is
-- revoked from direct client writes below, a user can no longer reset it to
-- false and re-claim.
CREATE OR REPLACE FUNCTION public.claim_perfect_day_bonus(p_user_id uuid, p_sadhana_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_claimed boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Cannot claim another user''s perfect-day bonus' USING ERRCODE = '42501';
  END IF;

  UPDATE public.daily_sadhana
  SET perfect_day_bonus_given = true
  WHERE id = p_sadhana_id
    AND user_id = v_user_id
    AND perfect_day_bonus_given = false;

  v_claimed := FOUND;
  RETURN v_claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_perfect_day_bonus(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_perfect_day_bonus(uuid, uuid) TO authenticated, service_role;

-- -- 9. Column-level REVOKE / re-GRANT on daily_sadhana ----------------------
-- Column-level and table-level Postgres privileges are OR'd: a bare
-- `REVOKE UPDATE (col) ... FROM authenticated` does nothing while the
-- existing `GRANT ALL` (table-wide) remains in place. The table-wide
-- privilege must be revoked first, then the specific columns that must
-- stay directly writable are re-granted explicitly.
--
-- anon never has a legitimate reason to write daily_sadhana at all (every
-- write path requires an authenticated user); its grant is revoked
-- entirely with no re-grant.
REVOKE INSERT, UPDATE, DELETE ON public.daily_sadhana FROM authenticated;
REVOKE ALL ON public.daily_sadhana FROM anon;

-- Only japa_done/streak_count remain directly writable in this slice (the
-- "stop" column pair -- see header comment). user_id/date must also stay
-- insertable since the upsert's insert-branch always targets them.
GRANT INSERT (user_id, date, japa_done, streak_count) ON public.daily_sadhana TO authenticated;
GRANT UPDATE (japa_done, streak_count) ON public.daily_sadhana TO authenticated;

-- SELECT privilege is untouched above; RLS ownership policies continue to
-- gate it, unchanged.

-- -- 10. Opportunistic fix: mark_nitya_step ----------------------------------
-- Found during this audit, adjacent to but distinct from P0-3: this
-- function is SECURITY DEFINER, granted `ALL` to `authenticated`, and has
-- NO ownership check at all (unlike every other SECURITY DEFINER function
-- in this schema) -- any authenticated user could call it with an arbitrary
-- p_user_id to set another user's legacy nitya_karma_log step booleans.
-- It operates on nitya_karma_log's old boolean-per-step columns
-- (woke_brahma_muhurta, snana_done, ...), a schema generation earlier than
-- the step_id/log_date row-per-step model the live nitya-karma route
-- actually uses today. Confirmed via grep: zero callers in either the web
-- or native repo. Revoking is zero-risk and closes a live, currently
-- exploitable gap rather than leaving it dormant.
REVOKE ALL ON FUNCTION public.mark_nitya_step(uuid, date, text, boolean) FROM PUBLIC, authenticated, anon;
