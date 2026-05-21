import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { resolveVratSlug } from '@/lib/vrat-data';

// ─── Calendar Health Cron ─────────────────────────────────────────────────────
// Schedule: 0 9 1 11 * (9 AM UTC, 1st November every year)
//
// Fires once a year as an early warning that the festival calendar needs to be
// refreshed for the coming year. It:
//   1. Counts upcoming festivals in the DB (date >= today).
//   2. If < 60 remaining, sends a push notification to the admin user
//      and inserts a notification into the DB for the admin bell.
//   3. Always returns a JSON health report — useful for manual spot-checks.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'career.prince@gmail.com';
const LOW_THRESHOLD = 60; // warn when fewer than this many festivals remain

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date().toISOString().split('T')[0];

  const currentYear = new Date().getFullYear();

  const { data: festivalRows, error: festivalError } = await supabase
    .from('festivals')
    .select('id, date, year, name, type, review_status, verification_status, suggested_date, verification_run_at')
    .order('date', { ascending: true });

  if (festivalError) {
    return NextResponse.json({ error: festivalError.message }, { status: 500 });
  }

  const festivals = festivalRows ?? [];
  const remaining = festivals.filter((festival) => festival.date >= today).length;
  const nextYear  = currentYear + 1;
  const needsRefresh = remaining < LOW_THRESHOLD;
  const rowsByYear = festivals.reduce<Record<string, number>>((acc, festival) => {
    const key = String(festival.year);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const pendingReview = festivals.filter((festival) => festival.review_status !== 'reviewed').length;
  const mismatches = festivals.filter((festival) => festival.verification_status === 'mismatch').length;
  const suggestedDatePending = festivals.filter((festival) => Boolean(festival.suggested_date)).length;
  const unsafeObservanceRoutes = festivals.filter((festival) => (
    festival.type === 'vrat' && resolveVratSlug(festival.name) === null
  )).length;
  const verificationRuns = festivals
    .map((festival) => festival.verification_run_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a));

  // Always log to the response
  const report = {
    checked_at:    new Date().toISOString(),
    upcoming_festivals: remaining,
    threshold:     LOW_THRESHOLD,
    needs_refresh: needsRefresh,
    next_year:     nextYear,
    rows_by_year: rowsByYear,
    pending_review: pendingReview,
    ai_mismatches: mismatches,
    suggested_date_pending: suggestedDatePending,
    unsafe_observance_routes: unsafeObservanceRoutes,
    last_verification_run_at: verificationRuns[0] ?? null,
  };

  if (!needsRefresh) {
    return NextResponse.json({ ok: true, message: 'Calendar is healthy', ...report });
  }

  // Find the admin user's profile ID by email
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', ADMIN_EMAIL)
    .single();

  // Fallback: list auth users and match by email
  let adminId: string | null = adminUser?.id ?? null;
  if (!adminId) {
    const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const match = authList?.users?.find(u => u.email === ADMIN_EMAIL);
    adminId = match?.id ?? null;
  }

  const title = `📅 Festival Calendar needs refresh for ${nextYear}`;
  const body  = `Only ${remaining} festivals remain in the DB. Add ${nextYear} entries via Admin → Festivals so reminders and countdowns keep working.`;

  // Insert into notifications table (shows in the admin's bell)
  if (adminId) {
    await supabase.from('notifications').insert({
      user_id: adminId,
      title,
      body,
      type:   'system',
      read:   false,
    });
  }

  // Send push to admin via OneSignal (best-effort)
  try {
    if (adminId) {
      await sendOneSignalPush({
        userIds: [adminId],
        title,
        body,
        url: '/admin',
      });
    }
  } catch (pushErr) {
    console.warn('[calendar-health] push failed (non-fatal):', pushErr);
  }

  return NextResponse.json({
    ok: true,
    message: `Calendar low — admin notified (${remaining} upcoming festivals)`,
    admin_notified: Boolean(adminId),
    ...report,
  });
}
