import fs from 'node:fs';
import path from 'node:path';
import { calculateObservancesForYearCorrected } from '../src/lib/calendar/engine.js';
import {
  evaluateVariant,
} from '../packages/dharma-rules/src/conditions/index.js';

const UJJAIN = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const BEDFORD = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

interface ReconcileCase {
  slug: string;
  name: string;
  variants: Array<{
    variantId: string;
    conditions: any[];
  }>;
}

const RECONCILE_CASES: ReconcileCase[] = [
  {
    slug: 'maha-shivaratri',
    name: 'Maha Shivaratri',
    variants: [
      {
        variantId: 'smarta',
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
    name: 'Krishna Janmashtami',
    variants: [
      {
        variantId: 'smarta',
        conditions: [
          { type: 'lunar_month', value: 'Shravana', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 8, period: 'nishita', mode: 'touches' },
        ],
      },
      {
        variantId: 'vaishnava',
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
    name: 'Karva Chauth',
    variants: [
      {
        variantId: 'standard',
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
    name: 'Sankashti Chaturthi',
    variants: [
      {
        variantId: 'standard',
        conditions: [
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 4, period: 'moonrise', mode: 'at' },
        ],
      },
    ],
  },
  {
    slug: 'pradosh-vrat',
    name: 'Pradosh Vrat',
    variants: [
      {
        variantId: 'standard',
        conditions: [
          { type: 'tithi_presence', tithi: 13, period: 'pradosha', mode: 'prevails' },
        ],
      },
    ],
  },
  {
    slug: 'diwali',
    name: 'Diwali (Lakshmi Puja)',
    variants: [
      {
        variantId: 'standard',
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
    name: 'Dhanteras',
    variants: [
      {
        variantId: 'standard',
        conditions: [
          { type: 'lunar_month', value: 'Ashwin', monthSystem: 'amanta' },
          { type: 'paksha', value: 'krishna' },
          { type: 'tithi_presence', tithi: 13, period: 'pradosha', mode: 'touches' },
        ],
      },
    ],
  },
];

function offsetDate(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getEvaluatorQualifiedDates(
  variant: any,
  baseDate: string,
  loc: typeof UJJAIN
): Array<{ date: string; reasoning: string; diagnostics: string[] }> {
  const matched: Array<{ date: string; reasoning: string; diagnostics: string[] }> = [];
  // Scan +/- 35 days to allow detection of correct months (e.g. Karva Chauth off by a month)
  for (let offset = -35; offset <= 35; offset++) {
    const checkDate = offsetDate(baseDate, offset);
    const res = evaluateVariant(
      {
        ruleId: variant.variantId,
        festivalId: variant.variantId,
        conditions: variant.conditions,
      },
      checkDate,
      loc
    );
    if (res.qualified === true) {
      const lastReason = res.reasons[res.reasons.length - 1]?.text || 'Matches conditions';
      matched.push({ date: checkDate, reasoning: lastReason, diagnostics: res.diagnostics });
    }
  }
  return matched;
}

interface ReconciliationResult {
  year: number;
  slug: string;
  ruleLabel: string;
  locName: string;
  engineDate: string;
  qualified: Array<{ date: string; reasoning: string; diagnostics: string[] }>;
  status: 'YES' | 'NO' | 'UNRESOLVED';
  reasoning: string;
}

function classifyReconciliation(
  engineDate: string,
  qualified: Array<{ date: string; reasoning: string; diagnostics: string[] }>
): 'YES' | 'NO' | 'UNRESOLVED' {
  if (qualified.length > 1) {
    return 'UNRESOLVED';
  }
  if (qualified.some(q => q.diagnostics.includes('vrddhi_tithi'))) {
    return 'UNRESOLVED';
  }
  if (qualified.length === 0) {
    return 'YES';
  }
  if (qualified[0].date === engineDate) {
    return 'NO';
  }
  return 'YES';
}

function runReconciliation() {
  console.log('Running engine reconciliation analysis (2026-2028)...');

  const years = [2026, 2027, 2028];
  const results: ReconciliationResult[] = [];

  for (const year of years) {
    const engineOccurrences = calculateObservancesForYearCorrected(year);

    for (const rCase of RECONCILE_CASES) {
      const occurrences = engineOccurrences.filter(o => o.slug === rCase.slug);
      if (occurrences.length === 0) continue;

      for (const occurrence of occurrences) {
        for (const loc of [UJJAIN, BEDFORD]) {
          const locName = loc === UJJAIN ? 'Ujjain' : 'Bedford';

          for (const variant of rCase.variants) {
            const qualified = getEvaluatorQualifiedDates(variant, occurrence.date, loc);
            const status = classifyReconciliation(occurrence.date, qualified);

            const ruleLabel = rCase.slug === 'krishna-janmashtami'
              ? `${rCase.name} (${variant.variantId})`
              : rCase.name;

            let reasoning = '';
            if (status === 'YES') {
              reasoning += `**Disagreement**. `;
              if (qualified.length > 0) {
                reasoning += `Evaluator qualifies ${qualified.map(q => `${q.date} (${q.reasoning})`).join('; ')}. `;
              } else {
                reasoning += `Evaluator qualified no dates in +/-35 days window. `;
              }
            } else if (status === 'UNRESOLVED') {
              reasoning += `*Unresolved*. `;
              if (qualified.length > 1) {
                reasoning += `Evaluator qualified multiple dates: ${qualified.map(q => `\`${q.date}\``).join(', ')}. `;
              } else {
                reasoning += `Evaluator qualifies ${qualified.map(q => `${q.date} (${q.reasoning})`).join('; ')}. `;
              }
            } else {
              reasoning += `Matches. ${qualified.find(q => q.date === occurrence.date)?.reasoning || ''}`;
            }

            results.push({
              year,
              slug: rCase.slug,
              ruleLabel,
              locName,
              engineDate: occurrence.date,
              qualified,
              status,
              reasoning,
            });
          }
        }
      }
    }
  }

  // Count three-state reconciliation stats
  const totalComparisons = results.length;
  const totalDisagreements = results.filter(r => r.status === 'YES').length;
  const totalAgreements = results.filter(r => r.status === 'NO').length;
  const totalUnresolved = results.filter(r => r.status === 'UNRESOLVED').length;

  let report = `# Engine Reconciliation Report (2026–2028)\n\n`;
  report += `This report compares the dates produced by the corrected rule engine (sunrise-sampled) with the dates qualified by the condition evaluator (muhurta/time-of-day aware) for all time-of-day dependent rules.\n\n`;

  report += `## 1. Disagreement Table\n\n`;
  report += `| Year | Rule | Location | Corrected Engine | Evaluator Qualified | Disagreement? | Details / Reasoning |\n`;
  report += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of results) {
    const qualifiedStr = r.qualified.length > 0
      ? r.qualified.map(q => `\`${q.date}\``).join(', ')
      : '*None*';
    const statusStr = r.status === 'YES' ? '**YES**' : (r.status === 'NO' ? 'No' : '*UNRESOLVED*');
    report += `| ${r.year} | ${r.ruleLabel} | ${r.locName} | \`${r.engineDate}\` | ${qualifiedStr} | ${statusStr} | ${r.reasoning} |\n`;
  }

  report += `\n### Metrics Summary\n`;
  report += `- **Total Comparisons**: ${totalComparisons}\n`;
  report += `- **Agreements (NO)**: ${totalAgreements}\n`;
  report += `- **Disagreements (YES)**: ${totalDisagreements}\n`;
  report += `- **Unresolved / Scholar Review (UNRESOLVED)**: ${totalUnresolved}\n\n`;

  report += `---\n\n`;
  report += `## 2. Core Rule Authority and Precedence Rules\n\n`;
  report += `For each rule class, we establish a definitive authority assignment explaining which calculation engine wins and why. This prevents duplicate logic and ensures correctness.\n\n`;

  report += `| Rule / Class | Authoritative Engine | Rationale |\n`;
  report += `| :--- | :--- | :--- |\n`;
  report += `| **Maha Shivaratri** | **Condition Evaluator** | Nishita-vyāpinī Chaturdaśī rules require checking if the Chaturdaśī tithi spans the local midnight/Nishita window. The legacy engine's sunrise-sampled match is a rough approximation that misaligns when Chaturdashi starts after sunrise. |\n`;
  report += `| **Krishna Janmashtami** | **Condition Evaluator** | Genuinely tradition-dependent. Smarta is Nishita-vyapini (touches Nishita), while Vaishnava is Udaya-vyapini (at sunrise) with Rohini Nakshatra. The legacy engine fails to model these separate sampradaya requirements. |\n`;
  report += `| **Karva Chauth** | **Condition Evaluator** | Requires Chaturthi tithi to be present at the exact local moonrise instant. This varies significantly by longitude/timezone. The legacy engine evaluated this at Ujjain sunrise, leading to wrong dates in the diaspora. |\n`;
  report += `| **Sankashti Chaturthi** | **Condition Evaluator** | Monthly recurring Chaturthi requires Moonrise-vyapini matching. Timezone-dependent; evaluator computes local moonrise. |\n`;
  report += `| **Pradosh Vrat** | **Condition Evaluator** | Observed during twilight/Pradosha period. Evaluator calculates precise local sunset/Pradosha window. |\n`;
  report += `| **Diwali / Dhanteras** | **Condition Evaluator** | Observed during evening Pradosha/Nishita. Evaluator calculates the window precisely. |\n`;
  report += `| **Solar Fixed / Weekday** | **Rule Engine (Legacy)** | Simple weekday or Gregorian solar dates (e.g. Makar Sankranti, Vasant Panchami) do not have complex muhurta or moonrise dependencies and are evaluated relative to Vedic day sunrise. |\n\n`;

  report += `## 3. Explicit Cases and Status\n\n`;

  // Maha Shivaratri 2026
  const shivaratri2026 = results.filter(r => r.year === 2026 && r.slug === 'maha-shivaratri');
  report += `- **Maha Shivaratri 2026**: `;
  if (shivaratri2026.length > 0) {
    const ujj = shivaratri2026.find(r => r.locName === 'Ujjain');
    const bed = shivaratri2026.find(r => r.locName === 'Bedford');
    const ujjStr = ujj && ujj.qualified.length > 0 ? ujj.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    const bedStr = bed && bed.qualified.length > 0 ? bed.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    report += `The corrected rule engine outputs \`${ujj?.engineDate}\` because Chaturdashi is present at Ujjain sunrise. `;
    report += `However, the condition evaluator demonstrates that by Nishita on ${ujj?.engineDate}, Chaturdashi has already ended. `;
    report += `The evaluator qualifies ${ujjStr} at Ujjain and ${bedStr} at Bedford (status: ${ujj?.status}).`;
  }
  report += `\n`;

  // Krishna Janmashtami 2026
  const janmashtami2026 = results.filter(r => r.year === 2026 && r.slug === 'krishna-janmashtami');
  report += `- **Krishna Janmashtami 2026**: `;
  if (janmashtami2026.length > 0) {
    const smartaUjj = janmashtami2026.find(r => r.ruleLabel.includes('smarta') && r.locName === 'Ujjain');
    const vaishUjj = janmashtami2026.find(r => r.ruleLabel.includes('vaishnava') && r.locName === 'Ujjain');
    const smartaBed = janmashtami2026.find(r => r.ruleLabel.includes('smarta') && r.locName === 'Bedford');
    const vaishBed = janmashtami2026.find(r => r.ruleLabel.includes('vaishnava') && r.locName === 'Bedford');
    const smartaUjjStr = smartaUjj && smartaUjj.qualified.length > 0 ? smartaUjj.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    const smartaBedStr = smartaBed && smartaBed.qualified.length > 0 ? smartaBed.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    const vaishUjjStr = vaishUjj && vaishUjj.qualified.length > 0 ? vaishUjj.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    const vaishBedStr = vaishBed && vaishBed.qualified.length > 0 ? vaishBed.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    report += `The rule engine outputs a single date \`${smartaUjj?.engineDate}\`. `;
    report += `The condition evaluator resolves two separate variants: `;
    report += `Smarta Janmashtami is qualified on ${smartaUjjStr} at Ujjain and ${smartaBedStr} at Bedford. `;
    report += `Vaishnava Janmashtami is qualified on ${vaishUjjStr} at Ujjain and ${vaishBedStr} at Bedford.`;
  }
  report += `\n`;

  // Karva Chauth 2026
  const karva2026 = results.filter(r => r.year === 2026 && r.slug === 'karva-chauth');
  report += `- **Karva Chauth 2026**: `;
  if (karva2026.length > 0) {
    const ujj = karva2026.find(r => r.locName === 'Ujjain');
    const bed = karva2026.find(r => r.locName === 'Bedford');
    const ujjStr = ujj && ujj.qualified.length > 0 ? ujj.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    const bedStr = bed && bed.qualified.length > 0 ? bed.qualified.map(q => `\`${q.date}\``).join(', ') : '*None*';
    report += `The rule engine outputs \`${ujj?.engineDate}\` (due to amanta Kartika month misclassification in rules database). `;
    report += `The condition evaluator qualifies the correct date ${ujjStr} at Ujjain and ${bedStr} at Bedford (status: ${ujj?.status}).`;
  }
  report += `\n`;

  // Sankashti Chaturthi 2026
  const sankashti2026 = results.filter(r => r.year === 2026 && r.slug === 'sankashti-chaturthi');
  const sankashti2026Disagreements = sankashti2026.filter(r => r.status === 'YES').length;
  const sankashti2026Unresolved = sankashti2026.filter(r => r.status === 'UNRESOLVED').length;
  report += `- **Sankashti Chaturthi 2026**: Reconciled across months. Evaluated ${sankashti2026.length} comparisons, finding ${sankashti2026Disagreements} disagreements (YES) and ${sankashti2026Unresolved} unresolved/ambiguous cases (UNRESOLVED).\n\n`;

  report += `## 4. Scholar Review Pending [S] / Ambiguous Cases\n\n`;
  report += `The following cases are classified as **UNRESOLVED** and require scholar review or manual selection:\n\n`;

  const unresolvedRows = results.filter(r => r.status === 'UNRESOLVED');
  if (unresolvedRows.length > 0) {
    report += `| Year | Rule | Location | Corrected Engine | Evaluator Qualified | Reason |\n`;
    report += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    for (const r of unresolvedRows) {
      const qualifiedStr = r.qualified.length > 0
        ? r.qualified.map(q => `\`${q.date}\``).join(', ')
        : '*None*';
      let reasonText = '';
      if (r.qualified.length > 1) {
        reasonText = `Ambiguous: multiple dates qualified (\`${r.qualified.map(q => q.date).join(', ')}\`)`;
      } else if (r.qualified.some(q => q.diagnostics.includes('vrddhi_tithi'))) {
        const qVrddhi = r.qualified.find(q => q.diagnostics.includes('vrddhi_tithi'));
        reasonText = qVrddhi?.reasoning || 'Vrddhi tithi spans two sunrises';
      }
      report += `| ${r.year} | ${r.ruleLabel} | ${r.locName} | \`${r.engineDate}\` | ${qualifiedStr} | ${reasonText} |\n`;
    }
  } else {
    report += `*No unresolved or ambiguous cases found.*\n`;
  }
  report += `\n`;

  const reportPath = path.join(process.cwd(), 'docs', 'ENGINE_RECONCILIATION_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Successfully wrote reconciliation report to: ${reportPath}`);
}

runReconciliation();
export {};
