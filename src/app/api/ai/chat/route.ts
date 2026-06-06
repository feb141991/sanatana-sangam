import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { getTraditionMeta } from '@/lib/tradition-config';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getTierFromScore } from '@/lib/seva-tiers';
import { SEVA_TIER_PERKS } from '@/lib/seva-perks';
import { generateWithProvider } from '@/lib/ai/providers/inference';

// ─── Config ────────────────────────────────────────────────────────────────
const FREE_DAILY_LIMIT   = 5;
const PRO_DAILY_LIMIT    = 200;
const GEMINI_MODEL       = process.env.PRAMANA_GEMINI_MODEL?.trim() || 'gemini-2.0-flash';

type ChatHistoryMessage = { role: 'user' | 'model'; text: string };

// ─── Rate-limit helpers ────────────────────────────────────────────────────
async function checkAndIncrementAiUsage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  limit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { data, error } = await supabase.rpc('increment_ai_chat_usage', {
      p_user_id: userId,
      p_date: today,
      p_limit: limit,
    });
    if (error || data === null) {
      console.warn('[ai/chat] rate limit check failed, failing open:', error);
      return { allowed: true, used: 0, limit };
    }
    const res = data as { new_count: number; was_allowed: boolean };
    return { allowed: res.was_allowed, used: res.new_count, limit };
  } catch (err) {
    console.error('[ai/chat] error inside checkAndIncrementAiUsage:', err);
    return { allowed: true, used: 0, limit };
  }
}

async function recordAiChatEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<void> {
  try {
    await supabase.from('sadhana_events').insert({
      user_id: userId,
      event_type: 'ai_chat_message',
      event_data: { ts: new Date().toISOString() },
    });
  } catch {
    // fail open
  }
}

// ─── System prompt ──────────────────────────────────────────────────────────
function buildSystemPrompt(input: {
  tradition: string | null;
  rank: string | null;
  sampradaya: string | null;
  city: string | null;
  country: string | null;
  seeking: string[];
  language: string | null;
  meaningLanguage: string | null;
  transliterationLanguage: string | null;
  spiritualDate: string;
}) {
  const meta = getTraditionMeta(input.tradition);
  const rank = input.rank?.trim() || 'seeker';
  const location = [input.city, input.country].filter(Boolean).join(', ') || 'unknown';
  const goals = input.seeking.length > 0 ? input.seeking.join(', ') : 'general spiritual guidance';

  return [
    'You are Dharma Mitra inside the Shoonaya app.',
    'Give direct, grounded, tradition-aware spiritual guidance.',
    'Do not pretend certainty where scripture, practice context, or safety is unclear.',
    'Do not fabricate citations, rituals, mantras, or medical/legal/financial certainty.',
    'When appropriate, prefer practical dharmic guidance over abstraction.',
    'If the user is in distress, encourage grounding, trusted human support, and immediate safety help where appropriate.',
    `Primary user tradition: ${meta.label}.`,
    `User rank: ${rank}.`,
    `Sampradaya / path: ${input.sampradaya ?? 'not specified'}.`,
    `User location: ${location}.`,
    `User is seeking: ${goals}.`,
    `Today's spiritual date: ${input.spiritualDate}.`,
    `IMPORTANT: You MUST respond in the language indicated by the code "${input.language ?? 'en'}". Do not switch to any other language unless the user explicitly requests it in their message. en = English, hi = Hindi (Devanagari script), pa = Punjabi (Gurmukhi script).`,
    `Meaning language preference: ${input.meaningLanguage ?? 'en'}.`,
    `Transliteration preference: ${input.transliterationLanguage ?? 'en'}.`,
    'If you use Sanskrit, Gurmukhi, Pali, or Prakrit, add transliteration only when it improves comprehension.',
    'Keep answers compact unless the user explicitly asks for depth.',
  ].join('\n');
}

// ─── Build conversation text for Pramana / Gemini format ───────────────────
function buildPramanaUserMessage(history: ChatHistoryMessage[], message: string) {
  const recent = history
    .filter((item) => item.text?.trim())
    .slice(-6); // keep last 6 turns for context

  if (recent.length === 0) return message.trim();

  const contextLines = recent.map((m) =>
    `${m.role === 'model' ? 'Assistant' : 'User'}: ${m.text.trim()}`
  );
  return `${contextLines.join('\n')}\nUser: ${message.trim()}`;
}

