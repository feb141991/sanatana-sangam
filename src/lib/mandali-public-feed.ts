import { createAdminClient } from '@/lib/supabase-admin';
import { decodeFeedCursor, encodeFeedCursor, formatIdListLiteral } from '@/lib/mandali-cursor';

/**
 * The read-only Mandali feed a signed-out person sees in the app (founder decision 2026-11-12: guests may read posts; reacting,
 * commenting, voting, RSVPs and posting need an account, which the database already enforces).
 *
 * What a guest gets is deliberately less than a member gets:
 *  - posts only, newest first, from every Mandali, without the daily prompt posts (one copy exists per Mandali);
 *  - the author's public username and avatar, never an account id, and no profile link;
 *  - counts of reactions and comments, never who reacted, and no comments, poll votes, RSVPs or member lists;
 *  - nothing written by an account that is banned or being deleted.
 * A guest has no blocks, mutes or hidden content, so the per-person safety filters do not apply; the two account-level
 * exclusions above do, and a failed read of them fails the whole request rather than showing what it should have hidden.
 */

export const PUBLIC_FEED_DEFAULT_LIMIT = 20;
export const PUBLIC_FEED_MAX_LIMIT = 30;

export type PublicMandaliPost = {
  id: string;
  createdAt: string;
  type: string;
  content: string;
  reactionCount: number;
  commentCount: number;
  eventDate: string | null;
  eventLocation: string | null;
  author: { name: string; avatarUrl: string | null; isOfficial: boolean };
  mandali: { name: string; city: string | null } | null;
};

export type PublicMandaliFeedPage = { schemaVersion: 1; posts: PublicMandaliPost[]; nextCursor: string | null };

type PostRow = {
  id: string; created_at: string; type: string; content: string; upvotes: number | null; comment_count: number | null;
  event_date: string | null; event_location: string | null; author_id: string; mandali_id: string | null;
};
type AuthorRow = { id: string; username: string | null; avatar_url: string | null };
type MandaliRow = { id: string; name: string; city: string | null };

/** Pure: one database row to the public shape. Account and Mandali ids never leave the server. */
export function toPublicMandaliPost(
  row: PostRow,
  author: AuthorRow | undefined,
  mandali: MandaliRow | undefined,
  officialAuthorId: string | undefined,
): PublicMandaliPost {
  return {
    id: row.id,
    createdAt: row.created_at,
    type: row.type,
    content: row.content,
    reactionCount: Math.max(0, row.upvotes ?? 0),
    commentCount: Math.max(0, row.comment_count ?? 0),
    eventDate: row.event_date,
    eventLocation: row.event_location,
    author: {
      name: author?.username ?? 'Seeker',
      avatarUrl: author?.avatar_url ?? null,
      isOfficial: Boolean(officialAuthorId && row.author_id === officialAuthorId),
    },
    mandali: mandali ? { name: mandali.name, city: mandali.city } : null,
  };
}

export function clampPublicFeedLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) return PUBLIC_FEED_DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), PUBLIC_FEED_MAX_LIMIT);
}

type Admin = ReturnType<typeof createAdminClient>;

export async function loadPublicMandaliFeedPage(
  { cursor, limit }: { cursor?: string | null; limit?: number } = {},
  admin: Admin = createAdminClient(),
): Promise<PublicMandaliFeedPage> {
  const pageSize = clampPublicFeedLimit(limit);
  const decoded = cursor ? decodeFeedCursor(cursor) : null;
  // An unreadable cursor is a bad request, not "start again from the top".
  if (cursor && !decoded) throw new PublicFeedCursorError();

  // Accounts whose writing must not be shown to anyone. Read first so a failure hides everything.
  const { data: excludedRows, error: excludedError } = await admin
    .from('profiles')
    .select('id')
    .or('is_banned.eq.true,is_deleting.eq.true');
  if (excludedError) throw excludedError;
  const excludedAuthorIds = (excludedRows ?? []).map((row: { id: string }) => row.id);

  let query = admin
    .from('posts')
    .select('id, created_at, type, content, upvotes, comment_count, event_date, event_location, author_id, mandali_id')
    .is('mandali_prompt_id', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (excludedAuthorIds.length > 0) query = query.not('author_id', 'in', formatIdListLiteral(excludedAuthorIds));
  if (decoded) {
    query = query.or(`created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`);
  }
  const { data: postRows, error: postsError } = await query.limit(pageSize + 1);
  if (postsError) throw postsError;

  const rows = (postRows ?? []) as PostRow[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const last = pageRows[pageRows.length - 1];

  const authorIds = Array.from(new Set(pageRows.map((row) => row.author_id)));
  const mandaliIds = Array.from(new Set(pageRows.flatMap((row) => (row.mandali_id ? [row.mandali_id] : []))));
  const [authorResult, mandaliResult] = await Promise.all([
    authorIds.length
      ? admin.from('profiles').select('id, username, avatar_url').in('id', authorIds)
      : Promise.resolve({ data: [] as AuthorRow[], error: null }),
    mandaliIds.length
      ? admin.from('mandalis').select('id, name, city').in('id', mandaliIds)
      : Promise.resolve({ data: [] as MandaliRow[], error: null }),
  ]);
  if (authorResult.error) throw authorResult.error;
  if (mandaliResult.error) throw mandaliResult.error;
  const authors = new Map(((authorResult.data ?? []) as AuthorRow[]).map((row) => [row.id, row]));
  const mandalis = new Map(((mandaliResult.data ?? []) as MandaliRow[]).map((row) => [row.id, row]));
  const officialAuthorId = process.env.MANDALI_PROMPT_AUTHOR_ID;

  return {
    schemaVersion: 1,
    posts: pageRows.map((row) => toPublicMandaliPost(row, authors.get(row.author_id), row.mandali_id ? mandalis.get(row.mandali_id) : undefined, officialAuthorId)),
    nextCursor: hasMore && last ? encodeFeedCursor(last.created_at, last.id) : null,
  };
}

export class PublicFeedCursorError extends Error {
  constructor() {
    super('invalid_cursor');
    this.name = 'PublicFeedCursorError';
  }
}
