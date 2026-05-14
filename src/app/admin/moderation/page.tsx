import { createAdminClient } from '@/lib/supabase-admin';
import ModerationClient from './ModerationClient';

export default async function ModerationPage() {
  const supabase = createAdminClient();

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
