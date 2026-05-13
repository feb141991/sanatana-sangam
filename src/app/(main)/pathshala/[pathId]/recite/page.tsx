import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getTraditionMeta } from '@/lib/tradition-config';
import { resolveEffectiveMeaningLanguage } from '@/lib/language-runtime';
import ReciteClient from './ReciteClient';

export default async function RecitePage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition, full_name, app_language, meaning_language, transliteration_language, show_transliteration')
    .eq('id', user.id)
    .single();

  const tradition = profile?.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);

  // ── Fetch lessons server-side to ensure full library access ───
  const { getPathLessons } = await import('@/lib/pathshala-lessons');
  const lessons = getPathLessons(pathId);

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, current_lesson')
    .eq('user_id', user.id)
    .eq('path_id', pathId)
    .single();

  if (!enrollment || enrollment.status !== 'active') {
    redirect('/pathshala');
  }

  const appLanguage = (profile as any)?.app_language ?? 'en';
  const meaningLanguage = (profile as any)?.meaning_language ?? 'en';
  const transliterationLanguage = (profile as any)?.transliteration_language ?? 'en';
  const effectiveMeaningLanguage = resolveEffectiveMeaningLanguage(appLanguage, meaningLanguage);
  let hindiMeanings: Record<string, string> = {};
  if (effectiveMeaningLanguage === 'hi') {
    const { data: hmRows } = await supabase
      .from('hindi_meanings')
      .select('entry_id, meaning_hi');
    if (hmRows) {
      for (const row of hmRows) hindiMeanings[row.entry_id] = row.meaning_hi;
    }
  }

  return (
    <ReciteClient
      userId={user.id}
      pathId={pathId}
      tradition={tradition}
      accentColour={meta.accentColour}
      lessons={lessons}
      currentLesson={(enrollment as any).current_lesson ?? 0}
      appLanguage={appLanguage}
      meaningLanguage={meaningLanguage}
      transliterationLanguage={transliterationLanguage}
      showTransliteration={(profile as any)?.show_transliteration ?? true}
      hindiMeanings={hindiMeanings}
    />
  );
}
