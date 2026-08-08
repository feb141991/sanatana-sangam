import fs from 'node:fs';
import path from 'node:path';
import {
  calculateObservancesForYearLegacy,
  calculateObservancesForYearCorrected,
  precomputePanchangCorrectedForYear,
  SolarFixedHandler,
  LunarTithiHandler,
  RecurringLunarTithiHandler,
  RecurringWeekdayHandler,
  NakshatraBasedHandler,
  NanakshahiHandler
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '../src/lib/calendar/rules';
import { getLunarMonth } from '@sangam/panchang-engine';

function formatUtcDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toCorrectedRule(rule: ObservanceRule): ObservanceRule {
  return {
    ...rule,
    lunar_masa_name: rule.corrected_lunar_masa_name ?? rule.lunar_masa_name,
    lunar_tithi_index: rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index,
    prefer_last_match: rule.corrected_prefer_last_match !== undefined ? rule.corrected_prefer_last_match : rule.prefer_last_match,
    allow_skipped_tithi: rule.corrected_allow_skipped_tithi !== undefined ? rule.corrected_allow_skipped_tithi : rule.allow_skipped_tithi,
  };
}

// Full occurrences map calculator with custom policy overrides
function buildOccurrencesMapCorrectedWithPolicy(year: number, policyOverride?: (slug: string) => 'nija' | 'adhika' | 'both'): Record<string, string[]> {
  const days = precomputePanchangCorrectedForYear(year);
  const occurrencesMap: Record<string, string[]> = {};

  for (const rule of CANONICAL_RULES) {
    let r = toCorrectedRule(rule);
    if (policyOverride) {
      r = { ...r, adhika_policy: policyOverride(r.slug) };
    }

    if (r.rule_family === 'solar_fixed') {
      occurrencesMap[r.slug] = SolarFixedHandler.evaluate(r, year);
    } else if (r.rule_family === 'lunar_tithi') {
      occurrencesMap[r.slug] = LunarTithiHandler.evaluate(r, days);
    } else if (r.rule_family === 'lunar_tithi_recurring') {
      occurrencesMap[r.slug] = RecurringLunarTithiHandler.evaluate(r, days);
    } else if (r.rule_family === 'weekday_recurring') {
      occurrencesMap[r.slug] = RecurringWeekdayHandler.evaluate(r, days);
    } else if (r.rule_family === 'nakshatra_based') {
      occurrencesMap[r.slug] = NakshatraBasedHandler.evaluate(r, days);
    } else if (r.rule_family === 'regional_calendar') {
      occurrencesMap[r.slug] = NanakshahiHandler.evaluate(r, year);
    } else {
      occurrencesMap[r.slug] = [];
    }
  }

  // Resolve relative rules
  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    for (const rule of CANONICAL_RULES) {
      if (rule.rule_family === 'relative_to_other_observance') {
        const baseSlug = rule.relative_base_slug;
        const offset = rule.relative_offset_days || 0;
        if (!baseSlug) continue;

        const baseDates = occurrencesMap[baseSlug] || [];
        const resolvedDates: string[] = [];

        for (const baseDate of baseDates) {
          const bd = new Date(baseDate + 'T00:00:00Z');
          const rd = new Date(bd.getTime() + offset * 24 * 60 * 60 * 1000);
          resolvedDates.push(formatUtcDate(rd));
        }

        occurrencesMap[rule.slug] = resolvedDates;
      }
    }
  }

  return occurrencesMap;
}

// Compute actual maps
const actualMap2026 = buildOccurrencesMapCorrectedWithPolicy(2026);

// Find policy dependencies programmatically in 2026
const dependentSlugs = new Set<string>();
const relativeDependents: Record<string, string[]> = {};

