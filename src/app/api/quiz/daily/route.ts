import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, logValidationResult, buildPipelinePromptHint } from '@/lib/ai/validate-pipeline-tags';
import { normalizeContentLanguage, getLanguageInstruction } from '@/lib/language-runtime';
import { createAdminClient } from '@/lib/supabase-admin';
import { DAILY_FALLBACK_QUIZ } from '@/lib/quiz-fallback';

const TRADITION_CONTEXT: Record<string, string> = {
  hindu:    'Hindu scriptures, deities, festivals, temples, philosophy (Vedanta, Yoga, Bhakti), rivers, sacred geography, Sanskrit terms, and Puranic stories',
  sikh:     'Sikh Gurus (all ten), Guru Granth Sahib Ji, Gurdwaras, Sikh history, Khalsa, shabads, Gurmukhi script, Ardas, key Sikh festivals and concepts like Seva and Simran',
  buddhist: 'Buddhist teachings, the Pali Canon, Mahayana sutras, the life of Siddhartha Gautama, the Four Noble Truths, the Eightfold Path, famous monasteries, bodhisattvas, and key Buddhist festivals',
  jain:     'Jain Tirthankaras (especially Mahavira and Rishabhanatha), Jain philosophy (Ahimsa, Anekantavada, Syadvada), Agamas, Jain mathematics, the distinction between Digambara and Shvetambara, Paryushana, and Navkar Mantra',
  all:      'the shared spiritual heritage of India — covering Hindu, Sikh, Buddhist and Jain traditions, common sacred rivers, pilgrimage sites, and inter-tradition concepts',
};

function buildPrompt(
  tradition: string,
  dateStr: string,
  language?: string | null,
  recentQuestions?: string[],
): string {
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
- Vary the topic widely — cycle through different deities, scriptures, philosophy, festivals, geography, history, and rituals. Avoid repeating the same category two days in a row
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTradition = searchParams.get('tradition') ?? 'hindu';
  const dateStr      = searchParams.get('date') ?? new Date().toISOString().split('T')[0];
  const rawLanguage  = searchParams.get('language');

  const tagValidation = validatePipelineTags(
    {
      tradition: rawTradition === 'all' ? 'generic' : rawTradition,
      content_type: 'ui_text',
    },
    { context: 'daily_quiz' }
  );
  logValidationResult(tagValidation, 'DailyQuiz');
  const effectiveTags = mergeTags(
    tagValidation.tags,
    getDefaultTags({ contentType: 'ui_text' })
  );

  const tradition = (rawTradition === 'all' && effectiveTags.tradition === 'generic')
    ? 'all'
    : (effectiveTags.tradition ?? 'hindu');
  
  const requestedLanguage = normalizeContentLanguage(rawLanguage);
  
  // 1. Look up in DB using Admin Client
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('daily_quiz' as unknown as 'quiz_responses')
    .select('*')
    .eq('tradition', tradition)
    .eq('language', requestedLanguage)
    .eq('date', dateStr)
    .maybeSingle();

  if (data) {
    const existingQuiz = data as unknown as {
      question: string; options: string[]; answer_index: number;
      explanation: string; fact: string; source: string; tradition: string; date: string; id: string;
    };
    return NextResponse.json({
      question: existingQuiz.question,
      options: existingQuiz.options,
      answerIndex: existingQuiz.answer_index,
      explanation: existingQuiz.explanation,
      fact: existingQuiz.fact,
      source: existingQuiz.source,
      tradition: existingQuiz.tradition,
      date: existingQuiz.date,
      daily_quiz_id: existingQuiz.id,
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } });
  }

  // 2. Not found → fetch last 7 days of questions to avoid repetition
  const sevenDaysAgo = new Date(dateStr);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const { data: recentRows } = await supabase
    .from('daily_quiz' as unknown as 'quiz_responses')
    .select('question')
    .eq('tradition', tradition)
    .eq('language', requestedLanguage)
    .gte('date', sevenDaysAgoStr)
    .lt('date', dateStr)
    .order('date', { ascending: false })
    .limit(7);

  const recentQuestions = (recentRows as unknown as { question: string }[] | null)
    ?.map(r => r.question)
    .filter(Boolean) ?? [];

  // 3. Generate on demand
  const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);
  const prompt = buildPrompt(tradition, dateStr, requestedLanguage, recentQuestions);
  const startTime = Date.now();

  const langFallbacks = DAILY_FALLBACK_QUIZ[requestedLanguage] ?? DAILY_FALLBACK_QUIZ['en'];
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const fallbackPool = langFallbacks[tradition] ?? langFallbacks['all'] ?? DAILY_FALLBACK_QUIZ['en']['all'];
  const fallbackArr = Array.isArray(fallbackPool) ? fallbackPool : [fallbackPool];
  const fallbackQuiz = fallbackArr[dayOfYear % fallbackArr.length];
  const fallbackLanguage = DAILY_FALLBACK_QUIZ[requestedLanguage] && (langFallbacks[tradition] || langFallbacks['all']) ? undefined : 'en';

  try {
    const result = await generateWithProvider(
      {
        system: [
          'You generate precise, valid JSON for structured spiritual quiz content.',
          pipelinePromptHint,
        ].filter(Boolean).join('\n\n'),
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
      console.error('[quiz/daily] JSON parse failed. Raw:', result.text.slice(0, 200));
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

    // Insert into DB
    const { data: insertedQuizData, error: insertError } = await supabase
      .from('daily_quiz' as unknown as 'quiz_responses')
      .insert({
        tradition,
        language: requestedLanguage,
        date: dateStr,
        question: quiz.question,
        options: quiz.options,
        answer_index: quiz.answerIndex,
        explanation: quiz.explanation,
        fact: quiz.fact,
        source: quiz.source,
      } as unknown as never)
      .select('id')
      .single();

    const insertedQuiz = insertedQuizData as unknown as { id: string } | null;

    if (insertError) {
      console.error('[quiz/daily] Failed to insert newly generated quiz:', insertError);
      // We can still return it to the user even if insert failed
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/quiz/daily',
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.modelUsed,
      fallback_used: result.provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
      context: {
        feature: 'daily_quiz',
        tradition,
        language: requestedLanguage,
        pipeline_content_type: effectiveTags.content_type ?? null,
      },
    });

    return NextResponse.json(
      { ...quiz, tradition, date: dateStr, daily_quiz_id: insertedQuiz?.id },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      emitError('ai', err, 'P2', { route: '/api/quiz/daily', latency_ms: Date.now() - startTime });
      console.error('[quiz/daily] Provider generation failed:', err);
    }
    return NextResponse.json(
      { ...fallbackQuiz, tradition, date: dateStr, fallbackLanguage, ai: { provider: 'fallback', degraded: true }, degraded: true },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } },
    );
  }
}
