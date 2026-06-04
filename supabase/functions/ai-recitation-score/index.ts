// ============================================================
// ai-recitation-score — Shruti voice recitation scoring
//
// Flow:
//   1. Fetch audio from Supabase Storage
//   2. Transcribe via Groq Whisper large-v3 (free tier)
//   3. Word-level diff: transcript vs expected text
//   4. Gemini analyses phonological errors per language rules
//   5. Store result → pathshala_recordings + pathshala_recitation_reviews
//
// POST body:
//   { recording_id: string }
//   (recording must already exist in pathshala_recordings with status='processing')
//
// Called by the client immediately after uploading audio to Storage.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY   = Deno.env.get('GROQ_API_KEY')   ?? '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')   ?? '';
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Language phonology rule sets ──────────────────────────────────────────────

const PHONOLOGY_RULES: Record<string, string> = {
  sa: `Sanskrit phonological rules for scoring:
- Uccharan: Each phoneme must be precise. ka/kha/ga/gha are distinct; retroflex (ṭ,ḍ,ṇ) vs dental (t,d,n) is critical.
- Visarga (ḥ): Must be clearly pronounced. Dropping visarga is a common error (e.g. "dharma" instead of "dharmaḥ").
- Sandhi: At word boundaries, follow sandhi rules (e.g. "rāma + uvāca = rāmovāca"). Incorrect joining or splitting is an error.
- Laya: Anushtubh metre is 8 syllables per pada. Flag if the rhythm is broken.
- Svara (Vedic only): Udātta (high pitch), Anudātta (low), Svarita (falling). Score only if text has accent marks.
- Anusvara (ṃ): Must be nasalised, not dropped.`,

  hi: `Hindi/Awadhi phonological rules for scoring:
- Uccharan: Retroflex consonants (ट,ड,ण) vs dentals (त,द,न). Aspirates (ख,घ,छ) vs unaspirates (क,ग,च).
- Nasal vowels: chandrabindu (ँ) and anusvara (ं) must be correctly nasalised.
- Matra: Long vowels (आ,ई,ऊ) must be held longer than short (अ,इ,उ).
- Fluency: Assess whether the recitation flows naturally without unnatural pauses.`,

  awa: `Awadhi (Ram Charit Manas) phonological rules:
- Same consonant distinctions as Hindi.
- Doha metre: 24 matras in first line, 26 in second. Flag metre breaks.
- Chaupai: 16 matras per line. Rhythm is sing-song — score for consistent laya.
- Final -a sounds are often elided in Awadhi (e.g. "rama" → "ram") — this is correct, not an error.`,

  ta: `Tamil phonological rules for scoring:
- Short/long vowel distinction is critical: அ vs ஆ, இ vs ஈ, உ vs ஊ (a/ā, i/ī, u/ū).
- Aytam (ஃ): A rare sound between vowel and velar — must be lightly aspirated.
- Grantha letters (ஸ,ஷ,ஜ,ஹ) used in Sanskrit loanwords — check pronunciation matches Sanskrit original.
- Virāma: Ending consonants must not carry inherent vowel.
- Pasuram metre: Assess for correct venpa/asiriyappa metre where applicable.`,

  bn: `Bengali phonological rules for scoring:
- ব vs ভ: ব is /b/, ভ is /bʱ/ (aspirated). Frequently confused.
- Inherent vowel dropping: In many positions the inherent অ is not pronounced (e.g. "বলা" is /bola/ not /bɔla/).
- য-fola and ব-fola conjunct consonants must be correctly produced.
- Nasalisation: ঁ (chandrabindu) indicates nasalised vowel.`,

  te: `Telugu phonological rules for scoring:
- Vowel length: అ vs ఆ, ఇ vs ఈ — length distinction is phonemic.
- Aspirates vs unaspirates: క vs ఖ, గ vs ఘ.
- Anusvara (ం) must be nasalised, not dropped.
- Sunna (ఁ): Chandrabindu nasalisation.`,

  kn: `Kannada phonological rules for scoring:
- Retroflex vs dental distinction: ಟ vs ತ, ಡ vs ದ, ಣ vs ನ.
- Vowel length distinction: ಅ vs ಆ.
- Anusvara (ಂ) and visarga (ಃ) must be correctly produced.`,

  ml: `Malayalam phonological rules for scoring:
- Chillu letters (ൻ,ർ,ൽ,ൾ,ൿ): Final consonants without inherent vowel — must be pure consonants.
- Length distinction critical: long vowels must be approximately twice the duration of short.
- Retroflex lateral (ൾ/ഴ): A distinctive Malayalam sound — retroflex approximant.`,

  mr: `Marathi phonological rules for scoring:
- Similar to Sanskrit for aspirates and retroflexes.
- Chandrabindu (ँ): Nasalised vowels in Warkari abhangas.
- Abhanga metre: 4 lines, 6+6+6+4 syllables. Flag metre breaks.`,

  gu: `Gujarati phonological rules for scoring:
- Aspirates and retroflex similar to Hindi.
- Final schwa dropping: similar to Hindi, inherent vowel often not pronounced.
- Anusvara (ં) nasalisation.`,

  or: `Odia phonological rules for scoring:
- Odia has its own distinctive phonemes including the lateral flap ଳ.
- Inherent vowel is /ɔ/ not /ə/ — preserve this in pronunciation.
- Aspirate/unaspirate distinction: କ vs ଖ, ଗ vs ଘ.`,

  en: `English (transliteration reading) rules:
- Score only fluency and correct IAST/transliteration reading.
- Check that ā/ī/ū are held as long vowels, not short.
- Retroflex symbols (ṭ,ḍ,ṇ,ṣ) must be pronounced differently from dentals.`,
};