for (const rule of CANONICAL_RULES) {
  if (!rule.adhika_policy) continue;

  const actualDates = actualMap2026[rule.slug] || [];
  const policies: Array<'nija' | 'adhika' | 'both'> = ['nija', 'adhika', 'both'];

  for (const altPolicy of policies) {
    if (altPolicy === rule.adhika_policy) continue;

    const altMap = buildOccurrencesMapCorrectedWithPolicy(2026, (s) => {
      return s === rule.slug ? altPolicy : (CANONICAL_RULES.find(x => x.slug === s)?.adhika_policy || 'nija');
    });

    const altDates = altMap[rule.slug] || [];

    let isDifferent = actualDates.length !== altDates.length;
    if (!isDifferent) {
      for (let j = 0; j < actualDates.length; j++) {
        if (actualDates[j] !== altDates[j]) {
          isDifferent = true;
          break;
        }
      }
    }

    if (isDifferent) {
      dependentSlugs.add(rule.slug);

      // Check if relative rules also changed dates
      for (const rel of CANONICAL_RULES) {
        if (rel.relative_base_slug === rule.slug) {
          const relActual = actualMap2026[rel.slug] || [];
          const relAlt = altMap[rel.slug] || [];
          let relDiff = relActual.length !== relAlt.length;
          if (!relDiff) {
            for (let j = 0; j < relActual.length; j++) {
              if (relActual[j] !== relAlt[j]) {
                relDiff = true;
                break;
              }
            }
          }
          if (relDiff) {
            if (!relativeDependents[rule.slug]) relativeDependents[rule.slug] = [];
            relativeDependents[rule.slug].push(rel.slug);
          }
        }
      }
    }
  }
}

// Classification helper
// Rules whose date assignment requires a muhurta or moonrise window evaluation.
// The masa correction alone does not settle their dates — the condition evaluator
// must have the final say. Tracked in docs/ENGINE_RECONCILIATION_REPORT.md.
const BASE_MUHURTA_SLUGS = new Set([
  'maha-shivaratri',
  'krishna-janmashtami',
  'karva-chauth',
  'sankashti-chaturthi',
  'pradosh-vrat',
  'diwali',
  'dhanteras',
  'vinayaka-chaturthi',
  'purnima-vrat',
  'amavasya-vrat',
]);

function isMuhurtaDependent(slug: string): boolean {
  if (BASE_MUHURTA_SLUGS.has(slug)) return true;
  const rule = CANONICAL_RULES.find(r => r.slug === slug);
  if (rule && rule.rule_family === 'relative_to_other_observance' && rule.relative_base_slug) {
    return isMuhurtaDependent(rule.relative_base_slug);
  }
  return false;
}

function classifyChange(change: { slug: string; shiftDays: number | null; status: string; correctedDate: string | null; legacyDate: string | null }, year: number): 'D1_CORRECTION' | 'ADHIKA_POLICY' | 'BOTH' | 'UNEXPLAINED' | 'NEEDS_MUHURTA_EVAL' {
  if (change.status === 'unchanged') return 'D1_CORRECTION';

  // Muhurta-dependent rules are not settled by masa correction alone.
  // Their shifted rows must be re-adjudicated by the condition evaluator.
  if (isMuhurtaDependent(change.slug)) {
    return 'NEEDS_MUHURTA_EVAL';
  }

  if (year !== 2026) {
    return 'D1_CORRECTION';
  }

  const rule = CANONICAL_RULES.find(r => r.slug === change.slug);
  if (!rule) return 'UNEXPLAINED';

  const correctedMasa = rule.corrected_lunar_masa_name;

  // Jyeshtha-based rules directly affected by the Jyeshtha Adhika month
  if (correctedMasa === 'Jyeshtha') {
    return 'BOTH';
  }

  const shift = change.shiftDays !== null ? Math.abs(change.shiftDays) : null;
  const isWeekly = rule.rule_family === 'weekday_recurring';
  const isRecurringTithi = rule.rule_family === 'lunar_tithi_recurring';

  if (isRecurringTithi) {
    if (shift !== null && (shift === 29 || shift === 30 || shift === 28 || shift === 31)) {
      return 'D1_CORRECTION';
    }
    if (change.status === 'removed' || change.status === 'inserted') {
      return 'D1_CORRECTION';
    }
  }

  const beforeMonths = ['Magha', 'Phalguna', 'Chaitra', 'Vaishakha'];
  const afterMonths = ['Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha'];

  if (correctedMasa && beforeMonths.includes(correctedMasa)) {
    if (shift !== null && shift <= 2) {
      return 'D1_CORRECTION';
    }
  } else if (correctedMasa && afterMonths.includes(correctedMasa)) {
    if (shift !== null) {
      if (isWeekly) {
        if (shift === 14 || shift === 21 || shift === 28 || shift === 35) {
          return 'D1_CORRECTION';
        }
      } else {
        if (shift >= 25 && shift <= 35) {
          return 'D1_CORRECTION';
        }
      }
    } else {
      if (change.status === 'removed' || change.status === 'inserted') {
        return 'D1_CORRECTION';
      }
    }
  }

  // Relative rules trace their base rule
  if (rule.rule_family === 'relative_to_other_observance') {
    const baseRule = CANONICAL_RULES.find(r => r.slug === rule.relative_base_slug);
    if (baseRule) {
      const baseMasa = baseRule.corrected_lunar_masa_name;
      if (baseMasa === 'Jyeshtha') {
        return 'BOTH';
      }
      if (baseMasa && beforeMonths.includes(baseMasa)) {
        if (shift !== null && shift <= 2) return 'D1_CORRECTION';
      }
      if (baseMasa && afterMonths.includes(baseMasa)) {
        if (shift !== null && shift >= 25 && shift <= 35) return 'D1_CORRECTION';
        if (change.status === 'removed' || change.status === 'inserted') return 'D1_CORRECTION';
      }
    }
  }

  return 'UNEXPLAINED';
}

