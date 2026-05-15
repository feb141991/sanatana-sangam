import { createClient } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type KulSummary = {
  id: string;
  name: string;
  invite_code: string;
  avatar_emoji: string;
  cover_url: string | null;
  created_by: string;
  created_at: string;
};

export type KulMemberRow = {
  id: string;
  role: 'guardian' | 'sadhak';
  joined_at: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    tradition: string | null;
    sampradaya: string | null;
    shloka_streak: number | null;
    spiritual_level: string | null;
    bio?: string | null;
    city?: string | null;
    country?: string | null;
    home_town?: string | null;
    gotra?: string | null;
    kul_devata?: string | null;
    is_banned?: boolean;
    ban_reason?: string | null;
  } | null;
};

export type KulTaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  content_ref: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  score: number | null;
  guardian_note: string | null;
  assigned_by: string;
  assigned_to: string;
  created_at: string;
  assigned_to_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
  assigned_by_profile: { full_name: string | null; username: string | null } | null;
};

export type KulMessageRow = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  reaction: string | null;
  profiles: { full_name: string | null; username: string | null; avatar_url: string | null };
};

export type KulFamilyMember = {
  id: string;
  kul_id: string;
  name: string;
  role: string | null;
  gender: string | null;
  birth_year: number | null;
  birth_date: string | null;
  death_year: number | null;
  death_date: string | null;
  marriage_date: string | null;
  parent_id: string | null;
  spouse_id: string | null;
  linked_user_id: string | null;
  notes: string | null;
  photo_url: string | null;
  is_alive: boolean;
  generation: number | null;
  display_order: number | null;
};

export type KulEvent = {
  id: string;
  kul_id: string;
  title: string;
  event_type: string;
  event_date: string;
  recurring: boolean;
  description: string | null;
  member_id: string | null;
  member: { name: string; role: string | null } | null;
};

export type KulData = {
  userId: string;
  userName: string;
  userProfile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    kul_id: string | null;
    tradition: string | null;
    sampradaya: string | null;
    shloka_streak: number | null;
    spiritual_level: string | null;
    is_banned?: boolean;
    ban_reason?: string | null;
  } | null;
  kul: KulSummary | null;
  members: KulMemberRow[];
  tasks: KulTaskRow[];
  messages: KulMessageRow[];
  familyMembers: KulFamilyMember[];
  kulEvents: KulEvent[];
  myRole: 'guardian' | 'sadhak';
};

export type SaveKulFamilyMemberPayload = {
  kulId: string;
  memberId?: string;
  name: string;
  role?: string | null;
  gender?: string | null;
  birth_year?: number | null;
  birth_date?: string | null;
  death_year?: number | null;
  death_date?: string | null;
  marriage_date?: string | null;
  parent_id?: string | null;
  spouse_id?: string | null;
  generation?: number | null;
  notes?: string | null;
  is_alive: boolean;
  // Link to an existing Sangam user account (null = person is not on the app)
  linked_user_id?: string | null;
};

export type SaveKulEventPayload = {
  kulId: string;
  title: string;
  event_type: string;
  event_date: string;
  description?: string | null;
  member_id?: string | null;
  recurring: boolean;
};

