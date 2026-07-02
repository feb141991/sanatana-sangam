import type { PanchangData } from '@/lib/panchang';

/**
 * Strategy interface for sacred calendar calculations.
 * Allows different traditions to have entirely different calculation engines
 * while exposing a unified data structure to the UI.
 */
export interface CalendarStrategy {
  /** The human-readable name of the calendar system */
  name: string;
  
  /**
   * Calculate all sacred temporal data for a given date and location.
   * Return a structure compatible with our PanchangData, but potentially
   * localized or adjusted for the specific tradition.
   *
   * @param timezone IANA timezone string (e.g. "Europe/London"). When supplied,
   *   all time strings (sunrise, Rahu Kaal, etc.) are formatted in that timezone
   *   so diaspora users see their local timings rather than IST.
   */
  calculate(date: Date, lat: number, lon: number, timezone?: string): PanchangData;

  /**
   * Get tradition-specific labels for certain calendar elements.
   * e.g. "Masa" vs "Month" vs "Mahina"
   */
  getLabels(): {
    monthLabel: string;
    yearLabel: string;
    dayLabel: string;
  };
}
