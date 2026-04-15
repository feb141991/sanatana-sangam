// ============================================================
// Supabase Edge Function: compute-profile
// Runs nightly at 3 AM via pg_cron
// Rebuilds practice profiles for all active users
//
// Data sources (both read):
//   mala_sessions  — real japa data (existing Sangam app table)
//   sadhana_events — shloka reads, bookmarks, vrata observed, app opens
//   daily_sadhana  — streak counts
//
// To schedule in Supabase SQL Editor:
//   SELECT cron.schedule(
//     'nightly-profile-compute',
//     '0 3 * * *',
//     $$SELECT net.http_post(
//       'https://mnbwodcswxoojndytngu.supabase.co/functions/v1/compute-profile',
//       '{}',
//       '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'
//     )$$
//   );
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

    // ── Find active users from BOTH sources ──
    // mala_sessions is the primary japa source; sadhana_events covers shloka reads etc.
    const [eventsRes, malaRes] = await Promise.all([
      supabase
        .from('sadhana_events')
        .select('user_id')
        .gte('created_at', since7d)
        .limit(1000),
      supabase
        .from('mala_sessions')
        .select('user_id')
        .gte('completed_at', since7d)
        .limit(1000),
    ]);

    const allUserIds = [
      ...(eventsRes.data?.map(e => e.user_id) ?? []),
      ...(malaRes.data?.map(m => m.user_id) ?? []),
    ];
    const uniqueUsers = [...new Set(allUserIds)];

    let computed = 0;
    let errors = 0;

    for (const userId of uniqueUsers) {
      try {
        const since30d = new Date(Date.now() - 30 * 86400000).toISOString();

        // ── Fetch both data sources in parallel ──
        const [userEventsRes, malaSessRes] = await Promise.all([
          supabase
            .from('sadhana_events')
            .select('event_type, event_data, created_at')
            .eq('user_id', userId)
            .gte('created_at', since30d)
            .order('created_at', { ascending: false })
            .limit(500),
          supabase
            .from('mala_sessions')
            .select('mantra, chant_source, count, target_count, duration_seconds, completed_at')
            .eq('user_id', userId)
            .gte('completed_at', since30d)
            .order('completed_at', { ascending: false })
            .limit(200),
        ]);

        const userEvents = userEventsRes.data ?? [];
        const malaSessions = malaSessRes.data ?? [];

        if (userEvents.length === 0 && malaSessions.length === 0) continue;

        // ── Compute profile merging both sources ──
        const profile = computeProfile(userId, userEvents, malaSessions);

        // ── Streak from daily_sadhana ──
        const { data: streakData } = await supabase
          .from('daily_sadhana')
          .select('streak_count, date')
          .eq('user_id', userId)
          .eq('any_practice', true)
          .order('date', { ascending: false })
          .limit(1);

        if (streakData?.length) {
          const daysSince = Math.floor(
            (Date.now() - new Date(streakData[0].date).getTime()) / 86400000
          );
          profile.current_streak = daysSince <= 1 ? streakData[0].streak_count : 0;
        } else {
          // Fall back: count distinct active days from mala_sessions
          const malaDates = new Set(
            malaSessions.map(m => m.completed_at.slice(0, 10))
          );
          profile.current_streak = malaDates.size > 0 ? 1 : 0; // conservative
        }

        const { data: longestData } = await supabase
          .from('daily_sadhana')
          .select('streak_count')
          .eq('user_id', userId)
          .order('streak_count', { ascending: false })
          .limit(1);

        profile.longest_streak = longestData?.[0]?.streak_count ?? 0;

        // ── Upsert ──
        await supabase
          .from('user_practice')
          .upsert(profile, { onConflict: 'user_id' });

        computed++;
      } catch (err) {
        console.error(`Failed for ${userId}:`, err);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        computed,
        errors,
        total_users: uniqueUsers.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ── Types ──

interface EventRow {
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

interface MalaRow {
  mantra: string;
  chant_source: string | null;
  count: number;
  target_count: number | null;
  duration_seconds: number | null;
  completed_at: string;
}

// ── Mantra text → deity/tradition mapping ──
// mala_sessions.mantra is free text (e.g. "Om Namah Shivaya", "Hare Krishna")
// We do keyword matching since there's no FK to our mantras table.

interface MantraInfo { deity: string; tradition: string; path: string }

function inferMantraInfo(mantraText: string): MantraInfo {
  const t = mantraText.toLowerCase();

  if (t.includes('krishna') || t.includes('hare') || t.includes('govind') ||
      t.includes('radhe') || t.includes('narayana') || t.includes('vishnu') ||
      t.includes('ram') || t.includes('rama') || t.includes('hanuman') ||
      t.includes('sita')) {
    const deity = t.includes('krishna') || t.includes('radhe') ? 'Krishna'
                : t.includes('hanuman') ? 'Hanuman'
                : t.includes('ram') || t.includes('rama') || t.includes('sita') ? 'Ram'
                : 'Vishnu';
    return { deity, tradition: 'vaishnav', path: 'bhakti' };
  }

  if (t.includes('shiva') || t.includes('shiv') || t.includes('mahadev') ||
      t.includes('mrityunjaya') || t.includes('rudra') || t.includes('shankar')) {
    return { deity: 'Shiva', tradition: 'shaiv', path: 'bhakti' };
  }

  if (t.includes('durga') || t.includes('kali') || t.includes('lakshmi') ||
      t.includes('saraswati') || t.includes('devi') || t.includes('amba') ||
      t.includes('bhavani') || t.includes('aim hreem') || t.includes('kleem')) {
    const deity = t.includes('durga') || t.includes('kali') || t.includes('amba') ? 'Durga'
                : t.includes('lakshmi') ? 'Lakshmi'
                : t.includes('saraswati') ? 'Saraswati'
                : 'Devi';
    return { deity, tradition: 'shakta', path: 'bhakti' };
  }

  if (t.includes('gayatri') || t.includes('surya') || t.includes('aditya')) {
    return { deity: 'Surya', tradition: 'smarta', path: 'jnana' };
  }

  if (t.includes('ganesha') || t.includes('ganesh') || t.includes('ganapati') ||
      t.includes('vinayaka')) {
    return { deity: 'Ganesha', tradition: 'smarta', path: 'bhakti' };
  }

  return { deity: 'general', tradition: 'general', path: 'bhakti' };
}

// ── Main profile computation ──

function computeProfile(
  userId: string,
  events: EventRow[],
  malaSessions: MalaRow[]
) {
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // ── Preferred practice time ──
  // Use app_open events from sadhana_events
  const hours = events
    .filter(e => e.event_type === 'app_open')
    .map(e => e.event_data?.hour as number)
    .filter(h => h !== undefined && h !== null);

  let preferred_time = 'irregular';
  if (hours.length >= 3) {
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    if (avg < 6)       preferred_time = 'brahma_muhurta';
    else if (avg < 11) preferred_time = 'morning';
    else if (avg >= 17) preferred_time = 'evening';
  } else if (malaSessions.length > 0) {
    // Fall back to mala session times
    const malaHours = malaSessions
      .map(m => new Date(m.completed_at).getUTCHours())
      .filter(h => !isNaN(h));
    if (malaHours.length >= 2) {
      const avg = malaHours.reduce((a, b) => a + b, 0) / malaHours.length;
      if (avg < 6)       preferred_time = 'brahma_muhurta';
      else if (avg < 11) preferred_time = 'morning';
      else if (avg >= 17) preferred_time = 'evening';
    }
  }

  // ── Average session duration ──
  // Prefer mala_sessions.duration_seconds (more reliable than sadhana_events)
  const malaDurations = malaSessions
    .map(m => m.duration_seconds)
    .filter((d): d is number => d !== null && d > 0);

  const eventDurations = events
    .filter(e => e.event_type === 'japa_session')
    .map(e => e.event_data?.duration_seconds as number)
    .filter(d => d > 0);

  const allDurations = [...malaDurations, ...eventDurations];
  const avg_session_duration_s = allDurations.length
    ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
    : 0;

  // ── Consistency: unique practice days / 30 ──
  const activeDates = new Set<string>();
  // From mala_sessions (japa days)
  malaSessions.forEach(m => activeDates.add(m.completed_at.slice(0, 10)));
  // From sadhana_events (shloka reads, vrata)
  events
    .filter(e => ['japa_session', 'shloka_read', 'vrata_observed'].includes(e.event_type))
    .forEach(e => activeDates.add(new Date(e.created_at).toISOString().slice(0, 10)));

  const consistency_score = Math.min(1, activeDates.size / 30);

  // ── Deity + tradition from mala_sessions (primary) ──
  let preferred_deity = 'general';
  let tradition = 'general';
  let primary_path = 'bhakti';

  if (malaSessions.length > 0) {
    // Count by inferred tradition from free-text mantra field
    const infoMap: Record<string, number> = {};
    malaSessions.forEach(m => {
      const info = inferMantraInfo(m.mantra);
      const key = `${info.deity}|${info.tradition}|${info.path}`;
      infoMap[key] = (infoMap[key] ?? 0) + (m.count || 1);
    });
    const topEntry = Object.entries(infoMap).sort((a, b) => b[1] - a[1])[0];
    if (topEntry) {
      const [deity, trad, path] = topEntry[0].split('|');
      preferred_deity = deity;
      tradition = trad;
      primary_path = path;
    }
  } else {
    // Fall back to sadhana_events japa_session mantra_id
    const mantras = events
      .filter(e => e.event_type === 'japa_session')
      .map(e => e.event_data?.mantra_id as string)
      .filter(Boolean);

    if (mantras.length > 0) {
      const counts: Record<string, number> = {};
      mantras.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const info = inferMantraInfo(top);
      preferred_deity = info.deity;
      tradition = info.tradition;
      primary_path = info.path;
    }
  }

  // ── Path: refine using shloka read vs japa ratio ──
  const malaCount = malaSessions.length;
  const shlokaReads = events.filter(e => e.event_type === 'shloka_read').length;
  const vrataObserved = events.filter(e => e.event_type === 'vrata_observed').length;
  const total = malaCount + shlokaReads + vrataObserved;

  if (total > 5) {
    if (shlokaReads / total > 0.5) primary_path = 'jnana';
    else if (vrataObserved / total > 0.4) primary_path = 'karma';
    else if (malaCount / total > 0.5) primary_path = 'bhakti';
  }

  // ── Content depth from shloka reading behaviour ──
  const reads = events.filter(e => e.event_type === 'shloka_read');
  const bookmarks = events.filter(e => e.event_type === 'shloka_bookmark');
  let content_depth = 'beginner';
  if (reads.length > 0) {
    const times = reads
      .map(e => e.event_data?.time_spent_s as number)
      .filter(t => t > 0);
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const bmRate = reads.length > 0 ? bookmarks.length / reads.length : 0;
    if (avgTime > 60 && bmRate > 0.3) content_depth = 'advanced';
    else if (avgTime > 30 || bmRate > 0.15) content_depth = 'intermediate';
  }

  // ── Favorite texts ──
  const textCounts: Record<string, number> = {};
  events
    .filter(e => ['shloka_read', 'shloka_bookmark'].includes(e.event_type))
    .forEach(e => {
      const t = e.event_data?.text_id as string;
      if (t) textCounts[t] = (textCounts[t] || 0) + 1;
    });
  const favorite_texts = Object.entries(textCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  // ── Most active day ──
  const dayCounts: Record<string, number> = {};
  // From mala_sessions
  malaSessions.forEach(m => {
    const d = DAYS[new Date(m.completed_at).getDay()];
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  });
  // From sadhana_events
  events.forEach(e => {
    const d = DAYS[new Date(e.created_at).getDay()];
    dayCounts[d] = (dayCounts[d] || 0) + 1;
  });
  const most_active_day = Object.keys(dayCounts).length
    ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'unknown';

  // ── Re-engagement style from notification response history ──
  const opened = events.filter(e => e.event_type === 'notification_opened').length;
  const dismissed = events.filter(e => e.event_type === 'notification_dismissed').length;
  let re_engagement_style = 'unknown';
  if (opened + dismissed >= 3) {
    re_engagement_style = opened > dismissed ? 'gentle' : 'challenge';
  }

  return {
    user_id: userId,
    preferred_time,
    avg_session_duration_s,
    consistency_score,
    current_streak: 0,   // filled by caller from daily_sadhana
    longest_streak: 0,
    primary_path,
    preferred_deity,
    tradition,
    content_depth,
    language_pref: ['english', 'sanskrit'],
    favorite_texts,
    most_active_day,
    skip_pattern: {},
    re_engagement_style,
    updated_at: new Date().toISOString(),
  };
}
