import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getTodayShloka } from '@/lib/shlokas';
import { getStotramsByTradition, STOTRAMS } from '@/lib/stotrams';
import BhaktiClient from './BhaktiClient';

export default async function BhaktiPage() {
  const shloka = getTodayShloka();

  // Attempt to load user data — gracefully falls back for guests
  let tradition = 'hindu';
  let userName  = 'Sadhak';
  let japaStreak = 0;
  let sessionCountToday = 0;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const today = new Date().toISOString().slice(0, 10);

      const [{ data: profile }, { data: sadhana }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select('tradition, full_name, username')
          .eq('id', user.id)
          .single(),
        supabase
          .from('daily_sadhana')
          .select('streak_count')
          .eq('user_id', user.id)
          .eq('date', today)
          .single(),
        supabase
          .from('mala_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`),
      ]);

      tradition  = profile?.tradition ?? 'hindu';
      userName   = profile?.full_name ?? profile?.username ?? 'Sadhak';
      japaStreak = sadhana?.streak_count ?? 0;
      sessionCountToday = count ?? 0;
    }
  } catch {
    // Silently fall back to defaults for guest/error states
  }

  // Pick a daily stotram — rotate by day of year, filtered to tradition
  const traditionStotrams = getStotramsByTradition(tradition);
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const dailyStotram = traditionStotrams[dayOfYear % traditionStotrams.length] ?? STOTRAMS[0];

  return (
    <BhaktiClient
      shloka={shloka}
      tradition={tradition}
      userName={userName}
      japaStreak={japaStreak}
      sessionCountToday={sessionCountToday}
      dailyStotramId={dailyStotram.id}
      dailyStotramTitle={dailyStotram.title}
      dailyStotramDeityEmoji={dailyStotram.deityEmoji}
    />
  );
}
