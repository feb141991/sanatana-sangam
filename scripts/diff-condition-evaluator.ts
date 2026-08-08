import fs from 'node:fs';
import path from 'node:path';
import { calculateObservancesForYear } from '../src/lib/calendar/engine';
import { evaluateVariant } from '../packages/dharma-rules/src/conditions/index.js';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const LOCATIONS = [
  { name: 'Ujjain', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  { name: 'Bedford', lat: 52.1356, lon: -0.4685, tz: 'Europe/London' },
  { name: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
];

const EVALUATOR_RULES = [
  {
    slug: 'maha-shivaratri',
    windowDays: 15,
    variants: [
      {
        variantId: 'smarta',
        spiritualTradition: 'smarta',
        isPrimary: true,
        conditions: [
          { type: 'lunar_month', value: 'Magha', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 14, period: 'nishita', mode: 'prevails' },
        ],
      },
    ],
  },
  {
    slug: 'krishna-janmashtami',
    windowDays: 15,
    variants: [
      {
        variantId: 'smarta',
        spiritualTradition: 'smarta',
        isPrimary: true,
        conditions: [
          { type: 'lunar_month', value: 'Shravana', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 8, period: 'nishita', mode: 'touches' },
        ],
      },
      {
        variantId: 'vaishnava',
        spiritualTradition: 'vaishnava_gaudiya',
        isPrimary: false,
        conditions: [
          { type: 'lunar_month', value: 'Shravana', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 8, period: 'sunrise', mode: 'at' },
          { type: 'nakshatra_presence', nakshatra: 'rohini', period: 'sunrise', mode: 'touches' },
        ],
      },
    ],
  },
  {
    slug: 'karva-chauth',
    windowDays: 35,
    variants: [
      {
        variantId: 'standard',
        spiritualTradition: 'standard',
        isPrimary: true,
        conditions: [
          { type: 'lunar_month', value: 'Ashwin', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 4, period: 'moonrise', mode: 'at' },
        ],
      },
    ],
  },
  {
    slug: 'sankashti-chaturthi',
    windowDays: 5,
    isRecurring: true,
    variants: [
      {
        variantId: 'standard',
        spiritualTradition: 'standard',
        isPrimary: true,
        conditions: [
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 4, period: 'moonrise', mode: 'at' },
        ],
      },
    ],
  },
  {
    slug: 'pradosh-vrat',
    windowDays: 5,
    isRecurring: true,
    variants: [
      {
        variantId: 'standard',
        spiritualTradition: 'standard',
        isPrimary: true,
        conditions: [
          { type: 'tithi_presence', tithi: 13, period: 'pradosha', mode: 'prevails' },
        ],
      },
    ],
  },
  {
    slug: 'diwali',
    windowDays: 35,
    variants: [
      {
        variantId: 'standard',
        spiritualTradition: 'standard',
        isPrimary: true,
        conditions: [
          { type: 'lunar_month', value: 'Ashwin', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 15, period: 'pradosha', mode: 'touches' },
        ],
      },
    ],
  },
  {
    slug: 'dhanteras',
    windowDays: 35,
    variants: [
      {
        variantId: 'standard',
        spiritualTradition: 'standard',
        isPrimary: true,
        conditions: [
          { type: 'lunar_month', value: 'Ashwin', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 13, period: 'pradosha', mode: 'touches' },
        ],
      },
    ],
  },
];

function offsetDateStr(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// Evaluates a rule variant for a given location, target candidate date, and window size.
// Returns the resolved date string or 'UNRESOLVED' / 'EXCLUDED (VRDDHI)' / 'EXCLUDED (NONE)' / 'EXCLUDED (MULTIPLE)'.
function resolveDateForLocation(
  slug: string,
  variant: any,
  candidateDate: string,
  windowDays: number,
  loc: typeof LOCATIONS[0]
): { status: string; date: string | null; diagnostics: string[]; reasoning: string } {
  const qualified: Array<{ date: string; reasoning: string; diagnostics: string[] }> = [];

  for (let offset = -windowDays; offset <= windowDays; offset++) {
    const checkDate = offsetDateStr(candidateDate, offset);
    const res = evaluateVariant(
      {
        ruleId: variant.variantId,
        festivalId: slug,
        traditionProfile: variant.spiritualTradition,
        conditions: variant.conditions,
      },
      checkDate,
      loc
    );

    if (res.qualified === true) {
      const lastReason = res.reasons[res.reasons.length - 1]?.text || 'Matches conditions';
      qualified.push({
        date: checkDate,
        reasoning: lastReason,
        diagnostics: res.diagnostics,
      });
    }
  }

  if (qualified.length === 0) {
    return { status: 'EXCLUDED (NONE)', date: null, diagnostics: [], reasoning: 'No qualified date found in window.' };
  }

  if (qualified.length > 1) {
    return {
      status: 'EXCLUDED (MULTIPLE)',
      date: null,
      diagnostics: Array.from(new Set(qualified.flatMap(q => q.diagnostics))),
      reasoning: `Ambiguous: multiple dates qualified (${qualified.map(q => q.date).join(', ')}).`,
    };
  }

  const match = qualified[0];
  if (match.diagnostics.includes('vrddhi_tithi')) {
    return {
      status: 'EXCLUDED (VRDDHI)',
      date: null,
      diagnostics: match.diagnostics,
      reasoning: `Scholar review pending: Vrddhi tithi spans two sunrises (qualified on ${match.date}).`,
    };
  }

  return {
    status: 'RESOLVED',
    date: match.date,
    diagnostics: match.diagnostics,
    reasoning: match.reasoning,
  };
}

async function run() {
  console.log('Generating Condition Evaluator Shadow Diff Report (2026–2028)...');

  const years = [2026, 2027, 2028];
  let report = `# Condition Evaluator Shadow Diff Report\n\n`;
  report += `This report lists every date that shifts or is excluded under the condition evaluator path (\`USE_CONDITION_EVALUATOR = true\`) compared to the rule engine baseline that \`calculateOccurrencesWithEvaluator\` actually uses (gate-dependent: legacy while \`USE_CORRECTED_MASA\` is false, corrected once it is true), across Ujjain, Bedford, London, New York, and Sydney.\n\n`;

  report += `## 1. Summary of Authority and Exclusion Rules\n\n`;
  report += `- **Precedence assignment:** The condition evaluator rules are applied to the 7 time-of-day/muhurta dependent rules.\n`;
  report += `- **Exclusion rule:** If the evaluator cannot settle a case (0 qualified dates, >1 qualified dates, or \`vrddhi_tithi\` diagnostic), the row is **EXCLUDED** from materialization and must be manually resolved by scholar review.\n`;
  report += `- **Relative rules alignment:** Any rules relative to Diwali (e.g. Govardhan Puja, Bhai Dooj) are automatically shifted based on Diwali's evaluator-resolved date.\n\n`;

  report += `## 2. Occurrence Diff Table (2026–2028)\n\n`;
  report += `| Year | Rule | Location | Corrected Engine | Evaluator Resolved | Status | Details / Reasoning |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  let totalChanged = 0;
  let totalExcluded = 0;

  for (const year of years) {
    const baseline = calculateObservancesForYear(year);

    for (const eRule of EVALUATOR_RULES) {
      const candidates = baseline.filter(occ => occ.slug === eRule.slug);
      if (candidates.length === 0) continue;

      for (const candidate of candidates) {
        for (const loc of LOCATIONS) {
          for (const variant of eRule.variants) {
            const res = resolveDateForLocation(eRule.slug, variant, candidate.date, eRule.windowDays, loc);

            const ruleLabel = eRule.slug === 'krishna-janmashtami'
              ? `${eRule.slug} (${variant.variantId})`
              : eRule.slug;

            let changeStatus = 'Unchanged';
            let print = false;

            if (res.status !== 'RESOLVED') {
              changeStatus = `**${res.status}**`;
              totalExcluded++;
              print = true;
            } else if (res.date !== candidate.date) {
              changeStatus = `**SHIFTED** (${res.date})`;
              totalChanged++;
              print = true;
            }

            if (print) {
              const evalDate = res.date ? `\`${res.date}\`` : '*None*';
              report += `| ${year} | \`${ruleLabel}\` | ${loc.name} | \`${candidate.date}\` | ${evalDate} | ${changeStatus} | ${res.reasoning} |\n`;
            }
          }
        }
      }
    }

    // Cache resolved Diwali dates to avoid redundant heavy astronomy lookups
    const diwaliResolutionCache = new Map<string, ReturnType<typeof resolveDateForLocation>>();

    // Also trace relative rules shifts
    for (const rule of CANONICAL_RULES) {
      if (rule.rule_family === 'relative_to_other_observance' && rule.relative_base_slug === 'diwali') {
        const diwaliCandidates = baseline.filter(occ => occ.slug === 'diwali');
        const offset = rule.relative_offset_days || 0;

        for (const candidate of diwaliCandidates) {
          for (const loc of LOCATIONS) {
            const diwaliVariant = EVALUATOR_RULES.find(r => r.slug === 'diwali')?.variants[0];
            if (!diwaliVariant) continue;

            const cacheKey = `${year}:${loc.name}:${candidate.date}`;
            let res = diwaliResolutionCache.get(cacheKey);
            if (!res) {
              res = resolveDateForLocation('diwali', diwaliVariant, candidate.date, 35, loc);
              diwaliResolutionCache.set(cacheKey, res);
            }

            let changeStatus = 'Unchanged';
            let print = false;
            let reasoning = '';
            let resolvedDateStr = '*None*';

            if (res.status !== 'RESOLVED') {
              changeStatus = `**EXCLUDED (BASE EXCLUDED)**`;
              reasoning = `Base Diwali is unresolved/excluded at ${loc.name}.`;
              print = true;
            } else {
              const engineRelDate = offsetDateStr(candidate.date, offset);
              const resolvedRelDate = offsetDateStr(res.date!, offset);

              if (engineRelDate !== resolvedRelDate) {
                changeStatus = `**SHIFTED** (${resolvedRelDate})`;
                resolvedDateStr = `\`${resolvedRelDate}\``;
                reasoning = `Shifted because base Diwali shifted from \`${candidate.date}\` to \`${res.date}\`.`;
                totalChanged++;
                print = true;
              }
            }

            if (print) {
              report += `| ${year} | \`${rule.slug}\` | ${loc.name} | \`${offsetDateStr(candidate.date, offset)}\` | ${resolvedDateStr} | ${changeStatus} | ${reasoning} |\n`;
            }
          }
        }
      }
    }
  }

  report += `\n### Statistics Summary\n`;
  report += `- **Total shifted dates (across 5 locations)**: ${totalChanged}\n`;
  report += `- **Total excluded dates (ambiguous/vrddhi/no-match)**: ${totalExcluded}\n\n`;

  const reportPath = path.join(process.cwd(), 'docs', 'CONDITION_EVALUATOR_SHADOW_DIFF.md');
  const docsDir = path.dirname(reportPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Successfully wrote shadow diff report to: ${reportPath}`);
}

run().catch(err => {
  console.error('Error running shadow diff:', err);
  process.exit(1);
});
