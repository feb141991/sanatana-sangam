// ============================================================
// Edge Function: ai-kul-summary
// Weekly kul digest — Gemini generates a personalised summary
// of how the kul practiced this week, sent to each member.
//
// Can be called:
//   a) For a specific kul:  POST { kul_id }
//   b) For all kuls:        POST { all: true }  ← called by weekly cron
//
// Output per member:
//   - In-app notification (notifications table)
//   - A bot message posted to kul_messages
//   - Optional OneSignal push
//
// Deploy:
//   supabase functions deploy ai-kul-summary
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const body = await req.json();
    const { kul_id, all = false, send_push = false } = body;

    if (!kul_id && !all) return errorResponse('kul_id or all:true required', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Determine which kuls to process ──
    let kulIds: string[] = [];

    if (all) {
      const { data: allKuls } = await supabase.from('kuls').select('id');
      kulIds = allKuls?.map(k => k.id) ?? [];
    } else {
      kulIds = [kul_id];
    }

    const results = [];

    for (const kid of kulIds) {
      try {
        const result = await processKul(supabase, kid, send_push);
        results.push({ kul_id: kid, ...result });
      } catch (err) {
        console.error(`ai-kul-summary failed for ${kid}:`, err);
        results.push({ kul_id: kid, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ai-kul-summary error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Process one kul ──

async function processKul(
  supabase: ReturnType<typeof createClient>,
  kulId: string,
  sendPush: boolean
) {
  const today = new Date().toISOString().split('T')[0];
  const weekKey = `kul-weekly-${kulId.slice(0, 8)}-${getWeekKey()}`;

  // ── Fetch kul stats from view ──
  const { data: stats } = await supabase
    .from('kul_weekly_stats')
    .select('*')
    .eq('kul_id', kulId)
    .single();

  if (!stats) return { skipped: true, reason: 'no_stats' };
  if (stats.active_members_7d === 0) return { skipped: true, reason: 'no_activity_this_week' };

  // ── Fetch member list ──
  const { data: members } = await supabase
    .from('kul_members')
    .select('user_id, role')
    .eq('kul_id', kulId);

  if (!members?.length) return { skipped: true, reason: 'no_members' };

  // ── Fetch pending tasks for context ──
  const { data: pendingTasks } = await supabase
    .from('kul_pending_tasks')
    .select('assigned_to, title, task_type, urgency')
    .eq('kul_id', kulId)
    .limit(5);

  // ── Fetch upcoming kul events ──
  const { data: upcomingEvents } = await supabase
    .from('kul_events')
    .select('title, event_type, event_date, recurring')
    .eq('kul_id', kulId)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(3);

  // ── Generate Gemini digest ──
  const digest = await generateWeeklyDigest({
    kulName:          stats.kul_name,
    kulEmoji:         stats.avatar_emoji ?? '🙏',
    totalMembers:     stats.total_members,
    activeMembers:    stats.active_members_7d,
    totalJapa:        stats.total_japa_7d,
    avgDurationS:     stats.avg_session_duration_s,
    topStreak:        stats.top_streak,
    pendingTasks:     pendingTasks ?? [],
    upcomingEvents:   upcomingEvents ?? [],
  });

  // ── Post digest as a bot message in kul_messages ──
  // The kul feed sees this as a weekly update card
  await supabase.from('kul_messages').insert({
    kul_id:    kulId,
    sender_id: members.find(m => m.role === 'admin')?.user_id ?? members[0].user_id,
    content:   `📊 *Weekly Practice Summary*\n\n${digest.kul_message}`,
    reaction:  null,
  });

  // ── Send personalised notification to each member ──
  let notified = 0;
  for (const member of members) {
    try {
      await supabase.from('notifications').upsert({
        user_id:          member.user_id,
        title:            `${stats.avatar_emoji ?? '🙏'} ${stats.kul_name} weekly summary`,
        body:             digest.member_notification,
        emoji:            stats.avatar_emoji ?? '🙏',
        type:             'kul_weekly_summary',
        read:             false,
        action_url:       `/kul/${kulId}`,
        notification_key: `${weekKey}-${member.user_id.slice(0, 8)}`,
        local_date:       today,
        sent_timezone:    'UTC',
      }, { onConflict: 'notification_key' });
      notified++;
    } catch (err) {
      console.warn(`Notification failed for ${member.user_id}:`, err);
    }
  }

  return {
    kul_name:       stats.kul_name,
    active_members: stats.active_members_7d,
    total_japa:     stats.total_japa_7d,
    top_streak:     stats.top_streak,
    notified,
  };
}

// ── Generate weekly digest via Gemini ──

async function generateWeeklyDigest(opts: {
  kulName: string;
  kulEmoji: string;
  totalMembers: number;
  activeMembers: number;
  totalJapa: number;
  avgDurationS: number;
  topStreak: number;
  pendingTasks: Array<{ title: string; task_type: string; urgency: string }>;
  upcomingEvents: Array<{ title: string; event_type: string; event_date: string }>;
}): Promise<{ kul_message: string; member_notification: string }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  const {
    kulName, kulEmoji, totalMembers, activeMembers, totalJapa,
    avgDurationS, topStreak, pendingTasks, upcomingEvents,
  } = opts;

  const avgMinutes = Math.round(avgDurationS / 60);
  const participationPct = Math.round((activeMembers / totalMembers) * 100);

  // Fallback
  if (!geminiKey) {
    return {
      kul_message: `This week ${activeMembers}/${totalMembers} members practiced. Combined japa: ${totalJapa.toLocaleString()}. Top streak: ${topStreak} days. Keep going! 🙏`,
      member_notification: `${kulEmoji} ${kulName}: ${activeMembers} of ${totalMembers} members practiced this week. Total japa: ${totalJapa.toLocaleString()}.`,
    };
  }

  const upcomingStr = upcomingEvents.length
    ? upcomingEvents.map(e => `${e.title} on ${e.event_date}`).join(', ')
    : 'none';

  const tasksStr = pendingTasks.length
    ? pendingTasks.map(t => `${t.title} (${t.urgency})`).join(', ')
    : 'none';

  const prompt = `You are generating a weekly spiritual practice digest for the kul "${kulName}" ${kulEmoji} in the Shoonaya app.

WEEKLY STATS:
- Members: ${activeMembers} of ${totalMembers} practiced (${participationPct}%)
- Combined japa count: ${totalJapa.toLocaleString()}
- Average session: ${avgMinutes} minutes
- Longest streak in kul: ${topStreak} days
- Pending tasks: ${tasksStr}
- Upcoming events: ${upcomingStr}

Generate two things (JSON, no markdown):
{
  "kul_message": "A warm, celebratory 2-3 sentence kul feed post summarising this week's practice. Celebrate achievements, encourage those who missed days. May reference upcoming events or pending tasks. Spiritual and community-oriented tone.",
  "member_notification": "A short push notification body (max 100 chars) teasing the weekly summary. Should make members want to open the app and see full stats."
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.7, responseMimeType: 'application/json' },
    }),
  });

  if (!resp.ok) {
    return {
      kul_message: `${activeMembers} of ${totalMembers} members practiced this week with ${totalJapa.toLocaleString()} total japa. ${topStreak > 0 ? `Best streak: ${topStreak} days.` : ''} Keep going! 🙏`,
      member_notification: `${kulEmoji} ${kulName}: ${activeMembers}/${totalMembers} members practiced this week.`,
    };
  }

  const json = await resp.json();
  try {
    return JSON.parse(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
  } catch {
    return {
      kul_message: `This week ${activeMembers}/${totalMembers} members practiced. Combined japa: ${totalJapa.toLocaleString()}. 🙏`,
      member_notification: `${kulEmoji} ${kulName} weekly summary is ready.`,
    };
  }
}

// ── Week key helper: "2026-W15" format ──
function getWeekKey(): string {
  const now  = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week  = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
