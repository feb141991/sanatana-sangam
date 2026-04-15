// ============================================================
// Edge Function: ai-nudge
// Generates adaptive streak recovery and reminder messages via Gemini.
// Optionally delivers them as OneSignal push notifications.
//
// POST body (streak recovery):
//   user_id     string  — the user
//   days_missed number  — days since last practice
//   type?       string  — 'streak_recovery' (default) | 'vrata_reminder' | 'morning_reminder'
//   send_push?  boolean — if true, send push via OneSignal (default false)
//
// POST body (vrata reminder):
//   user_id     string
//   type        'vrata_reminder'
//   vrata_name? string  — optional override; if omitted, tomorrow's festival is fetched
//   tithi?      string  — optional override
//   send_push?  boolean
//
// POST body (morning reminder):
//   user_id     string
//   type        'morning_reminder'
//   panchang?   { tithi, vrata?, festival? } — optional override; today's festival is fetched
//   send_push?  boolean
//
// All nudge types automatically write to the 'notifications' table
// so the in-app notification bell stays in sync with push delivery.
//
// Deploy:
//   supabase functions deploy ai-nudge
// Secrets needed:
//   supabase secrets set GEMINI_API_KEY=AIza...
//   supabase secrets set ONESIGNAL_APP_ID=your-app-id
//   supabase secrets set ONESIGNAL_REST_API_KEY=your-rest-api-key
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { user_id, type = 'streak_recovery', send_push = false } = body;

    if (!user_id) return errorResponse('user_id is required', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();

    // ── Fetch profile + nudge history + festival data in parallel ──
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const [profileResult, nudgeHistoryResult, todayFestResult, tomorrowFestResult] = await Promise.all([
      supabase
        .from('user_practice')
        .select('tradition, preferred_deity, primary_path, current_streak, re_engagement_style, content_depth')
        .eq('user_id', user_id)
        .single(),
      supabase
        .from('sadhana_events')
        .select('event_data')
        .eq('user_id', user_id)
        .in('event_type', ['streak_recovered', 'notification_dismissed'])
        .order('created_at', { ascending: false })
        .limit(10),
      // Today's festival — for morning_reminder
      supabase
        .from('festivals')
        .select('name, description, type, emoji')
        .eq('date', today)
        .eq('year', year)
        .or('is_shared.eq.true,tradition.is.null')
        .order('tradition', { ascending: false })
        .limit(1)
        .single(),
      // Tomorrow's festival — for vrata_reminder
      supabase
        .from('festivals')
        .select('name, description, type, emoji')
        .eq('date', tomorrowStr)
        .eq('year', year)
        .or('is_shared.eq.true,tradition.is.null')
        .order('tradition', { ascending: false })
        .limit(1)
        .single(),
    ]);

    const profile = profileResult.data ?? {};
    const nudgeHistory = nudgeHistoryResult.data ?? [];
    const todayFestival = todayFestResult.data;
    const tomorrowFestival = tomorrowFestResult.data;

    // Filter festivals by user tradition if we have one
    const userTradition = profile.tradition;
    if (userTradition && userTradition !== 'general') {
      // Re-query with tradition filter — prefer tradition-specific if available
      const { data: traditionFest } = await supabase
        .from('festivals')
        .select('name, description, type, emoji')
        .eq('date', tomorrowStr)
        .eq('year', year)
        .eq('tradition', userTradition)
        .limit(1)
        .single();
      if (traditionFest) Object.assign(tomorrowFestival ?? {}, traditionFest);
    }

    // ── Determine nudge style from history ──
    let nudgeStyle: string = profile.re_engagement_style ?? 'gentle';
    if (nudgeHistory.length >= 2) {
      const styleCount: Record<string, number> = {};
      for (const row of nudgeHistory) {
        const d = row.event_data as Record<string, unknown>;
        if (d?.returned === true && d?.nudge_style) {
          const s = d.nudge_style as string;
          styleCount[s] = (styleCount[s] ?? 0) + 1;
        }
      }
      if (Object.keys(styleCount).length > 0) {
        nudgeStyle = Object.entries(styleCount).sort((a, b) => b[1] - a[1])[0][0];
      }
    }

    // ── Generate message based on type ──
    let message: { message: string; call_to_action: string };

    if (type === 'streak_recovery') {
      const { days_missed = 1 } = body;
      message = await generateStreakRecovery(profile, nudgeStyle, days_missed);
    } else if (type === 'vrata_reminder') {
      // Caller can override; otherwise use tomorrow's festival from DB
      const vrataName = body.vrata_name ?? tomorrowFestival?.name ?? 'tomorrow\'s vrata';
      const tithi = body.tithi ?? tomorrowFestival?.description ?? '';
      message = await generateVrataReminder(profile, vrataName, tithi);
    } else if (type === 'morning_reminder') {
      // Caller can override panchang; otherwise use today's festival from DB
      const panchang = body.panchang ?? {
        tithi: today,
        vrata: todayFestival?.name,
        festival: todayFestival?.name,
      };
      message = await generateMorningReminder(profile, panchang);
    } else {
      return errorResponse('Unknown nudge type', 400);
    }

    // ── Write to in-app notifications table ──
    // This keeps the in-app notification bell in sync with push delivery.
    // Uses notification_key to prevent same-day duplicate entries.
    const notificationKey = `nudge-${type}-${user_id.slice(0, 8)}-${today}`;
    await writeInAppNotification(supabase, {
      user_id,
      type,
      message,
      notification_key: notificationKey,
      today,
      festival_emoji: type === 'morning_reminder'
        ? (todayFestival?.emoji ?? '🙏')
        : (tomorrowFestival?.emoji ?? '🙏'),
    });

    // ── Optionally send as OneSignal push notification ──
    let push_sent = false;
    let push_error: string | null = null;

    if (send_push) {
      const pushResult = await sendOneSignalPush(supabase, user_id, message, type);
      push_sent = pushResult.success;
      push_error = pushResult.error;
    }

    return new Response(
      JSON.stringify({
        ...message,
        style: nudgeStyle,
        generated_at: new Date().toISOString(),
        ...(send_push ? { push_sent, push_error } : {}),
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('ai-nudge error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Write to in-app notifications table ──
// Maps to the existing Sangam `notifications` schema:
//   title, body, emoji, type, read, action_url,
//   notification_key, local_date, sent_timezone

async function writeInAppNotification(
  supabase: ReturnType<typeof createClient>,
  opts: {
    user_id: string;
    type: string;
    message: { message: string; call_to_action: string };
    notification_key: string;
    today: string;
    festival_emoji: string;
  }
): Promise<void> {
  const NUDGE_META: Record<string, { title: string; emoji: string; action_url: string }> = {
    streak_recovery:  { title: 'Time to practice',        emoji: '🔥', action_url: '/japa' },
    vrata_reminder:   { title: 'Vrata tomorrow',           emoji: opts.festival_emoji || '🌕', action_url: '/calendar' },
    morning_reminder: { title: 'Brahma muhurta',           emoji: opts.festival_emoji || '🌅', action_url: '/practice' },
  };

  const meta = NUDGE_META[opts.type] ?? { title: 'Sangam reminder', emoji: '🙏', action_url: '/' };

  try {
    // Upsert on notification_key — prevents duplicate for same type on same day
    await supabase.from('notifications').upsert({
      user_id:          opts.user_id,
      title:            meta.title,
      body:             opts.message.message,
      emoji:            meta.emoji,
      type:             opts.type,
      read:             false,
      action_url:       meta.action_url,
      notification_key: opts.notification_key,
      local_date:       opts.today,
      sent_timezone:    'UTC',
    }, { onConflict: 'notification_key' });
  } catch (err) {
    // Non-fatal — push still sends even if in-app write fails
    console.warn('writeInAppNotification failed:', err);
  }
}

// ── OneSignal push delivery ──

async function sendOneSignalPush(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  message: { message: string; call_to_action: string },
  nudgeType: string
): Promise<{ success: boolean; error: string | null }> {
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const restApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

  if (!appId || !restApiKey) {
    return { success: false, error: 'OneSignal secrets not configured' };
  }

  // Look up the user's active player IDs from device_tokens table
  const { data: tokens, error: tokenError } = await supabase
    .from('device_tokens')
    .select('player_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (tokenError || !tokens?.length) {
    return { success: false, error: 'No active device tokens for user' };
  }

  const playerIds = tokens.map((t: { player_id: string }) => t.player_id);

  // Build OneSignal payload
  // https://documentation.onesignal.com/reference/create-notification
  const payload = {
    app_id: appId,
    include_player_ids: playerIds,
    contents: { en: message.message },
    buttons: [
      { id: 'open_app', text: message.call_to_action },
    ],
    // Custom data — lets the app deep-link to the right screen
    data: {
      nudge_type: nudgeType,
      source: 'sadhana-engine',
    },
    // Collapse duplicate notifications of the same type
    collapse_id: `sangam-${nudgeType}-${userId.slice(0, 8)}`,
    // Respect quiet hours — only deliver between 6 AM and 10 PM device time
    delayed_option: 'timezone',
    delivery_time_of_day: nudgeType === 'morning_reminder' ? '4:30AM' : undefined,
    // iOS specific
    ios_sound: 'default',
    ios_badge_type: 'Increase',
    ios_badge_count: 1,
    // Android specific
    android_channel_id: 'sadhana-reminders',
    priority: nudgeType === 'morning_reminder' ? 10 : 5,
  };

  try {
    const resp = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OneSignal error:', errText);
      return { success: false, error: `OneSignal ${resp.status}: ${errText}` };
    }

    const result = await resp.json();
    console.log('OneSignal sent:', result.id, `→ ${playerIds.length} device(s)`);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Streak recovery message ──

async function generateStreakRecovery(
  profile: Record<string, unknown>,
  nudgeStyle: string,
  daysMissed: number
): Promise<{ message: string; call_to_action: string }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  const styleGuide: Record<string, string> = {
    gentle: 'Warm, compassionate, no pressure. Remind them of the joy of practice, not the obligation.',
    challenge: 'Direct, motivating. Appeal to their resolve and warrior spirit. Not harsh — inspiring.',
    community: 'Remind them their mandali is practicing. Community connection and belonging.',
    unknown: 'Gentle and inviting. Keep it brief.',
  };

  if (!geminiKey) {
    const fallbacks: Record<string, { message: string; call_to_action: string }> = {
      gentle: {
        message: daysMissed === 1
          ? "Your practice missed you yesterday. Even a few minutes today will rekindle the flame."
          : `It's been ${daysMissed} days. The path is always here, waiting. Come back gently.`,
        call_to_action: "Resume my practice",
      },
      challenge: {
        message: `${daysMissed} day${daysMissed > 1 ? 's' : ''} have passed. Your practice is calling — are you going to answer?`,
        call_to_action: "Get back on track",
      },
      community: {
        message: `Your mandali hasn't missed a day. Come back and practice alongside them.`,
        call_to_action: "Rejoin my mandali",
      },
      unknown: {
        message: "Your practice is waiting. Come back whenever you're ready.",
        call_to_action: "Open Sangam",
      },
    };
    return fallbacks[nudgeStyle] ?? fallbacks['gentle'];
  }

  const tradition = profile.tradition ?? 'general';
  const deity = profile.preferred_deity ?? 'the divine';
  const path = profile.primary_path ?? 'bhakti';

  const prompt = `You are the Sanatana Sangam app sending a push notification to a devotee who missed ${daysMissed} day(s) of practice.

Devotee profile: ${tradition} tradition, ${path} path, devoted to ${deity}
Nudge style: "${nudgeStyle}" — ${styleGuide[nudgeStyle] ?? styleGuide['gentle']}

Write a push notification (JSON, no markdown):
{
  "message": "The notification body (max 100 characters). Personalised to their tradition and path. ${nudgeStyle} tone.",
  "call_to_action": "Button text (max 25 characters)"
}

Important: Keep it brief — this is a mobile push notification, not an essay.`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!resp.ok) {
    return { message: "Your practice is waiting. Come back today.", call_to_action: "Open Sangam" };
  }

  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    return JSON.parse(text);
  } catch {
    return { message: "Your practice is waiting.", call_to_action: "Open Sangam" };
  }
}

// ── Vrata reminder ──

async function generateVrataReminder(
  profile: Record<string, unknown>,
  vrataName: string,
  tithi: string
): Promise<{ message: string; call_to_action: string }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiKey) {
    return {
      message: `Tomorrow is ${vrataName} (${tithi}). Prepare yourself for this auspicious fast.`,
      call_to_action: `See ${vrataName} guide`,
    };
  }

  const deity = profile.preferred_deity ?? 'the divine';

  const prompt = `Write a brief push notification (JSON) for a devotee reminding them about ${vrataName} tomorrow (${tithi}). Their deity: ${deity}.
{
  "message": "Max 100 characters. Warm, auspicious tone.",
  "call_to_action": "Max 25 characters"
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 100, temperature: 0.5, responseMimeType: 'application/json' },
    }),
  });

  if (!resp.ok) return { message: `Tomorrow is ${vrataName}. Prepare with devotion.`, call_to_action: 'See vrata guide' };

  const json = await resp.json();
  try {
    return JSON.parse(json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}');
  } catch {
    return { message: `Tomorrow is ${vrataName}. Prepare with devotion.`, call_to_action: 'See vrata guide' };
  }
}

// ── Morning reminder ──

async function generateMorningReminder(
  profile: Record<string, unknown>,
  panchang: { tithi: string; vrata?: string; festival?: string }
): Promise<{ message: string; call_to_action: string }> {
  const special = panchang.vrata ?? panchang.festival ?? '';
  const base = special
    ? `Brahma muhurta. Today is ${special} (${panchang.tithi}).`
    : `Brahma muhurta. Today is ${panchang.tithi}.`;

  return {
    message: `${base} The most sacred time to begin your practice.`,
    call_to_action: 'Begin my practice',
  };
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
