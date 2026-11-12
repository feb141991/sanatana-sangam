import { describe, expect, it } from 'vitest';

import { encodeFeedCursor } from './mandali-cursor';
import {
  PUBLIC_FEED_DEFAULT_LIMIT,
  PUBLIC_FEED_MAX_LIMIT,
  PublicFeedCursorError,
  clampPublicFeedLimit,
  loadPublicMandaliFeedPage,
  toPublicMandaliPost,
} from './mandali-public-feed';

// Founder decision 2026-11-12: a signed-out person may READ Mandali posts in the app. These tests pin what "read" means:
// posts only, no account ids, nothing from banned or deleting accounts, and a failed safety read shows nothing.

type Call = { table: string; ops: Array<[string, ...unknown[]]> };

function fakeAdmin(tables: Record<string, { data: unknown[] | null; error: { message: string } | null }>) {
  const calls: Call[] = [];
  const admin = {
    from(table: string) {
      const call: Call = { table, ops: [] };
      calls.push(call);
      const chain: Record<string, unknown> = {};
      for (const op of ['select', 'is', 'order', 'not', 'or', 'in', 'limit']) {
        chain[op] = (...args: unknown[]) => { call.ops.push([op, ...args]); return chain; };
      }
      chain.then = (resolve: (value: unknown) => unknown) => {
        // The first profiles read is the banned/deleting list (it uses .or); the second is the author lookup (.in).
        const key = table === 'profiles' ? (call.ops.some(([op]) => op === 'or') ? 'profiles:excluded' : 'profiles:authors') : table;
        return Promise.resolve(tables[key] ?? { data: [], error: null }).then(resolve);
      };
      return chain;
    },
  };
  return { admin: admin as never, calls };
}

const post = (n: number, over: Record<string, unknown> = {}) => ({
  id: `p${String(n).padStart(3, '0')}`, created_at: `2026-11-${String(10 + (n % 3)).padStart(2, '0')}T10:00:00Z`, type: 'update', content: `post ${n}`,
  upvotes: n, comment_count: 1, event_date: null, event_location: null, author_id: 'author-1', mandali_id: 'm-1', ...over,
});

describe('toPublicMandaliPost', () => {
  it('never carries an account id or a Mandali id', () => {
    const shaped = toPublicMandaliPost(post(1), { id: 'author-1', username: 'asha', avatar_url: null }, { id: 'm-1', name: 'Pune Mandali', city: 'Pune' }, undefined);
    expect(JSON.stringify(shaped)).not.toMatch(/author-1|m-1|author_id|mandali_id/);
    expect(shaped.author).toEqual({ name: 'asha', avatarUrl: null, isOfficial: false });
    expect(shaped.mandali).toEqual({ name: 'Pune Mandali', city: 'Pune' });
  });

  it('falls back to a neutral name when the author cannot be read, and never shows a negative count', () => {
    const shaped = toPublicMandaliPost(post(1, { upvotes: -3, comment_count: null }), undefined, undefined, undefined);
    expect(shaped.author.name).toBe('Seeker');
    expect([shaped.reactionCount, shaped.commentCount, shaped.mandali]).toEqual([0, 0, null]);
  });

  it('marks only the configured system author as official', () => {
    expect(toPublicMandaliPost(post(1), undefined, undefined, 'author-1').author.isOfficial).toBe(true);
    expect(toPublicMandaliPost(post(1), undefined, undefined, 'someone-else').author.isOfficial).toBe(false);
  });
});

describe('clampPublicFeedLimit', () => {
  it('keeps the page size within bounds', () => {
    expect(clampPublicFeedLimit(undefined)).toBe(PUBLIC_FEED_DEFAULT_LIMIT);
    expect(clampPublicFeedLimit(Number.NaN)).toBe(PUBLIC_FEED_DEFAULT_LIMIT);
    expect(clampPublicFeedLimit(0)).toBe(1);
    expect(clampPublicFeedLimit(10_000)).toBe(PUBLIC_FEED_MAX_LIMIT);
  });
});

