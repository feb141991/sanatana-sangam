import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';
import { postSlackModerationReport, scheduleSlack } from '@/lib/slack-alerts';
import { parseFeedbackInput } from '@/lib/feedback-contract';

/**
 * Customer Feedback & App Review endpoint.
 * Accepts suggestions, issue reports, scriptural questions, and user feedback
 * from mobile and web apps, persisting them to content_reports with diagnostic metadata.
 */
export async function POST(request: NextRequest) {
  const sizeRejection = rejectLargeRequest(request, 8_192);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(request, { keyPrefix: 'app-feedback', limit: 10, windowMs: 60 * 60 * 1000 });
  if (rateRejection) return rateRejection;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseFeedbackInput(body);
  if (!parsed) {
    return NextResponse.json(
      { error: 'Invalid feedback. Message must be at least 3 characters.' },
      { status: 400 },
    );
  }

  const { user } = await getApiUser(request);
  const admin = createAdminClient();

  // If user is authenticated, use user.id. If guest, attempt finding an official/system profile or first profile.
  let reporterId = user?.id;
  if (!reporterId) {
    const fallbackId = process.env.MANDALI_PROMPT_AUTHOR_ID;
    if (fallbackId) {
      reporterId = fallbackId;
    } else {
      const { data: firstProfile } = await admin.from('profiles').select('id').limit(1).maybeSingle();
      reporterId = (firstProfile as { id: string } | null)?.id;
    }
  }

  if (!reporterId) {
    return NextResponse.json({ error: 'Unable to record feedback at this time.' }, { status: 500 });
  }

  const starTag = parsed.rating ? ` [${parsed.rating}★]` : '';
  const reasonSummary = `[FEEDBACK:${parsed.category.toUpperCase()}]${starTag} ${parsed.message}`.slice(0, 500);

  const metadata = {
    type: 'customer_feedback',
    category: parsed.category,
    rating: parsed.rating,
    email: parsed.email || user?.email || null,
    fullMessage: parsed.message,
    deviceInfo: parsed.deviceInfo,
    submittedAt: new Date().toISOString(),
    isGuest: !user,
  };

  const insertPayload = {
    reported_by: reporterId,
    content_author_id: reporterId,
    content_type: 'app_feedback',
    content_id: parsed.category,
    reason: reasonSummary,
    status: 'pending',
    metadata,
  };

  const { data: created, error: insertError } = await (admin.from('content_reports') as any)
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError) {
    console.error('[feedback] insert failed:', insertError.message);
    return NextResponse.json({ error: 'Failed to record feedback.' }, { status: 500 });
  }

  scheduleSlack(() =>
    postSlackModerationReport({
      reportId: created?.id || parsed.category,
      contentType: `App Feedback (${parsed.category}${starTag})`,
      reason: parsed.message,
      reporterId: user?.id || 'guest',
      details: parsed.email ? `Contact: ${parsed.email}` : undefined,
      metadata: { rating: parsed.rating, category: parsed.category, deviceInfo: parsed.deviceInfo },
    }),
  );

  return NextResponse.json({ success: true, id: created?.id });
}
