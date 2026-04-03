import { createServerSupabaseClient } from '@/lib/supabase-server';
import LibraryClient from './LibraryClient';
import { getTraditionMeta } from '@/lib/tradition-config';
import {
  getBookmarkedStudySummaries,
  getContinueLearningSummary,
  type PathshalaUserStateRow,
} from '@/lib/pathshala-state';

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let defaultSection = 'all';
  let continueLearning = null;
  let bookmarkedEntries: ReturnType<typeof getBookmarkedStudySummaries> = [];

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single();

    if (profile?.tradition) {
      defaultSection = getTraditionMeta(profile.tradition).librarySection;
    }

    const { data: stateRows } = await supabase
      .from('pathshala_user_state')
      .select('entry_id, section_id, tradition, last_opened_at, bookmarked_at')
      .eq('user_id', user.id)
      .order('last_opened_at', { ascending: false })
      .limit(12);

    const resolvedRows = (stateRows ?? []) as PathshalaUserStateRow[];
    continueLearning = getContinueLearningSummary(resolvedRows);
    bookmarkedEntries = getBookmarkedStudySummaries(resolvedRows, 4);
  }

  return (
    <LibraryClient
      defaultSection={defaultSection}
      continueLearning={continueLearning}
      bookmarkedEntries={bookmarkedEntries}
    />
  );
}
