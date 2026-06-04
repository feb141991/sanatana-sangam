// ============================================================
// ai-pathshala-explain — AI Teacher (tradition-aware explanation)
//
// Given a scripture chunk, returns a personalised explanation
// tailored to the user's tradition, deity, depth level, and
// active sankalpa. Optionally returns multi-commentary comparison
// (Advaita / Vishishtadvaita / Dvaita for Vedantic texts).
//
// POST body:
//   {
//     chunk_id:         string   (required)
//     user_id:          string   (required)
//     commentary_mode?: boolean  (default false — single tradition explanation)
//     language?:        string   (response language, default 'en')
//   }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')   ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── J2000 panchang (same logic used across all edge functions) ────────────────

const J2000_EPOCH    = 947182440000;
const LUNAR_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000;

function getTithiNumber(): number {
  const elapsed   = Date.now() - J2000_EPOCH;
  const moonPhase = (elapsed % LUNAR_MONTH_MS) / LUNAR_MONTH_MS;
  return Math.floor(moonPhase * 30) + 1;
}

function getTithiName(n: number): string {
  const names = [
    'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
    'Shashthi','Saptami','Ashtami','Navami','Dashami',
    'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
    'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
    'Shashthi','Saptami','Ashtami','Navami','Dashami',
    'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',
  ];
  return names[(n - 1) % 30] ?? 'Pratipada';
}

function getPaksha(n: number): string {
  return n <= 15 ? 'Shukla Paksha' : 'Krishna Paksha';
}

const VAARA = ['Ravivara','Somavara','Mangalavara','Budhavara','Guruvara','Shukravara','Shanivara'];

// ── Tradition-specific commentary voices ──────────────────────────────────────

const COMMENTARY_TRADITIONS: Record<string, { name: string; school: string; lens: string }> = {
  advaita: {
    name:   'Adi Shankaracharya',
    school: 'Advaita Vedanta',
    lens:   'Non-dual: Brahman alone is real, the world is maya. Atman = Brahman. Liberation is recognition of this identity. Emphasise jnana marga.',
  },
  vishishtadvaita: {
    name:   'Ramanujacharya',
    school: 'Vishishtadvaita Vedanta',
    lens:   'Qualified non-dual: Brahman is real, world and souls are real but dependent on Brahman (as body to soul). Bhakti and prapatti (surrender) are the path. Emphasise Narayana as Ishvara.',
  },
  dvaita: {
    name:   'Madhvacharya',
    school: 'Dvaita Vedanta',
    lens:   'Dualist: Brahman (Vishnu) and souls are eternally distinct. Five-fold difference (pancha bheda). Liberation through bhakti and grace of Vishnu alone.',
  },
  shaiva: {
    name:   'Abhinavagupta',
    school: 'Kashmir Shaivism',
    lens:   "Recognition philosophy (Pratyabhijna): all is Shiva-consciousness. Liberation is recognition of one's own nature as Shiva. Emphasise shakti and spanda.",
  },
  sant: {
    name:   'Kabir Das',
    school: 'Sant Tradition (Nirguna Bhakti)',
    lens:   'Formless divine: beyond caste, ritual, and text. Direct experience of the Naam within. Critique of empty ritualism. Plain speech that cuts through pretension.',
  },
};

