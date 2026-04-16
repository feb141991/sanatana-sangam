import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── General AI Chat Route ────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string; tradition?: string | null; history: { role: 'user' | 'model'; text: string }[] }
// Uses Google Gemini Flash — fast, free-tier available, multilingual.

// Primary model — Gemini 2.0 Flash (low latency, good free tier)
// If quota is exhausted (429) we fall back to a graceful message.
// To use a different model, change this constant and redeploy.
const GEMINI_MODEL   = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─── Simple per-user rate limit (in-memory, resets on cold start) ─────────────
// Prevents a single user from exhausting the shared free quota.
const USER_TIMESTAMPS = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS  = 60_000; // 1 minute
const RATE_LIMIT_MAX_CALLS  = 8;      // max 8 requests per user per minute

function isRateLimited(userId: string): boolean {
  const now  = Date.now();
  const prev = (USER_TIMESTAMPS.get(userId) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (prev.length >= RATE_LIMIT_MAX_CALLS) return true;
  USER_TIMESTAMPS.set(userId, [...prev, now]);
  return false;
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

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can use AI chat
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Per-user rate limit — 8 requests per minute max
  if (isRateLimited(user.id)) {
    return NextResponse.json({
      reply: '🙏 Please slow down a little — Dharma Mitra can only answer so many questions at once. Take a breath, and try again in a moment.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured. Add GEMINI_API_KEY to .env.local' }, { status: 503 });
  }

  let body: {
    message:    string;
    tradition?: string | null;
    sampradaya?: string | null;
    city?:      string | null;
    country?:   string | null;
    seeking?:   string[];
    history?:   { role: 'user' | 'model'; text: string }[];
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

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', res.status, errText);

      // 429 — free-tier quota exhausted (per-minute or per-day RPM/RPD limit).
      // Log to server so the developer can see which limit is hit.
      if (res.status === 429) {
        console.warn(`[AI] Gemini 429 for model ${GEMINI_MODEL}:`, errText.slice(0, 300));
        return NextResponse.json({
          reply: '🙏 Dharma Mitra is resting for a moment — the free AI quota has been reached. Please try again in a minute or two. In the meantime, sit quietly and let the question settle. 😊',
        });
      }

      let hint = '';
      if (res.status === 400) hint = 'Bad request format.';
      if (res.status === 403) hint = 'Invalid API key — check GEMINI_API_KEY in Vercel env vars.';
      if (res.status === 404) hint = 'Model not found — check model name.';
      return NextResponse.json(
        { error: `AI error (${res.status})${hint ? ': ' + hint : ''}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Network error. Please try again.' }, { status: 502 });
  }
}
