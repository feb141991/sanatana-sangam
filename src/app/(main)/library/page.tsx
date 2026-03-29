import { createServerSupabaseClient } from '@/lib/supabase-server';
import LibraryClient from './LibraryClient';
import { getTraditionMeta } from '@/lib/tradition-config';

export default async function LibraryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let defaultSection = 'all';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single();

    if (profile?.tradition) {
      defaultSection = getTraditionMeta(profile.tradition).librarySection;
    }
  }

  return <LibraryClient defaultSection={defaultSection} />;
}