describe('loadPublicMandaliFeedPage', () => {
  it('excludes daily prompt posts and anything by a banned or deleting account', async () => {
    const { admin, calls } = fakeAdmin({
      'profiles:excluded': { data: [{ id: 'banned-1' }, { id: 'deleting-1' }], error: null },
      posts: { data: [post(1)], error: null },
    });
    await loadPublicMandaliFeedPage({}, admin);
    const excluded = calls.find((call) => call.table === 'profiles' && call.ops.some(([op]) => op === 'or'))!;
    expect(excluded.ops).toContainEqual(['or', 'is_banned.eq.true,is_deleting.eq.true']);
    const posts = calls.find((call) => call.table === 'posts')!;
    expect(posts.ops).toContainEqual(['is', 'mandali_prompt_id', null]);
    expect(posts.ops).toContainEqual(['not', 'author_id', 'in', '(banned-1,deleting-1)']);
  });

  it('shows nothing when the banned/deleting list cannot be read', async () => {
    const { admin, calls } = fakeAdmin({ 'profiles:excluded': { data: null, error: { message: 'timeout' } }, posts: { data: [post(1)], error: null } });
    await expect(loadPublicMandaliFeedPage({}, admin)).rejects.toMatchObject({ message: 'timeout' });
    expect(calls.some((call) => call.table === 'posts')).toBe(false);
  });

  it('reads only the columns it shows: no vote, comment, poll, RSVP or member table is touched', async () => {
    const { admin, calls } = fakeAdmin({
      posts: { data: [post(1)], error: null },
      'profiles:authors': { data: [{ id: 'author-1', username: 'asha', avatar_url: null }], error: null },
      mandalis: { data: [{ id: 'm-1', name: 'Pune Mandali', city: 'Pune' }], error: null },
    });
    const page = await loadPublicMandaliFeedPage({}, admin);
    expect(new Set(calls.map((call) => call.table))).toEqual(new Set(['profiles', 'posts', 'mandalis']));
    const authors = calls.filter((call) => call.table === 'profiles').find((call) => call.ops.some(([op]) => op === 'in'))!;
    expect(authors.ops).toContainEqual(['select', 'id, username, avatar_url']);
    expect(page.posts).toHaveLength(1);
    expect(JSON.stringify(page)).not.toMatch(/author-1|"m-1"/);
  });

  it('pages by keyset: one extra row means there is a next page, and the cursor is applied', async () => {
    const rows = Array.from({ length: 4 }, (_, i) => post(i + 1));
    const first = fakeAdmin({ posts: { data: rows, error: null } });
    const page = await loadPublicMandaliFeedPage({ limit: 3 }, first.admin);
    expect(page.posts).toHaveLength(3);
    expect(page.nextCursor).toBe(encodeFeedCursor(rows[2].created_at, rows[2].id));
    expect(first.calls.find((call) => call.table === 'posts')!.ops).toContainEqual(['limit', 4]);

    const second = fakeAdmin({ posts: { data: [], error: null } });
    const last = await loadPublicMandaliFeedPage({ cursor: page.nextCursor, limit: 3 }, second.admin);
    expect(last).toEqual({ schemaVersion: 1, posts: [], nextCursor: null });
    expect(second.calls.find((call) => call.table === 'posts')!.ops)
      .toContainEqual(['or', `created_at.lt.${rows[2].created_at},and(created_at.eq.${rows[2].created_at},id.lt.${rows[2].id})`]);
  });

  it('refuses a cursor it cannot read instead of starting again from the top', async () => {
    const { admin, calls } = fakeAdmin({});
    await expect(loadPublicMandaliFeedPage({ cursor: '%%%' }, admin)).rejects.toBeInstanceOf(PublicFeedCursorError);
    expect(calls).toEqual([]);
  });
});
