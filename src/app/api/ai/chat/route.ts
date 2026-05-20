import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { runDharmaChat } from '@/lib/ai/router';
import type { PromptMessage } from '@sangam/pramana-core';
import { emitEvent, emitError } from '@/lib/monitoring/events';

// ─── General AI Chat Route ────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string; tradition?: string | null; history: { role: 'user' | 'model'; text: string }[] }
// Uses Google Gemini Flash via the Pramana contract.

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT  = 100;

async function isDailyLimitReached(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  isPro: boolean
): Promise<boolean> {
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('sadhana_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', 'ai_chat_message')
      .gte('created_at', todayStart.toISOString());

    if (error) return false; // fail open — don't block on DB error
    return (count ?? 0) >= limit;
  } catch {
    return false; // fail open
  }
}

async function recordAiChatEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<void> {
  try {
    await supabase.from('sadhana_events').insert({
      user_id:    userId,
      event_type: 'ai_chat_message',
      event_data: { ts: new Date().toISOString() },
    });
  } catch { /* fire and forget */ }
}

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can use AI chat
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Fetch user profile to check Pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single();
  const isPro = profile?.is_pro ?? false;

  // Daily limit check (Supabase-backed, survives cold starts)
  if (await isDailyLimitReached(supabase, user.id, isPro)) {
    const limitMsg = isPro
      ? "🙏 You've had a rich conversation with Dharma Mitra today! Your daily limit (100 messages) has been reached. Come back tomorrow for more guidance."
      : "🙏 You've used your 5 free messages for today. Upgrade to Shoonaya Pro for 100+ daily messages and deeper guidance!";
    
    return NextResponse.json({
      reply: limitMsg,
      limitReached: true,
      isPro
    });
  }

  let body: {
    message:     string;
    tradition?:  string | null;
    sampradaya?: string | null;
    city?:       string | null;
    country?:    string | null;
    seeking?:    string[];
    history?:    { role: 'user' | 'model'; text: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { message, tradition = null, sampradaya, city, country, seeking, history = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // Map history to Pramana PromptMessage format
  const mappedHistory: PromptMessage[] = history.map(h => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.text,
  }));

  const startTime = Date.now();
  try {
    const result = await runDharmaChat({
      message: message.trim(),
      tradition,
      sampradaya,
      city,
      country,
      seeking,
      history: mappedHistory,
    });

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/ai/chat',
      latency_ms: Date.now() - startTime,
      provider: result.metadata?.provider,
      model: result.metadata?.model,
      fallback_used: result.metadata?.usedHostedFallback
    });

    // Record the successful call so the daily limit increments
    await recordAiChatEvent(supabase, user.id);

    return NextResponse.json({ reply: result.raw });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/ai/chat', latency_ms: Date.now() - startTime });
    console.error('[AI CHAT ERROR]', err);
    // If it's a soft quota error or rate limit, return it as a reply (not an error) so the UI shows it gracefully
    if (err?.message?.includes('taking a short rest') || err?.message?.includes('rest')) {
      return NextResponse.json({ reply: err.message });
    }
    return NextResponse.json({ error: err?.message || 'AI service error' }, { status: 500 });
  }
}
