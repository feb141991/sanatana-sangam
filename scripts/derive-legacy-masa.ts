/**
 * Derives the legacy `lunar_masa_name` for rules that only carry a corrected one.
 *
 * WHY THIS CANNOT BE A FORMULA
 * ----------------------------
 * The legacy engine names a month from the SUN's rāśi; the corrected engine names
 * it from the amānta lunation. Those drift against each other *within* a
 * lunation, because the Sankranti falls partway through it. Measured across the
 * 47 rules carrying both names, the shift is +2 months for 44 of them and +1 for
 * three — maha-shivaratri (tithi 28), asalha-puja (15) and vassa-begins (16),
 * all at or past the pūrṇimā boundary.
 *
 * So a fixed offset would be right most of the time and quietly wrong for the
 * kṛṣṇa-paksha rules. That is the exact failure shape that shipped a two-month
 * error this morning, so this measures instead of assuming.
 *
 * THE METHOD
 * ----------
 * For each rule, take the date the CORRECTED path produces, then ask the LEGACY
 * engine what it calls the month on that date. That name, paired with the same
 * tithi, is what makes the legacy path land on the same day.
 *
 * A single year proves nothing — adhika months and rāśi timing shift the
 * relationship. So it is measured across 2026–2028 and only accepted when all
 * three agree. Disagreement means the rule genuinely cannot be expressed on the
 * legacy path, and it is reported rather than forced.
 *
 * Run: npx tsx scripts/derive-legacy-masa.ts
 */
import {
  precomputePanchangForYear,
  precomputePanchangCorrectedForYear,
  LunarTithiHandler,
} from '../src/lib/calendar/engine';
import { CANONICAL_RULES, ObservanceRule } from '../src/lib/calendar/rules';

const YEARS = [2026, 2027, 2028];

const corrected = (r: ObservanceRule): ObservanceRule => ({
  ...r,
  lunar_masa_name: r.corrected_lunar_masa_name ?? r.lunar_masa_name,
  lunar_tithi_index: r.corrected_lunar_tithi_index ?? r.lunar_tithi_index,
  prefer_last_match:
    r.corrected_prefer_last_match !== undefined ? r.corrected_prefer_last_match : r.prefer_last_match,
  allow_skipped_tithi:
    r.corrected_allow_skipped_tithi !== undefined ? r.corrected_allow_skipped_tithi : r.allow_skipped_tithi,
});

/** Rules with a corrected month but no legacy one — the ones we removed. */
const targets = (CANONICAL_RULES as any[]).filter(
  r => r.corrected_lunar_masa_name && !r.lunar_masa_name && r.rule_family === 'lunar_tithi',
);

console.log(`\nDeriving legacy masa names for ${targets.length} rules\n`);

interface Obs { year: number; correctedDate: string | null; legacyMasa: string | null; legacyTithi: number | null }
const results: Array<{ slug: string; obs: Obs[]; verdict: string; name: string | null }> = [];

const cacheL: Record<number, any[]> = {};
const cacheC: Record<number, any[]> = {};
for (const y of YEARS) {
  cacheL[y] = precomputePanchangForYear(y);
  cacheC[y] = precomputePanchangCorrectedForYear(y);
}

for (const rule of targets) {
  const obs: Obs[] = [];

  for (const year of YEARS) {
    const days = cacheC[year];
    const src =
      rule.corrected_month_system === 'purnimanta'
        ? days.map((d: any) => ({ ...d, panchang: { ...d.panchang, masaName: d.panchang.masaNamePurnimanta } }))
        : days;

    const r = corrected(rule);
    const hits = LunarTithiHandler.evaluate(r, src).filter(
      (d: string) => new Date(d + 'T00:00:00Z').getUTCFullYear() === year,
    );
    const correctedDate = hits.length ? (r.prefer_last_match ? hits[hits.length - 1] : hits[0]) : null;

    let legacyMasa: string | null = null;
    let legacyTithi: number | null = null;
    if (correctedDate) {
      const row = cacheL[year].find((d: any) => d.dateStr === correctedDate);
      legacyMasa = row?.panchang?.masaName ?? null;
      legacyTithi = row?.panchang?.tithiIndex ?? null;
    }
    obs.push({ year, correctedDate, legacyMasa, legacyTithi });
  }

  const names = [...new Set(obs.map(o => o.legacyMasa).filter(Boolean))];
  const tithis = [...new Set(obs.map(o => o.legacyTithi).filter(t => t !== null))];

  let verdict: string;
  let name: string | null = null;
  if (obs.some(o => !o.correctedDate)) {
    verdict = 'INCOMPLETE — corrected path produced no date in at least one year';
  } else if (names.length !== 1) {
    verdict = `AMBIGUOUS — legacy names differ across years (${names.join(', ')})`;
  } else if (tithis.length !== 1) {
    verdict = `AMBIGUOUS — legacy tithi differs across years (${tithis.join(', ')})`;
  } else if (tithis[0] !== (rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index)) {
    verdict = `TITHI MISMATCH — legacy engine reports tithi ${tithis[0]} on that date, rule wants ${rule.corrected_lunar_tithi_index ?? rule.lunar_tithi_index}`;
  } else {
    verdict = 'OK';
    name = names[0] as string;
  }

  results.push({ slug: rule.slug, obs, verdict, name });
}

for (const r of results) {
  const flag = r.verdict === 'OK' ? '' : '   <-- ';
  console.log(`${r.slug}`);
  for (const o of r.obs) {
    console.log(`    ${o.year}  corrected ${o.correctedDate ?? '(none)'}  legacy calls it ${o.legacyMasa ?? '?'} tithi ${o.legacyTithi ?? '?'}`);
  }
  console.log(`    => ${r.verdict}${flag}${r.name ? `lunar_masa_name: "${r.name}"` : ''}\n`);
}

const ok = results.filter(r => r.verdict === 'OK');
console.log(`\n${ok.length} of ${results.length} derivable on the legacy path\n`);
if (ok.length) {
  console.log('Apply these:');
  console.log(JSON.stringify(Object.fromEntries(ok.map(r => [r.slug, r.name])), null, 2));
}
const bad = results.filter(r => r.verdict !== 'OK');
if (bad.length) {
  console.log('\nNOT derivable — leave legacy name absent, these cannot publish until the flag flips:');
  bad.forEach(r => console.log(`  ${r.slug}: ${r.verdict}`));
}
