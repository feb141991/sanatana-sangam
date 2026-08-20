import { NextRequest, NextResponse } from "next/server";
import { generateWithProvider } from "@/lib/ai/providers/inference";
import { getApiUser } from "@/lib/api-auth";
import { rejectLargeRequest, asBoundedString, checkDurableRateLimit } from "@/lib/api-security";

const MAX_BODY_BYTES = 8 * 1024;
const HOURLY_RATE_LIMIT = 30;

const TRADITION_AUSPICIOUS_DAY: Record<string, string> = {
  hindu: "Shuddha din",
  sikh: "Sacha din",
  buddhist: "Kusala dina",
  jain: "Shubha din",
};

const SYSTEM = "You are Dharma Mitra. You speak in the voice of an elder who has witnessed thousands of practitioners. You never use hyperbole. You celebrate with specificity and weight. Plain text, no markdown, no bullet points.";

function buildInsightPrompt(params: {
  tradition: string;
  japaRounds: number;
  mantraName: string;
  pathshalaPct: number;
  quizCorrect: number;
  streakDays: number;
}): string {
  const { tradition, japaRounds, mantraName, pathshalaPct, quizCorrect, streakDays } = params;
  const traditionWord = TRADITION_AUSPICIOUS_DAY[tradition] ?? TRADITION_AUSPICIOUS_DAY["hindu"];

  return [
    "The user completed all five pillars of their daily sadhana today.",
    "",
    "Tradition: " + tradition,
    "Practices completed:",
    `  - Japa Mala: ${japaRounds} round(s) of "${mantraName}"`,
    "  - Nitya Karma: complete",
    "  - Pathshala: " + pathshalaPct + "% of today's lesson",
    "  - Daily Quiz: " + quizCorrect + " of 4 correct",
    "  - Dharm Veer: complete",
    "",
    "Current streak: " + streakDays + " days",
    "",
    "Write a 2–3 sentence perfect-day message:",
    `1. Open with the exact phrase "${traditionWord}." without translation`,
    "2. Name all five practices as five offerings made — briefly, with the actual numbers (rounds, percentage, correct answers)",
    "3. Give " + streakDays + " days sacred weight — not as a score but as evidence of a nature that has formed",
    "",
    "Tone: Reverent elder across a quiet courtyard. Not a cheerleader. Under 70 words. Plain text only."
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const sizeError = rejectLargeRequest(req, MAX_BODY_BYTES);
  if (sizeError) return sizeError;

  const { user, error, supabase } = await getApiUser(req);
  if (!user || error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateRejection = await checkDurableRateLimit(
    "perfect-day-insight:" + user.id,
    HOURLY_RATE_LIMIT,
    60 * 60 * 1000,
    supabase
  );
  if (rateRejection) return rateRejection;

  try {
    const body = await req.json().catch(() => ({}));
    const rawTradition = asBoundedString(body?.tradition, 30);
    const tradition = rawTradition ?? "hindu";
    const rawMantra = asBoundedString(body?.mantraName, 100);
    const mantraName = rawMantra ?? "Om Namah Shivaya";

    const japaRounds = Math.min(1000, Math.max(0, Number(body?.japaRounds) || 1));
    const pathshalaPct = Math.min(100, Math.max(0, Number(body?.pathshalaPct) || 100));
    const quizCorrect = Math.min(10, Math.max(0, Number(body?.quizCorrect) || 4));
    const streakDays = Math.min(100000, Math.max(0, Number(body?.streakDays) || 1));

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
        reasoningEffort: "none",
        maxOutputTokens: 2048,
      },
      { responseFormat: "text" }
    );

    const insight = result.text.trim();
    if (!insight) throw new Error("Empty response");

    return NextResponse.json({ insight }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[sadhana/perfect-day-insight]", err);
    return NextResponse.json({ insight: null }, { status: 500 });
  }
}
