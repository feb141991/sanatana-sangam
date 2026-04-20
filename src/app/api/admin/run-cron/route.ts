import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ─── POST /api/admin/run-cron ─────────────────────────────────────────────────
// Allows admin users to trigger any cron endpoint manually from the admin UI.
// Proxies the request with the CRON_SECRET header so the cron auth check passes.

const ALLOWED_CRONS = [
  '/api/cron/nitya-reminder',
  '/api/cron/shloka-reminder',
  '/api/cron/festival-reminder',
  '/api/cron/tithi-reminder',
] as const;

export async function POST(request: Request) {
  // Verify admin
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const cronPath: string = body.cronPath ?? '';

  if (!ALLOWED_CRONS.includes(cronPath as any)) {
    return NextResponse.json({ error: `Unknown cron: ${cronPath}` }, { status: 400 });
  }

  const origin   = new URL(request.url).origin;
  const cronUrl  = `${origin}${cronPath}`;
  const secret   = process.env.CRON_SECRET ?? '';

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
