import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { createMandaliPromptAdminClient } from '@/lib/mandali-prompt-admin';

export async function POST(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createMandaliPromptAdminClient();
  const banned = await assertNotBanned(admin as any, user.id);
  if (banned) return banned;

  const body = await request.json().catch(() => null);
  const { commentId, label } = (body ?? {}) as { commentId?: string; label?: string | null };
  if (!commentId) {
    return NextResponse.json({ error: 'commentId is required.' }, { status: 400 });
  }

  // Fetch comment and its parent post to verify authorization
  const { data: comment, error: commentError } = await admin
    .from('post_comments')
    .select('id, post_id, author_id, is_highlighted')
    .eq('id', commentId)
    .maybeSingle();
  if (commentError || !comment) {
    return NextResponse.json({ error: 'Comment not found.' }, { status: 404 });
  }

  const { data: post, error: postError } = await admin
    .from('posts')
    .select('id, author_id')
    .eq('id', comment.post_id)
    .maybeSingle();
  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  // Only the post author or official system account can highlight reflections
  const isPostAuthor = post.author_id === user.id;
  const isSystemAuthor = process.env.MANDALI_PROMPT_AUTHOR_ID && user.id === process.env.MANDALI_PROMPT_AUTHOR_ID;
  if (!isPostAuthor && !isSystemAuthor) {
    return NextResponse.json({ error: 'Only the question author can highlight a reflection.' }, { status: 403 });
  }

  if (!label) {
    // Un-highlight
    await admin
      .from('post_comments')
      .update({ is_highlighted: false, highlight_label: null, highlighted_at: null, highlighted_by: null })
      .eq('id', commentId);
    return NextResponse.json({ success: true, isHighlighted: false, highlightLabel: null });
  }

  // Un-highlight any existing highlight on this post first (one highlight per post)
  await admin
    .from('post_comments')
    .update({ is_highlighted: false, highlight_label: null, highlighted_at: null, highlighted_by: null })
    .eq('post_id', comment.post_id)
    .eq('is_highlighted', true);

  // Set highlight
  const highlightLabel = label === 'insightful' ? 'insightful' : 'guru_prasad';
  const { error: updateError } = await admin
    .from('post_comments')
    .update({
      is_highlighted: true,
      highlight_label: highlightLabel,
      highlighted_at: new Date().toISOString(),
      highlighted_by: user.id,
    })
    .eq('id', commentId);
  if (updateError) {
    return NextResponse.json({ error: 'Could not highlight reflection.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, isHighlighted: true, highlightLabel });
}
