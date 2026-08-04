import { getLunarMonth } from '@sangam/panchang-engine';

function checkAdhika() {
  const years = [2026, 2027, 2028];
  console.log("Checking Adhika Masa in 2026-2028...");
  for (const year of years) {
    const numDays = (year % 4 === 0) ? 366 : 365;
    const adhikaMonths = new Set<string>();
    const details: string[] = [];
    for (let i = 0; i < numDays; i++) {
      const current = new Date(Date.UTC(year, 0, i + 1, 1, 0, 0));
      const res = getLunarMonth(current, 'amanta');
      if (res.ok && res.isAdhika) {
        const key = `${res.monthName}`;
        if (!adhikaMonths.has(key)) {
          adhikaMonths.add(key);
          details.push(`${res.monthName} (around ${current.toISOString().slice(0, 10)})`);
        }
      }
    }
    if (details.length > 0) {
      console.log(`Year ${year}: Found Adhika masa -> ${details.join(', ')}`);
    } else {
      console.log(`Year ${year}: No Adhika masa found.`);
    }
  }
}

checkAdhika();
