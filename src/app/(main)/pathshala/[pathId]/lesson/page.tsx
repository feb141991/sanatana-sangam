import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { getTraditionMeta } from '@/lib/tradition-config';
import { getPathLessons } from '@/lib/pathshala-lessons';
import { SEED_PATHS } from '@/lib/pathshala-paths';
import LessonClient from './LessonClient';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = await params;
  const supabase = await createServerSupabaseClient();

  // ── Auth + profile + enrollment in parallel ──────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: enrollment }] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, full_name, username, transliteration_language')
      .eq('id', user.id)
      .single(),
    supabase
      .from('guided_path_progress')
      .select('path_id, status, current_lesson, completed_lessons')
      .eq('user_id', user.id)
      .eq('path_id', pathId)
      .single(),
  ]);

  if (!enrollment || enrollment.status !== 'active') {
    redirect('/pathshala');
  }

  const tradition = profile?.tradition ?? 'hindu';
  const meta = getTraditionMeta(tradition);
  const transliterationLanguage = (profile as any)?.transliteration_language ?? 'en';

  // ── Hindi meanings (only for Hindi users) ────────────────────────────────
  let hindiMeanings: Record<string, string> = {};
  if (transliterationLanguage === 'hi') {
    const { data: hmRows } = await supabase
      .from('hindi_meanings')
      .select('entry_id, meaning_hi');
    if (hmRows) {
      for (const row of hmRows) hindiMeanings[row.entry_id] = row.meaning_hi;
    }
  }

  // ── Build lesson data SERVER-SIDE (keeps ~900 KB out of client bundle) ───
  const lessons = getPathLessons(pathId);
  const pathMeta = (SEED_PATHS as unknown as { id: string; title: string }[]).find(p => p.id === pathId);
  const pathTitle = pathMeta?.title ?? pathId;

  return (
    <LessonClient
      userId={user.id}
      pathId={pathId}
      pathTitle={pathTitle}
      tradition={tradition}
      accentColour={meta.accentColour}
      lessons={lessons}
      currentLesson={(enrollment as any).current_lesson ?? 0}
      completedLessons={((enrollment as any).completed_lessons as number[]) ?? []}
      transliterationLanguage={transliterationLanguage}
      hindiMeanings={hindiMeanings}
    />
  );
}
