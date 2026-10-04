import { NextResponse } from 'next/server';

import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { processEmailOutboxBatch } from '@/lib/email-outbox';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_SUPPRESSION_HMAC_KEY) {
    return NextResponse.json({ error: 'Email delivery is not configured' }, { status: 503 });
  }

  try {
    const limitParam = Number(new URL(request.url).searchParams.get('limit') ?? 20);
    const limit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 20;
    const result = await processEmailOutboxBatch(createServiceRoleSupabaseClient(), undefined, limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[email-outbox] cron run failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Email delivery run failed' }, { status: 500 });
  }
}
