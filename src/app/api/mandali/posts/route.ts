import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { rejectLargeRequest, rateLimitByIp } from '@/lib/api-security';
import { parseMandaliPostInput } from '@/lib/mandali-write-contract';
import { createAdminClient } from '@/lib/supabase-admin';

async function authenticate(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const admin = createAdminClient();
  const banned = await assertNotBanned(admin, user.id);
  if (banned) return { response: banned };
  return { admin, user };
}

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 8_192)
    ?? rateLimitByIp(request, { keyPrefix: 'mandali-post', limit: 10, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;
  const auth = await authenticate(request);
  if ('response' in auth) return auth.response;
  const input = parseMandaliPostInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid post.' }, { status: 400 });

  const { data: profile } = await auth.admin.from('profiles').select('mandali_id').eq('id', auth.user.id).maybeSingle();
  const mandaliId = (profile as unknown as { mandali_id?: string | null } | null)?.mandali_id;
  if (!mandaliId) return NextResponse.json({ error: 'Join a Mandali before posting.' }, { status: 403 });

  const { data, error } = await auth.admin.from('posts').insert({
    author_id: auth.user.id,
    mandali_id: mandaliId,
    content: input.content,
    type: input.postType,
    event_date: input.postType === 'event' ? input.eventDate : null,
    event_location: input.postType === 'event' ? input.eventLocation : null,
    is_pinned: false,
  } as never).select('id').single();
  if (error) return NextResponse.json({ error: 'Could not create post.' }, { status: 500 });
  const created = data as unknown as { id: string };
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 8_192)
    ?? rateLimitByIp(request, { keyPrefix: 'mandali-post-edit', limit: 20, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;
  const auth = await authenticate(request);
  if ('response' in auth) return auth.response;
  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  const postId = typeof raw?.postId === 'string' ? raw.postId.trim() : '';
  const input = parseMandaliPostInput(raw);
  if (!postId || !input) return NextResponse.json({ error: 'Invalid post.' }, { status: 400 });

  const { data, error } = await auth.admin.from('posts').update({
    content: input.content,
    type: input.postType,
    event_date: input.postType === 'event' ? input.eventDate : null,
    event_location: input.postType === 'event' ? input.eventLocation : null,
  } as never).eq('id', postId).eq('author_id', auth.user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update post.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
