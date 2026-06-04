import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser } from '@/lib/auth-cache';
import { redirect } from 'next/navigation';
import PathshalaClient from './PathshalaClient';


export default async function PathshalaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; entryId?: string; sectionId?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/');

  const supabase = await createServerSupabaseClient();

  const [{ data: profile }, { data: shrutiStats }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, tradition, app_language, meaning_language, transliteration_language, show_transliteration, is_pro')
      .eq('id', user.id)
      .single(),

    supabase
      .from('pathshala_recitation_stats')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  let communityRank: number | undefined = undefined;
  if (shrutiStats && shrutiStats.scored_count >= 3) {
    const { count: betterCount } = await supabase
      .from('pathshala_recitation_stats')
      .select('*', { count: 'exact', head: true })
      .gt('avg_overall_score', shrutiStats.avg_overall_score ?? 0)
      .gte('scored_count', 3);
    
    communityRank = (betterCount ?? 0) + 1;
  }

  const params = await searchParams;
  const validTabs = ['learn', 'scripture', 'explore'] as const;
  type Tab = typeof validTabs[number];
  let initialTab: Tab = validTabs.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : 'learn';

  // Force scripture tab if deep-linking to an entry or section
  if (params.entryId || params.sectionId) {
    initialTab = 'scripture';
  }

  return (
    <PathshalaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      initialTab={initialTab}
      initialEntryId={params.entryId}
      initialSectionId={params.sectionId}
      appLanguage={(profile as any)?.app_language ?? 'en'}
      meaningLanguage={(profile as any)?.meaning_language ?? 'en'}
      transliterationLanguage={(profile as any)?.transliteration_language ?? 'en'}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      isPro={(profile as any)?.is_pro ?? false}
      shrutiStats={shrutiStats}
      communityRank={communityRank}
    />
  );
}