// ── Response language instruction ─────────────────────────────────────────────

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: 'Respond in clear, warm English.',
  hi: 'हिंदी में उत्तर दें — सरल, भक्तिपूर्ण भाषा में।',
  ta: 'தமிழில் பதில் அளிக்கவும் — எளிய, பக்தி நிறைந்த மொழியில்.',
  bn: 'বাংলায় উত্তর দিন — সরল, ভক্তিপূর্ণ ভাষায়।',
  te: 'తెలుగులో సమాధానం ఇవ్వండి — సరళమైన, భక్తిపూర్వకమైన భాషలో.',
  kn: 'ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ — ಸರಳ, ಭಕ್ತಿಪೂರ್ಣ ಭಾಷೆಯಲ್ಲಿ.',
  ml: 'മലയാളത്തിൽ മറുപടി നൽകുക — ലളിതമായ, ഭക്തിനിറഞ്ഞ ഭാഷയിൽ.',
  mr: 'मराठीत उत्तर द्या — साधी, भक्तिपूर्ण भाषेत.',
  gu: 'ગુજરાતીમાં જવાબ આપો — સરળ, ભક્તિપૂર્ણ ભાષામાં.',
};

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const {
      chunk_id,
      user_id,
      commentary_mode = false,
      language        = 'en',
    } = await req.json();

    if (!chunk_id || !user_id) {
      return new Response(JSON.stringify({ error: 'chunk_id and user_id required' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 1. Fetch chunk ─────────────────────────────────────────────────────────
    const { data: chunk } = await supabase
      .from('scripture_chunks')
      .select('text_id, chapter, verse, sanskrit, transliteration, translation, commentary, tags, text_category, tradition_region')
      .eq('id', chunk_id)
      .single();

    if (!chunk) {
      return new Response(JSON.stringify({ error: 'chunk not found' }), { status: 404 });
    }

    // ── 2. Fetch user profile ──────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('user_practice')
      .select('tradition, preferred_deity, primary_path, content_depth, current_streak')
      .eq('user_id', user_id)
      .single();

    // ── 3. Fetch active sankalpa (if any) ──────────────────────────────────────
    const { data: sankalpa } = await supabase
      .from('sankalpa')
      .select('type, description, mantra_id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    // ── 4. Panchang context ────────────────────────────────────────────────────
    const tithiNum  = getTithiNumber();
    const tithi     = getTithiName(tithiNum);
    const paksha    = getPaksha(tithiNum);
    const vaara     = VAARA[new Date().getDay()];

    // ── 5. Build user context string ───────────────────────────────────────────
    const tradition    = profile?.tradition    ?? 'smarta';
    const deity        = profile?.preferred_deity ?? 'Ishvara';
    const path         = profile?.primary_path   ?? 'jnana';
    const depth        = profile?.content_depth  ?? 'beginner';
    const streak       = profile?.current_streak ?? 0;
    const langInstruct = LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS['en'];

    const userCtx = `
Tradition: ${tradition}
Preferred deity: ${deity}
Primary path: ${path}
Content depth: ${depth}
Current sadhana streak: ${streak} days
Today's panchang: ${vaara}, ${tithi}, ${paksha}
${sankalpa ? `Active sankalpa: ${sankalpa.description} (${sankalpa.type})` : ''}`.trim();

    // ── 6. Select commentary tradition ────────────────────────────────────────
    const commentaryTradition = (() => {
      if (tradition === 'vaishnava') return COMMENTARY_TRADITIONS.vishishtadvaita;
      if (tradition === 'shaiva')    return COMMENTARY_TRADITIONS.shaiva;
      if (tradition === 'sant')      return COMMENTARY_TRADITIONS.sant;
      return COMMENTARY_TRADITIONS.advaita; // default for smarta/jnana
    })();

    // ── 7A. Single-tradition explanation ─────────────────────────────────────
    let result: Record<string, unknown>;

    if (!commentary_mode) {
      const prompt = `You are a learned ${commentaryTradition.school} teacher explaining scripture to a sincere practitioner.

STUDENT PROFILE:
${userCtx}

TEXT: ${chunk.text_id} ${chunk.chapter ? `Chapter ${chunk.chapter}` : ''} ${chunk.verse ? `Verse ${chunk.verse}` : ''}
ORIGINAL:       ${chunk.sanskrit ?? ''}
TRANSLITERATION: ${chunk.transliteration ?? ''}
STANDARD TRANSLATION: ${chunk.translation ?? ''}

Your task: Explain this verse through the ${commentaryTradition.school} lens of ${commentaryTradition.name}.
${commentaryTradition.lens}

Structure your response as a JSON object:
{
  "word_by_word": "<Brief word-by-word meaning of key Sanskrit/original terms>",
  "meaning": "<Core meaning in 2–3 sentences>",
  "commentary": "<${commentaryTradition.school} interpretation, 3–4 sentences. Reference ${commentaryTradition.name}'s perspective.>",
  "daily_application": "<How to apply this teaching today, given the student's path and panchang context. 2–3 sentences.>",
  "sankalpa_connection": ${sankalpa ? `"<How this verse connects to their active sankalpa: ${sankalpa.description}>"` : 'null'},
  "contemplation": "<A single question or thought for the student to sit with today>",
  "related_text": "<Name one other text or verse that echoes this teaching>"
}

${langInstruct}
Return ONLY the JSON object.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 1200 },
          }),
        }
      );

      const geminiData  = await geminiRes.json();
      const raw         = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const jsonMatch   = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      const parsed      = jsonMatch ? (() => { try { return JSON.parse(jsonMatch[1]); } catch { return null; } })() : null;

      result = {
        chunk_id,
        text_id:          chunk.text_id,
        chapter:          chunk.chapter,
        verse:            chunk.verse,
        original:         chunk.sanskrit,
        transliteration:  chunk.transliteration,
        translation:      chunk.translation,
        tradition:        commentaryTradition.school,
        teacher:          commentaryTradition.name,
        explanation:      parsed ?? {
          word_by_word:        '',
          meaning:             chunk.translation ?? '',
          commentary:          chunk.commentary  ?? '',
          daily_application:   'Reflect on this verse during your practice today.',
          sankalpa_connection: null,
          contemplation:       'How does this teaching apply to your life right now?',
          related_text:        '',
        },
        panchang: { tithi, paksha, vaara },
        generated_at: new Date().toISOString(),
      };

    // ── 7B. Multi-commentary comparison ────────────────────────────────────────
    } else {

      // Only meaningful for Vedantic texts (Sanskrit shruti/smriti)
      const applicableTraditions = ['advaita', 'vishishtadvaita', 'dvaita'];
      const commentaries: Record<string, string> = {};

      await Promise.all(applicableTraditions.map(async (trad) => {
        const t      = COMMENTARY_TRADITIONS[trad];
        const prompt = `You are ${t.name}, commenting on this verse in the ${t.school} tradition.

TEXT: ${chunk.text_id} ${chunk.chapter ? `Ch.${chunk.chapter}` : ''} ${chunk.verse ? `v.${chunk.verse}` : ''}
${chunk.sanskrit ?? ''}
(${chunk.translation ?? ''})

${t.lens}

Write a 3–4 sentence commentary in the voice of ${t.name}. Be specific to your school's philosophical position. ${langInstruct}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
            }),
          }
        );

        if (res.ok) {
          const d = await res.json();
          commentaries[trad] = d?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        }
      }));

      result = {
        chunk_id,
        text_id:         chunk.text_id,
        chapter:         chunk.chapter,
        verse:           chunk.verse,
        original:        chunk.sanskrit,
        transliteration: chunk.transliteration,
        translation:     chunk.translation,
        commentary_mode: true,
        commentaries: {
          advaita: {
            teacher:     COMMENTARY_TRADITIONS.advaita.name,
            school:      COMMENTARY_TRADITIONS.advaita.school,
            commentary:  commentaries['advaita'] ?? '',
          },
          vishishtadvaita: {
            teacher:    COMMENTARY_TRADITIONS.vishishtadvaita.name,
            school:     COMMENTARY_TRADITIONS.vishishtadvaita.school,
            commentary: commentaries['vishishtadvaita'] ?? '',
          },
          dvaita: {
            teacher:    COMMENTARY_TRADITIONS.dvaita.name,
            school:     COMMENTARY_TRADITIONS.dvaita.school,
            commentary: commentaries['dvaita'] ?? '',
          },
        },
        panchang:     { tithi, paksha, vaara },
        generated_at: new Date().toISOString(),
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    console.error('[ai-pathshala-explain]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
