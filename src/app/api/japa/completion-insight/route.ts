import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';

// ── Spiritual time-window labels ───────────────────────────────────────────────
const TIME_WINDOW_LABEL: Record<string, string> = {
  brahma_muhurta: 'before dawn — the rarest time to practice',
  morning:        'in the morning hours',
  midday:         'at midday',
  sandhya:        'at the sacred sandhya hour (dusk)',
  night:          'in the quiet of night',
};

// ── Tradition-specific merit vocabulary ───────────────────────────────────────
const MERIT_WORD: Record<string, string> = {
  hindu:    'punya (sacred merit)',
  sikh:     'kirpa (divine grace)',
  buddhist: 'merit (kusala kamma)',
  jain:     'punya (auspicious karma)',
};

// ── Number meaning seeds (fed to the model as hints) ──────────────────────────
function roundsContext(rounds: number): string {
  if (rounds === 1) return '1 mala — the seed of a daily practice, complete and whole';
  if (rounds === 3) return '3 malas — a sacred triad, the number of completion in most dharmic traditions';
  if (rounds === 5) return '5 malas — the five elements, the five koshas, the five pranas';
  if (rounds === 7) return '7 malas — the seven chakras, the seven sacred rivers, the seven heavens';
  if (rounds === 11) return '11 malas — the ekadashi number, deeply auspicious in Vaishnava practice';
  if (rounds >= 108) return `${rounds} malas — an extraordinary sadhana`;
  return `${rounds} malas — a committed and sustained practice`;
}

// ── AG system prompt ───────────────────────────────────────────────────────────
const SYSTEM = `You are Dharma Mitra, a warm and wise spiritual companion in a dharma app. \
You speak with the gentleness of a guru and the precision of a teacher. \
You never lecture or use clichés. You witness the practice with reverence and make the numbers meaningful. \
You always write in plain text — no markdown, no asterisks, no bullet points.`;

// ── AG user prompt ─────────────────────────────────────────────────────────────
function buildInsightPrompt(params: {
  tradition: string;
  mantraName: string;
  rounds: number;
  totalBeads: number;
  durationMinutes: number;
  timeOfDay: string;
}): string {
  const { tradition, mantraName, rounds, totalBeads, durationMinutes, timeOfDay } = params;
  const merit = MERIT_WORD[tradition] ?? 'punya (sacred merit)';
  const timeLabel = TIME_WINDOW_LABEL[timeOfDay] ?? 'at this hour';
  const roundsCtx = roundsContext(rounds);

  return `A devotee just completed their Japa Mala practice ${timeLabel}.

Details:
- Mantra: ${mantraName}
- Tradition: ${tradition}
- Rounds: ${roundsCtx}
- Total beads counted: ${totalBeads.toLocaleString('en-IN')}
- Duration: approximately ${durationMinutes} minute${durationMinutes === 1 ? '' : 's'}

Write a completion insight of exactly 2–3 sentences. It must:
1. Open by naming the specific ${merit} that this session has accumulated — reference the actual numbers meaningfully, not generically
2. Name one sacred quality that repeating the mantra "${mantraName}" is known to cultivate in the practitioner (be specific to this mantra's tradition and purpose)
3. Close with a single sentence that plants the practice's vibration into the rest of the day — something the practitioner can carry forward as an internal experience, not an instruction

Tone: like a beloved elder witnessing your practice from across a quiet ashram courtyard. Brief. Warm. Specific. Plain text only.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tradition?: string;
      mantraName?: string;
      rounds?: number;
      totalBeads?: number;
      durationMinutes?: number;
      timeOfDay?: string;
    };

    const tradition       = body.tradition       ?? 'hindu';
    const mantraName      = body.mantraName      ?? 'Om Namah Shivaya';
    const rounds          = body.rounds          ?? 1;
    const totalBeads      = body.totalBeads      ?? 108;
    const durationMinutes = body.durationMinutes ?? 10;
    const timeOfDay       = body.timeOfDay       ?? 'morning';

    const prompt = buildInsightPrompt({ tradition, mantraName, rounds, totalBeads, durationMinutes, timeOfDay });

    const result = await generateWithProvider(
      {
        system: SYSTEM,
        user: prompt,
        temperature: 0.72,
        reasoningEffort: 'none',
        maxOutputTokens: 2048,
      },
      { responseFormat: 'text' }
    );

    const insight = result.text.trim();
    if (!insight) throw new Error('Empty response');

    return NextResponse.json({ insight }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[japa/completion-insight]', err);
    return NextResponse.json({ insight: null }, { status: 500 });
  }
}
