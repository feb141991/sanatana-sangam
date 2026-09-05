/**
 * Reproducible ephemeris check for the Pavarana item in
 * docs/RECONCILIATION_PACKET_MANUAL_SEED_VS_RULES.md (§3).
 *
 * That item's evidence had cited TheSkyLive for the October 2027 full-moon
 * instant. TheSkyLive returns HTTP 403 to automated fetches, so the claim
 * was not independently reproducible from the linked URL alone -- flagged
 * on review. This computes the same fact using this project's own
 * elongation-based bisection (packages/panchang-engine), already the
 * authority for every other date this codebase produces, rather than
 * depending on an external site at all.
 *
 * Not a source_references row by itself -- this project's own engine is
 * not a third-party authority under source-governance.md's Tier 1-5 rubric,
 * it is the thing those tiers validate. Recorded here so the claim is
 * re-runnable and inspectable, and cited by note in the packet.
 *
 * Run: npx tsx scripts/verify-pavarana-full-moon.ts
 */
import { findFullMoonAfter } from '@sangam/panchang-engine';

const searchFrom = new Date('2027-10-01T00:00:00Z');
const fullMoon = findFullMoonAfter(searchFrom);

if (!fullMoon) {
  throw new Error('findFullMoonAfter returned null for October 2027 -- search window may need widening.');
}

console.log('October 2027 full moon (this project\'s own ephemeris, UTC):', fullMoon.toISOString());
console.log('Civil date (UTC):', fullMoon.toISOString().slice(0, 10));
