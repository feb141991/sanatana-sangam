import { createClient } from '@/lib/supabase';
import { filterAuthoredItems, filterProfileRows, getUserSafetyState } from '@/lib/user-safety';
import type { EventRsvp, PostCommentWithAuthor, PostWithAuthor, Profile } from '@/types/database';

const BLEND_THRESHOLD = 5;

export type MandaliMemberRow = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'ishta_devata' | 'spiritual_level' | 'city' | 'seva_score'>;

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
  members: MandaliMemberRow[];
  blendedPosts: PostWithAuthor[];
};

export async function fetchMandaliData(userId: string): Promise<MandaliData> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, mandalis(*)')
    .eq('id', userId)
    .single();

  const mandaliId = profile?.mandali_id;
  const safetyState = await getUserSafetyState(supabase, userId);

  let posts: PostWithAuthor[] = [];
  let comments: PostCommentWithAuthor[] = [];
  let rsvps: EventRsvp[] = [];
  let members: MandaliMemberRow[] = [];
  let blendedPosts: PostWithAuthor[] = [];

  if (mandaliId) {
    const [{ data: postRows }, { data: memberRows }] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
        .eq('mandali_id', mandaliId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, sampradaya, ishta_devata, spiritual_level, city, seva_score')
        .eq('mandali_id', mandaliId)
        .order('seva_score', { ascending: false })
        .limit(50),
    ]);

    posts = filterAuthoredItems((postRows ?? []) as PostWithAuthor[], 'mandali_post', safetyState);
    members = filterProfileRows((memberRows ?? []) as MandaliMemberRow[], safetyState);

    const postIds = posts.map((post) => post.id);
    if (postIds.length > 0) {
      const [{ data: commentRows }, { data: rsvpRows }] = await Promise.all([
        supabase
          .from('post_comments')
          .select('*, profiles!post_comments_author_id_fkey(full_name, username, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true }),
        supabase
          .from('event_rsvps')
          .select('*')
          .in('post_id', postIds),
      ]);

      comments = commentRows ?? [];
      rsvps = rsvpRows ?? [];
    }

    if (members.length < BLEND_THRESHOLD) {
      const { data: blendedRows } = await supabase
        .from('posts')
        .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
        .neq('mandali_id', mandaliId)
        .order('created_at', { ascending: false })
        .limit(15);

      blendedPosts = filterAuthoredItems((blendedRows ?? []) as PostWithAuthor[], 'mandali_post', safetyState);
    }
  }

  return {
    profile: (profile as MandaliProfile) ?? null,
    posts,
    comments,
    rsvps,
    members,
    blendedPosts,
  };
}

export async function joinMandaliForLocation(userId: string, city: string, country: string) {
  const supabase = createClient();
  const { data: mandaliId, error: rpcError } = await supabase.rpc('find_or_create_mandali', {
    p_city: city.trim(),
    p_country: country.trim(),
  });

  if (rpcError) throw rpcError;

  const { error } = await supabase
    .from('profiles')
    .update({
      city: city.trim(),
      country: country.trim(),
      mandali_id: mandaliId,
    })
    .eq('id', userId);

  if (error) throw error;
  return mandaliId as string;
}

export async function leaveMandali(userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ mandali_id: null })
    .eq('id', userId);

  if (error) throw error;
}

export async function createMandaliPost(payload: {
  userId: string;
  mandaliId: string;
  content: string;
  postType: 'update' | 'event' | 'question' | 'announcement';
  eventDate?: string;
  eventLoc?: string;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from('posts')
    .insert({
      author_id: payload.userId,
      mandali_id: payload.mandaliId,
      content: payload.content.trim(),
      type: payload.postType,
      event_date: payload.eventDate || null,
      event_location: payload.eventLoc || null,
    });

  if (error) throw error;
}

export async function toggleMandaliPostUpvote(postId: string, userId: string, isUpvoted: boolean) {
  const supabase = createClient();

  if (isUpvoted) {
    const { error } = await supabase.from('post_upvotes').delete().match({ post_id: postId, user_id: userId });
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from('post_upvotes').insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function createMandaliComment(payload: {
  postId: string;
  userId: string;
  body: string;
  parentId?: string | null;
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from('post_comments')
    .insert({
      post_id: payload.postId,
      author_id: payload.userId,
      body: payload.body.trim(),
      parent_id: payload.parentId ?? null,
    });

  if (error) throw error;
}

export async function updateMandaliRsvp(payload: {
  postId: string;
  userId: string;
  status: 'going' | 'interested' | 'not_going';
}) {
  const supabase = createClient();
  const { error } = await supabase
    .from('event_rsvps')
    .upsert({
      post_id: payload.postId,
      user_id: payload.userId,
      status: payload.status,
    }, { onConflict: 'post_id,user_id' });

  if (error) throw error;
}
