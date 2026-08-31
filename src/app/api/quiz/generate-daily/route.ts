import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { createAdminClient } from '@/lib/supabase-admin';
import { getLanguageInstruction } from '@/lib/language-runtime';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { recordCronTelemetry } from '@/lib/monitoring/cron-telemetry';
import { DAILY_FALLBACK_QUIZ } from '@/lib/quiz-fallback';
import { getQuizJobTerminalState } from '@/lib/content-job-policy';

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

function getFallbackQuizFor(tradition: string, language: string, dateStr: string) {
  const langPool = DAILY_FALLBACK_QUIZ[language] || DAILY_FALLBACK_QUIZ['en'] || {};
  const traditionPool = langPool[tradition] || langPool['hindu'] || [];
  if (traditionPool.length === 0) return null;

  // Pick deterministic index from date
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % traditionPool.length;
  return traditionPool[index];
}

const TRADITIONS = ['hindu', 'sikh', 'buddhist', 'jain'];
const LANGUAGES = ['en', 'hi', 'pa'];

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

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
  const requestedJobs = traditions.flatMap((tradition) =>
    languages.map((language) => ({ quiz_date: dateStr, tradition, language })),
  );
  const { error: seedError } = await supabase
    .from('quiz_generation_jobs' as unknown as 'quiz_responses')
    .upsert(requestedJobs as never, {
      onConflict: 'quiz_date,tradition,language',
      ignoreDuplicates: true,
    });
  if (seedError) {
    return NextResponse.json({ error: `Unable to seed quiz jobs: ${seedError.message}` }, { status: 500 });
  }

  const { data: claimedRows, error: claimError } = await supabase.rpc(
    'claim_quiz_generation_jobs' as never,
    { p_batch_limit: requestedJobs.length, p_lease_minutes: 5 } as never,
  );
  if (claimError) {
    return NextResponse.json({ error: `Unable to claim quiz jobs: ${claimError.message}` }, { status: 500 });
  }

  type QuizJob = { id: string; quiz_date: string; tradition: string; language: string; attempt_count: number; max_attempts: number };
  const claimed = (claimedRows ?? []) as unknown as QuizJob[];
  let generated = 0;
  let skipped = 0;
  let seededFallback = 0;
  let failed = 0;
  const results: Array<{ tradition: string; language: string; date: string; status: 'generated'|'skipped'|'seeded_from_fallback'|'failed'; error?: string }> = [];

  const recordVariantResults = async (variantResults: typeof results) => {
    if (variantResults.length === 0) return;
    const rows = variantResults.map((item) => ({
      timestamp: new Date().toISOString(),
      domain: 'ai',
      severity: item.status === 'failed' ? 'P2' : 'P3',
      route,
      error_code: item.status === 'failed' ? 'QUIZ_VARIANT_FAILED' : null,
      error_message: item.error?.slice(0, 500) ?? null,
      context: {
        feature: 'daily_quiz_variant',
        tradition: item.tradition,
        language: item.language,
        date: item.date,
        status: item.status,
      },
    }));
    const { error } = await supabase.from('monitoring_events').insert(rows as never);
    if (error) console.warn('[quiz/generate-daily] variant telemetry insert failed:', error.message);
  };

  await mapWithConcurrency(claimed, 4, async (job) => {
      const { tradition, language } = job;
      const jobDate = job.quiz_date;
      let finalStatus: 'generated' | 'fallback' | 'failed' = 'failed';
      let finalError: string | null = null;
      try {
        const { data: existing } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .select('id')
          .eq('tradition', tradition)
          .eq('language', language)
          .eq('date', jobDate)
          .maybeSingle();

        if (existing) {
          skipped++;
          results.push({ tradition, language, date: jobDate, status: 'skipped' });
          finalStatus = 'generated';
          return;
        }

        const ninetyDaysAgo = new Date(jobDate);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

        const { data: recentRows } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .select('question')
          .eq('tradition', tradition)
          .eq('language', language)
          .gte('date', ninetyDaysAgoStr)
          .lt('date', jobDate)
          .order('date', { ascending: false })
          .limit(90);

        const recentQuestions = (recentRows as unknown as { question: string }[] | null)
          ?.map(r => r.question)
          .filter(Boolean) ?? [];

        const prompt = buildPrompt(tradition, jobDate, language, recentQuestions);
        const result = await generateWithProvider(
          {
            system: 'You generate precise, valid JSON for structured spiritual quiz content.',
            user: prompt,
            temperature: 0.35,
            reasoningEffort: 'none',
            maxOutputTokens: 2048,
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

        const { error: quizInsertError } = await supabase
          .from('daily_quiz' as unknown as 'quiz_responses')
          .upsert({
            tradition,
            language,
            date: jobDate,
            question: quiz.question,
            options: quiz.options,
            answer_index: quiz.answerIndex,
            explanation: quiz.explanation,
            fact: quiz.fact,
            source: quiz.source,
          } as unknown as never, { onConflict: 'tradition,language,date', ignoreDuplicates: true });
        if (quizInsertError) throw quizInsertError;

        generated++;
        finalStatus = 'generated';
        results.push({ tradition, language, date: jobDate, status: 'generated' });

        emitEvent({
          severity: 'P3',
          domain: 'ai',
          route: '/api/quiz/generate-daily',
          latency_ms: Date.now() - startTime,
          provider: result.provider,
          model: result.modelUsed,
          context: { feature: 'daily_quiz_cron', tradition, language, date: jobDate },
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        finalError = errorMessage;
        
        // Fallback data seeding so the user never sees empty state
        const fallbackQuiz = getFallbackQuizFor(tradition, language, jobDate);
        if (fallbackQuiz) {
          try {
            const { error: fallbackInsertError } = await supabase
              .from('daily_quiz' as unknown as 'quiz_responses')
              .upsert({
                tradition,
                language,
                date: jobDate,
                question: fallbackQuiz.question,
                options: fallbackQuiz.options,
                answer_index: fallbackQuiz.answerIndex,
                explanation: fallbackQuiz.explanation,
                fact: fallbackQuiz.fact,
                source: fallbackQuiz.source,
              } as unknown as never, { onConflict: 'tradition,language,date', ignoreDuplicates: true });
            if (fallbackInsertError) throw fallbackInsertError;

            seededFallback++;
            finalStatus = 'fallback';
            results.push({ tradition, language, date: jobDate, status: 'seeded_from_fallback', error: errorMessage });
          } catch (seedErr) {
            failed++;
            finalError = `${errorMessage} (fallback insert failed: ${seedErr})`;
            results.push({ tradition, language, date: jobDate, status: 'failed', error: finalError });
          }
        } else {
          failed++;
          results.push({ tradition, language, date: jobDate, status: 'failed', error: errorMessage });
        }

        emitError('ai', err, 'P2', { route: '/api/quiz/generate-daily', context: { tradition, language, date: jobDate, seededFallback: !!fallbackQuiz } });
      } finally {
        const persistedStatus = getQuizJobTerminalState(finalStatus, job.attempt_count, job.max_attempts);
        const retryable = persistedStatus === 'pending';
        await supabase
          .from('quiz_generation_jobs' as unknown as 'quiz_responses')
          .update({
            status: persistedStatus,
            available_at: retryable ? new Date(Date.now() + 5 * 60_000).toISOString() : new Date().toISOString(),
            lease_until: null,
            last_error: finalError?.slice(0, 1000) ?? null,
            completed_at: retryable ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
          .eq('id', job.id);
      }
  });
  await recordVariantResults(results);

  const responsePayload = {
    message: 'Daily quiz generation run completed',
    date: dateStr,
    generated,
    seeded_fallback: seededFallback,
    skipped,
    failed,
    claimed: claimed.length,
    remaining: Math.max(0, requestedJobs.length - claimed.length),
    results,
  };

  const statusCode = (failed > 0 && generated === 0 && seededFallback === 0) ? 500 : 200;

  await recordCronTelemetry({
    route,
    statusCode,
    durationMs: Date.now() - startTime,
    responseData: responsePayload,
    error: failed > 0 ? `${failed} quiz variations failed completely` : undefined,
  });

  return NextResponse.json(responsePayload, { status: statusCode });
}

export async function GET(req: NextRequest) {
  return handleGenerateDaily(req);
}

export async function POST(req: NextRequest) {
  return handleGenerateDaily(req);
}
