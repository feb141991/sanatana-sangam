import { createClient } from '@/lib/supabase';
import type { MandaliData } from '@/lib/mandali-contract';
export type { MandaliData, MandaliProfile, MandaliPublicIdentity as MandaliMemberRow } from '@/lib/mandali-contract';

export async function fetchMandaliData(userId: string): Promise<MandaliData> {
  if (!userId) throw new Error('Mandali requires an authenticated user.');
  const response = await fetch('/api/mandali/feed', { credentials: 'include' });
  if (!response.ok) throw new Error('Could not load Mandali.');
  return response.json() as Promise<MandaliData>;
}

export async function joinMandaliForLocation(userId: string, city: string, country: string, lat?: number, lon?: number) {
  const supabase = createClient();
  const { data: mandaliId, error: rpcError } = await supabase.rpc('find_or_create_mandali', {
    p_city: city.trim(),
    p_country: country.trim(),
    p_lat: lat ?? null,
    p_lon: lon ?? null,
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
  void payload.userId;
  void payload.mandaliId;
  const response = await fetch('/api/mandali/posts', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: payload.content,
      postType: payload.postType,
      eventDate: payload.eventDate,
      eventLocation: payload.eventLoc,
    }),
  });
  if (!response.ok) throw new Error('Could not create post.');
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
  void payload.userId;
  const response = await fetch('/api/mandali/comments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ postId: payload.postId, body: payload.body, parentId: payload.parentId }),
  });
  if (!response.ok) throw new Error('Could not create comment.');
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
