import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, logValidationResult, buildPipelinePromptHint } from '@/lib/ai/validate-pipeline-tags';
import { normalizeContentLanguage, getLanguageInstruction } from '@/lib/language-runtime';

// ─── GET /api/quiz/daily ──────────────────────────────────────────────────────
// Returns a tradition-aware "Do You Know?" question for the current UTC date.
//
// Query params:
//   tradition  : 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all'  (default: hindu)
//   date       : YYYY-MM-DD  (default: today UTC — used as cache key)
//   language   : 'en' | 'hi' | 'pa' (default: en)
//
// Response: { question, options: string[], answerIndex: number, fact: string, source: string, fallbackLanguage?: string }
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

const DAILY_FALLBACK_QUIZ: Record<string, Record<string, {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
}>> = {
  en: {
    hindu: {
      question: 'Which Upanishad contains the mahavakya "Tat Tvam Asi"?',
      options: ['Chandogya Upanishad', 'Kena Upanishad', 'Mundaka Upanishad', 'Isha Upanishad'],
      answerIndex: 0,
      explanation: 'The mahavakya "Tat Tvam Asi" appears in the Chandogya Upanishad as part of the teaching of Uddalaka to Shvetaketu.',
      fact: 'Different Vedanta schools interpret this mahavakya differently.',
      source: 'Chandogya Upanishad 6.8.7',
    },
    sikh: {
      question: 'Who compiled the Adi Granth, which later became Guru Granth Sahib Ji?',
      options: ['Guru Arjan Dev Ji', 'Guru Gobind Singh Ji', 'Guru Ram Das Ji', 'Guru Tegh Bahadur Ji'],
      answerIndex: 0,
      explanation: 'Guru Arjan Dev Ji compiled the Adi Granth in 1604 and installed it at Harmandir Sahib.',
      fact: 'The scripture includes compositions of Bhagats from diverse backgrounds.',
      source: 'Sikh tradition',
    },
    buddhist: {
      question: 'Which teaching is grouped as the first sermon traditionally delivered by the Buddha at Sarnath?',
      options: ['The Four Noble Truths', 'The Five Precepts', 'The Brahmaviharas', 'The Ten Paramitas'],
      answerIndex: 0,
      explanation: 'The Buddha’s first sermon at Sarnath is traditionally associated with the Four Noble Truths and the Middle Way.',
      fact: 'This discourse is commonly referred to as the Dhammacakkappavattana Sutta.',
      source: 'Buddhist tradition',
    },
    jain: {
      question: 'Which principle is most centrally associated with Jain ethical life?',
      options: ['Ahimsa', 'Yajna', 'Bhakti', 'Rajadharma'],
      answerIndex: 0,
      explanation: 'Ahimsa, or non-violence, is the central ethical principle in Jain dharma.',
      fact: 'Jain practice extends non-violence with unusual rigor.',
      source: 'Jain tradition',
    },
    all: {
      question: 'Which river is widely revered across multiple Indian traditions as sacred?',
      options: ['Ganga', 'Thames', 'Volga', 'Danube'],
      answerIndex: 0,
      explanation: 'The Ganga holds sacred status across Hindu traditions and is culturally significant in India.',
      fact: 'Cities like Varanasi, Haridwar, and Prayagraj are deeply tied to the Ganga.',
      source: 'Indian sacred geography',
    },
  },
  hi: {
    hindu: {
      question: 'किस उपनिषद में महावाक्य "तत् त्वम असि" (Tat Tvam Asi) मिलता है?',
      options: ['छान्दोग्य उपनिषद', 'केन उपनिषद', 'मुण्डक उपनिषद', 'ईश उपनिषद'],
      answerIndex: 0,
      explanation: '"तत् त्वम असि" महावाक्य छान्दोग्य उपनिषद में उद्दालक द्वारा श्वेतकेतु को दिए गए उपदेश का हिस्सा है।',
      fact: 'वेदांत के विभिन्न संप्रदाय इस महावाक्य की अलग-अलग व्याख्या करते हैं।',
      source: 'छान्दोग्य उपनिषद 6.8.7',
    },
    all: {
      question: 'किस नदी को भारत की अनेक परंपराओं में पवित्र माना जाता है?',
      options: ['गंगा', 'टेम्स', 'वोल्गा', 'डेन्यूब'],
      answerIndex: 0,
      explanation: 'गंगा हिंदू परंपराओं में पवित्र स्थान रखती है और भारत में सांस्कृतिक रूप से बहुत महत्वपूर्ण है।',
      fact: 'वाराणसी, हरिद्वार और प्रयागराज जैसे शहर गंगा से गहराई से जुड़े हैं।',
      source: 'भारतीय पवित्र भूगोल',
    }
  },
  pa: {
    sikh: {
      question: 'ਆਦਿ ਗ੍ਰੰਥ ਸਾਹਿਬ, ਜੋ ਬਾਅਦ ਵਿੱਚ ਗੁਰੂ ਗ੍ਰੰਥ ਸਾਹਿਬ ਜੀ ਬਣੇ, ਕਿਸ ਨੇ ਸੰਕਲਿਤ ਕੀਤਾ ਸੀ?',
      options: ['ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ', 'ਗੁਰੂ ਗੋਬਿੰਦ ਸਿੰਘ ਜੀ', 'ਗੁਰੂ ਰਾਮ ਦਾਸ ਜੀ', 'ਗੁਰੂ ਤੇਗ ਬਹਾਦਰ ਜੀ'],
      answerIndex: 0,
      explanation: 'ਗੁਰੂ ਅਰਜਨ ਦੇਵ ਜੀ ਨੇ 1604 ਵਿੱਚ ਆਦਿ ਗ੍ਰੰਥ ਦਾ ਸੰਕਲਨ ਕੀਤਾ ਅਤੇ ਇਸਨੂੰ ਹਰਿਮੰਦਰ ਸਾਹਿਬ ਵਿਖੇ ਸਥਾਪਿਤ ਕੀਤਾ।',
      fact: 'ਇਸ ਗ੍ਰੰਥ ਵਿੱਚ ਵੱਖ-ਵੱਖ ਪਿਛੋਕੜਾਂ ਵਾਲੇ ਭਗਤਾਂ ਦੀਆਂ ਰਚਨਾਵਾਂ ਸ਼ਾਮਲ ਹਨ।',
      source: 'ਸਿੱਖ ਪਰੰਪਰਾ',
    },
    all: {
      question: 'ਕਿਸ ਨਦੀ ਨੂੰ ਭਾਰਤ ਦੀਆਂ ਕਈ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਮੰਨਿਆ ਜਾਂਦਾ ਹੈ?',
      options: ['ਗੰਗਾ', 'ਥੇਮਜ਼', 'ਵੋਲਗਾ', 'ਡੈਨਿਊਬ'],
      answerIndex: 0,
      explanation: 'ਗੰਗਾ ਹਿੰਦੂ ਪਰੰਪਰਾਵਾਂ ਵਿੱਚ ਪਵਿੱਤਰ ਸਥਾਨ ਰੱਖਦੀ ਹੈ ਅਤੇ ਭਾਰਤ ਵਿੱਚ ਸੱਭਿਆਚਾਰਕ ਤੌਰ ਤੇ ਬਹੁਤ ਮਹੱਤਵਪੂਰਨ ਹੈ।',
      fact: 'ਵਾਰਾਣਸੀ, ਹਰਿਦੁਆਰ ਅਤੇ ਪ੍ਰਯਾਗਰਾਜ ਵਰਗੇ ਸ਼ਹਿਰ ਗੰਗਾ ਨਾਲ ਡੂੰਘਾਈ ਨਾਲ ਜੁੜੇ ਹੋਏ ਹਨ।',
      source: 'ਭਾਰਤੀ ਪਵਿੱਤਰ ਭੂਗੋਲ',
    }
  }
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
  const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);

  const prompt = buildPrompt(tradition, dateStr, rawLanguage);
  const startTime = Date.now();

  const requestedLanguage = normalizeContentLanguage(rawLanguage);
  const langFallbacks = DAILY_FALLBACK_QUIZ[requestedLanguage] ?? DAILY_FALLBACK_QUIZ['en'];
  const fallbackQuiz = langFallbacks[tradition] ?? langFallbacks['all'] ?? DAILY_FALLBACK_QUIZ['en']['all'];
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
      return NextResponse.json(
        { ...fallbackQuiz, tradition, date: dateStr, fallbackLanguage, ai: { provider: 'fallback', degraded: true } },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
      );
    }

    if (
      typeof quiz.question !== 'string' ||
      !Array.isArray(quiz.options) ||
      quiz.options.length !== 4 ||
      typeof quiz.answerIndex !== 'number' ||
      quiz.answerIndex < 0 ||
      quiz.answerIndex > 3
    ) {
      return NextResponse.json(
        { ...fallbackQuiz, tradition, date: dateStr, fallbackLanguage, ai: { provider: 'fallback', degraded: true } },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' } }
      );
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
      { ...fallbackQuiz, tradition, date: dateStr, fallbackLanguage, ai: { provider: 'fallback', degraded: true } },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      },
    );
  }
}
