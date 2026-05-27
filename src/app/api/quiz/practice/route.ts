import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, logValidationResult, buildPipelinePromptHint } from '@/lib/ai/validate-pipeline-tags';
import { normalizeContentLanguage, getLanguageInstruction } from '@/lib/language-runtime';

// ─── GET /api/quiz/practice ───────────────────────────────────────────────────
// Generates a batch of 5 practice questions for a given topic + difficulty.
// Pro-only endpoint — returns 403 if user is not Pro.
//
// Query params:
//   tradition  : 'hindu' | 'sikh' | 'buddhist' | 'jain'
//   topic      : 'deities' | 'scriptures' | 'philosophy' | 'festivals' | 'geography' | 'sanskrit'
//   difficulty : 'seeker' | 'gyani' | 'pandit'
//   language   : 'en' | 'hi' | 'pa'
//
// POST /api/quiz/practice (save session result)
//   Body: { tradition, topic, difficulty, questions_correct, questions_total, karma_earned }
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_CONTEXT: Record<string, Record<string, string>> = {
  deities: {
    hindu:    'Hindu deities, their attributes, weapons, vehicles (vahanas), avatars, family relationships, and stories from the Puranas and Ramayana/Mahabharata',
    sikh:     'Sikh concepts of Waheguru, the Mul Mantar, Ik Onkar, and references to divine figures mentioned in the Guru Granth Sahib Ji',
    buddhist: 'Buddhas, bodhisattvas (Avalokiteshvara, Manjushri, Tara, Maitreya), dharma protectors, and their iconography',
    jain:     'The 24 Tirthankaras, their symbols, yakshinis, cognizance animals, and their life stories (kalyanakas)',
  },
  scriptures: {
    hindu:    'The four Vedas, Upanishads (108 principal ones), the Bhagavad Gita, Brahmasutras, Ramayana, Mahabharata, 18 Puranas, Agamas, and Tantras',
    sikh:     'The Guru Granth Sahib Ji — its structure, banis, ragas, contributions of each Guru, and the Dasam Granth',
    buddhist: 'The Pali Canon (Tripitaka), key Mahayana sutras (Heart Sutra, Diamond Sutra, Lotus Sutra), and Tibetan texts',
    jain:     'The 12 Angas, Agamas, Tattvartha Sutra, Samayasara, and differences between Digambara and Shvetambara canons',
  },
  philosophy: {
    hindu:    'Six orthodox darshanas (Nyaya, Vaisheshika, Samkhya, Yoga, Mimamsa, Vedanta), Advaita, Vishishtadvaita, Dvaita, concepts of Brahman, Atman, Maya, Karma, Dharma, Moksha',
    sikh:     'Sikh theology: Ik Onkar, Naam Simran, Seva, Sangat, Pangat, Kirat Karo, the concept of Haumai (ego), Gurmukh vs Manmukh',
    buddhist: 'Four Noble Truths, Eightfold Path, Three Marks of Existence, Dependent Origination, Madhyamaka, Yogacara, Buddha-nature',
    jain:     'Five vows (Mahavratas / Anuvratas), Anekantavada, Syadvada, Nayavada, six Dravyas, nine Padarthas, the concept of Jiva and Ajiva',
  },
  festivals: {
    hindu:    'Hindu festivals: Diwali, Holi, Navaratri, Dussehra, Makar Sankranti, Pongal, Onam, Raksha Bandhan, Janmashtami, Shivaratri, Ganesh Chaturthi, Kumbh Mela, Puthandu, Ugadi — their stories, rituals, regional variations',
    sikh:     'Gurpurabs (birth/martyrdom anniversaries), Baisakhi, Hola Mohalla, Diwali (Bandi Chhor Divas), Lohri, and their significance in Sikh history',
    buddhist: 'Buddha Purnima, Asadha Puja, Kathina, Losar, Wesak, Magha Puja — their significance and regional variations across Buddhist traditions',
    jain:     'Paryushana, Mahavir Jayanti, Diwali (Nirvana of Mahavira), Samvatsari, Das Lakshana Parva — their significance and observances',
  },
  geography: {
    hindu:    'Char Dham (Badrinath, Dwarka, Puri, Rameshwaram), Sapta Puri (7 sacred cities), Pancha Bhuta Stalas, 12 Jyotirlingas, 108 Divya Desams, sacred rivers (Ganga, Yamuna, Saraswati, Godavari), Kumbh Mela locations',
    sikh:     'Five Takhts, historically significant Gurdwaras (Harmandir Sahib, Anandpur Sahib, Hemkund Sahib, Nankana Sahib), sites connected to Guru journeys (udasis)',
    buddhist: 'Eight sacred sites (Bodh Gaya, Kushinagar, Lumbini, Sarnath, Shravasti, Sankissa, Rajgir, Vaishali), major monasteries and pilgrimage circuits in India, Sri Lanka, Tibet, Thailand',
    jain:     'Palitana, Girnar, Shravanabelagola, Pavapuri, Shikharji — their significance, major Jain temples and pilgrimage sites across India',
  },
  sanskrit: {
    hindu:    'Sanskrit grammar (Panini\'s Ashtadhyayi), key mantras (Gayatri, Mahamrityunjaya, Panchakshara), Sanskrit terms from Vedanta and Yoga, Devanagari script, Sanskrit meters (Chandas), key Sanskrit word meanings',
    sikh:     'Gurmukhi script history, Punjabi spiritual vocabulary, key terms from Gurbani (Shabad, Kirtan, Simran, Ardas, Hukamnama), Sant Bhasha used in Guru Granth Sahib',
    buddhist: 'Pali and Sanskrit Buddhist terminology (Dhamma/Dharma, Sangha, Sutra/Sutta, Nirvana/Nibbana, Bodhi, Mudra, Mandala), mantras, mudras and their meanings',
    jain:     'Prakrit language used in Jain texts, key Jain terminology (Ahimsa, Satya, Asteya, Brahmacharya, Aparigraha, Jiva, Ajiva, Karma, Moksha, Mukti, Syadvada)',
  },
};

