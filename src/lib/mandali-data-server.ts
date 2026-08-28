import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { filterAuthoredItems, filterProfileRows, getUserSafetyState } from '@/lib/user-safety';
import type { MandaliData, MandaliProfile, MandaliPublicIdentity } from '@/lib/mandali-contract';
import type { EventRsvp, Post, PostComment, PostCommentWithAuthor, PostWithAuthor, Profile } from '@/types/database';

const BLEND_THRESHOLD = 5;

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
