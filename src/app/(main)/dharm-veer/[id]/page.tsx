import { getDharmVeerBySlug } from '@/lib/dharm-veer-db';
import DharmVeerClient from './DharmVeerClient';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

type DharmVeerProfilePreferences = {
  app_language: string | null;
  meaning_language: string | null;
  transliteration_language: string | null;
  show_transliteration: boolean | null;
  scripture_script: string | null;
};

export default async function DharmVeerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Run hero fetch (cached, via admin) and auth in PARALLEL
  // Previously: 3 sequential awaits. Now: 2 parallel + 1 conditional.
  const [rawHero, supabase] = await Promise.all([
    getDharmVeerBySlug(
      // Inline a lightweight admin client for the parallel hero fetch
      createAdminClient(),
      id
    ),
    createServerSupabaseClient(),
  ]);

  if (!rawHero) notFound();

  // Auth and profile fetch — only needs the user-Supabase client
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase
        .from('profiles')
        .select('app_language, meaning_language, transliteration_language, show_transliteration, scripture_script')
        .eq('id', user.id)
        .single()).data as DharmVeerProfilePreferences | null
    : null;

  return (
    <DharmVeerClient
      hero={rawHero}
      appLanguage={profile?.app_language ?? 'en'}
      meaningLanguage={profile?.meaning_language ?? 'en'}
      transliterationLanguage={profile?.transliteration_language ?? 'en'}
      showTransliteration={profile?.show_transliteration ?? true}
      scriptureScript={profile?.scripture_script ?? 'original'}
    />
  );
}
