/**
 * lunar-month/names.ts
 *
 * Layer B: month name tables and the sidereal rashi → amanta month mapping.
 *
 * From calendar-profiles.md §1.1:
 *   An amanta lunar month takes the name of the sidereal rashi the Sun occupies
 *   at the amavasya that begins that month.
 *
 * The table is keyed by the SIDEREAL rashi index (0 = Mesha / Aries,
 * 1 = Vrishabha / Taurus, …, 11 = Meena / Pisces) and yields the amanta
 * month index (Chaitra = 0, …, Phalguna = 11).
 *
 * Because we implement using "Sankranti containment" (§1.1 paragraph 2):
 *   The Sankranti crossing that falls inside the lunar month determines the name.
 *   rashi at the month-start amavasya ≡ the Sankranti NOT YET crossed.
 *
 * BUT: the month name derives from the Sun's sidereal rashi AT THE BEGINNING
 * AMAVASYA, i.e., Math.floor(sunSidereal / 30) % 12 at that instant.
 *
 * Rashi mapping (0-indexed from Mesha):
 *   Mesha   = 0  → Vaishakha  = 1
 *   Vrishabha = 1 → Jyeshtha  = 2
 *   Mithuna = 2  → Ashadha    = 3
 *   Karka   = 3  → Shravana   = 4
 *   Simha   = 4  → Bhadrapada = 5
 *   Kanya   = 5  → Ashwin     = 6
 *   Tula    = 6  → Kartika    = 7
 *   Vrischika = 7 → Margashirsha = 8
 *   Dhanu   = 8  → Pausha     = 9
 *   Makara  = 9  → Magha      = 10
 *   Kumbha  = 10 → Phalguna   = 11
 *   Meena   = 11 → Chaitra    = 0
 *
 * Equivalently, monthIndex = (rashiIndex + 1) % 12
 * (Meena→Chaitra wraps: (11 + 1) % 12 = 0 ✓)
 */

import { normalizeAngle } from '../core/astronomy.js';

export const MONTH_NAMES: readonly string[] = [
  'Chaitra',      // 0
  'Vaishakha',    // 1
  'Jyeshtha',     // 2
  'Ashadha',      // 3
  'Shravana',     // 4
  'Bhadrapada',   // 5
  'Ashwin',       // 6
  'Kartika',      // 7
  'Margashirsha', // 8
  'Pausha',       // 9
  'Magha',        // 10
  'Phalguna',     // 11
] as const;

/**
 * Given the Sun's sidereal longitude at the beginning amavasya, return the
 * amanta month index (0 = Chaitra … 11 = Phalguna).
 *
 * Formula: (rashiIndex + 1) % 12 where rashiIndex = floor(sunSidereal / 30).
 */
export function monthIndexFromSunSidereal(sunSidereal: number): number {
  const rashiIndex = Math.floor(normalizeAngle(sunSidereal) / 30) % 12;
  return (rashiIndex + 1) % 12;
}

/**
 * Given an amanta month index, return the next month index (wrapping at 11→0).
 * Handles adhika months: if month N has no Sankranti and takes the name of
 * month N+1, the nija month is also N+1.
 */
export function nextMonthIndex(idx: number): number {
  return (idx + 1) % 12;
}
