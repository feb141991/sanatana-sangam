import ScoreboardClient from './ScoreboardClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function ScoreboardPage() {
  const supabase = await createServerSupabaseClient();
  
  // Fetch top 50 users by seva_score
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, seva_score, tradition, is_pro')
    .order('seva_score', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching scoreboard:', error);
  }

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ScoreboardClient 
      initialUsers={users || []} 
      currentUserId={user?.id}
    />
  );
}