const DIFFICULTY_CONTEXT: Record<string, string> = {
  seeker:  'beginner level — well-known facts that a curious newcomer would encounter. The question should be accessible but not trivially obvious.',
  gyani:   'intermediate level — nuanced knowledge requiring real familiarity with the tradition. The question should challenge someone who has studied for 6-12 months.',
  pandit:  'advanced level — rare, specialist-grade facts that only a dedicated practitioner or scholar would know. Can reference obscure texts, regional variations, or subtle doctrinal distinctions.',
};

type PracticeQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
};

const PRACTICE_FALLBACKS: Record<string, Record<string, Record<string, PracticeQuestion[]>>> = {
  en: {
    scriptures: {
      hindu: [
        { question: 'Which text is called the "Gitopanishad"?', options: ['Bhagavad Gita', 'Yoga Sutras', 'Isha Upanishad', 'Vishnu Purana'], answerIndex: 0, explanation: 'The Bhagavad Gita is often described as the Gitopanishad because it condenses major Upanishadic teachings into a dialogue format.', fact: 'It appears in the Bhishma Parva of the Mahabharata.', source: 'Bhagavad Gita' },
        { question: 'Which Upanishad opens with "Ishavasyam idam sarvam"?', options: ['Isha Upanishad', 'Katha Upanishad', 'Mundaka Upanishad', 'Prashna Upanishad'], answerIndex: 0, explanation: 'The Isha Upanishad begins with the famous line "Ishavasyam idam sarvam," framing the world as pervaded by the Divine.', fact: 'It is one of the shortest principal Upanishads.', source: 'Isha Upanishad 1' },
        { question: 'Which epic contains the Bhagavad Gita?', options: ['Mahabharata', 'Ramayana', 'Skanda Purana', 'Harivamsha'], answerIndex: 0, explanation: 'The Bhagavad Gita appears in the Mahabharata as a dialogue between Krishna and Arjuna on the battlefield of Kurukshetra.', fact: 'It is located in the Bhishma Parva.', source: 'Mahabharata' },
        { question: 'How many Vedas are traditionally recognized in Hindu learning?', options: ['4', '3', '6', '8'], answerIndex: 0, explanation: 'The traditional count is four: Rigveda, Yajurveda, Samaveda, and Atharvaveda.', fact: 'Each Veda has associated Brahmana, Aranyaka, and Upanishad layers.', source: 'Vedic tradition' },
        { question: 'Which scripture is structured as a dialogue between Nachiketa and Yama?', options: ['Katha Upanishad', 'Kena Upanishad', 'Mandukya Upanishad', 'Taittiriya Upanishad'], answerIndex: 0, explanation: 'The Katha Upanishad presents the dialogue between Nachiketa and Yama on the nature of the Self and liberation.', fact: 'It is one of the most philosophically influential Upanishads.', source: 'Katha Upanishad' },
      ],
    },
    philosophy: {
      hindu: [
        { question: 'In Advaita Vedanta, what is ultimately identical with Brahman?', options: ['Atman', 'Prakriti', 'Karma', 'Indriyas'], answerIndex: 0, explanation: 'Advaita teaches that Atman and Brahman are ultimately non-different, and liberation comes through realizing this identity.', fact: 'This is reinforced through mahavakyas across the Upanishads.', source: 'Advaita Vedanta' },
        { question: 'Which darshana is most directly associated with Patanjali?', options: ['Yoga', 'Nyaya', 'Mimamsa', 'Vaisheshika'], answerIndex: 0, explanation: 'Patanjali is traditionally associated with the Yoga darshana through the Yoga Sutras.', fact: 'The Yoga system is often studied alongside Samkhya due to shared metaphysical structure.', source: 'Yoga Sutras' },
        { question: 'What does moksha refer to in Hindu philosophy?', options: ['Liberation from the cycle of birth and death', 'A ritual fire altar', 'A vow of silence', 'A seasonal festival'], answerIndex: 0, explanation: 'Moksha is liberation from samsara and is treated as the highest human goal in many Hindu philosophical systems.', fact: 'Different schools describe its realization differently: knowledge, devotion, or divine grace.', source: 'Hindu philosophy' },
        { question: 'What is the core meaning of dharma in a philosophical context?', options: ['Right order, duty, and sustaining law', 'Only temple ritual', 'A specific caste rank', 'Monastic withdrawal'], answerIndex: 0, explanation: 'Dharma refers to sustaining order, right conduct, duty, and moral-spiritual alignment depending on context.', fact: 'The term shifts in nuance across Vedic, epic, and philosophical texts.', source: 'Dharma traditions' },
        { question: 'Which school emphasizes dualism between Purusha and Prakriti?', options: ['Samkhya', 'Advaita Vedanta', 'Purva Mimamsa', 'Nyaya'], answerIndex: 0, explanation: 'Samkhya teaches a foundational distinction between Purusha, pure consciousness, and Prakriti, primordial nature.', fact: 'Its categories strongly influenced classical Yoga.', source: 'Samkhya' },
      ],
    },
  },
  hi: {
    scriptures: {
      hindu: [
        { question: 'किस ग्रंथ को "गीतोपनिषद" कहा जाता है?', options: ['भगवद गीता', 'योग सूत्र', 'ईश उपनिषद', 'विष्णु पुराण'], answerIndex: 0, explanation: 'भगवद गीता को अक्सर गीतोपनिषद कहा जाता है क्योंकि यह प्रमुख उपनिषद शिक्षाओं को एक संवाद प्रारूप में समेटती है।', fact: 'यह महाभारत के भीष्म पर्व में आता है।', source: 'भगवद गीता' },
        { question: 'कौन सा उपनिषद "ईशावास्यम इदं सर्वम्" के साथ खुलता है?', options: ['ईश उपनिषद', 'कठ उपनिषद', 'मुंडक उपनिषद', 'प्रश्न उपनिषद'], answerIndex: 0, explanation: 'ईश उपनिषद प्रसिद्ध पंक्ति "ईशावास्यम इदं सर्वम्" से शुरू होता है।', fact: 'यह सबसे छोटे प्रमुख उपनिषदों में से एक है।', source: 'ईश उपनिषद' },
        { question: 'भगवद गीता किस महाकाव्य का हिस्सा है?', options: ['महाभारत', 'रामायण', 'स्कंद पुराण', 'हरिवंश'], answerIndex: 0, explanation: 'भगवद गीता महाभारत में कुरुक्षेत्र के युद्ध के मैदान में कृष्ण और अर्जुन के बीच एक संवाद के रूप में दिखाई देती है।', fact: 'यह भीष्म पर्व में स्थित है।', source: 'महाभारत' },
        { question: 'हिंदू धर्म में पारंपरिक रूप से कितने वेदों को मान्यता प्राप्त है?', options: ['4', '3', '6', '8'], answerIndex: 0, explanation: 'पारंपरिक संख्या चार है: ऋग्वेद, यजुर्वेद, सामवेद और अथर्ववेद।', fact: 'प्रत्येक वेद में ब्राह्मण, आरण्यक और उपनिषद परतें होती हैं।', source: 'वैदिक परंपरा' },
        { question: 'नचिकेता और यम के बीच संवाद के रूप में कौन सा ग्रंथ है?', options: ['कठ उपनिषद', 'केन उपनिषद', 'माण्डूक्य उपनिषद', 'तैत्तिरीय उपनिषद'], answerIndex: 0, explanation: 'कठ उपनिषद आत्म और मुक्ति की प्रकृति पर नचिकेता और यम के बीच संवाद प्रस्तुत करता है।', fact: 'यह दार्शनिक रूप से सबसे प्रभावशाली उपनिषदों में से एक है।', source: 'कठ उपनिषद' },
      ],
    },
  },
  pa: {
    scriptures: {
      hindu: [
        { question: 'ਕਿਸ ਗ੍ਰੰਥ ਨੂੰ "ਗੀਤੋਪਨਿਸ਼ਦ" ਕਿਹਾ ਜਾਂਦਾ ਹੈ?', options: ['ਭਗਵਦ ਗੀਤਾ', 'ਯੋਗ ਸੂਤਰ', 'ਈਸ਼ ਉਪਨਿਸ਼ਦ', 'ਵਿਸ਼ਨੂੰ ਪੁਰਾਣ'], answerIndex: 0, explanation: 'ਭਗਵਦ ਗੀਤਾ ਨੂੰ ਅਕਸਰ ਗੀਤੋਪਨਿਸ਼ਦ ਕਿਹਾ ਜਾਂਦਾ ਹੈ ਕਿਉਂਕਿ ਇਹ ਪ੍ਰਮੁੱਖ ਉਪਨਿਸ਼ਦ ਸਿੱਖਿਆਵਾਂ ਨੂੰ ਸੰਵਾਦ ਰੂਪ ਵਿੱਚ ਪੇਸ਼ ਕਰਦੀ ਹੈ।', fact: 'ਇਹ ਮਹਾਭਾਰਤ ਦੇ ਭੀਸ਼ਮ ਪਰਵ ਵਿੱਚ ਆਉਂਦਾ ਹੈ।', source: 'ਭਗਵਦ ਗੀਤਾ' },
      ],
    },
  }
};

