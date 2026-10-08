import { beforeEach, describe, expect, it, vi } from 'vitest';

const OLD_REQUEST = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

const state = vi.hoisted(() => ({
  // bucket -> every object path in it
  buckets: {} as Record<string, Set<string>>,
  listErrorFor: null as string | null,
  removeErrorFor: null as string | null,
  removeBatches: [] as Array<{ bucket: string; size: number }>,
  deletedTables: [] as string[],
  authDeleted: [] as string[],
  profileRow: null as { id: string; deletion_requested_at: string } | null,
}));

vi.mock('@/lib/apple-auth-service', () => ({ revokeAppleAuthorizationForUser: vi.fn(async () => 'not_found') }));
vi.mock('@/lib/admin', () => ({
  createServiceRoleSupabaseClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        lt: () => builder,
        maybeSingle: async () => ({ data: state.profileRow, error: null }),
        delete: () => { state.deletedTables.push(table); return builder; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: null, error: null }).then(resolve),
      };
      return builder;
    },
    auth: { admin: { deleteUser: async (id: string) => { state.authDeleted.push(id); return { error: null }; } } },
    storage: {
      from: (bucket: string) => ({
        // Mirrors Storage: one folder level per call, folders have a null id, paged by limit/offset.
        list: async (prefix: string, opts: { limit: number; offset: number }) => {
          if (state.listErrorFor === `${bucket}/${prefix}`) return { data: null, error: { message: 'list failed' } };
          const children = new Map<string, boolean>(); // name -> isFolder
          for (const path of state.buckets[bucket] ?? []) {
            if (!path.startsWith(`${prefix}/`)) continue;
            const [name, ...deeper] = path.slice(prefix.length + 1).split('/');
            children.set(name, (children.get(name) ?? false) || deeper.length > 0);
          }
          const entries = [...children].sort(([a], [b]) => a.localeCompare(b))
            .map(([name, isFolder]) => ({ name, id: isFolder ? null : `id-${prefix}/${name}` }));
          return { data: entries.slice(opts.offset, opts.offset + opts.limit), error: null };
        },
        remove: async (paths: string[]) => {
          if (state.removeErrorFor && paths.includes(state.removeErrorFor)) return { error: { message: 'remove failed' } };
          state.removeBatches.push({ bucket, size: paths.length });
          for (const path of paths) state.buckets[bucket]?.delete(path);
          return { error: null };
        },
      }),
    },
  }),
}));

import { purgeDeletedAccountById } from './account-deletion';

const ME = 'user-me';
const OTHER = 'user-other';
const fill = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => `${prefix}/file-${String(i).padStart(4, '0')}.m4a`);

beforeEach(() => {
  state.buckets = {};
  state.listErrorFor = null;
  state.removeErrorFor = null;
  state.removeBatches = [];
  state.deletedTables = [];
  state.authDeleted = [];
  state.profileRow = { id: ME, deletion_requested_at: OLD_REQUEST };
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('account purge: storage cleanup', () => {
  it('removes the user\'s own files from both buckets and nothing that belongs to anyone else', async () => {
    state.buckets = {
      avatars: new Set([`${ME}/avatar.jpg`, `profiles/${ME}/home_cover_1.jpg`, `${OTHER}/avatar.jpg`, 'kuls/kul-1/banner.jpg']),
      'pathshala-recordings': new Set([`${ME}/a.m4a`, `${OTHER}/a.m4a`]),
    };
    const result = await purgeDeletedAccountById(ME);

    expect(result).toMatchObject({ id: ME, success: true });
    expect([...state.buckets.avatars].sort()).toEqual(['kuls/kul-1/banner.jpg', `${OTHER}/avatar.jpg`]);
    expect([...state.buckets['pathshala-recordings']]).toEqual([`${OTHER}/a.m4a`]);
  });

  it('removes more files than one listing page, and files in nested folders', async () => {
    state.buckets = {
      'pathshala-recordings': new Set([
        ...fill(`${ME}`, 250),
        ...fill(`${ME}/lesson-1/take-2`, 120),
        `${OTHER}/keep.m4a`,
      ]),
    };
    await purgeDeletedAccountById(ME);

    expect([...state.buckets['pathshala-recordings']]).toEqual([`${OTHER}/keep.m4a`]);
  });

  it('removes in bounded batches rather than one oversized call', async () => {
    state.buckets = { 'pathshala-recordings': new Set(fill(ME, 250)) };
    await purgeDeletedAccountById(ME);
    expect(state.removeBatches.map((b) => b.size)).toEqual([100, 100, 50]);
  });

  it('keeps deletion pending when listing a storage prefix fails', async () => {
    state.buckets = {
      avatars: new Set([`${ME}/avatar.jpg`]),
      'pathshala-recordings': new Set([`${ME}/a.m4a`]),
    };
    state.listErrorFor = `avatars/${ME}`;
    const result = await purgeDeletedAccountById(ME);

    expect(result).toMatchObject({ id: ME, success: false, error: 'storage_cleanup_failed' });
    expect(state.buckets.avatars).toEqual(new Set([`${ME}/avatar.jpg`]));
    expect(state.buckets['pathshala-recordings']).toEqual(new Set([`${ME}/a.m4a`]));
    expect(state.authDeleted).toEqual([]);
    expect(state.deletedTables).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('[account-deletion] storage cleanup failed', { stage: 'storage_list_failed' });
  });

  it('keeps deletion pending when storage removal fails so the cron can retry', async () => {
    state.buckets = { 'pathshala-recordings': new Set([`${ME}/a.m4a`]) };
    state.removeErrorFor = `${ME}/a.m4a`;
    const result = await purgeDeletedAccountById(ME);

    expect(result).toMatchObject({ id: ME, success: false, error: 'storage_cleanup_failed' });
    expect(state.authDeleted).toEqual([]);
    expect(state.deletedTables).toEqual([]);
  });

  it('fails closed when an object path exceeds the supported folder depth', async () => {
    const deepPath = `${ME}/a/b/c/d/e/f/file.m4a`;
    state.buckets = { 'pathshala-recordings': new Set([deepPath]) };
    const result = await purgeDeletedAccountById(ME);

    expect(result).toMatchObject({ id: ME, success: false, error: 'storage_cleanup_failed' });
    expect(state.authDeleted).toEqual([]);
    expect(state.buckets['pathshala-recordings'].has(deepPath)).toBe(true);
    expect(console.error).toHaveBeenCalledWith('[account-deletion] storage cleanup failed', { stage: 'storage_folder_depth_exceeded' });
  });

  it('touches no storage while the cool-off is still running', async () => {
    state.profileRow = { id: ME, deletion_requested_at: new Date().toISOString() };
    state.buckets = { 'pathshala-recordings': new Set([`${ME}/a.m4a`]) };
    const result = await purgeDeletedAccountById(ME);

    expect(result).toMatchObject({ skipped: true, reason: 'cool_off_active' });
    expect(state.buckets['pathshala-recordings'].size).toBe(1);
    expect(state.authDeleted).toEqual([]);
  });
});
