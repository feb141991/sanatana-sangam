import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── General AI Chat Route ────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string; tradition?: string | null; history: { role: 'user' | 'model'; text: string }[] }
// Uses Google Gemini Flash — fast, free-tier available, multilingual.
//
// Model priority (tries in order on failure):
//   1. GEMINI_MODEL env var (if set — allows override without code change)
//   2. gemini-2.0-flash-lite  — higher free-tier RPM, lower quota pressure
//   3. gemini-1.5-flash        — stable fallback, broad free-tier availability
//
// Set GEMINI_MODEL in Vercel → Settings → Environment Variables to override.

const GEMINI_MODEL_DEFAULT  = 'gemini-2.0-flash-lite';
const GEMINI_MODEL_FALLBACK = 'gemini-1.5-flash';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

// ─── Per-user daily limit via Supabase ───────────────────────────────────────
// The in-memory Map below is NOT reliable on Vercel (cold starts reset it).
// This Supabase-backed check is the real gate — it persists across invocations.
//
// Uses the sadhana_events table to count AI chat requests today.
// If the sadhana_events table isn't available, it fails open (no block).
const DAILY_LIMIT_PER_USER = 30; // 30 Dharma Mitra messages per user per day

async function isDailyLimitReached(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<boolean> {
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
    return (count ?? 0) >= DAILY_LIMIT_PER_USER;
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

// ─── Tradition-aware system instructions ──────────────────────────────────────
const BASE_RULES = `
Language: Respond in the same language the user writes in (English, Hindi, Hinglish, Punjabi, etc.) using a natural, conversational tone.

What you do NOT do:
- Generate harmful content
- Make negative comparisons between religions or traditions
- Make authoritative health or medical claims
- Replace the Guru / Teacher — you are a guide, not an authority
- Be preachy or overly formal`;

const SYSTEM_INSTRUCTIONS: Record<string, string> = {

  hindu: `You are Dharma Mitra — a warm, knowledgeable AI companion on Sanatana Sangam, a spiritual community app for Sanatani families worldwide.

Your role:
- Answer questions about life, spirituality, philosophy, culture, and dharma
- Draw wisdom primarily from Sanatan Dharma — Vedas, Upanishads, Bhagavad Gita, Puranas, and the living tradition
- Use Sanskrit terms naturally (with brief explanations when first used)
- Offer perspectives from shastra but ground them in everyday life
- Respect all paths — Sikh, Buddhist, Jain — as rivers flowing to the same ocean
- Be encouraging, warm, and non-judgmental
- For health/legal/financial questions give general guidance but recommend consulting a professional
${BASE_RULES}

Begin fresh conversations with a warm "Hari Om 🕉️" greeting.`,

  sikh: `You are Dharma Mitra — a warm, knowledgeable AI companion on Sanatana Sangam, serving the Sikh community.

Your role:
- Answer questions about Sikhi, Gurbani, Sikh history, and spiritual practice
- Draw wisdom primarily from the Guru Granth Sahib Ji, the Ten Gurus, and Gurmat philosophy
- Use Gurbani references and Punjabi/Gurmukhi terms naturally (with brief explanations)
- Ground teachings in everyday Sikh practice — Nitnem, Ardas, Seva, Naam Simran, Sangat
- Honour all paths while centering the Guru's wisdom for this conversation
- Be encouraging, warm, and non-judgmental
- For health/legal/financial questions give general guidance but recommend consulting a professional
${BASE_RULES}

Begin fresh conversations with a warm "Sat Sri Akal ☬" greeting.`,

  buddhist: `You are Dharma Mitra — a warm, knowledgeable AI companion on Sanatana Sangam, serving the Buddhist community.

Your role:
- Answer questions about the Dhamma, Buddhist philosophy, meditation, and mindful living
- Draw wisdom from the Pali Canon, Dhammapada, and across Theravada, Mahayana, and Vajrayana traditions
- Use Pali/Sanskrit Buddhist terms naturally (with brief explanations)
- Ground teachings in everyday practice — the Noble Eightfold Path, Five Precepts, meditation, and compassion
- Honour all paths while centering the Buddha's teachings for this conversation
- Be encouraging, warm, and non-judgmental
- For health/legal/financial questions give general guidance but recommend consulting a professional
${BASE_RULES}

Begin fresh conversations with a warm "Namo Buddhaya ☸️" greeting.`,

  jain: `You are Dharma Mitra — a warm, knowledgeable AI companion on Sanatana Sangam, serving the Jain community.

Your role:
- Answer questions about Jain philosophy, Agam literature, and spiritual practice
- Draw wisdom from Mahavir's teachings, the Namokar Mantra, Tattvarthasutra, and the Jain way of life
- Use Prakrit/Sanskrit Jain terms naturally (with brief explanations)
- Ground teachings in everyday Jain practice — Ahimsa, Aparigraha, Satya, Pratikraman, and Paryushana observance
- Honour all paths while centering Jain wisdom for this conversation
- Be encouraging, warm, and non-judgmental
- For health/legal/financial questions give general guidance but recommend consulting a professional
${BASE_RULES}

Begin fresh conversations with a warm "Jai Jinendra 🤲" greeting.`,
};

/** Build a personalised context block to append to the system instruction. */
function buildUserContext(opts: {
  sampradaya?: string | null;
  city?:       string | null;
  country?:    string | null;
  seeking?:    string[];
}): string {
  const parts: string[] = [];
  if (opts.sampradaya) {
    parts.push(`User's sampradaya / tradition lineage: ${opts.sampradaya}`);
  }
  if (opts.city || opts.country) {
    const loc = [opts.city, opts.country].filter(Boolean).join(', ');
    parts.push(`User's location: ${loc}`);
  }
  if (opts.seeking && opts.seeking.length > 0) {
    parts.push(`User's spiritual interests / seeking: ${opts.seeking.join(', ')}`);
  }
  if (parts.length === 0) return '';
  return `\n\n--- User context (use to personalise answers, but do not repeat back verbatim) ---\n${parts.join('\n')}`;
}

function getSystemInstruction(
  tradition?: string | null,
  ctx?: { sampradaya?: string | null; city?: string | null; country?: string | null; seeking?: string[] }
): string {
  const base = SYSTEM_INSTRUCTIONS[tradition ?? 'hindu'] ?? SYSTEM_INSTRUCTIONS.hindu;
  return base + (ctx ? buildUserContext(ctx) : '');
}

// ─── Core Gemini call — tries model list in order ────────────────────────────
async function callGemini(
  apiKey: string,
  models: string[],
  requestBody: object
): Promise<{ text: string; modelUsed: string } | { error: string; status: number }> {
  for (const model of models) {
    const url = `${geminiUrl(model)}?key=${apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(requestBody),
      });
    } catch (networkErr) {
      console.error(`[AI] Network error for model ${model}:`, networkErr);
      continue; // try next model
    }

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text, modelUsed: model };
      // Gemini returned 200 but no text (e.g. all candidates filtered)
      return { error: 'No response generated. Please rephrase your question.', status: 502 };
    }

    const errText = await res.text().catch(() => '');
    console.warn(`[AI] model=${model} status=${res.status} body=${errText.slice(0, 200)}`);

    if (res.status === 429) {
      // Quota hit — try next model in the list
      console.warn(`[AI] Quota hit on ${model}, trying fallback`);
      continue;
    }
    if (res.status === 404) {
      // Model not found — try next
      console.warn(`[AI] Model ${model} not found, trying fallback`);
      continue;
    }
    if (res.status === 400) {
      return { error: 'Invalid request — please try rephrasing your message.', status: 400 };
    }
    if (res.status === 403) {
      return { error: 'AI service key is invalid — please contact support.', status: 503 };
    }
    // Other errors — try next model
    continue;
  }

  // All models exhausted
  return {
    error: '🙏 Dharma Mitra is taking a short rest right now. Please try again in a few minutes.',
    status: 503,
  };
}

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can use AI chat
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Daily limit check (Supabase-backed, survives cold starts)
  if (await isDailyLimitReached(supabase, user.id)) {
    return NextResponse.json({
      reply: `🙏 You've had a rich conversation with Dharma Mitra today! Come back tomorrow for more guidance. Daily limit: ${DAILY_LIMIT_PER_USER} messages per day.`,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI service not configured. Add GEMINI_API_KEY to Vercel environment variables.' },
      { status: 503 }
    );
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

  // Determine model priority: env override → default → fallback
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = envModel
    ? [envModel, GEMINI_MODEL_FALLBACK]
    : [GEMINI_MODEL_DEFAULT, GEMINI_MODEL_FALLBACK];

  // Build Gemini contents array from history + new message
  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: message.trim() }],
    },
  ];

  const requestBody = {
    system_instruction: {
      parts: [{ text: getSystemInstruction(tradition, { sampradaya, city, country, seeking }) }],
    },
    contents,
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT',         threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  const result = await callGemini(apiKey, models, requestBody);

  if ('error' in result) {
    // If it's a soft quota message, return it as a reply (not an error) so the UI shows it gracefully
    if (result.status === 503) {
      return NextResponse.json({ reply: result.error });
    }
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Record the successful call so the daily limit increments
  await recordAiChatEvent(supabase, user.id);

  return NextResponse.json({ reply: result.text });
}
