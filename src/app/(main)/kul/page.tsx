import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import KulClient from './KulClient';

export default async function KulPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Get profile with kul_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, kul_id, tradition, sampradaya, shloka_streak, spiritual_level')
    .eq('id', user.id)
    .single();

  const kulId = profile?.kul_id ?? null;

  // If user is in a kul, fetch all kul data in parallel
  let kul              = null;
  let members: any[]   = [];
  let tasks: any[]     = [];
  let messages: any[]  = [];
  let familyMembers: any[] = [];
  let kulEvents: any[] = [];
  let myRole: 'guardian' | 'sadhak' = 'sadhak';

  if (kulId) {
    const [kulRes, membersRes, tasksRes, msgsRes, familyRes, eventsRes] = await Promise.all([
      supabase.from('kuls').select('*').eq('id', kulId).single(),
      supabase.from('kul_members')
        .select('id, role, joined_at, user_id, profiles!kul_members_user_id_fkey(id, full_name, username, avatar_url, tradition, sampradaya, shloka_streak, spiritual_level)')
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

    kul           = kulRes.data;
    members       = membersRes.data ?? [];
    tasks         = tasksRes.data ?? [];
    messages      = (msgsRes.data ?? []).reverse();
    familyMembers = familyRes.data ?? [];
    kulEvents     = eventsRes.data ?? [];

    const myMembership = members.find((m: any) => m.user_id === user.id);
    if (myMembership?.role === 'guardian') myRole = 'guardian';
  }

  return (
    <KulClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      userProfile={profile}
      kul={kul}
      members={members}
      tasks={tasks}
      messages={messages}
      familyMembers={familyMembers}
      kulEvents={kulEvents}
      myRole={myRole}
    />
  );
}
