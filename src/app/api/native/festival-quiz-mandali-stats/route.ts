import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveFestivalQuizSeriesForUser } from '@/lib/calendar/resolve-festival-quiz-series';

export const runtime = 'nodejs';

// "N members of your Mandali completed today's [Festival] quiz" -- a small,
// independent, self-fetched stat for the Mandali screen (same shape as
// Home's FestivalQuizBanner self-fetch), not folded into the main Mandali
// feed payload.
export async function GET(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin.from('profiles').select('mandali_id').eq('id', user.id).maybeSingle();
  const mandaliId = (profile as any)?.mandali_id ?? null;
  if (!mandaliId) return NextResponse.json({ stats: [] });

  const { data: seasons } = await admin.from('festival_quiz_seasons').select('definition_key, title').eq('active', true);
  const seasonRows = (seasons ?? []) as { definition_key: string; title: string }[];
  if (seasonRows.length === 0) return NextResponse.json({ stats: [] });

  const { allSeries } = await resolveFestivalQuizSeriesForUser(admin, user.id);

  const { data: memberRows } = await admin.from('profiles').select('id').eq('mandali_id', mandaliId);
  const memberIds = (memberRows ?? []).map((m: any) => m.id as string);
  if (memberIds.length === 0) return NextResponse.json({ stats: [] });

  const stats: Array<{ definitionKey: string; title: string; daySequence: number; memberCount: number }> = [];
  for (const season of seasonRows) {
    const series = allSeries.find((s) => s.definitionKey === season.definition_key);
    const currentDay = series?.currentDay;
    if (!series || !currentDay) continue;
    const year = series.startDate ? Number(series.startDate.slice(0, 4)) : new Date().getUTCFullYear();

    const { count } = await admin
      .from('user_festival_quiz_progress')
      .select('id', { count: 'exact', head: true })
      .eq('definition_key', season.definition_key)
      .eq('year', year)
      .eq('day_sequence', currentDay)
      .in('user_id', memberIds);

    if ((count ?? 0) > 0) {
      stats.push({ definitionKey: season.definition_key, title: season.title, daySequence: currentDay, memberCount: count ?? 0 });
    }
  }

  return NextResponse.json({ stats });
}
