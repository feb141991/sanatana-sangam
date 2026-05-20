import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NityaKarmaClient from './NityaKarmaClient';

export default async function NityaKarmaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition, life_stage, gender_context, latitude, longitude, timezone, app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
    .eq('id', user.id)
    .single();

  return (
    <NityaKarmaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      lifeStage={profile?.life_stage ?? null}
      genderContext={profile?.gender_context ?? null}
      timezone={profile?.timezone ?? null}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      scriptureScript={(profile as any)?.scripture_script ?? 'original'}
    />
  );
}
