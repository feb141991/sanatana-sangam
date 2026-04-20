import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

// ─── POST /api/admin/run-cron ─────────────────────────────────────────────────
// Allows admin users to trigger any cron endpoint manually from the admin UI.
// Proxies the request with the CRON_SECRET header so the cron auth check passes.

const ALLOWED_CRONS = [
  '/api/cron/nitya-reminder',
  '/api/cron/shloka-reminder',
  '/api/cron/festival-reminder',
  '/api/cron/tithi-reminder',
  '/api/cron/brahma-muhurta',
] as const;

export async function POST(request: Request) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const cronPath: string = body.cronPath ?? '';

  if (!ALLOWED_CRONS.includes(cronPath as any)) {
    return NextResponse.json({ error: `Unknown cron: ${cronPath}` }, { status: 400 });
  }

  const origin  = new URL(request.url).origin;
  const cronUrl = `${origin}${cronPath}`;
  const secret  = process.env.CRON_SECRET ?? '';

  try {
    const cronRes = await fetch(cronUrl, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    const data = await cronRes.json().catch(() => ({}));
    return NextResponse.json({ ok: cronRes.ok, status: cronRes.status, result: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron call failed' },
      { status: 500 }
    );
  }
}
