import { DHARM_VEERS } from '@/lib/dharm-veer';
import DharmVeerClient from './DharmVeerClient';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';


export default async function DharmVeerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hero = DHARM_VEERS.find(h => h.id === id);
  const supabase = await createServerSupabaseClient();
  if (!hero) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from('profiles')
        .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
        .eq('id', user.id)
        .single()).data
    : null;

  return (
    <DharmVeerClient
      hero={hero}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      scriptureScript={(profile as any)?.scripture_script ?? 'original'}
    />
  );
}
