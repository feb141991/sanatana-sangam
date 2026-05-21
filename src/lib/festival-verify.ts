/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Festival Date Verification via Pramana AI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two-layer verification for lunar-calendar festival dates:
 *   1. LUNAR_FESTIVAL_RULES — the tithi rule for each festival (source of truth
 *      for *what to check*, e.g. "Jyeshtha Krishna Amavasya")
 *   2. verifyFestivalDatesWithAI() — sends the rules + stored dates to the
 *      Pramana provider stack (Sarvam → Gemini). The AI cross-checks each date
 *      and flags mismatches with a suggested correction and confidence level.
 *
 * Solar-fixed dates (Makar Sankranti, Baisakhi) are excluded — they don't drift.
 * Only lunar-tithi-based vratas and festivals need verification.
 *
 * Usage:
 *   - Admin panel: "Verify Festival Dates" button → POST /api/admin/verify-festivals
 *   - Yearly cron: Jan 5 → auto-verify and email mismatches
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { generateWithProvider } from '@/lib/ai/providers/inference';
import type { Festival, FestivalVerificationConfidence, FestivalVerificationStoredStatus, FestivalVerificationType } from '@/lib/festivals';

// ─── Tithi Rule Definitions ───────────────────────────────────────────────────

export interface LunarFestivalRule {
  /** Festival name — must match exactly what's in FESTIVALS_YYYY */
  name: string;
  /** Human-readable rule used in the verification prompt */
  rule: string;
  /** Determines whether AI verification is appropriate or manual review is safer */
  verificationType: FestivalVerificationType;
  /** Optional: note about regional variations or ambiguities */
  note?: string;
}

/**
 * Tithi rules for all lunar-calendar-based Hindu festivals.
 * Solar-fixed dates (Makar Sankranti, Baisakhi, etc.) are intentionally omitted.
 *
 * Rule format follows standard Panchang notation:
 *   <Masa> <Paksha> <Tithi>
 *   e.g. "Magha Krishna Chaturdashi" = 14th night of the waning fortnight of Magha month
 */
export const LUNAR_FESTIVAL_RULES: LunarFestivalRule[] = [
  // ── Vratas & Lunar Observances ─────────────────────────────────────────────
  {
    name: 'Vasant Panchami',
    rule: 'Magha Shukla Panchami (5th day of the waxing fortnight of Magha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Maha Shivaratri',
    rule: 'Magha Krishna Chaturdashi (14th night of the waning fortnight of Magha)',
    verificationType: 'lunar_tithi',
    note: 'Some regional calendars use Phalguna Krishna Chaturdashi — both are in circulation',
  },
  {
    name: 'Holi',
    rule: 'Phalguna Shukla Purnima (full moon of Phalguna) — Holika Dahan on the eve',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Gudi Padwa',
    rule: 'Chaitra Shukla Pratipada (1st day of the waxing fortnight of Chaitra)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Ugadi',
    rule: 'Chaitra Shukla Pratipada (same as Gudi Padwa)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Ram Navami',
    rule: 'Chaitra Shukla Navami (9th day of the waxing fortnight of Chaitra)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Hanuman Jayanti',
    rule: 'Chaitra Shukla Purnima (full moon of Chaitra)',
    verificationType: 'lunar_tithi',
    note: 'Some South Indian traditions observe on Margashirsha Krishna Chaturdashi',
  },
  {
    name: 'Narasimha Jayanti',
    rule: 'Vaishakha Shukla Chaturdashi (14th day of the waxing fortnight of Vaishakha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Shani Jayanti',
    rule: 'Jyeshtha Krishna Amavasya (new moon of Jyeshtha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Vat Savitri Vrat',
    rule: 'Jyeshtha Krishna Amavasya (new moon of Jyeshtha) — North India observance',
    verificationType: 'regional_calendar',
    note: 'Maharashtra / Gujarat / Karnataka observe on Jyeshtha Shukla Purnima instead (see Vat Savitri Purnima)',
  },
  {
    name: 'Vat Savitri Purnima',
    rule: 'Jyeshtha Shukla Purnima (full moon of Jyeshtha) — Maharashtra, Gujarat, Karnataka observance',
    verificationType: 'regional_calendar',
  },
  {
    name: 'Guru Purnima',
    rule: 'Ashadha Shukla Purnima (full moon of Ashadha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Nag Panchami',
    rule: 'Shravana Shukla Panchami (5th day of the waxing fortnight of Shravana)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Raksha Bandhan',
    rule: 'Shravana Shukla Purnima (full moon of Shravana)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Hartalika Teej',
    rule: 'Bhadrapada Shukla Tritiya (3rd day of the waxing fortnight of Bhadrapada)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Krishna Janmashtami',
    rule: 'Bhadrapada Krishna Ashtami (8th day of the waning fortnight of Bhadrapada) — midnight birth',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Ganesh Chaturthi',
    rule: 'Bhadrapada Shukla Chaturthi (4th day of the waxing fortnight of Bhadrapada)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Onam',
    rule: 'Thiruvonam Nakshatra in the Malayalam month of Chingam (late August / early September)',
    verificationType: 'nakshatra_based',
    note: 'Nakshatra-based, not purely tithi — verify against Malayalam calendar',
  },
  {
    name: 'Mahalaya Amavasya',
    rule: 'Ashwin Krishna Amavasya (new moon of Ashwin) — last day of Pitru Paksha',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Navratri begins',
    rule: 'Ashwin Shukla Pratipada (1st day of the waxing fortnight of Ashwin)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Dussehra',
    rule: 'Ashwin Shukla Dashami (10th day of the waxing fortnight of Ashwin)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Karva Chauth',
    rule: 'Kartik Krishna Chaturthi (4th day of the waning fortnight of Kartik)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Dhanteras',
    rule: 'Kartik Krishna Trayodashi (13th day of the waning fortnight of Kartik)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Diwali',
    rule: 'Kartik Krishna Amavasya (new moon of Kartik) — Lakshmi Puja on this night',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Govardhan Puja',
    rule: 'Kartik Shukla Pratipada (1st day of the waxing fortnight of Kartik, day after Diwali)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Bhai Dooj',
    rule: 'Kartik Shukla Dwitiya (2nd day of the waxing fortnight of Kartik)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Chhath Puja',
    rule: 'Kartik Shukla Shashthi (6th day of the waxing fortnight of Kartik)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Kartik Purnima',
    rule: 'Kartik Shukla Purnima (full moon of Kartik)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Vivah Panchami',
    rule: 'Margashirsha Shukla Panchami (5th day of the waxing fortnight of Margashirsha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Gita Jayanti',
    rule: 'Margashirsha Shukla Ekadashi (11th day of the waxing fortnight of Margashirsha)',
    verificationType: 'lunar_tithi',
  },
  {
    name: 'Vaikunta Ekadashi',
    rule: 'Margashirsha Shukla Ekadashi — same as Gita Jayanti; also known as Mokshada Ekadashi',
    verificationType: 'regional_calendar',
    note: 'South Indian (Tamil) traditions observe on Dhanurmasa Shukla Ekadashi which may differ by a day',
  },
];

