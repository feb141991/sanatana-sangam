/**
 * Prints disputed unresolved queue counts across 2025-2028 to verify cross-year containment.
 */
import { collectDisputedUnresolvedItems } from '../src/lib/calendar/materialize';

function main() {
  const years = [2025, 2026, 2027, 2028];
  console.log('--- DISPUTED UNRESOLVED QUEUE ITEMS AUDIT ---');

  for (const year of years) {
    const items = collectDisputedUnresolvedItems(year);
    const yoginiItems = items.filter(i => i.slug === 'yogini-ekadashi');
    console.log(`Year ${year}: Total Disputed Items = ${items.length}, Yogini Ekadashi Items = ${yoginiItems.length}`);
    for (const item of yoginiItems) {
      console.log(`   - Variant: ${item.variant_key}, Dates: ${JSON.stringify(item.candidate_dates)}, Ambiguity: ${item.ambiguity_type}`);
    }
  }
}

main();
