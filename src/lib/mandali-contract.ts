import type { EventRsvp, PostCommentWithAuthor, PostWithAuthor, Profile } from '@/types/database';

export type MandaliPublicIdentity = {
  id: string;
  username: string;
  avatar_url: string | null;
  seva_score: number;
};

export type MandaliProfile = (Profile & {
  mandalis?: {
    name: string;
    city: string;
    country: string;
    member_count: number;
  } | null;
  neighbourhood?: string | null;
}) | null;

export type MandaliData = {
  profile: MandaliProfile;
  posts: PostWithAuthor[];
  comments: PostCommentWithAuthor[];
  rsvps: EventRsvp[];
  members: MandaliPublicIdentity[];
  blendedPosts: PostWithAuthor[];
};

export type MandaliCommentPreview = Pick<PostCommentWithAuthor, 'id' | 'author_id' | 'body' | 'created_at' | 'deleted_at' | 'profiles'>;

export type MandaliFeedPost = PostWithAuthor & {
  viewerReaction: string | null;
  // Total comment count is already on PostWithAuthor as `comment_count`
  // (the posts table's own trigger-maintained column, replies included) --
  // not duplicated here.
  commentPreview: MandaliCommentPreview[];
};

/**
 * Keyset-paginated Mandali feed page -- the DTO shape used by
 * `/api/mandali/feed` when called with `cursor`/`limit`. Distinct from
 * `MandaliData` (the legacy, un-paginated, full-comments shape still used
 * by the web SSR page and its default client refetch) so that adopting
 * this contract is opt-in per caller rather than a breaking change to an
 * already-live consumer.
 */
export type MandaliFeedPage = {
  schemaVersion: 1;
  profile: MandaliProfile;
  posts: MandaliFeedPost[];
  // Cross-mandali diversity posts -- only populated on the first page
  // (cursor absent). Not itself paginated.
  blendedPosts: MandaliFeedPost[];
  members: MandaliPublicIdentity[];
  rsvps: EventRsvp[];
  nextCursor: string | null;
};
