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
