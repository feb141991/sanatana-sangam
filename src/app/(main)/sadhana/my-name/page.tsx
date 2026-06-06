import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import MyNameClient from './MyNameClient';

export const metadata = {
  title: 'Dharmic Name Story — Shoonaya',
  description: 'Discover and share the spiritual etymology and scripture of your name.',
};

export default async function MyNamePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResult, nameStoryResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, full_name, username')
      .eq('id', user.id)
      .single(),
    supabase
      .from('name_stories')
      .select('id, user_id, name_input, tradition, etymology_text, deity_connection, origin_tradition, historical_bearers, meaning_summary, scripture_line, scripture_source, generated_at, is_public, share_slug')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const profile = profileResult.data;
  const initialStory = nameStoryResult.data || null;

  const tradition = profile?.tradition ?? 'all';
  const userName = profile?.full_name || profile?.username || '';

  return (
    <MyNameClient
      userId={user.id}
      initialTradition={tradition}
      initialUserName={userName}
      initialStory={initialStory}
    />
  );
}
