import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, logValidationResult, buildPipelinePromptHint } from '@/lib/ai/validate-pipeline-tags';

// ─── GET /api/quiz/daily ──────────────────────────────────────────────────────
// Returns a tradition-aware "Do You Know?" question for the current UTC date.
//
// Query params:
//   tradition  : 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all'  (default: hindu)
//   date       : YYYY-MM-DD  (default: today UTC — used as cache key)
//
// Response: { question, options: string[], answerIndex: number, fact: string, source: string }
//
// The server generates via the active Pramana inference provider and returns a structured JSON quiz item.
// The client caches the result in localStorage keyed by tradition + date so
// the question is consistent for the whole day without repeated API calls.
//
// Cache-Control: stale-while-revalidate 86400 so repeated calls within the day
// are served from edge cache.
// ─────────────────────────────────────────────────────────────────────────────

const TRADITION_CONTEXT: Record<string, string> = {
  hindu:    'Hindu scriptures, deities, festivals, temples, philosophy (Vedanta, Yoga, Bhakti), rivers, sacred geography, Sanskrit terms, and Puranic stories',
  sikh:     'Sikh Gurus (all ten), Guru Granth Sahib Ji, Gurdwaras, Sikh history, Khalsa, shabads, Gurmukhi script, Ardas, key Sikh festivals and concepts like Seva and Simran',
  buddhist: 'Buddhist teachings, the Pali Canon, Mahayana sutras, the life of Siddhartha Gautama, the Four Noble Truths, the Eightfold Path, famous monasteries, bodhisattvas, and key Buddhist festivals',
  jain:     'Jain Tirthankaras (especially Mahavira and Rishabhanatha), Jain philosophy (Ahimsa, Anekantavada, Syadvada), Agamas, Jain mathematics, the distinction between Digambara and Shvetambara, Paryushana, and Navkar Mantra',
  all:      'the shared spiritual heritage of India — covering Hindu, Sikh, Buddhist and Jain traditions, common sacred rivers, pilgrimage sites, and inter-tradition concepts',
};

const DAILY_FALLBACK_QUIZ: Record<string, {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
}> = {
  hindu: {
    question: 'Which Upanishad contains the mahavakya "Tat Tvam Asi"?',
    options: ['Chandogya Upanishad', 'Kena Upanishad', 'Mundaka Upanishad', 'Isha Upanishad'],
    answerIndex: 0,
    explanation: 'The mahavakya "Tat Tvam Asi" appears in the Chandogya Upanishad as part of the teaching of Uddalaka to Shvetaketu. It is one of the most cited statements in Vedantic teaching.',
    fact: 'Different Vedanta schools interpret this mahavakya differently, but all treat it as a foundational Upanishadic statement.',
    source: 'Chandogya Upanishad 6.8.7',
  },
  sikh: {
    question: 'Who compiled the Adi Granth, which later became Guru Granth Sahib Ji?',
    options: ['Guru Arjan Dev Ji', 'Guru Gobind Singh Ji', 'Guru Ram Das Ji', 'Guru Tegh Bahadur Ji'],
    answerIndex: 0,
    explanation: 'Guru Arjan Dev Ji compiled the Adi Granth in 1604 and installed it at Harmandir Sahib. It later came to be revered as Guru Granth Sahib Ji.',
    fact: 'The scripture includes not only the Gurus’ bani but also compositions of Bhagats and saints from diverse backgrounds.',
    source: 'Sikh tradition',
  },
  buddhist: {
    question: 'Which teaching is grouped as the first sermon traditionally delivered by the Buddha at Sarnath?',
    options: ['The Four Noble Truths', 'The Five Precepts', 'The Brahmaviharas', 'The Ten Paramitas'],
    answerIndex: 0,
    explanation: 'The Buddha’s first sermon at Sarnath is traditionally associated with the Four Noble Truths and the Middle Way. This marks the turning of the wheel of Dhamma.',
    fact: 'This discourse is commonly referred to as the Dhammacakkappavattana Sutta in the Pali tradition.',
    source: 'Buddhist tradition',
  },
  jain: {
    question: 'Which principle is most centrally associated with Jain ethical life?',
    options: ['Ahimsa', 'Yajna', 'Bhakti', 'Rajadharma'],
    answerIndex: 0,
    explanation: 'Ahimsa, or non-violence, is the central ethical principle in Jain dharma. It shapes conduct in speech, thought, livelihood, and daily discipline.',
    fact: 'Jain practice extends non-violence with unusual rigor, including care toward even the smallest life forms.',
    source: 'Jain tradition',
  },
  all: {
    question: 'Which river is widely revered across multiple Indian traditions as sacred?',
    options: ['Ganga', 'Thames', 'Volga', 'Danube'],
    answerIndex: 0,
    explanation: 'The Ganga holds sacred status across Hindu traditions and is also culturally significant in the wider spiritual heritage of India. It appears in pilgrimage, ritual memory, and sacred geography.',
    fact: 'Cities like Varanasi, Haridwar, and Prayagraj are deeply tied to the sacred imagination around the Ganga.',
    source: 'Indian sacred geography',
  },
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

function extractJsonBlock(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawTradition = searchParams.get('tradition') ?? 'hindu';
  const dateStr      = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

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
  const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);

  const prompt = buildPrompt(tradition, dateStr);
  const startTime = Date.now();

  const fallbackQuiz = DAILY_FALLBACK_QUIZ[tradition] ?? DAILY_FALLBACK_QUIZ.all;

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
        maxOutputTokens: 900,
      },
      { responseFormat: 'json', providerOverride: 'sarvam-hosted' }
    );

    const cleaned = extractJsonBlock(result.text);

    let quiz: { question: string; options: string[]; answerIndex: number; explanation: string; fact: string; source: string };
    try {
      quiz = JSON.parse(cleaned);
    } catch {
      console.error('[quiz/daily] JSON parse failed. Raw:', result.text.slice(0, 200));
      quiz = fallbackQuiz;
    }

    if (
      typeof quiz.question !== 'string' ||
      !Array.isArray(quiz.options) ||
      quiz.options.length !== 4 ||
      typeof quiz.answerIndex !== 'number' ||
      quiz.answerIndex < 0 ||
      quiz.answerIndex > 3
    ) {
      quiz = fallbackQuiz;
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
        pipeline_content_type: effectiveTags.content_type ?? null,
        pipeline_audio_mode: effectiveTags.audio_mode ?? null,
        pipeline_tradition: effectiveTags.tradition ?? null,
        pipeline_script: effectiveTags.script ?? null,
      },
    });

    return NextResponse.json(
      { ...quiz, tradition, date: dateStr },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/quiz/daily', latency_ms: Date.now() - startTime });
    console.error('[quiz/daily] Provider generation failed:', err);
    return NextResponse.json(
      { ...fallbackQuiz, tradition, date: dateStr, ai: { provider: 'fallback', degraded: true } },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  }
}
