// ============================================================
// ai-shloka-quiz — Quiz generation for shloka memorisation
//
// Generates multiple-choice or fill-in-the-blank questions
// from a scripture verse, powered by Gemini.
//
// POST { user_id, chunk_id?, text_id?, chapter?, verse?, mode? }
// mode: 'mcq' | 'fill' | 'meaning' (default: 'mcq')
// → { question, options?, answer, explanation, chunk, generated_at }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

type QuizMode = 'mcq' | 'fill' | 'meaning';

interface QuizResult {
  question: string;
  options?: string[];   // present for MCQ mode
  answer: string;
  explanation: string;
  chunk: Record<string, unknown>;
  mode: QuizMode;
  generated_at: string;
}

function buildFallbackQuiz(chunk: Record<string, unknown>, mode: QuizMode): QuizResult {
  if (mode === 'meaning') {
    return {
      question:    `What is the core teaching of ${chunk.text_id} ${chunk.chapter}:${chunk.verse}?`,
      answer:      String(chunk.translation ?? ''),
      explanation: 'Contemplate the verse and its meaning in your own life.',
      chunk,
      mode,
      generated_at: new Date().toISOString(),
    };
  }
  return {
    question:    `Complete: "${String(chunk.transliteration ?? chunk.sanskrit ?? '').split(' ').slice(0, 5).join(' ')}..."`,
    answer:      String(chunk.translation ?? ''),
    explanation: 'Recite the full verse three times.',
    chunk,
    mode,
    generated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });

  try {
    const body = await req.json();
    const { user_id, chunk_id, text_id, chapter, verse, mode = 'mcq' } = body;
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

    const supabase    = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const geminiKey   = Deno.env.get('GEMINI_API_KEY');

    // Fetch the verse
    let chunkQuery = supabase.from('scripture_chunks').select('id,text_id,chapter,verse,sanskrit,transliteration,translation,tags');

    if (chunk_id) {
      chunkQuery = chunkQuery.eq('id', chunk_id);
    } else if (text_id && chapter && verse) {
      chunkQuery = chunkQuery.eq('text_id', text_id).eq('chapter', chapter).eq('verse', verse);
    } else {
      // Pick a due card from memorisation queue
      const { data: due } = await supabase
        .from('memorisation_queue')
        .select('chunk_id')
        .eq('user_id', user_id)
        .lte('next_review_at', new Date().toISOString().split('T')[0])
        .neq('status', 'mastered')
        .order('next_review_at')
        .limit(1)
        .single();

      if (due?.chunk_id) {
        chunkQuery = chunkQuery.eq('id', due.chunk_id);
      } else {
        // Random verse from Gita
        chunkQuery = chunkQuery
          .eq('text_id', 'gita')
          .order('chapter')
          .limit(1)
          .range(Math.floor(Math.random() * 200), Math.floor(Math.random() * 200));
      }
    }

    const { data: chunks } = await chunkQuery.limit(1);
    const chunk = chunks?.[0];

    if (!chunk) {
      return new Response(JSON.stringify({ error: 'verse not found' }), { status: 404 });
    }

    if (!geminiKey) {
      return new Response(JSON.stringify(buildFallbackQuiz(chunk, mode as QuizMode)), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Build mode-specific prompt
    let prompt = '';
    const verseRef = `${chunk.text_id} ${chunk.chapter}:${chunk.verse}`;

    if (mode === 'mcq') {
      prompt = `Generate a multiple-choice quiz question for this scripture verse to test memorisation.

Verse: ${verseRef}
Sanskrit: ${chunk.sanskrit ?? 'N/A'}
Transliteration: ${chunk.transliteration ?? 'N/A'}
Translation: ${chunk.translation}

Create a question that tests understanding of the verse's meaning. Provide exactly 4 options (A, B, C, D). Mark the correct answer.

Respond in this exact JSON format (no markdown):
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "..."
}`;

    } else if (mode === 'fill') {
      prompt = `Create a fill-in-the-blank exercise for this verse to aid memorisation.

Verse: ${verseRef}
Transliteration: ${chunk.transliteration ?? chunk.sanskrit}
Translation: ${chunk.translation}

Remove 2-3 key words from the transliteration and replace with ___. Test if the student remembers the exact words.

Respond in this exact JSON format (no markdown):
{
  "question": "Fill in the blanks: [transliteration with blanks]",
  "answer": "[full transliteration with words]",
  "explanation": "The missing words are [...]. These words mean [...] and are key to the verse's meaning."
}`;

    } else { // meaning
      prompt = `Create a contemplative question about this verse's spiritual meaning.

Verse: ${verseRef}
Sanskrit: ${chunk.sanskrit ?? 'N/A'}
Translation: ${chunk.translation}

Ask a question that prompts deep reflection on how this verse applies to daily life and sadhana.

Respond in this exact JSON format (no markdown):
{
  "question": "...",
  "answer": "...",
  "explanation": "..."
}`;
    }

    const resp  = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const gData = await resp.json();
    const raw   = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify(buildFallbackQuiz(chunk, mode as QuizMode)), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const result: QuizResult = {
      question:    String(parsed.question ?? ''),
      options:     mode === 'mcq' ? (parsed.options as string[]) : undefined,
      answer:      String(parsed.answer ?? ''),
      explanation: String(parsed.explanation ?? ''),
      chunk,
      mode:        mode as QuizMode,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
