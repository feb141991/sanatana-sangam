import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

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
  const ninetyDaysAgoIso = isoDaysAgo(90);
  const ninetyDaysAgoDate = ninetyDaysAgoIso.slice(0, 10);

  const [
    profileResult,
    dailySadhanaResult,
    moodCheckinsResult,
    recommendationsResult,
    malaSessionsResult,
    quizResponsesResult,
    karmaLedgerResult,
    productAnalyticsResult,
    telemetryResult,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('daily_sadhana')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', ninetyDaysAgoDate)
      .order('date', { ascending: false }),
    admin
      .from('user_mood_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    admin
      .from('mala_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgoIso)
      .order('created_at', { ascending: false }),
    admin
      .from('quiz_responses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    admin
      .from('karma_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    // Consent-gated product measurement (kept 90 days). Every stored row is
    // returned; the table holds no other personal fields.
    admin
      .from('native_product_analytics_daily')
      .select('event_name, event_date, app_version, platform')
      .eq('user_id', user.id)
      .order('event_date', { ascending: false }),
    // App performance diagnostics linked to this account (kept 30 days).
    admin
      .from('native_startup_telemetry_summaries')
      .select('schema_version, app_version, platform, total_events, summary, received_at')
      .eq('user_id', user.id)
      .order('received_at', { ascending: false }),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    profile: profileResult.data ?? null,
    daily_sadhana_last_90_days: dailySadhanaResult.data ?? [],
    mood_checkins: moodCheckinsResult.data ?? [],
    recommendations: recommendationsResult.data ?? [],
    karma_ledger: karmaLedgerResult.error ? [] : (karmaLedgerResult.data ?? []),
    mala_sessions: malaSessionsResult.data ?? [],
    quiz_results: quizResponsesResult.data ?? [],
    // Empty when the user never opted in, or before the table's migration exists.
    product_analytics_events: productAnalyticsResult.error ? [] : (productAnalyticsResult.data ?? []),
    app_performance_diagnostics: telemetryResult.error ? [] : (telemetryResult.data ?? []),
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
