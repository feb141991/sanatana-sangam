import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { createAdminClient } from '@/lib/supabase-admin';
import { getLanguageInstruction } from '@/lib/language-runtime';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { recordCronTelemetry } from '@/lib/monitoring/cron-telemetry';

const TRADITION_CONTEXT: Record<string, string> = {
  hindu:    'Hindu scriptures, deities, festivals, temples, philosophy (Vedanta, Yoga, Bhakti), rivers, sacred geography, Sanskrit terms, and Puranic stories',
  sikh:     'Sikh Gurus (all ten), Guru Granth Sahib Ji, Gurdwaras, Sikh history, Khalsa, shabads, Gurmukhi script, Ardas, key Sikh festivals and concepts like Seva and Simran',
  buddhist: 'Buddhist teachings, the Pali Canon, Mahayana sutras, the life of Siddhartha Gautama, the Four Noble Truths, the Eightfold Path, famous monasteries, bodhisattvas, and key Buddhist festivals',
  jain:     'Jain Tirthankaras (especially Mahavira and Rishabhanatha), Jain philosophy (Ahimsa, Anekantavada, Syadvada), Agamas, Jain mathematics, the distinction between Digambara and Shvetambara, Paryushana, and Navkar Mantra',
  all:      'the shared spiritual heritage of India — covering Hindu, Sikh, Buddhist and Jain traditions, common sacred rivers, pilgrimage sites, and inter-tradition concepts',
};

function buildPrompt(tradition: string, dateStr: string, language?: string | null, recentQuestions?: string[]): string {
  const ctx = TRADITION_CONTEXT[tradition] ?? TRADITION_CONTEXT.all;
  const langInstruction = getLanguageInstruction(language);

  const exclusionBlock = recentQuestions && recentQuestions.length > 0
    ? `\nIMPORTANT — Do NOT repeat or closely paraphrase any of these recently-asked questions:\n${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\nChoose a completely different topic, deity, scripture, concept, or historical event.\n`
    : '';

  return `You are a precise and engaging spiritual quiz writer for a dharma app.

Generate ONE multiple-choice quiz question about ${ctx}.

Language Instructions:
${langInstruction}
Ensure that the "question", "options", "explanation", and "fact" fields are in the requested language.
${exclusionBlock}
Rules:
- The question must be factual and verifiable
- Difficulty: intermediate (not a trivial or famous fact, but not academic specialist level)
- Use exactly 4 answer options
- Exactly one option is correct
- Vary the topic widely — cycle through different deities, scriptures, philosophy, festivals, geography, history, and rituals
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

async function handleGenerateDaily(req: NextRequest) {
  const startTime = Date.now();
  const route = '/api/quiz/generate-daily';
  
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    await recordCronTelemetry({
      route,
      statusCode: 401,
      durationMs: Date.now() - startTime,
      error: 'Unauthorized — missing or invalid CRON_SECRET',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tradition?: string; language?: string; date?: string } = {};
  if (req.method === 'POST') {
    try {
      const rawBody = await req.text();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      // Ignore invalid JSON, default to empty
    }
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

        const ninetyDaysAgo = new Date(dateStr);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

        const { data: recentRows } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .select('question')
          .eq('tradition', tradition)
          .eq('language', language)
          .gte('date', ninetyDaysAgoStr)
          .lt('date', dateStr)
          .order('date', { ascending: false })
          .limit(90);

        const recentQuestions = (recentRows as unknown as { question: string }[] | null)
          ?.map(r => r.question)
          .filter(Boolean) ?? [];

        const prompt = buildPrompt(tradition, dateStr, language, recentQuestions);
        const result = await generateWithProvider(
          {
            system: 'You generate precise, valid JSON for structured spiritual quiz content.',
            user: prompt,
            temperature: 0.35,
            reasoningEffort: 'none',
            maxOutputTokens: 1024,
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

        await supabase
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

        generated++;
        results.push({ tradition, language, date: dateStr, status: 'generated' });

        emitEvent({
          severity: 'P3',
          domain: 'ai',
          route: '/api/quiz/generate-daily',
          latency_ms: Date.now() - startTime,
          provider: result.provider,
          model: result.modelUsed,
          context: { feature: 'daily_quiz_cron', tradition, language, date: dateStr },
        });
      } catch (err: unknown) {
        failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        results.push({ tradition, language, date: dateStr, status: 'failed', error: errorMessage });
        emitError('ai', err, 'P2', { route: '/api/quiz/generate-daily', context: { tradition, language, date: dateStr } });
      }
    }
  }

  const responsePayload = {
    message: 'Daily quiz generation run completed',
    date: dateStr,
    generated,
    skipped,
    failed,
    results,
  };

  const statusCode = (failed > 0 && generated === 0) ? 500 : 200;

  await recordCronTelemetry({
    route,
    statusCode,
    durationMs: Date.now() - startTime,
    responseData: responsePayload,
    error: failed > 0 ? `${failed} quiz variations failed` : undefined,
  });

  return NextResponse.json(responsePayload, { status: statusCode });
}

export async function GET(req: NextRequest) {
  return handleGenerateDaily(req);
}

export async function POST(req: NextRequest) {
  return handleGenerateDaily(req);
}
