import { notFound } from 'next/navigation';
import { getKathaById } from '@/lib/katha-library';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import KathaReaderClient from './KathaReaderClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KathaReaderPage({ params }: Props) {
  const { id } = await params;
  const katha = getKathaById(id);
  if (!katha) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: {
    app_language?: string | null;
    meaning_language?: string | null;
    transliteration_language?: string | null;
    show_transliteration?: boolean | null;
  } | null = null;

  if (user) {
    const result = await supabase
      .from('profiles')
      .select('app_language, meaning_language, transliteration_language, show_transliteration')
      .eq('id', user.id)
      .maybeSingle();
    profile = result.data;
  }

  return (
    <KathaReaderClient
      katha={katha}
      appLanguage={profile?.app_language ?? 'en'}
      meaningLanguage={profile?.meaning_language ?? 'en'}
      transliterationLanguage={profile?.transliteration_language ?? 'en'}
      showTransliteration={profile?.show_transliteration ?? true}
    />
  );
}
