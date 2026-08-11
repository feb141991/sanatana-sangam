/**
 * Sweeps every launch year for adhika-masa purnimanta krishna-paksha naming
 * collisions, and reports which rules are affected.
 *
 * WHY THIS IS A COMMITTED SCRIPT AND NOT PROSE
 * ---------------------------------------------
 * The 2026-08-11 investigation into the adhika-masa naming defect
 * (packages/panchang-engine/src/lunar-month/index.ts) swept all four launch
 * years by hand, in throwaway /tmp scripts, and reported the results as prose
 * in docs/CALENDAR_ENGINE_ASSESSMENT.md. That claim -- "only 2026 has an
 * adhika month; only yogini-ekadashi was affected" -- was not independently
 * reproducible by anyone else, including a future version of this codebase
 * after the ephemeris or boundary solver changes. This script is that sweep,
 * committed, so the claim can be re-run rather than re-trusted.
 *
 * WHAT IT DOES
 * ------------
 * 1. For each year, finds every contiguous adhika-month window.
 * 2. For each purnimanta masa name, finds every distinct contiguous
 *    KRISHNA-PAKSHA-ONLY window it covers that year. Krishna-paksha only is
 *    deliberate: a purnimanta month name legitimately covers BOTH a shukla
 *    segment (from the following nija month, unprefixed) and a krishna
 *    segment (the "amanta name + 1" rule) in every ordinary year -- that two-
 *    segment structure is not a bug, it is what a purnimanta month IS. An
 *    earlier version of this sweep counted that normal structure as a false
 *    "double window", which produced an overstated finding (three rules
 *    reported as "correct by luck" that were never actually ambiguous, since
 *    a tithi > 15 rule can only ever match the krishna segment, and there is
 *    only ever one of those per name in a normal year). Filtering to
 *    krishna-paksha-only windows is what makes "more than one window" a
 *    genuine hazard rather than routine pursnimanta structure.
 * 3. Cross-references every kṛṣṇa-pakṣa rule (lunar_tithi_index > 15) in
 *    rules.json against the double-krishna-window masa names, and reports
 *    whether its computed date falls in the genuine (later, for a within-year
 *    adhika insertion) or spurious (earlier) window.
 *
 * Run: npx tsx scripts/sweep-adhika-masa-collisions.ts [years...]
 * Default years: 2025 2026 2027 2028 (the current launch window).
 */
import { precomputePanchangCorrectedForYear } from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { contiguousWindows, Window } from '../src/lib/calendar/adhika-window';

const years = process.argv.slice(2).map(Number).filter(n => !isNaN(n));
const YEARS = years.length > 0 ? years : [2025, 2026, 2027, 2028];

let anyDoubleWindow = false;
const allDoubleWindows: Array<{ year: number; masa: string; windows: Window[] }> = [];
const daysByYear = new Map<number, any[]>();

for (const year of YEARS) {
  console.log(`\n=== ${year} ===`);
  const days = precomputePanchangCorrectedForYear(year);
  daysByYear.set(year, days);

  const adhika = contiguousWindows(days, 'masaName', { filterKey: n => n?.startsWith('Adhika') });
  if (adhika.size === 0) {
    console.log('  no adhika month this year');
  } else {
    for (const [name, wins] of adhika) {
      for (const w of wins) console.log(`  adhika month: ${name} [${w.start}..${w.end}]`);
    }
  }

  // Iterate over the complete ordered daily series. Define active key only when
  // the day is krishna paksha (tithiIndex > 15). Explicitly closes/resets when day
  // is not krishna paksha, masa name changes, or year ends (EOF).
  const purnimantaWindows = contiguousWindows(days, 'masaNamePurnimanta', {
    isActive: d => (d.panchang.tithiIndex ?? 0) > 15,
  });
  for (const [name, wins] of purnimantaWindows) {
    if (wins.length > 1) {
      anyDoubleWindow = true;
      allDoubleWindows.push({ year, masa: name, windows: wins });
      console.log(`  ⚠ DOUBLE WINDOW purnimanta="${name}": ${wins.map(w => `[${w.start}..${w.end}]`).join(' + ')}`);
    }
  }
}

console.log('\n=== rules targeting a double-window masa name, and which window they land in ===\n');

if (!anyDoubleWindow) {
  console.log('No double-window masa names in the swept years -- nothing to check.');
} else {
  const checked = new Set<string>();
  for (const { year, masa, windows } of allDoubleWindows) {
    const days = daysByYear.get(year) || precomputePanchangCorrectedForYear(year);
    const targets = CANONICAL_RULES.filter(
      (r: any) =>
        r.corrected_month_system === 'purnimanta' &&
        r.corrected_lunar_masa_name === masa &&
        (r.lunar_tithi_index ?? 0) > 15,
    );
    for (const rule of targets as any[]) {
      const key = `${year}:${rule.slug}:${rule.sampradaya ?? ''}`;
      if (checked.has(key)) continue;
      checked.add(key);

      const matches = days.filter(
        d => d.panchang.masaNamePurnimanta === masa && d.panchang.tithiIndex === rule.lunar_tithi_index,
      );
      const dates = matches.map(m => m.dateStr);
      let landedIn = 'no exact match (kshaya/vrddhi at this position)';
      windows.forEach((w, i) => {
        if (dates.some(d => d >= w.start && d <= w.end)) {
          landedIn = `window ${i + 1} of ${windows.length} [${w.start}..${w.end}]${i === windows.length - 1 ? ' (LATEST -- usually genuine for a within-year adhika insertion)' : ' (EARLIER -- check carefully)'}`;
        }
      });
      console.log(`  ${year} ${rule.slug}${rule.sampradaya ? ` [${rule.sampradaya}]` : ''} (masa=${masa}, tithi=${rule.lunar_tithi_index}) -> ${dates.join(', ') || '(none)'} -- ${landedIn}`);
    }
  }
}

console.log(`\nDone. ${YEARS.length} year(s) swept, ${allDoubleWindows.length} double-window occurrence(s) found.`);
