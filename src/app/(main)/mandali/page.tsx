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

  // ── Wave 1: profile + safety state in PARALLEL (was sequential) ──────────
  const [{ data: profile }, safetyState] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, mandalis(*), tradition')
      .eq('id', user.id)
      .single(),
    getUserSafetyState(supabase, user.id),
  ]);

  const mandaliId = profile?.mandali_id;

  // ── Wave 2: all Mandali content in PARALLEL — no more sequential waterfalls ──────
  const [postsResult, membersResult] = await Promise.all([
    mandaliId
      ? supabase
          .from('posts')
          .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
          .eq('mandali_id', mandaliId)
          .order('created_at', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
    mandaliId
      ? supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, sampradaya, ishta_devata, spiritual_level, city, country, seva_score')
          .eq('mandali_id', mandaliId)
          .order('seva_score', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  const rawPosts  = postsResult.data  ?? [];
  const rawMembers = membersResult.data ?? [];

  const posts   = filterAuthoredItems(rawPosts,   'mandali_post', safetyState);
  const members = filterProfileRows(rawMembers, safetyState);

  // ── Wave 3: comments + rsvps + blended posts — all in PARALLEL ───────────
  const postIds = posts.map((p) => p.id);
  const needsBlend = mandaliId && members.length < BLEND_THRESHOLD;

  const [commentsResult, rsvpsResult, blendedResult] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('post_comments')
          .select('*, profiles!post_comments_author_id_fkey(full_name, username, avatar_url)')
          .in('post_id', postIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('event_rsvps').select('id, post_id, user_id, status, created_at, updated_at').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    needsBlend
      ? supabase
          .from('posts')
          .select('*, profiles!posts_author_id_fkey(full_name, username, avatar_url, sampradaya, spiritual_level)')
          .neq('mandali_id', mandaliId)
          .order('created_at', { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] }),
  ]);

  const comments    = commentsResult.data ?? [];
  const rsvps       = rsvpsResult.data    ?? [];
  const blendedPosts = filterAuthoredItems(blendedResult.data ?? [], 'mandali_post', safetyState);

  const userTradition: string | null = profile?.tradition ?? null;

  return (
    <MandaliClient
      profile={profile}
      posts={posts}
      comments={comments}
      rsvps={rsvps}
      members={members}
      userId={user.id}
      blendedPosts={blendedPosts}
      userTradition={userTradition}
    />
  );
}
