import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type AuthProfileState = Pick<ProfileRow, 'onboarding_completed'> | null;

type AuthProfileUser = Pick<User, 'id' | 'email' | 'user_metadata'>;

function profileName(user: AuthProfileUser) {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.full_name === 'string' ? meta.full_name
    : typeof meta.name === 'string' ? meta.name
    : user.email?.split('@')[0];
  return name?.trim() || 'Shoonaya Seeker';
}

export function profileAvatarUrl(user: AuthProfileUser): string | null {
  const meta = user.user_metadata ?? {};
  if (typeof meta.avatar_url === "string" && meta.avatar_url.trim()) {
    return meta.avatar_url.trim();
  }
  if (typeof meta.picture === "string" && meta.picture.trim()) {
    return meta.picture.trim();
  }
  return null;
}

function profileUsername(user: AuthProfileUser) {
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

/**
 * Why a profile could not be made available. `user_deleted` is a fact the
 * database stated (the auth.users row this profile must reference is gone), so
 * a caller may answer 401. `unavailable` is everything else -- a stall, a
 * timeout, a missing client, an unrelated constraint -- and stays a retryable
 * 503: a slow database must never sign anybody out.
 */
export type AuthProfileOutcome =
  | { kind: 'ready'; profile: NonNullable<AuthProfileState> }
  | { kind: 'user_deleted' }
  | { kind: 'unavailable' };

/**
 * True only for the foreign-key violation raised when `profiles.id` has no
 * matching `auth.users` row: SQLSTATE 23503 naming `profiles_id_fkey`. Any
 * other 23503 (a different table's constraint) or any other code is not
 * evidence that the account is gone.
 */
export function isDeletedUserProfileError(
  error: { code?: string | null; message?: string | null; details?: string | null } | null | undefined,
): boolean {
  if (!error || error.code !== '23503') return false;
  return `${error.message ?? ''} ${error.details ?? ''}`.includes('profiles_id_fkey');
}

export async function resolveAuthProfile(
  user: AuthProfileUser,
  sessionSupabase?: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<AuthProfileOutcome> {
  const profile = {
    id: user.id,
    full_name: profileName(user),
    username: profileUsername(user),
    avatar_url: profileAvatarUrl(user),
    app_language: 'en',
    onboarding_completed: false,
  };

  const canUseAdmin = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = canUseAdmin ? createAdminClient() : sessionSupabase;

  if (!supabase) {
    console.error('[auth-profile] profile repair is unavailable: no database client');
    return { kind: 'unavailable' };
  }

  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('id, onboarding_completed, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    const avatarUrl = profileAvatarUrl(user);
    if (!existing.avatar_url && avatarUrl) {
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    }
    return { kind: 'ready', profile: { onboarding_completed: existing.onboarding_completed } };
  }

  if (readError) {
    console.error('[auth-profile] profile read failed:', {
      userId: user.id.slice(0, 8),
      code: readError.code,
      message: readError.message,
    });
    return { kind: 'unavailable' };
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(profile);

  if (insertError) {
    if (isDeletedUserProfileError(insertError)) {
      // The token is still valid (JWKS verification is local) but the account
      // was deleted. Not an outage: log it apart from [profile repair failed]
      // so a deleted-account burst is not mistaken for database trouble.
      console.warn('[auth-profile] session belongs to a deleted account:', {
        userId: user.id.slice(0, 8),
        code: insertError.code,
      });
      return { kind: 'user_deleted' };
    }
    console.error('[auth-profile] profile repair failed:', {
      userId: user.id.slice(0, 8),
      code: insertError.code,
      message: insertError.message,
    });
    return { kind: 'unavailable' };
  }

  return { kind: 'ready', profile: { onboarding_completed: profile.onboarding_completed } };
}

/**
 * Compatibility wrapper: null for every non-ready outcome. Callers serving a
 * native session (home-summary, progress-summary, profile/bootstrap) use
 * `resolveAuthProfile` to tell a deleted account from an outage; the web
 * sign-in callbacks (auth/callback, auth/destination) handle freshly
 * authenticated users, who cannot be deleted accounts, and keep this form.
 */
export async function ensureAuthProfile(
  user: AuthProfileUser,
  sessionSupabase?: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<AuthProfileState> {
  const outcome = await resolveAuthProfile(user, sessionSupabase);
  return outcome.kind === 'ready' ? outcome.profile : null;
}
