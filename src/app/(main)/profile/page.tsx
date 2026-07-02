import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-cache';
import { getUserSafetyDashboardData, getUserSafetyState } from '@/lib/user-safety';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';
import type { Profile } from '@/types/database';

export default async function ProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const supabase = await createServerSupabaseClient();

  let profile: (Profile & { show_sadhana_highlights?: boolean | null }) | null = null;

  const profileWithHighlights = await supabase
    .from('profiles')
    .select('*, show_sadhana_highlights')
    .eq('id', user.id)
    .single();

  if (profileWithHighlights.error) {
    const fallbackProfile = await supabase
      .from('profiles')
      .select('*, show_sadhana_highlights')
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

  const thirtyAgo = new Date();
  thirtyAgo.setDate(thirtyAgo.getDate() - 30);

  const [
    threadCountResult,
    postCountResult,
    safetyDashboard,
    malaSessionsResult,
    latestSadhanaResult,
    nityaDaysResult,
    pathshalaEntriesResult,
    bookmarkedVersesResult,
  ] = await Promise.all([
    supabase
      .from('forum_threads')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),
    (async () => {
      const state = await getUserSafetyState(supabase, user.id);
      return getUserSafetyDashboardData(supabase, user.id, state);
    })(),
    // Only select the 4 columns needed — avoids fetching unused session data
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
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('log_date', thirtyAgo.toISOString().slice(0, 10)),
    supabase
      .from('pathshala_user_state')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('pathshala_user_state')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('bookmarked_at', 'is', null),
  ]);

  const malaSessions = malaSessionsResult.data ?? [];
  const totalBeads   = malaSessions.reduce((s, r) => s + (r.bead_count ?? 0), 0);
  const totalRounds  = malaSessions.reduce((s, r) => s + (r.rounds ?? 0), 0);
  const totalMinutes = Math.round(malaSessions.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) / 60);
  const totalSessions = malaSessions.length;

  const freq: Record<string, number> = {};
  for (const r of malaSessions) {
    if (r.mantra) freq[r.mantra] = (freq[r.mantra] ?? 0) + 1;
  }
  const topMantra = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const streak           = latestSadhanaResult.data?.streak_count ?? (profile?.shloka_streak ?? 0);
  const nityaDays        = nityaDaysResult.count ?? 0;
  const pathshalaEntries = pathshalaEntriesResult.count ?? 0;
  const bookmarkedVerses = bookmarkedVersesResult.count ?? 0;

  return (
    <ProfileClient
      profile={profile}
      threadCount={threadCountResult.count ?? 0}
      postCount={postCountResult.count ?? 0}
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