function buildPracticePrompt(tradition: string, topic: string, difficulty: string, language?: string | null): string {
  const topicCtx    = TOPIC_CONTEXT[topic]?.[tradition] ?? TOPIC_CONTEXT[topic]?.['hindu'] ?? topic;
  const difficultyCtx = DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT.seeker;
  const langInstruction = getLanguageInstruction(language);

  return `You are a precise and engaging spiritual quiz writer for a dharma app.

Generate EXACTLY 5 multiple-choice questions about: ${topicCtx}

Difficulty: ${difficultyCtx}

Language Instructions:
${langInstruction}
Ensure that the "question", "options", "explanation", and "fact" fields are in the requested language.

Rules for all 5 questions:
- Each question must be factual and verifiable
- Use exactly 4 answer options per question
- Exactly one option is correct per question
- No two questions should be about the same sub-topic
- "explanation" explains WHY the correct answer is correct (2-3 sentences for learners who got it wrong)
- "fact" adds a fascinating extra detail (1-2 sentences) beyond the answer
- No markdown in any field — plain text only
- Vary the question style (what/which/who/when/how many etc.)

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "question": "<question text>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "answerIndex": <0-3>,
      "explanation": "<why correct>",
      "fact": "<extra fascinating detail>",
      "source": "<scripture or tradition>"
    }
  ]
}`;
}

