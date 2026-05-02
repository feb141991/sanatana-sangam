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
   */
  calculate(date: Date, lat: number, lon: number): PanchangData;

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
