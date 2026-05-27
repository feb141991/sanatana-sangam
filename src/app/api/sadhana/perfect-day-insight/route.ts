import { NextRequest, NextResponse } from 'next/server';
import { generateWithProvider } from '@/lib/ai/providers/inference';

const TRADITION_AUSPICIOUS_DAY: Record<string, string> = {
  hindu: 'Shuddha din',
  sikh: 'Sacha din',
  buddhist: 'Kusala dina',
  jain: 'Shubha din',
};

const SYSTEM = `You are Dharma Mitra. You speak in the voice of an elder who has witnessed 
thousands of practitioners. You never use hyperbole. You celebrate with 
specificity and weight. Plain text, no markdown, no bullet points.`;

function buildInsightPrompt(params: {
  tradition: string;
  japaRounds: number;
  mantraName: string;
  pathshalaPct: number;
  quizCorrect: number;
  streakDays: number;
}): string {
  const { tradition, japaRounds, mantraName, pathshalaPct, quizCorrect, streakDays } = params;
  const traditionWord = TRADITION_AUSPICIOUS_DAY[tradition] ?? TRADITION_AUSPICIOUS_DAY['hindu'];

  return `The user completed all five pillars of their daily sadhana today.

Tradition: ${tradition}
Practices completed:
  - Japa Mala: ${japaRounds} round(s) of "${mantraName}"
  - Nitya Karma: complete
  - Pathshala: ${pathshalaPct}% of today's lesson
  - Daily Quiz: ${quizCorrect} of 4 correct
  - Dharm Veer: complete

Current streak: ${streakDays} days

Write a 2–3 sentence perfect-day message:
1. Open with the exact phrase "${traditionWord}." without translation
2. Name all five practices as five offerings made — briefly, with the actual numbers (rounds, percentage, correct answers)
3. Give ${streakDays} days sacred weight — not as a score but as evidence of a nature that has formed

Tone: Reverent elder across a quiet courtyard. Not a cheerleader. Under 70 words. Plain text only.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tradition?: string;
      japaRounds?: number;
      mantraName?: string;
      pathshalaPct?: number;
      quizCorrect?: number;
      streakDays?: number;
    };

    const tradition    = body.tradition ?? 'hindu';
    const japaRounds   = body.japaRounds ?? 1;
    const mantraName   = body.mantraName ?? 'Om Namah Shivaya';
    const pathshalaPct = body.pathshalaPct ?? 100;
    const quizCorrect  = body.quizCorrect ?? 4;
    const streakDays   = body.streakDays ?? 1;

    const prompt = buildInsightPrompt({
      tradition,
      japaRounds,
      mantraName,
      pathshalaPct,
      quizCorrect,
      streakDays
    });

    const result = await generateWithProvider(
      {
        system: SYSTEM,
        user: prompt,
        temperature: 0.72,
        reasoningEffort: 'none',
        maxOutputTokens: 450,
      },
      { responseFormat: 'text' }
    );

    const insight = result.text.trim();
    if (!insight) throw new Error('Empty response');

    return NextResponse.json({ insight }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[sadhana/perfect-day-insight]', err);
    return NextResponse.json({ insight: null }, { status: 500 });
  }
}
