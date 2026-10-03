-- Rollback for 20261003150300_unlist_deleting_accounts_from_challenge_leaderboard.sql.
-- Restores the 20260604120000 body (no is_deleting predicate). Grants kept.

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
  GROUP BY p.id, p.full_name, p.username, p.avatar_url, p.tradition, p.active_symbol_id, p.is_pro
  ORDER BY SUM(ucp.score) DESC, p.username ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

commit;
