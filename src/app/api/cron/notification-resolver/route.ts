import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_CADENCE_POLICY } from '@/lib/notification-cadence-policy';
import { isCandidateResolverGloballyEnabled } from '@/lib/notification-candidate-pipeline-mode';
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
  // Retention cleanup runs in scheduled pg_cron daily maintenance; only run here if explicitly requested
  const runRetentionCleanup = url.searchParams.get('retention') === 'true';

  const revision = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const cadenceVersion = NOTIFICATION_CADENCE_POLICY.version;
  const release = { revision, cadenceVersion };
  try {
    // Preview remains read-only on the old schema. A live v3 run must not
    // claim or promote anything until the database enforces the same policy.
    if (!dryRun && isCandidateResolverGloballyEnabled()) {
      const { data, error } = await supabase.rpc('notification_cadence_policy_version');
      if (error && error.code !== 'PGRST202' && error.code !== '42883') {
        return NextResponse.json({ ok: false, error: 'cadence_version_check_unavailable', ...release }, { status: 503 });
      }
      if (error || data !== cadenceVersion) {
        return NextResponse.json({ ok: true, skipped: true, skipReason: 'cadence_version_mismatch', candidatesClaimed: 0, ...release });
      }
    }
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
      ...release,
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
