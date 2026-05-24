import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { createAdminClient } from '@/lib/supabase-admin';
import { getLanguageInstruction } from '@/lib/language-runtime';
import { emitEvent, emitError } from '@/lib/monitoring/events';

const TRADITION_CONTEXT: Record<string, string> = {
  hindu:    'Hindu scriptures, deities, festivals, temples, philosophy (Vedanta, Yoga, Bhakti), rivers, sacred geography, Sanskrit terms, and Puranic stories',
  sikh:     'Sikh Gurus (all ten), Guru Granth Sahib Ji, Gurdwaras, Sikh history, Khalsa, shabads, Gurmukhi script, Ardas, key Sikh festivals and concepts like Seva and Simran',
  buddhist: 'Buddhist teachings, the Pali Canon, Mahayana sutras, the life of Siddhartha Gautama, the Four Noble Truths, the Eightfold Path, famous monasteries, bodhisattvas, and key Buddhist festivals',
  jain:     'Jain Tirthankaras (especially Mahavira and Rishabhanatha), Jain philosophy (Ahimsa, Anekantavada, Syadvada), Agamas, Jain mathematics, the distinction between Digambara and Shvetambara, Paryushana, and Navkar Mantra',
  all:      'the shared spiritual heritage of India — covering Hindu, Sikh, Buddhist and Jain traditions, common sacred rivers, pilgrimage sites, and inter-tradition concepts',
};

function buildPrompt(tradition: string, dateStr: string, language?: string | null): string {
  const ctx = TRADITION_CONTEXT[tradition] ?? TRADITION_CONTEXT.all;
  const langInstruction = getLanguageInstruction(language);

  return `You are a precise and engaging spiritual quiz writer for a dharma app.

Generate ONE multiple-choice quiz question about ${ctx}.

Language Instructions:
${langInstruction}
Ensure that the "question", "options", "explanation", and "fact" fields are in the requested language.

Rules:
- The question must be factual and verifiable
- Difficulty: intermediate (not a trivial or famous fact, but not academic specialist level)
- Use exactly 4 answer options
- Exactly one option is correct
- The "explanation" field explains in 2-3 sentences WHY the correct answer is correct — useful for learners who chose wrong
- The "fact" field adds a short, fascinating extra detail (1-2 sentences) that enriches the answer
- No markdown in any field — plain text only
- Keep all fields concise

Seed for variety (do not include in output): tradition=${tradition}, date=${dateStr}, language=${language}

Respond ONLY with valid JSON matching this schema exactly:
{
  "question": "<the question>",
  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
  "answerIndex": <0-3>,
  "explanation": "<why the correct answer is correct — 2-3 sentences>",
  "fact": "<interesting follow-up fact>",
  "source": "<scripture, text, or tradition>"
}`;
}

function extractJsonBlock(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

const TRADITIONS = ['hindu', 'sikh', 'buddhist', 'jain'];
const LANGUAGES = ['en', 'hi', 'pa'];

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tradition?: string; language?: string; date?: string } = {};
  try {
    const rawBody = await req.text();
    if (rawBody) {
      body = JSON.parse(rawBody);
    }
  } catch (err) {
    // Ignore invalid JSON, default to empty
  }

  const dateStr = body.date || new Date().toISOString().split('T')[0];
  const traditions = body.tradition ? [body.tradition] : TRADITIONS;
  const languages = body.language ? [body.language] : LANGUAGES;

  const supabase = createAdminClient();
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const results: Array<{ tradition: string; language: string; date: string; status: 'generated'|'skipped'|'failed'; error?: string }> = [];

  for (const tradition of traditions) {
    for (const language of languages) {
      try {
        const { data: existing } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .select('id')
          .eq('tradition', tradition)
          .eq('language', language)
          .eq('date', dateStr)
          .maybeSingle();

        if (existing) {
          skipped++;
          results.push({ tradition, language, date: dateStr, status: 'skipped' });
          continue;
        }

        const prompt = buildPrompt(tradition, dateStr, language);
        
        const result = await generateWithProvider(
          {
            system: 'You generate precise, valid JSON for structured spiritual quiz content.',
            user: prompt,
            temperature: 0.35,
            reasoningEffort: 'none',
            maxOutputTokens: 900,
          },
          { responseFormat: 'json', providerOverride: 'sarvam-hosted' }
        );

        const cleaned = extractJsonBlock(result.text);
        let quiz: { question: string; options: string[]; answerIndex: number; explanation: string; fact: string; source: string };
        
        try {
          quiz = JSON.parse(cleaned);
        } catch {
          throw new Error('Parse failed');
        }

        if (
          typeof quiz.question !== 'string' ||
          !Array.isArray(quiz.options) ||
          quiz.options.length !== 4 ||
          typeof quiz.answerIndex !== 'number' ||
          quiz.answerIndex < 0 ||
          quiz.answerIndex > 3
        ) {
          throw new Error('Validation failed');
        }

        const { error: insertError } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .insert({
            tradition,
            language,
            date: dateStr,
            question: quiz.question,
            options: quiz.options,
            answer_index: quiz.answerIndex,
            explanation: quiz.explanation,
            fact: quiz.fact,
            source: quiz.source,
          } as unknown as never);

        if (insertError) throw insertError;

        generated++;
        results.push({ tradition, language, date: dateStr, status: 'generated' });
        emitEvent({
          severity: 'P3',
          domain: 'ai',
          route: '/api/quiz/generate-daily',
          context: { feature: 'daily_quiz_cron', tradition, language, date: dateStr, status: 'generated' },
        });

      } catch (err: unknown) {
        failed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ tradition, language, date: dateStr, status: 'failed', error: errMsg });
        emitError('ai', err instanceof Error ? err : new Error(errMsg), 'P2', {
          route: '/api/quiz/generate-daily',
          context: { tradition, language, date: dateStr },
        });
      }
    }
  }

  return NextResponse.json({ generated, skipped, failed, results });
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
