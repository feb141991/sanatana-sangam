import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type AuthProfileState = Pick<ProfileRow, 'onboarding_completed'> | null;

function profileName(user: User) {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.full_name === 'string' ? meta.full_name
    : typeof meta.name === 'string' ? meta.name
    : user.email?.split('@')[0];
  return name?.trim() || 'Shoonaya Seeker';
}

function profileUsername(user: User) {
  const meta = user.user_metadata ?? {};
  const raw = typeof meta.username === 'string' ? meta.username
    : user.email?.split('@')[0];
  const base = raw
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  return `${base || 'seeker'}_${user.id.slice(0, 8)}`;
}

export async function ensureAuthProfile(
  user: User,
  sessionSupabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<AuthProfileState> {
  const profile = {
    id: user.id,
    full_name: profileName(user),
    username: profileUsername(user),
    avatar_url: typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null,
    app_language: 'en',
    onboarding_completed: false,
  };

  const canUseAdmin = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = canUseAdmin ? createAdminClient() : sessionSupabase;

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    return { onboarding_completed: existing.onboarding_completed };
  }

  if (readError) {
    console.error('[auth-profile] profile read failed:', {
      userId: user.id.slice(0, 8),
      code: readError.code,
      message: readError.message,
    });
    return null;
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(profile);

  if (insertError) {
    console.error('[auth-profile] profile repair failed:', {
      userId: user.id.slice(0, 8),
      code: insertError.code,
      message: insertError.message,
    });
    return null;
  }

  return { onboarding_completed: profile.onboarding_completed };
}
