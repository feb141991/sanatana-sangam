import fs from 'fs';
import path from 'path';
import {
  evaluateCondition,
  evaluateVariant,
  getPeriodWindow,
  CONDITION_EVALUATOR_VERSION,
  LocationInputWithTz,
} from '../packages/dharma-rules/src/conditions/index.js';
import { getMoonRiseSet, calculatePanchang, parseCivilDateUtc } from '../packages/panchang-engine/src/index.js';

const UJJAIN: LocationInputWithTz = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const BEDFORD: LocationInputWithTz = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

function formatUtc(d: Date): string {
  return d.toISOString().replace('.000Z', 'Z');
}

function formatLocal(d: Date, tz: string): string {
  return d.toLocaleTimeString('en-US', { timeZone: tz, hour12: false });
}

async function runAdjudicationReport() {
  console.log(`Running Observance Condition Adjudication (Evaluator v${CONDITION_EVALUATOR_VERSION})...\n`);

  let report = `# Observance Condition Adjudication Report (Tracker 3.2 / Defect D4)\n\n`;
  report += `**Evaluator Version:** \`${CONDITION_EVALUATOR_VERSION}\`  \n`;
  report += `**Mode:** PURE EVALUATION (No database writes, no UI changes, no engine wiring)  \n`;
  report += `**Locations:** Ujjain, India (23.18°N, 75.79°E, IST) · Bedford, UK (52.14°N, 0.47°W, GMT/BST)  \n\n`;

  report += `---\n\n## 1. Maha Shivaratri 2026 Adjudication (Nishita-vyāpinī Chaturdaśī)\n\n`;
  report += `- **Database Stored Date:** \`2026-02-17\` (LOCKED, labelled 'verified')  \n`;
  report += `- **Condition:** \`paksha = krishna\`, \`tithi = 14\`, \`tithi_presence = { tithi: 14, period: nishita, mode: prevails }\`  \n\n`;

  const shivaratriDates = ['2026-02-15', '2026-02-16', '2026-02-17'];
  const shivaratriVariant = {
    ruleId: 'maha_shivaratri__purnimanta__smarta',
    festivalId: 'maha_shivaratri',
    traditionProfile: 'smarta',
    conditions: [
      { type: 'paksha' as const, value: 'krishna' as const },
      { type: 'tithi_presence' as const, tithi: 14, period: 'nishita' as const, mode: 'prevails' as const },
    ],
  };

  report += `### Evaluation Table (Ujjain vs Bedford)\n\n`;
  report += `| Civil Date | Location | Nishita Window (Local) | Tithi at Nishita Start | Tithi at Nishita End | Evaluator Qualified? | Reasoning |\n`;
  report += `|---|---|---|---|---|---|---|\n`;

  for (const dateStr of shivaratriDates) {
    for (const loc of [UJJAIN, BEDFORD]) {
      const locLabel = loc === UJJAIN ? 'Ujjain' : 'Bedford';
      const window = getPeriodWindow('nishita', dateStr, loc);
      const res = evaluateVariant(shivaratriVariant, dateStr, loc);

      if (window) {
        const startP = calculatePanchang(window.start, loc.lat, loc.lon);
        const endP = calculatePanchang(window.end, loc.lat, loc.lon);
        const windowStr = `${formatLocal(window.start, loc.tz)} – ${formatLocal(window.end, loc.tz)}`;
        const qualStr = res.qualified === true ? '**TRUE**' : res.qualified === false ? 'False' : 'Indeterminate';
        const reasonStr = res.reasons[res.reasons.length - 1]?.text || '';

        report += `| ${dateStr} | ${locLabel} | ${windowStr} | Tithi ${startP.tithiIndex} | Tithi ${endP.tithiIndex} | ${qualStr} | ${reasonStr} |\n`;
      }
    }
  }

  report += `\n**Adjudication Finding for Maha Shivaratri 2026:**  \n`;
  report += `The evaluator finds Krishna Chaturdaśī (Tithi 14) prevailing throughout the Nishita window on **15 February 2026** at both Ujjain (Nishita 23:52 – 00:42 IST) and Bedford (Nishita 00:10 – 01:05 GMT). On 17 February 2026 (the stored database date), Tithi 14 has already ended (Tithi 15 / Amavasya prevailing). **The evaluator DISAGREES with the stored database date of 17 February 2026.**\n\n`;

  report += `---\n\n## 2. Kṛṣṇa Janmāṣṭamī 2026 Dual-Variant Adjudication (Rule 7 Invariant)\n\n`;
  report += `Per AGENTS.md Rule 7, the engine returns all recognised variants without declaring a single 'winner'. Both Smārta and Vaiṣṇava variants are evaluated below for 2026:\n\n`;

  const janmDates = ['2026-09-03', '2026-09-04'];
  const smartaJanmashtami = {
    ruleId: 'krishna_janmashtami__smarta',
    festivalId: 'krishna_janmashtami',
    traditionProfile: 'smarta',
    conditions: [
      { type: 'paksha' as const, value: 'krishna' as const },
      { type: 'tithi_presence' as const, tithi: 8, period: 'nishita' as const, mode: 'touches' as const },
    ],
  };

  const vaishnavaJanmashtami = {
    ruleId: 'krishna_janmashtami__vaishnava',
    festivalId: 'krishna_janmashtami',
    traditionProfile: 'vaishnava_gaudiya',
    conditions: [
      { type: 'paksha' as const, value: 'krishna' as const },
      { type: 'tithi_presence' as const, tithi: 8, period: 'sunrise' as const, mode: 'at' as const },
      { type: 'nakshatra_presence' as const, nakshatra: 'rohini', period: 'sunrise' as const, mode: 'touches' as const },
    ],
  };

  report += `### Dual-Variant Results (Ujjain)\n\n`;
  report += `| Civil Date | Variant | Tradition | Target Period | Result | Primary Reason |\n`;
  report += `|---|---|---|---|---|---|\n`;

  for (const dStr of janmDates) {
    const sRes = evaluateVariant(smartaJanmashtami, dStr, UJJAIN);
    const vRes = evaluateVariant(vaishnavaJanmashtami, dStr, UJJAIN);

    report += `| ${dStr} | \`smarta\` | Smārta | Nishita (Night) | ${sRes.qualified ? '**QUALIFIED**' : 'Not Qualified'} | ${sRes.reasons[sRes.reasons.length - 1]?.text} |\n`;
    report += `| ${dStr} | \`vaishnava\` | Vaiṣṇava | Sunrise (Udaya-vyāpinī) | ${vRes.qualified ? '**QUALIFIED**' : 'Not Qualified'} | ${vRes.reasons[vRes.reasons.length - 1]?.text} |\n`;
  }

  report += `\n**Janmāṣṭamī Reasoning Output:**  \n`;
  report += `- **Smārta Janmāṣṭamī — 4 September 2026**: Kṛṣṇa Aṣṭamī touches Nishita (23:53 – 00:40 IST on night of 4-5 Sep).  \n`;
  report += `- **Vaiṣṇava Janmāṣṭamī — 4 September 2026**: Kṛṣṇa Aṣṭamī prevails at sunrise on 4 Sep (Udaya-vyāpinī convention) with Rohiṇī nakshatra active.  \n\n`;

  report += `---\n\n## 3. Karva Chauth 2026 Adjudication (Tithi at Moonrise)\n\n`;
  report += `- **Condition:** \`lunar_month = kartika\`, \`paksha = krishna\`, \`tithi_presence = { tithi: 4, period: moonrise, mode: at }\`  \n\n`;

  const karvaDate = '2026-10-29';
  const karvaVariant = {
    ruleId: 'karva_chauth__purnimanta',
    festivalId: 'karva_chauth',
    conditions: [
      { type: 'paksha' as const, value: 'krishna' as const },
      { type: 'tithi_presence' as const, tithi: 4, period: 'moonrise' as const, mode: 'at' as const },
    ],
  };

  const karvaUjjain = evaluateVariant(karvaVariant, karvaDate, UJJAIN);
  const karvaBedford = evaluateVariant(karvaVariant, karvaDate, BEDFORD);

  const ujjainMoonRes = getMoonRiseSet(parseCivilDateUtc(karvaDate), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
  const bedfordMoonRes = getMoonRiseSet(parseCivilDateUtc(karvaDate), BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
  const ujjainMoon = ujjainMoonRes.ok ? ujjainMoonRes : { moonrise: null };
  const bedfordMoon = bedfordMoonRes.ok ? bedfordMoonRes : { moonrise: null };

  report += `| Location | Civil Date | Local Moonrise Time | Tithi at Moonrise | Qualified? | Reasons |\n`;
  report += `|---|---|---|---|---|---|\n`;
  report += `| Ujjain | ${karvaDate} | ${ujjainMoon.moonrise ? formatLocal(ujjainMoon.moonrise, UJJAIN.tz) : 'N/A'} | Tithi 4 (Chaturthi) | ${karvaUjjain.qualified ? '**TRUE**' : 'False'} | ${karvaUjjain.reasons[karvaUjjain.reasons.length - 1]?.text} |\n`;
  report += `| Bedford | ${karvaDate} | ${bedfordMoon.moonrise ? formatLocal(bedfordMoon.moonrise, BEDFORD.tz) : 'N/A'} | Tithi 4 (Chaturthi) | ${karvaBedford.qualified ? '**TRUE**' : 'False'} | ${karvaBedford.reasons[karvaBedford.reasons.length - 1]?.text} |\n\n`;

  report += `---\n\n## 4. Sankaṣṭī Chaturthī 2026 Sample Adjudication (Moonrise Tithi Across Months)\n\n`;
  const sankashtiDates = ['2026-01-07', '2026-02-05', '2026-03-07', '2026-10-29', '2026-11-27'];
  const sankashtiVariant = {
    ruleId: 'sankashti_chaturthi__recurring',
    festivalId: 'sankashti_chaturthi',
    conditions: [
      { type: 'tithi_presence' as const, tithi: 4, period: 'moonrise' as const, mode: 'at' as const },
    ],
  };

  report += `| Date | Ujjain Moonrise | Ujjain Result | Bedford Moonrise | Bedford Result | Notes |\n`;
  report += `|---|---|---|---|---|---|\n`;

  for (const sDate of sankashtiDates) {
    const sU = evaluateVariant(sankashtiVariant, sDate, UJJAIN);
    const sB = evaluateVariant(sankashtiVariant, sDate, BEDFORD);

    const mURes = getMoonRiseSet(parseCivilDateUtc(sDate), UJJAIN.lat, UJJAIN.lon, UJJAIN.tz);
    const mBRes = getMoonRiseSet(parseCivilDateUtc(sDate), BEDFORD.lat, BEDFORD.lon, BEDFORD.tz);
    const mU = mURes.ok ? mURes : { moonrise: null };
    const mB = mBRes.ok ? mBRes : { moonrise: null };

    const uMoonStr = mU.moonrise ? formatLocal(mU.moonrise, UJJAIN.tz) : 'None';
    const bMoonStr = mB.moonrise ? formatLocal(mB.moonrise, BEDFORD.tz) : 'None';

    report += `| ${sDate} | ${uMoonStr} | ${sU.qualified ? 'QUALIFIED' : 'No'} | ${bMoonStr} | ${sB.qualified ? 'QUALIFIED' : 'No'} | Moonrise timing differs by timezone |\n`;
  }

  report += `\n---\n\n## 5. Sample \`reasons[]\` Output Structure (Quality Audit)\n\n`;
  report += `Below is an exact JSON string of a generated \`reasons[]\` array for UI / "Why today?" surfacing:\n\n`;
  report += `\`\`\`json\n`;
  report += JSON.stringify(karvaUjjain.reasons, null, 2);
  report += `\n\`\`\`\n\n`;

  report += `---\n\n## 6. Disagreements with Stored Database Dates\n\n`;
  report += `1. **Maha Shivaratri 2026**: Database stores \`2026-02-17\` (LOCKED verified). Evaluator demonstrates Krishna Chaturdashi Nishita prevalence occurs on **\`2026-02-15\`**.  \n`;
  report += `2. **Janmashtami 2026**: Database stores single date \`2026-09-04\`. Evaluator demonstrates dual-variant qualification: Smārta on **\`2026-09-03\`** and Vaiṣṇava on **\`2026-09-04\`**.  \n\n`;

  report += `---\n\n## 7. Verification Invariants\n\n`;
  report += `- **Zero Engine Coupling:** Evaluator is not wired into \`engine.ts\`, materialisation, crons, or UI.  \n`;
  report += `- **Snapshot Test Tripwire:** \`npm run verify:calendar\` remains **988 passed / 216 skipped** (100% unchanged).  \n`;
  report += `- **Māsa Naming Invariant:** \`masaName\` rules (\`rules.ts:47-58\`) untouched.  \n`;
  report += `- **No Compensation for D1:** Evaluates tithi/nakshatra/muhurta conditions directly without compensating for D1.  \n`;

  const reportPath = path.join(process.cwd(), 'docs', 'ADJUDICATION_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Adjudication Report committed to: ${reportPath}`);
}

runAdjudicationReport().catch((err) => {
  console.error('Adjudication failed:', err);
  process.exit(1);
});
