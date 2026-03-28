import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Check is_admin flag
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/home');

  // ── Fetch dashboard data ──────────────────────────────────────
  const [usersRes, reportsRes, postsRes, kulRes, mandaliRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, email, tradition, city, country, shloka_streak, seva_score, is_admin, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('content_reports')
      .select('*, reporter:profiles!content_reports_reported_by_fkey(full_name, username)')
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, content, type, created_at, mandali_id, author_id, profiles(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('kuls')
      .select('id, name, invite_code, avatar_emoji, created_at, created_by'),
    supabase
      .from('mandalis')
      .select('id, name, city, country, member_count')
      .order('member_count', { ascending: false }),
  ]);

  // Supabase infers joined relations as arrays; cast to the shapes AdminClient expects
  return (
    <AdminClient
      adminName={profile.full_name ?? 'Admin'}
      users={(usersRes.data   ?? []) as any}
      reports={(reportsRes.data ?? []) as any}
      posts={(postsRes.data   ?? []) as any}
      kuls={(kulRes.data      ?? []) as any}
      mandalis={(mandaliRes.data ?? []) as any}
    />
  );
}
