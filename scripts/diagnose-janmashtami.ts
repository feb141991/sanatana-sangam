import { evaluateVariant, getPeriodWindow, LocationInputWithTz } from '../packages/dharma-rules/src/conditions/index.js';
import { calculatePanchang, parseCivilDateUtc } from '../packages/panchang-engine/src/index.js';
import rules from '../packages/dharma-rules/src/festivals/rules.json';

const UJJAIN: LocationInputWithTz = { lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' };
const BEDFORD: LocationInputWithTz = { lat: 52.1356, lon: -0.4685, tz: 'Europe/London' };

const smartaRule = rules.find(r => r.slug === 'krishna-janmashtami' && r.sampradaya === 'smarta_nishita')!;
const vaishnavaRule = rules.find(r => r.slug === 'krishna-janmashtami' && r.sampradaya === 'gaudiya_iskcon')!;

console.log('Smarta Rule in JSON:', smartaRule);
console.log('Vaishnava Rule in JSON:', vaishnavaRule);

const smartaVariant = {
  ruleId: 'krishna_janmashtami__smarta',
  festivalId: 'krishna-janmashtami',
  traditionProfile: 'smarta_nishita',
  conditions: [
    { type: 'paksha' as const, value: 'krishna' as const },
    { type: 'tithi_presence' as const, tithi: 8, period: 'nishita' as const, mode: 'touches' as const },
  ],
};

const vaishnavaVariant = {
  ruleId: 'krishna_janmashtami__vaishnava',
  festivalId: 'krishna-janmashtami',
  traditionProfile: 'gaudiya_iskcon',
  conditions: [
    { type: 'paksha' as const, value: 'krishna' as const },
    { type: 'tithi_presence' as const, tithi: 8, period: 'sunrise' as const, mode: 'at' as const },
    { type: 'nakshatra_presence' as const, nakshatra: 'rohini', period: 'sunrise' as const, mode: 'touches' as const },
  ],
};

const dateRanges = [
  { year: 2026, center: '2026-09-04' },
  { year: 2027, center: '2027-08-24' },
  { year: 2028, center: '2028-08-13' }
];

function offsetDate(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

for (const range of dateRanges) {
  console.log(`\n======================================================`);
  console.log(`  YEAR ${range.year} (Center: ${range.center})`);
  console.log(`======================================================`);

  for (const locName of ['Ujjain', 'Bedford'] as const) {
    const loc = locName === 'Ujjain' ? UJJAIN : BEDFORD;
    console.log(`\n--- Location: ${locName} ---`);
    console.log(`Date       | Sunrise Tithi (Idx) | Ashtami? | Sunrise Nakshatra | Rohini? | Both? | Smarta Qual? | Vaishnava Qual?`);
    console.log(`-----------|---------------------|----------|-------------------|---------|-------|--------------|----------------`);

    for (let offset = -4; offset <= 4; offset++) {
      const dStr = offsetDate(range.center, offset);
      const window = getPeriodWindow('sunrise', dStr, loc);
      const sunrise = window ? window.start : parseCivilDateUtc(dStr);

      const p = calculatePanchang(sunrise, loc.lat, loc.lon, loc.tz);
      const isAshtami = p.tithiIndex === 23; // Krishna Ashtami = 23 (15 + 8)
      const nakshatraName = (p.nakshatra as any)?.name || String(p.nakshatra || '');
      const tithiName = p.tithi;
      const isRohini = nakshatraName.toLowerCase().includes('rohini');

      const bothAtSunrise = isAshtami && isRohini;

      const sRes = evaluateVariant(smartaVariant, dStr, loc);
      const vRes = evaluateVariant(vaishnavaVariant, dStr, loc);

      console.log(
        `${dStr} | Tithi ${String(p.tithiIndex).padStart(2)} (${tithiName.padEnd(8)}) | ${isAshtami ? 'YES' : 'NO '}     | ${nakshatraName.padEnd(17)} | ${isRohini ? 'YES' : 'NO '}    | ${bothAtSunrise ? 'YES' : 'NO '}  | ${sRes.qualified ? 'YES ***' : 'NO     '}    | ${vRes.qualified ? 'YES ***' : 'NO'}`
      );
    }
  }
}
