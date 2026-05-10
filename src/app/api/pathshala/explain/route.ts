import { NextResponse } from 'next/server';
import { getLanguageInstruction } from '@/lib/language-runtime';

// POST /api/pathshala/explain
// Body: { sanskrit, transliteration, translation, source, title, tradition, language? }
// Returns tradition-aware Gemini explanation — no DB chunk needed.

// Model priority: lite first (higher free-tier RPM), flash as fallback
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const COMMENTARY: Record<string, { name: string; school: string; lens: string }> = {
  vaishnava: {
    name:   'Ramanujacharya',
    school: 'Vishishtadvaita',
    lens:   'Brahman is real, world and souls are real but body of Brahman. Bhakti and prapatti are the path. Narayana is Ishvara.',
  },
  shaiva: {
    name:   'Abhinavagupta',
    school: 'Kashmir Shaivism',
    lens:   'All is Shiva-consciousness. Liberation is recognition of own nature as Shiva. Emphasise shakti and spanda.',
  },
  sant: {
    name:   'Kabir Das',
    school: 'Sant Tradition',
    lens:   'Formless divine beyond caste and ritual. Direct experience of Naam within. Plain speech that cuts through pretension.',
  },
  sikh: {
    name:   'Guru Nanak Dev Ji',
    school: 'Sikhi',
    lens:   'Ik Onkar — one formless God. Naam simran, seva, and kirat as path. Equality of all beings. Reject superstition.',
  },
  buddhist: {
    name:   'Nagarjuna',
    school: 'Madhyamaka Buddhism',
    lens:   'Sunyata (emptiness) as the nature of all phenomena. Middle way. Dependent origination. Compassion for all sentient beings.',
  },
  jain: {
    name:   'Kundakunda',
    school: 'Jain Dharma',
    lens:   'Ahimsa, anekantavada (many-sidedness of truth). Soul is distinct from karma. Liberation through right knowledge, faith, conduct.',
  },
  advaita: {
    name:   'Adi Shankaracharya',
    school: 'Advaita Vedanta',
    lens:   'Brahman alone is real, world is maya. Atman = Brahman. Liberation is recognition of this identity. Jnana marga.',
  },
};

function getCommentary(tradition: string | null) {
  if (!tradition) return COMMENTARY.advaita;
  return COMMENTARY[tradition.toLowerCase()] ?? COMMENTARY.advaita;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Explain] GEMINI_API_KEY is not set');
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured — add it to Vercel env vars' }, { status: 503 });
  }

  const { sanskrit, transliteration, translation, source, title, tradition, language = 'en' } =
    await req.json().catch(() => ({}));

  if (!translation && !sanskrit && !transliteration) {
    return NextResponse.json({ error: 'Verse content required' }, { status: 400 });
  }

  const c = getCommentary(tradition);

  const langNote = getLanguageInstruction(language);

  const prompt = `You are a wise ${c.school} teacher explaining a scripture verse to a sincere practitioner.

SOURCE: ${source ?? ''} — ${title ?? ''}
ORIGINAL (Sanskrit/text): ${sanskrit ?? ''}
TRANSLITERATION: ${transliteration ?? ''}
STANDARD TRANSLATION: ${translation ?? ''}

Your lens: ${c.lens}
Teach as ${c.name} would.

Return ONLY this JSON (no markdown, no extra text):
{
  "word_by_word": "<Key Sanskrit/original terms and their meanings, 1-2 sentences>",
  "meaning": "<Core meaning of the verse in 2-3 sentences>",
  "commentary": "<${c.school} interpretation in 3-4 sentences, in the spirit of ${c.name}>",
  "daily_application": "<How to apply this teaching today, 2-3 sentences>",
  "contemplation": "<A single reflective question or thought to sit with>",
  "related_text": "<Name one other scripture or teacher that echoes this teaching>"
}

${langNote}`;

  try {
    let raw = '';

    for (const model of GEMINI_MODELS) {
      const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 900 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        break;
      }

      const errText = await res.text().catch(() => '');
      console.warn(`[Explain] model=${model} status=${res.status}`);

      if (res.status === 429 || res.status === 404) continue; // try fallback
      // For other errors surface immediately
      return NextResponse.json({ error: `Gemini ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    // Parse JSON from response (may or may not have code fences)
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    let explanation: Record<string, string> | null = null;
    if (jsonMatch) {
      try { explanation = JSON.parse(jsonMatch[1]); } catch { /* fall through */ }
    }

    if (!explanation) {
      explanation = {
        word_by_word:      '',
        meaning:           translation ?? '',
        commentary:        '',
        daily_application: 'Reflect on this verse during your practice today.',
        contemplation:     'How does this teaching speak to your life right now?',
        related_text:      '',
      };
    }

    return NextResponse.json({
      explanation,
      tradition: c.school,
      teacher:   c.name,
      source,
      title,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Explain failed' }, { status: 500 });
  }
}
