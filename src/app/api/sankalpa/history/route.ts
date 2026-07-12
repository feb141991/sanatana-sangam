import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';

// GET /api/sankalpa/history — past (completed/abandoned) Sankalpas for the
// authenticated user, plus aggregate stats computed from those same rows.
// No new table/migration: `sankalpas.status` already flips to 'completed'
// or 'abandoned' (see PATCH in ../route.ts and POST's "mark existing active
// as abandoned" step), so history is just the rows GET /api/sankalpa never
// shows because it only ever selects the single active one.
//
// `stats.longestDurationDays` uses `target_days` (the vow's committed
// length), matching how SankalpaCompletionCeremony already labels this
// number ("N days held") rather than re-deriving it from actual checkin
// dates — target_days is fixed at creation time and is what "held for N
// days" has always meant in this app's copy.

type SankalpaHistoryRow = {
  id: string;
  text: string;
  related_practice: string | null;
  target_days: number | null;
  start_date: string;
  end_date: string;
  status: 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }
  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  try {
    const { data, error } = await supabase
      .from('sankalpas')
      .select('id, text, related_practice, target_days, start_date, end_date, status, created_at, updated_at')
      .eq('user_id', user.id)
      .in('status', ['completed', 'abandoned'])
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const rows = (data ?? []) as SankalpaHistoryRow[];
    const completed = rows.filter((r) => r.status === 'completed');
    const abandoned = rows.filter((r) => r.status === 'abandoned');
    const totalFinished = completed.length + abandoned.length;
    const completionRate = totalFinished > 0 ? Math.round((completed.length / totalFinished) * 100) : 0;
    const longestDurationDays = completed.reduce((max, r) => Math.max(max, r.target_days ?? 0), 0);

    return NextResponse.json({
      history: rows,
      stats: {
        totalCompleted: completed.length,
        totalAbandoned: abandoned.length,
        completionRate,
        longestDurationDays,
      },
    });
  } catch (err) {
    console.error('[sankalpa/history/GET] Failed:', err);
    return NextResponse.json({ error: 'Failed to fetch Sankalpa history' }, { status: 500 });
  }
}