// ─── Helper: wrap a complete text as a plain-text stream chunk ─────────────
function textAsStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Determine which providers are available
  const sarvamKey = process.env.SARVAM_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!sarvamKey && !geminiKey) {
    return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, is_banned, tradition, sampradaya, city, country, seeking, app_language, meaning_language, transliteration_language, spiritual_level, timezone, seva_score')
    .eq('id', user.id)
    .single();

  const isPro = profile?.is_pro ?? false;
  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
  }

  const tier = getTierFromScore(profile?.seva_score ?? 0);
  const dailyLimit = isPro ? PRO_DAILY_LIMIT : (SEVA_TIER_PERKS[tier.key]?.aiChatLimit ?? FREE_DAILY_LIMIT);

  const { allowed, used, limit } = await checkAndIncrementAiUsage(supabase, user.id, dailyLimit);
  if (!allowed) {
    return NextResponse.json(
      { error: 'daily_limit_reached', used, limit, isPro },
      { status: 429 }
    );
  }

  let body: {
    message: string;
    history?: ChatHistoryMessage[];
    tradition?: string | null;
    sampradaya?: string | null;
    city?: string | null;
    country?: string | null;
    seeking?: string[];
    language?: string | null;
    appLanguage?: string | null;
    meaningLanguage?: string | null;
    transliterationLanguage?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const tradition             = body.tradition ?? profile?.tradition ?? null;
  const sampradaya            = body.sampradaya ?? profile?.sampradaya ?? null;
  const city                  = body.city ?? profile?.city ?? null;
  const country               = body.country ?? profile?.country ?? null;
  const seeking               = body.seeking ?? profile?.seeking ?? [];
  const responseLanguage      = body.language || body.appLanguage || profile?.app_language || 'en';
  const meaningLanguage       = body.meaningLanguage ?? profile?.meaning_language ?? 'en';
  const transliterationLanguage = body.transliterationLanguage ?? profile?.transliteration_language ?? 'en';
  const timeZone              = profile?.timezone ?? 'Asia/Kolkata';
  const spiritualDate         = localSpiritualDate(timeZone, 4);
  const systemPrompt          = buildSystemPrompt({
    tradition, rank: profile?.spiritual_level ?? null,
    sampradaya, city, country, seeking,
    language: responseLanguage, meaningLanguage, transliterationLanguage,
    spiritualDate,
  });

  const startTime = Date.now();

  // ── Path A: Sarvam / Pramana (default) ─────────────────────────────────────
  // Sarvam is the primary provider. When configured it handles the request and
  // returns a complete text response emitted as a single-chunk plain-text stream
  // (the client reads chunks progressively so single-chunk works correctly).
  if (sarvamKey) {
    try {
      const userMessage = buildPramanaUserMessage(body.history ?? [], body.message);
      const result = await generateWithProvider(
        { system: systemPrompt, user: userMessage, maxOutputTokens: 900 },
        { providerOverride: 'sarvam-hosted' }
      );

      await recordAiChatEvent(supabase, user.id);
      emitEvent({
        severity: 'P3',
        domain: 'ai',
        route: '/api/ai/chat',
        latency_ms: Date.now() - startTime,
        provider: result.provider ?? 'sarvam-hosted',
        model: result.modelUsed ?? 'sarvam',
        context: { status: 'generated', output_length: result.text.length },
      });

      return new Response(textAsStream(result.text), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      });
    } catch (err: any) {
      // If Sarvam fails and Gemini is available, fall through to Path B.
      if (!geminiKey) {
        emitError('ai', err, 'P2', { route: '/api/ai/chat', provider: 'sarvam-hosted', latency_ms: Date.now() - startTime });
        return NextResponse.json({ error: err?.message || 'AI service error' }, { status: 500 });
      }
      emitError('ai', err, 'P2', { route: '/api/ai/chat', provider: 'sarvam-hosted', context: { action: 'fallback_to_gemini' } });
    }
  }

  // ── Path B: Gemini (fallback / Sarvam not configured) ──────────────────────
  try {
    const userMessage = buildPramanaUserMessage(body.history ?? [], body.message);
    const payload = {
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { maxOutputTokens: 900, temperature: 0.6 },
    };

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text().catch(() => '');
      emitError('ai', new Error(`Gemini ${geminiResponse.status}: ${errorBody}`), 'P2', {
        route: '/api/ai/chat',
        provider: 'google-gemini',
      });
      return NextResponse.json(
        { error: geminiResponse.status === 429 ? 'AI service is busy. Try again shortly.' : 'AI service error' },
        { status: geminiResponse.status === 429 ? 429 : 500 }
      );
    }

    const data = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    if (!text.trim()) {
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    await recordAiChatEvent(supabase, user.id);
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/ai/chat',
      latency_ms: Date.now() - startTime,
      provider: 'google-gemini',
      model: GEMINI_MODEL,
      context: { status: 'generated', output_length: text.length },
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(text));
          controller.close();
        },
      }),
      { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/ai/chat', provider: 'google-gemini', latency_ms: Date.now() - startTime });
    return NextResponse.json({ error: err?.message || 'AI service error' }, { status: 500 });
  }
}
