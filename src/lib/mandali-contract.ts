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

export type MandaliPollOption = {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
};

export type MandaliPoll = {
  id: string;
  question: string;
  totalVotes: number;
  userVotedOptionId: string | null;
  options: MandaliPollOption[];
};

export type MandaliData = {
  profile: MandaliProfile;
  posts: (PostWithAuthor & { poll?: MandaliPoll | null })[];
  comments: PostCommentWithAuthor[];
  rsvps: EventRsvp[];
  members: MandaliPublicIdentity[];
  blendedPosts: (PostWithAuthor & { poll?: MandaliPoll | null })[];
};

export type MandaliCommentPreview = Pick<PostCommentWithAuthor, 'id' | 'author_id' | 'body' | 'created_at' | 'deleted_at' | 'profiles'> & {
  is_highlighted?: boolean;
  highlight_label?: string | null;
  highlighted_at?: string | null;
  highlighted_by?: string | null;
};

export type MandaliFeedPost = PostWithAuthor & {
  viewerReaction: string | null;
  commentPreview: MandaliCommentPreview[];
  poll?: MandaliPoll | null;
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
