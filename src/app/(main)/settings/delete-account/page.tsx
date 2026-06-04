import { redirect } from 'next/navigation';
import { existsSync } from 'fs';
import { join } from 'path';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUnlockedRelics } from '@/lib/relics';
import DeleteAccountClient from './DeleteAccountClient';

export default async function DeleteAccountPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: streakRow },
    { count: journalCount },
    { data: firstEntry },
    { data: lastEntry }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, tradition, active_symbol_id, karma_points, seva_score, shloka_streak')
      .eq('id', user.id)
      .single(),
    supabase
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('journal_entries')
      .select('entry_date')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) redirect('/settings/subscription');

  const streak = streakRow?.streak_count ?? profile.shloka_streak ?? 0;
  const sevaScore = profile.seva_score ?? 0;
  const karmaPoints = profile.karma_points ?? 0;
  const tradition = profile.tradition ?? 'hindu';
  const relicsUnlocked = getUnlockedRelics(streak, sevaScore, tradition).length;

  let journalDaysSpanned = 0;
  if (firstEntry?.entry_date && lastEntry?.entry_date) {
    const firstDate = new Date(firstEntry.entry_date);
    const lastDate = new Date(lastEntry.entry_date);
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    journalDaysSpanned = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const exportRouteExists = existsSync(
    join(process.cwd(), 'src', 'app', 'api', 'user', 'export', 'route.ts'),
  );

  return (
    <DeleteAccountClient
      userName={profile.full_name || profile.username || 'Seeker'}
      tradition={tradition}
      activeSymbolId={profile.active_symbol_id}
      streak={streak}
      karmaPoints={karmaPoints}
      sevaScore={sevaScore}
      relicsUnlocked={relicsUnlocked}
      exportAvailable={exportRouteExists}
      journalCount={journalCount ?? 0}
      journalDaysSpanned={journalDaysSpanned}
    />
  );
}
