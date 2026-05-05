import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { filterAuthoredItems, filterProfileRows, getUserSafetyState } from '@/lib/user-safety';
import MandaliClient from './MandaliClient';

// If the local Mandali has fewer than this many members, blend in Sangam-wide posts
const BLEND_THRESHOLD = 5;

export default async function MandaliPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mandali requires auth — guests redirected to signup
  if (!user) redirect('/signup');

  // Fetch profile with mandali + neighbourhood fields + tradition (for Sabha default tab)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, mandalis(*), tradition')
    .eq('id', user.id)
    .single();

  const mandaliId = profile?.mandali_id;
  const safetyState = await getUserSafetyState(supabase, user.id);

  // Fetch mandali posts
  let posts: any[] = [];
  let comments: any[] = [];
  let rsvps: any[] = [];
  if (mandaliId) {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
      .eq('mandali_id', mandaliId)
      .order('created_at', { ascending: false })
      .limit(30);
    posts = filterAuthoredItems(data ?? [], 'mandali_post', safetyState);

    const postIds = posts.map((post) => post.id);
    if (postIds.length > 0) {
      const [{ data: commentData }, { data: rsvpData }] = await Promise.all([
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

      comments = commentData ?? [];
      rsvps = rsvpData ?? [];
    }
  }

  // Fetch real mandali members
  let members: any[] = [];
  if (mandaliId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, sampradaya, ishta_devata, spiritual_level, city, seva_score')
      .eq('mandali_id', mandaliId)
      .order('seva_score', { ascending: false })
      .limit(50);
    members = filterProfileRows(data ?? [], safetyState);
  }

  // "Don't feel alone" — blend in posts from across the Sangam when local Mandali is small
  let blendedPosts: any[] = [];
  if (mandaliId && members.length < BLEND_THRESHOLD) {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
      .neq('mandali_id', mandaliId)   // other Mandalis only
      .order('created_at', { ascending: false })
      .limit(15);
    blendedPosts = filterAuthoredItems(data ?? [], 'mandali_post', safetyState);
  }

  // Fetch forum threads for the Sabha scope
  const { data: threadsRaw } = await supabase
    .from('forum_threads')
    .select('*, profiles!forum_threads_author_id_fkey(full_name, username, avatar_url, sampradaya)')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(60);
  const threads = filterAuthoredItems(threadsRaw ?? [], 'thread', safetyState);
  const userTradition: string | null = (profile as any)?.tradition ?? null;

  return (
    <MandaliClient
      profile={profile}
      posts={posts}
      comments={comments}
      rsvps={rsvps}
      members={members}
      userId={user.id}
      blendedPosts={blendedPosts}
      threads={threads}
      userTradition={userTradition}
    />
  );
}
