import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  malaSessionBeads,
  malaSessionDate,
  malaSessionDurationSeconds,
  malaSessionMantra,
} from '@/lib/mala-sessions';

// ─── GET /api/user/report ─────────────────────────────────────────────────────
// Returns a 30-day sadhana activity summary for the authenticated user.
// The response JSON is used by ProfileClient to render + download a report.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = user.id;
  const now    = new Date();
  const from   = new Date(now);
  from.setDate(from.getDate() - 30);
  const fromIso  = from.toISOString().slice(0, 10);
  const nowIso   = now.toISOString().slice(0, 10);

  // ── 1. Profile ──────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition, seva_score, city, country')
    .eq('id', userId)
    .single();

  // ── 2. Japa sessions ────────────────────────────────────────────────────────
  const { data: japaSessions } = await supabase
    .from('mala_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', from.toISOString())
    .order('completed_at', { ascending: true });

  const japaTotal     = japaSessions?.length ?? 0;
  const japaBeads     = japaSessions?.reduce((s, r) => s + malaSessionBeads(r), 0) ?? 0;
  const japaDuration  = japaSessions?.reduce((s, r) => s + malaSessionDurationSeconds(r), 0) ?? 0;
  const mantraCounts: Record<string, number> = {};
  for (const s of japaSessions ?? []) {
    const mantra = malaSessionMantra(s);
    if (mantra) mantraCounts[mantra] = (mantraCounts[mantra] ?? 0) + 1;
  }
  const topMantras = Object.entries(mantraCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // ── 3. Nitya Karma log ──────────────────────────────────────────────────────
  const { data: nityaRows } = await supabase
    .from('nitya_karma_log')
    .select('log_date, step_id')
    .eq('user_id', userId)
    .gte('log_date', fromIso)
    .lte('log_date', nowIso);

  const nityaByDate: Record<string, string[]> = {};
  for (const r of nityaRows ?? []) {
    if (!nityaByDate[r.log_date]) nityaByDate[r.log_date] = [];
    nityaByDate[r.log_date].push(r.step_id);
  }
  const nityaActiveDays  = Object.keys(nityaByDate).length;
  const nityaFullDays    = Object.values(nityaByDate).filter(steps => steps.length >= 7).length;
  const nityaTotalSteps  = (nityaRows ?? []).length;

  // Build streak from sorted dates
  const sortedDates = Object.keys(nityaByDate).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak    = 0;
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (prev) {
      const diff = (new Date(d).getTime() - new Date(prev).getTime()) / 86400000;
      if (diff === 1) { tempStreak++; } else { tempStreak = 1; }
    } else {
      tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    prev = d;
  }
  // current streak: check if last date is today or yesterday
  if (sortedDates.length > 0) {
    const lastDate  = sortedDates[sortedDates.length - 1];
    const diffToday = (new Date(nowIso).getTime() - new Date(lastDate).getTime()) / 86400000;
    if (diffToday <= 1) {
      currentStreak = tempStreak;
    }
  }

  // ── 4. Sadhana events (general activity) ───────────────────────────────────
  const { data: sadhanaEvents } = await supabase
    .from('sadhana_events')
    .select('event_type, created_at')
    .eq('user_id', userId)
    .gte('created_at', from.toISOString());

  const eventCounts: Record<string, number> = {};
  for (const e of sadhanaEvents ?? []) {
    if (e.event_type) eventCounts[e.event_type] = (eventCounts[e.event_type] ?? 0) + 1;
  }

  // ── 5. Community activity ───────────────────────────────────────────────────
  const [{ count: postsCount }, { count: threadsCount }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId).gte('created_at', from.toISOString()),
    supabase.from('threads').select('*', { count: 'exact', head: true }).eq('author_id', userId).gte('created_at', from.toISOString()),
  ]);

  // ── 6. Build 30-day heatmap (activity per day) ─────────────────────────────
  const heatmap: { date: string; japa: number; nitya: number }[] = [];
  const japaDates = new Set((japaSessions ?? []).map(s => malaSessionDate(s)).filter(Boolean));
  for (let i = 0; i < 30; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    heatmap.push({
      date:  ds,
      japa:  japaDates.has(ds) ? 1 : 0,
      nitya: nityaByDate[ds]?.length ?? 0,
    });
  }

  return NextResponse.json({
    generated_at:   now.toISOString(),
    period:         { from: fromIso, to: nowIso },
    profile: {
      name:       profile?.full_name ?? profile?.username ?? 'Sadhak',
      tradition:  profile?.tradition ?? 'hindu',
      seva_score: profile?.seva_score ?? 0,
      location:   [profile?.city, profile?.country].filter(Boolean).join(', ') || null,
    },
    japa: {
      sessions:         japaTotal,
      total_beads:      japaBeads,
      total_malas:      Math.floor(japaBeads / 108),
      duration_minutes: Math.round(japaDuration / 60),
      top_mantras:      topMantras,
    },
    nitya: {
      active_days:   nityaActiveDays,
      full_days:     nityaFullDays,
      total_steps:   nityaTotalSteps,
      current_streak: currentStreak,
      longest_streak: longestStreak,
    },
    community: {
      posts:   postsCount ?? 0,
      threads: threadsCount ?? 0,
    },
    event_counts: eventCounts,
    heatmap,
  });
}