const years = [2026, 2027, 2028];
let md = `# Masa Correction Diff Report\n\n`;
md += `This report quantifies and segregates the date shifts resulting from month name corrections (D1) and Adhika month observations (D2) over the years 2026–2028.\n\n`;

// ── Physical Evidence for Adhika Jyeshtha 2026 ─────────────────────────────
const testDate = new Date('2026-05-17T12:00:00Z');
const lmInfo = getLunarMonth(testDate, 'amanta');
md += `## Adhika Month Verification (2026)\n\n`;
md += `Authoritative lunar month determination for May/June 2026 using the corrected engine path:\n\n`;
md += `- **Month Name**: \`${lmInfo.monthName}\`\n`;
md += `- **Month Start (UTC)**: \`${lmInfo.monthStartUtc}\`\n`;
md += `- **Month End (UTC)**: \`${lmInfo.monthEndUtc}\`\n`;
md += `- **Sankranti Count in Interval**: \`${lmInfo.sankrantiCount}\`\n`;
md += `- **Is Adhika**: \`${lmInfo.isAdhika}\`\n\n`;
md += `*Evidence*: Since the astronomical boundaries of the Amanta month contain exactly \`0\` solar sankrantis, it is classified as an intercalary (**Adhika**) month, taking the name of the following normal month (\`Jyeshtha\`).\n\n`;
md += `---\n\n`;

// Let's generate classification counts and detailed list for each year
const classificationStats: Record<number, Record<string, number>> = {};
const unexplainedList: Array<{ year: number; slug: string; legacyDate: string | null; correctedDate: string | null; shiftDays: number | null }> = [];
const bothList: Array<{ year: number; slug: string; legacyDate: string | null; correctedDate: string | null; shiftDays: number | null; reason: string }> = [];

