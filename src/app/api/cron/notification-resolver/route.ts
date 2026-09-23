import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeCandidateResolverPipeline } from '@/lib/notification-resolver-pipeline';

export async function GET(request: Request) {
  const startTime = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  const dispatchSecret = process.env.INTERNAL_DISPATCH_SECRET;
  if (!cronSecret && !dispatchSecret) {
    return NextResponse.json({ error: 'No cron or dispatch secret is configured' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  const authorized =
    (!!cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (!!dispatchSecret && authHeader === `Bearer ${dispatchSecret}`);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === 'true' || url.searchParams.get('preview') === 'true';
  const batchLimit = Math.max(1, Math.min(1000, Number(url.searchParams.get('batchLimit') ?? 200) || 200));
  const eventType = url.searchParams.get('eventType') || undefined;
  const runRetentionCleanup = url.searchParams.get('retention') !== 'false';

  try {
    const result = await executeCandidateResolverPipeline({
      supabase,
      dryRun,
      batchLimit,
      eventType,
      runRetentionCleanup,
    });

    const elapsedMs = Date.now() - startTime;
    return NextResponse.json({
      ...result,
      elapsedMs,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
