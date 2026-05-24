import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SavedVersesClient from './SavedVersesClient';
import { getBookmarkedStudySummaries } from '@/lib/pathshala-state';
import type { PathshalaUserStateRow } from '@/lib/pathshala-state';

export default async function SavedVersesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: stateRows }, { data: profile }] = await Promise.all([
    supabase
      .from('pathshala_user_state')
      .select('entry_id, section_id, tradition, last_opened_at, bookmarked_at')
      .eq('user_id', user.id)
      .not('bookmarked_at', 'is', null)
      .order('bookmarked_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single(),
  ]);

  const rows = (stateRows ?? []) as PathshalaUserStateRow[];
  const saved = getBookmarkedStudySummaries(rows, 200); // no hard cap on this screen

  return (
    <SavedVersesClient
      saved={saved}
      tradition={profile?.tradition ?? 'hindu'}
    />
  );
}
