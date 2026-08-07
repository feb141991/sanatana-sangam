import {
  dateToJde,
  getSolarApparentLongitude,
} from '../packages/panchang-engine/src/core/astronomy-adapter.js';
import {
  lahiriAyanamsha,
  normalizeAngle,
} from '../packages/panchang-engine/src/core/astronomy.js';
import {
  findNewMoonBefore,
  findNewMoonAfter,
} from '../packages/panchang-engine/src/lunar-month/index.js';

function findNewMoonForRashi(year: number, targetRashi: number): Date {
  const midMonth = targetRashi === 11 ? 2 : 9; // 0-indexed: 2 = March, 9 = October
  const startSearch = new Date(Date.UTC(year, midMonth, 15, 12, 0, 0));
  
  const nm1 = findNewMoonBefore(startSearch);
  const nm2 = findNewMoonAfter(startSearch);
  
  const candidates = [nm1, nm2].filter((d): d is Date => d !== null);
  
  for (const date of candidates) {
    const jde = dateToJde(date);
    const t = (jde - 2451545.0) / 36525.0;
    const sunSidereal = normalizeAngle((getSolarApparentLongitude(t) * 180) / Math.PI - lahiriAyanamsha(jde));
    const rashi = Math.floor(sunSidereal / 30) % 12;
    if (rashi === targetRashi) {
      return date;
    }
  }
  
  if (nm1) {
    const nmPrev = findNewMoonBefore(new Date(nm1.getTime() - 15 * 24 * 3600 * 1000));
    if (nmPrev) {
      const jde = dateToJde(nmPrev);
      const t = (jde - 2451545.0) / 36525.0;
      const sunSidereal = normalizeAngle((getSolarApparentLongitude(t) * 180) / Math.PI - lahiriAyanamsha(jde));
      const rashi = Math.floor(sunSidereal / 30) % 12;
      if (rashi === targetRashi) return nmPrev;
    }
  }
  if (nm2) {
    const nmNext = findNewMoonAfter(new Date(nm2.getTime() + 15 * 24 * 3600 * 1000));
    if (nmNext) {
      const jde = dateToJde(nmNext);
      const t = (jde - 2451545.0) / 36525.0;
      const sunSidereal = normalizeAngle((getSolarApparentLongitude(t) * 180) / Math.PI - lahiriAyanamsha(jde));
      const rashi = Math.floor(sunSidereal / 30) % 12;
      if (rashi === targetRashi) return nmNext;
    }
  }
  
  throw new Error(`Failed to find new moon for rashi ${targetRashi} in year ${year}`);
}

const years = [2026, 2027, 2028];
console.log('### Vikram Samvat North Rollovers (Chaitra Shukla Pratipada) ###');
for (const y of years) {
  const actualDate = findNewMoonForRashi(y, 11);
  const oldHardcoded = new Date(Date.UTC(y, 3, 1, 0, 0, 0)); // April 1
  const diffMs = oldHardcoded.getTime() - actualDate.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  
  // Before and after era year verification
  // A day before the rollover
  const beforeDate = new Date(actualDate.getTime() - 24 * 60 * 60 * 1000);
  // Rollover day itself
  const afterDate = actualDate;

  // Manual evaluation of year
  const yearBefore = beforeDate >= actualDate ? y + 57 : y + 56;
  const yearAfter = afterDate >= actualDate ? y + 57 : y + 56;

  console.log(`Year ${y}:`);
  console.log(`  Actual Rollover:  ${actualDate.toISOString()}`);
  console.log(`  Old Hardcoded:    ${oldHardcoded.toISOString()}`);
  console.log(`  Discrepancy:      ${Math.abs(diffDays).toFixed(2)} days (${diffDays > 0 ? 'old rolled over late' : 'old rolled over early'})`);
  console.log(`  Year Before/After: ${yearBefore} -> ${yearAfter} VS`);
}

console.log('\n### Vikram Samvat Gujarat Rollovers (Kartika Shukla Pratipada) ###');
for (const y of years) {
  const actualDate = findNewMoonForRashi(y, 6);
  const oldHardcoded = new Date(Date.UTC(y, 3, 1, 0, 0, 0)); // April 1
  const diffMs = oldHardcoded.getTime() - actualDate.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  const beforeDate = new Date(actualDate.getTime() - 24 * 60 * 60 * 1000);
  const afterDate = actualDate;

  const yearBefore = beforeDate >= actualDate ? y + 57 : y + 56;
  const yearAfter = afterDate >= actualDate ? y + 57 : y + 56;

  console.log(`Year ${y}:`);
  console.log(`  Actual Rollover:  ${actualDate.toISOString()}`);
  console.log(`  Discrepancy:      ${Math.abs(diffDays).toFixed(2)} days`);
  console.log(`  Year Before/After: ${yearBefore} -> ${yearAfter} VS`);
}

console.log('\n### Shaka Samvat Rollovers (Chaitra 1 Solar) ###');
for (const y of years) {
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  const actualDate = new Date(Date.UTC(y, 2, isLeap ? 21 : 22, 0, 0, 0));
  
  const beforeDate = new Date(actualDate.getTime() - 24 * 60 * 60 * 1000);
  const afterDate = actualDate;

  const yearBefore = beforeDate >= actualDate ? y - 78 : y - 79;
  const yearAfter = afterDate >= actualDate ? y - 78 : y - 79;

  console.log(`Year ${y}:`);
  console.log(`  Actual Rollover:  ${actualDate.toISOString()}`);
  console.log(`  Year Before/After: ${yearBefore} -> ${yearAfter} Shaka`);
}
