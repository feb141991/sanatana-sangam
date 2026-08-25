import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { loadMandaliDataForUser } from '@/lib/mandali-data-server';
import MandaliClient from './MandaliClient';

export default async function MandaliPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signup');

  const data = await loadMandaliDataForUser(user.id);
  return (
    <MandaliClient
      profile={data.profile}
      posts={data.posts}
      comments={data.comments}
      rsvps={data.rsvps}
      members={data.members}
      userId={user.id}
      blendedPosts={data.blendedPosts}
      userTradition={data.profile?.tradition ?? null}
    />
  );
}
