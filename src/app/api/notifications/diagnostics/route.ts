import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { canSendOneSignalPush } from '@/lib/onesignal-server';

// ─── Notification Diagnostics Endpoint ───────────────────────────────────────
// GET /api/notifications/diagnostics
// Returns a checklist of every layer in the notification pipeline so we can
// pinpoint exactly which step is broken without digging through Vercel logs.

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Not authenticated' },
      { status: 401 }
    );
  }

  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // ── 1. Env var: OneSignal App ID (client-side SDK) ────────────────────────
  const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  checks.onesignal_app_id = {
    ok: Boolean(onesignalAppId),
    detail: onesignalAppId
      ? `Set (${onesignalAppId.slice(0, 8)}…)`
      : 'Missing — NEXT_PUBLIC_ONESIGNAL_APP_ID not set in environment',
  };

  // ── 2. Env var: OneSignal REST API key (server push) ─────────────────────
  const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
  checks.onesignal_rest_key = {
    ok: Boolean(onesignalApiKey),
    detail: onesignalApiKey
      ? `Set (${onesignalApiKey.slice(0, 6)}…)`
      : 'Missing — ONESIGNAL_REST_API_KEY not set; server push is disabled',
  };

  // ── 3. Env var: Cron secret ───────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET?.trim();
  checks.cron_secret = {
    ok: Boolean(cronSecret),
    detail: cronSecret ? 'Set' : 'Missing — cron routes are unprotected (low risk) but likely misconfigured',
  };

  // ── 4. DB: Can we reach the notifications table? ──────────────────────────
  try {
    const serviceSupabase = createServiceRoleSupabaseClient();

    // Check if notification_key column exists (added in migration-v18)
    const { data: colRows, error: colError } = await serviceSupabase
      .rpc('pg_get_column_exists' as any, {
        p_table: 'notifications',
        p_column: 'notification_key',
      })
      .maybeSingle();

    // If the RPC doesn't exist, fall back to information_schema query
    let notificationKeyExists = false;
    if (colError || colRows === null) {
      const { data: infoRows } = await serviceSupabase
        .from('information_schema.columns' as any)
        .select('column_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'notifications')
        .eq('column_name', 'notification_key')
        .maybeSingle();
      notificationKeyExists = Boolean(infoRows);
    } else {
      notificationKeyExists = Boolean(colRows);
    }

    checks.db_notification_key_column = {
      ok: notificationKeyExists,
      detail: notificationKeyExists
        ? 'notification_key column present — cron deduplication will work'
        : 'MISSING — run migration-v18-sacred-time-delivery.sql in Supabase SQL Editor. Without this, all cron inserts fail silently.',
    };
  } catch (e) {
    checks.db_notification_key_column = {
      ok: false,
      detail: `Could not check schema: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // ── 5. DB: Count existing notifications for this user ────────────────────
  try {
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true });

    checks.db_notification_count = {
      ok: !countError,
      detail: countError
        ? `Query failed: ${countError.message}`
        : `User has ${count ?? 0} notification(s) in DB`,
    };
  } catch (e) {
    checks.db_notification_count = {
      ok: false,
      detail: `Exception: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // ── 6. DB: Try inserting a real in-app notification ───────────────────────
  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { error: insertError } = await serviceSupabase
      .from('notifications')
      .insert({
        user_id:    user.id,
        title:      '🔔 Diagnostics check — you can receive in-app notifications',
        body:       'This notification was inserted by the diagnostics tool to confirm your bell feed is working.',
        emoji:      '🧪',
        type:       'general',
        action_url: '/home',
      });

    checks.db_insert_test = {
      ok: !insertError,
      detail: insertError
        ? `Insert failed: ${insertError.message} — likely a schema mismatch or RLS issue`
        : 'Insert succeeded — in-app bell should show this notification',
    };
  } catch (e) {
    checks.db_insert_test = {
      ok: false,
      detail: `Exception: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // ── 7. OneSignal push reachability (server → OneSignal API) ──────────────
  const pushConfigured = canSendOneSignalPush();
  checks.onesignal_push_configured = {
    ok: pushConfigured,
    detail: pushConfigured
      ? 'Both App ID and REST key are set — server can send push notifications'
      : 'Server push disabled — add NEXT_PUBLIC_ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY to Vercel environment variables',
  };

  // ── 8. User profile: timezone set? ───────────────────────────────────────
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, wants_shloka_reminders, wants_festival_reminders, latitude, longitude')
      .eq('id', user.id)
      .maybeSingle();

    checks.profile_timezone = {
      ok: Boolean(profile?.timezone),
      detail: profile?.timezone
        ? `Timezone: ${profile.timezone}`
        : 'No timezone set — crons will treat you as UTC, notifications may arrive at wrong local time',
    };

    checks.profile_notifications_opt_in = {
      ok: Boolean(profile?.wants_shloka_reminders || profile?.wants_festival_reminders),
      detail: profile?.wants_shloka_reminders || profile?.wants_festival_reminders
        ? `wants_shloka_reminders=${profile?.wants_shloka_reminders}, wants_festival_reminders=${profile?.wants_festival_reminders}`
        : 'Both reminders are disabled in profile — crons will skip you. Enable them in Profile → Notifications.',
    };

    checks.profile_location = {
      ok: Boolean(profile?.latitude && profile?.longitude),
      detail: profile?.latitude && profile?.longitude
        ? `Lat/Lng set — Panchang timing (Rahu Kalam etc.) will be localised`
        : 'No location set — Panchang Rahu Kalam filter will default to New Delhi coordinates',
    };
  } catch (e) {
    checks.profile_timezone = { ok: false, detail: String(e) };
    checks.profile_notifications_opt_in = { ok: false, detail: String(e) };
    checks.profile_location = { ok: false, detail: String(e) };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const failCount = Object.values(checks).filter((c) => !c.ok).length;

  return NextResponse.json({
    all_ok: allOk,
    fail_count: failCount,
    user_id: user.id,
    checks,
    next_steps: allOk
      ? ['Everything looks configured. Open your notification bell and look for the diagnostic test notification. If you still see nothing, ensure you have clicked "Enable now" in the bell drawer to grant browser push permission.']
      : Object.entries(checks)
          .filter(([, v]) => !v.ok)
          .map(([k, v]) => `[${k}] ${v.detail}`),
  });
}
