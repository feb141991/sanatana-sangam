import type { SupabaseClient } from '@supabase/supabase-js';

import { DELETION_REASONS } from '@/lib/account-deletion-reasons';
import { getUnlockedRelics } from '@/lib/relics';

// One source for "what the user would lose" in the account-deletion flow,
// shared by GET /api/user/delete/preview (Native) and the PWA's
// /settings/delete-account page. A failed read is an error, never zeros: a
// summary that says "0-day streak, 0 journal entries" because a query failed
// would understate what deletion removes.

export type DeletionPreview = {
  userName: string;
  tradition: string;
  activeSymbolId: string | null;
  streak: number;
  karmaPoints: number;
  sevaScore: number;
  relicsCount: number;
  journalCount: number;
  activeSankalpas: number;
  /** Kuls this user created. Kul has no leadership-transfer flow yet. */
  ownedKuls: Array<{ id: string; name: string }>;
  reasons: typeof DELETION_REASONS;
};

export type DeletionPreviewResult =
  | { ok: true; preview: DeletionPreview }
  | { ok: false; error: string };

/**
 * `userClient` is RLS-scoped to the caller; `adminClient` is only used for the
 * kuls lookup (kuls RLS limits reads to members, and a creator may have left).
 */
export async function buildDeletionPreview(
  userClient: SupabaseClient,
  adminClient: SupabaseClient,
  userId: string,
): Promise<DeletionPreviewResult> {
  const [profileRes, sadhanaRes, journalRes, kulsRes, sankalpaRes] = await Promise.all([
    userClient
      .from('profiles')
      .select('full_name, username, tradition, active_symbol_id, karma_points, seva_score, shloka_streak')
      .eq('id', userId)
      .maybeSingle(),
    userClient
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    userClient
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    adminClient
      .from('kuls')
      .select('id, name')
      .eq('created_by', userId),
    userClient
      .from('sankalpas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const failed = [
    ['profile', profileRes.error],
    ['streak', sadhanaRes.error],
    ['journal', journalRes.error],
    ['kuls', kulsRes.error],
    ['sankalpas', sankalpaRes.error],
  ].find(([, error]) => error);
  if (failed) return { ok: false, error: `Could not load ${failed[0]} summary` };
  if (!profileRes.data) return { ok: false, error: 'Profile not found' };
  if (journalRes.count == null || sankalpaRes.count == null) return { ok: false, error: 'Could not count practice records' };

  const profile = profileRes.data as {
    full_name: string | null; username: string | null; tradition: string | null; active_symbol_id: string | null;
    karma_points: number | null; seva_score: number | null; shloka_streak: number | null;
  };
  const streak = (sadhanaRes.data as { streak_count: number | null } | null)?.streak_count ?? profile.shloka_streak ?? 0;
  const sevaScore = profile.seva_score ?? 0;
  const tradition = profile.tradition ?? 'hindu';

  return {
    ok: true,
    preview: {
      userName: profile.full_name || profile.username || 'Seeker',
      tradition,
      activeSymbolId: profile.active_symbol_id ?? null,
      streak,
      karmaPoints: profile.karma_points ?? 0,
      sevaScore,
      relicsCount: getUnlockedRelics(streak, sevaScore, tradition).length,
      journalCount: journalRes.count,
      activeSankalpas: sankalpaRes.count,
      ownedKuls: ((kulsRes.data ?? []) as Array<{ id: string; name: string }>).map((k) => ({ id: k.id, name: k.name })),
      reasons: DELETION_REASONS,
    },
  };
}