// ── Word-level diff ────────────────────────────────────────────────────────────

interface WordDiff {
  position:  number;
  expected:  string;
  said:      string | null;  // null = word was skipped
  match:     'correct' | 'mismatch' | 'skipped' | 'extra';
}

function normaliseSanskrit(word: string): string {
  // Collapse common IAST variants and strip punctuation for comparison
  return word
    .toLowerCase()
    .replace(/[।॥|,.'";:!?]/g, '')    // strip punctuation
    .replace(/ā/g, 'a').replace(/ī/g, 'i').replace(/ū/g, 'u')  // collapse long/short for loose match
    .replace(/ṭ/g, 't').replace(/ḍ/g, 'd').replace(/ṇ/g, 'n')
    .replace(/ś/g, 'sh').replace(/ṣ/g, 'sh')
    .replace(/ḥ/g, 'h').replace(/ṃ/g, 'm')
    .trim();
}

function normaliseGeneral(word: string): string {
  return word.toLowerCase().replace(/[।॥|,.'";:!?]/g, '').trim();
}

function wordDiff(expected: string, transcript: string, language: string): WordDiff[] {
  const normalise = language === 'sa' ? normaliseSanskrit : normaliseGeneral;

  const expectedWords  = expected.split(/\s+/).filter(Boolean);
  const transcriptWords = transcript.split(/\s+/).filter(Boolean);
  const diffs: WordDiff[] = [];

  let ti = 0; // transcript index
  for (let ei = 0; ei < expectedWords.length; ei++) {
    const exp    = expectedWords[ei];
    const expNorm = normalise(exp);

    if (ti >= transcriptWords.length) {
      diffs.push({ position: ei, expected: exp, said: null, match: 'skipped' });
      continue;
    }

    const said     = transcriptWords[ti];
    const saidNorm = normalise(said);

    if (expNorm === saidNorm) {
      diffs.push({ position: ei, expected: exp, said, match: 'correct' });
      ti++;
    } else {
      // Look one ahead for possible skip
      const nextNorm = ti + 1 < transcriptWords.length ? normalise(transcriptWords[ti + 1]) : null;
      if (nextNorm === expNorm) {
        diffs.push({ position: ei, expected: exp, said: null, match: 'skipped' });
      } else {
        diffs.push({ position: ei, expected: exp, said, match: 'mismatch' });
        ti++;
      }
    }
  }

  return diffs;
}

// ── Score calculation from diff + Gemini response ─────────────────────────────

interface GeminiScore {
  uccharan:   number | null;
  sandhi:     number | null;
  visarga:    number | null;
  laya:       number | null;
  svara:      number | null;
  fluency:    number | null;
  overall:    number;
  feedback:   string;
  corrections: Array<{
    word:     string;
    said:     string;
    rule:     string;
    severity: 'critical' | 'moderate' | 'minor';
  }>;
}

function extractJSON(text: string): GeminiScore | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                text.match(/(\{[\s\S]*\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function buildFallbackScore(diffs: WordDiff[]): GeminiScore {
  const total    = diffs.length;
  const correct  = diffs.filter(d => d.match === 'correct').length;
  const accuracy = total > 0 ? correct / total : 0;
  const overall  = Math.max(1, Math.min(5, Math.round(accuracy * 5 * 10) / 10));
  return {
    uccharan: overall, sandhi: null, visarga: null,
    laya: null, svara: null, fluency: overall,
    overall,
    feedback: `Word accuracy: ${Math.round(accuracy * 100)}% (${correct}/${total} words matched).`,
    corrections: diffs
      .filter(d => d.match === 'mismatch' || d.match === 'skipped')
      .slice(0, 10)
      .map(d => ({
        word:     d.expected,
        said:     d.said ?? '(skipped)',
        rule:     d.match === 'skipped' ? 'Word was skipped' : 'Word was mispronounced',
        severity: 'moderate' as const,
      })),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const { recording_id } = await req.json();
    if (!recording_id) {
      return new Response(JSON.stringify({ error: 'recording_id required' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── 1. Fetch recording row ─────────────────────────────────────────────────
    const { data: rec, error: recErr } = await supabase
      .from('pathshala_recordings')
      .select('*, scripture_chunks(text_id, chapter, verse, sanskrit, transliteration)')
      .eq('id', recording_id)
      .single();

    if (recErr || !rec) {
      return new Response(JSON.stringify({ error: 'recording not found' }), { status: 404 });
    }

    const language     = rec.language ?? 'sa';
    const expectedText = rec.expected_text ?? rec.scripture_chunks?.sanskrit ?? '';

    // ── 2. Download audio from Supabase Storage ────────────────────────────────
    const { data: audioData, error: dlErr } = await supabase.storage
      .from(rec.audio_bucket ?? 'pathshala-recordings')
      .download(rec.audio_url);

    if (dlErr || !audioData) {
      await supabase.from('pathshala_recordings')
        .update({ status: 'error', error_message: 'Audio download failed' })
        .eq('id', recording_id);
      return new Response(JSON.stringify({ error: 'audio download failed' }), { status: 500 });
    }

    // ── 3. Groq Whisper transcription ─────────────────────────────────────────
    let transcript = '';
    if (GROQ_API_KEY) {
      const formData = new FormData();
      formData.append('file', new Blob([await audioData.arrayBuffer()], { type: 'audio/webm' }), 'recording.webm');
      formData.append('model', 'whisper-large-v3');
      formData.append('language', language === 'awa' ? 'hi' : language); // Awadhi → Hindi STT
      formData.append('response_format', 'verbose_json');
      formData.append('temperature', '0');

      const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method:  'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body:    formData,
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        transcript = groqData.text ?? '';
      }
    }

    if (!transcript) {
      await supabase.from('pathshala_recordings')
        .update({ status: 'error', error_message: 'STT transcription failed' })
        .eq('id', recording_id);
      return new Response(JSON.stringify({ error: 'transcription failed — check GROQ_API_KEY' }), { status: 500 });
    }

    // ── 4. Word-level diff ────────────────────────────────────────────────────
    const diffs = wordDiff(expectedText, transcript, language);
    const errorWords = diffs.filter(d => d.match !== 'correct');

    // ── 5. Gemini phonological analysis ──────────────────────────────────────
    const rules     = PHONOLOGY_RULES[language] ?? PHONOLOGY_RULES['sa'];
    const errorList = errorWords.slice(0, 15).map(d =>
      `- Expected "${d.expected}", heard "${d.said ?? '(skipped)'}" (position ${d.position + 1})`
    ).join('\n');

    const prompt = `You are an expert in ${language} recitation and phonology.

A student has recited the following text:

EXPECTED TEXT:
${expectedText}

STT TRANSCRIPT (what was actually said):
${transcript}

WORD-LEVEL ERRORS DETECTED (${errorWords.length} of ${diffs.length} words):
${errorList || 'None — all words matched'}

${rules}

Analyse the recitation and return ONLY a JSON object with this exact structure:
{
  "uccharan":   <1.0–5.0 score for pronunciation, or null if insufficient data>,
  "sandhi":     <1.0–5.0 score for sandhi accuracy, or null if not applicable>,
  "visarga":    <1.0–5.0 score for visarga, or null if not applicable>,
  "laya":       <1.0–5.0 score for rhythm/metre, or null if insufficient data>,
  "svara":      <1.0–5.0 score for Vedic accents, or null if not Vedic text>,
  "fluency":    <1.0–5.0 score for overall flow>,
  "overall":    <1.0–5.0 weighted overall score>,
  "feedback":   "<2–3 sentences of encouraging, specific feedback in English>",
  "corrections": [
    {
      "word":     "<expected word>",
      "said":     "<what was heard>",
      "rule":     "<specific phonological rule violated>",
      "severity": "critical|moderate|minor"
    }
  ]
}

Corrections: include only the most important errors (max 8). Be specific about the rule (e.g. "visarga dropped", "retroflex ṭ pronounced as dental t", "sandhi break between words").
Feedback: be encouraging — address the student as a sincere practitioner. Note what they did well first.`;

    let scores: GeminiScore = buildFallbackScore(diffs);

    if (GEMINI_API_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        scores = extractJSON(raw) ?? buildFallbackScore(diffs);
      }
    }

    // ── 6. Persist results ────────────────────────────────────────────────────
    const now = new Date().toISOString();

    // Update the recording row
    await supabase.from('pathshala_recordings').update({
      transcript,
      status:    'scored',
      scored_at: now,
    }).eq('id', recording_id);

    // Insert the AI review
    const { data: review, error: reviewErr } = await supabase
      .from('pathshala_recitation_reviews')
      .insert({
        recording_id,
        reviewer_id:   null,         // null = AI
        reviewer_type: 'ai',
        score_uccharan: scores.uccharan,
        score_sandhi:   scores.sandhi,
        score_visarga:  scores.visarga,
        score_laya:     scores.laya,
        score_svara:    scores.svara,
        score_fluency:  scores.fluency,
        overall_score:  scores.overall,
        feedback_text:  scores.feedback,
        corrections:    scores.corrections ?? [],
        is_certified:   false,
        reviewed_at:    now,
      })
      .select()
      .single();

    if (reviewErr) {
      console.error('[ai-recitation-score] review insert failed:', reviewErr.message);
    }

    // ── 7. Return to client ───────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        recording_id,
        transcript,
        scores: {
          uccharan: scores.uccharan,
          sandhi:   scores.sandhi,
          visarga:  scores.visarga,
          laya:     scores.laya,
          svara:    scores.svara,
          fluency:  scores.fluency,
          overall:  scores.overall,
        },
        feedback:    scores.feedback,
        corrections: scores.corrections ?? [],
        word_accuracy: diffs.length > 0
          ? Math.round(diffs.filter(d => d.match === 'correct').length / diffs.length * 100)
          : 100,
        total_words:   diffs.length,
        review_id:     review?.id ?? null,
        scored_at:     now,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (err) {
    console.error('[ai-recitation-score]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
