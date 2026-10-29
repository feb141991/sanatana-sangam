import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { loadMandaliNotificationTarget } from '@/lib/mandali-data-server';

const HEADERS = { 'Cache-Control': 'private, no-store' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) return getApiAuthFailureResponse(error, HEADERS);
  const params = new URL(request.url).searchParams;
  const postId = params.get('postId');
  const commentId = params.get('commentId');
  const requestId = params.get('requestId');
  if ((Boolean(postId) === Boolean(requestId)) || (commentId && !postId)
    || [postId, commentId, requestId].some((id) => id !== null && !UUID.test(id))
    || ['postId', 'commentId', 'requestId'].some((key) => params.getAll(key).length > 1)) {
    return NextResponse.json({ error: 'Invalid notification target.' }, { status: 400, headers: HEADERS });
  }
  try {
    const target = await loadMandaliNotificationTarget(user.id,
      postId ? { postId, ...(commentId ? { commentId } : {}) } : { requestId: requestId! });
    return target
      ? NextResponse.json(target, { headers: HEADERS })
      : NextResponse.json({ error: 'This item is no longer available.' }, { status: 404, headers: HEADERS });
  } catch {
    console.error('[mandali/notification-target] target_lookup_failed');
    return NextResponse.json({ error: 'Could not load this item. Please try again.' }, { status: 503, headers: HEADERS });
  }
}
