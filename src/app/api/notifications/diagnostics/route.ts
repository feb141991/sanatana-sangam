import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { canSendPush, canSendOneSignalPush } from '@/lib/push-server';
import { getDisabledNotificationTypes, getNotificationSafetyState } from '@/lib/notification-safety';

// --- Notification Diagnostics Endpoint ---------------------------------------
// GET /api/notifications/diagnostics
// Returns a checklist of every layer in the notification pipeline so we can
// pinpoint exactly which step is broken without digging through Vercel logs.
//
// Two independent push channels as of the native app's OneSignal -> Expo
// migration (see src/lib/push-server.ts): Expo push reaches the native
// mobile app (checks 1/2/7 below), OneSignal still reaches PWA browser
// push subscribers exactly as before (checks 1b/7b) -- that integration
// (OneSignalIdentityProvider.tsx, lib/onesignal.ts) was untouched by the
// migration and is unrelated to the native app.

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: authError?.message ?? 'Not authenticated' },
      { status: 401 }
    );
  }

  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // -- 1. Env var: Expo access token (optional -- only required if the Expo
  // project has "Enhanced Security for Push Notifications" turned on) ------
  const expoAccessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  checks.expo_access_token = {
    ok: true, // never a hard failure -- Expo push works without this unless enhanced security is enabled on the project
    detail: expoAccessToken
      ? `Set (${expoAccessToken.slice(0, 6)}...)`
      : 'Not set -- fine unless "Enhanced Security for Push Notifications" is enabled in the Expo dashboard for this project, in which case sends will fail without it.',
  };

  // -- 1b. Env var: OneSignal App ID / REST key (PWA browser push) ----------
  const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  checks.onesignal_app_id = {
    ok: Boolean(onesignalAppId),
    detail: onesignalAppId
      ? `Set (${onesignalAppId.slice(0, 8)}...)`
      : 'Missing -- NEXT_PUBLIC_ONESIGNAL_APP_ID not set; PWA browser push subscription will not initialize',
  };

  const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();
  checks.onesignal_rest_key = {
    ok: Boolean(onesignalApiKey),
    detail: onesignalApiKey
      ? `Set (${onesignalApiKey.slice(0, 6)}...)`
      : 'Missing -- ONESIGNAL_REST_API_KEY not set; server cannot push to PWA browser subscribers',
  };

  // -- 2. This user's registered Expo push tokens (native app) --------------
  let tokenCount = 0;
  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { count, error } = await serviceSupabase
      .from('push_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    tokenCount = count ?? 0;
    checks.push_tokens_registered = {
      ok: !error && tokenCount > 0,
      detail: error
        ? `push_tokens query failed: ${error.message}`
        : tokenCount > 0
          ? `${tokenCount} native device token(s) registered for this account`
          : 'No native push tokens registered -- open the app so it can request permission and call POST /api/notifications/register-token',
    };
  } catch (e) {
    checks.push_tokens_registered = {
      ok: false,
      detail: `Could not check push_tokens: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // -- 3. Env var: Cron secret -----------------------------------------------
  const cronSecret = process.env.CRON_SECRET?.trim();
  checks.cron_secret = {
    ok: Boolean(cronSecret),
    detail: cronSecret ? 'Set' : 'Missing — cron routes are unprotected (low risk) but likely misconfigured',
  };

  // -- 3.5. Safety Controls ---------------------------------------------------
  const safetyState = getNotificationSafetyState('diagnostics', request);
  checks.notification_safety_state = {
    ok: !safetyState.skipDelivery || safetyState.isDryRun,
    detail: [
      `notificationsDisabled=${safetyState.isDisabled ? 'true' : 'false'}`,
      `notificationsDryRun=${safetyState.isDryRun ? 'true' : 'false'}`,
      `disabledTypes=${getDisabledNotificationTypes().join(',') || 'none'}`,
      `expoPushConfigured=${canSendPush() ? 'true' : 'false'}`,
      `oneSignalConfigured=${canSendOneSignalPush() ? 'true' : 'false'}`,
      `legacyWebPushRuntimeActive=false`,
      `reason=${safetyState.disabledReason || 'N/A'}`,
    ].join('; '),
  };

  // -- 4. DB: Can we reach the notifications table? --------------------------
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

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const { count, error } = await serviceSupabase
      .from('notification_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    checks.db_notification_deliveries = {
      ok: !error,
      detail: error
        ? `notification_deliveries unavailable: ${error.message}`
        : `notification_deliveries reachable — user has ${count ?? 0} delivery audit row(s)`,
    };
  } catch (e) {
    checks.db_notification_deliveries = {
      ok: false,
      detail: `Could not check notification_deliveries: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // -- 5. DB: Count existing notifications for this user ---------------------
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

  // -- 6. DB: Try inserting a real in-app notification ------------------------
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

  // -- 7. Expo push reachability summary (native app) -------------------------
  checks.expo_push_configured = {
    ok: tokenCount > 0,
    detail: tokenCount > 0
      ? 'This account has at least one registered native device token — server push should reach the app'
      : 'No native device token registered for this account yet — push cannot reach the app until it registers one',
  };

  // -- 7b. OneSignal push reachability summary (PWA browser) -------------------
  const oneSignalReady = canSendOneSignalPush();
  checks.onesignal_push_configured = {
    ok: oneSignalReady,
    detail: oneSignalReady
      ? 'Both App ID and REST key are set — server can push to PWA browser subscribers'
      : 'Server-side PWA push disabled — add NEXT_PUBLIC_ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY to environment variables',
  };

  // -- 8. User profile: timezone set? -----------------------------------------
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone, wants_shloka_reminders, wants_festival_reminders, wants_nitya_reminders, latitude, longitude')
      .eq('id', user.id)
      .maybeSingle();

    checks.profile_timezone = {
      ok: Boolean(profile?.timezone),
      detail: profile?.timezone
        ? `Timezone: ${profile.timezone}`
        : 'No timezone set — crons will treat you as UTC, notifications may arrive at wrong local time',
    };

    checks.profile_notifications_opt_in = {
      ok: Boolean(profile?.wants_shloka_reminders || profile?.wants_festival_reminders || profile?.wants_nitya_reminders),
      detail: profile?.wants_shloka_reminders || profile?.wants_festival_reminders || profile?.wants_nitya_reminders
        ? `wants_shloka_reminders=${profile?.wants_shloka_reminders}, wants_festival_reminders=${profile?.wants_festival_reminders}, wants_nitya_reminders=${profile?.wants_nitya_reminders}`
        : 'All reminder lanes are disabled in profile — crons will skip you. Enable them in Profile → Notifications.',
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
      ? ['Everything looks configured. Open your notification bell and look for the diagnostic test notification. If you still see nothing on the native app, confirm it has permission to send notifications in system settings; on web, confirm browser push permission was granted.']
      : Object.entries(checks)
          .filter(([, v]) => !v.ok)
          .map(([k, v]) => `[${k}] ${v.detail}`),
  });
}
