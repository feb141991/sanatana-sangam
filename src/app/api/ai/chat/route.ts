import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getApiUser } from '@/lib/api-auth';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { getTraditionMeta } from '@/lib/tradition-config';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getTierFromScore } from '@/lib/seva-tiers';
import { SEVA_TIER_PERKS } from '@/lib/seva-perks';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { FREE_DAILY_LIMIT, PRO_DAILY_LIMIT } from '@/lib/ai/chat-limits';
import { FESTIVALS_2026 } from '@/lib/festivals';
import { dharamVeerRetriever } from '@/lib/ai/retrieval';
import { asBoundedString, rateLimitByIp, rejectLargeRequest } from '@/lib/api-security';

// ─── Config ────────────────────────────────────────────────────────────────
const GEMINI_MODEL       = process.env.PRAMANA_GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
const MAX_CHAT_BODY_BYTES = 32 * 1024;
const MAX_CHAT_MESSAGE_CHARS = 4_000;
const MAX_CHAT_HISTORY_ITEMS = 12;
const MAX_CHAT_HISTORY_TEXT_CHARS = 2_000;
const CHAT_RATE_LIMIT = { keyPrefix: 'ai-chat', limit: 30, windowMs: 60_000 };

type ChatHistoryMessage = { role: 'user' | 'model'; text: string };
type UpcomingVrat = {
  date: string;
  displayName: string;
  emoji: string;
  kind: 'major' | 'vrat' | 'regional';
  tradition: string;
};

// ─── Rate-limit helpers ────────────────────────────────────────────────────
async function checkAndIncrementAiUsage(
  supabase: SupabaseClient,
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
      console.warn('[ai/chat] rate limit check failed, failing closed:', error);
      return { allowed: false, used: 0, limit };
    }
    const res = data as { new_count: number; was_allowed: boolean };
    return { allowed: res.was_allowed, used: res.new_count, limit };
  } catch (err) {
    console.error('[ai/chat] error inside checkAndIncrementAiUsage:', err);
    return { allowed: false, used: 0, limit };
  }
}

function sanitiseHistory(history: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(history)) return [];

  return history.slice(-MAX_CHAT_HISTORY_ITEMS).flatMap((item): ChatHistoryMessage[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as { role?: unknown; text?: unknown };
    const role = candidate.role === 'model' ? 'model' : candidate.role === 'user' ? 'user' : null;
    const text = asBoundedString(candidate.text, MAX_CHAT_HISTORY_TEXT_CHARS);
    return role && text ? [{ role, text }] : [];
  });
}

