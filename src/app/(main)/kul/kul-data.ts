import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function getKulPageData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, kul_id, tradition, sampradaya, shloka_streak, spiritual_level')
    .eq('id', user.id)
    .single();

  let kulId = profile?.kul_id ?? null;
  
  // AUTO-RECOVER: If profile.kul_id is missing, check if the user is a member of any Kul.
  // We use the service role here because the RLS policy for kul_members_select
  // requires profiles.kul_id to be set (auth_kul_id()), which creates a catch-22.
  if (!kulId) {
    const { createServiceRoleSupabaseClient } = await import('@/lib/admin');
    const adminSupabase = createServiceRoleSupabaseClient();
    
    const { data: membership } = await adminSupabase
      .from('kul_members')
      .select('kul_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    
    if (membership?.kul_id) {
      kulId = membership.kul_id;
      // Proactively fix the profile link in the background (SECURITY DEFINER)
      supabase.rpc('repair_kul_membership').then(() => {});
    }
  }

  let kul = null;
  let members: any[] = [];
  let tasks: any[] = [];
  let messages: any[] = [];
  let familyMembers: any[] = [];
  let kulEvents: any[] = [];
  let myRole: 'guardian' | 'sadhak' = 'sadhak';

  if (kulId) {
    const [kulRes, membersRes, tasksRes, msgsRes, familyRes, eventsRes] = await Promise.all([
      supabase.from('kuls').select('*').eq('id', kulId).maybeSingle(),
      supabase.from('kul_members')
        .select('id, role, joined_at, user_id, profiles!kul_members_user_id_fkey(id, full_name, username, avatar_url, tradition, sampradaya, shloka_streak, spiritual_level, bio, city, country, home_town, gotra, kul_devata)')
        .eq('kul_id', kulId),
      supabase.from('kul_tasks')
        .select('*, assigned_by_profile:profiles!kul_tasks_assigned_by_fkey(full_name, username), assigned_to_profile:profiles!kul_tasks_assigned_to_fkey(full_name, username, avatar_url)')
        .eq('kul_id', kulId)
        .order('created_at', { ascending: false }),
      supabase.from('kul_messages')
        .select('*, profiles!kul_messages_sender_id_fkey(full_name, username, avatar_url)')
        .eq('kul_id', kulId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase.from('kul_family_members')
        .select('*')
        .eq('kul_id', kulId)
        .order('generation', { ascending: true })
        .order('display_order', { ascending: true }),
      supabase.from('kul_events')
        .select('*, member:kul_family_members(name, role)')
        .eq('kul_id', kulId)
        .order('event_date', { ascending: true }),
    ]);

    if (!kulRes.data && !kulRes.error) {
      // The Kul was deleted, but profile still had kul_id. Self-heal!
      await supabase.rpc('leave_kul');
    } else {
      kul = kulRes.data;
      members = membersRes.data ?? [];
      tasks = tasksRes.data ?? [];
      messages = (msgsRes.data ?? []).reverse();
      familyMembers = familyRes.data ?? [];
      kulEvents = eventsRes.data ?? [];
    }

    const myMembership = members.find((m: any) => m.user_id === user.id);
    if (myMembership?.role === 'guardian') myRole = 'guardian';
  }

  return {
    userId: user.id,
    userName: profile?.full_name ?? profile?.username ?? 'Sanatani',
    userProfile: profile,
    kul,
    members,
    tasks,
    messages,
    familyMembers,
    kulEvents,
    myRole,
  };
}

export type KulPageData = Awaited<ReturnType<typeof getKulPageData>>;
