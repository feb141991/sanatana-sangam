// Middleware already verified the admin session cookie before this page renders.
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createServiceRoleSupabaseClient();

  const [usersRes, reportsRes, postsRes, kulRes, mandaliRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, username, tradition, city, country, shloka_streak, seva_score, is_admin, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('content_reports')
      .select('*, reporter:profiles!content_reports_reported_by_fkey(full_name, username)')
      .order('created_at', { ascending: false }),
    supabase
      .from('posts')
      .select('id, content, type, created_at, mandali_id, author_id, profiles!posts_author_id_fkey(full_name, username)')
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
  const heroAssetsRes = await supabase
    .from('hero_assets')
    .select('id, label, hero_image, hero_alt, object_position, traditions, sampradayas, ishta_devatas, festival_slugs, tags, priority, is_active, created_at')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <AdminClient
      adminName="Admin"
      users={(usersRes.data   ?? []) as any}
      reports={(reportsRes.data ?? []) as any}
      posts={(postsRes.data   ?? []) as any}
      kuls={(kulRes.data      ?? []) as any}
      mandalis={(mandaliRes.data ?? []) as any}
      heroAssets={(heroAssetsRes.data ?? []) as any}
    />
  );
}