async function recordAiChatEvent(
  supabase: SupabaseClient,
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

function isUpcomingVratQuery(message: string): boolean {
  const text = message.toLowerCase();
  return (
    /\b(upcoming|next|coming|aane wale|आने वाले|अगले|agle)\b/.test(text) &&
    /\b(vrat|vrats|vrata|vratas|fast|fasts|उपवास|व्रत)\b/.test(text)
  );
}

function formatDateForLanguage(date: string, language: string | null): string {
  const locale = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';
  const parsed = new Date(`${date}T00:00:00+05:30`);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function daysBetweenLocalDates(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const start = Date.UTC(fy, fm - 1, fd);
  const end = Date.UTC(ty, tm - 1, td);
  return Math.round((end - start) / 86_400_000);
}

function formatUpcomingVratsResponse(input: {
  vrats: UpcomingVrat[];
  from: string;
  to: string;
  language: string | null;
  source: 'calendar' | 'fallback';
}): string {
  const language = input.language ?? 'en';
  const isHindi = language === 'hi';
  const dateRange = `${formatDateForLanguage(input.from, language)} – ${formatDateForLanguage(input.to, language)}`;
  const sourceNote = input.source === 'fallback'
    ? (isHindi
        ? 'Note: shared calendar unavailable tha, isliye curated 2026 fallback calendar se bataya hai.'
        : 'Note: the shared calendar was unavailable, so this uses the curated 2026 fallback calendar.')
    : '';

  if (input.vrats.length === 0) {
    return isHindi
      ? `Namaste. ${dateRange} ke beech Shoonaya calendar mein koi upcoming vrat listed nahi mila.\n\n${sourceNote}`.trim()
      : `Namaste. I did not find any upcoming vrats in the Shoonaya calendar for ${dateRange}.\n\n${sourceNote}`.trim();
  }

  const lines = input.vrats.map((vrat, index) => {
    const daysAway = daysBetweenLocalDates(input.from, vrat.date);
    const distance = daysAway === 0
      ? (isHindi ? 'aaj' : 'today')
      : daysAway === 1
        ? (isHindi ? 'kal' : 'tomorrow')
        : (isHindi ? `${daysAway} din mein` : `in ${daysAway} days`);
    return `${index + 1}. ${vrat.emoji} ${vrat.displayName} — ${formatDateForLanguage(vrat.date, language)} (${distance})`;
  });

  if (isHindi) {
    return [
      `Namaste. ${dateRange} ke beech upcoming vrats:`,
      '',
      ...lines,
      '',
      'Exact parana/fasting timings ke liye apne local panchang, sampradaya, ya family parampara ko priority dein.',
      sourceNote,
    ].filter(Boolean).join('\n');
  }

  return [
    `Namaste. Upcoming vrats for ${dateRange}:`,
    '',
    ...lines,
    '',
    'For exact parana/fasting timings, follow your local panchang, sampradaya, or family tradition.',
    sourceNote,
  ].filter(Boolean).join('\n');
}

async function getUpcomingVrats(input: {
  supabase: SupabaseClient;
  from: string;
  tradition: string | null;
}): Promise<{ vrats: UpcomingVrat[]; to: string; source: 'calendar' | 'fallback' }> {
  const [fy, fm, fd] = input.from.split('-').map(Number);
  const to = new Date(Date.UTC(fy, fm - 1, fd + 120)).toISOString().slice(0, 10);
  const tradition = input.tradition && !['other', 'exploring'].includes(input.tradition)
    ? input.tradition
    : null;

  try {
    let query = input.supabase
      .from('observance_occurrences')
      .select(`
        date,
        observance_definitions!inner(
          display_name,
          emoji,
          kind,
          tradition,
          route_kind,
          active
        )
      `)
      .gte('date', input.from)
      .lte('date', to)
      .eq('observance_definitions.active', true)
      .or('kind.eq.vrat,route_kind.eq.vrat', { foreignTable: 'observance_definitions' });

    if (tradition) {
      query = query.in('observance_definitions.tradition', [tradition, 'all']);
    }

    const { data, error } = await query.order('date', { ascending: true }).limit(5);
    if (error) throw error;

    const vrats = (data ?? []).map((row: any) => ({
      date: row.date,
      displayName: row.observance_definitions.display_name,
      emoji: row.observance_definitions.emoji ?? '🪔',
      kind: row.observance_definitions.kind,
      tradition: row.observance_definitions.tradition,
    }));
    return { vrats, to, source: 'calendar' };
  } catch (error) {
    console.warn('[ai/chat] calendar-backed vrat lookup failed, using fallback:', error);
    const fallback = FESTIVALS_2026
      .filter((festival) =>
        festival.date >= input.from &&
        festival.date <= to &&
        (festival.type === 'vrat' || festival.route_kind === 'vrat') &&
        (!tradition || festival.tradition === tradition || festival.tradition === 'all')
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
      .map((festival) => ({
        date: festival.date,
        displayName: festival.name,
        emoji: festival.emoji,
        kind: festival.type,
        tradition: festival.tradition,
      }));

    return { vrats: fallback, to, source: 'fallback' };
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sizeRejection = rejectLargeRequest(req, MAX_CHAT_BODY_BYTES);
  if (sizeRejection) return sizeRejection;

  const rateRejection = rateLimitByIp(req, CHAT_RATE_LIMIT);
  if (rateRejection) return rateRejection;

  // Determine which providers are available
  const sarvamKey = process.env.SARVAM_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (!sarvamKey && !geminiKey) {
    return NextResponse.json({ error: 'AI service is not configured' }, { status: 503 });
  }

  // Bearer-aware: tries cookie session (web) first, falls back to
  // Authorization: Bearer <token> (native's apiFetch). Cookie-only auth here
  // previously made this route unreachable from the native app entirely.
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorised' }, { status: 401 });
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
    mode?: string;
    figure_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const message = asBoundedString(body.message, MAX_CHAT_MESSAGE_CHARS);
  if (!message) {
    return NextResponse.json({ error: 'Message is required or too long' }, { status: 400 });
  }
  const history = sanitiseHistory(body.history);

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


  const mode = body.mode;
  const figureId = body.figure_id;

  if (mode === 'dharam_veer_reflection') {
    if (!figureId) {
      return NextResponse.json({ error: 'figure_id is required' }, { status: 400 });
    }

    // Retrieve passages for the figure
    const result = await dharamVeerRetriever.retrieve({
        text: message,
        filters: { title: figureId },
        topK: 5
    });

    if (!result.documents || result.documents.length === 0) {
        // Fallback response when source coverage is insufficient
        const text = "I do not have enough approved source material yet to answer questions about this Dharm Veer safely. We are continuously expanding the Parampara Pathshala corpus with verified sources.";
        return new Response(textAsStream(text), {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
            },
        });
    }

    const passages = result.documents
      .map((document) => `- [${document.metadata?.sourceName || 'Source'} - ${document.metadata?.chunkId || 'N/A'}]: ${document.content}`)
      .join('\n');

    const reflectionPrompt = `
You are an AI assistant reflecting on the life of ${figureId}.
You MUST base your response ONLY on the following approved source passages.
Do not invent any biographies or unsupported claims.
Include short source/citation labels (e.g. [Source - 1.1]) in your answer.
End your response by noting this is an "AI reflection based on verified sources".

Source Passages:
${passages}

User Question: ${message}
`;

    // Override system prompt
    const sysPrompt = "You are a Dharmic trust reviewer and AI assistant. Adhere strictly to provided source text and forbid unsupported claims.";
    const userMessage = reflectionPrompt;

    try {
        const genResult = await generateWithProvider(
          { system: sysPrompt, user: userMessage, maxOutputTokens: 900 }
        );
        return new Response(textAsStream(genResult.text), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        });
    } catch(err) {
        return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }
  }

  const startTime = Date.now();


  if (isUpcomingVratQuery(message)) {
    const { vrats, to, source } = await getUpcomingVrats({
      supabase,
      from: spiritualDate,
      tradition,
    });
    const text = formatUpcomingVratsResponse({
      vrats,
      from: spiritualDate,
      to,
      language: responseLanguage,
      source,
    });

    await recordAiChatEvent(supabase, user.id);
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/ai/chat',
      latency_ms: Date.now() - startTime,
      provider: 'calendar',
      model: 'deterministic-upcoming-vrats',
      context: { status: 'generated', output_length: text.length, count: vrats.length, source },
    });

    return new Response(textAsStream(text), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  // ── Path A: Sarvam / Pramana (default) ─────────────────────────────────────
  // Sarvam is the primary provider. When configured it handles the request and
  // returns a complete text response emitted as a single-chunk plain-text stream
  // (the client reads chunks progressively so single-chunk works correctly).
  if (sarvamKey) {
    try {
      const userMessage = buildPramanaUserMessage(history, message);
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
    const userMessage = buildPramanaUserMessage(history, message);
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