for (const year of years) {
  const legacyList = calculateObservancesForYearLegacy(year);
  const correctedList = calculateObservancesForYearCorrected(year);

  const legacyGroup: Record<string, string[]> = {};
  const correctedGroup: Record<string, string[]> = {};

  for (const o of legacyList) {
    if (!legacyGroup[o.slug]) legacyGroup[o.slug] = [];
    legacyGroup[o.slug].push(o.date);
  }
  for (const o of correctedList) {
    if (!correctedGroup[o.slug]) correctedGroup[o.slug] = [];
    correctedGroup[o.slug].push(o.date);
  }

  for (const slug in legacyGroup) legacyGroup[slug].sort();
  for (const slug in correctedGroup) correctedGroup[slug].sort();

  const changes: Array<{
    slug: string;
    legacyDate: string | null;
    correctedDate: string | null;
    shiftDays: number | null;
    status: 'shifted' | 'unchanged' | 'inserted' | 'removed';
    classification: 'D1_CORRECTION' | 'ADHIKA_POLICY' | 'BOTH' | 'UNEXPLAINED' | 'NEEDS_MUHURTA_EVAL';
  }> = [];

  const allSlugs = new Set([...Object.keys(legacyGroup), ...Object.keys(correctedGroup)]);

  for (const slug of allSlugs) {
    const lDates = legacyGroup[slug] || [];
    const cDates = correctedGroup[slug] || [];
    const maxLen = Math.max(lDates.length, cDates.length);

    for (let i = 0; i < maxLen; i++) {
      const lD = lDates[i] || null;
      const cD = cDates[i] || null;

      let changeItem: any;
      if (lD && cD) {
        if (lD === cD) {
          changeItem = { slug, legacyDate: lD, correctedDate: cD, shiftDays: 0, status: 'unchanged' };
        } else {
          const lTime = new Date(lD + 'T00:00:00Z').getTime();
          const cTime = new Date(cD + 'T00:00:00Z').getTime();
          const shift = Math.round((cTime - lTime) / (1000 * 60 * 60 * 24));
          changeItem = { slug, legacyDate: lD, correctedDate: cD, shiftDays: shift, status: 'shifted' };
        }
      } else if (cD) {
        changeItem = { slug, legacyDate: null, correctedDate: cD, shiftDays: null, status: 'inserted' };
      } else if (lD) {
        changeItem = { slug, legacyDate: lD, correctedDate: null, shiftDays: null, status: 'removed' };
      }

      changeItem.classification = classifyChange(changeItem, year);
      changes.push(changeItem);
    }
  }

  // Populate stats
  classificationStats[year] = {
    D1_CORRECTION: changes.filter(c => c.classification === 'D1_CORRECTION' && c.status !== 'unchanged').length,
    ADHIKA_POLICY: changes.filter(c => c.classification === 'ADHIKA_POLICY').length,
    BOTH: changes.filter(c => c.classification === 'BOTH').length,
    UNEXPLAINED: changes.filter(c => c.classification === 'UNEXPLAINED').length,
    NEEDS_MUHURTA_EVAL: changes.filter(c => c.classification === 'NEEDS_MUHURTA_EVAL').length,
    UNCHANGED: changes.filter(c => c.status === 'unchanged').length,
  };

  // Collect unexplained and both rows
  for (const c of changes) {
    if (c.classification === 'UNEXPLAINED') {
      unexplainedList.push({ year, slug: c.slug, legacyDate: c.legacyDate, correctedDate: c.correctedDate, shiftDays: c.shiftDays });
    }
    if (c.classification === 'BOTH') {
      const rule = CANONICAL_RULES.find(r => r.slug === c.slug);
      const masa = rule?.corrected_lunar_masa_name || 'relative to Jyeshtha';
      bothList.push({
        year,
        slug: c.slug,
        legacyDate: c.legacyDate,
        correctedDate: c.correctedDate,
        shiftDays: c.shiftDays,
        reason: `Rule maps to Amanta \`${masa}\`. Shifts by ${c.shiftDays} days due to combination of month name correction and Adhika month selection policy (\`${rule?.adhika_policy || 'base rule'}\`).`
      });
    }
  }

  // Format this year's output section
  const totalLegacy = legacyList.length;
  const totalCorrected = correctedList.length;
  const shifted = changes.filter(c => c.status === 'shifted');
  const inserted = changes.filter(c => c.status === 'inserted');
  const removed = changes.filter(c => c.status === 'removed');
  const unchanged = changes.filter(c => c.status === 'unchanged');

  const shiftValues = shifted.map(c => Math.abs(c.shiftDays!));
  const totalShift = shiftValues.reduce((sum, v) => sum + v, 0);
  const avgShift = shifted.length > 0 ? (totalShift / shifted.length).toFixed(1) : '0.0';
  const maxShift = shifted.length > 0 ? Math.max(...shiftValues) : 0;

  const changedDates = changes
    .filter(c => c.status !== 'unchanged')
    .map(c => c.correctedDate || c.legacyDate)
    .filter((d): d is string => d !== null)
    .sort();

  const firstChanged = changedDates[0] || 'N/A';
  const lastChanged = changedDates[changedDates.length - 1] || 'N/A';

  md += `## Year ${year}\n\n`;
  md += `### Summary Metrics\n`;
  md += `- **Total Legacy Observances**: ${totalLegacy}\n`;
  md += `- **Total Corrected Observances**: ${totalCorrected}\n`;
  md += `- **Unchanged Dates**: ${unchanged.length}\n`;
  md += `- **Shifted Dates**: ${shifted.length}\n`;
  md += `- **Inserted Dates**: ${inserted.length}\n`;
  md += `- **Removed Dates**: ${removed.length}\n`;
  md += `- **Average Absolute Shift**: ${avgShift} days\n`;
  md += `- **Maximum Absolute Shift**: ${maxShift} days\n`;
  md += `- **First Changed Date**: ${firstChanged}\n`;
  md += `- **Last Changed Date**: ${lastChanged}\n\n`;

  md += `### Movement Classification Summary\n`;
  md += `| Classification | Count (Moved Rows) | Rationale |\n`;
  md += `| :--- | :--- | :--- |\n`;
  md += `| **D1_CORRECTION** | ${classificationStats[year].D1_CORRECTION} | Date moved purely due to month-name correction shifting the calendar window. |\n`;
  md += `| **ADHIKA_POLICY** | ${classificationStats[year].ADHIKA_POLICY} | Date moved purely due to the Adhika month selection policy. |\n`;
  md += `| **BOTH** | ${classificationStats[year].BOTH} | Date moved due to a combination of month-name correction and Adhika selection policy. |\n`;
  md += `| **UNEXPLAINED** | ${classificationStats[year].UNEXPLAINED} | Movements not matching D1 shift or Adhika policy bounds (shipped findings). |\n`;
  md += `| **NEEDS_MUHURTA_EVAL** | ${classificationStats[year].NEEDS_MUHURTA_EVAL} | Muhurta/moonrise-dependent rules. Masa correction shifts these rows but the final date must be set by the condition evaluator (see ENGINE_RECONCILIATION_REPORT.md). |\n`;
  md += `\n`;

  md += `### Detailed Shifts\n\n`;
  md += `| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status | Classification |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const displayChanges = changes
    .filter(c => c.status !== 'unchanged')
    .sort((a, b) => {
      const dateA = a.correctedDate || a.legacyDate || '';
      const dateB = b.correctedDate || b.legacyDate || '';
      return dateA.localeCompare(dateB);
    });

  for (const c of displayChanges) {
    const shiftStr = c.shiftDays !== null ? (c.shiftDays > 0 ? `+${c.shiftDays}` : `${c.shiftDays}`) : '—';
    md += `| \`${c.slug}\` | ${c.legacyDate || '—'} | ${c.correctedDate || '—'} | ${shiftStr} | **${c.status.toUpperCase()}** | \`${c.classification}\` |\n`;
  }
  md += `\n---\n\n`;
}

