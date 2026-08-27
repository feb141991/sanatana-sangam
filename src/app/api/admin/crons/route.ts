import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';
import { fetchCronStatusMatrix, recordCronTelemetry, CRON_CATALOGUE } from '@/lib/monitoring/cron-telemetry';

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  try {
    const summary = await fetchCronStatusMatrix();
    return NextResponse.json({ crons: summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch cron status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const cronPath: string = body.cronPath ?? '';

  const matched = CRON_CATALOGUE.find(c => c.route === cronPath || c.route.split('?')[0] === cronPath.split('?')[0]);
  if (!matched) {
    return NextResponse.json({ error: `Unknown cron path: ${cronPath}` }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const cronUrl = `${origin}${cronPath}`;
  const secret = process.env.CRON_SECRET ?? '';

  const startTime = Date.now();
  try {
    const res = await fetch(cronUrl, {
      method: matched.method,
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });

    const data = await res.json().catch(() => ({}));
    const durationMs = Date.now() - startTime;

    await recordCronTelemetry({
      route: cronPath,
      statusCode: res.status,
      durationMs,
      responseData: data,
      error: !res.ok ? (data?.error || `HTTP ${res.status}`) : undefined,
      triggeredBy: 'admin_manual',
    });

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      duration_ms: durationMs,
      result: data,
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : 'Network fetch failed';

    await recordCronTelemetry({
      route: cronPath,
      statusCode: 500,
      durationMs,
      error: errorMsg,
      triggeredBy: 'admin_manual',
    });

    return NextResponse.json({ error: errorMsg, ok: false, status: 500 }, { status: 500 });
  }
}
