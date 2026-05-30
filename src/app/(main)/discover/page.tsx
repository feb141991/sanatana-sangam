import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDharmVeerOfTheDay } from '@/lib/dharm-veer-db';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — Mood-Based Guidance' };

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, todayVeer] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, spiritual_level, transliteration_language')
      .eq('id', user.id)
      .maybeSingle(),
    getDharmVeerOfTheDay(supabase, null).catch(() => null),
  ]);

  return (
    <DiscoverClient
      tradition={profile?.tradition ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      todayVeer={todayVeer ? {
        id:      todayVeer.id,
        name:    todayVeer.name,
        emoji:   todayVeer.emoji,
        tagline: todayVeer.tagline,
        tradition: todayVeer.tradition,
      } : null}
    />
  );
}
