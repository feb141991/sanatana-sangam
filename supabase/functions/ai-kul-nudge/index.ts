// ============================================================
// Edge Function: ai-kul-nudge
// Community accountability nudge — fires when kul members have
// practiced today but the target user hasn't yet.
//
// Logic:
//   1. Find all kuls the user belongs to
//   2. For each kul, count who practiced today (via kul_practice_today view)
//   3. If ≥1 member practiced and user hasn't → generate community nudge
//   4. Write to notifications table (in-app bell)
//   5. Optionally push via OneSignal
//
// POST body:
//   user_id     string   — user to nudge
//   send_push?  boolean  — send OneSignal push (default false)
//
// Deploy:
//   supabase functions deploy ai-kul-nudge
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const { user_id, send_push = false } = await req.json();
    if (!user_id) return errorResponse('user_id is required', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];

    // ── 1. Check if user already practiced today ──
    const { data: userToday } = await supabase
      .from('mala_sessions')
      .select('id')
      .eq('user_id', user_id)
      .gte('completed_at', today)
      .limit(1)
      .single();

    if (userToday) {
      // User already practiced — no nudge needed
      return new Response(
        JSON.stringify({ skipped: true, reason: 'user_already_practiced' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Find all kuls the user belongs to ──
    const { data: memberships } = await supabase
      .from('kul_members')
      .select('kul_id, role')
      .eq('user_id', user_id);

    if (!memberships?.length) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_kul_membership' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const kulIds = memberships.map(m => m.kul_id);

    // ── 3. For each kul, check practice activity today ──
    const { data: kulActivity } = await supabase
      .from('kul_practice_today')
      .select('kul_id, user_id, japa_count_today, practiced_today')
      .in('kul_id', kulIds)
      .neq('user_id', user_id);  // exclude the target user

    if (!kulActivity?.length) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_kul_activity_today' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Count how many members practiced per kul
    const kulStats: Record<string, { practiced: number; total: number; totalJapa: number }> = {};
    for (const row of kulActivity) {
      if (!kulStats[row.kul_id]) kulStats[row.kul_id] = { practiced: 0, total: 0, totalJapa: 0 };
      kulStats[row.kul_id].total++;
      if (row.practiced_today) {
        kulStats[row.kul_id].practiced++;
        kulStats[row.kul_id].totalJapa += row.japa_count_today ?? 0;
      }
    }

    // Find the kul with the most active members today
    const bestKulId = Object.entries(kulStats)
      .sort((a, b) => b[1].practiced - a[1].practiced)
      .find(([, s]) => s.practiced > 0)?.[0];

    if (!bestKulId) {
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no_members_practiced_today' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const stats = kulStats[bestKulId];

    // ── 4. Fetch kul name + user practice profile ──
    const [kulRes, profileRes] = await Promise.all([
      supabase.from('kuls').select('name, avatar_emoji').eq('id', bestKulId).single(),
      supabase.from('user_practice').select('tradition, preferred_deity, primary_path, re_engagement_style').eq('user_id', user_id).single(),
    ]);

    const kul     = kulRes.data;
    const profile = profileRes.data ?? {};
    const kulName = kul?.name ?? 'your kul';
    const kulEmoji = kul?.avatar_emoji ?? '🙏';

    // ── 5. Generate community nudge message via Gemini ──
    const message = await generateKulNudge({
      kulName,
      kulEmoji,
      membersCount: stats.practiced,
      totalJapa: stats.totalJapa,
      tradition: profile.tradition ?? 'general',
      deity: profile.preferred_deity ?? 'the divine',
      path: profile.primary_path ?? 'bhakti',
    });

    // ── 6. Write to in-app notifications ──
    const notificationKey = `kul-nudge-${user_id.slice(0, 8)}-${today}`;
    await supabase.from('notifications').upsert({
      user_id,
      title:            `${kulEmoji} ${kulName} is practicing`,
      body:             message.message,
      emoji:            kulEmoji,
      type:             'kul_nudge',
      read:             false,
      action_url:       '/japa',
      notification_key: notificationKey,
      local_date:       today,
      sent_timezone:    'UTC',
    }, { onConflict: 'notification_key' });

    // ── 7. Optionally push via OneSignal ──
    let push_sent = false;
    let push_error: string | null = null;

    if (send_push) {
      const result = await sendOneSignalPush(supabase, user_id, message);
      push_sent = result.success;
      push_error = result.error;
    }

    return new Response(
      JSON.stringify({
        nudged:     true,
        kul_name:   kulName,
        kul_id:     bestKulId,
        members_practiced: stats.practiced,
        total_japa: stats.totalJapa,
        message:    message.message,
        call_to_action: message.call_to_action,
        push_sent,
        push_error,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ai-kul-nudge error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Generate the community nudge message ──

async function generateKulNudge(opts: {
  kulName: string;
  kulEmoji: string;
  membersCount: number;
  totalJapa: number;
  tradition: string;
  deity: string;
  path: string;
}): Promise<{ message: string; call_to_action: string }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  const { kulName, kulEmoji, membersCount, totalJapa, tradition, deity } = opts;

  // Fallback if no Gemini key
  if (!geminiKey) {
    const count = membersCount === 1 ? '1 member' : `${membersCount} members`;
    return {
      message: `${count} of ${kulName} already practiced today${totalJapa > 0 ? ` (${totalJapa.toLocaleString()} japa)` : ''}. Join them.`,
      call_to_action: 'Begin my practice',
    };
  }

  const prompt = `You are sending a community accountability push notification for the Sanatana Sangam app.

Context:
- The user's kul "${kulName}" ${kulEmoji} has ${membersCount} member(s) who practiced today
${totalJapa > 0 ? `- Combined japa count so far: ${totalJapa.toLocaleString()}` : ''}
- User's tradition: ${tradition}, devoted to ${deity}

Write a push notification that uses community momentum as motivation — not guilt. Make the user want to join their kul, not feel bad. Keep it warm and specific.

Return JSON only:
{
  "message": "Notification body (max 100 characters). Mention the kul name and number of members who practiced.",
  "call_to_action": "Button text (max 25 characters)"
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 120, temperature: 0.7, responseMimeType: 'application/json' },
    }),
  });

  if (!resp.ok) {
    return {
      message: `${membersCount} member(s) of ${kulName} have practiced today. Come join them.`,
      call_to_action: 'Join my kul',
    };
  }

  const json = await resp.json();
  try {
    return JSON.parse(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
  } catch {
    return {
      message: `${membersCount} member(s) of ${kulName} have already practiced today.`,
      call_to_action: 'Begin my practice',
    };
  }
}

// ── OneSignal push ──

async function sendOneSignalPush(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  message: { message: string; call_to_action: string }
): Promise<{ success: boolean; error: string | null }> {
  const appId      = Deno.env.get('ONESIGNAL_APP_ID');
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  if (!appId || !restApiKey) return { success: false, error: 'OneSignal secrets not configured' };

  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('player_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!tokens?.length) return { success: false, error: 'No active device tokens' };

  const resp = await fetch(ONESIGNAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${restApiKey}` },
    body: JSON.stringify({
      app_id:             appId,
      include_player_ids: tokens.map((t: { player_id: string }) => t.player_id),
      contents:           { en: message.message },
      buttons:            [{ id: 'open_app', text: message.call_to_action }],
      data:               { nudge_type: 'kul_nudge', source: 'sadhana-engine' },
      collapse_id:        `kul-nudge-${userId.slice(0, 8)}`,
    }),
  });

  if (!resp.ok) return { success: false, error: `OneSignal ${resp.status}` };
  return { success: true, error: null };
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