// ─── Verification Result Types ────────────────────────────────────────────────

export type VerificationStatus = FestivalVerificationStoredStatus;

export interface FestivalVerificationResult {
  name: string;
  storedDate: string;
  rule: string;
  status: VerificationStatus;
  verificationType: FestivalVerificationType;
  /** AI-suggested correct date if different from storedDate */
  suggestedDate?: string;
  /** AI confidence: 'high' | 'medium' | 'low' */
  confidence: FestivalVerificationConfidence;
  /** AI explanation of its reasoning or the discrepancy */
  note: string;
}

export interface VerificationReport {
  year: number;
  runAt: string;
  totalChecked: number;
  verified: number;
  mismatches: number;
  uncertain: number;
  manualReview: number;
  results: FestivalVerificationResult[];
}

// ─── Core Verification Function ───────────────────────────────────────────────

/**
 * Verify festival dates against their lunar tithi rules using the Pramana AI stack.
 *
 * The AI is used as a cross-checker, not a source of truth. It knows the Hindu
 * Panchang and can flag dates that don't match a festival's tithi rule.
 *
 * @param festivals - The festival list for a given year (e.g. FESTIVALS_2026)
 * @param year - The Gregorian year being verified
 */
export async function verifyFestivalDatesWithAI(
  festivals: Festival[],
  year: number,
): Promise<VerificationReport> {
  // Build the list of festivals that have a lunar rule
  const toCheck: Array<{ festival: Festival; rule: LunarFestivalRule }> = [];
  for (const festival of festivals) {
    const rule = LUNAR_FESTIVAL_RULES.find(r => r.name === festival.name);
    if (rule) {
      toCheck.push({ festival, rule });
    }
  }

  if (toCheck.length === 0) {
    return {
      year,
      runAt: new Date().toISOString(),
      totalChecked: 0,
      verified: 0,
      mismatches: 0,
      uncertain: 0,
      manualReview: 0,
      results: [],
    };
  }

  const aiCheckable = toCheck.filter((item) => item.rule.verificationType === 'lunar_tithi');
  const manualReviewResults: FestivalVerificationResult[] = toCheck
    .filter((item) => item.rule.verificationType !== 'lunar_tithi')
    .map((item) => ({
      name: item.festival.name,
      storedDate: item.festival.date,
      rule: item.rule.rule,
      status: 'manual_review',
      verificationType: item.rule.verificationType,
      confidence: 'medium',
      note: item.rule.verificationType === 'nakshatra_based'
        ? 'Needs manual calendar review — this observance is nakshatra-based.'
        : 'Needs manual review because regional calendar practice can legitimately vary.',
    }));

  // Build the verification prompt
  const festivalList = aiCheckable.map((item, i) => {
    const ruleNote = item.rule.note ? ` [Note: ${item.rule.note}]` : '';
    return `${i + 1}. "${item.festival.name}" | Rule: ${item.rule.rule}${ruleNote} | Stored date: ${item.festival.date}`;
  }).join('\n');

  const prompt = `You are an expert in the Hindu Panchang (lunar calendar) with precise knowledge of tithi calculations for ${year}.

Your task: verify whether each festival date below matches its traditional tithi rule for the year ${year}.

For each festival:
- Check if the stored Gregorian date correctly corresponds to the tithi rule
- If correct, mark as verified
- If wrong, provide the correct Gregorian date
- If you are unsure (e.g. regional variation or ambiguous tithi boundary), mark as uncertain

IMPORTANT RULES:
- Tithi boundaries are determined by sunrise at a standard IST location (Ujjain/Varanasi)
- If the tithi spans midnight, the date when it prevails at sunrise is the observance day
- Regional variations are valid — flag them in the note, do not mark as mismatch if both dates are legitimate

Respond ONLY with a JSON array. No explanation outside the JSON.
Each object must have these exact fields:
  "name": string (exact festival name from input),
  "storedDate": string (the date from input, YYYY-MM-DD),
  "status": "verified" | "mismatch" | "uncertain",
  "suggestedDate": string | null (YYYY-MM-DD, only if mismatch),
  "confidence": "high" | "medium" | "low",
  "note": string (brief explanation, max 30 words)

Festivals to verify for ${year}:
${festivalList}

Respond with the JSON array only:`;

  let aiResults: Array<{
    name: string;
    storedDate: string;
    status: VerificationStatus;
    suggestedDate?: string | null;
    confidence: FestivalVerificationConfidence;
    note: string;
  }> = [];

  if (aiCheckable.length > 0) {
    try {
      const response = await generateWithProvider(
        { user: prompt, temperature: 0.1, reasoningEffort: 'low', maxOutputTokens: 1800 },
        { responseFormat: 'json' },
      );

      const match = response.text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          aiResults = parsed;
        }
      }
    } catch (err) {
      console.error('[festival-verify] AI call failed:', err);
      const notChecked: FestivalVerificationResult[] = aiCheckable.map((item) => ({
        name: item.festival.name,
        storedDate: item.festival.date,
        rule: item.rule.rule,
        status: 'not_checked',
        verificationType: item.rule.verificationType,
        confidence: 'low',
        note: 'AI verification unavailable — check manually',
      }));
      const combined = [...notChecked, ...manualReviewResults];
      return {
        year,
        runAt: new Date().toISOString(),
        totalChecked: combined.length,
        verified: 0,
        mismatches: 0,
        uncertain: 0,
        manualReview: manualReviewResults.length,
        results: combined,
      };
    }
  }

  // Merge AI results back with rule metadata
  const results: FestivalVerificationResult[] = aiCheckable.map(item => {
    const aiResult = aiResults.find(r => r.name === item.festival.name);
    if (!aiResult) {
      return {
        name: item.festival.name,
        storedDate: item.festival.date,
        rule: item.rule.rule,
        status: 'not_checked',
        verificationType: item.rule.verificationType,
        confidence: 'low',
        note: 'Not returned by AI — verify manually',
      };
    }
    return {
      name: item.festival.name,
      storedDate: item.festival.date,
      rule: item.rule.rule,
      status: aiResult.status,
      verificationType: item.rule.verificationType,
      suggestedDate: aiResult.suggestedDate ?? undefined,
      confidence: aiResult.confidence ?? 'medium',
      note: aiResult.note ?? '',
    };
  });

  const combinedResults = [...results, ...manualReviewResults];
  const verified = combinedResults.filter(r => r.status === 'verified').length;
  const mismatches = combinedResults.filter(r => r.status === 'mismatch').length;
  const uncertain = combinedResults.filter(r => r.status === 'uncertain').length;
  const manualReview = combinedResults.filter(r => r.status === 'manual_review').length;

  return {
    year,
    runAt: new Date().toISOString(),
    totalChecked: combinedResults.length,
    verified,
    mismatches,
    uncertain,
    manualReview,
    results: combinedResults,
  };
}
