import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
