import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SanskaraClient from './SanskaraClient';

export default async function SanskaraPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Fetch profile (for tradition + DOB if available)
  const { data: profile } = await supabase
    .from('profiles')
    .select('kul_id, tradition, birth_date')
    .eq('id', user.id)
    .single();

  const kulId = profile?.kul_id ?? null;

  // Load completed records for this user
  let completed: Array<{
    sanskara_id: string;
    completed_date: string | null;
    notes: string | null;
    performed_by: string | null;
    location: string | null;
    kul_member_id: string | null;
    expected_date: string | null;
  }> = [];

  // Load Kul family members (for "record on behalf of" selector)
  let familyMembers: Array<{
    id: string;
    name: string;
    role: string | null;
    gender: string | null;
    birth_date: string | null;
    birth_year: number | null;
    is_alive: boolean;
    linked_user_id: string | null;
  }> = [];

  try {
    const { data } = await supabase
      .from('user_sanskaras')
      .select('sanskara_id, completed_date, notes, performed_by, location, kul_member_id, expected_date')
      .eq('user_id', user.id);
    completed = data ?? [];
  } catch { /* table may not have new columns yet — fallback is empty */ }

  if (kulId) {
    try {
      const { data } = await supabase
        .from('kul_family_members')
        .select('id, name, role, gender, birth_date, birth_year, is_alive, linked_user_id')
        .eq('kul_id', kulId)
        .order('generation', { ascending: true })
        .order('display_order', { ascending: true });
      familyMembers = data ?? [];
    } catch { /* kul has no family members yet */ }
  }

  return (
    <SanskaraClient
      userId={user.id}
      completed={completed}
      familyMembers={familyMembers}
      kulId={kulId}
      tradition={profile?.tradition ?? null}
      userBirthDate={profile?.birth_date ?? null}
    />
  );
}
