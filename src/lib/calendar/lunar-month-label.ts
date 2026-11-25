/**
 * lunar-month-label.ts
 *
 * The lunar month name shown to a person for an instant. Display only: it never
 * moves a date and never reads PanchangData.masaName, which is the legacy
 * solar-derived index (D1) kept byte-identical for the legacy rule path and
 * roughly two months off the lunar month.
 *
 * Conversion law (docs/calendar-profiles.md §1.2): in Śukla paksha both systems
 * give one name; in Kṛṣṇa paksha pūrṇimānta names the following month. Neither
 * is silently chosen, so a Kṛṣṇa label carries both names. The
 * engine already names a leap month "Adhika X".
 *
 * Kept free of rules.json so client components can import it; month-label-resolver
 * re-exports resolveMonthLabelForDate for profile-aware callers.
 */
import { getLunarMonth } from '@sangam/panchang-engine';

export type SupportedMonthSystem = 'amanta' | 'purnimanta';

/**
 * Resolves the month label for a specific UTC date/instant given a target month system.
 * Uses `getLunarMonth(instant, targetSystem)` to obtain the exact label for that astronomical day.
 */
export function resolveMonthLabelForDate(
  dateOrInstant: Date | string,
  targetSystem: SupportedMonthSystem
): { monthName: string; monthIndex: number; paksha: 'shukla' | 'krishna'; isAdhika: boolean } | null {
  const instant = typeof dateOrInstant === 'string'
    ? new Date(`${dateOrInstant.split('T')[0]}T12:00:00Z`)
    : dateOrInstant;

  if (isNaN(instant.getTime())) return null;

  const result = getLunarMonth(instant, targetSystem);
  if (!result || !result.ok) return null;

  return {
    monthName: result.monthName,
    monthIndex: result.monthIndex,
    paksha: result.paksha,
    isAdhika: result.isAdhika,
  };
}

export interface LunarMonthLabel {
  /** "Margashirsha", "Kartika (Amanta) / Margashirsha (Purnimanta)" or "Adhika Jyeshtha". */
  text: string;
}

/** Null when the month could not be solved: show nothing rather than a wrong name. */
export function lunarMonthLabel(instant: Date): LunarMonthLabel | null {
  const amanta = resolveMonthLabelForDate(instant, 'amanta');
  const purnimanta = resolveMonthLabelForDate(instant, 'purnimanta');
  if (!amanta || !purnimanta) return null;
  if (amanta.monthName === purnimanta.monthName) return { text: amanta.monthName };
  // The engine names the second half of a leap month after the NEXT month in the
  // pūrṇimānta system ("Adhika Ashadha" within Adhika Jyeshtha). That name is not
  // verified, so only the amānta one is shown.
  if (amanta.isAdhika) return { text: `${amanta.monthName} (Amanta)` };
  return { text: `${amanta.monthName} (Amanta) / ${purnimanta.monthName} (Purnimanta)` };
}
