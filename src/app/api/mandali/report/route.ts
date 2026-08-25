import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

const REASONS = new Set(['harassment', 'hate', 'sexual_content', 'violence', 'spam', 'impersonation', 'privacy', 'other']);
const TARGETS = {
  user_profile: { table: 'profiles', authorColumn: 'id' },
  post: { table: 'posts', authorColumn: 'author_id' },
  comment: { table: 'post_comments', authorColumn: 'author_id' },
} as const;

export async function POST(request: NextRequest) {
  const sizeRejection = rejectLargeRequest(request, 8_192);
  if (sizeRejection) return sizeRejection;
  const rateRejection = rateLimitByIp(request, { keyPrefix: 'mandali-report', limit: 12, windowMs: 60 * 60 * 1000 });
  if (rateRejection) return rateRejection;

  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const targetType = typeof body?.targetType === 'string' ? body.targetType : '';
  const targetId = typeof body?.targetId === 'string' ? body.targetId.trim() : '';
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 500) : '';
  if (!(targetType in TARGETS) || !targetId || !REASONS.has(reason)) {
    return NextResponse.json({ error: 'Invalid report.' }, { status: 400 });
  }
  if (targetType === 'user_profile' && targetId === user.id) {
    return NextResponse.json({ error: 'You cannot report your own profile.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const target = TARGETS[targetType as keyof typeof TARGETS];
  const { data: row, error: targetError } = await admin
    .from(target.table)
    .select(`id, ${target.authorColumn}`)
    .eq('id', targetId)
    .maybeSingle();
  if (targetError || !row) return NextResponse.json({ error: 'Report target not found.' }, { status: 404 });

  const authorId = String((row as unknown as Record<string, unknown>)[target.authorColumn] ?? '');
  if (authorId === user.id) {
    return NextResponse.json({ error: 'You cannot report your own content.' }, { status: 400 });
  }
  const { data: duplicate } = await admin
    .from('content_reports')
    .select('id')
    .eq('reported_by', user.id)
    .eq('content_type', targetType)
    .eq('content_id', targetId)
    .eq('status', 'pending')
    .maybeSingle();
  if (duplicate) return NextResponse.json({ ok: true, duplicate: true });

  const { data: created, error } = await admin.from('content_reports').insert({
    reported_by: user.id,
    content_author_id: authorId || null,
    content_type: targetType,
    content_id: targetId,
    reason,
    status: 'pending',
    metadata: details ? { details } : null,
  } as never).select('id').single();
  if (error) {
    console.error('[mandali/report]', error.message);
    return NextResponse.json({ error: 'Could not submit report.' }, { status: 500 });
  }
  const createdReport = created as unknown as { id?: string } | null;
  return NextResponse.json({ ok: true, duplicate: false, reportId: createdReport?.id ?? null });
}
