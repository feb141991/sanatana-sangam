import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SanskaraClient from './SanskaraClient';

export default async function SanskaraPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Load any existing records for this user
  // Table: user_sanskaras(id, user_id, sanskara_id, completed_date, notes, performed_by, location)
  // Falls back to empty array if table doesn't exist yet
  let completed: Array<{
    sanskara_id: string;
    completed_date: string | null;
    notes: string | null;
    performed_by: string | null;
    location: string | null;
  }> = [];

  try {
    const { data } = await supabase
      .from('user_sanskaras')
      .select('sanskara_id, completed_date, notes, performed_by, location')
      .eq('user_id', user.id);
    completed = data ?? [];
  } catch {
    // Table may not exist yet in production — show empty state gracefully
  }

  return <SanskaraClient userId={user.id} completed={completed} />;
}
