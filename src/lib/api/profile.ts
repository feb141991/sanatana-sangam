import { createClient } from '@/lib/supabase';
import type { Database, Profile } from '@/types/database';

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Columns that are managed exclusively by the server / Supabase RPCs and must
 * NEVER be sent through a client-side profile update. Sending any of these
 * could accidentally trigger database-level membership constraints or RLS guards.
 *
 *  kul_id      — updated atomically by create_kul / join_kul / leave_kul RPCs
 *  mandali_id  — auto-assigned by the on_profile_location_change trigger
 *  seva_score  — incremented by server-side task-completion logic
 *  is_admin    — set only by admins via the admin panel
 *  is_pro      — managed by subscription/payment webhooks
 *  is_banned   — managed by admin moderation actions
 *  ban_reason  — managed by admin moderation actions
 *  created_at  — immutable, set at insert time
 *  updated_at  — managed by the set_profiles_updated_at trigger
 */
const SERVER_MANAGED_COLUMNS = new Set<string>([
  'id',
  'kul_id',
  'mandali_id',
  'seva_score',
  'shloka_streak',
  'last_shloka_date',
  'is_admin',
  'is_pro',
  'is_banned',
  'ban_reason',
  'created_at',
  'updated_at',
  'last_seen',
  'is_deleting',
  'deletion_requested_at',
]);

function sanitizePayload(payload: ProfileUpdate): ProfileUpdate {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!SERVER_MANAGED_COLUMNS.has(key)) {
      safe[key] = value;
    }
  }
  return safe as ProfileUpdate;
}

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
  const safePayload = sanitizePayload(payload);

  const { data, error } = await supabase
    .from('profiles')
    .update(safePayload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile;
}

