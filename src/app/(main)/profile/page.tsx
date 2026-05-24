import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserSafetyDashboardData, getUserSafetyState } from '@/lib/user-safety';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import type { Profile } from '@/types/database';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile: (Profile & { show_sadhana_highlights?: boolean | null }) | null = null;

  const profileWithHighlights = await supabase
    .from('profiles')
    .select('*, show_sadhana_highlights')
    .eq('id', user.id)
    .single();

  if (profileWithHighlights.error) {
    const fallbackProfile = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = fallbackProfile.data
      ? { ...(fallbackProfile.data as Profile), show_sadhana_highlights: false }
      : null;
  } else {
    profile = (profileWithHighlights.data as (Profile & { show_sadhana_highlights?: boolean | null }) | null);
  }

  const showSadhanaHighlights = Boolean(profile?.show_sadhana_highlights ?? false);
  const isOwnProfile = true;

  const { count: threadCount } = await supabase
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id);

  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id);

  const safetyState = await getUserSafetyState(supabase, user.id);
  const safetyDashboard = await getUserSafetyDashboardData(supabase, user.id, safetyState);

  let totalBeads = 0;
  let totalRounds = 0;
  let totalMinutes = 0;
  let totalSessions = 0;
  let streak = profile?.shloka_streak ?? 0;
  let topMantra: string | null = null;
  let nityaDays = 0;
  let pathshalaEntries = 0;
  let bookmarkedVerses = 0;

  if (showSadhanaHighlights || isOwnProfile) {
    const thirtyAgo = new Date();
    thirtyAgo.setDate(thirtyAgo.getDate() - 30);

    const [
      japaTotalsResult,
      latestSadhanaResult,
      nityaDaysResult,
      pathshalaEntriesResult,
      bookmarkedVersesResult,
    ] = await Promise.all([
      supabase
        .from('mala_sessions')
        .select('bead_count, duration_seconds, rounds, mantra')
        .eq('user_id', user.id),
      supabase
        .from('daily_sadhana')
        .select('streak_count')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('nitya_karma_log')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('log_date', thirtyAgo.toISOString().slice(0, 10)),
      supabase
        .from('pathshala_user_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('pathshala_user_state')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('bookmarked_at', 'is', null),
    ]);

    const japaTotals = japaTotalsResult.data ?? [];
    totalBeads = japaTotals.reduce((s, r) => s + (r.bead_count ?? 0), 0);
    totalRounds = japaTotals.reduce((s, r) => s + (r.rounds ?? 0), 0);
    totalMinutes = Math.round(japaTotals.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) / 60);
    totalSessions = japaTotals.length;
    const freq: Record<string, number> = {};
    for (const r of japaTotals) {
      if (r.mantra) freq[r.mantra] = (freq[r.mantra] ?? 0) + 1;
    }
    topMantra = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    streak = latestSadhanaResult.data?.streak_count ?? (profile?.shloka_streak ?? 0);
    nityaDays = nityaDaysResult.count ?? 0;
    pathshalaEntries = pathshalaEntriesResult.count ?? 0;
    bookmarkedVerses = bookmarkedVersesResult.count ?? 0;
  }

  return (
    <ProfileClient
      profile={profile}
      threadCount={threadCount ?? 0}
      postCount={postCount ?? 0}
      userId={user.id}
      userEmail={user.email ?? ''}
      blockedProfiles={safetyDashboard.blockedProfiles}
      mutedProfiles={safetyDashboard.mutedProfiles}
      hiddenItems={safetyDashboard.hiddenItems}
      totalBeads={totalBeads}
      totalRounds={totalRounds}
      totalMinutes={totalMinutes}
      totalSessions={totalSessions}
      streak={streak}
      topMantra={topMantra}
      nityaDays={nityaDays}
      pathshalaEntries={pathshalaEntries}
      bookmarkedVerses={bookmarkedVerses}
      showSadhanaHighlights={showSadhanaHighlights}
      isOwnProfile={isOwnProfile}
    />
  );
}
