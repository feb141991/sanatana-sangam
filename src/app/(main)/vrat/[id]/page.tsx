import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import VratClient from './VratClient';
import { lookupVratData } from '@/lib/vrat-data';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VratPage({ params }: Props) {
  const p = await params;
  const decodedId = decodeURIComponent(p.id);
  const vratData = lookupVratData(decodedId);
  const supabase = await createServerSupabaseClient();

  if (!vratData) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from('profiles')
        .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
        .eq('id', user.id)
        .single()).data
    : null;

  return (
    <VratClient
      vrat={vratData}
      originalSlug={decodedId}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      scriptureScript={(profile as any)?.scripture_script ?? 'original'}
    />
  );
}
