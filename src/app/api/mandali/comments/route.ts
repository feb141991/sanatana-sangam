import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { rejectLargeRequest, rateLimitByIp } from '@/lib/api-security';
import { parseMandaliCommentInput, parseMandaliCommentEditInput, parseMandaliCommentDeleteInput } from '@/lib/mandali-write-contract';
import { loadPostComments } from '@/lib/mandali-data-server';
import { createAdminClient } from '@/lib/supabase-admin';

// Full comment thread for one post -- the "expand" path in the paginated
// Mandali feed DTO, which ships only a 2-comment preview per post upfront.
export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const postId = new URL(request.url).searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'postId is required.' }, { status: 400 });

  try {
    const comments = await loadPostComments(user.id, postId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('[mandali/comments GET] failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Could not load comments.' }, { status: 500 });
  }
}

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

  // A retry of an already-committed request (dropped connection, or a
  // native outbox resuming after an app kill mid-flight) must return the
  // existing comment rather than creating a duplicate -- see migration
  // 20260902170000_add_mandali_post_comment_idempotency_keys.sql.
  if (input.clientOperationId) {
    const { data: existing, error: lookupError } = await admin
      .from('post_comments').select('id').eq('client_operation_id', input.clientOperationId).maybeSingle();
    if (lookupError) return NextResponse.json({ error: 'Could not create comment.' }, { status: 500 });
    if (existing) {
      const existingRow = existing as unknown as { id: string };
      return NextResponse.json({ id: existingRow.id, idempotentReplay: true }, { status: 201 });
    }
  }

  const { data, error } = await admin.from('post_comments').insert({
    post_id: input.postId,
    author_id: user.id,
    body: input.body,
    parent_id: input.parentId,
    client_operation_id: input.clientOperationId,
  } as never).select('id').single();
  if (error) {
    // A concurrent retry (e.g. a bounded inline retry and an outbox resume
    // racing) can hit the unique constraint between the lookup above and
    // this insert -- fetch and return the row the other request just
    // committed instead of surfacing a false failure.
    if (error.code === '23505' && input.clientOperationId) {
      const { data: raced } = await admin
        .from('post_comments').select('id').eq('client_operation_id', input.clientOperationId).maybeSingle();
      if (raced) {
        const racedRow = raced as unknown as { id: string };
        return NextResponse.json({ id: racedRow.id, idempotentReplay: true }, { status: 201 });
      }
    }
    return NextResponse.json({ error: 'Could not create comment.' }, { status: 500 });
  }
  const created = data as unknown as { id: string };
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const rejected = rejectLargeRequest(request, 4_096)
    ?? rateLimitByIp(request, { keyPrefix: 'mandali-comment-edit', limit: 20, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const banned = await assertNotBanned(admin, user.id);
  if (banned) return banned;
  const input = parseMandaliCommentEditInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid comment.' }, { status: 400 });

  const { data: existing } = await admin.from('post_comments').select('author_id, deleted_at').eq('id', input.commentId).maybeSingle();
  const target = existing as unknown as { author_id: string; deleted_at: string | null } | null;
  if (!target) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  if (target.author_id !== user.id) return NextResponse.json({ error: 'Not your comment.' }, { status: 403 });
  if (target.deleted_at) return NextResponse.json({ error: 'Comment is deleted.' }, { status: 400 });

  const { error } = await admin.from('post_comments')
    .update({ body: input.body, updated_at: new Date().toISOString() } as never)
    .eq('id', input.commentId);
  if (error) return NextResponse.json({ error: 'Could not update comment.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const rejected = rateLimitByIp(request, { keyPrefix: 'mandali-comment-delete', limit: 20, windowMs: 60 * 60 * 1000 });
  if (rejected) return rejected;
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const banned = await assertNotBanned(admin, user.id);
  if (banned) return banned;
  const input = parseMandaliCommentDeleteInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const { data: existing } = await admin.from('post_comments').select('author_id, deleted_at').eq('id', input.commentId).maybeSingle();
  const target = existing as unknown as { author_id: string; deleted_at: string | null } | null;
  if (!target) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  if (target.author_id !== user.id) return NextResponse.json({ error: 'Not your comment.' }, { status: 403 });
  if (target.deleted_at) return NextResponse.json({ ok: true });

  // Soft delete: keeps the row (and any replies attached to it via
  // parent_id, plus any content_reports referencing it) intact, so a
  // deleted comment renders as a tombstone rather than orphaning its
  // thread. The body itself is left in place for moderation/audit history
  // -- clients render the "[deleted]" placeholder off deleted_at, never off
  // an actually-blanked body.
  const { error } = await admin.from('post_comments')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', input.commentId);
  if (error) return NextResponse.json({ error: 'Could not delete comment.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
