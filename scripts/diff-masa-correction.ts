import fs from 'node:fs';
import path from 'node:path';
import { calculateObservancesForYear, calculateObservancesForYearCorrected } from '../src/lib/calendar/engine';

const years = [2026, 2027, 2028];
let md = `# Masa Correction Diff Report\n\n`;
md += `This report quantifies the impact of the D1+D2 lunar month naming and recalibration. All numbers were computed programmatically by running the legacy and corrected calendar engine paths over the years 2026–2028.\n\n`;

for (const year of years) {
  const legacyList = calculateObservancesForYear(year);
  const correctedList = calculateObservancesForYearCorrected(year);

  // Group legacy and corrected occurrences by slug
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

  // Sort dates within each slug group
  for (const slug in legacyGroup) {
    legacyGroup[slug].sort();
  }
  for (const slug in correctedGroup) {
    correctedGroup[slug].sort();
  }

  // We match occurrences.
  // For each slug:
  // - If it's a non-recurring rule (at most 1 occurrence), match them directly.
  // - If it's recurring, match the i-th occurrence in legacy with the i-th in corrected.
  //   If counts differ, report extra corrected occurrences as "inserted" and extra legacy as "removed".
  const changes: Array<{
    slug: string;
    legacyDate: string | null;
    correctedDate: string | null;
    shiftDays: number | null;
    status: 'shifted' | 'unchanged' | 'inserted' | 'removed';
  }> = [];

  const allSlugs = new Set([...Object.keys(legacyGroup), ...Object.keys(correctedGroup)]);

  for (const slug of allSlugs) {
    const lDates = legacyGroup[slug] || [];
    const cDates = correctedGroup[slug] || [];

    const maxLen = Math.max(lDates.length, cDates.length);
    for (let i = 0; i < maxLen; i++) {
      const lD = lDates[i] || null;
      const cD = cDates[i] || null;

      if (lD && cD) {
        if (lD === cD) {
          changes.push({ slug, legacyDate: lD, correctedDate: cD, shiftDays: 0, status: 'unchanged' });
        } else {
          const lTime = new Date(lD + 'T00:00:00Z').getTime();
          const cTime = new Date(cD + 'T00:00:00Z').getTime();
          const shift = Math.round((cTime - lTime) / (1000 * 60 * 60 * 24));
          changes.push({ slug, legacyDate: lD, correctedDate: cD, shiftDays: shift, status: 'shifted' });
        }
      } else if (cD) {
        changes.push({ slug, legacyDate: null, correctedDate: cD, shiftDays: null, status: 'inserted' });
      } else if (lD) {
        changes.push({ slug, legacyDate: lD, correctedDate: null, shiftDays: null, status: 'removed' });
      }
    }
  }

  // Aggregate stats
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

  // Find first and last changed dates in each year (based on corrected date or legacy date)
  const changedDates = changes
    .filter(c => c.status !== 'unchanged')
    .map(c => c.correctedDate || c.legacyDate)
    .filter((d): d is string => d !== null)
    .sort();

  const firstChanged = changedDates[0] || 'N/A';
  const lastChanged = changedDates[changedDates.length - 1] || 'N/A';

  md += `## Year ${year}\n\n`;
  md += `### Summary Invariants\n`;
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

  // Output table of changed dates
  md += `### Detailed Shifts\n\n`;
  md += `| Observance Slug | Legacy Date | Corrected Date | Shift (Days) | Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  // Sort changes so that shifts and insertions/deletions come first, sorted by corrected/legacy date
  const displayChanges = changes
    .filter(c => c.status !== 'unchanged')
    .sort((a, b) => {
      const dateA = a.correctedDate || a.legacyDate || '';
      const dateB = b.correctedDate || b.legacyDate || '';
      return dateA.localeCompare(dateB);
    });

  for (const c of displayChanges) {
    const shiftStr = c.shiftDays !== null ? (c.shiftDays > 0 ? `+${c.shiftDays}` : `${c.shiftDays}`) : 'N/A';
    md += `| \`${c.slug}\` | ${c.legacyDate || '—'} | ${c.correctedDate || '—'} | ${shiftStr} | **${c.status.toUpperCase()}** |\n`;
  }
  md += `\n---\n\n`;
}

const docsDir = path.resolve('/Users/Business(C)/Sanatan Sangam/Shoonaya/docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
fs.writeFileSync(path.join(docsDir, 'MASA_CORRECTION_DIFF_REPORT.md'), md, 'utf-8');
console.log('Successfully wrote docs/MASA_CORRECTION_DIFF_REPORT.md.');
