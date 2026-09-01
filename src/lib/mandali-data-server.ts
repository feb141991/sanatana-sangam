import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { filterAuthoredItems, filterProfileRows, getUserSafetyState, type UserSafetyState } from '@/lib/user-safety';
import { decodeFeedCursor, encodeFeedCursor, formatIdListLiteral } from '@/lib/mandali-cursor';
import type { MandaliCommentPreview, MandaliData, MandaliFeedPage, MandaliFeedPost, MandaliProfile, MandaliPublicIdentity } from '@/lib/mandali-contract';
import type { EventRsvp, Post, PostComment, PostCommentWithAuthor, PostWithAuthor, Profile } from '@/types/database';

const BLEND_THRESHOLD = 5;
const FEED_PAGE_DEFAULT_LIMIT = 20;
const FEED_PAGE_MAX_LIMIT = 50;
const COMMENT_PREVIEW_COUNT = 2;

type SafeAuthor = Pick<Profile, 'id' | 'username' | 'avatar_url'>;

function authorRelation(author?: SafeAuthor): PostWithAuthor['profiles'] {
  return {
    full_name: author?.username ?? 'Seeker',
    username: author?.username ?? 'seeker',
    avatar_url: author?.avatar_url ?? null,
    sampradaya: null,
    spiritual_level: null,
  };
}

function commentAuthorRelation(author?: SafeAuthor): PostCommentWithAuthor['profiles'] {
  return {
    full_name: author?.username ?? 'Seeker',
    username: author?.username ?? 'seeker',
    avatar_url: author?.avatar_url ?? null,
  };
}

async function loadSafeAuthors(ids: string[]) {
  if (ids.length === 0) return new Map<string, SafeAuthor>();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', Array.from(new Set(ids)));
  if (error) throw error;
  const rows = (data ?? []) as unknown as SafeAuthor[];
  return new Map(rows.map((row) => [row.id, row]));
}

async function hydratePosts(rows: Post[]) {
  const authorMap = await loadSafeAuthors(rows.map((row) => row.author_id));
  return rows.map((row) => ({ ...row, profiles: authorRelation(authorMap.get(row.author_id)) }));
}

async function hydrateComments(rows: PostComment[]) {
  const authorMap = await loadSafeAuthors(rows.map((row) => row.author_id));
  return rows.map((row) => ({
    ...row,
    // deleted_at is set but the original body is kept in the DB for
    // moderation/audit history -- it must never reach another user's
    // client, so it's blanked here rather than relying on every consumer
    // to remember to check deleted_at before rendering row.body.
    body: row.deleted_at ? '' : row.body,
    profiles: commentAuthorRelation(authorMap.get(row.author_id)),
  }));
}

export async function loadMandaliDataForUser(userId: string): Promise<MandaliData> {
  const admin = createAdminClient();
  const [profileResult, safetyState] = await Promise.all([
    admin.from('profiles').select('*, mandalis(name, city, country, member_count)').eq('id', userId).single(),
    getUserSafetyState(admin, userId),
  ]);
  const { error: profileError } = profileResult;
  const profile = profileResult.data as unknown as NonNullable<MandaliProfile>;
  if (profileError) throw profileError;

  const mandaliId = profile?.mandali_id;
  if (!mandaliId) {
    return { profile: profile as MandaliProfile, posts: [], comments: [], rsvps: [], members: [], blendedPosts: [] };
  }

  const [{ data: postRows, error: postsError }, { data: memberRows, error: membersError }] = await Promise.all([
    admin.from('posts').select('*').eq('mandali_id', mandaliId).order('created_at', { ascending: false }).limit(30),
    admin.from('profiles').select('id, username, avatar_url, seva_score').eq('mandali_id', mandaliId).order('seva_score', { ascending: false }).limit(50),
  ]);
  if (postsError) throw postsError;
  if (membersError) throw membersError;

  const filteredPostRows = filterAuthoredItems((postRows ?? []) as Post[], 'mandali_post', safetyState);
  const members = filterProfileRows((memberRows ?? []) as MandaliPublicIdentity[], safetyState);
  const needsBlend = members.length < BLEND_THRESHOLD;

  const { data: blendedRows, error: blendError } = await (needsBlend
      ? admin.from('posts').select('*').neq('mandali_id', mandaliId).order('created_at', { ascending: false }).limit(15)
      : Promise.resolve({ data: [] as Post[], error: null }));
  if (blendError) throw blendError;

  const safeBlendedRows = filterAuthoredItems((blendedRows ?? []) as Post[], 'mandali_post', safetyState);
  const postIds = [...filteredPostRows, ...safeBlendedRows].map((post) => post.id);
  const [{ data: commentRows, error: commentsError }, { data: rsvpRows, error: rsvpsError }] = await Promise.all([
    postIds.length
      ? admin.from('post_comments').select('*').in('post_id', postIds).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as PostComment[], error: null }),
    postIds.length
      ? admin.from('event_rsvps').select('id, post_id, user_id, status, created_at, updated_at').in('post_id', postIds)
      : Promise.resolve({ data: [] as EventRsvp[], error: null }),
  ]);
  if (commentsError) throw commentsError;
  if (rsvpsError) throw rsvpsError;
  const [posts, comments, blendedPosts] = await Promise.all([
    hydratePosts(filteredPostRows),
    hydrateComments((commentRows ?? []) as PostComment[]),
    hydratePosts(safeBlendedRows),
  ]);

  return {
    profile: profile as MandaliProfile,
    posts,
    comments,
    rsvps: (rsvpRows ?? []) as EventRsvp[],
    members,
    blendedPosts,
  };
}

