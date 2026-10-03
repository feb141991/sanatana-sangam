-- Hide accounts in their 30-day deletion cool-off from the monthly Dharma
-- challenge leaderboard.
--
-- The deletion flow tells the user their profile is hidden from community
-- leaderboards and Mandali discovery during the cool-off. The Shruti scoreboard
-- and Mandali member profile already honour profiles.is_deleting; this was the
-- remaining named leaderboard. get_challenge_tradition_ranks is unchanged: it
-- publishes per-tradition totals, not anyone's profile.
--
-- Body identical to 20260604120000 except the is_deleting predicate.
-- `IS NOT TRUE` keeps rows where is_deleting is NULL.
--
-- Privilege review: unchanged -- SECURITY DEFINER, search_path = public,
-- EXECUTE granted to authenticated by 20260604120000 (create or replace keeps
-- grants). Read-only.
--
-- Rollback guidance: supabase/rollbacks/20261003150300_unlist_deleting_accounts_from_challenge_leaderboard_rollback.sql
-- restores the 20260604120000 body. No data changes either way.

begin;

CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(p_challenge_id UUID, p_tradition TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  username TEXT,
  avatar_url TEXT,
  tradition TEXT,
  active_symbol_id TEXT,
  is_pro BOOLEAN,
  total_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.avatar_url,
    p.tradition,
    p.active_symbol_id,
    p.is_pro,
    SUM(ucp.score)::BIGINT
  FROM public.user_challenge_progress ucp
  JOIN public.challenge_packs cp ON ucp.pack_id = cp.id
  JOIN public.profiles p ON ucp.user_id = p.id
  WHERE cp.challenge_id = p_challenge_id
    AND (p_tradition IS NULL OR p.tradition = p_tradition)
    AND p.is_deleting IS NOT TRUE
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.tradition, p.active_symbol_id, p.is_pro
  ORDER BY SUM(ucp.score) DESC, p.username ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

commit;
