import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ rows: {} as Record<string, Record<string, unknown>[]>, failures: new Set<string>() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', () => ({ after: vi.fn() }));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => client }));
vi.mock('@/lib/mandali-prompt-admin', () => ({ createMandaliPromptAdminClient: () => client }));
import { loadMandaliNotificationTarget } from './mandali-data-server';

class Query {
  rows: Record<string, unknown>[];
  single = false;
  constructor(readonly table: string) { this.rows = [...(db.rows[table] ?? [])]; }
  select() { return this; }
  eq(key: string, value: unknown) { this.rows = this.rows.filter((r) => r[key] === value); return this; }
  is(key: string, value: unknown) { return this.eq(key, value); }
  in(key: string, values: unknown[]) { this.rows = this.rows.filter((r) => values.includes(r[key])); return this; }
  or(expression: string) {
    this.rows = this.rows.filter((r) => expression.split(',').some((part) => {
      const [key, , value] = part.split('.'); return r[key] === value;
    })); return this;
  }
  maybeSingle() { this.single = true; return this; }
  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    resolve?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve({ data: this.single ? this.rows[0] ?? null : this.rows,
      error: db.failures.has(this.table) ? { code: 'XX001' } : null }).then(resolve, reject);
  }
}
const client = { from: (table: string) => new Query(table), rpc: () => Promise.resolve({ data: [], error: null }) };
const userId = 'viewer';

beforeEach(() => {
  db.failures.clear();
  db.rows = {
    profiles: [{ id: userId, mandali_id: 'circle', app_language: 'en', is_banned: false, is_deleting: false },
      { id: 'author', username: 'PublicName', full_name: 'Private Name', avatar_url: null }],
    posts: [{ id: 'post', author_id: 'author', mandali_id: 'circle', content: 'Target', mandali_prompt_id: null }],
    post_comments: [{ id: 'comment', post_id: 'post', author_id: 'author', body: 'Reply', deleted_at: null }],
    mandali_connections: [{ id: 'request', requester_id: 'author', recipient_id: userId, status: 'pending', created_at: '2026-10-29' }],
  };
});

describe('notification target access', () => {
  it('loads the exact post outside the first feed page with public identity only', async () => {
    const result = await loadMandaliNotificationTarget(userId, { postId: 'post', commentId: 'comment' });
    expect(result).toMatchObject({ kind: 'post', post: { id: 'post', profiles: { full_name: 'PublicName' } }, comment: { id: 'comment' } });
    expect(JSON.stringify(result)).not.toContain('Private Name');
  });
  it.each(['other-circle', null])('denies membership mismatch %s', async (mandaliId) => {
    db.rows.profiles[0].mandali_id = mandaliId;
    expect(await loadMandaliNotificationTarget(userId, { postId: 'post' })).toBeNull();
  });
  it.each(['is_banned', 'is_deleting'])('denies %s', async (field) => {
    db.rows.profiles[0][field] = true;
    expect(await loadMandaliNotificationTarget(userId, { postId: 'post' })).toBeNull();
  });
  it.each(['viewer-blocks', 'author-blocks', 'muted', 'hidden-post', 'hidden-comment'])('denies %s', async (reason) => {
    if (reason === 'viewer-blocks') db.rows.user_blocked_profiles = [{ blocker_id: userId, blocked_user_id: 'author' }];
    if (reason === 'author-blocks') db.rows.user_blocked_profiles = [{ blocker_id: 'author', blocked_user_id: userId }];
    if (reason === 'muted') db.rows.user_muted_profiles = [{ muter_id: userId, muted_user_id: 'author' }];
    if (reason === 'hidden-post') db.rows.user_hidden_content = [{ user_id: userId, content_type: 'mandali_post', content_id: 'post' }];
    if (reason === 'hidden-comment') db.rows.user_hidden_content = [{ user_id: userId, content_type: 'mandali_comment', content_id: 'comment' }];
    expect(await loadMandaliNotificationTarget(userId, { postId: 'post', commentId: 'comment' })).toBeNull();
  });
  it.each(['profiles', 'posts', 'user_blocked_profiles', 'user_muted_profiles', 'user_hidden_content'])('fails closed on %s query errors', async (table) => {
    db.failures.add(table);
    await expect(loadMandaliNotificationTarget(userId, { postId: 'post' })).rejects.toMatchObject({ code: 'XX001' });
  });
  it('rejects deleted comments and comment IDs belonging to a different post', async () => {
    db.rows.post_comments[0].deleted_at = '2026-10-29';
    expect(await loadMandaliNotificationTarget(userId, { postId: 'post', commentId: 'comment' })).toBeNull();
    db.rows.post_comments[0].deleted_at = null;
    db.rows.post_comments[0].post_id = 'another-post';
    expect(await loadMandaliNotificationTarget(userId, { postId: 'post', commentId: 'comment' })).toBeNull();
  });
  it('returns current connection status to a participant', async () => {
    expect(await loadMandaliNotificationTarget(userId, { requestId: 'request' })).toMatchObject({ kind: 'request', request: { id: 'request', status: 'pending' } });
    db.rows.mandali_connections[0].status = 'accepted';
    expect(await loadMandaliNotificationTarget(userId, { requestId: 'request' })).toMatchObject({ request: { status: 'accepted' } });
  });
  it('names the other person, from either side of the request, by public username only', async () => {
    db.rows.profiles.push({ id: 'viewer-is-requester-peer', username: 'PeerPublic', full_name: 'Peer Private', avatar_url: null });
    const asRecipient = await loadMandaliNotificationTarget(userId, { requestId: 'request' });
    expect(asRecipient).toMatchObject({ request: { counterparty: { username: 'PublicName', full_name: 'PublicName' } } });
    // The viewer is the requester (an accepted/declined notification): the person shown is the recipient, not the viewer.
    db.rows.mandali_connections[0] = { id: 'request', requester_id: userId, recipient_id: 'viewer-is-requester-peer', status: 'accepted', created_at: '2026-10-29' };
    const asRequester = await loadMandaliNotificationTarget(userId, { requestId: 'request' });
    expect(asRequester).toMatchObject({ request: { status: 'accepted', counterparty: { username: 'PeerPublic' } } });
    expect(JSON.stringify(asRequester)).not.toContain('Peer Private');
    expect(JSON.stringify(asRequester)).not.toContain('"requester":');
  });
  it('does not expose another pair’s request or a blocked connection', async () => {
    db.rows.mandali_connections[0].recipient_id = 'someone-else';
    expect(await loadMandaliNotificationTarget(userId, { requestId: 'request' })).toBeNull();
    db.rows.mandali_connections[0].recipient_id = userId;
    db.rows.user_blocked_profiles = [{ blocker_id: 'author', blocked_user_id: userId }];
    expect(await loadMandaliNotificationTarget(userId, { requestId: 'request' })).toBeNull();
  });
});
