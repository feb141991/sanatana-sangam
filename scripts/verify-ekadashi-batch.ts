import { calculateObservancesForYearCorrected, calculateObservancesForYearLegacy } from '../src/lib/calendar/engine';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';

const EKADASHI_SLUGS = [
  'kamada-ekadashi',
  'nirjala-ekadashi',
  'devshayani-ekadashi',
  'shravana-putrada-ekadashi',
  'parivartini-ekadashi',
  'devutthana-ekadashi',
  'amalaki-ekadashi',
  'papmochani-ekadashi',
  'apara-ekadashi',
  'yogini-ekadashi',
  'kamika-ekadashi',
  'aja-ekadashi',
  'rama-ekadashi',
  'utpanna-ekadashi',
  'saphala-ekadashi',
  'vijaya-ekadashi',
  'vaikunta-ekadashi',
];

console.log('='.repeat(80));
console.log('EKADASHI BATCH VERIFICATION SCRIPT');
console.log('='.repeat(80));

for (const year of [2026, 2027, 2028]) {
  const correctedOccurrences = calculateObservancesForYearCorrected(year);
  const ekadashis = correctedOccurrences
    .filter(o => EKADASHI_SLUGS.includes(o.slug))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(`\n--- YEAR ${year} SORTED EKADASHIS (${ekadashis.length} occurrences) ---`);
  
  for (let i = 0; i < ekadashis.length; i++) {
    const curr = ekadashis[i];
    let gapStr = '';
    if (i > 0) {
      const prev = ekadashis[i - 1];
      const diffMs = new Date(curr.date + 'T00:00:00Z').getTime() - new Date(prev.date + 'T00:00:00Z').getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      gapStr = ` (gap: ${diffDays} days)`;
      if (diffDays < 13 || diffDays > 17) {
        gapStr += ' <== OUTSIDE 13-17 DAY INVARIANT!';
      }
    }
    console.log(`${curr.date} | ${curr.slug.padEnd(26)}${gapStr}`);
  }
}

// Legacy vs Corrected check
console.log('\n--- LEGACY VS CORRECTED RESOLUTION CHECK (2026) ---');
const legacy2026 = calculateObservancesForYearLegacy(2026);
for (const slug of EKADASHI_SLUGS) {
  const cOcc = calculateObservancesForYearCorrected(2026).filter(o => o.slug === slug);
  const lOcc = legacy2026.filter(o => o.slug === slug);
  const cDates = cOcc.map(o => o.date).join(', ') || 'NONE';
  const lDates = lOcc.map(o => o.date).join(', ') || 'NONE';
  console.log(`${slug.padEnd(26)} | Corrected: ${cDates.padEnd(12)} | Legacy: ${lDates}`);
}

process.exit(0);
