/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Festival Date Verification via Pramana AI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two-layer verification for lunar-calendar festival dates:
 *   1. LUNAR_FESTIVAL_RULES — the tithi rule for each festival (source of truth
 *      for *what to check*, e.g. "Jyeshtha Krishna Amavasya")
 *   2. verifyFestivalDatesWithAI() — sends the rules + stored dates to a
 *      dedicated festival-audit provider policy (Gemini-first, then fallback).
 *      The AI cross-checks each date
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
import { CANONICAL_RULES } from '@/lib/calendar/rules';

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
  id?: string;
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
  auditStatus: 'completed' | 'failed';
  auditFailureReason?: string | null;
  results: FestivalVerificationResult[];
}

const AI_VERIFICATION_BATCH_SIZE = 8;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildVerificationPrompt(
  year: number,
  batch: Array<{
    festival: Festival;
    ruleText: string;
    verificationType: FestivalVerificationType;
    note?: string;
  }>
): string {
  const festivalList = batch.map((item, i) => {
    const ruleNote = item.note ? ` [Note: ${item.note}]` : '';
    return `${i + 1}. "${item.festival.name}" | Rule: ${item.ruleText}${ruleNote} | Stored date: ${item.festival.date}`;
  }).join('\n');

  return `You are an expert in the Hindu Panchang (lunar calendar) with precise knowledge of tithi calculations for ${year}.

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
}

function extractJsonArray(text: string): any[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed) ? parsed : [];
}

function getTithiName(index: number): string {
  const names = [
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
  ];
  if (index < 1 || index > 30) return `Tithi ${index}`;
  const paksha = index <= 15 ? 'Shukla' : 'Krishna';
  return `${paksha} ${names[index - 1]}`;
}

function formatCanonicalRuleText(rule: any): string {
  if (rule.rule_family === 'solar_fixed') {
    return `Solar fixed date: Month ${rule.solar_month}, Day ${rule.solar_day}`;
  }
  if (rule.rule_family === 'lunar_tithi') {
    if (rule.lunar_masa_name && rule.lunar_tithi_index !== undefined) {
      return `${rule.lunar_masa_name} ${getTithiName(rule.lunar_tithi_index)} (${rule.lunar_masa_name} Masa, Tithi Index ${rule.lunar_tithi_index})`;
    }
  }
  if (rule.rule_family === 'relative_to_other_observance') {
    return `Relative to ${rule.relative_base_slug} by ${rule.relative_offset_days} days`;
  }
  if (rule.rule_family === 'nakshatra_based') {
    return `Nakshatra based: Masa ${rule.lunar_masa_name || 'any'}, Nakshatra ${rule.nakshatra_name}`;
  }
  if (rule.rule_family === 'regional_calendar') {
    return `Regional calendar rule: Masa ${rule.lunar_masa_name || 'any'}, Tithi Index ${rule.lunar_tithi_index || 'any'}`;
  }
  return `Rule type: ${rule.rule_family}`;
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
  const toCheck: Array<{
    festival: Festival;
    ruleText: string;
    verificationType: FestivalVerificationType;
    note?: string;
  }> = [];

  for (const festival of festivals) {
    let ruleText = '';
    let verificationType: FestivalVerificationType | null = festival.verification_type || null;
    let ruleNote = '';

    const lRule = LUNAR_FESTIVAL_RULES.find(r => r.name === festival.name);
    const cRule = CANONICAL_RULES.find(r =>
      (festival.slug && r.slug === festival.slug) ||
      (festival.route_slug && r.route_slug === festival.route_slug) ||
      r.display_name === festival.name ||
      r.slug === festival.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    );

    if (lRule) {
      ruleText = lRule.rule;
      if (!verificationType) verificationType = lRule.verificationType;
      ruleNote = lRule.note || '';
    } else if (cRule) {
      ruleText = formatCanonicalRuleText(cRule);
      if (!verificationType) verificationType = cRule.verification_type;
      ruleNote = cRule.region ? `Regional: ${cRule.region}` : '';
    } else {
      if (!verificationType) {
        verificationType = 'manual_review' as any;
      }
      ruleText = `Unknown rule for ${festival.name}`;
    }

    toCheck.push({
      festival,
      ruleText,
      verificationType: verificationType!,
      note: ruleNote || undefined
    });
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
      auditStatus: 'completed',
      auditFailureReason: null,
      results: [],
    };
  }

  const solarFixedResults: FestivalVerificationResult[] = [];
  const aiCheckable: Array<{
    festival: Festival;
    ruleText: string;
    verificationType: FestivalVerificationType;
    note?: string;
  }> = [];
  const manualReviewResults: FestivalVerificationResult[] = [];

  for (const item of toCheck) {
    if (item.verificationType === 'solar_fixed') {
      solarFixedResults.push({
        id: item.festival.id,
        name: item.festival.name,
        storedDate: item.festival.date,
        rule: item.ruleText,
        status: 'verified',
        verificationType: 'solar_fixed',
        confidence: 'high',
        note: 'Solar fixed date — verified automatically.',
      });
    } else if (item.verificationType === 'lunar_tithi') {
      aiCheckable.push(item);
    } else {
      let customNote = 'Needs manual review because regional calendar practice can legitimately vary.';
      if (item.verificationType === 'nakshatra_based') {
        customNote = 'Needs manual calendar review — this observance is nakshatra-based.';
      } else if (item.verificationType === 'historical_commemoration') {
        customNote = 'Needs manual review — historical commemoration date.';
      } else if (item.note) {
        customNote = `Needs manual review. ${item.note}`;
      }
      manualReviewResults.push({
        id: item.festival.id,
        name: item.festival.name,
        storedDate: item.festival.date,
        rule: item.ruleText,
        status: 'manual_review',
        verificationType: item.verificationType,
        confidence: 'medium',
        note: customNote,
      });
    }
  }

  let aiResults: Array<{
    name: string;
    storedDate: string;
    status: VerificationStatus;
    suggestedDate?: string | null;
    confidence: FestivalVerificationConfidence;
    note: string;
  }> = [];
  let auditStatus: 'completed' | 'failed' = 'completed';
  let auditFailureReason: string | null = null;

  if (aiCheckable.length > 0) {
    const batchFailures: string[] = [];
    for (const batch of chunkArray(aiCheckable, AI_VERIFICATION_BATCH_SIZE)) {
      const prompt = buildVerificationPrompt(year, batch);
      try {
        const response = await generateWithProvider(
          { user: prompt, temperature: 0.1, reasoningEffort: 'none', maxOutputTokens: 1200 },
          { responseFormat: 'json', providerOverride: 'gemini-hosted' },
        );

        const parsed = extractJsonArray(response.text);
        const parsedByKey = new Map(
          parsed.map((row: any) => [`${row?.name ?? ''}::${row?.storedDate ?? ''}`, row])
        );

        for (const item of batch) {
          const key = `${item.festival.name}::${item.festival.date}`;
          const aiResult = parsedByKey.get(key);
          if (aiResult) {
            aiResults.push(aiResult);
          } else {
            const reason = 'AI did not return a result for this festival in the verification batch';
            batchFailures.push(`${item.festival.name}: ${reason}`);
            aiResults.push({
              name: item.festival.name,
              storedDate: item.festival.date,
              status: 'not_checked',
              confidence: 'low',
              note: reason,
            });
          }
        }
      } catch (err) {
        console.error('[festival-verify] AI call failed:', err);
        const reason = err instanceof Error ? err.message : String(err ?? 'AI verification unavailable');
        batchFailures.push(reason);
        aiResults.push(...batch.map((item) => ({
          name: item.festival.name,
          storedDate: item.festival.date,
          status: 'not_checked' as VerificationStatus,
          confidence: 'low' as FestivalVerificationConfidence,
          note: `AI verification unavailable — ${reason}`,
        })));
      }
    }

    if (batchFailures.length > 0) {
      auditStatus = 'failed';
      auditFailureReason = batchFailures.slice(0, 3).join(' | ');
    }
  }

  const results: FestivalVerificationResult[] = aiCheckable.map(item => {
    const aiResult = aiResults.find(r => r.name === item.festival.name && r.storedDate === item.festival.date);
    if (!aiResult) {
      return {
        id: item.festival.id,
        name: item.festival.name,
        storedDate: item.festival.date,
        rule: item.ruleText,
        status: 'not_checked',
        verificationType: item.verificationType,
        confidence: 'low',
        note: 'Not returned by AI — verify manually',
      };
    }
    return {
      id: item.festival.id,
      name: item.festival.name,
      storedDate: item.festival.date,
      rule: item.ruleText,
      status: aiResult.status,
      verificationType: item.verificationType,
      suggestedDate: aiResult.suggestedDate ?? undefined,
      confidence: aiResult.confidence ?? 'medium',
      note: aiResult.note ?? '',
    };
  });

  const combinedResults = [...solarFixedResults, ...results, ...manualReviewResults];
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
    auditStatus,
    auditFailureReason,
    results: combinedResults,
  };
}
