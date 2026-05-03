import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import DiscoverClient from './DiscoverClient';

export const metadata = { title: 'Discover — Mood-Based Guidance' };

export default async function DiscoverPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition, spiritual_level, transliteration_language')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <DiscoverClient
      tradition={profile?.tradition ?? null}
      spiritualLevel={profile?.spiritual_level ?? null}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
    />
  );
}
