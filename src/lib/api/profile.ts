import { createClient } from '@/lib/supabase';
import type { Database, Profile } from '@/types/database';

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function fetchProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, payload: ProfileUpdate) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}