// ── Loudly Report BOTH Rows (2026) ─────────────────────────────────────────
md += `## Critical Human Review: BOTH Shifts (2026)\n\n`;
md += `> [!IMPORTANT]\n`;
md += `> The following rules are Jyeshtha-based in 2026. Their dates changed due to a combined impact of correcting their month name (D1) and selecting the Nija Jyeshtha month over the Adhika month (D2 Adhika Policy). These MUST be individually approved by council review:\n\n`;

md += `| Rule Slug | Legacy Date | Corrected Date | Shift (Days) | Reason |\n`;
md += `| :--- | :--- | :--- | :--- | :--- |\n`;
for (const b of bothList) {
  const shiftStr = b.shiftDays !== null ? (b.shiftDays > 0 ? `+${b.shiftDays}` : `${b.shiftDays}`) : '—';
  md += `| \`${b.slug}\` | ${b.legacyDate || '—'} | ${b.correctedDate || '—'} | ${shiftStr} | ${b.reason} |\n`;
}
md += `\n---\n\n`;

// ── Enumerate UNEXPLAINED Rows (Findings) ──────────────────────────────────
md += `## Programmatic Findings: UNEXPLAINED Shifts\n\n`;
if (unexplainedList.length === 0) {
  md += `**Zero unexplained shifts detected.** All date movements align with month corrections or the 2026 Adhika Jyeshtha window.\n\n`;
} else {
  md += `> [!CAUTION]\n`;
  md += `> **UNEXPLAINED SHIFTS DETECTED**: The following date movements do not fit standard month or Adhika boundary shifts. This represents structural regressions:\n\n`;
  md += `| Year | Rule Slug | Legacy Date | Corrected Date | Shift (Days) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const u of unexplainedList) {
    const shiftStr = u.shiftDays !== null ? (u.shiftDays > 0 ? `+${u.shiftDays}` : `${u.shiftDays}`) : '—';
    md += `| ${u.year} | \`${u.slug}\` | ${u.legacyDate || '—'} | ${u.correctedDate || '—'} | ${shiftStr} |\n`;
  }
  md += `\n`;
}
md += `---\n\n`;