export async function fetchKulData(userId: string): Promise<KulData> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, kul_id, tradition, sampradaya, shloka_streak, spiritual_level, is_banned, ban_reason')
    .eq('id', userId)
    .single();

  let kulId = profile?.kul_id ?? null;

  // AUTO-RECOVER: If profile.kul_id is missing, check if the user is a member of any Kul.
  // This ensures that even if Step 3 of join_kul/create_kul failed (or was cleared),
  // the user can still access their Kul dashboard.
  if (!kulId) {
    const { data: membership } = await supabase
      .from('kul_members')
      .select('kul_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (membership?.kul_id) {
      kulId = membership.kul_id;
      // Proactively fix the profile link in the background via RPC (bypasses REVOKE)
      supabase.rpc('repair_kul_membership').then(() => {});
    }
  }

  let kul: KulSummary | null = null;
  let members: KulMemberRow[] = [];
  let tasks: KulTaskRow[] = [];
  let messages: KulMessageRow[] = [];
  let familyMembers: KulFamilyMember[] = [];
  let kulEvents: KulEvent[] = [];
  let myRole: 'guardian' | 'sadhak' = 'sadhak';

  if (kulId) {
    const [kulRes, membersRes, tasksRes, msgsRes, familyRes, eventsRes] = await Promise.all([
      supabase.from('kuls').select('*').eq('id', kulId).single(),
      supabase.from('kul_members')
        .select('id, role, joined_at, user_id, profiles!kul_members_user_id_fkey(id, full_name, username, avatar_url, tradition, sampradaya, shloka_streak, spiritual_level, bio, city, country, home_town, gotra, kul_devata, is_banned, ban_reason)')
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

    kul = (kulRes.data as KulSummary | null) ?? null;
    members = ((membersRes.data ?? []) as any[]).map((row) => ({
      ...row,
      profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : (row.profiles ?? null),
    })) as KulMemberRow[];
    tasks = (tasksRes.data ?? []) as KulTaskRow[];
    messages = ((msgsRes.data ?? []) as KulMessageRow[]).reverse();
    familyMembers = (familyRes.data ?? []) as KulFamilyMember[];
    kulEvents = (eventsRes.data ?? []) as KulEvent[];

    const myMembership = members.find((member) => member.user_id === userId);
    if (myMembership?.role === 'guardian') {
      myRole = 'guardian';
    }
  }

  return {
    userId,
    userName: profile?.full_name ?? profile?.username ?? 'Sanatani',
    userProfile: profile ?? null,
    kul,
    members,
    tasks,
    messages,
    familyMembers,
    kulEvents,
    myRole,
  };
}

export async function createKul(payload: { name: string; emoji: string }) {
  const supabase = createClient();
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const { data, error } = await supabase.rpc('create_kul', {
    p_name: payload.name.trim(),
    p_emoji: payload.emoji,
    p_invite_code: inviteCode,
  });

  if (error) throw error;
  return data;
}

export async function joinKul(inviteCode: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('join_kul', { p_invite_code: inviteCode.trim().toUpperCase() });
  if (error) throw error;
  return data as { avatar_emoji: string; name: string } | null;
}

export async function renameKul(kulId: string, name: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('kuls')
    .update({ name: name.trim() })
    .eq('id', kulId);
  if (error) throw error;
}

export async function updateKul(kulId: string, updates: { name?: string; avatar_emoji?: string; cover_url?: string | null }) {
  const supabase = createClient();
  const { error } = await supabase.from('kuls').update(updates).eq('id', kulId);
  if (error) throw error;
}

export async function promoteKulMember(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_members').update({ role: 'guardian' }).eq('id', memberId);
  if (error) throw error;
}

export async function removeKulMember(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function leaveKul() {
  const supabase = createClient();
  const { error } = await supabase.rpc('leave_kul');
  if (error) throw error;
}

export async function assignKulTask(payload: {
  kulId: string;
  userId: string;
  title: string;
  description?: string | null;
  taskType: string;
  assignTo: string;
  dueDate?: string | null;
}) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_tasks').insert({
    kul_id: payload.kulId,
    assigned_by: payload.userId,
    assigned_to: payload.assignTo,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    task_type: payload.taskType,
    due_date: payload.dueDate || null,
  });
  if (error) throw error;
}

export async function completeKulTask(taskId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('kul_tasks')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;

  const { data: profile } = await supabase.from('profiles').select('seva_score').eq('id', userId).single();
  if (profile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ seva_score: (profile.seva_score ?? 0) + 10 })
      .eq('id', userId);
    if (updateError) throw updateError;
  }
}

export async function sendKulMessage(kulId: string, userId: string, content: string) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_messages').insert({ kul_id: kulId, sender_id: userId, content: content.trim() });
  if (error) throw error;
}

export async function reactToKulMessage(messageId: string, emoji: string) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_messages').update({ reaction: emoji }).eq('id', messageId);
  if (error) throw error;
}

export async function saveKulFamilyMember(userId: string, payload: SaveKulFamilyMemberPayload) {
  const supabase = createClient();

  const row = {
    kul_id:         payload.kulId,
    name:           payload.name.trim(),
    role:           payload.role?.trim() || null,
    gender:         payload.gender || null,
    birth_year:     payload.birth_year ?? null,
    birth_date:     payload.birth_date || null,
    death_year:     payload.death_year ?? null,
    death_date:     payload.death_date || null,
    marriage_date:  payload.marriage_date || null,
    parent_id:      payload.parent_id || null,
    spouse_id:      payload.spouse_id || null,
    generation:     payload.generation ?? 4,
    notes:          payload.notes?.trim() || null,
    is_alive:       payload.is_alive,
    created_by:     userId,
    linked_user_id: payload.linked_user_id ?? null,
  };

  if (payload.memberId) {
    const { error } = await supabase.from('kul_family_members').update(row).eq('id', payload.memberId);
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.from('kul_family_members').insert(row).select().single();
  if (error) throw error;

  const newMember = data as KulFamilyMember;

  if (payload.birth_date) {
    const { error: birthError } = await supabase.from('kul_events').insert({
      kul_id: payload.kulId,
      member_id: newMember.id,
      created_by: userId,
      title: `${payload.name.trim()}'s Birthday`,
      event_type: 'birthday',
      event_date: payload.birth_date,
      recurring: true,
    });
    if (birthError) throw birthError;
  }

  if (payload.marriage_date) {
    const { error: marriageError } = await supabase.from('kul_events').insert({
      kul_id: payload.kulId,
      member_id: newMember.id,
      created_by: userId,
      title: `${payload.name.trim()}'s Anniversary`,
      event_type: 'anniversary',
      event_date: payload.marriage_date,
      recurring: true,
    });
    if (marriageError) throw marriageError;
  }
}

export async function deleteKulFamilyMember(memberId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_family_members').delete().eq('id', memberId);
  if (error) throw error;
}

export async function saveKulEvent(userId: string, payload: SaveKulEventPayload) {
  const supabase = createClient();
  const { error } = await supabase.from('kul_events').insert({
    kul_id: payload.kulId,
    created_by: userId,
    title: payload.title.trim(),
    event_type: payload.event_type,
    event_date: payload.event_date,
    description: payload.description?.trim() || null,
    member_id: payload.member_id || null,
    recurring: payload.recurring,
  });
  if (error) throw error;
}
