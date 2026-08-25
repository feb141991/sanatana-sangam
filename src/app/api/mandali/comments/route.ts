import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { rejectLargeRequest, rateLimitByIp } from '@/lib/api-security';
import { parseMandaliCommentInput } from '@/lib/mandali-write-contract';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 4_096)
    ?? rateLimitByIp(request, { keyPrefix: 'mandali-comment', limit: 30, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const banned = await assertNotBanned(admin, user.id);
  if (banned) return banned;
  const input = parseMandaliCommentInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid comment.' }, { status: 400 });

  const { data: post } = await admin.from('posts').select('id, author_id').eq('id', input.postId).maybeSingle();
  const target = post as unknown as { id: string; author_id: string } | null;
  if (!target) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  const targetAuthorIds = new Set([target.author_id]);
  if (input.parentId) {
    const { data: parent } = await admin.from('post_comments').select('id, author_id').eq('id', input.parentId).eq('post_id', input.postId).maybeSingle();
    if (!parent) return NextResponse.json({ error: 'Parent comment not found.' }, { status: 400 });
    const parentRow = parent as unknown as { author_id?: string };
    if (parentRow.author_id) targetAuthorIds.add(parentRow.author_id);
  }

  const blockPairs = Array.from(targetAuthorIds).flatMap((authorId) => [
    `and(blocker_id.eq.${user.id},blocked_user_id.eq.${authorId})`,
    `and(blocker_id.eq.${authorId},blocked_user_id.eq.${user.id})`,
  ]).join(',');
  const { data: block } = await admin.from('user_blocked_profiles').select('blocker_id').or(blockPairs).limit(1).maybeSingle();
  if (block) return NextResponse.json({ error: 'Interaction unavailable.' }, { status: 403 });

  const { data, error } = await admin.from('post_comments').insert({
    post_id: input.postId,
    author_id: user.id,
    body: input.body,
    parent_id: input.parentId,
  } as never).select('id').single();
  if (error) return NextResponse.json({ error: 'Could not create comment.' }, { status: 500 });
  const created = data as unknown as { id: string };
  return NextResponse.json({ id: created.id }, { status: 201 });
}