// ── Keyset-paginated feed page ───────────────────────────────────────────
//
// Distinct from loadMandaliDataForUser above (kept as-is for the web SSR
// page and its default, non-cursor client refetch). This is the opt-in
// contract used by /api/mandali/feed when called with ?cursor/?limit --
// currently that's the native client. See the Home/Mandali performance
// review this was built for: bounded page size, comment previews instead
// of every comment, viewer reaction inlined, safety exclusions pushed into
// the query instead of filtered out after the fact (so a returned page is
// actually the size it claims to be).

/**
 * Applies the same author-exclusion (blocked/muted) and hidden-content
 * exclusion that filterAuthoredItems/filterProfileRows apply in-memory
 * elsewhere in this file, but as SQL predicates -- so a paginated page
 * comes back with (up to) exactly `limit` rows instead of shrinking after
 * an in-memory filter drops some of them.
 */
function applySafetyExclusions<T extends { eq: Function; not: Function }>(
  query: T,
  safetyState: UserSafetyState,
  contentType: 'mandali_post',
): T {
  let next = query;
  if (safetyState.excludedAuthorIds.size > 0) {
    next = next.not('author_id', 'in', formatIdListLiteral(Array.from(safetyState.excludedAuthorIds))) as T;
  }
  const hiddenIds = safetyState.hiddenRows
    .filter((row) => row.content_type === contentType)
    .map((row) => row.content_id);
  if (hiddenIds.length > 0) {
    next = next.not('id', 'in', formatIdListLiteral(hiddenIds)) as T;
  }
  return next;
}

async function loadViewerReactions(admin: ReturnType<typeof createAdminClient>, userId: string, postIds: string[]) {
  if (postIds.length === 0) return new Map<string, string>();
  const { data, error } = await admin
    .from('post_upvotes')
    .select('post_id, reaction_type')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error) throw error;
  return new Map((data ?? []).map((row: any) => [row.post_id as string, row.reaction_type as string]));
}

/**
 * Preview bodies only -- the count itself comes from posts.comment_count
 * (maintained by the existing sync_post_comment_count trigger on every
 * post_comments insert/delete, replies included), not recomputed here.
 * That trigger-maintained column is already in `rows` from the `posts`
 * select('*') this feeds into, so there's no need to duplicate the count
 * logic in the RPC that fetches the preview bodies.
 */
async function loadCommentPreviews(admin: ReturnType<typeof createAdminClient>, postIds: string[]) {
  const empty = new Map<string, MandaliCommentPreview[]>();
  if (postIds.length === 0) return empty;

  // `admin` is typed via the hand-maintained Database type (see
  // types/database.ts), which -- like its existing Views/Enums entries --
  // doesn't run through a full `supabase gen types` regen. The cast here is
  // scoped to this one RPC call; the Args/Returns shape is asserted against
  // MandaliCommentPreview et al. immediately below, so this doesn't weaken
  // the actual data-shape checking, just the generic Function-name lookup.
  const { data, error } = await (admin.rpc as any)('get_post_comment_previews', {
    p_post_ids: postIds,
    p_preview_count: COMMENT_PREVIEW_COUNT,
  });
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    post_id: string;
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    deleted_at: string | null;
  }>;

  const authorMap = await loadSafeAuthors(rows.map((row) => row.author_id));
  const byPost = new Map<string, MandaliCommentPreview[]>();
  for (const row of rows) {
    const entry = byPost.get(row.post_id) ?? [];
    entry.push({
      id: row.id,
      author_id: row.author_id,
      // Same rule as hydrateComments: a soft-deleted body never reaches
      // another user's client, even in a preview.
      body: row.deleted_at ? '' : row.body,
      created_at: row.created_at,
      deleted_at: row.deleted_at,
      profiles: commentAuthorRelation(authorMap.get(row.author_id)),
    });
    byPost.set(row.post_id, entry);
  }
  return byPost;
}

async function hydrateFeedPosts(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  rows: Post[],
): Promise<MandaliFeedPost[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((row) => row.id);
  const [hydrated, reactions, commentData] = await Promise.all([
    hydratePosts(rows),
    loadViewerReactions(admin, userId, postIds),
    loadCommentPreviews(admin, postIds),
  ]);
  return hydrated.map((post) => ({
    ...post,
    viewerReaction: reactions.get(post.id) ?? null,
    commentPreview: commentData.get(post.id) ?? [],
  }));
}

