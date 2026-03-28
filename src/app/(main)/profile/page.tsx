import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { count: threadCount } = await supabase
    .from('forum_threads')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id);

  const { count: postCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id);

  return (
    <ProfileClient
      profile={profile}
      threadCount={threadCount ?? 0}
      postCount={postCount ?? 0}
      userId={user.id}
      userEmail={user.email ?? ''}
    />
  );
}
