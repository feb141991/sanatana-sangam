import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => { throw new Error('admin client must not be used in these tests'); } }));
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: vi.fn() }));

import {
  ensureAuthProfile,
  isDeletedUserProfileError,
  resolveAuthProfile,
} from './auth-profile';

type DbError = { code?: string; message?: string; details?: string } | null;

const USER = { id: '7aa3651c-0000-4000-8000-000000000000', email: 'seeker@example.com', user_metadata: {} };

/** A session-style client: the select chain returns `read`, the insert returns `insert`. */
function client(read: { data: unknown; error: DbError }, insert: { error: DbError } = { error: null }) {
  const insertFn = vi.fn().mockResolvedValue(insert);
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn().mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(read) }) }),
    insert: insertFn,
    update: () => ({ eq: updateEq }),
  });
  return { supabase: { from } as never, insertFn };
}

const FK_PROFILES: DbError = {
  code: '23503',
  message: 'insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"',
  details: 'Key (id)=(7aa3651c-0000-4000-8000-000000000000) is not present in table "users".',
};

describe('isDeletedUserProfileError', () => {
  it('matches only SQLSTATE 23503 that names profiles_id_fkey', () => {
    expect(isDeletedUserProfileError(FK_PROFILES)).toBe(true);
    // The constraint name may arrive in message or in details.
    expect(isDeletedUserProfileError({ code: '23503', message: 'violates foreign key', details: 'constraint "profiles_id_fkey"' })).toBe(true);
  });

  it('does not match another foreign key, another code, or an empty error', () => {
    expect(isDeletedUserProfileError({ code: '23503', message: 'violates foreign key constraint "profiles_active_symbol_id_fkey"' })).toBe(false);
    expect(isDeletedUserProfileError({ code: '23505', message: 'duplicate key value violates unique constraint "profiles_username_key"' })).toBe(false);
    expect(isDeletedUserProfileError({ code: '57014', message: 'canceling statement due to statement timeout' })).toBe(false);
    expect(isDeletedUserProfileError({ code: '23503' })).toBe(false);
    expect(isDeletedUserProfileError({ message: 'profiles_id_fkey' })).toBe(false);
    expect(isDeletedUserProfileError(null)).toBe(false);
    expect(isDeletedUserProfileError(undefined)).toBe(false);
  });
});

describe('resolveAuthProfile', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns ready without inserting when the profile already exists', async () => {
    const { supabase, insertFn } = client({ data: { id: USER.id, onboarding_completed: true, avatar_url: 'x' }, error: null });
    expect(await resolveAuthProfile(USER, supabase)).toEqual({ kind: 'ready', profile: { onboarding_completed: true } });
    expect(insertFn).not.toHaveBeenCalled();
  });

  it('inserts a missing profile and returns ready', async () => {
    const { supabase, insertFn } = client({ data: null, error: null });
    expect(await resolveAuthProfile(USER, supabase)).toEqual({ kind: 'ready', profile: { onboarding_completed: false } });
    expect(insertFn).toHaveBeenCalledTimes(1);
  });

  it('reports user_deleted when the insert violates profiles_id_fkey', async () => {
    const { supabase, insertFn } = client({ data: null, error: null }, { error: FK_PROFILES });
    expect(await resolveAuthProfile(USER, supabase)).toEqual({ kind: 'user_deleted' });
    expect(insertFn).toHaveBeenCalledTimes(1);
  });

  it('never reports user_deleted for a stalled or failing database', async () => {
    for (const error of [
      { code: '57014', message: 'canceling statement due to statement timeout' },
      { code: '08006', message: 'connection failure' },
      { code: '23503', message: 'violates foreign key constraint "profiles_active_symbol_id_fkey"' },
      { code: '23505', message: 'duplicate key value violates unique constraint "profiles_username_key"' },
      { code: undefined, message: 'fetch failed' },
    ] as DbError[]) {
      const { supabase } = client({ data: null, error: null }, { error });
      expect(await resolveAuthProfile(USER, supabase)).toEqual({ kind: 'unavailable' });
    }
  });

  it('treats a failed read as unavailable and does not try to insert', async () => {
    const { supabase, insertFn } = client({ data: null, error: { code: '57014', message: 'statement timeout' } });
    expect(await resolveAuthProfile(USER, supabase)).toEqual({ kind: 'unavailable' });
    expect(insertFn).not.toHaveBeenCalled();
  });

  it('is unavailable when there is no database client at all', async () => {
    expect(await resolveAuthProfile(USER)).toEqual({ kind: 'unavailable' });
  });
});

describe('ensureAuthProfile (compatibility wrapper)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('keeps returning the profile state for ready and null for every other outcome', async () => {
    expect(await ensureAuthProfile(USER, client({ data: null, error: null }).supabase)).toEqual({ onboarding_completed: false });
    expect(await ensureAuthProfile(USER, client({ data: null, error: null }, { error: FK_PROFILES }).supabase)).toBeNull();
    expect(await ensureAuthProfile(USER, client({ data: null, error: { code: '57014' } }).supabase)).toBeNull();
  });
});