/**
 * Full comment thread (root + replies) for one post -- the "expand" path
 * that `/api/mandali/feed`'s paginated DTO defers to instead of shipping
 * every comment for every post upfront. Applies the same author exclusion
 * as posts/members; comments have no separate hide mechanism of their own
 * (SAFETY_CONTENT_LABELS only covers mandali_post and ai_chat_response),
 * so a blocked/muted author's comments are excluded here even though the
 * legacy loadMandaliDataForUser path never filtered comments at all.
 */
export async function loadPostComments(userId: string, postId: string): Promise<PostCommentWithAuthor[]> {
  const admin = createAdminClient();
  const safetyState = await getUserSafetyState(admin, userId);

  const { data, error } = await admin
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as PostComment[];
  const visibleRows = rows.filter((row) => !safetyState.excludedAuthorIds.has(row.author_id));
  return hydrateComments(visibleRows);
}

export async function loadMandaliFeedPage(
  userId: string,
  { cursor, limit }: { cursor?: string | null; limit?: number } = {},
): Promise<MandaliFeedPage> {
  const admin = createAdminClient();
  const pageSize = Math.min(Math.max(limit ?? FEED_PAGE_DEFAULT_LIMIT, 1), FEED_PAGE_MAX_LIMIT);
  const decodedCursor = cursor ? decodeFeedCursor(cursor) : null;
  const isFirstPage = !decodedCursor;

  const [profileResult, safetyState] = await Promise.all([
    admin.from('profiles').select('*, mandalis(name, city, country, member_count)').eq('id', userId).single(),
    getUserSafetyState(admin, userId),
  ]);
  const { error: profileError } = profileResult;
  const profile = profileResult.data as unknown as NonNullable<MandaliProfile>;
  if (profileError) throw profileError;

  const mandaliId = profile?.mandali_id;
  if (!mandaliId) {
    return { schemaVersion: 1, profile: profile as MandaliProfile, posts: [], blendedPosts: [], members: [], rsvps: [], nextCursor: null };
  }

  let postsQuery = admin
    .from('posts')
    .select('*')
    .eq('mandali_id', mandaliId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  postsQuery = applySafetyExclusions(postsQuery as any, safetyState, 'mandali_post');
  if (decodedCursor) {
    // Keyset predicate for (created_at, id) < (cursor.createdAt, cursor.id),
    // expressed as PostgREST `.or()` since the JS client has no direct
    // row-value comparison: strictly older, OR same instant with a
    // strictly smaller id (the deterministic tie-break the plain
    // created_at-only index couldn't give us).
    postsQuery = postsQuery.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`
    );
  }
  // Fetch one extra row to know whether a next page exists without a
  // separate count query.
  const [
    { data: postRows, error: postsError },
    { data: memberRows, error: membersError },
  ] = await Promise.all([
    postsQuery.limit(pageSize + 1),
    admin
      .from('profiles')
      .select('id, username, avatar_url, seva_score')
      .eq('mandali_id', mandaliId)
      .order('seva_score', { ascending: false })
      .limit(50),
  ]);
  if (postsError) throw postsError;
  if (membersError) throw membersError;

  const allRows = (postRows ?? []) as Post[];
  const hasMore = allRows.length > pageSize;
  const pageRows = hasMore ? allRows.slice(0, pageSize) : allRows;
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow ? encodeFeedCursor(lastRow.created_at, lastRow.id) : null;

  const postIdsForRsvp = pageRows.map((row) => row.id);
  const [posts, rsvpResult] = await Promise.all([
    hydrateFeedPosts(admin, userId, pageRows),
    postIdsForRsvp.length
      ? admin.from('event_rsvps').select('id, post_id, user_id, status, created_at, updated_at').in('post_id', postIdsForRsvp)
      : Promise.resolve({ data: [] as EventRsvp[], error: null }),
  ]);
  const members = filterProfileRows((memberRows ?? []) as MandaliPublicIdentity[], safetyState);
  const needsBlend = members.length < BLEND_THRESHOLD;

  let blendedPosts: MandaliFeedPost[] = [];
  if (isFirstPage && needsBlend) {
    let blendedQuery = admin.from('posts').select('*').neq('mandali_id', mandaliId).order('created_at', { ascending: false });
    blendedQuery = applySafetyExclusions(blendedQuery as any, safetyState, 'mandali_post');
    const { data: blendedRows, error: blendError } = await blendedQuery.limit(15);
    if (blendError) throw blendError;
    blendedPosts = await hydrateFeedPosts(admin, userId, (blendedRows ?? []) as Post[]);
  }

  if (rsvpResult.error) throw rsvpResult.error;

  return {
    schemaVersion: 1,
    profile: profile as MandaliProfile,
    posts,
    blendedPosts,
    members,
    rsvps: (rsvpResult.data ?? []) as EventRsvp[],
    nextCursor,
  };
}
