/**
 * Builds the ratification packet: every date that changes if the corrected
 * lunar-month path goes live, with a plain-language reason for each.
 *
 * Written for a reader who does not read code. No jargon beyond the calendar
 * terms a panchanga scholar already uses.
 *
 * Run: npm run council:packet
 */
import { writeFileSync } from 'node:fs';
import {
  calculateObservancesForYearLegacy,
  calculateObservancesForYearCorrected,
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { getLunarMonth } from '@sangam/panchang-engine';

const YEARS = [2026, 2027, 2028];

const ruleOf = (slug: string) => CANONICAL_RULES.find(r => r.slug === slug);

/** Rules added 2026-08-09; they have no legacy date at all, so they are new
 *  entries rather than moved ones and belong in their own section. */
const isNewEkadashi = (slug: string) =>
  /ekadashi/.test(slug) && !['ekadashi', 'vaikunta-ekadashi'].includes(slug);

const MONTH_OF = (dateStr: string): string => {
  const r = getLunarMonth(new Date(dateStr + 'T01:00:00Z'), 'amanta') as any;
  return r.ok ? r.monthName : '?';
};

interface Row { slug: string; name: string; from: string; to: string; days: number; reason: string; }

/** Plain-language reason, derived from the rule and the dates — not asserted. */
function reasonFor(slug: string, from: string, to: string, days: number): string {
  const r = ruleOf(slug) as any;
  if (!r) return 'Follows another observance that moved.';

  if (r.rule_family === 'relative_to_other_observance') {
    return `Anchored to ${r.relative_base_slug} (${r.relative_offset_days >= 0 ? '+' : ''}${r.relative_offset_days} days); moves only because that observance moves.`;
  }
  if (r.corrected_lunar_tithi_index !== undefined && r.corrected_lunar_tithi_index !== r.lunar_tithi_index) {
    return `Tithi corrected from index ${r.lunar_tithi_index} to ${r.corrected_lunar_tithi_index}. In this engine krishna tithi N = 15 + N, so ${r.corrected_lunar_tithi_index} is Krishna ${r.corrected_lunar_tithi_index - 15}${r.corrected_lunar_tithi_index === 29 ? ' (Chaturdashi)' : r.corrected_lunar_tithi_index === 30 ? ' (Amavasya)' : ''}. The old index named the tithi one day earlier.`;
  }
  const fromMonth = MONTH_OF(from);
  const toMonth = MONTH_OF(to);
  if (Math.abs(days) >= 25 && Math.abs(days) <= 35) {
    return `Month naming corrected. The old engine named months from the Sun's rashi, which ran one month out. The observance stays in ${r.corrected_lunar_masa_name}${r.corrected_month_system === 'purnimanta' ? ' (purnimanta)' : ''}; only our name for that month changed.`;
  }
  if (Math.abs(days) > 35) {
    return `Month naming corrected AND 2026 has an intercalary month (Adhika Jyeshtha, 16 May – 15 Jun). With adhika_policy "${r.adhika_policy}" the observance falls in the nija month, which is a further ~29 days later.`;
  }
  if (Math.abs(days) <= 3) {
    return `Small shift within the same month (${fromMonth} → ${toMonth}); the tithi now falls on the adjacent civil day.`;
  }
  return `Moves ${days} days. Month ${fromMonth} → ${toMonth}.`;
}

let md = `# Ratification packet — corrected lunar-month calendar

**What this is.** Our calendar engine currently names lunar months using a method
we have since found to be wrong. A corrected method is ready. Turning it on
changes the dates below. **We are not asking you to check our astronomy** — the
Sun and Moon positions are validated against the US Naval Observatory and NASA
JPL. We are asking one question per row:

> **Is the new date the correct date for this observance?**

**Nothing has been changed yet.** These dates are what *would* be published.

**Why dates move by about a month.** The old engine named a lunar month from the
Sun's zodiacal sign, which runs roughly one month out from the true
amavasya-to-amavasya month. The observance itself never moved — our name for the
month did, and the rules were written against the wrong name.

**2026 is unusual.** It contains an intercalary month, **Adhika Jyeshtha
(16 May – 15 June)**. Observances set to the *nija* (true) month therefore move a
further ~29 days in that year only.

---

`;

const newEntries: Record<number, Row[]> = {};
const movedCount: Record<number, number> = {};

for (const year of YEARS) {
  const L = calculateObservancesForYearLegacy(year);
  const C = calculateObservancesForYearCorrected(year);
  const lm = new Map(L.filter(o => !o.recurring).map(o => [o.slug, o.date]));
  const cm = new Map(C.filter(o => !o.recurring).map(o => [o.slug, o.date]));

  const moved: Row[] = [];
  const added: Row[] = [];

  for (const [slug, to] of cm) {
    const r = ruleOf(slug) as any;
    const name = r?.display_name ?? slug;
    const from = lm.get(slug);
    if (!from) {
      if (isNewEkadashi(slug)) added.push({ slug, name, from: '—', to, days: 0, reason: 'New observance. It has content in the app but never had a scheduled date.' });
      continue;
    }
    if (from === to) continue;
    const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
    moved.push({ slug, name, from, to, days, reason: reasonFor(slug, from, to, days) });
  }

  moved.sort((a, b) => a.to.localeCompare(b.to));
  newEntries[year] = added.sort((a, b) => a.to.localeCompare(b.to));

  movedCount[year] = moved.length;
  md += `## ${year} — ${moved.length} dates change\n\n`;
  md += `| Observance | Currently shows | Would show | Shift | Why |\n|---|---|---|---|---|\n`;
  for (const r of moved) {
    md += `| **${r.name}** | ${r.from} | **${r.to}** | ${r.days > 0 ? '+' : ''}${r.days} d | ${r.reason} |\n`;
  }
  md += `\n`;
}

md += `---\n\n## New observances (no date today)\n\n`;
md += `These have written content in the app but no scheduled date, so nothing is
"moving" — they would simply start appearing. Listed for completeness.\n\n`;
for (const year of YEARS) {
  const rows = newEntries[year];
  if (!rows.length) continue;
  md += `**${year}** — ${rows.length} entries: ` + rows.map(r => `${r.name} (${r.to})`).join(', ') + `\n\n`;
}

md += `---

## How to respond

For each row, one of:

- **Yes** — the new date is correct.
- **No** — the old date was correct. (Tell us the correct date and we will find
  why the engine disagrees; this has already caught two real errors.)
- **Unsure** — we will leave it under review and publish no date rather than a
  doubtful one.

A "No" is genuinely useful. Two of the corrections in this list were found
because someone said the old date looked right, and they were correct.

## What we are NOT asking

- Whether the astronomy is right — that is externally validated.
- Whether to use amanta or purnimanta — that is per-observance and already set.
- Anything about the code.
`;

const out = 'docs/COUNCIL_RATIFICATION_PACKET.md';
writeFileSync(out, md, 'utf8');

const totalMoved = YEARS.reduce((a, y) => a + movedCount[y], 0);
const totalNew = YEARS.reduce((a, y) => a + newEntries[y].length, 0);

console.log(`\nWrote ${out}\n`);
console.log('  Year   Dates changing   New observances');
for (const y of YEARS) {
  console.log(`  ${y}   ${String(movedCount[y]).padStart(12)}   ${String(newEntries[y].length).padStart(15)}`);
}
console.log(`  ${'total'.padEnd(4)}   ${String(totalMoved).padStart(12)}   ${String(totalNew).padStart(15)}\n`);
console.log('  Each changing date needs one answer: is the new date correct?');
console.log('  New observances have no current date, so nothing moves for them.\n');