function extractJsonBlock(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
}

export async function GET(req: NextRequest) {
  // Auth + Pro check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single();

  if (!profile?.is_pro) {
    return NextResponse.json({ error: 'Pro required', upgrade: true }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawTradition = searchParams.get('tradition') ?? 'hindu';
  const topic        = searchParams.get('topic')     ?? 'deities';
  const difficulty   = searchParams.get('difficulty') ?? 'seeker';
  const rawLanguage  = searchParams.get('language');

  const tagValidation = validatePipelineTags(
    {
      tradition: rawTradition,
      content_type: 'ui_text',
    },
    { context: 'practice_quiz' }
  );
  logValidationResult(tagValidation, 'PracticeQuiz');
  const effectiveTags = mergeTags(
    tagValidation.tags,
    getDefaultTags({ contentType: 'ui_text' })
  );

  const tradition = effectiveTags.tradition ?? 'hindu';
  const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);

  const prompt = buildPracticePrompt(tradition, topic, difficulty, rawLanguage);
  const startTime = Date.now();
  const requestedLanguage = normalizeContentLanguage(rawLanguage);
  const langFallbacks = PRACTICE_FALLBACKS[requestedLanguage] ?? PRACTICE_FALLBACKS['en'];
  // Try topic-exact match first, then any topic in same tradition, then base en/scriptures/hindu
  const fallbackPool =
    langFallbacks[topic]?.[tradition] ??
    langFallbacks[topic]?.hindu ??
    PRACTICE_FALLBACKS['en'][topic]?.hindu ??
    PRACTICE_FALLBACKS['en'].scriptures?.hindu ??
    PRACTICE_FALLBACKS['en'].philosophy?.hindu ??
    [];
  const fallbackQuestions = fallbackPool.slice(0, 5);

  const hasLangFallback = PRACTICE_FALLBACKS[requestedLanguage] && (langFallbacks[topic]?.[tradition] || langFallbacks[topic]?.hindu);
  const fallbackLanguage = hasLangFallback ? undefined : 'en';

  try {
    const result = await generateWithProvider(
      {
        system: [
          'You generate valid JSON batches of structured spiritual quiz questions.',
          pipelinePromptHint,
        ].filter(Boolean).join('\n\n'),
        user: prompt,
        temperature: 0.4,
        reasoningEffort: 'none',
        maxOutputTokens: 3500,
      },
      { responseFormat: 'json', providerOverride: 'sarvam-hosted' }
    );

    const cleaned = extractJsonBlock(result.text);

    let parsed: { questions: Array<{ question: string; options: string[]; answerIndex: number; explanation: string; fact: string; source: string }> };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[quiz/practice] JSON parse failed. Raw:', result.text.slice(0, 300));
      if (fallbackQuestions.length > 0) {
        return NextResponse.json({ questions: fallbackQuestions, tradition, topic, difficulty, fallbackLanguage, ai: { provider: 'fallback', degraded: true } });
      }
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    }

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: 'Malformed AI response' }, { status: 502 });
    }

    const questions = parsed.questions.slice(0, 5).filter(q =>
      typeof q.question === 'string' &&
      Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3
    );

    if (questions.length === 0) {
      if (fallbackQuestions.length > 0) {
        return NextResponse.json({ questions: fallbackQuestions, tradition, topic, difficulty, fallbackLanguage, ai: { provider: 'fallback', degraded: true } });
      }
      return NextResponse.json({ error: 'No valid questions generated' }, { status: 502 });
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/quiz/practice',
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.modelUsed,
      fallback_used: result.provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
      context: {
        feature: 'practice_quiz',
        tradition,
        topic,
        difficulty,
        language: requestedLanguage,
        pipeline_content_type: effectiveTags.content_type ?? null,
        pipeline_audio_mode: effectiveTags.audio_mode ?? null,
        pipeline_tradition: effectiveTags.tradition ?? null,
        pipeline_script: effectiveTags.script ?? null,
      },
    });

    return NextResponse.json({ questions, tradition, topic, difficulty });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/quiz/practice', latency_ms: Date.now() - startTime });
    console.error('[quiz/practice] Provider generation failed:', err);
    return NextResponse.json({ questions: fallbackQuestions, tradition, topic, difficulty, fallbackLanguage, ai: { provider: 'fallback', degraded: true } });
  }
}

// ─── POST — save completed practice session ───────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { tradition, topic, difficulty, questions_correct, questions_total } = await req.json();
    const karmaEarned = questions_correct * 8; // 8 karma per correct practice answer

    // Insert session record
    const { error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        tradition,
        topic,
        difficulty,
        questions_total: questions_total ?? 5,
        questions_correct,
        karma_earned: karmaEarned,
      });

    if (sessionError) throw sessionError;

    // Award karma
    if (karmaEarned > 0) {
      try {
        await supabase.rpc('increment_karma', { p_user_id: user.id, p_amount: karmaEarned });
      } catch { /* safe — rpc not yet deployed until migration runs */ }
    }

    return NextResponse.json({ success: true, karma_earned: karmaEarned });
  } catch (err) {
    console.error('[quiz/practice] Save failed:', err);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
