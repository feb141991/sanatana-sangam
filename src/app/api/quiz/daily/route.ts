import { NextRequest, NextResponse } from 'next/server';

// ─── GET /api/quiz/daily ──────────────────────────────────────────────────────
// Returns a tradition-aware "Do You Know?" question for the current UTC date.
//
// Query params:
//   tradition  : 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all'  (default: hindu)
//   date       : YYYY-MM-DD  (default: today UTC — used as cache key)
//
// Response: { question, options: string[], answerIndex: number, fact: string, source: string }
//
// The server generates via Gemini and returns a structured JSON quiz item.
// The client caches the result in localStorage keyed by tradition + date so
// the question is consistent for the whole day without repeated API calls.
//
// Cache-Control: stale-while-revalidate 86400 so repeated calls within the day
// are served from edge cache.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODEL_DEFAULT  = 'gemini-2.0-flash';
const GEMINI_MODEL_FALLBACK = 'gemini-2.0-flash-lite';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const TRADITION_CONTEXT: Record<string, string> = {
  hindu:    'Hindu scriptures, deities, festivals, temples, philosophy (Vedanta, Yoga, Bhakti), rivers, sacred geography, Sanskrit terms, and Puranic stories',
  sikh:     'Sikh Gurus (all ten), Guru Granth Sahib Ji, Gurdwaras, Sikh history, Khalsa, shabads, Gurmukhi script, Ardas, key Sikh festivals and concepts like Seva and Simran',
  buddhist: 'Buddhist teachings, the Pali Canon, Mahayana sutras, the life of Siddhartha Gautama, the Four Noble Truths, the Eightfold Path, famous monasteries, bodhisattvas, and key Buddhist festivals',
  jain:     'Jain Tirthankaras (especially Mahavira and Rishabhanatha), Jain philosophy (Ahimsa, Anekantavada, Syadvada), Agamas, Jain mathematics, the distinction between Digambara and Shvetambara, Paryushana, and Navkar Mantra',
  all:      'the shared spiritual heritage of India — covering Hindu, Sikh, Buddhist and Jain traditions, common sacred rivers, pilgrimage sites, and inter-tradition concepts',
};

function buildPrompt(tradition: string, dateStr: string): string {
  const ctx = TRADITION_CONTEXT[tradition] ?? TRADITION_CONTEXT.all;
  return `You are a precise and engaging spiritual quiz writer for a dharma app.

Generate ONE multiple-choice quiz question about ${ctx}.

Rules:
- The question must be factual and verifiable
- Difficulty: intermediate (not a trivial or famous fact, but not academic specialist level)
- Use exactly 4 answer options
- Exactly one option is correct
- The "explanation" field explains in 2-3 sentences WHY the correct answer is correct — useful for learners who chose wrong
- The "fact" field adds a short, fascinating extra detail (1-2 sentences) that enriches the answer
- No markdown in any field — plain text only
- Keep all fields concise

Seed for variety (do not include in output): tradition=${tradition}, date=${dateStr}

Respond ONLY with valid JSON matching this schema exactly:
{
  "question": "<the question>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "answerIndex": <0-3>,
  "explanation": "<why the correct answer is correct — 2-3 sentences>",
  "fact": "<interesting follow-up fact>",
  "source": "<scripture, text, or tradition — e.g. 'Rigveda 10.129' or 'Sikh tradition'>"
}`;
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents:         [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const tradition = searchParams.get('tradition') ?? 'hindu';
  const dateStr   = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const prompt = buildPrompt(tradition, dateStr);

  let raw = '';
  try {
    raw = await callGemini(apiKey, GEMINI_MODEL_DEFAULT, prompt);
  } catch {
    try {
      raw = await callGemini(apiKey, GEMINI_MODEL_FALLBACK, prompt);
    } catch (err2) {
      console.error('[quiz/daily] Gemini failed:', err2);
      return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
    }
  }

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let quiz: { question: string; options: string[]; answerIndex: number; explanation: string; fact: string; source: string };
  try {
    quiz = JSON.parse(cleaned);
  } catch {
    console.error('[quiz/daily] JSON parse failed. Raw:', raw.slice(0, 200));
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
  }

  // Validate shape
  if (
    typeof quiz.question !== 'string' ||
    !Array.isArray(quiz.options) ||
    quiz.options.length !== 4 ||
    typeof quiz.answerIndex !== 'number' ||
    quiz.answerIndex < 0 ||
    quiz.answerIndex > 3
  ) {
    return NextResponse.json({ error: 'Malformed quiz response' }, { status: 502 });
  }

  return NextResponse.json(
    { ...quiz, tradition, date: dateStr },
    {
      headers: {
        // Cache at edge for 24 h; revalidate in background
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    },
  );
}
