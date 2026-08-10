/**
 * Generates the offline festival fallback from the rules engine.
 *
 * WHY THIS REPLACES A HAND-WRITTEN LIST
 * ------------------------------------
 * `FESTIVALS_2026` was 66 hardcoded Gregorian dates. Three problems, all live:
 *
 *   1. AGENTS.md rule 1 forbids hardcoded festival dates outright.
 *   2. It bypassed every gate. Losar, Kathina, Vesak, Onam, Chhath and six more
 *      were in it despite being deferred or withdrawn — so an API failure showed
 *      users exactly the observances we had decided not to publish.
 *   3. It had drifted from the truth. It carried Mahashivaratri on 2026-02-17
 *      and Janmashtami on 2026-09-03; the council ruled 15 Feb and 4 Sep. A
 *      hand-maintained list cannot track a ratification it does not know about.
 *
 * It also only covered 2026 — getFallbackFestivalCalendar returned [] for every
 * other year, so the "fallback" was empty from 2027 onwards.
 *
 * Generating it from the engine fixes all four at once: the launch gate applies,
 * ratified dates apply, every year is covered, and drift is impossible because
 * nobody edits it by hand.
 *
 * The engine is not called at runtime because a year of panchanga takes seconds
 * — far too slow for a page render. So this is a build-time snapshot, committed,
 * regenerated deliberately.
 *
 * Run: npm run generate:fallback
 */
import { writeFileSync } from 'node:fs';
import { calculateObservancesForYear, USE_CORRECTED_MASA } from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const YEARS = [2026, 2027, 2028];

interface Row {
  name: string; date: string; emoji: string; description: string;
  type: string; tradition: string; slug: string;
}

const ruleOf = (slug: string) => (CANONICAL_RULES as any[]).find(r => r.slug === slug);

const rows: Row[] = [];
for (const year of YEARS) {
  for (const occ of calculateObservancesForYear(year)) {
    const r = ruleOf(occ.slug);
    if (!r) continue;
    rows.push({
      slug: occ.slug,
      name: r.display_name ?? occ.slug,
      date: occ.date,
      emoji: r.emoji ?? '🪔',
      description: r.description ?? '',
      type: r.kind ?? 'major',
      tradition: r.tradition ?? 'all',
    });
  }
}
rows.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));

const byYear: Record<number, Row[]> = {};
for (const y of YEARS) byYear[y] = rows.filter(r => r.date.startsWith(String(y)));

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const body = YEARS.map(y => {
  const entries = byYear[y]
    .map(r =>
      `  { name: '${esc(r.name)}', date: '${r.date}', emoji: '${r.emoji}', ` +
      `description: '${esc(r.description)}', type: '${r.type}', tradition: '${r.tradition}', slug: '${r.slug}' },`,
    )
    .join('\n');
  return `const FALLBACK_${y}: FallbackFestival[] = [\n${entries}\n];`;
}).join('\n\n');

const out = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Produced by \`npm run generate:fallback\` from the rules engine. Editing it
 * directly reintroduces exactly the problem it was created to solve: a
 * hand-maintained date list that drifts from the rules and from council
 * rulings, and that bypasses the launch gate.
 *
 * Contents reflect, at generation time:
 *   - only rules with launch_status 'included'
 *   - only rules the derivability gate permits (no Kathina, no Pavarana)
 *   - the ratified dates as of that run
 *
 * Regenerate after ANY change to rules.json, the launch set, or a council
 * ratification.
 *
 * Generated: ${new Date().toISOString().slice(0, 10)}
 * Years: ${YEARS.join(', ')}
 * Entries: ${rows.length}
 *
 * USE_CORRECTED_MASA at generation: ${USE_CORRECTED_MASA}
 *
 * That flag matters. The fallback is generated through the SAME dispatching
 * entry point the app publishes from, so it mirrors production rather than
 * diverging from it -- an offline user and an online user see the same dates.
 *${USE_CORRECTED_MASA
   ? '\n * Generated on the CORRECTED path, so ratified dates apply.'
   : '\n * Generated on the LEGACY path, so dates the council has ratified on the\n * corrected path are NOT reflected here yet -- e.g. Janmashtami shows the\n * legacy 2026-08-06, not the ruled 2026-09-04. That is deliberate: the app\n * itself still publishes legacy dates. Regenerate when the flag flips.'}
 */

export interface FallbackFestival {
  name: string;
  date: string;
  emoji: string;
  description: string;
  type: string;
  tradition: string;
  slug: string;
}

${body}

const BY_YEAR: Record<number, FallbackFestival[]> = {
${YEARS.map(y => `  ${y}: FALLBACK_${y},`).join('\n')}
};

/** Offline fallback for a year. Empty array for years not generated. */
export function getGeneratedFallback(year: number): FallbackFestival[] {
  return BY_YEAR[year] ?? [];
}

export const FALLBACK_YEARS = [${YEARS.join(', ')}] as const;
`;

const path = 'src/lib/festival-fallback.generated.ts';
writeFileSync(path, out, 'utf8');

console.log(`\nWrote ${path}`);
for (const y of YEARS) {
  const n = byYear[y].length;
  const ek = byYear[y].filter(r => /ekadashi/.test(r.slug)).length;
  console.log(`  ${y}: ${String(n).padStart(3)} entries  (${ek} ekadashi)`);
}
console.log(`  total ${rows.length}\n`);
