import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ModerationClient from './ModerationClient';

export default async function ModerationPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/home');
  }

  // Fetch reports
  const { data: reports } = await supabase
    .from('content_reports')
    .select(`
      *,
      reporter:profiles!reported_by(username, full_name, avatar_url),
      author:profiles!content_author_id(username, full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  return (
    <ModerationClient initialReports={reports || []} />
  );
}
