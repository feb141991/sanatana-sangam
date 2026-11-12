import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { describeExport, readAllRows, readExportSources, USER_EXPORT_SOURCES, type ExportIncomplete } from '@/lib/user-data-export';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// About 80 tables are read, a page at a time, a few at a time. On a busy database that can take a while.
export const maxDuration = 60;

// Auth via getApiUser (cookie first, Bearer token fallback) — not the
// previous cookie-only createServerSupabaseClient(), which always returned
// 401 for native callers (native has no cookie jar; apiFetch sends a Bearer
// token instead). This is the same gap found and fixed in
// /api/mood/insights/{weekly,monthly} — see that commit for the pattern.
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getApiUser(request);

  if (authError || !user) {
    return getApiAuthFailureResponse(authError);
  }

  const admin = createAdminClient();
  const read = (table: string, orderBy: Array<string | { column: string; ascending: boolean }>, select?: string) =>
    readAllRows(admin, { table, userColumns: ['user_id'], orderBy, select }, user.id);

  const [
    profileResult,
    dailySadhana,
    moodCheckins,
    recommendations,
    malaSessions,
    quizResponses,
    karmaLedger,
    // Consent-gated product measurement (kept 90 days). Every stored row is
    // returned; the table holds no other personal fields.
    productAnalytics,
    // App performance diagnostics linked to this account (kept 30 days).
    telemetry,
    // Taps on notifications we sent this account (kept 90 days; recorded only with the account's consent). Every
    // stored row is returned. The table holds no message text and no other personal fields.
    notificationTaps,
    more,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    read('daily_sadhana', [{ column: 'date', ascending: false }]),
    read('user_mood_checkins', [{ column: 'created_at', ascending: false }, 'id']),
    read('recommendations', [{ column: 'date', ascending: false }, 'id']),
    read('mala_sessions', [{ column: 'created_at', ascending: false }, 'id']),
    read('quiz_responses', [{ column: 'created_at', ascending: false }, 'id']),
    read('karma_ledger', [{ column: 'created_at', ascending: false }, 'id']),
    read('native_product_analytics_daily', [{ column: 'event_date', ascending: false }, 'event_name'], 'event_name, event_date, app_version, platform'),
    read('native_startup_telemetry_summaries', [{ column: 'received_at', ascending: false }], 'schema_version, app_version, platform, total_events, summary, received_at'),
    read('notification_taps', [{ column: 'tapped_at', ascending: false }, 'notification_key'], 'notification_key, notification_type, tapped_at, launch_state, app_version, platform, recorded_at'),
    readExportSources(admin, user.id),
  ]);

  const legacy = [dailySadhana, moodCheckins, recommendations, malaSessions, quizResponses, karmaLedger, productAnalytics, telemetry, notificationTaps];
  const incomplete: ExportIncomplete[] = [
    ...legacy.flatMap((result) => (result.incomplete ? [result.incomplete] : [])),
    ...more.incomplete,
  ];
  const tablesWithData = legacy.filter((result) => result.rows.length > 0).length + Object.keys(more.data).length + (profileResult.data ? 1 : 0);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    // What this file is, what it leaves out and why, and any table that could not be read in full.
    export_notes: describeExport(USER_EXPORT_SOURCES, incomplete, tablesWithData),
    profile: profileResult.data ?? null,
    daily_sadhana: dailySadhana.rows,
    mood_checkins: moodCheckins.rows,
    recommendations: recommendations.rows,
    karma_ledger: karmaLedger.rows,
    mala_sessions: malaSessions.rows,
    quiz_results: quizResponses.rows,
    // Empty when the user never opted in, or before the table's migration exists.
    product_analytics_events: productAnalytics.rows,
    app_performance_diagnostics: telemetry.rows,
    // Empty when no consent was given, or before the table's migration exists.
    notification_taps: notificationTaps.rows,
    // Everything else linked to the account, one entry per table that has rows.
    other_data: more.data,
  };

  const fileName = `shoonaya-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename=${fileName}`,
      'Cache-Control': 'no-store',
    },
  });
}
