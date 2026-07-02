import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';

// ─── POST /api/sanskar/suggest ────────────────────────────────────────────────
// Returns an AI-generated personalised next-step suggestion for the user's
// 16 Sanskara lifecycle journey. Uses the Pramana provider stack.
//
// Body: {
//   completed: string[];       // array of completed sanskara IDs
//   birth_date?: string;       // user/member birth date (ISO)
//   tradition?: string;        // 'hindu' | 'sikh' | 'jain' | 'buddhist'
//   member_name?: string;      // name of the family member (optional)
// }
//
// Returns: { next_sanskara: string; message: string; urgency: 'now'|'soon'|'later' }

const ALL_SANSKARAS = [
  { id: 'garbhadhana',     name: 'Garbhadhana',     stage: 'Prenatal',        number: 1  },
  { id: 'pumsavana',       name: 'Pumsavana',        stage: 'Prenatal',        number: 2  },
  { id: 'simantonnayana',  name: 'Simantonnayana',   stage: 'Prenatal',        number: 3  },
  { id: 'jatakarma',       name: 'Jatakarma',        stage: 'Birth',           number: 4  },
  { id: 'namakarana',      name: 'Namakarana',       stage: 'Birth',           number: 5  },
  { id: 'nishkramana',     name: 'Nishkramana',      stage: 'Infant',          number: 6  },
  { id: 'annaprashana',    name: 'Annaprashana',     stage: 'Infant',          number: 7  },
  { id: 'chudakarana',     name: 'Chudakarana',      stage: 'Early Childhood', number: 8  },
  { id: 'karnavedha',      name: 'Karnavedha',       stage: 'Early Childhood', number: 9  },
  { id: 'vidyarambha',     name: 'Vidyarambha',      stage: 'Childhood',       number: 10 },
  { id: 'upanayana',       name: 'Upanayana',        stage: 'Youth',           number: 11 },
  { id: 'vedarambha',      name: 'Vedarambha',       stage: 'Youth',           number: 12 },
  { id: 'keshanta',        name: 'Keshanta',         stage: 'Youth',           number: 13 },
  { id: 'samavartana',     name: 'Samavartana',      stage: 'Youth',           number: 14 },
  { id: 'vivaha',          name: 'Vivaha',           stage: 'Adult',           number: 15 },
  { id: 'antyesti',        name: 'Antyesti',         stage: 'Death',           number: 16 },
];

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  let body: { completed: string[]; birth_date?: string; tradition?: string; member_name?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const { completed = [], birth_date, tradition = 'hindu', member_name } = body;

  // Find the next incomplete sanskara
  const completedSet = new Set(completed);
  const remaining = ALL_SANSKARAS.filter(s => !completedSet.has(s.id));
  const nextSanskara = remaining[0];

  if (!nextSanskara) {
    return NextResponse.json({
      next_sanskara: '',
      message: '🙏 All 16 Sanskaras have been completed! This is a profound milestone in the dharmic journey.',
      urgency: 'later',
    });
  }

  const completedNames = ALL_SANSKARAS.filter(s => completedSet.has(s.id)).map(s => s.name).join(', ');
  const ageContext = birth_date
    ? `The person was born on ${birth_date}, making them approximately ${Math.floor((Date.now() - new Date(birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years old.`
    : '';
  const forWhom = member_name ? `for ${member_name}` : 'for the user';

  const userPrompt = `You are Dharma Mitra, a spiritual guide for Sanatana Dharma.

The user is tracking the 16 Sanskaras (Shodasha Samskaras) ${forWhom} in a ${tradition} family.
${ageContext}
Completed Sanskaras: ${completedNames || 'none yet'}.
Next Sanskara: ${nextSanskara.name} (${nextSanskara.stage} stage, #${nextSanskara.number}).

Give a warm, personalised, 2-3 sentence message encouraging them toward the next sanskara.
Be specific to ${nextSanskara.name} — what it means, why it matters now, and one practical tip.
Keep it concise, warm, and dharmic in tone. Do NOT use markdown. Reply in plain text only.
Also assess urgency as one of: "now" (should be done soon, within weeks), "soon" (within a few months), or "later" (years away or not yet applicable).
Respond in this exact JSON format: {"message": "...", "urgency": "now|soon|later"}`;

  let message = `Next on your journey: ${nextSanskara.name}. May this sacred rite bring blessings to your family.`;
  let urgency: 'now' | 'soon' | 'later' = 'soon';
  const startTime = Date.now();

  try {
    const result = await generateWithProvider(
      {
        user: userPrompt,
        temperature: 0.7,
        reasoningEffort: 'none',
        maxOutputTokens: 320,
      },
      { responseFormat: 'json' },
    );

    const match = result.text.match(/\{[\s\S]*?\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.message) message = parsed.message;
      if (['now', 'soon', 'later'].includes(parsed.urgency)) urgency = parsed.urgency;
    }
    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/sanskar/suggest',
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.modelUsed,
      fallback_used: result.provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
      context: {
        feature: 'sanskar_suggest',
        tradition,
        next_sanskara: nextSanskara.id,
      },
    });
  } catch (e) {
    console.error('[sanskar/suggest] provider error:', e);
    emitError('ai', e, 'P2', { route: '/api/sanskar/suggest', latency_ms: Date.now() - startTime });
    // Fall through to defaults — better a fallback message than an error
  }

  return NextResponse.json({
    next_sanskara: nextSanskara.id,
    next_sanskara_name: nextSanskara.name,
    message,
    urgency,
  });
}
