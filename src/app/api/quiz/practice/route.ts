import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ─── GET /api/quiz/practice ───────────────────────────────────────────────────
// Generates a batch of 5 practice questions for a given topic + difficulty.
// Pro-only endpoint — returns 403 if user is not Pro.
//
// Query params:
//   tradition  : 'hindu' | 'sikh' | 'buddhist' | 'jain'
//   topic      : 'deities' | 'scriptures' | 'philosophy' | 'festivals' | 'geography' | 'sanskrit'
//   difficulty : 'seeker' | 'gyani' | 'pandit'
//
// POST /api/quiz/practice (save session result)
//   Body: { tradition, topic, difficulty, questions_correct, questions_total, karma_earned }
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODEL_DEFAULT  = 'gemini-2.0-flash';
const GEMINI_MODEL_FALLBACK = 'gemini-2.0-flash-lite';

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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

function buildPracticePrompt(tradition: string, topic: string, difficulty: string): string {
  const topicCtx    = TOPIC_CONTEXT[topic]?.[tradition] ?? TOPIC_CONTEXT[topic]?.['hindu'] ?? topic;
  const difficultyCtx = DIFFICULTY_CONTEXT[difficulty] ?? DIFFICULTY_CONTEXT.seeker;

  return `You are a precise and engaging spiritual quiz writer for a dharma app.

Generate EXACTLY 5 multiple-choice questions about: ${topicCtx}

Difficulty: ${difficultyCtx}

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

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Gemini not configured' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const tradition = searchParams.get('tradition') ?? 'hindu';
  const topic     = searchParams.get('topic')     ?? 'deities';
  const difficulty = searchParams.get('difficulty') ?? 'seeker';

  const prompt = buildPracticePrompt(tradition, topic, difficulty);

  let raw = '';
  try {
    raw = await callGemini(apiKey, GEMINI_MODEL_DEFAULT, prompt);
  } catch {
    try {
      raw = await callGemini(apiKey, GEMINI_MODEL_FALLBACK, prompt);
    } catch (err2) {
      console.error('[quiz/practice] Gemini failed:', err2);
      return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
    }
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  let parsed: { questions: Array<{ question: string; options: string[]; answerIndex: number; explanation: string; fact: string; source: string }> };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('[quiz/practice] JSON parse failed. Raw:', raw.slice(0, 300));
    return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return NextResponse.json({ error: 'Malformed AI response' }, { status: 502 });
  }

  // Validate and normalise each question
  const questions = parsed.questions.slice(0, 5).filter(q =>
    typeof q.question === 'string' &&
    Array.isArray(q.options) && q.options.length === 4 &&
    typeof q.answerIndex === 'number' && q.answerIndex >= 0 && q.answerIndex <= 3
  );

  if (questions.length === 0) {
    return NextResponse.json({ error: 'No valid questions generated' }, { status: 502 });
  }

  return NextResponse.json({ questions, tradition, topic, difficulty });
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