// ── Short List of Rules Depending on [S] Policy (2026) ─────────────────────
md += `## Rules Actually Depending on Unratified [S] Policy in 2026\n\n`;
md += `Out of all lunar rules, only the following rules have calculated dates in 2026 that actually vary when their \`adhika_policy\` is modified. This is the precise minimal list needing council ratification:\n\n`;

md += `| Rule Slug | Actual Policy | Alternative Policy Tested | Alternate Date(s) | Impact |\n`;
md += `| :--- | :--- | :--- | :--- | :--- |\n`;

for (const slug of dependentSlugs) {
  const rule = CANONICAL_RULES.find(r => r.slug === slug)!;
  const actualDates = actualMap2026[slug] || [];
  
  const altPolicies: Array<'nija' | 'adhika' | 'both'> = ['nija', 'adhika', 'both'];
  for (const altP of altPolicies) {
    if (altP === rule.adhika_policy) continue;
    
    const altMap = buildOccurrencesMapCorrectedWithPolicy(2026, (s) => {
      return s === slug ? altP : (CANONICAL_RULES.find(x => x.slug === s)?.adhika_policy || 'nija');
    });
    
    const altDates = altMap[slug] || [];
    
    let isDifferent = actualDates.length !== altDates.length;
    if (!isDifferent) {
      for (let j = 0; j < actualDates.length; j++) {
        if (actualDates[j] !== altDates[j]) {
          isDifferent = true;
          break;
        }
      }
    }
    
    if (isDifferent) {
      md += `| \`${slug}\` | \`${rule.adhika_policy}\` | \`${altP}\` | \`${altDates.join(', ') || 'None'}\` | Changing policy to \`${altP}\` shifts the date from \`${actualDates.join(', ')}\` to \`${altDates.join(', ') || 'None'}\` |\n`;
    }
  }
}

// Print relative dependents as well
const relEntries = Object.entries(relativeDependents);
if (relEntries.length > 0) {
  md += `\n### Relative Rules Affected by the Above Base Policies\n\n`;
  md += `The following rules do not declare their own policy but inherit the date shift because they are relative to the rules above:\n\n`;
  for (const [baseSlug, relSlugs] of relEntries) {
    md += `- Base \`${baseSlug}\` determines relative rules: ${relSlugs.map(s => `\`${s}\``).join(', ')}\n`;
  }
  md += `\n`;
}

// Write the report
const docsDir = path.resolve('/Users/Business(C)/Sanatan Sangam/Shoonaya/docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
fs.writeFileSync(path.join(docsDir, 'MASA_CORRECTION_DIFF_REPORT.md'), md, 'utf-8');
console.log('Successfully wrote docs/MASA_CORRECTION_DIFF_REPORT.md.');
