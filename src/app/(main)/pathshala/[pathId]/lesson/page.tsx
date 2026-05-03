import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getTraditionMeta } from '@/lib/tradition-config';
import LessonClient from './LessonClient';

export default async function LessonPage({
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
    .select('tradition, full_name, username, transliteration_language')
    .eq('id', user.id)
    .single();

  const tradition = profile?.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('guided_path_progress')
    .select('path_id, status, current_lesson, completed_lessons')
    .eq('user_id', user.id)
    .eq('path_id', pathId)
    .single();

  if (!enrollment || enrollment.status !== 'active') {
    redirect('/pathshala');
  }

  // Fetch Hindi meanings if user prefers Hindi
  const transliterationLanguage = (profile as any)?.transliteration_language ?? 'en';
  let hindiMeanings: Record<string, string> = {};
  if (transliterationLanguage === 'hi') {
    const { data: hmRows } = await supabase
      .from('hindi_meanings')
      .select('entry_id, meaning_hi');
    if (hmRows) {
      for (const row of hmRows) hindiMeanings[row.entry_id] = row.meaning_hi;
    }
  }

  return (
    <LessonClient
      userId={user.id}
      pathId={pathId}
      tradition={tradition}
      accentColour={meta.accentColour}
      currentLesson={(enrollment as any).current_lesson ?? 0}
      completedLessons={((enrollment as any).completed_lessons as number[]) ?? []}
      transliterationLanguage={transliterationLanguage}
      hindiMeanings={hindiMeanings}
    />
  );
}
