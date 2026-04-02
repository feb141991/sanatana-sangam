import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── General AI Chat Route ────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message: string; tradition?: string | null; history: { role: 'user' | 'model'; text: string }[] }
// Uses Gemini Flash-Lite / Flash with model fallback for better reliability.

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_ITEMS = 12;
const MAX_HISTORY_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_TOTAL_CHARS = 8000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const DEFAULT_GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'] as const;

type ChatHistoryEntry = {
  role: 'user' | 'model';
  text: string;
};

const RATE_LIMIT_STORE_KEY = '__sanatana_sangam_ai_rate_limits__';

function getRateLimitStore() {
  const globalScope = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, number[]>;
  };

  if (!globalScope[RATE_LIMIT_STORE_KEY]) {
    globalScope[RATE_LIMIT_STORE_KEY] = new Map<string, number[]>();
  }

  return globalScope[RATE_LIMIT_STORE_KEY]!;
}

function checkRateLimit(userId: string) {
  const now = Date.now();
  const store = getRateLimitStore();
  const recentRequests = (store.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    store.set(userId, recentRequests);
    return false;
  }

  recentRequests.push(now);
  store.set(userId, recentRequests);
  return true;
}

function parseHistory(value: unknown): ChatHistoryEntry[] | null {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_ITEMS) return null;

  let totalChars = 0;
  const parsed: ChatHistoryEntry[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;

    const role = 'role' in item ? item.role : undefined;
    const text = 'text' in item ? item.text : undefined;

    if ((role !== 'user' && role !== 'model') || typeof text !== 'string') {
      return null;
    }

    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > MAX_HISTORY_MESSAGE_LENGTH) {
      return null;
    }

    totalChars += trimmedText.length;
    if (totalChars > MAX_HISTORY_TOTAL_CHARS) {
      return null;
    }

    parsed.push({ role, text: trimmedText });
  }

  return parsed;
}

function getGeminiModels() {
  const configuredModels = process.env.GEMINI_MODELS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredModels && configuredModels.length > 0) {
    return configuredModels;
  }

  return [...DEFAULT_GEMINI_MODELS];
}

async function callGeminiModel(model: string, apiKey: string, requestBody: unknown) {
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      errorText: await response.text(),
    };
  }

  return {
    ok: true as const,
    data: await response.json(),
  };
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

function getSystemInstruction(tradition?: string | null): string {
  return SYSTEM_INSTRUCTIONS[tradition ?? 'hindu'] ?? SYSTEM_INSTRUCTIONS.hindu;
}

export async function POST(req: NextRequest) {
  // Auth check — only logged-in users can use AI chat
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Too many messages right now. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured. Add GEMINI_API_KEY to .env.local' }, { status: 503 });
  }

  let body: { message?: unknown; tradition?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
  if (!rawMessage) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const history = parseHistory(body.history);
  if (!history) {
    return NextResponse.json({ error: 'Invalid chat history provided' }, { status: 400 });
  }

  const tradition = typeof body.tradition === 'string' ? body.tradition : null;
  const geminiModels = getGeminiModels();

  // Build Gemini contents array from history + new message
  const contents = [
    ...history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: rawMessage }],
    },
  ];

  const requestBody = {
    system_instruction: {
      parts: [{ text: getSystemInstruction(tradition) }],
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
    let lastError: { model: string; status: number; errorText: string } | null = null;

    for (const model of geminiModels) {
      const result = await callGeminiModel(model, apiKey, requestBody);

      if (result.ok) {
        const text = result.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          return NextResponse.json({ error: 'No response from AI. Please try again.' }, { status: 502 });
        }

        return NextResponse.json({ reply: text, model });
      }

      console.error('Gemini API error:', model, result.status, result.errorText);
      lastError = { model, status: result.status, errorText: result.errorText };

      if (result.status === 400 || result.status === 403) {
        break;
      }
    }

    if (!lastError) {
      return NextResponse.json({ error: 'AI service is unavailable right now.' }, { status: 502 });
    }

    let hint = '';
    if (lastError.status === 400) hint = 'Bad request format.';
    if (lastError.status === 403) hint = 'Invalid API key or project permissions — check GEMINI_API_KEY in Vercel env vars.';
    if (lastError.status === 404) hint = 'Configured model is unavailable. Update GEMINI_MODELS.';
    if (lastError.status === 429) hint = 'Current model quota is exhausted. Add billing or use a model with available quota.';

    return NextResponse.json(
      {
        error: `AI error (${lastError.status})${hint ? ': ' + hint : ''}`,
        model: lastError.model,
      },
      { status: 502 }
    );
  } catch (err) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Network error. Please try again.' }, { status: 502 });
  }
}
