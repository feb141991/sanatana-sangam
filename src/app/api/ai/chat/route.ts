import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { getTraditionMeta } from '@/lib/tradition-config';
import { localSpiritualDate } from '@/lib/sacred-time';

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 200;
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

type ChatHistoryMessage = { role: 'user' | 'model'; text: string };

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

    if (error) return false;
    return (count ?? 0) >= limit;
  } catch {
    return false;
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
    `Preferred response language: ${input.language ?? 'en'}.`,
    `Meaning language preference: ${input.meaningLanguage ?? 'en'}.`,
    `Transliteration preference: ${input.transliterationLanguage ?? 'en'}.`,
    'If you use Sanskrit, Gurmukhi, Pali, or Prakrit, add transliteration only when it improves comprehension.',
    'Keep answers compact unless the user explicitly asks for depth.',
  ].join('\n');
}

function buildAnthropicMessages(history: ChatHistoryMessage[], message: string) {
  const trimmedHistory = history
    .filter((item) => item.text?.trim())
    .slice(-12)
    .map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: [{ type: 'text', text: item.text.trim() }],
    }));

  return [
    ...trimmedHistory,
    {
      role: 'user',
      content: [{ type: 'text', text: message.trim() }],
    },
  ];
}

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!anthropicKey) {
    return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, is_banned, tradition, sampradaya, city, country, seeking, app_language, meaning_language, transliteration_language, spiritual_level, timezone')
    .eq('id', user.id)
    .single();

  const isPro = profile?.is_pro ?? false;
  if (profile?.is_banned) {
    return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 });
  }

  if (await isDailyLimitReached(supabase, user.id, isPro)) {
    const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;
    return NextResponse.json({ error: 'daily_limit_reached', limit, isPro }, { status: 429 });
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

  const tradition = body.tradition ?? profile?.tradition ?? null;
  const sampradaya = body.sampradaya ?? profile?.sampradaya ?? null;
  const city = body.city ?? profile?.city ?? null;
  const country = body.country ?? profile?.country ?? null;
  const seeking = body.seeking ?? profile?.seeking ?? [];
  const responseLanguage = body.language || body.appLanguage || profile?.app_language || 'en';
  const meaningLanguage = body.meaningLanguage ?? profile?.meaning_language ?? 'en';
  const transliterationLanguage = body.transliterationLanguage ?? profile?.transliteration_language ?? 'en';
  const timeZone = profile?.timezone ?? 'Asia/Kolkata';
  const spiritualDate = localSpiritualDate(timeZone, 4);
  const systemPrompt = buildSystemPrompt({
    tradition,
    rank: profile?.spiritual_level ?? null,
    sampradaya,
    city,
    country,
    seeking,
    language: responseLanguage,
    meaningLanguage,
    transliterationLanguage,
    spiritualDate,
  });

  const startTime = Date.now();

  try {
    const anthropicResponse = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 900,
        temperature: 0.6,
        stream: true,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: buildAnthropicMessages(body.history ?? [], body.message),
      }),
    });

    if (!anthropicResponse.ok || !anthropicResponse.body) {
      const errorBody = await anthropicResponse.text().catch(() => '');
      emitError('ai', new Error(`Anthropic ${anthropicResponse.status}: ${errorBody}`), 'P2', {
        route: '/api/ai/chat',
        provider: 'anthropic',
      });
      return NextResponse.json(
        { error: anthropicResponse.status === 429 ? 'AI service is busy. Try again shortly.' : 'AI service error' },
        { status: anthropicResponse.status === 429 ? 429 : 500 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const upstreamReader = anthropicResponse.body.getReader();
    let sseBuffer = '';
    let assistantText = '';
    let completed = false;
    const pendingChunks: string[] = [];

    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        while (true) {
          const queuedChunk = pendingChunks.shift();
          if (queuedChunk) {
            assistantText += queuedChunk;
            controller.enqueue(encoder.encode(queuedChunk));
            return;
          }

          const { done, value } = await upstreamReader.read();

          if (done) {
            completed = true;
            await recordAiChatEvent(supabase, user.id);
            emitEvent({
              severity: 'P3',
              domain: 'ai',
              route: '/api/ai/chat',
              latency_ms: Date.now() - startTime,
              provider: 'anthropic',
              model: CLAUDE_MODEL,
              context: {
                status: 'generated',
                text_length: body.message.length,
                output_length: assistantText.length,
                cached_system_prompt: true,
              },
            });
            controller.close();
            return;
          }

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() ?? '';

          for (const event of events) {
            const lines = event.split('\n');
            let eventType = '';
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
            }

            const rawData = dataLines.join('\n');
            if (!rawData || rawData === '[DONE]') continue;

            let parsed: any;
            try {
              parsed = JSON.parse(rawData);
            } catch {
              continue;
            }

            if (eventType === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              const chunk = parsed.delta.text ?? '';
              if (chunk) {
                pendingChunks.push(chunk);
              }
            }

            if (eventType === 'error') {
              const err = new Error(parsed?.error?.message ?? 'Anthropic stream failed');
              emitError('ai', err, 'P2', {
                route: '/api/ai/chat',
                provider: 'anthropic',
                latency_ms: Date.now() - startTime,
              });
              controller.error(err);
              return;
            }
          }
        }
      },
      async cancel() {
        if (!completed) {
          try {
            await upstreamReader.cancel();
          } catch {
            // ignore
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', {
      route: '/api/ai/chat',
      provider: 'anthropic',
      latency_ms: Date.now() - startTime,
    });
    return NextResponse.json({ error: err?.message || 'AI service error' }, { status: 500 });
  }
}
